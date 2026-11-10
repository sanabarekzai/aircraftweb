import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/nav/Navbar';
import ClientProviders from '@/components/layout/ClientProviders';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const jetBrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: '400',
});

export const metadata: Metadata = {
  title: 'Phantom Aero - Aircraft Fan Site',
  description: 'A fan-made website for aviation enthusiasts: explore aircraft, browse photos, and learn about legendary planes.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${jetBrainsMono.variable} font-sans bg-space text-white min-h-screen`}>
        <ClientProviders>
          <Navbar />
          <main className="min-h-screen">{children}</main>
        </ClientProviders>
      </body>
    </html>
  );
}
