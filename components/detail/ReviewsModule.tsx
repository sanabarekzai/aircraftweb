'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/lib/toast';

const MAX_REVIEW_LENGTH = 2000;

interface Review {
  id: string;
  userId: string;
  content: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  username: string;
}

interface ReviewsModuleProps {
  aircraftId: string;
}

export function ReviewsModule({ aircraftId }: ReviewsModuleProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [newContent, setNewContent] = useState('');
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [reportingReviewId, setReportingReviewId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, openAuthModal } = useAuth();
  const { showToast } = useToast();

  const fetchReviews = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/reviews?aircraftId=${aircraftId}`);
      if (response.ok) {
        const data = await response.json();
        setReviews(data.reviews || []);
      }
    } catch {
      // Error is already logged in the console
    } finally {
      setIsLoading(false);
    }
  }, [aircraftId]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleCreateReview = async () => {
    if (!user) {
      openAuthModal();
      return;
    }

    if (!newContent.trim()) {
      showToast('Review content cannot be empty', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          aircraftId,
          content: newContent,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setReviews([data.review, ...reviews]);
        setNewContent('');
        showToast('Review posted successfully!', 'success');
      } else {
        const error = await response.json();
        showToast(error.error?.message || 'Failed to post review', 'error');
      }
    } catch {
      showToast('Failed to post review', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateReview = async (reviewId: string) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/reviews/${reviewId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: editingContent,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setReviews(
          reviews.map((review) =>
            review.id === reviewId ? { ...review, ...data.review } : review
          )
        );
        setEditingReviewId(null);
        setEditingContent('');
        showToast('Review updated successfully!', 'success');
      } else {
        const error = await response.json();
        showToast(error.error?.message || 'Failed to update review', 'error');
      }
    } catch {
      showToast('Failed to update review', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm('Are you sure you want to delete this review?')) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/reviews/${reviewId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setReviews(reviews.filter((review) => review.id !== reviewId));
        showToast('Review deleted successfully!', 'success');
      } else {
        const error = await response.json();
        showToast(error.error?.message || 'Failed to delete review', 'error');
      }
    } catch {
      showToast('Failed to delete review', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReportReview = async (reviewId: string) => {
    if (!user) {
      openAuthModal();
      return;
    }

    if (!reportReason.trim()) {
      showToast('Please provide a reason for the report', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/reviews/${reviewId}/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason: reportReason,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.hidden) {
          setReviews(reviews.filter((review) => review.id !== reviewId));
          showToast('Review reported and hidden by moderation', 'success');
        } else {
          showToast('Report submitted. Thank you!', 'success');
        }
        setReportingReviewId(null);
        setReportReason('');
      } else {
        const error = await response.json();
        showToast(error.error?.message || 'Failed to submit report', 'error');
      }
    } catch {
      showToast('Failed to submit report', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEditing = (review: Review) => {
    setEditingReviewId(review.id);
    setEditingContent(review.content);
  };

  const cancelEditing = () => {
    setEditingReviewId(null);
    setEditingContent('');
  };

  const cancelReporting = () => {
    setReportingReviewId(null);
    setReportReason('');
  };

  return (
    <div className="bg-panel rounded-lg p-6">
      <h2 className="text-xl font-semibold text-white mb-4">
        Reviews ({reviews.length})
      </h2>

      {/* Add Review Form */}
      {!reviews.some((review) => user && review.userId === user.id) ? (
        <div className="mb-6">
          <textarea
            value={newContent}
            onChange={(e) => setNewContent(e.target.value.slice(0, MAX_REVIEW_LENGTH))}
            placeholder="Share your thoughts about this aircraft..."
            rows={4}
            maxLength={MAX_REVIEW_LENGTH}
            className="w-full p-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-accent-cyan focus:border-transparent resize-none"
            disabled={isSubmitting}
            aria-label="Write a review"
          />
          <div className="flex items-center justify-between mt-2">
            <button
              onClick={handleCreateReview}
              disabled={isSubmitting || !newContent.trim()}
              className="px-4 py-2 bg-accent-cyan text-white font-medium rounded-lg hover:bg-cyan-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none"
            >
              Post Review
            </button>
            <span className="text-xs text-slate-500">
              {newContent.length}/{MAX_REVIEW_LENGTH}
            </span>
          </div>
        </div>
      ) : (
        <p className="mb-6 text-sm text-slate-500">
          You have already reviewed this aircraft. You can edit or delete it below.
        </p>
      )}

      {/* Loading State */}
      {isLoading && !reviews.length ? (
        <div className="text-slate-400">Loading reviews...</div>
      ) : null}

      {/* Empty State */}
      {reviews.length === 0 && !isLoading ? (
        <p className="text-slate-500 text-sm">
          No reviews yet. Be the first to share your experience!
        </p>
      ) : null}

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.map((review) => {
          const isOwn = user?.id === review.userId;
          const isHidden = review.status === 'HIDDEN';

          return (
            <div
              key={review.id}
              className={`p-4 rounded-lg border ${
                isHidden
                  ? 'bg-slate-800/30 border-amber-600/40'
                  : 'bg-slate-800/50 border-slate-700/50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white">{review.username}</span>
                  {isOwn && (
                    <span className="text-xs bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded-full">
                      You
                    </span>
                  )}
                  {isHidden && (
                    <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">
                      Hidden by moderation
                    </span>
                  )}
                </div>
                <span className="text-xs text-slate-500">
                  {new Date(review.createdAt).toLocaleDateString()}
                </span>
              </div>

              {editingReviewId === review.id ? (
                <>
                  <textarea
                    value={editingContent}
                    onChange={(e) => setEditingContent(e.target.value.slice(0, MAX_REVIEW_LENGTH))}
                    rows={4}
                    maxLength={MAX_REVIEW_LENGTH}
                    className="w-full p-2 bg-slate-700/50 border border-slate-600 rounded text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-accent-cyan resize-none mb-2"
                    aria-label="Edit review"
                  />
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdateReview(review.id)}
                        disabled={isSubmitting || !editingContent.trim()}
                        className="px-3 py-1 bg-accent-cyan text-white text-sm rounded hover:bg-cyan-600 transition-colors disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-cyan-400"
                      >
                        Save
                      </button>
                      <button
                        onClick={cancelEditing}
                        disabled={isSubmitting}
                        className="px-3 py-1 bg-slate-600 text-white text-sm rounded hover:bg-slate-500 transition-colors disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-slate-400"
                      >
                        Cancel
                      </button>
                    </div>
                    <span className="text-xs text-slate-500">
                      {editingContent.length}/{MAX_REVIEW_LENGTH}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-slate-300 mb-2 whitespace-pre-wrap">{review.content}</p>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>
                      {isHidden ? 'Only you can see this review' : ''}
                      {review.updatedAt !== review.createdAt && !isHidden && (
                        <span>(edited)</span>
                      )}
                    </span>
                    <div className="flex gap-3">
                      {isOwn ? (
                        <>
                          <button
                            onClick={() => startEditing(review)}
                            className="hover:text-accent-cyan transition-colors focus-visible:ring-2 focus-visible:ring-accent-cyan"
                            aria-label="Edit review"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteReview(review.id)}
                            className="hover:text-red-400 transition-colors focus-visible:ring-2 focus-visible:ring-red-400"
                            aria-label="Delete review"
                          >
                            Delete
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() =>
                            reportingReviewId === review.id
                              ? cancelReporting()
                              : setReportingReviewId(review.id)
                          }
                          className="hover:text-amber-400 transition-colors focus-visible:ring-2 focus-visible:ring-amber-400"
                          aria-label="Report review"
                        >
                          Report
                        </button>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Report Form */}
              {reportingReviewId === review.id && (
                <div className="mt-3 p-3 bg-slate-900/50 border border-slate-700 rounded-lg">
                  <label
                    htmlFor={`report-reason-${review.id}`}
                    className="block text-xs text-slate-400 mb-2"
                  >
                    Why are you reporting this review?
                  </label>
                  <textarea
                    id={`report-reason-${review.id}`}
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value.slice(0, 500))}
                    rows={2}
                    maxLength={500}
                    placeholder="Spam, harassment, off-topic..."
                    className="w-full p-2 bg-slate-800/50 border border-slate-700 rounded text-white text-sm placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-accent-cyan resize-none mb-2"
                    aria-label="Report reason"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleReportReview(review.id)}
                      disabled={isSubmitting || !reportReason.trim()}
                      className="px-3 py-1 bg-amber-600 text-white text-sm rounded hover:bg-amber-500 transition-colors disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-amber-400"
                    >
                      Submit Report
                    </button>
                    <button
                      onClick={cancelReporting}
                      disabled={isSubmitting}
                      className="px-3 py-1 bg-slate-600 text-white text-sm rounded hover:bg-slate-500 transition-colors disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-slate-400"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
