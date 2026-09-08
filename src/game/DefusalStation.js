import { audio } from '../engine/Audio.js';

export class DefusalStation {
  constructor(onDefuseSuccess, onDefuseFail) {
    this.onDefuseSuccess = onDefuseSuccess;
    this.onDefuseFail = onDefuseFail;

    this.isOpen = false;
    this.currentLevel = 1;
    this.bombData = null;
    this.cutWires = new Set();
    this.correctWiresToCut = [];
    this.cutProgress = 0;

    // DOM Elements
    this.modal = document.getElementById('defusal-modal');
    this.serialPlate = document.getElementById('bomb-serial');
    this.wireHarness = document.getElementById('wire-harness');
    this.timerDisplay = document.getElementById('defusal-timer');
    this.statusMsg = document.getElementById('defusal-status-msg');
    this.manualTitle = document.getElementById('manual-level-title');
    this.manualContent = document.getElementById('manual-rules-content');
    this.btnExit = document.getElementById('btn-defusal-exit');

    // LEDs
    this.ledRed = document.getElementById('led-red');
    this.ledGreen = document.getElementById('led-green');
    this.ledBlue = document.getElementById('led-blue');
    this.ledYellow = document.getElementById('led-yellow');

    this.initListeners();
  }

  initListeners() {
    if (this.btnExit) {
      this.btnExit.addEventListener('click', () => {
        this.close();
      });
    }

    window.addEventListener('keydown', (e) => {
      if (this.isOpen && (e.code === 'Escape' || e.code === 'KeyE')) {
        this.close();
      }
    });
  }

  // Open defusal mini-game for current level
  open(levelNumber, bombInstance) {
    this.isOpen = true;
    this.currentLevel = levelNumber;
    this.bombInstance = bombInstance;
    this.cutWires.clear();
    this.cutProgress = 0;

    // Exit pointer lock so mouse is free to interact with wires
    if (document.exitPointerLock) {
      document.exitPointerLock();
    }

    this.modal.classList.remove('hidden');
    this.generateBombPuzzle(levelNumber);
  }

  close() {
    this.isOpen = false;
    this.modal.classList.add('hidden');
  }

  // Generate procedural tricky bomb puzzle
  generateBombPuzzle(level) {
    this.wireHarness.innerHTML = '';
    this.statusMsg.textContent = 'CAUTION: DISARMAMENT PROTOCOL ACTIVE. READ MANUAL BEFORE CUTTING.';
    this.statusMsg.style.color = '#00f0ff';

    // Configure level puzzle rules
    if (level === 1) {
      this.setupLevel1Puzzle();
    } else if (level === 2) {
      this.setupLevel2Puzzle();
    } else if (level === 3) {
      this.setupLevel3Puzzle();
    } else {
      this.setupLevel4Puzzle();
    }
  }

  // --- LEVEL 1: 3-WIRE C4 PUZZLE ---
  setupLevel1Puzzle() {
    const serial = 'SN: 8K4-T7'; // Odd last digit
    this.serialPlate.textContent = serial;
    this.setLEDs({ red: true, green: false, blue: false, yellow: true });

    const wires = ['red', 'blue', 'yellow'];
    // Rule: Since serial ends with odd digit (7) and there is a BLUE wire, cut the BLUE wire (index 1).
    this.correctWiresToCut = [1];

    this.manualTitle.textContent = 'LEVEL 1: MK-I TACTICAL C4 DETONATOR (3 WIRES)';
    this.manualContent.innerHTML = `
      <p>Follow the <strong>Mk-I Ordnance Protocol</strong> to isolate the fuse:</p>
      <ul>
        <li>If there are <strong>NO RED wires</strong>, cut the <strong>2nd wire</strong>.</li>
        <li>Otherwise, if the <strong>Serial Number ends with an ODD digit</strong> (1, 3, 5, 7, 9) and a <strong>BLUE wire</strong> is present, cut the <strong>BLUE WIRE</strong>.</li>
        <li>Otherwise, cut the <strong>LAST wire</strong>.</li>
      </ul>
      <p><em>Current Intel: Serial: <strong>8K4-T7</strong> (Ends with 7 = ODD).</em></p>
    `;

    this.renderWires(wires);
  }

  // --- LEVEL 2: 4-WIRE DIGITAL CIRCUIT PUZZLE ---
  setupLevel2Puzzle() {
    const serial = 'SN: 3V9-B2';
    this.serialPlate.textContent = serial;
    this.setLEDs({ red: true, green: true, blue: false, yellow: false });

    const wires = ['red', 'blue', 'white', 'black'];
    // Rule: RED LED is ON & there is 1 Red wire. The last wire is BLACK. There is a BLUE wire -> Cut the LAST BLUE wire (index 1).
    this.correctWiresToCut = [1];

    this.manualTitle.textContent = 'LEVEL 2: DIGITAL CIRCUIT TIMER (4 WIRES)';
    this.manualContent.innerHTML = `
      <p>Follow the <strong>Circuit Logic Bypass Protocol</strong>:</p>
      <ul>
        <li>If the <strong>RED LED is ON</strong> and there is <strong>more than 1 Red wire</strong>, cut the <strong>First Red wire</strong>.</li>
        <li>Otherwise, if the <strong>LAST wire is WHITE</strong>, cut the <strong>Black wire</strong>.</li>
        <li>Otherwise, if there is a <strong>BLUE wire</strong>, cut the <strong>LAST BLUE WIRE</strong>.</li>
        <li>Otherwise, cut the <strong>3rd wire</strong>.</li>
      </ul>
      <p><em>Current Intel: RED LED is Active, Single Red Wire present, 1 Blue Wire present.</em></p>
    `;

    this.renderWires(wires);
  }

  // --- LEVEL 3: 5-WIRE 2-STAGE BIO-CHEMICAL DETONATOR ---
  setupLevel3Puzzle() {
    const serial = 'SN: 5S8-X4';
    this.serialPlate.textContent = serial;
    this.setLEDs({ red: false, green: true, blue: true, yellow: false });

    const wires = ['striped', 'red', 'yellow', 'green', 'blue'];
    // 2-Stage defusal:
    // Stage 1 (Ground bypass): Since Serial contains 'S' and Yellow is present, cut STRIPED wire (index 0).
    // Stage 2 (Trigger bypass): Cut GREEN wire (index 3).
    this.correctWiresToCut = [0, 3];

    this.manualTitle.textContent = 'LEVEL 3: 2-STAGE BIO-CHEMICAL DETONATOR (5 WIRES)';
    this.manualContent.innerHTML = `
      <p>This warhead requires a <strong>Dual-Wire Sequence</strong>:</p>
      <ul>
        <li><strong>STAGE 1 (Ground Bypass):</strong> If a <strong>YELLOW wire</strong> is present and the Serial contains the letter <strong>'S'</strong>, cut the <strong>STRIPED HAZARD WIRE (#1)</strong> first; otherwise cut wire #2.</li>
        <li><strong>STAGE 2 (Capacitor Drain):</strong> After ground bypass, cut the <strong>GREEN WIRE (#4)</strong> to neutralize the firing pin.</li>
      </ul>
      <p><em>Current Intel: Both required wires must be severed in correct order!</em></p>
    `;

    this.renderWires(wires);
  }

  // --- LEVEL 4: 6-WIRE MASTER OMEGA BOMB ---
  setupLevel4Puzzle() {
    const serial = 'SN: 9X0-OMEGA';
    this.serialPlate.textContent = serial;
    this.setLEDs({ red: true, green: true, blue: true, yellow: true });

    const wires = ['red', 'striped', 'blue', 'yellow', 'white', 'green'];
    // 3-Stage Omega cipher sequence:
    // 1. Cut Red (#1, index 0)
    // 2. Cut White (#5, index 4)
    // 3. Cut Green (#6, index 5)
    this.correctWiresToCut = [0, 4, 5];

    this.manualTitle.textContent = 'LEVEL 4: MASTER OMEGA CITADEL CORE (6 WIRES)';
    this.manualContent.innerHTML = `
      <p><strong>OMEGA DIRECTIVE CLASSIFIED PROTOCOL:</strong></p>
      <ul>
        <li>Cut the <strong>RED PRIMARY FEED (#1)</strong> to disrupt power transfer.</li>
        <li>Next, cut the <strong>WHITE STABILIZER WIRE (#5)</strong> to halt core oscillations.</li>
        <li>Finally, cut the <strong>GREEN TERMINAL GROUND (#6)</strong> to permanently disarm the device.</li>
      </ul>
      <p><em>WARNING: DO NOT CUT STRIPED OR YELLOW WIRES OR INSTANT DETONATION OCCURS!</em></p>
    `;

    this.renderWires(wires);
  }

  // Set LED indicators
  setLEDs(config) {
    this.ledRed.className = `status-led ${config.red ? 'active-red' : ''}`;
    this.ledGreen.className = `status-led ${config.green ? 'active-green' : ''}`;
    this.ledBlue.className = `status-led ${config.blue ? 'active-blue' : ''}`;
    this.ledYellow.className = `status-led ${config.yellow ? 'active-yellow' : ''}`;
  }

  // Render wire cables
  renderWires(wireList) {
    this.wireHarness.innerHTML = '';

    wireList.forEach((wireColor, idx) => {
      const wireRow = document.createElement('div');
      wireRow.className = 'wire-row';

      const leftTerminal = document.createElement('div');
      leftTerminal.className = 'wire-terminal';

      const cable = document.createElement('div');
      cable.className = `wire-cable wire-${wireColor}`;
      cable.dataset.wireIndex = idx;
      cable.innerHTML = `<span class="wire-index-tag">WIRE #${idx + 1} (${wireColor.toUpperCase()})</span>`;

      cable.addEventListener('click', () => {
        this.handleWireCut(idx, cable, wireColor);
      });

      const rightTerminal = document.createElement('div');
      rightTerminal.className = 'wire-terminal';

      wireRow.appendChild(leftTerminal);
      wireRow.appendChild(cable);
      wireRow.appendChild(rightTerminal);

      this.wireHarness.appendChild(wireRow);
    });
  }

  // Handle wire cut attempt
  handleWireCut(wireIdx, cableEl, wireColor) {
    if (this.cutWires.has(wireIdx)) return;

    this.cutWires.add(wireIdx);
    cableEl.classList.add('cut');

    // Visual cut separation
    cableEl.innerHTML = `
      <div class="wire-cut-left wire-${wireColor}"></div>
      <div class="wire-cut-gap">⚡ SNIPPED</div>
      <div class="wire-cut-right wire-${wireColor}"></div>
    `;

    const expectedWireIdx = this.correctWiresToCut[this.cutProgress];

    if (wireIdx === expectedWireIdx) {
      // Correct Wire Cut!
      audio.playWireCut(true);
      this.cutProgress++;

      if (this.cutProgress >= this.correctWiresToCut.length) {
        // --- COMPLETE DEFUSAL SUCCESS! ---
        audio.playDefuseSuccess();
        this.statusMsg.textContent = '✓ SUCCESS: BOMB SAFELY DEFUSED! SECTOR CLEAR.';
        this.statusMsg.style.color = '#00ff88';

        setTimeout(() => {
          this.close();
          if (this.onDefuseSuccess) {
            this.onDefuseSuccess(this.currentLevel);
          }
        }, 1200);
      } else {
        // More wires remaining in multi-stage sequence
        this.statusMsg.textContent = `✓ STAGE ${this.cutProgress} CLEARED. CUT NEXT PROTOCOL WIRE.`;
        this.statusMsg.style.color = '#00ff88';
      }
    } else {
      // --- WRONG WIRE CUT! ---
      audio.playWireCut(false);
      this.statusMsg.textContent = '⚠️ CRITICAL ERROR: INCORRECT WIRE SEVERED! -20s TIME PENALTY!';
      this.statusMsg.style.color = '#ff3344';

      if (this.bombInstance) {
        this.bombInstance.timeRemaining = Math.max(0, this.bombInstance.timeRemaining - 20);
        if (this.bombInstance.timeRemaining <= 0) {
          setTimeout(() => {
            this.close();
            if (this.onDefuseFail) {
              this.onDefuseFail('Bomb detonated due to critical wire overload!');
            }
          }, 800);
        }
      }
    }
  }

  // Update timer inside the modal
  update(timeRemaining) {
    if (!this.isOpen) return;

    const mins = Math.floor(timeRemaining / 60);
    const secs = Math.floor(timeRemaining % 60);
    const millis = Math.floor((timeRemaining % 1) * 100);
    this.timerDisplay.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(millis).padStart(2, '0')}`;
  }
}
