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
    ├── physics.js          # PhysicsDie class, PHYSICS constants
    ├── collision.js        # DiceCollisionSystem
    ├── textures.js         # Canvas texture generation (pips, numbers, coin)
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

- **PhysicsDie** (`js/physics.js`) - Generalized physics simulation accepting any dice config. Handles gravity, collision, ground contact, and settling. Uses quaternions for rotation.

- **DiceCollisionSystem** (`js/collision.js`) - Handles dice-to-dice collisions using bounding sphere broad-phase and vertex penetration narrow-phase.

- **DiceApp** (`js/app.js`) - Main application managing Three.js scene, dice creation, UI events, and animation loop with 2 physics substeps per frame.

- **DICE_REGISTRY** (`js/dice-types/index.js`) - Central registry mapping dice type names to their configs and mesh creation functions.

### Physics Configuration

Constants in `PHYSICS` object (`js/physics.js`) control behavior:
- Gravity, restitution, damping values
- Settling thresholds (speed, angular speed, flatness)
- Bounce and friction parameters

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
