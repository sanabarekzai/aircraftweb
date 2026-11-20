import { ZodError } from 'zod';
import {
  getAdminSessionOr403,
  internalError,
  successResponse,
  validationError,
} from '@/lib/api-helpers';
import { prisma } from '@/lib/prisma';
import {
  aircraftInputSchema,
  slugify,
  uniqueSlug,
} from '@/lib/aircraft-admin';

// GET /api/admin/aircraft - Full aircraft list for management
export async function GET() {
  try {
    const sessionOr403 = await getAdminSessionOr403();
    if (sessionOr403 instanceof Response) return sessionOr403;

    const aircraft = await prisma.aircraft.findMany({
      include: {
        images: { take: 1, orderBy: { id: 'asc' } },
        tags: { select: { name: true } },
        _count: { select: { reviews: true, bookings: true, favorites: true, ratings: true } },
      },
      orderBy: { name: 'asc' },
    });

    return successResponse({ aircraft });
  } catch (error) {
    console.error('Admin aircraft list error:', error);
    return internalError('Failed to list aircraft');
  }
}

// POST /api/admin/aircraft - Create an aircraft
export async function POST(request: Request) {
  try {
    const sessionOr403 = await getAdminSessionOr403();
    if (sessionOr403 instanceof Response) return sessionOr403;

    const body = await request.json();
    const data = aircraftInputSchema.parse(body);
    const { tags, images, ...fields } = data;

    const slug = await uniqueSlug(fields.slug ? slugify(fields.slug) : slugify(fields.name));

    const aircraft = await prisma.aircraft.create({
      data: {
        ...fields,
        slug,
        releaseYear: fields.releaseYear ?? null,
        schematicUrl: fields.schematicUrl ?? null,
        ...(tags && {
          tags: {
            connectOrCreate: tags.map((name) => ({
              where: { name },
              create: { name },
            })),
          },
        }),
        ...(images && {
          images: {
            create: images.map((img) => ({
              url: img.url,
              caption: img.caption ?? null,
              source: img.source,
              license: img.license,
            })),
          },
        }),
      },
      include: {
        images: { take: 1, orderBy: { id: 'asc' } },
        tags: { select: { name: true } },
        _count: { select: { reviews: true, bookings: true, favorites: true, ratings: true } },
      },
    });

    return successResponse({ aircraft }, 201);
  } catch (error) {
    if (error instanceof ZodError) {
      return validationError(error.flatten().fieldErrors);
    }

    console.error('Admin aircraft create error:', error);
    return internalError('Failed to create aircraft');
  }
}
