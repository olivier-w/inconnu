import { D6, D6_VERTICES } from './constants.js';

/**
 * RigidBody class for physics simulation
 * Handles position, rotation, velocity, and force application
 */
export class RigidBody {
  constructor(options = {}) {
    // Position (center of mass)
    this.position = {
      x: options.x ?? 0,
      y: options.y ?? 1,
      z: options.z ?? 0
    };

    // Quaternion for rotation (w, x, y, z)
    this.quaternion = {
      w: options.qw ?? 1,
      x: options.qx ?? 0,
      y: options.qy ?? 0,
      z: options.qz ?? 0
    };

    // Linear velocity
    this.velocity = {
      x: options.vx ?? 0,
      y: options.vy ?? 0,
      z: options.vz ?? 0
    };

    // Angular velocity (rad/s)
    this.angularVelocity = {
      x: options.wx ?? 0,
      y: options.wy ?? 0,
      z: options.wz ?? 0
    };

    // Mass properties
    this.mass = options.mass ?? D6.MASS;
    this.inverseMass = 1 / this.mass;

    // Inertia tensor (using scalar for uniform cube)
    this.inertia = options.inertia ?? D6.INERTIA;
    this.inverseInertia = 1 / this.inertia;

    // Force/torque accumulators (reset each step)
    this.force = { x: 0, y: 0, z: 0 };
    this.torque = { x: 0, y: 0, z: 0 };

    // Local space vertices for collision
    this.localVertices = options.vertices ?? D6_VERTICES;

    // Settling state
    this.settleTimer = 0;
    this.isSettled = false;

    // Collision dimensions
    this.collisionRadius = options.collisionRadius ?? D6.COLLISION_RADIUS;
    this.halfSize = options.halfSize ?? D6.HALF_SIZE;
  }

  /**
   * Apply a force at the center of mass
   */
  applyForce(fx, fy, fz) {
    this.force.x += fx;
    this.force.y += fy;
    this.force.z += fz;
  }

  /**
   * Apply a torque
   */
  applyTorque(tx, ty, tz) {
    this.torque.x += tx;
    this.torque.y += ty;
    this.torque.z += tz;
  }

  /**
   * Apply an impulse at a point in world space
   * This directly changes velocity (not accumulated like forces)
   * @param {Object} impulse - { x, y, z } impulse vector
   * @param {Object} point - { x, y, z } world space contact point
   */
  applyImpulseAtPoint(impulse, point) {
    // Linear velocity change: Δv = J / m
    this.velocity.x += impulse.x * this.inverseMass;
    this.velocity.y += impulse.y * this.inverseMass;
    this.velocity.z += impulse.z * this.inverseMass;

    // Lever arm from center of mass to contact point
    const r = {
      x: point.x - this.position.x,
      y: point.y - this.position.y,
      z: point.z - this.position.z
    };

    // Angular velocity change: Δω = I⁻¹ × (r × J)
    // Cross product: r × J
    const rCrossJ = {
      x: r.y * impulse.z - r.z * impulse.y,
      y: r.z * impulse.x - r.x * impulse.z,
      z: r.x * impulse.y - r.y * impulse.x
    };

    // For uniform inertia, just multiply by inverse inertia
    this.angularVelocity.x += rCrossJ.x * this.inverseInertia;
    this.angularVelocity.y += rCrossJ.y * this.inverseInertia;
    this.angularVelocity.z += rCrossJ.z * this.inverseInertia;
  }

  /**
   * Get velocity at a specific world point
   * v_point = v_cm + ω × r
   */
  getVelocityAtPoint(point) {
    const r = {
      x: point.x - this.position.x,
      y: point.y - this.position.y,
      z: point.z - this.position.z
    };

    // ω × r (cross product)
    const omegaCrossR = {
      x: this.angularVelocity.y * r.z - this.angularVelocity.z * r.y,
      y: this.angularVelocity.z * r.x - this.angularVelocity.x * r.z,
      z: this.angularVelocity.x * r.y - this.angularVelocity.y * r.x
    };

    return {
      x: this.velocity.x + omegaCrossR.x,
      y: this.velocity.y + omegaCrossR.y,
      z: this.velocity.z + omegaCrossR.z
    };
  }

  /**
   * Transform a local space point to world space
   * Uses quaternion rotation + translation
   */
  localToWorld(localPoint) {
    // Quaternion rotation: q * v * q⁻¹
    const q = this.quaternion;
    const v = localPoint;

    // First compute q * v (treating v as quaternion with w=0)
    const qv = {
      w: -(q.x * v.x + q.y * v.y + q.z * v.z),
      x: q.w * v.x + q.y * v.z - q.z * v.y,
      y: q.w * v.y + q.z * v.x - q.x * v.z,
      z: q.w * v.z + q.x * v.y - q.y * v.x
    };

    // Then compute (q * v) * q⁻¹ = (q * v) * conjugate(q)
    // conjugate(q) = (w, -x, -y, -z)
    const rotated = {
      x: qv.w * (-q.x) + qv.x * q.w + qv.y * (-q.z) - qv.z * (-q.y),
      y: qv.w * (-q.y) + qv.y * q.w + qv.z * (-q.x) - qv.x * (-q.z),
      z: qv.w * (-q.z) + qv.z * q.w + qv.x * (-q.y) - qv.y * (-q.x)
    };

    // Add position offset
    return {
      x: rotated.x + this.position.x,
      y: rotated.y + this.position.y,
      z: rotated.z + this.position.z
    };
  }

  /**
   * Transform a world space point to local space
   * Inverse of localToWorld
   */
  worldToLocal(worldPoint) {
    // Translate to body origin
    const translated = {
      x: worldPoint.x - this.position.x,
      y: worldPoint.y - this.position.y,
      z: worldPoint.z - this.position.z
    };

    // Rotate by inverse quaternion (conjugate for unit quaternion)
    const q = this.quaternion;
    const v = translated;

    // Conjugate: q* = (w, -x, -y, -z)
    // Compute q* * v * q
    const qConj = { w: q.w, x: -q.x, y: -q.y, z: -q.z };

    // First: qConj * v
    const qv = {
      w: -(qConj.x * v.x + qConj.y * v.y + qConj.z * v.z),
      x: qConj.w * v.x + qConj.y * v.z - qConj.z * v.y,
      y: qConj.w * v.y + qConj.z * v.x - qConj.x * v.z,
      z: qConj.w * v.z + qConj.x * v.y - qConj.y * v.x
    };

    // Then: (qConj * v) * q
    return {
      x: qv.w * (-q.x) + qv.x * q.w + qv.y * (-q.z) - qv.z * (-q.y),
      y: qv.w * (-q.y) + qv.y * q.w + qv.z * (-q.x) - qv.x * (-q.z),
      z: qv.w * (-q.z) + qv.z * q.w + qv.x * (-q.y) - qv.y * (-q.x)
    };
  }

  /**
   * Rotate a direction vector from local to world space (no translation)
   */
  localToWorldDirection(localDir) {
    const q = this.quaternion;
    const v = localDir;

    // q * v * q⁻¹
    const qv = {
      w: -(q.x * v.x + q.y * v.y + q.z * v.z),
      x: q.w * v.x + q.y * v.z - q.z * v.y,
      y: q.w * v.y + q.z * v.x - q.x * v.z,
      z: q.w * v.z + q.x * v.y - q.y * v.x
    };

    return {
      x: qv.w * (-q.x) + qv.x * q.w + qv.y * (-q.z) - qv.z * (-q.y),
      y: qv.w * (-q.y) + qv.y * q.w + qv.z * (-q.x) - qv.x * (-q.z),
      z: qv.w * (-q.z) + qv.z * q.w + qv.x * (-q.y) - qv.y * (-q.x)
    };
  }

  /**
   * Get all vertices in world space
   */
  getWorldVertices() {
    return this.localVertices.map(v => this.localToWorld(v));
  }

  /**
   * Clear force and torque accumulators
   */
  clearForces() {
    this.force.x = 0;
    this.force.y = 0;
    this.force.z = 0;
    this.torque.x = 0;
    this.torque.y = 0;
    this.torque.z = 0;
  }

  /**
   * Get the speed (magnitude of velocity)
   */
  getSpeed() {
    return Math.sqrt(
      this.velocity.x * this.velocity.x +
      this.velocity.y * this.velocity.y +
      this.velocity.z * this.velocity.z
    );
  }

  /**
   * Get the angular speed (magnitude of angular velocity)
   */
  getAngularSpeed() {
    return Math.sqrt(
      this.angularVelocity.x * this.angularVelocity.x +
      this.angularVelocity.y * this.angularVelocity.y +
      this.angularVelocity.z * this.angularVelocity.z
    );
  }

  /**
   * Normalize the quaternion (prevents drift)
   */
  normalizeQuaternion() {
    const q = this.quaternion;
    const len = Math.sqrt(q.w * q.w + q.x * q.x + q.y * q.y + q.z * q.z);
    if (len > 0.0001) {
      const invLen = 1 / len;
      q.w *= invLen;
      q.x *= invLen;
      q.y *= invLen;
      q.z *= invLen;
    }
  }

  /**
   * Set quaternion from axis-angle
   */
  setFromAxisAngle(axis, angle) {
    const halfAngle = angle / 2;
    const s = Math.sin(halfAngle);
    this.quaternion.w = Math.cos(halfAngle);
    this.quaternion.x = axis.x * s;
    this.quaternion.y = axis.y * s;
    this.quaternion.z = axis.z * s;
  }

  /**
   * Copy state to a Three.js object
   */
  copyToThreeObject(obj) {
    obj.position.set(this.position.x, this.position.y, this.position.z);
    obj.quaternion.set(
      this.quaternion.x,
      this.quaternion.y,
      this.quaternion.z,
      this.quaternion.w
    );
  }
}
