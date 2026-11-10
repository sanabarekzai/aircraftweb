'use client';

import { useEffect, ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';

interface RequireAuthProps {
  children: ReactNode;
}

export function RequireAuth({ children }: RequireAuthProps) {
  const { user, openAuthModal } = useAuth();

  useEffect(() => {
    if (!user) {
      openAuthModal();
    }
  }, [user, openAuthModal]);

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
