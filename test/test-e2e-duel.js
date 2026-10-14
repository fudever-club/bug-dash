// FU-DEVER BUG DASH - Automated E2E Duel & API Verification Test
// Tests HTTP Server, WebSocket Handshake, Room Lifecycle, Countdown, State Sync, and Counter Attacks.

import http from 'http';
import express from 'express';
import cors from 'cors';
import { WebSocket } from 'ws';
import { setupDuelWebSocket } from '../server/duelServer.js';

function log(msg) {
  process.stdout.write(`[TEST] ${msg}\n`);
}

class TestClient {
  constructor(url) {
    this.ws = new WebSocket(url);
    this.listeners = [];
    this.ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        for (let i = this.listeners.length - 1; i >= 0; i--) {
          const l = this.listeners[i];
          if (l.type === msg.type) {
            this.listeners.splice(i, 1);
            l.resolve(msg);
          }
        }
      } catch (e) {
        console.error('Parse error:', e);
      }
    });
  }

  waitOpen() {
    return new Promise((resolve) => this.ws.on('open', resolve));
  }

  send(msg) {
    this.ws.send(JSON.stringify(msg));
  }

  waitFor(type, timeoutMs = 8000) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Timeout waiting for message type: ${type}`));
      }, timeoutMs);

      this.listeners.push({
        type,
        resolve: (msg) => {
          clearTimeout(timer);
          resolve(msg);
        }
      });
    });
  }

  close() {
    this.ws.close();
  }
}

async function runTest() {
  log('Starting ephemeral test server on random free port...');
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
  app.get('/api/stats', (req, res) => res.json({ status: 'ONLINE', game: 'BUG DASH' }));

  const server = http.createServer(app);
  setupDuelWebSocket(server);

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  log(`Test server is listening on 127.0.0.1:${port}`);

  // 1. Verify HTTP Health
  const res = await fetch(`http://127.0.0.1:${port}/api/stats`);
  const stats = await res.json();
  if (stats.status !== 'ONLINE') {
    throw new Error(`Unexpected stats status: ${JSON.stringify(stats)}`);
  }
  log(`HTTP /api/stats verified: ONLINE`);

  // 2. Connect 2 WebSocket Clients
  const wsUrl = `ws://127.0.0.1:${port}/ws/duel`;
  const host = new TestClient(wsUrl);
  const guest = new TestClient(wsUrl);

  await Promise.all([host.waitOpen(), guest.waitOpen()]);
  log(`Both Host and Guest WebSocket clients connected successfully`);

  // 3. Test Room Creation
  const pCreated = host.waitFor('ROOM_CREATED');
  host.send({ type: 'CREATE_ROOM', name: 'Tester Host' });
  const roomCreatedMsg = await pCreated;
  const roomCode = roomCreatedMsg.code;
  log(`Room successfully created with code #${roomCode}`);

  // 4. Test Room Joining
  const pGuestJoined = guest.waitFor('ROOM_JOINED');
  const pHostNotified = host.waitFor('OPPONENT_JOINED');

  guest.send({ type: 'JOIN_ROOM', code: roomCode, name: 'Tester Guest' });
  const [guestJoinedMsg, hostNotifiedMsg] = await Promise.all([pGuestJoined, pHostNotified]);

  log(`Guest joined room #${roomCode} and Host was notified of ${hostNotifiedMsg.opponentName}!`);

  // 5. Test Start Match & Countdown
  const pHostMatchStart = host.waitFor('MATCH_START');
  const pGuestMatchStart = guest.waitFor('MATCH_START');

  host.send({ type: 'START_MATCH' });
  log('Host triggered START_MATCH, awaiting 3-2-1 countdown and MATCH_START...');

  await Promise.all([pHostMatchStart, pGuestMatchStart]);
  log('MATCH_START broadcast received by both players!');

  // 6. Test State Telemetry Exchange
  const pTelemetry = guest.waitFor('OPPONENT_STATE');
  host.send({
    type: 'STATE_UPDATE',
    score: 420,
    lives: 3,
    time: 55,
    lane: 2,
    isFever: true
  });

  const telemetryMsg = await pTelemetry;
  if (telemetryMsg.score !== 420 || telemetryMsg.lane !== 2 || !telemetryMsg.isFever) {
    throw new Error(`Telemetry mismatch: ${JSON.stringify(telemetryMsg)}`);
  }
  log(`Telemetry verified: Guest received Host's score (420), lane (2), and fever status.`);

  // 7. Test Counter-Attack
  const pAttack = guest.waitFor('INCOMING_ATTACK');
  host.send({
    type: 'ATTACK_OPPONENT',
    attackType: 'deadline_surge',
    lane: 0
  });

  const attackMsg = await pAttack;
  if (attackMsg.attackType !== 'deadline_surge' || attackMsg.lane !== 0) {
    throw new Error(`Attack mismatch: ${JSON.stringify(attackMsg)}`);
  }
  log(`Counter-Attack verified: Guest received INCOMING_ATTACK on lane 0!`);

  // 8. Test Elimination & Match Result
  const pHostResult = host.waitFor('MATCH_RESULT');
  const pGuestResult = guest.waitFor('MATCH_RESULT');

  guest.send({ type: 'PLAYER_ELIMINATED' });
  const [hostResult, guestResult] = await Promise.all([pHostResult, pGuestResult]);

  if (hostResult.winnerRole !== 'host' || guestResult.winnerRole !== 'host') {
    throw new Error(`Result mismatch: ${JSON.stringify(hostResult)}`);
  }
  log(`Match Result verified: Host declared winner by knockout!`);

  // Clean up
  host.close();
  guest.close();
  await new Promise((resolve) => server.close(resolve));
  log('Ephemeral test server closed.');
  log('========================================================');
  log('ALL REAL-TIME DUEL E2E CHECKS PASSED WITH 100% SUCCESS!');
  log('========================================================');
}

runTest().then(() => {
  process.exit(0);
}).catch((err) => {
  console.error('[TEST ERROR]', err);
  process.exit(1);
});
