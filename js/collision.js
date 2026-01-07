import * as THREE from 'three';
import { PHYSICS } from './physics.js';

export class DiceCollisionSystem {
  constructor(physicsDice) {
    this.dice = physicsDice;
  }

  // Get all vertices of a die in world space
  getWorldVertices(die) {
    return die.getWorldVertices();
  }

  // Check if a point is inside a die's bounding volume, return penetration info
  // Uses a simplified approach that works for any convex polyhedron
  getPointPenetration(point, die) {
    // Transform point to die's local space
    const localPoint = point.clone()
      .sub(die.position)
      .applyQuaternion(die.quaternion.clone().invert());

    // For non-cube dice, use a simpler sphere-based penetration
    const distFromCenter = localPoint.length();
    const effectiveRadius = die.collisionRadius * 0.8; // Inner radius for collision

    if (distFromCenter > effectiveRadius) {
      return { depth: 0, normal: null };
    }

    // Penetration depth
    const depth = effectiveRadius - distFromCenter;

    // Normal points from die center toward the point
    const normal = point.clone().sub(die.position).normalize();

    return { depth, normal };
  }

  // Check for collision between two dice using bounding spheres + vertex penetration
  checkCollision(dieA, dieB) {
    const verticesA = this.getWorldVertices(dieA);
    const verticesB = this.getWorldVertices(dieB);

    let deepestPenetration = 0;
    let collisionNormal = null;
    let contactPoint = null;

    // Check A's vertices against B
    for (const vertex of verticesA) {
      const penetration = this.getPointPenetration(vertex, dieB);
      if (penetration.depth > deepestPenetration) {
        deepestPenetration = penetration.depth;
        collisionNormal = penetration.normal;
        contactPoint = vertex;
      }
    }

    // Check B's vertices against A
    for (const vertex of verticesB) {
      const penetration = this.getPointPenetration(vertex, dieA);
      if (penetration.depth > deepestPenetration) {
        deepestPenetration = penetration.depth;
        collisionNormal = penetration.normal ? penetration.normal.clone().negate() : null;
        contactPoint = vertex;
      }
    }

    if (deepestPenetration > 0 && collisionNormal) {
      return { dieA, dieB, depth: deepestPenetration, normal: collisionNormal, contactPoint };
    }

    return null;
  }

  // Resolve a collision between two dice
  resolveCollision(collision) {
    const { dieA, dieB, depth, normal, contactPoint } = collision;

    // 1. Separate the dice (positional correction)
    const separation = normal.clone().multiplyScalar(depth * 0.5);
    dieA.position.add(separation);
    dieB.position.sub(separation);

    // 2. Calculate relative velocity at contact point
    const rA = contactPoint.clone().sub(dieA.position);
    const rB = contactPoint.clone().sub(dieB.position);

    const velA = dieA.velocity.clone().add(
      new THREE.Vector3().crossVectors(dieA.angularVelocity, rA)
    );
    const velB = dieB.velocity.clone().add(
      new THREE.Vector3().crossVectors(dieB.angularVelocity, rB)
    );

    const relativeVel = velA.clone().sub(velB);
    const normalVel = relativeVel.dot(normal);

    // Only resolve if objects are moving toward each other
    if (normalVel > 0) return;

    // 3. Calculate impulse magnitude (equal mass dice)
    const restitution = PHYSICS.diceRestitution;
    const impulseMagnitude = -(1 + restitution) * normalVel / 2;

    const impulse = normal.clone().multiplyScalar(impulseMagnitude);

    // 4. Apply impulse to linear velocities
    dieA.velocity.add(impulse);
    dieB.velocity.sub(impulse);

    // 5. Apply impulse to angular velocities
    const angularImpulseA = new THREE.Vector3().crossVectors(rA, impulse);
    const angularImpulseB = new THREE.Vector3().crossVectors(rB, impulse);

    dieA.angularVelocity.add(angularImpulseA.multiplyScalar(0.3));
    dieB.angularVelocity.sub(angularImpulseB.multiplyScalar(0.3));

    // 6. Reset settle counters since collision occurred
    dieA.settled = false;
    dieA.settleCounter = 0;
    dieB.settled = false;
    dieB.settleCounter = 0;
  }

  // Detect and resolve all collisions
  detectAndResolve() {
    if (this.dice.length < 2) return;

    for (let i = 0; i < this.dice.length; i++) {
      for (let j = i + 1; j < this.dice.length; j++) {
        const dieA = this.dice[i];
        const dieB = this.dice[j];

        // Skip if both settled
        if (dieA.settled && dieB.settled) continue;

        // Broad phase: sphere-sphere check
        const dist = dieA.position.distanceTo(dieB.position);
        const minDist = dieA.collisionRadius + dieB.collisionRadius;

        if (dist < minDist) {
          // Narrow phase: vertex collision
          const collision = this.checkCollision(dieA, dieB);
          if (collision) {
            this.resolveCollision(collision);
          }
        }
      }
    }
  }
}
