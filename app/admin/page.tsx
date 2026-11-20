import { notFound } from 'next/navigation';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { AdminDashboard } from '@/components/admin/AdminDashboard';

// Server-side gate: only admins can load the dashboard shell.
// Every admin API also re-checks authorization server-side.
export default async function AdminPage() {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions);

  if (!session.user) {
    notFound();
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isAdmin: true },
  });

  if (!user?.isAdmin) {
    notFound();
  }

  return <AdminDashboard />;
}
