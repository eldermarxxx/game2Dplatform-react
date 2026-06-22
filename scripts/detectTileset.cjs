const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const INPUT = process.argv[2] || 'src/assets/sprites/tileset.png';
const OUTPUT = INPUT.replace(/\.\w+$/, '.json');

function isBg(r, g, b, tol = 40) {
  return r > 255 - tol && g < 60 + tol && b > 255 - tol;
}

async function detect() {
  const { data, info } = await sharp(INPUT).raw().toBuffer({ resolveWithObject: true });
  const w = info.width, h = info.height;
  const pixels = new Uint8Array(data);
  const stride = w * 3;

  // --- Detect full-height magenta column boundaries ---
  const colIsBg = [];
  for (let x = 0; x < w; x++) {
    let allBg = true;
    let bgCount = 0;
    for (let y = 0; y < h; y++) {
      const i = (y * w + x) * 3;
      if (isBg(pixels[i], pixels[i+1], pixels[i+2])) bgCount++;
    }
    colIsBg.push(bgCount > h * 0.9);
  }

  const colRuns = [];
  let cStart = null;
  for (let x = 0; x <= w; x++) {
    if (x < w && colIsBg[x]) {
      if (cStart === null) cStart = x;
    } else {
      if (cStart !== null) {
        colRuns.push({ start: cStart, end: x - 1, w: x - cStart });
        cStart = null;
      }
    }
  }

  // --- Detect full-width magenta row boundaries ---
  const rowIsBg = [];
  for (let y = 0; y < h; y++) {
    let bgCount = 0;
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 3;
      if (isBg(pixels[i], pixels[i+1], pixels[i+2])) bgCount++;
    }
    rowIsBg.push(bgCount > w * 0.9);
  }

  const rowRuns = [];
  let rStart = null;
  for (let y = 0; y <= h; y++) {
    if (y < h && rowIsBg[y]) {
      if (rStart === null) rStart = y;
    } else {
      if (rStart !== null) {
        rowRuns.push({ start: rStart, end: y - 1, h: y - rStart });
        rStart = null;
      }
    }
  }

  // --- Content regions = between boundary runs ---
  const tileCols = []; // { x, w }
  for (let i = 0; i < colRuns.length - 1; i++) {
    const x = colRuns[i].end + 1;
    const ww = colRuns[i + 1].start - x;
    if (ww > 0) tileCols.push({ x, w: ww });
  }

  const tileRows = []; // { y, h }
  for (let i = 0; i < rowRuns.length - 1; i++) {
    const y = rowRuns[i].end + 1;
    const hh = rowRuns[i + 1].start - y;
    if (hh > 0) tileRows.push({ y, h: hh });
  }

  // --- Generate frames ---
  let id = 0;
  const frames = [];
  for (const row of tileRows) {
    for (const col of tileCols) {
      frames.push({
        id: id++,
        x: col.x,
        y: row.y,
        w: col.w,
        h: row.h
      });
    }
  }

  const manifest = {
    frames,
    columns: tileCols.length,
    rows: tileRows.length,
    totalTiles: frames.length,
    imageWidth: w,
    imageHeight: h
  };

  fs.writeFileSync(OUTPUT, JSON.stringify(manifest, null, 2));
  console.log(`Written ${OUTPUT}`);
  console.log(`Grid: ${tileCols.length} cols × ${tileRows.length} rows = ${frames.length} tiles`);
  console.log(`Column widths: ${[...new Set(tileCols.map(c => c.w))].sort((a,b)=>a-b)}`);
  console.log(`Row heights: ${tileRows.map(r => r.h)}`);
}

detect().catch(console.error);
