import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { OBJExporter } from 'three/examples/jsm/exporters/OBJExporter.js';
import { HouseSpec, RoomSpec, FurnitureItem } from '../../types/house';
import { getProceduralTexture, TextureType } from '../../lib/textureGenerator';
import { TargetSurface } from '../../lib/materialsCatalog';
import {
  Maximize2,
  Minimize2,
  Camera,
  Sun,
  Moon,
  Sunset,
  Eye,
  Layers,
  Download,
  Info,
  Check,
  Palette,
  RotateCcw,
  Sparkles,
  Ruler,
} from 'lucide-react';

// Helper to create sharp architectural billboard text sprites for dimension tags
function createTextSprite(
  label: string,
  sublabel?: string,
  variant: 'wall' | 'window' | 'door' | 'room' = 'wall',
  scaleWidth = 1.5,
  scaleHeight = 0.5
): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 160;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.Sprite();

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const radius = 24;
  const pad = 10;
  const w = canvas.width - pad * 2;
  const h = canvas.height - pad * 2;

  // Background and border style based on dimension type
  let bg = 'rgba(15, 23, 42, 0.92)';
  let border = '#64748b';
  let titleColor = '#ffffff';
  let subColor = '#94a3b8';
  let iconText = '';

  if (variant === 'window') {
    bg = 'rgba(8, 47, 73, 0.94)';
    border = '#0284c7';
    titleColor = '#e0f2fe';
    subColor = '#38bdf8';
    iconText = '◫ ';
  } else if (variant === 'door') {
    bg = 'rgba(69, 26, 3, 0.94)';
    border = '#d97706';
    titleColor = '#fef3c7';
    subColor = '#f59e0b';
    iconText = '🚪 ';
  } else if (variant === 'room') {
    bg = 'rgba(30, 27, 75, 0.92)';
    border = '#818cf8';
    titleColor = '#ffffff';
    subColor = '#c7d2fe';
    iconText = '◈ ';
  } else {
    // wall
    bg = 'rgba(15, 23, 42, 0.92)';
    border = '#94a3b8';
    titleColor = '#ffffff';
    subColor = '#cbd5e1';
    iconText = '↔ ';
  }

  // Draw pill shape
  ctx.save();
  ctx.fillStyle = bg;
  ctx.strokeStyle = border;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(pad, pad, w, h, radius);
  ctx.fill();
  ctx.stroke();

  // Draw text
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  if (sublabel) {
    ctx.font = 'bold 38px "Plus Jakarta Sans", system-ui, sans-serif';
    ctx.fillStyle = titleColor;
    ctx.fillText(`${iconText}${label}`, canvas.width / 2, pad + h * 0.38);

    ctx.font = '600 22px monospace';
    ctx.fillStyle = subColor;
    ctx.fillText(sublabel, canvas.width / 2, pad + h * 0.74);
  } else {
    ctx.font = 'bold 46px monospace';
    ctx.fillStyle = titleColor;
    ctx.fillText(`${iconText}${label}`, canvas.width / 2, canvas.height / 2);
  }
  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
    depthWrite: false,
  });

  const sprite = new THREE.Sprite(material);
  sprite.scale.set(scaleWidth, scaleHeight, 1);
  sprite.renderOrder = 999;
  return sprite;
}

// Helper to construct architectural dimension lines with end ticks
function createDimensionLine(
  p1: THREE.Vector3,
  p2: THREE.Vector3,
  tickLength = 0.22,
  color = 0x38bdf8
): THREE.LineSegments {
  const dir = new THREE.Vector3().subVectors(p2, p1).normalize();
  let perp = new THREE.Vector3(-dir.z, 0, dir.x).normalize();
  if (perp.lengthSq() < 0.01) {
    perp = new THREE.Vector3(0, 1, 0);
  }

  const p1TickA = p1.clone().addScaledVector(perp, tickLength);
  const p1TickB = p1.clone().addScaledVector(perp, -tickLength);
  const p2TickA = p2.clone().addScaledVector(perp, tickLength);
  const p2TickB = p2.clone().addScaledVector(perp, -tickLength);

  const points = [p1, p2, p1TickA, p1TickB, p2TickA, p2TickB];

  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity: 0.85,
    depthTest: false,
    depthWrite: false,
  });

  const lineSegments = new THREE.LineSegments(geometry, material);
  lineSegments.renderOrder = 998;
  return lineSegments;
}

// Procedural 3D Furniture Builder
function build3DFurniture(item: FurnitureItem, floorElevation: number): THREE.Group {
  const group = new THREE.Group();
  group.position.set(item.x, floorElevation, item.z);
  group.rotation.y = (item.rotation * Math.PI) / 180;

  const mainColor = item.color || '#475569';
  const fabricMat = new THREE.MeshStandardMaterial({ color: mainColor, roughness: 0.85, metalness: 0.05 });
  const woodMat = new THREE.MeshStandardMaterial({ color: '#854d0e', roughness: 0.65, metalness: 0.05 });
  const darkWoodMat = new THREE.MeshStandardMaterial({ color: '#292524', roughness: 0.7, metalness: 0.02 });
  const metalMat = new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.3, metalness: 0.8 });
  const marbleMat = new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.2, metalness: 0.05 });
  const whiteMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.4 });
  const accentMat = new THREE.MeshStandardMaterial({ color: '#c2410c', roughness: 0.8 });

  const w = item.width;
  const d = item.depth;
  const h = item.height;

  switch (item.type) {
    case 'sofa_3seater':
    case 'armchair': {
      // Seat cushion
      const seat = new THREE.Mesh(new THREE.BoxGeometry(w - 0.24, 0.24, d - 0.2), fabricMat);
      seat.position.y = 0.24;
      seat.castShadow = true;
      seat.receiveShadow = true;

      // Backrest
      const back = new THREE.Mesh(new THREE.BoxGeometry(w, 0.46, 0.22), fabricMat);
      back.position.set(0, 0.52, -d / 2 + 0.11);
      back.castShadow = true;
      back.receiveShadow = true;

      // Armrests
      const leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.36, d), fabricMat);
      leftArm.position.set(-w / 2 + 0.08, 0.4, 0);
      const rightArm = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.36, d), fabricMat);
      rightArm.position.set(w / 2 - 0.08, 0.4, 0);
      leftArm.castShadow = true;
      rightArm.castShadow = true;

      // Legs
      const legGeo = new THREE.CylinderGeometry(0.025, 0.02, 0.14, 8);
      const legPositions = [
        [-w / 2 + 0.1, 0.07, -d / 2 + 0.1],
        [w / 2 - 0.1, 0.07, -d / 2 + 0.1],
        [-w / 2 + 0.1, 0.07, d / 2 - 0.1],
        [w / 2 - 0.1, 0.07, d / 2 - 0.1],
      ];
      legPositions.forEach(([lx, ly, lz]) => {
        const leg = new THREE.Mesh(legGeo, darkWoodMat);
        leg.position.set(lx, ly, lz);
        group.add(leg);
      });

      // Accent Pillows
      if (item.type === 'sofa_3seater') {
        const p1 = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.32, 0.12), accentMat);
        p1.position.set(-w / 2 + 0.3, 0.45, -d / 2 + 0.22);
        p1.rotation.y = 0.25;
        const p2 = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.32, 0.12), accentMat);
        p2.position.set(w / 2 - 0.3, 0.45, -d / 2 + 0.22);
        p2.rotation.y = -0.25;
        group.add(p1, p2);
      }

      group.add(seat, back, leftArm, rightArm);
      break;
    }

    case 'sofa_sectional': {
      // Main 3-seat section
      const mainW = w * 0.65;
      const seat = new THREE.Mesh(new THREE.BoxGeometry(mainW, 0.24, d * 0.48), fabricMat);
      seat.position.set(-w / 2 + mainW / 2, 0.24, -d / 2 + (d * 0.48) / 2);
      seat.castShadow = true;

      // Chaise extension
      const chaiseW = w - mainW;
      const chaise = new THREE.Mesh(new THREE.BoxGeometry(chaiseW, 0.24, d), fabricMat);
      chaise.position.set(w / 2 - chaiseW / 2, 0.24, 0);
      chaise.castShadow = true;

      // Backrest
      const back = new THREE.Mesh(new THREE.BoxGeometry(w, 0.46, 0.22), fabricMat);
      back.position.set(0, 0.52, -d / 2 + 0.11);
      back.castShadow = true;

      // Side arm
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.36, d * 0.48), fabricMat);
      arm.position.set(-w / 2 + 0.09, 0.4, -d / 2 + (d * 0.48) / 2);

      group.add(seat, chaise, back, arm);
      break;
    }

    case 'bed_king':
    case 'bed_queen': {
      // Base platform frame
      const frame = new THREE.Mesh(new THREE.BoxGeometry(w, 0.2, d), woodMat);
      frame.position.y = 0.12;
      frame.castShadow = true;

      // Mattress
      const mattress = new THREE.Mesh(new THREE.BoxGeometry(w - 0.08, 0.26, d - 0.12), whiteMat);
      mattress.position.set(0, 0.34, 0.04);
      mattress.castShadow = true;

      // Quilt / Duvet
      const quilt = new THREE.Mesh(new THREE.BoxGeometry(w - 0.06, 0.07, d * 0.65), fabricMat);
      quilt.position.set(0, 0.49, d * 0.15);
      quilt.castShadow = true;

      // Headboard
      const headboard = new THREE.Mesh(new THREE.BoxGeometry(w + 0.1, 0.85, 0.16), woodMat);
      headboard.position.set(0, 0.55, -d / 2 + 0.08);
      headboard.castShadow = true;

      // Dual Pillows
      const pillowW = (w - 0.3) / 2;
      const pillowGeo = new THREE.BoxGeometry(pillowW, 0.12, 0.42);
      const pillow1 = new THREE.Mesh(pillowGeo, whiteMat);
      pillow1.position.set(-pillowW / 2 - 0.05, 0.51, -d / 2 + 0.36);
      pillow1.rotation.x = 0.2;
      const pillow2 = new THREE.Mesh(pillowGeo, whiteMat);
      pillow2.position.set(pillowW / 2 + 0.05, 0.51, -d / 2 + 0.36);
      pillow2.rotation.x = 0.2;

      group.add(frame, mattress, quilt, headboard, pillow1, pillow2);
      break;
    }

    case 'dining_table':
    case 'bistro_table': {
      const isRound = item.type === 'bistro_table';
      const topGeo = isRound
        ? new THREE.CylinderGeometry(w / 2, w / 2, 0.05, 24)
        : new THREE.BoxGeometry(w, 0.06, d);
      const topMat = isRound ? marbleMat : woodMat;
      const top = new THREE.Mesh(topGeo, topMat);
      top.position.y = 0.74;
      top.castShadow = true;
      group.add(top);

      if (isRound) {
        const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.72, 16), metalMat);
        ped.position.y = 0.36;
        const base = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.03, 24), metalMat);
        base.position.y = 0.015;
        group.add(ped, base);
      } else {
        const legGeo = new THREE.BoxGeometry(0.07, 0.72, 0.07);
        const lX = w / 2 - 0.1;
        const lZ = d / 2 - 0.1;
        [
          [-lX, 0.36, -lZ],
          [lX, 0.36, -lZ],
          [-lX, 0.36, lZ],
          [lX, 0.36, lZ],
        ].forEach(([lx, ly, lz]) => {
          const leg = new THREE.Mesh(legGeo, woodMat);
          leg.position.set(lx, ly, lz);
          leg.castShadow = true;
          group.add(leg);
        });

        // 6 dining chairs
        const chairSeatGeo = new THREE.BoxGeometry(0.42, 0.05, 0.42);
        const chairBackGeo = new THREE.BoxGeometry(0.42, 0.38, 0.05);
        const chairPositions = [
          [-w / 3, d / 2 + 0.32, 0],
          [0, d / 2 + 0.32, 0],
          [w / 3, d / 2 + 0.32, 0],
          [-w / 3, -d / 2 - 0.32, Math.PI],
          [0, -d / 2 - 0.32, Math.PI],
          [w / 3, -d / 2 - 0.32, Math.PI],
        ];
        chairPositions.forEach(([cx, cz, crot]) => {
          const chair = new THREE.Group();
          chair.position.set(cx, 0, cz);
          chair.rotation.y = crot;
          const seat = new THREE.Mesh(chairSeatGeo, fabricMat);
          seat.position.y = 0.45;
          const back = new THREE.Mesh(chairBackGeo, woodMat);
          back.position.set(0, 0.65, 0.18);
          chair.add(seat, back);
          group.add(chair);
        });
      }
      break;
    }

    case 'coffee_table': {
      const top = new THREE.Mesh(new THREE.BoxGeometry(w, 0.04, d), woodMat);
      top.position.y = 0.42;
      top.castShadow = true;
      const legGeo = new THREE.CylinderGeometry(0.02, 0.015, 0.4, 8);
      const lX = w / 2 - 0.08;
      const lZ = d / 2 - 0.08;
      [
        [-lX, 0.2, -lZ],
        [lX, 0.2, -lZ],
        [-lX, 0.2, lZ],
        [lX, 0.2, lZ],
      ].forEach(([lx, ly, lz]) => {
        const leg = new THREE.Mesh(legGeo, metalMat);
        leg.position.set(lx, ly, lz);
        group.add(leg);
      });
      group.add(top);
      break;
    }

    case 'kitchen_island': {
      const base = new THREE.Mesh(new THREE.BoxGeometry(w - 0.12, 0.86, d - 0.28), darkWoodMat);
      base.position.set(0, 0.43, -0.1);
      base.castShadow = true;

      const top = new THREE.Mesh(new THREE.BoxGeometry(w, 0.06, d), marbleMat);
      top.position.y = 0.89;
      top.castShadow = true;

      const stoolGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.04, 16);
      [-w / 3, 0, w / 3].forEach((sx) => {
        const stool = new THREE.Mesh(stoolGeo, fabricMat);
        stool.position.set(sx, 0.65, d / 2 - 0.1);
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.62, 8), metalMat);
        pole.position.set(sx, 0.31, d / 2 - 0.1);
        group.add(stool, pole);
      });

      group.add(base, top);
      break;
    }

    case 'office_desk': {
      const deskTop = new THREE.Mesh(new THREE.BoxGeometry(w, 0.05, d), woodMat);
      deskTop.position.y = 0.74;
      deskTop.castShadow = true;

      const pedestal = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.7, d - 0.1), darkWoodMat);
      pedestal.position.set(w / 2 - 0.25, 0.36, 0);

      const legL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.72, d - 0.1), metalMat);
      legL.position.set(-w / 2 + 0.1, 0.36, 0);

      const laptopBase = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.015, 0.22), metalMat);
      laptopBase.position.set(-0.1, 0.77, 0);
      const laptopScreen = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.2, 0.015), metalMat);
      laptopScreen.position.set(-0.1, 0.87, -0.1);
      laptopScreen.rotation.x = 0.2;

      const chairSeat = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.08, 0.45), fabricMat);
      chairSeat.position.set(0, 0.48, d / 2 + 0.32);
      const chairBack = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.45, 0.06), fabricMat);
      chairBack.position.set(0, 0.74, d / 2 + 0.52);

      group.add(deskTop, pedestal, legL, laptopBase, laptopScreen, chairSeat, chairBack);
      break;
    }

    case 'bathtub': {
      const tub = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), whiteMat);
      tub.position.y = h / 2;
      tub.castShadow = true;

      const innerWater = new THREE.Mesh(
        new THREE.BoxGeometry(w - 0.2, 0.02, d - 0.2),
        new THREE.MeshPhysicalMaterial({ color: '#7dd3fc', transparent: true, opacity: 0.8 })
      );
      innerWater.position.y = h - 0.08;

      const tap = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.8, 8), metalMat);
      tap.position.set(-w / 2 - 0.08, 0.4, 0);

      group.add(tub, innerWater, tap);
      break;
    }

    case 'wardrobe':
    case 'bookshelf':
    case 'tv_unit':
    default: {
      const cabinet = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), darkWoodMat);
      cabinet.position.y = h / 2;
      cabinet.castShadow = true;
      group.add(cabinet);
      break;
    }
  }

  return group;
}

interface HouseViewerProps {
  spec: HouseSpec;
  selectedRoomId?: string | null;
  selectedFurnitureId?: string | null;
  activeSurface?: TargetSurface;
  onSelectSurface?: (surface: TargetSurface) => void;
  onSelectRoom?: (room: RoomSpec | null) => void;
  onSelectFurniture?: (item: FurnitureItem | null) => void;
  onUpdateSpec?: (updated: HouseSpec) => void;
  onOpenMaterials?: () => void;
}

export const HouseViewer: React.FC<HouseViewerProps> = ({
  spec,
  selectedRoomId,
  activeSurface,
  onSelectSurface,
  onSelectRoom,
  onUpdateSpec,
  onOpenMaterials,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Viewer state
  const [showRoof, setShowRoof] = useState(true);
  const [showDimensions, setShowDimensions] = useState(true);
  const [dimensionFilter, setDimensionFilter] = useState<'all' | 'walls' | 'openings'>('all');
  const [activeFloorFilter, setActiveFloorFilter] = useState<'all' | number>('all');
  const [lightingMode, setLightingMode] = useState<'day' | 'sunset' | 'night'>('day');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hoveredRoom, setHoveredRoom] = useState<RoomSpec | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<RoomSpec | null>(null);
  const [showMaterialDrawer, setShowMaterialDrawer] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Three.js internal references
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const houseGroupRef = useRef<THREE.Group | null>(null);
  const roofGroupRef = useRef<THREE.Group | null>(null);
  const roomHitboxesRef = useRef<{ mesh: THREE.Mesh; room: RoomSpec }[]>([]);
  const dirLightRef = useRef<THREE.DirectionalLight | null>(null);
  const hemiLightRef = useRef<THREE.HemisphereLight | null>(null);
  const ambientLightRef = useRef<THREE.AmbientLight | null>(null);

  // Sync selected room from props
  useEffect(() => {
    if (selectedRoomId) {
      const match = spec.rooms.find((r) => r.id === selectedRoomId);
      setSelectedRoom(match || null);
    } else {
      setSelectedRoom(null);
    }
  }, [selectedRoomId, spec]);

  // Handle Fullscreen toggle
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Setup Three.js scene once
  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const width = canvas.clientWidth || 800;
    const height = canvas.clientHeight || 550;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color('#e2e8f0');
    scene.fog = new THREE.FogExp2(new THREE.Color('#e2e8f0'), 0.015);

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 300);
    camera.position.set(22, 18, 26);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      preserveDrawingBuffer: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    rendererRef.current = renderer;

    // 4. Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.maxPolarAngle = Math.PI / 2 - 0.02; // Don't go below ground
    controls.minDistance = 5;
    controls.maxDistance = 85;
    controls.target.set(0, 2, 0);
    controlsRef.current = controls;

    // 5. Lights
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.7);
    hemiLight.position.set(0, 50, 0);
    scene.add(hemiLight);
    hemiLightRef.current = hemiLight;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);
    ambientLightRef.current = ambientLight;

    const dirLight = new THREE.DirectionalLight(0xfff5e6, 1.4);
    dirLight.position.set(25, 40, 20);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 120;
    const d = 26;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    dirLight.shadow.bias = -0.0005;
    scene.add(dirLight);
    dirLightRef.current = dirLight;

    // Main house group
    const houseGroup = new THREE.Group();
    scene.add(houseGroup);
    houseGroupRef.current = houseGroup;

    // Animation loop
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Resize observer
    const handleResize = () => {
      if (!canvasRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = canvasRef.current.clientWidth;
      const h = canvasRef.current.clientHeight;
      if (w === 0 || h === 0) return;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(canvas);

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      controls.dispose();
      renderer.dispose();
    };
  }, []);

  // Update lighting mode (Day / Sunset / Night)
  useEffect(() => {
    if (!sceneRef.current || !dirLightRef.current || !hemiLightRef.current || !ambientLightRef.current) return;
    const scene = sceneRef.current;
    const dir = dirLightRef.current;
    const hemi = hemiLightRef.current;
    const amb = ambientLightRef.current;

    if (lightingMode === 'day') {
      scene.background = new THREE.Color('#f0f4f8');
      scene.fog = new THREE.FogExp2(new THREE.Color('#f0f4f8'), 0.012);
      dir.color = new THREE.Color('#fff9eb');
      dir.intensity = 1.35;
      dir.position.set(25, 40, 20);
      hemi.color = new THREE.Color('#ffffff');
      hemi.groundColor = new THREE.Color('#64748b');
      hemi.intensity = 0.65;
      amb.intensity = 0.35;
    } else if (lightingMode === 'sunset') {
      scene.background = new THREE.Color('#fed7aa');
      scene.fog = new THREE.FogExp2(new THREE.Color('#fed7aa'), 0.015);
      dir.color = new THREE.Color('#ff8c42');
      dir.intensity = 1.8;
      dir.position.set(40, 14, 25);
      hemi.color = new THREE.Color('#ffedd5');
      hemi.groundColor = new THREE.Color('#78350f');
      hemi.intensity = 0.55;
      amb.intensity = 0.4;
    } else if (lightingMode === 'night') {
      scene.background = new THREE.Color('#0b0f19');
      scene.fog = new THREE.FogExp2(new THREE.Color('#0b0f19'), 0.02);
      dir.color = new THREE.Color('#7dd3fc');
      dir.intensity = 0.35;
      dir.position.set(15, 30, -15);
      hemi.color = new THREE.Color('#1e293b');
      hemi.groundColor = new THREE.Color('#020617');
      hemi.intensity = 0.25;
      amb.intensity = 0.15;
    }
  }, [lightingMode]);

  // Build the 3D procedural house from spec
  useEffect(() => {
    if (!houseGroupRef.current || !sceneRef.current) return;
    const group = houseGroupRef.current;

    // Clear previous models
    while (group.children.length > 0) {
      const obj = group.children[0];
      group.remove(obj);
      if ((obj as THREE.Mesh).geometry) (obj as THREE.Mesh).geometry.dispose();
    }
    roomHitboxesRef.current = [];

    const roofGroup = new THREE.Group();
    roofGroupRef.current = roofGroup;

    const materials = spec.materials;
    const extMats = (spec.materials as Record<string, unknown>) || {};
    const facadePrimaryTexture = extMats.facadePrimaryTexture as TextureType | undefined;
    const facadeSecondaryTexture = extMats.facadeSecondaryTexture as TextureType | undefined;
    const roofTexture = (extMats.roofTexture || (spec.roof as Record<string, unknown>).textureType) as TextureType | undefined;
    const patioTexture = extMats.patioTexture as TextureType | undefined;
    const floorTexture = extMats.floorTexture as TextureType | undefined;

    const facadeMat = new THREE.MeshStandardMaterial({
      color: materials.facadePrimary.color || '#d1d5db',
      roughness: materials.facadePrimary.roughness ?? 0.7,
      metalness: materials.facadePrimary.metalness ?? 0.05,
      map: facadePrimaryTexture
        ? getProceduralTexture(facadePrimaryTexture)
        : materials.facadePrimary.name.toLowerCase().includes('cedar') || materials.facadePrimary.name.toLowerCase().includes('wood')
        ? getProceduralTexture('wood_cedar')
        : undefined,
    });

    const facadeSecMat = new THREE.MeshStandardMaterial({
      color: materials.facadeSecondary.color || '#f3f4f6',
      roughness: materials.facadeSecondary.roughness ?? 0.8,
      metalness: materials.facadeSecondary.metalness ?? 0.02,
      map: facadeSecondaryTexture
        ? getProceduralTexture(facadeSecondaryTexture)
        : materials.facadeSecondary.name.toLowerCase().includes('concrete')
        ? getProceduralTexture('concrete_raw')
        : undefined,
    });

    const windowGlassMat = new THREE.MeshPhysicalMaterial({
      color: '#a5f3fc',
      transparent: true,
      opacity: 0.45,
      roughness: 0.1,
      metalness: 0.1,
      transmission: 0.6,
      ior: 1.5,
      reflectivity: 0.8,
    });

    const frameMat = new THREE.MeshStandardMaterial({
      color: materials.windowFrame?.color || '#1e293b',
      roughness: 0.4,
      metalness: 0.6,
    });

    const poolWaterMat = new THREE.MeshPhysicalMaterial({
      color: '#38bdf8',
      transparent: true,
      opacity: 0.75,
      roughness: 0.1,
      metalness: 0.1,
      transmission: 0.7,
    });

    const groundMat = new THREE.MeshStandardMaterial({
      color: '#4ade80',
      roughness: 0.9,
    });

    const patioMat = new THREE.MeshStandardMaterial({
      color: (extMats.patioColor as string) || '#e2e8f0',
      roughness: 0.7,
      map: patioTexture ? getProceduralTexture(patioTexture) : getProceduralTexture('wood_teak'),
    });

    // 1. Build Plot / Terrain
    const plotW = spec.plot.width || 24;
    const plotD = spec.plot.depth || 30;

    const plotGeo = new THREE.BoxGeometry(plotW, 0.4, plotD);
    const plotMesh = new THREE.Mesh(plotGeo, groundMat);
    plotMesh.position.y = -0.2;
    plotMesh.receiveShadow = true;
    group.add(plotMesh);

    // Decorative fence surrounding plot
    if (spec.exterior?.hasFence) {
      const fenceH = 1.0;
      const fenceMat = new THREE.MeshStandardMaterial({ color: '#78716c', roughness: 0.8 });
      const fNorth = new THREE.Mesh(new THREE.BoxGeometry(plotW, fenceH, 0.15), fenceMat);
      fNorth.position.set(0, fenceH / 2, -plotD / 2);
      const fSouth = new THREE.Mesh(new THREE.BoxGeometry(plotW * 0.7, fenceH, 0.15), fenceMat);
      fSouth.position.set(-plotW * 0.15, fenceH / 2, plotD / 2); // leave gate entrance
      const fEast = new THREE.Mesh(new THREE.BoxGeometry(0.15, fenceH, plotD), fenceMat);
      fEast.position.set(plotW / 2, fenceH / 2, 0);
      const fWest = new THREE.Mesh(new THREE.BoxGeometry(0.15, fenceH, plotD), fenceMat);
      fWest.position.set(-plotW / 2, fenceH / 2, 0);
      group.add(fNorth, fSouth, fEast, fWest);
    }

    // Patio / Terrace
    if (spec.exterior?.patioDimensions) {
      const p = spec.exterior.patioDimensions;
      const pMesh = new THREE.Mesh(new THREE.BoxGeometry(p.width, 0.05, p.depth), patioMat);
      pMesh.position.set(p.x, 0.02, p.z);
      pMesh.receiveShadow = true;
      pMesh.userData = { surface: 'patio' };
      group.add(pMesh);
    }

    // Pool
    if (spec.exterior?.hasPool && spec.exterior.poolDimensions) {
      const p = spec.exterior.poolDimensions;
      const poolCoping = new THREE.Mesh(
        new THREE.BoxGeometry(p.width + 0.8, 0.1, p.depth + 0.8),
        new THREE.MeshStandardMaterial({ color: '#f1f5f9', roughness: 0.5 })
      );
      poolCoping.position.set(p.x, 0.05, p.z);
      poolCoping.receiveShadow = true;
      group.add(poolCoping);

      const water = new THREE.Mesh(new THREE.BoxGeometry(p.width, 0.2, p.depth), poolWaterMat);
      water.position.set(p.x, 0.06, p.z);
      group.add(water);

      // Pool lights for night mode
      const poolLight = new THREE.PointLight('#38bdf8', 1.5, 8);
      poolLight.position.set(p.x, 0.3, p.z);
      group.add(poolLight);
    }

    // Landscaped decorative trees / foliage
    if (spec.exterior?.hasGarden) {
      const treeMat = new THREE.MeshStandardMaterial({ color: '#166534', roughness: 0.8 });
      const trunkMat = new THREE.MeshStandardMaterial({ color: '#573d26', roughness: 0.9 });

      const treePositions = [
        { x: -plotW / 2 + 2.5, z: -plotD / 2 + 2.5, s: 1.2 },
        { x: -plotW / 2 + 3.0, z: plotD / 2 - 3.5, s: 1.0 },
        { x: plotW / 2 - 2.5, z: -plotD / 2 + 3.0, s: 1.1 },
        { x: plotW / 2 - 3.0, z: plotD / 2 - 3.0, s: 0.9 },
      ];

      treePositions.forEach((pos) => {
        const treeGroup = new THREE.Group();
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, 1.8, 8), trunkMat);
        trunk.position.y = 0.9;
        trunk.castShadow = true;
        const foliage = new THREE.Mesh(new THREE.ConeGeometry(1.4 * pos.s, 2.8 * pos.s, 8), treeMat);
        foliage.position.y = 2.4 * pos.s;
        foliage.castShadow = true;
        treeGroup.add(trunk, foliage);
        treeGroup.position.set(pos.x, 0, pos.z);
        group.add(treeGroup);
      });
    }

    // 2. Build Rooms, Walls, Floors, and Doors/Windows
    const wallThickness = 0.22;
    const floorHeightDefault = 3.0;

    spec.rooms.forEach((room) => {
      // Check floor filter cutaway
      if (activeFloorFilter !== 'all' && room.floor !== activeFloorFilter) {
        return;
      }

      const floorElevation = (spec.floors.find((f) => f.level === room.floor)?.elevation ?? room.floor * floorHeightDefault);
      const roomH = room.height || floorHeightDefault;
      const isSelected = selectedRoom?.id === room.id;
      const isHovered = hoveredRoom?.id === room.id;

      const roomGroup = new THREE.Group();
      roomGroup.position.set(room.x, floorElevation, room.z);

      // Floor slab for the room with texture mapping
      const roomExt = room as Record<string, unknown>;
      const roomTex = (roomExt.textureType || floorTexture) as TextureType | undefined;
      let floorMap: THREE.CanvasTexture | undefined;

      if (roomTex) {
        floorMap = getProceduralTexture(roomTex);
      } else if (room.floorMaterial === 'hardwood') {
        floorMap = getProceduralTexture('wood_oak');
      } else if (room.floorMaterial === 'tile') {
        floorMap = getProceduralTexture('tile_ceramic');
      } else if (room.floorMaterial === 'marble') {
        floorMap = getProceduralTexture('tile_marble');
      } else if (room.floorMaterial === 'polished_concrete') {
        floorMap = getProceduralTexture('concrete_polished');
      } else if (room.floorMaterial === 'decking') {
        floorMap = getProceduralTexture('wood_teak');
      }

      const floorMatColor = room.color || (room.floorMaterial === 'hardwood' ? '#d4a373' : room.floorMaterial === 'marble' ? '#f1f5f9' : '#e2e8f0');
      const floorGeo = new THREE.BoxGeometry(room.width, 0.15, room.depth);
      const floorMesh = new THREE.Mesh(
        floorGeo,
        new THREE.MeshStandardMaterial({
          color: floorMatColor,
          map: floorMap,
          roughness: 0.6,
          metalness: 0.05,
        })
      );
      floorMesh.position.y = 0.075;
      floorMesh.receiveShadow = true;
      floorMesh.userData = { surface: 'selectedRoomFloor', roomId: room.id };
      roomGroup.add(floorMesh);

      // Interior warm ceiling light for night mode
      const interiorLight = new THREE.PointLight('#fef08a', 0.8, 7);
      interiorLight.position.set(0, roomH - 0.3, 0);
      roomGroup.add(interiorLight);

      // Hitbox for raycasting and selection
      const hitboxGeo = new THREE.BoxGeometry(room.width - 0.2, roomH, room.depth - 0.2);
      const hitboxMat = new THREE.MeshBasicMaterial({
        color: isSelected ? '#38bdf8' : isHovered ? '#60a5fa' : '#ffffff',
        transparent: true,
        opacity: isSelected ? 0.3 : isHovered ? 0.15 : 0.001,
        depthWrite: false,
      });
      const hitbox = new THREE.Mesh(hitboxGeo, hitboxMat);
      hitbox.position.y = roomH / 2;
      roomGroup.add(hitbox);
      roomHitboxesRef.current.push({ mesh: hitbox, room });

      // Build 4 Perimeter Walls (North, South, East, West)
      // We check if this room has windows or doors on these walls
      const roomWindows = spec.windows.filter((w) => w.roomId === room.id);
      const roomDoors = spec.doors.filter((d) => d.roomId === room.id);

      const makeWall = (
        side: 'north' | 'south' | 'east' | 'west',
        length: number,
        wX: number,
        wZ: number,
        isRotated: boolean
      ) => {
        const wallMat = room.wallMaterial === 'warm_wood' ? facadeMat : facadeSecMat;
        const win = roomWindows.find((w) => w.wall === side);
        const door = roomDoors.find((d) => d.wall === side);

        const wGroup = new THREE.Group();
        wGroup.position.set(wX, 0, wZ);
        if (isRotated) wGroup.rotation.y = Math.PI / 2;

        if (win) {
          // Wall with window opening: left segment, right segment, bottom sill, top lintel
          const winW = Math.min(win.width, length - 0.4);
          const winH = Math.min(win.height, roomH - 0.5);
          const winOffset = Math.max(0.2, Math.min(length - winW - 0.2, win.offset || (length - winW) / 2));
          const sillH = win.elevation || 0.6;
          const lintelH = roomH - (sillH + winH);

          // Left wall chunk
          if (winOffset > 0.05) {
            const leftMesh = new THREE.Mesh(new THREE.BoxGeometry(winOffset, roomH, wallThickness), wallMat);
            leftMesh.position.set(-length / 2 + winOffset / 2, roomH / 2, 0);
            leftMesh.castShadow = true;
            leftMesh.receiveShadow = true;
            wGroup.add(leftMesh);
          }

          // Right wall chunk
          const rightW = length - (winOffset + winW);
          if (rightW > 0.05) {
            const rightMesh = new THREE.Mesh(new THREE.BoxGeometry(rightW, roomH, wallThickness), wallMat);
            rightMesh.position.set(length / 2 - rightW / 2, roomH / 2, 0);
            rightMesh.castShadow = true;
            rightMesh.receiveShadow = true;
            wGroup.add(rightMesh);
          }

          // Bottom sill
          if (sillH > 0.05) {
            const bottomMesh = new THREE.Mesh(new THREE.BoxGeometry(winW, sillH, wallThickness), wallMat);
            bottomMesh.position.set(-length / 2 + winOffset + winW / 2, sillH / 2, 0);
            bottomMesh.castShadow = true;
            bottomMesh.receiveShadow = true;
            wGroup.add(bottomMesh);
          }

          // Top lintel
          if (lintelH > 0.05) {
            const topMesh = new THREE.Mesh(new THREE.BoxGeometry(winW, lintelH, wallThickness), wallMat);
            topMesh.position.set(-length / 2 + winOffset + winW / 2, roomH - lintelH / 2, 0);
            topMesh.castShadow = true;
            topMesh.receiveShadow = true;
            wGroup.add(topMesh);
          }

          // Glass pane
          const glass = new THREE.Mesh(new THREE.BoxGeometry(winW, winH, 0.06), windowGlassMat);
          glass.position.set(-length / 2 + winOffset + winW / 2, sillH + winH / 2, 0);
          wGroup.add(glass);

          // Window frame outline
          const frameOutline = new THREE.Mesh(new THREE.BoxGeometry(winW + 0.06, winH + 0.06, 0.12), frameMat);
          frameOutline.position.set(-length / 2 + winOffset + winW / 2, sillH + winH / 2, 0);
          frameOutline.castShadow = true;
          // Thin frame cutout
          wGroup.add(frameOutline);
        } else if (door) {
          // Wall with door opening
          const doorW = Math.min(door.width, length - 0.4);
          const doorH = Math.min(door.height, roomH - 0.2);
          const doorOffset = Math.max(0.2, Math.min(length - doorW - 0.2, door.offset || (length - doorW) / 2));
          const lintelH = roomH - doorH;

          // Left chunk
          if (doorOffset > 0.05) {
            const leftMesh = new THREE.Mesh(new THREE.BoxGeometry(doorOffset, roomH, wallThickness), wallMat);
            leftMesh.position.set(-length / 2 + doorOffset / 2, roomH / 2, 0);
            leftMesh.castShadow = true;
            leftMesh.receiveShadow = true;
            wGroup.add(leftMesh);
          }

          // Right chunk
          const rightW = length - (doorOffset + doorW);
          if (rightW > 0.05) {
            const rightMesh = new THREE.Mesh(new THREE.BoxGeometry(rightW, roomH, wallThickness), wallMat);
            rightMesh.position.set(length / 2 - rightW / 2, roomH / 2, 0);
            rightMesh.castShadow = true;
            rightMesh.receiveShadow = true;
            wGroup.add(rightMesh);
          }

          // Lintel above door
          if (lintelH > 0.05) {
            const topMesh = new THREE.Mesh(new THREE.BoxGeometry(doorW, lintelH, wallThickness), wallMat);
            topMesh.position.set(-length / 2 + doorOffset + doorW / 2, roomH - lintelH / 2, 0);
            topMesh.castShadow = true;
            topMesh.receiveShadow = true;
            wGroup.add(topMesh);
          }

          // Door panel
          const doorMat =
            door.type === 'sliding_glass'
              ? windowGlassMat
              : door.type === 'garage_door'
              ? new THREE.MeshStandardMaterial({ color: '#475569', roughness: 0.5, metalness: 0.3 })
              : new THREE.MeshStandardMaterial({ color: '#78350f', roughness: 0.7 });

          const doorMesh = new THREE.Mesh(new THREE.BoxGeometry(doorW, doorH, 0.08), doorMat);
          doorMesh.position.set(-length / 2 + doorOffset + doorW / 2, doorH / 2, 0);
          doorMesh.castShadow = true;
          wGroup.add(doorMesh);
        } else {
          // Solid wall
          const solid = new THREE.Mesh(new THREE.BoxGeometry(length, roomH, wallThickness), wallMat);
          solid.position.set(0, roomH / 2, 0);
          solid.castShadow = true;
          solid.receiveShadow = true;
          wGroup.add(solid);
        }

        const wallSurface: TargetSurface = room.wallMaterial === 'warm_wood' ? 'facadePrimary' : 'facadeSecondary';
        wGroup.traverse((child) => {
          child.userData = { surface: wallSurface, roomId: room.id };
        });
        roomGroup.add(wGroup);
      };

      // North wall (Z = -depth/2)
      makeWall('north', room.width, 0, -room.depth / 2, false);
      // South wall (Z = depth/2)
      makeWall('south', room.width, 0, room.depth / 2, false);
      // West wall (X = -width/2)
      makeWall('west', room.depth, -room.width / 2, 0, true);
      // East wall (X = width/2)
      makeWall('east', room.depth, room.width / 2, 0, true);

      // Balcony glass railing if balcony
      if (room.type === 'balcony') {
        const railMat = new THREE.MeshPhysicalMaterial({
          color: '#cbd5e1',
          transparent: true,
          opacity: 0.5,
          roughness: 0.1,
          metalness: 0.2,
        });
        const rail = new THREE.Mesh(new THREE.BoxGeometry(room.width, 1.0, 0.06), railMat);
        rail.position.set(0, 0.5, room.depth / 2);
        roomGroup.add(rail);
      }

      group.add(roomGroup);
    });

    // 2.5 Build Furniture Items in 3D
    if (spec.furniture && spec.furniture.length > 0) {
      const furnGroup = new THREE.Group();
      spec.furniture.forEach((item) => {
        if (activeFloorFilter !== 'all' && item.floor !== activeFloorFilter) return;

        const floorElevation = (spec.floors.find((f) => f.level === item.floor)?.elevation ?? item.floor * floorHeightDefault);
        const itemMesh = build3DFurniture(item, floorElevation);
        furnGroup.add(itemMesh);
      });
      group.add(furnGroup);
    }

    // 3. Build Roof (if active and not filtered to floor 0 only)
    if (showRoof && (activeFloorFilter === 'all' || activeFloorFilter === spec.floors.length - 1)) {
      const topFloor = Math.max(...spec.rooms.map((r) => r.floor), 0);
      const topElevation = (spec.floors.find((f) => f.level === topFloor)?.elevation ?? topFloor * floorHeightDefault) + floorHeightDefault;

      // Find bounding box of top floor
      const topRooms = spec.rooms.filter((r) => r.floor === topFloor);
      if (topRooms.length > 0) {
        const minX = Math.min(...topRooms.map((r) => r.x - r.width / 2));
        const maxX = Math.max(...topRooms.map((r) => r.x + r.width / 2));
        const minZ = Math.min(...topRooms.map((r) => r.z - r.depth / 2));
        const maxZ = Math.max(...topRooms.map((r) => r.z + r.depth / 2));

        const roofW = maxX - minX + (spec.roof.overhang || 0.6) * 2;
        const roofD = maxZ - minZ + (spec.roof.overhang || 0.6) * 2;
        const centerX = (minX + maxX) / 2;
        const centerZ = (minZ + maxZ) / 2;

        const roofColor = spec.roof.color || materials.roofColor || '#334155';
        const roofMat = new THREE.MeshStandardMaterial({
          color: roofColor,
          roughness: 0.65,
          metalness: 0.1,
          map: roofTexture
            ? getProceduralTexture(roofTexture)
            : spec.roof.material === 'dark_slate'
            ? getProceduralTexture('tile_slate')
            : spec.roof.material === 'terracotta'
            ? getProceduralTexture('brick_terracotta')
            : undefined,
        });

        if (spec.roof.type === 'sloped_gable') {
          // Gable roof prism
          const pitchRad = ((spec.roof.pitch || 25) * Math.PI) / 180;
          const peakH = (roofW / 2) * Math.tan(pitchRad);

          const shape = new THREE.Shape();
          shape.moveTo(-roofW / 2, 0);
          shape.lineTo(0, peakH);
          shape.lineTo(roofW / 2, 0);
          shape.closePath();

          const extrudeSettings = { depth: roofD, bevelEnabled: false };
          const gableGeo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
          gableGeo.center();

          const gableMesh = new THREE.Mesh(gableGeo, roofMat);
          gableMesh.position.set(centerX, topElevation + peakH / 2, centerZ);
          gableMesh.castShadow = true;
          gableMesh.receiveShadow = true;
          roofGroup.add(gableMesh);
        } else if (spec.roof.type === 'hip') {
          // Hip roof pyramid/taper
          const pitchRad = ((spec.roof.pitch || 20) * Math.PI) / 180;
          const peakH = Math.min(roofW, roofD) * 0.3 * Math.tan(pitchRad);

          const hipGeo = new THREE.ConeGeometry(Math.max(roofW, roofD) * 0.6, peakH, 4);
          hipGeo.rotateY(Math.PI / 4);
          const hipMesh = new THREE.Mesh(hipGeo, roofMat);
          hipMesh.scale.set(roofW / Math.max(roofW, roofD), 1, roofD / Math.max(roofW, roofD));
          hipMesh.position.set(centerX, topElevation + peakH / 2, centerZ);
          hipMesh.castShadow = true;
          hipMesh.receiveShadow = true;
          roofGroup.add(hipMesh);
        } else {
          // Flat slab with modern parapet
          const flatGeo = new THREE.BoxGeometry(roofW, 0.3, roofD);
          const flatMesh = new THREE.Mesh(flatGeo, roofMat);
          flatMesh.position.set(centerX, topElevation + 0.15, centerZ);
          flatMesh.castShadow = true;
          flatMesh.receiveShadow = true;

          // Parapet edging
          const parapetMat = facadeSecMat;
          const pNorth = new THREE.Mesh(new THREE.BoxGeometry(roofW, 0.4, 0.15), parapetMat);
          pNorth.position.set(centerX, topElevation + 0.45, centerZ - roofD / 2);
          const pSouth = new THREE.Mesh(new THREE.BoxGeometry(roofW, 0.4, 0.15), parapetMat);
          pSouth.position.set(centerX, topElevation + 0.45, centerZ + roofD / 2);
          const pWest = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.4, roofD), parapetMat);
          pWest.position.set(centerX - roofW / 2, topElevation + 0.45, centerZ);
          const pEast = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.4, roofD), parapetMat);
          pEast.position.set(centerX + roofW / 2, topElevation + 0.45, centerZ);

          roofGroup.add(flatMesh, pNorth, pSouth, pWest, pEast);
        }

        roofGroup.traverse((child) => {
          child.userData = { surface: 'roof' };
        });
        group.add(roofGroup);
      }
    }

    // 4. Build Floating Dimension Labels & Openings
    if (showDimensions) {
      const dimGroup = new THREE.Group();
      const showWalls = dimensionFilter === 'all' || dimensionFilter === 'walls';
      const showOpenings = dimensionFilter === 'all' || dimensionFilter === 'openings';

      // Wall Dimensions per visible room
      spec.rooms.forEach((room) => {
        if (activeFloorFilter !== 'all' && room.floor !== activeFloorFilter) return;

        const floorElevation = (spec.floors.find((f) => f.level === room.floor)?.elevation ?? room.floor * floorHeightDefault);
        const dimElevation = floorElevation + 0.3; // elevated slightly above floor slab

        if (showWalls) {
          // North Wall dimension
          const nP1 = new THREE.Vector3(room.x - room.width / 2, dimElevation, room.z - room.depth / 2 - 0.35);
          const nP2 = new THREE.Vector3(room.x + room.width / 2, dimElevation, room.z - room.depth / 2 - 0.35);
          dimGroup.add(createDimensionLine(nP1, nP2, 0.22, 0x94a3b8));
          const nSprite = createTextSprite(`${room.width.toFixed(1)}m`, `${room.name} (N)`, 'wall', 1.4, 0.45);
          nSprite.position.set(room.x, dimElevation + 0.3, room.z - room.depth / 2 - 0.45);
          dimGroup.add(nSprite);

          // South Wall dimension
          const sP1 = new THREE.Vector3(room.x - room.width / 2, dimElevation, room.z + room.depth / 2 + 0.35);
          const sP2 = new THREE.Vector3(room.x + room.width / 2, dimElevation, room.z + room.depth / 2 + 0.35);
          dimGroup.add(createDimensionLine(sP1, sP2, 0.22, 0x94a3b8));
          const sSprite = createTextSprite(`${room.width.toFixed(1)}m`, `${room.name} (S)`, 'wall', 1.4, 0.45);
          sSprite.position.set(room.x, dimElevation + 0.3, room.z + room.depth / 2 + 0.45);
          dimGroup.add(sSprite);

          // West Wall dimension
          const wP1 = new THREE.Vector3(room.x - room.width / 2 - 0.35, dimElevation, room.z - room.depth / 2);
          const wP2 = new THREE.Vector3(room.x - room.width / 2 - 0.35, dimElevation, room.z + room.depth / 2);
          dimGroup.add(createDimensionLine(wP1, wP2, 0.22, 0x94a3b8));
          const wSprite = createTextSprite(`${room.depth.toFixed(1)}m`, `${room.name} (W)`, 'wall', 1.4, 0.45);
          wSprite.position.set(room.x - room.width / 2 - 0.45, dimElevation + 0.3, room.z);
          dimGroup.add(wSprite);

          // East Wall dimension
          const eP1 = new THREE.Vector3(room.x + room.width / 2 + 0.35, dimElevation, room.z - room.depth / 2);
          const eP2 = new THREE.Vector3(room.x + room.width / 2 + 0.35, dimElevation, room.z + room.depth / 2);
          dimGroup.add(createDimensionLine(eP1, eP2, 0.22, 0x94a3b8));
          const eSprite = createTextSprite(`${room.depth.toFixed(1)}m`, `${room.name} (E)`, 'wall', 1.4, 0.45);
          eSprite.position.set(room.x + room.width / 2 + 0.45, dimElevation + 0.3, room.z);
          dimGroup.add(eSprite);
        }

        // Room Area Center Badge
        const roomArea = (room.width * room.depth).toFixed(1);
        const centerSprite = createTextSprite(
          room.name,
          `${room.width.toFixed(1)}m × ${room.depth.toFixed(1)}m (${roomArea} m²)`,
          'room',
          1.7,
          0.55
        );
        centerSprite.position.set(room.x, dimElevation + 0.15, room.z);
        dimGroup.add(centerSprite);
      });

      // Window Openings
      if (showOpenings) {
        spec.windows.forEach((win) => {
          const room = spec.rooms.find((r) => r.id === win.roomId);
          if (!room) return;
          if (activeFloorFilter !== 'all' && room.floor !== activeFloorFilter) return;

          const floorElevation = (spec.floors.find((f) => f.level === room.floor)?.elevation ?? room.floor * floorHeightDefault);
          const roomH = room.height || floorHeightDefault;
          const length = win.wall === 'north' || win.wall === 'south' ? room.width : room.depth;
          const winW = Math.min(win.width, length - 0.4);
          const winH = Math.min(win.height, roomH - 0.5);
          const winOffset = Math.max(0.2, Math.min(length - winW - 0.2, win.offset || (length - winW) / 2));
          const sillH = win.elevation || 0.6;
          const centerY = floorElevation + sillH + winH / 2;

          let posX = room.x;
          let posZ = room.z;
          let p1 = new THREE.Vector3();
          let p2 = new THREE.Vector3();

          if (win.wall === 'north') {
            posX = room.x - room.width / 2 + winOffset + winW / 2;
            posZ = room.z - room.depth / 2 - 0.18;
            p1.set(posX - winW / 2, centerY, posZ);
            p2.set(posX + winW / 2, centerY, posZ);
          } else if (win.wall === 'south') {
            posX = room.x - room.width / 2 + winOffset + winW / 2;
            posZ = room.z + room.depth / 2 + 0.18;
            p1.set(posX - winW / 2, centerY, posZ);
            p2.set(posX + winW / 2, centerY, posZ);
          } else if (win.wall === 'west') {
            posX = room.x - room.width / 2 - 0.18;
            posZ = room.z - room.depth / 2 + winOffset + winW / 2;
            p1.set(posX, centerY, posZ - winW / 2);
            p2.set(posX, centerY, posZ + winW / 2);
          } else if (win.wall === 'east') {
            posX = room.x + room.width / 2 + 0.18;
            posZ = room.z - room.depth / 2 + winOffset + winW / 2;
            p1.set(posX, centerY, posZ - winW / 2);
            p2.set(posX, centerY, posZ + winW / 2);
          }

          // Line across opening span
          dimGroup.add(createDimensionLine(p1, p2, 0.18, 0x0284c7));

          // Label sprite above opening
          const sprite = createTextSprite(
            `${winW.toFixed(1)}m × ${winH.toFixed(1)}m`,
            `Window (Sill +${sillH.toFixed(1)}m)`,
            'window',
            1.7,
            0.55
          );
          sprite.position.set(posX, centerY + winH / 2 + 0.35, posZ);
          dimGroup.add(sprite);
        });

        // Door Openings
        spec.doors.forEach((door) => {
          const room = spec.rooms.find((r) => r.id === door.roomId);
          if (!room) return;
          if (activeFloorFilter !== 'all' && room.floor !== activeFloorFilter) return;

          const floorElevation = (spec.floors.find((f) => f.level === room.floor)?.elevation ?? room.floor * floorHeightDefault);
          const roomH = room.height || floorHeightDefault;
          const length = door.wall === 'north' || door.wall === 'south' ? room.width : room.depth;
          const doorW = Math.min(door.width, length - 0.4);
          const doorH = Math.min(door.height, roomH - 0.2);
          const doorOffset = Math.max(0.2, Math.min(length - doorW - 0.2, door.offset || (length - doorW) / 2));
          const centerY = floorElevation + doorH / 2;

          let posX = room.x;
          let posZ = room.z;
          let p1 = new THREE.Vector3();
          let p2 = new THREE.Vector3();

          if (door.wall === 'north') {
            posX = room.x - room.width / 2 + doorOffset + doorW / 2;
            posZ = room.z - room.depth / 2 - 0.18;
            p1.set(posX - doorW / 2, centerY, posZ);
            p2.set(posX + doorW / 2, centerY, posZ);
          } else if (door.wall === 'south') {
            posX = room.x - room.width / 2 + doorOffset + doorW / 2;
            posZ = room.z + room.depth / 2 + 0.18;
            p1.set(posX - doorW / 2, centerY, posZ);
            p2.set(posX + doorW / 2, centerY, posZ);
          } else if (door.wall === 'west') {
            posX = room.x - room.width / 2 - 0.18;
            posZ = room.z - room.depth / 2 + doorOffset + doorW / 2;
            p1.set(posX, centerY, posZ - doorW / 2);
            p2.set(posX, centerY, posZ + doorW / 2);
          } else if (door.wall === 'east') {
            posX = room.x + room.width / 2 + 0.18;
            posZ = room.z - room.depth / 2 + doorOffset + doorW / 2;
            p1.set(posX, centerY, posZ - doorW / 2);
            p2.set(posX, centerY, posZ + doorW / 2);
          }

          // Line across door span
          dimGroup.add(createDimensionLine(p1, p2, 0.18, 0xd97706));

          // Label sprite above door
          const sprite = createTextSprite(
            `${doorW.toFixed(1)}m × ${doorH.toFixed(1)}m`,
            `Door (${door.type.replace('_', ' ')})`,
            'door',
            1.7,
            0.55
          );
          sprite.position.set(posX, floorElevation + doorH + 0.35, posZ);
          dimGroup.add(sprite);
        });
      }

      group.add(dimGroup);
    }
  }, [spec, showRoof, activeFloorFilter, selectedRoom, hoveredRoom, showDimensions, dimensionFilter]);

  // Raycasting for room hover and click
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !cameraRef.current || !sceneRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(x, y), cameraRef.current);

    const hitboxes = roomHitboxesRef.current.map((item) => item.mesh);
    const intersects = raycaster.intersectObjects(hitboxes);

    if (intersects.length > 0) {
      const match = roomHitboxesRef.current.find((item) => item.mesh === intersects[0].object);
      if (match) {
        setHoveredRoom(match.room);
        canvasRef.current.style.cursor = 'pointer';
        return;
      }
    }
    setHoveredRoom(null);
    canvasRef.current.style.cursor = 'default';
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !cameraRef.current || !sceneRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(x, y), cameraRef.current);

    // 1. Raycast for surface detection (walls, roof, floor, patio)
    if (houseGroupRef.current) {
      const surfaceHits = raycaster.intersectObjects(houseGroupRef.current.children, true);
      for (const hit of surfaceHits) {
        if (hit.object.userData && hit.object.userData.surface) {
          const sName = hit.object.userData.surface as TargetSurface;
          onSelectSurface?.(sName);
          if (hit.object.userData.roomId) {
            const rMatch = spec.rooms.find((r) => r.id === hit.object.userData.roomId);
            if (rMatch) {
              setSelectedRoom(rMatch);
              onSelectRoom?.(rMatch);
            }
          }
          return;
        }
      }
    }

    // 2. Fallback to room hitboxes
    const hitboxes = roomHitboxesRef.current.map((item) => item.mesh);
    const intersects = raycaster.intersectObjects(hitboxes);

    if (intersects.length > 0) {
      const match = roomHitboxesRef.current.find((item) => item.mesh === intersects[0].object);
      if (match) {
        setSelectedRoom(match.room);
        onSelectRoom?.(match.room);
        onSelectSurface?.('selectedRoomFloor');
        return;
      }
    }
  };

  // Reset Camera View
  const resetCamera = () => {
    if (!cameraRef.current || !controlsRef.current) return;
    cameraRef.current.position.set(22, 18, 26);
    controlsRef.current.target.set(0, 2, 0);
    controlsRef.current.update();
  };

  // Top-down Floor Plan View in 3D
  const setTopView = () => {
    if (!cameraRef.current || !controlsRef.current) return;
    cameraRef.current.position.set(0, 38, 0.1);
    controlsRef.current.target.set(0, 0, 0);
    controlsRef.current.update();
    setShowRoof(false);
  };

  // Capture High-Res Screenshot
  const takeScreenshot = () => {
    if (!rendererRef.current || !canvasRef.current) return;
    const dataURL = canvasRef.current.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `${spec.title.toLowerCase().replace(/\s+/g, '-')}-3d-render.png`;
    link.href = dataURL;
    link.click();
  };

  // Export 3D Model as GLB
  const exportGLB = () => {
    if (!houseGroupRef.current) return;
    setExporting(true);
    const exporter = new GLTFExporter();
    exporter.parse(
      houseGroupRef.current,
      (gltf) => {
        const blob = new Blob([gltf as ArrayBuffer], { type: 'application/octet-stream' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${spec.title.toLowerCase().replace(/\s+/g, '-')}-model.glb`;
        link.click();
        setExporting(false);
      },
      (error) => {
        console.error('Error exporting GLB:', error);
        setExporting(false);
      },
      { binary: true }
    );
  };

  // Export 3D Model as OBJ
  const exportOBJ = () => {
    if (!houseGroupRef.current) return;
    setExporting(true);
    const exporter = new OBJExporter();
    const result = exporter.parse(houseGroupRef.current);
    const blob = new Blob([result], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${spec.title.toLowerCase().replace(/\s+/g, '-')}-model.obj`;
    link.click();
    setExporting(false);
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full bg-slate-900 overflow-hidden flex flex-col select-none ${
        isFullscreen ? 'fixed inset-0 z-50' : 'rounded-2xl'
      }`}
    >
      {/* 3D Canvas */}
      <canvas
        ref={canvasRef}
        onPointerMove={handlePointerMove}
        onPointerDown={handlePointerDown}
        className="w-full h-full flex-1 touch-none"
      />

      {/* Top Floating Control Bar */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none gap-2">
        {/* Left: View Modes & Cutaways */}
        <div className="flex items-center gap-1.5 p-1.5 rounded-xl bg-slate-900/80 backdrop-blur-md border border-slate-700/60 shadow-lg pointer-events-auto">
          {/* Roof Toggle */}
          <button
            onClick={() => setShowRoof((prev) => !prev)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              showRoof ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-300 hover:bg-slate-800'
            }`}
            title="Toggle Roof on / off to see interior"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Roof {showRoof ? 'On' : 'Off'}</span>
          </button>

          {/* Dimension Toggle */}
          <button
            onClick={() => setShowDimensions((prev) => !prev)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              showDimensions
                ? 'bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-400'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
            title="Toggle Floating 3D Dimension Labels for walls & window openings"
          >
            <Ruler className="w-3.5 h-3.5" />
            <span>Dimensions {showDimensions ? 'On' : 'Off'}</span>
          </button>

          {/* Dimension Sub-filters */}
          {showDimensions && (
            <div className="flex items-center bg-slate-800/90 rounded-lg p-0.5 border border-slate-700/60 text-[11px] hidden sm:flex">
              <button
                onClick={() => setDimensionFilter('all')}
                className={`px-2 py-0.5 rounded transition-all ${
                  dimensionFilter === 'all'
                    ? 'bg-indigo-500 text-white font-semibold shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Show all dimensions (walls, windows, doors)"
              >
                All
              </button>
              <button
                onClick={() => setDimensionFilter('walls')}
                className={`px-2 py-0.5 rounded transition-all ${
                  dimensionFilter === 'walls'
                    ? 'bg-indigo-500 text-white font-semibold shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Show room wall dimensions only"
              >
                Walls
              </button>
              <button
                onClick={() => setDimensionFilter('openings')}
                className={`px-2 py-0.5 rounded transition-all ${
                  dimensionFilter === 'openings'
                    ? 'bg-indigo-500 text-white font-semibold shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Show window & door openings only"
              >
                Openings
              </button>
            </div>
          )}

          {/* Floor cutaways */}
          <div className="h-4 w-px bg-slate-700 mx-0.5" />
          <button
            onClick={() => setActiveFloorFilter('all')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeFloorFilter === 'all'
                ? 'bg-slate-700 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            All Floors
          </button>
          {spec.floors.map((fl) => (
            <button
              key={fl.level}
              onClick={() => {
                setActiveFloorFilter(fl.level);
                setShowRoof(fl.level === spec.floors.length - 1);
              }}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeFloorFilter === fl.level
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              L{fl.level} ({fl.name.split(' ')[0]})
            </button>
          ))}

          {/* Top Down View */}
          <button
            onClick={setTopView}
            className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-800 flex items-center gap-1"
            title="Top-down orthographic perspective"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Plan View</span>
          </button>

          {/* Reset Camera */}
          <button
            onClick={resetCamera}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            title="Reset Camera Angle"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right: Lighting, Palette, Snapshot, Fullscreen */}
        <div className="flex items-center gap-1.5 p-1.5 rounded-xl bg-slate-900/80 backdrop-blur-md border border-slate-700/60 shadow-lg pointer-events-auto">
          {/* Lighting Mode */}
          <div className="flex items-center bg-slate-800/80 rounded-lg p-0.5">
            <button
              onClick={() => setLightingMode('day')}
              className={`p-1.5 rounded-md transition-all ${
                lightingMode === 'day' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
              title="Day Sunlight"
            >
              <Sun className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setLightingMode('sunset')}
              className={`p-1.5 rounded-md transition-all ${
                lightingMode === 'sunset' ? 'bg-orange-500 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
              title="Golden Hour Sunset"
            >
              <Sunset className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setLightingMode('night')}
              className={`p-1.5 rounded-md transition-all ${
                lightingMode === 'night' ? 'bg-indigo-500 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
              title="Architectural Night Glow"
            >
              <Moon className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Live Material Swapper */}
          <button
            onClick={() => {
              if (onOpenMaterials) {
                onOpenMaterials();
              } else {
                setShowMaterialDrawer((prev) => !prev);
              }
            }}
            className={`p-1.5 rounded-lg transition-all ${
              showMaterialDrawer ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'
            }`}
            title="Live Materials & Textures Library"
          >
            <Palette className="w-4 h-4" />
          </button>

          {/* Snapshot Screenshot */}
          <button
            onClick={takeScreenshot}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-all"
            title="Take High-Res 3D Screenshot"
          >
            <Camera className="w-4 h-4" />
          </button>

          {/* 3D Export Dropdown / GLB */}
          <button
            onClick={exportGLB}
            disabled={exporting}
            className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/40 border border-emerald-800/50 flex items-center gap-1 transition-all"
            title="Export interactive 3D model (.GLB)"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{exporting ? 'Exporting...' : '.GLB'}</span>
          </button>

          <button
            onClick={exportOBJ}
            disabled={exporting}
            className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700/60 hidden sm:flex items-center gap-1 transition-all"
            title="Export 3D model (.OBJ)"
          >
            <span>.OBJ</span>
          </button>

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-all"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Hovered / Selected Room Highlight Banner */}
      {(hoveredRoom || selectedRoom) && (
        <div className="absolute bottom-4 left-4 p-3 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-700/70 shadow-xl max-w-sm pointer-events-auto">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
              <h4 className="text-sm font-semibold text-white">
                {(selectedRoom || hoveredRoom)?.name}
              </h4>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-indigo-950/80 text-indigo-300 border border-indigo-700/50">
              L{(selectedRoom || hoveredRoom)?.floor}
            </span>
          </div>

          <div className="mt-2 grid grid-cols-3 gap-2 text-[11px] text-slate-300">
            <div className="bg-slate-800/60 p-1.5 rounded-lg">
              <p className="text-slate-400 text-[10px]">Area</p>
              <p className="font-semibold text-white">
                {(((selectedRoom || hoveredRoom)?.width || 0) * ((selectedRoom || hoveredRoom)?.depth || 0)).toFixed(1)} m²
              </p>
            </div>
            <div className="bg-slate-800/60 p-1.5 rounded-lg">
              <p className="text-slate-400 text-[10px]">Dimensions</p>
              <p className="font-semibold text-white">
                {(selectedRoom || hoveredRoom)?.width}m × {(selectedRoom || hoveredRoom)?.depth}m
              </p>
            </div>
            <div className="bg-slate-800/60 p-1.5 rounded-lg">
              <p className="text-slate-400 text-[10px]">Finishes</p>
              <p className="font-semibold capitalize text-indigo-300 truncate">
                {(selectedRoom || hoveredRoom)?.floorMaterial?.replace('_', ' ')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Live Material Swapping Panel */}
      {showMaterialDrawer && (
        <div className="absolute top-16 right-4 w-72 p-4 rounded-2xl bg-slate-900/95 backdrop-blur-lg border border-slate-700 shadow-2xl z-20 text-slate-200">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-indigo-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">Live Materials & Colors</h4>
            </div>
            <button
              onClick={() => setShowMaterialDrawer(false)}
              className="text-slate-400 hover:text-white text-xs"
            >
              ✕
            </button>
          </div>

          {/* Primary Facade Color */}
          <div className="mb-3">
            <label className="text-[11px] text-slate-400 block mb-1.5">Primary Facade Cladding</label>
            <div className="flex items-center gap-2">
              {[
                { name: 'Japanese Cedar', color: '#c59b6d' },
                { name: 'Warm Oak', color: '#b08968' },
                { name: 'Charred Timber', color: '#2b2d2f' },
                { name: 'White Stucco', color: '#f8f9fa' },
                { name: 'Limestone', color: '#e8e8e6' },
              ].map((swatch) => (
                <button
                  key={swatch.color}
                  onClick={() => {
                    if (!onUpdateSpec) return;
                    const updated = {
                      ...spec,
                      materials: {
                        ...spec.materials,
                        facadePrimary: {
                          ...spec.materials.facadePrimary,
                          name: swatch.name,
                          color: swatch.color,
                        },
                      },
                    };
                    onUpdateSpec(updated);
                  }}
                  className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${
                    spec.materials.facadePrimary.color === swatch.color ? 'border-indigo-400 scale-110 shadow-md' : 'border-slate-700'
                  }`}
                  style={{ backgroundColor: swatch.color }}
                  title={swatch.name}
                />
              ))}
            </div>
          </div>

          {/* Secondary Facade / Concrete */}
          <div className="mb-3">
            <label className="text-[11px] text-slate-400 block mb-1.5">Secondary Accent Cladding</label>
            <div className="flex items-center gap-2">
              {[
                { name: 'Raw Concrete', color: '#ced4da' },
                { name: 'Smooth White Plaster', color: '#ffffff' },
                { name: 'Basalt Charcoal', color: '#343a40' },
                { name: 'Terracotta', color: '#d97706' },
              ].map((swatch) => (
                <button
                  key={swatch.color}
                  onClick={() => {
                    if (!onUpdateSpec) return;
                    const updated = {
                      ...spec,
                      materials: {
                        ...spec.materials,
                        facadeSecondary: {
                          ...spec.materials.facadeSecondary,
                          name: swatch.name,
                          color: swatch.color,
                        },
                      },
                    };
                    onUpdateSpec(updated);
                  }}
                  className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${
                    spec.materials.facadeSecondary.color === swatch.color ? 'border-indigo-400 scale-110 shadow-md' : 'border-slate-700'
                  }`}
                  style={{ backgroundColor: swatch.color }}
                  title={swatch.name}
                />
              ))}
            </div>
          </div>

          {/* Roof Finish */}
          <div className="mb-2">
            <label className="text-[11px] text-slate-400 block mb-1.5">Roof Tiles & Shingles</label>
            <div className="flex items-center gap-2">
              {[
                { name: 'Dark Slate Metal', color: '#1f2421' },
                { name: 'Terracotta Tile', color: '#bc6c25' },
                { name: 'Anthracite Zinc', color: '#334155' },
                { name: 'Light Concrete', color: '#94a3b8' },
              ].map((swatch) => (
                <button
                  key={swatch.color}
                  onClick={() => {
                    if (!onUpdateSpec) return;
                    const updated = {
                      ...spec,
                      roof: { ...spec.roof, color: swatch.color },
                      materials: { ...spec.materials, roofColor: swatch.color },
                    };
                    onUpdateSpec(updated);
                  }}
                  className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${
                    spec.roof.color === swatch.color ? 'border-indigo-400 scale-110 shadow-md' : 'border-slate-700'
                  }`}
                  style={{ backgroundColor: swatch.color }}
                  title={swatch.name}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Hint & Dimension Legend */}
      <div className="absolute bottom-4 right-4 flex items-center gap-2 pointer-events-none">
        {showDimensions && (
          <div className="px-2.5 py-1.5 rounded-lg bg-slate-900/80 backdrop-blur-sm border border-slate-700/80 text-[11px] hidden sm:flex items-center gap-3 text-slate-300 shadow-lg">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-300" />
              <span>Walls</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-sky-400" />
              <span>Windows</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>Doors</span>
            </span>
          </div>
        )}
        <div className="px-2.5 py-1.5 rounded-lg bg-slate-900/60 backdrop-blur-sm border border-slate-800 text-[11px] text-slate-400 hidden sm:block">
          Left Click: Rotate • Right Click: Pan • Scroll: Zoom • Click Room: Inspect
        </div>
      </div>
    </div>
  );
};
