'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useToast } from '@/lib/toast';

export default function SettingsPage() {
  const { user, loading, refreshUser } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username,
        email: user.email,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setIsLoading(false);
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    
    // Only validate password fields if any are filled
    if (formData.currentPassword || formData.newPassword || formData.confirmPassword) {
      if (!formData.currentPassword) {
        newErrors.currentPassword = 'Current password is required';
      }
      if (!formData.newPassword) {
        newErrors.newPassword = 'New password is required';
      } else if (formData.newPassword.length < 6) {
        newErrors.newPassword = 'Password must be at least 6 characters';
      }
      if (formData.newPassword !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) {
      showToast('Please fix the errors in the form', 'error');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const updateData: Record<string, string> = {
        username: formData.username,
        email: formData.email,
      };
      
      // Only include password fields if they have values
      if (formData.currentPassword) {
        updateData.currentPassword = formData.currentPassword;
        updateData.newPassword = formData.newPassword;
      }
      
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        if (data.error?.fieldErrors) {
          setErrors(data.error.fieldErrors);
        }
        showToast(data.error?.message || 'Failed to update settings', 'error');
        return;
      }
      
      showToast('Settings updated successfully!', 'success');
      
      // Refresh user data
      if (refreshUser) {
        refreshUser();
      }
      
      // Clear password fields
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }));
      
    } catch (error) {
      console.error('Update settings error:', error);
      showToast('Failed to update settings', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <main className="min-h-screen bg-slate-900 text-slate-100 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Settings</h1>
        
        <form onSubmit={handleSubmit} className="bg-panel rounded-lg p-8 shadow-lg">
          <div className="space-y-6">
            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-slate-300 mb-2">
                Username
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                disabled={isSubmitting}
                className={`w-full p-3 rounded-lg bg-slate-800/50 border ${
                  errors.username ? 'border-red-500' : 'border-slate-700'
                } text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-accent-cyan focus:border-transparent disabled:opacity-50`}
                placeholder="Enter username"
              />
              {errors.username && (
                <p className="mt-1 text-sm text-red-400">{errors.username}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                disabled={isSubmitting}
                className={`w-full p-3 rounded-lg bg-slate-800/50 border ${
                  errors.email ? 'border-red-500' : 'border-slate-700'
                } text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-accent-cyan focus:border-transparent disabled:opacity-50`}
                placeholder="Enter email"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-400">{errors.email}</p>
              )}
            </div>

            <div className="pt-4 border-t border-slate-700/50">
              <h2 className="text-lg font-semibold text-white mb-4">Change Password</h2>
              <p className="text-slate-400 text-sm mb-6">
                Leave blank to keep current password
              </p>
            </div>

            {/* Current Password */}
            <div>
              <label htmlFor="currentPassword" className="block text-sm font-medium text-slate-300 mb-2">
                Current Password
              </label>
              <input
                type="password"
                id="currentPassword"
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleChange}
                disabled={isSubmitting}
                className={`w-full p-3 rounded-lg bg-slate-800/50 border ${
                  errors.currentPassword ? 'border-red-500' : 'border-slate-700'
                } text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-accent-cyan focus:border-transparent disabled:opacity-50`}
                placeholder="Enter current password"
              />
              {errors.currentPassword && (
                <p className="mt-1 text-sm text-red-400">{errors.currentPassword}</p>
              )}
            </div>

            {/* New Password */}
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-slate-300 mb-2">
                New Password
              </label>
              <input
                type="password"
                id="newPassword"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                disabled={isSubmitting}
                className={`w-full p-3 rounded-lg bg-slate-800/50 border ${
                  errors.newPassword ? 'border-red-500' : 'border-slate-700'
                } text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-accent-cyan focus:border-transparent disabled:opacity-50`}
                placeholder="Enter new password"
              />
              {errors.newPassword && (
                <p className="mt-1 text-sm text-red-400">{errors.newPassword}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-300 mb-2">
                Confirm New Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                disabled={isSubmitting}
                className={`w-full p-3 rounded-lg bg-slate-800/50 border ${
                  errors.confirmPassword ? 'border-red-500' : 'border-slate-700'
                } text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-accent-cyan focus:border-transparent disabled:opacity-50`}
                placeholder="Confirm new password"
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-400">{errors.confirmPassword}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="w-full py-3 px-6 bg-accent-cyan text-white font-medium rounded-lg hover:bg-cyan-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none"
            >
              {isSubmitting ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
