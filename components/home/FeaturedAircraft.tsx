'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface AircraftImage {
  url: string;
}

interface Aircraft {
  id: string;
  slug: string;
  name: string;
  isConcept: boolean;
  era: string;
  topSpeedKmh: number;
  serviceCeilingFt: number;
  maxRangeNm: number;
  coverImage: AircraftImage | null;
  tags: string[];
}

interface AircraftResponse {
  data: Aircraft[];
  total: number;
  page: number;
  totalPages: number;
}

export function FeaturedAircraft() {
  const [aircraft, setAircraft] = useState<Aircraft | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFeaturedAircraft = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/aircraft?pageSize=1');
        if (!response.ok) {
          throw new Error('Failed to fetch featured aircraft');
        }
        const data: AircraftResponse = await response.json();
        setAircraft(data.data[0] || null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load featured aircraft');
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedAircraft();
  }, []);

  const formatEra = (era: string) => {
    const eraMap: Record<string, string> = {
      PIONEER: 'Pioneer',
      WWII: 'WWII',
      JET_AGE: 'Jet Age',
      MODERN: 'Modern',
    };
    return eraMap[era] || era;
  };

  const formatSpeed = (speed: number) => {
    const machSpeeds = [2550, 2179, 3540, 2414, 1540];
    if (machSpeeds.includes(speed)) {
      return `${speed} km/h (approx.)`;
    }
    return `${speed} km/h`;
  };

  if (loading) {
    return (
      <div className="bg-panel rounded-lg overflow-hidden animate-pulse">
        <div className="aspect-video bg-slate-700/50" />
        <div className="p-4 space-y-2">
          <div className="h-4 bg-slate-700/50 rounded w-3/4" />
          <div className="h-3 bg-slate-700/50 rounded w-1/2" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 text-red-400">
        <p className="font-medium mb-2">Error Loading Featured Aircraft</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  if (!aircraft) {
    return (
      <div className="bg-panel rounded-lg p-4 text-center text-slate-400">
        No featured aircraft available
      </div>
    );
  }

  return (
    <div className="bg-panel rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div className="relative aspect-video bg-slate-700/50">
        {aircraft.coverImage && !aircraft.coverImage.url.startsWith('TODO_VERIFY_') ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={aircraft.coverImage.url}
            alt={`Featured aircraft: ${aircraft.name}`}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-800/50">
            <svg
              className="w-16 h-16 text-slate-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          </div>
        )}
        
        {aircraft.isConcept && (
          <span className="absolute top-3 left-3 px-2 py-1 bg-amber-500/20 text-amber-400 text-xs font-medium rounded-full border border-amber-500/30">
            Concept
          </span>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <span className="text-xl font-bold text-white">Featured Aircraft</span>
          <span className="text-xs text-slate-400 bg-slate-700/50 px-2 py-0.5 rounded-full">
            {formatEra(aircraft.era)}
          </span>
        </div>

        <h2 className="text-lg text-slate-200 mb-2">{aircraft.name}</h2>
        
        <div className="flex items-center justify-between text-sm">
          <div className="text-slate-300">{formatSpeed(aircraft.topSpeedKmh)}</div>
          <Link
            href={`/fleet/${aircraft.slug}`}
            className="text-accent-cyan hover:text-cyan-300 transition-colors font-medium"
          >
            View Details &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
