'use client';

import { ToastProvider } from '@/lib/toast';

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return <ToastProvider>{children}</ToastProvider>;
}
