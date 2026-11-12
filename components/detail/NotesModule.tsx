'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/lib/toast';

interface Note {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  aircraft: {
    id: string;
    slug: string;
    name: string;
  };
}

interface NotesModuleProps {
  aircraftId: string;
}

export function NotesModule({ aircraftId }: NotesModuleProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, openAuthModal } = useAuth();
  const { showToast } = useToast();

  const fetchNotes = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/notes?aircraftId=${aircraftId}`);
      if (response.ok) {
        const data = await response.json();
        setNotes(data.notes || []);
      }
    } catch {
      // Error is already logged in the console
    } finally {
      setIsLoading(false);
    }
  }, [aircraftId]);

  useEffect(() => {
    if (user) {
      fetchNotes();
    } else {
      setNotes([]);
      setIsLoading(false);
    }
  }, [aircraftId, user, fetchNotes]);

  const handleCreateNote = async () => {
    if (!user) {
      openAuthModal();
      return;
    }

    if (!newNoteContent.trim()) {
      showToast('Note content cannot be empty', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          aircraftId,
          content: newNoteContent,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setNotes([data.note, ...notes]);
        setNewNoteContent('');
        showToast('Note created successfully!', 'success');
      } else {
        const error = await response.json();
        showToast(error.error?.message || 'Failed to create note', 'error');
      }
    } catch {
      showToast('Failed to create note', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateNote = async (noteId: string) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/notes/${noteId}`, {
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
        setNotes(
          notes.map((note) =>
            note.id === noteId ? { ...note, content: data.note.content } : note
          )
        );
        setEditingNoteId(null);
        setEditingContent('');
        showToast('Note updated successfully!', 'success');
      } else {
        const error = await response.json();
        showToast(error.error?.message || 'Failed to update note', 'error');
      }
    } catch {
      showToast('Failed to update note', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note?')) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setNotes(notes.filter((note) => note.id !== noteId));
        showToast('Note deleted successfully!', 'success');
      } else {
        const error = await response.json();
        showToast(error.error?.message || 'Failed to delete note', 'error');
      }
    } catch {
      showToast('Failed to delete note', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEditing = (note: Note) => {
    setEditingNoteId(note.id);
    setEditingContent(note.content);
  };

  const cancelEditing = () => {
    setEditingNoteId(null);
    setEditingContent('');
  };

  return (
    <div className="bg-panel rounded-lg p-6">
      <h2 className="text-xl font-semibold text-white mb-4">Personal Notes</h2>

      {/* Add Note Form */}
      <div className="mb-6">
        <textarea
          value={newNoteContent}
          onChange={(e) => setNewNoteContent(e.target.value)}
          placeholder="Add your flight notes..."
          rows={3}
          className="w-full p-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-accent-cyan focus:border-transparent resize-none"
          disabled={isSubmitting}
          aria-label="Add flight note"
        />
        <button
          onClick={handleCreateNote}
          disabled={isSubmitting || !newNoteContent.trim()}
          className="mt-3 px-4 py-2 bg-accent-cyan text-white font-medium rounded-lg hover:bg-cyan-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none"
        >
          Save Note
        </button>
      </div>

      {/* Loading State */}
      {isLoading && !notes.length ? (
        <div className="text-slate-400">Loading notes...</div>
      ) : null}

      {/* Notes List */}
      {notes.length === 0 && !isLoading ? (
        <p className="text-slate-500 text-sm">
          No notes yet. Add your first note above!
        </p>
      ) : null}

      <div className="space-y-4">
        {notes.map((note) => (
          <div
            key={note.id}
            className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50"
          >
            {editingNoteId === note.id ? (
              <>
                <textarea
                  value={editingContent}
                  onChange={(e) => setEditingContent(e.target.value)}
                  rows={3}
                  className="w-full p-2 bg-slate-700/50 border border-slate-600 rounded text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-accent-cyan resize-none mb-2"
                  aria-label="Edit note"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => handleUpdateNote(note.id)}
                    disabled={isSubmitting}
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
              </>
            ) : (
              <>
                <p className="text-slate-300 mb-2">{note.content}</p>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>
                    {new Date(note.createdAt).toLocaleString()}
                    {note.updatedAt !== note.createdAt && (
                      <span className="ml-2">(edited)</span>
                    )}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => startEditing(note)}
                      className="hover:text-accent-cyan transition-colors focus-visible:ring-2 focus-visible:ring-accent-cyan"
                      aria-label="Edit note"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteNote(note.id)}
                      className="hover:text-red-400 transition-colors focus-visible:ring-2 focus-visible:ring-red-400"
                      aria-label="Delete note"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
