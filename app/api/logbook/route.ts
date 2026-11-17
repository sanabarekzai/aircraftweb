import { NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const postSchema = z.object({
  aircraftId: z.string().uuid('Invalid aircraft ID'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  durationHours: z.number().positive('Duration must be positive'),
  notes: z.string().min(1, 'Notes are required'),
});

// GET /api/logbook - Get all flight logs for the authenticated user
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

    const flightLogs = await prisma.flightLog.findMany({
      where: { userId: session.user.id },
      include: {
        aircraft: {
          select: { id: true, name: true },
        },
      },
      orderBy: { date: 'desc' },
    });

    return NextResponse.json(
      {
        flightLogs: flightLogs.map((log) => ({
          ...log,
          aircraft: log.aircraft,
        })),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get flight logs error:', error);
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get flight logs',
        },
      },
      { status: 500 }
    );
  }
}

// POST /api/logbook - Create a new flight log
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
    const { aircraftId, date, durationHours, notes } = postSchema.parse(body);

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

    const flightLog = await prisma.flightLog.create({
      data: {
        userId: session.user.id,
        aircraftId,
        date,
        durationHours,
        notes,
      },
      include: {
        aircraft: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json(
      {
        flightLog: {
          ...flightLog,
          aircraft: flightLog.aircraft,
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

    console.error('Create flight log error:', error);
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create flight log',
        },
      },
      { status: 500 }
    );
  }
}
