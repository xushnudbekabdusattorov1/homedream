import React, { useState } from 'react';
import { HouseSpec, ArchitecturalStyle } from '../../types/house';
import { SAMPLE_HOUSES } from '../../lib/sampleHouses';
import { Compass, Filter, ArrowRight, Building, Layers, Maximize } from 'lucide-react';

interface InspirationGalleryProps {
  onSelectHouse: (house: HouseSpec) => void;
}

export const InspirationGallery: React.FC<InspirationGalleryProps> = ({ onSelectHouse }) => {
  const [selectedStyle, setSelectedStyle] = useState<string>('all');
  const [selectedBeds, setSelectedBeds] = useState<string>('all');

  const filteredHouses = SAMPLE_HOUSES.filter((h) => {
    if (selectedStyle !== 'all' && h.style !== selectedStyle) return false;
    if (selectedBeds !== 'all') {
      const beds = parseInt(selectedBeds, 10);
      if (h.stats.bedroomCount !== beds) return false;
    }
    return true;
  });

  const styles: string[] = ['all', 'Modern', 'Scandinavian', 'Mediterranean', 'Japanese Zen'];

  return (
    <div className="flex-1 w-full bg-slate-950 text-slate-100 p-6 overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/60 border border-indigo-700/40 text-indigo-300 text-xs font-medium mb-3">
              <Compass className="w-3.5 h-3.5" />
              <span>Architectural Exploration</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Inspiration Gallery</h1>
            <p className="text-sm text-slate-400 mt-1">
              Browse world-class architectural designs generated with DreamHome AI. Click any house to open and modify it.
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs">
              <span className="text-slate-400 px-2 flex items-center gap-1">
                <Filter className="w-3 h-3" />
                <span>Style:</span>
              </span>
              {styles.map((style) => (
                <button
                  key={style}
                  onClick={() => setSelectedStyle(style)}
                  className={`px-2.5 py-1 rounded-lg capitalize transition-all ${
                    selectedStyle === style
                      ? 'bg-indigo-600 text-white font-semibold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {style}
                </button>
              ))}
            </div>

            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs">
              <span className="text-slate-400 px-2">Beds:</span>
              {['all', '2', '4'].map((b) => (
                <button
                  key={b}
                  onClick={() => setSelectedBeds(b)}
                  className={`px-2.5 py-1 rounded-lg capitalize transition-all ${
                    selectedBeds === b ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {b === 'all' ? 'All' : `${b} Bed`}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Houses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredHouses.map((house) => (
            <div
              key={house.id}
              onClick={() => onSelectHouse(house)}
              className="group cursor-pointer rounded-2xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50 overflow-hidden transition-all duration-300 hover:-translate-y-1 shadow-xl flex flex-col"
            >
              {/* Graphic Banner */}
              <div className="h-52 bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-800 relative overflow-hidden flex items-center justify-center p-6">
                <div className="absolute inset-0 bg-slate-950/40 group-hover:bg-transparent transition-colors" />
                <Building className="w-24 h-24 text-indigo-400/25 group-hover:scale-105 transition-transform duration-500" />

                <span className="absolute top-4 left-4 z-10 text-xs font-bold px-2.5 py-1 rounded-full bg-slate-950/80 text-indigo-300 border border-indigo-700/50">
                  {house.style}
                </span>

                <div className="absolute bottom-4 left-4 right-4 z-10 flex items-center justify-between text-xs text-white">
                  <span className="font-mono font-bold bg-slate-950/80 px-2.5 py-1 rounded-lg border border-slate-800">
                    {house.stats.livableArea} m² Livable
                  </span>
                  <span className="font-semibold bg-emerald-950/80 text-emerald-300 px-2.5 py-1 rounded-lg border border-emerald-700/50">
                    {house.stats.bedroomCount} Beds • {house.stats.floorCount} Fl
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors">
                    {house.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-2 line-clamp-3 leading-relaxed">
                    {house.designSummary}
                  </p>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs font-bold text-indigo-400">
                  <span>Open in 3D Studio</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
