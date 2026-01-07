import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { createPipTexture } from '../textures.js';

const halfSize = 0.5;

// Lazy initialization
let _vertices = null;
let _faceNormals = null;

function getD6Vertices() {
  return [
    new THREE.Vector3(-halfSize, -halfSize, -halfSize),
    new THREE.Vector3(-halfSize, -halfSize, halfSize),
    new THREE.Vector3(-halfSize, halfSize, -halfSize),
    new THREE.Vector3(-halfSize, halfSize, halfSize),
    new THREE.Vector3(halfSize, -halfSize, -halfSize),
    new THREE.Vector3(halfSize, -halfSize, halfSize),
    new THREE.Vector3(halfSize, halfSize, -halfSize),
    new THREE.Vector3(halfSize, halfSize, halfSize),
  ];
}

function getD6FaceNormals() {
  return [
    new THREE.Vector3(1, 0, 0),   // Right - value 3
    new THREE.Vector3(-1, 0, 0),  // Left - value 4
    new THREE.Vector3(0, 1, 0),   // Top - value 1
    new THREE.Vector3(0, -1, 0),  // Bottom - value 6
    new THREE.Vector3(0, 0, 1),   // Front - value 2
    new THREE.Vector3(0, 0, -1),  // Back - value 5
  ];
}

// D6 cube configuration
export const D6_CONFIG = {
  type: 'd6',
  name: 'd6',
  faces: 6,
  size: 1,
  collisionRadius: 0.866, // sqrt(3)/2 for unit cube
  restHeight: 0.5,
  readBottom: false,

  get vertices() {
    if (!_vertices) _vertices = getD6Vertices();
    return _vertices;
  },
  get faceNormals() {
    if (!_faceNormals) _faceNormals = getD6FaceNormals();
    return _faceNormals;
  },
  // Face values corresponding to face normals
  // Standard d6: opposite faces sum to 7
  faceValues: [3, 4, 1, 6, 2, 5],
};

// Create d6 mesh with pip textures
export function createD6Mesh() {
  const geometry = new RoundedBoxGeometry(1, 1, 1, 4, 0.08);

  // Create materials for each face
  // RoundedBoxGeometry face order: +X, -X, +Y, -Y, +Z, -Z
  const faceOrder = [3, 4, 1, 6, 2, 5]; // Right, Left, Top, Bottom, Front, Back

  const materials = faceOrder.map(value => {
    return new THREE.MeshStandardMaterial({
      map: createPipTexture(value),
      roughness: 0.3,
      metalness: 0.0,
    });
  });

  const die = new THREE.Mesh(geometry, materials);
  die.castShadow = true;
  die.receiveShadow = true;

  return die;
}
