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
});

export async function GET() {
  try {
    const sessionOr401 = await getSessionOr401();
    if (sessionOr401 instanceof NextResponse) return sessionOr401;
    
    const session = sessionOr401 as { user: SessionData['user'] };

    const favorites = await prisma.favorite.findMany({
      where: { userId: session.user.id },
      include: {
        aircraft: {
          select: { id: true, slug: true, name: true },
        },
      },
    });

    return successResponse({
      favorites: favorites.map((f) => ({
        ...f,
        aircraft: f.aircraft,
      })),
    });
  } catch (error) {
    console.error('Get favorites error:', error);
    return internalError('Failed to get favorites');
  }
}

export async function POST(request: Request) {
  try {
    const sessionOr401 = await getSessionOr401();
    if (sessionOr401 instanceof NextResponse) return sessionOr401;
    
    const session = sessionOr401 as { user: SessionData['user'] };
    const body = await request.json();
    const { aircraftId } = postSchema.parse(body);

    // Check if aircraft exists
    const aircraftCheck = await checkAircraftExists(aircraftId);
    if (aircraftCheck instanceof NextResponse) return aircraftCheck;

    // Check if already favorited
    const existingFavorite = await prisma.favorite.findFirst({
      where: {
        userId: session.user.id,
        aircraftId,
      },
    });

    if (existingFavorite) {
      return NextResponse.json(
        {
          error: {
            code: 'CONFLICT',
            message: 'Already favorited',
          },
        },
        { status: 409 }
      );
    }

    const favorite = await prisma.favorite.create({
      data: {
        userId: session.user.id,
        aircraftId,
      },
      include: {
        aircraft: {
          select: { id: true, slug: true, name: true },
        },
      },
    });

    return successResponse(
      {
        favorite: {
          ...favorite,
          aircraft: favorite.aircraft,
        },
      },
      201
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return validationError(error.flatten().fieldErrors);
    }

    console.error('Add favorite error:', error);
    return internalError('Failed to add favorite');
  }
}

export async function DELETE(request: Request) {
  try {
    const sessionOr401 = await getSessionOr401();
    if (sessionOr401 instanceof NextResponse) return sessionOr401;
    
    const session = sessionOr401 as { user: SessionData['user'] };
    const { searchParams } = new URL(request.url);
    const aircraftId = searchParams.get('aircraftId');

    if (!aircraftId) {
      return validationError({ aircraftId: ['aircraftId is required'] });
    }

    // Check if favorite exists
    const existingFavorite = await prisma.favorite.findFirst({
      where: {
        userId: session.user.id,
        aircraftId,
      },
    });

    if (!existingFavorite) {
      return notFoundResponse('Favorite');
    }

    await prisma.favorite.delete({
      where: { id: existingFavorite.id },
    });

    return successResponse({ success: true });
  } catch (error) {
    console.error('Delete favorite error:', error);
    return internalError('Failed to delete favorite');
  }
}
