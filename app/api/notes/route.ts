import { NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const postSchema = z.object({
  aircraftId: z.string().uuid('Invalid aircraft ID'),
  content: z.string().min(1, 'Content is required'),
});

// GET /api/notes?aircraftId=...
export async function GET(request: Request) {
  try {
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

    const { searchParams } = new URL(request.url);
    const aircraftId = searchParams.get('aircraftId');

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

    return NextResponse.json(
      {
        notes: notes.map((n) => ({
          ...n,
          aircraft: n.aircraft,
        })),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get notes error:', error);
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get notes',
        },
      },
      { status: 500 }
    );
  }
}

// POST /api/notes
export async function POST(request: Request) {
  try {
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

    const body = await request.json();
    const { aircraftId, content } = postSchema.parse(body);

    // Check if aircraft exists
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

    return NextResponse.json(
      {
        note: {
          ...note,
          aircraft: note.aircraft,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_INPUT',
            message: 'Validation failed',
            fieldErrors: error.flatten().fieldErrors,
          },
        },
        { status: 400 }
      );
    }

    console.error('Create note error:', error);
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create note',
        },
      },
      { status: 500 }
    );
  }
}
