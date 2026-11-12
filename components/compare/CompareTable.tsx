'use client';

import { StatProgressBar } from './StatProgressBar';

interface AircraftSpecs {
  id: string;
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

interface CompareTableProps {
  aircraftA: AircraftSpecs | null;
  aircraftB: AircraftSpecs | null;
}

function formatCategory(category: string): string {
  const categoryMap: Record<string, string> = {
    GENERAL_AVIATION: 'General Aviation',
    COMMERCIAL_AIRLINER: 'Commercial Airliner',
    MILITARY: 'Military',
    SUPERSONIC: 'Supersonic',
    EXPERIMENTAL: 'Experimental',
  };
  return categoryMap[category] || category;
}

function formatEra(era: string): string {
  const eraMap: Record<string, string> = {
    PIONEER: 'Pioneer',
    WWII: 'WWII',
    JET_AGE: 'Jet Age',
    MODERN: 'Modern',
  };
  return eraMap[era] || era;
}

function SpecRow({ label, valueA, valueB }: { label: string; valueA: string; valueB: string }) {
  return (
    <tr className="border-b border-slate-700/50">
      <td className="py-3 text-slate-400 font-medium w-1/3">{label}</td>
      <td className="py-3 text-white text-center">{valueA}</td>
      <td className="py-3 text-white text-center">{valueB}</td>
    </tr>
  );
}

export function CompareTable({ aircraftA, aircraftB }: CompareTableProps) {
  if (!aircraftA || !aircraftB) {
    return null;
  }

  // Calculate max values for progress bars
  const maxSpeed = Math.max(aircraftA.topSpeedKmh, aircraftB.topSpeedKmh);
  const maxWingspan = Math.max(aircraftA.wingspanM, aircraftB.wingspanM);
  const maxCeiling = Math.max(aircraftA.serviceCeilingFt, aircraftB.serviceCeilingFt);

  // Format weights
  const formatWeight = (lbs: number): string => {
    if (lbs >= 1000) {
      return `${(lbs / 1000).toFixed(0)}k lbs`;
    }
    return `${lbs} lbs`;
  };

  return (
    <div className="w-full">
      {/* Basic Specs Table */}
      <div className="bg-panel rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold text-white mb-6">Specifications</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr>
                <th className="py-3 text-left text-slate-500 font-medium w-1/3">Metric</th>
                <th className="py-3 text-center text-slate-500 font-medium">{aircraftA.name}</th>
                <th className="py-3 text-center text-slate-500 font-medium">{aircraftB.name}</th>
              </tr>
            </thead>
            <tbody>
              <SpecRow
                label="Category"
                valueA={formatCategory(aircraftA.category)}
                valueB={formatCategory(aircraftB.category)}
              />
              <SpecRow
                label="Era"
                valueA={formatEra(aircraftA.era)}
                valueB={formatEra(aircraftB.era)}
              />
              <SpecRow
                label="Engine Type"
                valueA={aircraftA.engineType}
                valueB={aircraftB.engineType}
              />
              <SpecRow
                label="Max Takeoff Weight"
                valueA={formatWeight(aircraftA.maxTakeoffWeightLbs)}
                valueB={formatWeight(aircraftB.maxTakeoffWeightLbs)}
              />
              <SpecRow
                label="Stall Speed"
                valueA={`${aircraftA.stallSpeedKts} kts`}
                valueB={`${aircraftB.stallSpeedKts} kts`}
              />
            </tbody>
          </table>
        </div>
      </div>

      {/* Progress Bar Stats */}
      <div className="bg-panel rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-6">Performance Comparison</h2>
        
        <StatProgressBar
          valueA={aircraftA.topSpeedKmh}
          valueB={aircraftB.topSpeedKmh}
          maxValue={maxSpeed}
          label="Max Speed"
          unit=" km/h"
        />

        <StatProgressBar
          valueA={aircraftA.wingspanM}
          valueB={aircraftB.wingspanM}
          maxValue={maxWingspan}
          label="Wingspan"
          unit=" m"
        />

        <StatProgressBar
          valueA={aircraftA.serviceCeilingFt}
          valueB={aircraftB.serviceCeilingFt}
          maxValue={maxCeiling}
          label="Service Ceiling"
          unit=" ft"
        />
      </div>
    </div>
  );
}
