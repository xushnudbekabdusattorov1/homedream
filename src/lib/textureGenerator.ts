import * as THREE from 'three';

// Cache generated textures so we don't recreate canvases unnecessarily
const textureCache = new Map<string, THREE.CanvasTexture>();

export type TextureType =
  // Wood
  | 'wood_oak'
  | 'wood_cedar'
  | 'wood_walnut'
  | 'wood_teak'
  // Concrete
  | 'concrete_raw'
  | 'concrete_polished'
  | 'concrete_fluted'
  | 'concrete_charcoal'
  // Brick
  | 'brick_red'
  | 'brick_white'
  | 'brick_charcoal'
  | 'brick_terracotta'
  // Tile
  | 'tile_ceramic'
  | 'tile_subway'
  | 'tile_marble'
  | 'tile_slate';

export function getProceduralTexture(type: TextureType): THREE.CanvasTexture {
  if (textureCache.has(type)) {
    return textureCache.get(type)!;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    const fallback = new THREE.CanvasTexture(canvas);
    textureCache.set(type, fallback);
    return fallback;
  }

  switch (type) {
    // ---------------- WOOD ----------------
    case 'wood_oak': {
      // Warm golden oak planks
      ctx.fillStyle = '#c59b6d';
      ctx.fillRect(0, 0, 512, 512);

      const plankCount = 8;
      const plankH = 512 / plankCount;

      for (let i = 0; i < plankCount; i++) {
        const y = i * plankH;
        // subtle plank shade variation
        ctx.fillStyle = i % 2 === 0 ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.04)';
        ctx.fillRect(0, y, 512, plankH);

        // Wood grain streaks
        ctx.strokeStyle = 'rgba(92, 64, 40, 0.15)';
        ctx.lineWidth = 1.2;
        for (let j = 0; j < 12; j++) {
          ctx.beginPath();
          const gy = y + Math.random() * plankH;
          ctx.moveTo(0, gy);
          ctx.bezierCurveTo(150, gy + Math.random() * 8 - 4, 350, gy + Math.random() * 8 - 4, 512, gy);
          ctx.stroke();
        }

        // Plank joint line
        ctx.strokeStyle = 'rgba(60, 40, 20, 0.45)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(512, y);
        ctx.stroke();
      }
      break;
    }

    case 'wood_cedar': {
      // Rich amber/reddish cedar horizontal shiplap
      ctx.fillStyle = '#b45309';
      ctx.fillRect(0, 0, 512, 512);

      const planks = 12;
      const h = 512 / planks;
      for (let i = 0; i < planks; i++) {
        const y = i * h;
        // Warm gradient per plank
        const grad = ctx.createLinearGradient(0, y, 0, y + h);
        grad.addColorStop(0, 'rgba(251, 191, 36, 0.18)');
        grad.addColorStop(1, 'rgba(120, 53, 15, 0.35)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, y, 512, h);

        // Shiplap shadow seam
        ctx.fillStyle = 'rgba(69, 26, 3, 0.6)';
        ctx.fillRect(0, y + h - 3, 512, 3);
        ctx.fillStyle = 'rgba(254, 243, 199, 0.3)';
        ctx.fillRect(0, y, 512, 1.5);
      }
      break;
    }

    case 'wood_walnut': {
      // Deep dark chocolate walnut
      ctx.fillStyle = '#3e2723';
      ctx.fillRect(0, 0, 512, 512);

      ctx.strokeStyle = 'rgba(93, 64, 55, 0.3)';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 40; i++) {
        ctx.beginPath();
        const y = Math.random() * 512;
        ctx.moveTo(0, y);
        ctx.bezierCurveTo(120, y + Math.random() * 20 - 10, 380, y + Math.random() * 20 - 10, 512, y);
        ctx.stroke();
      }
      // Plank dividers
      for (let i = 0; i < 6; i++) {
        ctx.fillStyle = 'rgba(20, 10, 8, 0.5)';
        ctx.fillRect(0, i * (512 / 6), 512, 2.5);
      }
      break;
    }

    case 'wood_teak': {
      // Golden outdoor teak decking with dark caulked joints
      ctx.fillStyle = '#a16207';
      ctx.fillRect(0, 0, 512, 512);

      const slats = 10;
      const slatH = 512 / slats;
      for (let i = 0; i < slats; i++) {
        const y = i * slatH;
        // Caulk joint
        ctx.fillStyle = '#1c1917';
        ctx.fillRect(0, y, 512, 4);

        // Teak wood subtle grain
        ctx.fillStyle = i % 2 === 0 ? 'rgba(254, 240, 138, 0.08)' : 'rgba(113, 63, 18, 0.15)';
        ctx.fillRect(0, y + 4, 512, slatH - 4);
      }
      break;
    }

    // ---------------- CONCRETE ----------------
    case 'concrete_raw': {
      // Architectural board-formed concrete
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(0, 0, 512, 512);

      // Micro speckling
      for (let i = 0; i < 6000; i++) {
        const px = Math.random() * 512;
        const py = Math.random() * 512;
        ctx.fillStyle = Math.random() > 0.5 ? 'rgba(71, 85, 105, 0.12)' : 'rgba(255, 255, 255, 0.15)';
        ctx.fillRect(px, py, 1.5, 1.5);
      }

      // Board form horizontal lines
      for (let i = 1; i < 4; i++) {
        const y = i * 128;
        ctx.fillStyle = 'rgba(51, 65, 85, 0.25)';
        ctx.fillRect(0, y, 512, 2);
        // Tie holes
        for (let j = 1; j <= 3; j++) {
          const x = j * 128;
          ctx.beginPath();
          ctx.arc(x, y - 20, 5, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(30, 41, 59, 0.45)';
          ctx.fill();
        }
      }
      break;
    }

    case 'concrete_polished': {
      // Smooth light grey polished concrete
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(0, 0, 512, 512);

      // Fine aggregates
      for (let i = 0; i < 4000; i++) {
        const px = Math.random() * 512;
        const py = Math.random() * 512;
        const s = Math.random() * 2 + 1;
        ctx.fillStyle = Math.random() > 0.4 ? 'rgba(100, 116, 139, 0.15)' : 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(px, py, s, s);
      }
      break;
    }

    case 'concrete_fluted': {
      // Fluted vertical ribs
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(0, 0, 512, 512);

      const ribs = 16;
      const ribW = 512 / ribs;
      for (let i = 0; i < ribs; i++) {
        const x = i * ribW;
        const grad = ctx.createLinearGradient(x, 0, x + ribW, 0);
        grad.addColorStop(0, 'rgba(255,255,255,0.4)');
        grad.addColorStop(0.5, 'rgba(255,255,255,0.05)');
        grad.addColorStop(1, 'rgba(15,23,42,0.4)');
        ctx.fillStyle = grad;
        ctx.fillRect(x, 0, ribW, 512);
      }
      break;
    }

    case 'concrete_charcoal': {
      // Moody dark charcoal architectural concrete
      ctx.fillStyle = '#334155';
      ctx.fillRect(0, 0, 512, 512);

      for (let i = 0; i < 5000; i++) {
        const px = Math.random() * 512;
        const py = Math.random() * 512;
        ctx.fillStyle = Math.random() > 0.5 ? 'rgba(15, 23, 42, 0.25)' : 'rgba(148, 163, 184, 0.12)';
        ctx.fillRect(px, py, 1.5, 1.5);
      }
      break;
    }

    // ---------------- BRICK ----------------
    case 'brick_red': {
      // Running-bond classic red brick
      ctx.fillStyle = '#78350f';
      ctx.fillRect(0, 0, 512, 512);

      const brickH = 32;
      const brickW = 64;
      const rows = 512 / brickH;

      ctx.fillStyle = '#cbd5e1'; // Mortar
      ctx.fillRect(0, 0, 512, 512);

      for (let r = 0; r < rows; r++) {
        const y = r * brickH + 2;
        const offsetX = (r % 2) * (brickW / 2);
        for (let x = -brickW; x < 512 + brickW; x += brickW) {
          const bx = x + offsetX + 2;
          // Randomize brick color subtly
          const redVar = Math.floor(180 + Math.random() * 40);
          const greenVar = Math.floor(55 + Math.random() * 25);
          const blueVar = Math.floor(35 + Math.random() * 20);
          ctx.fillStyle = `rgb(${redVar}, ${greenVar}, ${blueVar})`;
          ctx.fillRect(bx, y, brickW - 4, brickH - 4);
        }
      }
      break;
    }

    case 'brick_white': {
      // Scandinavian painted white brick
      ctx.fillStyle = '#e2e8f0'; // Mortar
      ctx.fillRect(0, 0, 512, 512);

      const brickH = 32;
      const brickW = 64;
      const rows = 512 / brickH;

      for (let r = 0; r < rows; r++) {
        const y = r * brickH + 2;
        const offsetX = (r % 2) * (brickW / 2);
        for (let x = -brickW; x < 512 + brickW; x += brickW) {
          const bx = x + offsetX + 2;
          const lightness = Math.floor(240 + Math.random() * 15);
          ctx.fillStyle = `rgb(${lightness}, ${lightness}, ${lightness})`;
          ctx.fillRect(bx, y, brickW - 4, brickH - 4);
        }
      }
      break;
    }

    case 'brick_charcoal': {
      // Dark slate charcoal brick
      ctx.fillStyle = '#0f172a'; // Mortar
      ctx.fillRect(0, 0, 512, 512);

      const brickH = 32;
      const brickW = 64;
      const rows = 512 / brickH;

      for (let r = 0; r < rows; r++) {
        const y = r * brickH + 2;
        const offsetX = (r % 2) * (brickW / 2);
        for (let x = -brickW; x < 512 + brickW; x += brickW) {
          const bx = x + offsetX + 2;
          const c = Math.floor(38 + Math.random() * 20);
          ctx.fillStyle = `rgb(${c}, ${c + 4}, ${c + 8})`;
          ctx.fillRect(bx, y, brickW - 4, brickH - 4);
        }
      }
      break;
    }

    case 'brick_terracotta': {
      // Mediterranean terracotta clay brick
      ctx.fillStyle = '#d4d4d8';
      ctx.fillRect(0, 0, 512, 512);

      const brickH = 28;
      const brickW = 72;
      const rows = 512 / brickH;

      for (let r = 0; r < rows; r++) {
        const y = r * brickH + 2;
        const offsetX = (r % 2) * (brickW / 2);
        for (let x = -brickW; x < 512 + brickW; x += brickW) {
          const bx = x + offsetX + 2;
          const rColor = Math.floor(215 + Math.random() * 30);
          const gColor = Math.floor(115 + Math.random() * 25);
          const bColor = Math.floor(75 + Math.random() * 20);
          ctx.fillStyle = `rgb(${rColor}, ${gColor}, ${bColor})`;
          ctx.fillRect(bx, y, brickW - 4, brickH - 4);
        }
      }
      break;
    }

    // ---------------- TILE ----------------
    case 'tile_ceramic': {
      // Modern square 32x32 tiles with dark grout
      ctx.fillStyle = '#94a3b8'; // Grout
      ctx.fillRect(0, 0, 512, 512);

      const tileSize = 64;
      for (let x = 0; x < 512; x += tileSize) {
        for (let y = 0; y < 512; y += tileSize) {
          ctx.fillStyle = '#f8fafc';
          ctx.fillRect(x + 2, y + 2, tileSize - 4, tileSize - 4);
        }
      }
      break;
    }

    case 'tile_subway': {
      // Classic bevelled subway tile
      ctx.fillStyle = '#64748b'; // Grout
      ctx.fillRect(0, 0, 512, 512);

      const th = 32;
      const tw = 64;
      const rows = 512 / th;

      for (let r = 0; r < rows; r++) {
        const y = r * th + 2;
        const offsetX = (r % 2) * (tw / 2);
        for (let x = -tw; x < 512 + tw; x += tw) {
          const bx = x + offsetX + 2;
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(bx, y, tw - 4, th - 4);
          // Highlight edge
          ctx.fillStyle = 'rgba(255,255,255,0.7)';
          ctx.fillRect(bx + 2, y + 2, tw - 8, 2);
        }
      }
      break;
    }

    case 'tile_marble': {
      // Carrara white marble with grey veining
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, 512, 512);

      // Veins
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';
      ctx.lineWidth = 2.5;
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        let vx = Math.random() * 512;
        let vy = 0;
        ctx.moveTo(vx, vy);
        while (vy < 512) {
          vx += Math.random() * 40 - 20;
          vy += Math.random() * 60 + 20;
          ctx.lineTo(vx, vy);
        }
        ctx.stroke();
      }

      // Tile grid
      const s = 128;
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.6)';
      ctx.lineWidth = 2;
      for (let i = 0; i <= 512; i += s) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, 512);
        ctx.moveTo(0, i);
        ctx.lineTo(512, i);
        ctx.stroke();
      }
      break;
    }

    case 'tile_slate': {
      // Natural charcoal slate flagstone tile
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, 512, 512);

      const s = 85;
      for (let x = 0; x < 512; x += s) {
        for (let y = 0; y < 512; y += s) {
          const shade = Math.floor(30 + Math.random() * 20);
          ctx.fillStyle = `rgb(${shade}, ${shade + 4}, ${shade + 8})`;
          ctx.fillRect(x + 2, y + 2, s - 4, s - 4);
        }
      }
      break;
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  textureCache.set(type, texture);
  return texture;
}
