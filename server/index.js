import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import cors from 'cors';
import seasonsRouter from './routes/seasons.js';
import contestsRouter from './routes/contests.js';
import problemsRouter from './routes/problems.js';
import { dbService } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/seasons', seasonsRouter);
app.use('/api/contests', contestsRouter);
app.use('/api/problems', problemsRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Serve frontend build if dist directory exists
const clientDistPath = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/ws')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// Create HTTP server
const server = http.createServer(app);

// WebSocket Server
const wss = new WebSocketServer({ server, path: '/ws' });

// Store active connections: contestId -> Set<WebSocket>
const contestRooms = new Map();

wss.on('connection', (ws, req) => {
  let currentContestId = null;
  let currentUsername = null;

  ws.isAlive = true;
  ws.on('pong', () => {
    ws.isAlive = true;
  });

  ws.on('message', (messageRaw) => {
    try {
      const data = JSON.parse(messageRaw.toString());
      const { type, payload } = data;

      switch (type) {
        case 'JOIN_ROOM': {
          const { contestId, username } = payload || {};
          if (!contestId) return;

          currentContestId = contestId;
          currentUsername = username || 'Guest';

          if (!contestRooms.has(contestId)) {
            contestRooms.set(contestId, new Set());
          }
          contestRooms.get(contestId).add(ws);

          // Send current state to newly joined client
          const contest = dbService.getContest(contestId);
          const messages = dbService.getMessages(contestId);

          ws.send(JSON.stringify({
            type: 'ROOM_SYNC',
            payload: { contest, messages }
          }));
          break;
        }

        case 'LEAVE_ROOM': {
          if (currentContestId && contestRooms.has(currentContestId)) {
            contestRooms.get(currentContestId).delete(ws);
          }
          currentContestId = null;
          break;
        }

        case 'PING': {
          ws.send(JSON.stringify({ type: 'PONG', timestamp: Date.now() }));
          break;
        }

        default:
          break;
      }
    } catch (err) {
      console.error('Error handling WS message:', err);
    }
  });

  ws.on('close', () => {
    if (currentContestId && contestRooms.has(currentContestId)) {
      contestRooms.get(currentContestId).delete(ws);
      if (contestRooms.get(currentContestId).size === 0) {
        contestRooms.delete(currentContestId);
      }
    }
  });
});

// Broadcast helper function attached to app.locals
function broadcastContestUpdate(contestId, actionType, payload) {
  const room = contestRooms.get(contestId);
  if (!room) return;

  const message = JSON.stringify({
    type: actionType,
    contestId,
    payload,
    timestamp: Date.now()
  });

  room.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

app.locals.broadcastContestUpdate = broadcastContestUpdate;

// Heartbeat interval to keep connections alive
const pingInterval = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (!ws.isAlive) return ws.terminate();
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

wss.on('close', () => {
  clearInterval(pingInterval);
});

server.listen(PORT, () => {
  console.log(`🚀 LeetJam server running at http://localhost:${PORT}`);
  console.log(`⚡ WebSocket server active at ws://localhost:${PORT}/ws`);
});
