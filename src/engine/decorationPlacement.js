import { TILE_SIZE, TILE_SOLID, TILE_PLATFORM, TILE_LADDER } from './constants.js';

const EXCLUDED_CATEGORIES = new Set(['parallax_far', 'empty', 'unknown']);

const FRAME_TO_CATEGORY = {
  23: 'wall_mounted', 24: 'wall_mounted',
  54: 'wall_mounted', 55: 'wall_mounted', 56: 'wall_mounted', 57: 'wall_mounted',
  60: 'wall_mounted', 61: 'wall_mounted', 62: 'wall_mounted', 63: 'wall_mounted',
  75: 'wall_mounted', 76: 'wall_mounted', 77: 'wall_mounted', 78: 'wall_mounted', 79: 'wall_mounted',
  80: 'wall_mounted', 81: 'wall_mounted', 82: 'wall_mounted',
  86: 'wall_mounted', 87: 'wall_mounted', 88: 'wall_mounted', 89: 'wall_mounted',
  90: 'wall_mounted', 91: 'wall_mounted', 92: 'wall_mounted', 93: 'wall_mounted', 94: 'wall_mounted', 95: 'wall_mounted',
  96: 'wall_mounted', 97: 'wall_mounted', 98: 'wall_mounted', 99: 'wall_mounted', 100: 'wall_mounted', 101: 'wall_mounted',
  102: 'wall_mounted', 103: 'wall_mounted', 104: 'wall_mounted', 105: 'wall_mounted',
  106: 'wall_mounted', 107: 'wall_mounted', 108: 'wall_mounted', 109: 'wall_mounted', 110: 'wall_mounted', 111: 'wall_mounted',
  112: 'wall_mounted', 113: 'wall_mounted', 114: 'wall_mounted',
  125: 'wall_mounted', 126: 'wall_mounted', 127: 'wall_mounted',
  28: 'wall_mounted', 29: 'wall_mounted', 30: 'wall_mounted', 31: 'wall_mounted',
  122: 'wall_mounted', 123: 'wall_mounted', 124: 'wall_mounted',

  115: 'floor_standing', 116: 'floor_standing', 117: 'floor_standing',
  118: 'floor_standing', 119: 'floor_standing', 120: 'floor_standing', 121: 'floor_standing',

  71: 'ceiling_hanging', 72: 'ceiling_hanging',
  73: 'ceiling_hanging', 74: 'ceiling_hanging',

  8: 'parallax_far', 9: 'parallax_far', 10: 'parallax_far',
  11: 'parallax_far', 12: 'parallax_far', 13: 'parallax_far', 14: 'parallax_far', 15: 'parallax_far',
};

const STAINED_GLASS = new Set([86, 87, 88, 89, 90, 91, 92, 93, 94, 95]);

function getCategory(frameId) {
  return FRAME_TO_CATEGORY[frameId] || 'unknown';
}

function pxToTile(x, y) {
  return { col: Math.floor(x / TILE_SIZE), row: Math.floor(y / TILE_SIZE) };
}

function getTile(tilemap, col, row) {
  if (row < 0 || row >= tilemap.length) return null;
  if (col < 0 || col >= tilemap[0].length) return null;
  return tilemap[row][col];
}

function isSolid(tilemap, col, row) {
  const t = getTile(tilemap, col, row);
  return t === TILE_SOLID || t === TILE_PLATFORM;
}

function verticalRunLength(tilemap, col, startRow, dir) {
  let len = 0;
  let r = startRow;
  while (r >= 0 && r < tilemap.length && isSolid(tilemap, col, r)) {
    len++;
    r += dir;
  }
  return len;
}

function horizontalRunLength(tilemap, row, startCol, dir) {
  let len = 0;
  let c = startCol;
  while (c >= 0 && c < tilemap[0].length && isSolid(tilemap, c, row)) {
    len++;
    c += dir;
  }
  return len;
}

export function validateDecoration(dec, tilemap) {
  const { frameId, x, y } = dec;
  const { col, row } = pxToTile(x, y);
  const category = getCategory(frameId);
  const errors = [];

  if (EXCLUDED_CATEGORIES.has(category)) {
    return { valid: true, errors: [] };
  }

  if (category === 'wall_mounted') {
    const behind = getTile(tilemap, col, row);
    if (behind === null) {
      errors.push(`fora do tilemap (col=${col}, row=${row})`);
    } else if (!isSolid(tilemap, col, row)) {
      errors.push(`categoria=${category}: tile atrás (${col},${row}) = ${behind}, esperado sólido (1 ou 2)`);
    }
    if (STAINED_GLASS.has(frameId)) {
      const upLen = verticalRunLength(tilemap, col, row, -1);
      const downLen = verticalRunLength(tilemap, col, row + 1, 1);
      const totalWall = upLen + 1 + downLen;
      if (totalWall < 3) {
        errors.push(`vitral frame ${frameId}: parede vertical contínua tem ${totalWall} tiles, mínimo 3`);
      }
    }
  }

  if (category === 'floor_standing') {
    const below = getTile(tilemap, col, row + 1);
    if (below === null) {
      errors.push(`fora do tilemap (col=${col}, row=${row + 1})`);
    } else if (!isSolid(tilemap, col, row + 1)) {
      errors.push(`categoria=${category}: tile abaixo (${col},${row + 1}) = ${below}, esperado sólido (1 ou 2)`);
    }
    const leftRun = horizontalRunLength(tilemap, row + 1, col, -1);
    const rightRun = horizontalRunLength(tilemap, row + 1, col + 1, 1);
    const totalFloor = leftRun + 1 + rightRun;
    if (totalFloor < 2) {
      errors.push(`categoria=${category}: chão horizontal tem ${totalFloor} tiles, mínimo 2`);
    }
  }

  if (category === 'ceiling_hanging') {
    const above = getTile(tilemap, col, row - 1);
    if (above === null) {
      errors.push(`fora do tilemap (col=${col}, row=${row - 1})`);
    } else if (!isSolid(tilemap, col, row - 1)) {
      errors.push(`categoria=${category}: tile acima (${col},${row - 1}) = ${above}, esperado sólido (1 ou 2)`);
    }
  }

  return { valid: errors.length === 0, errors };
}

export function validateAllDecorations(levels) {
  const results = [];
  for (let i = 0; i < levels.length; i++) {
    const level = levels[i];
    const tilemap = level.tilemap;
    for (const dec of level.decorations) {
      const { col, row } = pxToTile(dec.x, dec.y);
      const result = validateDecoration(dec, tilemap);
      if (!result.valid) {
        results.push({
          level: i + 1,
          name: level.name,
          frameId: dec.frameId,
          x: dec.x,
          y: dec.y,
          col,
          row,
          layer: dec.layer,
          errors: result.errors,
        });
      }
    }
  }
  return results;
}

export function suggestWallMountedSpots(tilemap, frameId) {
  const spots = [];
  const isGlass = STAINED_GLASS.has(frameId);
  const minHeight = isGlass ? 3 : 2;

  for (let col = 0; col < tilemap[0].length; col++) {
    let runStart = -1;
    for (let row = 0; row < tilemap.length; row++) {
      if (isSolid(tilemap, col, row)) {
        if (runStart === -1) runStart = row;
      } else {
        if (runStart !== -1) {
          const runLen = row - runStart;
          if (runLen >= minHeight) {
            const midRow = runStart + Math.floor(runLen / 2);
            if (!isGlass || runLen >= 3) {
              spots.push({ col, row: midRow });
            }
          }
          runStart = -1;
        }
      }
    }
    if (runStart !== -1) {
      const runLen = tilemap.length - runStart;
      if (runLen >= minHeight) {
        const midRow = runStart + Math.floor(runLen / 2);
        if (!isGlass || runLen >= 3) {
          spots.push({ col, row: midRow });
        }
      }
    }
  }
  return spots;
}

export function suggestFloorStandingSpots(tilemap) {
  const spots = [];
  const rows = tilemap.length;
  const cols = tilemap[0].length;

  for (let col = 0; col < cols; col++) {
    for (let row = 0; row < rows - 1; row++) {
      if (!isSolid(tilemap, col, row) && isSolid(tilemap, col, row + 1)) {
        const leftRun = horizontalRunLength(tilemap, row + 1, col, -1);
        const rightRun = horizontalRunLength(tilemap, row + 1, col + 1, 1);
        if (leftRun + 1 + rightRun >= 2) {
          spots.push({ col, row });
        }
      }
    }
  }
  return spots;
}

export function suggestCeilingHangingSpots(tilemap) {
  const spots = [];
  const cols = tilemap[0].length;
  const rows = tilemap.length;

  for (let col = 0; col < cols; col++) {
    for (let row = 0; row < rows; row++) {
      if (isSolid(tilemap, col, row)) {
        if (row < rows - 1 && !isSolid(tilemap, col, row + 1)) {
          spots.push({ col, row: row + 1 });
        }
      }
    }
  }
  return spots;
}

export function spacingOk(chosen, newSpot, minDist) {
  for (const s of chosen) {
    if (Math.abs(s.col - newSpot.col) + Math.abs(s.row - newSpot.row) < minDist) return false;
  }
  return true;
}
