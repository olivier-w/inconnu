import * as THREE from 'three';
import { createNumberTexture } from '../textures.js';

// D4 tetrahedron configuration
// A tetrahedron has 4 vertices and 4 triangular faces
// The value shown is on the BOTTOM face (the one touching the ground)

const size = 0.9;

// Create geometry once to extract vertices and face normals
function createD4Geometry() {
  return new THREE.TetrahedronGeometry(size, 0);
}

// Extract vertices from geometry
function getD4Vertices() {
  const geo = createD4Geometry();
  const position = geo.getAttribute('position');
  const vertices = [];

  // TetrahedronGeometry has 12 position values (4 faces * 3 vertices each, with duplicates)
  // We need unique vertices
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
function getD4FaceNormals() {
  const geo = createD4Geometry();
  const position = geo.getAttribute('position');
  const normals = [];

  // Each face is 3 vertices
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

// Lazy initialization to avoid issues with module load order
let _vertices = null;
let _faceNormals = null;

export const D4_CONFIG = {
  type: 'd4',
  name: 'd4',
  faces: 4,
  size: size,
  collisionRadius: size * 0.9,
  restHeight: size * 0.35,
  readBottom: true, // D4 reads the bottom face

  get vertices() {
    if (!_vertices) _vertices = getD4Vertices();
    return _vertices;
  },
  get faceNormals() {
    if (!_faceNormals) _faceNormals = getD4FaceNormals();
    return _faceNormals;
  },
  faceValues: [1, 2, 3, 4],
};

// Create d4 mesh - uses solid ivory material for simplicity
export function createD4Mesh() {
  const geometry = new THREE.TetrahedronGeometry(D4_CONFIG.size, 0);

  // Use a simple ivory material - polyhedra texturing is complex
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
