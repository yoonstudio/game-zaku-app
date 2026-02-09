/**
 * Game Manager
 * Main game loop and state management
 */

import * as THREE from 'three';
import { SceneManager } from './Scene.js';
import { InputManager } from './InputManager.js';
import { CameraController } from './Camera.js';
import { AudioManager } from './AudioManager.js';
import { Zaku } from '../entities/Zaku.js';
import { Colony } from '../entities/Colony.js';
import { HUD } from '../ui/HUD.js';
import { ScoreSystem } from '../systems/ScoreSystem.js';
import { ParticleSystem } from '../systems/ParticleSystem.js';
import { GAME, CAMERA, KEYS } from '../utils/Constants.js';

export class Game {
  constructor(container) {
    this.container = container;

    // Core systems
    this.sceneManager = null;
    this.inputManager = null;
    this.cameraController = null;

    // Entities
    this.zaku = null;
    this.colony = null;

    // Systems
    this.scoreSystem = null;
    this.particleSystem = null;
    this.audioManager = null;

    // UI
    this.hud = null;

    // Game state
    this.state = 'menu'; // menu, playing, paused, gameover
    this.missionTimer = GAME.missionTime;
    this.isRunning = false;
    this.musicStarted = false;

    // Game over data
    this.lastGameData = null;

    // Timing
    this.clock = new THREE.Clock();
    this.deltaTime = 0;
    this.fps = 0;
    this.fpsCounter = 0;
    this.fpsTimer = 0;

    // Raycaster for shooting
    this.raycaster = new THREE.Raycaster();

    // Initial position for reset
    this.initialPosition = { x: 0, y: 0, z: 150 };

    // Bind methods
    this.update = this.update.bind(this);
    this.render = this.render.bind(this);
    this.gameLoop = this.gameLoop.bind(this);
  }

  /**
   * Initialize the game
   */
  async init() {
    // Create scene
    this.sceneManager = new SceneManager(this.container);

    // Create input manager
    this.inputManager = new InputManager();

    // Create camera controller
    this.cameraController = new CameraController(this.sceneManager.camera);

    // Create entities
    this.createEntities();

    // Create systems
    this.scoreSystem = new ScoreSystem();
    this.particleSystem = new ParticleSystem(this.sceneManager.scene);
    this.audioManager = new AudioManager();

    // Create HUD
    this.hud = new HUD();

    // Setup event listeners
    this.setupEventListeners();

    // Start in playing state for now (menu can be added later)
    this.startGame();

    // Start game loop
    this.isRunning = true;
    this.gameLoop();

    console.log('Zaku Colony Destroyer initialized');
  }

  /**
   * Create game entities
   */
  createEntities() {
    // Create Zaku
    this.zaku = new Zaku();
    this.zaku.setPosition(0, 0, 150); // Start in front of colony
    this.zaku.addToScene(this.sceneManager.scene);

    // Initialize Zaku particles
    this.zaku.initParticles(this.sceneManager.scene);

    // Initialize bullet system
    this.zaku.initBullets(this.sceneManager.scene);

    // Set camera target
    this.cameraController.setTarget(this.zaku);

    // Create Colony
    this.colony = new Colony();
    this.colony.setPosition(0, 0, 0);
    this.colony.addToScene(this.sceneManager.scene);
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Click to request pointer lock and start music
    this.container.addEventListener('click', () => {
      if (!this.inputManager.isPointerLocked && this.state === 'playing') {
        this.inputManager.requestPointerLock(this.container);
      }

      // Start background music on first click
      if (!this.musicStarted) {
        this.audioManager.init();
        this.audioManager.playGundamTheme();
        this.musicStarted = true;
      }
    });

    // Handle window focus/blur
    window.addEventListener('blur', () => {
      if (this.state === 'playing') {
        this.pauseGame();
      }
    });

    // Setup HUD button events
    this.hud.setupGameOverButtons(
      // Restart callback
      () => this.restartGame(),
      // Ranking callback
      () => {
        const rankings = this.scoreSystem.getRankings();
        const currentScore = this.lastGameData ? this.lastGameData.finalScore : null;
        this.hud.showRankings(rankings, currentScore);
      },
      // Ranking back callback
      () => {
        // Just close ranking, game over screen is still visible
      }
    );
  }

  /**
   * Start the game
   */
  startGame() {
    this.state = 'playing';
    this.missionTimer = GAME.missionTime;
    this.scoreSystem.reset();
    this.clock.start();
  }

  /**
   * Pause the game
   */
  pauseGame() {
    this.state = 'paused';
    this.clock.stop();
  }

  /**
   * Resume the game
   */
  resumeGame() {
    this.state = 'playing';
    this.clock.start();
  }

  /**
   * End the game
   * @param {boolean} victory - Whether the player won
   * @param {string} reason - Reason for game over ('timeout', 'collision', 'victory')
   */
  endGame(victory, reason = 'timeout') {
    if (this.state === 'gameover') return; // Prevent double game over

    this.state = 'gameover';
    this.clock.stop();

    // Release pointer lock
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }

    // Calculate final score
    const scoreData = this.scoreSystem.calculateFinalScore(
      this.missionTimer,
      this.colony.getDestructionPercentage()
    );

    // Check high score
    const isHighScore = this.scoreSystem.checkHighScore();

    // Save to rankings and get rank
    const rank = this.scoreSystem.saveToRankings(
      scoreData.finalScore,
      this.colony.getDestructionPercentage(),
      this.missionTimer
    );

    // Store game data for later use
    this.lastGameData = {
      ...scoreData,
      destruction: this.colony.getDestructionPercentage(),
      timeRemaining: this.missionTimer,
      isHighScore,
      rank,
    };

    // Determine title and reason text
    let title, reasonText;
    if (victory) {
      title = 'MISSION COMPLETE';
      reasonText = '콜로니 파괴 목표 달성!';
    } else if (reason === 'collision') {
      title = 'DESTROYED';
      reasonText = '자쿠가 콜로니에 충돌했습니다!';
    } else {
      title = 'TIME UP';
      reasonText = '시간이 초과되었습니다';
    }

    // Show game over screen
    this.hud.showGameOver({
      title,
      reason: reasonText,
      score: scoreData.finalScore,
      destruction: this.colony.getDestructionPercentage(),
      time: this.missionTimer,
      rank,
      isVictory: victory,
    });

    console.log('Game Over!', { victory, reason, scoreData, rank });
  }

  /**
   * Restart the game
   */
  restartGame() {
    // Reset game state
    this.state = 'playing';
    this.missionTimer = GAME.missionTime;

    // Reset score
    this.scoreSystem.reset();

    // Reset Zaku
    this.zaku.getGroup().visible = true;
    this.resetZakuPosition();
    this.zaku.boostEnergy = this.zaku.maxBoostEnergy;

    // Reset colony (recreate it)
    this.colony.removeFromScene(this.sceneManager.scene);
    this.colony = new Colony();
    this.colony.setPosition(0, 0, 0);
    this.colony.addToScene(this.sceneManager.scene);

    // Clear particles
    this.particleSystem.clear();

    // Reset camera
    this.cameraController.reset();

    // Reset HUD
    this.hud.hideGameOver();
    this.hud.hideRankings();

    // Reset timer display color
    const timerElement = document.getElementById('timer');
    if (timerElement) {
      timerElement.style.color = '';
    }

    // Restart clock
    this.clock.start();

    // Request pointer lock
    this.inputManager.requestPointerLock(this.container);

    console.log('Game restarted');
  }

  /**
   * Main game loop
   */
  gameLoop() {
    if (!this.isRunning) return;

    requestAnimationFrame(this.gameLoop);

    this.deltaTime = this.clock.getDelta();

    // FPS counter
    this.fpsCounter++;
    this.fpsTimer += this.deltaTime;
    if (this.fpsTimer >= 1) {
      this.fps = this.fpsCounter;
      this.fpsCounter = 0;
      this.fpsTimer = 0;
      this.updateFPSDisplay();
    }

    // Update game state
    if (this.state === 'playing') {
      this.update(this.deltaTime);
    }

    // Always render
    this.render();

    // Clear per-frame input state
    this.inputManager.update();
  }

  /**
   * Update game state
   */
  update(deltaTime) {
    // Update mission timer
    this.missionTimer -= deltaTime;
    if (this.missionTimer <= 0) {
      this.endGame(false);
      return;
    }

    // Get input
    const movement = this.inputManager.getMovementInput();
    const mouseDelta = this.inputManager.getMouseDelta();
    const mouseWheel = this.inputManager.getMouseWheel();

    // Update Zaku movement
    this.zaku.processMovement(movement, deltaTime);
    this.zaku.update(deltaTime);

    // Update camera
    this.cameraController.rotate(mouseDelta.x, mouseDelta.y);
    this.cameraController.zoom(mouseWheel);
    this.cameraController.update(deltaTime);

    // Handle shooting (left mouse button)
    if (this.inputManager.isMouseButtonDown(0)) {
      this.handleShooting();
    }

    // Handle view mode toggle (right mouse button)
    if (this.inputManager.isMouseButtonJustPressed(2)) {
      const newMode = this.cameraController.toggleViewMode();
      this.hud.showMessage(this.cameraController.getViewModeName(), 1500);
    }

    // Handle reset position (R key)
    if (this.inputManager.isKeyJustPressed(KEYS.reload)) {
      this.resetZakuPosition();
    }

    // Update colony
    this.colony.update(deltaTime);

    // Check bullet collisions with colony
    this.checkBulletCollisions();

    // Update scene
    this.sceneManager.update(deltaTime);

    // Update systems
    this.scoreSystem.update(deltaTime);
    this.particleSystem.update(deltaTime);

    // Update HUD
    this.updateHUD();

    // Check collision with colony
    this.checkZakuCollision();

    // Check win condition
    if (this.colony.getDestructionPercentage() >= GAME.targetDestructionRate) {
      this.endGame(true);
    }
  }

  /**
   * Check if Zaku collides with colony
   */
  checkZakuCollision() {
    const zakuBounds = this.zaku.getBoundingSphere();
    const collision = this.colony.checkCollision(zakuBounds.center, zakuBounds.radius);

    if (collision) {
      // Zaku crashed into colony!
      this.handleZakuCrash();
    }
  }

  /**
   * Handle Zaku crash into colony
   */
  handleZakuCrash() {
    // Create massive explosion at Zaku position
    const zakuPos = this.zaku.getPosition();

    // Multiple explosions for dramatic effect
    for (let i = 0; i < 5; i++) {
      const offset = new THREE.Vector3(
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10
      );
      const pos = zakuPos.clone().add(offset);

      // Stagger explosions slightly
      setTimeout(() => {
        this.particleSystem.createExplosion(pos, 3, 0xFF4400);
        this.particleSystem.createDebris(pos, 20);
        this.audioManager.playExplosion(1.5);
      }, i * 100);
    }

    // Main explosion
    this.particleSystem.createExplosion(zakuPos, 5, 0xFF6600);
    this.particleSystem.createDebris(zakuPos, 30);

    // Camera shake
    this.cameraController.shake(2, 1);

    // Play loud explosion
    this.audioManager.playExplosion(2);

    // Hide Zaku
    this.zaku.getGroup().visible = false;

    // End game after short delay
    setTimeout(() => {
      this.endGame(false, 'collision');
    }, 500);
  }

  /**
   * Reset Zaku to initial position
   */
  resetZakuPosition() {
    this.zaku.setPosition(
      this.initialPosition.x,
      this.initialPosition.y,
      this.initialPosition.z
    );
    this.zaku.setRotation(0);
    this.zaku.velocity.set(0, 0, 0);
    this.zaku.resetPose();
    this.cameraController.reset();
    this.hud.showMessage('위치 초기화', 1000);
    console.log('Zaku position reset');
  }

  /**
   * Check bullet collisions with colony
   */
  checkBulletCollisions() {
    const bullets = this.zaku.getBullets();
    const targets = this.colony.getHitTargets();

    for (let i = bullets.length - 1; i >= 0; i--) {
      const bullet = bullets[i];

      // Create ray from bullet position in bullet direction
      const bulletRay = new THREE.Raycaster(
        bullet.position.clone(),
        bullet.userData.direction.clone(),
        0,
        bullet.userData.speed * this.deltaTime * 2 // Check slightly ahead
      );

      const intersects = bulletRay.intersectObjects(targets, true);

      if (intersects.length > 0) {
        const hit = intersects[0];

        // Find which section was hit
        const sectionInfo = this.colony.getSectionAtPoint(hit);

        if (sectionInfo) {
          // Deal damage
          const damage = bullet.userData.damage;
          const result = this.colony.damageSection(sectionInfo.index, damage);

          if (result) {
            // Create explosion effect at hit point
            this.colony.createExplosion(hit.point, 0.5);

            // Play explosion sound
            this.audioManager.playExplosion(0.3);

            // Record stats
            this.scoreSystem.recordShot(true);
            this.scoreSystem.recordDamage(damage);

            if (result.destroyed) {
              // Section destroyed - bigger explosion
              this.scoreSystem.recordDestruction();
              const scoreResult = this.scoreSystem.addScore(result.points);

              // Large explosion
              this.colony.createExplosion(hit.point, 2);
              this.particleSystem.createDebris(hit.point, 15);

              // Louder explosion sound
              this.audioManager.playExplosion(1);

              // Camera shake
              this.cameraController.shake(0.5, 0.3);

              // Score popup
              this.hud.addScore(scoreResult.points, 50, 40);
            }
          }
        }

        // Remove bullet on hit
        if (bullet.parent) {
          bullet.parent.remove(bullet);
        }
        bullet.geometry.dispose();
        bullet.material.dispose();
        bullets.splice(i, 1);
      }
    }
  }

  /**
   * Handle shooting logic
   */
  handleShooting() {
    // Fire weapon (handles cooldown, animation, sound, particles)
    this.zaku.fire();

    // Raycast from camera center
    this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.sceneManager.camera);

    // Get colony hit targets
    const targets = this.colony.getHitTargets();
    const intersects = this.raycaster.intersectObjects(targets, true);

    if (intersects.length > 0) {
      const hit = intersects[0];

      // Find which section was hit
      const sectionInfo = this.colony.getSectionAtPoint(hit);

      if (sectionInfo) {
        // Deal damage (simplified - 10 damage per frame when holding fire)
        const damage = 10 * this.deltaTime * 60; // Normalize to 60fps
        const result = this.colony.damageSection(sectionInfo.index, damage);

        if (result) {
          // Record stats
          this.scoreSystem.recordShot(true);
          this.scoreSystem.recordDamage(damage);

          if (result.destroyed) {
            // Section destroyed
            this.scoreSystem.recordDestruction();
            const scoreResult = this.scoreSystem.addScore(result.points);

            // Create explosion
            this.particleSystem.createExplosion(hit.point, 2);
            this.particleSystem.createDebris(hit.point, 15);

            // Camera shake
            this.cameraController.shake(0.5, 0.3);

            // Score popup
            this.hud.addScore(scoreResult.points, 50, 40);
          } else {
            // Hit but not destroyed - small effect
            if (Math.random() < 0.1) {
              this.particleSystem.createExplosion(hit.point, 0.3, 0xFFAA00);
            }
          }
        }
      }

      // Set crosshair hit state
      this.hud.setCrosshairHit(true);
    } else {
      this.hud.setCrosshairHit(false);
      this.scoreSystem.recordShot(false);
    }
  }

  /**
   * Update HUD with current state
   */
  updateHUD() {
    const scoreState = this.scoreSystem.getState();

    this.hud.updateTimer(this.missionTimer);
    this.hud.updateScore(scoreState.score);
    this.hud.updateBoost(this.zaku.getBoostPercentage());
    this.hud.updateDestructionRate(this.colony.getDestructionPercentage());
    this.hud.updateCombo(scoreState.combo, scoreState.comboTimerPercent);
  }

  /**
   * Update FPS display
   */
  updateFPSDisplay() {
    let fpsElement = document.getElementById('fps-counter');
    if (!fpsElement) {
      fpsElement = document.createElement('div');
      fpsElement.id = 'fps-counter';
      fpsElement.style.cssText = `
        position: fixed;
        top: 10px;
        left: 50%;
        transform: translateX(-50%);
        font-family: monospace;
        font-size: 12px;
        color: #00ff88;
        opacity: 0.5;
        z-index: 1001;
      `;
      document.body.appendChild(fpsElement);
    }
    fpsElement.textContent = `FPS: ${this.fps}`;
  }

  /**
   * Render the scene
   */
  render() {
    this.sceneManager.render();
  }

  /**
   * Dispose game resources
   */
  dispose() {
    this.isRunning = false;

    // Stop music
    if (this.audioManager) {
      this.audioManager.stopMusic();
    }

    // Dispose systems
    this.particleSystem.dispose();
    this.hud.dispose();
    this.inputManager.dispose();

    // Remove entities from scene
    this.zaku.removeFromScene(this.sceneManager.scene);
    this.colony.removeFromScene(this.sceneManager.scene);

    console.log('Game disposed');
  }
}
