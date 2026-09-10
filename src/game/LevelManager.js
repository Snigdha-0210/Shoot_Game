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
    this.animatedObjects = []; // Rotating sirens, pulsating vats, holograms
    this.bomb = null;
    this.playerSpawn = { x: 0, y: 0, z: 24, rotY: 0 };
    this.railWaypoints = [];
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
    } else if (levelNumber === 4) {
      this.buildLevel4(aiManager);
    } else if (levelNumber === 5) {
      this.buildLevel5(aiManager);
    } else {
      this.buildLevel6(aiManager);
    }

    return {
      bomb: this.bomb,
      enemies: this.enemies,
      colliders: this.colliders,
      playerSpawn: this.playerSpawn,
      railWaypoints: this.railWaypoints
    };
  }

  clearLevel(aiManager) {
    if (aiManager) aiManager.clear();
    this.enemies = [];
    this.animatedObjects = [];
    this.railWaypoints = [];

    if (this.bomb) {
      this.bomb.destroy();
      this.bomb = null;
    }

    this.levelObjects.forEach(obj => {
      this.scene.remove(obj);
      if (obj.geometry) obj.geometry.dispose();
    });

    this.levelObjects = [];
    this.colliders = [];
  }

  update(delta) {
    // Animate sirens, bubbling vats, and holograms
    this.animatedObjects.forEach(item => {
      if (item.type === 'siren') {
        item.mesh.rotation.y += delta * 6.0;
      } else if (item.type === 'vat') {
        item.mesh.material.opacity = 0.6 + Math.sin(Date.now() * 0.005 + item.offset) * 0.2;
      } else if (item.type === 'hologram') {
        item.mesh.rotation.y += delta * 1.5;
      }
    });
  }

  // --- LEVEL 1: RAINY EUROPEAN COBBLESTONE ALLEYWAY ---
  buildLevel1(aiManager) {
    this.renderer.setupRain(true);
    this.playerSpawn = { x: 0, y: 0, z: 28, rotY: 0 };

    // 1. Wet Cobblestone Ground
    const cobbleTex = TextureGenerator.createCobblestoneTexture();
    const groundGeom = new THREE.PlaneGeometry(80, 80);
    const groundMat = new THREE.MeshStandardMaterial({
      map: cobbleTex,
      roughness: 0.35,
      metalness: 0.25
    });
    const ground = new THREE.Mesh(groundGeom, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.addObj(ground);

    // 2. Flanking Buildings
    const wallTex1 = TextureGenerator.createBuildingWallTexture('#261e18');
    const wallTex2 = TextureGenerator.createBuildingWallTexture('#1e242d');

    for (let z = 28; z >= -34; z -= 12) {
      this.createEuropeanBuilding(-8.5, 0, z, 7, 10, 11, wallTex1, true);
      this.createEuropeanBuilding(8.5, 0, z, 7, 10, 11, wallTex2, true);
    }
    this.createWall(0, 5, -36, 28, 10, 3, 0x1c1713);

    // Neon signs & Street Lamps
    this.createNeonSign(-4.8, 6.5, 4, 'BAR NOCTURNE', 0xff0077);
    this.createNeonSign(4.8, 6.5, -8, 'HOTEL PARIS', 0x00f0ff);

    [[-4.2, 4.5, 18], [4.2, 4.5, 6], [-4.2, 4.5, -6], [4.2, 4.5, -18], [0, 5, -28]].forEach(([lx, ly, lz]) => {
      this.createVintageStreetLamp(lx, ly, lz);
    });

    // Props
    this.createWoodenBarrel(-4.6, 0, 16);
    this.createCrate(4.6, 0, 8, 1.8, 1.6, 1.8);
    this.createWoodenBarrel(-4.6, 0, -4);
    this.createCrate(-4.6, 0, -12, 2.0, 1.5, 2.0);

    // Bomb
    const palletGeom = new THREE.BoxGeometry(2.4, 0.2, 2.4);
    const palletMat = new THREE.MeshStandardMaterial({ color: 0x4a3a24, roughness: 0.8 });
    const pallet = new THREE.Mesh(palletGeom, palletMat);
    pallet.position.set(0, 0.1, -28);
    this.addObj(pallet);

    this.bomb = new Bomb(this.scene, 0, 0.2, -28, 120);

    // Randomized 2-3 Distant & Scattered Enemies Along Alleyway
    const enemyCount1 = Math.random() < 0.5 ? 2 : 3; // strictly 2 or 3 enemies
    if (enemyCount1 === 2) {
      const e1 = new Enemy(this.scene, -3.5, 0, 12, [], 'scout');
      const e2 = new Enemy(this.scene, 0, 0, -14, [], 'juggernaut');
      this.enemies = [e1, e2];
      this.railWaypoints = [
        new THREE.Vector3(0, 0, 28),
        new THREE.Vector3(0, 0, 18),
        new THREE.Vector3(0, 0, -8),
        new THREE.Vector3(0, 0, -25.5)
      ];
    } else {
      const e1 = new Enemy(this.scene, -3.5, 0, 14, [], 'scout');
      const e2 = new Enemy(this.scene, 3.5, 0, 0, [], 'scout');
      const e3 = new Enemy(this.scene, 0, 0, -14, [], 'juggernaut');
      this.enemies = [e1, e2, e3];
      this.railWaypoints = [
        new THREE.Vector3(0, 0, 28),
        new THREE.Vector3(0, 0, 20),
        new THREE.Vector3(0, 0, 6),
        new THREE.Vector3(0, 0, -8),
        new THREE.Vector3(0, 0, -25.5)
      ];
    }
    this.enemies.forEach(e => aiManager.addEnemy(e));
  }

  // --- LEVEL 2: SUBTERRANEAN BUNKER & SERVERS ---
  buildLevel2(aiManager) {
    this.renderer.setupRain(false);
    this.playerSpawn = { x: 0, y: 0, z: 28, rotY: 0 };

    const floorGeom = new THREE.PlaneGeometry(80, 80);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x181c22, roughness: 0.4, metalness: 0.8 });
    const floor = new THREE.Mesh(floorGeom, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.addObj(floor);

    const ceilGeom = new THREE.PlaneGeometry(80, 80);
    const ceilMat = new THREE.MeshStandardMaterial({ color: 0x0a0d12, roughness: 0.9 });
    const ceil = new THREE.Mesh(ceilGeom, ceilMat);
    ceil.position.y = 5.5;
    ceil.rotation.x = Math.PI / 2;
    this.addObj(ceil);

    this.createWall(0, 2.75, -34, 50, 5.5, 1.5, 0x222a36);
    this.createWall(0, 2.75, 34, 50, 5.5, 1.5, 0x222a36);
    this.createWall(-20, 2.75, 0, 1.5, 5.5, 70, 0x222a36);
    this.createWall(20, 2.75, 0, 1.5, 5.5, 70, 0x222a36);

    for (let i = -1; i <= 1; i++) {
      this.createServerRack(-14 + i * 4, 0, 6);
      this.createServerRack(14 - i * 4, 0, -6);
    }

    this.createSpinningSiren(-12, 4.5, 14);
    this.createSpinningSiren(12, 4.5, 0);
    this.createSpinningSiren(0, 4.5, -20);

    this.bomb = new Bomb(this.scene, 0, 0, -26, 120);

    // Randomized 2-3 Distant & Scattered Bunker Enemies
    const enemyCount2 = Math.random() < 0.5 ? 2 : 3; // strictly 2 or 3 enemies
    if (enemyCount2 === 2) {
      const e1 = new Enemy(this.scene, 3.5, 0, 12, [], 'scout');
      const e2 = new Enemy(this.scene, 0, 0, -14, [], 'juggernaut');
      this.enemies = [e1, e2];
      this.railWaypoints = [
        new THREE.Vector3(0, 0, 28),
        new THREE.Vector3(0, 0, 18),
        new THREE.Vector3(0, 0, -8),
        new THREE.Vector3(0, 0, -23.8)
      ];
    } else {
      const e1 = new Enemy(this.scene, 3.5, 0, 14, [], 'scout');
      const e2 = new Enemy(this.scene, -4.0, 0, 1, [], 'sniper');
      const e3 = new Enemy(this.scene, 0, 0, -14, [], 'juggernaut');
      this.enemies = [e1, e2, e3];
      this.railWaypoints = [
        new THREE.Vector3(0, 0, 28),
        new THREE.Vector3(0, 0, 20),
        new THREE.Vector3(0, 0, 7),
        new THREE.Vector3(0, 0, -8),
        new THREE.Vector3(0, 0, -23.8)
      ];
    }
    this.enemies.forEach(e => aiManager.addEnemy(e));
  }

  // --- LEVEL 3: RESEARCH SILO & TOXIC CATWALKS ---
  buildLevel3(aiManager) {
    this.renderer.setupRain(false);
    this.playerSpawn = { x: 0, y: 0, z: 28, rotY: 0 };

    const floorGeom = new THREE.CylinderGeometry(38, 38, 1, 16);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x141a22, roughness: 0.6, metalness: 0.5 });
    const floor = new THREE.Mesh(floorGeom, floorMat);
    floor.position.y = -0.5;
    floor.receiveShadow = true;
    this.addObj(floor);

    this.createWall(0, 6, -34, 50, 12, 2, 0x11161d);
    this.createWall(0, 6, 34, 50, 12, 2, 0x11161d);
    this.createWall(-26, 6, 0, 2, 12, 70, 0x11161d);
    this.createWall(26, 6, 0, 2, 12, 70, 0x11161d);

    // Glowing Toxic Green Vats
    this.createChemicalVat(-10, 0, 10, 0x00ff88);
    this.createChemicalVat(10, 0, 10, 0x00ff88);
    this.createChemicalVat(-12, 0, -8, 0x00ff88);
    this.createChemicalVat(12, 0, -8, 0x00ff88);

    this.createCatwalk(-12, 4.0, 0, 6, 16);
    this.createCatwalk(12, 4.0, 0, 6, 16);

    this.createFloodlight(-8, 8, 0, 0x00f0ff);
    this.createFloodlight(8, 8, 0, 0x00f0ff);

    this.bomb = new Bomb(this.scene, 0, 0, -25, 120);

    // Randomized 2-3 Distant & Scattered Silo Enemies
    const enemyCount3 = Math.random() < 0.5 ? 2 : 3; // strictly 2 or 3 enemies
    if (enemyCount3 === 2) {
      const e1 = new Enemy(this.scene, -3.5, 0, 12, [], 'scout');
      const e2 = new Enemy(this.scene, 0, 0, -13, [], 'juggernaut');
      this.enemies = [e1, e2];
      this.railWaypoints = [
        new THREE.Vector3(0, 0, 28),
        new THREE.Vector3(0, 0, 18),
        new THREE.Vector3(0, 0, -7),
        new THREE.Vector3(0, 0, -22.5)
      ];
    } else {
      const e1 = new Enemy(this.scene, -3.5, 0, 14, [], 'scout');
      const e2 = new Enemy(this.scene, 12, 4.0, 1, [], 'sniper');
      const e3 = new Enemy(this.scene, 0, 0, -13, [], 'juggernaut');
      this.enemies = [e1, e2, e3];
      this.railWaypoints = [
        new THREE.Vector3(0, 0, 28),
        new THREE.Vector3(0, 0, 20),
        new THREE.Vector3(0, 0, 7),
        new THREE.Vector3(0, 0, -7),
        new THREE.Vector3(0, 0, -22.5)
      ];
    }
    this.enemies.forEach(e => aiManager.addEnemy(e));
  }

  // --- LEVEL 4: FORTRESS COMMAND CITADEL ---
  buildLevel4(aiManager) {
    this.renderer.setupRain(false);
    this.playerSpawn = { x: 0, y: 0, z: 28, rotY: 0 };

    // 1. Polished Obsidian / Metallic High-Gloss Floor
    const floorGeom = new THREE.PlaneGeometry(80, 80);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x0a0e14,
      roughness: 0.12,
      metalness: 0.88,
      emissive: 0x050a12,
      emissiveIntensity: 0.2
    });
    const floor = new THREE.Mesh(floorGeom, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.addObj(floor);

    // Perimeter Monolith Fortress Walls
    this.createWall(0, 6, -34, 60, 12, 3, 0x111722);
    this.createWall(0, 6, 34, 60, 12, 3, 0x111722);
    this.createWall(-30, 6, 0, 3, 12, 70, 0x111722);
    this.createWall(30, 6, 0, 3, 12, 70, 0x111722);

    // Massive Citadel Pillars with Golden Trim
    for (let x of [-12, 12]) {
      for (let z of [-14, 0, 14]) {
        this.createCitadelPillar(x, 0, z);
      }
    }

    // Flanking Command Workstations
    for (let z of [10, -2, -14]) {
      this.createServerRack(-8, 0, z);
      this.createServerRack(8, 0, z);
    }

    // Hologram Command Table placed to the flank (clear central rail corridor) & Gold Floodlights
    this.createHologramTable(-10, 0, 2);
    this.createFloodlight(0, 10, 0, 0xffd700);
    this.createFloodlight(-8, 8, -12, 0x00f0ff);
    this.createFloodlight(8, 8, -12, 0xff0055);

    // Rotating Warning Sirens
    this.createSpinningSiren(-12, 8, 12);
    this.createSpinningSiren(12, 8, 12);

    // Neon Level Banner
    this.createNeonSign(0, 8.5, -30, 'COMMAND CITADEL', 0xffd700);

    this.bomb = new Bomb(this.scene, 0, 0, -24, 120);

    // Randomized 2-3 Distant & Scattered Citadel Enforcers (Final Hostile is ALWAYS General Malikov Boss)
    const enemyCount4 = Math.random() < 0.5 ? 2 : 3; // strictly 2 or 3 enemies
    if (enemyCount4 === 2) {
      const e1 = new Enemy(this.scene, -4.5, 0, 10, [], 'scout');
      const boss = new Enemy(this.scene, 0, 0, -13, [], 'boss');
      this.enemies = [e1, boss];
      this.railWaypoints = [
        new THREE.Vector3(0, 0, 28),
        new THREE.Vector3(0, 0, 16),
        new THREE.Vector3(0, 0, -7),
        new THREE.Vector3(0, 0, -21.5)
      ];
    } else {
      const e1 = new Enemy(this.scene, -4.5, 0, 14, [], 'scout');
      const e2 = new Enemy(this.scene, 4.5, 0, 1, [], 'sniper');
      const boss = new Enemy(this.scene, 0, 0, -13, [], 'boss');
      this.enemies = [e1, e2, boss];
      this.railWaypoints = [
        new THREE.Vector3(0, 0, 28),
        new THREE.Vector3(0, 0, 20),
        new THREE.Vector3(0, 0, 7),
        new THREE.Vector3(0, 0, -7),
        new THREE.Vector3(0, 0, -21.5)
      ];
    }
    this.enemies.forEach(e => aiManager.addEnemy(e));
  }

  // --- LEVEL 5: CYBERNETIC SERVER MATRIX ---
  buildLevel5(aiManager) {
    this.renderer.setupRain(false);
    this.playerSpawn = { x: 0, y: 0, z: 24, rotY: 0 };

    // 1. Cyber Grid Floor with Deep Cyan Emissive Glow
    const floorGeom = new THREE.PlaneGeometry(70, 70);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x040810,
      roughness: 0.1,
      metalness: 0.95,
      emissive: 0x001525,
      emissiveIntensity: 0.5
    });
    const floor = new THREE.Mesh(floorGeom, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.addObj(floor);

    this.createWall(0, 6, -30, 60, 12, 3, 0x080d18);
    this.createWall(0, 6, 30, 60, 12, 3, 0x080d18);
    this.createWall(-26, 6, 0, 3, 12, 60, 0x080d18);
    this.createWall(26, 6, 0, 3, 12, 60, 0x080d18);

    // Glowing Cyber Data Pillars
    for (let z of [-16, -6, 4, 14]) {
      this.createCyberPillar(-10, 0, z, 0x00f0ff);
      this.createCyberPillar(10, 0, z, 0xff0077);
    }

    // High Density Server Racks
    for (let z of [12, 2, -8]) {
      this.createServerRack(-6, 0, z);
      this.createServerRack(6, 0, z);
    }

    // Floating Cyber Hologram Table & Neon Sign
    this.createHologramTable(0, 0, 2);
    this.createNeonSign(0, 7.5, -28, 'MAINFRAME CORE [AI MATRIX]', 0x00ff88);

    // Pulsating Sirens & Floodlights
    this.createSpinningSiren(-10, 7, 0);
    this.createSpinningSiren(10, 7, 0);
    this.createFloodlight(-8, 9, 8, 0x00f0ff);
    this.createFloodlight(8, 9, 8, 0xff0077);

    this.bomb = new Bomb(this.scene, 0, 0, -22, 120);

    // 3 Cyber Matrix Enforcers
    const e1 = new Enemy(this.scene, 4.0, 0, 14, [], 'scout');
    const e2 = new Enemy(this.scene, -4.0, 0, 4, [], 'scout');
    const e3 = new Enemy(this.scene, 0, 0, -10, [], 'juggernaut');

    this.enemies = [e1, e2, e3];
    this.enemies.forEach(e => aiManager.addEnemy(e));

    this.railWaypoints = [
      new THREE.Vector3(0, 0, 24),
      new THREE.Vector3(0, 0, 19),
      new THREE.Vector3(0, 0, 9),
      new THREE.Vector3(0, 0, -5),
      new THREE.Vector3(0, 0, -19.8)
    ];
  }

  // --- LEVEL 6: ORBITAL LAUNCH PLATFORM (MASTER OMEGA FINALE) ---
  buildLevel6(aiManager) {
    this.renderer.setupRain(false);
    this.playerSpawn = { x: 0, y: 0, z: 26, rotY: 0 };

    // 1. Reinforced Heavy Industrial Launch Pad
    const floorGeom = new THREE.PlaneGeometry(80, 80);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x0f141e,
      roughness: 0.25,
      metalness: 0.75
    });
    const floor = new THREE.Mesh(floorGeom, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.addObj(floor);

    // Gantry Monolith Pillars
    this.createCitadelPillar(-14, 0, 14);
    this.createCitadelPillar(14, 0, 14);
    this.createCitadelPillar(-14, 0, -14);
    this.createCitadelPillar(14, 0, -14);

    // Elevated Sniper Perch Catwalk
    this.createCatwalk(12, 4.2, 2, 6, 14);
    this.createCatwalk(-12, 4.2, 2, 6, 14);

    // Quad Red Warning Sirens
    this.createSpinningSiren(-14, 9, 14);
    this.createSpinningSiren(14, 9, 14);
    this.createSpinningSiren(-14, 9, -14);
    this.createSpinningSiren(14, 9, -14);
    this.createSpinningSiren(0, 9, -24);

    // Flanking Heavy Blast Barricades
    this.createWall(-6, 1.2, 6, 4, 2.4, 1.5, 0x243242);
    this.createWall(6, 1.2, 6, 4, 2.4, 1.5, 0x243242);

    // Elevated Boss Command Dias
    this.createWall(0, 0.4, -22, 14, 0.8, 10, 0x223344);

    // Neon Master Warning Banner
    this.createNeonSign(0, 8.5, -28, 'ORBITAL LAUNCH TERMINAL', 0xff2233);

    // High Intensity Floodlights
    this.createFloodlight(0, 10, -10, 0xffeedd);
    this.createFloodlight(-10, 8, 4, 0xff3344);
    this.createFloodlight(10, 8, 4, 0xff3344);

    this.bomb = new Bomb(this.scene, 0, 0.8, -22, 120);

    // 3 Finale Enemies (Elite Scout -> Elevated Sniper -> GENERAL MALIKOV BOSS)
    const e1 = new Enemy(this.scene, -5.0, 0, 16, [], 'scout');
    const e2 = new Enemy(this.scene, 12, 4.2, 2, [], 'sniper');
    const boss = new Enemy(this.scene, 0, 0.8, -14, [], 'boss');

    this.enemies = [e1, e2, boss];
    this.enemies.forEach(e => aiManager.addEnemy(e));

    this.railWaypoints = [
      new THREE.Vector3(0, 0, 26),
      new THREE.Vector3(0, 0, 21),
      new THREE.Vector3(0, 0, 9),
      new THREE.Vector3(0, 0, -8),
      new THREE.Vector3(0, 0, -19.8)
    ];
  }

  // --- ARCHITECTURAL BUILDERS ---
  createEuropeanBuilding(x, y, z, w, h, d, wallTex, addRoof = false) {
    const geom = new THREE.BoxGeometry(w, h, d);
    const mat = new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.8, metalness: 0.1 });
    const bldg = new THREE.Mesh(geom, mat);
    bldg.position.set(x, y + h / 2, z);
    bldg.castShadow = true;
    bldg.receiveShadow = true;
    this.addObj(bldg);

    const box = new THREE.Box3(
      new THREE.Vector3(x - w / 2, y, z - d / 2),
      new THREE.Vector3(x + w / 2, y + h, z + d / 2)
    );
    box.mesh = bldg;
    this.colliders.push(box);
  }

  createVintageStreetLamp(x, y, z) {
    const postGeom = new THREE.CylinderGeometry(0.12, 0.16, 4.5, 8);
    const postMat = new THREE.MeshStandardMaterial({ color: 0x1a2228, metalness: 0.9, roughness: 0.3 });
    const post = new THREE.Mesh(postGeom, postMat);
    post.position.set(x, 2.25, z);
    this.addObj(post);

    const lightGlow = new THREE.PointLight(0xffcc77, 3.5, 18);
    lightGlow.position.set(x, 4.6, z);
    this.addObj(lightGlow);
  }

  createSpinningSiren(x, y, z) {
    const baseGeom = new THREE.CylinderGeometry(0.3, 0.4, 0.3, 12);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.8 });
    const base = new THREE.Mesh(baseGeom, baseMat);
    base.position.set(x, y, z);
    this.addObj(base);

    const bulbGeom = new THREE.CylinderGeometry(0.2, 0.25, 0.4, 12);
    const bulbMat = new THREE.MeshBasicMaterial({ color: 0xff1122 });
    const bulb = new THREE.Mesh(bulbGeom, bulbMat);
    bulb.position.set(x, y + 0.3, z);
    this.addObj(bulb);

    const sirenLight = new THREE.SpotLight(0xff2233, 4.0, 25, Math.PI / 4, 0.3);
    sirenLight.position.set(x, y + 0.3, z);
    const targetObj = new THREE.Object3D();
    targetObj.position.set(x + 5, y, z);
    this.scene.add(targetObj);
    sirenLight.target = targetObj;
    this.addObj(sirenLight);

    this.animatedObjects.push({
      type: 'siren',
      mesh: targetObj
    });
  }

  createHologramTable(x, y, z) {
    const tableGeom = new THREE.CylinderGeometry(2.5, 2.8, 1.0, 16);
    const tableMat = new THREE.MeshStandardMaterial({ color: 0x111622, metalness: 0.8, roughness: 0.3 });
    const table = new THREE.Mesh(tableGeom, tableMat);
    table.position.set(x, y + 0.5, z);
    this.addObj(table);

    const holoGeom = new THREE.IcosahedronGeometry(1.2, 1);
    const holoMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, wireframe: true, transparent: true, opacity: 0.6 });
    const holo = new THREE.Mesh(holoGeom, holoMat);
    holo.position.set(x, y + 2.0, z);
    this.addObj(holo);

    this.animatedObjects.push({
      type: 'hologram',
      mesh: holo
    });
  }

  createCatwalk(x, y, z, w, d) {
    const geom = new THREE.BoxGeometry(w, 0.3, d);
    const mat = new THREE.MeshStandardMaterial({ color: 0x2a3644, roughness: 0.4, metalness: 0.8 });
    const catwalk = new THREE.Mesh(geom, mat);
    catwalk.position.set(x, y, z);
    catwalk.castShadow = true;
    catwalk.receiveShadow = true;
    this.addObj(catwalk);
  }

  createCyberPillar(x, y, z, glowColor = 0x00f0ff) {
    const pillarGeom = new THREE.BoxGeometry(1.8, 12, 1.8);
    const pillarMat = new THREE.MeshStandardMaterial({ color: 0x0c121e, roughness: 0.3, metalness: 0.8 });
    const pillar = new THREE.Mesh(pillarGeom, pillarMat);
    pillar.position.set(x, y + 6, z);
    this.addObj(pillar);

    const stripeGeom = new THREE.BoxGeometry(0.15, 11, 0.15);
    const stripeMat = new THREE.MeshBasicMaterial({ color: glowColor });
    const stripe = new THREE.Mesh(stripeGeom, stripeMat);
    stripe.position.set(x, y + 6, z + 0.95);
    this.addObj(stripe);

    const light = new THREE.PointLight(glowColor, 2.0, 10);
    light.position.set(x, y + 6, z + 1.2);
    this.addObj(light);
  }

  createNeonSign(x, y, z, text, colorHex = 0xff0077) {
    const group = new THREE.Group();
    group.position.set(x, y, z);

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#0a0a0e';
    ctx.fillRect(0, 0, 512, 128);

    ctx.fillStyle = `#${colorHex.toString(16).padStart(6, '0')}`;
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 18;
    ctx.font = 'bold 44px Orbitron, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 256, 64);

    const tex = new THREE.CanvasTexture(canvas);
    const signGeom = new THREE.PlaneGeometry(4.0, 1.0);
    const signMat = new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide });
    const sign = new THREE.Mesh(signGeom, signMat);
    group.add(sign);

    const glow = new THREE.PointLight(colorHex, 2.0, 8);
    group.add(glow);

    this.scene.add(group);
    this.levelObjects.push(group);
  }

  createWoodenBarrel(x, y, z) {
    const geom = new THREE.CylinderGeometry(0.42, 0.42, 0.95, 12);
    const mat = new THREE.MeshStandardMaterial({ color: 0x4d3822, roughness: 0.7 });
    const barrel = new THREE.Mesh(geom, mat);
    barrel.position.set(x, y + 0.475, z);
    this.addObj(barrel);
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
    this.addObj(rack);
  }

  createChemicalVat(x, y, z, glowColor = 0x00ff88) {
    const geom = new THREE.CylinderGeometry(2.5, 2.5, 5, 16);
    const mat = new THREE.MeshStandardMaterial({ color: 0x1e2832, roughness: 0.3, metalness: 0.7 });
    const vat = new THREE.Mesh(geom, mat);
    vat.position.set(x, y + 2.5, z);
    this.addObj(vat);

    const liquidGeom = new THREE.CircleGeometry(2.4, 16);
    const liquidMat = new THREE.MeshBasicMaterial({ color: glowColor, transparent: true, opacity: 0.75 });
    const liquid = new THREE.Mesh(liquidGeom, liquidMat);
    liquid.rotation.x = -Math.PI / 2;
    liquid.position.set(x, y + 5.01, z);
    this.addObj(liquid);

    const glowLight = new THREE.PointLight(glowColor, 2.5, 10);
    glowLight.position.set(x, y + 5.5, z);
    this.addObj(glowLight);

    this.animatedObjects.push({
      type: 'vat',
      mesh: liquid,
      offset: Math.random() * 10
    });
  }

  createCitadelPillar(x, y, z) {
    const geom = new THREE.BoxGeometry(2.8, 9, 2.8);
    const mat = new THREE.MeshStandardMaterial({ color: 0x1a2330, roughness: 0.3, metalness: 0.6 });
    const pillar = new THREE.Mesh(geom, mat);
    pillar.position.set(x, y + 4.5, z);
    this.addObj(pillar);
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
}
