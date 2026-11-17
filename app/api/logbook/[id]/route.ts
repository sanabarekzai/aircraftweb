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
  notFoundResponse,
  verifyOwnership,
} from '@/lib/api-helpers';

const putSchema = z.object({
  aircraftId: z.string().uuid('Invalid aircraft ID'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  durationHours: z.number().positive('Duration must be positive'),
  notes: z.string().min(1, 'Notes are required'),
});

// PUT /api/logbook/[id] - Update a flight log
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionOr401 = await getSessionOr401();
    if (sessionOr401 instanceof NextResponse) return sessionOr401;
    
    const session = sessionOr401 as { user: SessionData['user'] };
    const { id } = await params;
    const body = await request.json();
    const { aircraftId, date, durationHours, notes } = putSchema.parse(body);

    // Find the flight log and verify ownership
    const flightLog = await prisma.flightLog.findUnique({
      where: { id },
    });

    if (!flightLog) {
      return notFoundResponse('Flight log');
    }

    // Verify ownership
    if (!verifyOwnership(flightLog, session.user.id)) {
      return notFoundResponse('Flight log');
    }

    // Check if aircraft exists
    const aircraftCheck = await checkAircraftExists(aircraftId);
    if (aircraftCheck instanceof NextResponse) return aircraftCheck;

    const updatedFlightLog = await prisma.flightLog.update({
      where: { id },
      data: {
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

    return successResponse({
      flightLog: {
        ...updatedFlightLog,
        aircraft: updatedFlightLog.aircraft,
      },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return validationError(error.flatten().fieldErrors);
    }

    console.error('Update flight log error:', error);
    return internalError('Failed to update flight log');
  }
}

// DELETE /api/logbook/[id] - Delete a flight log
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionOr401 = await getSessionOr401();
    if (sessionOr401 instanceof NextResponse) return sessionOr401;
    
    const session = sessionOr401 as { user: SessionData['user'] };
    const { id } = await params;

    // Find the flight log and verify ownership
    const flightLog = await prisma.flightLog.findUnique({
      where: { id },
    });

    if (!flightLog) {
      return notFoundResponse('Flight log');
    }

    // Verify ownership - if not owner, return 404
    if (!verifyOwnership(flightLog, session.user.id)) {
      return notFoundResponse('Flight log');
    }

    await prisma.flightLog.delete({
      where: { id },
    });

    return successResponse({ success: true });
  } catch (error) {
    console.error('Delete flight log error:', error);
    return internalError('Failed to delete flight log');
  }
}
