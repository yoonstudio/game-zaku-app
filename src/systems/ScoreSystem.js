/**
 * Score System
 * Manages scoring, combos, and high scores
 */

import { GAME } from '../utils/Constants.js';

export class ScoreSystem {
  constructor() {
    // Score state
    this.score = 0;
    this.highScore = this.loadHighScore();

    // Combo state
    this.combo = 0;
    this.comboTimer = 0;
    this.comboTimeout = GAME.comboTimeout;

    // Statistics
    this.stats = {
      totalDamage: 0,
      sectionsDestroyed: 0,
      maxCombo: 0,
      accuracy: 0,
      shotsFired: 0,
      shotsHit: 0,
    };
  }

  /**
   * Add score with combo multiplier
   */
  addScore(basePoints) {
    // Apply combo multiplier
    const comboMultiplier = 1 + (this.combo * 0.1);
    const points = Math.floor(basePoints * comboMultiplier);

    this.score += points;

    // Increment combo
    this.combo++;
    this.comboTimer = this.comboTimeout;

    // Track max combo
    if (this.combo > this.stats.maxCombo) {
      this.stats.maxCombo = this.combo;
    }

    return {
      points,
      combo: this.combo,
      multiplier: comboMultiplier,
    };
  }

  /**
   * Update combo timer
   */
  update(deltaTime) {
    if (this.combo > 0) {
      this.comboTimer -= deltaTime * 1000;

      if (this.comboTimer <= 0) {
        this.resetCombo();
      }
    }
  }

  /**
   * Reset combo
   */
  resetCombo() {
    this.combo = 0;
    this.comboTimer = 0;
  }

  /**
   * Get combo timer percentage (for UI)
   */
  getComboTimerPercent() {
    if (this.combo === 0) return 0;
    return (this.comboTimer / this.comboTimeout) * 100;
  }

  /**
   * Record a shot fired
   */
  recordShot(hit) {
    this.stats.shotsFired++;
    if (hit) {
      this.stats.shotsHit++;
    }
    this.stats.accuracy = (this.stats.shotsHit / this.stats.shotsFired) * 100;
  }

  /**
   * Record damage dealt
   */
  recordDamage(damage) {
    this.stats.totalDamage += damage;
  }

  /**
   * Record section destroyed
   */
  recordDestruction() {
    this.stats.sectionsDestroyed++;
  }

  /**
   * Calculate final score with bonuses
   */
  calculateFinalScore(timeRemaining, destructionPercent) {
    let finalScore = this.score;

    // Time bonus
    const timeBonus = Math.floor(timeRemaining * 50);
    finalScore += timeBonus;

    // Destruction bonus
    const destructionBonus = Math.floor(destructionPercent * 100);
    finalScore += destructionBonus;

    // Combo bonus
    const comboBonus = this.stats.maxCombo * 100;
    finalScore += comboBonus;

    return {
      baseScore: this.score,
      timeBonus,
      destructionBonus,
      comboBonus,
      finalScore,
    };
  }

  /**
   * Check and save high score
   */
  checkHighScore() {
    if (this.score > this.highScore) {
      this.highScore = this.score;
      this.saveHighScore();
      return true;
    }
    return false;
  }

  /**
   * Load high score from localStorage
   */
  loadHighScore() {
    try {
      const saved = localStorage.getItem('zakuColonyDestroyer_highScore');
      return saved ? parseInt(saved, 10) : 0;
    } catch (e) {
      return 0;
    }
  }

  /**
   * Save high score to localStorage
   */
  saveHighScore() {
    try {
      localStorage.setItem('zakuColonyDestroyer_highScore', this.highScore.toString());
    } catch (e) {
      console.warn('Could not save high score');
    }
  }

  /**
   * Load top 10 scores from localStorage
   */
  loadRankings() {
    try {
      const saved = localStorage.getItem('zakuColonyDestroyer_rankings');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  }

  /**
   * Save score to rankings (top 10)
   * @returns {number} Rank position (1-10) or -1 if not in top 10
   */
  saveToRankings(finalScore, destructionPercent, timeRemaining) {
    try {
      const rankings = this.loadRankings();
      const newEntry = {
        score: finalScore,
        destruction: Math.floor(destructionPercent),
        time: Math.floor(timeRemaining),
        date: new Date().toISOString(),
      };

      // Add new entry
      rankings.push(newEntry);

      // Sort by score descending
      rankings.sort((a, b) => b.score - a.score);

      // Keep only top 10
      const topTen = rankings.slice(0, 10);

      // Save to localStorage
      localStorage.setItem('zakuColonyDestroyer_rankings', JSON.stringify(topTen));

      // Find rank of this score
      const rank = topTen.findIndex(entry =>
        entry.score === newEntry.score &&
        entry.date === newEntry.date
      );

      return rank !== -1 ? rank + 1 : -1;
    } catch (e) {
      console.warn('Could not save ranking');
      return -1;
    }
  }

  /**
   * Get top 10 rankings
   */
  getRankings() {
    return this.loadRankings();
  }

  /**
   * Get current state
   */
  getState() {
    return {
      score: this.score,
      highScore: this.highScore,
      combo: this.combo,
      comboTimerPercent: this.getComboTimerPercent(),
      stats: { ...this.stats },
    };
  }

  /**
   * Reset for new game
   */
  reset() {
    this.score = 0;
    this.combo = 0;
    this.comboTimer = 0;
    this.stats = {
      totalDamage: 0,
      sectionsDestroyed: 0,
      maxCombo: 0,
      accuracy: 0,
      shotsFired: 0,
      shotsHit: 0,
    };
  }
}
