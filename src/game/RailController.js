import * as THREE from 'three';

export class RailController {
  constructor() {
    this.waypoints = [];
    this.currentWaypointIndex = 0;
    this.enemies = [];
    this.bomb = null;
    this.currentLevel = 1;

    this.state = 'IDLE'; // 'IDLE' | 'MOVING' | 'ENGAGING' | 'ARRIVED_AT_BOMB' | 'COMPLETED'
    this.moveSpeed = 5.8;
    this.targetEnemy = null;
    this.lastTargetEnemy = null;
    this.isTargetLocked = false;
    this.killPauseTimer = 0;

    // Decreasing Reaction Window (Quick-Draw)
    this.reactionTimeMax = 2.4;
    this.reactionTimer = 2.4;
  }

  // Generate randomized procedural combat task / key sequence for an enemy (Strictly 3 Buttons: C, V, SPACE)
  generateCombatTask(levelNumber, enemyIndex, archetype = 'scout') {
    const lvl = Math.max(1, Math.min(4, levelNumber || 1));
    const idx = Math.max(0, Math.min(3, enemyIndex || 0));

    // 3 Hardware / Arcade Buttons: C, V, SPACE (Compatible with 3-button breadboard hardware)
    const actionButtons = ['C', 'V', 'SPACE'];
    const cipherButtons = ['C', 'V'];

    let sequenceLength = 1;
    let reactionTime = 2.5;

    if (lvl === 1) {
      // Level 1: 1-2 buttons, generous reaction window
      sequenceLength = idx === 0 ? 1 : (Math.random() < 0.6 ? 2 : 1);
      reactionTime = idx === 0 ? 3.0 : 2.6;
    } else if (lvl === 2) {
      // Level 2: 2 buttons, moderate reaction window
      sequenceLength = 2;
      reactionTime = idx === 0 ? 2.4 : 2.1;
    } else if (lvl === 3) {
      // Level 3: 2-3 buttons, fast reaction window
      sequenceLength = idx === 0 ? 2 : 3;
      reactionTime = idx === 0 ? 2.0 : 1.8;
    } else {
      // Level 4 (Citadel): 3 buttons for guards, 4 buttons for General Malikov Boss
      if (archetype === 'boss') {
        sequenceLength = 4;
        reactionTime = 2.4;
      } else {
        sequenceLength = 3;
        reactionTime = idx === 0 ? 1.8 : 1.6;
      }
    }

    // Build random sequence using strictly C, V, SPACE without immediate duplicate adjacent keys
    const sequence = [];
    for (let s = 0; s < sequenceLength; s++) {
      let candidate;
      let attempts = 0;
      do {
        // Last step has a 50% chance to be SPACE trigger on multi-key sequences
        if (s === sequenceLength - 1 && sequenceLength > 1 && Math.random() < 0.5) {
          candidate = 'SPACE';
        } else {
          candidate = cipherButtons[Math.floor(Math.random() * cipherButtons.length)];
        }
        attempts++;
      } while (sequence.length > 0 && candidate === sequence[sequence.length - 1] && attempts < 10);

      sequence.push(candidate);
    }

    return {
      sequence: sequence,
      currentIndex: 0,
      timeMax: reactionTime,
      archetype: archetype
    };
  }

  // Dynamic quick-draw reaction time formula (fraction-of-a-second scaling across 4 levels for 2-3 enemies)
  getReactionTimeMax(levelNumber, enemyIndex, archetype = 'scout') {
    if (archetype === 'boss') return 2.4;
    const lvl = Math.max(1, Math.min(4, levelNumber || 1));
    const idx = Math.max(0, Math.min(2, enemyIndex || 0));

    const reactionTable = {
      1: [3.0, 2.6, 2.4],
      2: [2.4, 2.2, 2.0],
      3: [2.0, 1.8, 1.7],
      4: [1.8, 1.6, 1.5]
    };

    return reactionTable[lvl] ? reactionTable[lvl][idx] : 2.0;
  }

  // Initialize level rail with waypoints, enemies, and the bomb
  initLevelRail(waypoints, enemies, bomb, player, currentLevel = 1) {
    this.waypoints = waypoints || [];
    this.currentWaypointIndex = 1; // Start moving towards waypoint 1 (first combat stop)
    this.enemies = enemies || [];
    this.bomb = bomb;
    this.currentLevel = currentLevel || 1;
    this.state = 'MOVING'; // Start in sprint traversal mode
    this.isTargetLocked = false;
    this.targetEnemy = null;
    this.lastTargetEnemy = null;
    this.killPauseTimer = 0;
    this.reactionTimeMax = 2.4;
    this.reactionTimer = 2.4;

    // Assign procedural combat task to each enemy
    this.enemies.forEach((enemy, idx) => {
      enemy.combatTask = this.generateCombatTask(this.currentLevel, idx, enemy.archetype);
    });

    if (this.waypoints.length > 0 && player) {
      player.yawNode.position.set(this.waypoints[0].x, 0, this.waypoints[0].z);

      // Face towards next waypoint
      let startYaw = 0;
      if (this.waypoints.length > 1) {
        const dx = this.waypoints[1].x - this.waypoints[0].x;
        const dz = this.waypoints[1].z - this.waypoints[0].z;
        startYaw = Math.atan2(-dx, -dz);
      }
      player.yaw = startYaw;
      player.pitch = 0;
      player.yawNode.rotation.y = startYaw;
      player.pitchNode.rotation.x = 0;
      player.pitchNode.position.y = player.standHeight || 1.7;
    }
  }

  // Get active living enemy for engagement (always finds the first alive enemy)
  getActiveEnemy() {
    if (!this.enemies || this.enemies.length === 0) return null;
    return this.enemies.find(e => !e.isDead) || null;
  }

  // Get active living enemy's index in the sector (0, 1, or 2)
  getActiveEnemyIndex() {
    if (!this.enemies || this.enemies.length === 0) return 0;
    const idx = this.enemies.findIndex(e => !e.isDead);
    return idx >= 0 ? idx : 0;
  }

  // Process combat input (normalized strictly to 3 buttons: 'C', 'V', 'SPACE')
  processCombatInput(rawInput) {
    if (!this.isTargetLocked || !this.targetEnemy || this.targetEnemy.isDead) {
      return { status: 'IGNORED' };
    }

    const enemy = this.targetEnemy;
    if (!enemy.combatTask) {
      const idx = this.getActiveEnemyIndex();
      enemy.combatTask = this.generateCombatTask(this.currentLevel, idx, enemy.archetype);
    }

    const task = enemy.combatTask;
    const expectedKey = task.sequence[task.currentIndex];

    // Normalize raw input to 3 buttons: C, V, SPACE (hardware & breadboard compatible)
    let normalized = String(rawInput || '').toUpperCase().trim();
    if (normalized === 'KEYC' || normalized === 'C' || normalized === 'DIGIT1' || normalized === 'NUMPAD1' || normalized === '1') normalized = 'C';
    else if (normalized === 'KEYV' || normalized === 'V' || normalized === 'DIGIT2' || normalized === 'NUMPAD2' || normalized === '2') normalized = 'V';
    else if (normalized === 'SPACE' || normalized === 'ENTER' || normalized === 'NUMPADENTER' || normalized === 'KEYF' || normalized === 'KEYZ' || normalized === 'TRIGGER' || normalized === 'LMB' || normalized === 'DIGIT3' || normalized === 'NUMPAD3' || normalized === '3' || normalized === ' ') normalized = 'SPACE';

    if (normalized === expectedKey) {
      // Correct input! Advance step
      task.currentIndex++;
      if (task.currentIndex >= task.sequence.length) {
        // Combat task completed -> Neutralize hostile!
        return {
          status: 'COMPLETE',
          enemy: enemy,
          step: task.currentIndex,
          total: task.sequence.length
        };
      } else {
        return {
          status: 'PROGRESS',
          enemy: enemy,
          step: task.currentIndex,
          total: task.sequence.length,
          nextExpected: task.sequence[task.currentIndex]
        };
      }
    } else {
      // Wrong key penalty: deduct 0.25s from reaction timer & buzz error
      this.reactionTimer = Math.max(0.1, this.reactionTimer - 0.25);
      return {
        status: 'ERROR',
        enemy: enemy,
        expected: expectedKey,
        received: normalized,
        step: task.currentIndex,
        total: task.sequence.length
      };
    }
  }

  // Update rail motion, auto-aim, and quick-draw reaction window
  update(delta, player, onArriveAtBombCallback, onReactionExpireCallback) {
    if (this.state === 'IDLE' || this.state === 'COMPLETED' || !player) return;

    // Brief post-kill delay (savor kill effect before sprinting)
    if (this.killPauseTimer > 0) {
      this.killPauseTimer -= delta;
      this.isTargetLocked = false;
      this.targetEnemy = null;
      return;
    }

    const activeEnemy = this.getActiveEnemy();

    // 1. All enemies neutralized in sector -> Rapid sprint to Bomb Defusal Station
    if (!activeEnemy) {
      this.targetEnemy = null;
      this.lastTargetEnemy = null;
      this.isTargetLocked = false;
      this.moveSpeed = 12.0; // High-speed sprint to bomb terminal

      const targetWaypointIdx = this.waypoints.length - 1;
      const targetWaypoint = this.waypoints[targetWaypointIdx];
      const playerPos = player.yawNode.position;

      const distToBomb = this.bomb ? playerPos.distanceTo(this.bomb.position) : 999;

      if (distToBomb <= 4.2 || playerPos.distanceTo(targetWaypoint) < 1.0) {
        this.state = 'ARRIVED_AT_BOMB';
        if (this.bomb) {
          this.autoAimAtBomb(player, this.bomb, delta);
        }
        if (onArriveAtBombCallback) {
          onArriveAtBombCallback();
        }
        return;
      }

      // Move along rail towards bomb
      const toTarget = new THREE.Vector3().subVectors(targetWaypoint, playerPos);
      toTarget.y = 0;
      const distToWaypoint = toTarget.length();

      if (distToWaypoint > 0.05) {
        toTarget.normalize();
        const moveStep = Math.min(distToWaypoint, this.moveSpeed * delta);
        player.yawNode.position.x += toTarget.x * moveStep;
        player.yawNode.position.z += toTarget.z * moveStep;
      }

      const walkYaw = Math.atan2(-toTarget.x, -toTarget.z);
      player.yaw = this.lerpAngle(player.yaw, walkYaw, Math.min(1.0, delta * 12.0));
      player.pitch = THREE.MathUtils.lerp(player.pitch, 0, Math.min(1.0, delta * 12.0));
      player.yawNode.rotation.y = player.yaw;
      player.pitchNode.rotation.x = player.pitch;
      return;
    }

    // 2. We have an active living hostile
    const idx = this.getActiveEnemyIndex();
    const targetWaypointIdx = Math.min(this.waypoints.length - 1, idx + 1);
    const targetWaypoint = this.waypoints[targetWaypointIdx];
    const playerPos = player.yawNode.position;
    const toWaypoint = new THREE.Vector3().subVectors(targetWaypoint, playerPos);
    toWaypoint.y = 0;
    const distToWaypoint = toWaypoint.length();

    // STATE A: MOVING (Sprinting down the corridor towards the next enemy standoff)
    if (this.state === 'MOVING') {
      this.isTargetLocked = false; // Strict: No target lock HUD while sprinting!
      this.targetEnemy = null;
      this.moveSpeed = 6.5; // Steady corridor advance

      if (distToWaypoint > 0.05) {
        toWaypoint.normalize();
        const moveStep = Math.min(distToWaypoint, this.moveSpeed * delta);
        player.yawNode.position.x += toWaypoint.x * moveStep;
        player.yawNode.position.z += toWaypoint.z * moveStep;
      }

      // Look straight ahead in the corridor along travel vector
      const walkYaw = Math.atan2(-toWaypoint.x, -toWaypoint.z);
      player.yaw = this.lerpAngle(player.yaw, walkYaw, Math.min(1.0, delta * 10.0));
      player.pitch = THREE.MathUtils.lerp(player.pitch, 0, Math.min(1.0, delta * 10.0));
      player.yawNode.rotation.y = player.yaw;
      player.pitchNode.rotation.x = player.pitch;

      // Arrived at combat standoff position!
      if (distToWaypoint <= 1.0) {
        this.state = 'ENGAGING';
        this.targetEnemy = activeEnemy;
        this.isTargetLocked = true;
        if (!activeEnemy.combatTask) {
          activeEnemy.combatTask = this.generateCombatTask(this.currentLevel, idx, activeEnemy.archetype);
        }
        this.reactionTimeMax = activeEnemy.combatTask.timeMax || this.getReactionTimeMax(this.currentLevel, idx, activeEnemy.archetype);
        this.reactionTimer = this.reactionTimeMax;
      }
      return;
    }

    // STATE B: ENGAGING (Arrived at Standoff Point -> Lock On & QTE Countdown Active)
    if (this.state === 'ENGAGING') {
      this.targetEnemy = activeEnemy;
      this.isTargetLocked = true;

      // Direct precision lock-on centering on enemy head
      this.autoAimAtEnemy(player, activeEnemy, delta);

      // Countdown quick-draw reaction timer
      this.reactionTimer -= delta;

      if (this.reactionTimer <= 0) {
        this.reactionTimer = 0;
        // Hostile fires lethal shot: Instant mission failure callback!
        if (onReactionExpireCallback) {
          onReactionExpireCallback(activeEnemy);
        }
        return;
      }
    }
  }

  // Direct precision lock-on centering on enemy head
  autoAimAtEnemy(player, enemy, delta) {
    if (!player || !enemy) return;

    const eyePos = player.yawNode.position.clone();
    eyePos.y += player.standHeight || 1.7;

    const targetPos = new THREE.Vector3();
    if (enemy.headGroup) {
      enemy.headGroup.getWorldPosition(targetPos);
    } else {
      enemy.root.getWorldPosition(targetPos);
      targetPos.y += 1.55;
    }

    const dir = new THREE.Vector3().subVectors(targetPos, eyePos).normalize();

    const desiredYaw = Math.atan2(-dir.x, -dir.z);
    const desiredPitch = Math.asin(Math.max(-0.95, Math.min(0.95, dir.y)));

    // Sharp, instantaneous lock-on tracking
    player.yaw = this.lerpAngle(player.yaw, desiredYaw, Math.min(1.0, delta * 30.0));
    player.pitch = THREE.MathUtils.lerp(player.pitch, desiredPitch, Math.min(1.0, delta * 30.0));

    player.yawNode.rotation.y = player.yaw;
    player.pitchNode.rotation.x = player.pitch;

    this.isTargetLocked = true;
  }

  // Auto-aim slightly down towards bomb when arrived
  autoAimAtBomb(player, bomb, delta) {
    if (!player || !bomb) return;

    const eyePos = player.yawNode.position.clone();
    eyePos.y += player.standHeight || 1.7;

    const bombPos = bomb.position.clone();
    bombPos.y += 0.35;

    const dir = new THREE.Vector3().subVectors(bombPos, eyePos).normalize();
    const desiredYaw = Math.atan2(-dir.x, -dir.z);
    const desiredPitch = Math.asin(Math.max(-0.95, Math.min(0.95, dir.y)));

    player.yaw = this.lerpAngle(player.yaw, desiredYaw, Math.min(1.0, delta * 12.0));
    player.pitch = THREE.MathUtils.lerp(player.pitch, desiredPitch, Math.min(1.0, delta * 12.0));

    player.yawNode.rotation.y = player.yaw;
    player.pitchNode.rotation.x = player.pitch;
  }

  // Helper for shortest angle interpolation
  lerpAngle(a, b, t) {
    let diff = (b - a) % (Math.PI * 2);
    if (diff < -Math.PI) diff += Math.PI * 2;
    if (diff > Math.PI) diff -= Math.PI * 2;
    return a + diff * THREE.MathUtils.clamp(t, 0, 1);
  }
}


