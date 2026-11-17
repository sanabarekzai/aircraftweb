import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/session';
import { getIronSession } from 'iron-session';
import { prisma } from '@/lib/prisma';
import { z, ZodError } from 'zod';
import {
  getSessionOr401,
  checkAircraftExists,
  internalError,
  successResponse,
  validationError,
} from '@/lib/api-helpers';

const postSchema = z.object({
  aircraftId: z.string().uuid('Invalid aircraft ID'),
  content: z.string().min(1, 'Content is required'),
});

// GET /api/notes?aircraftId=...
export async function GET(request: Request) {
  try {
    const sessionOr401 = await getSessionOr401();
    if (sessionOr401 instanceof NextResponse) return sessionOr401;
    
    const session = sessionOr401 as { user: SessionData['user'] };
    const { searchParams } = new URL(request.url);
    const aircraftId = searchParams.get('aircraftId');

    // If aircraftId is provided, verify it exists
    if (aircraftId) {
      const aircraftCheck = await checkAircraftExists(aircraftId);
      if (aircraftCheck instanceof NextResponse) return aircraftCheck;
    }

    const notes = await prisma.personalNote.findMany({
      where: {
        userId: session.user.id,
        ...(aircraftId && { aircraftId }),
      },
      include: {
        aircraft: {
          select: { id: true, slug: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return successResponse({
      notes: notes.map((n) => ({
        ...n,
        aircraft: n.aircraft,
      })),
    });
  } catch (error) {
    console.error('Get notes error:', error);
    return internalError('Failed to get notes');
  }
}

// POST /api/notes
export async function POST(request: Request) {
  try {
    const sessionOr401 = await getSessionOr401();
    if (sessionOr401 instanceof NextResponse) return sessionOr401;
    
    const session = sessionOr401 as { user: SessionData['user'] };
    const body = await request.json();
    const { aircraftId, content } = postSchema.parse(body);

    // Check if aircraft exists
    const aircraftCheck = await checkAircraftExists(aircraftId);
    if (aircraftCheck instanceof NextResponse) return aircraftCheck;

    const note = await prisma.personalNote.create({
      data: {
        userId: session.user.id,
        aircraftId,
        content,
      },
      include: {
        aircraft: {
          select: { id: true, slug: true, name: true },
        },
      },
    });

    return successResponse(
      {
        note: {
          ...note,
          aircraft: note.aircraft,
        },
      },
      201
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return validationError(error.flatten().fieldErrors);
    }

    console.error('Create note error:', error);
    return internalError('Failed to create note');
  }
}
