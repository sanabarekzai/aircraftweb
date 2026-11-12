'use client';

import { useState, useEffect, useCallback } from 'react';
import { Heart } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/lib/toast';

interface FavoriteButtonProps {
  aircraftId: string;
  initialIsFavorite: boolean;
}

export function FavoriteButton({ aircraftId, initialIsFavorite }: FavoriteButtonProps) {
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite);
  const [isLoading, setIsLoading] = useState(false);
  const { user, openAuthModal } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    setIsFavorite(initialIsFavorite);
  }, [initialIsFavorite]);

  const handleFavoriteToggle = useCallback(async () => {
    if (!user) {
      openAuthModal();
      return;
    }

    setIsLoading(true);
    try {
      if (isFavorite) {
        // Delete favorite
        const response = await fetch(`/api/favorites?aircraftId=${aircraftId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          setIsFavorite(false);
          showToast('Removed from favorites', 'info');
        } else {
          throw new Error('Failed to remove favorite');
        }
      } else {
        // Add favorite
        const response = await fetch('/api/favorites', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ aircraftId }),
        });

        if (response.ok) {
          setIsFavorite(true);
          showToast('Added to favorites!', 'success');
        } else {
          const error = await response.json();
          if (error.error?.code === 'CONFLICT') {
            setIsFavorite(true);
            showToast('Already in favorites', 'info');
          } else {
            throw new Error('Failed to add favorite');
          }
        }
      }
    } catch {
      showToast('Failed to update favorites', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [isFavorite, aircraftId, user, openAuthModal, showToast]);

  return (
    <button
      onClick={handleFavoriteToggle}
      disabled={isLoading}
      aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
      className={`p-2 rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-accent-cyan focus-visible:outline-none ${
        isFavorite
          ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
          : 'bg-slate-700/50 text-slate-400 hover:bg-slate-600/50 hover:text-white'
      }`}
    >
      <Heart
        className={`w-6 h-6 transition-transform ${isFavorite ? 'fill-current' : ''}`}
      />
    </button>
  );
}
