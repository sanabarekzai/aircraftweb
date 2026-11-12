import { HeroBanner } from '@/components/home/HeroBanner';
import { FeaturedAircraft } from '@/components/home/FeaturedAircraft';
import { TopSpeedsLeaderboard } from '@/components/home/TopSpeedsLeaderboard';

export default function Home() {
  return (
    <div className="min-h-screen bg-space">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <HeroBanner />

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
          <FeaturedAircraft />
          <TopSpeedsLeaderboard />
        </section>

        {/* LESSONS_SLOT */}

        {/* PHYSICS_LAB_SLOT */}
      </div>
    </div>
  );
}
