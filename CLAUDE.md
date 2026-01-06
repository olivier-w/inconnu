# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A 3D dice roller web application using Three.js for rendering and custom physics simulation. The entire application is contained in a single `index.html` file with no build tools or dependencies to install.

## Running the Application

Open `index.html` directly in a browser, or serve it locally:
```bash
npx serve .
```

## Architecture

The application is a single HTML file with inline CSS and JavaScript modules. Key components:

- **PhysicsDie** - Custom physics simulation for dice including gravity, collision detection, ground contact, and settling behavior. Uses quaternions for rotation and applies stabilizing torque to tip dice flat.

- **DiceCollisionSystem** - Handles dice-to-dice collisions using OBB (Oriented Bounding Box) detection with broad-phase sphere checks and narrow-phase corner penetration tests.

- **DiceApp** - Main application class managing Three.js scene, camera, lighting, dice meshes, UI events, and the animation loop. Runs physics with 2 substeps per frame for stability.

## Physics Configuration

Constants in the `PHYSICS` object control dice behavior (gravity, damping, bounce, settling thresholds). The settling system uses frame counting and flatness detection to determine when dice have stopped.

## Three.js Setup

Uses ES modules via import map from unpkg CDN (Three.js 0.160.0). RoundedBoxGeometry creates the dice shape. Each die face uses a canvas texture with pip patterns.
