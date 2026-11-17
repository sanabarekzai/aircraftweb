'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

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

            <div className="border-t border-slate-700 pt-6">
              <h3 className="text-lg font-semibold mb-4">Account Settings</h3>
              <p className="text-slate-400">
                Manage your account preferences and settings.
              </p>
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
