class InputManager {
  constructor() {
    this.keys = {};
    this.justPressed = {};
    this._onKeyDown = this._onKeyDown.bind(this);
    this._onKeyUp = this._onKeyUp.bind(this);
  }

  init() {
    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
  }

  destroy() {
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup', this._onKeyUp);
  }

  _onKeyDown(e) {
    if (!this.keys[e.code]) {
      this.justPressed[e.code] = true;
    }
    this.keys[e.code] = true;
  }

  _onKeyUp(e) {
    this.keys[e.code] = false;
  }

  isDown(code) {
    return !!this.keys[code];
  }

  wasPressed(code) {
    return !!this.justPressed[code];
  }

  clearJustPressed() {
    this.justPressed = {};
  }
}

export const input = new InputManager();
