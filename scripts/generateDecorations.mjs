import { suggestWallMountedSpots, suggestFloorStandingSpots, suggestCeilingHangingSpots } from '../src/engine/decorationPlacement.js';
import { TILE_SIZE } from '../src/engine/constants.js';

function add(arr, frameId, col, row, layer) {
  arr.push({ frameId, x: col * TILE_SIZE, y: row * TILE_SIZE, layer });
}

function getPlatformSegments(tm) {
  const groups = {};
  for (let c = 0; c < tm[0].length; c++)
    for (let r = 0; r < tm.length; r++)
      if (tm[r][c] === 2) { if (!groups[r]) groups[r]=[]; groups[r].push(c); }

  const segs = [];
  for (const [row, cols] of Object.entries(groups)) {
    const sorted = [...new Set(cols)].sort((a,b)=>a-b);
    let start = sorted[0], prev = sorted[0];
    for (let i = 1; i <= sorted.length; i++) {
      if (i === sorted.length || sorted[i] !== prev + 1) {
        segs.push({row:parseInt(row),start,end:prev,len:prev-start+1});
        if (i < sorted.length) start = sorted[i];
      }
      if (i < sorted.length) prev = sorted[i];
    }
  }
  return segs;
}

/* ────────────────── Level 1 ────────────────── */
function genLevel1(level) {
  const tm = level.tilemap;
  const upperWallS = suggestWallMountedSpots(tm).filter(s => s.row >= 2 && s.row <= 22);
  const floorS = suggestFloorStandingSpots(tm);
  const ceilS = suggestCeilingHangingSpots(tm);
  const deco = [];

  const PILLARS = [4, 18, 35, 55, 75, 100, 125, 150, 170, 195, 220];

  // Columns on pillar tops (row 23)
  for (let i = 0; i < PILLARS.length; i++) {
    add(deco, i % 2 === 0 ? 23 : 24, PILLARS[i], 23, 'foreground');
  }

  // Torches at row 24 on pillars
  const torchFrames = [75,77,76,78,75,77,76,78,75,77,76];
  for (let i = 0; i < PILLARS.length; i++) {
    add(deco, torchFrames[i % torchFrames.length], PILLARS[i], 24, 'foreground');
  }

  // Stained glass on upper wall (none for level 1 — no wall sections)
  // Banners on upper wall (none for level 1)

  // Arch corners near ladders
  const ladderCols = [50, 155];
  const archFrames = [56, 57];
  for (let i = 0; i < Math.min(archFrames.length, ladderCols.length); i++) {
    const lc = ladderCols[i];
    const leftPillar = [...PILLARS].reverse().find(p => p < lc);
    if (leftPillar !== undefined) add(deco, archFrames[i], leftPillar, 23, 'foreground');
  }

  // Railings (continuous platform segments)
  const segs = getPlatformSegments(tm).sort((a,b)=>a.row-b.row || a.start-b.start);
  const railingFrames = [80, 81, 82];
  let ri = 0;
  for (const seg of segs) {
    if (ri >= railingFrames.length) break;
    add(deco, railingFrames[ri % railingFrames.length], seg.start, seg.row, 'foreground');
    ri++;
    if (ri < railingFrames.length && seg.len > 1) {
      add(deco, railingFrames[ri % railingFrames.length], seg.end, seg.row, 'foreground');
      ri++;
    }
  }

  // Chains
  const chainCandidates = ceilS.filter(s => s.row >= 3 && s.row <= 22);
  const chainFrames = [71, 72, 74, 71, 72];
  for (let i = 0; i < Math.min(chainFrames.length, chainCandidates.length); i++) {
    add(deco, chainFrames[i], chainCandidates[i].col, chainCandidates[i].row, 'foreground');
  }

  // Cage
  const cageSpot = chainCandidates.find(s => s.col >= 100 && s.col <= 115);
  if (cageSpot) add(deco, 73, cageSpot.col, cageSpot.row, 'foreground');

  // Urns on floor
  const urnCandidates = floorS.filter(s => s.row >= 23 && !PILLARS.includes(s.col));
  const urnFrames = [117, 120, 117, 120, 117, 120];
  for (let i = 0; i < Math.min(urnFrames.length, urnCandidates.length); i++) {
    add(deco, urnFrames[i], urnCandidates[i].col, urnCandidates[i].row, 'foreground');
  }

  // Broken glass on upper wall (none for level 1)
  return deco;
}

/* ────────────────── Level 2 ────────────────── */
function genLevel2(level) {
  const tm = level.tilemap;
  const upperWallS = suggestWallMountedSpots(tm).filter(s => s.row >= 2 && s.row <= 22);
  const floorS = suggestFloorStandingSpots(tm);
  const ceilS = suggestCeilingHangingSpots(tm);
  const deco = [];

  const PILLARS = [4, 20, 40, 60, 85, 110, 135, 160, 185, 210, 235, 255];

  // Columns
  for (let i = 0; i < PILLARS.length; i++) {
    add(deco, i % 2 === 0 ? 21 : 22, PILLARS[i], 23, 'foreground');
  }

  // Torches
  const torchFrames = [75,76,77,78,79,75,76,77,78,79,75,76];
  for (let i = 0; i < PILLARS.length; i++) {
    add(deco, torchFrames[i % torchFrames.length], PILLARS[i], 24, 'foreground');
  }

  // Stained glass on wall runs
  const glassCandidates = upperWallS.filter(s => s.row >= 8 && s.row <= 20 && !PILLARS.includes(s.col));
  const glassFrames = [86,88,90,87,91,89,92];
  const usedCols = new Set(PILLARS);
  let gi = 0;
  for (const spot of glassCandidates) {
    if (gi >= glassFrames.length) break;
    if (usedCols.has(spot.col)) continue;
    add(deco, glassFrames[gi], spot.col, spot.row, 'background');
    usedCols.add(spot.col);
    gi++;
  }

  // Banners
  const bannerCandidates = upperWallS.filter(s => s.row >= 10 && s.row <= 21 && !PILLARS.includes(s.col) && !usedCols.has(s.col));
  const bannerFrames = [60,62,61,63,60,62,61,63,60,62];
  for (let i = 0; i < Math.min(bannerFrames.length, bannerCandidates.length); i++) {
    add(deco, bannerFrames[i], bannerCandidates[i].col, bannerCandidates[i].row, 'foreground');
  }

  // Arch corners
  const ladderCols = [55, 130, 200];
  const archFrames = [56, 57, 56];
  let ai = 0;
  for (const lc of ladderCols) {
    if (ai >= archFrames.length) break;
    const leftPillar = [...PILLARS].reverse().find(p => p < lc);
    if (leftPillar !== undefined) { add(deco, archFrames[ai], leftPillar, 23, 'foreground'); ai++; }
  }

  // Railings
  const segs = getPlatformSegments(tm).sort((a,b)=>a.row-b.row || a.start-b.start);
  const railingFrames = [80, 82, 81, 80, 82];
  let ri = 0;
  for (const seg of segs) {
    if (ri >= railingFrames.length) break;
    add(deco, railingFrames[ri % railingFrames.length], seg.start, seg.row, 'foreground');
    ri++;
    if (ri < railingFrames.length && seg.len > 1) {
      add(deco, railingFrames[ri % railingFrames.length], seg.end, seg.row, 'foreground');
      ri++;
    }
  }

  // Chains
  const chainCandidates = ceilS.filter(s => s.row >= 3 && s.row <= 22);
  const chainFrames = [71, 72, 74, 71, 72];
  for (let i = 0; i < Math.min(chainFrames.length, chainCandidates.length); i++) {
    add(deco, chainFrames[i], chainCandidates[i].col, chainCandidates[i].row, 'foreground');
  }

  // Urns
  const urnCandidates = floorS.filter(s => s.row >= 23 && !PILLARS.includes(s.col));
  const urnFrames = [117, 120, 117, 120, 117, 120];
  for (let i = 0; i < Math.min(urnFrames.length, urnCandidates.length); i++) {
    add(deco, urnFrames[i], urnCandidates[i].col, urnCandidates[i].row, 'foreground');
  }

  // Statues on elevated floor (wall section rows 13-15)
  const elevated = floorS.filter(s => s.row < 23 && s.row >= 12 && s.col >= 56 && s.col <= 130);
  const statueFrames = [116, 118, 119, 115];
  for (let i = 0; i < Math.min(statueFrames.length, elevated.length); i++) {
    add(deco, statueFrames[i], elevated[i].col, elevated[i].row, 'foreground');
  }

  // Broken glass on walls
  const bgWall = upperWallS.filter(s => s.row >= 8 && s.row <= 21 && !PILLARS.includes(s.col) && !usedCols.has(s.col));
  const glassBroken = [102, 104, 107, 109];
  for (let i = 0; i < Math.min(glassBroken.length, bgWall.length); i++) {
    add(deco, glassBroken[i], bgWall[i].col, bgWall[i].row, 'background');
  }

  return deco;
}

/* ────────────────── Level 3 ────────────────── */
function genLevel3(level) {
  const tm = level.tilemap;
  const upperWallS = suggestWallMountedSpots(tm).filter(s => s.row >= 2 && s.row <= 22);
  const floorS = suggestFloorStandingSpots(tm);
  const ceilS = suggestCeilingHangingSpots(tm);
  const deco = [];

  const PILLARS = [4, 22, 45, 70, 95, 120, 145, 170, 195, 215];

  // Columns
  for (let i = 0; i < PILLARS.length; i++) {
    add(deco, i % 2 === 0 ? 23 : 24, PILLARS[i], 23, 'foreground');
  }

  // Torches
  const torchFrames = [75,76,77,78,75,76,77,78,75,76,77,78];
  for (let i = 0; i < PILLARS.length; i++) {
    add(deco, torchFrames[i % torchFrames.length], PILLARS[i], 24, 'foreground');
  }

  // Stained glass
  const glassCandidates = upperWallS.filter(s => s.row >= 8 && s.row <= 20 && !PILLARS.includes(s.col));
  const glassFrames = [86,88,90,87,91,89,92,86,88,90,87];
  const usedCols = new Set(PILLARS);
  let gi = 0;
  for (const spot of glassCandidates) {
    if (gi >= glassFrames.length) break;
    if (usedCols.has(spot.col)) continue;
    add(deco, glassFrames[gi], spot.col, spot.row, 'background');
    usedCols.add(spot.col);
    gi++;
  }

  // Banners
  const bannerCandidates = upperWallS.filter(s => s.row >= 10 && s.row <= 21 && !PILLARS.includes(s.col) && !usedCols.has(s.col));
  const bannerFrames = [62,60,63,61,60,62,63,61];
  for (let i = 0; i < Math.min(bannerFrames.length, bannerCandidates.length); i++) {
    add(deco, bannerFrames[i], bannerCandidates[i].col, bannerCandidates[i].row, 'foreground');
  }

  // Arch corners
  const ladderCols = [35, 50, 90, 160, 195];
  const archFrames = [54, 55, 56, 57];
  let ai = 0;
  for (const lc of ladderCols) {
    if (ai >= archFrames.length) break;
    const leftPillar = [...PILLARS].reverse().find(p => p < lc);
    if (leftPillar !== undefined) { add(deco, archFrames[ai], leftPillar, 23, 'foreground'); ai++; }
  }

  // Railings
  const segs = getPlatformSegments(tm).sort((a,b)=>a.row-b.row || a.start-b.start);
  const railingFrames = [80, 81, 82];
  let ri = 0;
  for (const seg of segs) {
    if (ri >= railingFrames.length) break;
    add(deco, railingFrames[ri % railingFrames.length], seg.start, seg.row, 'foreground');
    ri++;
    if (ri < railingFrames.length && seg.len > 1) {
      add(deco, railingFrames[ri % railingFrames.length], seg.end, seg.row, 'foreground');
      ri++;
    }
  }

  // Chains
  const chainCandidates = ceilS.filter(s => s.row >= 3 && s.row <= 22 && !PILLARS.includes(s.col));
  const chainFrames = [71, 72, 74, 73, 71, 72];
  for (let i = 0; i < Math.min(chainFrames.length, chainCandidates.length); i++) {
    add(deco, chainFrames[i], chainCandidates[i].col, chainCandidates[i].row, 'foreground');
  }

  // Urns
  const urnCandidates = floorS.filter(s => s.row >= 23 && !PILLARS.includes(s.col));
  const urnFrames = [117, 120, 117, 120, 117];
  for (let i = 0; i < Math.min(urnFrames.length, urnCandidates.length); i++) {
    add(deco, urnFrames[i], urnCandidates[i].col, urnCandidates[i].row, 'foreground');
  }

  // Statues on elevated
  const elevated = floorS.filter(s => s.row < 23 && s.row >= 6 && !PILLARS.includes(s.col));
  const statueFrames = [116, 119, 115, 118, 116];
  for (let i = 0; i < Math.min(statueFrames.length, elevated.length); i++) {
    add(deco, statueFrames[i], elevated[i].col, elevated[i].row, 'foreground');
  }

  // Broken glass
  const bgWall = upperWallS.filter(s => s.row >= 8 && s.row <= 21 && !PILLARS.includes(s.col) && !usedCols.has(s.col));
  const glassBroken = [102, 105, 108, 103, 106, 110, 104, 107];
  for (let i = 0; i < Math.min(glassBroken.length, bgWall.length); i++) {
    add(deco, glassBroken[i], bgWall[i].col, bgWall[i].row, 'background');
  }

  // Candelabras
  const candelSpots = upperWallS.filter(s => s.row >= 10 && s.row <= 16 && !PILLARS.includes(s.col) && !usedCols.has(s.col));
  for (let i = 0; i < 6 && i < candelSpots.length; i++) {
    add(deco, 125, candelSpots[i].col, candelSpots[i].row, 'foreground');
  }

  // Small wall torches
  const smSpots = upperWallS.filter(s => s.row >= 7 && s.row <= 16 && !PILLARS.includes(s.col) && !usedCols.has(s.col));
  const smFrames = [126, 127];
  for (let i = 0; i < Math.min(smFrames.length, smSpots.length); i++) {
    add(deco, smFrames[i], smSpots[i].col, smSpots[i].row, 'foreground');
  }

  return deco;
}

/* ────────────────── Main ────────────────── */
import { level1 } from '../src/levels/level1.js';
import { level2 } from '../src/levels/level2.js';
import { level3 } from '../src/levels/level3.js';

function formatDeco(arr) {
  return arr.map(d => `    { frameId: ${d.frameId}, x: ${d.x}, y: ${d.y}, layer: '${d.layer}' }`).join(',\n');
}

const l1 = genLevel1(level1);
const l2 = genLevel2(level2);
const l3 = genLevel3(level3);

console.log('// Level 1');
console.log(formatDeco(l1));
console.log(`\n// Count: ${l1.length}`);
console.log('\n// Level 2');
console.log(formatDeco(l2));
console.log(`\n// Count: ${l2.length}`);
console.log('\n// Level 3');
console.log(formatDeco(l3));
console.log(`\n// Count: ${l3.length}`);
