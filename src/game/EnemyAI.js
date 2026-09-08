import * as THREE from 'three';
import { audio } from '../engine/Audio.js';

export class EnemyAIManager {
  constructor(scene, colliders = []) {
    this.scene = scene;
    this.colliders = colliders;
    this.enemies = [];
    this.raycaster = new THREE.Raycaster();
  }

  addEnemy(enemy) {
    this.enemies.push(enemy);
  }

  clear() {
    this.enemies.forEach(e => e.destroy());
    this.enemies = [];
  }

  // Update all AI behaviors
  update(delta, player, onPlayerHitCallback) {
    const playerPos = player.position;

    for (const enemy of this.enemies) {
      if (enemy.isDead) {
        enemy.update(delta, playerPos);
        continue;
      }

      const enemyPos = enemy.root.position;
      const distToPlayer = enemyPos.distanceTo(playerPos);

      // 1. Perception Check (Vision + Hearing)
      const canSee = this.checkVision(enemy, player);
      const canHear = this.checkHearing(enemy, player, distToPlayer);

      // State transitions
      if (canSee) {
        if (enemy.state !== 'combat') {
          audio.playEnemyAlert();
        }
        enemy.state = 'combat';
        enemy.alertLevel = 1.0;
      } else if (canHear && enemy.state === 'patrol') {
        enemy.state = 'suspicious';
        enemy.investigateTarget = playerPos.clone();
      }

      // 2. State execution
      if (enemy.state === 'combat') {
        this.handleCombatState(enemy, player, distToPlayer, delta, onPlayerHitCallback);
      } else if (enemy.state === 'suspicious') {
        this.handleSuspiciousState(enemy, delta);
      } else {
        this.handlePatrolState(enemy, delta);
      }

      enemy.update(delta, playerPos);
    }
  }

  // Check Line of Sight and Vision Cone
  checkVision(enemy, player) {
    const enemyPos = enemy.root.position;
    const playerPos = player.position;
    const dist = enemyPos.distanceTo(playerPos);

    // Max vision range (reduced if player is crouching in stealth)
    const maxDist = player.isCrouching ? 15 : 28;
    if (dist > maxDist) return false;

    // Check FOV Angle (forward is in Z+ direction relative to enemy orientation)
    const forward = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), enemy.root.rotation.y);
    const toPlayer = new THREE.Vector3().subVectors(playerPos, enemyPos).normalize();
    const dot = forward.dot(toPlayer);

    // 100-degree field of view (cos(50°) ≈ 0.64)
    if (dot < 0.60 && dist > 3.0) return false;

    // Raycast obstacle check
    const startRay = new THREE.Vector3(enemyPos.x, enemyPos.y + 1.5, enemyPos.z);
    const targetRay = new THREE.Vector3(playerPos.x, player.currentHeight || 1.5, playerPos.z);
    const dir = new THREE.Vector3().subVectors(targetRay, startRay).normalize();

    this.raycaster.set(startRay, dir);
    this.raycaster.far = dist;

    // Check against level walls/crates
    const meshesToCheck = [];
    this.colliders.forEach(box => {
      if (box.mesh) meshesToCheck.push(box.mesh);
    });

    const hits = this.raycaster.intersectObjects(meshesToCheck, false);
    return hits.length === 0; // Clear line of sight
  }

  // Check Acoustic Noise Hearing
  checkHearing(enemy, player, dist) {
    const noise = player.noiseLevel; // 0.0 to 1.0
    const hearingRadius = noise * 22; // up to 22m when sprinting
    return dist <= hearingRadius;
  }

  // Combat: aim, shoot, and damage player
  handleCombatState(enemy, player, dist, delta, onPlayerHitCallback) {
    // Face player
    const dx = player.position.x - enemy.root.position.x;
    const dz = player.position.z - enemy.root.position.z;
    enemy.root.rotation.y = Math.atan2(dx, dz);

    // Shoot bursts
    if (enemy.shootCooldown <= 0 && !player.isDead) {
      enemy.shootCooldown = 0.7 + Math.random() * 0.4;
      audio.playEnemyGunfire(dist);

      // Hit probability calculation based on distance and player movement
      let hitChance = Math.max(0.2, 0.85 - dist * 0.025);
      if (player.isCrouching) hitChance *= 0.7; // Crouch provides cover/smaller profile
      if (player.velocity.lengthSq() > 10) hitChance *= 0.75; // Harder to hit moving player

      if (Math.random() < hitChance) {
        player.takeDamage(15);
        if (onPlayerHitCallback) {
          onPlayerHitCallback();
        }
      }
    }
  }

  // Suspicious: walk towards noise source
  handleSuspiciousState(enemy, delta) {
    if (!enemy.investigateTarget) {
      enemy.state = 'patrol';
      return;
    }

    const enemyPos = enemy.root.position;
    const dir = new THREE.Vector3().subVectors(enemy.investigateTarget, enemyPos);
    dir.y = 0;
    const dist = dir.length();

    if (dist < 1.5) {
      // Reached investigation point, found nothing
      enemy.state = 'patrol';
      enemy.investigateTarget = null;
      return;
    }

    dir.normalize();
    enemy.root.rotation.y = Math.atan2(dir.x, dir.z);
    enemy.root.position.x += dir.x * enemy.speed * 0.8 * delta;
    enemy.root.position.z += dir.z * enemy.speed * 0.8 * delta;
  }

  // Patrol: follow waypoints loop
  handlePatrolState(enemy, delta) {
    if (!enemy.waypoints || enemy.waypoints.length === 0) return;

    const targetWaypoint = enemy.waypoints[enemy.currentWaypointIdx];
    const enemyPos = enemy.root.position;
    const dir = new THREE.Vector3().subVectors(targetWaypoint, enemyPos);
    dir.y = 0;
    const dist = dir.length();

    if (dist < 0.8) {
      // Move to next waypoint
      enemy.currentWaypointIdx = (enemy.currentWaypointIdx + 1) % enemy.waypoints.length;
      return;
    }

    dir.normalize();
    enemy.root.rotation.y = Math.atan2(dir.x, dir.z);
    enemy.root.position.x += dir.x * enemy.speed * delta;
    enemy.root.position.z += dir.z * enemy.speed * delta;
  }
}
