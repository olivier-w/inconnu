import * as THREE from 'three';

// Create pip texture for d6 faces
export function createPipTexture(value) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  // Ivory background
  ctx.fillStyle = '#f5f0e6';
  ctx.fillRect(0, 0, 256, 256);

  // Subtle gradient
  const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 150);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0.05)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 256);

  // Draw pips
  ctx.fillStyle = '#1a2f23';
  const pipRadius = 18;
  const positions = getPipPositions(value);

  for (const pos of positions) {
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, pipRadius, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 16;
  return texture;
}

function getPipPositions(value) {
  const c = 128; // center
  const o = 60;  // offset

  const patterns = {
    1: [{ x: c, y: c }],
    2: [{ x: c - o, y: c - o }, { x: c + o, y: c + o }],
    3: [{ x: c - o, y: c - o }, { x: c, y: c }, { x: c + o, y: c + o }],
    4: [{ x: c - o, y: c - o }, { x: c + o, y: c - o }, { x: c - o, y: c + o }, { x: c + o, y: c + o }],
    5: [{ x: c - o, y: c - o }, { x: c + o, y: c - o }, { x: c, y: c }, { x: c - o, y: c + o }, { x: c + o, y: c + o }],
    6: [{ x: c - o, y: c - o }, { x: c - o, y: c }, { x: c - o, y: c + o }, { x: c + o, y: c - o }, { x: c + o, y: c }, { x: c + o, y: c + o }],
  };

  return patterns[value];
}

// Create number texture for polyhedra faces
export function createNumberTexture(value, options = {}) {
  const {
    size = 256,
    bgColor = '#f5f0e6',
    fgColor = '#1a2f23',
    fontSize = 120,
    fontFamily = 'Cormorant Garamond, serif'
  } = options;

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, size, size);

  // Subtle gradient for depth
  const gradient = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size * 0.6);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0.05)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  // Number
  ctx.fillStyle = fgColor;
  ctx.font = `bold ${fontSize}px ${fontFamily}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const text = value.toString();
  ctx.fillText(text, size/2, size/2);

  // Underline for 6 and 9 to distinguish them
  if (value === 6 || value === 9) {
    const textWidth = ctx.measureText(text).width;
    ctx.beginPath();
    ctx.moveTo(size/2 - textWidth/2, size/2 + fontSize * 0.4);
    ctx.lineTo(size/2 + textWidth/2, size/2 + fontSize * 0.4);
    ctx.lineWidth = 4;
    ctx.strokeStyle = fgColor;
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 16;
  return texture;
}

// Create coin face texture
export function createCoinTexture(side) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  // Gold metallic base
  const gradient = ctx.createRadialGradient(256, 256, 0, 256, 256, 256);
  gradient.addColorStop(0, '#ffd700');
  gradient.addColorStop(0.3, '#f0c850');
  gradient.addColorStop(0.7, '#c9a962');
  gradient.addColorStop(1, '#8a7542');
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(256, 256, 250, 0, Math.PI * 2);
  ctx.fill();

  // Inner ring detail
  ctx.strokeStyle = 'rgba(139, 117, 66, 0.5)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(256, 256, 220, 0, Math.PI * 2);
  ctx.stroke();

  // Text
  ctx.fillStyle = '#1a2f23';
  ctx.font = 'bold 72px Cormorant Garamond, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(side, 256, 256);

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 16;
  return texture;
}

// Create edge texture for coin (metallic gold)
export function createCoinEdgeTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');

  // Gold metallic gradient
  const gradient = ctx.createLinearGradient(0, 0, 64, 0);
  gradient.addColorStop(0, '#8a7542');
  gradient.addColorStop(0.5, '#c9a962');
  gradient.addColorStop(1, '#8a7542');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.repeat.set(8, 1);
  return texture;
}
