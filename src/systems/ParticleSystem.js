/**
 * Particle System
 * Handles explosions and visual effects
 */

import * as THREE from 'three';
import { randomRange } from '../utils/MathUtils.js';

export class ParticleSystem {
  constructor(scene) {
    this.scene = scene;

    // Active particle groups
    this.particles = [];

    // Particle pool for reuse
    this.pool = [];
    this.maxPoolSize = 50;
  }

  /**
   * Create an explosion at position
   */
  createExplosion(position, size = 1, color = 0xFF6600) {
    const particleCount = Math.floor(20 * size);
    const group = new THREE.Group();
    group.position.copy(position);

    const particles = [];

    for (let i = 0; i < particleCount; i++) {
      // Create particle geometry
      const geometry = new THREE.SphereGeometry(0.5 * size, 4, 4);
      const material = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 1,
      });
      const particle = new THREE.Mesh(geometry, material);

      // Random direction
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const speed = randomRange(5, 15) * size;

      particle.userData = {
        velocity: new THREE.Vector3(
          Math.sin(phi) * Math.cos(theta) * speed,
          Math.sin(phi) * Math.sin(theta) * speed,
          Math.cos(phi) * speed
        ),
        life: 1,
        decay: randomRange(0.5, 1.5),
      };

      group.add(particle);
      particles.push(particle);
    }

    // Add flash
    const flashGeometry = new THREE.SphereGeometry(3 * size, 16, 16);
    const flashMaterial = new THREE.MeshBasicMaterial({
      color: 0xFFFF00,
      transparent: true,
      opacity: 0.8,
    });
    const flash = new THREE.Mesh(flashGeometry, flashMaterial);
    flash.userData = {
      isFlash: true,
      life: 1,
      decay: 5,
    };
    group.add(flash);
    particles.push(flash);

    this.scene.add(group);

    this.particles.push({
      group,
      particles,
      age: 0,
      maxAge: 2,
    });

    return group;
  }

  /**
   * Create debris particles
   */
  createDebris(position, count = 10) {
    const group = new THREE.Group();
    group.position.copy(position);

    const particles = [];

    for (let i = 0; i < count; i++) {
      // Create debris geometry (random shapes)
      const size = randomRange(0.3, 1);
      const geometry = Math.random() > 0.5
        ? new THREE.BoxGeometry(size, size, size)
        : new THREE.TetrahedronGeometry(size);

      const material = new THREE.MeshStandardMaterial({
        color: 0x666666,
        roughness: 0.8,
        metalness: 0.3,
      });

      const particle = new THREE.Mesh(geometry, material);
      particle.castShadow = true;

      // Random direction and spin
      const speed = randomRange(3, 8);
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;

      particle.userData = {
        velocity: new THREE.Vector3(
          Math.sin(phi) * Math.cos(theta) * speed,
          Math.sin(phi) * Math.sin(theta) * speed + 2, // Upward bias
          Math.cos(phi) * speed
        ),
        spin: new THREE.Vector3(
          randomRange(-3, 3),
          randomRange(-3, 3),
          randomRange(-3, 3)
        ),
        life: 1,
        decay: randomRange(0.2, 0.5),
      };

      group.add(particle);
      particles.push(particle);
    }

    this.scene.add(group);

    this.particles.push({
      group,
      particles,
      age: 0,
      maxAge: 4,
    });

    return group;
  }

  /**
   * Create muzzle flash
   */
  createMuzzleFlash(position, direction) {
    const group = new THREE.Group();
    group.position.copy(position);

    // Flash sprite
    const flashGeometry = new THREE.PlaneGeometry(2, 2);
    const flashMaterial = new THREE.MeshBasicMaterial({
      color: 0xFFFF00,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide,
    });
    const flash = new THREE.Mesh(flashGeometry, flashMaterial);
    flash.lookAt(direction);
    flash.userData = {
      life: 1,
      decay: 15,
    };
    group.add(flash);

    this.scene.add(group);

    this.particles.push({
      group,
      particles: [flash],
      age: 0,
      maxAge: 0.1,
    });

    return group;
  }

  /**
   * Create smoke trail
   */
  createSmokeTrail(position) {
    const group = new THREE.Group();
    group.position.copy(position);

    const geometry = new THREE.SphereGeometry(1, 8, 8);
    const material = new THREE.MeshBasicMaterial({
      color: 0x888888,
      transparent: true,
      opacity: 0.5,
    });
    const smoke = new THREE.Mesh(geometry, material);

    smoke.userData = {
      velocity: new THREE.Vector3(
        randomRange(-0.5, 0.5),
        randomRange(0.5, 2),
        randomRange(-0.5, 0.5)
      ),
      life: 1,
      decay: 0.5,
      grow: 2,
    };

    group.add(smoke);

    this.scene.add(group);

    this.particles.push({
      group,
      particles: [smoke],
      age: 0,
      maxAge: 3,
    });

    return group;
  }

  /**
   * Update all particles
   */
  update(deltaTime) {
    // Update each particle group
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particleGroup = this.particles[i];
      particleGroup.age += deltaTime;

      // Check if expired
      if (particleGroup.age >= particleGroup.maxAge) {
        this.removeParticleGroup(i);
        continue;
      }

      // Update individual particles
      for (const particle of particleGroup.particles) {
        const data = particle.userData;

        // Update life
        data.life -= data.decay * deltaTime;

        if (data.life <= 0) {
          particle.visible = false;
          continue;
        }

        // Apply velocity
        if (data.velocity) {
          particle.position.add(data.velocity.clone().multiplyScalar(deltaTime));
        }

        // Apply spin
        if (data.spin) {
          particle.rotation.x += data.spin.x * deltaTime;
          particle.rotation.y += data.spin.y * deltaTime;
          particle.rotation.z += data.spin.z * deltaTime;
        }

        // Apply growth
        if (data.grow) {
          const scale = 1 + data.grow * (1 - data.life);
          particle.scale.setScalar(scale);
        }

        // Update opacity
        if (particle.material) {
          particle.material.opacity = data.life;

          // Flash effect - shrink quickly
          if (data.isFlash) {
            particle.scale.setScalar(data.life * 3);
          }
        }
      }
    }
  }

  /**
   * Remove a particle group
   */
  removeParticleGroup(index) {
    const particleGroup = this.particles[index];

    // Remove from scene
    this.scene.remove(particleGroup.group);

    // Dispose geometries and materials
    for (const particle of particleGroup.particles) {
      if (particle.geometry) particle.geometry.dispose();
      if (particle.material) particle.material.dispose();
    }

    // Remove from array
    this.particles.splice(index, 1);
  }

  /**
   * Clear all particles
   */
  clear() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      this.removeParticleGroup(i);
    }
  }

  /**
   * Dispose
   */
  dispose() {
    this.clear();
  }
}
