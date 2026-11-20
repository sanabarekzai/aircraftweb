import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { sessionOptions, SessionData } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { z, ZodError } from 'zod';
import bcrypt from 'bcryptjs';
import {
  getSessionOr401,
  internalError,
  successResponse,
  validationError,
} from '@/lib/api-helpers';

const updateSchema = z.object({
  username: z.string().min(1, 'Username is required').max(50, 'Username too long'),
  email: z.string().email('Invalid email address'),
  currentPassword: z.string().optional(),
  newPassword: z.string().optional(),
});

// PUT /api/settings - Update user settings
export async function PUT(request: Request) {
  try {
    const sessionOr401 = await getSessionOr401();
    if (sessionOr401 instanceof NextResponse) return sessionOr401;
    
    const session = sessionOr401 as { user: NonNullable<SessionData['user']> };
    const body = await request.json();
    const { username, email, currentPassword, newPassword } = updateSchema.parse(body);

    // Check if username is already taken by another user
    const existingUser = await prisma.user.findFirst({
      where: {
        username: username.toLowerCase(),
        NOT: { id: session.user.id },
      },
    });

    if (existingUser) {
      return validationError({ username: ['Username already taken'] });
    }

    // Check if email is already taken by another user
    const existingEmail = await prisma.user.findFirst({
      where: {
        email: email.toLowerCase(),
        NOT: { id: session.user.id },
      },
    });

    if (existingEmail) {
      return validationError({ email: ['Email already in use'] });
    }

    // Get current user to verify password if changing it
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return internalError('User not found');
    }

    // If password is being changed, verify current password
    if (currentPassword && newPassword) {
      const isValidPassword = await bcrypt.compare(currentPassword, user.passwordHash);
      
      if (!isValidPassword) {
        return validationError({ currentPassword: ['Current password is incorrect'] });
      }

      // Hash new password
      const passwordHash = await bcrypt.hash(newPassword, 12);
      
      // Update user with new password
      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          username: username.trim(),
          email: email.trim().toLowerCase(),
          passwordHash,
        },
      });
    } else {
      // Update user without password change
      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          username: username.trim(),
          email: email.trim().toLowerCase(),
        },
      });
    }

    // Return success with updated user data
    const updatedUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        username: true,
        email: true,
        isAdmin: true,
      },
    });

    return successResponse({
      user: updatedUser,
      message: 'Settings updated successfully',
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return validationError(error.flatten().fieldErrors);
    }

    console.error('Update settings error:', error);
    return internalError('Failed to update settings');
  }
}
