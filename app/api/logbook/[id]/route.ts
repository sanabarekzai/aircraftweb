import { NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

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

    const { id } = await params;
    const body = await request.json();
    const { aircraftId, date, durationHours, notes } = putSchema.parse(body);

    // Find the flight log and verify ownership
    const flightLog = await prisma.flightLog.findUnique({
      where: { id },
    });

    if (!flightLog) {
      return NextResponse.json(
        {
          error: {
            code: 'NOT_FOUND',
            message: 'Flight log not found',
          },
        },
        { status: 404 }
      );
    }

    // Verify ownership
    if (flightLog.userId !== session.user.id) {
      return NextResponse.json(
        {
          error: {
            code: 'NOT_FOUND',
            message: 'Flight log not found',
          },
        },
        { status: 404 }
      );
    }

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

    return NextResponse.json(
      {
        flightLog: {
          ...updatedFlightLog,
          aircraft: updatedFlightLog.aircraft,
        },
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

    console.error('Update flight log error:', error);
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update flight log',
        },
      },
      { status: 500 }
    );
  }
}

// DELETE /api/logbook/[id] - Delete a flight log
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    // Find the flight log and verify ownership
    const flightLog = await prisma.flightLog.findUnique({
      where: { id },
    });

    if (!flightLog) {
      return NextResponse.json(
        {
          error: {
            code: 'NOT_FOUND',
            message: 'Flight log not found',
          },
        },
        { status: 404 }
      );
    }

    // Verify ownership - if not owner, return 404
    if (flightLog.userId !== session.user.id) {
      return NextResponse.json(
        {
          error: {
            code: 'NOT_FOUND',
            message: 'Flight log not found',
          },
        },
        { status: 404 }
      );
    }

    await prisma.flightLog.delete({
      where: { id },
    });

    return NextResponse.json(
      { success: true },
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete flight log error:', error);
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to delete flight log',
        },
      },
      { status: 500 }
    );
  }
}
