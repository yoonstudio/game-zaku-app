/**
 * Game Constants
 * Central configuration for Zaku Colony Destroyer
 */

// Zaku dimensions
export const ZAKU = {
  height: 20,                 // Approximate Zaku height in units
};

// Zaku colors
export const ZAKU_COLORS = {
  main: 0x5A5A3A,           // OD Green (Olive Drab)
  dark: 0x3A3A2A,           // Darker green for shadows
  light: 0x7A7A5A,          // Lighter green for highlights
  monoeye: 0xFF0000,        // Red monoeye
  monoeyeGlow: 0xFF3333,    // Monoeye glow
  vernierFlame: 0xFF6600,   // Vernier flame
  spike: 0x444444,          // Spike color
};

// Colony colors
export const COLONY_COLORS = {
  hull: 0x555555,           // Main hull
  window: 0x88CCFF,         // Windows (emissive)
  solarPanel: 0x1A237E,     // Solar panels
  dock: 0x666666,           // Docking bay
  interior: 0xFFE0B2,       // Interior light
};

// Movement settings (Space Flight)
export const MOVEMENT = {
  normalSpeed: 20,          // Normal thrust speed
  boostSpeed: 60,           // Boost thrust speed
  rotationSpeed: Math.PI / 2, // 90 degrees per second
  verticalSpeed: 20,        // Vertical thrust speed
  inertia: 0.97,            // High inertia for space (no friction)
  boostInertia: 0.99,       // Even higher inertia when boosting
};

// Camera settings
export const CAMERA = {
  fov: 60,
  near: 0.1,
  far: 2000,
  distance: 30,             // Distance behind Zaku
  height: 10,               // Height above Zaku
  smoothing: 0.08,          // Camera follow smoothing
};

// Colony dimensions
export const COLONY = {
  length: 300,              // Cylinder length
  radius: 50,               // Cylinder radius
  windowCount: 6,           // Window sections
  solarPanelCount: 4,       // Solar panel pairs
};

// Game settings
export const GAME = {
  missionTime: 300,         // 5 minutes in seconds
  targetDestructionRate: 70, // Target destruction percentage
  comboTimeout: 3000,       // Combo timeout in ms
};

// Weapon settings
export const WEAPONS = {
  machineGun: {
    name: 'Zaku Machine Gun',
    damage: 10,
    fireRate: 100,          // ms between shots
    ammo: 500,
    reloadTime: 2000,
    range: 60,              // Damage range (3x Zaku height = 20 * 3)
  },
  bazooka: {
    name: 'Bazooka',
    damage: 100,
    fireRate: 1500,
    ammo: 20,
    reloadTime: 3000,
    explosionRadius: 10,
  },
};

// UI Colors
export const UI_COLORS = {
  primary: '#00ff88',       // Neon green
  secondary: '#00aaff',     // Neon blue
  warning: '#ffaa00',       // Orange
  danger: '#ff3333',        // Red
  background: 'rgba(0, 10, 20, 0.8)',
  border: 'rgba(0, 255, 136, 0.5)',
};

// Key bindings
export const KEYS = {
  forward: 'KeyW',
  backward: 'KeyS',
  left: 'KeyA',
  right: 'KeyD',
  rotateLeft: 'KeyQ',
  rotateRight: 'KeyE',
  up: 'Space',
  down: 'ShiftLeft',
  boost: 'ControlLeft',
  fire: 0,                  // Left mouse button
  altFire: 2,               // Right mouse button
  reload: 'KeyR',
  weapon1: 'Digit1',
  weapon2: 'Digit2',
  pause: 'Escape',
};
