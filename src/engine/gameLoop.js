const MAX_DT = 1 / 20;

export class GameLoop {
  constructor() {
    this.updateFn = null;
    this.renderFn = null;
    this._running = false;
    this._lastTime = 0;
    this._rafId = null;
    this._boundTick = this._tick.bind(this);
  }

  start(updateFn, renderFn) {
    this.updateFn = updateFn;
    this.renderFn = renderFn;
    this._running = true;
    this._lastTime = performance.now();
    this._rafId = requestAnimationFrame(this._boundTick);
  }

  stop() {
    this._running = false;
    if (this._rafId) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
  }

  _tick(now) {
    if (!this._running) return;
    const dt = Math.min((now - this._lastTime) / 1000, MAX_DT);
    this._lastTime = now;

    this.updateFn(dt);
    this.renderFn(dt);

    this._rafId = requestAnimationFrame(this._boundTick);
  }
}
