import { HouseSpec, GuidedOptions } from '../types/house';
import { SAMPLE_HOUSES } from './sampleHouses';

export const SYSTEM_PROMPT = `
You are the world's leading computational architectural AI and residential design system.
Your mission is to translate natural language user descriptions and requirements into a precise, structurally realistic, and aesthetically stunning architectural specification in JSON format.

RULES & CONSTRAINTS:
1. OUTPUT STRICT VALID JSON ONLY. No markdown wrapper (do not wrap in \`\`\`json or \`\`\`), no conversational prose, no introductory or trailing text.
2. The coordinate system:
   - Origin (0,0) is near the center of the plot.
   - X axis represents width (left/right, east/west).
   - Z axis represents depth (front/back, north/south).
   - Y axis represents vertical elevation (floor height).
   - Floor 0 has elevation 0.0.
   - Floor 1 has elevation typically 3.0 or 3.2.
3. Realistic structural rules:
   - Rooms on the same floor MUST NOT overlap. Make sure their [x - width/2, x + width/2] and [z - depth/2, z + depth/2] intervals do not collide.
   - Rooms must fit within the specified plot bounds (e.g. plot width 24m, depth 30m).
   - Realistic room sizes:
     * living: width 6-9m, depth 5-8m
     * kitchen: width 4-6m, depth 4-6m
     * dining: width 4-6m, depth 3.5-5m
     * master_bedroom: width 5-7m, depth 4.5-6m
     * bedroom: width 3.5-5m, depth 3.5-5m
     * bathroom: width 2-4m, depth 2-3.5m
     * garage: width 6-7m, depth 6-7m
   - Multi-story houses: upper floors (floor 1) must be directly supported over ground floor footprint (cantilevers should not exceed 2.0 meters).
   - Provide doors for all rooms. Living rooms should have sliding glass doors to garden/patio.
   - Provide ample windows with realistic width (1.2m to 3.5m) and heights.
4. Schema shape:
{
  "id": "generated-house-unique-id",
  "title": "Title of the Residence",
  "designSummary": "A vivid 2-3 sentence architectural narrative describing spatial flow, materials, and light.",
  "style": "Modern" | "Minimalist" | "Scandinavian" | "Mediterranean" | "Contemporary" | "Industrial" | "Japanese Zen" | "Colonial / Classic",
  "climate": "string description",
  "plot": { "width": 24, "depth": 30 },
  "floors": [
    { "level": 0, "name": "Ground Level", "height": 3.2, "elevation": 0.0 },
    { "level": 1, "name": "Upper Level", "height": 3.0, elevation: 3.2 }
  ],
  "rooms": [
    {
      "id": "r1",
      "name": "Living Room",
      "type": "living",
      "floor": 0,
      "x": -2.0,
      "z": 2.0,
      "width": 7.5,
      "depth": 6.0,
      "floorMaterial": "hardwood" | "tile" | "marble" | "polished_concrete" | "carpet" | "decking",
      "wallMaterial": "white_plaster" | "warm_wood" | "exposed_concrete" | "brick" | "stone",
      "color": "#hex"
    }
  ],
  "doors": [
    {
      "id": "d1",
      "roomId": "r1",
      "wall": "north" | "south" | "east" | "west",
      "offset": 1.5,
      "width": 1.0,
      "height": 2.1,
      "type": "interior" | "exterior" | "sliding_glass" | "garage_door"
    }
  ],
  "windows": [
    {
      "id": "w1",
      "roomId": "r1",
      "wall": "north" | "south" | "east" | "west",
      "offset": 1.0,
      "width": 2.5,
      "height": 2.0,
      "elevation": 0.3,
      "type": "standard" | "floor_to_ceiling" | "ribbon" | "corner"
    }
  ],
  "roof": {
    "type": "flat" | "sloped_gable" | "sloped_shed" | "hip" | "terrace",
    "pitch": 0,
    "overhang": 0.6,
    "color": "#hex",
    "material": "dark_slate" | "terracotta" | "standing_seam_metal" | "concrete_slab" | "green_roof"
  },
  "exterior": {
    "hasPool": boolean,
    "poolDimensions": { "x": 0, "z": 8, "width": 8, "depth": 4 },
    "hasGarden": boolean,
    "gardenType": "minimalist" | "lush" | "japanese_zen" | "mediterranean",
    "hasBalcony": boolean,
    "hasTerrace": boolean,
    "hasGarage": boolean,
    "hasFence": boolean,
    "patioDimensions": { "x": 0, "z": 5, "width": 6, "depth": 3 }
  },
  "materials": {
    "facadePrimary": { "name": "string", "color": "#hex", "roughness": 0.7, "metalness": 0.05 },
    "facadeSecondary": { "name": "string", "color": "#hex", "roughness": 0.85, "metalness": 0.02 },
    "windowFrame": { "color": "#1a1a1a" },
    "roofColor": "#hex",
    "trimColor": "#hex"
  },
  "stats": {
    "totalArea": 220,
    "livableArea": 190,
    "footprintArea": 120,
    "bedroomCount": 3,
    "bathroomCount": 2,
    "floorCount": 2,
    "estimatedCostRange": "$300,000 - $420,000 USD"
  },
  "tags": ["Modern", "Pool", "Wood"]
}
`;

export const REFINE_SYSTEM_PROMPT = `
You are the world's leading computational architectural AI.
You will be provided with an EXISTING architectural specification (JSON) and a user's CHANGE REQUEST / REFINEMENT.
Your task is to update the JSON specification to incorporate the user's refinement without discarding the rest of the design.

For example:
- "Make the roof sloped" -> change roof.type to "sloped_gable" or "sloped_shed" and adjust pitch.
- "Add a balcony to the master bedroom" -> add a balcony room connected to master bedroom or add an exterior balcony.
- "Add a swimming pool in the backyard" -> set exterior.hasPool = true, add poolDimensions.
- "Change exterior walls to dark wood and black concrete" -> update materials and wall materials.

RULES:
1. OUTPUT STRICT VALID JSON ONLY matching the HouseSpec schema. No markdown formatting.
2. Maintain room consistency and non-overlapping spatial layouts.
`;

/**
 * Intelligent procedural generator fallback for offline use or quick demo
 */
export function generateProceduralHouse(
  prompt: string,
  guided?: GuidedOptions
): HouseSpec {
  const pLower = prompt.toLowerCase();

  // Pick closest base template or customize
  let base: HouseSpec = JSON.parse(JSON.stringify(SAMPLE_HOUSES[0]));

  if (pLower.includes('scandinavian') || pLower.includes('nordic') || pLower.includes('pine') || pLower.includes('fjord')) {
    base = JSON.parse(JSON.stringify(SAMPLE_HOUSES[1]));
  } else if (pLower.includes('mediterranean') || pLower.includes('villa') || pLower.includes('terracotta') || pLower.includes('spanish')) {
    base = JSON.parse(JSON.stringify(SAMPLE_HOUSES[2]));
  } else if (pLower.includes('japan') || pLower.includes('zen') || pLower.includes('tatami') || pLower.includes('bonsai')) {
    base = JSON.parse(JSON.stringify(SAMPLE_HOUSES[3]));
  }

  // Adjust attributes based on prompt & guided options
  base.id = 'dream-' + Math.random().toString(36).substring(2, 9);
  if (prompt.trim()) {
    base.title = prompt.length > 40 ? prompt.substring(0, 40) + '...' : prompt;
  }

  if (guided) {
    if (guided.style) base.style = guided.style;
    if (guided.roofPreference) base.roof.type = guided.roofPreference;
    if (guided.hasPool !== undefined) base.exterior.hasPool = guided.hasPool;
    if (guided.hasGarage !== undefined) base.exterior.hasGarage = guided.hasGarage;
  }

  if (pLower.includes('sloped') || pLower.includes('pitched') || pLower.includes('gable')) {
    base.roof.type = 'sloped_gable';
    base.roof.pitch = 28;
  } else if (pLower.includes('flat')) {
    base.roof.type = 'flat';
    base.roof.pitch = 0;
  }

  if (pLower.includes('pool') || pLower.includes('swimming')) {
    base.exterior.hasPool = true;
    base.exterior.poolDimensions = { x: -2.0, z: 8.0, width: 8.0, depth: 3.5 };
  }

  if (pLower.includes('balcony')) {
    base.exterior.hasBalcony = true;
  }

  return base;
}
