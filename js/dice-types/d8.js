import * as THREE from 'three';
import { createNumberTexture } from '../textures.js';

// D8 octahedron configuration
// An octahedron has 6 vertices and 8 triangular faces
// Opposite faces sum to 9

const size = 0.7;

// Create geometry once to extract vertices and face normals
function createD8Geometry() {
  return new THREE.OctahedronGeometry(size, 0);
}

// Extract unique vertices from geometry
function getD8Vertices() {
  const geo = createD8Geometry();
  const position = geo.getAttribute('position');
  const vertices = [];
  const uniqueSet = new Set();

  for (let i = 0; i < position.count; i++) {
    const key = `${position.getX(i).toFixed(4)},${position.getY(i).toFixed(4)},${position.getZ(i).toFixed(4)}`;
    if (!uniqueSet.has(key)) {
      uniqueSet.add(key);
      vertices.push(new THREE.Vector3(position.getX(i), position.getY(i), position.getZ(i)));
    }
  }

  geo.dispose();
  return vertices;
}

// Extract face normals from geometry
function getD8FaceNormals() {
  const geo = createD8Geometry();
  const position = geo.getAttribute('position');
  const normals = [];

  for (let i = 0; i < position.count; i += 3) {
    const v0 = new THREE.Vector3(position.getX(i), position.getY(i), position.getZ(i));
    const v1 = new THREE.Vector3(position.getX(i+1), position.getY(i+1), position.getZ(i+1));
    const v2 = new THREE.Vector3(position.getX(i+2), position.getY(i+2), position.getZ(i+2));

    const edge1 = new THREE.Vector3().subVectors(v1, v0);
    const edge2 = new THREE.Vector3().subVectors(v2, v0);
    const normal = new THREE.Vector3().crossVectors(edge1, edge2).normalize();
    normals.push(normal);
  }

  geo.dispose();
  return normals;
}

// Lazy initialization
let _vertices = null;
let _faceNormals = null;

export const D8_CONFIG = {
  type: 'd8',
  name: 'd8',
  faces: 8,
  size: size,
  collisionRadius: size * 1.0,
  restHeight: size * 0.7,
  readBottom: false,

  get vertices() {
    if (!_vertices) _vertices = getD8Vertices();
    return _vertices;
  },
  get faceNormals() {
    if (!_faceNormals) _faceNormals = getD8FaceNormals();
    return _faceNormals;
  },
  faceValues: [1, 2, 3, 4, 5, 6, 7, 8],
};

// Create d8 mesh - uses solid ivory material for simplicity
export function createD8Mesh() {
  const geometry = new THREE.OctahedronGeometry(D8_CONFIG.size, 0);

  const material = new THREE.MeshStandardMaterial({
    color: 0xf5f0e6,
    roughness: 0.3,
    metalness: 0.0,
  });

  const die = new THREE.Mesh(geometry, material);
  die.castShadow = true;
  die.receiveShadow = true;

  return die;
}
