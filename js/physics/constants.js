// Realistic physics constants for dice simulation

export const PHYSICS = {
  // Gravity (m/s²) - realistic Earth gravity
  GRAVITY: 9.81,

  // Fixed timestep for physics simulation (seconds)
  // 240Hz gives 2 substeps at 120fps, 4 at 60fps
  FIXED_TIMESTEP: 1 / 240,

  // Maximum accumulated time to prevent spiral of death
  MAX_ACCUMULATOR: 0.1,

  // Collision response
  RESTITUTION: 0.35,        // Bounce coefficient (plastic dice)
  STATIC_FRICTION: 0.5,     // Coulomb friction when stationary
  KINETIC_FRICTION: 0.3,    // Coulomb friction when sliding

  // Velocity-squared drag (air resistance)
  LINEAR_DRAG: 0.01,        // Applied to velocity²
  ANGULAR_DRAG: 0.02,       // Applied to angular velocity²

  // Ground contact damping (energy loss on contact)
  CONTACT_DAMPING: 0.85,    // Velocity multiplier during ground contact

  // Settling detection
  SETTLING_TIME: 0.3,       // Seconds of being still to consider settled
  VELOCITY_THRESHOLD: 0.05, // m/s - below this considered "still"
  ANGULAR_THRESHOLD: 0.1,   // rad/s - below this considered "still"

  // Penetration correction (Baumgarte stabilization)
  POSITION_CORRECTION: 0.2, // Fraction of penetration to correct per step
  PENETRATION_SLOP: 0.001,  // Allowed penetration before correction

  // World bounds
  BOUNDS: {
    MIN_X: -4,
    MAX_X: 4,
    MIN_Z: -4,
    MAX_Z: 4,
    GROUND_Y: 0
  },

  // Wall collision
  WALL_RESTITUTION: 0.5,

  // Dice-to-dice collision
  DICE_RESTITUTION: 0.3,           // Slightly less bouncy than ground
  DICE_FRICTION: 0.3,              // Friction between dice
  DICE_POSITION_CORRECTION: 0.3,   // Penetration correction factor
  DICE_VELOCITY_THRESHOLD: 0.05    // Minimum velocity to respond
};

// D6 specific constants
export const D6 = {
  // Physical dimensions (in meters, scaled for scene)
  SIZE: 1.0,                // Side length
  MASS: 1.0,                // Mass in kg (arbitrary units)

  // Derived values
  get HALF_SIZE() { return this.SIZE / 2; },

  // Inertia tensor for a cube: I = (1/6) × m × s²
  get INERTIA() { return (1/6) * this.MASS * this.SIZE * this.SIZE; },
  get INVERSE_INERTIA() { return 1 / this.INERTIA; },

  // Rest height (half size above ground)
  get REST_HEIGHT() { return this.HALF_SIZE; },

  // Collision radius (half diagonal for broad phase)
  get COLLISION_RADIUS() { return this.HALF_SIZE * Math.sqrt(3); }
};

// Face normals for a d6 (local space)
// Index corresponds to face value - 1
export const D6_FACE_NORMALS = [
  { x:  0, y:  0, z:  1 },  // Face 1 (front)
  { x:  0, y:  1, z:  0 },  // Face 2 (top in standard orientation)
  { x:  1, y:  0, z:  0 },  // Face 3 (right)
  { x: -1, y:  0, z:  0 },  // Face 4 (left)
  { x:  0, y: -1, z:  0 },  // Face 5 (bottom)
  { x:  0, y:  0, z: -1 }   // Face 6 (back)
];

// Cube vertices in local space (for collision detection)
// 8 corners of the cube, centered at origin
export const D6_VERTICES = (() => {
  const h = D6.HALF_SIZE;
  return [
    { x: -h, y: -h, z: -h },
    { x:  h, y: -h, z: -h },
    { x: -h, y:  h, z: -h },
    { x:  h, y:  h, z: -h },
    { x: -h, y: -h, z:  h },
    { x:  h, y: -h, z:  h },
    { x: -h, y:  h, z:  h },
    { x:  h, y:  h, z:  h }
  ];
})();
