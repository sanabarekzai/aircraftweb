import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { internalError, getSessionOr401 } from '@/lib/api-helpers';

// GET /api/profile - Get user profile data
export async function GET() {
  try {
    const sessionOr401 = await getSessionOr401();
    if (sessionOr401 instanceof NextResponse) return sessionOr401;
    
    const session = sessionOr401;

    // Get user data
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        username: true,
        email: true,
        createdAt: true,
      },
    });

    if (!user) {
      return internalError('User not found');
    }

    // Get statistics
    const [favoritesCount, flightLogsResult] = await Promise.all([
      prisma.favorite.count({
        where: { userId: session.user.id },
      }),
      prisma.flightLog.aggregate({
        where: { userId: session.user.id },
        _count: { _all: true },
        _sum: { durationHours: true },
      }),
    ]);

    const totalFlightHours = flightLogsResult._sum.durationHours || 0;
    const flightLogsCount = flightLogsResult._count._all || 0;

    return NextResponse.json({
      profile: {
        username: user.username,
        email: user.email,
        joinedAt: user.createdAt.toISOString(),
        totalFlightHours,
        favoriteAircraftCount: favoritesCount,
        flightLogsCount,
      },
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    return internalError('Failed to fetch profile');
  }
}
