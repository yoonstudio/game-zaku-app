/**
 * Math Utilities
 * Helper functions for game math operations
 */

import * as THREE from 'three';

/**
 * Linear interpolation between two values
 */
export function lerp(start, end, t) {
  return start + (end - start) * t;
}

/**
 * Clamp a value between min and max
 */
export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

/**
 * Smooth damping interpolation
 */
export function smoothDamp(current, target, velocity, smoothTime, deltaTime) {
  const omega = 2 / smoothTime;
  const x = omega * deltaTime;
  const exp = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);

  let change = current - target;
  const originalTo = target;

  const maxChange = Infinity;
  change = clamp(change, -maxChange, maxChange);
  target = current - change;

  const temp = (velocity + omega * change) * deltaTime;
  velocity = (velocity - omega * temp) * exp;

  let output = target + (change + temp) * exp;

  if (originalTo - current > 0 === output > originalTo) {
    output = originalTo;
    velocity = (output - originalTo) / deltaTime;
  }

  return { value: output, velocity };
}

/**
 * Random float between min and max
 */
export function randomRange(min, max) {
  return Math.random() * (max - min) + min;
}

/**
 * Random integer between min and max (inclusive)
 */
export function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generate random point on sphere surface
 */
export function randomPointOnSphere(radius) {
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(2 * Math.random() - 1);

  return new THREE.Vector3(
    radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.sin(phi) * Math.sin(theta),
    radius * Math.cos(phi)
  );
}

/**
 * Convert degrees to radians
 */
export function degToRad(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * Convert radians to degrees
 */
export function radToDeg(radians) {
  return radians * (180 / Math.PI);
}

/**
 * Normalize angle to -PI to PI range
 */
export function normalizeAngle(angle) {
  while (angle > Math.PI) angle -= Math.PI * 2;
  while (angle < -Math.PI) angle += Math.PI * 2;
  return angle;
}

/**
 * Ease in out cubic function
 */
export function easeInOutCubic(t) {
  return t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * Format time in MM:SS format
 */
export function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format number with commas
 */
export function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
