import {
  getAdminSessionOr403,
  internalError,
  successResponse,
} from '@/lib/api-helpers';
import { prisma } from '@/lib/prisma';

// GET /api/admin/stats - Analytics dashboard data
export async function GET() {
  try {
    const sessionOr403 = await getAdminSessionOr403();
    if (sessionOr403 instanceof Response) return sessionOr403;

    const [
      usersCount,
      aircraftCount,
      bookingsCount,
      reviewsCount,
      ratingsCount,
      favoritesCount,
      flightLogsAggregate,
      bookingsByStatus,
      recentUsers,
      topAircraft,
      hiddenReviewsCount,
      reportedReviewIds,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.aircraft.count(),
      prisma.booking.count(),
      prisma.review.count(),
      prisma.rating.count(),
      prisma.favorite.count(),
      prisma.flightLog.aggregate({
        _count: { _all: true },
        _sum: { durationHours: true },
      }),
      prisma.booking.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
      prisma.user.findMany({
        select: {
          id: true,
          username: true,
          email: true,
          isAdmin: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      prisma.aircraft.findMany({
        select: {
          id: true,
          slug: true,
          name: true,
          _count: { select: { bookings: true, favorites: true, ratings: true } },
        },
        orderBy: [{ bookings: { _count: 'desc' } }, { favorites: { _count: 'desc' } }],
        take: 5,
      }),
      prisma.review.count({ where: { status: 'HIDDEN' } }),
      prisma.reviewReport.findMany({
        select: { reviewId: true },
        distinct: ['reviewId'],
      }),
    ]);

    return successResponse({
      totals: {
        users: usersCount,
        aircraft: aircraftCount,
        bookings: bookingsCount,
        reviews: reviewsCount,
        ratings: ratingsCount,
        favorites: favoritesCount,
        flightLogs: flightLogsAggregate._count._all,
        totalFlightHours: flightLogsAggregate._sum.durationHours || 0,
      },
      bookingsByStatus: bookingsByStatus.map((b) => ({
        status: b.status,
        count: b._count._all,
      })),
      moderation: {
        hiddenReviews: hiddenReviewsCount,
        reportedReviews: reportedReviewIds.length,
      },
      recentUsers,
      topAircraft: topAircraft.map((a) => ({
        id: a.id,
        slug: a.slug,
        name: a.name,
        bookings: a._count.bookings,
        favorites: a._count.favorites,
        ratings: a._count.ratings,
      })),
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return internalError('Failed to load admin stats');
  }
}
