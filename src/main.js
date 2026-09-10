import * as THREE from 'three';
import { GameRenderer } from './engine/Renderer.js';
import { InputManager } from './engine/Input.js';
import { audio } from './engine/Audio.js';
import { Player } from './game/Player.js';
import { EnemyAIManager } from './game/EnemyAI.js';
import { HitboxManager } from './game/HitboxManager.js';
import { LevelManager } from './game/LevelManager.js';
import { DefusalStation } from './game/DefusalStation.js';
import { Minimap } from './game/Minimap.js';
import { UIController } from './game/UI.js';
import { PickupManager } from './game/Pickups.js';
import { GrenadeManager } from './game/Grenade.js';
import { RailController } from './game/RailController.js';

class TacticalGame {
  constructor() {
    this.state = 'MENU'; // 'MENU' | 'PLAYING' | 'DEFUSING' | 'LEVEL_COMPLETE' | 'GAMEOVER' | 'VICTORY' | 'PAUSED'
    this.currentLevel = 1;
    this.maxLevels = 4;
    this.globalGameTimer = 120.0; // Global 2-Minute (120s) timer for entire game
    this.levelNames = [
      'COASTAL INFILTRATION YARD',
      'SUBTERRANEAN BUNKER & SERVERS',
      'RESEARCH SILO & CATWALKS',
      'FORTRESS COMMAND CITADEL (BOSS SHOWDOWN)'
    ];

    // Instantiate Subsystems
    this.renderer = new GameRenderer('game-container');
    this.input = new InputManager();
    this.ui = new UIController();
    this.hitboxManager = new HitboxManager();
    this.minimap = new Minimap('minimap-canvas');
    this.railController = new RailController();

    // Tactical Equipment & Loot Subsystems
    this.pickupManager = new PickupManager(this.renderer.scene);
    this.grenadeManager = new GrenadeManager(this.renderer.scene);

    // Player
    this.player = new Player(this.renderer.camera, this.renderer.scene);

    // AI and Level Manager
    this.levelManager = new LevelManager(this.renderer.scene, this.renderer);
    this.aiManager = new EnemyAIManager(this.renderer.scene, this.levelManager.colliders);

    // Defusal Station
    this.defusalStation = new DefusalStation(
      (level) => this.onBombDefused(level),
      (reason) => this.onGameOver(reason)
    );

    // Level data references
    this.bomb = null;
    this.enemies = [];

    // Loop timing
    this.lastTime = performance.now();

    this.initUIButtons();
    this.startLoop();
  }

  initUIButtons() {
    // Start Button
    const btnStart = document.getElementById('btn-start-game');
    if (btnStart) {
      btnStart.addEventListener('click', () => {
        audio.init();
        this.input.requestLock();
        this.startLevel(1, false);
      });
    }

    // Next Level Button
    const btnNext = document.getElementById('btn-next-level');
    if (btnNext) {
      btnNext.addEventListener('click', () => {
        this.input.requestLock();
        this.startLevel(this.currentLevel + 1, true);
      });
    }

    // Retry Button
    const btnRetry = document.getElementById('btn-retry-game');
    if (btnRetry) {
      btnRetry.addEventListener('click', () => {
        this.input.requestLock();
        this.startLevel(this.currentLevel, true);
      });
    }

    // Play Again Button
    const btnPlayAgain = document.getElementById('btn-play-again');
    if (btnPlayAgain) {
      btnPlayAgain.addEventListener('click', () => {
        this.input.requestLock();
        this.startLevel(1, false);
      });
    }

    // Resume / Restart
    const btnResume = document.getElementById('btn-resume-game');
    if (btnResume) {
      btnResume.addEventListener('click', () => {
        this.input.requestLock();
        this.state = 'PLAYING';
        this.ui.hideAllModals();
        this.ui.showHUD(true);
      });
    }

    const btnRestart = document.getElementById('btn-restart-level');
    if (btnRestart) {
      btnRestart.addEventListener('click', () => {
        this.input.requestLock();
        this.startLevel(this.currentLevel, true);
      });
    }

    // Click anywhere on game container to trigger weapon fire
    const gameContainer = document.getElementById('game-container');
    if (gameContainer) {
      gameContainer.addEventListener('click', () => {
        if (this.state === 'PLAYING') {
          this.input.justPressed['Trigger'] = true;
          this.input.justPressed['Space'] = true;
        }
      });
    }

    // Direct click on target lock prompt to fire
    const lockPrompt = document.getElementById('target-lock-prompt');
    if (lockPrompt) {
      lockPrompt.addEventListener('click', () => {
        if (this.state === 'PLAYING') {
          this.input.justPressed['Trigger'] = true;
          this.input.justPressed['Space'] = true;
        }
      });
    }

    // Direct click on interaction prompt or waypoint tag to defuse
    const promptEl = document.getElementById('interaction-prompt');
    if (promptEl) {
      promptEl.addEventListener('click', () => {
        if (this.state === 'PLAYING' && this.bomb && this.bomb.getDistanceTo(this.player.position) < 5.0) {
          this.state = 'DEFUSING';
          this.defusalStation.open(this.currentLevel, this.bomb);
        }
      });
    }

    const wpEl = document.getElementById('bomb-screen-waypoint');
    if (wpEl) {
      wpEl.addEventListener('click', () => {
        if (this.state === 'PLAYING' && this.bomb && this.bomb.getDistanceTo(this.player.position) < 5.0) {
          this.state = 'DEFUSING';
          this.defusalStation.open(this.currentLevel, this.bomb);
        }
      });
    }

    // Global Single-Button / Key Listener for Level Transition Screens (Breadboard Trigger / Space / Enter)
    window.addEventListener('keydown', (e) => {
      if (this.state === 'LEVEL_COMPLETE' && (e.code === 'Space' || e.code === 'Enter' || e.code === 'KeyF' || e.code === 'KeyZ')) {
        this.input.requestLock();
        this.startLevel(this.currentLevel + 1, true);
      } else if (this.state === 'GAMEOVER' && (e.code === 'Space' || e.code === 'Enter' || e.code === 'KeyF' || e.code === 'KeyZ')) {
        this.input.requestLock();
        this.startLevel(this.currentLevel, true);
      } else if (this.state === 'VICTORY' && (e.code === 'Space' || e.code === 'Enter' || e.code === 'KeyF' || e.code === 'KeyZ')) {
        this.input.requestLock();
        this.startLevel(1, false);
      }
    });
  }

  // Start specific level
  startLevel(levelNumber, preserveScore = false) {
    clearTimeout(this.levelAdvanceTimeout);
    this.currentLevel = levelNumber;
    this.state = 'PLAYING';
    this.ui.hideAllModals();
    this.ui.showHUD(true);

    // Reset global 2-minute timer on new game run (Level 1)
    if (levelNumber === 1 && !preserveScore) {
      this.globalGameTimer = 120.0;
    }

    this.hitboxManager.reset(preserveScore);
    this.pickupManager.clear();
    this.grenadeManager.clear();

    // Load Level
    const data = this.levelManager.loadLevel(levelNumber, this.aiManager);
    this.bomb = data.bomb;
    this.enemies = data.enemies;
    this.aiManager.colliders = data.colliders;

    // Apply continuous global timer to the bomb
    if (this.bomb) {
      this.bomb.timeRemaining = Math.max(1, this.globalGameTimer);
    }

    // Spawn player
    this.player.spawn(
      data.playerSpawn.x,
      data.playerSpawn.y,
      data.playerSpawn.z,
      data.playerSpawn.rotY
    );

    // Initialize Automated Rail Navigation
    this.railController.initLevelRail(data.railWaypoints, data.enemies, data.bomb, this.player, this.currentLevel);
  }

  // Handle successful bomb defusal
  onBombDefused(level) {
    if (this.bomb) {
      this.bomb.isDefused = true;
      this.globalGameTimer = Math.max(1, this.bomb.timeRemaining);
    }

    // Bonus points for defusing
    const timeBonus = Math.round(this.bomb ? this.bomb.timeRemaining * 2 : 0);
    this.hitboxManager.score += 100 + timeBonus;
    this.ui.showScoreToast(`+100 BOMB DEFUSED! (+${timeBonus} TIME BONUS)`, 'headshot');

    if (level >= this.maxLevels) {
      // Grand Victory! (All 4 Levels Cleared)
      this.state = 'VICTORY';
      if (document.exitPointerLock) document.exitPointerLock();
      this.ui.showVictory(this.hitboxManager.stats, this.hitboxManager.score);
    } else {
      // Level Complete
      this.state = 'LEVEL_COMPLETE';
      if (document.exitPointerLock) document.exitPointerLock();
      this.ui.showLevelComplete(level, this.hitboxManager.stats, this.hitboxManager.score, this.enemies.length);

      // Auto-advance to next sector after 2.5 seconds if no key is pressed
      clearTimeout(this.levelAdvanceTimeout);
      this.levelAdvanceTimeout = setTimeout(() => {
        if (this.state === 'LEVEL_COMPLETE') {
          this.startLevel(this.currentLevel + 1, true);
        }
      }, 2500);
    }
  }

  // Handle Game Over
  onGameOver(reason) {
    this.state = 'GAMEOVER';
    if (document.exitPointerLock) document.exitPointerLock();
    this.ui.showGameOver(reason, this.currentLevel, this.hitboxManager.score);
  }

  // Process player QTE / combat cipher input
  handleCombatInput(rawKey) {
    if (this.state !== 'PLAYING') return;
    try { audio.init(); } catch (e) {}

    // Check if target is locked on an active hostile
    if (this.railController.isTargetLocked && this.railController.targetEnemy && !this.railController.targetEnemy.isDead) {
      const activeEnemy = this.railController.targetEnemy;
      const res = this.railController.processCombatInput(rawKey);

      if (res.status === 'PROGRESS') {
        // Correct step in sequence!
        try { audio.playQTEChime(res.step); } catch (e) {}
      } else if (res.status === 'COMPLETE') {
        // Full sequence completed -> Neutralize hostile with lethal shot!
        try { audio.playQTEComplete(); } catch (e) {}

        this.player.shoot(() => {
          const wasAlive = !activeEnemy.isDead;
          this.hitboxManager.comboCount++;
          this.hitboxManager.comboTimer = this.hitboxManager.comboMaxTime;
          const points = 25 * this.hitboxManager.comboCount;
          this.hitboxManager.score += points;
          this.hitboxManager.stats.headshots++;

          // Hit effects & sound
          this.ui.triggerHitmarker(true);
          if (this.hitboxManager.comboCount > 1) {
            this.ui.triggerCombo(this.hitboxManager.comboCount, points);
            try { audio.playComboChime(this.hitboxManager.comboCount); } catch (e) {}
          } else {
            this.ui.showScoreToast(`+${points} CIPHER OVERRIDE CRITICAL!`, 'headshot');
            try { audio.playHeadshotKill(); } catch (e) {}
          }

          const hitPoint = activeEnemy.root.position.clone().add(new THREE.Vector3(0, 1.5, 0));
          this.renderer.spawnBloodPuff(hitPoint, 25);
          this.renderer.spawnSparks(hitPoint, new THREE.Vector3(0, 1, 0), 0xffd700, 16);

          // Apply damage to kill
          activeEnemy.onHit(true, 100);

          // Reset target lock and initiate sprint traversal to next encounter
          this.railController.state = 'MOVING';
          this.railController.isTargetLocked = false;
          this.railController.targetEnemy = null;
          this.railController.killPauseTimer = 0.5;

          if (wasAlive && activeEnemy.isDead) {
            this.hitboxManager.stats.enemiesKilled++;
            this.pickupManager.spawnDrop(activeEnemy.root.position.clone());
          }
        });
      } else if (res.status === 'ERROR') {
        // Wrong key pressed!
        try { audio.playQTEError(); } catch (e) {}
        this.ui.triggerBadgeShake();
        this.ui.flashDamage();
        this.ui.showScoreToast('⚠️ WRONG CIPHER KEY! (-0.25s)', 'penalty');
      }
    } else {
      // Fallback: If space/trigger is pressed with no locked target, fire weapon at scenery
      const norm = String(rawKey || '').toUpperCase();
      if (norm === 'SPACE' || norm === 'TRIGGER' || norm === 'LMB' || norm === 'ENTER' || norm === 'KEYF' || norm === 'KEYZ') {
        this.player.shoot(() => {
          this.hitboxManager.fireRaycast(
            this.renderer.camera,
            this.enemies,
            this.levelManager.colliders,
            this.renderer,
            this.player.activeWeapon
          );
        });
      }
    }
  }

  // Main game loop
  startLoop() {
    const loop = (time) => {
      const rawDelta = Math.min(0.1, (time - this.lastTime) / 1000);
      this.lastTime = time;

      try {
        this.update(rawDelta);
        this.renderer.render();
      } catch (err) {
        console.error('Game loop runtime error:', err);
      }

      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  update(rawDelta) {
    if (this.state === 'PLAYING') {
      // Time Dilation for Bullet-Time Adrenaline Focus
      const timeScale = this.player.isBulletTime ? 0.35 : 1.0;
      const gameDelta = rawDelta * timeScale;

      // 1. Automated Rail Navigation & Auto-Aim Tracking with Decreasing Reaction Window
      this.railController.update(gameDelta, this.player, () => {
        // Callback: Arrived at Bomb Defusal Terminal
        if (this.bomb && !this.bomb.isDefused && !this.defusalStation.isOpen) {
          this.state = 'DEFUSING';
          this.defusalStation.open(this.currentLevel, this.bomb);
        }
      }, (activeEnemy) => {
        // Callback: Reaction timer expired before player triggered weapon fire!
        // INSTANT GAME OVER / MISSION FAILURE
        this.player.lifelines = 0;
        this.player.isDead = true;
        this.player.health = 0;
        this.ui.flashDamage();
        this.ui.showScoreToast('☠️ TIMEOUT! HOSTILE ELIMINATED OPERATIVE!', 'penalty');
        try { audio.playRifleShoot(); } catch (e) {}

        this.onGameOver('TOO SLOW! QUICK-DRAW REACTION TIMER EXPIRED — ELIMINATED BY HOSTILE FIRE');
      });

      // 2. Operative weapon recoil & animation update
      this.player.updateRailMode(gameDelta);

      // Update Target Lock, Combat Sequence Badges & Reaction Countdown
      this.ui.setTargetLock(
        this.railController.isTargetLocked,
        this.railController.targetEnemy,
        this.railController.reactionTimer,
        this.railController.reactionTimeMax,
        (key) => this.handleCombatInput(key)
      );

      // 3. Hardware Hotkeys & 3-Button Breadboard Inputs [C, V, SPACE, TRIGGERS]
      const candidateKeys = [
        'KeyC', 'KeyV', 'Space', 'Trigger', 'Enter', 'KeyF', 'KeyZ', 'LMB',
        'Digit1', 'Digit2', 'Digit3', 'Numpad1', 'Numpad2', 'Numpad3'
      ];

      for (const k of candidateKeys) {
        if (this.input.isJustPressed(k)) {
          this.handleCombatInput(k);
          break; // Process one distinct input action per frame
        }
      }

      // 4. Enemy AI & Attack damage
      this.aiManager.update(gameDelta, this.player, () => {
        this.hitboxManager.registerPlayerHit();
        this.ui.flashDamage();
        this.ui.showScoreToast('-3 HIT TAKEN!', 'penalty');

        if (this.player.isDead) {
          this.onGameOver('ALL OPERATIVE LIFELINES DEPLETED IN COMBAT');
        }
      }, this.grenadeManager);

      // 4. Equipment, Grenades & Pickups
      this.grenadeManager.update(gameDelta, this.enemies);
      this.pickupManager.update(gameDelta, this.player, this.ui, this.renderer);
      this.levelManager.update(gameDelta);
      this.hitboxManager.update(rawDelta);

      // 5. Global Bomb Timer Update
      if (this.bomb) {
        this.bomb.update(gameDelta);
        this.globalGameTimer = this.bomb.timeRemaining;

        if (this.bomb.isDetonated || this.globalGameTimer <= 0) {
          this.onGameOver('2-MINUTE GLOBAL DETONATION TIMER EXPIRED! MISSION FAILED.');
        }

        // Automatic Defusal Check if arrived at bomb
        const distToBomb = this.bomb.getDistanceTo(this.player.position);
        const allEnemiesDead = this.enemies.length === 0 || this.enemies.every(e => e.isDead);
        if ((distToBomb < 4.5 || (allEnemiesDead && distToBomb < 6.0)) && !this.defusalStation.isOpen && !this.bomb.isDefused) {
          this.state = 'DEFUSING';
          this.defusalStation.open(this.currentLevel, this.bomb);
        }
      }

      // 6. Radar Minimap
      this.minimap.render(this.player, this.enemies, this.bomb);

      // 7. HUD View & 3D Waypoint Tracking
      this.ui.update(
        this.player,
        this.bomb,
        this.hitboxManager.score,
        this.currentLevel,
        this.levelNames,
        this.renderer.camera,
        this.enemies
      );
    } else if (this.state === 'DEFUSING') {
      // Update bomb ticking inside defusal modal
      if (this.bomb) {
        this.bomb.update(rawDelta);
        this.globalGameTimer = this.bomb.timeRemaining;
        this.defusalStation.update(this.globalGameTimer);

        if (this.bomb.isDetonated || this.globalGameTimer <= 0) {
          this.defusalStation.close();
          this.onGameOver('2-MINUTE GLOBAL DETONATION TIMER EXPIRED WHILE DISARMING!');
        }
      }

      // If player closed defusal modal with ESC or button
      if (!this.defusalStation.isOpen) {
        this.state = 'PLAYING';
        this.input.requestLock();
      }
    }

    // Update particles and rain
    this.renderer.update(rawDelta, this.player ? this.player.position : null);

    // End frame input pulses
    this.input.endFrame();
  }
}

// Launch game when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  new TacticalGame();
});
