import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // Find aircraft by slug with all relations
    const aircraft = await prisma.aircraft.findUnique({
      where: { slug },
      include: {
        images: { orderBy: { id: 'asc' } },
        tags: { orderBy: { name: 'asc' } },
        ratings: true,
      },
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

    // Calculate average rating and total ratings
    const avgRating = aircraft.ratings.length > 0
      ? aircraft.ratings.reduce((sum, r) => sum + r.stars, 0) / aircraft.ratings.length
      : 0;
    const totalRatings = aircraft.ratings.length;

    // Format response
    const response = {
      aircraft: {
        ...aircraft,
        avgRating: Math.round(avgRating * 10) / 10, // Round to 1 decimal
        totalRatings,
        images: aircraft.images,
        tags: aircraft.tags.map((t) => t.name),
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Aircraft detail fetch error:', error);
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch aircraft details',
        },
      },
      { status: 500 }
    );
  }
}
