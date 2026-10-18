import React, { useState } from 'react';
import { HouseSpec, RoomSpec } from '../../types/house';
import {
  TEXTURE_LIBRARY,
  SURFACE_TARGETS,
  MaterialCategory,
  TargetSurface,
  TextureItem,
  applyTextureToSpec,
} from '../../lib/materialsCatalog';
import {
  Palette,
  Check,
  Sparkles,
  Layers,
  RotateCcw,
  MousePointerClick,
  Info,
  Maximize2,
} from 'lucide-react';

interface MaterialsPanelProps {
  spec: HouseSpec;
  selectedRoom?: RoomSpec | null;
  activeSurface: TargetSurface;
  onSelectSurface: (surface: TargetSurface) => void;
  onUpdateSpec: (updated: HouseSpec) => void;
  onClose?: () => void;
}

export const MaterialsPanel: React.FC<MaterialsPanelProps> = ({
  spec,
  selectedRoom,
  activeSurface,
  onSelectSurface,
  onUpdateSpec,
  onClose,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<MaterialCategory | 'all'>('all');
  const [appliedNotification, setAppliedNotification] = useState<string | null>(null);

  const filteredTextures = TEXTURE_LIBRARY.filter((item) => {
    if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
    return true;
  });

  const handleApply = (texture: TextureItem) => {
    const updated = applyTextureToSpec(spec, activeSurface, texture, selectedRoom?.id);
    onUpdateSpec(updated);

    const surfaceName =
      SURFACE_TARGETS.find((s) => s.id === activeSurface)?.label || activeSurface;
    setAppliedNotification(`Applied ${texture.name} to ${surfaceName}`);
    setTimeout(() => setAppliedNotification(null), 2500);
  };

  return (
    <div className="w-full h-full bg-slate-900 border-l border-slate-800 flex flex-col overflow-hidden text-slate-100 shadow-2xl">
      {/* Top Header */}
      <div className="p-3.5 border-b border-slate-800 bg-slate-900/95 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4 text-indigo-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-white">Materials & Finishes</h3>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-xs px-2 py-0.5 rounded hover:bg-slate-800"
          >
            ✕ Close
          </button>
        )}
      </div>

      {/* Surface Selector Bar */}
      <div className="p-3 bg-slate-950/60 border-b border-slate-800">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
            <MousePointerClick className="w-3.5 h-3.5 text-indigo-400" />
            <span>Target Surface:</span>
          </span>
          <span className="text-[10px] text-slate-400">
            {activeSurface === 'selectedRoomFloor' && selectedRoom
              ? `Room: ${selectedRoom.name}`
              : 'Click 3D surface or select below'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          {SURFACE_TARGETS.map((s) => {
            const isActive = activeSurface === s.id;
            return (
              <button
                key={s.id}
                onClick={() => onSelectSurface(s.id)}
                className={`px-2.5 py-1.5 rounded-xl text-[11px] font-medium text-left flex items-center gap-2 transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-400'
                    : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60'
                }`}
              >
                <span>{s.icon}</span>
                <span className="truncate">{s.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Category Pills (Wood, Concrete, Brick, Tile) */}
      <div className="p-2 border-b border-slate-800 bg-slate-900/80 flex items-center gap-1 overflow-x-auto scrollbar-none text-xs">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-3 py-1 rounded-lg capitalize whitespace-nowrap transition-all ${
            selectedCategory === 'all'
              ? 'bg-indigo-600 text-white font-semibold'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          All ({TEXTURE_LIBRARY.length})
        </button>
        <button
          onClick={() => setSelectedCategory('wood')}
          className={`px-3 py-1 rounded-lg capitalize whitespace-nowrap transition-all ${
            selectedCategory === 'wood'
              ? 'bg-indigo-600 text-white font-semibold'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          🌲 Wood
        </button>
        <button
          onClick={() => setSelectedCategory('concrete')}
          className={`px-3 py-1 rounded-lg capitalize whitespace-nowrap transition-all ${
            selectedCategory === 'concrete'
              ? 'bg-indigo-600 text-white font-semibold'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          🏛️ Concrete
        </button>
        <button
          onClick={() => setSelectedCategory('brick')}
          className={`px-3 py-1 rounded-lg capitalize whitespace-nowrap transition-all ${
            selectedCategory === 'brick'
              ? 'bg-indigo-600 text-white font-semibold'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          🧱 Brick
        </button>
        <button
          onClick={() => setSelectedCategory('tile')}
          className={`px-3 py-1 rounded-lg capitalize whitespace-nowrap transition-all ${
            selectedCategory === 'tile'
              ? 'bg-indigo-600 text-white font-semibold'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          🔲 Tile
        </button>
      </div>

      {/* Applied Toast */}
      {appliedNotification && (
        <div className="m-3 p-2 rounded-xl bg-emerald-950/90 border border-emerald-700/60 text-xs text-emerald-300 flex items-center gap-2 animate-fadeIn">
          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="truncate">{appliedNotification}</span>
        </div>
      )}

      {/* Textures Grid */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {filteredTextures.map((texture) => {
          return (
            <div
              key={texture.id}
              onClick={() => handleApply(texture)}
              className="p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/70 hover:border-indigo-500/60 cursor-pointer transition-all group flex gap-3 items-center"
            >
              {/* Texture Swatch Preview */}
              <div
                className="w-14 h-14 rounded-xl border-2 border-slate-600/80 shadow-md flex items-center justify-center shrink-0 relative overflow-hidden group-hover:scale-105 transition-transform"
                style={{ backgroundColor: texture.color }}
              >
                {/* Visual texture hint lines */}
                {texture.category === 'wood' && (
                  <div className="w-full h-full opacity-35 bg-[repeating-linear-gradient(0deg,transparent,transparent_4px,rgba(0,0,0,0.5)_4px,rgba(0,0,0,0.5)_6px)]" />
                )}
                {texture.category === 'brick' && (
                  <div className="w-full h-full opacity-30 bg-[repeating-linear-gradient(0deg,transparent,transparent_6px,rgba(255,255,255,0.4)_6px,rgba(255,255,255,0.4)_8px)]" />
                )}
                {texture.category === 'tile' && (
                  <div className="w-full h-full opacity-40 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:8px_8px]" />
                )}
                {texture.category === 'concrete' && (
                  <div className="w-full h-full opacity-30 bg-[radial-gradient(rgba(0,0,0,0.4)_1px,transparent_1px)] [background-size:4px_4px]" />
                )}
                <span className="absolute bottom-1 right-1 text-[9px] px-1 py-0.2 rounded bg-black/60 font-mono text-white/90">
                  {texture.category}
                </span>
              </div>

              {/* Texture Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <h4 className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors truncate">
                    {texture.name}
                  </h4>
                  <span className="text-[10px] text-slate-400 capitalize">
                    {texture.category}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5 leading-snug">
                  {texture.description}
                </p>
                <div className="mt-1.5 flex items-center gap-3 text-[10px] text-slate-400 font-mono">
                  <span>Rough: {Math.round(texture.roughness * 100)}%</span>
                  <span>Metal: {Math.round(texture.metalness * 100)}%</span>
                </div>
              </div>

              {/* Apply Action Icon */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleApply(texture);
                }}
                className="px-2.5 py-1.5 rounded-lg bg-indigo-600/80 group-hover:bg-indigo-600 text-white text-[11px] font-semibold shrink-0 transition-colors shadow-xs"
              >
                Apply
              </button>
            </div>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/70 text-[11px] text-slate-400 flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <span>Click any 3D element to target its surface</span>
        </span>
        <button
          onClick={() => {
            // Reset to defaults
            const reset: HouseSpec = {
              ...spec,
              materials: {
                facadePrimary: { name: 'Japanese Cedar', color: '#c59b6d', roughness: 0.7, metalness: 0.05 },
                facadeSecondary: { name: 'Raw Concrete', color: '#ced4da', roughness: 0.8, metalness: 0.02 },
                windowFrame: { color: '#1e293b' },
                roofColor: '#1f2421',
                trimColor: '#0f172a',
              },
            };
            onUpdateSpec(reset);
          }}
          className="text-slate-400 hover:text-white flex items-center gap-1"
          title="Reset to default architectural finishes"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset</span>
        </button>
      </div>
    </div>
  );
};
