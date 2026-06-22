import { Spritesheet } from './Spritesheet.js';

function isColorkey(r, g, b, a) {
  // Magenta JPG bg: R~170-180, G~40-50, B~120-130 (compressed from pure magenta)
  if (r > 160 && g < 70 && b > 110) return true;
  // Dark purple fill (colorkey): R~15-45, G~10-35, B~25-55, very low saturation
  if (a > 10 && r >= 15 && r <= 50 && g >= 8 && g <= 40 && b >= 20 && b <= 60) {
    const avg = (r + g + b) / 3;
    if (Math.abs(r - g) < 20 && Math.abs(g - b) < 25) return true;
  }
  return false;
}

function processColorkey(img) {
  const c = document.createElement('canvas');
  c.width = img.naturalWidth || img.width;
  c.height = img.naturalHeight || img.height;
  const ctx = c.getContext('2d');
  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, c.width, c.height);
  const data = imageData.data;
  let modified = false;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
    if (isColorkey(r, g, b, a)) {
      data[i + 3] = 0;
      modified = true;
    }
  }
  if (modified) {
    ctx.putImageData(imageData, 0, 0);
  }
  return c;
}

function loadImage(src) {
  return new Promise((resolve) => {
    if (!src) {
      resolve(null);
      return;
    }
    const img = new Image();
    img.onload = () => {
      const processed = processColorkey(img);
      resolve(processed);
    };
    img.onerror = () => {
      console.warn(`Failed to load image: ${src}`);
      resolve(null);
    };
    img.src = src;
  });
}

export class AssetManager {
  constructor(config) {
    this.config = config;
    this.spritesheets = {};
    this.loaded = false;
  }

  async load() {
    const entries = Object.entries(this.config);
    const images = await Promise.all(
      entries.map(([, cfg]) => loadImage(cfg.src))
    );

    for (let i = 0; i < entries.length; i++) {
      const [key, cfg] = entries[i];
      const img = images[i];
      if (img && cfg.manifest) {
        this.spritesheets[key] = new Spritesheet(img, cfg.manifest);
      } else {
        this.spritesheets[key] = null;
      }
    }

    this.loaded = true;
    return this.spritesheets;
  }

  get(key) {
    return this.spritesheets[key] || null;
  }
}
