// Dice type registry - exports all dice configurations and mesh creators

import { D4_CONFIG, createD4Mesh } from './d4.js';
import { D6_CONFIG, createD6Mesh } from './d6.js';
import { D8_CONFIG, createD8Mesh } from './d8.js';
import { D12_CONFIG, createD12Mesh } from './d12.js';
import { D20_CONFIG, createD20Mesh } from './d20.js';
import { COIN_CONFIG, createCoinMesh } from './coin.js';

// Registry of all dice types
export const DICE_REGISTRY = {
  d4: {
    config: D4_CONFIG,
    createMesh: createD4Mesh,
  },
  d6: {
    config: D6_CONFIG,
    createMesh: createD6Mesh,
  },
  d8: {
    config: D8_CONFIG,
    createMesh: createD8Mesh,
  },
  d12: {
    config: D12_CONFIG,
    createMesh: createD12Mesh,
  },
  d20: {
    config: D20_CONFIG,
    createMesh: createD20Mesh,
  },
  coin: {
    config: COIN_CONFIG,
    createMesh: createCoinMesh,
  },
};

// Get list of available dice types
export const DICE_TYPES = Object.keys(DICE_REGISTRY);

// Get config for a dice type
export function getDiceConfig(type) {
  const entry = DICE_REGISTRY[type];
  if (!entry) {
    throw new Error(`Unknown dice type: ${type}`);
  }
  return entry.config;
}

// Create a mesh for a dice type
export function createDiceMesh(type) {
  const entry = DICE_REGISTRY[type];
  if (!entry) {
    throw new Error(`Unknown dice type: ${type}`);
  }
  return entry.createMesh();
}
