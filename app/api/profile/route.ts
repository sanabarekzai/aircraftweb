import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { sessionOptions, SessionData } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { internalError, getSessionOr401 } from '@/lib/api-helpers';
import { evaluateUserBadges } from '@/lib/badges';

// GET /api/profile - Get user profile data
export async function GET() {
  try {
    const sessionOr401 = await getSessionOr401();
    if (sessionOr401 instanceof NextResponse) return sessionOr401;
    
    const session = sessionOr401 as { user: NonNullable<SessionData['user']> };

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
    const [favoritesCount, flightLogsResult, allBadges, earnedBadges] = await Promise.all([
      prisma.favorite.count({
        where: { userId: session.user.id },
      }),
      prisma.flightLog.aggregate({
        where: { userId: session.user.id },
        _count: { _all: true },
        _sum: { durationHours: true },
      }),
      prisma.badge.findMany({
        orderBy: [{ tier: 'asc' }, { name: 'asc' }],
      }),
      prisma.userBadge.findMany({
        where: { userId: session.user.id },
        select: { badgeId: true, earnedAt: true },
      }),
    ]);

    // Refresh achievements based on current activity
    await evaluateUserBadges(session.user.id);

    const totalFlightHours = flightLogsResult._sum.durationHours || 0;
    const flightLogsCount = flightLogsResult._count._all || 0;

    const earnedMap = new Map(earnedBadges.map((eb) => [eb.badgeId, eb.earnedAt]));

    return NextResponse.json({
      profile: {
        username: user.username,
        email: user.email,
        joinedAt: user.createdAt.toISOString(),
        totalFlightHours,
        favoriteAircraftCount: favoritesCount,
        flightLogsCount,
      },
      badges: allBadges.map((badge) => ({
        key: badge.key,
        name: badge.name,
        description: badge.description,
        icon: badge.icon,
        tier: badge.tier,
        earned: earnedMap.has(badge.id),
        earnedAt: earnedMap.get(badge.id)?.toISOString() ?? null,
      })),
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    return internalError('Failed to fetch profile');
  }
}
