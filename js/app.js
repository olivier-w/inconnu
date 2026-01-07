import * as THREE from 'three';
import { PhysicsDie } from './physics.js';
import { DiceCollisionSystem } from './collision.js';
import { DICE_REGISTRY, DICE_TYPES, getDiceConfig, createDiceMesh } from './dice-types/index.js';

export class DiceApp {
  constructor() {
    this.container = document.getElementById('canvas-container');
    this.dice = [];
    this.physicsDice = [];
    this.diceCount = 1;
    this.diceType = 'd6'; // Default to d6
    this.isRolling = false;
    this.collisionSystem = null;

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
    this.physicsDice = [];

    // Get config for current dice type
    const config = getDiceConfig(this.diceType);

    // Create new dice
    for (let i = 0; i < this.diceCount; i++) {
      const die = createDiceMesh(this.diceType);

      // Position dice in a row
      const spacing = 1.5;
      const totalWidth = (this.diceCount - 1) * spacing;
      const x = -totalWidth / 2 + i * spacing;

      die.position.set(x, config.restHeight, 0);
      this.scene.add(die);
      this.dice.push(die);

      const physicsDie = new PhysicsDie({ x, y: config.restHeight, z: 0 }, config);
      physicsDie.settled = true;
      this.physicsDice.push(physicsDie);
    }

    // Initialize collision system
    this.collisionSystem = new DiceCollisionSystem(this.physicsDice);
  }

  roll() {
    if (this.isRolling) return;

    this.isRolling = true;
    document.querySelector('.result').classList.remove('visible');
    document.querySelector('.hint').classList.add('hidden');
    document.body.classList.add('rolling');

    const config = getDiceConfig(this.diceType);

    for (let i = 0; i < this.dice.length; i++) {
      const physicsDie = this.physicsDice[i];

      // Reset position above the table
      const spacing = 1.8;
      const totalWidth = (this.diceCount - 1) * spacing;
      const x = -totalWidth / 2 + i * spacing + (Math.random() - 0.5) * 0.3;

      // Drop height based on dice size
      const dropHeight = 4 + Math.random() * 1;
      physicsDie.position.set(x, dropHeight, (Math.random() - 0.5) * 1.5);

      // Random initial rotation
      const randomAxis = new THREE.Vector3(
        Math.random() - 0.5,
        Math.random() - 0.5,
        Math.random() - 0.5
      ).normalize();
      physicsDie.quaternion.setFromAxisAngle(randomAxis, Math.random() * Math.PI * 2);

      // Apply impulse
      const force = new THREE.Vector3(
        (Math.random() - 0.5) * 5,
        -3,
        (Math.random() - 0.5) * 5
      );

      const torque = new THREE.Vector3(
        (Math.random() - 0.5) * 18,
        (Math.random() - 0.5) * 12,
        (Math.random() - 0.5) * 18
      );

      physicsDie.applyImpulse(force, torque);
    }
  }

  checkSettled() {
    if (!this.isRolling) return;

    const allSettled = this.physicsDice.every(d => d.settled);

    if (allSettled) {
      this.isRolling = false;
      document.body.classList.remove('rolling');

      // Get results
      const results = this.physicsDice.map(d => d.getValue());

      // Display result
      const resultValue = document.querySelector('.result-value');
      const resultLabel = document.querySelector('.result-label');

      if (this.diceType === 'coin') {
        // For coin, show the result (Heads/Tails)
        if (this.diceCount === 1) {
          resultValue.textContent = results[0];
        } else {
          // Multiple coins: show count of heads
          const heads = results.filter(r => r === 'Heads').length;
          resultValue.textContent = `${heads}H / ${this.diceCount - heads}T`;
        }
        resultLabel.textContent = this.diceCount === 1 ? 'Coin Flip' : `${this.diceCount} Coins`;
      } else {
        // For dice, show total
        const total = results.reduce((sum, val) => sum + val, 0);
        resultValue.textContent = total;
        resultLabel.textContent = `${this.diceCount}${this.diceType}`;
      }

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

    // Dice type buttons
    document.querySelectorAll('.type-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();

        document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        this.diceType = btn.dataset.type;
        this.createDice();

        document.querySelector('.result').classList.remove('visible');
        document.querySelector('.hint').classList.remove('hidden');
      });
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

    const dt = 1 / 60;

    // Run multiple physics substeps for stability
    const substeps = 2;
    const subDt = dt / substeps;

    for (let step = 0; step < substeps; step++) {
      // Update individual dice physics
      for (let i = 0; i < this.physicsDice.length; i++) {
        this.physicsDice[i].update(subDt);
      }

      // Resolve dice-to-dice collisions
      if (this.collisionSystem && this.physicsDice.length > 1) {
        this.collisionSystem.detectAndResolve();
      }
    }

    // Sync meshes with physics
    for (let i = 0; i < this.physicsDice.length; i++) {
      this.dice[i].position.copy(this.physicsDice[i].position);
      this.dice[i].quaternion.copy(this.physicsDice[i].quaternion);
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
