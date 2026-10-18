import { FurnitureItem, FurnitureType, FurnitureCategory } from '../types/house';

export interface CatalogFurnitureItem {
  type: FurnitureType;
  name: string;
  category: FurnitureCategory;
  width: number; // meters
  depth: number; // meters
  height: number; // meters
  defaultColor: string;
  defaultMaterial: 'fabric' | 'wood' | 'marble' | 'leather' | 'metal';
  description: string;
}

export const FURNITURE_CATALOG: CatalogFurnitureItem[] = [
  // LIVING ROOM
  {
    type: 'sofa_3seater',
    name: '3-Seater Modern Sofa',
    category: 'living',
    width: 2.3,
    depth: 0.95,
    height: 0.82,
    defaultColor: '#475569',
    defaultMaterial: 'fabric',
    description: 'Deep cushioned contemporary sofa with low-profile tapered wooden legs.',
  },
  {
    type: 'sofa_sectional',
    name: 'L-Shaped Sectional Sofa',
    category: 'living',
    width: 2.8,
    depth: 2.1,
    height: 0.82,
    defaultColor: '#334155',
    defaultMaterial: 'fabric',
    description: 'Expansive corner sectional with reversible chaise lounge for open-plan living.',
  },
  {
    type: 'armchair',
    name: 'Scandinavian Lounge Chair',
    category: 'living',
    width: 0.85,
    depth: 0.85,
    height: 0.8,
    defaultColor: '#b45309',
    defaultMaterial: 'leather',
    description: 'Mid-century cognac leather accent armchair with sculpted armrests.',
  },
  {
    type: 'coffee_table',
    name: 'Minimalist Coffee Table',
    category: 'living',
    width: 1.2,
    depth: 0.65,
    height: 0.42,
    defaultColor: '#d4a373',
    defaultMaterial: 'wood',
    description: 'Natural solid oak coffee table with rounded chamfered edges.',
  },
  {
    type: 'tv_unit',
    name: 'Floating Media Credenza',
    category: 'living',
    width: 2.0,
    depth: 0.45,
    height: 0.52,
    defaultColor: '#1e293b',
    defaultMaterial: 'wood',
    description: 'Low-slung console with slatted acoustic front panel and cable routing.',
  },

  // BEDROOM
  {
    type: 'bed_king',
    name: 'King Platform Bed',
    category: 'bedroom',
    width: 2.0,
    depth: 2.15,
    height: 0.95,
    defaultColor: '#e2e8f0',
    defaultMaterial: 'fabric',
    description: 'Upholstered platform bed with plush padded headboard and dual pillows.',
  },
  {
    type: 'bed_queen',
    name: 'Queen Size Bed',
    category: 'bedroom',
    width: 1.65,
    depth: 2.05,
    height: 0.9,
    defaultColor: '#cbd5e1',
    defaultMaterial: 'fabric',
    description: 'Spacious queen frame with integrated slat support and linen bedding.',
  },
  {
    type: 'nightstand',
    name: 'Bedside Nightstand',
    category: 'bedroom',
    width: 0.52,
    depth: 0.45,
    height: 0.55,
    defaultColor: '#854d0e',
    defaultMaterial: 'wood',
    description: 'Warm walnut nightstand with soft-close drawer and lower open shelf.',
  },
  {
    type: 'wardrobe',
    name: 'Modern 3-Door Wardrobe',
    category: 'bedroom',
    width: 1.8,
    depth: 0.62,
    height: 2.2,
    defaultColor: '#64748b',
    defaultMaterial: 'wood',
    description: 'Floor-to-ceiling fitted closet with concealed matte black handles.',
  },

  // DINING & KITCHEN
  {
    type: 'dining_table',
    name: '6-Seater Dining Set',
    category: 'dining',
    width: 1.9,
    depth: 0.95,
    height: 0.76,
    defaultColor: '#a16207',
    defaultMaterial: 'wood',
    description: 'Solid wood dining table accompanied by 6 matching curved dining chairs.',
  },
  {
    type: 'kitchen_island',
    name: 'Island with Bar Stools',
    category: 'kitchen',
    width: 2.4,
    depth: 1.05,
    height: 0.92,
    defaultColor: '#f8fafc',
    defaultMaterial: 'marble',
    description: 'Waterfall quartz preparation island with breakfast overhang and 3 stools.',
  },
  {
    type: 'bistro_table',
    name: 'Round Breakfast Bistro',
    category: 'dining',
    width: 1.05,
    depth: 1.05,
    height: 0.75,
    defaultColor: '#f1f5f9',
    defaultMaterial: 'marble',
    description: 'Carrara marble circular table with cast iron pedestal and two cafe chairs.',
  },

  // OFFICE
  {
    type: 'office_desk',
    name: 'Executive Workstation',
    category: 'office',
    width: 1.6,
    depth: 0.8,
    height: 0.75,
    defaultColor: '#334155',
    defaultMaterial: 'wood',
    description: 'Spacious desk with cable well, drawer pedestal, and mesh ergonomic chair.',
  },
  {
    type: 'bookshelf',
    name: 'Architectural Bookshelf',
    category: 'office',
    width: 1.3,
    depth: 0.38,
    height: 1.95,
    defaultColor: '#1e293b',
    defaultMaterial: 'wood',
    description: 'Open-backed geometric display shelving for books, pottery, and lighting.',
  },

  // BATHROOM
  {
    type: 'bathtub',
    name: 'Freestanding Soaking Tub',
    category: 'bathroom',
    width: 1.7,
    depth: 0.8,
    height: 0.62,
    defaultColor: '#ffffff',
    defaultMaterial: 'marble',
    description: 'Sculptural oval soaking tub with floor-mounted brushed brass filler.',
  },
  {
    type: 'double_vanity',
    name: 'Double Sink Vanity',
    category: 'bathroom',
    width: 1.6,
    depth: 0.55,
    height: 0.86,
    defaultColor: '#475569',
    defaultMaterial: 'wood',
    description: 'Floating fluted vanity with dual under-mount sinks and quartz top.',
  },
];

export function createFurnitureInstance(
  catalogItem: CatalogFurnitureItem,
  floor: number,
  x: number,
  z: number,
  roomId?: string
): FurnitureItem {
  return {
    id: `furn-${catalogItem.type}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    type: catalogItem.type,
    name: catalogItem.name,
    category: catalogItem.category,
    floor,
    x: Math.round(x * 10) / 10,
    z: Math.round(z * 10) / 10,
    rotation: 0,
    width: catalogItem.width,
    depth: catalogItem.depth,
    height: catalogItem.height,
    color: catalogItem.defaultColor,
    material: catalogItem.defaultMaterial,
    roomId,
  };
}
