'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface SpecAccordionsProps {
  airframeSpecs: {
    topSpeedKmh: number;
    serviceCeilingFt: number;
    maxRangeNm: number;
    wingspanM: number;
    maxTakeoffWeightLbs: number;
    stallSpeedKts: number;
    liftToDragRatio: number;
  };
  engineSpecs: {
    engineType: string;
    description: string;
  };
  aerodynamics: {
    liftToDragRatio: number;
    description: string;
  };
  flightControls: {
    description: string;
  };
}

export function SpecAccordions({
  airframeSpecs,
  engineSpecs,
  aerodynamics,
  flightControls,
}: SpecAccordionsProps) {
  const [openSection, setOpenSection] = useState<string | null>('airframe');

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section);
  };

  const formatSpeed = (speed: number, unit: string = 'km/h') => {
    const machSpeeds = [2550, 2179, 3540, 2414, 1540];
    if (machSpeeds.includes(speed) && unit === 'km/h') {
      return `${speed} ${unit} (approx.)`;
    }
    return `${speed} ${unit}`;
  };

  return (
    <div className="bg-panel rounded-lg p-6 mb-8">
      <h2 className="text-xl font-semibold text-white mb-4">Specifications</h2>

      <div className="space-y-2">
        {/* Airframe Specs */}
        <div className="border border-slate-700 rounded-lg">
          <button
            onClick={() => toggleSection('airframe')}
            className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-700/50 transition-colors focus-visible:ring-2 focus-visible:ring-accent-cyan focus-visible:outline-none"
            aria-expanded={openSection === 'airframe'}
            aria-controls="airframe-content"
          >
            <span className="text-lg font-medium text-white">Airframe Specs</span>
            {openSection === 'airframe' ? (
              <ChevronUp className="w-5 h-5 text-slate-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-400" />
            )}
          </button>
          
          <div
            id="airframe-content"
            className={`transition-all duration-300 ease-in-out overflow-hidden ${
              openSection === 'airframe' ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
            }`}
            aria-expanded={openSection === 'airframe'}
          >
            <div className="p-4 pb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <SpecRow label="Top Speed" value={formatSpeed(airframeSpecs.topSpeedKmh, 'km/h')} />
              <SpecRow label="Service Ceiling" value={`${airframeSpecs.serviceCeilingFt.toLocaleString()} ft`} />
              <SpecRow label="Max Range" value={`${airframeSpecs.maxRangeNm.toLocaleString()} NM`} />
              <SpecRow label="Wingspan" value={`${airframeSpecs.wingspanM} m`} />
              <SpecRow label="MTOW" value={`${airframeSpecs.maxTakeoffWeightLbs.toLocaleString()} lbs`} />
              <SpecRow label="Stall Speed" value={`${airframeSpecs.stallSpeedKts} kts`} />
              <SpecRow label="L/D Ratio" value={airframeSpecs.liftToDragRatio.toFixed(1)} />
            </div>
          </div>
        </div>

        {/* Engine & Thrust */}
        <div className="border border-slate-700 rounded-lg">
          <button
            onClick={() => toggleSection('engine')}
            className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-700/50 transition-colors focus-visible:ring-2 focus-visible:ring-accent-cyan focus-visible:outline-none"
            aria-expanded={openSection === 'engine'}
            aria-controls="engine-content"
          >
            <span className="text-lg font-medium text-white">Engine & Thrust</span>
            {openSection === 'engine' ? (
              <ChevronUp className="w-5 h-5 text-slate-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-400" />
            )}
          </button>
          
          <div
            id="engine-content"
            className={`transition-all duration-300 ease-in-out overflow-hidden ${
              openSection === 'engine' ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
            }`}
            aria-expanded={openSection === 'engine'}
          >
            <div className="p-4 pb-6">
              <SpecRow label="Engine Type" value={engineSpecs.engineType} />
              <div className="mt-4">
                <p className="text-slate-300 text-sm leading-relaxed">{engineSpecs.description}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Aerodynamic Performance */}
        <div className="border border-slate-700 rounded-lg">
          <button
            onClick={() => toggleSection('aerodynamics')}
            className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-700/50 transition-colors focus-visible:ring-2 focus-visible:ring-accent-cyan focus-visible:outline-none"
            aria-expanded={openSection === 'aerodynamics'}
            aria-controls="aerodynamics-content"
          >
            <span className="text-lg font-medium text-white">Aerodynamic Performance</span>
            {openSection === 'aerodynamics' ? (
              <ChevronUp className="w-5 h-5 text-slate-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-400" />
            )}
          </button>
          
          <div
            id="aerodynamics-content"
            className={`transition-all duration-300 ease-in-out overflow-hidden ${
              openSection === 'aerodynamics' ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
            }`}
            aria-expanded={openSection === 'aerodynamics'}
          >
            <div className="p-4 pb-6">
              <SpecRow label="Lift-to-Drag Ratio" value={aerodynamics.liftToDragRatio.toFixed(1)} />
              <div className="mt-4">
                <p className="text-slate-300 text-sm leading-relaxed">{aerodynamics.description}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Flight Controls */}
        <div className="border border-slate-700 rounded-lg">
          <button
            onClick={() => toggleSection('controls')}
            className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-700/50 transition-colors focus-visible:ring-2 focus-visible:ring-accent-cyan focus-visible:outline-none"
            aria-expanded={openSection === 'controls'}
            aria-controls="controls-content"
          >
            <span className="text-lg font-medium text-white">Flight Controls</span>
            {openSection === 'controls' ? (
              <ChevronUp className="w-5 h-5 text-slate-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-400" />
            )}
          </button>
          
          <div
            id="controls-content"
            className={`transition-all duration-300 ease-in-out overflow-hidden ${
              openSection === 'controls' ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
            }`}
            aria-expanded={openSection === 'controls'}
          >
            <div className="p-4 pb-6">
              <p className="text-slate-300 text-sm leading-relaxed">{flightControls.description}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface SpecRowProps {
  label: string;
  value: string | number;
}

function SpecRow({ label, value }: SpecRowProps) {
  return (
    <div className="flex justify-between py-2 border-b border-slate-700/50 last:border-0">
      <span className="text-slate-400 text-sm">{label}</span>
      <span className="text-white font-mono text-sm">{value}</span>
    </div>
  );
}
