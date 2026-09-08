// Tactical HUD & UI View Controller
export class UIController {
  constructor() {
    // HUD Elements
    this.hud = document.getElementById('hud');
    this.levelBadge = document.getElementById('hud-level-badge');
    this.levelName = document.getElementById('hud-level-name');
    this.objectiveText = document.getElementById('hud-objective-text');
    this.bombTimer = document.getElementById('hud-bomb-timer');
    this.bombDist = document.getElementById('hud-bomb-dist');
    this.scoreVal = document.getElementById('hud-score');
    this.ammoClip = document.getElementById('hud-ammo-clip');
    this.ammoReserve = document.getElementById('hud-ammo-reserve');
    this.reloadPrompt = document.getElementById('hud-reload-prompt');
    this.healthBar = document.getElementById('hud-health-bar');
    this.healthNum = document.getElementById('hud-health-num');
    this.noiseBar = document.getElementById('hud-noise-bar');
    this.noiseStatus = document.getElementById('hud-noise-status');
    this.stanceBadge = document.getElementById('hud-stance');
    this.interactionPrompt = document.getElementById('hud-interaction-prompt') || document.getElementById('interaction-prompt');
    this.scorePopups = document.getElementById('score-popups');

    // Lifeline icons
    this.lifePlates = [
      document.getElementById('life-1'),
      document.getElementById('life-2'),
      document.getElementById('life-3')
    ];

    // Hitmarkers & Effects
    this.hitmarker = document.getElementById('hitmarker');
    this.headshotMarker = document.getElementById('headshot-marker');
    this.damageVignette = document.getElementById('damage-vignette');

    // Menus & Modals
    this.startScreen = document.getElementById('start-screen');
    this.levelCompleteScreen = document.getElementById('level-complete-screen');
    this.gameOverScreen = document.getElementById('game-over-screen');
    this.victoryScreen = document.getElementById('victory-screen');
    this.pauseScreen = document.getElementById('pause-screen');

    // 3D Screen-Space Bomb Waypoint
    this.bombWaypoint = document.getElementById('bomb-screen-waypoint');
    this.waypointDistText = document.getElementById('waypoint-dist-text');
    this.waypointArrow = document.getElementById('waypoint-arrow');

    // Stats elements
    this.statEnemiesKilled = document.getElementById('stat-enemies-killed');
    this.statHeadshots = document.getElementById('stat-headshots');
    this.statBodyshots = document.getElementById('stat-bodyshots');
    this.statHitsTaken = document.getElementById('stat-hits-taken');
    this.statTotalScore = document.getElementById('stat-total-score');
    this.completeLevelTitle = document.getElementById('complete-level-title');

    this.statGameOverScore = document.getElementById('stat-gameover-score');
    this.statGameOverLevel = document.getElementById('stat-gameover-level');
    this.gameOverReason = document.getElementById('game-over-reason');

    this.statFinalRank = document.getElementById('stat-final-rank');
    this.statFinalHeadshots = document.getElementById('stat-final-headshots');
    this.statFinalScore = document.getElementById('stat-final-score');
  }

  showHUD(visible = true) {
    if (visible) {
      this.hud.classList.remove('hidden');
    } else {
      this.hud.classList.add('hidden');
      if (this.bombWaypoint) this.bombWaypoint.classList.add('hidden');
    }
  }

  // Update HUD every frame
  update(player, bomb, score, currentLevel, levelNames, camera) {
    if (!player) return;

    // Level Header
    this.levelBadge.textContent = `LEVEL ${currentLevel}/4`;
    this.levelName.textContent = levelNames[currentLevel - 1] || 'INFILTRATION';

    // Score
    this.scoreVal.textContent = String(score).padStart(4, '0');

    // Bomb Timer, Distance & 3D Waypoint Tracking
    if (bomb) {
      const t = Math.max(0, bomb.timeRemaining);
      const mins = Math.floor(t / 60);
      const secs = Math.floor(t % 60);
      const millis = Math.floor((t % 1) * 100);
      this.bombTimer.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(millis).padStart(2, '0')}`;

      const dist = bomb.getDistanceTo(player.position);
      this.bombDist.textContent = `DISTANCE: ${dist.toFixed(1)}m`;

      // Prompt interaction if close (within 4.0m)
      if (dist < 4.0 && !bomb.isDefused) {
        this.interactionPrompt.classList.remove('hidden');
      } else {
        this.interactionPrompt.classList.add('hidden');
      }

      // --- 3D SCREEN-SPACE WAYPOINT PROJECTION ---
      if (this.bombWaypoint && !bomb.isDefused && camera) {
        const bombWorldPos = bomb.position.clone();
        bombWorldPos.y += 2.2; // Position tag at the floating diamond height

        const screenVec = bombWorldPos.project(camera);
        const isBehind = screenVec.z > 1;

        const halfW = window.innerWidth / 2;
        const halfH = window.innerHeight / 2;

        let screenX = (screenVec.x * halfW) + halfW;
        let screenY = -(screenVec.y * halfH) + halfH;

        this.waypointDistText.textContent = `${dist.toFixed(1)}m`;

        if (!isBehind && screenX > 60 && screenX < window.innerWidth - 60 && screenY > 60 && screenY < window.innerHeight - 60) {
          // Inside Screen Viewport
          this.bombWaypoint.style.left = `${screenX}px`;
          this.bombWaypoint.style.top = `${screenY}px`;
          this.bombWaypoint.style.transform = 'translate(-50%, -100%)';
          this.waypointArrow.classList.add('hidden');
          this.bombWaypoint.classList.remove('hidden');
        } else {
          // Off-Screen or Behind: Clamp to viewport boundary with directional pointer arrow
          let dirX = screenVec.x;
          let dirY = screenVec.y;
          if (isBehind) {
            dirX = -dirX;
            dirY = -dirY;
          }

          const angle = Math.atan2(dirY, dirX);
          const boundX = halfW - 80;
          const boundY = halfH - 80;

          const clampedX = halfW + Math.cos(angle) * boundX;
          const clampedY = halfH - Math.sin(angle) * boundY;

          this.bombWaypoint.style.left = `${clampedX}px`;
          this.bombWaypoint.style.top = `${clampedY}px`;
          this.bombWaypoint.style.transform = 'translate(-50%, -50%)';
          this.waypointArrow.classList.remove('hidden');
          this.waypointArrow.textContent = clampedX < halfW ? '◄' : '►';
          this.bombWaypoint.classList.remove('hidden');
        }
      }
    } else {
      if (this.bombWaypoint) this.bombWaypoint.classList.add('hidden');
    }

    // Ammo
    this.ammoClip.textContent = player.ammoClip;
    this.ammoReserve.textContent = player.ammoReserve;
    if (player.ammoClip <= 5 && !player.isReloading && player.ammoReserve > 0) {
      this.reloadPrompt.classList.remove('hidden');
    } else {
      this.reloadPrompt.classList.add('hidden');
    }

    // Health
    const hpPct = Math.max(0, (player.health / player.maxHealth) * 100);
    this.healthBar.style.width = `${hpPct}%`;
    this.healthNum.textContent = `${Math.round(hpPct)}%`;

    // Lifelines (Armor Plates)
    for (let i = 0; i < 3; i++) {
      if (i < player.lifelines) {
        this.lifePlates[i].classList.add('active');
      } else {
        this.lifePlates[i].classList.remove('active');
      }
    }

    // Stealth Noise Meter
    const noisePct = Math.min(100, Math.round(player.noiseLevel * 100));
    this.noiseBar.style.width = `${noisePct}%`;
    if (player.isCrouching) {
      this.noiseStatus.textContent = 'SILENT (CROUCH)';
      this.noiseStatus.className = 'noise-status silent';
      this.stanceBadge.textContent = 'CROUCH';
    } else if (player.isSprinting) {
      this.noiseStatus.textContent = 'LOUD (SPRINT)';
      this.noiseStatus.className = 'noise-status alert';
      this.stanceBadge.textContent = 'SPRINT';
    } else {
      this.noiseStatus.textContent = 'NORMAL (WALK)';
      this.noiseStatus.className = 'noise-status';
      this.stanceBadge.textContent = 'STAND';
    }
  }

  // Hitmarker & Critical Headshot Marker
  triggerHitmarker(isHeadshot) {
    if (isHeadshot) {
      this.headshotMarker.classList.remove('hidden');
      setTimeout(() => this.headshotMarker.classList.add('hidden'), 500);
    } else {
      this.hitmarker.classList.remove('hidden');
      setTimeout(() => this.hitmarker.classList.add('hidden'), 150);
    }
  }

  // Floating score toast
  showScoreToast(text, type = 'body') {
    const toast = document.createElement('div');
    toast.className = `score-toast ${type}`;
    toast.textContent = text;
    this.scorePopups.appendChild(toast);

    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 800);
  }

  // Flash damage vignette on player hit
  flashDamage() {
    this.damageVignette.classList.add('active');
    setTimeout(() => {
      this.damageVignette.classList.remove('active');
    }, 180);
  }

  // Show Level Complete Screen
  showLevelComplete(levelNumber, stats, totalScore) {
    this.showHUD(false);
    this.completeLevelTitle.textContent = `LEVEL ${levelNumber} DEFUSED SUCCESSFULLY`;
    this.statEnemiesKilled.textContent = stats.enemiesKilled;
    this.statHeadshots.textContent = `${stats.headshots} (+${stats.headshots * 15} PTS)`;
    this.statBodyshots.textContent = `${stats.bodyshots} (+${stats.bodyshots * 5} PTS)`;
    this.statHitsTaken.textContent = `${stats.hitsTaken} (-${stats.hitsTaken * 3} PTS)`;
    this.statTotalScore.textContent = String(totalScore).padStart(4, '0');

    this.levelCompleteScreen.classList.remove('hidden');
  }

  // Show Game Over Screen
  showGameOver(reason, levelNumber, totalScore) {
    this.showHUD(false);
    this.gameOverReason.textContent = reason;
    this.statGameOverScore.textContent = String(totalScore).padStart(4, '0');
    this.statGameOverLevel.textContent = `Level ${levelNumber}`;
    this.gameOverScreen.classList.remove('hidden');
  }

  // Show Grand Victory Screen
  showVictory(stats, totalScore) {
    this.showHUD(false);
    this.statFinalHeadshots.textContent = stats.headshots;
    this.statFinalScore.textContent = String(totalScore).padStart(4, '0');

    let rank = 'SPECIAL FORCES OPERATIVE';
    if (stats.headshots >= 10 && totalScore > 400) {
      rank = 'MASTER SHADOW COMMANDO (S-RANK)';
    } else if (totalScore > 300) {
      rank = 'ELITE TACTICAL INFILTRATOR (A-RANK)';
    }
    this.statFinalRank.textContent = rank;
    this.victoryScreen.classList.remove('hidden');
  }

  hideAllModals() {
    this.startScreen.classList.add('hidden');
    this.levelCompleteScreen.classList.add('hidden');
    this.gameOverScreen.classList.add('hidden');
    this.victoryScreen.classList.add('hidden');
    this.pauseScreen.classList.add('hidden');
  }
}
