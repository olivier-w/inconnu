import * as THREE from 'three';

// Physics constants for realistic dice behavior
export const PHYSICS = {
  // Core physics
  gravity: 28,
  restitution: 0.3,
  diceRestitution: 0.35,

  // Damping
  linearDamping: 0.995,
  angularDamping: 0.96,

  // Settling thresholds
  settleSpeedThreshold: 0.1,
  settleAngSpeedThreshold: 0.15,
  settleFlatnessThreshold: 0.99,
  settleFramesRequired: 3,

  // Bounce
  minBounceVelocity: 0.4,
  bounceAngularReduction: 0.6,
  groundFriction: 0.4,
};

export class PhysicsDie {
  constructor(position, config) {
    this.position = new THREE.Vector3(position.x, position.y, position.z);
    this.velocity = new THREE.Vector3();
    this.quaternion = new THREE.Quaternion();
    this.angularVelocity = new THREE.Vector3();
    this.settled = false;
    this.settleCounter = 0;

    // Dice configuration
    this.config = config;
    this.size = config.size || 1;
    this.vertices = config.vertices;
    this.faceNormals = config.faceNormals;
    this.faceValues = config.faceValues;
    this.collisionRadius = config.collisionRadius || 0.866;
    this.readBottom = config.readBottom || false;
  }

  applyImpulse(force, torque) {
    this.velocity.add(force);
    this.angularVelocity.add(torque);
    this.settled = false;
    this.settleCounter = 0;
  }

  // Get how flat the die is (1 = perfectly flat, 0 = on corner)
  getFlatness() {
    const upWorld = new THREE.Vector3(0, 1, 0);
    let maxDot = 0;

    for (const normal of this.faceNormals) {
      const worldNormal = normal.clone().applyQuaternion(this.quaternion);
      const dot = Math.abs(worldNormal.dot(upWorld));
      if (dot > maxDot) maxDot = dot;
    }
    return maxDot;
  }

  // Get world-space vertices for collision detection
  getWorldVertices() {
    return this.vertices.map(v =>
      v.clone().applyQuaternion(this.quaternion).add(this.position)
    );
  }

  // Get detailed ground contact information
  getGroundContactInfo() {
    const groundY = 0;
    const contactThreshold = 0.05;

    let contactCount = 0;
    let lowestY = Infinity;
    let lowestVertex = null;

    for (const vertex of this.vertices) {
      const worldVertex = vertex.clone()
        .applyQuaternion(this.quaternion)
        .add(this.position);

      if (worldVertex.y < lowestY) {
        lowestY = worldVertex.y;
        lowestVertex = worldVertex;
      }

      if (worldVertex.y < groundY + contactThreshold) {
        contactCount++;
      }
    }

    return {
      isOnGround: lowestY <= groundY + 0.01,
      penetration: Math.max(0, groundY - lowestY),
      contactCount,
      lowestVertex,
      isStable: contactCount >= 3
    };
  }

  // Simple damping - let natural physics work
  applyDamping() {
    this.velocity.multiplyScalar(PHYSICS.linearDamping);
    this.angularVelocity.multiplyScalar(PHYSICS.angularDamping);
  }

  // Apply natural torque from gravity on tilted die
  applyGravityTorque(dt, contactInfo) {
    if (!contactInfo.isOnGround || !contactInfo.lowestVertex) return;

    // Vector from contact point to center of mass
    const r = new THREE.Vector3().subVectors(this.position, contactInfo.lowestVertex);

    // Gravity force (mass = 1 for simplicity)
    const gravityForce = new THREE.Vector3(0, -PHYSICS.gravity, 0);

    // Torque = r × F (cross product gives natural tipping torque)
    const torque = new THREE.Vector3().crossVectors(r, gravityForce);

    // Apply torque
    this.angularVelocity.add(torque.multiplyScalar(dt));
  }

  update(dt) {
    if (this.settled) return;

    // Apply gravity
    this.velocity.y -= PHYSICS.gravity * dt;

    // Apply simple damping
    this.applyDamping();

    // Update position
    this.position.add(this.velocity.clone().multiplyScalar(dt));

    // Update rotation using quaternion
    const angVelLength = this.angularVelocity.length();
    if (angVelLength > 0.0001) {
      const axis = this.angularVelocity.clone().normalize();
      const angle = angVelLength * dt;
      const deltaQ = new THREE.Quaternion().setFromAxisAngle(axis, angle);
      this.quaternion.premultiply(deltaQ);
      this.quaternion.normalize();
    }

    // Ground collision (re-check after movement)
    const newContactInfo = this.getGroundContactInfo();

    if (newContactInfo.penetration > 0) {
      // Push up to ground level
      this.position.y += newContactInfo.penetration;

      // Apply bounce if moving down fast enough
      if (this.velocity.y < -PHYSICS.minBounceVelocity) {
        this.velocity.y = -this.velocity.y * PHYSICS.restitution;

        // Apply ground friction to horizontal velocity
        const frictionFactor = 1 - PHYSICS.groundFriction * 0.3;
        this.velocity.x *= frictionFactor;
        this.velocity.z *= frictionFactor;

        // Reduce angular velocity on bounce
        this.angularVelocity.multiplyScalar(PHYSICS.bounceAngularReduction);

        // Reset settle counter on significant bounce
        this.settleCounter = 0;
      } else {
        // Too slow to bounce - stop vertical motion
        this.velocity.y = Math.max(0, this.velocity.y);
      }

      // Apply natural gravity torque when on ground
      this.applyGravityTorque(dt, newContactInfo);
    }

    // Wall collisions
    const bounds = 4;
    if (Math.abs(this.position.x) > bounds) {
      this.position.x = Math.sign(this.position.x) * bounds;
      this.velocity.x = -this.velocity.x * PHYSICS.restitution;
      this.settleCounter = 0;
    }
    if (Math.abs(this.position.z) > bounds) {
      this.position.z = Math.sign(this.position.z) * bounds;
      this.velocity.z = -this.velocity.z * PHYSICS.restitution;
      this.settleCounter = 0;
    }

    // Check if settled
    const speed = this.velocity.length();
    const angSpeed = this.angularVelocity.length();
    const flatness = this.getFlatness();

    if (speed < PHYSICS.settleSpeedThreshold &&
        angSpeed < PHYSICS.settleAngSpeedThreshold &&
        flatness > PHYSICS.settleFlatnessThreshold &&
        newContactInfo.isOnGround) {
      this.settleCounter++;
      if (this.settleCounter > PHYSICS.settleFramesRequired) {
        this.settled = true;
        this.snapToFace();
      }
    } else {
      // Gradual decrease instead of immediate reset
      this.settleCounter = Math.max(0, this.settleCounter - 1);
    }
  }

  snapToFace() {
    // Find which face is up and snap perfectly
    const upWorld = new THREE.Vector3(0, 1, 0);

    let bestNormal = null;
    let maxDot = -1;
    for (const normal of this.faceNormals) {
      const worldNormal = normal.clone().applyQuaternion(this.quaternion);
      const dot = worldNormal.dot(upWorld);
      if (dot > maxDot) {
        maxDot = dot;
        bestNormal = normal;
      }
    }

    // Create quaternion that aligns bestNormal with up
    if (bestNormal) {
      const currentUp = bestNormal.clone().applyQuaternion(this.quaternion);
      const rotationAxis = new THREE.Vector3().crossVectors(currentUp, upWorld);
      if (rotationAxis.length() > 0.001) {
        rotationAxis.normalize();
        const angle = Math.acos(Math.min(1, currentUp.dot(upWorld)));
        const correction = new THREE.Quaternion().setFromAxisAngle(rotationAxis, angle);
        this.quaternion.premultiply(correction);
        this.quaternion.normalize();
      }
    }

    // Set position to rest height (based on geometry)
    this.position.y = this.config.restHeight || this.size / 2;
    this.velocity.set(0, 0, 0);
    this.angularVelocity.set(0, 0, 0);
  }

  getValue() {
    // Find face normal pointing most upward (or downward for d4)
    const direction = this.readBottom ? -1 : 1;
    let bestDot = -Infinity;
    let result = this.faceValues[0];

    for (let i = 0; i < this.faceNormals.length; i++) {
      const worldNormal = this.faceNormals[i].clone()
        .applyQuaternion(this.quaternion);
      const dot = worldNormal.y * direction;
      if (dot > bestDot) {
        bestDot = dot;
        result = this.faceValues[i];
      }
    }
    return result;
  }
}
