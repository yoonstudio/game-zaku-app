/**
 * Zaku Colony Destroyer
 * Main entry point
 *
 * A Three.js game where you pilot a Zaku II to destroy a space colony
 */

import { Game } from './core/Game.js';

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('=================================');
  console.log('  Zaku Colony Destroyer');
  console.log('  MS-06 Zaku II Ready for Launch');
  console.log('=================================');

  // Get container
  const container = document.getElementById('app');

  if (!container) {
    console.error('App container not found!');
    return;
  }

  // Create and initialize game
  const game = new Game(container);
  game.init();

  // Store game reference for debugging
  window.game = game;

  console.log('Game started! Click to lock pointer and begin.');
  console.log('Controls:');
  console.log('  WASD - Move');
  console.log('  Q/E - Rotate');
  console.log('  Space - Ascend');
  console.log('  Shift - Descend');
  console.log('  Ctrl - Boost');
  console.log('  Mouse - Aim');
  console.log('  Left Click - Fire');
});
