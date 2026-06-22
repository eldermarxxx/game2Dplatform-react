const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

function isMagenta(r, g, b) {
  const tol = 50;
  return r > 200 && g < 60 && b > 200;
}

async function sliceSpritesheet(inputPath, rowNames) {
  const srcPath = path.resolve(inputPath);
  const { data, info } = await sharp(srcPath)
    .raw()
    .toBuffer({ resolveWithObject: true });

  const w = info.width;
  const h = info.height;
  const pixels = new Uint8Array(data);

  // Foreground mask (1 = non-magenta, 0 = bg)
  const fg = new Uint8Array(w * h);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 3;
      fg[y * w + x] = isMagenta(pixels[i], pixels[i + 1], pixels[i + 2]) ? 0 : 1;
    }

  // Connected component labeling (4-directional) using flood fill
  const labelMap = new Int32Array(w * h);
  labelMap.fill(-1);
  const boxes = []; // index 0 unused; 1-based labels

  let nextLabel = 0;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (!fg[y * w + x]) continue; // bg
      if (labelMap[y * w + x] !== -1) continue; // already labeled

      // New component — flood fill
      nextLabel++;
      const stack = [[x, y]];
      let xMin = x, xMax = x, yMin = y, yMax = y;
      let centroidSumX = 0, centroidSumY = 0, centroidCount = 0;

      while (stack.length) {
        const [cx, cy] = stack.pop();
        const idx = cy * w + cx;
        if (labelMap[idx] !== -1) continue;
        labelMap[idx] = nextLabel;
        if (cx < xMin) xMin = cx;
        if (cx > xMax) xMax = cx;
        if (cy < yMin) yMin = cy;
        if (cy > yMax) yMax = cy;
        centroidSumX += cx;
        centroidSumY += cy;
        centroidCount++;

        // Check 4 neighbors
        if (cx > 0 && fg[cy * w + cx - 1] && labelMap[cy * w + cx - 1] === -1)
          stack.push([cx - 1, cy]);
        if (cx < w - 1 && fg[cy * w + cx + 1] && labelMap[cy * w + cx + 1] === -1)
          stack.push([cx + 1, cy]);
        if (cy > 0 && fg[(cy - 1) * w + cx] && labelMap[(cy - 1) * w + cx] === -1)
          stack.push([cx, cy - 1]);
        if (cy < h - 1 && fg[(cy + 1) * w + cx] && labelMap[(cy + 1) * w + cx] === -1)
          stack.push([cx, cy + 1]);
      }

      boxes.push({
        label: nextLabel,
        x: xMin,
        y: yMin,
        width: xMax - xMin + 1,
        height: yMax - yMin + 1,
        anchorX: Math.round(centroidSumX / centroidCount),
        anchorY: yMin + (yMax - yMin + 1), // bottom edge of bounding box (feet level)
      });
    }
  }

  // Filter tiny boxes (noise)
  const MIN_AREA = 300;
  const MIN_DIM = 10;
  const validBoxes = boxes.filter(b =>
    b.width * b.height >= MIN_AREA &&
    b.width >= MIN_DIM &&
    b.height >= MIN_DIM
  );

  // Sort by Y then X
  validBoxes.sort((a, b) => a.y - b.y || a.x - b.x);

  // Group into rows by Y proximity
  const ROW_Y_TOLERANCE = 60;
  const rows = [];
  for (const box of validBoxes) {
    const centerY = box.y + box.height / 2;

    // Find a row that this box belongs to
    let foundRow = null;
    for (const row of rows) {
      const rowCenterY = (row.yMin + row.yMax) / 2;
      if (Math.abs(centerY - rowCenterY) < ROW_Y_TOLERANCE) {
        foundRow = row;
        break;
      }
    }

    if (foundRow) {
      foundRow.frames.push(box);
      if (box.y < foundRow.yMin) foundRow.yMin = box.y;
      if (box.y + box.height > foundRow.yMax) foundRow.yMax = box.y + box.height;
    } else {
      rows.push({
        yMin: box.y,
        yMax: box.y + box.height,
        frames: [box],
      });
    }
  }

  // Sort frames within each row by X and filter noise (< 10% of largest frame area)
  for (const row of rows) {
    row.frames.sort((a, b) => a.x - b.x);
    const maxArea = Math.max(...row.frames.map(f => f.width * f.height));
    row.frames = row.frames.filter(f => f.width * f.height >= maxArea * 0.1);
  }

  // Remove empty rows
  for (let i = rows.length - 1; i >= 0; i--) {
    if (rows[i].frames.length === 0) rows.splice(i, 1);
  }

  // Sort rows by Y
  rows.sort((a, b) => a.yMin - b.yMin);

  // Build output manifest
  const outputRows = rows.map((row, i) => {
    const name = (rowNames && rowNames[i]) || `row${i}`;
    return {
      name,
      frames: row.frames.map(f => ({
        x: f.x,
        y: f.y,
        width: f.width,
        height: f.height,
        anchorX: f.anchorX,
        anchorY: f.anchorY,
      })),
    };
  });

  const manifest = { rows: outputRows, imageWidth: w, imageHeight: h };

  const parsed = path.parse(inputPath);
  const outPath = path.join(parsed.dir, parsed.name + '.json');
  fs.writeFileSync(outPath, JSON.stringify(manifest, null, 2));
  console.log(`Manifest: ${outPath}`);
  console.log(JSON.stringify(manifest, null, 2));
}

const args = process.argv.slice(2);
if (args.length < 1) {
  console.error('Usage: node scripts/sliceSpritesheet.cjs <imagePath> [rowName1 rowName2 ...]');
  process.exit(1);
}
sliceSpritesheet(args[0], args.slice(1));
