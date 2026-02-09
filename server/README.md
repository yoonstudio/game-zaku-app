# Zaku Colony Destroyer - Game Server

Backend server for the Zaku Colony Destroyer game, providing online leaderboard and real-time features.

## Features

- **REST API**: Score submission and leaderboard retrieval
- **WebSocket**: Real-time player count and high score notifications
- **Rate Limiting**: Protection against spam and abuse
- **Security**: CORS, Helmet, and input validation

## Quick Start

```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Start server
npm start

# Or with auto-reload for development
npm run dev
```

Server will start on `http://localhost:3001`

## API Endpoints

### Health Check
```
GET /health
```
Returns server status and connected player count.

### Submit Score
```
POST /api/scores
Content-Type: application/json

{
  "playerName": "Player1",
  "score": 12500,
  "destructionRate": 85.5,
  "playTime": 245
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "1706123456789-abc123",
    "playerName": "Player1",
    "score": 12500,
    "destructionRate": 85.5,
    "playTime": 245,
    "rank": 1,
    "isNewHighScore": true,
    "createdAt": "2026-01-24T10:00:00.000Z"
  }
}
```

### Get Leaderboard
```
GET /api/scores?limit=10
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "playerName": "Player1",
      "score": 12500,
      "rank": 1,
      ...
    }
  ],
  "meta": {
    "limit": 10,
    "count": 5
  }
}
```

### Get Player Scores
```
GET /api/scores/:playerName
```

**Response:**
```json
{
  "success": true,
  "data": [...],
  "meta": {
    "playerName": "Player1",
    "totalGames": 5,
    "bestScore": 12500,
    "bestRank": 1
  }
}
```

## WebSocket

Connect to `ws://localhost:3001/ws` for real-time updates.

### Message Types (Server -> Client)

**connected**: Initial connection confirmation
```json
{
  "type": "connected",
  "data": {
    "message": "Connected to Zaku Colony Destroyer server",
    "serverTime": "2026-01-24T10:00:00.000Z",
    "playerCount": 5
  }
}
```

**playerCount**: Current online player count (sent every 5 seconds)
```json
{
  "type": "playerCount",
  "data": {
    "count": 5,
    "timestamp": "2026-01-24T10:00:00.000Z"
  }
}
```

**newHighScore**: New high score achieved
```json
{
  "type": "newHighScore",
  "data": {
    "playerName": "Player1",
    "score": 15000,
    "destructionRate": 92.5,
    "timestamp": "2026-01-24T10:00:00.000Z"
  }
}
```

## Configuration

Environment variables:
- `PORT`: Server port (default: 3001)
- `HOST`: Server host (default: 0.0.0.0)
- `NODE_ENV`: Environment mode (development/production)
- `FRONTEND_URL`: Frontend URL for CORS (optional)

## Client Integration

The game can optionally connect to the server using the `ServerService`:

```javascript
import { serverService } from './services/ServerService.js';

// Connect to server (optional - game works offline too)
const connected = await serverService.connect();

if (connected) {
  // Submit score to online leaderboard
  const result = await serverService.submitScore({
    playerName: 'Player1',
    score: 12500,
    destructionRate: 85.5,
    playTime: 245
  });

  // Get online leaderboard
  const leaderboard = await serverService.getLeaderboard(10);

  // Listen for real-time events
  serverService.on('playerCount', (data) => {
    console.log(`Online players: ${data.count}`);
  });

  serverService.on('newHighScore', (data) => {
    console.log(`New high score by ${data.playerName}: ${data.score}`);
  });
}
```

## Rate Limits

- General API: 100 requests per minute
- Score submission: 10 requests per minute

## Data Storage

Scores are stored in `db/scores.json` using LowDB. The file is automatically created on first run.

## Security Features

- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing configuration
- **Rate Limiting**: Prevent spam and abuse
- **Input Validation**: Sanitized player names, validated score data
- **Body Size Limit**: 1KB max request body
