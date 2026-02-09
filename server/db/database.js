/**
 * Database Module - LowDB based persistent storage
 * Handles score data storage and retrieval
 */

import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Database schema
const defaultData = {
  scores: [],
  metadata: {
    createdAt: new Date().toISOString(),
    version: '1.0.0'
  }
};

// Initialize database
const dbFile = join(__dirname, 'scores.json');
const adapter = new JSONFile(dbFile);
const db = new Low(adapter, defaultData);

/**
 * Initialize the database
 * Creates the file if it doesn't exist
 */
export async function initDatabase() {
  await db.read();

  // Ensure default structure exists
  if (!db.data) {
    db.data = defaultData;
    await db.write();
  }

  // Ensure scores array exists
  if (!db.data.scores) {
    db.data.scores = [];
    await db.write();
  }

  console.log('[Database] Initialized successfully');
  console.log(`[Database] Current records: ${db.data.scores.length}`);
}

/**
 * Add a new score record
 * @param {Object} scoreData - Score data object
 * @param {string} scoreData.playerName - Player name
 * @param {number} scoreData.score - Score value
 * @param {number} scoreData.destructionRate - Destruction percentage (0-100)
 * @param {number} scoreData.playTime - Play time in seconds
 * @returns {Object} The created score record with ID and rank
 */
export async function addScore(scoreData) {
  await db.read();

  const record = {
    id: generateId(),
    playerName: sanitizePlayerName(scoreData.playerName),
    score: Math.max(0, Math.floor(scoreData.score)),
    destructionRate: Math.min(100, Math.max(0, parseFloat(scoreData.destructionRate.toFixed(2)))),
    playTime: Math.max(0, Math.floor(scoreData.playTime)),
    createdAt: new Date().toISOString()
  };

  db.data.scores.push(record);

  // Sort scores descending
  db.data.scores.sort((a, b) => b.score - a.score);

  await db.write();

  // Calculate rank
  const rank = db.data.scores.findIndex(s => s.id === record.id) + 1;

  return { ...record, rank };
}

/**
 * Get top scores
 * @param {number} limit - Number of scores to retrieve (default: 10)
 * @returns {Array} Array of score records
 */
export async function getTopScores(limit = 10) {
  await db.read();

  return db.data.scores
    .slice(0, Math.min(limit, 100)) // Max 100 records
    .map((score, index) => ({
      ...score,
      rank: index + 1
    }));
}

/**
 * Get scores by player name
 * @param {string} playerName - Player name to search
 * @returns {Array} Array of score records for the player
 */
export async function getPlayerScores(playerName) {
  await db.read();

  const sanitizedName = sanitizePlayerName(playerName).toLowerCase();

  const playerScores = db.data.scores
    .filter(s => s.playerName.toLowerCase() === sanitizedName)
    .map(score => {
      const rank = db.data.scores.findIndex(s => s.id === score.id) + 1;
      return { ...score, rank };
    });

  return playerScores;
}

/**
 * Get the current high score
 * @returns {Object|null} The highest score record or null
 */
export async function getHighScore() {
  await db.read();

  if (db.data.scores.length === 0) {
    return null;
  }

  return { ...db.data.scores[0], rank: 1 };
}

/**
 * Check if a score is a new high score
 * @param {number} score - Score to check
 * @returns {boolean} True if it's a new high score
 */
export async function isNewHighScore(score) {
  const currentHigh = await getHighScore();
  return currentHigh === null || score > currentHigh.score;
}

/**
 * Get total number of scores
 * @returns {number} Total count of score records
 */
export async function getTotalScores() {
  await db.read();
  return db.data.scores.length;
}

/**
 * Get player rank for a specific score
 * @param {number} score - Score value
 * @returns {number} Rank position
 */
export async function getScoreRank(score) {
  await db.read();

  const higherScores = db.data.scores.filter(s => s.score > score);
  return higherScores.length + 1;
}

// Utility functions

/**
 * Generate a unique ID
 * @returns {string} UUID-like string
 */
function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Sanitize player name to prevent XSS and limit length
 * @param {string} name - Raw player name
 * @returns {string} Sanitized name
 */
function sanitizePlayerName(name) {
  if (!name || typeof name !== 'string') {
    return 'Anonymous';
  }

  // Remove HTML tags and special characters
  const sanitized = name
    .replace(/<[^>]*>/g, '')
    .replace(/[<>\"\'&]/g, '')
    .trim()
    .substring(0, 20); // Max 20 characters

  return sanitized || 'Anonymous';
}

export default {
  initDatabase,
  addScore,
  getTopScores,
  getPlayerScores,
  getHighScore,
  isNewHighScore,
  getTotalScores,
  getScoreRank
};
