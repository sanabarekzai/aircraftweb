'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Eye, EyeOff, X, Loader2 } from 'lucide-react';

type AuthTab = 'login' | 'register';

export function AuthModal() {
  const { login, register, closeAuthModal } = useAuth();
  const [tab, setTab] = useState<AuthTab>('login');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setIsLoading(true);

      try {
        if (tab === 'login') {
          await login(email, password);
        } else {
          await register(email, username, password);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Authentication failed');
      } finally {
        setIsLoading(false);
      }
    },
    [tab, email, username, password, login, register]
  );

  const handleClose = useCallback(() => {
    if (!isLoading) {
      setError(null);
      setEmail('');
      setUsername('');
      setPassword('');
      setShowPassword(false);
      closeAuthModal();
    }
  }, [isLoading, closeAuthModal]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) {
        handleClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isLoading, handleClose]);

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isLoading) {
      handleClose();
    }
  };

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label="Authentication"
    >
      <div
        className="bg-panel rounded-lg shadow-2xl w-full max-w-md mx-4 p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleClose}
          aria-label="Close modal"
          disabled={isLoading}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors focus-visible:ring-2 focus-visible:ring-accent-cyan focus-visible:outline-none rounded-md p-1 disabled:opacity-50"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex border-b border-slate-700 mb-6">
          <button
            onClick={() => setTab('login')}
            className={`px-4 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-accent-cyan focus-visible:outline-none rounded-md ${
              tab === 'login'
                ? 'text-accent-cyan border-b-2 border-accent-cyan'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            disabled={isLoading}
            aria-label="Switch to login tab"
          >
            Login
          </button>
          <button
            onClick={() => setTab('register')}
            className={`px-4 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-accent-cyan focus-visible:outline-none rounded-md ${
              tab === 'register'
                ? 'text-accent-cyan border-b-2 border-accent-cyan'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            disabled={isLoading}
            aria-label="Switch to register tab"
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-md text-red-400 text-sm" role="alert">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-accent-cyan focus:border-transparent transition-colors"
              placeholder="your@email.com"
              disabled={isLoading}
              aria-required="true"
            />
          </div>

          {tab === 'register' && (
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-slate-300 mb-1">
                Username
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                minLength={3}
                className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-accent-cyan focus:border-transparent transition-colors"
                placeholder="username"
                disabled={isLoading}
                aria-required="true"
              />
            </div>
          )}

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={tab === 'register' ? 8 : 1}
                className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-accent-cyan focus:border-transparent transition-colors pr-10"
                placeholder={tab === 'login' ? 'Password' : 'Min 8 characters'}
                disabled={isLoading}
                aria-required="true"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors focus-visible:ring-2 focus-visible:ring-accent-cyan focus-visible:outline-none rounded-md p-1"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2 px-4 bg-accent-cyan hover:bg-accent-cyan/90 disabled:bg-accent-cyan/50 disabled:cursor-not-allowed text-white font-medium rounded-md transition-colors focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:outline-none flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Please wait...
              </>
            ) : tab === 'login' ? (
              'Login'
            ) : (
              'Create Account'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
