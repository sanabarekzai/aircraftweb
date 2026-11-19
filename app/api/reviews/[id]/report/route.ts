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
} from '@/lib/api-helpers';

const reportSchema = z.object({
  reason: z
    .string()
    .min(1, 'Reason is required')
    .max(500, 'Reason must be 500 characters or fewer'),
});

const AUTO_HIDE_THRESHOLD = 3;

// POST /api/reviews/[id]/report - Report a review for moderation
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionOr401 = await getSessionOr401();
    if (sessionOr401 instanceof NextResponse) return sessionOr401;

    const session = sessionOr401 as { user: NonNullable<SessionData['user']> };

    const { id } = await params;
    const body = await request.json();
    const { reason } = reportSchema.parse(body);

    const review = await prisma.review.findUnique({
      where: { id },
    });

    if (!review || review.status !== 'PUBLISHED') {
      return notFoundResponse('Review');
    }

    if (review.userId === session.user.id) {
      return NextResponse.json(
        {
          error: {
            code: 'FORBIDDEN',
            message: 'You cannot report your own review',
          },
        },
        { status: 403 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const existingReport = await tx.reviewReport.findUnique({
        where: { reviewId_userId: { reviewId: id, userId: session.user.id } },
        select: { id: true },
      });

      if (existingReport) {
        return { alreadyReported: true as const, hidden: review.status === 'HIDDEN' };
      }

      await tx.reviewReport.create({
        data: {
          reviewId: id,
          userId: session.user.id,
          reason,
        },
      });

      const reportCount = await tx.reviewReport.count({
        where: { reviewId: id },
      });

      const shouldHide = reportCount >= AUTO_HIDE_THRESHOLD;

      const updated = await tx.review.update({
        where: { id },
        data: {
          ...(shouldHide && { status: 'HIDDEN' }),
        },
        select: { status: true },
      });

      return { alreadyReported: false as const, hidden: updated.status === 'HIDDEN' };
    });

    return successResponse(result);
  } catch (error) {
    if (error instanceof ZodError) {
      return validationError(error.flatten().fieldErrors);
    }

    console.error('Report review error:', error);
    return internalError('Failed to report review');
  }
}
