import { audio } from '../engine/Audio.js';

export class DefusalStation {
  constructor(onDefuseSuccess, onDefuseFail) {
    this.onDefuseSuccess = onDefuseSuccess;
    this.onDefuseFail = onDefuseFail;

    this.isOpen = false;
    this.currentLevel = 1;
    this.bombInstance = null;
    this.cutWires = new Set();
    this.correctWiresToCut = [];
    this.cutProgress = 0;

    // Standard 6 Breadboard Wires
    this.wireList = ['red', 'green', 'yellow', 'black', 'blue', 'white'];

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
      if (!this.isOpen) return;

      if (e.code === 'Escape' || e.code === 'KeyE') {
        this.close();
        return;
      }

      // Keyboard & Hardware Breadboard Hotkeys: 1-6 or Color Keys
      const keyMap = {
        'Digit1': 0, 'Numpad1': 0, 'KeyR': 0, // Red
        'Digit2': 1, 'Numpad2': 1, 'KeyG': 1, // Green
        'Digit3': 2, 'Numpad3': 2, 'KeyY': 2, // Yellow
        'Digit4': 3, 'Numpad4': 3, 'KeyK': 3, 'KeyL': 3, // Black
        'Digit5': 4, 'Numpad5': 4, 'KeyB': 4, // Blue
        'Digit6': 5, 'Numpad6': 5, 'KeyW': 5  // White
      };

      if (e.code in keyMap) {
        const wireIndex = keyMap[e.code];
        this.triggerWireByIndex(wireIndex);
      }
    });
  }

  triggerWireByIndex(idx) {
    if (idx < 0 || idx >= this.wireList.length) return;
    const cableEl = this.wireHarness.querySelector(`[data-wire-index="${idx}"]`);
    if (cableEl) {
      this.handleWireCut(idx, cableEl, this.wireList[idx]);
    }
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

  // Generate tactical bomb puzzle for the 6 levels with procedural randomization
  generateBombPuzzle(level) {
    this.wireHarness.innerHTML = '';
    this.statusMsg.textContent = 'CAUTION: DISARMAMENT PROTOCOL ACTIVE. READ MANUAL BEFORE CUTTING.';
    this.statusMsg.style.color = '#00f0ff';

    if (level === 1) {
      this.setupLevel1Puzzle();
    } else if (level === 2) {
      this.setupLevel2Puzzle();
    } else if (level === 3) {
      this.setupLevel3Puzzle();
    } else if (level === 4) {
      this.setupLevel4Puzzle();
    } else if (level === 5) {
      this.setupLevel5Puzzle();
    } else {
      this.setupLevel6Puzzle();
    }
  }

  // --- HELPER UTILITIES FOR PROCEDURAL PUZZLE GENERATION ---
  randomDigit(min = 0, max = 9) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  randomLetter(letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ') {
    return letters[Math.floor(Math.random() * letters.length)];
  }

  randomBool(probability = 0.5) {
    return Math.random() < probability;
  }

  generateRandomLEDs(atLeastOneOn = true) {
    let leds;
    do {
      leds = {
        red: this.randomBool(0.5),
        green: this.randomBool(0.5),
        blue: this.randomBool(0.5),
        yellow: this.randomBool(0.5)
      };
    } while (atLeastOneOn && !leds.red && !leds.green && !leds.blue && !leds.yellow);
    return leds;
  }

  getLastDigit(serial) {
    const match = serial.match(/\d(?=\D*$)/);
    return match ? parseInt(match[0], 10) : 0;
  }

  // --- LEVEL 1: MK-I TACTICAL C4 DETONATOR (PROCEDURAL) ---
  setupLevel1Puzzle() {
    const lastD = this.randomDigit(0, 9);
    const serial = `SN: ${this.randomDigit(1, 9)}${this.randomLetter()}${this.randomDigit(1, 9)}-${this.randomLetter()}${lastD}`;
    const leds = this.generateRandomLEDs(true);

    this.serialPlate.textContent = serial;
    this.setLEDs(leds);

    const isOdd = lastD % 2 !== 0;

    // Decision Logic Tree
    if (isOdd && leds.blue) {
      this.correctWiresToCut = [4, 2]; // Blue (5) -> Yellow (3)
    } else if (leds.red && !leds.green) {
      this.correctWiresToCut = [1, 0]; // Green (2) -> Red (1)
    } else if (!isOdd) {
      this.correctWiresToCut = [0, 3]; // Red (1) -> Black (4)
    } else {
      this.correctWiresToCut = [5, 2]; // White (6) -> Yellow (3)
    }

    const ledSummary = `RED [${leds.red ? 'ON' : 'OFF'}], GREEN [${leds.green ? 'ON' : 'OFF'}], BLUE [${leds.blue ? 'ON' : 'OFF'}], YELLOW [${leds.yellow ? 'ON' : 'OFF'}]`;

    this.manualTitle.textContent = 'SECTOR 1: MK-I TACTICAL FUSE DETONATOR';
    this.manualContent.innerHTML = `
      <p>Follow the <strong>Mk-I Ordnance Decision Protocol</strong>:</p>
      <ul>
        <li><strong>Rule 1:</strong> If Serial ends with an <strong>ODD digit</strong> and <strong>BLUE LED is ON</strong> ➔ Cut <strong>BLUE [KEY 5]</strong> then <strong>YELLOW [KEY 3]</strong>.</li>
        <li><strong>Rule 2:</strong> Else if <strong>RED LED is ON</strong> and <strong>GREEN LED is OFF</strong> ➔ Cut <strong>GREEN [KEY 2]</strong> then <strong>RED [KEY 1]</strong>.</li>
        <li><strong>Rule 3:</strong> Else if Serial ends with an <strong>EVEN digit</strong> ➔ Cut <strong>RED [KEY 1]</strong> then <strong>BLACK [KEY 4]</strong>.</li>
        <li><strong>Rule 4 (Fallback):</strong> Otherwise ➔ Cut <strong>WHITE [KEY 6]</strong> then <strong>YELLOW [KEY 3]</strong>.</li>
      </ul>
      <p style="margin-top: 8px; font-size: 0.82rem; color: #00f0ff;">
        <em>📡 LIVE SENSORS: Serial ends with [${lastD} = ${isOdd ? 'ODD' : 'EVEN'}] | LEDs: ${ledSummary}</em>
      </p>
    `;

    console.log('[EOD TERMINAL] Sector 1 Generated:', { serial, leds, solution: this.correctWiresToCut.map(i => this.wireList[i]) });
    this.renderWires(this.wireList);
  }

  // --- LEVEL 2: MK-II DIGITAL CIRCUIT TIMER (PROCEDURAL) ---
  setupLevel2Puzzle() {
    const lastD = this.randomDigit(0, 9);
    const serial = `SN: ${this.randomDigit(1, 9)}${this.randomLetter()}${this.randomDigit(1, 9)}-${this.randomLetter()}${lastD}`;
    const leds = this.generateRandomLEDs(true);

    this.serialPlate.textContent = serial;
    this.setLEDs(leds);

    const isEven = lastD % 2 === 0;

    // Decision Logic Tree
    if (leds.red && leds.green) {
      this.correctWiresToCut = [2, 5]; // Yellow (3) -> White (6)
    } else if (isEven && leds.yellow) {
      this.correctWiresToCut = [3, 1]; // Black (4) -> Green (2)
    } else if (leds.blue) {
      this.correctWiresToCut = [0, 4]; // Red (1) -> Blue (5)
    } else {
      this.correctWiresToCut = [5, 3]; // White (6) -> Black (4)
    }

    const ledSummary = `RED [${leds.red ? 'ON' : 'OFF'}], GREEN [${leds.green ? 'ON' : 'OFF'}], BLUE [${leds.blue ? 'ON' : 'OFF'}], YELLOW [${leds.yellow ? 'ON' : 'OFF'}]`;

    this.manualTitle.textContent = 'SECTOR 2: DIGITAL CIRCUIT TIMER MATRIX';
    this.manualContent.innerHTML = `
      <p>Follow the <strong>Circuit Logic Bypass Protocol</strong>:</p>
      <ul>
        <li><strong>Rule 1:</strong> If <strong>RED & GREEN LEDs are BOTH ACTIVE</strong> ➔ Cut <strong>YELLOW [KEY 3]</strong> then <strong>WHITE [KEY 6]</strong>.</li>
        <li><strong>Rule 2:</strong> Else if Serial ends with an <strong>EVEN digit</strong> and <strong>YELLOW LED is ON</strong> ➔ Cut <strong>BLACK [KEY 4]</strong> then <strong>GREEN [KEY 2]</strong>.</li>
        <li><strong>Rule 3:</strong> Else if <strong>BLUE LED is ON</strong> ➔ Cut <strong>RED [KEY 1]</strong> then <strong>BLUE [KEY 5]</strong>.</li>
        <li><strong>Rule 4 (Fallback):</strong> Otherwise ➔ Cut <strong>WHITE [KEY 6]</strong> then <strong>BLACK [KEY 4]</strong>.</li>
      </ul>
      <p style="margin-top: 8px; font-size: 0.82rem; color: #00f0ff;">
        <em>📡 LIVE SENSORS: Serial ends with [${lastD} = ${isEven ? 'EVEN' : 'ODD'}] | LEDs: ${ledSummary}</em>
      </p>
    `;

    console.log('[EOD TERMINAL] Sector 2 Generated:', { serial, leds, solution: this.correctWiresToCut.map(i => this.wireList[i]) });
    this.renderWires(this.wireList);
  }

  // --- LEVEL 3: MK-III 2-STAGE BIO-CHEMICAL CORE (PROCEDURAL) ---
  setupLevel3Puzzle() {
    const codeLetters = ['V', 'C', 'X', 'Z', 'M', 'K'];
    const chosenLetter = codeLetters[Math.floor(Math.random() * codeLetters.length)];
    const serial = `SN: ${this.randomDigit(1, 9)}${this.randomLetter()}${this.randomDigit(1, 9)}-${chosenLetter}${this.randomDigit(0, 9)}`;
    const leds = this.generateRandomLEDs(true);

    this.serialPlate.textContent = serial;
    this.setLEDs(leds);

    // 2-Stage Sequence:
    // Stage 1 (Pressure Valve): If Blue is ON and Red is OFF -> White (5), else Yellow (2)
    const stage1Wire = (leds.blue && !leds.red) ? 5 : 2;

    // Stage 2 (Neutralizer Line): If Serial contains 'V', 'C', or 'X' -> Green (1), else Black (3)
    const containsVCX = ['V', 'C', 'X'].includes(chosenLetter);
    const stage2Wire = containsVCX ? 1 : 3;

    this.correctWiresToCut = [stage1Wire, stage2Wire];

    const ledSummary = `RED [${leds.red ? 'ON' : 'OFF'}], GREEN [${leds.green ? 'ON' : 'OFF'}], BLUE [${leds.blue ? 'ON' : 'OFF'}], YELLOW [${leds.yellow ? 'ON' : 'OFF'}]`;

    this.manualTitle.textContent = 'SECTOR 3: 2-STAGE BIO-CHEMICAL CORE';
    this.manualContent.innerHTML = `
      <p>Follow the <strong>Containment Pressure Protocol</strong>:</p>
      <ul>
        <li><strong>STAGE 1 (Valve Seal):</strong>
          <ul>
            <li>If <strong>BLUE LED is ON</strong> and <strong>RED LED is OFF</strong> ➔ Cut <strong>WHITE WIRE [KEY 6]</strong>.</li>
            <li>Otherwise ➔ Cut <strong>YELLOW WIRE [KEY 3]</strong>.</li>
          </ul>
        </li>
        <li><strong>STAGE 2 (Neutralizer Line):</strong>
          <ul>
            <li>If Serial contains <strong>'V'</strong>, <strong>'C'</strong>, or <strong>'X'</strong> ➔ Cut <strong>GREEN WIRE [KEY 2]</strong>.</li>
            <li>Otherwise (contains 'Z', 'M', 'K') ➔ Cut <strong>BLACK WIRE [KEY 4]</strong>.</li>
          </ul>
        </li>
      </ul>
      <p style="margin-top: 8px; font-size: 0.82rem; color: #00f0ff;">
        <em>📡 LIVE SENSORS: Code Letter [${chosenLetter}] | LEDs: ${ledSummary}</em>
      </p>
    `;

    console.log('[EOD TERMINAL] Sector 3 Generated:', { serial, leds, solution: this.correctWiresToCut.map(i => this.wireList[i]) });
    this.renderWires(this.wireList);
  }

  // --- LEVEL 4: MK-IV QUANTUM DETONATOR (PROCEDURAL) ---
  setupLevel4Puzzle() {
    const lastD = this.randomDigit(0, 9);
    const serial = `SN: ${this.randomDigit(1, 9)}${this.randomLetter()}${this.randomDigit(1, 9)}-${this.randomLetter()}${lastD}`;
    const leds = this.generateRandomLEDs(true);

    this.serialPlate.textContent = serial;
    this.setLEDs(leds);

    const isEven = lastD % 2 === 0;
    const activeLedCount = (leds.red ? 1 : 0) + (leds.green ? 1 : 0) + (leds.blue ? 1 : 0) + (leds.yellow ? 1 : 0);

    // Stage 1 (Grid Decouple)
    let stage1Wire;
    if (activeLedCount >= 3) {
      stage1Wire = 0; // Red (1)
    } else if (activeLedCount === 2) {
      stage1Wire = 2; // Yellow (3)
    } else {
      stage1Wire = 4; // Blue (5)
    }

    // Stage 2 (Grounding Discharge)
    const stage2Wire = isEven ? 3 : 5; // Black (4) if Even, else White (6)

    this.correctWiresToCut = [stage1Wire, stage2Wire];

    const ledSummary = `${activeLedCount} ACTIVE (RED:${leds.red ? 'ON' : 'OFF'}, GRN:${leds.green ? 'ON' : 'OFF'}, BLU:${leds.blue ? 'ON' : 'OFF'}, YEL:${leds.yellow ? 'ON' : 'OFF'})`;

    this.manualTitle.textContent = 'SECTOR 4: QUANTUM RESONATOR DETONATOR';
    this.manualContent.innerHTML = `
      <p>Execute the <strong>Quantum Disarmament Rules</strong>:</p>
      <ul>
        <li><strong>STAGE 1 (Grid Decouple):</strong>
          <ul>
            <li>If <strong>EXACTLY 3 or 4 LEDs ARE ACTIVE</strong> ➔ Cut <strong>RED WIRE [KEY 1]</strong>.</li>
            <li>Else if <strong>EXACTLY 2 LEDs ARE ACTIVE</strong> ➔ Cut <strong>YELLOW WIRE [KEY 3]</strong>.</li>
            <li>Otherwise (0 or 1 active) ➔ Cut <strong>BLUE WIRE [KEY 5]</strong>.</li>
          </ul>
        </li>
        <li><strong>STAGE 2 (Grounding Discharge):</strong>
          <ul>
            <li>If Serial ends with an <strong>EVEN digit</strong> ➔ Cut <strong>BLACK WIRE [KEY 4]</strong>.</li>
            <li>Otherwise (ODD digit) ➔ Cut <strong>WHITE WIRE [KEY 6]</strong>.</li>
          </ul>
        </li>
      </ul>
      <p style="margin-top: 8px; font-size: 0.82rem; color: #00f0ff;">
        <em>📡 LIVE SENSORS: Active LEDs [${ledSummary}] | Last Digit [${lastD} = ${isEven ? 'EVEN' : 'ODD'}]</em>
      </p>
    `;

    console.log('[EOD TERMINAL] Sector 4 Generated:', { serial, leds, solution: this.correctWiresToCut.map(i => this.wireList[i]) });
    this.renderWires(this.wireList);
  }

  // --- LEVEL 5: MK-V CYBERNETIC DATA MATRIX (PROCEDURAL) ---
  setupLevel5Puzzle() {
    const vowels = ['A', 'E', 'U'];
    const consonants = ['T', 'N', 'P', 'R', 'K'];
    const hasVowel = this.randomBool(0.5);
    const midLetter = hasVowel ? vowels[Math.floor(Math.random() * vowels.length)] : consonants[Math.floor(Math.random() * consonants.length)];
    const serial = `SN: ${this.randomDigit(1, 9)}${midLetter}${this.randomDigit(1, 9)}-${this.randomLetter()}${this.randomDigit(0, 9)}`;
    const leds = this.generateRandomLEDs(true);

    this.serialPlate.textContent = serial;
    this.setLEDs(leds);

    // Stage 1 (Data Bus Kill)
    let stage1Wire;
    if (leds.blue && leds.yellow) {
      stage1Wire = 4; // Blue (5)
    } else if (leds.green) {
      stage1Wire = 1; // Green (2)
    } else {
      stage1Wire = 0; // Red (1)
    }

    // Stage 2 (Auxiliary Bypass)
    const stage2Wire = hasVowel ? 2 : 3; // Yellow (3) if vowel, else Black (4)

    this.correctWiresToCut = [stage1Wire, stage2Wire];

    const ledSummary = `RED [${leds.red ? 'ON' : 'OFF'}], GREEN [${leds.green ? 'ON' : 'OFF'}], BLUE [${leds.blue ? 'ON' : 'OFF'}], YELLOW [${leds.yellow ? 'ON' : 'OFF'}]`;

    this.manualTitle.textContent = 'SECTOR 5: CYBERNETIC MAINFRAME CORE';
    this.manualContent.innerHTML = `
      <p>Neutralize the <strong>AI Cybernetic Mainframe</strong>:</p>
      <ul>
        <li><strong>STAGE 1 (Data Bus Kill):</strong>
          <ul>
            <li>If both <strong>BLUE & YELLOW LEDs are ACTIVE</strong> ➔ Cut <strong>BLUE WIRE [KEY 5]</strong>.</li>
            <li>Else if <strong>GREEN LED is ON</strong> ➔ Cut <strong>GREEN WIRE [KEY 2]</strong>.</li>
            <li>Otherwise ➔ Cut <strong>RED WIRE [KEY 1]</strong>.</li>
          </ul>
        </li>
        <li><strong>STAGE 2 (Auxiliary Bypass):</strong>
          <ul>
            <li>If Serial contains a <strong>VOWEL (A, E, I, O, U)</strong> ➔ Cut <strong>YELLOW WIRE [KEY 3]</strong>.</li>
            <li>Otherwise (Consonants only) ➔ Cut <strong>BLACK WIRE [KEY 4]</strong>.</li>
          </ul>
        </li>
      </ul>
      <p style="margin-top: 8px; font-size: 0.82rem; color: #00f0ff;">
        <em>📡 LIVE SENSORS: Serial [${serial}] (Vowel Present: ${hasVowel ? 'YES' : 'NO'}) | LEDs: ${ledSummary}</em>
      </p>
    `;

    console.log('[EOD TERMINAL] Sector 5 Generated:', { serial, leds, solution: this.correctWiresToCut.map(i => this.wireList[i]) });
    this.renderWires(this.wireList);
  }

  // --- LEVEL 6: MK-VI MASTER OMEGA WARHEAD (PROCEDURAL FINALE) ---
  setupLevel6Puzzle() {
    const codeWords = ['OMG', 'WAR', 'NEX'];
    const chosenWord = codeWords[Math.floor(Math.random() * codeWords.length)];
    const serial = `SN: ${this.randomDigit(100, 999)}-${chosenWord}`;
    const leds = this.generateRandomLEDs(true);

    this.serialPlate.textContent = serial;
    this.setLEDs(leds);

    // 3-Stage Omega Sequence:
    // Stage 1 (Core Isolation): Red (0) if Red LED is ON, else Blue (4)
    const stage1Wire = leds.red ? 0 : 4;

    // Stage 2 (Quantum Stabilizer): White (5) if 'OMG', Yellow (2) if 'WAR', else Black (3)
    let stage2Wire;
    if (chosenWord === 'OMG') {
      stage2Wire = 5; // White (6)
    } else if (chosenWord === 'WAR') {
      stage2Wire = 2; // Yellow (3)
    } else {
      stage2Wire = 3; // Black (4)
    }

    // Stage 3 (Terminal Neutralization): Green (1) if Green LED is ON, else White (5)
    const stage3Wire = leds.green ? 1 : 5;

    this.correctWiresToCut = [stage1Wire, stage2Wire, stage3Wire];

    const ledSummary = `RED [${leds.red ? 'ON' : 'OFF'}], GREEN [${leds.green ? 'ON' : 'OFF'}], BLUE [${leds.blue ? 'ON' : 'OFF'}], YELLOW [${leds.yellow ? 'ON' : 'OFF'}]`;

    this.manualTitle.textContent = 'SECTOR 6: MASTER OMEGA WARHEAD (3-STAGE FINALE)';
    this.manualContent.innerHTML = `
      <p><strong>FINAL MASTER OMEGA DISARMAMENT LOGIC:</strong></p>
      <ul>
        <li><strong>STEP 1 (Core Isolation):</strong>
          <ul>
            <li>If <strong>RED LED is ON</strong> ➔ Cut <strong>RED WIRE [KEY 1]</strong>.</li>
            <li>Otherwise ➔ Cut <strong>BLUE WIRE [KEY 5]</strong>.</li>
          </ul>
        </li>
        <li><strong>STEP 2 (Quantum Stabilizer):</strong>
          <ul>
            <li>If Serial contains <strong>'OMG'</strong> ➔ Cut <strong>WHITE WIRE [KEY 6]</strong>.</li>
            <li>Else if Serial contains <strong>'WAR'</strong> ➔ Cut <strong>YELLOW WIRE [KEY 3]</strong>.</li>
            <li>Otherwise ➔ Cut <strong>BLACK WIRE [KEY 4]</strong>.</li>
          </ul>
        </li>
        <li><strong>STEP 3 (Terminal Neutralization):</strong>
          <ul>
            <li>If <strong>GREEN LED is ACTIVE</strong> ➔ Cut <strong>GREEN WIRE [KEY 2]</strong> for GRAND VICTORY!</li>
            <li>Otherwise ➔ Cut <strong>WHITE WIRE [KEY 6]</strong>.</li>
          </ul>
        </li>
      </ul>
      <p style="margin-top: 8px; font-size: 0.82rem; color: #00f0ff;">
        <em>📡 LIVE SENSORS: Warhead Code [${chosenWord}] | LEDs: ${ledSummary}</em>
      </p>
    `;

    console.log('[EOD TERMINAL] Sector 6 Generated:', { serial, leds, solution: this.correctWiresToCut.map(i => this.wireList[i]) });
    this.renderWires(this.wireList);
  }

  // Set LED indicators
  setLEDs(config) {
    this.ledRed.className = `status-led ${config.red ? 'active-red' : ''}`;
    this.ledGreen.className = `status-led ${config.green ? 'active-green' : ''}`;
    this.ledBlue.className = `status-led ${config.blue ? 'active-blue' : ''}`;
    this.ledYellow.className = `status-led ${config.yellow ? 'active-yellow' : ''}`;
  }

  // Render wire cables with hotkey badges
  renderWires(wireList) {
    this.wireHarness.innerHTML = '';

    const hotkeyTags = ['1 (RED)', '2 (GREEN)', '3 (YELLOW)', '4 (BLACK)', '5 (BLUE)', '6 (WHITE)'];

    wireList.forEach((wireColor, idx) => {
      const wireRow = document.createElement('div');
      wireRow.className = 'wire-row';

      const leftTerminal = document.createElement('div');
      leftTerminal.className = 'wire-terminal';

      const cable = document.createElement('div');
      cable.className = `wire-cable wire-${wireColor}`;
      cable.dataset.wireIndex = idx;
      cable.innerHTML = `
        <span class="wire-index-tag">[KEY ${hotkeyTags[idx]}]</span>
        <span class="wire-click-hint">CLICK OR PRESS KEY [${idx + 1}]</span>
      `;

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
      <div class="wire-cut-gap">⚡ SNIPPED [KEY ${wireIdx + 1}]</div>
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
    const ms = Math.floor((timeRemaining % 1) * 100);

    const formatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(ms).padStart(2, '0')}`;
    if (this.timerDisplay) {
      this.timerDisplay.textContent = formatted;
    }
  }
}
