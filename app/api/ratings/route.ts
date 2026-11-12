import { NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const postSchema = z.object({
  aircraftId: z.string().uuid('Invalid aircraft ID'),
  stars: z.number().int().min(1).max(5, 'Rating must be between 1 and 5'),
});

// GET /api/ratings?aircraftId=...
export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions);

    if (!session.user) {
      return NextResponse.json(
        {
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const aircraftId = searchParams.get('aircraftId');

    if (!aircraftId) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_INPUT',
            message: 'aircraftId is required',
          },
        },
        { status: 400 }
      );
    }

    // Check if aircraft exists
    const aircraft = await prisma.aircraft.findUnique({
      where: { id: aircraftId },
    });

    if (!aircraft) {
      return NextResponse.json(
        {
          error: {
            code: 'NOT_FOUND',
            message: 'Aircraft not found',
          },
        },
        { status: 404 }
      );
    }

    // Get user's rating for this aircraft
    const rating = await prisma.rating.findFirst({
      where: {
        userId: session.user.id,
        aircraftId,
      },
    });

    return NextResponse.json(
      {
        userRating: rating,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get rating error:', error);
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get rating',
        },
      },
      { status: 500 }
    );
  }
}

// POST /api/ratings - upsert
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions);

    if (!session.user) {
      return NextResponse.json(
        {
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { aircraftId, stars } = postSchema.parse(body);

    // Check if aircraft exists
    const aircraft = await prisma.aircraft.findUnique({
      where: { id: aircraftId },
    });

    if (!aircraft) {
      return NextResponse.json(
        {
          error: {
            code: 'NOT_FOUND',
            message: 'Aircraft not found',
          },
        },
        { status: 404 }
      );
    }

    // Upsert rating
    const rating = await prisma.rating.upsert({
      where: {
        userId_aircraftId: {
          userId: session.user.id,
          aircraftId,
        },
      },
      update: {
        stars,
      },
      create: {
        userId: session.user.id,
        aircraftId,
        stars,
      },
    });

    // Calculate new average rating
    const allRatings = await prisma.rating.findMany({
      where: { aircraftId },
    });
    const newAverage = allRatings.length > 0
      ? allRatings.reduce((sum, r) => sum + r.stars, 0) / allRatings.length
      : 0;

    return NextResponse.json(
      {
        rating,
        newAverage: Math.round(newAverage * 10) / 10,
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_INPUT',
            message: 'Validation failed',
            fieldErrors: error.flatten().fieldErrors,
          },
        },
        { status: 400 }
      );
    }

    console.error('Rate error:', error);
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to rate aircraft',
        },
      },
      { status: 500 }
    );
  }
}
