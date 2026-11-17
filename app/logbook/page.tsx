'use client';

import { useState, useEffect } from 'react';
import { FlightLogForm } from '@/components/logbook/FlightLogForm';
import { FlightLogList } from '@/components/logbook/FlightLogList';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

interface Aircraft {
  id: string;
  name: string;
}

interface FlightLog {
  id: string;
  aircraftId: string;
  date: string;
  durationHours: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
  aircraft: Aircraft;
}

export default function LogbookPage() {
  const [aircraftList, setAircraftList] = useState<Aircraft[]>([]);
  const [flightLogs, setFlightLogs] = useState<FlightLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, openAuthModal } = useAuth();

  // Fetch aircraft list and flight logs
  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        
        // Fetch all aircraft
        const aircraftResponse = await fetch('/api/aircraft?pageSize=50');
        if (aircraftResponse.ok) {
          const aircraftData = await aircraftResponse.json();
          setAircraftList(
            aircraftData.data.map((a: { id: string; name: string }) => ({
              id: a.id,
              name: a.name,
            }))
          );
        }

        // Fetch flight logs if authenticated
        if (user) {
          const logsResponse = await fetch('/api/logbook');
          if (logsResponse.ok) {
            const logsData = await logsResponse.json();
            setFlightLogs(logsData.flightLogs || []);
          } else if (logsResponse.status === 401) {
            // Not authenticated
          }
        }

        setError(null);
      } catch {
        setError('Failed to load data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [user]);

  // Refresh flight logs
  const refreshFlightLogs = async () => {
    try {
      if (user) {
        const response = await fetch('/api/logbook');
        if (response.ok) {
          const data = await response.json();
          setFlightLogs(data.flightLogs || []);
        }
      }
    } catch {
      // Error is already logged
    }
  };

  // If not authenticated, prompt to login
  useEffect(() => {
    if (!user) {
      openAuthModal();
    }
  }, [user, openAuthModal]);

  // Handle successful log creation
  const handleLogCreated = () => {
    refreshFlightLogs();
  };

  // Handle successful log update
  const handleLogUpdated = () => {
    refreshFlightLogs();
  };

  // Handle successful log deletion
  const handleLogDeleted = () => {
    refreshFlightLogs();
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-space">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="animate-pulse">
            <div className="h-10 w-64 bg-slate-700/50 rounded mb-4"></div>
            <div className="h-6 w-48 bg-slate-700/50 rounded mb-8"></div>
            <div className="space-y-4">
              <div className="h-16 bg-slate-800/50 rounded"></div>
              <div className="h-16 bg-slate-800/50 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-space">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
            <p className="text-red-400">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-space">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Flight Logbook</h1>
            <p className="text-slate-300">
              Track your flights and flight time
            </p>
          </div>
          <Link
            href="/"
            className="text-sm text-slate-400 hover:text-accent-cyan transition-colors"
          >
            &larr; Back to Home
          </Link>
        </div>

        {/* Flight Log Form */}
        <FlightLogForm
          aircraftList={aircraftList}
          onSuccess={handleLogCreated}
        />

        {/* Flight Log List */}
        <FlightLogList
          flightLogs={flightLogs}
          aircraftList={aircraftList}
          onLogUpdated={handleLogUpdated}
          onLogDeleted={handleLogDeleted}
        />
      </div>
    </div>
  );
}
