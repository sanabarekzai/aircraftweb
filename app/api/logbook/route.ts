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
} from '@/lib/api-helpers';

const postSchema = z.object({
  aircraftId: z.string().uuid('Invalid aircraft ID'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  durationHours: z.number().positive('Duration must be positive'),
  notes: z.string().min(1, 'Notes are required'),
});

// GET /api/logbook - Get all flight logs for the authenticated user
export async function GET() {
  try {
    const sessionOr401 = await getSessionOr401();
    if (sessionOr401 instanceof NextResponse) return sessionOr401;
    
    const session = sessionOr401 as { user: SessionData['user'] };

    const flightLogs = await prisma.flightLog.findMany({
      where: { userId: session.user.id },
      include: {
        aircraft: {
          select: { id: true, name: true },
        },
      },
      orderBy: { date: 'desc' },
    });

    return successResponse({
      flightLogs: flightLogs.map((log) => ({
        ...log,
        aircraft: log.aircraft,
      })),
    });
  } catch (error) {
    console.error('Get flight logs error:', error);
    return internalError('Failed to get flight logs');
  }
}

// POST /api/logbook - Create a new flight log
export async function POST(request: Request) {
  try {
    const sessionOr401 = await getSessionOr401();
    if (sessionOr401 instanceof NextResponse) return sessionOr401;
    
    const session = sessionOr401 as { user: SessionData['user'] };
    const body = await request.json();
    const { aircraftId, date, durationHours, notes } = postSchema.parse(body);

    // Check if aircraft exists
    const aircraftCheck = await checkAircraftExists(aircraftId);
    if (aircraftCheck instanceof NextResponse) return aircraftCheck;

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

    return successResponse(
      {
        flightLog: {
          ...flightLog,
          aircraft: flightLog.aircraft,
        },
      },
      201
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return validationError(error.flatten().fieldErrors);
    }

    console.error('Create flight log error:', error);
    return internalError('Failed to create flight log');
  }
}
