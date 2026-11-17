export function HeroBanner() {
  return (
    <section className="relative min-h-[520px] overflow-hidden rounded-2xl mb-8">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/aircraft/phantom-3500.png" alt="Artist's rendering of the Phantom 3500 above mountains" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-slate-950/60" />
      <div className="relative z-10 min-h-[520px] flex flex-col items-center justify-center px-4 py-8 text-center">
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">Phantom 3500</h1>
        <p className="text-lg md:text-xl text-slate-200 mb-2">Clean-Sheet Business Jet in Development</p>
        <p className="text-sm text-slate-300 mb-4 italic">Otto Aerospace program · manufacturer targets, not flight-tested</p>
        <a href="https://ottoaerospace.com/aircraft/" target="_blank" rel="noopener noreferrer" className="text-xs text-cyan-200 underline">Source: Otto Aerospace</a>
        <dl className="mt-6 w-full max-w-sm bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 shadow-lg space-y-3">
          <div className="flex items-center justify-between gap-3"><dt className="text-accent-cyan font-mono text-sm">SPEED</dt><dd className="text-white font-mono">Transonic</dd></div>
          <div className="flex items-center justify-between gap-3"><dt className="text-accent-cyan font-mono text-sm">MAX RANGE</dt><dd className="text-white font-mono">3,500 NM target</dd></div>
          <div className="flex items-center justify-between gap-3"><dt className="text-accent-cyan font-mono text-sm">CRUISE</dt><dd className="text-white font-mono">51,000 FT</dd></div>
          <div className="text-xs text-slate-300"><dt className="sr-only">NBAA range</dt><dd>3,200 NM NBAA range · 4 passengers</dd></div>
        </dl>
      </div>
    </section>
  );
}
