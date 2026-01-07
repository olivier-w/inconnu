import * as THREE from 'three';
import { createNumberTexture } from '../textures.js';

// D20 icosahedron configuration
// An icosahedron has 12 vertices and 20 triangular faces
// Opposite faces sum to 21

const size = 0.65;

// Create geometry once to extract data
function createD20Geometry() {
  return new THREE.IcosahedronGeometry(size, 0);
}

// Extract unique vertices
function getD20Vertices() {
  const geo = createD20Geometry();
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
function getD20FaceNormals() {
  const geo = createD20Geometry();
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

export const D20_CONFIG = {
  type: 'd20',
  name: 'd20',
  faces: 20,
  size: size,
  collisionRadius: size * 1.0,
  restHeight: size * 0.8,
  readBottom: false,

  get vertices() {
    if (!_vertices) _vertices = getD20Vertices();
    return _vertices;
  },
  get faceNormals() {
    if (!_faceNormals) _faceNormals = getD20FaceNormals();
    return _faceNormals;
  },
  faceValues: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
};

// Create d20 mesh - uses solid ivory material for simplicity
export function createD20Mesh() {
  const geometry = new THREE.IcosahedronGeometry(D20_CONFIG.size, 0);

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
