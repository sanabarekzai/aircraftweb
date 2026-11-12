'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/lib/toast';

interface RatingWidgetProps {
  aircraftId: string;
  initialRating: number | null;
  avgRating: number;
  totalRatings: number;
  onRate: (stars: number) => Promise<void>;
}

export function RatingWidget({
  initialRating,
  avgRating,
  totalRatings,
  onRate,
}: RatingWidgetProps) {
  const [rating, setRating] = useState<number | null>(initialRating);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { user, openAuthModal } = useAuth();
  const { showToast } = useToast();

  const handleRate = async (stars: number) => {
    if (!user) {
      openAuthModal();
      return;
    }

    setIsLoading(true);
    try {
      await onRate(stars);
      setRating(stars);
      showToast('Rating saved!', 'success');
    } catch {
      showToast('Failed to save rating', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const displayRating = hoverRating !== null ? hoverRating : rating;

  return (
    <div className="bg-panel rounded-lg p-6 mb-8">
      <h2 className="text-xl font-semibold text-white mb-4">Rate This Aircraft</h2>

      <div className="flex items-center gap-2 mb-4">
        {Array.from({ length: 5 }, (_, i) => {
          const starValue = i + 1;
          const filled = starValue <= (displayRating || 0);

          return (
            <button
              key={starValue}
              onClick={() => handleRate(starValue)}
              onMouseEnter={() => setHoverRating(starValue)}
              onMouseLeave={() => setHoverRating(null)}
              disabled={isLoading}
              className={`transition-colors focus-visible:ring-2 focus-visible:ring-accent-cyan focus-visible:outline-none ${
                filled
                  ? 'text-amber-400'
                  : 'text-slate-500 hover:text-amber-300'
              }`}
              aria-label={`Rate ${starValue} stars`}
            >
              <Star
                className={`w-8 h-8 ${filled ? 'fill-current' : ''}`}
              />
            </button>
          );
        })}
      </div>

      {rating !== null && (
        <p className="text-slate-300 text-sm">
          Your rating: {rating} star{rating !== 1 ? 's' : ''}
        </p>
      )}

      {totalRatings > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-700/50">
          <p className="text-slate-400 text-sm">
            Average: {avgRating.toFixed(1)} ({totalRatings} rating{totalRatings !== 1 ? 's' : ''})
          </p>
        </div>
      )}
    </div>
  );
}
