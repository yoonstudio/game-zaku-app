/**
 * Space Colony
 * O'Neill Cylinder type space colony
 */

import * as THREE from 'three';
import { COLONY, COLONY_COLORS } from '../utils/Constants.js';
import { randomRange } from '../utils/MathUtils.js';

export class Colony {
  constructor() {
    // Root group
    this.group = new THREE.Group();

    // Destructible sections with health
    this.sections = [];

    // Total colony stats
    this.totalHealth = 0;
    this.currentHealth = 0;
    this.destructionPercentage = 0;

    // Explosion particles
    this.explosionParticles = [];
    this.scene = null;

    // Build the colony
    this.createColony();
  }

  /**
   * Create materials
   */
  createMaterials() {
    return {
      hull: new THREE.MeshStandardMaterial({
        color: COLONY_COLORS.hull,
        roughness: 0.7,
        metalness: 0.5,
        side: THREE.DoubleSide,
      }),
      hullInner: new THREE.MeshStandardMaterial({
        color: 0x444444,
        roughness: 0.8,
        metalness: 0.3,
        side: THREE.BackSide,
      }),
      window: new THREE.MeshStandardMaterial({
        color: COLONY_COLORS.window,
        emissive: COLONY_COLORS.window,
        emissiveIntensity: 0.5,
        transparent: true,
        opacity: 0.8,
      }),
      solarPanel: new THREE.MeshStandardMaterial({
        color: COLONY_COLORS.solarPanel,
        roughness: 0.3,
        metalness: 0.8,
      }),
      dock: new THREE.MeshStandardMaterial({
        color: COLONY_COLORS.dock,
        roughness: 0.6,
        metalness: 0.4,
      }),
      interior: new THREE.MeshBasicMaterial({
        color: COLONY_COLORS.interior,
        transparent: true,
        opacity: 0.3,
      }),
    };
  }

  /**
   * Build the colony structure
   */
  createColony() {
    const mats = this.createMaterials();
    const { length, radius } = COLONY;

    // ============================================
    // MAIN CYLINDER
    // ============================================
    // Outer hull
    const hullGeom = new THREE.CylinderGeometry(radius, radius, length, 32, 1, true);
    const hull = new THREE.Mesh(hullGeom, mats.hull);
    hull.rotation.z = Math.PI / 2; // Horizontal cylinder
    hull.castShadow = true;
    hull.receiveShadow = true;
    this.group.add(hull);

    // Inner hull (visible from inside)
    const innerHull = new THREE.Mesh(hullGeom.clone(), mats.hullInner);
    innerHull.rotation.z = Math.PI / 2;
    this.group.add(innerHull);

    // End caps
    const endCapGeom = new THREE.CircleGeometry(radius, 32);

    const frontCap = new THREE.Mesh(endCapGeom, mats.dock);
    frontCap.position.x = length / 2;
    frontCap.rotation.y = Math.PI / 2;
    frontCap.castShadow = true;
    this.group.add(frontCap);

    const backCap = new THREE.Mesh(endCapGeom, mats.dock);
    backCap.position.x = -length / 2;
    backCap.rotation.y = -Math.PI / 2;
    backCap.castShadow = true;
    this.group.add(backCap);

    // ============================================
    // WINDOW SECTIONS
    // ============================================
    const windowCount = 6;
    const windowWidth = length * 0.8 / windowCount;
    const windowHeight = radius * 0.3;

    for (let i = 0; i < windowCount; i++) {
      for (let j = 0; j < 3; j++) {
        const angle = (j / 3) * Math.PI * 2 + Math.PI / 6;

        const windowGeom = new THREE.BoxGeometry(windowWidth, windowHeight, 2);
        const windowMesh = new THREE.Mesh(windowGeom, mats.window.clone());

        const xPos = (i - windowCount / 2 + 0.5) * (length * 0.8 / windowCount);
        const yPos = Math.sin(angle) * (radius + 1);
        const zPos = Math.cos(angle) * (radius + 1);

        windowMesh.position.set(xPos, yPos, zPos);
        windowMesh.rotation.x = angle;
        windowMesh.castShadow = true;

        // Make window destructible
        const section = {
          mesh: windowMesh,
          type: 'window',
          health: 50,
          maxHealth: 50,
          points: 100,
          destroyed: false,
        };
        this.sections.push(section);
        this.totalHealth += section.maxHealth;

        this.group.add(windowMesh);
      }
    }

    // ============================================
    // SOLAR PANELS
    // ============================================
    const panelCount = 4;
    for (let i = 0; i < panelCount; i++) {
      const panelGroup = new THREE.Group();

      const angle = (i / panelCount) * Math.PI * 2;
      const panelX = (i % 2 === 0 ? 1 : -1) * (length * 0.3);
      const panelY = Math.sin(angle) * (radius + 20);
      const panelZ = Math.cos(angle) * (radius + 20);

      panelGroup.position.set(panelX, panelY, panelZ);
      panelGroup.rotation.x = angle;

      // Panel structure
      const panelGeom = new THREE.BoxGeometry(40, 20, 0.5);
      const panel = new THREE.Mesh(panelGeom, mats.solarPanel);
      panel.castShadow = true;
      panel.receiveShadow = true;
      panelGroup.add(panel);

      // Support arm
      const armGeom = new THREE.CylinderGeometry(1, 1, 20, 8);
      const arm = new THREE.Mesh(armGeom, mats.dock);
      arm.position.y = -10;
      arm.castShadow = true;
      panelGroup.add(arm);

      // Grid lines on panel
      const gridMat = new THREE.LineBasicMaterial({ color: 0x333366 });
      for (let g = -4; g <= 4; g++) {
        const lineGeom = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(-20, g * 2, 0.3),
          new THREE.Vector3(20, g * 2, 0.3),
        ]);
        const line = new THREE.Line(lineGeom, gridMat);
        panelGroup.add(line);
      }

      const section = {
        mesh: panelGroup,
        type: 'solarPanel',
        health: 100,
        maxHealth: 100,
        points: 200,
        destroyed: false,
      };
      this.sections.push(section);
      this.totalHealth += section.maxHealth;

      this.group.add(panelGroup);
    }

    // ============================================
    // DOCKING BAYS
    // ============================================
    const dockPositions = [
      { x: length / 2 + 10, y: 0, z: 0 },
      { x: -length / 2 - 10, y: 0, z: 0 },
    ];

    dockPositions.forEach((pos, index) => {
      const dockGroup = new THREE.Group();
      dockGroup.position.set(pos.x, pos.y, pos.z);

      // Main dock structure
      const dockGeom = new THREE.CylinderGeometry(15, 20, 30, 8);
      const dock = new THREE.Mesh(dockGeom, mats.dock);
      dock.rotation.z = Math.PI / 2;
      dock.castShadow = true;
      dockGroup.add(dock);

      // Docking arms
      for (let a = 0; a < 4; a++) {
        const armAngle = (a / 4) * Math.PI * 2;
        const armGeom = new THREE.BoxGeometry(3, 25, 3);
        const arm = new THREE.Mesh(armGeom, mats.dock);
        arm.position.y = Math.sin(armAngle) * 18;
        arm.position.z = Math.cos(armAngle) * 18;
        arm.rotation.x = armAngle;
        arm.castShadow = true;
        dockGroup.add(arm);
      }

      // Lights
      const lightGeom = new THREE.SphereGeometry(2, 8, 8);
      const lightMat = new THREE.MeshBasicMaterial({
        color: 0xFF0000,
        emissive: 0xFF0000,
      });
      const light1 = new THREE.Mesh(lightGeom, lightMat);
      light1.position.set(index === 0 ? 15 : -15, 12, 0);
      dockGroup.add(light1);

      const section = {
        mesh: dockGroup,
        type: 'dockingBay',
        health: 200,
        maxHealth: 200,
        points: 500,
        destroyed: false,
      };
      this.sections.push(section);
      this.totalHealth += section.maxHealth;

      this.group.add(dockGroup);
    });

    // ============================================
    // CONTROL TOWER
    // ============================================
    const towerGroup = new THREE.Group();
    towerGroup.position.set(0, radius + 15, 0);

    const towerGeom = new THREE.CylinderGeometry(5, 8, 30, 8);
    const tower = new THREE.Mesh(towerGeom, mats.dock);
    tower.castShadow = true;
    towerGroup.add(tower);

    // Antenna
    const antennaGeom = new THREE.CylinderGeometry(0.5, 0.5, 20, 8);
    const antenna = new THREE.Mesh(antennaGeom, mats.hull);
    antenna.position.y = 25;
    towerGroup.add(antenna);

    // Dish
    const dishGeom = new THREE.SphereGeometry(5, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
    const dish = new THREE.Mesh(dishGeom, mats.hull);
    dish.position.set(8, 10, 0);
    dish.rotation.z = -Math.PI / 4;
    towerGroup.add(dish);

    const section = {
      mesh: towerGroup,
      type: 'controlTower',
      health: 150,
      maxHealth: 150,
      points: 300,
      destroyed: false,
    };
    this.sections.push(section);
    this.totalHealth += section.maxHealth;

    this.group.add(towerGroup);

    // ============================================
    // HULL SECTIONS (destructible)
    // ============================================
    const hullSectionCount = 8;
    for (let i = 0; i < hullSectionCount; i++) {
      const angle = (i / hullSectionCount) * Math.PI * 2;
      const sectionX = ((i % 4) - 1.5) * (length * 0.2);

      const hullSectionGeom = new THREE.BoxGeometry(length * 0.15, 10, 10);
      const hullSection = new THREE.Mesh(hullSectionGeom, mats.hull.clone());

      const yPos = Math.sin(angle) * (radius - 2);
      const zPos = Math.cos(angle) * (radius - 2);

      hullSection.position.set(sectionX, yPos, zPos);
      hullSection.rotation.x = angle;
      hullSection.castShadow = true;

      const section = {
        mesh: hullSection,
        type: 'hullSection',
        health: 500,
        maxHealth: 500,
        points: 1000,
        destroyed: false,
      };
      this.sections.push(section);
      this.totalHealth += section.maxHealth;

      this.group.add(hullSection);
    }

    // Initialize current health
    this.currentHealth = this.totalHealth;
  }

  /**
   * Add to scene
   */
  addToScene(scene) {
    this.scene = scene;
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
   * Damage a section
   * @returns {object|null} Hit result with points and destroyed flag
   */
  damageSection(sectionIndex, damage) {
    const section = this.sections[sectionIndex];
    if (!section || section.destroyed) return null;

    section.health -= damage;
    this.currentHealth -= damage;

    // Visual damage feedback
    if (section.mesh.material && section.mesh.material.color) {
      const healthRatio = section.health / section.maxHealth;
      section.mesh.material.color.multiplyScalar(0.9 + healthRatio * 0.1);
    }

    // Check if destroyed
    if (section.health <= 0) {
      section.destroyed = true;
      this.destroySection(section);
      return {
        points: section.points,
        destroyed: true,
        type: section.type,
      };
    }

    return {
      points: Math.floor(damage),
      destroyed: false,
      type: section.type,
    };
  }

  /**
   * Destroy a section (visual effect)
   */
  destroySection(section) {
    // Hide the mesh
    section.mesh.visible = false;

    // Calculate destruction percentage
    this.updateDestructionPercentage();
  }

  /**
   * Get section at raycaster intersection
   */
  getSectionAtPoint(intersect) {
    let target = intersect.object;

    // Check if hit object is part of a section
    for (let i = 0; i < this.sections.length; i++) {
      const section = this.sections[i];
      if (section.destroyed) continue;

      // Check if mesh or child of mesh
      if (section.mesh === target) {
        return { index: i, section };
      }

      // Check children
      let parent = target.parent;
      while (parent) {
        if (section.mesh === parent) {
          return { index: i, section };
        }
        parent = parent.parent;
      }
    }

    return null;
  }

  /**
   * Update destruction percentage
   */
  updateDestructionPercentage() {
    const destroyedHealth = this.totalHealth - this.currentHealth;
    this.destructionPercentage = (destroyedHealth / this.totalHealth) * 100;
  }

  /**
   * Get destruction percentage
   */
  getDestructionPercentage() {
    return this.destructionPercentage;
  }

  /**
   * Get all meshes for raycasting
   */
  getHitTargets() {
    const targets = [];
    this.sections.forEach(section => {
      if (!section.destroyed) {
        targets.push(section.mesh);
        section.mesh.traverse(child => {
          if (child.isMesh) targets.push(child);
        });
      }
    });
    return targets;
  }

  /**
   * Check collision with a point/sphere
   * Returns true if point is inside colony main cylinder
   */
  checkCollision(point, radius = 0) {
    // Colony is a horizontal cylinder along X axis
    // Center at group position
    const colonyPos = this.group.position;
    const { length, radius: colonyRadius } = COLONY;

    // Transform point to colony local space
    const localX = point.x - colonyPos.x;
    const localY = point.y - colonyPos.y;
    const localZ = point.z - colonyPos.z;

    // Account for colony rotation
    const rotatedY = localY * Math.cos(-this.group.rotation.x) - localZ * Math.sin(-this.group.rotation.x);
    const rotatedZ = localY * Math.sin(-this.group.rotation.x) + localZ * Math.cos(-this.group.rotation.x);

    // Check if within cylinder length (X axis)
    const halfLength = length / 2;
    if (Math.abs(localX) > halfLength + radius) {
      return false;
    }

    // Check radial distance (Y-Z plane)
    const radialDistance = Math.sqrt(rotatedY * rotatedY + rotatedZ * rotatedZ);

    // Collision if inside cylinder
    return radialDistance < colonyRadius + radius;
  }

  /**
   * Get collision info for detailed response
   */
  getCollisionInfo(point, radius = 0) {
    const colonyPos = this.group.position;
    const { length, radius: colonyRadius } = COLONY;

    const localX = point.x - colonyPos.x;
    const localY = point.y - colonyPos.y;
    const localZ = point.z - colonyPos.z;

    const radialDistance = Math.sqrt(localY * localY + localZ * localZ);
    const penetration = colonyRadius + radius - radialDistance;

    return {
      collision: this.checkCollision(point, radius),
      penetration: penetration > 0 ? penetration : 0,
      point: point.clone(),
      radialDistance,
    };
  }

  /**
   * Create explosion at position
   */
  createExplosion(position, intensity = 1) {
    if (!this.scene) return;

    const particleCount = Math.floor(15 * intensity);

    for (let i = 0; i < particleCount; i++) {
      // Orange sphere particle - 2x size
      const size = (1 + Math.random() * 3) * intensity;  // 2x larger base size
      const geometry = new THREE.SphereGeometry(size, 8, 8);
      const material = new THREE.MeshBasicMaterial({
        color: new THREE.Color().setHSL(0.08 + Math.random() * 0.05, 1, 0.5 + Math.random() * 0.2), // Orange color (0.08 = orange hue)
        transparent: true,
        opacity: 1,
      });

      const particle = new THREE.Mesh(geometry, material);
      particle.position.copy(position);

      // Random velocity
      const speed = 10 + Math.random() * 20 * intensity;
      particle.userData = {
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 2,
          (Math.random() - 0.5) * 2,
          (Math.random() - 0.5) * 2
        ).normalize().multiplyScalar(speed),
        life: 0.5 + Math.random() * 0.5,
        maxLife: 0.5 + Math.random() * 0.5,
        initialSize: size,
      };

      this.explosionParticles.push(particle);
      this.scene.add(particle);
    }

    // Add a flash light (orange)
    const flash = new THREE.PointLight(0xff6600, 5 * intensity, 30);
    flash.position.copy(position);
    flash.userData = { life: 0.1 };
    this.scene.add(flash);
    this.explosionParticles.push(flash);
  }

  /**
   * Update explosion particles
   */
  updateExplosions(deltaTime) {
    for (let i = this.explosionParticles.length - 1; i >= 0; i--) {
      const particle = this.explosionParticles[i];

      if (particle.isLight) {
        // Update flash light
        particle.userData.life -= deltaTime;
        particle.intensity *= 0.8;

        if (particle.userData.life <= 0) {
          this.scene.remove(particle);
          this.explosionParticles.splice(i, 1);
        }
      } else if (particle.isMesh) {
        // Update particle
        particle.userData.life -= deltaTime;

        // Move particle
        particle.position.add(
          particle.userData.velocity.clone().multiplyScalar(deltaTime)
        );

        // Apply drag
        particle.userData.velocity.multiplyScalar(0.95);

        // Fade out and shrink
        const lifeRatio = particle.userData.life / particle.userData.maxLife;
        particle.material.opacity = lifeRatio;
        particle.scale.setScalar(lifeRatio);

        // Remove dead particles
        if (particle.userData.life <= 0) {
          this.scene.remove(particle);
          particle.geometry.dispose();
          particle.material.dispose();
          this.explosionParticles.splice(i, 1);
        }
      }
    }
  }

  /**
   * Update colony (animations, etc.)
   */
  update(deltaTime) {
    // Slow rotation
    this.group.rotation.x += deltaTime * 0.01;

    // Update explosion particles
    this.updateExplosions(deltaTime);

    // Animate window lights
    this.sections.forEach(section => {
      if (section.type === 'window' && !section.destroyed) {
        const material = section.mesh.material;
        if (material.emissiveIntensity !== undefined) {
          material.emissiveIntensity = 0.3 + Math.sin(Date.now() * 0.002) * 0.2;
        }
      }
    });
  }
}
