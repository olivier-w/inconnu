import * as THREE from 'three';
import { createNumberTexture } from '../textures.js';

// D12 dodecahedron configuration
// A dodecahedron has 20 vertices and 12 pentagonal faces
// Opposite faces sum to 13

const size = 0.6;

// Create geometry once to extract data
function createD12Geometry() {
  return new THREE.DodecahedronGeometry(size, 0);
}

// Extract unique vertices
function getD12Vertices() {
  const geo = createD12Geometry();
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

// Extract face normals - dodecahedron has triangulated faces (3 triangles per pentagon = 36 triangles)
function getD12FaceNormals() {
  const geo = createD12Geometry();
  const position = geo.getAttribute('position');
  const normals = [];
  const triangleCount = position.count / 3;

  // Compute normal for each triangle
  for (let i = 0; i < position.count; i += 3) {
    const v0 = new THREE.Vector3(position.getX(i), position.getY(i), position.getZ(i));
    const v1 = new THREE.Vector3(position.getX(i+1), position.getY(i+1), position.getZ(i+1));
    const v2 = new THREE.Vector3(position.getX(i+2), position.getY(i+2), position.getZ(i+2));

    const edge1 = new THREE.Vector3().subVectors(v1, v0);
    const edge2 = new THREE.Vector3().subVectors(v2, v0);
    const normal = new THREE.Vector3().crossVectors(edge1, edge2).normalize();
    normals.push(normal);
  }

  // Group similar normals (triangles that belong to same pentagonal face)
  const uniqueNormals = [];
  const threshold = 0.1;

  for (const normal of normals) {
    let found = false;
    for (const existing of uniqueNormals) {
      if (normal.distanceTo(existing) < threshold) {
        found = true;
        break;
      }
    }
    if (!found) {
      uniqueNormals.push(normal);
    }
  }

  geo.dispose();
  return uniqueNormals;
}

// Lazy initialization
let _vertices = null;
let _faceNormals = null;

export const D12_CONFIG = {
  type: 'd12',
  name: 'd12',
  faces: 12,
  size: size,
  collisionRadius: size * 1.2,
  restHeight: size * 0.9,
  readBottom: false,

  get vertices() {
    if (!_vertices) _vertices = getD12Vertices();
    return _vertices;
  },
  get faceNormals() {
    if (!_faceNormals) _faceNormals = getD12FaceNormals();
    return _faceNormals;
  },
  faceValues: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
};

// Create d12 mesh - uses solid ivory material for simplicity
export function createD12Mesh() {
  const geometry = new THREE.DodecahedronGeometry(D12_CONFIG.size, 0);

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
