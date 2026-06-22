export class Spritesheet {
  constructor(image, manifest) {
    this.image = image;
    this.manifest = manifest;
    this._rows = manifest.rows || null;
    this._frames = manifest.frames || null;
  }

  get isStateBased() {
    return !!this._rows;
  }

  get isTileBased() {
    return !!this._frames;
  }

  getStateFrames(stateName) {
    if (!this._rows) return null;
    const row = this._rows.find(r => r.name === stateName);
    return row ? row.frames : null;
  }

  getFrameCount(stateName) {
    const frames = this.getStateFrames(stateName);
    return frames ? frames.length : 0;
  }

  draw(ctx, stateName, frameIndex, feetX, feetY, flipX = false, scale = 1) {
    if (!this.image) return;

    const frames = this.getStateFrames(stateName);
    if (!frames) return;

    const frame = frames[frameIndex];
    if (!frame) return;

    const { x: fx, y: fy, width: fw, height: fh, anchorX, anchorY, anchorOffsetX = 0, anchorOffsetY = 0 } = frame;
    const effAnchorX = anchorX + anchorOffsetX;
    const effAnchorY = anchorY + anchorOffsetY;
    const dw = fw * scale;
    const dh = fh * scale;

    if (flipX) {
      ctx.save();
      ctx.translate(feetX, feetY);
      ctx.scale(-1, 1);
      ctx.drawImage(this.image, fx, fy, fw, fh, (fx - effAnchorX) * scale, (fy - effAnchorY) * scale, dw, dh);
      ctx.restore();
    } else {
      const drawX = feetX - (effAnchorX - fx) * scale;
      const drawY = feetY - (effAnchorY - fy) * scale;
      ctx.drawImage(this.image, fx, fy, fw, fh, drawX, drawY, dw, dh);
    }
  }

  drawTile(ctx, frameId, x, y, scale = 1) {
    if (!this.image || !this._frames) return;

    const frame = this._frames[frameId];
    if (!frame) return;

    const dw = frame.w * scale;
    const dh = frame.h * scale;
    ctx.drawImage(this.image, frame.x, frame.y, frame.w, frame.h, x, y, dw, dh);
  }
}
