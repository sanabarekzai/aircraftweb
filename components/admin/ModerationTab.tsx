'use client';

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/lib/toast';

interface QueuedReview {
  id: string;
  content: string;
  status: string;
  createdAt: string;
  user: { id: string; username: string; email: string };
  aircraft: { id: string; slug: string; name: string };
  reportCount: number;
  reporters: { id: string; username: string; reason: string; createdAt: string }[];
}

interface ModerationTabProps {
  onRefresh: () => void;
}

export function ModerationTab({ onRefresh }: ModerationTabProps) {
  const [reviews, setReviews] = useState<QueuedReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const { showToast } = useToast();

  const fetchQueue = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/reviews');
      if (response.ok) {
        const data = await response.json();
        setReviews(data.reviews || []);
      }
    } catch {
      showToast('Failed to load moderation queue', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  const handleStatusChange = async (review: QueuedReview, status: string) => {
    setBusyId(review.id);
    try {
      const response = await fetch(`/api/admin/reviews/${review.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        if (status === 'PUBLISHED') {
          setReviews((prev) => prev.filter((r) => r.id !== review.id));
        } else {
          setReviews((prev) =>
            prev.map((r) => (r.id === review.id ? { ...r, status } : r))
          );
        }
        showToast(status === 'PUBLISHED' ? 'Review restored' : 'Review hidden', 'success');
        onRefresh();
      } else {
        const error = await response.json();
        showToast(error.error?.message || 'Failed to moderate review', 'error');
      }
    } catch {
      showToast('Failed to moderate review', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (review: QueuedReview) => {
    if (!confirm(`Delete this review by ${review.user.username}? This cannot be undone.`)) {
      return;
    }

    setBusyId(review.id);
    try {
      const response = await fetch(`/api/admin/reviews/${review.id}`, { method: 'DELETE' });
      if (response.ok) {
        setReviews(reviews.filter((r) => r.id !== review.id));
        showToast('Review deleted', 'success');
        onRefresh();
      } else {
        const error = await response.json();
        showToast(error.error?.message || 'Failed to delete review', 'error');
      }
    } catch {
      showToast('Failed to delete review', 'error');
    } finally {
      setBusyId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-panel rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Moderation Queue</h2>
        <div className="text-slate-400">Loading queue...</div>
      </div>
    );
  }

  return (
    <div className="bg-panel rounded-lg p-6">
      <h2 className="text-xl font-semibold text-white mb-4">
        Moderation Queue ({reviews.length})
      </h2>

      {reviews.length === 0 ? (
        <p className="text-slate-500 text-sm">
          Queue is clear. No reported or hidden reviews.
        </p>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div
              key={review.id}
              className={`p-4 rounded-lg border ${
                review.status === 'HIDDEN'
                  ? 'bg-slate-900/50 border-amber-600/40'
                  : 'bg-slate-800/50 border-amber-500/50'
              }`}
            >
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    review.status === 'HIDDEN'
                      ? 'bg-amber-500/20 text-amber-400'
                      : 'bg-cyan-500/20 text-cyan-400'
                  }`}
                >
                  {review.status}
                </span>
                <span className="text-sm text-white">{review.user.username}</span>
                <span className="text-slate-500">&bull;</span>
                <span className="text-sm text-slate-400">on {review.aircraft.name}</span>
                <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">
                  {review.reportCount} report{review.reportCount !== 1 ? 's' : ''}
                </span>
              </div>

              <p className="text-slate-300 mb-3 whitespace-pre-wrap">{review.content}</p>

              {review.reporters.length > 0 && (
                <details className="mb-3">
                  <summary className="text-xs text-slate-500 cursor-pointer hover:text-slate-400">
                    View {review.reporters.length} report reason
                    {review.reporters.length !== 1 ? 's' : ''}
                  </summary>
                  <ul className="mt-2 space-y-1">
                    {review.reporters.map((reporter) => (
                      <li key={reporter.id} className="text-xs text-slate-400">
                        <span className="text-slate-300">{reporter.username}</span>:{' '}
                        {reporter.reason}{' '}
                        <span className="text-slate-600">
                          ({new Date(reporter.createdAt).toLocaleDateString()})
                        </span>
                      </li>
                    ))}
                  </ul>
                </details>
              )}

              <div className="flex gap-3 text-sm">
                <button
                  onClick={() =>
                    handleStatusChange(
                      review,
                      review.status === 'HIDDEN' ? 'PUBLISHED' : 'HIDDEN'
                    )
                  }
                  disabled={busyId === review.id}
                  className="hover:text-accent-cyan transition-colors disabled:opacity-50"
                >
                  {review.status === 'HIDDEN' ? 'Restore' : 'Hide'}
                </button>
                <button
                  onClick={() => handleDelete(review)}
                  disabled={busyId === review.id}
                  className="hover:text-red-400 transition-colors disabled:opacity-50"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
