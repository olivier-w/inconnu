# Dice Roller

A 3D dice roller with custom physics simulation supporting multiple dice types.

<img width="767" height="710" alt="Screenshot 2026-01-06 154531" src="https://github.com/user-attachments/assets/63048307-9f45-42d7-a4ca-a6cc0261dc5a" />

![Dice Roller](https://img.shields.io/badge/Three.js-0.160.0-black) ![No Build](https://img.shields.io/badge/build-none-green)

## Features

- ~~**6 dice types**: d4, d6, d8, d12, d20, and coin flip~~
- **1-5 dice** at a time
- **Realistic physics** with proper collision detection
- **No build tools** required

## Demo

Click anywhere or press spacebar to roll. Select dice type and count using the buttons at the bottom.

## Running Locally

```bash
npx serve .
```

Then open the displayed URL in your browser.

## How It Was Made

### Modular Architecture

The codebase is organized into ES modules:

```
js/
├── app.js              # Main application, scene setup, animation loop
├── textures.js         # Canvas texture generation
├── physics/            # Custom physics engine
│   ├── physics-engine.js   # Fixed timestep simulation loop
│   ├── rigid-body.js       # RigidBody class with quaternion rotation
│   ├── collision.js        # Ground, wall, and dice-to-dice collisions
│   ├── integrator.js       # Semi-implicit Euler integration
│   └── constants.js        # Physics constants (gravity, restitution, etc.)
└── dice-types/         # Config for each dice type
    ├── d4.js           # Tetrahedron
    ├── d6.js           # Cube with pips
    ├── d8.js           # Octahedron
    ├── d12.js          # Dodecahedron
    ├── d20.js          # Icosahedron
    └── coin.js         # Cylinder
```

### Rendering with Three.js

The 3D scene uses Three.js loaded via ES modules from CDN. Each dice type uses appropriate Three.js geometry:
- ~~Built-in polyhedra geometries for d4, d8, d12, d20~~
- RoundedBoxGeometry for d6 with canvas pip textures
- CylinderGeometry for coin with Heads/Tails textures

The scene includes:
- Directional lighting with soft shadows
- Procedurally generated felt table texture
- Fog and vignette effects
- ACES filmic tone mapping

### Custom Physics Engine

A proper rigid body physics engine in `js/physics/`:

**Fixed Timestep Simulation**
- Runs at 240Hz for stability (accumulator pattern)
- Semi-implicit Euler integration with velocity-squared drag
- Decoupled from render rate

**Collision System**
- Vertex-based ground collision with impulse response
- Wall collisions with bounce and spin
- Dice-to-dice collision using sphere approximation for stability

**Quaternion Rotation**
- All rotations use quaternions to avoid gimbal lock
- Proper angular momentum and torque

**Settling Detection**
- Tracks velocity and angular velocity thresholds
- Timer-based settling (must be still for 0.3s)
- Snaps to ground when settled

### UI Design

Casino-inspired aesthetic:
- Cormorant Garamond serif font for results
- Gold accents on dark green felt
- CSS-only felt texture using SVG noise
- Dice type selector with pill buttons

## Technical Highlights

- **Zero dependencies** to install
- **~1000 lines** across modular files
- **60 FPS** with fixed 240Hz physics timestep
- **Extensible** - add new dice types easily

## License

MIT
