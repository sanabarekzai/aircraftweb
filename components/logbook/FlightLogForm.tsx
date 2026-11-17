'use client';

import { useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/lib/toast';

interface Aircraft {
  id: string;
  name: string;
}

interface FlightLogFormProps {
  aircraftList: Aircraft[];
  onSuccess: () => void;
  editingLog?: {
    id: string;
    aircraftId: string;
    date: string;
    durationHours: number;
    notes: string;
  } | null;
}

export function FlightLogForm({ aircraftList, onSuccess, editingLog }: FlightLogFormProps) {
  const [aircraftId, setAircraftId] = useState(editingLog?.aircraftId || '');
  const [date, setDate] = useState(editingLog?.date || '');
  const [durationHours, setDurationHours] = useState(editingLog?.durationHours || 0);
  const [notes, setNotes] = useState(editingLog?.notes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { user, openAuthModal } = useAuth();
  const { showToast } = useToast();

  const isEditing = editingLog !== null;

  // Validate form
  const validate = useCallback(() => {
    const newErrors: Record<string, string> = {};

    if (!aircraftId) {
      newErrors.aircraftId = 'Aircraft is required';
    }
    if (!date) {
      newErrors.date = 'Date is required';
    }
    if (!durationHours || durationHours <= 0) {
      newErrors.durationHours = 'Duration must be positive';
    }
    if (!notes.trim()) {
      newErrors.notes = 'Notes are required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [aircraftId, date, durationHours, notes]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      openAuthModal();
      return;
    }

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        aircraftId,
        date,
        durationHours: Number(durationHours),
        notes,
      };

      let response;
      if (isEditing && editingLog) {
        response = await fetch(`/api/logbook/${editingLog.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
      } else {
        response = await fetch('/api/logbook', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
      }

      if (response.ok) {
        showToast(
          isEditing ? 'Flight log updated!' : 'Flight log created!',
          'success'
        );
        onSuccess();
        // Reset form if not editing
        if (!isEditing) {
          setAircraftId('');
          setDate('');
          setDurationHours(0);
          setNotes('');
        }
      } else {
        const error = await response.json();
        showToast(error.error?.message || 'Failed to save flight log', 'error');
      }
    } catch {
      showToast('Failed to save flight log', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-panel rounded-lg p-6 mb-8">
      <h2 className="text-xl font-semibold text-white mb-6">
        {isEditing ? 'Edit Flight Log' : 'Add Flight Log'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Aircraft Selector */}
        <div>
          <label htmlFor="aircraft" className="block text-sm font-medium text-slate-300 mb-1">
            Aircraft *
          </label>
          <select
            id="aircraft"
            value={aircraftId}
            onChange={(e) => setAircraftId(e.target.value)}
            className={`w-full p-3 bg-slate-800/50 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-accent-cyan ${
              errors.aircraftId ? 'border-red-500' : 'border-slate-700'
            }`}
            disabled={isSubmitting}
            aria-label="Select aircraft"
          >
            <option value="">-- Select Aircraft --</option>
            {aircraftList.map((aircraft) => (
              <option key={aircraft.id} value={aircraft.id}>
                {aircraft.name}
              </option>
            ))}
          </select>
          {errors.aircraftId && (
            <p className="mt-1 text-sm text-red-400">{errors.aircraftId}</p>
          )}
        </div>

        {/* Date Picker */}
        <div>
          <label htmlFor="date" className="block text-sm font-medium text-slate-300 mb-1">
            Date *
          </label>
          <input
            type="date"
            id="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={`w-full p-3 bg-slate-800/50 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-accent-cyan ${
              errors.date ? 'border-red-500' : 'border-slate-700'
            }`}
            disabled={isSubmitting}
            aria-label="Flight date"
          />
          {errors.date && (
            <p className="mt-1 text-sm text-red-400">{errors.date}</p>
          )}
        </div>

        {/* Duration Input */}
        <div>
          <label htmlFor="duration" className="block text-sm font-medium text-slate-300 mb-1">
            Duration (hours) *
          </label>
          <input
            type="number"
            id="duration"
            value={durationHours}
            onChange={(e) => setDurationHours(parseFloat(e.target.value) || 0)}
            step="0.1"
            min="0.1"
            className={`w-full p-3 bg-slate-800/50 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-accent-cyan ${
              errors.durationHours ? 'border-red-500' : 'border-slate-700'
            }`}
            disabled={isSubmitting}
            aria-label="Flight duration in hours"
          />
          {errors.durationHours && (
            <p className="mt-1 text-sm text-red-400">{errors.durationHours}</p>
          )}
        </div>

        {/* Notes Textarea */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-slate-300 mb-1">
            Notes *
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className={`w-full p-3 bg-slate-800/50 border rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-accent-cyan resize-none ${
              errors.notes ? 'border-red-500' : 'border-slate-700'
            }`}
            placeholder="Flight notes, observations, ratings..."
            disabled={isSubmitting}
            aria-label="Flight notes"
          />
          {errors.notes && (
            <p className="mt-1 text-sm text-red-400">{errors.notes}</p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full px-4 py-3 bg-accent-cyan text-white font-medium rounded-lg hover:bg-cyan-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none"
        >
          {isSubmitting ? 'Saving...' : isEditing ? 'Update Log' : 'Add Log'}
        </button>
      </form>
    </div>
  );
}
