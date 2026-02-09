/**
 * InputManager
 * Handles keyboard and mouse input for the game
 */

import { KEYS } from '../utils/Constants.js';

export class InputManager {
  constructor() {
    // Keyboard state
    this.keys = new Set();
    this.keysJustPressed = new Set();
    this.keysJustReleased = new Set();

    // Mouse state
    this.mouse = {
      x: 0,
      y: 0,
      normalizedX: 0,
      normalizedY: 0,
      deltaX: 0,
      deltaY: 0,
      buttons: new Set(),
      buttonsJustPressed: new Set(),
      buttonsJustReleased: new Set(),
      wheel: 0,
    };

    // Pointer lock state
    this.isPointerLocked = false;

    // Bind event handlers
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onKeyUp = this.onKeyUp.bind(this);
    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onWheel = this.onWheel.bind(this);
    this.onPointerLockChange = this.onPointerLockChange.bind(this);
    this.onContextMenu = this.onContextMenu.bind(this);

    // Initialize
    this.init();
  }

  init() {
    // Keyboard events
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);

    // Mouse events
    window.addEventListener('mousedown', this.onMouseDown);
    window.addEventListener('mouseup', this.onMouseUp);
    window.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('wheel', this.onWheel, { passive: false });

    // Pointer lock events
    document.addEventListener('pointerlockchange', this.onPointerLockChange);

    // Prevent context menu on right click
    window.addEventListener('contextmenu', this.onContextMenu);
  }

  // Request pointer lock
  requestPointerLock(element) {
    element.requestPointerLock();
  }

  // Exit pointer lock
  exitPointerLock() {
    document.exitPointerLock();
  }

  // Keyboard handlers
  onKeyDown(event) {
    if (!this.keys.has(event.code)) {
      this.keysJustPressed.add(event.code);
    }
    this.keys.add(event.code);

    // Prevent default for game keys
    if (this.isGameKey(event.code)) {
      event.preventDefault();
    }
  }

  onKeyUp(event) {
    this.keys.delete(event.code);
    this.keysJustReleased.add(event.code);
  }

  // Mouse handlers
  onMouseDown(event) {
    if (!this.mouse.buttons.has(event.button)) {
      this.mouse.buttonsJustPressed.add(event.button);
    }
    this.mouse.buttons.add(event.button);
  }

  onMouseUp(event) {
    this.mouse.buttons.delete(event.button);
    this.mouse.buttonsJustReleased.add(event.button);
  }

  onMouseMove(event) {
    // Absolute position
    this.mouse.x = event.clientX;
    this.mouse.y = event.clientY;

    // Normalized position (-1 to 1)
    this.mouse.normalizedX = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.normalizedY = -(event.clientY / window.innerHeight) * 2 + 1;

    // Delta movement (for pointer lock mode)
    this.mouse.deltaX += event.movementX || 0;
    this.mouse.deltaY += event.movementY || 0;
  }

  onWheel(event) {
    event.preventDefault();
    this.mouse.wheel += Math.sign(event.deltaY);
  }

  onPointerLockChange() {
    this.isPointerLocked = document.pointerLockElement !== null;
  }

  onContextMenu(event) {
    event.preventDefault();
  }

  // Check if key is a game key
  isGameKey(code) {
    return Object.values(KEYS).includes(code);
  }

  // Input state queries
  isKeyDown(keyCode) {
    return this.keys.has(keyCode);
  }

  isKeyJustPressed(keyCode) {
    return this.keysJustPressed.has(keyCode);
  }

  isKeyJustReleased(keyCode) {
    return this.keysJustReleased.has(keyCode);
  }

  isMouseButtonDown(button) {
    return this.mouse.buttons.has(button);
  }

  isMouseButtonJustPressed(button) {
    return this.mouse.buttonsJustPressed.has(button);
  }

  isMouseButtonJustReleased(button) {
    return this.mouse.buttonsJustReleased.has(button);
  }

  // Movement input helpers
  getMovementInput() {
    return {
      forward: this.isKeyDown(KEYS.forward) ? 1 : 0,
      backward: this.isKeyDown(KEYS.backward) ? 1 : 0,
      left: this.isKeyDown(KEYS.left) ? 1 : 0,
      right: this.isKeyDown(KEYS.right) ? 1 : 0,
      up: this.isKeyDown(KEYS.up) ? 1 : 0,
      down: this.isKeyDown(KEYS.down) ? 1 : 0,
      rotateLeft: this.isKeyDown(KEYS.rotateRight) ? 1 : 0,
      rotateRight: this.isKeyDown(KEYS.rotateLeft) ? 1 : 0,
      boost: this.isKeyDown(KEYS.boost),
    };
  }

  // Get mouse delta and reset
  getMouseDelta() {
    const delta = {
      x: this.mouse.deltaX,
      y: this.mouse.deltaY,
    };
    this.mouse.deltaX = 0;
    this.mouse.deltaY = 0;
    return delta;
  }

  // Get mouse wheel and reset
  getMouseWheel() {
    const wheel = this.mouse.wheel;
    this.mouse.wheel = 0;
    return wheel;
  }

  // Clear per-frame state (call at end of update loop)
  update() {
    this.keysJustPressed.clear();
    this.keysJustReleased.clear();
    this.mouse.buttonsJustPressed.clear();
    this.mouse.buttonsJustReleased.clear();
  }

  // Cleanup
  dispose() {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('mousedown', this.onMouseDown);
    window.removeEventListener('mouseup', this.onMouseUp);
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('wheel', this.onWheel);
    document.removeEventListener('pointerlockchange', this.onPointerLockChange);
    window.removeEventListener('contextmenu', this.onContextMenu);
  }
}
