import { NextResponse } from 'next/server';
import { Prisma, Category, Era } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { internalError } from '@/lib/api-helpers';

// GET /api/aircraft/search - Search aircraft with filters
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Extract filter parameters
    const query = searchParams.get('query');
    const category = searchParams.get('category');
    const era = searchParams.get('era');
    const minSpeed = searchParams.get('minSpeed');
    const maxSpeed = searchParams.get('maxSpeed');
    const minRange = searchParams.get('minRange');
    const tag = searchParams.get('tag');

    // Build where clause
    const where: Prisma.AircraftWhereInput = {};

    if (query) {
      where.name = {
        contains: query,
        mode: 'insensitive',
      };
    }

    if (category && category !== 'ALL') {
      where.category = category as Category;
    }

    if (era && era !== 'ALL') {
      where.era = era as Era;
    }

    const topSpeedFilter: Prisma.FloatFilter<'Aircraft'> = {};
    if (minSpeed) topSpeedFilter.gte = parseInt(minSpeed);
    if (maxSpeed) topSpeedFilter.lte = parseInt(maxSpeed);
    if (minSpeed || maxSpeed) {
      where.topSpeedKmh = topSpeedFilter;
    }

    if (minRange) {
      where.maxRangeNm = { gte: parseInt(minRange) };
    }

    // Handle tag filter - need to filter through tags relation
    let aircraft;
    if (tag) {
      aircraft = await prisma.aircraft.findMany({
        where: {
          ...where,
          tags: {
            some: {
              name: {
                equals: tag,
                mode: 'insensitive',
              },
            },
          },
        },
        include: {
          tags: true,
          images: {
            take: 1,
            orderBy: { id: 'asc' },
          },
        },
        orderBy: { name: 'asc' },
      });
    } else {
      aircraft = await prisma.aircraft.findMany({
        where,
        include: {
          tags: true,
          images: {
            take: 1,
            orderBy: { id: 'asc' },
          },
        },
        orderBy: { name: 'asc' },
      });
    }

    return NextResponse.json({
      aircraft: aircraft.map(a => ({
        id: a.id,
        slug: a.slug,
        name: a.name,
        category: a.category,
        era: a.era,
        topSpeedKmh: a.topSpeedKmh,
        maxRangeNm: a.maxRangeNm,
        releaseYear: a.releaseYear,
        tags: a.tags.map(t => ({ name: t.name })),
        images: a.images.map(i => ({ url: i.url })),
      })),
    });
  } catch (error) {
    console.error('Search aircraft error:', error);
    return internalError('Failed to search aircraft');
  }
}
