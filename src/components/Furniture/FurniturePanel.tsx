import React, { useState } from 'react';
import { FurnitureItem, FurnitureCategory } from '../../types/house';
import {
  FURNITURE_CATALOG,
  CatalogFurnitureItem,
  createFurnitureInstance,
} from '../../lib/furnitureCatalog';
import {
  Armchair,
  Bed,
  Utensils,
  Briefcase,
  Bath,
  RotateCw,
  Trash2,
  Plus,
  GripVertical,
  Check,
  Palette,
  Layers,
  Sparkles,
  Info,
} from 'lucide-react';

interface FurniturePanelProps {
  furniture: FurnitureItem[];
  activeFloor: number;
  selectedFurnitureId?: string | null;
  onSelectFurniture: (item: FurnitureItem | null) => void;
  onAddFurniture: (item: FurnitureItem) => void;
  onUpdateFurniture: (item: FurnitureItem) => void;
  onDeleteFurniture: (id: string) => void;
  onClearFloorFurniture: (floor: number) => void;
}

export const FurniturePanel: React.FC<FurniturePanelProps> = ({
  furniture,
  activeFloor,
  selectedFurnitureId,
  onSelectFurniture,
  onAddFurniture,
  onUpdateFurniture,
  onDeleteFurniture,
  onClearFloorFurniture,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<FurnitureCategory | 'all'>('all');
  const [activeTab, setActiveTab] = useState<'catalog' | 'placed'>('catalog');

  const filteredCatalog = FURNITURE_CATALOG.filter((item) => {
    if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
    return true;
  });

  const floorFurniture = (furniture || []).filter((f) => f.floor === activeFloor);
  const selectedFurniture = floorFurniture.find((f) => f.id === selectedFurnitureId);

  // Quick finish palettes for placed furniture
  const FINISH_PRESETS = [
    { name: 'Charcoal Linen', color: '#334155', material: 'fabric' },
    { name: 'Cream Bouclé', color: '#f1f5f9', material: 'fabric' },
    { name: 'Cognac Leather', color: '#b45309', material: 'leather' },
    { name: 'Forest Velvet', color: '#14532d', material: 'fabric' },
    { name: 'Solid Oak', color: '#d4a373', material: 'wood' },
    { name: 'Rich Walnut', color: '#854d0e', material: 'wood' },
    { name: 'Carrara Marble', color: '#ffffff', material: 'marble' },
    { name: 'Matte Black Metal', color: '#1e293b', material: 'metal' },
  ];

  // Drag start handler for catalog cards
  const handleDragStart = (e: React.DragEvent, item: CatalogFurnitureItem) => {
    e.dataTransfer.setData('application/json', JSON.stringify(item));
    e.dataTransfer.effectAllowed = 'copy';
  };

  // Quick add to center of floor
  const handleQuickAdd = (item: CatalogFurnitureItem) => {
    const instance = createFurnitureInstance(item, activeFloor, 0, 0);
    onAddFurniture(instance);
    onSelectFurniture(instance);
    setActiveTab('placed');
  };

  return (
    <div className="w-full h-full bg-slate-900 border-l border-slate-800 flex flex-col overflow-hidden text-slate-100">
      {/* Top Header */}
      <div className="p-3.5 border-b border-slate-800 bg-slate-900/95 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Armchair className="w-4 h-4 text-indigo-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-white">Interior Furniture</h3>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800">
          Level {activeFloor}
        </span>
      </div>

      {/* Tabs: Catalog vs Placed in Room */}
      <div className="flex border-b border-slate-800 bg-slate-950/60 p-1">
        <button
          onClick={() => setActiveTab('catalog')}
          className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'catalog'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <span>Catalog</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-900/60 text-indigo-200">
            {FURNITURE_CATALOG.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('placed')}
          className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'placed'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <span>Placed Items</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-slate-300">
            {floorFurniture.length}
          </span>
        </button>
      </div>

      {/* Mode A: Furniture Catalog */}
      {activeTab === 'catalog' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Category Pills */}
          <div className="p-2 border-b border-slate-800 bg-slate-900/60 flex items-center gap-1 overflow-x-auto scrollbar-none text-[11px]">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-2.5 py-1 rounded-lg capitalize whitespace-nowrap transition-all ${
                selectedCategory === 'all'
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setSelectedCategory('living')}
              className={`px-2.5 py-1 rounded-lg capitalize whitespace-nowrap transition-all ${
                selectedCategory === 'living'
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              Living
            </button>
            <button
              onClick={() => setSelectedCategory('bedroom')}
              className={`px-2.5 py-1 rounded-lg capitalize whitespace-nowrap transition-all ${
                selectedCategory === 'bedroom'
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              Bedroom
            </button>
            <button
              onClick={() => setSelectedCategory('dining')}
              className={`px-2.5 py-1 rounded-lg capitalize whitespace-nowrap transition-all ${
                selectedCategory === 'dining'
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              Dining
            </button>
            <button
              onClick={() => setSelectedCategory('kitchen')}
              className={`px-2.5 py-1 rounded-lg capitalize whitespace-nowrap transition-all ${
                selectedCategory === 'kitchen'
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              Kitchen
            </button>
            <button
              onClick={() => setSelectedCategory('office')}
              className={`px-2.5 py-1 rounded-lg capitalize whitespace-nowrap transition-all ${
                selectedCategory === 'office'
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              Office
            </button>
            <button
              onClick={() => setSelectedCategory('bathroom')}
              className={`px-2.5 py-1 rounded-lg capitalize whitespace-nowrap transition-all ${
                selectedCategory === 'bathroom'
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              Bath
            </button>
          </div>

          {/* Hint */}
          <div className="px-3 py-2 bg-indigo-950/40 border-b border-indigo-900/40 text-[11px] text-indigo-300 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 flex-shrink-0" />
            <span>Drag items onto the 2D floor plan, or click '+' to drop.</span>
          </div>

          {/* Catalog List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
            {filteredCatalog.map((item) => (
              <div
                key={item.type}
                draggable
                onDragStart={(e) => handleDragStart(e, item)}
                className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 hover:border-indigo-500/70 cursor-grab active:cursor-grabbing hover:bg-slate-800 transition-all flex items-center justify-between gap-3 group shadow-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center flex-shrink-0 group-hover:border-indigo-400 transition-colors">
                    {item.category === 'bedroom' ? (
                      <Bed className="w-4 h-4 text-indigo-400" />
                    ) : item.category === 'dining' || item.category === 'kitchen' ? (
                      <Utensils className="w-4 h-4 text-amber-400" />
                    ) : item.category === 'office' ? (
                      <Briefcase className="w-4 h-4 text-sky-400" />
                    ) : item.category === 'bathroom' ? (
                      <Bath className="w-4 h-4 text-cyan-400" />
                    ) : (
                      <Armchair className="w-4 h-4 text-emerald-400" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-white truncate group-hover:text-indigo-300 transition-colors">
                      {item.name}
                    </h4>
                    <p className="text-[10px] text-slate-400 font-mono">
                      {item.width}m × {item.depth}m
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleQuickAdd(item)}
                    className="p-1.5 rounded-lg bg-slate-700 hover:bg-indigo-600 text-slate-300 hover:text-white transition-all text-xs"
                    title="Add to floor plan"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                  <GripVertical className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 cursor-grab" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mode B: Placed Furniture Inspector & List */}
      {activeTab === 'placed' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Selected Item Inspector Panel */}
          {selectedFurniture ? (
            <div className="p-3 bg-indigo-950/40 border-b border-indigo-900/50 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                  <h4 className="text-xs font-bold text-white">{selectedFurniture.name}</h4>
                </div>
                <button
                  onClick={() => onSelectFurniture(null)}
                  className="text-slate-400 hover:text-white text-xs"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-3 gap-1.5 text-[10px] font-mono">
                <div className="bg-slate-900/80 p-1.5 rounded-lg">
                  <span className="text-slate-400 block">X Pos</span>
                  <span className="font-bold text-white">{selectedFurniture.x}m</span>
                </div>
                <div className="bg-slate-900/80 p-1.5 rounded-lg">
                  <span className="text-slate-400 block">Z Pos</span>
                  <span className="font-bold text-white">{selectedFurniture.z}m</span>
                </div>
                <div className="bg-slate-900/80 p-1.5 rounded-lg">
                  <span className="text-slate-400 block">Rotation</span>
                  <span className="font-bold text-indigo-300">{selectedFurniture.rotation}°</span>
                </div>
              </div>

              {/* Action Buttons: Rotate & Delete */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => {
                    const newRot = (selectedFurniture.rotation + 90) % 360;
                    onUpdateFurniture({ ...selectedFurniture, rotation: newRot });
                  }}
                  className="flex-1 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 flex items-center justify-center gap-1.5 transition-all"
                  title="Rotate 90 degrees clockwise"
                >
                  <RotateCw className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Rotate 90°</span>
                </button>

                <button
                  onClick={() => onDeleteFurniture(selectedFurniture.id)}
                  className="px-3 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900/80 border border-rose-800/60 text-xs font-semibold text-rose-300 flex items-center gap-1 transition-all"
                  title="Delete furniture"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>

              {/* Finish & Color Swatches */}
              <div className="pt-2 border-t border-indigo-900/40">
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1.5">
                  Finish & Color
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {FINISH_PRESETS.map((swatch) => (
                    <button
                      key={swatch.name}
                      onClick={() => {
                        onUpdateFurniture({
                          ...selectedFurniture,
                          color: swatch.color,
                          material: swatch.material,
                        });
                      }}
                      className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 relative ${
                        selectedFurniture.color === swatch.color
                          ? 'border-indigo-400 scale-110 shadow-sm'
                          : 'border-slate-700'
                      }`}
                      style={{ backgroundColor: swatch.color }}
                      title={swatch.name}
                    >
                      {selectedFurniture.color === swatch.color && (
                        <Check className="w-3 h-3 text-white absolute inset-0 m-auto" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-slate-800/40 border-b border-slate-800 text-[11px] text-slate-400">
              Select any furniture item on the floor plan to rotate, recolor, or delete.
            </div>
          )}

          {/* List of Placed Furniture */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {floorFurniture.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-xs">
                <Armchair className="w-10 h-10 mx-auto mb-2 text-slate-700" />
                <p>No furniture placed on Level {activeFloor} yet.</p>
                <button
                  onClick={() => setActiveTab('catalog')}
                  className="mt-3 text-indigo-400 font-semibold text-xs hover:underline"
                >
                  Browse catalog to add items
                </button>
              </div>
            ) : (
              floorFurniture.map((f) => (
                <div
                  key={f.id}
                  onClick={() => onSelectFurniture(f)}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                    selectedFurnitureId === f.id
                      ? 'bg-indigo-950/60 border-indigo-500 shadow-sm'
                      : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-3 h-3 rounded-full border border-slate-600"
                      style={{ backgroundColor: f.color || '#475569' }}
                    />
                    <div>
                      <h5 className="text-xs font-semibold text-white">{f.name}</h5>
                      <span className="text-[10px] text-slate-400 font-mono">
                        ({f.x}m, {f.z}m) • {f.rotation}°
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const newRot = (f.rotation + 90) % 360;
                        onUpdateFurniture({ ...f, rotation: newRot });
                      }}
                      className="p-1 hover:text-indigo-300 text-slate-400"
                      title="Rotate 90°"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteFurniture(f.id);
                      }}
                      className="p-1 hover:text-rose-400 text-slate-400"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {floorFurniture.length > 0 && (
            <div className="p-3 border-t border-slate-800 bg-slate-900 flex justify-between items-center text-xs">
              <span className="text-slate-400">{floorFurniture.length} items placed</span>
              <button
                onClick={() => onClearFloorFurniture(activeFloor)}
                className="text-rose-400 hover:text-rose-300 text-xs font-medium"
              >
                Clear Level {activeFloor}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
