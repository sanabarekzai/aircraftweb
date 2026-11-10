import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import type { Category, Era } from '@prisma/client';

const querySchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  era: z.string().optional(),
  tag: z.string().optional(),
  sort: z.enum(['speed_desc', 'name_asc', 'year_desc', 'range_desc', 'ceiling_desc']).optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().default(12),
});

interface AircraftImage {
  url: string;
}

interface AircraftTag {
  name: string;
}

interface AircraftWithRelations {
  id: string;
  slug: string;
  name: string;
  isConcept: boolean;
  category: Category;
  era: Era;
  releaseYear: number | null;
  topSpeedKmh: number;
  serviceCeilingFt: number;
  maxRangeNm: number;
  wingspanM: number;
  maxTakeoffWeightLbs: number;
  stallSpeedKts: number;
  liftToDragRatio: number;
  engineType: string;
  description: string;
  flightControlsDescription: string;
  youtubeId: string;
  schematicUrl: string | null;
  images: AircraftImage[];
  tags: AircraftTag[];
}

export async function GET(request: Request) {
  try {
    const { search, category, era, tag, sort, page, pageSize } = querySchema.parse(
      Object.fromEntries(new URL(request.url).searchParams.entries())
    );

    // Build where clause
    const where: {
      OR?: Array<{ name?: object; engineType?: object }>;
      category?: { in: Category[] };
      era?: { in: Era[] };
      tags?: { some: { name: { in: string[]; mode: 'insensitive' } } };
    } = {};

    // Search filter (case-insensitive on name or engineType)
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { engineType: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Category filter (comma-separated, OR logic within group)
    if (category) {
      const categories = category.split(',').filter(Boolean) as Category[];
      where.category = { in: categories };
    }

    // Era filter (comma-separated, OR logic within group)
    if (era) {
      const eras = era.split(',').filter(Boolean) as Era[];
      where.era = { in: eras };
    }

    // Tag filter (comma-separated, OR logic within group)
    if (tag) {
      const tags = tag.split(',').filter(Boolean);
      where.tags = { some: { name: { in: tags, mode: 'insensitive' } } };
    }

    // Build orderBy clause
    const orderBy: Array<{ [key: string]: 'asc' | 'desc' }> = [];
    switch (sort) {
      case 'speed_desc':
        orderBy.push({ topSpeedKmh: 'desc' });
        break;
      case 'name_asc':
        orderBy.push({ name: 'asc' });
        break;
      case 'year_desc':
        // Sort by releaseYear descending, with nulls last
        orderBy.push({ releaseYear: 'desc' });
        orderBy.push({ name: 'asc' });
        break;
      case 'range_desc':
        orderBy.push({ maxRangeNm: 'desc' });
        break;
      case 'ceiling_desc':
        orderBy.push({ serviceCeilingFt: 'desc' });
        break;
      default:
        // Default sort by name ascending
        orderBy.push({ name: 'asc' });
    }

    // Get total count
    const total = await prisma.aircraft.count({ where });

    // Get aircraft with pagination
    const aircraft = await prisma.aircraft.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        images: { orderBy: { id: 'asc' }, take: 1 },
        tags: true,
      },
    });

    // Format response
    const data = aircraft.map((a: AircraftWithRelations) => ({
      ...a,
      coverImage: a.images[0] || null,
      tags: a.tags.map((t: AircraftTag) => t.name),
    }));

    const totalPages = Math.ceil(total / pageSize);

    return NextResponse.json(
      {
        data,
        total,
        page,
        totalPages,
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

    console.error('Aircraft fetch error:', error);
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch aircraft',
        },
      },
      { status: 500 }
    );
  }
}
