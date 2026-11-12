'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Aircraft {
  id: string;
  slug: string;
  name: string;
  topSpeedKmh: number;
}

interface AircraftResponse {
  data: Aircraft[];
  total: number;
  page: number;
  totalPages: number;
}

export function TopSpeedsLeaderboard() {
  const [aircraft, setAircraft] = useState<Aircraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTopSpeeds = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/aircraft?sort=speed_desc&pageSize=3');
        if (!response.ok) {
          throw new Error('Failed to fetch top speeds');
        }
        const data: AircraftResponse = await response.json();
        setAircraft(data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load top speeds');
      } finally {
        setLoading(false);
      }
    };

    fetchTopSpeeds();
  }, []);

  const formatSpeed = (speed: number) => {
    // Mach-derived speeds from spec
    const machSpeeds = [3540, 2550, 2414, 2179, 1540];
    if (machSpeeds.includes(speed)) {
      return `${speed} km/h (approx.)`;
    }
    return `${speed} km/h`;
  };

  if (loading) {
    return (
      <div className="bg-panel rounded-lg p-4 space-y-3">
        <h2 className="text-lg font-semibold text-white mb-3">Top Speeds Leaderboard</h2>
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-6 h-6 bg-slate-700/50 rounded-full flex items-center justify-center text-sm font-bold text-slate-400">
              {i}
            </div>
            <div className="flex-1 space-y-1">
              <div className="h-3 bg-slate-700/50 rounded w-3/4" />
              <div className="h-2 bg-slate-700/50 rounded w-1/2" />
            </div>
            <div className="h-3 bg-slate-700/50 rounded w-16" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 text-red-400">
        <p className="font-medium mb-2">Error Loading Top Speeds</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-panel rounded-lg p-4">
      <h2 className="text-lg font-semibold text-white mb-4">Top Speeds Leaderboard</h2>
      
      <div className="space-y-3">
        {aircraft.map((a, index) => (
          <Link
            key={a.id}
            href={`/fleet/${a.slug}`}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-700/50 transition-colors group"
          >
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold bg-accent-cyan/20 text-accent-cyan group-hover:bg-accent-cyan/30 transition-colors">
              {index + 1}
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-medium truncate">{a.name}</h3>
              <p className="text-xs text-slate-400">
                {a.slug.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
              </p>
            </div>
            
            <div className="text-right">
              <p className="text-white font-mono font-bold">{formatSpeed(a.topSpeedKmh)}</p>
              <p className="text-xs text-slate-400">Max Speed</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
