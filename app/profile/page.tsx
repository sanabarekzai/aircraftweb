'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

interface ProfileBadge {
  key: string;
  name: string;
  description: string;
  icon: string;
  tier: string;
  earned: boolean;
  earnedAt: string | null;
}

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [profileData, setProfileData] = useState<{
    username: string;
    email: string;
    joinedAt: string;
    totalFlightHours: number;
    favoriteAircraftCount: number;
    flightLogsCount: number;
  } | null>(null);
  const [badges, setBadges] = useState<ProfileBadge[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      fetchProfileData();
    }
  }, [user]);

  const fetchProfileData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/profile');
      if (response.ok) {
        const data = await response.json();
        setProfileData(data.profile);
        setBadges(data.badges || []);
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <main className="min-h-screen bg-slate-900 text-slate-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">User Profile</h1>

        {isLoading ? (
          <div className="text-center py-8">Loading profile...</div>
        ) : profileData ? (
          <div className="bg-panel rounded-lg p-8 shadow-lg">
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-2">
                {profileData.username}
              </h2>
              <p className="text-slate-400">{profileData.email}</p>
              <p className="text-slate-500 text-sm">
                Joined: {new Date(profileData.joinedAt).toLocaleDateString()}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-slate-800/50 rounded-lg p-6 text-center">
                <div className="text-3xl font-bold text-accent-cyan">
                  {profileData.totalFlightHours}
                </div>
                <div className="text-slate-400 mt-2">Total Flight Hours</div>
              </div>

              <div className="bg-slate-800/50 rounded-lg p-6 text-center">
                <div className="text-3xl font-bold text-accent-cyan">
                  {profileData.favoriteAircraftCount}
                </div>
                <div className="text-slate-400 mt-2">Favorite Aircraft</div>
              </div>

              <div className="bg-slate-800/50 rounded-lg p-6 text-center">
                <div className="text-3xl font-bold text-accent-cyan">
                  {profileData.flightLogsCount}
                </div>
                <div className="text-slate-400 mt-2">Flight Logs</div>
              </div>
            </div>

            {badges.length > 0 && (
              <div className="border-t border-slate-700 pt-6 mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Achievements</h3>
                  <span className="text-sm text-slate-400">
                    {badges.filter((b) => b.earned).length} / {badges.length} earned
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {badges.map((badge) => (
                    <div
                      key={badge.key}
                      title={badge.earned ? badge.description : `${badge.description} (locked)`}
                      className={`rounded-lg p-4 text-center border transition-colors ${
                        badge.earned
                          ? 'bg-slate-800/50 border-amber-500/40'
                          : 'bg-slate-900/50 border-slate-800 opacity-40'
                      }`}
                    >
                      <div className={`text-3xl mb-2 ${badge.earned ? '' : 'grayscale'}`}>
                        {badge.icon}
                      </div>
                      <div className="text-sm font-medium text-white">{badge.name}</div>
                      <div className="text-xs text-slate-400 mt-1">{badge.description}</div>
                      {badge.earned && badge.earnedAt ? (
                        <div className="text-xs text-amber-400 mt-2">
                          Earned {new Date(badge.earnedAt).toLocaleDateString()}
                        </div>
                      ) : (
                        <div className="text-xs text-slate-600 mt-2">Locked</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t border-slate-700 pt-6">
              <h3 className="text-lg font-semibold mb-4">Account Settings</h3>
              <p className="text-slate-400 mb-4">
                Manage your account preferences and settings.
              </p>
              <Link
                href="/settings"
                className="inline-flex items-center px-4 py-2 bg-accent-cyan text-white font-medium rounded-lg hover:bg-cyan-600 transition-colors focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none"
              >
                Edit Settings
              </Link>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-slate-400">
            Failed to load profile data.
          </div>
        )}
      </div>
    </main>
  );
}
