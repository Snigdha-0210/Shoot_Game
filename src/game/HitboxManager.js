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
  }

  // Handle enemy shooting player (-3 points penalty)
  registerPlayerHit() {
    this.score = Math.max(0, this.score - 3);
    this.stats.hitsTaken++;
    return {
      type: 'penalty',
      points: -3,
      score: this.score
    };
  }

  // Perform operative bullet raycast
  fireRaycast(camera, enemies, levelColliders, renderer) {
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

      if (isHead) {
        // --- HEADSHOT: +15 POINTS ---
        this.score += 15;
        this.stats.headshots++;
        this.stats.enemiesKilled++;
        
        enemy.onHit(true, 50);
        audio.playHeadshotKill();
        renderer.spawnBloodPuff(firstHit.point, 20);
        renderer.spawnSparks(firstHit.point, firstHit.face ? firstHit.face.normal : new THREE.Vector3(0, 1, 0), 0xffd700, 10);

        return {
          type: 'headshot',
          points: 15,
          score: this.score,
          hitPoint: firstHit.point
        };
      } else {
        // --- BODY SHOT: +5 POINTS ---
        this.score += 5;
        this.stats.bodyshots++;
        
        const wasAlive = !enemy.isDead;
        enemy.onHit(false, 15);
        if (wasAlive && enemy.isDead) {
          this.stats.enemiesKilled++;
        }

        audio.playBodyHit();
        renderer.spawnBloodPuff(firstHit.point, 12);

        return {
          type: 'body',
          points: 5,
          score: this.score,
          hitPoint: firstHit.point
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
