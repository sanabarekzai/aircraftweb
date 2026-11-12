'use client';

import { useMemo } from 'react';

interface StatProgressBarProps {
  valueA: number;
  valueB: number;
  maxValue: number;
  label: string;
  unit?: string;
}

export function StatProgressBar({ valueA, valueB, maxValue, label, unit = '' }: StatProgressBarProps) {
  // Calculate percentages, clamped between 0 and 100
  const percentA = useMemo(() => {
    const raw = (valueA / maxValue) * 100;
    return Math.min(100, Math.max(0, raw));
  }, [valueA, maxValue]);

  const percentB = useMemo(() => {
    const raw = (valueB / maxValue) * 100;
    return Math.min(100, Math.max(0, raw));
  }, [valueB, maxValue]);

  // Determine if there's a winner (only if values are not equal)
  const isWinnerA = valueA > valueB;
  const isWinnerB = valueB > valueA;
  const isTie = valueA === valueB;

  // Format value for display
  const formatValue = (value: number): string => {
    // If the value is an integer, don't show decimal
    if (Number.isInteger(value)) {
      return `${value}${unit}`;
    }
    // Otherwise, show with 1 decimal place
    return `${value.toFixed(1)}${unit}`;
  };

  return (
    <div className="bg-panel rounded-lg p-4 mb-4">
      <div className="flex justify-between items-center mb-3">
        <span className="text-slate-300 font-medium">{label}</span>
        <div className="flex gap-4 text-sm">
          <span className={`font-semibold ${isWinnerA ? 'text-accent-amber' : 'text-white'}`}>
            {formatValue(valueA)}
          </span>
          <span className={`font-semibold ${isWinnerB ? 'text-accent-amber' : 'text-white'}`}>
            {formatValue(valueB)}
          </span>
        </div>
      </div>

      <div className="flex gap-2 h-8">
        {/* Bar A */}
        <div className="flex-1 relative overflow-hidden rounded-full bg-slate-700/50">
          <div
            className={`absolute left-0 top-0 bottom-0 transition-all duration-300 ease-out ${
              isWinnerA && !isTie
                ? 'bg-accent-amber'
                : 'bg-accent-cyan'
            }`}
            style={{ width: `${percentA}%` }}
          />
        </div>

        {/* Bar B */}
        <div className="flex-1 relative overflow-hidden rounded-full bg-slate-700/50">
          <div
            className={`absolute left-0 top-0 bottom-0 transition-all duration-300 ease-out ${
              isWinnerB && !isTie
                ? 'bg-accent-amber'
                : 'bg-accent-cyan'
            }`}
            style={{ width: `${percentB}%` }}
          />
        </div>
      </div>
    </div>
  );
}
