import http from 'http';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import leaderboardRouter from './routes/leaderboard.js';
import { setupDuelWebSocket } from './duelServer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '..');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/leaderboard', leaderboardRouter);

// Booth Stats Endpoint
app.get('/api/stats', (req, res) => {
  res.json({
    status: 'ONLINE',
    booth: 'FU-DEVER TECH LAB',
    game: 'BUG DASH - NÉ BUG CHẠY DEADLINE',
    event: 'FPT UNIVERSITY DA NANG BOOTH 2026',
    serverTime: new Date().toISOString()
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// Serve frontend static files (prefer production dist if built, fallback to root)
import fs from 'fs';
const DIST_DIR = path.join(ROOT_DIR, 'dist');
if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
}
app.use(express.static(ROOT_DIR));

// Setup Real-time 1v1 Duel WebSocket
setupDuelWebSocket(server);

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n======================================================`);
  console.log(`🚀 FU-DEVER BUG DASH GAME SERVER RUNNING!`);
  console.log(`🌐 Local API & Game: http://localhost:${PORT}`);
  console.log(`⚔️ 1v1 Duel Server: ws://localhost:${PORT}/ws/duel`);
  console.log(`📊 Leaderboard API: http://localhost:${PORT}/api/leaderboard`);
  console.log(`======================================================\n`);
});
