import React, { useRef, useState, useEffect } from 'react';
import { HouseSpec, RoomSpec, FurnitureItem } from '../../types/house';
import {
  Download,
  FileText,
  Image as ImageIcon,
  ZoomIn,
  ZoomOut,
  Compass,
  RotateCw,
  Trash2,
  Move,
  Armchair,
  Layers,
} from 'lucide-react';
import { jsPDF } from 'jspdf';

interface FloorPlanViewerProps {
  spec: HouseSpec;
  selectedRoomId?: string | null;
  selectedFurnitureId?: string | null;
  onSelectRoom?: (room: RoomSpec | null) => void;
  onSelectFurniture?: (furniture: FurnitureItem | null) => void;
  onAddFurniture?: (item: FurnitureItem) => void;
  onUpdateFurniture?: (item: FurnitureItem) => void;
  onDeleteFurniture?: (id: string) => void;
  activeFloorOverride?: number;
  onFloorChange?: (floor: number) => void;
}

export const FloorPlanViewer: React.FC<FloorPlanViewerProps> = ({
  spec,
  selectedRoomId,
  selectedFurnitureId,
  onSelectRoom,
  onSelectFurniture,
  onAddFurniture,
  onUpdateFurniture,
  onDeleteFurniture,
  activeFloorOverride,
  onFloorChange,
}) => {
  const [activeFloor, setActiveFloor] = useState<number>(activeFloorOverride ?? 0);
  const [zoom, setZoom] = useState<number>(1);
  const [isDragOver, setIsDragOver] = useState(false);
  const [draggingFurniture, setDraggingFurniture] = useState<{ id: string; offsetX: number; offsetZ: number } | null>(null);

  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (activeFloorOverride !== undefined && activeFloorOverride !== activeFloor) {
      setActiveFloor(activeFloorOverride);
    }
  }, [activeFloorOverride]);

  const handleFloorSwitch = (lvl: number) => {
    setActiveFloor(lvl);
    onFloorChange?.(lvl);
  };

  const plotW = spec.plot.width || 24;
  const plotD = spec.plot.depth || 30;

  // Scale: 1 meter = 28 SVG units
  const scale = 28;
  const svgWidth = plotW * scale + 140;
  const svgHeight = plotD * scale + 140;
  const originX = svgWidth / 2;
  const originY = svgHeight / 2;

  const currentRooms = spec.rooms.filter((r) => r.floor === activeFloor);
  const floorFurniture = (spec.furniture || []).filter((f) => f.floor === activeFloor);

  // Drag and Drop handling for Furniture from Catalog
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    try {
      const rawData = e.dataTransfer.getData('application/json');
      if (!rawData) return;
      const item = JSON.parse(rawData);

      if (!svgRef.current) return;
      const rect = svgRef.current.getBoundingClientRect();
      const dropSvgX = (e.clientX - rect.left) / zoom;
      const dropSvgY = (e.clientY - rect.top) / zoom;
      const worldX = (dropSvgX - originX) / scale;
      const worldZ = (dropSvgY - originY) / scale;

      // Check containing room
      const room = currentRooms.find((r) => {
        const halfW = r.width / 2;
        const halfD = r.depth / 2;
        return (
          worldX >= r.x - halfW &&
          worldX <= r.x + halfW &&
          worldZ >= r.z - halfD &&
          worldZ <= r.z + halfD
        );
      });

      const newFurniture: FurnitureItem = {
        id: 'furn-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
        type: item.type,
        name: item.name,
        category: item.category,
        floor: activeFloor,
        x: parseFloat(worldX.toFixed(2)),
        z: parseFloat(worldZ.toFixed(2)),
        rotation: 0,
        width: item.width,
        depth: item.depth,
        height: item.height,
        color: item.defaultColor,
        material: item.defaultMaterial,
        roomId: room?.id,
      };

      onAddFurniture?.(newFurniture);
      onSelectFurniture?.(newFurniture);
    } catch (err) {
      console.error('Drop error:', err);
    }
  };

  // SVG Export
  const downloadSVG = () => {
    if (!svgRef.current) return;
    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${spec.title.toLowerCase().replace(/\s+/g, '-')}-floor-${activeFloor}.svg`;
    link.click();
  };

  // PNG Export via Canvas
  const downloadPNG = () => {
    if (!svgRef.current) return;
    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const URLObject = window.URL || window.webkitURL || window;
    const blobURL = URLObject.createObjectURL(svgBlob);

    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = svgWidth * 2;
      canvas.height = svgHeight * 2;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.scale(2, 2);
        ctx.drawImage(image, 0, 0);
        const pngURL = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `${spec.title.toLowerCase().replace(/\s+/g, '-')}-floor-${activeFloor}.png`;
        link.href = pngURL;
        link.click();
      }
    };
    image.src = blobURL;
  };

  // PDF Export
  const downloadPDF = () => {
    if (!svgRef.current) return;
    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const URLObject = window.URL || window.webkitURL || window;
    const blobURL = URLObject.createObjectURL(svgBlob);

    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = svgWidth * 2;
      canvas.height = svgHeight * 2;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.scale(2, 2);
        ctx.drawImage(image, 0, 0);
        const pngURL = canvas.toDataURL('image/jpeg', 0.95);

        const pdf = new jsPDF('landscape', 'pt', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();

        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(20);
        pdf.setTextColor(20, 24, 33);
        pdf.text(spec.title, 40, 45);

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(10);
        pdf.setTextColor(100, 116, 139);
        pdf.text(
          `ARCHITECTURAL FLOOR PLAN — LEVEL ${activeFloor} (${spec.floors.find((f) => f.level === activeFloor)?.name || 'Floor'})`,
          40,
          62
        );
        pdf.text(`Style: ${spec.style} | Livable Area: ${spec.stats.livableArea} m² | Generated by DreamHome AI`, 40, 76);

        pdf.setDrawColor(226, 232, 240);
        pdf.setLineWidth(1);
        pdf.line(40, 85, pdfWidth - 40, 85);

        const imgW = pdfWidth - 80;
        const imgH = (svgHeight / svgWidth) * imgW;
        const displayH = Math.min(imgH, pdfHeight - 160);
        const displayW = (svgWidth / svgHeight) * displayH;
        const startX = (pdfWidth - displayW) / 2;

        pdf.addImage(pngURL, 'JPEG', startX, 95, displayW, displayH);

        pdf.setFontSize(8);
        pdf.setTextColor(148, 163, 184);
        pdf.text('CONFIDENTIAL ARCHITECTURAL SPECIFICATION — FOR SCHEMATIC & PLANNING PURPOSES ONLY', 40, pdfHeight - 20);

        pdf.save(`${spec.title.toLowerCase().replace(/\s+/g, '-')}-floor-${activeFloor}.pdf`);
      }
    };
    image.src = blobURL;
  };

  // Render 2D Top-Down Architectural Furniture
  const renderFurnitureItem = (f: FurnitureItem) => {
    const isSelected = selectedFurnitureId === f.id;
    const fx = originX + f.x * scale;
    const fy = originY + f.z * scale;
    const fw = f.width * scale;
    const fd = f.depth * scale;

    const rot = f.rotation || 0;

    return (
      <g
        key={f.id}
        transform={`translate(${fx}, ${fy}) rotate(${rot})`}
        onClick={(e) => {
          e.stopPropagation();
          onSelectFurniture?.(f);
        }}
        className="cursor-pointer group"
      >
        {/* Selection glow */}
        {isSelected && (
          <rect
            x={-fw / 2 - 4}
            y={-fd / 2 - 4}
            width={fw + 8}
            height={fd + 8}
            fill="none"
            stroke="#6366f1"
            strokeWidth="2"
            strokeDasharray="4 2"
            rx="4"
          />
        )}

        {/* Dynamic Architectural Geometry by Type */}
        {f.type.startsWith('sofa') && (
          <g>
            {/* Main sofa body */}
            <rect
              x={-fw / 2}
              y={-fd / 2}
              width={fw}
              height={fd}
              fill="#e2e8f0"
              stroke="#475569"
              strokeWidth="1.5"
              rx="3"
            />
            {/* Backrest */}
            <rect
              x={-fw / 2}
              y={-fd / 2}
              width={fw}
              height={fd * 0.3}
              fill="#cbd5e1"
              stroke="#475569"
              strokeWidth="1.2"
              rx="2"
            />
            {/* Armrests */}
            <rect x={-fw / 2} y={-fd / 2} width={fw * 0.12} height={fd} fill="#cbd5e1" stroke="#475569" strokeWidth="1" />
            <rect x={fw / 2 - fw * 0.12} y={-fd / 2} width={fw * 0.12} height={fd} fill="#cbd5e1" stroke="#475569" strokeWidth="1" />
            {/* Cushion divider lines */}
            <line x1={-fw * 0.16} y1={-fd / 2 + fd * 0.3} x2={-fw * 0.16} y2={fd / 2} stroke="#64748b" strokeWidth="1" />
            <line x1={fw * 0.16} y1={-fd / 2 + fd * 0.3} x2={fw * 0.16} y2={fd / 2} stroke="#64748b" strokeWidth="1" />
          </g>
        )}

        {f.type === 'armchair' && (
          <g>
            <rect x={-fw / 2} y={-fd / 2} width={fw} height={fd} fill="#f1f5f9" stroke="#475569" strokeWidth="1.5" rx="4" />
            <rect x={-fw / 2} y={-fd / 2} width={fw} height={fd * 0.35} fill="#e2e8f0" stroke="#475569" strokeWidth="1.2" rx="2" />
            <rect x={-fw / 2} y={-fd / 2} width={fw * 0.18} height={fd} fill="#e2e8f0" stroke="#475569" strokeWidth="1" />
            <rect x={fw / 2 - fw * 0.18} y={-fd / 2} width={fw * 0.18} height={fd} fill="#e2e8f0" stroke="#475569" strokeWidth="1" />
          </g>
        )}

        {f.type.startsWith('bed') && (
          <g>
            {/* Bed Frame & Mattress */}
            <rect x={-fw / 2} y={-fd / 2} width={fw} height={fd} fill="#f8fafc" stroke="#334155" strokeWidth="1.8" rx="2" />
            {/* Headboard */}
            <rect x={-fw / 2} y={-fd / 2} width={fw} height={fd * 0.14} fill="#475569" stroke="#1e293b" strokeWidth="1.5" />
            {/* Pillows */}
            <rect x={-fw / 2 + fw * 0.1} y={-fd / 2 + fd * 0.16} width={fw * 0.35} height={fd * 0.22} fill="#ffffff" stroke="#94a3b8" strokeWidth="1" rx="2" />
            <rect x={fw / 2 - fw * 0.45} y={-fd / 2 + fd * 0.16} width={fw * 0.35} height={fd * 0.22} fill="#ffffff" stroke="#94a3b8" strokeWidth="1" rx="2" />
            {/* Blanket fold */}
            <line x1={-fw / 2} y1={fd * 0.05} x2={fw / 2} y2={fd * 0.05} stroke="#cbd5e1" strokeWidth="1.2" />
          </g>
        )}

        {f.type === 'coffee_table' && (
          <g>
            <rect x={-fw / 2} y={-fd / 2} width={fw} height={fd} fill="#fef3c7" stroke="#b45309" strokeWidth="1.2" rx="2" />
            <text x="0" y="3" textAnchor="middle" fontSize="8" fill="#92400e" fontFamily="sans-serif">Table</text>
          </g>
        )}

        {f.type === 'dining_table' && (
          <g>
            <rect x={-fw / 2} y={-fd / 2} width={fw} height={fd} fill="#fed7aa" stroke="#c2410c" strokeWidth="1.5" rx="3" />
            {/* Chairs */}
            {[-fw * 0.3, 0, fw * 0.3].map((cx, idx) => (
              <React.Fragment key={idx}>
                <rect x={cx - 5} y={-fd / 2 - 6} width={10} height={5} fill="#fb923c" stroke="#9a3412" strokeWidth="1" rx="1" />
                <rect x={cx - 5} y={fd / 2 + 1} width={10} height={5} fill="#fb923c" stroke="#9a3412" strokeWidth="1" rx="1" />
              </React.Fragment>
            ))}
          </g>
        )}

        {f.type === 'bathtub' && (
          <g>
            <rect x={-fw / 2} y={-fd / 2} width={fw} height={fd} fill="#f1f5f9" stroke="#0284c7" strokeWidth="1.5" rx="4" />
            <ellipse cx="0" cy="0" rx={fw * 0.42} ry={fd * 0.38} fill="#e0f2fe" stroke="#0369a1" strokeWidth="1.2" />
            <circle cx={-fw * 0.3} cy="0" r="2" fill="#0284c7" />
          </g>
        )}

        {/* Default fallback furniture representation */}
        {!f.type.startsWith('sofa') &&
          f.type !== 'armchair' &&
          !f.type.startsWith('bed') &&
          f.type !== 'coffee_table' &&
          f.type !== 'dining_table' &&
          f.type !== 'bathtub' && (
            <g>
              <rect
                x={-fw / 2}
                y={-fd / 2}
                width={fw}
                height={fd}
                fill="#f1f5f9"
                stroke="#475569"
                strokeWidth="1.2"
                rx="2"
              />
              <text x="0" y="3" textAnchor="middle" fontSize="7" fill="#475569" fontFamily="sans-serif">
                {f.name.split(' ')[0]}
              </text>
            </g>
          )}

        {/* Small rotation / delete controls floating next to selected item */}
        {isSelected && (
          <g transform={`translate(${fw / 2 + 8}, ${-fd / 2})`}>
            {/* Rotate Button */}
            <g
              onClick={(e) => {
                e.stopPropagation();
                const nextRot = (f.rotation + 90) % 360;
                onUpdateFurniture?.({ ...f, rotation: nextRot });
              }}
              className="hover:scale-125 transition-transform"
            >
              <circle cx="8" cy="0" r="9" fill="#4f46e5" stroke="#ffffff" strokeWidth="1.5" />
              <text x="8" y="3" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="bold">
                ↻
              </text>
            </g>

            {/* Delete Button */}
            <g
              onClick={(e) => {
                e.stopPropagation();
                onDeleteFurniture?.(f.id);
              }}
              className="hover:scale-125 transition-transform"
            >
              <circle cx="8" cy="22" r="9" fill="#ef4444" stroke="#ffffff" strokeWidth="1.5" />
              <text x="8" y="25" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="bold">
                ✕
              </text>
            </g>
          </g>
        )}
      </g>
    );
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-900 rounded-2xl overflow-hidden border border-slate-800">
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between p-3.5 bg-slate-900/90 border-b border-slate-800 gap-3">
        {/* Floor Selection Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-800/80 p-1 rounded-xl">
          {spec.floors.map((fl) => (
            <button
              key={fl.level}
              onClick={() => handleFloorSwitch(fl.level)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeFloor === fl.level
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              {fl.name}
            </button>
          ))}
        </div>

        {/* Zoom & Export Actions */}
        <div className="flex items-center gap-2">
          {/* Zoom Buttons */}
          <div className="flex items-center bg-slate-800/80 rounded-lg p-0.5 border border-slate-700/60">
            <button
              onClick={() => setZoom((z) => Math.max(0.6, z - 0.15))}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-md"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono px-2 text-slate-300">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom((z) => Math.min(2.0, z + 0.15))}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-md"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Download Options */}
          <button
            onClick={downloadSVG}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1 transition-all"
            title="Download Vector SVG"
          >
            <Download className="w-3.5 h-3.5" />
            <span>SVG</span>
          </button>
          <button
            onClick={downloadPNG}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1 transition-all"
            title="Download PNG Image"
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>PNG</span>
          </button>
          <button
            onClick={downloadPDF}
            className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
            title="Download Architectural PDF Spec"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>PDF</span>
          </button>
        </div>
      </div>

      {/* SVG Canvas Area with Drop Target */}
      <div
        className="flex-1 overflow-auto p-6 flex items-center justify-center bg-slate-950/70 select-none relative"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {isDragOver && (
          <div className="absolute inset-0 bg-indigo-600/15 border-2 border-dashed border-indigo-400 z-30 pointer-events-none flex items-center justify-center backdrop-blur-[1px]">
            <div className="px-4 py-2 rounded-xl bg-indigo-900/90 text-white font-semibold text-xs shadow-xl flex items-center gap-2">
              <Armchair className="w-4 h-4 text-indigo-300" />
              <span>Drop Furniture to Place in Room</span>
            </div>
          </div>
        )}

        <div
          style={{ transform: `scale(${zoom})`, transformOrigin: 'center center', transition: 'transform 0.15s ease-out' }}
          className="shadow-2xl rounded-xl bg-white p-6 border border-slate-200"
        >
          <svg
            ref={svgRef}
            width={svgWidth}
            height={svgHeight}
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            xmlns="http://www.w3.org/2000/svg"
            className="max-w-none"
            onClick={() => {
              onSelectRoom?.(null);
              onSelectFurniture?.(null);
            }}
          >
            <defs>
              <pattern id="archGrid" width={scale} height={scale} patternUnits="userSpaceOnUse">
                <path d={`M ${scale} 0 L 0 0 0 ${scale}`} fill="none" stroke="#f1f5f9" strokeWidth="1" />
              </pattern>
              <pattern id="patioHatch" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                <line x1="0" y1="0" x2="0" y2="8" stroke="#cbd5e1" strokeWidth="1.5" />
              </pattern>
              <linearGradient id="poolGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#bae6fd" />
                <stop offset="100%" stopColor="#38bdf8" />
              </linearGradient>
            </defs>

            {/* Background Grid */}
            <rect width={svgWidth} height={svgHeight} fill="url(#archGrid)" />

            {/* Plot Boundary Line */}
            <rect
              x={originX - (plotW * scale) / 2}
              y={originY - (plotD * scale) / 2}
              width={plotW * scale}
              height={plotD * scale}
              fill="none"
              stroke="#94a3b8"
              strokeWidth="2"
              strokeDasharray="6 4"
            />
            <text
              x={originX - (plotW * scale) / 2 + 10}
              y={originY - (plotD * scale) / 2 + 20}
              fill="#94a3b8"
              fontSize="11"
              fontFamily="monospace"
              fontWeight="bold"
            >
              PROPERTY BOUNDARY ({plotW}m × {plotD}m)
            </text>

            {/* Exterior Features on Ground Floor (Pool, Patio, Garden) */}
            {activeFloor === 0 && spec.exterior?.patioDimensions && (
              <g>
                <rect
                  x={originX + spec.exterior.patioDimensions.x * scale - (spec.exterior.patioDimensions.width * scale) / 2}
                  y={originY + spec.exterior.patioDimensions.z * scale - (spec.exterior.patioDimensions.depth * scale) / 2}
                  width={spec.exterior.patioDimensions.width * scale}
                  height={spec.exterior.patioDimensions.depth * scale}
                  fill="url(#patioHatch)"
                  stroke="#94a3b8"
                  strokeWidth="1.5"
                />
                <text
                  x={originX + spec.exterior.patioDimensions.x * scale}
                  y={originY + spec.exterior.patioDimensions.z * scale}
                  textAnchor="middle"
                  fill="#64748b"
                  fontSize="10"
                  fontFamily="sans-serif"
                  fontWeight="600"
                >
                  OUTDOOR PATIO / DECK
                </text>
              </g>
            )}

            {activeFloor === 0 && spec.exterior?.hasPool && spec.exterior.poolDimensions && (
              <g>
                <rect
                  x={originX + spec.exterior.poolDimensions.x * scale - (spec.exterior.poolDimensions.width * scale) / 2}
                  y={originY + spec.exterior.poolDimensions.z * scale - (spec.exterior.poolDimensions.depth * scale) / 2}
                  width={spec.exterior.poolDimensions.width * scale}
                  height={spec.exterior.poolDimensions.depth * scale}
                  fill="url(#poolGradient)"
                  stroke="#0284c7"
                  strokeWidth="2.5"
                  rx="4"
                />
                <text
                  x={originX + spec.exterior.poolDimensions.x * scale}
                  y={originY + spec.exterior.poolDimensions.z * scale + 4}
                  textAnchor="middle"
                  fill="#0369a1"
                  fontSize="11"
                  fontFamily="sans-serif"
                  fontWeight="bold"
                >
                  SWIMMING POOL ({spec.exterior.poolDimensions.width}m × {spec.exterior.poolDimensions.depth}m)
                </text>
              </g>
            )}

            {/* Rooms for this floor */}
            {currentRooms.map((room) => {
              const rx = originX + room.x * scale - (room.width * scale) / 2;
              const ry = originY + room.z * scale - (room.depth * scale) / 2;
              const rw = room.width * scale;
              const rh = room.depth * scale;
              const area = (room.width * room.depth).toFixed(1);
              const isSelected = selectedRoomId === room.id;

              const roomFillColor =
                room.type === 'living'
                  ? '#f8fafc'
                  : room.type === 'kitchen'
                  ? '#f1f5f9'
                  : room.type === 'bathroom'
                  ? '#e0f2fe'
                  : room.type === 'master_bedroom'
                  ? '#fef3c7'
                  : room.type === 'bedroom'
                  ? '#fef9c3'
                  : room.type === 'garage'
                  ? '#f3f4f6'
                  : '#f8fafc';

              const roomDoors = spec.doors.filter((d) => d.roomId === room.id);
              const roomWindows = spec.windows.filter((w) => w.roomId === room.id);

              return (
                <g
                  key={room.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectRoom?.(room);
                  }}
                  className="cursor-pointer transition-all hover:opacity-95"
                >
                  {/* Room Interior Polygon */}
                  <rect
                    x={rx}
                    y={ry}
                    width={rw}
                    height={rh}
                    fill={isSelected ? '#e0e7ff' : roomFillColor}
                    stroke={isSelected ? '#4f46e5' : '#0f172a'}
                    strokeWidth={isSelected ? '3.5' : '2.5'}
                  />

                  {/* Room Label & Area */}
                  <text
                    x={rx + rw / 2}
                    y={ry + rh / 2 - 8}
                    textAnchor="middle"
                    fill="#0f172a"
                    fontSize="12"
                    fontWeight="bold"
                    fontFamily="sans-serif"
                  >
                    {room.name}
                  </text>
                  <text
                    x={rx + rw / 2}
                    y={ry + rh / 2 + 10}
                    textAnchor="middle"
                    fill="#64748b"
                    fontSize="10"
                    fontFamily="monospace"
                  >
                    {room.width}m × {room.depth}m ({area} m²)
                  </text>

                  {/* Dimension Lines along Top & Left */}
                  <line
                    x1={rx}
                    y1={ry - 6}
                    x2={rx + rw}
                    y2={ry - 6}
                    stroke="#94a3b8"
                    strokeWidth="1"
                  />
                  <text
                    x={rx + rw / 2}
                    y={ry - 10}
                    textAnchor="middle"
                    fill="#64748b"
                    fontSize="9"
                    fontFamily="monospace"
                  >
                    {room.width.toFixed(1)}m
                  </text>

                  {/* Window architectural cuts */}
                  {roomWindows.map((win) => {
                    const winW = win.width * scale;
                    const winOffset = (win.offset || 0.5) * scale;
                    let lineX1 = 0, lineY1 = 0, lineX2 = 0, lineY2 = 0;

                    if (win.wall === 'north') {
                      lineX1 = rx + winOffset; lineY1 = ry; lineX2 = rx + winOffset + winW; lineY2 = ry;
                    } else if (win.wall === 'south') {
                      lineX1 = rx + winOffset; lineY1 = ry + rh; lineX2 = rx + winOffset + winW; lineY2 = ry + rh;
                    } else if (win.wall === 'west') {
                      lineX1 = rx; lineY1 = ry + winOffset; lineX2 = rx; lineY2 = ry + winOffset + winW;
                    } else if (win.wall === 'east') {
                      lineX1 = rx + rw; lineY1 = ry + winOffset; lineX2 = rx + rw; lineY2 = ry + winOffset + winW;
                    }

                    return (
                      <g key={win.id}>
                        <line x1={lineX1} y1={lineY1} x2={lineX2} y2={lineY2} stroke="#ffffff" strokeWidth="4" />
                        <line x1={lineX1} y1={lineY1} x2={lineX2} y2={lineY2} stroke="#0284c7" strokeWidth="2.5" />
                      </g>
                    );
                  })}

                  {/* Door architectural arc and swing */}
                  {roomDoors.map((door) => {
                    const doorW = door.width * scale;
                    const doorOffset = (door.offset || 0.5) * scale;

                    if (door.wall === 'north') {
                      const dx = rx + doorOffset;
                      const dy = ry;
                      return (
                        <g key={door.id}>
                          <line x1={dx} y1={dy} x2={dx + doorW} y2={dy} stroke="#ffffff" strokeWidth="4" />
                          <line x1={dx} y1={dy} x2={dx + doorW} y2={dy} stroke="#78350f" strokeWidth="2" />
                          <path
                            d={`M ${dx} ${dy + doorW} A ${doorW} ${doorW} 0 0 0 ${dx + doorW} ${dy}`}
                            fill="none"
                            stroke="#78350f"
                            strokeWidth="1.2"
                            strokeDasharray="3 3"
                          />
                        </g>
                      );
                    } else if (door.wall === 'south') {
                      const dx = rx + doorOffset;
                      const dy = ry + rh;
                      return (
                        <g key={door.id}>
                          <line x1={dx} y1={dy} x2={dx + doorW} y2={dy} stroke="#ffffff" strokeWidth="4" />
                          <line x1={dx} y1={dy} x2={dx + doorW} y2={dy} stroke="#78350f" strokeWidth="2" />
                          <path
                            d={`M ${dx} ${dy - doorW} A ${doorW} ${doorW} 0 0 1 ${dx + doorW} ${dy}`}
                            fill="none"
                            stroke="#78350f"
                            strokeWidth="1.2"
                            strokeDasharray="3 3"
                          />
                        </g>
                      );
                    }
                    return null;
                  })}
                </g>
              );
            })}

            {/* Furniture Layer (Rendered on top of floor slabs) */}
            {floorFurniture.map((f) => renderFurnitureItem(f))}

            {/* Compass Rose Arrow */}
            <g transform={`translate(${svgWidth - 65}, 65)`}>
              <circle cx="0" cy="0" r="24" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.5" />
              <polygon points="0,-18 6,2 0,-2" fill="#ef4444" />
              <polygon points="0,-18 -6,2 0,-2" fill="#991b1b" />
              <polygon points="0,18 6,-2 0,2" fill="#64748b" />
              <polygon points="0,18 -6,-2 0,2" fill="#334155" />
              <text x="0" y="-22" textAnchor="middle" fill="#ef4444" fontSize="10" fontWeight="bold">
                N
              </text>
            </g>

            {/* Architectural Title Block */}
            <g transform={`translate(30, ${svgHeight - 65})`}>
              <rect width="280" height="50" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.2" rx="4" />
              <text x="12" y="18" fill="#0f172a" fontSize="12" fontWeight="bold" fontFamily="sans-serif">
                {spec.title}
              </text>
              <text x="12" y="32" fill="#64748b" fontSize="9" fontFamily="monospace">
                LEVEL: {spec.floors.find((f) => f.level === activeFloor)?.name.toUpperCase()} (EL. +{spec.floors.find((f) => f.level === activeFloor)?.elevation.toFixed(1)}m)
              </text>
              <text x="12" y="44" fill="#94a3b8" fontSize="8" fontFamily="monospace">
                SCALE: 1:100 @ A3 | DATE: {new Date().toLocaleDateString()}
              </text>
            </g>
          </svg>
        </div>
      </div>
    </div>
  );
};
