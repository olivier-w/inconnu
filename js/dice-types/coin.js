import * as THREE from 'three';
import { createCoinTexture, createCoinEdgeTexture } from '../textures.js';

// Coin configuration
// A coin is a flat cylinder with 2 faces (heads/tails)

const radius = 0.6;
const height = 0.1;

// Lazy initialization
let _vertices = null;
let _faceNormals = null;

function getCoinVertices() {
  const verts = [];
  const segments = 8;
  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    verts.push(new THREE.Vector3(x, height/2, z));
    verts.push(new THREE.Vector3(x, -height/2, z));
  }
  return verts;
}

function getCoinFaceNormals() {
  return [
    new THREE.Vector3(0, 1, 0),  // Heads (top)
    new THREE.Vector3(0, -1, 0), // Tails (bottom)
  ];
}

export const COIN_CONFIG = {
  type: 'coin',
  name: 'Coin',
  faces: 2,
  size: radius * 2,
  collisionRadius: radius,
  restHeight: height / 2,
  readBottom: false,

  get vertices() {
    if (!_vertices) _vertices = getCoinVertices();
    return _vertices;
  },
  get faceNormals() {
    if (!_faceNormals) _faceNormals = getCoinFaceNormals();
    return _faceNormals;
  },
  faceValues: ['Heads', 'Tails'],
};

// Create coin mesh
export function createCoinMesh() {
  const geometry = new THREE.CylinderGeometry(radius, radius, height, 32);

  // CylinderGeometry has 3 groups: side, top, bottom
  // We need to assign materials properly
  const materials = [
    // Side (edge)
    new THREE.MeshStandardMaterial({
      map: createCoinEdgeTexture(),
      roughness: 0.4,
      metalness: 0.6,
    }),
    // Top (Heads)
    new THREE.MeshStandardMaterial({
      map: createCoinTexture('Heads'),
      roughness: 0.3,
      metalness: 0.5,
    }),
    // Bottom (Tails)
    new THREE.MeshStandardMaterial({
      map: createCoinTexture('Tails'),
      roughness: 0.3,
      metalness: 0.5,
    }),
  ];

  const coin = new THREE.Mesh(geometry, materials);
  coin.castShadow = true;
  coin.receiveShadow = true;

  return coin;
}
