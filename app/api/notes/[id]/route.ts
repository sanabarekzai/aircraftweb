import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/session';
import { getIronSession } from 'iron-session';
import { prisma } from '@/lib/prisma';
import { z, ZodError } from 'zod';
import {
  getSessionOr401,
  internalError,
  successResponse,
  validationError,
  notFoundResponse,
  verifyOwnership,
} from '@/lib/api-helpers';

const putSchema = z.object({
  content: z.string().min(1, 'Content is required'),
});

// PUT /api/notes/[id]
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionOr401 = await getSessionOr401();
    if (sessionOr401 instanceof NextResponse) return sessionOr401;
    
    const session = sessionOr401 as { user: SessionData['user'] };
    const { id } = await params;
    const body = await request.json();
    const { content } = putSchema.parse(body);

    // Find note and verify ownership
    const note = await prisma.personalNote.findUnique({
      where: { id },
    });

    if (!note) {
      return notFoundResponse('Note');
    }

    // Verify ownership
    if (!verifyOwnership(note, session.user.id)) {
      return notFoundResponse('Note');
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

    return successResponse({
      note: {
        ...updatedNote,
        aircraft: updatedNote.aircraft,
      },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return validationError(error.flatten().fieldErrors);
    }

    console.error('Update note error:', error);
    return internalError('Failed to update note');
  }
}

// DELETE /api/notes/[id]
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionOr401 = await getSessionOr401();
    if (sessionOr401 instanceof NextResponse) return sessionOr401;
    
    const session = sessionOr401 as { user: SessionData['user'] };
    const { id } = await params;

    // Find note and verify ownership
    const note = await prisma.personalNote.findUnique({
      where: { id },
    });

    if (!note) {
      return notFoundResponse('Note');
    }

    // Verify ownership - if note is owned by another user, return 404
    if (!verifyOwnership(note, session.user.id)) {
      return notFoundResponse('Note');
    }

    await prisma.personalNote.delete({
      where: { id },
    });

    return successResponse({ success: true });
  } catch (error) {
    console.error('Delete note error:', error);
    return internalError('Failed to delete note');
  }
}
