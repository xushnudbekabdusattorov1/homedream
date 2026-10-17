import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { OBJExporter } from 'three/examples/jsm/exporters/OBJExporter.js';
import { HouseSpec, RoomSpec } from '../../types/house';
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
} from 'lucide-react';

interface HouseViewerProps {
  spec: HouseSpec;
  selectedRoomId?: string | null;
  onSelectRoom?: (room: RoomSpec | null) => void;
  onUpdateSpec?: (updated: HouseSpec) => void;
}

export const HouseViewer: React.FC<HouseViewerProps> = ({
  spec,
  selectedRoomId,
  onSelectRoom,
  onUpdateSpec,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Viewer state
  const [showRoof, setShowRoof] = useState(true);
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
    const facadeMat = new THREE.MeshStandardMaterial({
      color: materials.facadePrimary.color || '#d1d5db',
      roughness: materials.facadePrimary.roughness ?? 0.7,
      metalness: materials.facadePrimary.metalness ?? 0.05,
    });

    const facadeSecMat = new THREE.MeshStandardMaterial({
      color: materials.facadeSecondary.color || '#f3f4f6',
      roughness: materials.facadeSecondary.roughness ?? 0.8,
      metalness: materials.facadeSecondary.metalness ?? 0.02,
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
      color: '#e2e8f0',
      roughness: 0.7,
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

      // Floor slab for the room
      const floorMatColor = room.color || (room.floorMaterial === 'hardwood' ? '#d4a373' : room.floorMaterial === 'marble' ? '#f1f5f9' : '#e2e8f0');
      const floorGeo = new THREE.BoxGeometry(room.width, 0.15, room.depth);
      const floorMesh = new THREE.Mesh(
        floorGeo,
        new THREE.MeshStandardMaterial({
          color: floorMatColor,
          roughness: 0.6,
          metalness: 0.05,
        })
      );
      floorMesh.position.y = 0.075;
      floorMesh.receiveShadow = true;
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

        group.add(roofGroup);
      }
    }
  }, [spec, showRoof, activeFloorFilter, selectedRoom, hoveredRoom]);

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

    const hitboxes = roomHitboxesRef.current.map((item) => item.mesh);
    const intersects = raycaster.intersectObjects(hitboxes);

    if (intersects.length > 0) {
      const match = roomHitboxesRef.current.find((item) => item.mesh === intersects[0].object);
      if (match) {
        setSelectedRoom(match.room);
        onSelectRoom?.(match.room);
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
            onClick={() => setShowMaterialDrawer((prev) => !prev)}
            className={`p-1.5 rounded-lg transition-all ${
              showMaterialDrawer ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'
            }`}
            title="Live Materials & Finishes"
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

      {/* Orbit Navigation Hint */}
      <div className="absolute bottom-4 right-4 px-2.5 py-1.5 rounded-lg bg-slate-900/60 backdrop-blur-sm border border-slate-800 text-[11px] text-slate-400 pointer-events-none hidden sm:block">
        Left Click: Rotate • Right Click: Pan • Scroll: Zoom • Click Room: Inspect
      </div>
    </div>
  );
};
