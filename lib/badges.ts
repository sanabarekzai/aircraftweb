import { prisma } from '@/lib/prisma';

export interface BadgeDefinition {
  key: string;
  name: string;
  description: string;
  icon: string;
  tier: 'BRONZE' | 'SILVER' | 'GOLD';
}

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    key: 'FIRST_FLIGHT',
    name: 'First Flight',
    description: 'Logged your first flight',
    icon: '🛫',
    tier: 'BRONZE',
  },
  {
    key: 'FREQUENT_FLYER',
    name: 'Frequent Flyer',
    description: 'Logged 10 flights',
    icon: '✈️',
    tier: 'SILVER',
  },
  {
    key: 'AVIATION_ADDICT',
    name: 'Aviation Addict',
    description: 'Logged 50 flights',
    icon: '🚀',
    tier: 'GOLD',
  },
  {
    key: 'CENTURY_PILOT',
    name: 'Century Pilot',
    description: 'Logged 100 total flight hours',
    icon: '⏱️',
    tier: 'GOLD',
  },
  {
    key: 'DEBUT_CRITIC',
    name: 'Debut Critic',
    description: 'Rated your first aircraft',
    icon: '⭐',
    tier: 'BRONZE',
  },
  {
    key: 'EXPLORER',
    name: 'Explorer',
    description: 'Rated 5 different aircraft',
    icon: '🧭',
    tier: 'SILVER',
  },
  {
    key: 'WORDSMITH',
    name: 'Wordsmith',
    description: 'Wrote your first review',
    icon: '📝',
    tier: 'BRONZE',
  },
  {
    key: 'SQUADRON_VOICE',
    name: 'Squadron Voice',
    description: 'Wrote 5 reviews',
    icon: '📣',
    tier: 'SILVER',
  },
  {
    key: 'CURATOR',
    name: 'Curator',
    description: 'Favorited your first aircraft',
    icon: '❤️',
    tier: 'BRONZE',
  },
  {
    key: 'HANGAR_OWNER',
    name: 'Hangar Owner',
    description: 'Favorited 5 aircraft',
    icon: '🏆',
    tier: 'SILVER',
  },
  {
    key: 'WHEELS_UP',
    name: 'Wheels Up',
    description: 'Made your first booking',
    icon: '🎫',
    tier: 'BRONZE',
  },
  {
    key: 'JET_SETTER',
    name: 'Jet Setter',
    description: 'Made 5 bookings',
    icon: '🌐',
    tier: 'SILVER',
  },
];

// Badge keys → earned via subsequent evaluation only. Deletions can
// never strip a badge: once earned, it stays earned.
export async function evaluateUserBadges(userId: string) {
  const badges = await prisma.badge.findMany({
    select: { id: true, key: true },
  });
  if (badges.length === 0) return [];

  const [flightLogStats, distinctRatedAircraft, reviewsCount, favoritesCount, bookingsCount] =
    await Promise.all([
      prisma.flightLog.aggregate({
        where: { userId },
        _count: { _all: true },
        _sum: { durationHours: true },
      }),
      prisma.rating.findMany({
        where: { userId },
        select: { aircraftId: true },
        distinct: ['aircraftId'],
      }),
      prisma.review.count({ where: { userId } }),
      prisma.favorite.count({ where: { userId } }),
      prisma.booking.count({ where: { userId } }),
    ]);

  const flightLogs = flightLogStats._count._all;
  const totalHours = flightLogStats._sum.durationHours || 0;
  const distinctRatings = distinctRatedAircraft.length;

  const earnedKeys = new Set<string>();
  if (flightLogs >= 1) earnedKeys.add('FIRST_FLIGHT');
  if (flightLogs >= 10) earnedKeys.add('FREQUENT_FLYER');
  if (flightLogs >= 50) earnedKeys.add('AVIATION_ADDICT');
  if (totalHours >= 100) earnedKeys.add('CENTURY_PILOT');
  if (distinctRatings >= 1) earnedKeys.add('DEBUT_CRITIC');
  if (distinctRatings >= 5) earnedKeys.add('EXPLORER');
  if (reviewsCount >= 1) earnedKeys.add('WORDSMITH');
  if (reviewsCount >= 5) earnedKeys.add('SQUADRON_VOICE');
  if (favoritesCount >= 1) earnedKeys.add('CURATOR');
  if (favoritesCount >= 5) earnedKeys.add('HANGAR_OWNER');
  if (bookingsCount >= 1) earnedKeys.add('WHEELS_UP');
  if (bookingsCount >= 5) earnedKeys.add('JET_SETTER');

  const owned = await prisma.userBadge.findMany({
    where: { userId },
    select: { badgeId: true },
  });
  const ownedIds = new Set(owned.map((o) => o.badgeId));

  const toAward = badges.filter(
    (badge) => earnedKeys.has(badge.key) && !ownedIds.has(badge.id)
  );

  if (toAward.length === 0) return [];

  await prisma.userBadge.createMany({
    data: toAward.map((badge) => ({ userId, badgeId: badge.id })),
    skipDuplicates: true,
  });

  return toAward.map((badge) => ({
    key: badge.key,
    name: BADGE_DEFINITIONS.find((def) => def.key === badge.key)?.name ?? badge.key,
    icon: BADGE_DEFINITIONS.find((def) => def.key === badge.key)?.icon ?? '🎖️',
  }));
}
