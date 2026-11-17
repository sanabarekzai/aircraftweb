'use client';

import { useState } from 'react';
import { FlightLogForm } from './FlightLogForm';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/lib/toast';

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

interface FlightLogListProps {
  flightLogs: FlightLog[];
  aircraftList: Aircraft[];
  onLogUpdated: () => void;
  onLogDeleted: () => void;
}

export function FlightLogList({
  flightLogs,
  aircraftList,
  onLogUpdated,
  onLogDeleted,
}: FlightLogListProps) {
  const [editingLog, setEditingLog] = useState<FlightLog | null>(null);
  const { user, openAuthModal } = useAuth();
  const { showToast } = useToast();

  const handleDelete = async (id: string) => {
    if (!user) {
      openAuthModal();
      return;
    }

    if (!confirm('Are you sure you want to delete this flight log?')) {
      return;
    }

    try {
      const response = await fetch(`/api/logbook/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        showToast('Flight log deleted!', 'success');
        onLogDeleted();
      } else {
        const error = await response.json();
        showToast(error.error?.message || 'Failed to delete flight log', 'error');
      }
    } catch {
      showToast('Failed to delete flight log', 'error');
    }
  };

  const handleEdit = (log: FlightLog) => {
    setEditingLog(log);
  };

  const handleCancelEdit = () => {
    setEditingLog(null);
  };

  // Format date for display
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Format duration
  const formatDuration = (hours: number): string => {
    if (hours < 1) {
      const minutes = Math.round(hours * 60);
      return `${minutes} min`;
    }
    return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
  };

  return (
    <div className="space-y-6">
      {/* Edit Form (shown when editing) */}
      {editingLog && (
        <FlightLogForm
          aircraftList={aircraftList}
          onSuccess={() => {
            handleCancelEdit();
            onLogUpdated();
          }}
          editingLog={{
            id: editingLog.id,
            aircraftId: editingLog.aircraftId,
            date: editingLog.date,
            durationHours: editingLog.durationHours,
            notes: editingLog.notes,
          }}
        />
      )}

      {/* Flight Log List */}
      <div className="bg-panel rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-6">Flight Logs</h2>

        {flightLogs.length === 0 ? (
          <p className="text-slate-500 text-center py-8">
            No flight logs yet. Add your first log above!
          </p>
        ) : (
          <div className="space-y-4">
            {flightLogs.map((log) => (
              <div
                key={log.id}
                className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-white font-semibold text-lg mb-1">
                      {log.aircraft.name}
                    </h3>
                    <div className="flex flex-wrap gap-4 text-sm text-slate-400">
                      <span>{formatDate(log.date)}</span>
                      <span>{formatDuration(log.durationHours)}</span>
                    </div>
                    <p className="text-slate-300 mt-2 text-sm">
                      {log.notes.length > 140
                        ? `${log.notes.substring(0, 140)}...`
                        : log.notes}
                    </p>
                  </div>

                  <div className="flex gap-2 self-end md:self-center">
                    <button
                      onClick={() => handleEdit(log)}
                      className="px-3 py-1.5 bg-slate-700/50 hover:bg-slate-600/50 text-white text-sm rounded transition-colors focus-visible:ring-2 focus-visible:ring-accent-cyan"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(log.id)}
                      className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm rounded transition-colors focus-visible:ring-2 focus-visible:ring-red-400"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
