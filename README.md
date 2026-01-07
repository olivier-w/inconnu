# Dice Roller

A 3D dice roller with custom physics simulation supporting multiple dice types.

![Dice Roller](https://img.shields.io/badge/Three.js-0.160.0-black) ![No Build](https://img.shields.io/badge/build-none-green)

## Features

- **6 dice types**: d4, d6, d8, d12, d20, and coin flip
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
├── app.js              # Main application
├── physics.js          # Physics simulation
├── collision.js        # Dice-to-dice collisions
├── textures.js         # Canvas texture generation
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
- Built-in polyhedra geometries for d4, d8, d12, d20
- RoundedBoxGeometry for d6 with canvas pip textures
- CylinderGeometry for coin with Heads/Tails textures

The scene includes:
- Directional lighting with soft shadows
- Procedurally generated felt table texture
- Fog and vignette effects
- ACES filmic tone mapping

### Custom Physics Engine

Physics simulation tailored for dice of any shape:

**Generalized Collision**
- Each dice type defines its own vertices and face normals
- Bounding sphere broad-phase for performance
- Vertex penetration narrow-phase for accuracy

**Quaternion Rotation**
- Rotations use quaternions to avoid gimbal lock
- Natural gravity torque tips dice off edges

**Settling Detection**
- Tracks velocity, angular velocity, and face alignment
- d4 reads the bottom face (like real d4 dice)
- Final snap aligns nearest face with ground

### UI Design

Casino-inspired aesthetic:
- Cormorant Garamond serif font for results
- Gold accents on dark green felt
- CSS-only felt texture using SVG noise
- Dice type selector with pill buttons

## Technical Highlights

- **Zero dependencies** to install
- **~800 lines** across modular files
- **60 FPS** with 2 physics substeps per frame
- **Extensible** - add new dice types easily

## License

MIT
