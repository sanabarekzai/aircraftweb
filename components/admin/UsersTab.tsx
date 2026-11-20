'use client';

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/lib/toast';

export interface RecentUser {
  id: string;
  username: string;
  email: string;
  isAdmin: boolean;
  createdAt: string;
}

interface AdminUser {
  id: string;
  username: string;
  email: string;
  isAdmin: boolean;
  createdAt: string;
  _count: {
    favorites: number;
    ratings: number;
    personalNotes: number;
    flightLogs: number;
    bookings: number;
    reviews: number;
  };
}

export function UsersTab() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();

  const fetchUsers = useCallback(async (searchQuery: string) => {
    setIsLoading(true);
    try {
      const params = searchQuery ? `?query=${encodeURIComponent(searchQuery)}` : '';
      const response = await fetch(`/api/admin/users${params}`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch {
      showToast('Failed to load users', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchUsers('');
  }, [fetchUsers]);

  const handleSearch = (value: string) => {
    setQuery(value);
    fetchUsers(value);
  };

  const handleToggleAdmin = async (user: AdminUser) => {
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAdmin: !user.isAdmin }),
      });

      if (response.ok) {
        setUsers(
          users.map((u) => (u.id === user.id ? { ...u, isAdmin: !u.isAdmin } : u))
        );
        showToast(
          !user.isAdmin ? `${user.username} is now an admin` : `Admin access revoked for ${user.username}`,
          'success'
        );
      } else {
        const error = await response.json();
        showToast(error.error?.message || 'Failed to update user', 'error');
      }
    } catch {
      showToast('Failed to update user', 'error');
    }
  };

  const handleDeleteUser = async (user: AdminUser) => {
    if (
      !confirm(
        `Delete user "${user.username}"? All their favorites, ratings, notes, logs, bookings and reviews will be deleted. This cannot be undone.`
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${user.id}`, { method: 'DELETE' });
      if (response.ok) {
        setUsers(users.filter((u) => u.id !== user.id));
        showToast('User deleted', 'success');
      } else {
        const error = await response.json();
        showToast(error.error?.message || 'Failed to delete user', 'error');
      }
    } catch {
      showToast('Failed to delete user', 'error');
    }
  };

  return (
    <div className="bg-panel rounded-lg p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <h2 className="text-xl font-semibold text-white">Users ({users.length})</h2>
        <input
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search username or email..."
          className="p-2 bg-slate-800/50 border border-slate-700 rounded text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-accent-cyan w-full sm:w-64"
          aria-label="Search users"
        />
      </div>

      {isLoading ? (
        <div className="text-slate-400">Loading users...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400 border-b border-slate-700/50">
                <th className="py-2 pr-4">User</th>
                <th className="py-2 pr-4">Joined</th>
                <th className="py-2 pr-4">Activity</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-slate-800/50">
                  <td className="py-2 pr-4">
                    <p className="text-white">
                      {user.username}
                      {user.isAdmin && (
                        <span className="ml-2 text-xs bg-cyan-500/20 text-cyan-400 px-1.5 py-0.5 rounded-full">
                          admin
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-slate-500">{user.email}</p>
                  </td>
                  <td className="py-2 pr-4 text-slate-400">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-2 pr-4 text-xs text-slate-500">
                    {user._count.bookings}b / {user._count.reviews}r / {user._count.favorites}f /{' '}
                    {user._count.flightLogs}l
                  </td>
                  <td className="py-2">
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleToggleAdmin(user)}
                        className="hover:text-accent-cyan transition-colors"
                      >
                        {user.isAdmin ? 'Revoke Admin' : 'Make Admin'}
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user)}
                        className="hover:text-red-400 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && (
            <p className="text-slate-500 text-sm mt-4">No users match this search.</p>
          )}
        </div>
      )}
    </div>
  );
}
