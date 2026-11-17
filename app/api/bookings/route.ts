import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { sessionOptions, SessionData } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { z, ZodError } from 'zod';
import {
  getSessionOr401,
  internalError,
  successResponse,
  validationError,
  notFoundResponse,
  verifyOwnership,
} from '@/lib/api-helpers';

const createSchema = z.object({
  aircraftId: z.string().uuid('Invalid aircraft ID'),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  notes: z.string().optional(),
});

// GET /api/bookings - Get all bookings for the authenticated user
export async function GET() {
  try {
    const sessionOr401 = await getSessionOr401();
    if (sessionOr401 instanceof NextResponse) return sessionOr401;
    
    const session = sessionOr401 as { user: SessionData['user'] };

    const bookings = await prisma.booking.findMany({
      where: { userId: session.user.id },
      include: {
        aircraft: {
          select: {
            id: true,
            slug: true,
            name: true,
            category: true,
            images: {
              take: 1,
              orderBy: { id: 'asc' },
            },
          },
        },
      },
      orderBy: { startDate: 'asc' },
    });

    return successResponse({
      bookings: bookings.map(b => ({
        id: b.id,
        aircraftId: b.aircraftId,
        startDate: b.startDate,
        endDate: b.endDate,
        status: b.status,
        totalPrice: b.totalPrice,
        notes: b.notes,
        aircraft: b.aircraft,
      })),
    });
  } catch (error) {
    console.error('Get bookings error:', error);
    return internalError('Failed to get bookings');
  }
}

// POST /api/bookings - Create a new booking
export async function POST(request: Request) {
  try {
    const sessionOr401 = await getSessionOr401();
    if (sessionOr401 instanceof NextResponse) return sessionOr401;
    
    const session = sessionOr401 as { user: SessionData['user'] };
    const body = await request.json();
    const { aircraftId, startDate, endDate, notes } = createSchema.parse(body);

    // Check if aircraft exists
    const aircraft = await prisma.aircraft.findUnique({
      where: { id: aircraftId },
    });

    if (!aircraft) {
      return notFoundResponse('Aircraft');
    }

    // Check if dates are valid
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start >= end) {
      return validationError({ endDate: ['End date must be after start date'] });
    }

    // Check for overlapping bookings on the same aircraft
    const overlappingBooking = await prisma.booking.findFirst({
      where: {
        aircraftId,
        OR: [
          {
            startDate: { lte: endDate },
            endDate: { gte: startDate },
          },
        ],
      },
    });

    if (overlappingBooking) {
      return validationError({
        startDate: ['This aircraft is already booked for the selected dates'],
      });
    }

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        userId: session.user.id,
        aircraftId,
        startDate,
        endDate,
        status: 'PENDING',
        notes,
      },
      include: {
        aircraft: {
          select: {
            id: true,
            slug: true,
            name: true,
            category: true,
          },
        },
      },
    });

    return successResponse(
      {
        booking: {
          id: booking.id,
          aircraftId: booking.aircraftId,
          startDate: booking.startDate,
          endDate: booking.endDate,
          status: booking.status,
          totalPrice: booking.totalPrice,
          notes: booking.notes,
          aircraft: booking.aircraft,
        },
      },
      201
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return validationError(error.flatten().fieldErrors);
    }

    console.error('Create booking error:', error);
    return internalError('Failed to create booking');
  }
}
