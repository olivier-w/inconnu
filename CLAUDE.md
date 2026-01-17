# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A 3D dice roller web application using Three.js for rendering and custom physics simulation. Supports multiple dice types (d4, d6, d8, d12, d20, coin) with a modular ES module architecture.

## Running the Application

Serve locally (required for ES modules):
```bash
npx serve .
```

## File Structure

```
inconnu/
├── index.html              # Minimal HTML shell with UI elements
├── css/
│   └── styles.css          # All styling including dice type selector
└── js/
    ├── app.js              # DiceApp class, scene setup, animation loop
    ├── textures.js         # Canvas texture generation (pips, numbers, coin)
    ├── physics/            # Custom rigid body physics engine
    │   ├── physics-engine.js   # PhysicsEngine class, fixed timestep loop
    │   ├── rigid-body.js       # RigidBody class with quaternion rotation
    │   ├── collision.js        # Ground, wall, and dice-to-dice collisions
    │   ├── integrator.js       # Semi-implicit Euler integration
    │   └── constants.js        # PHYSICS and D6 constants
    └── dice-types/
        ├── index.js        # DICE_REGISTRY, exports all dice configs
        ├── d4.js           # Tetrahedron config
        ├── d6.js           # Cube with pip textures
        ├── d8.js           # Octahedron config
        ├── d12.js          # Dodecahedron config
        ├── d20.js          # Icosahedron config
        └── coin.js         # Cylinder (Heads/Tails)
```

## Architecture

### Dice Configuration System

Each dice type is defined in `js/dice-types/` with a config object containing:
- `vertices` - Corner positions for collision detection (lazy-initialized)
- `faceNormals` - Face normals for settling/value detection (lazy-initialized)
- `faceValues` - Mapping from face index to displayed value
- `size`, `collisionRadius`, `restHeight` - Physical dimensions
- `readBottom` - Whether to read bottom face (true for d4)

### Key Components

- **PhysicsEngine** (`js/physics/physics-engine.js`) - Fixed timestep simulation at 240Hz using accumulator pattern. Manages all rigid bodies and coordinates the simulation phases.

- **RigidBody** (`js/physics/rigid-body.js`) - Represents a physical object with position, quaternion rotation, velocity, angular velocity. Handles impulse application and coordinate transforms (localToWorld, worldToLocal).

- **Collision System** (`js/physics/collision.js`) - Three collision types:
  - Ground collision: vertex-based with impulse response and friction
  - Wall collision: simple elastic bounce with spin
  - Dice-to-dice: sphere-based collision for stability

- **Integrator** (`js/physics/integrator.js`) - Semi-implicit Euler integration with velocity-squared drag for air resistance.

- **DiceApp** (`js/app.js`) - Main application managing Three.js scene, dice creation, UI events, and animation loop.

- **DICE_REGISTRY** (`js/dice-types/index.js`) - Central registry mapping dice type names to their configs and mesh creation functions.

### Physics Configuration

Constants in `PHYSICS` object (`js/physics/constants.js`) control behavior:
- `GRAVITY` - Earth gravity (9.81 m/s²)
- `FIXED_TIMESTEP` - 1/240 seconds for stable simulation
- `RESTITUTION` - Ground bounce coefficient (0.35)
- `DICE_RESTITUTION` - Dice-to-dice bounce (0.3)
- `LINEAR_DRAG`, `ANGULAR_DRAG` - Air resistance
- `SETTLING_TIME` - Time dice must be still to settle (0.3s)
- `VELOCITY_THRESHOLD`, `ANGULAR_THRESHOLD` - Settling thresholds

### Adding a New Dice Type

1. Create `js/dice-types/dX.js` with config and `createDXMesh()` function
2. Export from `js/dice-types/index.js`
3. Add button to `index.html` with `data-type="dX"`

## Three.js Setup

Uses ES modules via import map from unpkg CDN (Three.js 0.160.0). Built-in geometries used:
- d4: TetrahedronGeometry
- d6: RoundedBoxGeometry (with pip textures)
- d8: OctahedronGeometry
- d12: DodecahedronGeometry
- d20: IcosahedronGeometry
- coin: CylinderGeometry
