import * as THREE from 'three';

export class GameRenderer {
  constructor(containerId = 'game-container') {
    this.container = document.getElementById(containerId);
    
    // Scene setup with tactical midnight sky & linear fog for crystal clear visibility
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0c1524);
    this.scene.fog = new THREE.Fog(0x0c1524, 35, 140);

    // Camera
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );

    // WebGL Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.35;

    this.container.appendChild(this.renderer.domElement);

    // Dynamic Lights & Skydome
    this.setupGlobalLighting();
    this.setupSkyDome();

    // Particle Systems
    this.particles = [];
    this.rainParticles = null;

    // Resize listener
    window.addEventListener('resize', () => this.onWindowResize());
  }

  setupGlobalLighting() {
    // Rich, crisp ambient light so all textures, buildings, and enemies are clearly visible
    this.ambientLight = new THREE.AmbientLight(0x557799, 1.3);
    this.scene.add(this.ambientLight);

    // Directional moonlight casting crisp shadows
    this.moonLight = new THREE.DirectionalLight(0x99ccff, 2.0);
    this.moonLight.position.set(25, 55, 20);
    this.moonLight.castShadow = true;
    this.moonLight.shadow.mapSize.width = 2048;
    this.moonLight.shadow.mapSize.height = 2048;
    this.moonLight.shadow.camera.near = 5;
    this.moonLight.shadow.camera.far = 160;
    this.moonLight.shadow.camera.left = -45;
    this.moonLight.shadow.camera.right = 45;
    this.moonLight.shadow.camera.top = 45;
    this.moonLight.shadow.camera.bottom = -45;
    this.scene.add(this.moonLight);

    // Hemisphere sky/ground fill light
    this.hemiLight = new THREE.HemisphereLight(0x224466, 0x111822, 0.8);
    this.scene.add(this.hemiLight);
  }

  // Create atmospheric night sky dome with stars
  setupSkyDome() {
    const skyGeom = new THREE.SphereGeometry(300, 32, 16);
    const skyMat = new THREE.MeshBasicMaterial({
      color: 0x08101e,
      side: THREE.BackSide
    });
    this.skyMesh = new THREE.Mesh(skyGeom, skyMat);
    this.scene.add(this.skyMesh);

    // Stars
    const starCount = 600;
    const starGeom = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 280;
      starPos[i] = r * Math.sin(phi) * Math.cos(theta);
      starPos[i + 1] = Math.abs(r * Math.cos(phi)) + 20; // Upper hemisphere
      starPos[i + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    starGeom.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 1.2, transparent: true, opacity: 0.8 });
    this.stars = new THREE.Points(starGeom, starMat);
    this.scene.add(this.stars);
  }

  // Setup atmospheric rain
  setupRain(enabled = true) {
    if (!enabled) {
      if (this.rainParticles) {
        this.scene.remove(this.rainParticles);
        this.rainParticles = null;
      }
      return;
    }

    if (this.rainParticles) return;

    const rainCount = 1200;
    const geom = new THREE.BufferGeometry();
    const positions = new Float32Array(rainCount * 3);

    for (let i = 0; i < rainCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 70;
      positions[i + 1] = Math.random() * 25;
      positions[i + 2] = (Math.random() - 0.5) * 70;
    }

    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color: 0x99ccff,
      size: 0.12,
      transparent: true,
      opacity: 0.45
    });

    this.rainParticles = new THREE.Points(geom, mat);
    this.scene.add(this.rainParticles);
  }

  // Spawn spark particle burst at impact point
  spawnSparks(position, normal, color = 0xffaa33, count = 12) {
    for (let i = 0; i < count; i++) {
      const geom = new THREE.SphereGeometry(0.04, 4, 4);
      const mat = new THREE.MeshBasicMaterial({ color: color });
      const mesh = new THREE.Mesh(geom, mat);
      mesh.position.copy(position);

      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 6 + normal.x * 3,
        Math.random() * 4 + 1 + normal.y * 2,
        (Math.random() - 0.5) * 6 + normal.z * 3
      );

      this.scene.add(mesh);
      this.particles.push({
        mesh,
        velocity: vel,
        life: 0.35 + Math.random() * 0.2,
        maxLife: 0.5,
        gravity: 14
      });
    }
  }

  // Spawn blood impact puff
  spawnBloodPuff(position, count = 15) {
    for (let i = 0; i < count; i++) {
      const geom = new THREE.SphereGeometry(0.05 + Math.random() * 0.05, 4, 4);
      const mat = new THREE.MeshBasicMaterial({ color: 0xaa0000, transparent: true, opacity: 0.9 });
      const mesh = new THREE.Mesh(geom, mat);
      mesh.position.copy(position);

      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 4,
        Math.random() * 3 + 0.5,
        (Math.random() - 0.5) * 4
      );

      this.scene.add(mesh);
      this.particles.push({
        mesh,
        velocity: vel,
        life: 0.4 + Math.random() * 0.2,
        maxLife: 0.6,
        gravity: 9.8
      });
    }
  }

  // Update particles and rain
  update(delta, playerPos) {
    if (this.rainParticles && playerPos) {
      const posArr = this.rainParticles.geometry.attributes.position.array;
      for (let i = 1; i < posArr.length; i += 3) {
        posArr[i] -= delta * 24;
        if (posArr[i] < 0) {
          posArr[i] = 25;
          posArr[i - 1] = playerPos.x + (Math.random() - 0.5) * 60;
          posArr[i + 1] = playerPos.z + (Math.random() - 0.5) * 60;
        }
      }
      this.rainParticles.geometry.attributes.position.needsUpdate = true;
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= delta;
      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        p.mesh.material.dispose();
        this.particles.splice(i, 1);
        continue;
      }

      p.velocity.y -= p.gravity * delta;
      p.mesh.position.addScaledVector(p.velocity, delta);

      const scale = p.life / p.maxLife;
      p.mesh.scale.set(scale, scale, scale);
    }
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }
}
