import { NextResponse } from 'next/server';
import { z, ZodError } from 'zod';
import {
  getAdminSessionOr403,
  internalError,
  successResponse,
  validationError,
  notFoundResponse,
} from '@/lib/api-helpers';
import { prisma } from '@/lib/prisma';

const patchSchema = z.object({
  isAdmin: z.boolean(),
});

// PATCH /api/admin/users/[id] - Update admin status
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionOr403 = await getAdminSessionOr403();
    if (sessionOr403 instanceof Response) return sessionOr403;

    const session = sessionOr403;

    const { id } = await params;
    const body = await request.json();
    const { isAdmin } = patchSchema.parse(body);

    if (id === session.user.id && !isAdmin) {
      return NextResponse.json(
        {
          error: {
            code: 'FORBIDDEN',
            message: 'You cannot revoke your own admin access',
          },
        },
        { status: 403 }
      );
    }

    const user = await prisma.user.findUnique({ where: { id } });

    if (!user) {
      return notFoundResponse('User');
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { isAdmin },
      select: {
        id: true,
        username: true,
        email: true,
        isAdmin: true,
      },
    });

    return successResponse({ user: updated });
  } catch (error) {
    if (error instanceof ZodError) {
      return validationError(error.flatten().fieldErrors);
    }

    console.error('Admin user update error:', error);
    return internalError('Failed to update user');
  }
}

// DELETE /api/admin/users/[id]
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionOr403 = await getAdminSessionOr403();
    if (sessionOr403 instanceof Response) return sessionOr403;

    const session = sessionOr403;

    const { id } = await params;

    if (id === session.user.id) {
      return NextResponse.json(
        {
          error: {
            code: 'FORBIDDEN',
            message: 'You cannot delete your own account',
          },
        },
        { status: 403 }
      );
    }

    const user = await prisma.user.findUnique({ where: { id } });

    if (!user) {
      return notFoundResponse('User');
    }

    await prisma.user.delete({ where: { id } });

    return successResponse({ success: true });
  } catch (error) {
    console.error('Admin user delete error:', error);
    return internalError('Failed to delete user');
  }
}
