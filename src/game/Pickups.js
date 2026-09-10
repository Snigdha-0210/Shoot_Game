import * as THREE from 'three';
import { audio } from '../engine/Audio.js';

export class PickupManager {
  constructor(scene) {
    this.scene = scene;
    this.pickups = [];

    // Shared Geometries & Materials
    this.boxGeo = new THREE.BoxGeometry(0.4, 0.25, 0.3);
    this.plateGeo = new THREE.BoxGeometry(0.35, 0.45, 0.15);

    this.ammoMat = new THREE.MeshStandardMaterial({
      color: 0x0088ff,
      emissive: 0x0044aa,
      emissiveIntensity: 0.8,
      roughness: 0.3,
      metalness: 0.8
    });

    this.armorMat = new THREE.MeshStandardMaterial({
      color: 0x00ff88,
      emissive: 0x009944,
      emissiveIntensity: 0.8,
      roughness: 0.3,
      metalness: 0.7
    });

    this.glowRingGeo = new THREE.RingGeometry(0.25, 0.35, 16);
    this.glowRingMat = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.6
    });
  }

  // Spawn loot drop at world position
  spawnDrop(position, type = null) {
    if (!type) {
      // 60% chance ammo, 40% chance armor
      type = Math.random() < 0.6 ? 'ammo' : 'armor';
    }

    const group = new THREE.Group();
    group.position.copy(position);
    group.position.y += 0.5;

    let mesh;
    if (type === 'ammo') {
      mesh = new THREE.Mesh(this.boxGeo, this.ammoMat.clone());
      mesh.castShadow = true;

      // Small top stripe
      const stripeGeo = new THREE.BoxGeometry(0.42, 0.05, 0.1);
      const stripeMat = new THREE.MeshBasicMaterial({ color: 0x88ddff });
      const stripe = new THREE.Mesh(stripeGeo, stripeMat);
      mesh.add(stripe);
    } else {
      mesh = new THREE.Mesh(this.plateGeo, this.armorMat.clone());
      mesh.castShadow = true;

      // Medical cross
      const crossV = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.24, 0.16), new THREE.MeshBasicMaterial({ color: 0xffffff }));
      const crossH = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.08, 0.16), new THREE.MeshBasicMaterial({ color: 0xffffff }));
      mesh.add(crossV);
      mesh.add(crossH);
    }
    group.add(mesh);

    // Glowing ground aura ring
    const ringMat = this.glowRingMat.clone();
    ringMat.color.setHex(type === 'ammo' ? 0x00aaff : 0x00ff88);
    const ring = new THREE.Mesh(this.glowRingGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = -0.35;
    group.add(ring);

    // Dynamic light
    const light = new THREE.PointLight(type === 'ammo' ? 0x00aaff : 0x00ff88, 1.2, 3.5);
    light.position.set(0, 0.2, 0);
    group.add(light);

    this.scene.add(group);

    this.pickups.push({
      group,
      mesh,
      ring,
      light,
      type,
      spawnY: position.y + 0.45,
      time: Math.random() * 10,
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 1.5,
        2.5,
        (Math.random() - 0.5) * 1.5
      )
    });
  }

  update(delta, player, ui, particleSystem) {
    const playerFeet = (player && player.yawNode) ? player.yawNode.position : new THREE.Vector3();

    for (let i = this.pickups.length - 1; i >= 0; i--) {
      const p = this.pickups[i];
      p.time += delta * 3;

      // Initial pop and fall physics
      if (p.velocity.y !== 0 || p.group.position.y > p.spawnY) {
        p.group.position.x += p.velocity.x * delta;
        p.group.position.z += p.velocity.z * delta;
        p.group.position.y += p.velocity.y * delta;
        p.velocity.y -= 9.8 * delta;

        if (p.group.position.y <= p.spawnY) {
          p.group.position.y = p.spawnY;
          p.velocity.set(0, 0, 0);
        }
      } else {
        // Floating hover animation
        p.mesh.position.y = Math.sin(p.time * 2) * 0.08;
        p.mesh.rotation.y += delta * 1.8;
        p.ring.rotation.z += delta * 1.2;
      }

      // Check distance to player
      const dist = p.group.position.distanceTo(playerFeet);

      // Magnetic attraction when close
      if (dist < 2.5 && dist > 0.6) {
        const dir = new THREE.Vector3().subVectors(playerFeet, p.group.position).normalize();
        p.group.position.addScaledVector(dir, delta * 5.0);
      }

      // Collect pickup
      if (dist <= 0.8) {
        try { audio.playPickupSound(p.type); } catch (e) {}

        if (p.type === 'ammo') {
          player.addAmmo(15, 12);
          if (ui) ui.showNotification('+15 TACTICAL AMMO', 'info');
        } else {
          player.addArmor(25);
          if (ui) ui.showNotification('+25 TACTICAL ARMOR', 'success');
        }

        // Spawn sparkle particle burst if available
        if (particleSystem && typeof particleSystem.spawnSparks === 'function') {
          particleSystem.spawnSparks(p.group.position, new THREE.Vector3(0, 1, 0), p.type === 'ammo' ? 0x00ffff : 0x00ff88, 10);
        }

        // Cleanup
        this.scene.remove(p.group);
        this.pickups.splice(i, 1);
      }
    }
  }

  clear() {
    this.pickups.forEach(p => {
      this.scene.remove(p.group);
    });
    this.pickups = [];
  }
}
