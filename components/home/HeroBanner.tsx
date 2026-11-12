'use client';

export function HeroBanner() {
  return (
    <div className="relative w-full h-[60vh] min-h-[400px] max-h-[700px] overflow-hidden rounded-2xl mb-8">
      {/* Background - using a gradient that suggests a supersonic jet */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-900 to-black" />
      
      {/* Simulated jet silhouette */}
      <div className="absolute inset-0 flex items-center justify-center">
        <svg
          className="w-full h-full max-w-2xl text-slate-700/30"
          viewBox="0 0 800 200"
          fill="currentColor"
        >
          {/* Jet body */}
          <path d="M50 100 L750 100 L720 110 L70 110 Z" />
          {/* Nose */}
          <path d="M50 100 L20 100 L20 90 L50 100 Z" />
          {/* Tail */}
          <path d="M750 100 L780 90 L780 110 Z" />
          {/* Wings */}
          <path d="M300 100 L350 80 L450 80 L400 100 Z" />
          <path d="M300 110 L350 130 L450 130 L400 110 Z" />
          {/* Afterburner glow */}
          <ellipse cx="750" cy="100" rx="20" ry="10" fill="currentColor" opacity="0.6" />
        </svg>
      </div>

      {/* Content overlay */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center px-4 text-center">
        {/* Main title */}
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 drop-shadow-lg">
          Phantom 3500
        </h1>
        
        {/* Subtitle */}
        <p className="text-lg md:text-xl text-slate-300 mb-2">
          Supersonic Concept Jet
        </p>
        
        <p className="text-sm text-slate-400 mb-6 italic">
          Phantom 3500 is a fictional concept aircraft.
        </p>

        {/* Telemetry spec card - floating glassmorphic */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 md:left-auto md:translate-x-0 md:bottom-auto md:top-1/2 md:-translate-y-1/2 md:right-20 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 shadow-lg animate-float">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-accent-cyan font-mono text-sm font-bold">MACH</span>
              <span className="text-white font-mono text-lg font-bold">2.4</span>
              <span className="text-slate-400 text-xs">approx.</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-accent-cyan font-mono text-sm font-bold">RANGE</span>
              <span className="text-white font-mono text-lg font-bold">4,200 NM</span>
              <span className="text-slate-400 text-xs">approx.</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-accent-cyan font-mono text-sm font-bold">CEILING</span>
              <span className="text-white font-mono text-lg font-bold">51,000 FT</span>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Motion blur effect */}
        <div className="absolute top-0 left-0 w-1/3 h-full bg-gradient-to-r from-transparent to-slate-800/20" />
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-transparent to-slate-800/20" />
        
        {/* Speed lines */}
        <div className="absolute top-1/4 left-0 w-16 h-0.5 bg-white/20 transform -rotate-45 origin-left" />
        <div className="absolute top-1/3 left-0 w-24 h-0.5 bg-white/20 transform -rotate-45 origin-left" />
        <div className="absolute top-1/2 left-0 w-12 h-0.5 bg-white/20 transform -rotate-45 origin-left" />
      </div>
    </div>
  );
}
