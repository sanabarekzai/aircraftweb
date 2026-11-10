'use client';

import { Suspense, useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { FleetFilters } from '@/components/fleet/FleetFilters';
import { AircraftCard } from '@/components/fleet/AircraftCard';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/lib/toast';
import Link from 'next/link';
import { Search } from 'lucide-react';

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
  coverImage: AircraftImage | null;
  tags: string[];
}

interface AircraftResponse {
  data: Aircraft[];
  total: number;
  page: number;
  totalPages: number;
}

function FleetContent() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [aircraftData, setAircraftData] = useState<AircraftResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [allTags, setAllTags] = useState<string[]>([]);

  // State for filters (client-side)
  const [search, setSearch] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [eras, setEras] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [sort, setSort] = useState('speed_desc');
  const [page, setPage] = useState(1);

  // Fetch all tags
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const response = await fetch('/api/aircraft?pageSize=1');
        if (response.ok) {
          const data = await response.json();
          const uniqueTags = new Set<string>();
          data.data.forEach((a: Aircraft) => {
            a.tags?.forEach((tag: string) => uniqueTags.add(tag));
          });
          setAllTags(Array.from(uniqueTags).sort());
        }
      } catch {
        // Silent fail
      }
    };
    fetchTags();
  }, []);

  // Fetch favorites
  useEffect(() => {
    if (user) {
      const fetchFavorites = async () => {
        try {
          const response = await fetch('/api/favorites');
          if (response.ok) {
            const data = await response.json();
            setFavorites(new Set(data.favorites.map((f: { aircraftId: string }) => f.aircraftId)));
          }
        } catch {
          // Silent fail
        }
      };
      fetchFavorites();
    }
  }, [user]);

  // Fetch aircraft data
  useEffect(() => {
    const fetchAircraft = async () => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (categories.length > 0) params.append('category', categories.join(','));
        if (eras.length > 0) params.append('era', eras.join(','));
        if (tags.length > 0) params.append('tag', tags.join(','));
        if (sort) params.append('sort', sort);
        params.append('page', page.toString());
        params.append('pageSize', '12');

        const response = await fetch(`/api/aircraft?${params.toString()}`);
        if (!response.ok) {
          throw new Error('Failed to fetch aircraft');
        }
        const data = await response.json();
        setAircraftData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load aircraft');
      } finally {
        setLoading(false);
      }
    };

    // Debounce fetch
    const timer = setTimeout(fetchAircraft, 300);
    return () => clearTimeout(timer);
  }, [search, categories, eras, tags, sort, page]);

  const handleFavoriteToggle = async (aircraftId: string) => {
    if (!user) {
      showToast('Please login to add favorites', 'info');
      return;
    }

    try {
      const isFavorite = favorites.has(aircraftId);
      const response = isFavorite
        ? await fetch(`/api/favorites?aircraftId=${aircraftId}`, { method: 'DELETE' })
        : await fetch('/api/favorites', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ aircraftId }),
          });

      if (response.ok) {
        setFavorites((prev) => {
          const newFavorites = new Set(prev);
          if (isFavorite) {
            newFavorites.delete(aircraftId);
          } else {
            newFavorites.add(aircraftId);
          }
          return newFavorites;
        });
        showToast(
          isFavorite ? 'Removed from favorites' : 'Added to favorites!',
          isFavorite ? 'info' : 'success'
        );
      }
    } catch {
      showToast('Failed to update favorites', 'error');
    }
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-white">Aircraft Fleet</h1>
        <Link
          href="/"
          className="text-sm text-slate-400 hover:text-accent-cyan transition-colors"
        >
          &larr; Back to Home
        </Link>
      </div>

      <FleetFilters
        search={search}
        selectedCategories={categories}
        selectedEras={eras}
        selectedTags={tags}
        sort={sort}
        onSearchChange={setSearch}
        onCategoryChange={setCategories}
        onEraChange={setEras}
        onTagChange={setTags}
        onSortChange={setSort}
        allTags={allTags}
      />

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="bg-panel rounded-lg overflow-hidden animate-pulse"
            >
              <div className="aspect-video bg-slate-700/50" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-slate-700/50 rounded w-3/4" />
                <div className="h-3 bg-slate-700/50 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 text-red-400">
          {error}
        </div>
      ) : aircraftData?.data.length === 0 ? (
        <div className="bg-panel rounded-lg p-12 text-center">
          <svg
            className="w-16 h-16 mx-auto text-slate-500 mb-4"
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
          <h2 className="text-xl font-semibold text-white mb-2">No Aircraft Found</h2>
          <p className="text-slate-400 mb-4">
            Try adjusting your filters or search criteria.
          </p>
          <button
            onClick={() => {
              setSearch('');
              setCategories([]);
              setEras([]);
              setTags([]);
              setSort('speed_desc');
              setPage(1);
            }}
            className="px-4 py-2 bg-accent-cyan hover:bg-accent-cyan/90 text-white rounded-md transition-colors"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {aircraftData?.data.map((aircraft) => (
              <AircraftCard
                key={aircraft.id}
                id={aircraft.id}
                slug={aircraft.slug}
                name={aircraft.name}
                isConcept={aircraft.isConcept}
                era={aircraft.era}
                topSpeedKmh={aircraft.topSpeedKmh}
                coverImage={aircraft.coverImage}
                tags={aircraft.tags || []}
                isFavorite={favorites.has(aircraft.id)}
                onFavoriteToggle={handleFavoriteToggle}
              />
            ))}
          </div>

          {aircraftData && aircraftData.totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-4">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page <= 1}
                className="px-4 py-2 bg-slate-700/50 hover:bg-slate-600/50 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-md transition-colors focus-visible:ring-2 focus-visible:ring-accent-cyan focus-visible:outline-none"
                aria-label="Previous page"
              >
                Prev
              </button>
              <span className="text-slate-300">
                Page {page} of {aircraftData.totalPages}
              </span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page >= aircraftData.totalPages}
                className="px-4 py-2 bg-slate-700/50 hover:bg-slate-600/50 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-md transition-colors focus-visible:ring-2 focus-visible:ring-accent-cyan focus-visible:outline-none"
                aria-label="Next page"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </>
  );
}

export default function FleetPage() {
  return (
    <div className="min-h-screen bg-space">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Suspense fallback={<div className="text-white">Loading...</div>}>
          <FleetContent />
        </Suspense>
      </div>
    </div>
  );
}
