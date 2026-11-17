'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/lib/toast';

interface Aircraft {
  id: string;
  slug: string;
  name: string;
  category: string;
  images: { url: string }[];
}

interface Booking {
  id: string;
  aircraftId: string;
  startDate: string;
  endDate: string;
  status: string;
  totalPrice: number | null;
  aircraft: Aircraft;
}

export default function BookingsPage() {
  const { user, loading } = useAuth();
  const { showToast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAircraft, setSelectedAircraft] = useState<Aircraft | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);

  // Form state for new booking
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch user's bookings
  const fetchBookings = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/bookings');
      if (response.ok) {
        const data = await response.json();
        setBookings(data.bookings || []);
      }
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
      showToast('Failed to load bookings', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [user, showToast]);

  useEffect(() => {
    if (!loading && user) {
      fetchBookings();
    }
  }, [user, loading, fetchBookings]);

  // Fetch aircraft for booking
  const fetchAircraft = async (aircraftId: string) => {
    try {
      const response = await fetch(`/api/aircraft/${aircraftId}`);
      if (response.ok) {
        const data = await response.json();
        setSelectedAircraft(data.aircraft);
        setShowBookingModal(true);
      }
    } catch (error) {
      console.error('Failed to fetch aircraft:', error);
      showToast('Failed to load aircraft details', 'error');
    }
  };

  // Create new booking
  const createBooking = async (aircraftId: string) => {
    if (!formData.startDate || !formData.endDate) {
      showToast('Please select start and end dates', 'error');
      return;
    }

    if (new Date(formData.startDate) >= new Date(formData.endDate)) {
      showToast('End date must be after start date', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          aircraftId,
          startDate: formData.startDate,
          endDate: formData.endDate,
          notes: formData.notes,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        showToast(data.error?.message || 'Failed to create booking', 'error');
        return;
      }

      showToast('Booking created successfully!', 'success');
      setShowBookingModal(false);
      setFormData({ startDate: '', endDate: '', notes: '' });
      fetchBookings();
    } catch (error) {
      console.error('Create booking error:', error);
      showToast('Failed to create booking', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cancel booking
  const cancelBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this booking?')) {
      return;
    }

    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        showToast('Booking cancelled successfully', 'success');
        fetchBookings();
      } else {
        const data = await response.json();
        showToast(data.error?.message || 'Failed to cancel booking', 'error');
      }
    } catch (error) {
      console.error('Cancel booking error:', error);
      showToast('Failed to cancel booking', 'error');
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'bg-green-500/20 text-green-400';
      case 'cancelled':
        return 'bg-red-500/20 text-red-400';
      case 'completed':
        return 'bg-blue-500/20 text-blue-400';
      default:
        return 'bg-yellow-500/20 text-yellow-400';
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (!user) {
    return (
      <main className="min-h-screen bg-slate-900 text-slate-100 p-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl font-bold mb-4">My Bookings</h1>
          <p className="text-slate-400">Please login to view and manage your bookings.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-900 text-slate-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">My Bookings</h1>
          <Link
            href="/fleet"
            className="px-4 py-2 bg-accent-cyan text-white font-medium rounded-lg hover:bg-cyan-600 transition-colors focus-visible:ring-2 focus-visible:ring-cyan-400"
          >
            Browse Aircraft
          </Link>
        </div>

        {isLoading ? (
          <div className="text-center py-8">Loading bookings...</div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold mb-4">No bookings yet</h2>
            <p className="text-slate-400 mb-6">
              Start by browsing available aircraft and making a booking.
            </p>
            <Link
              href="/fleet"
              className="inline-flex items-center px-6 py-3 bg-accent-cyan text-white font-medium rounded-lg hover:bg-cyan-600 transition-colors focus-visible:ring-2 focus-visible:ring-cyan-400"
            >
              Browse Aircraft
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {bookings.map(booking => (
              <div
                key={booking.id}
                className="bg-panel rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow"
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex items-center gap-4">
                    {booking.aircraft.images && booking.aircraft.images.length > 0 ? (
                      <img
                        src={booking.aircraft.images[0].url}
                        alt={booking.aircraft.name}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-20 h-20 bg-slate-800 rounded-lg flex items-center justify-center">
                        <span className="text-slate-500 text-xs">No Image</span>
                      </div>
                    )}
                    <div>
                      <h3 className="text-xl font-semibold text-white">
                        {booking.aircraft.name}
                      </h3>
                      <p className="text-slate-400 text-sm">{booking.aircraft.category}</p>
                    </div>
                  </div>

                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1 bg-slate-800/50 rounded text-slate-300">
                        {formatDate(booking.startDate)}
                      </span>
                      <span className="text-slate-500">to</span>
                      <span className="px-3 py-1 bg-slate-800/50 rounded text-slate-300">
                        {formatDate(booking.endDate)}
                      </span>
                    </div>

                    <span className={`px-3 py-1 rounded text-xs font-medium ${getStatusColor(booking.status)}`}>
                      {booking.status}
                    </span>

                    {booking.totalPrice && (
                      <span className="text-lg font-semibold text-accent-cyan">
                        ${booking.totalPrice.toLocaleString()}
                      </span>
                    )}

                    <div className="flex gap-2">
                      {booking.status.toLowerCase() === 'pending' && (
                        <button
                          onClick={() => fetchAircraft(booking.aircraftId)}
                          className="px-4 py-2 bg-slate-700 text-white text-sm rounded-lg hover:bg-slate-600 transition-colors"
                        >
                          Edit
                        </button>
                      )}
                      {booking.status.toLowerCase() !== 'cancelled' && (
                        <button
                          onClick={() => cancelBooking(booking.id)}
                          className="px-4 py-2 bg-red-600/20 text-red-400 text-sm rounded-lg hover:bg-red-600/30 transition-colors"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Booking Modal */}
      {showBookingModal && selectedAircraft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-panel rounded-lg p-8 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-white">
                Book {selectedAircraft.name}
              </h2>
              <button
                onClick={() => {
                  setShowBookingModal(false);
                  setFormData({ startDate: '', endDate: '', notes: '' });
                }}
                className="text-slate-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                createBooking(selectedAircraft.id);
              }}
              className="space-y-4"
            >
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-slate-300 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  value={formData.startDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                  required
                  className="w-full p-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-accent-cyan"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-slate-300 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  id="endDate"
                  name="endDate"
                  value={formData.endDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                  required
                  className="w-full p-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-accent-cyan"
                  min={formData.startDate || new Date().toISOString().split('T')[0]}
                />
              </div>

              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-slate-300 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  placeholder="Special requests or notes..."
                  className="w-full p-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-accent-cyan resize-none"
                />
              </div>

              <div className="flex justify-end gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowBookingModal(false);
                    setFormData({ startDate: '', endDate: '', notes: '' });
                  }}
                  className="px-6 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-accent-cyan text-white font-medium rounded-lg hover:bg-cyan-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Creating...' : 'Create Booking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
