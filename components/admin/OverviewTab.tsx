'use client';

import Link from 'next/link';
import type { RecentUser } from '@/components/admin/UsersTab';

export interface AdminStats {
  totals: {
    users: number;
    aircraft: number;
    bookings: number;
    reviews: number;
    ratings: number;
    favorites: number;
    flightLogs: number;
    totalFlightHours: number;
  };
  bookingsByStatus: { status: string; count: number }[];
  moderation: {
    hiddenReviews: number;
    reportedReviews: number;
  };
  recentUsers: RecentUser[];
  topAircraft: {
    id: string;
    slug: string;
    name: string;
    bookings: number;
    favorites: number;
    ratings: number;
  }[];
}

interface OverviewTabProps {
  stats: AdminStats | null;
  onRefresh: () => void;
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-amber-500/20 text-amber-400',
  CONFIRMED: 'bg-cyan-500/20 text-cyan-400',
  CANCELLED: 'bg-red-500/20 text-red-400',
  COMPLETED: 'bg-green-500/20 text-green-400',
};

export function OverviewTab({ stats, onRefresh }: OverviewTabProps) {
  if (!stats) {
    return <div className="text-slate-400">Loading overview...</div>;
  }

  const totalCards = [
    { label: 'Users', value: stats.totals.users },
    { label: 'Aircraft', value: stats.totals.aircraft },
    { label: 'Bookings', value: stats.totals.bookings },
    { label: 'Reviews', value: stats.totals.reviews },
    { label: 'Ratings', value: stats.totals.ratings },
    { label: 'Favorites', value: stats.totals.favorites },
    { label: 'Flight Logs', value: stats.totals.flightLogs },
    { label: 'Flight Hours', value: stats.totals.totalFlightHours.toFixed(1) },
  ];

  return (
    <div className="space-y-6">
      {/* Totals */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {totalCards.map((card) => (
          <div key={card.label} className="bg-panel rounded-lg p-4">
            <p className="text-2xl font-bold text-white">{card.value}</p>
            <p className="text-sm text-slate-400">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bookings by status */}
        <div className="bg-panel rounded-lg p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Bookings by Status</h2>
          {stats.bookingsByStatus.length === 0 ? (
            <p className="text-slate-500 text-sm">No bookings yet.</p>
          ) : (
            <div className="space-y-2">
              {['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'].map((status) => {
                const entry = stats.bookingsByStatus.find((b) => b.status === status);
                if (!entry) return null;
                return (
                  <div key={status} className="flex items-center justify-between">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[status]}`}>
                      {status}
                    </span>
                    <span className="text-white font-medium">{entry.count}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Moderation summary */}
        <div className="bg-panel rounded-lg p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Moderation</h2>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Reported reviews (open)</span>
              <span className="text-white font-medium">{stats.moderation.reportedReviews}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Hidden reviews</span>
              <span className="text-white font-medium">{stats.moderation.hiddenReviews}</span>
            </div>
          </div>
        </div>

        {/* Recent users */}
        <div className="bg-panel rounded-lg p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Recent Users</h2>
          {stats.recentUsers.length === 0 ? (
            <p className="text-slate-500 text-sm">No users yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {stats.recentUsers.map((user) => (
                <li key={user.id} className="flex items-center justify-between">
                  <span className="text-slate-300">
                    {user.username}
                    {user.isAdmin && (
                      <span className="ml-2 text-xs bg-cyan-500/20 text-cyan-400 px-1.5 py-0.5 rounded-full">
                        admin
                      </span>
                    )}
                  </span>
                  <span className="text-slate-500 text-xs">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Top aircraft */}
        <div className="bg-panel rounded-lg p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Top Aircraft (by bookings)</h2>
          {stats.topAircraft.every((a) => a.bookings === 0) ? (
            <p className="text-slate-500 text-sm">No bookings yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {stats.topAircraft
                .filter((a) => a.bookings > 0)
                .map((aircraft) => (
                  <li key={aircraft.id} className="flex items-center justify-between">
                    <Link
                      href={`/fleet/${aircraft.slug}`}
                      className="text-slate-300 hover:text-accent-cyan transition-colors"
                    >
                      {aircraft.name}
                    </Link>
                    <span className="text-slate-500 text-xs">
                      {aircraft.bookings} booking{aircraft.bookings !== 1 ? 's' : ''}
                      {' '}&bull; {aircraft.favorites} fav{aircraft.favorites !== 1 ? 's' : ''}
                    </span>
                  </li>
                ))}
            </ul>
          )}
        </div>
      </div>

      <button
        onClick={onRefresh}
        className="px-4 py-2 bg-slate-700 text-white text-sm rounded-lg hover:bg-slate-600 transition-colors"
      >
        Refresh Stats
      </button>
    </div>
  );
}
