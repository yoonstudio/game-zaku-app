/**
 * HUD (Heads-Up Display)
 * SF/Neon style game interface
 */

import { UI_COLORS, WEAPONS } from '../utils/Constants.js';
import { formatTime, formatNumber } from '../utils/MathUtils.js';

export class HUD {
  constructor() {
    // HUD container
    this.container = null;

    // UI elements
    this.elements = {};

    // State
    this.score = 0;
    this.combo = 0;
    this.comboTimer = 0;
    this.currentWeapon = 0;
    this.ammo = [WEAPONS.machineGun.ammo, WEAPONS.bazooka.ammo];
    this.maxAmmo = [WEAPONS.machineGun.ammo, WEAPONS.bazooka.ammo];
    this.hp = 100;
    this.boost = 100;
    this.timer = 300;
    this.destructionRate = 0;

    // Create HUD
    this.create();
  }

  /**
   * Create HUD elements
   */
  create() {
    // Main container
    this.container = document.createElement('div');
    this.container.id = 'game-hud';
    this.container.innerHTML = `
      <!-- Top Left: HP and Boost -->
      <div class="hud-top-left">
        <div class="hud-bar hp-bar">
          <div class="bar-label">HP</div>
          <div class="bar-container">
            <div class="bar-fill hp-fill" id="hp-bar"></div>
          </div>
          <div class="bar-value" id="hp-value">100</div>
        </div>
        <div class="hud-bar boost-bar">
          <div class="bar-label">BOOST</div>
          <div class="bar-container">
            <div class="bar-fill boost-fill" id="boost-bar"></div>
          </div>
          <div class="bar-value" id="boost-value">100</div>
        </div>
      </div>

      <!-- Top Right: Timer and Mission -->
      <div class="hud-top-right">
        <div class="mission-panel">
          <div class="mission-title">MISSION</div>
          <div class="mission-objective">Destroy Colony: <span id="destruction-rate">0</span>%</div>
        </div>
        <div class="timer-panel">
          <div class="timer-label">TIME</div>
          <div class="timer-value" id="timer">05:00</div>
        </div>
      </div>

      <!-- Center: Crosshair -->
      <div class="crosshair" id="crosshair">
        <div class="crosshair-line crosshair-top"></div>
        <div class="crosshair-line crosshair-right"></div>
        <div class="crosshair-line crosshair-bottom"></div>
        <div class="crosshair-line crosshair-left"></div>
        <div class="crosshair-dot"></div>
      </div>

      <!-- Center: Combo Display -->
      <div class="combo-display" id="combo-display">
        <div class="combo-text">COMBO</div>
        <div class="combo-count" id="combo-count">0</div>
        <div class="combo-timer" id="combo-timer-bar"></div>
      </div>

      <!-- Bottom Left: Weapons -->
      <div class="hud-bottom-left">
        <div class="weapon-panel">
          <div class="weapon-item active" id="weapon-1">
            <div class="weapon-key">[1]</div>
            <div class="weapon-name">MACHINE GUN</div>
            <div class="weapon-ammo">
              <span id="ammo-1">500</span>/<span id="max-ammo-1">500</span>
            </div>
          </div>
          <div class="weapon-item" id="weapon-2">
            <div class="weapon-key">[2]</div>
            <div class="weapon-name">BAZOOKA</div>
            <div class="weapon-ammo">
              <span id="ammo-2">20</span>/<span id="max-ammo-2">20</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Bottom Right: Score -->
      <div class="hud-bottom-right">
        <div class="score-panel">
          <div class="score-label">SCORE</div>
          <div class="score-value" id="score">0</div>
        </div>
        <div class="destruction-panel">
          <div class="destruction-label">DESTRUCTION</div>
          <div class="destruction-bar">
            <div class="destruction-fill" id="destruction-bar"></div>
          </div>
          <div class="destruction-value" id="destruction-value">0%</div>
        </div>
      </div>

      <!-- Score Popup Container -->
      <div class="score-popup-container" id="score-popup-container"></div>

      <!-- Game Over Screen -->
      <div class="game-over-screen" id="game-over-screen">
        <div class="game-over-panel">
          <div class="game-over-title" id="game-over-title">GAME OVER</div>
          <div class="game-over-reason" id="game-over-reason"></div>
          <div class="game-over-rank" id="game-over-rank"></div>
          <div class="game-over-stats">
            <div class="stat-row">
              <span class="stat-label">SCORE</span>
              <span class="stat-value" id="final-score">0</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">DESTRUCTION</span>
              <span class="stat-value" id="final-destruction">0%</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">TIME</span>
              <span class="stat-value" id="final-time">00:00</span>
            </div>
          </div>
          <div class="game-over-buttons">
            <button class="game-btn ranking-btn" id="ranking-btn">순위보기</button>
            <button class="game-btn restart-btn" id="restart-btn">다시하기</button>
          </div>
        </div>
      </div>

      <!-- Ranking Screen -->
      <div class="ranking-screen" id="ranking-screen">
        <div class="ranking-panel">
          <div class="ranking-title">TOP 10 RANKINGS</div>
          <div class="ranking-list" id="ranking-list">
            <!-- Rankings will be populated dynamically -->
          </div>
          <div class="ranking-buttons">
            <button class="game-btn back-btn" id="ranking-back-btn">돌아가기</button>
          </div>
        </div>
      </div>

      <!-- Bottom Center: Keymap (Desktop only) -->
      <div class="hud-bottom-center desktop-only">
        <div class="keymap-panel">
          <div class="keymap-row">
            <span class="key">W</span><span class="key-desc">전진</span>
            <span class="key">S</span><span class="key-desc">후진</span>
            <span class="key">A</span><span class="key-desc">좌이동</span>
            <span class="key">D</span><span class="key-desc">우이동</span>
          </div>
          <div class="keymap-row">
            <span class="key">Q</span><span class="key-desc">좌회전</span>
            <span class="key">E</span><span class="key-desc">우회전</span>
            <span class="key">SPACE</span><span class="key-desc">상승</span>
            <span class="key">SHIFT</span><span class="key-desc">하강</span>
          </div>
          <div class="keymap-row">
            <span class="key">CTRL</span><span class="key-desc">부스트</span>
            <span class="key">R</span><span class="key-desc">초기화</span>
            <span class="key">L-CLICK</span><span class="key-desc">발사</span>
            <span class="key">R-CLICK</span><span class="key-desc">시점변경</span>
          </div>
        </div>
      </div>

      <!-- Mobile Touch Controls -->
      <div class="touch-controls mobile-only" id="touch-controls">
        <!-- Left Side: Movement Controls (6 buttons) -->
        <div class="touch-pad touch-pad-left">
          <div class="touch-row">
            <button class="touch-btn" data-key="KeyQ">Q</button>
            <button class="touch-btn" data-key="KeyW">W</button>
            <button class="touch-btn" data-key="KeyE">E</button>
          </div>
          <div class="touch-row">
            <button class="touch-btn" data-key="KeyA">A</button>
            <button class="touch-btn" data-key="KeyS">S</button>
            <button class="touch-btn" data-key="KeyD">D</button>
          </div>
        </div>

        <!-- Right Side: Action Controls (6 buttons) -->
        <div class="touch-pad touch-pad-right">
          <div class="touch-row">
            <button class="touch-btn" data-key="Space">UP</button>
            <button class="touch-btn" data-key="ShiftLeft">DN</button>
            <button class="touch-btn" data-key="ControlLeft">BST</button>
          </div>
          <div class="touch-row">
            <button class="touch-btn touch-fire" data-action="fire">FIRE</button>
            <button class="touch-btn touch-view" data-action="view">VIEW</button>
            <button class="touch-btn" data-key="KeyR">R</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(this.container);

    // Store references
    this.elements = {
      hpBar: document.getElementById('hp-bar'),
      hpValue: document.getElementById('hp-value'),
      boostBar: document.getElementById('boost-bar'),
      boostValue: document.getElementById('boost-value'),
      timer: document.getElementById('timer'),
      destructionRate: document.getElementById('destruction-rate'),
      crosshair: document.getElementById('crosshair'),
      comboDisplay: document.getElementById('combo-display'),
      comboCount: document.getElementById('combo-count'),
      comboTimerBar: document.getElementById('combo-timer-bar'),
      weapon1: document.getElementById('weapon-1'),
      weapon2: document.getElementById('weapon-2'),
      ammo1: document.getElementById('ammo-1'),
      ammo2: document.getElementById('ammo-2'),
      score: document.getElementById('score'),
      destructionBar: document.getElementById('destruction-bar'),
      destructionValue: document.getElementById('destruction-value'),
      scorePopupContainer: document.getElementById('score-popup-container'),
      // Game Over elements
      gameOverScreen: document.getElementById('game-over-screen'),
      gameOverTitle: document.getElementById('game-over-title'),
      gameOverReason: document.getElementById('game-over-reason'),
      gameOverRank: document.getElementById('game-over-rank'),
      finalScore: document.getElementById('final-score'),
      finalDestruction: document.getElementById('final-destruction'),
      finalTime: document.getElementById('final-time'),
      restartBtn: document.getElementById('restart-btn'),
      rankingBtn: document.getElementById('ranking-btn'),
      // Ranking elements
      rankingScreen: document.getElementById('ranking-screen'),
      rankingList: document.getElementById('ranking-list'),
      rankingBackBtn: document.getElementById('ranking-back-btn'),
    };

    // Add styles
    this.addStyles();
  }

  /**
   * Add CSS styles
   */
  addStyles() {
    const style = document.createElement('style');
    style.textContent = `
      #game-hud {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        font-family: 'Orbitron', 'Rajdhani', 'Segoe UI', sans-serif;
        color: ${UI_COLORS.primary};
        z-index: 1000;
      }

      /* Top Left - HP and Boost */
      .hud-top-left {
        position: absolute;
        top: 20px;
        left: 20px;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .hud-bar {
        display: flex;
        align-items: center;
        gap: 10px;
        background: ${UI_COLORS.background};
        padding: 8px 15px;
        border: 1px solid ${UI_COLORS.border};
        border-radius: 4px;
      }

      .bar-label {
        font-size: 12px;
        font-weight: bold;
        width: 50px;
        text-transform: uppercase;
        letter-spacing: 1px;
      }

      .bar-container {
        width: 150px;
        height: 12px;
        background: rgba(0, 0, 0, 0.5);
        border: 1px solid ${UI_COLORS.border};
        border-radius: 2px;
        overflow: hidden;
      }

      .bar-fill {
        height: 100%;
        transition: width 0.3s ease;
      }

      .hp-fill {
        background: linear-gradient(90deg, ${UI_COLORS.danger}, ${UI_COLORS.warning});
        box-shadow: 0 0 10px ${UI_COLORS.danger};
      }

      .boost-fill {
        background: linear-gradient(90deg, ${UI_COLORS.secondary}, ${UI_COLORS.primary});
        box-shadow: 0 0 10px ${UI_COLORS.secondary};
      }

      .bar-value {
        font-size: 14px;
        font-weight: bold;
        width: 35px;
        text-align: right;
      }

      /* Top Right - Timer and Mission */
      .hud-top-right {
        position: absolute;
        top: 20px;
        right: 20px;
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 10px;
      }

      .mission-panel, .timer-panel {
        background: ${UI_COLORS.background};
        padding: 10px 15px;
        border: 1px solid ${UI_COLORS.border};
        border-radius: 4px;
        text-align: right;
      }

      .mission-title, .timer-label {
        font-size: 10px;
        letter-spacing: 2px;
        opacity: 0.7;
        margin-bottom: 3px;
      }

      .mission-objective {
        font-size: 14px;
        color: ${UI_COLORS.warning};
      }

      .timer-value {
        font-size: 28px;
        font-weight: bold;
        font-family: 'Courier New', monospace;
        text-shadow: 0 0 10px ${UI_COLORS.primary};
      }

      /* Crosshair */
      .crosshair {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 40px;
        height: 40px;
      }

      .crosshair-line {
        position: absolute;
        background: ${UI_COLORS.primary};
        box-shadow: 0 0 5px ${UI_COLORS.primary};
      }

      .crosshair-top, .crosshair-bottom {
        width: 2px;
        height: 12px;
        left: 50%;
        transform: translateX(-50%);
      }

      .crosshair-top { top: 0; }
      .crosshair-bottom { bottom: 0; }

      .crosshair-left, .crosshair-right {
        width: 12px;
        height: 2px;
        top: 50%;
        transform: translateY(-50%);
      }

      .crosshair-left { left: 0; }
      .crosshair-right { right: 0; }

      .crosshair-dot {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 4px;
        height: 4px;
        background: ${UI_COLORS.primary};
        border-radius: 50%;
        box-shadow: 0 0 8px ${UI_COLORS.primary};
      }

      /* Combo Display */
      .combo-display {
        position: absolute;
        top: 30%;
        left: 50%;
        transform: translateX(-50%);
        text-align: center;
        opacity: 0;
        transition: opacity 0.3s ease;
      }

      .combo-display.active {
        opacity: 1;
      }

      .combo-text {
        font-size: 16px;
        letter-spacing: 3px;
        color: ${UI_COLORS.warning};
      }

      .combo-count {
        font-size: 48px;
        font-weight: bold;
        color: ${UI_COLORS.warning};
        text-shadow: 0 0 20px ${UI_COLORS.warning};
        animation: pulse 0.3s ease-out;
      }

      @keyframes pulse {
        0% { transform: scale(1.3); }
        100% { transform: scale(1); }
      }

      .combo-timer {
        width: 100px;
        height: 4px;
        background: rgba(0, 0, 0, 0.5);
        margin: 5px auto 0;
        border-radius: 2px;
        overflow: hidden;
      }

      .combo-timer::after {
        content: '';
        display: block;
        height: 100%;
        width: 100%;
        background: ${UI_COLORS.warning};
        transition: width 0.1s linear;
      }

      /* Bottom Left - Weapons */
      .hud-bottom-left {
        position: absolute;
        bottom: 20px;
        left: 20px;
      }

      .weapon-panel {
        display: flex;
        flex-direction: column;
        gap: 5px;
      }

      .weapon-item {
        display: flex;
        align-items: center;
        gap: 10px;
        background: ${UI_COLORS.background};
        padding: 8px 15px;
        border: 1px solid rgba(0, 255, 136, 0.2);
        border-radius: 4px;
        opacity: 0.6;
        transition: all 0.2s ease;
      }

      .weapon-item.active {
        border-color: ${UI_COLORS.primary};
        opacity: 1;
        box-shadow: 0 0 10px ${UI_COLORS.border};
      }

      .weapon-key {
        font-size: 10px;
        color: ${UI_COLORS.secondary};
      }

      .weapon-name {
        font-size: 14px;
        font-weight: bold;
        min-width: 120px;
      }

      .weapon-ammo {
        font-size: 14px;
        font-family: 'Courier New', monospace;
        color: ${UI_COLORS.secondary};
      }

      /* Bottom Right - Score */
      .hud-bottom-right {
        position: absolute;
        bottom: 20px;
        right: 20px;
        text-align: right;
      }

      .score-panel {
        background: ${UI_COLORS.background};
        padding: 10px 20px;
        border: 1px solid ${UI_COLORS.border};
        border-radius: 4px;
        margin-bottom: 10px;
      }

      .score-label {
        font-size: 10px;
        letter-spacing: 2px;
        opacity: 0.7;
        margin-bottom: 3px;
      }

      .score-value {
        font-size: 32px;
        font-weight: bold;
        font-family: 'Courier New', monospace;
        text-shadow: 0 0 15px ${UI_COLORS.primary};
      }

      .destruction-panel {
        background: ${UI_COLORS.background};
        padding: 10px 15px;
        border: 1px solid ${UI_COLORS.border};
        border-radius: 4px;
      }

      .destruction-label {
        font-size: 10px;
        letter-spacing: 2px;
        opacity: 0.7;
        margin-bottom: 5px;
      }

      .destruction-bar {
        width: 150px;
        height: 8px;
        background: rgba(0, 0, 0, 0.5);
        border: 1px solid ${UI_COLORS.border};
        border-radius: 2px;
        overflow: hidden;
        margin-bottom: 5px;
      }

      .destruction-fill {
        height: 100%;
        background: linear-gradient(90deg, ${UI_COLORS.warning}, ${UI_COLORS.danger});
        box-shadow: 0 0 10px ${UI_COLORS.warning};
        transition: width 0.3s ease;
      }

      .destruction-value {
        font-size: 14px;
        font-weight: bold;
        color: ${UI_COLORS.warning};
      }

      /* Score Popup */
      .score-popup-container {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        overflow: hidden;
      }

      .score-popup {
        position: absolute;
        font-size: 24px;
        font-weight: bold;
        color: ${UI_COLORS.primary};
        text-shadow: 0 0 10px ${UI_COLORS.primary};
        animation: scorePopup 1s ease-out forwards;
        pointer-events: none;
      }

      @keyframes scorePopup {
        0% {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
        100% {
          opacity: 0;
          transform: translateY(-50px) scale(1.5);
        }
      }

      /* FPS Counter */
      #fps-counter {
        position: absolute;
        top: 10px;
        left: 50%;
        transform: translateX(-50%);
        font-size: 12px;
        color: ${UI_COLORS.primary};
        opacity: 0.5;
      }

      /* Bottom Center - Keymap */
      .hud-bottom-center {
        position: absolute;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
      }

      .keymap-panel {
        background: ${UI_COLORS.background};
        padding: 10px 20px;
        border: 1px solid ${UI_COLORS.border};
        border-radius: 4px;
        display: flex;
        flex-direction: column;
        gap: 5px;
      }

      .keymap-row {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 5px;
      }

      .key {
        background: rgba(0, 255, 136, 0.2);
        border: 1px solid ${UI_COLORS.primary};
        padding: 3px 8px;
        border-radius: 3px;
        font-size: 10px;
        font-weight: bold;
        color: ${UI_COLORS.primary};
        min-width: 20px;
        text-align: center;
      }

      .key-desc {
        font-size: 10px;
        color: ${UI_COLORS.secondary};
        margin-right: 15px;
        opacity: 0.8;
      }

      .key-desc:last-child {
        margin-right: 0;
      }

      /* Game Over Screen */
      .game-over-screen {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: none;
        justify-content: center;
        align-items: center;
        z-index: 2000;
        pointer-events: auto;
      }

      .game-over-screen.active {
        display: flex;
        animation: fadeIn 0.5s ease-out;
      }

      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      .game-over-panel {
        background: ${UI_COLORS.background};
        border: 2px solid ${UI_COLORS.primary};
        border-radius: 10px;
        padding: 40px 60px;
        text-align: center;
        box-shadow: 0 0 30px ${UI_COLORS.primary};
      }

      .game-over-title {
        font-size: 48px;
        font-weight: bold;
        color: ${UI_COLORS.danger};
        text-shadow: 0 0 20px ${UI_COLORS.danger};
        margin-bottom: 10px;
        letter-spacing: 5px;
      }

      .game-over-title.victory {
        color: ${UI_COLORS.primary};
        text-shadow: 0 0 20px ${UI_COLORS.primary};
      }

      .game-over-reason {
        font-size: 18px;
        color: ${UI_COLORS.warning};
        margin-bottom: 30px;
      }

      .game-over-stats {
        margin-bottom: 30px;
      }

      .stat-row {
        display: flex;
        justify-content: space-between;
        padding: 10px 0;
        border-bottom: 1px solid rgba(0, 255, 136, 0.2);
      }

      .stat-label {
        font-size: 14px;
        color: ${UI_COLORS.secondary};
        letter-spacing: 2px;
      }

      .stat-value {
        font-size: 20px;
        font-weight: bold;
        color: ${UI_COLORS.primary};
        font-family: 'Courier New', monospace;
      }

      .game-over-buttons {
        display: flex;
        gap: 20px;
        justify-content: center;
      }

      .game-btn {
        padding: 15px 40px;
        font-size: 18px;
        font-weight: bold;
        font-family: 'Orbitron', sans-serif;
        border: 2px solid;
        border-radius: 5px;
        cursor: pointer;
        transition: all 0.3s ease;
        text-transform: uppercase;
        letter-spacing: 2px;
      }

      .restart-btn {
        background: rgba(0, 255, 136, 0.2);
        border-color: ${UI_COLORS.primary};
        color: ${UI_COLORS.primary};
      }

      .restart-btn:hover {
        background: ${UI_COLORS.primary};
        color: #000;
        box-shadow: 0 0 20px ${UI_COLORS.primary};
      }

      .quit-btn {
        background: rgba(255, 51, 51, 0.2);
        border-color: ${UI_COLORS.danger};
        color: ${UI_COLORS.danger};
      }

      .quit-btn:hover {
        background: ${UI_COLORS.danger};
        color: #000;
        box-shadow: 0 0 20px ${UI_COLORS.danger};
      }

      /* Ranking Button */
      .ranking-btn {
        background: rgba(0, 170, 255, 0.2);
        border-color: ${UI_COLORS.secondary};
        color: ${UI_COLORS.secondary};
      }

      .ranking-btn:hover {
        background: ${UI_COLORS.secondary};
        color: #000;
        box-shadow: 0 0 20px ${UI_COLORS.secondary};
      }

      /* Back Button */
      .back-btn {
        background: rgba(255, 170, 0, 0.2);
        border-color: ${UI_COLORS.warning};
        color: ${UI_COLORS.warning};
      }

      .back-btn:hover {
        background: ${UI_COLORS.warning};
        color: #000;
        box-shadow: 0 0 20px ${UI_COLORS.warning};
      }

      /* Game Over Rank Display */
      .game-over-rank {
        font-size: 24px;
        font-weight: bold;
        color: ${UI_COLORS.warning};
        text-shadow: 0 0 15px ${UI_COLORS.warning};
        margin-bottom: 20px;
        letter-spacing: 2px;
      }

      .game-over-rank.new-record {
        color: ${UI_COLORS.primary};
        text-shadow: 0 0 20px ${UI_COLORS.primary};
        animation: rankPulse 0.5s ease-in-out infinite alternate;
      }

      @keyframes rankPulse {
        from { transform: scale(1); }
        to { transform: scale(1.05); }
      }

      /* Ranking Screen */
      .ranking-screen {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.9);
        display: none;
        justify-content: center;
        align-items: center;
        z-index: 2001;
        pointer-events: auto;
      }

      .ranking-screen.active {
        display: flex;
        animation: fadeIn 0.3s ease-out;
      }

      .ranking-panel {
        background: ${UI_COLORS.background};
        border: 2px solid ${UI_COLORS.secondary};
        border-radius: 10px;
        padding: 30px 50px;
        text-align: center;
        box-shadow: 0 0 30px ${UI_COLORS.secondary};
        min-width: 400px;
        max-height: 80vh;
        overflow-y: auto;
      }

      .ranking-title {
        font-size: 32px;
        font-weight: bold;
        color: ${UI_COLORS.secondary};
        text-shadow: 0 0 15px ${UI_COLORS.secondary};
        margin-bottom: 25px;
        letter-spacing: 3px;
      }

      .ranking-list {
        margin-bottom: 25px;
      }

      .ranking-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 15px;
        border-bottom: 1px solid rgba(0, 170, 255, 0.2);
        transition: background 0.2s ease;
      }

      .ranking-item:hover {
        background: rgba(0, 170, 255, 0.1);
      }

      .ranking-item.current {
        background: rgba(0, 255, 136, 0.2);
        border: 1px solid ${UI_COLORS.primary};
        border-radius: 5px;
      }

      .ranking-item.gold {
        background: rgba(255, 215, 0, 0.15);
      }

      .ranking-item.silver {
        background: rgba(192, 192, 192, 0.1);
      }

      .ranking-item.bronze {
        background: rgba(205, 127, 50, 0.1);
      }

      .ranking-position {
        font-size: 24px;
        font-weight: bold;
        width: 50px;
        text-align: center;
      }

      .ranking-position.gold { color: #FFD700; }
      .ranking-position.silver { color: #C0C0C0; }
      .ranking-position.bronze { color: #CD7F32; }

      .ranking-score {
        font-size: 20px;
        font-weight: bold;
        color: ${UI_COLORS.primary};
        font-family: 'Courier New', monospace;
        flex: 1;
        text-align: right;
        margin-right: 20px;
      }

      .ranking-details {
        font-size: 12px;
        color: ${UI_COLORS.secondary};
        text-align: right;
        min-width: 100px;
      }

      .ranking-empty {
        color: rgba(255, 255, 255, 0.3);
        font-style: italic;
        padding: 30px;
      }

      .ranking-buttons {
        display: flex;
        justify-content: center;
      }

      /* Mobile/Desktop visibility */
      .desktop-only {
        display: block;
      }
      .mobile-only {
        display: none;
      }

      @media (max-width: 768px), (pointer: coarse) {
        .desktop-only {
          display: none !important;
        }
        .mobile-only {
          display: flex !important;
        }
        #game-hud .hud-bottom-left {
          position: fixed !important;
          top: 50% !important;
          bottom: auto !important;
          left: 10px !important;
          transform: translateY(-50%) scale(0.65);
          transform-origin: left center;
        }
        #game-hud .hud-bottom-right {
          position: fixed !important;
          top: 50% !important;
          bottom: auto !important;
          right: 10px !important;
          transform: translateY(-50%) scale(0.65);
          transform-origin: right center;
        }
      }

      /* Touch Controls */
      .touch-controls {
        position: fixed;
        bottom: 20px;
        left: 0;
        right: 0;
        display: flex;
        justify-content: space-between;
        padding: 0 15px;
        pointer-events: none;
        z-index: 1001;
      }

      .touch-pad {
        display: flex;
        flex-direction: column;
        gap: 8px;
        pointer-events: auto;
      }

      .touch-pad-left {
        align-items: flex-start;
      }

      .touch-pad-right {
        align-items: flex-end;
      }

      .touch-row {
        display: flex;
        gap: 8px;
      }

      .touch-btn {
        width: 60px;
        height: 60px;
        border: 2px solid ${UI_COLORS.primary};
        border-radius: 8px;
        background: rgba(0, 20, 40, 0.7);
        color: ${UI_COLORS.primary};
        font-family: 'Orbitron', 'Segoe UI', sans-serif;
        font-size: 14px;
        font-weight: bold;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        user-select: none;
        -webkit-user-select: none;
        touch-action: manipulation;
        transition: all 0.1s ease;
        text-shadow: 0 0 5px ${UI_COLORS.primary};
        box-shadow: 0 0 10px rgba(0, 255, 136, 0.2);
      }

      .touch-btn:active,
      .touch-btn.active {
        background: ${UI_COLORS.primary};
        color: #000;
        box-shadow: 0 0 20px ${UI_COLORS.primary};
        transform: scale(0.95);
      }

      .touch-fire {
        border-color: ${UI_COLORS.danger};
        color: ${UI_COLORS.danger};
        text-shadow: 0 0 5px ${UI_COLORS.danger};
        box-shadow: 0 0 10px rgba(255, 51, 51, 0.2);
      }

      .touch-fire:active,
      .touch-fire.active {
        background: ${UI_COLORS.danger};
        color: #000;
        box-shadow: 0 0 20px ${UI_COLORS.danger};
      }

      .touch-view {
        border-color: ${UI_COLORS.secondary};
        color: ${UI_COLORS.secondary};
        text-shadow: 0 0 5px ${UI_COLORS.secondary};
        box-shadow: 0 0 10px rgba(0, 170, 255, 0.2);
      }

      .touch-view:active,
      .touch-view.active {
        background: ${UI_COLORS.secondary};
        color: #000;
        box-shadow: 0 0 20px ${UI_COLORS.secondary};
      }

      /* Larger touch targets for mobile */
      @media (max-width: 480px) {
        .touch-btn {
          width: 50px;
          height: 50px;
          font-size: 12px;
        }
        .touch-row {
          gap: 5px;
        }
        .touch-pad {
          gap: 5px;
        }
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Update HP display
   */
  updateHP(value) {
    this.hp = Math.max(0, Math.min(100, value));
    this.elements.hpBar.style.width = `${this.hp}%`;
    this.elements.hpValue.textContent = Math.floor(this.hp);
  }

  /**
   * Update Boost display
   */
  updateBoost(value) {
    this.boost = Math.max(0, Math.min(100, value));
    this.elements.boostBar.style.width = `${this.boost}%`;
    this.elements.boostValue.textContent = Math.floor(this.boost);
  }

  /**
   * Update Timer display
   */
  updateTimer(seconds) {
    this.timer = seconds;
    this.elements.timer.textContent = formatTime(seconds);

    // Warning color when low
    if (seconds < 30) {
      this.elements.timer.style.color = UI_COLORS.danger;
    } else if (seconds < 60) {
      this.elements.timer.style.color = UI_COLORS.warning;
    }
  }

  /**
   * Update Score display
   */
  updateScore(value) {
    this.score = value;
    this.elements.score.textContent = formatNumber(value);
  }

  /**
   * Add score with popup
   */
  addScore(points, x, y) {
    this.score += points;
    this.updateScore(this.score);

    // Create popup
    const popup = document.createElement('div');
    popup.className = 'score-popup';
    popup.textContent = `+${formatNumber(points)}`;
    popup.style.left = `${x || 50}%`;
    popup.style.top = `${y || 50}%`;
    this.elements.scorePopupContainer.appendChild(popup);

    // Remove after animation
    setTimeout(() => popup.remove(), 1000);
  }

  /**
   * Update Combo display
   */
  updateCombo(count, timerPercent) {
    this.combo = count;

    if (count > 0) {
      this.elements.comboDisplay.classList.add('active');
      this.elements.comboCount.textContent = `x${count}`;
      this.elements.comboTimerBar.style.setProperty('--timer-width', `${timerPercent}%`);
    } else {
      this.elements.comboDisplay.classList.remove('active');
    }
  }

  /**
   * Update current weapon
   */
  updateWeapon(index) {
    this.currentWeapon = index;

    this.elements.weapon1.classList.toggle('active', index === 0);
    this.elements.weapon2.classList.toggle('active', index === 1);
  }

  /**
   * Update ammo display
   */
  updateAmmo(weaponIndex, current, max) {
    this.ammo[weaponIndex] = current;
    this.maxAmmo[weaponIndex] = max;

    if (weaponIndex === 0) {
      this.elements.ammo1.textContent = current;
    } else {
      this.elements.ammo2.textContent = current;
    }
  }

  /**
   * Update destruction rate
   */
  updateDestructionRate(percent) {
    this.destructionRate = percent;
    this.elements.destructionRate.textContent = Math.floor(percent);
    this.elements.destructionBar.style.width = `${percent}%`;
    this.elements.destructionValue.textContent = `${Math.floor(percent)}%`;
  }

  /**
   * Set crosshair hit state
   */
  setCrosshairHit(isHit) {
    if (isHit) {
      this.elements.crosshair.style.color = UI_COLORS.danger;
    } else {
      this.elements.crosshair.style.color = UI_COLORS.primary;
    }
  }

  /**
   * Show/hide HUD
   */
  setVisible(visible) {
    this.container.style.display = visible ? 'block' : 'none';
  }

  /**
   * Update method (called every frame)
   */
  update(deltaTime) {
    // Combo timer countdown handled externally
  }

  /**
   * Show a temporary message on screen
   */
  showMessage(text, duration = 2000) {
    // Remove existing message if any
    const existing = document.getElementById('hud-message');
    if (existing) {
      existing.remove();
    }

    // Create message element
    const message = document.createElement('div');
    message.id = 'hud-message';
    message.textContent = text;
    message.style.cssText = `
      position: fixed;
      top: 40%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-family: 'Orbitron', 'Rajdhani', sans-serif;
      font-size: 24px;
      font-weight: bold;
      color: ${UI_COLORS.primary};
      text-shadow: 0 0 10px ${UI_COLORS.primary}, 0 0 20px ${UI_COLORS.primary};
      background: rgba(0, 10, 20, 0.8);
      padding: 15px 30px;
      border: 2px solid ${UI_COLORS.primary};
      border-radius: 5px;
      z-index: 2000;
      animation: messagePopup 0.3s ease-out;
    `;

    // Add animation keyframes if not exists
    if (!document.getElementById('hud-message-style')) {
      const style = document.createElement('style');
      style.id = 'hud-message-style';
      style.textContent = `
        @keyframes messagePopup {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
          100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
        @keyframes messageFadeOut {
          0% { opacity: 1; }
          100% { opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }

    document.body.appendChild(message);

    // Remove after duration
    setTimeout(() => {
      message.style.animation = 'messageFadeOut 0.3s ease-out';
      setTimeout(() => {
        if (message.parentNode) {
          message.remove();
        }
      }, 300);
    }, duration);
  }

  /**
   * Show game over screen
   */
  showGameOver(data) {
    const {
      title = 'GAME OVER',
      reason = '',
      score = 0,
      destruction = 0,
      time = 0,
      rank = -1,
      isVictory = false,
    } = data;

    // Update title
    this.elements.gameOverTitle.textContent = title;
    this.elements.gameOverTitle.classList.toggle('victory', isVictory);

    // Update reason
    this.elements.gameOverReason.textContent = reason;

    // Update rank display
    if (rank > 0 && rank <= 10) {
      this.elements.gameOverRank.textContent = `🏆 ${rank}위 달성!`;
      this.elements.gameOverRank.classList.toggle('new-record', rank === 1);
    } else {
      this.elements.gameOverRank.textContent = '';
    }

    // Update stats
    this.elements.finalScore.textContent = formatNumber(score);
    this.elements.finalDestruction.textContent = `${Math.floor(destruction)}%`;
    this.elements.finalTime.textContent = formatTime(time);

    // Show screen
    this.elements.gameOverScreen.classList.add('active');
  }

  /**
   * Hide game over screen
   */
  hideGameOver() {
    this.elements.gameOverScreen.classList.remove('active');
  }

  /**
   * Show ranking screen
   */
  showRankings(rankings, currentScore = null) {
    // Clear existing list
    this.elements.rankingList.innerHTML = '';

    if (rankings.length === 0) {
      this.elements.rankingList.innerHTML = '<div class="ranking-empty">기록이 없습니다</div>';
    } else {
      rankings.forEach((entry, index) => {
        const position = index + 1;
        const isCurrent = currentScore !== null && entry.score === currentScore;

        let positionClass = '';
        if (position === 1) positionClass = 'gold';
        else if (position === 2) positionClass = 'silver';
        else if (position === 3) positionClass = 'bronze';

        const itemClass = `ranking-item ${positionClass} ${isCurrent ? 'current' : ''}`;

        const item = document.createElement('div');
        item.className = itemClass;
        item.innerHTML = `
          <div class="ranking-position ${positionClass}">${position}</div>
          <div class="ranking-score">${formatNumber(entry.score)}</div>
          <div class="ranking-details">
            <div>파괴율: ${entry.destruction}%</div>
            <div>남은시간: ${formatTime(entry.time)}</div>
          </div>
        `;

        this.elements.rankingList.appendChild(item);
      });
    }

    // Show screen
    this.elements.rankingScreen.classList.add('active');
  }

  /**
   * Hide ranking screen
   */
  hideRankings() {
    this.elements.rankingScreen.classList.remove('active');
  }

  /**
   * Set up button event listeners
   */
  setupGameOverButtons(onRestart, onRanking, onRankingBack) {
    // Restart button
    this.elements.restartBtn.addEventListener('click', () => {
      this.hideGameOver();
      if (onRestart) onRestart();
    });

    // Ranking button
    this.elements.rankingBtn.addEventListener('click', () => {
      if (onRanking) onRanking();
    });

    // Ranking back button
    this.elements.rankingBackBtn.addEventListener('click', () => {
      this.hideRankings();
      if (onRankingBack) onRankingBack();
    });
  }

  /**
   * Set up touch controls for mobile
   * @param {InputManager} inputManager - Reference to the input manager
   */
  setupTouchControls(inputManager) {
    const touchControls = document.getElementById('touch-controls');
    if (!touchControls) return;

    // Store reference for cleanup
    this.inputManager = inputManager;

    // Get all touch buttons
    const touchButtons = touchControls.querySelectorAll('.touch-btn');

    touchButtons.forEach(btn => {
      const keyCode = btn.dataset.key;
      const action = btn.dataset.action;

      // Handle touch start
      const handleTouchStart = (e) => {
        e.preventDefault();
        btn.classList.add('active');

        if (keyCode) {
          inputManager.onTouchButtonDown(keyCode);
        } else if (action === 'fire') {
          inputManager.onTouchFireDown();
        } else if (action === 'view') {
          inputManager.onTouchViewDown();
        }
      };

      // Handle touch end
      const handleTouchEnd = (e) => {
        e.preventDefault();
        btn.classList.remove('active');

        if (keyCode) {
          inputManager.onTouchButtonUp(keyCode);
        } else if (action === 'fire') {
          inputManager.onTouchFireUp();
        } else if (action === 'view') {
          inputManager.onTouchViewUp();
        }
      };

      // Touch events
      btn.addEventListener('touchstart', handleTouchStart, { passive: false });
      btn.addEventListener('touchend', handleTouchEnd, { passive: false });
      btn.addEventListener('touchcancel', handleTouchEnd, { passive: false });

      // Mouse events for testing on desktop
      btn.addEventListener('mousedown', handleTouchStart);
      btn.addEventListener('mouseup', handleTouchEnd);
      btn.addEventListener('mouseleave', (e) => {
        if (btn.classList.contains('active')) {
          handleTouchEnd(e);
        }
      });
    });

    // Prevent default touch behavior on the touch pads
    const touchPads = touchControls.querySelectorAll('.touch-pad');
    touchPads.forEach(pad => {
      pad.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
    });
  }

  /**
   * Dispose HUD
   */
  dispose() {
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }
}
