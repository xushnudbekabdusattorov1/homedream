import { HouseSpec, ValidationResult, ValidationIssue, RoomSpec } from '../types/house';

export function validateHouseSpec(spec: HouseSpec): ValidationResult {
  const issues: ValidationIssue[] = [];

  if (!spec || !spec.rooms || spec.rooms.length === 0) {
    return {
      valid: false,
      issues: [{ type: 'error', code: 'NO_ROOMS', message: 'The house specification contains no rooms.' }],
    };
  }

  const plotW = spec.plot?.width || 20;
  const plotD = spec.plot?.depth || 25;
  const halfPlotW = plotW / 2;
  const halfPlotD = plotD / 2;

  // 1. Minimum room size constraints
  const minSizes: Record<string, number> = {
    bedroom: 8.0,
    master_bedroom: 12.0,
    living: 14.0,
    kitchen: 6.0,
    dining: 8.0,
    bathroom: 2.2,
    office: 6.0,
    garage: 14.0,
  };

  spec.rooms.forEach((r) => {
    const area = r.width * r.depth;
    const minReq = minSizes[r.type];
    if (minReq && area < minReq * 0.75) {
      issues.push({
        type: 'warning',
        code: 'ROOM_TOO_SMALL',
        message: `${r.name} area (${area.toFixed(1)} m²) is unusually small for a ${r.type} (expected ≥ ${minReq} m²).`,
        roomId: r.id,
      });
    }

    // Check plot bounds
    const minX = r.x - r.width / 2;
    const maxX = r.x + r.width / 2;
    const minZ = r.z - r.depth / 2;
    const maxZ = r.z + r.depth / 2;

    if (minX < -halfPlotW || maxX > halfPlotW || minZ < -halfPlotD || maxZ > halfPlotD) {
      issues.push({
        type: 'error',
        code: 'OUT_OF_PLOT_BOUNDS',
        message: `${r.name} extends outside the boundary of the plot (${plotW}m × ${plotD}m).`,
        roomId: r.id,
      });
    }
  });

  // 2. Room Overlap Check per floor
  const floors = Array.from(new Set(spec.rooms.map((r) => r.floor)));
  floors.forEach((floorLevel) => {
    const floorRooms = spec.rooms.filter((r) => r.floor === floorLevel);
    for (let i = 0; i < floorRooms.length; i++) {
      for (let j = i + 1; j < floorRooms.length; j++) {
        const r1 = floorRooms[i];
        const r2 = floorRooms[j];

        const r1MinX = r1.x - r1.width / 2;
        const r1MaxX = r1.x + r1.width / 2;
        const r1MinZ = r1.z - r1.depth / 2;
        const r1MaxZ = r1.z + r1.depth / 2;

        const r2MinX = r2.x - r2.width / 2;
        const r2MaxX = r2.x + r2.width / 2;
        const r2MinZ = r2.z - r2.depth / 2;
        const r2MaxZ = r2.z + r2.depth / 2;

        // Overlap tolerance 0.15m (walls touch or share boundary)
        const overlapX = Math.min(r1MaxX, r2MaxX) - Math.max(r1MinX, r2MinX);
        const overlapZ = Math.min(r1MaxZ, r2MaxZ) - Math.max(r1MinZ, r2MinZ);

        if (overlapX > 0.35 && overlapZ > 0.35) {
          issues.push({
            type: 'error',
            code: 'ROOM_OVERLAP',
            message: `Collision detected on Floor ${floorLevel}: ${r1.name} overlaps with ${r2.name} by ${overlapX.toFixed(2)}m × ${overlapZ.toFixed(2)}m.`,
            roomId: r1.id,
          });
        }
      }
    }
  });

  // 3. Accessibility / Door check
  const doorRoomIds = new Set(spec.doors?.map((d) => d.roomId) || []);
  spec.rooms.forEach((r) => {
    // Balconies and terraces might be accessed from adjacent room
    const hasDirectDoor = doorRoomIds.has(r.id);
    const hasConnection = (r.connectedTo && r.connectedTo.length > 0) || r.type === 'balcony' || r.type === 'terrace';
    if (!hasDirectDoor && !hasConnection) {
      issues.push({
        type: 'warning',
        code: 'MISSING_DOOR',
        message: `${r.name} does not have an assigned door or hallway connection.`,
        roomId: r.id,
      });
    }
  });

  // 4. Structural Sanity: Upper floors supported by ground floor
  const upperRooms = spec.rooms.filter((r) => r.floor > 0);
  const groundRooms = spec.rooms.filter((r) => r.floor === 0);

  if (groundRooms.length > 0 && upperRooms.length > 0) {
    const groundMinX = Math.min(...groundRooms.map((r) => r.x - r.width / 2));
    const groundMaxX = Math.max(...groundRooms.map((r) => r.x + r.width / 2));
    const groundMinZ = Math.min(...groundRooms.map((r) => r.z - r.depth / 2));
    const groundMaxZ = Math.max(...groundRooms.map((r) => r.z + r.depth / 2));

    // Allow cantilever up to 2.5 meters
    const cantileverMargin = 2.5;

    upperRooms.forEach((r) => {
      const rMinX = r.x - r.width / 2;
      const rMaxX = r.x + r.width / 2;
      const rMinZ = r.z - r.depth / 2;
      const rMaxZ = r.z + r.depth / 2;

      if (
        rMinX < groundMinX - cantileverMargin ||
        rMaxX > groundMaxX + cantileverMargin ||
        rMinZ < groundMinZ - cantileverMargin ||
        maxZSupported(rMaxZ, groundMaxZ, cantileverMargin)
      ) {
        issues.push({
          type: 'warning',
          code: 'UNSUPPORTED_OVERHANG',
          message: `Upper floor room ${r.name} exceeds structural cantilever limits over the ground floor.`,
          roomId: r.id,
        });
      }
    });
  }

  const errors = issues.filter((i) => i.type === 'error');
  return {
    valid: errors.length === 0,
    issues,
  };
}

function maxZSupported(val: number, limit: number, margin: number): boolean {
  return val > limit + margin;
}

/**
 * Procedural auto-repair for common layout discrepancies:
 * ensures doors exist, calculates accurate stats, snaps boundaries.
 */
export function autoRepairHouseSpec(spec: HouseSpec): HouseSpec {
  const cloned: HouseSpec = JSON.parse(JSON.stringify(spec));

  // 1. Ensure Doors exist for every room without one
  const existingDoorRooms = new Set(cloned.doors.map((d) => d.roomId));
  cloned.rooms.forEach((r) => {
    if (!existingDoorRooms.has(r.id)) {
      cloned.doors.push({
        id: `door-repair-${r.id}`,
        roomId: r.id,
        wall: 'south',
        offset: Math.max(0.6, Math.min(r.width - 1.2, r.width / 2 - 0.45)),
        width: r.type === 'garage' ? 2.8 : 0.9,
        height: 2.1,
        type: r.type === 'garage' ? 'garage_door' : r.floor === 0 && r.type === 'living' ? 'sliding_glass' : 'interior',
      });
    }
  });

  // 2. Ensure Windows exist for natural light in bedrooms and living rooms
  const existingWindowRooms = new Set(cloned.windows.map((w) => w.roomId));
  cloned.rooms.forEach((r) => {
    if (!existingWindowRooms.has(r.id) && r.type !== 'hallway' && r.type !== 'storage') {
      const isBig = r.type === 'living' || r.type === 'master_bedroom';
      cloned.windows.push({
        id: `win-repair-${r.id}`,
        roomId: r.id,
        wall: 'north',
        offset: r.width / 2 - (isBig ? 1.0 : 0.6),
        width: isBig ? 2.2 : 1.2,
        height: isBig ? 1.8 : 1.3,
        elevation: isBig ? 0.4 : 0.9,
        type: isBig ? 'floor_to_ceiling' : 'standard',
      });
    }
  });

  // 3. Compute Stats
  const livableTypes = new Set(['living', 'kitchen', 'dining', 'bedroom', 'master_bedroom', 'bathroom', 'office']);
  let totalArea = 0;
  let livableArea = 0;
  let bedroomCount = 0;
  let bathroomCount = 0;
  const groundRooms = cloned.rooms.filter((r) => r.floor === 0);

  cloned.rooms.forEach((r) => {
    const area = r.width * r.depth;
    totalArea += area;
    if (livableTypes.has(r.type)) {
      livableArea += area;
    }
    if (r.type === 'bedroom' || r.type === 'master_bedroom') {
      bedroomCount++;
    }
    if (r.type === 'bathroom') {
      bathroomCount++;
    }
  });

  let footprintArea = 0;
  groundRooms.forEach((r) => {
    footprintArea += r.width * r.depth;
  });

  const maxFloor = Math.max(...cloned.rooms.map((r) => r.floor), 0) + 1;

  cloned.stats = {
    totalArea: Math.round(totalArea),
    livableArea: Math.round(livableArea),
    footprintArea: Math.round(footprintArea),
    bedroomCount: Math.max(bedroomCount, 1),
    bathroomCount: Math.max(bathroomCount, 1),
    floorCount: maxFloor,
    estimatedCostRange: `$${Math.round(livableArea * 1350).toLocaleString()} - $${Math.round(livableArea * 2100).toLocaleString()} USD`,
  };

  return cloned;
}
