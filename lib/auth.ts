import { getIronSession } from 'iron-session';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from './session';

export interface UserSession {
  user: {
    id: string;
    email: string;
    username: string;
  };
}

// requireUser function as specified in the spec
export async function requireUser() {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions);

  if (!session.user) {
    return {
      error: NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      ),
    };
  }

  return { user: session.user };
}

// Helper to get session from cookies
export async function getSession() {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}
