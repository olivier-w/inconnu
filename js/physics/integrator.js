import { PHYSICS } from './constants.js';

/**
 * Semi-implicit Euler integration
 * Updates velocity first, then position using new velocity
 * More stable than explicit Euler for physics simulations
 */
export function integrate(body, dt) {
  // Apply gravity
  body.applyForce(0, -PHYSICS.GRAVITY * body.mass, 0);

  // Apply velocity-squared drag (air resistance)
  applyDrag(body);

  // Semi-implicit Euler: update velocity first
  // v' = v + (F/m) * dt
  body.velocity.x += (body.force.x * body.inverseMass) * dt;
  body.velocity.y += (body.force.y * body.inverseMass) * dt;
  body.velocity.z += (body.force.z * body.inverseMass) * dt;

  // ω' = ω + (τ/I) * dt
  body.angularVelocity.x += (body.torque.x * body.inverseInertia) * dt;
  body.angularVelocity.y += (body.torque.y * body.inverseInertia) * dt;
  body.angularVelocity.z += (body.torque.z * body.inverseInertia) * dt;

  // Then update position using new velocity
  // x' = x + v' * dt
  body.position.x += body.velocity.x * dt;
  body.position.y += body.velocity.y * dt;
  body.position.z += body.velocity.z * dt;

  // Update quaternion using angular velocity
  // q' = q + 0.5 * ω_quat * q * dt
  // where ω_quat = (0, ωx, ωy, ωz)
  integrateQuaternion(body, dt);

  // Normalize quaternion to prevent drift
  body.normalizeQuaternion();

  // Clear forces for next step
  body.clearForces();
}

/**
 * Integrate quaternion using angular velocity
 * Uses the formula: q' = q + 0.5 * ω_quat * q * dt
 */
function integrateQuaternion(body, dt) {
  const q = body.quaternion;
  const w = body.angularVelocity;

  // Quaternion derivative: dq/dt = 0.5 * ω_quat * q
  // ω_quat = (0, ωx, ωy, ωz)
  // Quaternion multiplication: ω_quat * q
  const dq = {
    w: -0.5 * (w.x * q.x + w.y * q.y + w.z * q.z),
    x:  0.5 * (w.x * q.w + w.y * q.z - w.z * q.y),
    y:  0.5 * (w.y * q.w + w.z * q.x - w.x * q.z),
    z:  0.5 * (w.z * q.w + w.x * q.y - w.y * q.x)
  };

  // q' = q + dq * dt
  q.w += dq.w * dt;
  q.x += dq.x * dt;
  q.y += dq.y * dt;
  q.z += dq.z * dt;
}

/**
 * Apply velocity-squared drag (more realistic than linear damping)
 * F_drag = -c * |v|² * v_normalized = -c * |v| * v
 */
function applyDrag(body) {
  // Linear drag
  const speed = body.getSpeed();
  if (speed > 0.001) {
    const dragMag = PHYSICS.LINEAR_DRAG * speed * speed;
    const factor = -dragMag / speed; // -dragMag * (v / |v|) = factor * v
    body.applyForce(
      body.velocity.x * factor,
      body.velocity.y * factor,
      body.velocity.z * factor
    );
  }

  // Angular drag
  const angSpeed = body.getAngularSpeed();
  if (angSpeed > 0.001) {
    const angDragMag = PHYSICS.ANGULAR_DRAG * angSpeed * angSpeed;
    const angFactor = -angDragMag / angSpeed;
    body.applyTorque(
      body.angularVelocity.x * angFactor,
      body.angularVelocity.y * angFactor,
      body.angularVelocity.z * angFactor
    );
  }
}
