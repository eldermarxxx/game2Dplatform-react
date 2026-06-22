const sharp = require('sharp');
const fs = require('fs');

const files = [
  { img: 'src/assets/sprites/heroi.png',    manifest: null, scale: 1.0 },
  { img: 'src/assets/sprites/enemies.png',  manifest: null, scale: 1.0 },
  { img: 'src/assets/sprites/tileset.png',  manifest: null, scale: 1.0 },
];

function isMagenta(r, g, b) {
  return r > 120 && g < 110 && b > 120;
}

async function processImage(inputPath, scale) {
  const { data, info } = await sharp(inputPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const pixels = Buffer.from(data);

  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    if (isMagenta(r, g, b)) {
      pixels[i + 3] = 0;
    }
  }

  let pipeline = sharp(pixels, {
    raw: { width: info.width, height: info.height, channels: 4 },
  });

  if (scale !== 1.0) {
    pipeline = pipeline.resize(Math.round(info.width * scale), Math.round(info.height * scale));
  }

  const tmp = inputPath.replace('.png', '.tmp.png');
  await pipeline.png().toFile(tmp);
  fs.renameSync(tmp, inputPath);
  console.log(`  image: ${inputPath}${scale !== 1.0 ? ' (scaled ' + scale + 'x)' : ''}`);
}

function scaleManifest(manifestPath, scale) {
  if (!manifestPath || scale === 1.0) return;

  const raw = fs.readFileSync(manifestPath, 'utf-8');
  const json = JSON.parse(raw);

  function scaleFrame(f) {
    f.x = Math.round(f.x * scale);
    f.y = Math.round(f.y * scale);
    f.width = Math.round(f.width * scale);
    f.height = Math.round(f.height * scale);
    if (f.anchorX != null) f.anchorX = Math.round(f.anchorX * scale);
    if (f.anchorY != null) f.anchorY = Math.round(f.anchorY * scale);
    if (f.w != null) f.w = Math.round(f.w * scale);
    if (f.h != null) f.h = Math.round(f.h * scale);
  }

  if (json.rows) {
    for (const row of json.rows) {
      for (const f of row.frames) scaleFrame(f);
    }
  }
  if (json.frames) {
    for (const f of json.frames) scaleFrame(f);
  }

  if (json.imageWidth != null) json.imageWidth = Math.round(json.imageWidth * scale);
  if (json.imageHeight != null) json.imageHeight = Math.round(json.imageHeight * scale);

  fs.writeFileSync(manifestPath, JSON.stringify(json, null, 2));
  console.log(`  manifest: ${manifestPath}`);
}

async function main() {
  for (const f of files) {
    console.log(`Processing ${f.img}:`);
    await processImage(f.img, f.scale);
    scaleManifest(f.manifest, f.scale);
  }
  console.log('Done!');
}

main().catch(console.error);
