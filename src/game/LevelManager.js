import * as THREE from 'three';
import { Enemy } from './Enemy.js';
import { Bomb } from './Bomb.js';
import { TextureGenerator } from '../engine/TextureGenerator.js';

export class LevelManager {
  constructor(scene, renderer) {
    this.scene = scene;
    this.renderer = renderer;

    this.levelObjects = [];
    this.colliders = [];
    this.enemies = [];
    this.bomb = null;
    this.playerSpawn = { x: 0, y: 1.7, z: 0, rotY: 0 };
    this.currentLevel = 1;
  }

  loadLevel(levelNumber, aiManager) {
    this.clearLevel(aiManager);
    this.currentLevel = levelNumber;

    if (levelNumber === 1) {
      this.buildLevel1(aiManager);
    } else if (levelNumber === 2) {
      this.buildLevel2(aiManager);
    } else if (levelNumber === 3) {
      this.buildLevel3(aiManager);
    } else {
      this.buildLevel4(aiManager);
    }

    return {
      bomb: this.bomb,
      enemies: this.enemies,
      colliders: this.colliders,
      playerSpawn: this.playerSpawn
    };
  }

  clearLevel(aiManager) {
    if (aiManager) aiManager.clear();
    this.enemies = [];

    if (this.bomb) {
      this.bomb.destroy();
      this.bomb = null;
    }

    this.levelObjects.forEach(obj => {
      this.scene.remove(obj);
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
        else obj.material.dispose();
      }
    });

    this.levelObjects = [];
    this.colliders = [];
  }

  // --- LEVEL 1: RAINY EUROPEAN COBBLESTONE ALLEYWAY (MATCHING REFERENCE IMAGE) ---
  buildLevel1(aiManager) {
    this.renderer.setupRain(true);
    // Spawn player at z = 20 facing forward down -Z (rotY = 0)
    this.playerSpawn = { x: 0, y: 1.7, z: 20, rotY: 0 };

    // 1. Wet Reflective Cobblestone Street Ground
    const cobbleTex = TextureGenerator.createCobblestoneTexture();
    const groundGeom = new THREE.PlaneGeometry(80, 80);
    const groundMat = new THREE.MeshStandardMaterial({
      map: cobbleTex,
      roughness: 0.25,
      metalness: 0.35
    });
    const ground = new THREE.Mesh(groundGeom, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.addObj(ground);

    // 2. Flanking European Historic Townhouses & Facades
    const wallTex1 = TextureGenerator.createBuildingWallTexture('#261e18');
    const wallTex2 = TextureGenerator.createBuildingWallTexture('#1e242d');

    // Left Street Buildings (x = -8.5)
    for (let z = 22; z >= -30; z -= 13) {
      this.createEuropeanBuilding(-8.5, 0, z, 7, 10, 12, wallTex1, true);
    }

    // Right Street Buildings (x = 8.5)
    for (let z = 22; z >= -30; z -= 13) {
      this.createEuropeanBuilding(8.5, 0, z, 7, 10, 12, wallTex2, true);
    }

    // End of Alley Courtyard Wall & Historic Archway
    this.createWall(0, 5, -34, 28, 10, 3, 0x1c1713);

    // 3. Vintage Street Lamps with Glowing Halos (Warm Amber Light #ffaa33)
    const lampPositions = [
      [-4.2, 4.5, 14],
      [4.2, 4.5, 4],
      [-4.2, 4.5, -6],
      [4.2, 4.5, -16],
      [0, 5, -28]
    ];

    lampPositions.forEach(([lx, ly, lz]) => {
      this.createVintageStreetLamp(lx, ly, lz);
    });

    // 4. Barrels & Crates tucked against side walls (Clear central 7m lane)
    this.createWoodenBarrel(-4.6, 0, 12);
    this.createWoodenBarrel(-4.8, 0, 11.2);
    this.createCrate(4.6, 0, 8, 1.8, 1.6, 1.8);

    this.createWoodenBarrel(4.6, 0, -2);
    this.createCrate(-4.6, 0, -8, 2.0, 1.5, 2.0);
    this.createWoodenBarrel(-4.6, 0, -9.5);

    // 5. Tactical C4 Bomb Unit in the center alleyway on a wooden pallet
    const palletGeom = new THREE.BoxGeometry(2.4, 0.2, 2.4);
    const palletMat = new THREE.MeshStandardMaterial({ color: 0x4a3a24, roughness: 0.8 });
    const pallet = new THREE.Mesh(palletGeom, palletMat);
    pallet.position.set(0, 0.1, -22);
    pallet.receiveShadow = true;
    this.addObj(pallet);

    this.bomb = new Bomb(this.scene, 0, 0.2, -22, 90);

    // 6. Tactical Commando Guards (3 enemies clearly visible along the street)
    const e1 = new Enemy(this.scene, -2.5, 0, 6, [
      new THREE.Vector3(-2.5, 0, 10),
      new THREE.Vector3(-2.5, 0, -2),
      new THREE.Vector3(2.5, 0, -2)
    ]);
    const e2 = new Enemy(this.scene, 2.5, 0, -6, [
      new THREE.Vector3(2.5, 0, -2),
      new THREE.Vector3(2.5, 0, -14),
      new THREE.Vector3(-2.5, 0, -14)
    ]);
    const e3 = new Enemy(this.scene, 0, 0, -18, [
      new THREE.Vector3(-3.0, 0, -18),
      new THREE.Vector3(3.0, 0, -18)
    ]);

    this.enemies = [e1, e2, e3];
    this.enemies.forEach(e => aiManager.addEnemy(e));
  }

  // --- LEVEL 2: SUBTERRANEAN BUNKER & SERVERS ---
  buildLevel2(aiManager) {
    this.renderer.setupRain(false);
    this.playerSpawn = { x: 0, y: 1.7, z: 24, rotY: 0 };

    const floorGeom = new THREE.PlaneGeometry(70, 70);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x181c22, roughness: 0.4, metalness: 0.8 });
    const floor = new THREE.Mesh(floorGeom, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.addObj(floor);

    const ceilGeom = new THREE.PlaneGeometry(70, 70);
    const ceilMat = new THREE.MeshStandardMaterial({ color: 0x0a0d12, roughness: 0.9 });
    const ceil = new THREE.Mesh(ceilGeom, ceilMat);
    ceil.position.y = 5.5;
    ceil.rotation.x = Math.PI / 2;
    this.addObj(ceil);

    this.createWall(0, 2.75, -30, 50, 5.5, 1.5, 0x222a36);
    this.createWall(0, 2.75, 30, 50, 5.5, 1.5, 0x222a36);
    this.createWall(-20, 2.75, 0, 1.5, 5.5, 60, 0x222a36);
    this.createWall(20, 2.75, 0, 1.5, 5.5, 60, 0x222a36);

    this.createWall(-8, 2.75, 12, 14, 5.5, 1.2, 0x1d242e);
    this.createWall(8, 2.75, 4, 14, 5.5, 1.2, 0x1d242e);
    this.createWall(-8, 2.75, -8, 14, 5.5, 1.2, 0x1d242e);

    for (let i = -1; i <= 1; i++) {
      this.createServerRack(-14 + i * 4, 0, 4);
      this.createServerRack(14 - i * 4, 0, -4);
    }

    this.createEmergencyLight(-12, 4.5, 12);
    this.createEmergencyLight(12, 4.5, 0);
    this.createEmergencyLight(0, 4.5, -20);

    this.bomb = new Bomb(this.scene, 0, 0, -22, 80);

    const e1 = new Enemy(this.scene, 4, 0, 14, [new THREE.Vector3(8, 0, 14), new THREE.Vector3(-4, 0, 14)]);
    const e2 = new Enemy(this.scene, -10, 0, 6, [new THREE.Vector3(-10, 0, 6), new THREE.Vector3(-10, 0, -2)]);
    const e3 = new Enemy(this.scene, 10, 0, -2, [new THREE.Vector3(10, 0, 2), new THREE.Vector3(2, 0, -2)]);
    const e4 = new Enemy(this.scene, -4, 0, -12, [new THREE.Vector3(-4, 0, -12), new THREE.Vector3(4, 0, -12)]);
    const e5 = new Enemy(this.scene, 0, 0, -18, [new THREE.Vector3(-6, 0, -18), new THREE.Vector3(6, 0, -18)]);

    this.enemies = [e1, e2, e3, e4, e5];
    this.enemies.forEach(e => aiManager.addEnemy(e));
  }

  // --- LEVEL 3: RESEARCH SILO & CATWALKS ---
  buildLevel3(aiManager) {
    this.renderer.setupRain(false);
    this.playerSpawn = { x: 0, y: 1.7, z: 22, rotY: 0 };

    const floorGeom = new THREE.CylinderGeometry(32, 32, 1, 16);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x141a22, roughness: 0.6, metalness: 0.5 });
    const floor = new THREE.Mesh(floorGeom, floorMat);
    floor.position.y = -0.5;
    floor.receiveShadow = true;
    this.addObj(floor);

    this.createWall(0, 6, -26, 50, 12, 2, 0x11161d);
    this.createWall(0, 6, 26, 50, 12, 2, 0x11161d);
    this.createWall(-26, 6, 0, 2, 12, 50, 0x11161d);
    this.createWall(26, 6, 0, 2, 12, 50, 0x11161d);

    this.createChemicalVat(-10, 0, 10, 0x00ff88);
    this.createChemicalVat(10, 0, 10, 0x00ff88);
    this.createChemicalVat(-12, 0, -8, 0x00ff88);
    this.createChemicalVat(12, 0, -8, 0x00ff88);

    this.createWall(0, 1.5, 0, 14, 3, 2, 0x223344);
    this.createWall(-6, 1.5, -6, 2, 3, 12, 0x223344);
    this.createWall(6, 1.5, -6, 2, 3, 12, 0x223344);

    this.createFloodlight(-8, 8, 0, 0x00f0ff);
    this.createFloodlight(8, 8, 0, 0x00f0ff);
    this.createFloodlight(0, 8, -18, 0x00ff88);

    this.bomb = new Bomb(this.scene, 0, 0, -20, 75);

    const e1 = new Enemy(this.scene, -12, 0, 14, [new THREE.Vector3(-12, 0, 14), new THREE.Vector3(-4, 0, 14)]);
    const e2 = new Enemy(this.scene, 12, 0, 14, [new THREE.Vector3(12, 0, 14), new THREE.Vector3(4, 0, 14)]);
    const e3 = new Enemy(this.scene, -12, 0, 0, [new THREE.Vector3(-12, 0, 0), new THREE.Vector3(-12, 0, -10)]);
    const e4 = new Enemy(this.scene, 12, 0, 0, [new THREE.Vector3(12, 0, 0), new THREE.Vector3(12, 0, -10)]);
    const e5 = new Enemy(this.scene, -3, 0, -12, [new THREE.Vector3(-3, 0, -12), new THREE.Vector3(-3, 0, -18)]);
    const e6 = new Enemy(this.scene, 3, 0, -12, [new THREE.Vector3(3, 0, -12), new THREE.Vector3(3, 0, -18)]);

    this.enemies = [e1, e2, e3, e4, e5, e6];
    this.enemies.forEach(e => aiManager.addEnemy(e));
  }

  // --- LEVEL 4: FORTRESS COMMAND CITADEL ---
  buildLevel4(aiManager) {
    this.renderer.setupRain(false);
    this.playerSpawn = { x: 0, y: 1.7, z: 24, rotY: 0 };

    const floorGeom = new THREE.PlaneGeometry(70, 70);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x0d1117, roughness: 0.2, metalness: 0.7 });
    const floor = new THREE.Mesh(floorGeom, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.addObj(floor);

    this.createWall(0, 5, -30, 60, 10, 3, 0x151c24);
    this.createWall(0, 5, 30, 60, 10, 3, 0x151c24);
    this.createWall(-30, 5, 0, 3, 10, 60, 0x151c24);
    this.createWall(30, 5, 0, 3, 10, 60, 0x151c24);

    for (let x of [-12, 12]) {
      for (let z of [-14, 0, 12]) {
        this.createCitadelPillar(x, 0, z);
      }
    }

    this.createWall(-6, 1.5, 6, 10, 3, 1.5, 0x2a3644);
    this.createWall(6, 1.5, 6, 10, 3, 1.5, 0x2a3644);
    this.createWall(0, 1.5, -10, 16, 3, 2, 0x2a3644);

    this.createFloodlight(0, 9, 0, 0xffd700);
    this.createEmergencyLight(-20, 6, -16);
    this.createEmergencyLight(20, 6, -16);

    this.bomb = new Bomb(this.scene, 0, 0, -22, 65);

    const e1 = new Enemy(this.scene, -8, 0, 16, [new THREE.Vector3(-8, 0, 16), new THREE.Vector3(-2, 0, 16)]);
    const e2 = new Enemy(this.scene, 8, 0, 16, [new THREE.Vector3(8, 0, 16), new THREE.Vector3(2, 0, 16)]);
    const e3 = new Enemy(this.scene, -14, 0, 6, [new THREE.Vector3(-14, 0, 6), new THREE.Vector3(-14, 0, -4)]);
    const e4 = new Enemy(this.scene, 14, 0, 6, [new THREE.Vector3(14, 0, 6), new THREE.Vector3(14, 0, -4)]);
    const e5 = new Enemy(this.scene, -6, 0, -2, [new THREE.Vector3(-6, 0, -2), new THREE.Vector3(0, 0, -2)]);
    const e6 = new Enemy(this.scene, 6, 0, -2, [new THREE.Vector3(6, 0, -2), new THREE.Vector3(0, 0, -2)]);
    const e7 = new Enemy(this.scene, -8, 0, -16, [new THREE.Vector3(-8, 0, -16), new THREE.Vector3(-2, 0, -16)]);
    const e8 = new Enemy(this.scene, 8, 0, -16, [new THREE.Vector3(8, 0, -16), new THREE.Vector3(2, 0, -16)]);

    this.enemies = [e1, e2, e3, e4, e5, e6, e7, e8];
    this.enemies.forEach(e => aiManager.addEnemy(e));
  }

  // --- DETAILED ARCHITECTURAL BUILDERS ---
  createEuropeanBuilding(x, y, z, w, h, d, wallTex, hasWarmWindows = true) {
    const bGroup = new THREE.Group();
    bGroup.position.set(x, y, z);

    // Main Brick/Stone Wall Structure
    const wallGeom = new THREE.BoxGeometry(w, h, d);
    const wallMat = new THREE.MeshStandardMaterial({
      map: wallTex,
      roughness: 0.7,
      metalness: 0.15
    });
    const mainBuilding = new THREE.Mesh(wallGeom, wallMat);
    mainBuilding.position.y = h / 2;
    mainBuilding.castShadow = true;
    mainBuilding.receiveShadow = true;
    bGroup.add(mainBuilding);

    // Pitched Slate Roof
    const roofGeom = new THREE.ConeGeometry(Math.max(w, d) * 0.7, 3.2, 4);
    roofGeom.rotateY(Math.PI / 4);
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x141820, roughness: 0.6 });
    const roof = new THREE.Mesh(roofGeom, roofMat);
    roof.position.y = h + 1.6;
    roof.castShadow = true;
    bGroup.add(roof);

    // Glowing Warm Amber Windows facing the street
    if (hasWarmWindows) {
      const facingSign = x < 0 ? 1 : -1;
      const winPositions = [
        [-d * 0.25, h * 0.35],
        [d * 0.25, h * 0.35],
        [-d * 0.25, h * 0.7],
        [d * 0.25, h * 0.7]
      ];

      winPositions.forEach(([wz, wy]) => {
        const winGeom = new THREE.PlaneGeometry(1.4, 1.8);
        const winMat = new THREE.MeshBasicMaterial({
          color: 0xffbb44,
          side: THREE.DoubleSide
        });
        const win = new THREE.Mesh(winGeom, winMat);
        win.position.set(facingSign * (w / 2 + 0.05), wy, wz);
        win.rotation.y = facingSign * Math.PI / 2;
        bGroup.add(win);
      });

      // Warm glow emission light illuminating the cobblestones
      const winLight = new THREE.PointLight(0xffaa33, 2.5, 12);
      winLight.position.set(facingSign * (w / 2 + 1.0), h * 0.5, 0);
      bGroup.add(winLight);
    }

    this.addObj(bGroup);

    // Explicit exact world-space bounding box for building
    const box = new THREE.Box3(
      new THREE.Vector3(x - w / 2, 0, z - d / 2),
      new THREE.Vector3(x + w / 2, h, z + d / 2)
    );
    box.mesh = mainBuilding;
    this.colliders.push(box);
  }

  createVintageStreetLamp(x, y, z) {
    const lampGroup = new THREE.Group();
    lampGroup.position.set(x, y, z);

    const metalMat = new THREE.MeshStandardMaterial({ color: 0x111418, roughness: 0.4, metalness: 0.9 });
    const glassMat = new THREE.MeshBasicMaterial({ color: 0xffdd66 });

    // Ornate Cast Iron Post
    const postGeom = new THREE.CylinderGeometry(0.08, 0.12, y, 8);
    const post = new THREE.Mesh(postGeom, metalMat);
    post.position.y = -y / 2;
    post.castShadow = true;
    lampGroup.add(post);

    // Lantern Bracket & Cage
    const cageGeom = new THREE.BoxGeometry(0.5, 0.7, 0.5);
    const cage = new THREE.Mesh(cageGeom, metalMat);
    lampGroup.add(cage);

    // Glowing Bulb Core
    const bulbGeom = new THREE.SphereGeometry(0.18, 8, 8);
    const bulb = new THREE.Mesh(bulbGeom, glassMat);
    lampGroup.add(bulb);

    this.addObj(lampGroup);

    // Warm Atmospheric SpotLight pointing down at street
    const lampLight = new THREE.SpotLight(0xffaa33, 8.0, 30, Math.PI / 3, 0.5, 1.2);
    lampLight.position.set(x, y, z);
    const targetObj = new THREE.Object3D();
    targetObj.position.set(x, 0, z);
    this.scene.add(targetObj);
    lampLight.target = targetObj;
    lampLight.castShadow = true;
    this.scene.add(lampLight);
    this.levelObjects.push(lampLight);
    this.levelObjects.push(targetObj);

    // Ambient point glow
    const pointGlow = new THREE.PointLight(0xffaa33, 3.5, 12);
    pointGlow.position.set(x, y, z);
    this.scene.add(pointGlow);
    this.levelObjects.push(pointGlow);
  }

  createWoodenBarrel(x, y, z) {
    const geom = new THREE.CylinderGeometry(0.42, 0.42, 0.95, 12);
    const mat = new THREE.MeshStandardMaterial({ color: 0x4d3822, roughness: 0.7 });
    const barrel = new THREE.Mesh(geom, mat);
    barrel.position.set(x, y + 0.475, z);
    barrel.castShadow = true;
    barrel.receiveShadow = true;
    this.addObj(barrel);

    const box = new THREE.Box3(
      new THREE.Vector3(x - 0.45, y, z - 0.45),
      new THREE.Vector3(x + 0.45, y + 0.95, z + 0.45)
    );
    box.mesh = barrel;
    this.colliders.push(box);
  }

  addObj(obj) {
    this.scene.add(obj);
    this.levelObjects.push(obj);
  }

  createWall(x, y, z, width, height, depth, color = 0x222a36) {
    const geom = new THREE.BoxGeometry(width, height, depth);
    const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.7 });
    const wall = new THREE.Mesh(geom, mat);
    wall.position.set(x, y, z);
    wall.castShadow = true;
    wall.receiveShadow = true;
    this.addObj(wall);

    const box = new THREE.Box3(
      new THREE.Vector3(x - width / 2, y - height / 2, z - depth / 2),
      new THREE.Vector3(x + width / 2, y + height / 2, z + depth / 2)
    );
    box.mesh = wall;
    this.colliders.push(box);
  }

  createCrate(x, y, z, w, h, d) {
    const geom = new THREE.BoxGeometry(w, h, d);
    const mat = new THREE.MeshStandardMaterial({ color: 0x5a4428, roughness: 0.8 });
    const crate = new THREE.Mesh(geom, mat);
    crate.position.set(x, y + h / 2, z);
    crate.castShadow = true;
    crate.receiveShadow = true;
    this.addObj(crate);

    const box = new THREE.Box3(
      new THREE.Vector3(x - w / 2, y, z - d / 2),
      new THREE.Vector3(x + w / 2, y + h, z + d / 2)
    );
    box.mesh = crate;
    this.colliders.push(box);
  }

  createServerRack(x, y, z) {
    const geom = new THREE.BoxGeometry(1.8, 3.8, 1.2);
    const mat = new THREE.MeshStandardMaterial({ color: 0x111822, roughness: 0.4, metalness: 0.8 });
    const rack = new THREE.Mesh(geom, mat);
    rack.position.set(x, y + 1.9, z);
    rack.castShadow = true;
    this.addObj(rack);

    const box = new THREE.Box3(
      new THREE.Vector3(x - 0.9, y, z - 0.6),
      new THREE.Vector3(x + 0.9, y + 3.8, z + 0.6)
    );
    box.mesh = rack;
    this.colliders.push(box);
  }

  createChemicalVat(x, y, z, glowColor = 0x00ff88) {
    const geom = new THREE.CylinderGeometry(2.5, 2.5, 5, 16);
    const mat = new THREE.MeshStandardMaterial({ color: 0x1e2832, roughness: 0.3, metalness: 0.7 });
    const vat = new THREE.Mesh(geom, mat);
    vat.position.set(x, y + 2.5, z);
    vat.castShadow = true;
    this.addObj(vat);

    const box = new THREE.Box3(
      new THREE.Vector3(x - 2.5, y, z - 2.5),
      new THREE.Vector3(x + 2.5, y + 5, z + 2.5)
    );
    box.mesh = vat;
    this.colliders.push(box);
  }

  createCitadelPillar(x, y, z) {
    const geom = new THREE.BoxGeometry(2.8, 9, 2.8);
    const mat = new THREE.MeshStandardMaterial({ color: 0x1a2330, roughness: 0.3, metalness: 0.6 });
    const pillar = new THREE.Mesh(geom, mat);
    pillar.position.set(x, y + 4.5, z);
    pillar.castShadow = true;
    this.addObj(pillar);

    const box = new THREE.Box3(
      new THREE.Vector3(x - 1.4, y, z - 1.4),
      new THREE.Vector3(x + 1.4, y + 9, z + 1.4)
    );
    box.mesh = pillar;
    this.colliders.push(box);
  }

  createFloodlight(x, y, z, color = 0xffeedd) {
    const light = new THREE.SpotLight(color, 3.5, 45, Math.PI / 4, 0.4);
    light.position.set(x, y, z);
    const targetObj = new THREE.Object3D();
    targetObj.position.set(x, 0, z);
    this.scene.add(targetObj);
    light.target = targetObj;
    this.scene.add(light);
    this.levelObjects.push(light);
    this.levelObjects.push(targetObj);
  }

  createEmergencyLight(x, y, z) {
    const light = new THREE.PointLight(0xff3344, 3.0, 20);
    light.position.set(x, y, z);
    this.scene.add(light);
    this.levelObjects.push(light);
  }
}
