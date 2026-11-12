import { NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const postSchema = z.object({
  aircraftId: z.string().uuid('Invalid aircraft ID'),
});

export async function GET() {
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

    const favorites = await prisma.favorite.findMany({
      where: { userId: session.user.id },
      include: {
        aircraft: {
          select: { id: true, slug: true, name: true },
        },
      },
    });

    return NextResponse.json(
      {
        favorites: favorites.map((f) => ({
          ...f,
          aircraft: f.aircraft,
        })),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get favorites error:', error);
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get favorites',
        },
      },
      { status: 500 }
    );
  }
}

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
    const { aircraftId } = postSchema.parse(body);

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

    return NextResponse.json(
      {
        favorite: {
          ...favorite,
          aircraft: favorite.aircraft,
        },
      },
      { status: 201 }
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

    console.error('Add favorite error:', error);
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to add favorite',
        },
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
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

    // Check if favorite exists
    const existingFavorite = await prisma.favorite.findFirst({
      where: {
        userId: session.user.id,
        aircraftId,
      },
    });

    if (!existingFavorite) {
      return NextResponse.json(
        {
          error: {
            code: 'NOT_FOUND',
            message: 'Favorite not found',
          },
        },
        { status: 404 }
      );
    }

    await prisma.favorite.delete({
      where: { id: existingFavorite.id },
    });

    return NextResponse.json(
      { success: true },
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete favorite error:', error);
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to delete favorite',
        },
      },
      { status: 500 }
    );
  }
}
