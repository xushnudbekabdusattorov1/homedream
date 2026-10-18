export type ArchitecturalStyle =
  | 'Modern'
  | 'Minimalist'
  | 'Scandinavian'
  | 'Mediterranean'
  | 'Contemporary'
  | 'Industrial'
  | 'Japanese Zen'
  | 'Traditional Central Asian'
  | 'Colonial / Classic';

export type RoomType =
  | 'living'
  | 'kitchen'
  | 'dining'
  | 'bedroom'
  | 'master_bedroom'
  | 'bathroom'
  | 'office'
  | 'hallway'
  | 'garage'
  | 'balcony'
  | 'terrace'
  | 'patio'
  | 'laundry'
  | 'storage';

export type WallSide = 'north' | 'south' | 'east' | 'west';

export interface RoomSpec {
  id: string;
  name: string;
  type: RoomType;
  floor: number; // 0 = Ground floor, 1 = 1st floor, etc.
  x: number; // meters from house center/origin
  z: number; // meters from house center/origin
  width: number; // meters along X
  depth: number; // meters along Z
  height?: number; // meters (defaults to floor height, usually 2.8 - 3.2m)
  color?: string; // hex color for room accent or floor
  floorMaterial: 'hardwood' | 'tile' | 'marble' | 'polished_concrete' | 'carpet' | 'decking';
  wallMaterial: 'white_plaster' | 'warm_wood' | 'exposed_concrete' | 'brick' | 'stone' | 'painted_charcoal';
  connectedTo?: string[]; // IDs of connected rooms
  textureType?: string;
  [key: string]: unknown;
}

export interface DoorSpec {
  id: string;
  roomId: string;
  wall: WallSide;
  offset: number; // position along wall in meters from corner
  width: number; // typical 0.9 - 1.2m
  height: number; // typical 2.1m
  type: 'interior' | 'exterior' | 'sliding_glass' | 'garage_door';
}

export interface WindowSpec {
  id: string;
  roomId: string;
  wall: WallSide;
  offset: number; // position along wall in meters from corner
  width: number; // 1.0 - 3.5m
  height: number; // 1.2 - 2.4m
  elevation: number; // sill height from floor (0 for floor-to-ceiling)
  type: 'standard' | 'floor_to_ceiling' | 'ribbon' | 'corner';
}

export type RoofType = 'flat' | 'sloped_gable' | 'sloped_shed' | 'hip' | 'terrace';

export interface RoofSpec {
  type: RoofType;
  pitch: number; // in degrees (e.g. 0 for flat, 18 for subtle slope, 35 for gable)
  overhang: number; // overhang in meters (e.g. 0.4 - 0.8m)
  color: string;
  material: 'dark_slate' | 'terracotta' | 'standing_seam_metal' | 'concrete_slab' | 'green_roof';
  textureType?: string;
  [key: string]: unknown;
}

export interface ExteriorSpec {
  hasPool: boolean;
  poolDimensions?: { x: number; z: number; width: number; depth: number };
  hasGarden: boolean;
  gardenType?: 'minimalist' | 'lush' | 'japanese_zen' | 'mediterranean';
  hasBalcony: boolean;
  hasTerrace: boolean;
  hasGarage: boolean;
  hasFence: boolean;
  patioDimensions?: { x: number; z: number; width: number; depth: number };
  driveway?: { width: number; depth: number; material: string };
}

export interface FloorSpec {
  level: number;
  name: string;
  height: number; // height of ceiling in meters
  elevation: number; // vertical offset from ground (Y axis)
}

export interface MaterialPalette {
  facadePrimary: { name: string; color: string; roughness: number; metalness: number };
  facadeSecondary: { name: string; color: string; roughness: number; metalness: number };
  windowFrame: { color: string };
  roofColor: string;
  trimColor: string;
  facadePrimaryTexture?: string;
  facadeSecondaryTexture?: string;
  roofTexture?: string;
  floorTexture?: string;
  patioTexture?: string;
  patioColor?: string;
  [key: string]: unknown;
}

export interface HouseStats {
  totalArea: number; // m²
  livableArea: number; // m²
  footprintArea: number; // m² ground footprint
  bedroomCount: number;
  bathroomCount: number;
  floorCount: number;
  estimatedCostRange: string;
}

export type FurnitureCategory = 'living' | 'bedroom' | 'dining' | 'office' | 'kitchen' | 'bathroom';

export type FurnitureType =
  | 'sofa_3seater'
  | 'sofa_sectional'
  | 'armchair'
  | 'coffee_table'
  | 'tv_unit'
  | 'dining_table'
  | 'kitchen_island'
  | 'bistro_table'
  | 'bed_king'
  | 'bed_queen'
  | 'nightstand'
  | 'wardrobe'
  | 'office_desk'
  | 'bookshelf'
  | 'bathtub'
  | 'double_vanity';

export interface FurnitureItem {
  id: string;
  type: FurnitureType;
  name: string;
  category: FurnitureCategory;
  floor: number; // 0, 1, etc.
  x: number; // meters from house origin
  z: number; // meters from house origin
  rotation: number; // degrees: 0, 90, 180, 270
  width: number; // meters
  depth: number; // meters
  height: number; // meters
  color?: string; // hex color or finish
  material?: string; // 'fabric' | 'wood' | 'marble' | 'leather' | 'metal'
  roomId?: string;
}

export interface HouseSpec {
  id: string;
  title: string;
  designSummary: string;
  style: ArchitecturalStyle;
  climate?: string;
  plot: {
    width: number; // in meters (e.g., 20)
    depth: number; // in meters (e.g., 25)
  };
  floors: FloorSpec[];
  rooms: RoomSpec[];
  doors: DoorSpec[];
  windows: WindowSpec[];
  roof: RoofSpec;
  exterior: ExteriorSpec;
  materials: MaterialPalette;
  stats: HouseStats;
  tags: string[];
  furniture?: FurnitureItem[];
}

export interface ProjectItem {
  id: string;
  title: string;
  description: string;
  prompt: string;
  style: string;
  updatedAt: string;
  createdAt: string;
  thumbnail?: string;
  spec: HouseSpec;
  isPublic?: boolean;
}

export interface GuidedOptions {
  plotWidth: number;
  plotDepth: number;
  floorCount: number;
  bedrooms: number;
  bathrooms: number;
  style: ArchitecturalStyle;
  climate: string;
  budgetRange: string;
  materialsPreference: string;
  roofPreference: RoofType;
  hasGarage: boolean;
  hasPool: boolean;
  hasGarden: boolean;
}

export interface ValidationIssue {
  type: 'error' | 'warning';
  code: string;
  message: string;
  roomId?: string;
}

export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
}
