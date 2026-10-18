import { HouseSpec, RoomSpec } from '../types/house';
import { TextureType } from './textureGenerator';

export type MaterialCategory = 'wood' | 'concrete' | 'brick' | 'tile';

export type TargetSurface =
  | 'facadePrimary'
  | 'facadeSecondary'
  | 'roof'
  | 'floor'
  | 'selectedRoomFloor'
  | 'patio';

export interface TextureItem {
  id: string;
  name: string;
  category: MaterialCategory;
  textureType: TextureType;
  color: string;
  roughness: number;
  metalness: number;
  description: string;
}

export const TEXTURE_LIBRARY: TextureItem[] = [
  // ---------------- WOOD ----------------
  {
    id: 'wood-oak',
    name: 'Natural Golden Oak',
    category: 'wood',
    textureType: 'wood_oak',
    color: '#c59b6d',
    roughness: 0.65,
    metalness: 0.05,
    description: 'Warm natural timber planks with visible grain and satin sheen.',
  },
  {
    id: 'wood-cedar',
    name: 'Japanese Cedar Siding',
    category: 'wood',
    textureType: 'wood_cedar',
    color: '#b45309',
    roughness: 0.7,
    metalness: 0.02,
    description: 'Rich amber horizontal shiplap timber cladding with dark shadow gaps.',
  },
  {
    id: 'wood-walnut',
    name: 'Smoked Dark Walnut',
    category: 'wood',
    textureType: 'wood_walnut',
    color: '#3e2723',
    roughness: 0.6,
    metalness: 0.08,
    description: 'Deep espresso luxury hardwood with straight architectural grain.',
  },
  {
    id: 'wood-teak',
    name: 'Teak Decking Slats',
    category: 'wood',
    textureType: 'wood_teak',
    color: '#a16207',
    roughness: 0.75,
    metalness: 0.04,
    description: 'Outdoor marine-grade teak decking with dark perimeter caulking.',
  },

  // ---------------- CONCRETE ----------------
  {
    id: 'concrete-raw',
    name: 'Board-Formed Concrete',
    category: 'concrete',
    textureType: 'concrete_raw',
    color: '#cbd5e1',
    roughness: 0.85,
    metalness: 0.05,
    description: 'Authentic architectural exposed concrete with timber board grain and tie holes.',
  },
  {
    id: 'concrete-polished',
    name: 'Polished Quartz Concrete',
    category: 'concrete',
    textureType: 'concrete_polished',
    color: '#e2e8f0',
    roughness: 0.35,
    metalness: 0.1,
    description: 'Smooth, reflective light grey polished floor slab with fine mineral aggregate.',
  },
  {
    id: 'concrete-fluted',
    name: 'Vertical Fluted Concrete',
    category: 'concrete',
    textureType: 'concrete_fluted',
    color: '#94a3b8',
    roughness: 0.75,
    metalness: 0.08,
    description: 'Contemporary textured architectural panels with 3D scalloped fluting.',
  },
  {
    id: 'concrete-charcoal',
    name: 'Basalt Charcoal Concrete',
    category: 'concrete',
    textureType: 'concrete_charcoal',
    color: '#334155',
    roughness: 0.8,
    metalness: 0.05,
    description: 'Dramatic dark grey architectural finish with subtle mineral pitting.',
  },

  // ---------------- BRICK ----------------
  {
    id: 'brick-red',
    name: 'Heritage Red Brick',
    category: 'brick',
    textureType: 'brick_red',
    color: '#b91c1c',
    roughness: 0.9,
    metalness: 0.02,
    description: 'Traditional kiln-fired terracotta brickwork with authentic mortar joints.',
  },
  {
    id: 'brick-white',
    name: 'Nordic Painted White Brick',
    category: 'brick',
    textureType: 'brick_white',
    color: '#f8fafc',
    roughness: 0.8,
    metalness: 0.02,
    description: 'Minimalist Scandinavian textured brick wall painted in clean chalk white.',
  },
  {
    id: 'brick-charcoal',
    name: 'Urban Charcoal Brick',
    category: 'brick',
    textureType: 'brick_charcoal',
    color: '#1e293b',
    roughness: 0.85,
    metalness: 0.05,
    description: 'Sleek industrial black masonry with recessed shadow joints.',
  },
  {
    id: 'brick-terracotta',
    name: 'Tuscan Terracotta Brick',
    category: 'brick',
    textureType: 'brick_terracotta',
    color: '#ea580c',
    roughness: 0.88,
    metalness: 0.02,
    description: 'Earthy Mediterranean sun-baked brick with rustic warm tone variations.',
  },

  // ---------------- TILE ----------------
  {
    id: 'tile-ceramic',
    name: 'Minimalist Grid Ceramic',
    category: 'tile',
    textureType: 'tile_ceramic',
    color: '#f8fafc',
    roughness: 0.4,
    metalness: 0.05,
    description: 'Clean architectural square ceramic tiles with slim dark grout lines.',
  },
  {
    id: 'tile-subway',
    name: 'Beveled Subway Tile',
    category: 'tile',
    textureType: 'tile_subway',
    color: '#ffffff',
    roughness: 0.3,
    metalness: 0.08,
    description: 'Classic glazed white subway tiles in staggered running bond.',
  },
  {
    id: 'tile-marble',
    name: 'Carrara White Marble',
    category: 'tile',
    textureType: 'tile_marble',
    color: '#f1f5f9',
    roughness: 0.2,
    metalness: 0.12,
    description: 'Luxury Italian white marble with delicate smoke-grey veining.',
  },
  {
    id: 'tile-slate',
    name: 'Natural Welsh Slate Tile',
    category: 'tile',
    textureType: 'tile_slate',
    color: '#0f172a',
    roughness: 0.8,
    metalness: 0.08,
    description: 'Fine-grained cleft charcoal slate stone with subtle natural cleavage.',
  },
];

export const SURFACE_TARGETS: Array<{ id: TargetSurface; label: string; icon: string }> = [
  { id: 'facadePrimary', label: 'Primary Exterior Facade', icon: '🏛️' },
  { id: 'facadeSecondary', label: 'Secondary Accent Cladding', icon: '🏢' },
  { id: 'roof', label: 'Roof Surface & Shingles', icon: '🏠' },
  { id: 'floor', label: 'All Room Floors', icon: '📐' },
  { id: 'selectedRoomFloor', label: 'Selected Room Floor Only', icon: '🚪' },
  { id: 'patio', label: 'Outdoor Patio & Deck', icon: '☀️' },
];

export function applyTextureToSpec(
  spec: HouseSpec,
  surface: TargetSurface,
  texture: TextureItem,
  selectedRoomId?: string | null
): HouseSpec {
  const updated: HouseSpec = JSON.parse(JSON.stringify(spec));

  // Store texture identifier on materials
  if (!updated.materials) {
    updated.materials = {
      facadePrimary: { name: 'Wood', color: '#c59b6d', roughness: 0.7, metalness: 0.05 },
      facadeSecondary: { name: 'Concrete', color: '#e2e8f0', roughness: 0.8, metalness: 0.02 },
      windowFrame: { color: '#1e293b' },
      roofColor: '#1f2421',
      trimColor: '#0f172a',
    };
  }

  // Extend materials with custom texture keys
  const extMats = updated.materials as Record<string, unknown>;

  switch (surface) {
    case 'facadePrimary':
      updated.materials.facadePrimary = {
        name: texture.name,
        color: texture.color,
        roughness: texture.roughness,
        metalness: texture.metalness,
      };
      extMats.facadePrimaryTexture = texture.textureType;
      break;

    case 'facadeSecondary':
      updated.materials.facadeSecondary = {
        name: texture.name,
        color: texture.color,
        roughness: texture.roughness,
        metalness: texture.metalness,
      };
      extMats.facadeSecondaryTexture = texture.textureType;
      break;

    case 'roof':
      updated.roof.color = texture.color;
      updated.materials.roofColor = texture.color;
      extMats.roofTexture = texture.textureType;
      break;

    case 'floor': {
      extMats.floorTexture = texture.textureType;
      const matMap: Record<MaterialCategory, RoomSpec['floorMaterial']> = {
        wood: 'hardwood',
        concrete: 'polished_concrete',
        brick: 'tile',
        tile: 'tile',
      };
      updated.rooms.forEach((r) => {
        r.floorMaterial = matMap[texture.category] || 'hardwood';
        r.color = texture.color;
      });
      break;
    }

    case 'selectedRoomFloor': {
      if (selectedRoomId) {
        const room = updated.rooms.find((r) => r.id === selectedRoomId);
        if (room) {
          const matMap: Record<MaterialCategory, RoomSpec['floorMaterial']> = {
            wood: 'hardwood',
            concrete: 'polished_concrete',
            brick: 'tile',
            tile: 'tile',
          };
          room.floorMaterial = matMap[texture.category] || 'hardwood';
          room.color = texture.color;
          (room as Record<string, unknown>).textureType = texture.textureType;
        }
      }
      break;
    }

    case 'patio': {
      extMats.patioTexture = texture.textureType;
      extMats.patioColor = texture.color;
      break;
    }
  }

  return updated;
}
