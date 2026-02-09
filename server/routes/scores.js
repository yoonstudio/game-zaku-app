/**
 * Scores Router - REST API endpoints for leaderboard
 * Handles score submission and retrieval
 */

import { Router } from 'express';
import {
  addScore,
  getTopScores,
  getPlayerScores,
  isNewHighScore,
  getScoreRank
} from '../db/database.js';
import { broadcastNewHighScore } from '../ws/websocket.js';

const router = Router();

/**
 * Validation middleware for score submission
 */
function validateScoreInput(req, res, next) {
  const { playerName, score, destructionRate, playTime } = req.body;

  const errors = [];

  // Validate playerName
  if (!playerName || typeof playerName !== 'string') {
    errors.push('playerName is required and must be a string');
  } else if (playerName.trim().length === 0) {
    errors.push('playerName cannot be empty');
  } else if (playerName.length > 20) {
    errors.push('playerName must be 20 characters or less');
  }

  // Validate score
  if (score === undefined || score === null) {
    errors.push('score is required');
  } else if (typeof score !== 'number' || isNaN(score)) {
    errors.push('score must be a valid number');
  } else if (score < 0) {
    errors.push('score cannot be negative');
  } else if (score > 999999999) {
    errors.push('score exceeds maximum allowed value');
  }

  // Validate destructionRate
  if (destructionRate === undefined || destructionRate === null) {
    errors.push('destructionRate is required');
  } else if (typeof destructionRate !== 'number' || isNaN(destructionRate)) {
    errors.push('destructionRate must be a valid number');
  } else if (destructionRate < 0 || destructionRate > 100) {
    errors.push('destructionRate must be between 0 and 100');
  }

  // Validate playTime
  if (playTime === undefined || playTime === null) {
    errors.push('playTime is required');
  } else if (typeof playTime !== 'number' || isNaN(playTime)) {
    errors.push('playTime must be a valid number');
  } else if (playTime < 0) {
    errors.push('playTime cannot be negative');
  } else if (playTime > 86400) { // 24 hours max
    errors.push('playTime exceeds maximum allowed value');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors
    });
  }

  next();
}

/**
 * POST /api/scores
 * Submit a new score
 *
 * Request body:
 * {
 *   playerName: string,
 *   score: number,
 *   destructionRate: number (0-100),
 *   playTime: number (seconds)
 * }
 *
 * Response:
 * {
 *   success: boolean,
 *   data: {
 *     id: string,
 *     playerName: string,
 *     score: number,
 *     destructionRate: number,
 *     playTime: number,
 *     rank: number,
 *     isNewHighScore: boolean,
 *     createdAt: string
 *   }
 * }
 */
router.post('/', validateScoreInput, async (req, res, next) => {
  try {
    const { playerName, score, destructionRate, playTime } = req.body;

    // Check if this will be a new high score before adding
    const willBeHighScore = await isNewHighScore(score);

    // Add the score
    const record = await addScore({
      playerName,
      score,
      destructionRate,
      playTime
    });

    // Broadcast if it's a new high score
    if (willBeHighScore) {
      broadcastNewHighScore({
        playerName: record.playerName,
        score: record.score,
        destructionRate: record.destructionRate
      });
    }

    res.status(201).json({
      success: true,
      data: {
        ...record,
        isNewHighScore: willBeHighScore
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/scores
 * Get top scores (leaderboard)
 *
 * Query parameters:
 * - limit: number (default: 10, max: 100)
 *
 * Response:
 * {
 *   success: boolean,
 *   data: Array<{
 *     id: string,
 *     playerName: string,
 *     score: number,
 *     destructionRate: number,
 *     playTime: number,
 *     rank: number,
 *     createdAt: string
 *   }>
 * }
 */
router.get('/', async (req, res, next) => {
  try {
    let limit = parseInt(req.query.limit) || 10;

    // Validate and cap limit
    if (isNaN(limit) || limit < 1) {
      limit = 10;
    } else if (limit > 100) {
      limit = 100;
    }

    const scores = await getTopScores(limit);

    res.json({
      success: true,
      data: scores,
      meta: {
        limit,
        count: scores.length
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/scores/:playerName
 * Get scores for a specific player
 *
 * Response:
 * {
 *   success: boolean,
 *   data: Array<{
 *     id: string,
 *     playerName: string,
 *     score: number,
 *     destructionRate: number,
 *     playTime: number,
 *     rank: number,
 *     createdAt: string
 *   }>
 * }
 */
router.get('/:playerName', async (req, res, next) => {
  try {
    const { playerName } = req.params;

    if (!playerName || playerName.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Player name is required'
      });
    }

    const scores = await getPlayerScores(playerName);

    if (scores.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No scores found for this player'
      });
    }

    res.json({
      success: true,
      data: scores,
      meta: {
        playerName: scores[0].playerName,
        totalGames: scores.length,
        bestScore: Math.max(...scores.map(s => s.score)),
        bestRank: Math.min(...scores.map(s => s.rank))
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/scores/rank/:score
 * Get the rank for a specific score (useful for showing potential rank before submission)
 *
 * Response:
 * {
 *   success: boolean,
 *   data: {
 *     score: number,
 *     rank: number
 *   }
 * }
 */
router.get('/rank/:score', async (req, res, next) => {
  try {
    const score = parseInt(req.params.score);

    if (isNaN(score) || score < 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid score value'
      });
    }

    const rank = await getScoreRank(score);

    res.json({
      success: true,
      data: {
        score,
        rank
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
