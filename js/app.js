import * as THREE from 'three';
import { PhysicsEngine } from './physics/physics-engine.js';
import { D6 } from './physics/constants.js';
import { createD6Body, createD6Mesh, getD6Value, applyRollImpulse } from './d6-dice.js';

export class DiceApp {
  constructor() {
    this.container = document.getElementById('canvas-container');
    this.physicsEngine = new PhysicsEngine();

    this.dice = [];      // Three.js meshes
    this.bodies = [];    // Physics bodies
    this.diceCount = 1;

    this.isRolling = false;
    this.lastTime = performance.now();

    this.init();
    this.createTable();
    this.createDice();
    this.setupEvents();
    this.animate();

    // Hide loading
    setTimeout(() => {
      document.querySelector('.loading').classList.add('hidden');
    }, 500);
  }

  init() {
    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a2f23);
    this.scene.fog = new THREE.Fog(0x1a2f23, 8, 20);

    // Camera
    this.camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    this.camera.position.set(0, 8, 8);
    this.camera.lookAt(0, 0, 0);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    this.container.appendChild(this.renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xfff8e7, 0.4);
    this.scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xfff8e7, 1.5);
    mainLight.position.set(5, 10, 5);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 2048;
    mainLight.shadow.mapSize.height = 2048;
    mainLight.shadow.camera.near = 1;
    mainLight.shadow.camera.far = 30;
    mainLight.shadow.camera.left = -10;
    mainLight.shadow.camera.right = 10;
    mainLight.shadow.camera.top = 10;
    mainLight.shadow.camera.bottom = -10;
    mainLight.shadow.bias = -0.001;
    this.scene.add(mainLight);

    const fillLight = new THREE.DirectionalLight(0xc9a962, 0.3);
    fillLight.position.set(-5, 5, -5);
    this.scene.add(fillLight);

    const rimLight = new THREE.PointLight(0xfff8e7, 0.5);
    rimLight.position.set(0, 5, -8);
    this.scene.add(rimLight);
  }

  createTable() {
    // Table surface
    const tableGeometry = new THREE.PlaneGeometry(20, 20);
    const tableMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a2f23,
      roughness: 0.9,
      metalness: 0.0,
    });

    const table = new THREE.Mesh(tableGeometry, tableMaterial);
    table.rotation.x = -Math.PI / 2;
    table.receiveShadow = true;
    this.scene.add(table);

    // Subtle felt pattern
    const patternCanvas = document.createElement('canvas');
    patternCanvas.width = 512;
    patternCanvas.height = 512;
    const ctx = patternCanvas.getContext('2d');
    ctx.fillStyle = '#1a2f23';
    ctx.fillRect(0, 0, 512, 512);

    for (let i = 0; i < 5000; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const brightness = Math.random() * 20 + 26;
      ctx.fillStyle = `rgb(${brightness}, ${brightness + 15}, ${brightness + 5})`;
      ctx.fillRect(x, y, 1, 1);
    }

    const feltTexture = new THREE.CanvasTexture(patternCanvas);
    feltTexture.wrapS = THREE.RepeatWrapping;
    feltTexture.wrapT = THREE.RepeatWrapping;
    feltTexture.repeat.set(4, 4);
    tableMaterial.map = feltTexture;
    tableMaterial.needsUpdate = true;
  }

  createDice() {
    // Clear existing dice
    for (const die of this.dice) {
      this.scene.remove(die);
    }
    this.dice = [];
    this.bodies = [];
    this.physicsEngine.clear();

    // Create new dice
    for (let i = 0; i < this.diceCount; i++) {
      // Position dice in a row
      const spacing = 1.5;
      const totalWidth = (this.diceCount - 1) * spacing;
      const x = -totalWidth / 2 + i * spacing;

      // Create mesh
      const mesh = createD6Mesh();
      mesh.position.set(x, D6.REST_HEIGHT, 0);
      this.scene.add(mesh);
      this.dice.push(mesh);

      // Create physics body
      const body = createD6Body(x, D6.REST_HEIGHT, 0);
      body.isSettled = true; // Start settled
      this.bodies.push(body);
      this.physicsEngine.addBody(body);
    }
  }

  roll() {
    if (this.isRolling) return;

    this.isRolling = true;
    document.querySelector('.result').classList.remove('visible');
    document.querySelector('.hint').classList.add('hidden');
    document.body.classList.add('rolling');

    // Reset and launch each die
    for (let i = 0; i < this.bodies.length; i++) {
      const body = this.bodies[i];

      // Calculate starting position
      const spacing = 1.8;
      const totalWidth = (this.diceCount - 1) * spacing;
      const x = -totalWidth / 2 + i * spacing + (Math.random() - 0.5) * 0.3;
      const dropHeight = 4 + Math.random() * 1;
      const z = (Math.random() - 0.5) * 1.5;

      // Reset body state
      this.physicsEngine.resetBody(body, x, dropHeight, z);

      // Apply random impulse
      applyRollImpulse(body);
    }
  }

  checkSettled() {
    if (!this.isRolling) return;

    if (this.physicsEngine.allSettled()) {
      this.isRolling = false;
      document.body.classList.remove('rolling');

      // Get results
      const results = this.bodies.map(b => getD6Value(b));
      const total = results.reduce((sum, val) => sum + val, 0);

      // Display result
      const resultValue = document.querySelector('.result-value');
      const resultLabel = document.querySelector('.result-label');

      resultValue.textContent = total;
      resultLabel.textContent = `${this.diceCount}d6`;

      document.querySelector('.result').classList.add('visible');
    }
  }

  setupEvents() {
    // Click to roll
    this.container.addEventListener('click', () => this.roll());

    // Spacebar to roll
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        this.roll();
      }
    });

    // Dice count buttons
    document.querySelectorAll('.dice-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();

        document.querySelectorAll('.dice-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        this.diceCount = parseInt(btn.dataset.count);
        this.createDice();

        document.querySelector('.result').classList.remove('visible');
        document.querySelector('.hint').classList.remove('hidden');
      });
    });

    // Resize
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    // Calculate delta time
    const now = performance.now();
    const deltaTime = (now - this.lastTime) / 1000; // Convert to seconds
    this.lastTime = now;

    // Update physics (fixed timestep handled internally)
    this.physicsEngine.update(deltaTime);

    // Sync meshes with physics bodies
    for (let i = 0; i < this.bodies.length; i++) {
      this.bodies[i].copyToThreeObject(this.dice[i]);
    }

    this.checkSettled();
    this.renderer.render(this.scene, this.camera);
  }
}

// Start app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new DiceApp());
} else {
  new DiceApp();
}
