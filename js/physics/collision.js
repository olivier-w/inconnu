import { PHYSICS, D6 } from './constants.js';

/**
 * Ground collision detection and response using vertex-based approach
 * Detects all 8 cube vertices penetrating the ground plane
 */

/**
 * Detect and resolve ground collisions for a rigid body
 * Returns true if any collision occurred
 */
export function resolveGroundCollision(body) {
  const groundY = PHYSICS.BOUNDS.GROUND_Y;
  const worldVertices = body.getWorldVertices();

  let collisionOccurred = false;
  let deepestPenetration = 0;

  // Check each vertex for ground penetration
  for (const vertex of worldVertices) {
    const penetration = groundY - vertex.y;

    if (penetration > 0) {
      collisionOccurred = true;
      deepestPenetration = Math.max(deepestPenetration, penetration);

      // Get velocity at this contact point
      const pointVelocity = body.getVelocityAtPoint(vertex);

      // Only respond if moving into the ground
      if (pointVelocity.y < 0) {
        // Calculate impulse using the formula:
        // j = -(1 + e) * vₙ / (1/m + (I⁻¹ × (r × n)) · (r × n))
        const impulse = calculateCollisionImpulse(body, vertex, pointVelocity);

        // Apply impulse at contact point
        body.applyImpulseAtPoint(impulse, vertex);
      }
    }
  }

  // Position correction (Baumgarte stabilization)
  if (deepestPenetration > PHYSICS.PENETRATION_SLOP) {
    const correction = (deepestPenetration - PHYSICS.PENETRATION_SLOP) * PHYSICS.POSITION_CORRECTION;
    body.position.y += correction;
  }

  // Apply contact damping when on ground
  if (collisionOccurred) {
    applyContactDamping(body);
  }

  return collisionOccurred;
}

/**
 * Calculate collision impulse for a vertex hitting the ground
 * Uses the impulse formula for rigid body collision
 */
function calculateCollisionImpulse(body, contactPoint, pointVelocity) {
  // Ground normal (pointing up)
  const n = { x: 0, y: 1, z: 0 };

  // Lever arm from center of mass to contact point
  const r = {
    x: contactPoint.x - body.position.x,
    y: contactPoint.y - body.position.y,
    z: contactPoint.z - body.position.z
  };

  // Normal velocity (into ground is negative)
  const vn = pointVelocity.y;

  // r × n (cross product)
  const rCrossN = {
    x: r.y * n.z - r.z * n.y,  // r.y * 0 - r.z * 1 = -r.z
    y: r.z * n.x - r.x * n.z,  // r.z * 0 - r.x * 0 = 0
    z: r.x * n.y - r.y * n.x   // r.x * 1 - r.y * 0 = r.x
  };
  // Simplified: rCrossN = { x: -r.z, y: 0, z: r.x }

  // I⁻¹ × (r × n) - for uniform inertia, just multiply
  const iInvRCrossN = {
    x: rCrossN.x * body.inverseInertia,
    y: rCrossN.y * body.inverseInertia,
    z: rCrossN.z * body.inverseInertia
  };

  // (I⁻¹ × (r × n)) × r (cross product)
  const iInvRCrossN_CrossR = {
    x: iInvRCrossN.y * r.z - iInvRCrossN.z * r.y,
    y: iInvRCrossN.z * r.x - iInvRCrossN.x * r.z,
    z: iInvRCrossN.x * r.y - iInvRCrossN.y * r.x
  };

  // Dot product with normal: ((I⁻¹ × (r × n)) × r) · n
  const angularTerm = iInvRCrossN_CrossR.y; // Only y component matters for ground normal

  // Impulse denominator: 1/m + angular term
  const denominator = body.inverseMass + angularTerm;

  // Impulse magnitude: j = -(1 + e) * vₙ / denominator
  const j = -(1 + PHYSICS.RESTITUTION) * vn / denominator;

  // Normal impulse vector
  const normalImpulse = { x: 0, y: j, z: 0 };

  // Friction impulse (Coulomb model)
  const frictionImpulse = calculateFrictionImpulse(body, contactPoint, pointVelocity, j);

  return {
    x: normalImpulse.x + frictionImpulse.x,
    y: normalImpulse.y + frictionImpulse.y,
    z: normalImpulse.z + frictionImpulse.z
  };
}

/**
 * Calculate friction impulse using Coulomb friction model
 */
function calculateFrictionImpulse(body, contactPoint, pointVelocity, normalImpulseMag) {
  // Tangent velocity (velocity parallel to ground)
  const vt = {
    x: pointVelocity.x,
    y: 0,
    z: pointVelocity.z
  };

  const vtMag = Math.sqrt(vt.x * vt.x + vt.z * vt.z);

  if (vtMag < 0.001) {
    return { x: 0, y: 0, z: 0 };
  }

  // Tangent direction (opposite to sliding)
  const tangent = {
    x: -vt.x / vtMag,
    y: 0,
    z: -vt.z / vtMag
  };

  // Maximum friction impulse (Coulomb cone)
  const maxFriction = Math.abs(normalImpulseMag) * PHYSICS.KINETIC_FRICTION;

  // Friction impulse should stop sliding but not reverse direction
  // Using a simplified model: apply friction proportional to tangent velocity
  const frictionMag = Math.min(maxFriction, vtMag * body.mass * 0.5);

  return {
    x: tangent.x * frictionMag,
    y: 0,
    z: tangent.z * frictionMag
  };
}

/**
 * Apply contact damping to reduce energy on ground contact
 */
function applyContactDamping(body) {
  const damping = PHYSICS.CONTACT_DAMPING;

  // Damp velocities slightly when in contact
  body.velocity.x *= damping;
  body.velocity.z *= damping;
  body.angularVelocity.x *= damping;
  body.angularVelocity.y *= damping;
  body.angularVelocity.z *= damping;
}

/**
 * Resolve wall collisions (simple elastic bounce)
 */
export function resolveWallCollisions(body) {
  const bounds = PHYSICS.BOUNDS;
  const halfSize = D6.HALF_SIZE;
  const restitution = PHYSICS.WALL_RESTITUTION;

  // Left wall
  if (body.position.x - halfSize < bounds.MIN_X) {
    body.position.x = bounds.MIN_X + halfSize;
    if (body.velocity.x < 0) {
      body.velocity.x = -body.velocity.x * restitution;
      // Add some spin from wall contact
      body.angularVelocity.z += body.velocity.y * 0.5;
    }
  }

  // Right wall
  if (body.position.x + halfSize > bounds.MAX_X) {
    body.position.x = bounds.MAX_X - halfSize;
    if (body.velocity.x > 0) {
      body.velocity.x = -body.velocity.x * restitution;
      body.angularVelocity.z -= body.velocity.y * 0.5;
    }
  }

  // Back wall
  if (body.position.z - halfSize < bounds.MIN_Z) {
    body.position.z = bounds.MIN_Z + halfSize;
    if (body.velocity.z < 0) {
      body.velocity.z = -body.velocity.z * restitution;
      body.angularVelocity.x -= body.velocity.y * 0.5;
    }
  }

  // Front wall
  if (body.position.z + halfSize > bounds.MAX_Z) {
    body.position.z = bounds.MAX_Z - halfSize;
    if (body.velocity.z > 0) {
      body.velocity.z = -body.velocity.z * restitution;
      body.angularVelocity.x += body.velocity.y * 0.5;
    }
  }
}

/**
 * Resolve collisions between all dice pairs
 * Uses sphere-based collision for simplicity and stability
 */
export function resolveDiceCollisions(bodies) {
  // Check all pairs
  for (let i = 0; i < bodies.length; i++) {
    for (let j = i + 1; j < bodies.length; j++) {
      const bodyA = bodies[i];
      const bodyB = bodies[j];

      // Skip if both are settled
      if (bodyA.isSettled && bodyB.isSettled) continue;

      // Use sphere collision for stability
      resolveSphereCollision(bodyA, bodyB);
    }
  }
}

/**
 * Sphere-based collision between two dice
 * More stable than vertex-based for resting contacts
 */
function resolveSphereCollision(bodyA, bodyB) {
  const dx = bodyB.position.x - bodyA.position.x;
  const dy = bodyB.position.y - bodyA.position.y;
  const dz = bodyB.position.z - bodyA.position.z;
  const distSq = dx * dx + dy * dy + dz * dz;

  // Use slightly smaller radius for collision (half size * sqrt(2) for face-to-face)
  const radiusA = bodyA.halfSize * 1.3;
  const radiusB = bodyB.halfSize * 1.3;
  const minDist = radiusA + radiusB;

  if (distSq >= minDist * minDist) return;
  if (distSq < 0.0001) return; // Prevent division by zero

  const dist = Math.sqrt(distSq);
  const penetration = minDist - dist;

  // Normal from A to B
  const nx = dx / dist;
  const ny = dy / dist;
  const nz = dz / dist;

  // Relative velocity
  const relVelX = bodyA.velocity.x - bodyB.velocity.x;
  const relVelY = bodyA.velocity.y - bodyB.velocity.y;
  const relVelZ = bodyA.velocity.z - bodyB.velocity.z;
  const relVelN = relVelX * nx + relVelY * ny + relVelZ * nz;

  // Calculate relative speed
  const relSpeed = Math.sqrt(relVelX * relVelX + relVelY * relVelY + relVelZ * relVelZ);

  // Wake up settled bodies only if hit hard enough
  const wakeThreshold = 0.5;
  if (relSpeed > wakeThreshold) {
    if (bodyA.isSettled) {
      bodyA.isSettled = false;
      bodyA.settleTimer = 0;
    }
    if (bodyB.isSettled) {
      bodyB.isSettled = false;
      bodyB.settleTimer = 0;
    }
  }

  // Only apply impulse if approaching fast enough
  if (relVelN < -PHYSICS.DICE_VELOCITY_THRESHOLD) {
    // Simple impulse response (center of mass only for stability)
    const e = PHYSICS.DICE_RESTITUTION;
    const totalInvMass = bodyA.inverseMass + bodyB.inverseMass;
    const j = -(1 + e) * relVelN / totalInvMass;

    // Apply impulse
    const impulseX = j * nx;
    const impulseY = j * ny;
    const impulseZ = j * nz;

    bodyA.velocity.x += impulseX * bodyA.inverseMass;
    bodyA.velocity.y += impulseY * bodyA.inverseMass;
    bodyA.velocity.z += impulseZ * bodyA.inverseMass;

    bodyB.velocity.x -= impulseX * bodyB.inverseMass;
    bodyB.velocity.y -= impulseY * bodyB.inverseMass;
    bodyB.velocity.z -= impulseZ * bodyB.inverseMass;

    // Add some angular velocity from collision
    const spinFactor = 0.3;
    bodyA.angularVelocity.x += (ny * nz) * j * spinFactor;
    bodyA.angularVelocity.z += (nx * ny) * j * spinFactor;
    bodyB.angularVelocity.x -= (ny * nz) * j * spinFactor;
    bodyB.angularVelocity.z -= (nx * ny) * j * spinFactor;
  }

  // Position correction - push apart gently
  if (penetration > 0.001) {
    const correction = penetration * 0.3; // Gentle correction
    const ratioA = bodyA.inverseMass / (bodyA.inverseMass + bodyB.inverseMass);
    const ratioB = bodyB.inverseMass / (bodyA.inverseMass + bodyB.inverseMass);

    bodyA.position.x -= nx * correction * ratioA;
    bodyA.position.y -= ny * correction * ratioA;
    bodyA.position.z -= nz * correction * ratioA;

    bodyB.position.x += nx * correction * ratioB;
    bodyB.position.y += ny * correction * ratioB;
    bodyB.position.z += nz * correction * ratioB;
  }
}

