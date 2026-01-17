import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RigidBody } from './physics/rigid-body.js';
import { D6, D6_FACE_NORMALS } from './physics/constants.js';
import { createPipTexture } from './textures.js';

/**
 * Create a D6 rigid body
 */
export function createD6Body(x = 0, y = 4, z = 0) {
  return new RigidBody({
    x, y, z,
    mass: D6.MASS,
    inertia: D6.INERTIA
  });
}

/**
 * Create a D6 Three.js mesh with pip textures
 */
export function createD6Mesh() {
  const size = D6.SIZE;

  // Create materials for each face (1-6 pips)
  // Material order for BoxGeometry: +X, -X, +Y, -Y, +Z, -Z
  // Face values: 3, 4, 2, 5, 1, 6 (opposite faces sum to 7)
  const faceValues = [3, 4, 2, 5, 1, 6];

  const materials = faceValues.map(value => {
    return new THREE.MeshStandardMaterial({
      map: createPipTexture(value),
      roughness: 0.15,
      metalness: 0.0
    });
  });

  // Create rounded box geometry
  const geometry = new RoundedBoxGeometry(size, size, size, 4, 0.08);

  const mesh = new THREE.Mesh(geometry, materials);
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  return mesh;
}

/**
 * Get the face value showing on top of the die
 * Returns 1-6 based on which face normal points most upward
 */
export function getD6Value(body) {
  const upVector = { x: 0, y: 1, z: 0 };

  let maxDot = -Infinity;
  let topFaceIndex = 0;

  // Check each face normal rotated by the body's quaternion
  for (let i = 0; i < D6_FACE_NORMALS.length; i++) {
    const localNormal = D6_FACE_NORMALS[i];

    // Rotate normal by quaternion
    const worldNormal = rotateByQuaternion(localNormal, body.quaternion);

    // Dot product with up vector (just the y component)
    const dot = worldNormal.y;

    if (dot > maxDot) {
      maxDot = dot;
      topFaceIndex = i;
    }
  }

  // Face index + 1 = face value (1-6)
  return topFaceIndex + 1;
}

/**
 * Rotate a vector by a quaternion
 */
function rotateByQuaternion(v, q) {
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
 * Apply a random roll impulse to a body
 * Gives initial velocity and spin for natural rolling
 */
export function applyRollImpulse(body) {
  // Random initial velocity
  body.velocity.x = (Math.random() - 0.5) * 4;
  body.velocity.y = -2; // Slight downward motion
  body.velocity.z = (Math.random() - 0.5) * 4;

  // Random spin (angular velocity)
  const spinStrength = 12;
  body.angularVelocity.x = (Math.random() - 0.5) * spinStrength;
  body.angularVelocity.y = (Math.random() - 0.5) * spinStrength;
  body.angularVelocity.z = (Math.random() - 0.5) * spinStrength;

  // Random initial orientation
  const axis = normalizeVector({
    x: Math.random() - 0.5,
    y: Math.random() - 0.5,
    z: Math.random() - 0.5
  });
  const angle = Math.random() * Math.PI * 2;
  body.setFromAxisAngle(axis, angle);
}

/**
 * Normalize a vector
 */
function normalizeVector(v) {
  const len = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
  if (len < 0.0001) return { x: 0, y: 1, z: 0 };
  return {
    x: v.x / len,
    y: v.y / len,
    z: v.z / len
  };
}
