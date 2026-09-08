import * as THREE from 'three';
import { audio } from '../engine/Audio.js';

export class GrenadeManager {
  constructor(scene) {
    this.scene = scene;
    this.grenades = [];
    this.smokeClouds = [];

    // Shared Smoke particle texture generator
    this.smokeCanvas = document.createElement('canvas');
    this.smokeCanvas.width = 64;
    this.smokeCanvas.height = 64;
    const ctx = this.smokeCanvas.getContext('2d');
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(210, 220, 230, 0.85)');
    grad.addColorStop(0.5, 'rgba(180, 190, 200, 0.45)');
    grad.addColorStop(1, 'rgba(150, 160, 170, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);

    this.smokeTex = new THREE.CanvasTexture(this.smokeCanvas);
  }

  // Throw tactical smoke grenade from player position
  throwSmoke(origin, direction) {
    const group = new THREE.Group();
    group.position.copy(origin);

    // Canister Mesh
    const canGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.16, 12);
    const canMat = new THREE.MeshStandardMaterial({
      color: 0x446644,
      metalness: 0.6,
      roughness: 0.4
    });
    const can = new THREE.Mesh(canGeo, canMat);
    can.castShadow = true;
    group.add(can);

    // Top cap & ring
    const capGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.04, 8);
    const capMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.9 });
    const cap = new THREE.Mesh(capGeo, capMat);
    cap.position.y = 0.09;
    group.add(cap);

    // Green stripe
    const stripeGeo = new THREE.CylinderGeometry(0.041, 0.041, 0.04, 12);
    const stripeMat = new THREE.MeshBasicMaterial({ color: 0x00ff88 });
    const stripe = new THREE.Mesh(stripeGeo, stripeMat);
    group.add(stripe);

    this.scene.add(group);

    const velocity = direction.clone().normalize().multiplyScalar(16);
    velocity.y += 4.5; // Slight upward loft

    this.grenades.push({
      group,
      velocity,
      rotationSpeed: new THREE.Vector3(
        (Math.random() - 0.5) * 15,
        (Math.random() - 0.5) * 15,
        (Math.random() - 0.5) * 15
      ),
      fuse: 1.2,
      isDetonated: false
    });
  }

  // Create expanding volumetric smoke cloud
  createSmokeCloud(position) {
    audio.playSmokeDetonate();

    const cloudGroup = new THREE.Group();
    cloudGroup.position.copy(position);
    cloudGroup.position.y = Math.max(0.6, cloudGroup.position.y);

    const puffs = [];
    const puffCount = 18;

    for (let i = 0; i < puffCount; i++) {
      const mat = new THREE.SpriteMaterial({
        map: this.smokeTex,
        transparent: true,
        opacity: 0.0,
        depthWrite: false
      });
      const sprite = new THREE.Sprite(mat);
      const angle = (i / puffCount) * Math.PI * 2;
      const dist = Math.random() * 1.5;
      sprite.position.set(
        Math.cos(angle) * dist,
        Math.random() * 1.2 + 0.3,
        Math.sin(angle) * dist
      );
      const scale = 2.5 + Math.random() * 1.5;
      sprite.scale.set(scale, scale, 1);
      cloudGroup.add(sprite);

      puffs.push({
        sprite,
        mat,
        baseScale: scale,
        drift: new THREE.Vector3(
          (Math.random() - 0.5) * 0.4,
          Math.random() * 0.3,
          (Math.random() - 0.5) * 0.4
        )
      });
    }

    this.scene.add(cloudGroup);

    this.smokeClouds.push({
      group: cloudGroup,
      puffs,
      position: cloudGroup.position.clone(),
      radius: 6.5,
      lifetime: 14.0, // 14 seconds duration
      maxLifetime: 14.0
    });
  }

  update(delta, enemies) {
    // 1. Update In-Flight Grenades
    for (let i = this.grenades.length - 1; i >= 0; i--) {
      const g = this.grenades[i];
      g.fuse -= delta;

      g.velocity.y -= 14.0 * delta; // Gravity
      g.group.position.addScaledVector(g.velocity, delta);

      g.group.rotation.x += g.rotationSpeed.x * delta;
      g.group.rotation.y += g.rotationSpeed.y * delta;
      g.group.rotation.z += g.rotationSpeed.z * delta;

      // Ground bounce
      if (g.group.position.y <= 0.12) {
        g.group.position.y = 0.12;
        g.velocity.y *= -0.4;
        g.velocity.x *= 0.65;
        g.velocity.z *= 0.65;
        g.rotationSpeed.multiplyScalar(0.7);
      }

      if (g.fuse <= 0 && !g.isDetonated) {
        g.isDetonated = true;
        this.createSmokeCloud(g.group.position);
        this.scene.remove(g.group);
        this.grenades.splice(i, 1);
      }
    }

    // 2. Update Expanding Smoke Clouds
    for (let i = this.smokeClouds.length - 1; i >= 0; i--) {
      const cloud = this.smokeClouds[i];
      cloud.lifetime -= delta;

      const progress = 1.0 - (cloud.lifetime / cloud.maxLifetime);

      // Expand and fade
      cloud.puffs.forEach(p => {
        p.sprite.position.addScaledVector(p.drift, delta * 0.4);
        const growth = 1.0 + progress * 1.8;
        p.sprite.scale.set(p.baseScale * growth, p.baseScale * growth, 1);

        if (progress < 0.15) {
          // Fade in rapidly
          p.mat.opacity = (progress / 0.15) * 0.75;
        } else if (progress > 0.7) {
          // Fade out gradually
          p.mat.opacity = ((1.0 - progress) / 0.3) * 0.75;
        } else {
          p.mat.opacity = 0.75;
        }
      });

      // Blind enemies within smoke radius
      if (enemies && enemies.length > 0) {
        enemies.forEach(enemy => {
          if (!enemy.isAlive) return;
          const dist = enemy.group.position.distanceTo(cloud.position);
          if (dist <= cloud.radius) {
            enemy.isBlindedBySmoke = true;
            enemy.smokeBlindTimer = 1.5;
          }
        });
      }

      if (cloud.lifetime <= 0) {
        this.scene.remove(cloud.group);
        this.smokeClouds.splice(i, 1);
      }
    }
  }

  // Check if a line of sight ray between origin and target intersects any active smoke cloud
  isLineOfSightBlocked(origin, target) {
    const ray = new THREE.Ray(origin, new THREE.Vector3().subVectors(target, origin).normalize());
    const totalDist = origin.distanceTo(target);

    for (const cloud of this.smokeClouds) {
      const sphere = new THREE.Sphere(cloud.position, cloud.radius * 0.85);
      const hit = ray.intersectSphere(sphere, new THREE.Vector3());
      if (hit && origin.distanceTo(hit) < totalDist) {
        return true;
      }
    }
    return false;
  }

  clear() {
    this.grenades.forEach(g => this.scene.remove(g.group));
    this.smokeClouds.forEach(c => this.scene.remove(c.group));
    this.grenades = [];
    this.smokeClouds = [];
  }
}
