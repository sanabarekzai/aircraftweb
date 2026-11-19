import { NextResponse } from 'next/server';
import { SessionData } from '@/lib/session';
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

const updateSchema = z.object({
  content: z
    .string()
    .min(1, 'Review content is required')
    .max(2000, 'Review must be 2000 characters or fewer'),
});

// PUT /api/reviews/[id]
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionOr401 = await getSessionOr401();
    if (sessionOr401 instanceof NextResponse) return sessionOr401;

    const session = sessionOr401 as { user: NonNullable<SessionData['user']> };

    const { id } = await params;
    const body = await request.json();
    const { content } = updateSchema.parse(body);

    const review = await prisma.review.findUnique({
      where: { id },
    });

    if (!verifyOwnership(review, session.user.id)) {
      return notFoundResponse('Review');
    }

    const updated = await prisma.review.update({
      where: { id },
      data: {
        content,
        updatedAt: new Date(),
      },
      include: {
        user: {
          select: { id: true, username: true },
        },
      },
    });

    return successResponse({
      review: {
        id: updated.id,
        userId: updated.userId,
        aircraftId: updated.aircraftId,
        content: updated.content,
        status: updated.status,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
        username: updated.user.username,
      },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return validationError(error.flatten().fieldErrors);
    }

    console.error('Update review error:', error);
    return internalError('Failed to update review');
  }
}

// DELETE /api/reviews/[id]
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionOr401 = await getSessionOr401();
    if (sessionOr401 instanceof NextResponse) return sessionOr401;

    const session = sessionOr401 as { user: NonNullable<SessionData['user']> };

    const { id } = await params;

    const review = await prisma.review.findUnique({
      where: { id },
    });

    if (!verifyOwnership(review, session.user.id)) {
      return notFoundResponse('Review');
    }

    await prisma.review.delete({
      where: { id },
    });

    return successResponse({ success: true });
  } catch (error) {
    console.error('Delete review error:', error);
    return internalError('Failed to delete review');
  }
}
