import {
  getAdminSessionOr403,
  internalError,
  successResponse,
} from '@/lib/api-helpers';
import { prisma } from '@/lib/prisma';

// GET /api/admin/users - List users with activity counts
export async function GET(request: Request) {
  try {
    const sessionOr403 = await getAdminSessionOr403();
    if (sessionOr403 instanceof Response) return sessionOr403;

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    const userFilter = query
      ? {
          OR: [
            { username: { contains: query, mode: 'insensitive' as const } },
            { email: { contains: query, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const users = await prisma.user.findMany({
      where: userFilter,
      select: {
        id: true,
        username: true,
        email: true,
        isAdmin: true,
        createdAt: true,
        _count: {
          select: {
            favorites: true,
            ratings: true,
            personalNotes: true,
            flightLogs: true,
            bookings: true,
            reviews: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return successResponse({ users });
  } catch (error) {
    console.error('Admin users list error:', error);
    return internalError('Failed to list users');
  }
}
