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

    // Dual Weapon Inventory & Equipment
    this.activeWeapon = 'primary'; // 'primary' | 'secondary'
    this.weapons = {
      primary: {
        name: 'M4A1-S Suppressed',
        type: 'rifle',
        clip: 30,
        maxClip: 30,
        reserve: 90,
        fireRate: 0.11,
        reloadDuration: 1.5,
        damageBody: 20,
        damageHead: 100,
        hipPos: new THREE.Vector3(0.24, -0.22, -0.42),
        adsPos: new THREE.Vector3(0, -0.075, -0.25)
      },
      secondary: {
        name: 'USP-45 Tactical',
        type: 'pistol',
        clip: 12,
        maxClip: 12,
        reserve: 48,
        fireRate: 0.18,
        reloadDuration: 1.0,
        damageBody: 25,
        damageHead: 100,
        hipPos: new THREE.Vector3(0.20, -0.20, -0.38),
        adsPos: new THREE.Vector3(0, -0.065, -0.22)
      }
    };

    // Smoke Grenades
    this.smokeGrenades = 2;
    this.maxSmokeGrenades = 2;

    // Adrenaline Focus Mode (Bullet-Time)
    this.adrenaline = 100;
    this.maxAdrenaline = 100;
    this.isBulletTime = false;
    this.bulletTimeTimer = 0;
    this.bulletTimeMaxDuration = 3.5;
    this.heartbeatTimer = 0;

    // 3D Weapon Models (Primary & Secondary)
    this.setupWeaponModels();
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

  setupWeaponModels() {
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
    const pistolSlideMat = new THREE.MeshStandardMaterial({
      color: 0x222a30,
      roughness: 0.3,
      metalness: 0.9
    });

    // -------------------------------------------------------------
    // 1. PRIMARY WEAPON MODEL: M4A1-S Tactical Carbine
    // -------------------------------------------------------------
    this.primaryModel = new THREE.Group();

    // Receiver Body
    const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.09, 0.32), metalMat);
    this.primaryModel.add(receiver);

    // Barrel
    const barrelGeom = new THREE.CylinderGeometry(0.015, 0.015, 0.25, 8);
    barrelGeom.rotateX(Math.PI / 2);
    const barrel = new THREE.Mesh(barrelGeom, metalMat);
    barrel.position.set(0, 0.015, -0.28);
    this.primaryModel.add(barrel);

    // Suppressor
    const suppressorGeom = new THREE.CylinderGeometry(0.024, 0.024, 0.22, 12);
    suppressorGeom.rotateX(Math.PI / 2);
    const suppressor = new THREE.Mesh(suppressorGeom, darkMat);
    suppressor.position.set(0, 0.015, -0.45);
    this.primaryModel.add(suppressor);

    // Handguard
    const handguard = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.065, 0.2), tanMat);
    handguard.position.set(0, 0.005, -0.2);
    this.primaryModel.add(handguard);

    // Holographic Sight Mount
    const sightBase = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.03, 0.09), darkMat);
    sightBase.position.set(0, 0.06, -0.05);
    this.primaryModel.add(sightBase);

    // Sight Glass Reticle
    const lensGeom = new THREE.RingGeometry(0.002, 0.018, 16);
    const lensMat = new THREE.MeshBasicMaterial({
      color: 0x00ff88,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85
    });
    const sightLens = new THREE.Mesh(lensGeom, lensMat);
    sightLens.position.set(0, 0.075, -0.08);
    this.primaryModel.add(sightLens);

    // Magazine
    const magGeom = new THREE.BoxGeometry(0.04, 0.16, 0.07);
    magGeom.rotateX(-0.15);
    this.primaryMagMesh = new THREE.Mesh(magGeom, darkMat);
    this.primaryMagMesh.position.set(0, -0.11, -0.04);
    this.primaryModel.add(this.primaryMagMesh);

    // Pistol Grip
    const gripGeom = new THREE.BoxGeometry(0.045, 0.12, 0.055);
    gripGeom.rotateX(0.35);
    const grip = new THREE.Mesh(gripGeom, tanMat);
    grip.position.set(0, -0.08, 0.1);
    this.primaryModel.add(grip);

    // Tactical Blue Laser Sight
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
    this.primaryModel.add(this.laserBeam);

    this.weaponRoot.add(this.primaryModel);

    // -------------------------------------------------------------
    // 2. SECONDARY WEAPON MODEL: USP-45 Tactical Pistol
    // -------------------------------------------------------------
    this.secondaryModel = new THREE.Group();

    // Pistol Slide
    const slideGeom = new THREE.BoxGeometry(0.04, 0.045, 0.22);
    const slide = new THREE.Mesh(slideGeom, pistolSlideMat);
    slide.position.set(0, 0.02, -0.04);
    this.secondaryModel.add(slide);

    // Pistol Frame
    const frameGeom = new THREE.BoxGeometry(0.038, 0.04, 0.18);
    const frame = new THREE.Mesh(frameGeom, darkMat);
    frame.position.set(0, -0.015, -0.02);
    this.secondaryModel.add(frame);

    // Pistol Grip
    const pGripGeom = new THREE.BoxGeometry(0.036, 0.11, 0.05);
    pGripGeom.rotateX(0.3);
    const pGrip = new THREE.Mesh(pGripGeom, darkMat);
    pGrip.position.set(0, -0.07, 0.04);
    this.secondaryModel.add(pGrip);

    // Pistol Suppressor
    const pSuppGeom = new THREE.CylinderGeometry(0.018, 0.018, 0.18, 12);
    pSuppGeom.rotateX(Math.PI / 2);
    const pSupp = new THREE.Mesh(pSuppGeom, darkMat);
    pSupp.position.set(0, 0.02, -0.22);
    this.secondaryModel.add(pSupp);

    // Tritium Glow Sights
    const frontSight = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.01, 0.01), new THREE.MeshBasicMaterial({ color: 0x00ff88 }));
    frontSight.position.set(0, 0.048, -0.14);
    this.secondaryModel.add(frontSight);

    const rearSightL = new THREE.Mesh(new THREE.BoxGeometry(0.005, 0.008, 0.008), new THREE.MeshBasicMaterial({ color: 0x00ff88 }));
    rearSightL.position.set(-0.012, 0.048, 0.06);
    const rearSightR = new THREE.Mesh(new THREE.BoxGeometry(0.005, 0.008, 0.008), new THREE.MeshBasicMaterial({ color: 0x00ff88 }));
    rearSightR.position.set(0.012, 0.048, 0.06);
    this.secondaryModel.add(rearSightL);
    this.secondaryModel.add(rearSightR);

    // Pistol Mag Mesh for reload animation
    this.secondaryMagMesh = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.1, 0.04), metalMat);
    this.secondaryMagMesh.position.set(0, -0.08, 0.04);
    this.secondaryModel.add(this.secondaryMagMesh);

    this.secondaryModel.visible = false;
    this.weaponRoot.add(this.secondaryModel);

    // Muzzle Flash Light
    this.muzzleLight = new THREE.PointLight(0xffaa44, 0, 8);
    this.muzzleLight.position.set(0, 0.015, -0.58);
    this.weaponRoot.add(this.muzzleLight);

    // Initial positioning
    this.weaponRoot.position.copy(this.weapons.primary.hipPos);
    this.pitchNode.add(this.weaponRoot);
  }

  // Switch between Primary and Secondary weapon
  switchWeapon(slot = null) {
    if (this.isReloading) return;

    if (slot === 'primary' || (slot === null && this.activeWeapon === 'secondary')) {
      this.activeWeapon = 'primary';
      this.primaryModel.visible = true;
      this.secondaryModel.visible = false;
      this.muzzleLight.position.set(0, 0.015, -0.58);
    } else if (slot === 'secondary' || (slot === null && this.activeWeapon === 'primary')) {
      this.activeWeapon = 'secondary';
      this.primaryModel.visible = false;
      this.secondaryModel.visible = true;
      this.muzzleLight.position.set(0, 0.02, -0.32);
    }

    // Switch sound & animation kick
    audio.playWeaponSwitch();
    this.recoilOffset.y = -0.1;
  }

  // Toggle Adrenaline Bullet-Time Mode
  toggleBulletTime() {
    if (this.isDead) return;

    if (!this.isBulletTime && this.adrenaline >= 30) {
      this.isBulletTime = true;
      this.bulletTimeTimer = this.bulletTimeMaxDuration * (this.adrenaline / 100);
      audio.playBulletTimeStart();
    } else if (this.isBulletTime) {
      this.isBulletTime = false;
      audio.playBulletTimeEnd();
    }
  }

  // Add Ammo from Loot Drops
  addAmmo(primaryAmount = 15, secondaryAmount = 12) {
    this.weapons.primary.reserve = Math.min(150, this.weapons.primary.reserve + primaryAmount);
    this.weapons.secondary.reserve = Math.min(72, this.weapons.secondary.reserve + secondaryAmount);
  }

  // Add Armor from Loot Drops
  addArmor(amount = 25) {
    this.health = Math.min(this.maxHealth, this.health + amount);
  }

  // Throw Tactical Smoke Grenade
  throwSmoke(grenadeManager) {
    if (this.smokeGrenades <= 0 || !grenadeManager) return false;

    this.smokeGrenades--;
    const origin = new THREE.Vector3();
    this.camera.getWorldPosition(origin);
    const direction = new THREE.Vector3();
    this.camera.getWorldDirection(direction);

    grenadeManager.throwSmoke(origin, direction);
    return true;
  }

  // Set spawn position
  spawn(x, y, z, rotY = 0) {
    this.yawNode.position.set(x, y, z);
    this.yaw = rotY;
    this.pitch = 0;
    this.velocity.set(0, 0, 0);
    this.health = this.maxHealth;
    this.lifelines = this.maxLifelines;

    // Reset weapons
    this.weapons.primary.clip = this.weapons.primary.maxClip;
    this.weapons.primary.reserve = 90;
    this.weapons.secondary.clip = this.weapons.secondary.maxClip;
    this.weapons.secondary.reserve = 48;
    this.activeWeapon = 'primary';
    this.primaryModel.visible = true;
    this.secondaryModel.visible = false;

    this.smokeGrenades = this.maxSmokeGrenades;
    this.adrenaline = this.maxAdrenaline;
    this.isBulletTime = false;

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
        if (this.isBulletTime) {
          this.isBulletTime = false;
          audio.playBulletTimeEnd();
        }
      }
    }
  }

  // Current active weapon object
  get curWeapon() {
    return this.weapons[this.activeWeapon];
  }

  // Shoot weapon
  shoot(onHitCallback) {
    if (this.isDead || this.isReloading || this.fireTimer > 0) return false;
    const weapon = this.curWeapon;

    if (weapon.clip <= 0) {
      this.reload();
      return false;
    }

    weapon.clip--;
    this.fireTimer = weapon.fireRate;

    if (this.activeWeapon === 'primary') {
      audio.playSilencedShot();
    } else {
      audio.playPistolShot();
    }

    // Muzzle flash light
    this.muzzleLight.intensity = 2.5;
    setTimeout(() => {
      this.muzzleLight.intensity = 0;
    }, 40);

    // Recoil kickback
    this.recoilOffset.z = this.activeWeapon === 'primary' ? 0.08 : 0.05;
    this.recoilOffset.y = this.activeWeapon === 'primary' ? 0.02 : 0.035;
    this.recoilRotation.x = this.activeWeapon === 'primary' ? 0.06 : 0.09;

    // Bullet raycast
    if (onHitCallback) {
      onHitCallback();
    }

    return true;
  }

  // Reload active weapon
  reload() {
    const weapon = this.curWeapon;
    if (this.isReloading || weapon.clip === weapon.maxClip || weapon.reserve <= 0) return;
    this.isReloading = true;
    this.reloadTimer = weapon.reloadDuration;
    audio.playReload();
  }

  // Update loop
  update(delta, input, colliders = [], grenadeManager = null) {
    if (this.isDead) return;

    // 1. Bullet-Time & Adrenaline Update
    if (this.isBulletTime) {
      this.bulletTimeTimer -= delta;
      this.adrenaline = Math.max(0, (this.bulletTimeTimer / this.bulletTimeMaxDuration) * 100);

      this.heartbeatTimer -= delta;
      if (this.heartbeatTimer <= 0) {
        this.heartbeatTimer = 0.65;
        audio.playHeartbeat();
      }

      if (this.bulletTimeTimer <= 0 || this.adrenaline <= 0) {
        this.isBulletTime = false;
        audio.playBulletTimeEnd();
      }
    } else {
      // Passive Adrenaline Regen
      this.adrenaline = Math.min(this.maxAdrenaline, this.adrenaline + delta * 6);
    }

    // 2. Handle mouse rotation
    const mouseDelta = input.consumeMouseDelta();
    this.yaw -= mouseDelta.x;
    this.pitch -= mouseDelta.y;
    this.pitch = Math.max(-Math.PI / 2.1, Math.min(Math.PI / 2.1, this.pitch));

    this.yawNode.rotation.y = this.yaw;
    this.pitchNode.rotation.x = this.pitch;

    // 3. Stances & Movement
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
      if (box.max.y < 0.5) continue; // Ignore low props
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

    // 4. Equipment & Keybind Actions
    if (this.fireTimer > 0) this.fireTimer -= delta;

    // Weapon Swapping ([Q], [Digit1], [Digit2])
    if (input.isJustPressed('KeyQ')) {
      this.switchWeapon();
    } else if (input.isJustPressed('Digit1')) {
      this.switchWeapon('primary');
    } else if (input.isJustPressed('Digit2')) {
      this.switchWeapon('secondary');
    }

    // Smoke Grenade Throw ([G])
    if (input.isJustPressed('KeyG') && grenadeManager) {
      this.throwSmoke(grenadeManager);
    }

    // Adrenaline Bullet-Time ([Space])
    if (input.isJustPressed('Space')) {
      this.toggleBulletTime();
    }

    // Flashlight toggle key ([F])
    if (input.isJustPressed('KeyF')) {
      this.toggleFlashlight();
    }

    // Reload key ([R])
    if (input.isJustPressed('KeyR')) {
      this.reload();
    }

    // Reload animation update
    if (this.isReloading) {
      const weapon = this.curWeapon;
      this.reloadTimer -= delta;

      const magMesh = this.activeWeapon === 'primary' ? this.primaryMagMesh : this.secondaryMagMesh;
      const magBaseY = this.activeWeapon === 'primary' ? -0.11 : -0.08;
      magMesh.position.y = magBaseY - Math.sin((1 - this.reloadTimer / weapon.reloadDuration) * Math.PI) * 0.15;

      if (this.reloadTimer <= 0) {
        const needed = weapon.maxClip - weapon.clip;
        const toLoad = Math.min(needed, weapon.reserve);
        weapon.clip += toLoad;
        weapon.reserve -= toLoad;
        this.isReloading = false;
        magMesh.position.y = magBaseY;
      }
    }

    // 5. Weapon Sway, ADS, and Recoil Lerping
    const weaponConfig = this.curWeapon;
    const targetWeaponPos = this.isADS ? weaponConfig.adsPos : weaponConfig.hipPos;
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
