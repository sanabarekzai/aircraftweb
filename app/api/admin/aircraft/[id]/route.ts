import { ZodError } from 'zod';
import {
  getAdminSessionOr403,
  internalError,
  successResponse,
  validationError,
  notFoundResponse,
} from '@/lib/api-helpers';
import { prisma } from '@/lib/prisma';
import { aircraftInputSchema, slugify, uniqueSlug } from '@/lib/aircraft-admin';

// GET /api/admin/aircraft/[id] - Full aircraft data for editing
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionOr403 = await getAdminSessionOr403();
    if (sessionOr403 instanceof Response) return sessionOr403;

    const { id } = await params;

    const aircraft = await prisma.aircraft.findUnique({
      where: { id },
      include: {
        images: { orderBy: { id: 'asc' } },
        tags: { select: { name: true } },
      },
    });

    if (!aircraft) {
      return notFoundResponse('Aircraft');
    }

    return successResponse({ aircraft });
  } catch (error) {
    console.error('Admin aircraft fetch error:', error);
    return internalError('Failed to fetch aircraft');
  }
}

// PUT /api/admin/aircraft/[id]
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionOr403 = await getAdminSessionOr403();
    if (sessionOr403 instanceof Response) return sessionOr403;

    const { id } = await params;

    const existing = await prisma.aircraft.findUnique({
      where: { id },
      include: { tags: true },
    });

    if (!existing) {
      return notFoundResponse('Aircraft');
    }

    const body = await request.json();
    const data = aircraftInputSchema.parse(body);
    const { tags, images, ...fields } = data;

    const slug = await uniqueSlug(
      fields.slug ? slugify(fields.slug) : slugify(fields.name)
    );

    // Deduplicate requested tag names so set-diff below stays valid
    const requestedTags = tags ? Array.from(new Set(tags)) : null;
    const existingTagNames = existing.tags.map((t) => t.name);

    const tagOps = requestedTags
      ? {
          set: [],
          connectOrCreate: requestedTags.map((name) => ({
            where: { name },
            create: { name },
          })),
        }
      : undefined;

    const aircraft = await prisma.aircraft.update({
      where: { id },
      data: {
        ...fields,
        slug,
        releaseYear: fields.releaseYear ?? null,
        schematicUrl: fields.schematicUrl ?? null,
        ...(tagOps && {
          tags: tagOps,
        }),
        ...(images && {
          images: {
            deleteMany: {},
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

    // Clean up unattached tags (keep those still used by other aircraft)
    if (requestedTags) {
      const removedTagNames = existingTagNames.filter(
        (name) => !requestedTags.includes(name)
      );
      if (removedTagNames.length > 0) {
        await prisma.tag.deleteMany({
          where: { name: { in: removedTagNames }, aircrafts: { none: {} } },
        });
      }
    }

    return successResponse({ aircraft });
  } catch (error) {
    if (error instanceof ZodError) {
      return validationError(error.flatten().fieldErrors);
    }

    console.error('Admin aircraft update error:', error);
    return internalError('Failed to update aircraft');
  }
}

// DELETE /api/admin/aircraft/[id]
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionOr403 = await getAdminSessionOr403();
    if (sessionOr403 instanceof Response) return sessionOr403;

    const { id } = await params;

    const existing = await prisma.aircraft.findUnique({
      where: { id },
    });

    if (!existing) {
      return notFoundResponse('Aircraft');
    }

    await prisma.aircraft.delete({ where: { id } });

    return successResponse({ success: true });
  } catch (error) {
    console.error('Admin aircraft delete error:', error);
    return internalError('Failed to delete aircraft');
  }
}
