// Tactical FPS Input & PointerLock Handler
export class InputManager {
  constructor() {
    this.keys = {};
    this.mouseButtons = {};
    this.mouseDeltaX = 0;
    this.mouseDeltaY = 0;
    this.isPointerLocked = false;
    this.sensitivity = 0.0022;

    // Action triggers (single-frame pulses)
    this.justPressed = {};

    this.initListeners();
  }

  initListeners() {
    window.addEventListener('keydown', (e) => {
      const code = e.code;
      if (!this.keys[code]) {
        this.justPressed[code] = true;
      }
      this.keys[code] = true;

      // Prevent scrolling on Space
      if (code === 'Space') {
        e.preventDefault();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    window.addEventListener('mousedown', (e) => {
      if (!this.isPointerLocked) return;
      if (e.button === 0) {
        if (!this.mouseButtons[0]) this.justPressed['LMB'] = true;
        this.mouseButtons[0] = true;
      }
      if (e.button === 2) {
        if (!this.mouseButtons[2]) this.justPressed['RMB'] = true;
        this.mouseButtons[2] = true;
      }
    });

    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) this.mouseButtons[0] = false;
      if (e.button === 2) this.mouseButtons[2] = false;
    });

    window.addEventListener('contextmenu', (e) => {
      e.preventDefault(); // Prevent right-click context menu in game
    });

    document.addEventListener('mousemove', (e) => {
      if (this.isPointerLocked) {
        this.mouseDeltaX += e.movementX || 0;
        this.mouseDeltaY += e.movementY || 0;
      }
    });

    document.addEventListener('pointerlockchange', () => {
      this.isPointerLocked = (document.pointerLockElement === document.body || document.pointerLockElement === document.getElementById('game-container'));
    });
  }

  requestLock() {
    const target = document.getElementById('game-container') || document.body;
    target.requestPointerLock();
  }

  exitLock() {
    if (document.exitPointerLock) {
      document.exitPointerLock();
    }
  }

  // Check if key is currently held
  isKeyDown(code) {
    return !!this.keys[code];
  }

  // Check if action was just pressed this frame
  isJustPressed(actionOrKey) {
    return !!this.justPressed[actionOrKey];
  }

  // Get mouse delta and reset accumulated values
  consumeMouseDelta() {
    const delta = {
      x: this.mouseDeltaX * this.sensitivity,
      y: this.mouseDeltaY * this.sensitivity
    };
    this.mouseDeltaX = 0;
    this.mouseDeltaY = 0;
    return delta;
  }

  // Clear single-frame pulses at end of frame
  endFrame() {
    this.justPressed = {};
  }
}
