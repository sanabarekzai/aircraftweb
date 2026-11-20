import { z, ZodError } from 'zod';
import {
  getAdminSessionOr403,
  internalError,
  successResponse,
  validationError,
  notFoundResponse,
} from '@/lib/api-helpers';
import { prisma } from '@/lib/prisma';

const patchSchema = z.object({
  status: z.enum(['PUBLISHED', 'HIDDEN']),
});

// PATCH /api/admin/reviews/[id] - Update review status (moderate)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionOr403 = await getAdminSessionOr403();
    if (sessionOr403 instanceof Response) return sessionOr403;

    const { id } = await params;
    const body = await request.json();
    const { status } = patchSchema.parse(body);

    const review = await prisma.review.findUnique({
      where: { id },
    });

    if (!review) {
      return notFoundResponse('Review');
    }

    const updated = await prisma.$transaction(async (tx) => {
      const updatedReview = await tx.review.update({
        where: { id },
        data: { status },
      });

      // Restoring a review clears its reports so it leaves the queue
      if (status === 'PUBLISHED') {
        await tx.reviewReport.deleteMany({ where: { reviewId: id } });
      }

      return updatedReview;
    });

    return successResponse({ review: updated });
  } catch (error) {
    if (error instanceof ZodError) {
      return validationError(error.flatten().fieldErrors);
    }

    console.error('Admin review moderate error:', error);
    return internalError('Failed to moderate review');
  }
}

// DELETE /api/admin/reviews/[id]
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionOr403 = await getAdminSessionOr403();
    if (sessionOr403 instanceof Response) return sessionOr403;

    const { id } = await params;

    const review = await prisma.review.findUnique({
      where: { id },
    });

    if (!review) {
      return notFoundResponse('Review');
    }

    await prisma.review.delete({ where: { id } });

    return successResponse({ success: true });
  } catch (error) {
    console.error('Admin review delete error:', error);
    return internalError('Failed to delete review');
  }
}
