/**
 * Zaku II Mobile Suit
 * The iconic MS-06 from Mobile Suit Gundam
 * Built with Three.js basic geometries
 */

import * as THREE from 'three';
import { ZAKU_COLORS, MOVEMENT, WEAPONS } from '../utils/Constants.js';
import { lerp, normalizeAngle } from '../utils/MathUtils.js';

export class Zaku {
  constructor() {
    // Root group
    this.group = new THREE.Group();

    // Parts reference
    this.parts = {};

    // Animation state
    this.monoeyeAngle = 0;
    this.monoeyeDirection = 1;
    this.idleHover = 0; // Idle floating animation

    // Movement state
    this.velocity = new THREE.Vector3();
    this.targetRotation = 0;
    this.currentRotation = 0;
    this.isMoving = false;
    this.isBoosting = false;

    // Space flight rotation state
    this.pitch = 0; // Forward/backward tilt
    this.roll = 0;  // Left/right tilt
    this.targetPitch = 0;
    this.targetRoll = 0;

    // Boost state
    this.boostEnergy = 100;
    this.maxBoostEnergy = 100;
    this.boostRegenRate = 15; // per second
    this.boostDrainRate = 25; // per second

    // Firing state
    this.isFiring = false;
    this.muzzleFlash = null;
    this.muzzleParticles = [];
    this.lastFireTime = 0;
    this.fireRate = WEAPONS.machineGun.fireRate;

    // Bullet/Projectile state
    this.bullets = [];
    this.bulletSpeed = 150;  // Units per second
    this.bulletRange = WEAPONS.machineGun.range;  // 3x Zaku height (60 units)
    this.bulletDamage = WEAPONS.machineGun.damage;

    // Space flight animation config
    this.animConfig = {
      maxTiltAngle: 0.6,      // Max body tilt angle (about 35 degrees)
      boostTiltAngle: 0.9,    // Max tilt angle when boosting (about 50 degrees)
      tiltSpeed: 4,           // How fast to tilt
      hoverAmplitude: 0.3,    // Idle hover amount
      hoverSpeed: 2,          // Idle hover speed
    };

    // Create the Zaku model
    this.createZaku();
  }

  /**
   * Create materials with proper colors
   */
  createMaterials() {
    return {
      main: new THREE.MeshStandardMaterial({
        color: ZAKU_COLORS.main,
        roughness: 0.6,
        metalness: 0.4,
      }),
      dark: new THREE.MeshStandardMaterial({
        color: ZAKU_COLORS.dark,
        roughness: 0.7,
        metalness: 0.3,
      }),
      light: new THREE.MeshStandardMaterial({
        color: ZAKU_COLORS.light,
        roughness: 0.5,
        metalness: 0.5,
      }),
      monoeye: new THREE.MeshBasicMaterial({
        color: ZAKU_COLORS.monoeye,
        emissive: ZAKU_COLORS.monoeye,
        emissiveIntensity: 2,
      }),
      spike: new THREE.MeshStandardMaterial({
        color: ZAKU_COLORS.spike,
        roughness: 0.3,
        metalness: 0.8,
      }),
      vernier: new THREE.MeshBasicMaterial({
        color: ZAKU_COLORS.vernierFlame,
        transparent: true,
        opacity: 0.8,
      }),
      gunMetal: new THREE.MeshStandardMaterial({
        color: 0x2A2A2A,
        roughness: 0.4,
        metalness: 0.8,
      }),
      gunBody: new THREE.MeshStandardMaterial({
        color: 0x3A3A3A,
        roughness: 0.5,
        metalness: 0.6,
      }),
    };
  }

  /**
   * Create Zaku Machine Gun
   */
  createMachineGun(mats) {
    const gunGroup = new THREE.Group();

    // Main body (receiver)
    const bodyGeom = new THREE.BoxGeometry(0.8, 1.2, 3);
    const body = new THREE.Mesh(bodyGeom, mats.gunBody);
    body.position.set(0, 0, 0);
    gunGroup.add(body);

    // Barrel (long cylinder)
    const barrelGeom = new THREE.CylinderGeometry(0.2, 0.25, 5, 8);
    const barrel = new THREE.Mesh(barrelGeom, mats.gunMetal);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.2, 3.5);
    gunGroup.add(barrel);

    // Barrel tip / muzzle
    const muzzleGeom = new THREE.CylinderGeometry(0.3, 0.2, 0.5, 8);
    const muzzle = new THREE.Mesh(muzzleGeom, mats.gunMetal);
    muzzle.rotation.x = Math.PI / 2;
    muzzle.position.set(0, 0.2, 6.2);
    gunGroup.add(muzzle);

    // Magazine (drum type)
    const magGeom = new THREE.CylinderGeometry(0.6, 0.6, 1.5, 12);
    const magazine = new THREE.Mesh(magGeom, mats.gunMetal);
    magazine.position.set(0, -1, 0);
    gunGroup.add(magazine);

    // Grip (handle)
    const gripGeom = new THREE.BoxGeometry(0.5, 1.5, 0.8);
    const grip = new THREE.Mesh(gripGeom, mats.dark);
    grip.position.set(0, -0.8, -1);
    grip.rotation.x = 0.3;
    gunGroup.add(grip);

    // Stock (rear part)
    const stockGeom = new THREE.BoxGeometry(0.6, 0.8, 1.5);
    const stock = new THREE.Mesh(stockGeom, mats.gunBody);
    stock.position.set(0, 0, -2);
    gunGroup.add(stock);

    // Foregrip (where left hand holds)
    const foregripGeom = new THREE.BoxGeometry(0.4, 0.6, 1);
    const foregrip = new THREE.Mesh(foregripGeom, mats.dark);
    foregrip.position.set(0, -0.5, 2);
    gunGroup.add(foregrip);

    // Sight
    const sightGeom = new THREE.BoxGeometry(0.2, 0.3, 0.5);
    const sight = new THREE.Mesh(sightGeom, mats.gunMetal);
    sight.position.set(0, 0.8, 0.5);
    gunGroup.add(sight);

    // Muzzle flash point (for particle effects)
    const muzzlePoint = new THREE.Group();
    muzzlePoint.position.set(0, 0.2, 6.5);
    muzzlePoint.name = 'muzzlePoint';
    gunGroup.add(muzzlePoint);

    // Muzzle flash light
    const muzzleFlash = new THREE.PointLight(0xff4400, 0, 10);
    muzzleFlash.position.copy(muzzlePoint.position);
    muzzleFlash.name = 'muzzleFlash';
    gunGroup.add(muzzleFlash);

    // Muzzle flash mesh (sprite-like)
    const flashGeom = new THREE.SphereGeometry(0.5, 8, 8);
    const flashMat = new THREE.MeshBasicMaterial({
      color: 0xff6600,
      transparent: true,
      opacity: 0,
    });
    const flashMesh = new THREE.Mesh(flashGeom, flashMat);
    flashMesh.position.copy(muzzlePoint.position);
    flashMesh.name = 'flashMesh';
    gunGroup.add(flashMesh);

    // Set shadows
    gunGroup.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    return gunGroup;
  }

  /**
   * Create muzzle flash particles
   */
  createMuzzleParticles() {
    const particles = [];
    const particleCount = 8;

    for (let i = 0; i < particleCount; i++) {
      const geom = new THREE.SphereGeometry(0.1 + Math.random() * 0.15, 6, 6);
      const mat = new THREE.MeshBasicMaterial({
        color: new THREE.Color().setHSL(0.05 + Math.random() * 0.05, 1, 0.5 + Math.random() * 0.3),
        transparent: true,
        opacity: 1,
      });
      const particle = new THREE.Mesh(geom, mat);
      particle.visible = false;
      particle.userData = {
        velocity: new THREE.Vector3(),
        life: 0,
        maxLife: 0,
      };
      particles.push(particle);
    }

    return particles;
  }

  /**
   * Fire weapon - create muzzle flash, particles and bullet
   */
  fire() {
    const now = Date.now();
    if (now - this.lastFireTime < this.fireRate) return false;
    this.lastFireTime = now;

    // Get muzzle flash components
    const muzzleFlash = this.parts.machineGun.getObjectByName('muzzleFlash');
    const flashMesh = this.parts.machineGun.getObjectByName('flashMesh');

    if (muzzleFlash) {
      muzzleFlash.intensity = 3;
    }

    if (flashMesh) {
      flashMesh.material.opacity = 0.9;
      flashMesh.scale.setScalar(1 + Math.random() * 0.5);
    }

    // Spawn bullet projectile
    this.spawnBullet();

    // Spawn particles
    this.spawnMuzzleParticles();

    // Play sound
    this.playFireSound();

    // Add recoil animation
    this.applyRecoil();

    this.isFiring = true;
    return true;
  }

  /**
   * Create a bullet mesh
   */
  createBulletMesh() {
    const geometry = new THREE.CylinderGeometry(0.1, 0.1, 1, 6);
    const material = new THREE.MeshBasicMaterial({
      color: 0xffff00,
      emissive: 0xffff00,
    });
    const bullet = new THREE.Mesh(geometry, material);
    bullet.rotation.x = Math.PI / 2; // Point forward
    return bullet;
  }

  /**
   * Spawn a bullet from muzzle point
   */
  spawnBullet() {
    const muzzlePoint = this.parts.machineGun.getObjectByName('muzzlePoint');
    if (!muzzlePoint) return;

    // Get world position and direction of muzzle
    const startPos = new THREE.Vector3();
    muzzlePoint.getWorldPosition(startPos);

    const direction = new THREE.Vector3(0, 0, 1);
    muzzlePoint.getWorldDirection(direction);

    // Create bullet
    const bullet = this.createBulletMesh();
    bullet.position.copy(startPos);
    bullet.lookAt(startPos.clone().add(direction));

    // Store bullet data
    bullet.userData = {
      startPosition: startPos.clone(),
      direction: direction.normalize(),
      distanceTraveled: 0,
      maxDistance: this.bulletRange,
      damage: this.bulletDamage,
      speed: this.bulletSpeed,
    };

    this.bullets.push(bullet);

    // Add bullet to scene
    if (this.bulletScene) {
      this.bulletScene.add(bullet);
    }

    return bullet;
  }

  /**
   * Update bullets - move and check range
   */
  updateBullets(deltaTime) {
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const bullet = this.bullets[i];
      const moveDistance = bullet.userData.speed * deltaTime;

      // Move bullet
      bullet.position.add(
        bullet.userData.direction.clone().multiplyScalar(moveDistance)
      );
      bullet.userData.distanceTraveled += moveDistance;

      // Check if bullet exceeded range
      if (bullet.userData.distanceTraveled >= bullet.userData.maxDistance) {
        // Remove bullet
        if (bullet.parent) {
          bullet.parent.remove(bullet);
        }
        bullet.geometry.dispose();
        bullet.material.dispose();
        this.bullets.splice(i, 1);
      }
    }
  }

  /**
   * Add bullets to scene
   */
  initBullets(scene) {
    this.bulletScene = scene;
  }

  /**
   * Get active bullets for collision detection
   */
  getBullets() {
    return this.bullets;
  }

  /**
   * Spawn muzzle particles
   */
  spawnMuzzleParticles() {
    const muzzlePoint = this.parts.machineGun.getObjectByName('muzzlePoint');
    if (!muzzlePoint) return;

    // Get world position of muzzle
    const worldPos = new THREE.Vector3();
    muzzlePoint.getWorldPosition(worldPos);

    // Get forward direction
    const worldDir = new THREE.Vector3(0, 0, 1);
    muzzlePoint.getWorldDirection(worldDir);

    for (const particle of this.muzzleParticles) {
      if (particle.userData.life <= 0) {
        particle.visible = true;
        particle.position.copy(worldPos);

        // Random velocity in cone shape
        const spread = 0.3;
        particle.userData.velocity.set(
          (Math.random() - 0.5) * spread,
          (Math.random() - 0.5) * spread,
          Math.random() * 2 + 1
        );
        particle.userData.velocity.applyQuaternion(this.parts.machineGun.getWorldQuaternion(new THREE.Quaternion()));

        particle.userData.life = 0.3 + Math.random() * 0.2;
        particle.userData.maxLife = particle.userData.life;
        particle.scale.setScalar(1);

        // Randomize color (red-orange-yellow)
        particle.material.color.setHSL(0.02 + Math.random() * 0.08, 1, 0.5 + Math.random() * 0.3);
        particle.material.opacity = 1;
        break; // Spawn one particle per frame
      }
    }
  }

  /**
   * Update muzzle particles
   */
  updateMuzzleParticles(deltaTime) {
    for (const particle of this.muzzleParticles) {
      if (particle.userData.life > 0) {
        particle.userData.life -= deltaTime;

        // Move particle
        particle.position.add(
          particle.userData.velocity.clone().multiplyScalar(deltaTime * 10)
        );

        // Fade out
        const lifeRatio = particle.userData.life / particle.userData.maxLife;
        particle.material.opacity = lifeRatio;
        particle.scale.setScalar(lifeRatio * 1.5);

        // Add some gravity/drag
        particle.userData.velocity.y -= deltaTime * 2;
        particle.userData.velocity.multiplyScalar(0.95);

        if (particle.userData.life <= 0) {
          particle.visible = false;
        }
      }
    }

    // Fade muzzle flash
    const muzzleFlash = this.parts.machineGun.getObjectByName('muzzleFlash');
    const flashMesh = this.parts.machineGun.getObjectByName('flashMesh');

    if (muzzleFlash && muzzleFlash.intensity > 0) {
      muzzleFlash.intensity *= 0.8;
      if (muzzleFlash.intensity < 0.1) muzzleFlash.intensity = 0;
    }

    if (flashMesh && flashMesh.material.opacity > 0) {
      flashMesh.material.opacity *= 0.8;
      if (flashMesh.material.opacity < 0.05) flashMesh.material.opacity = 0;
    }
  }

  /**
   * Apply recoil animation
   */
  applyRecoil() {
    // Small backward kick to the gun
    if (this.parts.machineGun) {
      this.parts.machineGun.position.z -= 0.1;
      // Will be restored in update
    }
  }

  /**
   * Play firing sound using Web Audio API
   */
  playFireSound() {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

      // Create noise for gunshot
      const bufferSize = audioCtx.sampleRate * 0.1; // 0.1 second
      const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const data = buffer.getChannelData(0);

      // Generate noise with decay
      for (let i = 0; i < bufferSize; i++) {
        const t = i / bufferSize;
        data[i] = (Math.random() * 2 - 1) * Math.exp(-t * 20);
      }

      const noise = audioCtx.createBufferSource();
      noise.buffer = buffer;

      // Low-pass filter for bass punch
      const lowpass = audioCtx.createBiquadFilter();
      lowpass.type = 'lowpass';
      lowpass.frequency.value = 1000;

      // High-pass for crack
      const highpass = audioCtx.createBiquadFilter();
      highpass.type = 'highpass';
      highpass.frequency.value = 100;

      // Gain for volume
      const gain = audioCtx.createGain();
      gain.gain.value = 0.3;

      // Connect
      noise.connect(lowpass);
      lowpass.connect(highpass);
      highpass.connect(gain);
      gain.connect(audioCtx.destination);

      noise.start();
      noise.stop(audioCtx.currentTime + 0.1);

      // Cleanup
      setTimeout(() => audioCtx.close(), 200);
    } catch (e) {
      // Audio not supported or blocked
    }
  }

  /**
   * Add particles to scene
   */
  initParticles(scene) {
    this.muzzleParticles = this.createMuzzleParticles();
    for (const particle of this.muzzleParticles) {
      scene.add(particle);
    }
  }

  /**
   * Build the Zaku model
   */
  createZaku() {
    const mats = this.createMaterials();

    // ============================================
    // TORSO (Root of upper body)
    // ============================================
    const torsoGeom = new THREE.BoxGeometry(4, 5, 3);
    this.parts.torso = new THREE.Mesh(torsoGeom, mats.main);
    this.parts.torso.position.y = 10;
    this.parts.torso.rotation.y = Math.PI; // Rotate 180 degrees to face forward
    this.parts.torso.castShadow = true;
    this.group.add(this.parts.torso);

    // Chest armor detail
    const chestGeom = new THREE.BoxGeometry(4.2, 2, 1);
    const chest = new THREE.Mesh(chestGeom, mats.light);
    chest.position.set(0, 1, 1.5);
    chest.castShadow = true;
    this.parts.torso.add(chest);

    // ============================================
    // HEAD
    // ============================================
    // Head base (sphere)
    const headGeom = new THREE.SphereGeometry(1.5, 16, 16);
    this.parts.head = new THREE.Mesh(headGeom, mats.main);
    this.parts.head.position.y = 4;
    this.parts.head.castShadow = true;
    this.parts.torso.add(this.parts.head);

    // Head visor (where monoeye sits)
    const visorGeom = new THREE.BoxGeometry(2.5, 0.8, 1.2);
    const visor = new THREE.Mesh(visorGeom, mats.dark);
    visor.position.set(0, 0, 1);
    this.parts.head.add(visor);

    // Monoeye
    const monoeyeGeom = new THREE.SphereGeometry(0.3, 12, 12);
    this.parts.monoeye = new THREE.Mesh(monoeyeGeom, mats.monoeye);
    this.parts.monoeye.position.set(0, 0, 0.5);
    visor.add(this.parts.monoeye);

    // Monoeye glow (larger, transparent)
    const glowGeom = new THREE.SphereGeometry(0.5, 12, 12);
    const glowMat = new THREE.MeshBasicMaterial({
      color: ZAKU_COLORS.monoeyeGlow,
      transparent: true,
      opacity: 0.3,
    });
    const monoeyeGlow = new THREE.Mesh(glowGeom, glowMat);
    this.parts.monoeye.add(monoeyeGlow);

    // Head antenna/pipes
    const pipeGeom = new THREE.CylinderGeometry(0.15, 0.15, 1.5, 8);
    const leftPipe = new THREE.Mesh(pipeGeom, mats.dark);
    leftPipe.position.set(-1.2, 0.5, 0);
    leftPipe.rotation.z = Math.PI / 6;
    this.parts.head.add(leftPipe);

    const rightPipe = new THREE.Mesh(pipeGeom, mats.dark);
    rightPipe.position.set(1.2, 0.5, 0);
    rightPipe.rotation.z = -Math.PI / 6;
    this.parts.head.add(rightPipe);

    // ============================================
    // SHOULDERS (swapped positions)
    // ============================================
    // Left shoulder armor (now on right side)
    this.parts.leftShoulder = new THREE.Group();
    this.parts.leftShoulder.position.set(3, 2, 0);
    this.parts.torso.add(this.parts.leftShoulder);

    const leftShoulderGeom = new THREE.SphereGeometry(1.5, 12, 12);
    const leftShoulderMesh = new THREE.Mesh(leftShoulderGeom, mats.main);
    leftShoulderMesh.scale.set(1, 0.8, 0.8);
    leftShoulderMesh.castShadow = true;
    this.parts.leftShoulder.add(leftShoulderMesh);

    // Right shoulder armor with spike (now on left side)
    this.parts.rightShoulder = new THREE.Group();
    this.parts.rightShoulder.position.set(-3, 2, 0);
    this.parts.torso.add(this.parts.rightShoulder);

    const rightShoulderGeom = new THREE.SphereGeometry(1.8, 12, 12);
    const rightShoulderMesh = new THREE.Mesh(rightShoulderGeom, mats.main);
    rightShoulderMesh.scale.set(1, 0.8, 0.8);
    rightShoulderMesh.castShadow = true;
    this.parts.rightShoulder.add(rightShoulderMesh);

    // Shoulder spike (adjusted for new position)
    const spikeGeom = new THREE.ConeGeometry(0.3, 2, 8);
    const spike = new THREE.Mesh(spikeGeom, mats.spike);
    spike.position.set(-0.8, 0.5, 0);
    spike.rotation.z = Math.PI / 3;
    spike.castShadow = true;
    this.parts.rightShoulder.add(spike);

    // ============================================
    // ARMS
    // ============================================
    // Left arm
    this.parts.leftUpperArm = this.createLimb(1, 3, mats.main);
    this.parts.leftUpperArm.position.set(0, -2, 0);
    this.parts.leftShoulder.add(this.parts.leftUpperArm);

    this.parts.leftElbow = new THREE.Group();
    this.parts.leftElbow.position.y = -1.5;
    this.parts.leftUpperArm.add(this.parts.leftElbow);

    this.parts.leftLowerArm = this.createLimb(0.8, 3, mats.main);
    this.parts.leftLowerArm.position.y = -1.5;
    this.parts.leftElbow.add(this.parts.leftLowerArm);

    // Left hand
    const handGeom = new THREE.BoxGeometry(1, 1.5, 0.8);
    this.parts.leftHand = new THREE.Mesh(handGeom, mats.dark);
    this.parts.leftHand.position.y = -2;
    this.parts.leftHand.castShadow = true;
    this.parts.leftLowerArm.add(this.parts.leftHand);

    // Right arm
    this.parts.rightUpperArm = this.createLimb(1, 3, mats.main);
    this.parts.rightUpperArm.position.set(0, -2, 0);
    this.parts.rightShoulder.add(this.parts.rightUpperArm);

    this.parts.rightElbow = new THREE.Group();
    this.parts.rightElbow.position.y = -1.5;
    this.parts.rightUpperArm.add(this.parts.rightElbow);

    this.parts.rightLowerArm = this.createLimb(0.8, 3, mats.main);
    this.parts.rightLowerArm.position.y = -1.5;
    this.parts.rightElbow.add(this.parts.rightLowerArm);

    this.parts.rightHand = new THREE.Mesh(handGeom, mats.dark);
    this.parts.rightHand.position.y = -2;
    this.parts.rightHand.castShadow = true;
    this.parts.rightLowerArm.add(this.parts.rightHand);

    // ============================================
    // MACHINE GUN (attached to right hand)
    // ============================================
    this.parts.machineGun = this.createMachineGun(mats);
    this.parts.machineGun.position.set(0, 0, 1.5);
    this.parts.machineGun.rotation.x = 0;                // Gun pointing 45 degrees down (along arm direction)
    this.parts.rightHand.add(this.parts.machineGun);

    // ============================================
    // SET SHOOTING POSE FOR ARMS (90 degrees down, gun facing front)
    // ============================================
    // Right arm: holds gun, hanging straight down
    this.parts.rightShoulder.rotation.x = 0;              // 90 degrees down (hanging)
    this.parts.rightShoulder.rotation.z = 0;              // Straight
    this.parts.rightElbow.rotation.x = 0;                 // Elbow straight

    // Left arm: hanging straight down
    this.parts.leftShoulder.rotation.x = 0;               // 90 degrees down (hanging)
    this.parts.leftShoulder.rotation.y = 0;               // Straight
    this.parts.leftShoulder.rotation.z = 0;               // Straight
    this.parts.leftElbow.rotation.x = 0;                  // Elbow straight
    this.parts.leftElbow.rotation.y = 0;

    // ============================================
    // WAIST / SKIRT
    // ============================================
    const waistGeom = new THREE.CylinderGeometry(2, 2.5, 2, 8);
    this.parts.waist = new THREE.Mesh(waistGeom, mats.dark);
    this.parts.waist.position.y = -3;
    this.parts.waist.castShadow = true;
    this.parts.torso.add(this.parts.waist);

    // Skirt armor
    const skirtGeom = new THREE.ConeGeometry(3, 2, 6);
    const skirt = new THREE.Mesh(skirtGeom, mats.main);
    skirt.position.y = -1.5;
    skirt.rotation.x = Math.PI;
    skirt.castShadow = true;
    this.parts.waist.add(skirt);

    // ============================================
    // LEGS
    // ============================================
    // Left hip pivot
    this.parts.leftHip = new THREE.Group();
    this.parts.leftHip.position.set(-1.2, -2.5, 0);
    this.parts.waist.add(this.parts.leftHip);

    this.parts.leftUpperLeg = this.createLimb(1.2, 4, mats.main);
    this.parts.leftUpperLeg.position.y = -2;
    this.parts.leftHip.add(this.parts.leftUpperLeg);

    this.parts.leftKnee = new THREE.Group();
    this.parts.leftKnee.position.y = -2;
    this.parts.leftUpperLeg.add(this.parts.leftKnee);

    this.parts.leftLowerLeg = this.createLimb(1, 4, mats.main);
    this.parts.leftLowerLeg.position.y = -2;
    this.parts.leftKnee.add(this.parts.leftLowerLeg);

    // Left foot
    const footGeom = new THREE.BoxGeometry(1.5, 1, 2.5);
    this.parts.leftFoot = new THREE.Mesh(footGeom, mats.dark);
    this.parts.leftFoot.position.set(0, -2.5, 0.3);
    this.parts.leftFoot.castShadow = true;
    this.parts.leftLowerLeg.add(this.parts.leftFoot);

    // Left foot vernier
    const vernierGeom = new THREE.CylinderGeometry(0.3, 0.5, 0.5, 8);
    const leftVernier = new THREE.Mesh(vernierGeom, mats.dark);
    leftVernier.position.set(0, -0.5, -0.5);
    this.parts.leftFoot.add(leftVernier);

    // Right hip pivot
    this.parts.rightHip = new THREE.Group();
    this.parts.rightHip.position.set(1.2, -2.5, 0);
    this.parts.waist.add(this.parts.rightHip);

    this.parts.rightUpperLeg = this.createLimb(1.2, 4, mats.main);
    this.parts.rightUpperLeg.position.y = -2;
    this.parts.rightHip.add(this.parts.rightUpperLeg);

    this.parts.rightKnee = new THREE.Group();
    this.parts.rightKnee.position.y = -2;
    this.parts.rightUpperLeg.add(this.parts.rightKnee);

    this.parts.rightLowerLeg = this.createLimb(1, 4, mats.main);
    this.parts.rightLowerLeg.position.y = -2;
    this.parts.rightKnee.add(this.parts.rightLowerLeg);

    this.parts.rightFoot = new THREE.Mesh(footGeom, mats.dark);
    this.parts.rightFoot.position.set(0, -2.5, 0.3);
    this.parts.rightFoot.castShadow = true;
    this.parts.rightLowerLeg.add(this.parts.rightFoot);

    const rightVernier = new THREE.Mesh(vernierGeom, mats.dark);
    rightVernier.position.set(0, -0.5, -0.5);
    this.parts.rightFoot.add(rightVernier);

    // ============================================
    // BACKPACK
    // ============================================
    const backpackGeom = new THREE.BoxGeometry(3, 4, 2);
    this.parts.backpack = new THREE.Mesh(backpackGeom, mats.dark);
    this.parts.backpack.position.set(0, 0, -2);
    this.parts.backpack.castShadow = true;
    this.parts.torso.add(this.parts.backpack);

    // Vernier thrusters
    const thrusterGeom = new THREE.CylinderGeometry(0.5, 0.8, 1.5, 8);

    const leftThruster = new THREE.Mesh(thrusterGeom, mats.dark);
    leftThruster.position.set(-1, -1.5, 0);
    leftThruster.rotation.x = Math.PI / 2;
    this.parts.backpack.add(leftThruster);

    const rightThruster = new THREE.Mesh(thrusterGeom, mats.dark);
    rightThruster.position.set(1, -1.5, 0);
    rightThruster.rotation.x = Math.PI / 2;
    this.parts.backpack.add(rightThruster);

    // Vernier flames (hidden by default)
    this.parts.leftFlame = this.createVernierFlame();
    this.parts.leftFlame.position.set(-1, -1.5, -1);
    this.parts.leftFlame.visible = false;
    this.parts.backpack.add(this.parts.leftFlame);

    this.parts.rightFlame = this.createVernierFlame();
    this.parts.rightFlame.position.set(1, -1.5, -1);
    this.parts.rightFlame.visible = false;
    this.parts.backpack.add(this.parts.rightFlame);

    // Set shadows for all meshes
    this.group.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }

  /**
   * Create a limb segment (arm or leg)
   */
  createLimb(radius, length, material) {
    const geometry = new THREE.CylinderGeometry(radius * 0.8, radius, length, 8);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    return mesh;
  }

  /**
   * Create vernier flame effect
   */
  createVernierFlame() {
    const group = new THREE.Group();

    // Inner flame (bright)
    const innerGeom = new THREE.ConeGeometry(0.4, 2, 8);
    const innerMat = new THREE.MeshBasicMaterial({
      color: 0xFFFF00,
      transparent: true,
      opacity: 0.9,
    });
    const inner = new THREE.Mesh(innerGeom, innerMat);
    inner.rotation.x = Math.PI / 2;
    group.add(inner);

    // Outer flame
    const outerGeom = new THREE.ConeGeometry(0.6, 3, 8);
    const outerMat = new THREE.MeshBasicMaterial({
      color: 0xFF6600,
      transparent: true,
      opacity: 0.6,
    });
    const outer = new THREE.Mesh(outerGeom, outerMat);
    outer.rotation.x = Math.PI / 2;
    outer.position.z = -0.5;
    group.add(outer);

    return group;
  }

  /**
   * Add to scene
   */
  addToScene(scene) {
    scene.add(this.group);
  }

  /**
   * Remove from scene
   */
  removeFromScene(scene) {
    scene.remove(this.group);
  }

  /**
   * Set position
   */
  setPosition(x, y, z) {
    this.group.position.set(x, y, z);
  }

  /**
   * Get position
   */
  getPosition() {
    return this.group.position.clone();
  }

  /**
   * Set rotation (Y axis)
   */
  setRotation(y) {
    this.group.rotation.y = y;
    this.currentRotation = y;
  }

  /**
   * Get rotation
   */
  getRotation() {
    return this.group.rotation.y;
  }

  /**
   * Process movement input and update position (Space Flight Mode)
   */
  processMovement(input, deltaTime) {
    // Calculate movement direction
    const moveX = input.right - input.left;
    const moveZ = input.backward - input.forward;
    const moveY = input.up - input.down;
    const rotation = input.rotateRight - input.rotateLeft;

    this.isMoving = moveX !== 0 || moveZ !== 0 || moveY !== 0;
    this.isBoosting = input.boost && this.boostEnergy > 0;

    // Handle boost energy
    if (this.isBoosting) {
      this.boostEnergy = Math.max(0, this.boostEnergy - this.boostDrainRate * deltaTime);
    } else {
      this.boostEnergy = Math.min(this.maxBoostEnergy, this.boostEnergy + this.boostRegenRate * deltaTime);
    }

    // Calculate speed
    const speed = this.isBoosting ? MOVEMENT.boostSpeed : MOVEMENT.normalSpeed;
    const inertia = this.isBoosting ? MOVEMENT.boostInertia : MOVEMENT.inertia;

    // Handle rotation (yaw)
    if (rotation !== 0) {
      this.targetRotation += rotation * MOVEMENT.rotationSpeed * deltaTime;
    }

    // Smooth yaw rotation
    let rotDiff = normalizeAngle(this.targetRotation - this.currentRotation);
    this.currentRotation += rotDiff * 5 * deltaTime;

    // Calculate target tilt angles based on movement
    // Forward movement: head tilts forward (down), boosters point backward-down
    const tiltAngle = this.isBoosting ? this.animConfig.boostTiltAngle : this.animConfig.maxTiltAngle;
    this.targetPitch = moveZ * tiltAngle;
    this.targetRoll = -moveX * tiltAngle;

    // Smooth pitch and roll
    this.pitch = lerp(this.pitch, this.targetPitch, this.animConfig.tiltSpeed * deltaTime);
    this.roll = lerp(this.roll, this.targetRoll, this.animConfig.tiltSpeed * deltaTime);

    // Apply combined rotation (yaw + pitch + roll)
    this.group.rotation.set(this.pitch, this.currentRotation, this.roll);

    // Calculate target velocity in local space
    const targetVelocity = new THREE.Vector3(moveX, moveY, moveZ);
    if (targetVelocity.length() > 0) {
      targetVelocity.normalize().multiplyScalar(speed);
    }

    // Transform to world space
    targetVelocity.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.currentRotation);

    // Apply inertia (space has no friction, so high inertia)
    this.velocity.lerp(targetVelocity, 1 - inertia);

    // Update position
    const movement = this.velocity.clone().multiplyScalar(deltaTime);
    this.group.position.add(movement);

    // Vernier flames visibility - show when moving or boosting
    const showFlames = this.isMoving || this.isBoosting || this.velocity.length() > 0.5;
    this.parts.leftFlame.visible = showFlames;
    this.parts.rightFlame.visible = showFlames;

    // Animate flames based on thrust intensity
    if (showFlames) {
      const baseScale = this.isBoosting ? 1.5 : 0.6;
      const flameScale = baseScale + Math.random() * 0.3;
      this.parts.leftFlame.scale.setScalar(flameScale);
      this.parts.rightFlame.scale.setScalar(flameScale);
    }
  }

  /**
   * Update space flight animation
   */
  updateAnimation(deltaTime) {
    // Monoeye scanning animation
    this.monoeyeAngle += this.monoeyeDirection * deltaTime * 0.5;
    if (Math.abs(this.monoeyeAngle) > 0.8) {
      this.monoeyeDirection *= -1;
    }
    this.parts.monoeye.position.x = Math.sin(this.monoeyeAngle) * 0.5;

    // Idle hover animation (subtle floating in space)
    this.idleHover += deltaTime * this.animConfig.hoverSpeed;

    // Base shooting pose values (90 degrees down, gun facing front)
    const shootingPose = {
      rightShoulder: { x: 0, y: 0, z: 0 },
      rightElbow: { x: 0, y: 0, z: 0 },
      leftShoulder: { x: 0, y: 0, z: 0 },
      leftElbow: { x: 0, y: 0, z: 0 },
    };

    // Subtle breathing/sway animation for shooting pose
    const breathe = Math.sin(this.idleHover * 0.8) * 0.02;

    // Apply space flight pose while maintaining shooting stance
    if (this.isBoosting) {
      // High-speed boost pose: tuck arms slightly but keep gun forward
      this.parts.rightShoulder.rotation.x = lerp(this.parts.rightShoulder.rotation.x, shootingPose.rightShoulder.x + 0.3, deltaTime * 5);
      this.parts.rightShoulder.rotation.z = lerp(this.parts.rightShoulder.rotation.z, shootingPose.rightShoulder.z, deltaTime * 5);
      this.parts.rightElbow.rotation.x = lerp(this.parts.rightElbow.rotation.x, shootingPose.rightElbow.x + 0.2, deltaTime * 5);

      this.parts.leftShoulder.rotation.x = lerp(this.parts.leftShoulder.rotation.x, shootingPose.leftShoulder.x + 0.3, deltaTime * 5);
      this.parts.leftShoulder.rotation.y = lerp(this.parts.leftShoulder.rotation.y, shootingPose.leftShoulder.y, deltaTime * 5);
      this.parts.leftShoulder.rotation.z = lerp(this.parts.leftShoulder.rotation.z, shootingPose.leftShoulder.z, deltaTime * 5);
      this.parts.leftElbow.rotation.x = lerp(this.parts.leftElbow.rotation.x, shootingPose.leftElbow.x, deltaTime * 5);
      this.parts.leftElbow.rotation.y = lerp(this.parts.leftElbow.rotation.y, shootingPose.leftElbow.y, deltaTime * 5);

      // Legs together and slightly bent back
      this.parts.leftHip.rotation.x = lerp(this.parts.leftHip.rotation.x, 0.2, deltaTime * 5);
      this.parts.rightHip.rotation.x = lerp(this.parts.rightHip.rotation.x, 0.2, deltaTime * 5);
      this.parts.leftKnee.rotation.x = lerp(this.parts.leftKnee.rotation.x, 0.3, deltaTime * 5);
      this.parts.rightKnee.rotation.x = lerp(this.parts.rightKnee.rotation.x, 0.3, deltaTime * 5);

    } else if (this.isMoving) {
      // Normal flight pose: maintain shooting stance
      this.parts.rightShoulder.rotation.x = lerp(this.parts.rightShoulder.rotation.x, shootingPose.rightShoulder.x + breathe, deltaTime * 3);
      this.parts.rightShoulder.rotation.z = lerp(this.parts.rightShoulder.rotation.z, shootingPose.rightShoulder.z, deltaTime * 3);
      this.parts.rightElbow.rotation.x = lerp(this.parts.rightElbow.rotation.x, shootingPose.rightElbow.x, deltaTime * 3);

      this.parts.leftShoulder.rotation.x = lerp(this.parts.leftShoulder.rotation.x, shootingPose.leftShoulder.x + breathe, deltaTime * 3);
      this.parts.leftShoulder.rotation.y = lerp(this.parts.leftShoulder.rotation.y, shootingPose.leftShoulder.y, deltaTime * 3);
      this.parts.leftShoulder.rotation.z = lerp(this.parts.leftShoulder.rotation.z, shootingPose.leftShoulder.z, deltaTime * 3);
      this.parts.leftElbow.rotation.x = lerp(this.parts.leftElbow.rotation.x, shootingPose.leftElbow.x, deltaTime * 3);
      this.parts.leftElbow.rotation.y = lerp(this.parts.leftElbow.rotation.y, shootingPose.leftElbow.y, deltaTime * 3);

      // Legs slightly spread for stability
      this.parts.leftHip.rotation.x = lerp(this.parts.leftHip.rotation.x, 0.1, deltaTime * 3);
      this.parts.rightHip.rotation.x = lerp(this.parts.rightHip.rotation.x, 0.1, deltaTime * 3);
      this.parts.leftHip.rotation.z = lerp(this.parts.leftHip.rotation.z || 0, -0.1, deltaTime * 3);
      this.parts.rightHip.rotation.z = lerp(this.parts.rightHip.rotation.z || 0, 0.1, deltaTime * 3);
      this.parts.leftKnee.rotation.x = lerp(this.parts.leftKnee.rotation.x, 0.2, deltaTime * 3);
      this.parts.rightKnee.rotation.x = lerp(this.parts.rightKnee.rotation.x, 0.2, deltaTime * 3);

    } else {
      // Idle floating pose: shooting stance with subtle sway
      this.parts.rightShoulder.rotation.x = lerp(this.parts.rightShoulder.rotation.x, shootingPose.rightShoulder.x + breathe, deltaTime * 2);
      this.parts.rightShoulder.rotation.z = lerp(this.parts.rightShoulder.rotation.z, shootingPose.rightShoulder.z, deltaTime * 2);
      this.parts.rightElbow.rotation.x = lerp(this.parts.rightElbow.rotation.x, shootingPose.rightElbow.x, deltaTime * 2);

      this.parts.leftShoulder.rotation.x = lerp(this.parts.leftShoulder.rotation.x, shootingPose.leftShoulder.x + breathe, deltaTime * 2);
      this.parts.leftShoulder.rotation.y = lerp(this.parts.leftShoulder.rotation.y, shootingPose.leftShoulder.y, deltaTime * 2);
      this.parts.leftShoulder.rotation.z = lerp(this.parts.leftShoulder.rotation.z, shootingPose.leftShoulder.z, deltaTime * 2);
      this.parts.leftElbow.rotation.x = lerp(this.parts.leftElbow.rotation.x, shootingPose.leftElbow.x, deltaTime * 2);
      this.parts.leftElbow.rotation.y = lerp(this.parts.leftElbow.rotation.y, shootingPose.leftElbow.y, deltaTime * 2);

      // Legs slightly bent and floating
      const legHover = Math.sin(this.idleHover * 0.5) * 0.03;
      this.parts.leftHip.rotation.x = lerp(this.parts.leftHip.rotation.x, 0.05 + legHover, deltaTime * 2);
      this.parts.rightHip.rotation.x = lerp(this.parts.rightHip.rotation.x, 0.05 - legHover, deltaTime * 2);
      this.parts.leftHip.rotation.z = lerp(this.parts.leftHip.rotation.z || 0, -0.05, deltaTime * 2);
      this.parts.rightHip.rotation.z = lerp(this.parts.rightHip.rotation.z || 0, 0.05, deltaTime * 2);
      this.parts.leftKnee.rotation.x = lerp(this.parts.leftKnee.rotation.x, 0.1, deltaTime * 2);
      this.parts.rightKnee.rotation.x = lerp(this.parts.rightKnee.rotation.x, 0.1, deltaTime * 2);
    }
  }

  /**
   * Update Zaku (called every frame)
   */
  update(deltaTime) {
    this.updateAnimation(deltaTime);
    this.updateMuzzleParticles(deltaTime);
    this.updateBullets(deltaTime);

    // Restore gun position after recoil
    if (this.parts.machineGun) {
      this.parts.machineGun.position.z = THREE.MathUtils.lerp(
        this.parts.machineGun.position.z,
        1.5, // Original position
        deltaTime * 20
      );
    }
  }

  /**
   * Get boost energy percentage (0-100)
   */
  getBoostPercentage() {
    return (this.boostEnergy / this.maxBoostEnergy) * 100;
  }

  /**
   * Get bounding sphere for collision detection
   */
  getBoundingSphere() {
    const center = this.group.position.clone();
    center.y += 5; // Offset to center of Zaku body
    return {
      center,
      radius: 12, // Approximate radius covering Zaku body
    };
  }

  /**
   * Get the group for direct access
   */
  getGroup() {
    return this.group;
  }

  /**
   * Reset pose to default shooting stance
   */
  resetPose() {
    this.idleHover = 0;
    this.monoeyeAngle = 0;
    this.pitch = 0;
    this.roll = 0;
    this.targetPitch = 0;
    this.targetRoll = 0;

    // Reset to shooting pose (90 degrees down, gun facing front)
    this.parts.rightShoulder.rotation.set(0, 0, 0);
    this.parts.rightElbow.rotation.set(0, 0, 0);
    this.parts.leftShoulder.rotation.set(0, 0, 0);
    this.parts.leftElbow.rotation.set(0, 0, 0);

    // Reset legs
    this.parts.leftHip.rotation.set(0, 0, 0);
    this.parts.rightHip.rotation.set(0, 0, 0);
    this.parts.leftKnee.rotation.set(0, 0, 0);
    this.parts.rightKnee.rotation.set(0, 0, 0);
  }
}
