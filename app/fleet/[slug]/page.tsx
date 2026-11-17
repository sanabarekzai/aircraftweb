import { notFound } from 'next/navigation';
import { MediaViewer } from '@/components/detail/MediaViewer';
import { SpecAccordions } from '@/components/detail/SpecAccordions';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';

interface AircraftImage {
  id: string;
  url: string;
  caption: string | null;
  source: string;
  license: string;
}

interface AircraftDetail {
  id: string;
  slug: string;
  name: string;
  isConcept: boolean;
  category: string;
  era: string;
  releaseYear: number | null;
  topSpeedKmh: number;
  serviceCeilingFt: number;
  maxRangeNm: number;
  wingspanM: number | null;
  maxTakeoffWeightLbs: number | null;
  stallSpeedKts: number | null;
  liftToDragRatio: number | null;
  engineType: string;
  description: string;
  flightControlsDescription: string;
  youtubeId: string;
  images: AircraftImage[];
  tags: string[];
  avgRating: number;
  totalRatings: number;
}

async function getAircraft(slug: string): Promise<AircraftDetail | null> {
  const aircraft = await prisma.aircraft.findUnique({
    where: { slug },
    include: {
      images: { orderBy: { id: 'asc' } },
      tags: { orderBy: { name: 'asc' } },
      ratings: true,
    },
  });

  if (!aircraft) return null;

  const avgRating = aircraft.ratings.length > 0
    ? aircraft.ratings.reduce((sum, rating) => sum + rating.stars, 0) / aircraft.ratings.length
    : 0;

  return {
    ...aircraft,
    tags: aircraft.tags.map((tag) => tag.name),
    avgRating: Math.round(avgRating * 10) / 10,
    totalRatings: aircraft.ratings.length,
  };
}

function formatEra(era: string) {
  const eraMap: Record<string, string> = {
    PIONEER: 'Pioneer',
    WWII: 'WWII',
    JET_AGE: 'Jet Age',
    MODERN: 'Modern',
  };
  return eraMap[era] || era;
}

function formatCategory(category: string) {
  const categoryMap: Record<string, string> = {
    GENERAL_AVIATION: 'General Aviation',
    COMMERCIAL_AIRLINER: 'Commercial Airliner',
    MILITARY: 'Military',
    SUPERSONIC: 'Supersonic',
    EXPERIMENTAL: 'Experimental',
  };
  return categoryMap[category] || category;
}

export default async function AircraftDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const aircraft = await getAircraft(slug);

  if (!aircraft) {
    return notFound();
  }

  return (
    <div className="min-h-screen bg-space">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="text-sm text-slate-400 mb-6" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-accent-cyan transition-colors">
            Home
          </Link>
          <span className="mx-2">&rsaquo;</span>
          <Link href="/fleet" className="hover:text-accent-cyan transition-colors">
            Fleet
          </Link>
          <span className="mx-2">&rsaquo;</span>
          <span className="text-white">{aircraft.name}</span>
        </nav>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{aircraft.name}</h1>
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-300">
                  {formatCategory(aircraft.category)}
                </span>
                <span className="text-slate-500">&bull;</span>
                <span className="text-sm text-slate-300">{formatEra(aircraft.era)}</span>
                {aircraft.isConcept && (
                  <>
                    <span className="text-slate-500">&bull;</span>
                    <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">
                      In Development
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Rating */}
          {aircraft.totalRatings > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <div className="flex text-amber-400">
                {'★'.repeat(Math.floor(aircraft.avgRating))}
                {'☆'.repeat(5 - Math.floor(aircraft.avgRating))}
              </div>
              <span className="text-slate-400">
                ({aircraft.avgRating.toFixed(1)} - {aircraft.totalRatings} ratings)
              </span>
            </div>
          )}

          {/* Description */}
          <p className="text-slate-300 mt-4 max-w-3xl">{aircraft.description}</p>
        </div>

        {/* Media Viewer */}
        <MediaViewer youtubeId={aircraft.youtubeId} images={aircraft.images} />

        {/* Specifications */}
        <SpecAccordions
          isDevelopmentProgram={aircraft.isConcept}
          airframeSpecs={{
            topSpeedKmh: aircraft.topSpeedKmh,
            serviceCeilingFt: aircraft.serviceCeilingFt,
            maxRangeNm: aircraft.maxRangeNm,
            wingspanM: aircraft.wingspanM,
            maxTakeoffWeightLbs: aircraft.maxTakeoffWeightLbs,
            stallSpeedKts: aircraft.stallSpeedKts,
            liftToDragRatio: aircraft.liftToDragRatio,
          }}
          engineSpecs={{
            engineType: aircraft.engineType,
            description: aircraft.description,
          }}
          aerodynamics={{
            liftToDragRatio: aircraft.liftToDragRatio,
            description: aircraft.description,
          }}
          flightControls={{
            description: aircraft.flightControlsDescription,
          }}
        />

        {/* Tags */}
        {aircraft.tags.length > 0 && (
          <div className="bg-panel rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Tags</h2>
            <div className="flex flex-wrap gap-2">
              {aircraft.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-slate-700/50 text-slate-300 rounded-full text-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Release Year */}
        {aircraft.releaseYear && (
          <div className="mt-8 p-4 bg-slate-800/50 rounded-lg">
            <p className="text-center text-slate-400">
              Released: {aircraft.releaseYear}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
