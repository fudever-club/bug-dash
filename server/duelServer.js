// FU-DEVER BUG DASH - Real-Time 1v1 Networked Duel Server
// Powered by WebSocket (ws). Facilitates 2-Laptop battle rooms over Wi-Fi/LAN.

import { WebSocketServer, WebSocket } from 'ws';

export function setupDuelWebSocket(httpServer) {
  const wss = new WebSocketServer({ noServer: true });
  const rooms = new Map();

  httpServer.on('upgrade', (request, socket, head) => {
    const { pathname } = new URL(request.url, `http://${request.headers.host}`);
    if (pathname === '/ws/duel' || pathname === '/ws') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    }
  });

  function generateRoomCode() {
    let code;
    do {
      code = Math.floor(1000 + Math.random() * 9000).toString();
    } while (rooms.has(code));
    return code;
  }

  function send(ws, msg) {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(msg));
    }
  }

  function broadcastRoom(room, msg) {
    send(room.hostWs, msg);
    send(room.guestWs, msg);
  }

  wss.on('connection', (ws) => {
    ws.currentRoomCode = null;
    ws.isHost = false;

    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString());

        switch (msg.type) {
          case 'CREATE_ROOM': {
            const code = generateRoomCode();
            const room = {
              code,
              hostWs: ws,
              guestWs: null,
              hostName: msg.name || 'Player 1',
              guestName: null,
              state: 'waiting',
              hostScore: 0,
              guestScore: 0,
              hostLives: 3,
              guestLives: 3,
            };
            rooms.set(code, room);
            ws.currentRoomCode = code;
            ws.isHost = true;

            send(ws, {
              type: 'ROOM_CREATED',
              code,
              isHost: true,
              playerName: room.hostName
            });
            break;
          }

          case 'JOIN_ROOM': {
            const code = (msg.code || '').trim();
            const room = rooms.get(code);

            if (!room) {
              send(ws, { type: 'ERROR', message: `Không tìm thấy phòng số #${code}!` });
              return;
            }
            if (room.guestWs && room.guestWs.readyState === WebSocket.OPEN) {
              send(ws, { type: 'ERROR', message: `Phòng #${code} đã đủ 2 người chơi!` });
              return;
            }

            room.guestWs = ws;
            room.guestName = msg.name || 'Player 2';
            room.state = 'ready';
            ws.currentRoomCode = code;
            ws.isHost = false;

            send(ws, {
              type: 'ROOM_JOINED',
              code,
              isHost: false,
              playerName: room.guestName,
              opponentName: room.hostName
            });

            send(room.hostWs, {
              type: 'OPPONENT_JOINED',
              opponentName: room.guestName
            });
            break;
          }

          case 'START_MATCH': {
            const room = rooms.get(ws.currentRoomCode);
            if (!room || !ws.isHost || !room.guestWs) return;

            room.state = 'countdown';
            broadcastRoom(room, { type: 'MATCH_COUNTDOWN', count: 3 });

            setTimeout(() => broadcastRoom(room, { type: 'MATCH_COUNTDOWN', count: 2 }), 1000);
            setTimeout(() => broadcastRoom(room, { type: 'MATCH_COUNTDOWN', count: 1 }), 2000);
            setTimeout(() => {
              room.state = 'playing';
              broadcastRoom(room, {
                type: 'MATCH_START',
                duration: 60,
                seed: Date.now()
              });
            }, 3000);
            break;
          }

          case 'STATE_UPDATE': {
            const room = rooms.get(ws.currentRoomCode);
            if (!room) return;

            const target = ws.isHost ? room.guestWs : room.hostWs;
            if (ws.isHost) {
              room.hostScore = msg.score;
              room.hostLives = msg.lives;
            } else {
              room.guestScore = msg.score;
              room.guestLives = msg.lives;
            }

            send(target, {
              type: 'OPPONENT_STATE',
              score: msg.score,
              lives: msg.lives,
              time: msg.time,
              lane: msg.lane,
              isFever: msg.isFever
            });
            break;
          }

          case 'ATTACK_OPPONENT': {
            const room = rooms.get(ws.currentRoomCode);
            if (!room) return;
            const target = ws.isHost ? room.guestWs : room.hostWs;
            send(target, {
              type: 'INCOMING_ATTACK',
              attacker: ws.isHost ? room.hostName : room.guestName,
              attackType: msg.attackType || 'deadline_surge',
              lane: msg.lane !== undefined ? msg.lane : Math.floor(Math.random() * 3)
            });
            break;
          }

          case 'PLAYER_ELIMINATED': {
            const room = rooms.get(ws.currentRoomCode);
            if (!room || room.state !== 'playing') return;
            room.state = 'finished';

            const winnerRole = ws.isHost ? 'guest' : 'host';
            const winnerName = ws.isHost ? room.guestName : room.hostName;

            broadcastRoom(room, {
              type: 'MATCH_RESULT',
              winnerRole,
              winnerName,
              reason: 'knockout',
              hostScore: room.hostScore,
              guestScore: room.guestScore
            });
            break;
          }

          case 'TIME_UP': {
            const room = rooms.get(ws.currentRoomCode);
            if (!room || room.state !== 'playing') return;
            room.state = 'finished';

            let winnerRole = 'draw';
            let winnerName = 'HÒA ĐIỂM';
            if (room.hostScore > room.guestScore) {
              winnerRole = 'host';
              winnerName = room.hostName;
            } else if (room.guestScore > room.hostScore) {
              winnerRole = 'guest';
              winnerName = room.guestName;
            }

            broadcastRoom(room, {
              type: 'MATCH_RESULT',
              winnerRole,
              winnerName,
              reason: 'score',
              hostScore: room.hostScore,
              guestScore: room.guestScore
            });
            break;
          }
        }
      } catch (err) {
        console.error('[DuelServer] Parse error:', err);
      }
    });

    ws.on('close', () => {
      if (ws.currentRoomCode) {
        const room = rooms.get(ws.currentRoomCode);
        if (room) {
          const other = ws.isHost ? room.guestWs : room.hostWs;
          send(other, { type: 'OPPONENT_DISCONNECTED' });
          rooms.delete(ws.currentRoomCode);
        }
      }
    });
  });

  console.log('⚡ FU-DEVER Duel WebSocket Server attached to HTTP server.');
}
