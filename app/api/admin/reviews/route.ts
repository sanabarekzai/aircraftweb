import {
  getAdminSessionOr403,
  internalError,
  successResponse,
} from '@/lib/api-helpers';
import { prisma } from '@/lib/prisma';

// GET /api/admin/reviews - Moderation queue (reported or hidden reviews)
export async function GET() {
  try {
    const sessionOr403 = await getAdminSessionOr403();
    if (sessionOr403 instanceof Response) return sessionOr403;

    const reviews = await prisma.review.findMany({
      where: {
        OR: [{ status: 'HIDDEN' }, { reports: { some: {} } }],
      },
      include: {
        user: {
          select: { id: true, username: true, email: true },
        },
        aircraft: {
          select: { id: true, slug: true, name: true },
        },
        reports: {
          include: {
            reporter: {
              select: { id: true, username: true },
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return successResponse({
      reviews: reviews.map((r) => ({
        id: r.id,
        content: r.content,
        status: r.status,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        user: r.user,
        aircraft: r.aircraft,
        reportCount: r.reports.length,
        reporters: r.reports.map((rep) => ({
          id: rep.reporter.id,
          username: rep.reporter.username,
          reason: rep.reason,
          createdAt: rep.createdAt,
        })),
      })),
    });
  } catch (error) {
    console.error('Admin reviews queue error:', error);
    return internalError('Failed to load moderation queue');
  }
}
