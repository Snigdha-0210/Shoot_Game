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

class TacticalGame {
  constructor() {
    this.state = 'MENU'; // 'MENU' | 'PLAYING' | 'DEFUSING' | 'LEVEL_COMPLETE' | 'GAMEOVER' | 'VICTORY' | 'PAUSED'
    this.currentLevel = 1;
    this.maxLevels = 4;
    this.levelNames = [
      'COASTAL INFILTRATION YARD',
      'SUBTERRANEAN BUNKER & SERVERS',
      'RESEARCH SILO & CATWALKS',
      'FORTRESS COMMAND CITADEL'
    ];

    // Instantiate Subsystems
    this.renderer = new GameRenderer('game-container');
    this.input = new InputManager();
    this.ui = new UIController();
    this.hitboxManager = new HitboxManager();
    this.minimap = new Minimap('minimap-canvas');

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

    // Direct click on interaction prompt or waypoint tag to defuse
    const promptEl = document.getElementById('interaction-prompt');
    if (promptEl) {
      promptEl.addEventListener('click', () => {
        if (this.state === 'PLAYING' && this.bomb && this.bomb.getDistanceTo(this.player.position) < 4.0) {
          this.state = 'DEFUSING';
          this.defusalStation.open(this.currentLevel, this.bomb);
        }
      });
    }
    const wpEl = document.getElementById('bomb-screen-waypoint');
    if (wpEl) {
      wpEl.addEventListener('click', () => {
        if (this.state === 'PLAYING' && this.bomb && this.bomb.getDistanceTo(this.player.position) < 4.0) {
          this.state = 'DEFUSING';
          this.defusalStation.open(this.currentLevel, this.bomb);
        }
      });
    }
  }

  // Start specific level
  startLevel(levelNumber, preserveScore = false) {
    this.currentLevel = levelNumber;
    this.state = 'PLAYING';
    this.ui.hideAllModals();
    this.ui.showHUD(true);

    this.hitboxManager.reset(preserveScore);

    // Load Level
    const data = this.levelManager.loadLevel(levelNumber, this.aiManager);
    this.bomb = data.bomb;
    this.enemies = data.enemies;
    this.aiManager.colliders = data.colliders;

    // Spawn player
    this.player.spawn(
      data.playerSpawn.x,
      data.playerSpawn.y,
      data.playerSpawn.z,
      data.playerSpawn.rotY
    );
  }

  // Handle successful bomb defusal
  onBombDefused(level) {
    if (this.bomb) this.bomb.isDefused = true;

    // Bonus points for defusing
    const timeBonus = Math.round(this.bomb.timeRemaining * 2);
    this.hitboxManager.score += 100 + timeBonus;
    this.ui.showScoreToast(`+100 BOMB DEFUSED! (+${timeBonus} TIME BONUS)`, 'headshot');

    if (level >= this.maxLevels) {
      // Grand Victory!
      this.state = 'VICTORY';
      if (document.exitPointerLock) document.exitPointerLock();
      this.ui.showVictory(this.hitboxManager.stats, this.hitboxManager.score);
    } else {
      // Level Complete
      this.state = 'LEVEL_COMPLETE';
      if (document.exitPointerLock) document.exitPointerLock();
      this.ui.showLevelComplete(level, this.hitboxManager.stats, this.hitboxManager.score);
    }
  }

  // Handle Game Over
  onGameOver(reason) {
    this.state = 'GAMEOVER';
    if (document.exitPointerLock) document.exitPointerLock();
    this.ui.showGameOver(reason, this.currentLevel, this.hitboxManager.score);
  }

  // Main game loop
  startLoop() {
    const loop = (time) => {
      const delta = Math.min(0.1, (time - this.lastTime) / 1000);
      this.lastTime = time;

      this.update(delta);
      this.renderer.render();

      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  update(delta) {
    if (this.state === 'PLAYING') {
      // 1. Player Update
      this.player.update(delta, this.input, this.levelManager.colliders);

      // 2. Shooting
      if (this.input.mouseButtons[0]) {
        this.player.shoot(() => {
          const hitResult = this.hitboxManager.fireRaycast(
            this.renderer.camera,
            this.enemies,
            this.levelManager.colliders,
            this.renderer
          );

          if (hitResult) {
            if (hitResult.type === 'headshot') {
              this.ui.triggerHitmarker(true);
              this.ui.showScoreToast('+15 CRITICAL HEADSHOT!', 'headshot');
            } else if (hitResult.type === 'body') {
              this.ui.triggerHitmarker(false);
              this.ui.showScoreToast('+5 BODY HIT', 'body');
            }
          }
        });
      }

      // 3. Enemy AI & Enemy attack damage (-3 points penalty)
      this.aiManager.update(delta, this.player, () => {
        // Enemy shot operative
        const penalty = this.hitboxManager.registerPlayerHit();
        this.ui.flashDamage();
        this.ui.showScoreToast('-3 HIT TAKEN!', 'penalty');

        if (this.player.isDead) {
          this.onGameOver('ALL OPERATIVE LIFELINES DEPLETED IN COMBAT');
        }
      });

      // 4. Bomb Update
      if (this.bomb) {
        this.bomb.update(delta);
        if (this.bomb.isDetonated) {
          this.onGameOver('BOMB DETONATED! MISSION FAILED.');
        }

        // Check Interact Key [E] to Defuse (within 4.0m)
        const distToBomb = this.bomb.getDistanceTo(this.player.position);
        if (distToBomb < 4.0 && this.input.isJustPressed('KeyE')) {
          this.state = 'DEFUSING';
          this.defusalStation.open(this.currentLevel, this.bomb);
        }
      }

      // 5. Radar Minimap
      this.minimap.render(this.player, this.enemies, this.bomb);

      // 6. HUD View & 3D Waypoint Tracking
      this.ui.update(
        this.player,
        this.bomb,
        this.hitboxManager.score,
        this.currentLevel,
        this.levelNames,
        this.renderer.camera
      );
    } else if (this.state === 'DEFUSING') {
      // Update bomb ticking inside defusal modal
      if (this.bomb) {
        this.bomb.update(delta);
        this.defusalStation.update(this.bomb.timeRemaining);
        if (this.bomb.isDetonated) {
          this.defusalStation.close();
          this.onGameOver('BOMB DETONATED WHILE DISARMING!');
        }
      }

      // If player closed defusal modal with ESC or button
      if (!this.defusalStation.isOpen) {
        this.state = 'PLAYING';
        this.input.requestLock();
      }
    }

    // Update particles and rain
    this.renderer.update(delta, this.player ? this.player.position : null);

    // End frame input pulses
    this.input.endFrame();
  }
}

// Launch game when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  new TacticalGame();
});
