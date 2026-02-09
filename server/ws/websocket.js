/**
 * WebSocket Module - Real-time communication handler
 * Manages connected clients, broadcasts events, and handles connection state
 */

import { WebSocketServer } from 'ws';

// Store connected clients
const clients = new Set();

// Store WebSocket server instance
let wss = null;

// Message types
const MessageTypes = {
  // Server -> Client
  CONNECTED: 'connected',
  PLAYER_COUNT: 'playerCount',
  NEW_HIGH_SCORE: 'newHighScore',
  PING: 'ping',

  // Client -> Server
  PONG: 'pong',
  SUBSCRIBE: 'subscribe'
};

/**
 * Initialize WebSocket server
 * @param {Object} server - HTTP server instance
 * @returns {WebSocketServer} WebSocket server instance
 */
export function initWebSocket(server) {
  wss = new WebSocketServer({
    server,
    path: '/ws',
    clientTracking: true
  });

  console.log('[WebSocket] Server initialized on path /ws');

  wss.on('connection', handleConnection);

  // Periodic ping to keep connections alive and detect stale clients
  setInterval(() => {
    wss.clients.forEach((ws) => {
      if (ws.isAlive === false) {
        console.log('[WebSocket] Terminating stale connection');
        clients.delete(ws);
        return ws.terminate();
      }

      ws.isAlive = false;
      sendMessage(ws, { type: MessageTypes.PING });
    });
  }, 30000); // 30 seconds

  // Broadcast player count periodically
  setInterval(() => {
    broadcastPlayerCount();
  }, 5000); // Every 5 seconds

  return wss;
}

/**
 * Handle new WebSocket connection
 * @param {WebSocket} ws - WebSocket client connection
 * @param {Request} req - HTTP request object
 */
function handleConnection(ws, req) {
  // Mark connection as alive
  ws.isAlive = true;

  // Add to clients set
  clients.add(ws);

  // Get client info
  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  console.log(`[WebSocket] New connection from ${clientIp} (Total: ${clients.size})`);

  // Send welcome message
  sendMessage(ws, {
    type: MessageTypes.CONNECTED,
    data: {
      message: 'Connected to Zaku Colony Destroyer server',
      serverTime: new Date().toISOString(),
      playerCount: clients.size
    }
  });

  // Broadcast updated player count
  broadcastPlayerCount();

  // Handle incoming messages
  ws.on('message', (data) => {
    handleMessage(ws, data);
  });

  // Handle pong response
  ws.on('pong', () => {
    ws.isAlive = true;
  });

  // Handle connection close
  ws.on('close', () => {
    clients.delete(ws);
    console.log(`[WebSocket] Connection closed (Remaining: ${clients.size})`);
    broadcastPlayerCount();
  });

  // Handle errors
  ws.on('error', (error) => {
    console.error('[WebSocket] Client error:', error.message);
    clients.delete(ws);
  });
}

/**
 * Handle incoming WebSocket message
 * @param {WebSocket} ws - WebSocket client connection
 * @param {Buffer} rawData - Raw message data
 */
function handleMessage(ws, rawData) {
  try {
    const message = JSON.parse(rawData.toString());

    switch (message.type) {
      case MessageTypes.PONG:
        ws.isAlive = true;
        break;

      case MessageTypes.SUBSCRIBE:
        // Handle subscription requests (for future extensibility)
        console.log(`[WebSocket] Client subscribed to: ${message.channel}`);
        break;

      default:
        console.log(`[WebSocket] Unknown message type: ${message.type}`);
    }
  } catch (error) {
    console.error('[WebSocket] Failed to parse message:', error.message);
  }
}

/**
 * Send message to a specific client
 * @param {WebSocket} ws - WebSocket client connection
 * @param {Object} message - Message object to send
 */
function sendMessage(ws, message) {
  if (ws.readyState === ws.OPEN) {
    try {
      ws.send(JSON.stringify(message));
    } catch (error) {
      console.error('[WebSocket] Failed to send message:', error.message);
    }
  }
}

/**
 * Broadcast message to all connected clients
 * @param {Object} message - Message object to broadcast
 */
function broadcast(message) {
  const messageStr = JSON.stringify(message);

  clients.forEach((ws) => {
    if (ws.readyState === ws.OPEN) {
      try {
        ws.send(messageStr);
      } catch (error) {
        console.error('[WebSocket] Broadcast error:', error.message);
      }
    }
  });
}

/**
 * Broadcast current player count to all clients
 */
export function broadcastPlayerCount() {
  broadcast({
    type: MessageTypes.PLAYER_COUNT,
    data: {
      count: clients.size,
      timestamp: new Date().toISOString()
    }
  });
}

/**
 * Broadcast new high score achievement
 * @param {Object} scoreData - High score data
 * @param {string} scoreData.playerName - Player name
 * @param {number} scoreData.score - Score value
 * @param {number} scoreData.destructionRate - Destruction rate
 */
export function broadcastNewHighScore(scoreData) {
  console.log(`[WebSocket] Broadcasting new high score: ${scoreData.playerName} - ${scoreData.score}`);

  broadcast({
    type: MessageTypes.NEW_HIGH_SCORE,
    data: {
      playerName: scoreData.playerName,
      score: scoreData.score,
      destructionRate: scoreData.destructionRate,
      timestamp: new Date().toISOString()
    }
  });
}

/**
 * Get current connected client count
 * @returns {number} Number of connected clients
 */
export function getConnectedCount() {
  return clients.size;
}

/**
 * Close all connections and shut down WebSocket server
 */
export function closeWebSocket() {
  if (wss) {
    wss.clients.forEach((ws) => {
      ws.close(1000, 'Server shutting down');
    });
    wss.close();
    console.log('[WebSocket] Server closed');
  }
}

export default {
  initWebSocket,
  broadcastPlayerCount,
  broadcastNewHighScore,
  getConnectedCount,
  closeWebSocket
};
