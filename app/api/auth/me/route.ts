import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';

export async function GET() {
  try {
    const result = await requireUser();
    
    if ('error' in result) {
      return result.error;
    }

    return NextResponse.json(
      { user: result.user },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get user',
        },
      },
      { status: 500 }
    );
  }
}
