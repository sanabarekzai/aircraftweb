'use client';

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/lib/toast';

interface AdminBooking {
  id: string;
  startDate: string;
  endDate: string;
  status: string;
  totalPrice: number | null;
  createdAt: string;
  user: { id: string; username: string; email: string };
  aircraft: { id: string; slug: string; name: string };
}

const STATUSES = ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'];

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-amber-500/20 text-amber-400',
  CONFIRMED: 'bg-cyan-500/20 text-cyan-400',
  CANCELLED: 'bg-red-500/20 text-red-400',
  COMPLETED: 'bg-green-500/20 text-green-400',
};

interface BookingsTabProps {
  onRefresh: () => void;
}

export function BookingsTab({ onRefresh }: BookingsTabProps) {
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { showToast } = useToast();

  const fetchBookings = useCallback(async (status: string) => {
    setIsLoading(true);
    try {
      const params = status !== 'ALL' ? `?status=${status}` : '';
      const response = await fetch(`/api/admin/bookings${params}`);
      if (response.ok) {
        const data = await response.json();
        setBookings(data.bookings || []);
      }
    } catch {
      showToast('Failed to load bookings', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchBookings(statusFilter);
  }, [statusFilter, fetchBookings]);

  const handleStatusChange = async (booking: AdminBooking, status: string) => {
    try {
      const response = await fetch(`/api/admin/bookings/${booking.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        const data = await response.json();
        setBookings(bookings.map((b) => (b.id === booking.id ? { ...b, ...data.booking } : b)));
        showToast('Booking status updated', 'success');
        onRefresh();
      } else {
        const error = await response.json();
        showToast(error.error?.message || 'Failed to update booking', 'error');
      }
    } catch {
      showToast('Failed to update booking', 'error');
    }
  };

  const handleDelete = async (booking: AdminBooking) => {
    if (!confirm(`Delete this ${booking.aircraft.name} booking for ${booking.user.username}?`)) {
      return;
    }

    setDeletingId(booking.id);
    try {
      const response = await fetch(`/api/admin/bookings/${booking.id}`, { method: 'DELETE' });
      if (response.ok) {
        setBookings(bookings.filter((b) => b.id !== booking.id));
        showToast('Booking deleted', 'success');
        onRefresh();
      } else {
        const error = await response.json();
        showToast(error.error?.message || 'Failed to delete booking', 'error');
      }
    } catch {
      showToast('Failed to delete booking', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="bg-panel rounded-lg p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <h2 className="text-xl font-semibold text-white">Bookings ({bookings.length})</h2>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="p-2 bg-slate-800/50 border border-slate-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-accent-cyan"
          aria-label="Filter by status"
        >
          <option value="ALL">All statuses</option>
          {STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="text-slate-400">Loading bookings...</div>
      ) : bookings.length === 0 ? (
        <p className="text-slate-500 text-sm">No bookings found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400 border-b border-slate-700/50">
                <th className="py-2 pr-4">Aircraft</th>
                <th className="py-2 pr-4">User</th>
                <th className="py-2 pr-4">Dates</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => (
                <tr key={booking.id} className="border-b border-slate-800/50">
                  <td className="py-2 pr-4 text-white">{booking.aircraft.name}</td>
                  <td className="py-2 pr-4">
                    <p className="text-slate-300">{booking.user.username}</p>
                    <p className="text-xs text-slate-500">{booking.user.email}</p>
                  </td>
                  <td className="py-2 pr-4 text-slate-400">
                    {booking.startDate} &rarr; {booking.endDate}
                  </td>
                  <td className="py-2 pr-4">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        STATUS_COLORS[booking.status] || 'bg-slate-700/50 text-slate-300'
                      }`}
                    >
                      {booking.status}
                    </span>
                  </td>
                  <td className="py-2">
                    <div className="flex items-center gap-2">
                      <select
                        value={booking.status}
                        onChange={(e) => handleStatusChange(booking, e.target.value)}
                        className="p-1 bg-slate-800/50 border border-slate-700 rounded text-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-accent-cyan"
                        aria-label="Change booking status"
                      >
                        {STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => handleDelete(booking)}
                        disabled={deletingId === booking.id}
                        className="hover:text-red-400 transition-colors disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
