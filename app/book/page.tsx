'use client';

import { aircraftSpeedLabel } from '@/lib/aircraft-spec-notes';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/lib/toast';

interface Aircraft {
  id: string;
  slug: string;
  name: string;
  category: string;
  topSpeedKmh: number | null;
  maxRangeNm: number | null;
  images: { url: string }[];
}

export default function BookPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading, openAuthModal } = useAuth();
  const { showToast } = useToast();

  const [aircraft, setAircraft] = useState<Aircraft | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Get aircraftId from URL
  const aircraftId = searchParams.get('aircraftId');

  // Fetch aircraft details
  useEffect(() => {
    if (!aircraftId) {
      showToast('No aircraft selected', 'error');
      router.push('/fleet');
      return;
    }

    const fetchAircraft = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/aircraft/${aircraftId}`);
        if (response.ok) {
          const data = await response.json();
          setAircraft(data.aircraft);
        } else {
          showToast('Aircraft not found', 'error');
          router.push('/fleet');
        }
      } catch (error) {
        console.error('Failed to fetch aircraft:', error);
        showToast('Failed to load aircraft', 'error');
        router.push('/fleet');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAircraft();
  }, [aircraftId, router, showToast]);

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      openAuthModal();
    }
  }, [user, loading, openAuthModal]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    }

    if (!formData.endDate) {
      newErrors.endDate = 'End date is required';
    } else if (formData.startDate && new Date(formData.endDate) <= new Date(formData.startDate)) {
      newErrors.endDate = 'End date must be after start date';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      showToast('Please fix the errors in the form', 'error');
      return;
    }

    if (!aircraftId) {
      showToast('No aircraft selected', 'error');
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
        if (data.error?.fieldErrors) {
          setErrors(data.error.fieldErrors);
        }
        showToast(data.error?.message || 'Failed to create booking', 'error');
        return;
      }

      showToast('Booking created successfully!', 'success');
      router.push('/bookings');
    } catch (error) {
      console.error('Create booking error:', error);
      showToast('Failed to create booking', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-900 text-slate-100 p-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="animate-pulse">
            <div className="h-10 w-64 bg-slate-700/50 rounded mb-4 mx-auto"></div>
            <div className="h-6 w-48 bg-slate-700/50 rounded mx-auto"></div>
          </div>
        </div>
      </main>
    );
  }

  if (!aircraft) {
    return (
      <main className="min-h-screen bg-slate-900 text-slate-100 p-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl font-bold mb-4">Aircraft Not Found</h1>
          <Link
            href="/fleet"
            className="inline-flex items-center px-6 py-3 bg-accent-cyan text-white font-medium rounded-lg hover:bg-cyan-600 transition-colors"
          >
            Browse Aircraft
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-900 text-slate-100 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Breadcrumb */}
        <nav className="text-sm text-slate-400 mb-6" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-accent-cyan transition-colors">
            Home
          </Link>
          <span className="mx-2">&rsaquo;</span>
          <Link href="/fleet" className="hover:text-accent-cyan transition-colors">
            Fleet
          </Link>
          <span className="mx-2">&rsaquo;</span>
          <Link
            href={`/fleet/${aircraft.slug}`}
            className="hover:text-accent-cyan transition-colors"
          >
            {aircraft.name}
          </Link>
          <span className="mx-2">&rsaquo;</span>
          <span className="text-white">Book</span>
        </nav>

        <h1 className="text-3xl font-bold mb-8">Book {aircraft.name}</h1>

        <div className="bg-panel rounded-lg p-8 shadow-lg">
          {/* Aircraft Info */}
          <div className="flex flex-col lg:flex-row gap-8 mb-8">
            {aircraft.images && aircraft.images.length > 0 ? (
              <img
                src={aircraft.images[0].url}
                alt={aircraft.name}
                className="w-full lg:w-64 h-48 object-cover rounded-lg"
              />
            ) : (
              <div className="w-full lg:w-64 h-48 bg-slate-800 rounded-lg flex items-center justify-center">
                <span className="text-slate-500">No Image</span>
              </div>
            )}

            <div className="flex-1">
              <h2 className="text-2xl font-semibold text-white mb-2">{aircraft.name}</h2>
              <p className="text-slate-400 mb-4">{aircraft.category}</p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-500">Top Speed:</span>
                  <span className="text-white ml-2">{aircraftSpeedLabel(aircraft.slug, aircraft.topSpeedKmh)}</span>
                </div>
                <div>
                  <span className="text-slate-500">Range:</span>
                  <span className="text-white ml-2">{aircraft.maxRangeNm == null ? 'Not disclosed' : `${aircraft.maxRangeNm} nm`}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Booking Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <h2 className="text-xl font-semibold text-white pt-4 border-t border-slate-700">
              Booking Details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-slate-300 mb-2">
                  Start Date *
                </label>
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  value={formData.startDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                  required
                  className={`w-full p-3 bg-slate-800/50 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-accent-cyan ${
                    errors.startDate ? 'border-red-500' : 'border-slate-700'
                  }`}
                  min={new Date().toISOString().split('T')[0]}
                />
                {errors.startDate && (
                  <p className="mt-1 text-sm text-red-400">{errors.startDate}</p>
                )}
              </div>

              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-slate-300 mb-2">
                  End Date *
                </label>
                <input
                  type="date"
                  id="endDate"
                  name="endDate"
                  value={formData.endDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                  required
                  className={`w-full p-3 bg-slate-800/50 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-accent-cyan ${
                    errors.endDate ? 'border-red-500' : 'border-slate-700'
                  }`}
                  min={formData.startDate || new Date().toISOString().split('T')[0]}
                />
                {errors.endDate && (
                  <p className="mt-1 text-sm text-red-400">{errors.endDate}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-slate-300 mb-2">
                Special Requests (Optional)
              </label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
                placeholder="Any special requests or notes..."
                className="w-full p-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-accent-cyan resize-none"
              />
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <Link
                href={`/fleet/${aircraft.slug}`}
                className="px-6 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-accent-cyan text-white font-medium rounded-lg hover:bg-cyan-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-cyan-400"
              >
                {isSubmitting ? 'Creating Booking...' : 'Create Booking'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
