import * as THREE from 'three';

export class Enemy {
  constructor(scene, x, y, z, waypoints = []) {
    this.scene = scene;
    this.waypoints = waypoints;
    this.currentWaypointIdx = 0;

    this.maxHealth = 30;
    this.health = 30;
    this.isDead = false;
    this.deathTimer = 0;

    // AI states: 'patrol' (Green), 'suspicious' (Yellow), 'combat' (Red)
    this.state = 'patrol';
    this.alertLevel = 0.0;
    this.shootCooldown = 0;
    this.speed = 2.4;

    this.buildModel(x, y, z);
  }

  buildModel(x, y, z) {
    this.root = new THREE.Group();
    this.root.position.set(x, y, z);

    // Realistic tactical SWAT/Black Ops materials
    const uniformMat = new THREE.MeshStandardMaterial({ color: 0x181c22, roughness: 0.8 }); // Black/Dark tactical uniform
    const vestMat = new THREE.MeshStandardMaterial({ color: 0x0e1114, roughness: 0.6, metalness: 0.3 }); // Ballistic kevlar vest
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xb58c70, roughness: 0.7 }); // Operative skin
    const gunMat = new THREE.MeshStandardMaterial({ color: 0x141618, roughness: 0.3, metalness: 0.8 });
    const nvgGlowMat = new THREE.MeshBasicMaterial({ color: 0x00ff88 }); // Tactical green NVG optic glow

    // --- Torso & Ballistic Plate Carrier ---
    const torsoGeom = new THREE.BoxGeometry(0.52, 0.68, 0.32);
    this.torso = new THREE.Mesh(torsoGeom, vestMat);
    this.torso.position.y = 1.05;
    this.torso.castShadow = true;
    this.torso.receiveShadow = true;
    this.torso.userData = { enemy: this, isBody: true };
    this.root.add(this.torso);

    // Tactical MOLLE pouches & radio on vest
    const pouchGeom = new THREE.BoxGeometry(0.12, 0.16, 0.09);
    for (let i = -1; i <= 1; i++) {
      const pouch = new THREE.Mesh(pouchGeom, uniformMat);
      pouch.position.set(i * 0.15, -0.12, 0.18);
      this.torso.add(pouch);
    }

    // Shoulder Radio Transceiver with Antenna
    const radioGeom = new THREE.BoxGeometry(0.08, 0.12, 0.08);
    const radio = new THREE.Mesh(radioGeom, gunMat);
    radio.position.set(-0.2, 0.28, 0.12);
    this.torso.add(radio);

    const antennaGeom = new THREE.CylinderGeometry(0.006, 0.006, 0.25, 4);
    antennaGeom.rotateX(-0.1);
    const antenna = new THREE.Mesh(antennaGeom, gunMat);
    antenna.position.set(0, 0.14, 0);
    radio.add(antenna);

    // --- Head, Balaclava & FAST Ballistic Helmet ---
    this.headGroup = new THREE.Group();
    this.headGroup.position.set(0, 1.55, 0);

    const headGeom = new THREE.SphereGeometry(0.16, 12, 12);
    this.headMesh = new THREE.Mesh(headGeom, uniformMat); // Balaclava mask
    this.headMesh.userData = { enemy: this, isHead: true };
    this.headGroup.add(this.headMesh);

    // Face opening / eye slit
    const faceGeom = new THREE.BoxGeometry(0.12, 0.06, 0.04);
    const faceMesh = new THREE.Mesh(faceGeom, skinMat);
    faceMesh.position.set(0, 0.01, 0.15);
    this.headGroup.add(faceMesh);

    // FAST Tactical Helmet with side rails
    const helmetGeom = new THREE.SphereGeometry(0.19, 14, 14, 0, Math.PI * 2, 0, Math.PI * 0.58);
    const helmet = new THREE.Mesh(helmetGeom, vestMat);
    helmet.position.y = 0.02;
    helmet.userData = { enemy: this, isHead: true };
    this.headGroup.add(helmet);

    // Quad / Dual Tube Night Vision Goggles (NVG) with Green Glow
    for (let i = -1; i <= 1; i += 2) {
      const nvgTubeGeom = new THREE.CylinderGeometry(0.032, 0.032, 0.12, 10);
      nvgTubeGeom.rotateX(Math.PI / 2);
      const nvgTube = new THREE.Mesh(nvgTubeGeom, gunMat);
      nvgTube.position.set(i * 0.065, 0.04, 0.18);

      const nvgLensGeom = new THREE.CircleGeometry(0.03, 10);
      const nvgLens = new THREE.Mesh(nvgLensGeom, nvgGlowMat);
      nvgLens.position.set(0, 0, 0.062);
      nvgTube.add(nvgLens);

      this.headGroup.add(nvgTube);
    }

    this.root.add(this.headGroup);

    // --- Legs with Tactical Knee Pads & Boots ---
    this.leftLeg = new THREE.Group();
    this.leftLeg.position.set(-0.16, 0.75, 0);
    const legGeom = new THREE.BoxGeometry(0.17, 0.75, 0.19);
    const lLegMesh = new THREE.Mesh(legGeom, uniformMat);
    lLegMesh.position.y = -0.375;
    lLegMesh.castShadow = true;
    lLegMesh.userData = { enemy: this, isBody: true };
    this.leftLeg.add(lLegMesh);

    // Knee pad
    const padGeom = new THREE.BoxGeometry(0.14, 0.12, 0.06);
    const lPad = new THREE.Mesh(padGeom, vestMat);
    lPad.position.set(0, -0.35, 0.1);
    this.leftLeg.add(lPad);
    this.root.add(this.leftLeg);

    this.rightLeg = new THREE.Group();
    this.rightLeg.position.set(0.16, 0.75, 0);
    const rLegMesh = new THREE.Mesh(legGeom, uniformMat);
    rLegMesh.position.y = -0.375;
    rLegMesh.castShadow = true;
    rLegMesh.userData = { enemy: this, isBody: true };
    this.rightLeg.add(rLegMesh);

    const rPad = new THREE.Mesh(padGeom, vestMat);
    rPad.position.set(0, -0.35, 0.1);
    this.rightLeg.add(rPad);
    this.root.add(this.rightLeg);

    // --- Arms & M4A1 Tactical Assault Rifle ---
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

    // Tactical Rifle
    const rifleGeom = new THREE.BoxGeometry(0.07, 0.11, 0.7);
    this.rifle = new THREE.Mesh(rifleGeom, gunMat);
    this.rifle.position.set(0.08, -0.12, 0.38);
    this.armsGroup.add(this.rifle);

    // Weapon Flashlight illuminating the foggy alleyway
    this.flashlight = new THREE.SpotLight(0xffeedd, 1.5, 25, Math.PI / 6, 0.5, 1.2);
    this.flashlight.position.set(0.08, -0.12, 0.72);
    this.flashlightTarget = new THREE.Object3D();
    this.flashlightTarget.position.set(0.08, -0.12, 18);
    this.armsGroup.add(this.flashlight);
    this.armsGroup.add(this.flashlightTarget);
    this.flashlight.target = this.flashlightTarget;

    this.root.add(this.armsGroup);

    // Register all hit meshes
    this.hitMeshes = [this.headMesh, helmet, this.torso, lLegMesh, rLegMesh, this.leftArm, this.rightArm];

    this.scene.add(this.root);
  }

  onHit(isHead, damage = 15) {
    if (this.isDead) return;

    if (isHead) {
      this.health = 0; // Instant headshot kill
    } else {
      this.health -= damage;
    }

    this.state = 'combat';
    this.alertLevel = 1.0;

    if (this.health <= 0) {
      this.die();
    }
  }

  die() {
    this.isDead = true;
    this.flashlight.intensity = 0;
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
