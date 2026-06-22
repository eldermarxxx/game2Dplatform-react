import { TILE_SOLID, TILE_SIZE } from './constants.js';

const WALL_FRAMES = [0, 1, 2, 3, 4, 5, 6, 7];

export class TileRenderer {
  constructor(spritesheet, tileToFrame) {
    this.spritesheet = spritesheet;
    this.tileToFrame = tileToFrame;
  }

  draw(ctx, tileType, x, y, col, row) {
    let frameId;
    if (tileType === TILE_SOLID && col !== undefined && row !== undefined) {
      const idx = ((col * 7 + row * 13) % WALL_FRAMES.length);
      frameId = WALL_FRAMES[idx];
    } else {
      frameId = this.tileToFrame[tileType];
    }
    if (frameId === undefined) return;

    if (this.spritesheet) {
      this.spritesheet.drawTile(ctx, frameId, x, y, TILE_SIZE / 84);
    }
  }

  drawFrame(ctx, frameId, x, y) {
    if (this.spritesheet && frameId !== undefined) {
      this.spritesheet.drawTile(ctx, frameId, x, y, TILE_SIZE / 84);
    }
  }

  get hasSpritesheet() {
    return this.spritesheet !== null && this.spritesheet !== undefined;
  }
}
