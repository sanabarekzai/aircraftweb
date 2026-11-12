'use client';

import { useState, useEffect, useCallback } from 'react';
import { notFound } from 'next/navigation';
import { MediaViewer } from '@/components/detail/MediaViewer';
import { SpecAccordions } from '@/components/detail/SpecAccordions';
import { RatingWidget } from '@/components/detail/RatingWidget';
import { NotesModule } from '@/components/detail/NotesModule';
import { FavoriteButton } from '@/components/detail/FavoriteButton';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/lib/toast';

interface AircraftImage {
  id: string;
  url: string;
  caption: string | null;
  source: string;
  license: string;
}

interface AircraftDetail {
  id: string;
  slug: string;
  name: string;
  isConcept: boolean;
  category: string;
  era: string;
  releaseYear: number | null;
  topSpeedKmh: number;
  serviceCeilingFt: number;
  maxRangeNm: number;
  wingspanM: number;
  maxTakeoffWeightLbs: number;
  stallSpeedKts: number;
  liftToDragRatio: number;
  engineType: string;
  description: string;
  flightControlsDescription: string;
  youtubeId: string;
  images: AircraftImage[];
  tags: string[];
  avgRating: number;
  totalRatings: number;
}

function formatEra(era: string) {
  const eraMap: Record<string, string> = {
    PIONEER: 'Pioneer',
    WWII: 'WWII',
    JET_AGE: 'Jet Age',
    MODERN: 'Modern',
  };
  return eraMap[era] || era;
}

function formatCategory(category: string) {
  const categoryMap: Record<string, string> = {
    GENERAL_AVIATION: 'General Aviation',
    COMMERCIAL_AIRLINER: 'Commercial Airliner',
    MILITARY: 'Military',
    SUPERSONIC: 'Supersonic',
    EXPERIMENTAL: 'Experimental',
  };
  return categoryMap[category] || category;
}

export default function AircraftDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const [aircraft, setAircraft] = useState<AircraftDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const { user } = useAuth();
  const { showToast } = useToast();

  const fetchUserRating = useCallback(async (aircraftId: string) => {
    try {
      const response = await fetch(`/api/ratings?aircraftId=${aircraftId}`);
      if (response.ok) {
        const data = await response.json();
        setUserRating(data.userRating?.stars || null);
      }
    } catch {
      // Error is already logged in the console
    }
  }, []);

  const fetchFavoriteStatus = useCallback(async (aircraftId: string) => {
    try {
      const response = await fetch('/api/favorites');
      if (response.ok) {
        const data = await response.json();
        const isFav = data.favorites.some(
          (f: { aircraftId: string }) => f.aircraftId === aircraftId
        );
        setIsFavorite(isFav);
      }
    } catch {
      // Error is already logged in the console
    }
  }, []);

  useEffect(() => {
    async function fetchAircraft() {
      try {
        const { slug } = await params;
        const response = await fetch(`/api/aircraft/${slug}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            notFound();
          }
          throw new Error('Failed to fetch aircraft');
        }

        const data = await response.json();
        setAircraft(data.aircraft as AircraftDetail);
        
        // Fetch user's rating and favorite status if logged in
        if (user) {
          fetchUserRating(data.aircraft.id);
          fetchFavoriteStatus(data.aircraft.id);
        }
      } catch {
        // Error is already logged in the console
      } finally {
        setIsLoading(false);
      }
    }

    fetchAircraft();
  }, [params, user, fetchUserRating, fetchFavoriteStatus]);

  const handleRate = useCallback(async (stars: number) => {
    if (!aircraft) return;
    
    try {
      const response = await fetch('/api/ratings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          aircraftId: aircraft.id,
          stars,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setUserRating(data.rating.stars);
        // Update the average rating in the aircraft state
        setAircraft({
          ...aircraft,
          avgRating: data.newAverage,
          totalRatings: aircraft.totalRatings + (userRating === null ? 1 : 0),
        });
        showToast('Rating saved!', 'success');
      } else {
        const error = await response.json();
        showToast(error.error?.message || 'Failed to save rating', 'error');
      }
    } catch {
      showToast('Failed to save rating', 'error');
    }
  }, [aircraft, userRating, showToast]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-space">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-10 w-64 bg-slate-700/50 rounded mb-4"></div>
            <div className="h-6 w-48 bg-slate-700/50 rounded mb-8"></div>
            <div className="h-96 bg-slate-800/50 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!aircraft) {
    return notFound();
  }

  return (
    <div className="min-h-screen bg-space">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
          <span className="text-white">{aircraft.name}</span>
        </nav>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{aircraft.name}</h1>
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-300">
                  {formatCategory(aircraft.category)}
                </span>
                <span className="text-slate-500">&bull;</span>
                <span className="text-sm text-slate-300">{formatEra(aircraft.era)}</span>
                {aircraft.isConcept && (
                  <>
                    <span className="text-slate-500">&bull;</span>
                    <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">
                      Concept
                    </span>
                  </>
                )}
              </div>
            </div>
            <FavoriteButton aircraftId={aircraft.id} initialIsFavorite={isFavorite} />
          </div>

          {/* Rating Summary */}
          {aircraft.totalRatings > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <div className="flex text-amber-400">
                {'\u2605'.repeat(Math.floor(aircraft.avgRating))}
                {'\u2606'.repeat(5 - Math.floor(aircraft.avgRating))}
              </div>
              <span className="text-slate-400">
                ({aircraft.avgRating.toFixed(1)} - {aircraft.totalRatings} rating{aircraft.totalRatings !== 1 ? 's' : ''})
              </span>
            </div>
          )}

          {/* Description */}
          <p className="text-slate-300 mt-4 max-w-3xl">{aircraft.description}</p>
        </div>

        {/* Media Viewer */}
        <MediaViewer youtubeId={aircraft.youtubeId} images={aircraft.images} />

        {/* Rating Widget */}
        <RatingWidget
          aircraftId={aircraft.id}
          initialRating={userRating}
          avgRating={aircraft.avgRating}
          totalRatings={aircraft.totalRatings}
          onRate={handleRate}
        />

        {/* Notes Module */}
        <NotesModule aircraftId={aircraft.id} />

        {/* Specifications */}
        <SpecAccordions
          airframeSpecs={{
            topSpeedKmh: aircraft.topSpeedKmh,
            serviceCeilingFt: aircraft.serviceCeilingFt,
            maxRangeNm: aircraft.maxRangeNm,
            wingspanM: aircraft.wingspanM,
            maxTakeoffWeightLbs: aircraft.maxTakeoffWeightLbs,
            stallSpeedKts: aircraft.stallSpeedKts,
            liftToDragRatio: aircraft.liftToDragRatio,
          }}
          engineSpecs={{
            engineType: aircraft.engineType,
            description: aircraft.description,
          }}
          aerodynamics={{
            liftToDragRatio: aircraft.liftToDragRatio,
            description: aircraft.description,
          }}
          flightControls={{
            description: aircraft.flightControlsDescription,
          }}
        />

        {/* Tags */}
        {aircraft.tags.length > 0 && (
          <div className="bg-panel rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Tags</h2>
            <div className="flex flex-wrap gap-2">
              {aircraft.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-slate-700/50 text-slate-300 rounded-full text-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Release Year */}
        {aircraft.releaseYear && (
          <div className="mt-8 p-4 bg-slate-800/50 rounded-lg">
            <p className="text-center text-slate-400">
              Released: {aircraft.releaseYear}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
