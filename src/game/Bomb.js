import * as THREE from 'three';
import { audio } from '../engine/Audio.js';
import { TextureGenerator } from '../engine/TextureGenerator.js';

export class Bomb {
  constructor(scene, x, y, z, initialTime = 120) {
    this.scene = scene;
    this.position = new THREE.Vector3(x, y, z);
    this.initialTime = initialTime;
    this.timeRemaining = initialTime;
    this.isDefused = false;
    this.isDetonated = false;

    this.beepTimer = 0;
    this.buildModel(x, y, z);
  }

  buildModel(x, y, z) {
    this.root = new THREE.Group();
    this.root.position.set(x, y, z);

    // Materials
    const c4Mat = new THREE.MeshStandardMaterial({ color: 0x7a6e56, roughness: 0.7 });
    const tapeMat = new THREE.MeshStandardMaterial({ color: 0x0055cc, roughness: 0.3 });
    const metalMat = new THREE.MeshStandardMaterial({ color: 0x242e3a, roughness: 0.4, metalness: 0.8 });
    
    // PCB Circuit Texture
    const pcbTexture = TextureGenerator.createCircuitBoardTexture();
    const pcbMat = new THREE.MeshStandardMaterial({
      map: pcbTexture,
      roughness: 0.3,
      metalness: 0.4,
      emissive: 0x003344,
      emissiveIntensity: 0.8
    });

    // 1. C4 / Explosive Cylinders Bundle
    const cylGroup = new THREE.Group();
    const radius = 0.1;
    const length = 0.85;

    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 3; col++) {
        const cylGeom = new THREE.CylinderGeometry(radius, radius, length, 14);
        cylGeom.rotateZ(Math.PI / 2);
        const cyl = new THREE.Mesh(cylGeom, c4Mat);
        cyl.position.set(0, 0.1 + row * 0.16, -0.18 + col * 0.18);
        cyl.castShadow = true;
        cylGroup.add(cyl);
      }
    }

    // Heavy Blue Binding Vinyl Tape
    const tapeGeom1 = new THREE.BoxGeometry(0.14, 0.38, 0.58);
    const tape1 = new THREE.Mesh(tapeGeom1, tapeMat);
    tape1.position.set(-0.24, 0.18, 0);
    cylGroup.add(tape1);

    const tapeGeom2 = new THREE.BoxGeometry(0.14, 0.38, 0.58);
    const tape2 = new THREE.Mesh(tapeGeom2, tapeMat);
    tape2.position.set(0.24, 0.18, 0);
    cylGroup.add(tape2);

    this.root.add(cylGroup);

    // 2. High-Tech Microchip Motherboard
    const pcbGeom = new THREE.BoxGeometry(0.65, 0.04, 0.52);
    const pcbMesh = new THREE.Mesh(pcbGeom, pcbMat);
    pcbMesh.position.set(0, 0.4, 0);
    pcbMesh.castShadow = true;
    this.root.add(pcbMesh);

    // Microprocessor Core
    const chipGeom = new THREE.BoxGeometry(0.18, 0.04, 0.18);
    const chipMesh = new THREE.Mesh(chipGeom, metalMat);
    chipMesh.position.set(0.15, 0.43, 0.1);
    this.root.add(chipMesh);

    // 3. Glowing Digital Clock Display in Fiery Orange
    const clockCanvas = document.createElement('canvas');
    clockCanvas.width = 256;
    clockCanvas.height = 96;
    this.clockCtx = clockCanvas.getContext('2d');
    this.clockTexture = new THREE.CanvasTexture(clockCanvas);

    const screenGeom = new THREE.BoxGeometry(0.32, 0.12, 0.03);
    const screenMat = new THREE.MeshBasicMaterial({ map: this.clockTexture });
    const screenMesh = new THREE.Mesh(screenGeom, screenMat);
    screenMesh.position.set(-0.12, 0.46, 0.22);
    screenMesh.rotation.x = -0.25;
    this.root.add(screenMesh);

    // 4. Status LED Bank
    this.ledGroup = new THREE.Group();
    this.ledGroup.position.set(0.18, 0.44, 0.22);

    const ledColors = [0xff2233, 0x00ff88, 0x00f0ff, 0xffcc00];
    ledColors.forEach((col, idx) => {
      const bulbGeom = new THREE.SphereGeometry(0.02, 8, 8);
      const bulbMat = new THREE.MeshBasicMaterial({ color: col });
      const bulb = new THREE.Mesh(bulbGeom, bulbMat);
      bulb.position.set(idx * 0.045 - 0.06, 0, 0);
      this.ledGroup.add(bulb);
    });
    this.root.add(this.ledGroup);

    // Dynamic Point Light illuminating the bomb
    this.bombLight = new THREE.PointLight(0xff4422, 3.5, 8);
    this.bombLight.position.set(0, 0.6, 0.1);
    this.root.add(this.bombLight);

    // 5. Arched Multi-Colored Wire Harness: All 6 Breadboard Colors
    const wireDefs = [
      { color: 0xff2233, path: [[-0.25, 0.42, -0.18], [-0.22, 0.62, -0.06], [-0.06, 0.42, 0.1]] },   // 1. Red
      { color: 0x00ff88, path: [[-0.23, 0.42, -0.16], [-0.18, 0.60, -0.02], [-0.02, 0.42, 0.12]] },  // 2. Green
      { color: 0xffcc00, path: [[-0.20, 0.42, -0.14], [-0.14, 0.58, 0.02], [0.04, 0.42, 0.14]] },    // 3. Yellow
      { color: 0x181818, path: [[-0.17, 0.42, -0.12], [-0.10, 0.56, 0.06], [0.10, 0.42, 0.16]] },    // 4. Black
      { color: 0x0088ff, path: [[-0.14, 0.42, -0.10], [-0.06, 0.54, 0.10], [0.16, 0.42, 0.18]] },    // 5. Blue
      { color: 0xf5f5f5, path: [[-0.11, 0.42, -0.08], [-0.02, 0.52, 0.14], [0.22, 0.42, 0.20]] }     // 6. White
    ];

    wireDefs.forEach(w => {
      const points = w.path.map(p => new THREE.Vector3(p[0], p[1], p[2]));
      const curve = new THREE.CatmullRomCurve3(points);
      const geom = new THREE.TubeGeometry(curve, 20, 0.014, 8, false);
      const mat = new THREE.MeshStandardMaterial({ color: w.color, roughness: 0.3, metalness: 0.1 });
      const wireMesh = new THREE.Mesh(geom, mat);
      this.root.add(wireMesh);
    });

    // 6. --- ULTRA-VISIBLE 3D IN-WORLD TACTICAL BEACON ---
    const beamGeom = new THREE.CylinderGeometry(0.15, 0.4, 18, 16);
    beamGeom.translate(0, 9, 0);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0xffaa00,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide
    });
    this.lightBeam = new THREE.Mesh(beamGeom, beamMat);
    this.root.add(this.lightBeam);

    // Floating 3D Holographic Waypoint Diamond above bomb
    const diamondGeom = new THREE.OctahedronGeometry(0.35, 0);
    const diamondMat = new THREE.MeshBasicMaterial({
      color: 0xffdd00,
      wireframe: true
    });
    this.waypointDiamond = new THREE.Mesh(diamondGeom, diamondMat);
    this.waypointDiamond.position.y = 2.2;
    this.root.add(this.waypointDiamond);

    // Solid inner glowing core
    const coreGeom = new THREE.OctahedronGeometry(0.2, 0);
    const coreMat = new THREE.MeshBasicMaterial({ color: 0xff8800 });
    this.waypointCore = new THREE.Mesh(coreGeom, coreMat);
    this.waypointDiamond.add(this.waypointCore);

    // Pulsating Ground Warning Ring
    const ringGeom = new THREE.RingGeometry(1.2, 1.4, 32);
    ringGeom.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xffaa00,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.6
    });
    this.groundRing = new THREE.Mesh(ringGeom, ringMat);
    this.groundRing.position.y = 0.02;
    this.root.add(this.groundRing);

    this.scene.add(this.root);
    this.updateClockTexture();
  }

  updateClockTexture() {
    if (!this.clockCtx) return;
    const ctx = this.clockCtx;
    ctx.fillStyle = '#100204';
    ctx.fillRect(0, 0, 256, 96);

    const mins = Math.floor(this.timeRemaining / 60);
    const secs = Math.floor(this.timeRemaining % 60);
    const millis = Math.floor((this.timeRemaining % 1) * 100);
    const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}:${String(millis).padStart(2, '0')}`;

    ctx.fillStyle = '#ff3b20';
    ctx.shadowColor = '#ff3b20';
    ctx.shadowBlur = 14;
    ctx.font = 'bold 44px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(timeStr, 128, 48);

    if (this.clockTexture) {
      this.clockTexture.needsUpdate = true;
    }
  }

  update(delta) {
    if (this.isDefused || this.isDetonated) return;

    this.timeRemaining -= delta;
    this.updateClockTexture();

    // Rotate holographic diamond and animate light beam
    if (this.waypointDiamond) {
      this.waypointDiamond.rotation.y += delta * 2.0;
      this.waypointDiamond.position.y = 2.2 + Math.sin(Date.now() * 0.004) * 0.15;
    }

    // Pulse ground ring
    if (this.groundRing) {
      const ringScale = 1.0 + Math.sin(Date.now() * 0.005) * 0.2;
      this.groundRing.scale.set(ringScale, ringScale, 1);
    }

    if (this.timeRemaining <= 0) {
      this.timeRemaining = 0;
      this.isDetonated = true;
      audio.playExplosion();
      return;
    }

    const urgency = this.timeRemaining < 20 ? 3 : (this.timeRemaining < 45 ? 2 : 1);
    const beepInterval = this.timeRemaining < 15 ? 0.35 : (this.timeRemaining < 30 ? 0.65 : 1.0);

    this.beepTimer -= delta;
    if (this.beepTimer <= 0) {
      this.beepTimer = beepInterval;
      audio.playBombBeep(urgency);

      this.bombLight.intensity = 4.5;
      setTimeout(() => {
        if (this.bombLight) this.bombLight.intensity = 2.0;
      }, 70);
    }
  }

  getDistanceTo(pos) {
    return this.position.distanceTo(pos);
  }

  destroy() {
    this.scene.remove(this.root);
  }
}
