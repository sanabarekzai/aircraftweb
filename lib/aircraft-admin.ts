import { z } from 'zod';
import { prisma } from '@/lib/prisma';

export const aircraftInputSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  slug: z.string().min(1).max(200).optional(),
  isConcept: z.boolean().optional(),
  category: z.enum(['GENERAL_AVIATION', 'COMMERCIAL_AIRLINER', 'MILITARY', 'SUPERSONIC', 'EXPERIMENTAL']),
  era: z.enum(['PIONEER', 'WWII', 'JET_AGE', 'MODERN']),
  releaseYear: z.number().int().min(1900).max(2100).nullable().optional(),
  topSpeedKmh: z.number().positive(),
  serviceCeilingFt: z.number().positive(),
  maxRangeNm: z.number().positive(),
  wingspanM: z.number().positive(),
  maxTakeoffWeightLbs: z.number().positive(),
  stallSpeedKts: z.number().positive(),
  liftToDragRatio: z.number().positive(),
  engineType: z.string().min(1).max(200),
  description: z.string().min(1).max(10000),
  flightControlsDescription: z.string().min(1).max(10000),
  youtubeId: z.string().min(1).max(50),
  schematicUrl: z.string().nullable().optional(),
  tags: z.array(z.string().min(1).max(50)).optional(),
  images: z.array(z.object({
    url: z.string().min(1).max(2000),
    caption: z.string().max(300).nullable().optional(),
    source: z.string().min(1).max(200).default('Admin'),
    license: z.string().min(1).max(200).default('Unknown'),
  })).optional(),
});

export function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'aircraft';
}

export async function uniqueSlug(base: string) {
  let slug = base;
  let suffix = 2;
  // A deleted-then-recreated name must not collide; probe until free
  while (await prisma.aircraft.findUnique({ where: { slug }, select: { id: true } })) {
    slug = `${base}-${suffix}`;
    suffix += 1;
  }
  return slug;
}
