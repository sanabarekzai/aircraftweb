'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { LogOut, LogIn } from 'lucide-react';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout, openAuthModal } = useAuth();
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/fleet', label: 'Fleet' },
    { href: '/compare', label: 'Compare' },
    { href: '/logbook', label: 'Logbook' },
  ];

  return (
    <>
      <nav className="sticky top-0 z-50 bg-space/80 backdrop-blur-sm border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="text-xl font-bold text-white hover:text-accent-cyan transition-colors">
                PHANTOM AERO
              </Link>
            </div>

            <div className="hidden md:flex items-center space-x-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-slate-300 hover:text-white hover:text-accent-cyan transition-colors focus-visible:ring-2 focus-visible:ring-accent-cyan focus-visible:outline-none rounded-md px-2 py-1"
                >
                  {link.label}
                </Link>
              ))}
            </div>

            <div className="hidden md:flex items-center">
              {user ? (
                <div className="flex items-center space-x-4">
                  <span className="text-slate-300 text-sm">
                    Welcome, {user.username}
                  </span>
                  <button
                    onClick={logout}
                    aria-label="Logout"
                    className="flex items-center gap-2 text-slate-300 hover:text-white hover:text-accent-cyan transition-colors focus-visible:ring-2 focus-visible:ring-accent-cyan focus-visible:outline-none rounded-md px-2 py-1"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={openAuthModal}
                  aria-label="Login"
                  className="flex items-center gap-2 text-slate-300 hover:text-white hover:text-accent-cyan transition-colors focus-visible:ring-2 focus-visible:ring-accent-cyan focus-visible:outline-none rounded-md px-2 py-1"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Login</span>
                </button>
              )}
            </div>

            <div className="md:hidden">
              <button
                onClick={() => setIsOpen(true)}
                aria-label="Open menu"
                className="text-slate-300 hover:text-white hover:text-accent-cyan transition-colors focus-visible:ring-2 focus-visible:ring-accent-cyan focus-visible:outline-none rounded-md p-2"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile navigation menu"
        >
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          <div
            ref={drawerRef}
            className="fixed top-0 right-0 h-full w-72 bg-panel shadow-2xl transform translate-x-0 transition-transform duration-300 ease-in-out"
            tabIndex={-1}
          >
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <span className="text-xl font-bold text-white">PHANTOM AERO</span>
              <button
                onClick={() => setIsOpen(false)}
                aria-label="Close menu"
                className="text-slate-300 hover:text-white hover:text-accent-cyan transition-colors focus-visible:ring-2 focus-visible:ring-accent-cyan focus-visible:outline-none rounded-md p-2"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="p-4">
              <nav className="flex flex-col space-y-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className="text-slate-300 hover:text-white hover:text-accent-cyan transition-colors focus-visible:ring-2 focus-visible:ring-accent-cyan focus-visible:outline-none rounded-md px-2 py-2 text-lg"
                  >
                    {link.label}
                  </Link>
                ))}
                {user ? (
                  <>
                    <div className="pt-2 border-t border-slate-700 mt-2">
                      <span className="text-slate-400 text-sm block px-2 py-1">
                        Welcome, {user.username}
                      </span>
                      <button
                        onClick={() => {
                          logout();
                          setIsOpen(false);
                        }}
                        className="text-slate-300 hover:text-white hover:text-accent-cyan transition-colors focus-visible:ring-2 focus-visible:ring-accent-cyan focus-visible:outline-none rounded-md px-2 py-2 text-lg w-full text-left"
                      >
                        Logout
                      </button>
                    </div>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      openAuthModal();
                      setIsOpen(false);
                    }}
                    className="text-slate-300 hover:text-white hover:text-accent-cyan transition-colors focus-visible:ring-2 focus-visible:ring-accent-cyan focus-visible:outline-none rounded-md px-2 py-2 text-lg mt-4"
                  >
                    Login
                  </button>
                )}
              </nav>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
