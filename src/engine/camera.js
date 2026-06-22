import { CANVAS_WIDTH, CANVAS_HEIGHT } from './constants.js';

export class Camera {
  constructor(levelWidth, levelHeight) {
    this.x = 0;
    this.y = 0;
    this.shakeX = 0;
    this.shakeY = 0;
    this.levelWidth = levelWidth;
    this.levelHeight = levelHeight;
  }

  follow(target, dt) {
    const targetX = target.x - CANVAS_WIDTH / 2 + target.width / 2;
    const targetY = target.y - CANVAS_HEIGHT / 2 + target.height / 2;

    const smoothing = 8;
    this.x += (targetX - this.x) * Math.min(1, smoothing * dt);
    this.y += (targetY - this.y) * Math.min(1, smoothing * dt);

    this.x = Math.max(0, Math.min(this.x, this.levelWidth - CANVAS_WIDTH));
    this.y = Math.max(0, Math.min(this.y, this.levelHeight - CANVAS_HEIGHT));
  }
}
