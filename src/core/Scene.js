/**
 * Scene Manager
 * Sets up the 3D scene with space environment
 */

import * as THREE from 'three';
import { randomRange, randomPointOnSphere } from '../utils/MathUtils.js';

export class SceneManager {
  constructor(container) {
    this.container = container;
    this.scene = new THREE.Scene();
    this.camera = null;
    this.renderer = null;

    // Store references for updates
    this.stars = null;
    this.earth = null;
    this.sun = null;

    this.init();
  }

  init() {
    // Scene setup - space background
    this.scene.background = new THREE.Color(0x000510);

    // Camera
    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      2000
    );
    this.camera.position.set(0, 30, 100);
    this.camera.lookAt(0, 0, 0);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;

    this.container.appendChild(this.renderer.domElement);

    // Setup scene elements
    this.createStarfield();
    this.createEarth();
    this.setupLighting();

    // Resize handler
    window.addEventListener('resize', () => this.onResize());
  }

  /**
   * Create starfield background
   */
  createStarfield() {
    const starCount = 5000;
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    const sizes = new Float32Array(starCount);

    for (let i = 0; i < starCount; i++) {
      // Random position on a large sphere
      const radius = randomRange(500, 1500);
      const point = randomPointOnSphere(radius);

      positions[i * 3] = point.x;
      positions[i * 3 + 1] = point.y;
      positions[i * 3 + 2] = point.z;

      // Random star color (white to slightly blue/yellow)
      const colorVariation = Math.random();
      if (colorVariation < 0.7) {
        // White stars
        colors[i * 3] = 1;
        colors[i * 3 + 1] = 1;
        colors[i * 3 + 2] = 1;
      } else if (colorVariation < 0.85) {
        // Blue-ish stars
        colors[i * 3] = 0.8;
        colors[i * 3 + 1] = 0.9;
        colors[i * 3 + 2] = 1;
      } else {
        // Yellow-ish stars
        colors[i * 3] = 1;
        colors[i * 3 + 1] = 0.95;
        colors[i * 3 + 2] = 0.8;
      }

      // Random size
      sizes[i] = randomRange(0.5, 2);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
      size: 1.5,
      sizeAttenuation: true,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
    });

    this.stars = new THREE.Points(geometry, material);
    this.scene.add(this.stars);
  }

  /**
   * Create Earth in the background
   */
  createEarth() {
    // Earth sphere
    const earthGeometry = new THREE.SphereGeometry(200, 64, 64);

    // Create a simple earth-like texture with colors
    const earthMaterial = new THREE.MeshStandardMaterial({
      color: 0x2233AA,
      roughness: 0.8,
      metalness: 0.1,
    });

    this.earth = new THREE.Mesh(earthGeometry, earthMaterial);
    this.earth.position.set(-400, -150, -600);

    // Add atmosphere glow
    const atmosphereGeometry = new THREE.SphereGeometry(210, 64, 64);
    const atmosphereMaterial = new THREE.MeshBasicMaterial({
      color: 0x4488FF,
      transparent: true,
      opacity: 0.15,
      side: THREE.BackSide,
    });
    const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    this.earth.add(atmosphere);

    // Add land masses using additional geometry
    const landGeometry = new THREE.SphereGeometry(201, 32, 32);
    const landMaterial = new THREE.MeshStandardMaterial({
      color: 0x228833,
      roughness: 0.9,
    });
    const land = new THREE.Mesh(landGeometry, landMaterial);
    // Partially visible land
    land.scale.set(0.3, 0.4, 0.3);
    land.position.set(100, 50, 150);
    this.earth.add(land);

    // Add clouds
    const cloudsGeometry = new THREE.SphereGeometry(205, 32, 32);
    const cloudsMaterial = new THREE.MeshBasicMaterial({
      color: 0xFFFFFF,
      transparent: true,
      opacity: 0.3,
    });
    const clouds = new THREE.Mesh(cloudsGeometry, cloudsMaterial);
    this.earth.add(clouds);
    this.earthClouds = clouds;

    this.scene.add(this.earth);
  }

  /**
   * Setup scene lighting
   */
  setupLighting() {
    // Ambient light (very dim for space)
    const ambient = new THREE.AmbientLight(0x222244, 0.3);
    this.scene.add(ambient);

    // Sun light (main directional light)
    this.sun = new THREE.DirectionalLight(0xFFFFEE, 1.5);
    this.sun.position.set(500, 200, 300);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.width = 4096;
    this.sun.shadow.mapSize.height = 4096;
    this.sun.shadow.camera.near = 100;
    this.sun.shadow.camera.far = 1500;
    this.sun.shadow.camera.left = -200;
    this.sun.shadow.camera.right = 200;
    this.sun.shadow.camera.top = 200;
    this.sun.shadow.camera.bottom = -200;
    this.scene.add(this.sun);

    // Sun visual
    const sunGlowGeometry = new THREE.SphereGeometry(30, 32, 32);
    const sunGlowMaterial = new THREE.MeshBasicMaterial({
      color: 0xFFFFAA,
      transparent: true,
      opacity: 0.8,
    });
    const sunGlow = new THREE.Mesh(sunGlowGeometry, sunGlowMaterial);
    sunGlow.position.copy(this.sun.position);
    this.scene.add(sunGlow);

    // Hemisphere light for better ambient
    const hemiLight = new THREE.HemisphereLight(0x6688CC, 0x222233, 0.4);
    this.scene.add(hemiLight);

    // Fill light from Earth reflection
    const earthLight = new THREE.PointLight(0x4488FF, 0.3, 500);
    earthLight.position.set(-200, -100, -300);
    this.scene.add(earthLight);
  }

  /**
   * Handle window resize
   */
  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  /**
   * Add object to scene
   */
  add(object) {
    this.scene.add(object);
  }

  /**
   * Remove object from scene
   */
  remove(object) {
    this.scene.remove(object);
  }

  /**
   * Update scene elements
   */
  update(deltaTime) {
    // Slowly rotate stars for subtle effect
    if (this.stars) {
      this.stars.rotation.y += deltaTime * 0.001;
    }

    // Rotate Earth slowly
    if (this.earth) {
      this.earth.rotation.y += deltaTime * 0.01;
    }

    // Rotate Earth's clouds
    if (this.earthClouds) {
      this.earthClouds.rotation.y += deltaTime * 0.005;
    }
  }

  /**
   * Render the scene
   */
  render() {
    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Get renderer DOM element
   */
  getDomElement() {
    return this.renderer.domElement;
  }
}
