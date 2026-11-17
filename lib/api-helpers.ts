import { NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from './session';
import { prisma } from './prisma';
import { z, ZodError } from 'zod';

/**
 * Get authenticated session or return 401
 */
export async function getSessionOr401() {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
  
  if (!session.user) {
    return NextResponse.json(
      {
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      },
      { status: 401 }
    );
  }
  
  return session;
}

/**
 * Check if aircraft exists, return 404 if not
 */
export async function checkAircraftExists(aircraftId: string) {
  const aircraft = await prisma.aircraft.findUnique({
    where: { id: aircraftId },
  });
  
  if (!aircraft) {
    return NextResponse.json(
      {
        error: {
          code: 'NOT_FOUND',
          message: 'Aircraft not found',
        },
      },
      { status: 404 }
    );
  }
  
  return aircraft;
}

/**
 * Standard error response for validation failures
 */
export function validationError(fieldErrors: Record<string, string[]>) {
  return NextResponse.json(
    {
      error: {
        code: 'INVALID_INPUT',
        message: 'Validation failed',
        fieldErrors,
      },
    },
    { status: 400 }
  );
}

/**
 * Standard error response for internal errors
 */
export function internalError(message: string = 'Internal server error') {
  return NextResponse.json(
    {
      error: {
        code: 'INTERNAL_ERROR',
        message,
      },
    },
    { status: 500 }
  );
}

/**
 * Standard success response
 */
export function successResponse<T>(data: T, status: number = 200) {
  return NextResponse.json(data, { status });
}

/**
 * Verify resource ownership
 */
export function verifyOwnership(
  resource: { userId: string } | null,
  userId: string
): resource is { userId: string } {
  return resource !== null && resource.userId === userId;
}

/**
 * Not found response
 */
export function notFoundResponse(resourceType: string = 'Resource') {
  return NextResponse.json(
    {
      error: {
        code: 'NOT_FOUND',
        message: `${resourceType} not found`,
      },
    },
    { status: 404 }
  );
}

/**
 * Get authenticated user ID or return 401
 */
export async function getUserIdOr401() {
  const session = await getSessionOr401();
  if (session instanceof NextResponse) {
    return session;
  }
  return session.user.id;
}

/**
 * Helper to parse and validate request body
 */
export async function parseBody<T>(request: Request, schema: z.ZodSchema<T>) {
  try {
    const body = await request.json();
    return schema.parse(body);
  } catch (error) {
    if (error instanceof ZodError) {
      throw validationError(error.flatten().fieldErrors);
    }
    throw error;
  }
}
