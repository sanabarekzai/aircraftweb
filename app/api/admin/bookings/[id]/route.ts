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
  status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED']),
});

// PATCH /api/admin/bookings/[id] - Update booking status
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

    const booking = await prisma.booking.findUnique({
      where: { id },
    });

    if (!booking) {
      return notFoundResponse('Booking');
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: { status },
      include: {
        user: {
          select: { id: true, username: true, email: true },
        },
        aircraft: {
          select: {
            id: true,
            slug: true,
            name: true,
          },
        },
      },
    });

    return successResponse({ booking: updated });
  } catch (error) {
    if (error instanceof ZodError) {
      return validationError(error.flatten().fieldErrors);
    }

    console.error('Admin booking update error:', error);
    return internalError('Failed to update booking');
  }
}

// DELETE /api/admin/bookings/[id]
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionOr403 = await getAdminSessionOr403();
    if (sessionOr403 instanceof Response) return sessionOr403;

    const { id } = await params;

    const booking = await prisma.booking.findUnique({
      where: { id },
    });

    if (!booking) {
      return notFoundResponse('Booking');
    }

    await prisma.booking.delete({ where: { id } });

    return successResponse({ success: true });
  } catch (error) {
    console.error('Admin booking delete error:', error);
    return internalError('Failed to delete booking');
  }
}
