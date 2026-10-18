import React, { useState } from 'react';
import { HouseSpec } from '../../types/house';
import { calculateEnergyAnalysis, EnergyAnalysisResult } from '../../lib/energyCalculator';
import {
  Zap,
  Sun,
  Flame,
  Wind,
  Layers,
  Compass,
  TrendingDown,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  ThermometerSnowflake,
  AlertCircle,
  HelpCircle,
  Leaf,
  BarChart3,
  CheckCircle2,
} from 'lucide-react';

interface EnergyAnalysisPanelProps {
  spec: HouseSpec;
  onApplyOptimization?: (instruction: string) => void;
}

export const EnergyAnalysisPanel: React.FC<EnergyAnalysisPanelProps> = ({
  spec,
  onApplyOptimization,
}) => {
  const [climateOverride, setClimateOverride] = useState<string>(spec.climate || 'Temperate');
  const [activeTab, setActiveTab] = useState<'overview' | 'wwr' | 'roof' | 'recommendations'>('overview');

  const analysis: EnergyAnalysisResult = calculateEnergyAnalysis(spec, climateOverride);

  const getRatingBadgeColor = (letter: string) => {
    switch (letter) {
      case 'A+':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-emerald-950/50';
      case 'A':
        return 'bg-green-500/20 text-green-300 border-green-500/50 shadow-green-950/50';
      case 'B':
        return 'bg-sky-500/20 text-sky-300 border-sky-500/50 shadow-sky-950/50';
      case 'C':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-amber-950/50';
      case 'D':
        return 'bg-orange-500/20 text-orange-300 border-orange-500/50 shadow-orange-950/50';
      default:
        return 'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-rose-950/50';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-400';
    if (score >= 80) return 'text-green-400';
    if (score >= 70) return 'text-sky-400';
    if (score >= 60) return 'text-amber-400';
    return 'text-rose-400';
  };

  return (
    <div className="w-full h-full bg-slate-900 rounded-2xl border border-slate-800 flex flex-col overflow-hidden text-slate-100">
      {/* Top Banner & Climate Simulator Selector */}
      <div className="p-4 sm:p-5 bg-slate-900/95 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-sky-500 p-0.5 shadow-md flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Leaf className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white tracking-tight">Architectural Energy Analysis</h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                ASHRAE / Passivhaus Standards
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Simulating envelope thermal transmission, glazing solar heat gain, and roof efficiency.
            </p>
          </div>
        </div>

        {/* Climate Zone Simulation Switcher */}
        <div className="flex items-center gap-2 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60 text-xs">
          <span className="text-slate-400 px-2 flex items-center gap-1">
            <Wind className="w-3.5 h-3.5 text-sky-400" />
            <span>Climate Zone:</span>
          </span>
          <select
            value={climateOverride}
            onChange={(e) => setClimateOverride(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="Temperate">Temperate / Mediterranean</option>
            <option value="Cold / Subarctic">Cold / Subarctic (High Heating)</option>
            <option value="Hot & Arid">Hot & Arid / Desert (High Cooling)</option>
            <option value="Tropical / Humid">Tropical / Humid</option>
          </select>
        </div>
      </div>

      {/* Main Content Scrollable Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {/* Hero Rating & Key Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Energy Rating Grade & Score Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-950 to-slate-900 border border-slate-800 shadow-xl flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-2xl rounded-full pointer-events-none" />

            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Energy Rating
              </span>
              <span className="text-[10px] font-mono text-slate-500">ISO 52000</span>
            </div>

            <div className="flex items-baseline gap-3 my-2">
              <div
                className={`w-14 h-14 rounded-2xl border-2 flex items-center justify-center text-3xl font-extrabold shadow-lg ${getRatingBadgeColor(
                  analysis.ratingLetter
                )}`}
              >
                {analysis.ratingLetter}
              </div>
              <div>
                <div className="flex items-baseline gap-1">
                  <span className={`text-3xl font-extrabold font-mono ${getScoreColor(analysis.score)}`}>
                    {analysis.score}
                  </span>
                  <span className="text-xs text-slate-400">/ 100</span>
                </div>
                <p className="text-[11px] text-slate-300 font-medium leading-tight mt-0.5">
                  {analysis.ratingLabel}
                </p>
              </div>
            </div>

            {/* Score progress bar */}
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden mt-3">
              <div
                className="h-full bg-gradient-to-r from-amber-500 via-sky-400 to-emerald-400 transition-all duration-700"
                style={{ width: `${analysis.score}%` }}
              />
            </div>
          </div>

          {/* Metric 1: Window-to-Wall Ratio */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span className="font-semibold uppercase tracking-wider">Window-to-Wall (WWR)</span>
              <Compass className="w-4 h-4 text-sky-400" />
            </div>
            <div className="my-2">
              <span className="text-3xl font-mono font-bold text-white">
                {analysis.wwr.overall}%
              </span>
              <p className="text-xs text-slate-400 mt-1">
                {analysis.wwr.totalGlazingArea} m² Glass / {analysis.wwr.totalWallArea} m² Wall
              </p>
            </div>
            <div className="pt-2 border-t border-slate-800 flex items-center gap-1.5 text-xs text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span className="capitalize">{analysis.wwr.status.replace('_', ' ')} Range</span>
            </div>
          </div>

          {/* Metric 2: Estimated Energy Intensity */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span className="font-semibold uppercase tracking-wider">Energy Intensity</span>
              <Flame className="w-4 h-4 text-amber-400" />
            </div>
            <div className="my-2">
              <span className="text-3xl font-mono font-bold text-white">
                {analysis.metrics.annualEnergyIntensity}
              </span>
              <span className="text-xs text-slate-400 ml-1.5">kWh/m²/yr</span>
              <p className="text-xs text-slate-400 mt-1">
                ~{analysis.metrics.estimatedAnnualEnergyUsage.toLocaleString()} kWh annual total
              </p>
            </div>
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>Utility Cost:</span>
              <span className="font-mono font-bold text-white">
                ${analysis.metrics.estimatedAnnualUtilityCost.toLocaleString()} / yr
              </span>
            </div>
          </div>

          {/* Metric 3: Carbon Footprint */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span className="font-semibold uppercase tracking-wider">Carbon Footprint</span>
              <Leaf className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="my-2">
              <span className="text-3xl font-mono font-bold text-white">
                {analysis.metrics.annualCarbonFootprint}
              </span>
              <span className="text-xs text-slate-400 ml-1.5">tCO₂e / yr</span>
              <p className="text-xs text-slate-400 mt-1">
                Climate: {analysis.climateZone.dominantSeason}
              </p>
            </div>
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>Solar Potential:</span>
              <span className="font-bold text-emerald-400">
                {analysis.roofAnalysis.solarPotential}
              </span>
            </div>
          </div>
        </div>

        {/* Section 1: Window-to-Wall Ratio by Cardinal Orientation */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-2 mb-4">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Compass className="w-4 h-4 text-sky-400" />
                <span>Window-to-Wall Ratio (WWR) by Facade Orientation</span>
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Balancing natural daylight illuminance with conductive heat loss and solar thermal gains.
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-indigo-300 bg-indigo-950/80 px-2.5 py-1 rounded-lg border border-indigo-800">
              Overall WWR: {analysis.wwr.overall}%
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* North Facade */}
            <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-white">North Facade</span>
                <span className="text-xs font-mono font-bold text-sky-400">
                  {analysis.wwr.byOrientation.north.wwr}% WWR
                </span>
              </div>
              <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden mb-2">
                <div
                  className="bg-sky-400 h-2 rounded-full"
                  style={{ width: `${Math.min(100, analysis.wwr.byOrientation.north.wwr * 2)}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>Glazing: {analysis.wwr.byOrientation.north.windowArea} m²</span>
                <span>Wall: {analysis.wwr.byOrientation.north.wallArea} m²</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-2 italic">
                Diffused, shadow-free daylighting; low direct solar heat.
              </p>
            </div>

            {/* South Facade */}
            <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-white">South Facade</span>
                <span className="text-xs font-mono font-bold text-amber-400">
                  {analysis.wwr.byOrientation.south.wwr}% WWR
                </span>
              </div>
              <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden mb-2">
                <div
                  className="bg-amber-400 h-2 rounded-full"
                  style={{ width: `${Math.min(100, analysis.wwr.byOrientation.south.wwr * 2)}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>Glazing: {analysis.wwr.byOrientation.south.windowArea} m²</span>
                <span>Wall: {analysis.wwr.byOrientation.south.wallArea} m²</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-2 italic">
                Highest solar heat harvest; deep overhangs recommended.
              </p>
            </div>

            {/* East Facade */}
            <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-white">East Facade</span>
                <span className="text-xs font-mono font-bold text-emerald-400">
                  {analysis.wwr.byOrientation.east.wwr}% WWR
                </span>
              </div>
              <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden mb-2">
                <div
                  className="bg-emerald-400 h-2 rounded-full"
                  style={{ width: `${Math.min(100, analysis.wwr.byOrientation.east.wwr * 2)}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>Glazing: {analysis.wwr.byOrientation.east.windowArea} m²</span>
                <span>Wall: {analysis.wwr.byOrientation.east.wallArea} m²</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-2 italic">
                Pleasant morning illumination with gentle warming.
              </p>
            </div>

            {/* West Facade */}
            <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-white">West Facade</span>
                <span className="text-xs font-mono font-bold text-orange-400">
                  {analysis.wwr.byOrientation.west.wwr}% WWR
                </span>
              </div>
              <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden mb-2">
                <div
                  className="bg-orange-400 h-2 rounded-full"
                  style={{ width: `${Math.min(100, analysis.wwr.byOrientation.west.wwr * 2)}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>Glazing: {analysis.wwr.byOrientation.west.windowArea} m²</span>
                <span>Wall: {analysis.wwr.byOrientation.west.wallArea} m²</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-2 italic">
                Low-angle late afternoon sun; prone to summer overheating.
              </p>
            </div>
          </div>
        </div>

        {/* Section 2: Roof Profile & Annual Energy Demand Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Roof Thermal & Solar Harvesting */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span>Roof Profile & Solar Harvesting</span>
                </h4>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 capitalize">
                  {analysis.roofAnalysis.type} ({analysis.roofAnalysis.pitch}°)
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs mb-4">
                <div className="p-2.5 rounded-lg bg-slate-800/60">
                  <span className="text-slate-400 text-[10px] block">Material System</span>
                  <span className="font-semibold text-white capitalize">
                    {analysis.roofAnalysis.material}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-800/60">
                  <span className="text-slate-400 text-[10px] block">Thermal Resistance</span>
                  <span className="font-semibold text-indigo-300 font-mono">
                    R-{analysis.roofAnalysis.estimatedRValue.toFixed(1)} m²·K/W
                  </span>
                </div>
              </div>

              <div className="space-y-2 text-xs text-slate-300">
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Solar PV Potential</span>
                  <span className="font-bold text-emerald-400">
                    {analysis.roofAnalysis.solarPotential}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Thermal Envelope Efficiency</span>
                  <span className="font-semibold text-white">
                    {analysis.roofAnalysis.thermalEfficiency}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Overhang Sun Shading</span>
                  <span className="font-semibold text-white">
                    {spec.roof.overhang || 0.6}m Architectural Eaves
                  </span>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 mt-4 bg-slate-800/40 p-2.5 rounded-xl border border-slate-800">
              💡 {analysis.roofAnalysis.pitch >= 20
                ? 'Your pitched roof geometry is within the golden 25-35° bracket for maximum annual photovoltaic generation.'
                : 'Flat / low-slope roofs are ideal for modular ballasted solar arrays or living sedum green roofs.'}
            </p>
          </div>

          {/* Energy End-Use Consumption Breakdown */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-emerald-400" />
                  <span>Annual End-Use Demand Breakdown</span>
                </h4>
                <span className="text-xs text-slate-400 font-mono">
                  {analysis.climateZone.dominantSeason}
                </span>
              </div>

              <div className="space-y-3.5 mt-4">
                {/* Space Heating */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-300 flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 text-rose-400" />
                      <span>Space Heating</span>
                    </span>
                    <span className="font-mono font-bold text-white">
                      {analysis.breakdown.heating}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-rose-500 h-2 rounded-full"
                      style={{ width: `${analysis.breakdown.heating}%` }}
                    />
                  </div>
                </div>

                {/* Space Cooling */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-300 flex items-center gap-1.5">
                      <ThermometerSnowflake className="w-3.5 h-3.5 text-sky-400" />
                      <span>Space Cooling / AC</span>
                    </span>
                    <span className="font-mono font-bold text-white">
                      {analysis.breakdown.cooling}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-sky-400 h-2 rounded-full"
                      style={{ width: `${analysis.breakdown.cooling}%` }}
                    />
                  </div>
                </div>

                {/* Lighting & Appliances */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-300 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      <span>Lighting & Power Plug Load</span>
                    </span>
                    <span className="font-mono font-bold text-white">
                      {analysis.breakdown.lightingAndAppliances}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-amber-400 h-2 rounded-full"
                      style={{ width: `${analysis.breakdown.lightingAndAppliances}%` }}
                    />
                  </div>
                </div>

                {/* Water Heating */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-300 flex items-center gap-1.5">
                      <Sun className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Domestic Hot Water</span>
                    </span>
                    <span className="font-mono font-bold text-white">
                      {analysis.breakdown.waterHeating}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-400 h-2 rounded-full"
                      style={{ width: `${analysis.breakdown.waterHeating}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-between text-xs text-slate-400 mt-4">
              <span>Heating Degree Days (HDD): {analysis.climateZone.hdd}</span>
              <span>Cooling Degree Days (CDD): {analysis.climateZone.cdd}</span>
            </div>
          </div>
        </div>

        {/* Section 3: Actionable Architectural Recommendations */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span>AI Thermal & Energy Optimization Recommendations</span>
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Suggested envelope upgrades tailored to your house's window ratios and local climate.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {analysis.recommendations.map((rec, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-600 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{rec.title}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-800">
                      Save {rec.potentialSavings}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
                    {rec.description}
                  </p>
                </div>

                {onApplyOptimization && (
                  <button
                    onClick={() => onApplyOptimization(rec.title)}
                    className="whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 transition-all shadow-sm"
                  >
                    <span>Apply via AI</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
