import * as THREE from 'three';
import { audio } from '../engine/Audio.js';

export class HitboxManager {
  constructor() {
    this.raycaster = new THREE.Raycaster();
    this.score = 0;
    this.stats = {
      headshots: 0,
      bodyshots: 0,
      hitsTaken: 0,
      enemiesKilled: 0
    };

    // Kill Combo Multiplier Chain
    this.comboCount = 0;
    this.comboTimer = 0;
    this.comboMaxTime = 3.5; // 3.5s window to chain kills
  }

  reset(keepScore = false) {
    if (!keepScore) {
      this.score = 0;
      this.stats = {
        headshots: 0,
        bodyshots: 0,
        hitsTaken: 0,
        enemiesKilled: 0
      };
    }
    this.comboCount = 0;
    this.comboTimer = 0;
  }

  update(delta) {
    if (this.comboTimer > 0) {
      this.comboTimer -= delta;
      if (this.comboTimer <= 0) {
        this.comboCount = 0;
      }
    }
  }

  // Handle enemy shooting player (-3 points penalty)
  registerPlayerHit() {
    this.score = Math.max(0, this.score - 3);
    this.stats.hitsTaken++;
    this.comboCount = 0; // Break combo on hit
    this.comboTimer = 0;
    return {
      type: 'penalty',
      points: -3,
      score: this.score
    };
  }

  // Perform operative bullet raycast
  fireRaycast(camera, enemies, levelColliders, renderer, activeWeapon = 'primary') {
    this.raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);

    // Collect all candidate target meshes
    const targetMeshes = [];
    enemies.forEach(enemy => {
      if (!enemy.isDead) {
        targetMeshes.push(...enemy.hitMeshes);
      }
    });

    const wallMeshes = [];
    levelColliders.forEach(c => {
      if (c.mesh) wallMeshes.push(c.mesh);
    });

    const allCandidates = [...targetMeshes, ...wallMeshes];
    const intersections = this.raycaster.intersectObjects(allCandidates, false);

    if (intersections.length === 0) return null;

    const firstHit = intersections[0];
    const hitObj = firstHit.object;

    // Check if enemy was hit
    if (hitObj.userData && hitObj.userData.enemy) {
      const enemy = hitObj.userData.enemy;
      const isHead = !!hitObj.userData.isHead;
      const wasUnaware = enemy.state === 'patrol';
      const wasAlive = !enemy.isDead;

      const baseDamage = activeWeapon === 'secondary' ? 25 : 20;
      const headDamage = activeWeapon === 'secondary' ? 60 : 50;

      if (isHead) {
        // --- HEADSHOT: +15 POINTS + COMBO MULTIPLIER ---
        this.comboCount++;
        this.comboTimer = this.comboMaxTime;

        let points = 15 * this.comboCount;
        if (wasUnaware) {
          points += 25; // Stealth Assassin Bonus!
        }

        this.score += points;
        this.stats.headshots++;

        enemy.onHit(true, headDamage);

        if (this.comboCount > 1) {
          audio.playComboChime(this.comboCount);
        } else {
          audio.playHeadshotKill();
        }

        renderer.spawnBloodPuff(firstHit.point, 20);
        renderer.spawnSparks(firstHit.point, firstHit.face ? firstHit.face.normal : new THREE.Vector3(0, 1, 0), 0xffd700, 12);

        let died = false;
        if (wasAlive && enemy.isDead) {
          this.stats.enemiesKilled++;
          died = true;
        }

        return {
          type: 'headshot',
          points,
          score: this.score,
          hitPoint: firstHit.point,
          comboCount: this.comboCount,
          isStealth: wasUnaware,
          enemyDied: died,
          enemyPos: enemy.root.position.clone()
        };
      } else {
        // --- BODY SHOT: +5 POINTS ---
        let points = 5;
        this.score += points;
        this.stats.bodyshots++;

        enemy.onHit(false, baseDamage);

        let died = false;
        if (wasAlive && enemy.isDead) {
          this.stats.enemiesKilled++;
          died = true;
        }

        audio.playBodyHit();
        renderer.spawnBloodPuff(firstHit.point, 12);

        return {
          type: 'body',
          points,
          score: this.score,
          hitPoint: firstHit.point,
          enemyDied: died,
          enemyPos: enemy.root.position.clone()
        };
      }
    }

    // Hit wall / obstacle
    if (firstHit.face) {
      renderer.spawnSparks(firstHit.point, firstHit.face.normal, 0xffaa33, 8);
    }
    return null;
  }
}

