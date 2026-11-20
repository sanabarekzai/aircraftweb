'use client';

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/lib/toast';
import { OverviewTab, type AdminStats } from '@/components/admin/OverviewTab';
import { AircraftTab } from '@/components/admin/AircraftTab';
import { BookingsTab } from '@/components/admin/BookingsTab';
import { UsersTab } from '@/components/admin/UsersTab';
import { ModerationTab } from '@/components/admin/ModerationTab';

type TabKey = 'overview' | 'aircraft' | 'bookings' | 'users' | 'moderation';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'aircraft', label: 'Aircraft' },
  { key: 'bookings', label: 'Bookings' },
  { key: 'users', label: 'Users' },
  { key: 'moderation', label: 'Moderation' },
];

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const { showToast } = useToast();

  const refreshStats = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch {
      showToast('Failed to load stats', 'error');
    }
  }, [showToast]);

  useEffect(() => {
    refreshStats();
  }, [refreshStats]);

  return (
    <div className="min-h-screen bg-space">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-slate-400 mt-1">Manage aircraft, users, bookings and moderation.</p>
        </div>

        <div className="flex gap-1 border-b border-slate-700/50 mb-6 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
                activeTab === tab.key
                  ? 'border-accent-cyan text-white'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
              {tab.key === 'moderation' && stats?.moderation && (
                <span className="ml-2 text-xs bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded-full">
                  {stats.moderation.reportedReviews}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="space-y-6">
          {activeTab === 'overview' && <OverviewTab stats={stats} onRefresh={refreshStats} />}
          {activeTab === 'aircraft' && <AircraftTab onRefresh={refreshStats} />}
          {activeTab === 'bookings' && <BookingsTab onRefresh={refreshStats} />}
          {activeTab === 'users' && <UsersTab />}
          {activeTab === 'moderation' && <ModerationTab onRefresh={refreshStats} />}
        </div>
      </div>
    </div>
  );
}
