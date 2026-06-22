const CACHE_SIZE = 120;

class FogCloud {
  constructor(canvasW, canvasH) {
    this.x = Math.random() * canvasW;
    this.y = Math.random() * canvasH * 0.8 + canvasH * 0.1;
    this.radius = 80 + Math.random() * 160;
    this.speedX = 4 + Math.random() * 8;
    this.baseY = this.y;
    this.breathAmp = 4 + Math.random() * 10;
    this.breathSpeed = 0.3 + Math.random() * 0.4;
    this.phase = Math.random() * Math.PI * 2;
    this.alpha = 0.04 + Math.random() * 0.08;
    this.age = Math.random() * 100;
    this.cache = null;
  }

  ensureCache(ctx) {
    if (this.cache) return;
    const r = this.radius;
    const offscreen = document.createElement('canvas');
    offscreen.width = r * 2;
    offscreen.height = r * 2;
    const octx = offscreen.getContext('2d');
    const grad = octx.createRadialGradient(r, r, 0, r, r, r);
    grad.addColorStop(0, 'rgba(140,160,180,0.25)');
    grad.addColorStop(0.4, 'rgba(120,140,160,0.15)');
    grad.addColorStop(0.7, 'rgba(100,120,140,0.08)');
    grad.addColorStop(1, 'rgba(80,100,120,0)');
    octx.fillStyle = grad;
    octx.fillRect(0, 0, r * 2, r * 2);
    this.cache = offscreen;
  }

  update(dt, canvasW, canvasH) {
    this.age += dt;
    this.x += this.speedX * dt;
    this.y = this.baseY + Math.sin(this.age * this.breathSpeed + this.phase) * this.breathAmp;
    if (this.x > canvasW + this.radius) {
      this.x = -this.radius;
      this.y = Math.random() * canvasH * 0.8 + canvasH * 0.1;
      this.baseY = this.y;
      this.age = 0;
      this.radius = 80 + Math.random() * 160;
      this.alpha = 0.04 + Math.random() * 0.08;
    }
    if (this.x < -this.radius - 50) {
      this.x = canvasW + this.radius;
    }
  }

  render(ctx) {
    if (!this.cache) return;
    ctx.globalAlpha = this.alpha;
    ctx.drawImage(
      this.cache,
      Math.round(this.x - this.radius),
      Math.round(this.y - this.radius),
    );
    ctx.globalAlpha = 1;
  }
}

export class FogSystem {
  constructor(canvasW, canvasH, density = 0.5) {
    this.canvasW = canvasW;
    this.canvasH = canvasH;
    this.clouds = [];
    this.setDensity(density);
  }

  setDensity(density) {
    const count = Math.round(6 + density * 14);
    while (this.clouds.length < count) {
      this.clouds.push(new FogCloud(this.canvasW, this.canvasH));
    }
    if (this.clouds.length > count) {
      this.clouds.length = count;
    }
  }

  ensureCaches(ctx) {
    for (const c of this.clouds) c.ensureCache(ctx);
  }

  update(dt) {
    for (const c of this.clouds) c.update(dt, this.canvasW, this.canvasH);
  }

  render(ctx) {
    for (const c of this.clouds) c.render(ctx);
  }
}
