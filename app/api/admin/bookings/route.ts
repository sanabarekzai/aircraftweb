import {
  getAdminSessionOr403,
  internalError,
  successResponse,
} from '@/lib/api-helpers';
import { prisma } from '@/lib/prisma';

const BOOKING_STATUSES = ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'] as const;

// GET /api/admin/bookings - All bookings with optional status filter
export async function GET(request: Request) {
  try {
    const sessionOr403 = await getAdminSessionOr403();
    if (sessionOr403 instanceof Response) return sessionOr403;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    if (status && !BOOKING_STATUSES.includes(status as (typeof BOOKING_STATUSES)[number])) {
      return successResponse({ bookings: [] });
    }

    const bookings = await prisma.booking.findMany({
      where: status ? { status } : undefined,
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
      orderBy: { createdAt: 'desc' },
    });

    return successResponse({ bookings });
  } catch (error) {
    console.error('Admin bookings list error:', error);
    return internalError('Failed to list bookings');
  }
}
