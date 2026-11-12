import { NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const putSchema = z.object({
  content: z.string().min(1, 'Content is required'),
});

// PUT /api/notes/[id]
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const body = await request.json();
    const { content } = putSchema.parse(body);

    // Find note and verify ownership
    const note = await prisma.personalNote.findUnique({
      where: { id },
    });

    if (!note) {
      return NextResponse.json(
        {
          error: {
            code: 'NOT_FOUND',
            message: 'Note not found',
          },
        },
        { status: 404 }
      );
    }

    // Verify ownership
    if (note.userId !== session.user.id) {
      return NextResponse.json(
        {
          error: {
            code: 'NOT_FOUND',
            message: 'Note not found',
          },
        },
        { status: 404 }
      );
    }

    const updatedNote = await prisma.personalNote.update({
      where: { id },
      data: {
        content,
        updatedAt: new Date(),
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
          ...updatedNote,
          aircraft: updatedNote.aircraft,
        },
      },
      { status: 200 }
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

    console.error('Update note error:', error);
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update note',
        },
      },
      { status: 500 }
    );
  }
}

// DELETE /api/notes/[id]
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    // Find note and verify ownership
    const note = await prisma.personalNote.findUnique({
      where: { id },
    });

    if (!note) {
      return NextResponse.json(
        {
          error: {
            code: 'NOT_FOUND',
            message: 'Note not found',
          },
        },
        { status: 404 }
      );
    }

    // Verify ownership - if note is owned by another user, return 404
    if (note.userId !== session.user.id) {
      return NextResponse.json(
        {
          error: {
            code: 'NOT_FOUND',
            message: 'Note not found',
          },
        },
        { status: 404 }
      );
    }

    await prisma.personalNote.delete({
      where: { id },
    });

    return NextResponse.json(
      { success: true },
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete note error:', error);
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to delete note',
        },
      },
      { status: 500 }
    );
  }
}
