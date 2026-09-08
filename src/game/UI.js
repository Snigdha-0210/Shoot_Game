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

    // Weapon & Ammo
    this.weaponSlot1 = document.getElementById('weapon-slot-1');
    this.weaponSlot2 = document.getElementById('weapon-slot-2');
    this.weaponName = document.getElementById('hud-weapon-name');
    this.weaponCaliber = document.getElementById('hud-weapon-caliber');
    this.ammoClip = document.getElementById('hud-ammo-clip');
    this.ammoReserve = document.getElementById('hud-ammo-reserve');
    this.reloadPrompt = document.getElementById('hud-reload-prompt');

    // Equipment & Adrenaline
    this.smokeCount = document.getElementById('hud-smoke-count');
    this.adrenalineBar = document.getElementById('hud-adrenaline-bar');
    this.focusStatus = document.getElementById('hud-focus-status');

    // Health & Lifelines
    this.healthBar = document.getElementById('hud-health-bar');
    this.healthNum = document.getElementById('hud-health-num');
    this.noiseBar = document.getElementById('hud-noise-bar');
    this.noiseStatus = document.getElementById('hud-noise-status');
    this.stanceBadge = document.getElementById('hud-stance');
    this.interactionPrompt = document.getElementById('hud-interaction-prompt') || document.getElementById('interaction-prompt');
    this.scorePopups = document.getElementById('score-popups');

    // Boss HUD (Level 4)
    this.bossHud = document.getElementById('boss-hud');
    this.bossShieldFill = document.getElementById('boss-shield-fill');
    this.bossHealthFill = document.getElementById('boss-health-fill');

    // Combo Banner
    this.comboBanner = document.getElementById('combo-banner');
    this.comboText = document.getElementById('combo-text');
    this.comboBonus = document.getElementById('combo-bonus');

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
  update(player, bomb, score, currentLevel, levelNames, camera, enemies = []) {
    if (!player) return;

    // Level Header
    this.levelBadge.textContent = `LEVEL ${currentLevel}/4`;
    this.levelName.textContent = levelNames[currentLevel - 1] || 'INFILTRATION';

    // Score
    this.scoreVal.textContent = String(score).padStart(4, '0');

    // 1. Weapon Arsenal Slots & Ammo Info
    if (player.activeWeapon === 'primary') {
      this.weaponSlot1.classList.add('active');
      this.weaponSlot2.classList.remove('active');
      this.weaponName.textContent = 'M4A1-S CQB';
      this.weaponCaliber.textContent = '5.56 NATO SUPPRESSED';
    } else {
      this.weaponSlot1.classList.remove('active');
      this.weaponSlot2.classList.add('active');
      this.weaponName.textContent = 'USP-45 TACTICAL';
      this.weaponCaliber.textContent = '.45 ACP SUPPRESSED';
    }

    const curWep = player.curWeapon;
    this.ammoClip.textContent = curWep.clip;
    this.ammoReserve.textContent = curWep.reserve;
    if (curWep.clip <= 3 && !player.isReloading && curWep.reserve > 0) {
      this.reloadPrompt.classList.remove('hidden');
    } else {
      this.reloadPrompt.classList.add('hidden');
    }

    // 2. Equipment & Smoke Grenades
    this.smokeCount.textContent = `SMOKE GRENADE (${player.smokeGrenades})`;

    // 3. Adrenaline Focus Bullet-Time Meter
    const adrPct = Math.max(0, Math.min(100, player.adrenaline));
    this.adrenalineBar.style.width = `${adrPct}%`;
    if (player.isBulletTime) {
      this.focusStatus.textContent = 'ACTIVE (SLOW-MO)';
      this.focusStatus.className = 'focus-status active';
    } else if (player.adrenaline >= 30) {
      this.focusStatus.textContent = 'READY [SPACE]';
      this.focusStatus.className = 'focus-status ready';
    } else {
      this.focusStatus.textContent = 'RECHARGING...';
      this.focusStatus.className = 'focus-status';
    }

    // 4. Boss HUD (Level 4 Citadel Boss)
    const boss = enemies.find(e => e.archetype === 'boss' && !e.isDead);
    if (boss && currentLevel === 4) {
      this.bossHud.classList.remove('hidden');
      const shieldPct = Math.max(0, (boss.shield / boss.maxShield) * 100);
      const hpPct = Math.max(0, (boss.health / boss.maxHealth) * 100);
      this.bossShieldFill.style.width = `${shieldPct}%`;
      this.bossHealthFill.style.width = `${hpPct}%`;
    } else {
      this.bossHud.classList.add('hidden');
    }

    // 5. Bomb Timer, Distance & 3D Waypoint Tracking
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
        bombWorldPos.y += 2.2;

        const screenVec = bombWorldPos.project(camera);
        const isBehind = screenVec.z > 1;

        const halfW = window.innerWidth / 2;
        const halfH = window.innerHeight / 2;

        let screenX = (screenVec.x * halfW) + halfW;
        let screenY = -(screenVec.y * halfH) + halfH;

        this.waypointDistText.textContent = `${dist.toFixed(1)}m`;

        if (!isBehind && screenX > 60 && screenX < window.innerWidth - 60 && screenY > 60 && screenY < window.innerHeight - 60) {
          this.bombWaypoint.style.left = `${screenX}px`;
          this.bombWaypoint.style.top = `${screenY}px`;
          this.bombWaypoint.style.transform = 'translate(-50%, -100%)';
          this.waypointArrow.classList.add('hidden');
          this.bombWaypoint.classList.remove('hidden');
        } else {
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

    // 6. Health & Lifelines
    const hpPct = Math.max(0, (player.health / player.maxHealth) * 100);
    this.healthBar.style.width = `${hpPct}%`;
    this.healthNum.textContent = `${Math.round(hpPct)}%`;

    for (let i = 0; i < 3; i++) {
      if (i < player.lifelines) {
        this.lifePlates[i].classList.add('active');
      } else {
        this.lifePlates[i].classList.remove('active');
      }
    }

    // 7. Stealth Noise Meter
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

  // Trigger Killstreak Combo Banner
  triggerCombo(comboCount, points) {
    if (comboCount <= 1) return;

    this.comboText.textContent = comboCount >= 4 ? `UNSTOPPABLE x${comboCount}!` : `COMBO x${comboCount}!`;
    this.comboBonus.textContent = `+${points} PTS`;
    this.comboBanner.classList.remove('hidden');
    this.comboBanner.classList.add('pulse');

    clearTimeout(this.comboTimeout);
    this.comboTimeout = setTimeout(() => {
      this.comboBanner.classList.add('hidden');
      this.comboBanner.classList.remove('pulse');
    }, 1800);
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

  // Generic Notification Toast
  showNotification(text, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `score-toast ${type}`;
    toast.textContent = text;
    this.scorePopups.appendChild(toast);

    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 1200);
  }

  // Floating score toast
  showScoreToast(text, type = 'body') {
    this.showNotification(text, type);
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

