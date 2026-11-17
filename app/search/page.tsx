'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

interface Aircraft {
  id: string;
  slug: string;
  name: string;
  category: string;
  era: string;
  topSpeedKmh: number | null;
  maxRangeNm: number | null;
  releaseYear: number | null;
  tags: { name: string }[];
  images: { url: string }[];
}

interface SearchFilters {
  query: string;
  category: string;
  era: string;
  minSpeed: number | '';
  maxSpeed: number | '';
  minRange: number | '';
  tag: string;
}

const CATEGORIES = ['ALL', 'EXPERIMENTAL', 'SUPERSONIC', 'MILITARY', 'COMMERCIAL', 'GENERAL_AVIATION'];
const ERAS = ['ALL', 'EARLY', 'GOLDEN_AGE', 'JET_AGE', 'MODERN'];

export default function SearchPage() {
  const { user } = useAuth();
  const [aircraft, setAircraft] = useState<Aircraft[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    category: 'ALL',
    era: 'ALL',
    minSpeed: '',
    maxSpeed: '',
    minRange: '',
    tag: '',
  });
  const [availableTags, setAvailableTags] = useState<string[]>([]);

  // Fetch available tags
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const response = await fetch('/api/aircraft/tags');
        if (response.ok) {
          const data = await response.json();
          setAvailableTags(data.tags || []);
        }
      } catch (error) {
        console.error('Failed to fetch tags:', error);
      }
    };
    fetchTags();
  }, []);

  // Fetch aircraft with filters
  const fetchAircraft = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      
      if (filters.query) params.append('query', filters.query);
      if (filters.category !== 'ALL') params.append('category', filters.category);
      if (filters.era !== 'ALL') params.append('era', filters.era);
      if (filters.minSpeed) params.append('minSpeed', filters.minSpeed.toString());
      if (filters.maxSpeed) params.append('maxSpeed', filters.maxSpeed.toString());
      if (filters.minRange) params.append('minRange', filters.minRange.toString());
      if (filters.tag) params.append('tag', filters.tag);

      const response = await fetch(`/api/aircraft/search?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setAircraft(data.aircraft || []);
      }
    } catch (error) {
      console.error('Failed to search aircraft:', error);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchAircraft();
  }, [fetchAircraft]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleReset = () => {
    setFilters({
      query: '',
      category: 'ALL',
      era: 'ALL',
      minSpeed: '',
      maxSpeed: '',
      minRange: '',
      tag: '',
    });
  };

  const getImageUrl = (aircraft: Aircraft) => {
    if (aircraft.images && aircraft.images.length > 0) {
      return aircraft.images[0].url;
    }
    return '/placeholder-aircraft.jpg';
  };

  return (
    <main className="min-h-screen bg-slate-900 text-slate-100 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Search Aircraft</h1>

        {/* Search Filters */}
        <div className="bg-panel rounded-lg p-6 mb-8 shadow-lg">
          <h2 className="text-xl font-semibold mb-6">Filters</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Search Query */}
            <div>
              <label htmlFor="query" className="block text-sm font-medium text-slate-300 mb-2">
                Search
              </label>
              <input
                type="text"
                id="query"
                name="query"
                value={filters.query}
                onChange={handleFilterChange}
                placeholder="Aircraft name..."
                className="w-full p-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-accent-cyan focus:border-transparent"
              />
            </div>

            {/* Category */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-slate-300 mb-2">
                Category
              </label>
              <select
                id="category"
                name="category"
                value={filters.category}
                onChange={handleFilterChange}
                className="w-full p-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-accent-cyan focus:border-transparent"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat} className="bg-slate-800">
                    {cat.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>

            {/* Era */}
            <div>
              <label htmlFor="era" className="block text-sm font-medium text-slate-300 mb-2">
                Era
              </label>
              <select
                id="era"
                name="era"
                value={filters.era}
                onChange={handleFilterChange}
                className="w-full p-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-accent-cyan focus:border-transparent"
              >
                {ERAS.map(era => (
                  <option key={era} value={era} className="bg-slate-800">
                    {era.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>

            {/* Min Speed */}
            <div>
              <label htmlFor="minSpeed" className="block text-sm font-medium text-slate-300 mb-2">
                Min Speed (km/h)
              </label>
              <input
                type="number"
                id="minSpeed"
                name="minSpeed"
                value={filters.minSpeed}
                onChange={handleFilterChange}
                placeholder="0"
                className="w-full p-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-accent-cyan focus:border-transparent"
              />
            </div>

            {/* Max Speed */}
            <div>
              <label htmlFor="maxSpeed" className="block text-sm font-medium text-slate-300 mb-2">
                Max Speed (km/h)
              </label>
              <input
                type="number"
                id="maxSpeed"
                name="maxSpeed"
                value={filters.maxSpeed}
                onChange={handleFilterChange}
                placeholder="4000"
                className="w-full p-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-accent-cyan focus:border-transparent"
              />
            </div>

            {/* Min Range */}
            <div>
              <label htmlFor="minRange" className="block text-sm font-medium text-slate-300 mb-2">
                Min Range (nm)
              </label>
              <input
                type="number"
                id="minRange"
                name="minRange"
                value={filters.minRange}
                onChange={handleFilterChange}
                placeholder="0"
                className="w-full p-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-accent-cyan focus:border-transparent"
              />
            </div>

            {/* Tag */}
            <div>
              <label htmlFor="tag" className="block text-sm font-medium text-slate-300 mb-2">
                Tag
              </label>
              <select
                id="tag"
                name="tag"
                value={filters.tag}
                onChange={handleFilterChange}
                className="w-full p-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-accent-cyan focus:border-transparent"
              >
                <option value="" className="bg-slate-800">All Tags</option>
                {availableTags.map(tag => (
                  <option key={tag} value={tag} className="bg-slate-800">
                    {tag}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-4 mt-6">
            <button
              onClick={fetchAircraft}
              className="px-6 py-2 bg-accent-cyan text-white font-medium rounded-lg hover:bg-cyan-600 transition-colors focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none"
            >
              Apply Filters
            </button>
            <button
              onClick={handleReset}
              className="px-6 py-2 bg-slate-700 text-white font-medium rounded-lg hover:bg-slate-600 transition-colors focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:outline-none"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Results */}
        <div>
          <h2 className="text-xl font-semibold mb-6">
            Results ({aircraft.length})
          </h2>

          {isLoading ? (
            <div className="text-center py-8">Loading aircraft...</div>
          ) : aircraft.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              No aircraft found matching your criteria.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {aircraft.map(plane => (
                <Link
                  key={plane.id}
                  href={`/fleet/${plane.slug}`}
                  className="bg-panel rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 group"
                >
                  <div className="relative h-48 overflow-hidden">
                    {plane.images && plane.images.length > 0 ? (
                      <img
                        src={plane.images[0].url}
                        alt={plane.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                        <span className="text-slate-500">No Image</span>
                      </div>
                    )}
                    <div className="absolute top-4 right-4 bg-black/50 px-2 py-1 rounded text-xs">
                      {plane.category}
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-white mb-2">{plane.name}</h3>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {plane.tags.map(tag => (
                        <span
                          key={tag.name}
                          className="px-2 py-1 bg-slate-700/50 text-slate-300 text-xs rounded"
                        >
                          {tag.name}
                        </span>
                      ))}
                    </div>
                    <div className="text-slate-400 text-sm">
                      {plane.topSpeedKmh && `✈️ ${plane.topSpeedKmh} km/h`}
                      {plane.maxRangeNm && ` | 🌍 ${plane.maxRangeNm} nm`}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
