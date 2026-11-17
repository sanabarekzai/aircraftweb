import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { internalError } from '@/lib/api-helpers';

// GET /api/aircraft/tags - Get all unique tags
export async function GET() {
  try {
    const tags = await prisma.tag.findMany({
      select: {
        name: true,
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({
      tags: tags.map(t => t.name),
    });
  } catch (error) {
    console.error('Get tags error:', error);
    return internalError('Failed to get tags');
  }
}
