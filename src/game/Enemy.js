import * as THREE from 'three';
import { audio } from '../engine/Audio.js';

export class Enemy {
  constructor(scene, x, y, z, waypoints = [], archetype = 'scout') {
    this.scene = scene;
    this.waypoints = waypoints;
    this.currentWaypointIdx = 0;
    this.archetype = archetype; // 'scout' | 'juggernaut' | 'sniper' | 'boss'

    // Archetype-specific attributes
    this.isDead = false;
    this.deathTimer = 0;
    this.state = 'patrol'; // 'patrol' | 'suspicious' | 'combat'
    this.alertLevel = 0.0;
    this.shootCooldown = 0;
    this.isBlindedBySmoke = false;
    this.smokeBlindTimer = 0;

    // Archetype Stats
    if (this.archetype === 'juggernaut') {
      this.maxHealth = 60;
      this.health = 60;
      this.speed = 1.6;
      this.damage = 25;
      this.burstCount = 4;
      this.burstDelay = 1.2;
      this.headshotMultiplier = 0.5; // Requires 2 headshots
    } else if (this.archetype === 'sniper') {
      this.maxHealth = 30;
      this.health = 30;
      this.speed = 0.5; // Stationary/perch sniper
      this.damage = 45;
      this.aimTime = 0;
      this.aimMaxTime = 1.5; // 1.5s lock-on before shot
      this.burstCount = 1;
      this.burstDelay = 2.4;
      this.headshotMultiplier = 1.0;
    } else if (this.archetype === 'boss') {
      this.maxShield = 80;
      this.shield = 80;
      this.maxHealth = 60;
      this.health = 60;
      this.speed = 2.2;
      this.damage = 30;
      this.burstCount = 5;
      this.burstDelay = 1.0;
      this.headshotMultiplier = 0.4;
    } else {
      // Default: Scout
      this.maxHealth = 25;
      this.health = 25;
      this.speed = 3.2;
      this.damage = 15;
      this.burstCount = 3;
      this.burstDelay = 0.9;
      this.headshotMultiplier = 1.0;
    }

    this.buildModel(x, y, z);
  }

  buildModel(x, y, z) {
    this.root = new THREE.Group();
    this.root.position.set(x, y, z);

    // Color Palettes based on Archetype
    let uniformColor = 0x181c22;
    let vestColor = 0x0e1114;
    let visorColor = 0x00ff88;
    let gunColor = 0x141618;

    if (this.archetype === 'juggernaut') {
      uniformColor = 0x22262c;
      vestColor = 0x3a404a;
      visorColor = 0xff2233; // Menacing red visor
    } else if (this.archetype === 'sniper') {
      uniformColor = 0x1e2820;
      vestColor = 0x121a14;
      visorColor = 0xffaa00; // Amber scope optic
    } else if (this.archetype === 'boss') {
      uniformColor = 0x111318;
      vestColor = 0xd4af37; // Gold trim plate carrier
      visorColor = 0x00f0ff; // Cyan cybernetic visor
    }

    const uniformMat = new THREE.MeshStandardMaterial({ color: uniformColor, roughness: 0.8 });
    const vestMat = new THREE.MeshStandardMaterial({ color: vestColor, roughness: 0.5, metalness: 0.4 });
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xb58c70, roughness: 0.7 });
    const gunMat = new THREE.MeshStandardMaterial({ color: gunColor, roughness: 0.3, metalness: 0.8 });
    const visorMat = new THREE.MeshBasicMaterial({ color: visorColor });

    // --- Torso & Armor ---
    const torsoScaleX = this.archetype === 'juggernaut' ? 0.68 : (this.archetype === 'boss' ? 0.6 : 0.52);
    const torsoScaleZ = this.archetype === 'juggernaut' ? 0.42 : 0.32;
    const torsoGeom = new THREE.BoxGeometry(torsoScaleX, 0.7, torsoScaleZ);
    this.torso = new THREE.Mesh(torsoGeom, vestMat);
    this.torso.position.y = 1.05;
    this.torso.castShadow = true;
    this.torso.receiveShadow = true;
    this.torso.userData = { enemy: this, isBody: true };
    this.root.add(this.torso);

    // Juggernaut Heavy Shoulder Pauldrons
    if (this.archetype === 'juggernaut' || this.archetype === 'boss') {
      const pauldronGeom = new THREE.BoxGeometry(0.2, 0.22, 0.25);
      const leftPauldron = new THREE.Mesh(pauldronGeom, vestMat);
      leftPauldron.position.set(-0.38, 0.28, 0);
      this.torso.add(leftPauldron);

      const rightPauldron = new THREE.Mesh(pauldronGeom, vestMat);
      rightPauldron.position.set(0.38, 0.28, 0);
      this.torso.add(rightPauldron);
    }

    // --- Boss Energy Shield Holographic Mesh ---
    if (this.archetype === 'boss') {
      const shieldGeo = new THREE.SphereGeometry(1.3, 16, 16);
      const shieldMat = new THREE.MeshBasicMaterial({
        color: 0x00e5ff,
        wireframe: true,
        transparent: true,
        opacity: 0.45
      });
      this.shieldMesh = new THREE.Mesh(shieldGeo, shieldMat);
      this.shieldMesh.position.y = 1.1;
      this.root.add(this.shieldMesh);
    }

    // --- Head, Mask & Helmet ---
    this.headGroup = new THREE.Group();
    this.headGroup.position.set(0, 1.55, 0);

    const headGeom = new THREE.SphereGeometry(0.16, 12, 12);
    this.headMesh = new THREE.Mesh(headGeom, uniformMat);
    this.headMesh.userData = { enemy: this, isHead: true };
    this.headGroup.add(this.headMesh);

    // Helmet
    const helmetRadius = this.archetype === 'juggernaut' ? 0.22 : 0.19;
    const helmetGeom = new THREE.SphereGeometry(helmetRadius, 14, 14, 0, Math.PI * 2, 0, Math.PI * 0.6);
    const helmet = new THREE.Mesh(helmetGeom, vestMat);
    helmet.position.y = 0.02;
    helmet.userData = { enemy: this, isHead: true };
    this.headGroup.add(helmet);

    // Visor / Optics
    if (this.archetype === 'juggernaut') {
      // Full face ballistic visor slit
      const visorGeom = new THREE.BoxGeometry(0.24, 0.06, 0.08);
      const visor = new THREE.Mesh(visorGeom, visorMat);
      visor.position.set(0, 0.02, 0.18);
      this.headGroup.add(visor);
    } else {
      // NVG Dual Tubes
      for (let i = -1; i <= 1; i += 2) {
        const nvgTubeGeom = new THREE.CylinderGeometry(0.032, 0.032, 0.12, 10);
        nvgTubeGeom.rotateX(Math.PI / 2);
        const nvgTube = new THREE.Mesh(nvgTubeGeom, gunMat);
        nvgTube.position.set(i * 0.065, 0.04, 0.18);

        const nvgLensGeom = new THREE.CircleGeometry(0.03, 10);
        const nvgLens = new THREE.Mesh(nvgLensGeom, visorMat);
        nvgLens.position.set(0, 0, 0.062);
        nvgTube.add(nvgLens);
        this.headGroup.add(nvgTube);
      }
    }

    this.root.add(this.headGroup);

    // --- Legs ---
    this.leftLeg = new THREE.Group();
    this.leftLeg.position.set(-0.16, 0.75, 0);
    const legGeom = new THREE.BoxGeometry(0.17, 0.75, 0.19);
    const lLegMesh = new THREE.Mesh(legGeom, uniformMat);
    lLegMesh.position.y = -0.375;
    lLegMesh.castShadow = true;
    lLegMesh.userData = { enemy: this, isBody: true };
    this.leftLeg.add(lLegMesh);
    this.root.add(this.leftLeg);

    this.rightLeg = new THREE.Group();
    this.rightLeg.position.set(0.16, 0.75, 0);
    const rLegMesh = new THREE.Mesh(legGeom, uniformMat);
    rLegMesh.position.y = -0.375;
    rLegMesh.castShadow = true;
    rLegMesh.userData = { enemy: this, isBody: true };
    this.rightLeg.add(rLegMesh);
    this.root.add(this.rightLeg);

    // --- Arms & Weaponry ---
    this.armsGroup = new THREE.Group();
    this.armsGroup.position.set(0, 1.25, 0);

    const armGeom = new THREE.BoxGeometry(0.13, 0.48, 0.15);
    this.leftArm = new THREE.Mesh(armGeom, uniformMat);
    this.leftArm.position.set(-0.3, -0.15, 0.18);
    this.leftArm.rotation.x = -0.65;
    this.leftArm.rotation.y = 0.45;
    this.leftArm.userData = { enemy: this, isBody: true };
    this.armsGroup.add(this.leftArm);

    this.rightArm = new THREE.Mesh(armGeom, uniformMat);
    this.rightArm.position.set(0.3, -0.15, 0.12);
    this.rightArm.rotation.x = -0.75;
    this.rightArm.rotation.y = -0.22;
    this.rightArm.userData = { enemy: this, isBody: true };
    this.armsGroup.add(this.rightArm);

    // Weapon Mesh
    const rifleLen = this.archetype === 'sniper' ? 1.1 : (this.archetype === 'juggernaut' ? 0.85 : 0.65);
    const rifleGeom = new THREE.BoxGeometry(0.07, 0.11, rifleLen);
    this.rifle = new THREE.Mesh(rifleGeom, gunMat);
    this.rifle.position.set(0.08, -0.12, rifleLen * 0.55);
    this.armsGroup.add(this.rifle);

    // Sniper Laser Aim Beam
    if (this.archetype === 'sniper') {
      const laserGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0, 50)
      ]);
      const laserMat = new THREE.LineBasicMaterial({
        color: 0xff0044,
        transparent: true,
        opacity: 0.85,
        linewidth: 2
      });
      this.sniperLaser = new THREE.Line(laserGeo, laserMat);
      this.sniperLaser.position.set(0.08, -0.12, rifleLen);
      this.armsGroup.add(this.sniperLaser);
    }

    // Weapon Flashlight
    this.flashlight = new THREE.SpotLight(
      this.archetype === 'juggernaut' ? 0xff4444 : (this.archetype === 'sniper' ? 0xffaa44 : 0xffeedd),
      1.5,
      25,
      Math.PI / 6,
      0.5,
      1.2
    );
    this.flashlight.position.set(0.08, -0.12, rifleLen);
    this.flashlightTarget = new THREE.Object3D();
    this.flashlightTarget.position.set(0.08, -0.12, 20);
    this.armsGroup.add(this.flashlight);
    this.armsGroup.add(this.flashlightTarget);
    this.flashlight.target = this.flashlightTarget;

    this.root.add(this.armsGroup);

    // Register all hit meshes
    this.hitMeshes = [this.headMesh, helmet, this.torso, lLegMesh, rLegMesh, this.leftArm, this.rightArm];
    this.scene.add(this.root);
  }

  onHit(isHead, damage = 25) {
    if (this.isDead) return;

    // Boss Shield Logic
    if (this.archetype === 'boss' && this.shield > 0) {
      this.shield -= damage;
      audio.playBossShieldHit();
      if (this.shield <= 0) {
        this.shield = 0;
        this.shieldMesh.visible = false;
        audio.playBossShieldBreak();
      }
      return;
    }

    // Calculate Damage
    let finalDamage = damage;
    if (isHead) {
      finalDamage = this.archetype === 'juggernaut' || this.archetype === 'boss' ? damage * 2.2 : this.health;
    }

    this.health -= finalDamage;
    this.state = 'combat';
    this.alertLevel = 1.0;

    if (this.health <= 0) {
      this.die();
    }
  }

  die() {
    this.isDead = true;
    this.flashlight.intensity = 0;
    if (this.sniperLaser) this.sniperLaser.visible = false;
    if (this.shieldMesh) this.shieldMesh.visible = false;
    this.hitMeshes.forEach(m => {
      m.userData.isDead = true;
    });
  }

  update(delta, playerPos) {
    if (this.isDead) {
      if (this.deathTimer < 1.0) {
        this.deathTimer += delta;
        this.root.rotation.x = -Math.min(Math.PI / 2, this.deathTimer * 3.5);
        this.root.position.y = Math.max(0.15, 1.05 - this.deathTimer * 1.0);
      }
      return;
    }

    // Smoke blindness recovery
    if (this.isBlindedBySmoke) {
      this.smokeBlindTimer -= delta;
      if (this.smokeBlindTimer <= 0) {
        this.isBlindedBySmoke = false;
      }
    }

    // Boss shield rotation animation
    if (this.shieldMesh && this.shieldMesh.visible) {
      this.shieldMesh.rotation.y += delta * 2.0;
      this.shieldMesh.rotation.x += delta * 1.0;
    }

    const animSpeed = this.state === 'combat' ? 10 : 5;
    const t = Date.now() * 0.001 * animSpeed;

    if (this.state === 'patrol' || this.state === 'suspicious') {
      this.leftLeg.rotation.x = Math.sin(t) * 0.6;
      this.rightLeg.rotation.x = -Math.sin(t) * 0.6;
      this.armsGroup.position.y = 1.25 + Math.abs(Math.sin(t)) * 0.04;
    } else if (this.state === 'combat') {
      const dx = playerPos.x - this.root.position.x;
      const dz = playerPos.z - this.root.position.z;
      const targetAngle = Math.atan2(dx, dz);
      this.root.rotation.y = targetAngle;

      this.leftLeg.rotation.x = 0;
      this.rightLeg.rotation.x = 0;
    }

    if (this.shootCooldown > 0) {
      this.shootCooldown -= delta;
    }
  }

  destroy() {
    this.scene.remove(this.root);
  }
}

