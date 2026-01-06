# Dice Roller

A realistic 3D dice roller with custom physics simulation, built entirely in a single HTML file.

![Dice Roller](https://img.shields.io/badge/Three.js-0.160.0-black) ![No Build](https://img.shields.io/badge/build-none-green)

## Demo

Click anywhere or press spacebar to roll. Select 1-5 dice using the buttons at the bottom.

## How It Was Made

### Rendering with Three.js

The 3D scene uses Three.js loaded via ES modules from CDN—no bundler required. The dice are created with `RoundedBoxGeometry` for smooth edges, and each face uses a dynamically generated canvas texture for the pip patterns.

The scene includes:
- Directional lighting with soft shadows (PCF shadow mapping)
- A felt-textured table surface generated procedurally with canvas
- Fog and vignette effects for atmosphere
- ACES filmic tone mapping for realistic color

### Custom Physics Engine

Rather than using a physics library, I wrote a custom simulation tailored for dice:

**Gravity & Collision**
- Simple Euler integration for position/velocity
- Ground plane collision with configurable restitution (bounciness)
- Wall boundaries to keep dice in view

**Quaternion Rotation**
- Rotations use quaternions to avoid gimbal lock
- Angular velocity applied via axis-angle conversion each frame

**Dice-to-Dice Collisions**
- Broad phase: sphere-sphere distance check for early rejection
- Narrow phase: OBB (Oriented Bounding Box) intersection testing
- Corner penetration detection against each die's local coordinate system
- Impulse-based collision response affecting both linear and angular velocity

**Settling Detection**
- Tracks velocity, angular velocity, and "flatness" (how aligned a face is with up)
- Applies stabilizing torque to tip dice off edges/corners naturally
- Frame counter ensures dice are truly at rest before snapping to final orientation
- Final snap aligns the nearest face perfectly with the ground

### UI Design

The interface uses a casino-inspired aesthetic:
- Cormorant Garamond serif font for the result display
- Gold accent colors on a dark green felt background
- CSS-only felt texture using SVG noise filter
- Smooth transitions for result reveal

## Technical Highlights

- **Zero dependencies** to install—just open the HTML file
- **~1000 lines** of self-contained code
- **60 FPS** with 2 physics substeps per frame for stability
- **Proper OBB collision** instead of simplified sphere/AABB approximations

## Running Locally

```bash
# Option 1: Open directly
open index.html

# Option 2: Local server (avoids CORS issues in some browsers)
npx serve .
```

## License

MIT
