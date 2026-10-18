import { HouseSpec } from '../types/house';

export interface EnergyAnalysisResult {
  score: number; // 0 - 100
  ratingLetter: 'A+' | 'A' | 'B' | 'C' | 'D' | 'E';
  ratingLabel: string;
  wwr: {
    overall: number; // percentage (e.g. 24.8)
    totalWallArea: number; // m²
    totalGlazingArea: number; // m²
    byOrientation: {
      north: { wallArea: number; windowArea: number; wwr: number };
      south: { wallArea: number; windowArea: number; wwr: number };
      east: { wallArea: number; windowArea: number; wwr: number };
      west: { wallArea: number; windowArea: number; wwr: number };
    };
    status: 'optimal' | 'moderate' | 'excessive_glazing' | 'low_daylight';
  };
  roofAnalysis: {
    type: string;
    pitch: number;
    material: string;
    solarPotential: 'Exceptional' | 'High' | 'Moderate' | 'Low';
    thermalEfficiency: 'High-Performance' | 'Standard' | 'Needs Insulation';
    estimatedRValue: number; // m²·K/W
  };
  climateZone: {
    name: string;
    description: string;
    hdd: number; // Heating Degree Days
    cdd: number; // Cooling Degree Days
    dominantSeason: 'Heating Dominated' | 'Cooling Dominated' | 'Balanced';
  };
  metrics: {
    annualEnergyIntensity: number; // kWh/m²/year
    estimatedAnnualEnergyUsage: number; // kWh/year
    estimatedAnnualUtilityCost: number; // USD / year
    annualCarbonFootprint: number; // Metric Tons CO2e / year
  };
  breakdown: {
    heating: number; // %
    cooling: number; // %
    lightingAndAppliances: number; // %
    waterHeating: number; // %
  };
  recommendations: Array<{
    title: string;
    description: string;
    potentialSavings: string;
    type: 'glazing' | 'roof' | 'shading' | 'materials';
  }>;
}

export function calculateEnergyAnalysis(
  spec: HouseSpec,
  selectedClimateOverride?: string
): EnergyAnalysisResult {
  const floorHeightDefault = 3.0;

  // 1. Calculate Exterior Wall Surface Area by Orientation
  // Group rooms by perimeter extremities
  const groundFloorRooms = spec.rooms.filter((r) => r.floor === 0);
  const upperFloorRooms = spec.rooms.filter((r) => r.floor === 1);

  const calcFloorWallAreas = (rooms: typeof spec.rooms) => {
    if (rooms.length === 0) return { north: 0, south: 0, east: 0, west: 0 };
    const minX = Math.min(...rooms.map((r) => r.x - r.width / 2));
    const maxX = Math.max(...rooms.map((r) => r.x + r.width / 2));
    const minZ = Math.min(...rooms.map((r) => r.z - r.depth / 2));
    const maxZ = Math.max(...rooms.map((r) => r.z + r.depth / 2));
    const spanX = maxX - minX;
    const spanZ = maxZ - minZ;
    const h = rooms[0]?.height || floorHeightDefault;

    return {
      north: spanX * h,
      south: spanX * h,
      east: spanZ * h,
      west: spanZ * h,
    };
  };

  const groundWalls = calcFloorWallAreas(groundFloorRooms);
  const upperWalls = calcFloorWallAreas(upperFloorRooms);

  const totalWallAreas = {
    north: Math.max(1, groundWalls.north + upperWalls.north),
    south: Math.max(1, groundWalls.south + upperWalls.south),
    east: Math.max(1, groundWalls.east + upperWalls.east),
    west: Math.max(1, groundWalls.west + upperWalls.west),
  };

  const totalWallArea =
    totalWallAreas.north + totalWallAreas.south + totalWallAreas.east + totalWallAreas.west;

  // 2. Calculate Window Areas by Orientation
  const windowAreas = { north: 0, south: 0, east: 0, west: 0 };
  spec.windows.forEach((w) => {
    const area = w.width * w.height;
    if (w.wall in windowAreas) {
      windowAreas[w.wall as keyof typeof windowAreas] += area;
    }
  });

  const totalGlazingArea =
    windowAreas.north + windowAreas.south + windowAreas.east + windowAreas.west;

  const overallWWR = Math.round((totalGlazingArea / Math.max(totalWallArea, 1)) * 1000) / 10;

  const northWWR = Math.round((windowAreas.north / totalWallAreas.north) * 1000) / 10;
  const southWWR = Math.round((windowAreas.south / totalWallAreas.south) * 1000) / 10;
  const eastWWR = Math.round((windowAreas.east / totalWallAreas.east) * 1000) / 10;
  const westWWR = Math.round((windowAreas.west / totalWallAreas.west) * 1000) / 10;

  let wwrStatus: EnergyAnalysisResult['wwr']['status'] = 'optimal';
  if (overallWWR > 42) wwrStatus = 'excessive_glazing';
  else if (overallWWR > 32) wwrStatus = 'moderate';
  else if (overallWWR < 12) wwrStatus = 'low_daylight';

  // 3. Climate Zone Determination
  const climateStr = (selectedClimateOverride || spec.climate || 'Temperate').toLowerCase();
  let climateName = 'Temperate / Mediterranean';
  let climateDesc = 'Moderate winters, warm dry summers. Balanced heating and cooling demand.';
  let hdd = 2100;
  let cdd = 950;
  let dominantSeason: EnergyAnalysisResult['climateZone']['dominantSeason'] = 'Balanced';

  if (climateStr.includes('cold') || climateStr.includes('subarctic') || climateStr.includes('nordic')) {
    climateName = 'Cold / Subarctic (Zone 6-7)';
    climateDesc = 'Severe freezing winters, mild summers. Heating accounts for 70%+ of annual load.';
    hdd = 4600;
    cdd = 250;
    dominantSeason = 'Heating Dominated';
  } else if (climateStr.includes('arid') || climateStr.includes('desert') || climateStr.includes('hot')) {
    climateName = 'Hot & Arid / Desert (Zone 2-3)';
    climateDesc = 'Intense solar radiation, high cooling loads. Shading & thermal mass are critical.';
    hdd = 450;
    cdd = 2900;
    dominantSeason = 'Cooling Dominated';
  } else if (climateStr.includes('tropical') || climateStr.includes('humid')) {
    climateName = 'Tropical / Humid (Zone 1)';
    climateDesc = 'High humidity, constant heat. Natural cross-ventilation & roof shading essential.';
    hdd = 50;
    cdd = 3400;
    dominantSeason = 'Cooling Dominated';
  }

  // 4. Roof Analysis & Solar Potential
  const pitch = spec.roof.pitch || 0;
  const roofMat = spec.roof.material || 'concrete_slab';

  let solarPotential: EnergyAnalysisResult['roofAnalysis']['solarPotential'] = 'Moderate';
  if (pitch >= 20 && pitch <= 35) solarPotential = 'Exceptional';
  else if (pitch > 0 && pitch < 20) solarPotential = 'High';
  else if (spec.roof.type === 'flat' || spec.roof.type === 'terrace') solarPotential = 'High';

  let estimatedRValue = 4.2; // default
  let thermalEfficiency: EnergyAnalysisResult['roofAnalysis']['thermalEfficiency'] = 'Standard';

  if (roofMat === 'green_roof') {
    estimatedRValue = 6.8;
    thermalEfficiency = 'High-Performance';
  } else if (roofMat === 'standing_seam_metal') {
    estimatedRValue = pitch >= 20 ? 5.2 : 4.6;
    thermalEfficiency = 'High-Performance';
  } else if (roofMat === 'terracotta') {
    estimatedRValue = 4.8;
    thermalEfficiency = 'High-Performance';
  } else if (roofMat === 'concrete_slab') {
    estimatedRValue = 3.9;
    thermalEfficiency = 'Standard';
  }

  // 5. Compute Numerical Energy Score (0 - 100)
  let score = 84; // base modern insulated envelope

  // WWR impact
  if (overallWWR >= 18 && overallWWR <= 30) {
    score += 6; // passive solar sweet spot
  } else if (overallWWR > 45) {
    score -= 14; // excessive thermal bridging & conductive losses
  } else if (overallWWR > 35) {
    score -= 7;
  }

  // Orientation-specific penalties & rewards
  if (dominantSeason === 'Heating Dominated') {
    if (southWWR >= 20 && southWWR <= 38) score += 4; // solar gain bonus
    if (northWWR > 28) score -= 6; // north glass loses heat with no solar gain
  } else if (dominantSeason === 'Cooling Dominated') {
    if (westWWR > 28) score -= 8; // harsh afternoon solar heat gain penalty
    if (southWWR > 35 && !spec.exterior.hasBalcony && !spec.exterior.hasTerrace) score -= 6; // lack of shading
  }

  // Roof & Materials impact
  if (roofMat === 'green_roof') score += 7;
  else if (roofMat === 'standing_seam_metal' && solarPotential === 'Exceptional') score += 5;
  else if (roofMat === 'terracotta' && dominantSeason === 'Cooling Dominated') score += 4;

  if (spec.materials.facadePrimary.name.toLowerCase().includes('cedar') || spec.materials.facadePrimary.name.toLowerCase().includes('wood')) {
    score += 3; // biophilic lower embodied carbon & natural insulation
  }

  // Clamp score
  score = Math.max(38, Math.min(97, Math.round(score)));

  // Rating Letter
  let ratingLetter: EnergyAnalysisResult['ratingLetter'] = 'B';
  let ratingLabel = 'Above Standard Compliance';

  if (score >= 90) {
    ratingLetter = 'A+';
    ratingLabel = 'Net-Zero Ready / Passive House Standard';
  } else if (score >= 82) {
    ratingLetter = 'A';
    ratingLabel = 'High-Efficiency Eco-Architecture';
  } else if (score >= 72) {
    ratingLetter = 'B';
    ratingLabel = 'Above Standard Code Compliance';
  } else if (score >= 60) {
    ratingLetter = 'C';
    ratingLabel = 'Standard Residential Code';
  } else if (score >= 48) {
    ratingLetter = 'D';
    ratingLabel = 'Moderate Inefficiency';
  } else {
    ratingLetter = 'E';
    ratingLabel = 'High Energy Consumption';
  }

  // 6. Metrics Calculations
  const livableArea = spec.stats.livableArea || 180;
  // Baseline energy intensity: 120 kWh/m²/year scaled by inverse of score
  const energyIntensity = Math.round((140 - score * 0.8) * (hdd > 3000 ? 1.25 : cdd > 2000 ? 1.15 : 1.0));
  const totalAnnualEnergy = Math.round(energyIntensity * livableArea);
  const costPerKWh = 0.16; // USD average
  const annualCost = Math.round(totalAnnualEnergy * costPerKWh);
  const carbonFootprint = Math.round(((totalAnnualEnergy * 0.385) / 1000) * 10) / 10; // tCO2/year

  // 7. Breakdown percentage
  let heatingPct = 42;
  let coolingPct = 18;
  let lightingPct = 22;
  let waterPct = 18;

  if (dominantSeason === 'Heating Dominated') {
    heatingPct = 64;
    coolingPct = 6;
    lightingPct = 16;
    waterPct = 14;
  } else if (dominantSeason === 'Cooling Dominated') {
    heatingPct = 8;
    coolingPct = 54;
    lightingPct = 20;
    waterPct = 18;
  }

  // 8. Recommendations
  const recommendations: EnergyAnalysisResult['recommendations'] = [];

  if (overallWWR > 34) {
    recommendations.push({
      title: 'Optimize Glazing U-Value (Triple Glazing / Low-E Coating)',
      description: `With a ${overallWWR}% overall window-to-wall ratio, upgrading from double to argon-filled triple Low-E glazing will mitigate thermal conductance losses by up to 34%.`,
      potentialSavings: '$320 - $550/yr',
      type: 'glazing',
    });
  }

  if (westWWR > 22 && (dominantSeason === 'Cooling Dominated' || dominantSeason === 'Balanced')) {
    recommendations.push({
      title: 'Add Architectural Louvers or Deep Overhangs on West Facade',
      description: `West-facing glazing (${westWWR}% WWR) admits intense low-angle afternoon solar heat. Exterior vertical louvers will block peak cooling loads without sacrificing daylight.`,
      potentialSavings: '$180 - $290/yr',
      type: 'shading',
    });
  }

  if (roofMat !== 'green_roof' && roofMat !== 'standing_seam_metal') {
    recommendations.push({
      title: 'Upgrade Roof Insulation or Install Standing Seam Solar Array',
      description: `The roof is the single largest surface for convective heat exchange. High-reflectivity standing seam metal or a living green roof will increase R-value to ~5.5+ m²·K/W.`,
      potentialSavings: '$240 - $410/yr',
      type: 'roof',
    });
  }

  if (dominantSeason === 'Heating Dominated' && northWWR > 20) {
    recommendations.push({
      title: 'Reduce North Facade Glazing Spans',
      description: `North-facing windows receive minimal direct sunlight in winter while remaining a primary point of conductive heat dissipation.`,
      potentialSavings: '$150 - $260/yr',
      type: 'glazing',
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      title: 'Install Rooftop Photovoltaic Array (8 kWp)',
      description: 'Your roof geometry and orientation are primed for rooftop solar PV, capable of generating 100%+ of annual household electrical demand.',
      potentialSavings: '$1,200 - $1,600/yr',
      type: 'roof',
    });
  }

  return {
    score,
    ratingLetter,
    ratingLabel,
    wwr: {
      overall: overallWWR,
      totalWallArea: Math.round(totalWallArea),
      totalGlazingArea: Math.round(totalGlazingArea),
      byOrientation: {
        north: { wallArea: Math.round(totalWallAreas.north), windowArea: Math.round(windowAreas.north), wwr: northWWR },
        south: { wallArea: Math.round(totalWallAreas.south), windowArea: Math.round(windowAreas.south), wwr: southWWR },
        east: { wallArea: Math.round(totalWallAreas.east), windowArea: Math.round(windowAreas.east), wwr: eastWWR },
        west: { wallArea: Math.round(totalWallAreas.west), windowArea: Math.round(windowAreas.west), wwr: westWWR },
      },
      status: wwrStatus,
    },
    roofAnalysis: {
      type: spec.roof.type.replace('_', ' '),
      pitch,
      material: roofMat.replace('_', ' '),
      solarPotential,
      thermalEfficiency,
      estimatedRValue,
    },
    climateZone: {
      name: climateName,
      description: climateDesc,
      hdd,
      cdd,
      dominantSeason,
    },
    metrics: {
      annualEnergyIntensity: energyIntensity,
      estimatedAnnualEnergyUsage: totalAnnualEnergy,
      estimatedAnnualUtilityCost: annualCost,
      annualCarbonFootprint: carbonFootprint,
    },
    breakdown: {
      heating: heatingPct,
      cooling: coolingPct,
      lightingAndAppliances: lightingPct,
      waterHeating: waterPct,
    },
    recommendations,
  };
}
