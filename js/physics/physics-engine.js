import { PHYSICS } from './constants.js';
import { RigidBody } from './rigid-body.js';
import { integrate } from './integrator.js';
import { resolveGroundCollision, resolveWallCollisions } from './collision.js';

/**
 * Fixed timestep physics engine
 * Uses accumulator pattern to decouple physics from render rate
 */
export class PhysicsEngine {
  constructor() {
    this.bodies = [];
    this.accumulator = 0;
    this.lastTime = null;
  }

  /**
   * Add a rigid body to the simulation
   */
  addBody(body) {
    this.bodies.push(body);
    return body;
  }

  /**
   * Remove a rigid body from the simulation
   */
  removeBody(body) {
    const index = this.bodies.indexOf(body);
    if (index !== -1) {
      this.bodies.splice(index, 1);
    }
  }

  /**
   * Clear all bodies
   */
  clear() {
    this.bodies = [];
  }

  /**
   * Update physics simulation
   * @param {number} deltaTime - Time since last update in seconds
   */
  update(deltaTime) {
    // Clamp delta time to prevent spiral of death
    const dt = Math.min(deltaTime, PHYSICS.MAX_ACCUMULATOR);

    // Add to accumulator
    this.accumulator += dt;

    // Fixed timestep simulation
    const fixedDt = PHYSICS.FIXED_TIMESTEP;

    while (this.accumulator >= fixedDt) {
      this.step(fixedDt);
      this.accumulator -= fixedDt;
    }
  }

  /**
   * Single physics step at fixed timestep
   */
  step(dt) {
    for (const body of this.bodies) {
      if (body.isSettled) continue;

      // Integration (applies gravity, drag, updates position/rotation)
      integrate(body, dt);

      // Ground collision
      resolveGroundCollision(body);

      // Wall collision
      resolveWallCollisions(body);

      // Check settling
      this.checkSettling(body, dt);
    }
  }

  /**
   * Check if body has settled (been still for SETTLING_TIME)
   */
  checkSettling(body, dt) {
    const speed = body.getSpeed();
    const angSpeed = body.getAngularSpeed();

    // Check if below velocity thresholds
    if (speed < PHYSICS.VELOCITY_THRESHOLD && angSpeed < PHYSICS.ANGULAR_THRESHOLD) {
      body.settleTimer += dt;

      if (body.settleTimer >= PHYSICS.SETTLING_TIME) {
        // Stop all motion
        body.velocity.x = 0;
        body.velocity.y = 0;
        body.velocity.z = 0;
        body.angularVelocity.x = 0;
        body.angularVelocity.y = 0;
        body.angularVelocity.z = 0;

        // Snap to ground if close
        this.snapToGround(body);

        body.isSettled = true;
      }
    } else {
      // Reset timer if moving
      body.settleTimer = 0;
    }
  }

  /**
   * Snap body to rest on ground with proper alignment
   */
  snapToGround(body) {
    // Find lowest vertex and adjust height
    const vertices = body.getWorldVertices();
    let minY = Infinity;

    for (const v of vertices) {
      if (v.y < minY) minY = v.y;
    }

    // Adjust position so lowest point is on ground
    const groundY = PHYSICS.BOUNDS.GROUND_Y;
    if (minY < groundY + 0.01) {
      body.position.y += (groundY - minY);
    }
  }

  /**
   * Check if all bodies are settled
   */
  allSettled() {
    return this.bodies.every(b => b.isSettled);
  }

  /**
   * Reset a body for a new roll
   */
  resetBody(body, x, y, z) {
    body.position.x = x;
    body.position.y = y;
    body.position.z = z;

    body.velocity.x = 0;
    body.velocity.y = 0;
    body.velocity.z = 0;

    body.angularVelocity.x = 0;
    body.angularVelocity.y = 0;
    body.angularVelocity.z = 0;

    body.quaternion.w = 1;
    body.quaternion.x = 0;
    body.quaternion.y = 0;
    body.quaternion.z = 0;

    body.settleTimer = 0;
    body.isSettled = false;

    body.clearForces();
  }
}

// Re-export for convenience
export { RigidBody } from './rigid-body.js';
export { PHYSICS, D6 } from './constants.js';
