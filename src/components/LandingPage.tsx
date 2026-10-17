import React, { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  SlidersHorizontal,
  Mic,
  MicOff,
  Layers,
  Box,
  FileCheck,
  Compass,
  CheckCircle2,
  ChevronDown,
  Building2,
  Palette,
} from 'lucide-react';
import { HouseSpec, GuidedOptions, ArchitecturalStyle, RoofType } from '../types/house';
import { HouseViewer } from './ThreeCanvas/HouseViewer';
import { SAMPLE_HOUSES } from '../lib/sampleHouses';

interface LandingPageProps {
  onStartGeneration: (prompt: string, guided?: GuidedOptions) => void;
  onExploreHouse: (spec: HouseSpec) => void;
  onNavigateToStudio: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartGeneration,
  onExploreHouse,
  onNavigateToStudio,
}) => {
  const [prompt, setPrompt] = useState(
    'A modern two-story house with 4 bedrooms, large glass windows, flat roof, open-plan kitchen, a garage, and a small garden. Warm wood and white concrete.'
  );
  const [showGuided, setShowGuided] = useState(false);
  const [isListening, setIsListening] = useState(false);

  // Guided preferences
  const [guided, setGuided] = useState<GuidedOptions>({
    plotWidth: 24,
    plotDepth: 30,
    floorCount: 2,
    bedrooms: 4,
    bathrooms: 3,
    style: 'Modern',
    climate: 'Temperate',
    budgetRange: '$300,000 - $500,000',
    materialsPreference: 'Warm Japanese Cedar & Architectural Concrete',
    roofPreference: 'flat',
    hasGarage: true,
    hasPool: true,
    hasGarden: true,
  });

  // Example prompt suggestions
  const PROMPT_SUGGESTIONS = [
    {
      title: 'Cedar & Glass Pavilion',
      desc: 'Modern 2-story, 4 bed, glass walls, flat cantilever roof, pool & garage',
      prompt:
        'A modern two-story house with 4 bedrooms, large glass windows, flat roof, open-plan kitchen, a garage, and a small garden. Warm wood and white concrete.',
    },
    {
      title: 'Nordic Fjord Cabin',
      desc: 'Scandinavian pitched gable roof, charred timber, sauna, panoramic glazing',
      prompt:
        'A Scandinavian timber retreat with steep standing seam gable roof, double-height cathedral living room, Finnish sauna, 2 bedrooms, and blonde pine interiors.',
    },
    {
      title: 'Mediterranean Villa',
      desc: 'Courtyard estate with terracotta roof, turquoise pool, stucco arches',
      prompt:
        'A sun-drenched Mediterranean villa with terracotta tile roof, central courtyard, lap pool, arched colonnade, 4 bedrooms, and limestone facade.',
    },
    {
      title: 'Kyoto Zen Courtyard',
      desc: 'Single-story minimalist with internal Japanese rock garden and engawa deck',
      prompt:
        'A single-story Japanese modern house with central zen rock garden, charred yakisugi cedar siding, tatami lounge, sliding glass panels, and deep eaves.',
    },
  ];

  // Speech to Text support
  const toggleSpeechRecognition = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech recognition is not supported in this browser. Please type your prompt.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setPrompt((prev) => (prev ? `${prev} ${transcript}` : transcript));
        setIsListening(false);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  const handleGenerate = () => {
    if (!prompt.trim()) return;
    onStartGeneration(prompt, showGuided ? guided : undefined);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 px-4 sm:px-6 max-w-7xl mx-auto w-full">
        {/* Glow backdrop effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[450px] bg-gradient-to-tr from-indigo-600/15 via-sky-500/15 to-purple-500/15 blur-[120px] rounded-full pointer-events-none" />

        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-950/60 border border-indigo-700/40 text-indigo-300 text-xs font-medium mb-6">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
            <span>Next-Generation Generative Architecture</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.15]">
            Describe your dream home.{' '}
            <span className="bg-gradient-to-r from-indigo-400 via-sky-300 to-indigo-200 bg-clip-text text-transparent">
              AI builds the 3D architecture.
            </span>
          </h1>

          <p className="mt-5 text-base sm:text-lg text-slate-400 leading-relaxed max-w-2xl mx-auto">
            Speak or type what you envision. Our architectural engine calculates physics-compliant floor plans,
            structural spans, and procedural 3D models you can inspect, modify, and export in real time.
          </p>
        </div>

        {/* Prompt Input Box */}
        <div className="max-w-3xl mx-auto mb-12">
          <div className="p-2 sm:p-3 rounded-2xl bg-slate-900/90 backdrop-blur-xl border border-slate-700/80 shadow-2xl shadow-indigo-950/50 focus-within:border-indigo-500/80 transition-all">
            <div className="relative">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe your dream house... e.g., A modern 2-story residence with 4 bedrooms, floor-to-ceiling glass windows, a flat cantilever roof, infinity pool, and Japanese cedar siding."
                rows={3}
                className="w-full bg-transparent text-slate-100 placeholder-slate-500 text-sm sm:text-base p-3 resize-none focus:outline-none leading-relaxed"
              />
            </div>

            {/* Action controls below text area */}
            <div className="flex flex-wrap items-center justify-between pt-2 border-t border-slate-800 gap-2">
              <div className="flex items-center gap-2">
                {/* Voice Input Button */}
                <button
                  type="button"
                  onClick={toggleSpeechRecognition}
                  className={`p-2 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all ${
                    isListening
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50 animate-pulse'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                  title={isListening ? 'Listening... click to stop' : 'Speak your description'}
                >
                  {isListening ? <MicOff className="w-4 h-4 text-rose-400" /> : <Mic className="w-4 h-4 text-indigo-400" />}
                  <span className="hidden sm:inline">{isListening ? 'Listening...' : 'Voice'}</span>
                </button>

                {/* Guided Settings Toggle */}
                <button
                  type="button"
                  onClick={() => setShowGuided((prev) => !prev)}
                  className={`px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all ${
                    showGuided
                      ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Guided Inputs</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showGuided ? 'rotate-180' : ''}`} />
                </button>
              </div>

              {/* Generate Button */}
              <button
                type="button"
                onClick={handleGenerate}
                className="px-5 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-indigo-600 via-indigo-500 to-sky-500 hover:from-indigo-500 hover:to-sky-400 text-white shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all group"
              >
                <span>Generate 3D Architecture</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>

            {/* Guided Inputs Drawer */}
            {showGuided && (
              <div className="mt-4 pt-4 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                {/* Style */}
                <div>
                  <label className="text-slate-400 block mb-1">Architectural Style</label>
                  <select
                    value={guided.style}
                    onChange={(e) => setGuided({ ...guided, style: e.target.value as ArchitecturalStyle })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200"
                  >
                    <option value="Modern">Modern</option>
                    <option value="Scandinavian">Scandinavian</option>
                    <option value="Minimalist">Minimalist</option>
                    <option value="Mediterranean">Mediterranean</option>
                    <option value="Japanese Zen">Japanese Zen</option>
                    <option value="Contemporary">Contemporary</option>
                    <option value="Colonial / Classic">Colonial / Classic</option>
                  </select>
                </div>

                {/* Floors */}
                <div>
                  <label className="text-slate-400 block mb-1">Floors</label>
                  <select
                    value={guided.floorCount}
                    onChange={(e) => setGuided({ ...guided, floorCount: parseInt(e.target.value, 10) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200"
                  >
                    <option value="1">1 Story (Bungalow)</option>
                    <option value="2">2 Stories</option>
                    <option value="3">3 Stories</option>
                  </select>
                </div>

                {/* Bedrooms */}
                <div>
                  <label className="text-slate-400 block mb-1">Bedrooms</label>
                  <select
                    value={guided.bedrooms}
                    onChange={(e) => setGuided({ ...guided, bedrooms: parseInt(e.target.value, 10) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200"
                  >
                    <option value="1">1 Bedroom</option>
                    <option value="2">2 Bedrooms</option>
                    <option value="3">3 Bedrooms</option>
                    <option value="4">4 Bedrooms</option>
                    <option value="5">5+ Bedrooms</option>
                  </select>
                </div>

                {/* Roof Style */}
                <div>
                  <label className="text-slate-400 block mb-1">Roof Profile</label>
                  <select
                    value={guided.roofPreference}
                    onChange={(e) => setGuided({ ...guided, roofPreference: e.target.value as RoofType })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200"
                  >
                    <option value="flat">Flat Modern Cantilever</option>
                    <option value="sloped_gable">Sloped Gable Pitch</option>
                    <option value="hip">Hip Roof</option>
                    <option value="terrace">Rooftop Terrace</option>
                  </select>
                </div>

                {/* Plot Size */}
                <div className="col-span-2">
                  <label className="text-slate-400 block mb-1">
                    Plot Dimensions: {guided.plotWidth}m × {guided.plotDepth}m ({guided.plotWidth * guided.plotDepth} m²)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min={16}
                      max={40}
                      value={guided.plotWidth}
                      onChange={(e) => setGuided({ ...guided, plotWidth: parseInt(e.target.value, 10) })}
                      className="w-full accent-indigo-500"
                    />
                  </div>
                </div>

                {/* Feature Toggles */}
                <div className="col-span-2 flex items-center gap-4 pt-4">
                  <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={guided.hasPool}
                      onChange={(e) => setGuided({ ...guided, hasPool: e.target.checked })}
                      className="rounded accent-indigo-500"
                    />
                    <span>Swimming Pool</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={guided.hasGarage}
                      onChange={(e) => setGuided({ ...guided, hasGarage: e.target.checked })}
                      className="rounded accent-indigo-500"
                    />
                    <span>Garage</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={guided.hasGarden}
                      onChange={(e) => setGuided({ ...guided, hasGarden: e.target.checked })}
                      className="rounded accent-indigo-500"
                    />
                    <span>Garden</span>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Quick Idea Pills */}
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
            <span className="text-xs text-slate-500">Popular archetypes:</span>
            {PROMPT_SUGGESTIONS.map((item) => (
              <button
                key={item.title}
                onClick={() => setPrompt(item.prompt)}
                className="text-xs px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-400 hover:text-indigo-300 hover:border-slate-700 transition-colors"
              >
                {item.title}
              </button>
            ))}
          </div>
        </div>

        {/* Live 3D Interactive Teaser Showcase */}
        <div className="max-w-5xl mx-auto rounded-3xl overflow-hidden border border-slate-800/80 shadow-2xl bg-slate-900/80">
          <div className="p-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
              <h3 className="text-sm font-semibold text-white">Live Interactive 3D Architecture Canvas</h3>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                Procedural Three.js
              </span>
            </div>
            <button
              onClick={onNavigateToStudio}
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              <span>Open in Full Studio</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-[480px] w-full relative">
            <HouseViewer spec={SAMPLE_HOUSES[0]} />
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="py-16 bg-slate-900/50 border-t border-slate-800/80 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              From natural prompt to physics-tested blueprint
            </h2>
            <p className="mt-2 text-sm sm:text-base text-slate-400">
              DreamHome AI delivers complete architectural precision, not just 2D pictures.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center mb-4">
                <Box className="w-5 h-5 text-indigo-400" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Procedural 3D Geometry</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Every wall, window opening, door lintel, floor slab, and roof pitch is procedurally constructed from
                metric coordinates with accurate materials and daylight shadows.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all">
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center mb-4">
                <Layers className="w-5 h-5 text-sky-400" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">2D Vector Floor Plans</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Instant architectural SVG blueprints with room dimension annotations, calculated surface areas, door swings,
                and export to high-res PNG and vector PDF.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-4">
                <FileCheck className="w-5 h-5 text-emerald-400" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Structural Rules & Sanity</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Automated collision detection prevents overlapping rooms, verifies minimum habitable square footage,
                and ensures upper levels have physical ground-floor support.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Inspirational Gallery Teaser */}
      <section className="py-16 px-4 sm:px-6 max-w-7xl mx-auto w-full">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Curated Architectural Designs</h2>
            <p className="text-sm text-slate-400 mt-1">Explore pre-generated dream homes crafted with DreamHome AI</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {SAMPLE_HOUSES.map((house) => (
            <div
              key={house.id}
              onClick={() => onExploreHouse(house)}
              className="group cursor-pointer rounded-2xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50 overflow-hidden transition-all hover:-translate-y-1 shadow-lg"
            >
              <div className="h-44 bg-slate-800/80 relative overflow-hidden flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent z-10" />
                <Building2 className="w-16 h-16 text-indigo-400/30 group-hover:scale-110 transition-transform duration-500" />
                <span className="absolute top-3 left-3 z-20 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-900/90 text-indigo-300 border border-slate-700">
                  {house.style}
                </span>
                <span className="absolute bottom-3 left-3 z-20 text-xs font-mono font-bold text-white">
                  {house.stats.livableArea} m² • {house.stats.bedroomCount} Beds
                </span>
              </div>

              <div className="p-4">
                <h4 className="font-bold text-white text-sm group-hover:text-indigo-300 transition-colors">
                  {house.title}
                </h4>
                <p className="text-xs text-slate-400 line-clamp-2 mt-1.5 leading-relaxed">
                  {house.designSummary}
                </p>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-indigo-400 font-semibold">
                  <span>Open in 3D Studio</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-8 border-t border-slate-800/80 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4">
          <p>© {new Date().getFullYear()} DreamHome AI. Procedural 3D Architectural Synthesis Platform.</p>
        </div>
      </footer>
    </div>
  );
};
