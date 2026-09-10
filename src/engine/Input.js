// Tactical FPS Input & PointerLock Handler with Universal Hardware Trigger Support
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
    const handleKeyDown = (e) => {
      const code = e.code;
      const key = e.key;
      const keyCode = e.keyCode || e.which;

      const isFirstPress = !this.keys[code] && !e.repeat;

      if (code) this.keys[code] = true;

      // Check if this is a hardware trigger / firing key:
      // Spacebar, Enter, F, Z, Numpad 0, or code 32
      const isSpace = code === 'Space' || key === ' ' || key === 'Spacebar' || keyCode === 32;
      const isEnter = code === 'Enter' || code === 'NumpadEnter' || key === 'Enter' || keyCode === 13;
      const isKeyF = code === 'KeyF' || key === 'f' || key === 'F' || keyCode === 70;
      const isKeyZ = code === 'KeyZ' || key === 'z' || key === 'Z' || keyCode === 90;

      if (isFirstPress) {
        if (code) this.justPressed[code] = true;
        if (isSpace || isEnter || isKeyF || isKeyZ) {
          this.justPressed['Space'] = true;
          this.justPressed['Trigger'] = true;
        }
      }

      if (isSpace || isEnter || isKeyF || isKeyZ) {
        this.keys['Space'] = true;
        this.keys['Trigger'] = true;
        if (e.preventDefault) e.preventDefault();
      }
    };

    const handleKeyUp = (e) => {
      const code = e.code;
      const key = e.key;
      const keyCode = e.keyCode || e.which;

      if (code) this.keys[code] = false;

      const isSpace = code === 'Space' || key === ' ' || key === 'Spacebar' || keyCode === 32;
      const isEnter = code === 'Enter' || code === 'NumpadEnter' || key === 'Enter' || keyCode === 13;
      const isKeyF = code === 'KeyF' || key === 'f' || key === 'F' || keyCode === 70;
      const isKeyZ = code === 'KeyZ' || key === 'z' || key === 'Z' || keyCode === 90;

      if (isSpace || isEnter || isKeyF || isKeyZ) {
        this.keys['Space'] = false;
        this.keys['Trigger'] = false;
      }
    };

    const handleMouseDown = (e) => {
      if (e.button === 0) {
        if (!this.mouseButtons[0]) {
          this.justPressed['LMB'] = true;
          this.justPressed['Trigger'] = true;
        }
        this.mouseButtons[0] = true;
      }
      if (e.button === 2) {
        if (!this.mouseButtons[2]) this.justPressed['RMB'] = true;
        this.mouseButtons[2] = true;
      }
    };

    const handleMouseUp = (e) => {
      if (e.button === 0) this.mouseButtons[0] = false;
      if (e.button === 2) this.mouseButtons[2] = false;
    };

    // Attach in capture phase on window and document to intercept before any default UI consumption
    window.addEventListener('keydown', handleKeyDown, { capture: true, passive: false });
    document.addEventListener('keydown', handleKeyDown, { capture: true, passive: false });

    window.addEventListener('keyup', handleKeyUp, { capture: true, passive: false });
    document.addEventListener('keyup', handleKeyUp, { capture: true, passive: false });

    window.addEventListener('mousedown', handleMouseDown, { capture: true });
    window.addEventListener('mouseup', handleMouseUp, { capture: true });

    // Touch & Pointer events for hardware touchpads / screens
    window.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'mouse' && e.isPrimary && e.button === 0) {
        this.justPressed['Trigger'] = true;
        this.justPressed['LMB'] = true;
        this.mouseButtons[0] = true;
      }
    }, { capture: true });

    window.addEventListener('pointerup', () => {
      this.mouseButtons[0] = false;
    }, { capture: true });

    window.addEventListener('contextmenu', (e) => {
      e.preventDefault();
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
    if (target && target.requestPointerLock) {
      target.requestPointerLock();
    }
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
