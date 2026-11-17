'use client';

export function HeroBanner() {
  return (
    <div className="relative w-full h-[60vh] min-h-[400px] max-h-[700px] overflow-hidden rounded-2xl mb-8">
      {/* User-provided Phantom 3500 image */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/aircraft/phantom-3500.png"
        alt="Artist's rendering of the Phantom 3500 above mountains"
        className="absolute inset-0 h-full w-full object-cover object-center"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/60 via-slate-950/30 to-slate-950/55" />

      {/* Content overlay */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center px-4 text-center">
        {/* Main title */}
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 drop-shadow-lg">
          Phantom 3500
        </h1>
        
        {/* Subtitle */}
        <p className="text-lg md:text-xl text-slate-300 mb-2">
          Clean-Sheet Business Jet in Development
        </p>
        
        <p className="text-sm text-slate-400 mb-6 italic">
          Otto Aerospace program · manufacturer targets, not flight-tested
        </p>
        <a href="https://ottoaerospace.com/aircraft/" target="_blank" rel="noopener noreferrer" className="text-xs text-cyan-200 underline">
          Source: Otto Aerospace
        </a>

        {/* Telemetry spec card - floating glassmorphic */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 md:left-auto md:translate-x-0 md:bottom-auto md:top-1/2 md:-translate-y-1/2 md:right-20 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 shadow-lg animate-float">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-accent-cyan font-mono text-sm font-bold">SPEED</span>
              <span className="text-white font-mono text-lg font-bold">Transonic</span>
              <span className="text-slate-400 text-xs">no Mach published</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-accent-cyan font-mono text-sm font-bold">RANGE</span>
              <span className="text-white font-mono text-lg font-bold">3,500 NM</span>
              <span className="text-slate-400 text-xs">max target</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-accent-cyan font-mono text-sm font-bold">CRUISE</span>
              <span className="text-white font-mono text-lg font-bold">51,000 FT</span>
            </div>
            <p className="pl-14 text-[10px] text-slate-400">3,200 NM NBAA range · 4 passengers</p>
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
