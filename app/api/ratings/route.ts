import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/session';
import { getIronSession } from 'iron-session';
import { prisma } from '@/lib/prisma';
import { z, ZodError } from 'zod';
import {
  getSessionOr401,
  checkAircraftExists,
  internalError,
  successResponse,
  validationError,
  notFoundResponse,
} from '@/lib/api-helpers';

const postSchema = z.object({
  aircraftId: z.string().uuid('Invalid aircraft ID'),
  stars: z.number().int().min(1).max(5, 'Rating must be between 1 and 5'),
});

// GET /api/ratings?aircraftId=...
export async function GET(request: Request) {
  try {
    const sessionOr401 = await getSessionOr401();
    if (sessionOr401 instanceof NextResponse) return sessionOr401;
    
    const session = sessionOr401 as { user: SessionData['user'] };
    const { searchParams } = new URL(request.url);
    const aircraftId = searchParams.get('aircraftId');

    if (!aircraftId) {
      return validationError({ aircraftId: ['aircraftId is required'] });
    }

    // Check if aircraft exists
    const aircraftCheck = await checkAircraftExists(aircraftId);
    if (aircraftCheck instanceof NextResponse) return aircraftCheck;

    // Get user's rating for this aircraft
    const rating = await prisma.rating.findFirst({
      where: {
        userId: session.user.id,
        aircraftId,
      },
    });

    return successResponse({ userRating: rating });
  } catch (error) {
    console.error('Get rating error:', error);
    return internalError('Failed to get rating');
  }
}

// POST /api/ratings - upsert
export async function POST(request: Request) {
  try {
    const sessionOr401 = await getSessionOr401();
    if (sessionOr401 instanceof NextResponse) return sessionOr401;
    
    const session = sessionOr401 as { user: SessionData['user'] };
    const body = await request.json();
    const { aircraftId, stars } = postSchema.parse(body);

    // Check if aircraft exists
    const aircraftCheck = await checkAircraftExists(aircraftId);
    if (aircraftCheck instanceof NextResponse) return aircraftCheck;

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

    return successResponse({
      rating,
      newAverage: Math.round(newAverage * 10) / 10,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return validationError(error.flatten().fieldErrors);
    }

    console.error('Rate error:', error);
    return internalError('Failed to rate aircraft');
  }
}
