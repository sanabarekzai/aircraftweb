import { NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, type SessionData } from './session';
import { prisma } from './prisma';

export async function getSessionOr401() {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.user) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, { status: 401 });
  }
  return session as typeof session & { user: NonNullable<SessionData['user']> };
}

// Returns a NextResponse (401/403) or the session; isAdmin is re-checked
// against the database on every call so promotions/revocations take effect
// without waiting for the session cookie to expire.
export async function getAdminSessionOr403() {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.user) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isAdmin: true },
  });

  if (!user?.isAdmin) {
    return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Admin access required' } }, { status: 403 });
  }

  return session as typeof session & { user: NonNullable<SessionData['user']> };
}

export function internalError(message = 'Internal server error') {
  return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message } }, { status: 500 });
}

export function validationError(fieldErrors: Record<string, string[] | undefined>) {
  return NextResponse.json({ error: { code: 'INVALID_INPUT', message: 'Validation failed', fieldErrors } }, { status: 400 });
}

export function successResponse<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function notFoundResponse(resourceType = 'Resource') {
  return NextResponse.json(
    { error: { code: 'NOT_FOUND', message: `${resourceType} not found` } },
    { status: 404 }
  );
}

export function verifyOwnership<T extends { userId: string }>(
  resource: T | null,
  userId: string
): resource is T {
  return resource !== null && resource.userId === userId;
}
