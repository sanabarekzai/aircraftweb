import { NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { evaluateUserBadges } from '@/lib/badges';
import { z, ZodError } from 'zod';
import {
  getSessionOr401,
  internalError,
  successResponse,
  validationError,
  notFoundResponse,
} from '@/lib/api-helpers';

const createSchema = z.object({
  aircraftId: z.string().uuid('Invalid aircraft ID'),
  content: z
    .string()
    .min(1, 'Review content is required')
    .max(2000, 'Review must be 2000 characters or fewer'),
});

function serializeReview(review: {
  id: string;
  userId: string;
  aircraftId: string;
  content: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  user: { id: string; username: string };
}) {
  return {
    id: review.id,
    userId: review.userId,
    aircraftId: review.aircraftId,
    content: review.content,
    status: review.status,
    createdAt: review.createdAt,
    updatedAt: review.updatedAt,
    username: review.user.username,
  };
}

// GET /api/reviews?aircraftId=... - Public list of published reviews
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const aircraftId = searchParams.get('aircraftId');

    if (!aircraftId) {
      return validationError({ aircraftId: ['aircraftId is required'] });
    }

    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
    const viewerId = session.user?.id;

    const reviews = await prisma.review.findMany({
      where: {
        aircraftId,
        OR: [{ status: 'PUBLISHED' }, ...(viewerId ? [{ userId: viewerId }] : [])],
      },
      include: {
        user: {
          select: { id: true, username: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return successResponse({ reviews: reviews.map(serializeReview) });
  } catch (error) {
    console.error('Get reviews error:', error);
    return internalError('Failed to get reviews');
  }
}

// POST /api/reviews - Create a review (one per user per aircraft)
export async function POST(request: Request) {
  try {
    const sessionOr401 = await getSessionOr401();
    if (sessionOr401 instanceof NextResponse) return sessionOr401;

    const session = sessionOr401 as { user: NonNullable<SessionData['user']> };

    const body = await request.json();
    const { aircraftId, content } = createSchema.parse(body);

    const aircraft = await prisma.aircraft.findUnique({
      where: { id: aircraftId },
      select: { id: true },
    });

    if (!aircraft) {
      return notFoundResponse('Aircraft');
    }

    const existing = await prisma.review.findUnique({
      where: { userId_aircraftId: { userId: session.user.id, aircraftId } },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json(
        {
          error: {
            code: 'REVIEW_EXISTS',
            message: 'You have already reviewed this aircraft. Edit your existing review instead.',
          },
        },
        { status: 409 }
      );
    }

    const review = await prisma.review.create({
      data: {
        userId: session.user.id,
        aircraftId,
        content,
      },
      include: {
        user: {
          select: { id: true, username: true },
        },
      },
    });

    const badgesGranted = await evaluateUserBadges(session.user.id);

    return successResponse({ review: serializeReview(review), badgesGranted }, 201);
  } catch (error) {
    if (error instanceof ZodError) {
      return validationError(error.flatten().fieldErrors);
    }

    console.error('Create review error:', error);
    return internalError('Failed to create review');
  }
}
