'use client';

import { useState, useEffect, useCallback } from 'react';
import { CompareTable } from '@/components/compare/CompareTable';

interface Aircraft {
  id: string;
  slug: string;
  name: string;
  category: string;
  era: string;
  engineType: string;
  topSpeedKmh: number;
  serviceCeilingFt: number;
  wingspanM: number;
  maxTakeoffWeightLbs: number;
  stallSpeedKts: number;
}

export default function ComparePage() {
  const [aircraftList, setAircraftList] = useState<Aircraft[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedA, setSelectedA] = useState<string | null>(null);
  const [selectedB, setSelectedB] = useState<string | null>(null);

  // Fetch all aircraft
  useEffect(() => {
    async function fetchAircraft() {
      try {
        setIsLoading(true);
        const response = await fetch('/api/aircraft?pageSize=50');
        
        if (!response.ok) {
          throw new Error('Failed to fetch aircraft');
        }

        const data = await response.json();
        setAircraftList(data.data || []);
        setError(null);
      } catch {
        setError('Failed to load aircraft data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchAircraft();
  }, []);

  // Get aircraft by ID
  const getAircraftById = useCallback((id: string | null): Aircraft | null => {
    if (!id) return null;
    return aircraftList.find((a) => a.id === id) || null;
  }, [aircraftList]);

  // Handle selection changes
  const handleSelectA = useCallback((id: string) => {
    // If selecting the same as B, clear B first
    if (id === selectedB) {
      setSelectedB(null);
    }
    setSelectedA(id);
  }, [selectedB]);

  const handleSelectB = useCallback((id: string) => {
    // If selecting the same as A, clear A first
    if (id === selectedA) {
      setSelectedA(null);
    }
    setSelectedB(id);
  }, [selectedA]);

  // Check if same aircraft selected
  const isSameAircraft = selectedA && selectedB && selectedA === selectedB;

  // Get selected aircraft
  const aircraftA = getAircraftById(selectedA);
  const aircraftB = getAircraftById(selectedB);

  // Check if both are selected and valid
  const hasValidComparison = aircraftA && aircraftB && selectedA !== selectedB;

  return (
    <div className="min-h-screen bg-space">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <h1 className="text-4xl font-bold text-white mb-2">Head-to-Head Comparison</h1>
        <p className="text-slate-300 text-lg mb-8">
          Compare two aircraft side by side to see how they stack up.
        </p>

        {/* Loading State */}
        {isLoading && (
          <div className="bg-panel rounded-lg p-8 mb-8">
            <div className="animate-pulse">
              <div className="h-12 w-full bg-slate-700/50 rounded mb-4"></div>
              <div className="h-12 w-full bg-slate-700/50 rounded"></div>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-8">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Dropdown Selectors */}
        {!isLoading && !error && (
          <div className="bg-panel rounded-lg p-8 mb-8">
            <h2 className="text-xl font-semibold text-white mb-6">Select Aircraft</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Aircraft A Selector */}
              <div>
                <label htmlFor="aircraft-a" className="block text-sm font-medium text-slate-300 mb-2">
                  Aircraft A
                </label>
                <select
                  id="aircraft-a"
                  value={selectedA || ''}
                  onChange={(e) => handleSelectA(e.target.value)}
                  className="w-full p-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-accent-cyan focus:border-transparent"
                  disabled={isLoading}
                  aria-label="Select first aircraft to compare"
                >
                  <option value="">-- Select Aircraft A --</option>
                  {aircraftList.map((aircraft) => (
                    <option key={aircraft.id} value={aircraft.id}>
                      {aircraft.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Aircraft B Selector */}
              <div>
                <label htmlFor="aircraft-b" className="block text-sm font-medium text-slate-300 mb-2">
                  Aircraft B
                </label>
                <select
                  id="aircraft-b"
                  value={selectedB || ''}
                  onChange={(e) => handleSelectB(e.target.value)}
                  className="w-full p-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-accent-cyan focus:border-transparent"
                  disabled={isLoading}
                  aria-label="Select second aircraft to compare"
                >
                  <option value="">-- Select Aircraft B --</option>
                  {aircraftList.map((aircraft) => (
                    <option key={aircraft.id} value={aircraft.id}>
                      {aircraft.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Same aircraft warning */}
            {isSameAircraft && (
              <div className="mt-4 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                <p className="text-amber-400 text-center">
                  Please select two different aircraft to compare.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Comparison Results */}
        {hasValidComparison && aircraftA && aircraftB && (
          <CompareTable aircraftA={aircraftA} aircraftB={aircraftB} />
        )}

        {/* Empty State */}
        {!isLoading && !error && !hasValidComparison && !isSameAircraft && (
          <div className="bg-panel rounded-lg p-12 text-center">
            <p className="text-slate-400 text-lg">
              Select two different aircraft above to compare their specifications.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
