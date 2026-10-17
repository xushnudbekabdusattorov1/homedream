import React, { useState } from 'react';
import {
  HouseSpec,
  RoomSpec,
  GuidedOptions,
  ValidationResult,
  ArchitecturalStyle,
  RoofType,
  ProjectItem,
} from '../../types/house';
import { HouseViewer } from '../ThreeCanvas/HouseViewer';
import { FloorPlanViewer } from '../FloorPlan/FloorPlanViewer';
import {
  Sparkles,
  Send,
  SlidersHorizontal,
  Box,
  Layers,
  FileSpreadsheet,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  Save,
  Share2,
  Copy,
  ChevronDown,
  ChevronUp,
  Download,
  Info,
  Check,
  Building,
  DollarSign,
  Maximize,
  Compass,
} from 'lucide-react';

interface WorkspaceProps {
  currentSpec: HouseSpec;
  validation: ValidationResult;
  onUpdateSpec: (spec: HouseSpec, validation?: ValidationResult) => void;
  onSaveProject: (title?: string) => void;
  onOpenShareModal: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export const Workspace: React.FC<WorkspaceProps> = ({
  currentSpec,
  validation,
  onUpdateSpec,
  onSaveProject,
  onOpenShareModal,
}) => {
  // Center View Mode
  const [activeTab, setActiveTab] = useState<'3d' | '2d' | 'specs'>('3d');

  // Selected room for detailed inspection
  const [selectedRoom, setSelectedRoom] = useState<RoomSpec | null>(null);

  // Left panel prompt input & guided options
  const [prompt, setPrompt] = useState('');
  const [showGuided, setShowGuided] = useState(false);
  const [guided, setGuided] = useState<GuidedOptions>({
    plotWidth: currentSpec.plot.width || 24,
    plotDepth: currentSpec.plot.depth || 30,
    floorCount: currentSpec.floors.length || 2,
    bedrooms: currentSpec.stats.bedroomCount || 3,
    bathrooms: currentSpec.stats.bathroomCount || 2,
    style: currentSpec.style || 'Modern',
    climate: currentSpec.climate || 'Temperate',
    budgetRange: '$300,000 - $500,000',
    materialsPreference: 'Warm Wood & Concrete',
    roofPreference: currentSpec.roof.type || 'flat',
    hasGarage: currentSpec.exterior.hasGarage,
    hasPool: currentSpec.exterior.hasPool,
    hasGarden: currentSpec.exterior.hasGarden,
  });

  // Loading & Generation Stepper
  const [isGenerating, setIsGenerating] = useState(false);
  const [genStep, setGenStep] = useState<number>(0);
  const [genStatusText, setGenStatusText] = useState<string>('');

  // Right panel chat refinement state
  const [refineInput, setRefineInput] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-1',
      sender: 'assistant',
      text: `Generated "${currentSpec.title}". I calculated a structural layout with ${currentSpec.stats.livableArea} m² of livable space across ${currentSpec.stats.floorCount} floor(s). How would you like to refine it?`,
      timestamp: 'Just now',
    },
  ]);

  // Rename modal or inline title edit
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [projectTitle, setProjectTitle] = useState(currentSpec.title);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Quick refinement suggestions
  const QUICK_REFINEMENTS = [
    'Make the roof sloped with dark slate shingles',
    'Add an outdoor infinity swimming pool',
    'Add a private balcony to the master bedroom',
    'Switch facade to warm Japanese cedar siding',
    'Convert into a flat modern cantilever roof',
    'Add a two-car garage with storage',
  ];

  // Full regeneration flow
  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setGenStep(1);
    setGenStatusText('Analyzing architectural intent & spatial requirements...');

    const timer1 = setTimeout(() => {
      setGenStep(2);
      setGenStatusText('Calculating non-overlapping room coordinates & load-bearing physics...');
    }, 1200);

    const timer2 = setTimeout(() => {
      setGenStep(3);
      setGenStatusText('Procedurally constructing 3D meshes & 2D blueprints...');
    }, 2400);

    try {
      const res = await fetch('/api/generate-home', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          guidedOptions: showGuided ? guided : undefined,
        }),
      });

      const data = await res.json();
      if (data.spec) {
        onUpdateSpec(data.spec, data.validation);
        setProjectTitle(data.spec.title);
        setChatMessages((prev) => [
          ...prev,
          {
            id: 'msg-' + Date.now(),
            sender: 'user',
            text: prompt,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
          {
            id: 'msg-' + (Date.now() + 1),
            sender: 'assistant',
            text: `Generated "${data.spec.title}". ${data.spec.designSummary}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
        setPrompt('');
      }
    } catch (err) {
      console.error('Failed to generate house:', err);
    } finally {
      clearTimeout(timer1);
      clearTimeout(timer2);
      setIsGenerating(false);
      setGenStep(0);
    }
  };

  // Iterative chat refinement flow
  const handleRefine = async (customInstruction?: string) => {
    const instruction = customInstruction || refineInput;
    if (!instruction.trim()) return;

    const userMsg: ChatMessage = {
      id: 'msg-' + Date.now(),
      sender: 'user',
      text: instruction,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setChatMessages((prev) => [...prev, userMsg]);
    setRefineInput('');
    setIsRefining(true);

    try {
      const res = await fetch('/api/refine-home', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentSpec,
          instruction,
        }),
      });

      const data = await res.json();
      if (data.spec) {
        onUpdateSpec(data.spec, data.validation);
        const assistantMsg: ChatMessage = {
          id: 'msg-' + (Date.now() + 1),
          sender: 'assistant',
          text: `Refinement applied: ${instruction}. Updated the 3D model, floor plans, and material schedules without resetting the layout.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setChatMessages((prev) => [...prev, assistantMsg]);
      }
    } catch (err) {
      console.error('Failed to refine home:', err);
    } finally {
      setIsRefining(false);
    }
  };

  const handleSave = () => {
    onSaveProject(projectTitle);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  return (
    <div className="flex-1 w-full bg-slate-950 flex flex-col overflow-hidden text-slate-100">
      {/* Top Workspace Header Bar */}
      <div className="h-14 border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between gap-4">
        {/* Project Title & Style */}
        <div className="flex items-center gap-3 min-w-0">
          {isEditingTitle ? (
            <input
              type="text"
              value={projectTitle}
              onChange={(e) => setProjectTitle(e.target.value)}
              onBlur={() => {
                setIsEditingTitle(false);
                onUpdateSpec({ ...currentSpec, title: projectTitle });
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setIsEditingTitle(false);
                  onUpdateSpec({ ...currentSpec, title: projectTitle });
                }
              }}
              autoFocus
              className="bg-slate-800 border border-indigo-500 rounded-lg px-2.5 py-1 text-sm font-bold text-white focus:outline-none"
            />
          ) : (
            <h2
              onClick={() => setIsEditingTitle(true)}
              className="text-sm font-bold text-white truncate cursor-pointer hover:text-indigo-300 transition-colors flex items-center gap-2"
              title="Click to rename"
            >
              <span>{projectTitle}</span>
              <span className="text-[10px] text-slate-400 font-normal">✎</span>
            </h2>
          )}
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-slate-800 text-slate-300 border border-slate-700 hidden sm:inline">
            {currentSpec.style}
          </span>
          <span className="text-xs text-slate-400 hidden md:inline">
            {currentSpec.stats.livableArea} m² • {currentSpec.stats.bedroomCount} Beds • {currentSpec.stats.floorCount} Floors
          </span>
        </div>

        {/* Center Tabs: 3D vs 2D vs Specs */}
        <div className="flex items-center bg-slate-800/90 p-1 rounded-xl border border-slate-700/60">
          <button
            onClick={() => setActiveTab('3d')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === '3d'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/60'
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            <span>3D Model</span>
          </button>
          <button
            onClick={() => setActiveTab('2d')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === '2d'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>2D Floor Plans</span>
          </button>
          <button
            onClick={() => setActiveTab('specs')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'specs'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/60'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Specs Sheet</span>
          </button>
        </div>

        {/* Right Header Controls: Save, Share */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              saveSuccess
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
            }`}
          >
            {saveSuccess ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
            <span>{saveSuccess ? 'Saved!' : 'Save Project'}</span>
          </button>

          <button
            onClick={onOpenShareModal}
            className="p-1.5 rounded-xl text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700"
            title="Share Public Blueprint"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main 3-Column Studio Layout */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* LEFT PANEL: Prompt Input & Guided Parameters */}
        <div className="w-full lg:w-80 lg:min-w-[320px] bg-slate-900/90 border-r border-slate-800 flex flex-col overflow-y-auto p-4 gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Prompt & Specs Generator</span>
            </h3>
          </div>

          {/* Prompt Area */}
          <div className="rounded-xl bg-slate-800/80 p-3 border border-slate-700/70 shadow-sm focus-within:border-indigo-500">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe a new house or press generate with current parameters..."
              rows={3}
              className="w-full bg-transparent text-xs text-slate-200 placeholder-slate-500 resize-none focus:outline-none leading-relaxed"
            />
            <div className="pt-2 flex items-center justify-between border-t border-slate-700/60">
              <button
                type="button"
                onClick={() => setShowGuided((v) => !v)}
                className="text-[11px] text-slate-400 hover:text-indigo-300 flex items-center gap-1"
              >
                <SlidersHorizontal className="w-3 h-3 text-indigo-400" />
                <span>{showGuided ? 'Hide Guided' : 'Guided Parameters'}</span>
              </button>

              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md disabled:opacity-50 flex items-center gap-1 transition-all"
              >
                <Sparkles className="w-3 h-3" />
                <span>{isGenerating ? 'Building...' : 'Generate'}</span>
              </button>
            </div>
          </div>

          {/* Guided Inputs Collapsible */}
          {showGuided && (
            <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/50 space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Architectural Style</label>
                <select
                  value={guided.style}
                  onChange={(e) => setGuided({ ...guided, style: e.target.value as ArchitecturalStyle })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-slate-200"
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

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 block mb-1">Bedrooms</label>
                  <input
                    type="number"
                    min={1}
                    max={6}
                    value={guided.bedrooms}
                    onChange={(e) => setGuided({ ...guided, bedrooms: parseInt(e.target.value, 10) || 1 })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Floors</label>
                  <input
                    type="number"
                    min={1}
                    max={3}
                    value={guided.floorCount}
                    onChange={(e) => setGuided({ ...guided, floorCount: parseInt(e.target.value, 10) || 1 })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Roof Profile</label>
                <select
                  value={guided.roofPreference}
                  onChange={(e) => setGuided({ ...guided, roofPreference: e.target.value as RoofType })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-slate-200"
                >
                  <option value="flat">Flat Modern Cantilever</option>
                  <option value="sloped_gable">Sloped Gable Pitch</option>
                  <option value="hip">Hip Roof</option>
                  <option value="terrace">Rooftop Terrace</option>
                </select>
              </div>

              <div className="flex items-center gap-3 pt-1">
                <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 text-[11px]">
                  <input
                    type="checkbox"
                    checked={guided.hasPool}
                    onChange={(e) => setGuided({ ...guided, hasPool: e.target.checked })}
                    className="rounded accent-indigo-500"
                  />
                  <span>Pool</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 text-[11px]">
                  <input
                    type="checkbox"
                    checked={guided.hasGarage}
                    onChange={(e) => setGuided({ ...guided, hasGarage: e.target.checked })}
                    className="rounded accent-indigo-500"
                  />
                  <span>Garage</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 text-[11px]">
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

          {/* Generation Progress Stepper Modal/Banner */}
          {isGenerating && (
            <div className="p-3.5 rounded-xl bg-indigo-950/60 border border-indigo-700/70 shadow-lg animate-pulse">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-indigo-400 animate-spin" />
                <h4 className="text-xs font-bold text-white">Synthesizing Architecture</h4>
              </div>
              <p className="text-[11px] text-indigo-200 mb-3">{genStatusText}</p>
              <div className="w-full bg-indigo-950 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-indigo-400 h-1.5 transition-all duration-500"
                  style={{ width: `${(genStep / 3) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Structural Validation Health Indicator */}
          <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/60">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Physics & Sanity Audit
              </span>
              {validation.valid ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-700/50 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  <span>Compliant</span>
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950/80 text-amber-300 border border-amber-700/50 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  <span>{validation.issues.length} Note(s)</span>
                </span>
              )}
            </div>

            {validation.issues.length === 0 ? (
              <p className="text-[11px] text-slate-400">
                Zero room overlaps. Continuous door accessibility verified. Upper floor cantilever load supported.
              </p>
            ) : (
              <ul className="space-y-1 text-[11px] text-slate-400">
                {validation.issues.slice(0, 3).map((iss, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-amber-400 mt-0.5">•</span>
                    <span>{iss.message}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Architectural Key Metrics */}
          <div className="mt-auto p-3 rounded-xl bg-slate-800/40 border border-slate-800 space-y-2 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Total Gross Area</span>
              <span className="font-semibold text-white">{currentSpec.stats.totalArea} m²</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Livable Floor Area</span>
              <span className="font-semibold text-white">{currentSpec.stats.livableArea} m²</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Estimated Cost</span>
              <span className="font-semibold text-emerald-400">{currentSpec.stats.estimatedCostRange}</span>
            </div>
          </div>
        </div>

        {/* CENTER PANEL: 3D Canvas / 2D Floor Plan / Spec Sheet */}
        <div className="flex-1 flex flex-col min-w-0 h-[500px] lg:h-auto bg-slate-950 p-2 sm:p-4 relative">
          {activeTab === '3d' && (
            <div className="w-full h-full relative">
              <HouseViewer
                spec={currentSpec}
                selectedRoomId={selectedRoom?.id}
                onSelectRoom={(room) => setSelectedRoom(room)}
                onUpdateSpec={(updated) => onUpdateSpec(updated)}
              />
            </div>
          )}

          {activeTab === '2d' && (
            <div className="w-full h-full">
              <FloorPlanViewer
                spec={currentSpec}
                selectedRoomId={selectedRoom?.id}
                onSelectRoom={(room) => setSelectedRoom(room)}
              />
            </div>
          )}

          {activeTab === 'specs' && (
            <div className="w-full h-full bg-slate-900 rounded-2xl border border-slate-800 p-6 overflow-y-auto">
              <div className="max-w-4xl mx-auto space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">{currentSpec.title} — Architectural Specification</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{currentSpec.designSummary}</p>
                </div>

                {/* Room Schedule Table */}
                <div>
                  <h4 className="text-sm font-bold uppercase tracking-wider text-indigo-400 mb-3">Room Schedule & Finishes</h4>
                  <div className="overflow-x-auto rounded-xl border border-slate-800">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-800/80 text-slate-300 font-semibold border-b border-slate-700">
                        <tr>
                          <th className="p-3">Room Name</th>
                          <th className="p-3">Level</th>
                          <th className="p-3">Dimensions</th>
                          <th className="p-3">Area</th>
                          <th className="p-3">Flooring</th>
                          <th className="p-3">Wall Finish</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 text-slate-300">
                        {currentSpec.rooms.map((r) => (
                          <tr
                            key={r.id}
                            onClick={() => setSelectedRoom(r)}
                            className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                          >
                            <td className="p-3 font-semibold text-white">{r.name}</td>
                            <td className="p-3">L{r.floor}</td>
                            <td className="p-3">{r.width}m × {r.depth}m</td>
                            <td className="p-3 font-mono font-bold text-indigo-300">{(r.width * r.depth).toFixed(1)} m²</td>
                            <td className="p-3 capitalize">{r.floorMaterial.replace('_', ' ')}</td>
                            <td className="p-3 capitalize">{r.wallMaterial.replace('_', ' ')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Exterior & Structural Schedule */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-800">
                    <h5 className="text-xs font-bold text-white uppercase tracking-wider mb-2">Exterior & Site Schedule</h5>
                    <ul className="text-xs space-y-1.5 text-slate-300">
                      <li>• Plot Dimensions: {currentSpec.plot.width}m × {currentSpec.plot.depth}m</li>
                      <li>• Pool: {currentSpec.exterior.hasPool ? `Yes (${currentSpec.exterior.poolDimensions?.width}m × ${currentSpec.exterior.poolDimensions?.depth}m)` : 'None'}</li>
                      <li>• Garage: {currentSpec.exterior.hasGarage ? 'Integrated 2-car covered' : 'None'}</li>
                      <li>• Balcony / Terrace: {currentSpec.exterior.hasBalcony || currentSpec.exterior.hasTerrace ? 'Included' : 'None'}</li>
                    </ul>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-800">
                    <h5 className="text-xs font-bold text-white uppercase tracking-wider mb-2">Roof & Envelope Materials</h5>
                    <ul className="text-xs space-y-1.5 text-slate-300">
                      <li>• Roof System: {currentSpec.roof.type.replace('_', ' ')} ({currentSpec.roof.pitch}° pitch)</li>
                      <li>• Facade Cladding: {currentSpec.materials.facadePrimary.name}</li>
                      <li>• Secondary Accent: {currentSpec.materials.facadeSecondary.name}</li>
                      <li>• Glazing: Low-E Double Insulated Glass with Aluminum Mullions</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT PANEL: Refinement Chat & Selected Room Inspector */}
        <div className="w-full lg:w-84 lg:min-w-[330px] bg-slate-900/95 border-l border-slate-800 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="p-3.5 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">AI Refinement Chat</h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800">
              Live Retain
            </span>
          </div>

          {/* Selected Room Inspector Banner if active */}
          {selectedRoom && (
            <div className="p-3 bg-indigo-950/40 border-b border-indigo-900/50 text-xs">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Box className="w-3.5 h-3.5 text-indigo-400" />
                  {selectedRoom.name}
                </span>
                <button
                  onClick={() => setSelectedRoom(null)}
                  className="text-slate-400 hover:text-white text-xs"
                >
                  ✕
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300">
                <p>Area: <span className="text-white font-semibold">{(selectedRoom.width * selectedRoom.depth).toFixed(1)} m²</span></p>
                <p>Level: <span className="text-white font-semibold">Floor {selectedRoom.floor}</span></p>
                <p>Width: <span className="text-white font-semibold">{selectedRoom.width}m</span></p>
                <p>Depth: <span className="text-white font-semibold">{selectedRoom.depth}m</span></p>
              </div>
            </div>
          )}

          {/* Chat Message Stream */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[90%] p-2.5 rounded-2xl text-xs leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-indigo-600 text-white rounded-tr-none'
                      : 'bg-slate-800 border border-slate-700/60 text-slate-200 rounded-tl-none shadow-sm'
                  }`}
                >
                  {msg.text}
                </div>
                <span className="text-[10px] text-slate-500 mt-1 px-1">{msg.timestamp}</span>
              </div>
            ))}
            {isRefining && (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-800/60 border border-slate-700 text-xs text-indigo-300">
                <Sparkles className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                <span>Incorporating refinement into model...</span>
              </div>
            )}
          </div>

          {/* Quick Refinement Pills */}
          <div className="p-2 border-t border-slate-800 bg-slate-900/60 flex flex-nowrap overflow-x-auto gap-1.5 scrollbar-none">
            {QUICK_REFINEMENTS.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleRefine(chip)}
                className="whitespace-nowrap px-2.5 py-1 rounded-full text-[10px] bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-indigo-200 transition-colors"
              >
                + {chip}
              </button>
            ))}
          </div>

          {/* Chat Input Field */}
          <div className="p-3 border-t border-slate-800 bg-slate-900">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleRefine();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={refineInput}
                onChange={(e) => setRefineInput(e.target.value)}
                placeholder="Ask to modify: 'Make roof sloped', 'Add balcony'..."
                className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                disabled={isRefining || !refineInput.trim()}
                className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40 transition-all shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
