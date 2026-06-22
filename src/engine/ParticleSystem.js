class Particle {
  constructor(x, y, vx, vy, life, size, color, gravity) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.life = life;
    this.maxLife = life;
    this.size = size;
    this.color = color;
    this.gravity = gravity || 400;
    this.dead = false;
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vy += this.gravity * dt;
    this.life -= dt;
    if (this.life <= 0) this.dead = true;
  }

  render(ctx, camera) {
    const alpha = Math.max(0, this.life / this.maxLife);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = this.color;
    const sx = Math.round(this.x - camera.x);
    const sy = Math.round(this.y - camera.y);
    ctx.fillRect(sx, sy, this.size, this.size);
    ctx.globalAlpha = 1;
  }
}

export class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  emit(x, y, count, options = {}) {
    const {
      spreadX = 80,
      spreadY = 50,
      life = 0.5,
      size = 2,
      color = '#aa8866',
      gravity = 400,
    } = options;

    for (let i = 0; i < count; i++) {
      const vx = (Math.random() - 0.5) * spreadX;
      const vy = -Math.random() * spreadY - 30;
      const pLife = life * (0.5 + Math.random() * 0.5);
      const pSize = size * (0.5 + Math.random() * 1.0);
      this.particles.push(new Particle(x, y, vx, vy, pLife, pSize, color, gravity));
    }
  }

  update(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      this.particles[i].update(dt);
      if (this.particles[i].dead) this.particles.splice(i, 1);
    }
  }

  render(ctx, camera) {
    for (const p of this.particles) {
      p.render(ctx, camera);
    }
  }
}
