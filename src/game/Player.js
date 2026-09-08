import * as THREE from 'three';
import { audio } from '../engine/Audio.js';

export class Player {
  constructor(camera, scene) {
    this.camera = camera;
    this.scene = scene;

    // Hierarchy for first-person rotations
    this.yawNode = new THREE.Object3D();
    this.pitchNode = new THREE.Object3D();
    this.yawNode.add(this.pitchNode);
    this.pitchNode.add(this.camera);
    this.scene.add(this.yawNode);

    // Physical state
    this.position = this.yawNode.position;
    this.velocity = new THREE.Vector3();
    this.pitch = 0;
    this.yaw = 0;

    // Movement attributes
    this.walkSpeed = 5.2;
    this.sprintSpeed = 8.8;
    this.crouchSpeed = 2.6;
    this.standHeight = 1.7;
    this.crouchHeight = 0.95;
    this.currentHeight = 1.7;
    this.isCrouching = false;
    this.isSprinting = false;
    this.isADS = false;

    // Stats
    this.maxHealth = 100;
    this.health = 100;
    this.maxLifelines = 3;
    this.lifelines = 3;
    this.isDead = false;

    // Stealth noise (0.0 = Silent, 1.0 = Max Loud)
    this.noiseLevel = 0.0;
    this.stepTimer = 0;

    // Weapon attributes
    this.ammoClip = 30;
    this.maxAmmoClip = 30;
    this.ammoReserve = 90;
    this.isReloading = false;
    this.reloadTimer = 0;
    this.reloadDuration = 1.5;
    this.fireRate = 0.11; // ~550 RPM
    this.fireTimer = 0;
    this.recoilOffset = new THREE.Vector3();
    this.recoilRotation = new THREE.Vector3();

    // Flashlight
    this.flashlightOn = true;
    this.setupFlashlight();

    // 3D Weapon Model
    this.setupWeaponModel();
  }

  setupFlashlight() {
    this.flashlight = new THREE.SpotLight(0xffffff, 1.8, 35, Math.PI / 5, 0.4, 1.2);
    this.flashlight.position.set(0.2, -0.1, -0.2);
    this.flashlightTarget = new THREE.Object3D();
    this.flashlightTarget.position.set(0, 0, -20);
    this.pitchNode.add(this.flashlight);
    this.pitchNode.add(this.flashlightTarget);
    this.flashlight.target = this.flashlightTarget;
  }

  toggleFlashlight() {
    this.flashlightOn = !this.flashlightOn;
    this.flashlight.intensity = this.flashlightOn ? 1.8 : 0;
  }

  setupWeaponModel() {
    this.weaponRoot = new THREE.Group();

    const metalMat = new THREE.MeshStandardMaterial({
      color: 0x181e24,
      roughness: 0.4,
      metalness: 0.8
    });
    const darkMat = new THREE.MeshStandardMaterial({
      color: 0x0c0f12,
      roughness: 0.7,
      metalness: 0.3
    });
    const tanMat = new THREE.MeshStandardMaterial({
      color: 0x4a443b,
      roughness: 0.8,
      metalness: 0.1
    });

    // Receiver Body
    const receiverGeom = new THREE.BoxGeometry(0.06, 0.09, 0.32);
    const receiver = new THREE.Mesh(receiverGeom, metalMat);
    receiver.position.set(0, 0, 0);
    this.weaponRoot.add(receiver);

    // Barrel
    const barrelGeom = new THREE.CylinderGeometry(0.015, 0.015, 0.25, 8);
    barrelGeom.rotateX(Math.PI / 2);
    const barrel = new THREE.Mesh(barrelGeom, metalMat);
    barrel.position.set(0, 0.015, -0.28);
    this.weaponRoot.add(barrel);

    // Suppressor / Silencer
    const suppressorGeom = new THREE.CylinderGeometry(0.024, 0.024, 0.22, 12);
    suppressorGeom.rotateX(Math.PI / 2);
    const suppressor = new THREE.Mesh(suppressorGeom, darkMat);
    suppressor.position.set(0, 0.015, -0.45);
    this.weaponRoot.add(suppressor);

    // Handguard
    const handguardGeom = new THREE.BoxGeometry(0.055, 0.065, 0.2);
    const handguard = new THREE.Mesh(handguardGeom, tanMat);
    handguard.position.set(0, 0.005, -0.2);
    this.weaponRoot.add(handguard);

    // Holographic Sight Mount
    const sightBaseGeom = new THREE.BoxGeometry(0.04, 0.03, 0.09);
    const sightBase = new THREE.Mesh(sightBaseGeom, darkMat);
    sightBase.position.set(0, 0.06, -0.05);
    this.weaponRoot.add(sightBase);

    // Sight Glass Lens with Reticle Dot
    const lensGeom = new THREE.RingGeometry(0.002, 0.018, 16);
    const lensMat = new THREE.MeshBasicMaterial({
      color: 0x00ff88,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85
    });
    this.sightLens = new THREE.Mesh(lensGeom, lensMat);
    this.sightLens.position.set(0, 0.075, -0.08);
    this.weaponRoot.add(this.sightLens);

    // Magazine
    const magGeom = new THREE.BoxGeometry(0.04, 0.16, 0.07);
    magGeom.rotateX(-0.15);
    this.magMesh = new THREE.Mesh(magGeom, darkMat);
    this.magMesh.position.set(0, -0.11, -0.04);
    this.weaponRoot.add(this.magMesh);

    // Pistol Grip
    const gripGeom = new THREE.BoxGeometry(0.045, 0.12, 0.055);
    gripGeom.rotateX(0.35);
    const grip = new THREE.Mesh(gripGeom, tanMat);
    grip.position.set(0, -0.08, 0.1);
    this.weaponRoot.add(grip);

    // Tactical Laser Beam
    const laserGeom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0.03, 0, -0.3),
      new THREE.Vector3(0.03, 0, -25)
    ]);
    const laserMat = new THREE.LineBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.65
    });
    this.laserBeam = new THREE.Line(laserGeom, laserMat);
    this.weaponRoot.add(this.laserBeam);

    // Muzzle Flash Light
    this.muzzleLight = new THREE.PointLight(0xffaa44, 0, 8);
    this.muzzleLight.position.set(0, 0.015, -0.58);
    this.weaponRoot.add(this.muzzleLight);

    // Default hip position and ADS target position
    this.hipPos = new THREE.Vector3(0.24, -0.22, -0.42);
    this.adsPos = new THREE.Vector3(0, -0.075, -0.25);
    this.weaponRoot.position.copy(this.hipPos);

    this.pitchNode.add(this.weaponRoot);
  }

  // Set spawn position
  spawn(x, y, z, rotY = 0) {
    this.yawNode.position.set(x, y, z);
    this.yaw = rotY;
    this.pitch = 0;
    this.velocity.set(0, 0, 0);
    this.health = this.maxHealth;
    this.lifelines = this.maxLifelines;
    this.ammoClip = this.maxAmmoClip;
    this.ammoReserve = 90;
    this.isDead = false;
    this.isReloading = false;
  }

  // Take damage from enemy
  takeDamage(amount = 20) {
    if (this.isDead) return;

    this.health -= amount;
    audio.playPlayerHurt();

    if (this.health <= 0) {
      this.lifelines--;
      if (this.lifelines > 0) {
        // Lost an armor plate / lifeline
        this.health = this.maxHealth;
      } else {
        // Depleted all lifelines
        this.health = 0;
        this.isDead = true;
      }
    }
  }

  // Shoot weapon
  shoot(onHitCallback) {
    if (this.isDead || this.isReloading || this.fireTimer > 0) return false;
    if (this.ammoClip <= 0) {
      this.reload();
      return false;
    }

    this.ammoClip--;
    this.fireTimer = this.fireRate;
    audio.playSilencedShot();

    // Muzzle flash flash-light
    this.muzzleLight.intensity = 2.5;
    setTimeout(() => {
      this.muzzleLight.intensity = 0;
    }, 40);

    // Recoil kickback
    this.recoilOffset.z = 0.08;
    this.recoilOffset.y = 0.02;
    this.recoilRotation.x = 0.06;

    // Bullet raycast
    if (onHitCallback) {
      onHitCallback();
    }

    return true;
  }

  // Reload
  reload() {
    if (this.isReloading || this.ammoClip === this.maxAmmoClip || this.ammoReserve <= 0) return;
    this.isReloading = true;
    this.reloadTimer = this.reloadDuration;
    audio.playReload();
  }

  // Update loop
  update(delta, input, colliders = []) {
    if (this.isDead) return;

    // Handle mouse rotation
    const mouseDelta = input.consumeMouseDelta();
    this.yaw -= mouseDelta.x;
    this.pitch -= mouseDelta.y;
    this.pitch = Math.max(-Math.PI / 2.1, Math.min(Math.PI / 2.1, this.pitch));

    this.yawNode.rotation.y = this.yaw;
    this.pitchNode.rotation.x = this.pitch;

    // Stances
    this.isCrouching = input.isKeyDown('KeyC') || input.isKeyDown('ControlLeft');
    this.isSprinting = !this.isCrouching && input.isKeyDown('ShiftLeft');
    this.isADS = input.mouseButtons[2] || false;

    // Height lerping (crouch smooth transition)
    const targetHeight = this.isCrouching ? this.crouchHeight : this.standHeight;
    this.currentHeight += (targetHeight - this.currentHeight) * delta * 12;
    this.pitchNode.position.y = this.currentHeight;

    // Movement calculation
    let currentSpeed = this.walkSpeed;
    if (this.isCrouching) currentSpeed = this.crouchSpeed;
    else if (this.isSprinting) currentSpeed = this.sprintSpeed;
    if (this.isADS) currentSpeed *= 0.6;

    const moveVector = new THREE.Vector3();
    if (input.isKeyDown('KeyW')) moveVector.z -= 1;
    if (input.isKeyDown('KeyS')) moveVector.z += 1;
    if (input.isKeyDown('KeyA')) moveVector.x -= 1;
    if (input.isKeyDown('KeyD')) moveVector.x += 1;

    const isMoving = moveVector.lengthSq() > 0;
    if (isMoving) {
      moveVector.normalize();
      moveVector.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
      this.velocity.x = moveVector.x * currentSpeed;
      this.velocity.z = moveVector.z * currentSpeed;

      // Footstep & Noise Meter logic
      this.stepTimer -= delta;
      if (this.stepTimer <= 0) {
        this.stepTimer = this.isSprinting ? 0.3 : (this.isCrouching ? 0.65 : 0.45);
        audio.playStep(this.isCrouching, this.isSprinting);
      }

      if (this.isCrouching) {
        this.noiseLevel = 0.05; // Silent stealth
      } else if (this.isSprinting) {
        this.noiseLevel = 0.95; // Loud alert
      } else {
        this.noiseLevel = 0.4;  // Normal walk
      }
    } else {
      this.velocity.x = 0;
      this.velocity.z = 0;
      this.noiseLevel = Math.max(0, this.noiseLevel - delta * 2);
    }

    // Smooth player collision with sliding response (radius = 0.35m)
    const playerRadius = 0.35;
    const nextX = this.yawNode.position.x + this.velocity.x * delta;
    const nextZ = this.yawNode.position.z + this.velocity.z * delta;

    // Check X axis
    let blockedX = false;
    for (const box of colliders) {
      if (box.max.y < 0.5) continue; // Ignore low pallets / step-over props
      if (nextX + playerRadius > box.min.x && nextX - playerRadius < box.max.x &&
          this.yawNode.position.z + playerRadius > box.min.z && this.yawNode.position.z - playerRadius < box.max.z) {
        blockedX = true;
        break;
      }
    }
    if (!blockedX) this.yawNode.position.x = nextX;

    // Check Z axis
    let blockedZ = false;
    for (const box of colliders) {
      if (box.max.y < 0.5) continue;
      if (this.yawNode.position.x + playerRadius > box.min.x && this.yawNode.position.x - playerRadius < box.max.x &&
          nextZ + playerRadius > box.min.z && nextZ - playerRadius < box.max.z) {
        blockedZ = true;
        break;
      }
    }
    if (!blockedZ) this.yawNode.position.z = nextZ;

    // Action updates
    if (this.fireTimer > 0) this.fireTimer -= delta;

    // Reload update
    if (this.isReloading) {
      this.reloadTimer -= delta;
      this.magMesh.position.y = -0.11 - Math.sin((1 - this.reloadTimer / this.reloadDuration) * Math.PI) * 0.15;
      if (this.reloadTimer <= 0) {
        const needed = this.maxAmmoClip - this.ammoClip;
        const toLoad = Math.min(needed, this.ammoReserve);
        this.ammoClip += toLoad;
        this.ammoReserve -= toLoad;
        this.isReloading = false;
        this.magMesh.position.set(0, -0.11, -0.04);
      }
    }

    // Flashlight toggle key
    if (input.isJustPressed('KeyF')) {
      this.toggleFlashlight();
    }

    // Reload key
    if (input.isJustPressed('KeyR')) {
      this.reload();
    }

    // Weapon Sway, ADS, and Recoil Lerping
    const targetWeaponPos = this.isADS ? this.adsPos : this.hipPos;
    this.recoilOffset.lerp(new THREE.Vector3(0, 0, 0), delta * 15);
    this.recoilRotation.lerp(new THREE.Vector3(0, 0, 0), delta * 15);

    // Subtle breathing/walk bobbing
    const bobTime = Date.now() * 0.006;
    const bobX = isMoving ? Math.sin(bobTime * (this.isSprinting ? 1.5 : 1)) * 0.015 : Math.sin(bobTime * 0.4) * 0.002;
    const bobY = isMoving ? Math.cos(bobTime * 2 * (this.isSprinting ? 1.5 : 1)) * 0.012 : Math.cos(bobTime * 0.8) * 0.002;

    this.weaponRoot.position.x = THREE.MathUtils.lerp(this.weaponRoot.position.x, targetWeaponPos.x + this.recoilOffset.x + bobX, delta * 16);
    this.weaponRoot.position.y = THREE.MathUtils.lerp(this.weaponRoot.position.y, targetWeaponPos.y + this.recoilOffset.y + bobY, delta * 16);
    this.weaponRoot.position.z = THREE.MathUtils.lerp(this.weaponRoot.position.z, targetWeaponPos.z + this.recoilOffset.z, delta * 16);

    this.weaponRoot.rotation.x = this.recoilRotation.x;
  }
}
