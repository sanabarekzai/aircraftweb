import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  getSessionOr401,
  internalError,
  successResponse,
  notFoundResponse,
  verifyOwnership,
} from '@/lib/api-helpers';

// DELETE /api/bookings/[id] - Delete a booking
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionOr401 = await getSessionOr401();
    if (sessionOr401 instanceof NextResponse) return sessionOr401;
    
    const session = sessionOr401;
    const { id } = await params;

    // Find booking
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!booking) {
      return notFoundResponse('Booking');
    }

    // Verify ownership
    if (!verifyOwnership(booking, session.user.id)) {
      return notFoundResponse('Booking');
    }

    // Delete booking
    await prisma.booking.delete({
      where: { id },
    });

    return successResponse({ success: true, message: 'Booking cancelled' });
  } catch (error) {
    console.error('Delete booking error:', error);
    return internalError('Failed to delete booking');
  }
}

// PUT /api/bookings/[id] - Update a booking
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionOr401 = await getSessionOr401();
    if (sessionOr401 instanceof NextResponse) return sessionOr401;
    
    const session = sessionOr401;
    const { id } = await params;
    const body = await request.json();
    const { startDate, endDate, notes } = body;

    // Find booking
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!booking) {
      return notFoundResponse('Booking');
    }

    // Verify ownership
    if (!verifyOwnership(booking, session.user.id)) {
      return notFoundResponse('Booking');
    }

    // Validate dates
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (start >= end) {
        return NextResponse.json(
          {
            error: {
              code: 'INVALID_INPUT',
              message: 'End date must be after start date',
            },
          },
          { status: 400 }
        );
      }

      // Check for overlapping bookings on the same aircraft
      const overlappingBooking = await prisma.booking.findFirst({
        where: {
          aircraftId: booking.aircraftId,
          id: { not: id },
          OR: [
            {
              startDate: { lte: endDate },
              endDate: { gte: startDate },
            },
          ],
        },
      });

      if (overlappingBooking) {
        return NextResponse.json(
          {
            error: {
              code: 'INVALID_INPUT',
              message: 'This aircraft is already booked for the selected dates',
            },
          },
          { status: 400 }
        );
      }
    }

    // Update booking
    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: {
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
        ...(notes !== undefined && { notes }),
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

    return successResponse({
      booking: {
        id: updatedBooking.id,
        aircraftId: updatedBooking.aircraftId,
        startDate: updatedBooking.startDate,
        endDate: updatedBooking.endDate,
        status: updatedBooking.status,
        totalPrice: updatedBooking.totalPrice,
        notes: updatedBooking.notes,
        aircraft: updatedBooking.aircraft,
      },
    });
  } catch (error) {
    console.error('Update booking error:', error);
    return internalError('Failed to update booking');
  }
}
