/**
 * Camera System
 * Third-person follow camera with smooth tracking
 */

import * as THREE from 'three';
import { CAMERA } from '../utils/Constants.js';
import { lerp, clamp } from '../utils/MathUtils.js';

export class CameraController {
  constructor(camera) {
    this.camera = camera;

    // Target to follow
    this.target = null;

    // Camera offset from target
    this.offset = new THREE.Vector3(0, CAMERA.height, CAMERA.distance);

    // Current camera state
    this.currentPosition = new THREE.Vector3();
    this.currentLookAt = new THREE.Vector3();

    // Rotation angles
    this.horizontalAngle = 0;
    this.verticalAngle = 0.2; // Slight look-down angle

    // Rotation limits
    this.minVerticalAngle = -0.5;
    this.maxVerticalAngle = 0.8;

    // Smoothing
    this.positionSmoothing = CAMERA.smoothing;
    this.lookAtSmoothing = 0.15;

    // Zoom
    this.zoomLevel = 1;
    this.minZoom = 0.5;
    this.maxZoom = 2;

    // Camera shake
    this.shakeIntensity = 0;
    this.shakeDuration = 0;
    this.shakeTimer = 0;

    // View mode: 'third-person', 'first-person', 'cockpit'
    this.viewMode = 'third-person';
    this.viewModes = ['third-person', 'first-person', 'cockpit'];
    this.currentViewIndex = 0;
  }

  /**
   * Toggle camera view mode
   */
  toggleViewMode() {
    this.currentViewIndex = (this.currentViewIndex + 1) % this.viewModes.length;
    this.viewMode = this.viewModes[this.currentViewIndex];
    console.log(`Camera view: ${this.viewMode}`);
    return this.viewMode;
  }

  /**
   * Get current view mode name
   */
  getViewModeName() {
    const names = {
      'third-person': '3인칭 뷰',
      'first-person': '1인칭 뷰',
      'cockpit': '콕핏 뷰'
    };
    return names[this.viewMode] || this.viewMode;
  }

  /**
   * Set the target to follow
   */
  setTarget(target) {
    this.target = target;

    // Initialize camera position
    if (target) {
      const targetPos = this.getTargetPosition();
      this.currentPosition.copy(targetPos).add(this.offset);
      this.currentLookAt.copy(targetPos);
      this.camera.position.copy(this.currentPosition);
      this.camera.lookAt(this.currentLookAt);
    }
  }

  /**
   * Get target world position
   */
  getTargetPosition() {
    if (!this.target) return new THREE.Vector3();

    if (this.target.group) {
      return this.target.group.position.clone();
    }
    return this.target.position ? this.target.position.clone() : new THREE.Vector3();
  }

  /**
   * Rotate camera around target
   */
  rotate(deltaX, deltaY) {
    const sensitivity = 0.002;

    this.horizontalAngle += deltaX * sensitivity;
    this.verticalAngle = clamp(
      this.verticalAngle + deltaY * sensitivity,
      this.minVerticalAngle,
      this.maxVerticalAngle
    );
  }

  /**
   * Zoom camera
   */
  zoom(delta) {
    this.zoomLevel = clamp(
      this.zoomLevel + delta * 0.1,
      this.minZoom,
      this.maxZoom
    );
  }

  /**
   * Trigger camera shake
   */
  shake(intensity = 0.5, duration = 0.3) {
    this.shakeIntensity = intensity;
    this.shakeDuration = duration;
    this.shakeTimer = duration;
  }

  /**
   * Calculate camera offset based on angles and zoom
   */
  calculateOffset() {
    const distance = CAMERA.distance * this.zoomLevel;
    const height = CAMERA.height * this.zoomLevel;

    // Spherical to cartesian conversion
    const cosVertical = Math.cos(this.verticalAngle);
    const sinVertical = Math.sin(this.verticalAngle);

    return new THREE.Vector3(
      distance * Math.sin(this.horizontalAngle) * cosVertical,
      height + distance * sinVertical,
      distance * Math.cos(this.horizontalAngle) * cosVertical
    );
  }

  /**
   * Update camera position and rotation
   */
  update(deltaTime) {
    if (!this.target) return;

    const targetPos = this.getTargetPosition();
    const targetRotation = this.target.getRotation ? this.target.getRotation() : 0;

    let desiredPosition, desiredLookAt;

    switch (this.viewMode) {
      case 'first-person':
        // First-person: camera at head position, looking forward (reversed direction)
        desiredPosition = targetPos.clone();
        desiredPosition.y += 14; // Head height
        // Offset forward based on target rotation (reversed)
        const fpForward = new THREE.Vector3(0, 0, -3);
        fpForward.applyAxisAngle(new THREE.Vector3(0, 1, 0), targetRotation);
        desiredPosition.add(fpForward);

        // Look far ahead in the direction the Zaku is facing (reversed)
        desiredLookAt = desiredPosition.clone();
        const fpLookDir = new THREE.Vector3(0, 0, -100);
        fpLookDir.applyAxisAngle(new THREE.Vector3(0, 1, 0), targetRotation);
        desiredLookAt.add(fpLookDir);
        break;

      case 'cockpit':
        // Cockpit view: behind the head, looking forward over shoulder
        desiredPosition = targetPos.clone();
        desiredPosition.y += 16; // Above and behind head
        const cockpitBack = new THREE.Vector3(0, 0, 5); // Behind the head
        cockpitBack.applyAxisAngle(new THREE.Vector3(0, 1, 0), targetRotation);
        desiredPosition.add(cockpitBack);

        // Look forward in the direction the Zaku is facing
        desiredLookAt = targetPos.clone();
        desiredLookAt.y += 14; // Head level
        const cockpitLookDir = new THREE.Vector3(0, 0, -50);
        cockpitLookDir.applyAxisAngle(new THREE.Vector3(0, 1, 0), targetRotation);
        desiredLookAt.add(cockpitLookDir);
        break;

      case 'third-person':
      default:
        // Third-person: original behavior
        const offset = this.calculateOffset();
        desiredPosition = targetPos.clone().add(offset);
        desiredLookAt = targetPos.clone();
        desiredLookAt.y += 5; // Look at upper body of Zaku
        break;
    }

    // Smooth camera movement
    const smoothing = this.viewMode === 'third-person' ? this.positionSmoothing : 0.2;
    this.currentPosition.lerp(desiredPosition, smoothing);
    this.currentLookAt.lerp(desiredLookAt, this.lookAtSmoothing);

    // Apply camera shake
    let shakeOffset = new THREE.Vector3();
    if (this.shakeTimer > 0) {
      this.shakeTimer -= deltaTime;
      const shakeProgress = this.shakeTimer / this.shakeDuration;
      const currentIntensity = this.shakeIntensity * shakeProgress;

      shakeOffset.set(
        (Math.random() - 0.5) * 2 * currentIntensity,
        (Math.random() - 0.5) * 2 * currentIntensity,
        (Math.random() - 0.5) * 2 * currentIntensity
      );
    }

    // Update camera
    this.camera.position.copy(this.currentPosition).add(shakeOffset);
    this.camera.lookAt(this.currentLookAt);
  }

  /**
   * Get camera forward direction (for shooting)
   */
  getForwardDirection() {
    const direction = new THREE.Vector3();
    this.camera.getWorldDirection(direction);
    return direction;
  }

  /**
   * Get look-at point for aiming
   */
  getAimPoint() {
    return this.currentLookAt.clone();
  }

  /**
   * Reset camera to default position
   */
  reset() {
    this.horizontalAngle = 0;
    this.verticalAngle = 0.2;
    this.zoomLevel = 1;
    this.shakeTimer = 0;
  }
}
