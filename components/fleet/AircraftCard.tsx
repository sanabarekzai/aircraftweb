'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Heart } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/lib/toast';

interface AircraftCardProps {
  id: string;
  slug: string;
  name: string;
  isConcept: boolean;
  era: string;
  topSpeedKmh: number;
  coverImage: { url: string } | null;
  tags: string[];
  isFavorite: boolean;
  onFavoriteToggle: (aircraftId: string) => Promise<void>;
}

export function AircraftCard({
  id,
  slug,
  name,
  isConcept,
  era,
  topSpeedKmh,
  coverImage,
  tags,
  isFavorite,
  onFavoriteToggle,
}: AircraftCardProps) {
  const [favorite, setFavorite] = useState(isFavorite);
  const [isLoading, setIsLoading] = useState(false);
  const { user, openAuthModal } = useAuth();
  const { showToast } = useToast();

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (!user) {
      openAuthModal();
      return;
    }

    setIsLoading(true);
    try {
      await onFavoriteToggle(id);
      setFavorite(!favorite);
      showToast(
        !favorite ? 'Added to favorites!' : 'Removed from favorites',
        !favorite ? 'success' : 'info'
      );
    } catch {
      showToast('Failed to update favorites', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Format speed with approx if needed
  const formatSpeed = () => {
    // Check if it's a Mach-derived speed (from spec: Phantom 3500, Concorde, SR-71, F-22, Bell X-1)
    const machSpeeds = [2550, 2179, 3540, 2414, 1540];
    if (machSpeeds.includes(topSpeedKmh)) {
      return `${topSpeedKmh} km/h (approx.)`;
    }
    return `${topSpeedKmh} km/h`;
  };

  // Format era for display
  const formatEra = () => {
    const eraMap: Record<string, string> = {
      PIONEER: 'Pioneer',
      WWII: 'WWII',
      JET_AGE: 'Jet Age',
      MODERN: 'Modern',
    };
    return eraMap[era] || era;
  };

  return (
    <div className="bg-panel rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 group">
      <div className="relative aspect-video bg-slate-700/50">
        {coverImage && !coverImage.url.startsWith('TODO_VERIFY_') ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverImage.url}
            alt={`Aircraft ${name}`}
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

        <button
          onClick={handleFavoriteClick}
          disabled={isLoading}
          aria-label={favorite ? 'Remove from favorites' : 'Add to favorites'}
          className={`absolute top-3 right-3 p-2 rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-accent-cyan focus-visible:outline-none ${
            favorite
              ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
              : 'bg-slate-700/50 text-slate-400 hover:bg-slate-600/50 hover:text-white'
          }`}
        >
          <Heart
            className={`w-5 h-5 transition-transform ${favorite ? 'fill-current' : ''}`}
          />
        </button>

        {isConcept && (
          <span className="absolute top-3 left-3 px-2 py-1 bg-amber-500/20 text-amber-400 text-xs font-medium rounded-full border border-amber-500/30">
            Concept
          </span>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <Link
            href={`/fleet/${slug}`}
            className="text-white font-semibold hover:text-accent-cyan transition-colors truncate"
          >
            {name}
          </Link>
          <span className="text-xs text-slate-400 bg-slate-700/50 px-2 py-0.5 rounded-full">
            {formatEra()}
          </span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="text-slate-300">{formatSpeed()}</div>
          <div className="flex flex-wrap gap-1">
            {tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="text-xs text-slate-400 bg-slate-700/50 px-2 py-0.5 rounded"
              >
                {tag}
              </span>
            ))}
            {tags.length > 2 && (
              <span className="text-xs text-slate-500">+{tags.length - 2} more</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
