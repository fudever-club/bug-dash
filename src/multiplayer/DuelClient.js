// FU-DEVER BUG DASH - Client WebSocket Manager for 1v1 Networked Duel
// Connects 2 laptops over Wi-Fi / LAN for real-time multiplayer battle.

export class DuelClient {
  constructor(callbacks = {}) {
    this.ws = null;
    this.isConnected = false;
    this.roomCode = null;
    this.isHost = false;
    this.playerName = 'Player';
    this.opponentName = 'Đối Thủ';

    this.callbacks = {
      onConnected: callbacks.onConnected || (() => {}),
      onRoomCreated: callbacks.onRoomCreated || (() => {}),
      onRoomJoined: callbacks.onRoomJoined || (() => {}),
      onOpponentJoined: callbacks.onOpponentJoined || (() => {}),
      onCountdown: callbacks.onCountdown || (() => {}),
      onMatchStart: callbacks.onMatchStart || (() => {}),
      onOpponentState: callbacks.onOpponentState || (() => {}),
      onIncomingAttack: callbacks.onIncomingAttack || (() => {}),
      onMatchResult: callbacks.onMatchResult || (() => {}),
      onOpponentDisconnected: callbacks.onOpponentDisconnected || (() => {}),
      onError: callbacks.onError || (() => {}),
    };
  }

  getWsUrl() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // If running in Vite dev server (port 5173), route through Vite /ws proxy
    return `${protocol}//${window.location.host}/ws/duel`;
  }

  connect() {
    return new Promise((resolve, reject) => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      try {
        const url = this.getWsUrl();
        this.ws = new WebSocket(url);

        this.ws.onopen = () => {
          this.isConnected = true;
          this.callbacks.onConnected();
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.handleMessage(data);
          } catch (e) {
            console.error('[DuelClient] Parse message error:', e);
          }
        };

        this.ws.onerror = (err) => {
          console.warn('[DuelClient] WebSocket error:', err);
          this.callbacks.onError('Không thể kết nối đến máy chủ 1v1. Vui lòng kiểm tra Wi-Fi!');
          reject(err);
        };

        this.ws.onclose = () => {
          this.isConnected = false;
        };
      } catch (err) {
        reject(err);
      }
    });
  }

  handleMessage(msg) {
    switch (msg.type) {
      case 'ROOM_CREATED':
        this.roomCode = msg.code;
        this.isHost = true;
        this.playerName = msg.playerName;
        this.callbacks.onRoomCreated(msg.code, true);
        break;

      case 'ROOM_JOINED':
        this.roomCode = msg.code;
        this.isHost = false;
        this.playerName = msg.playerName;
        this.opponentName = msg.opponentName || 'Player 1';
        this.callbacks.onRoomJoined(msg.code, false, this.opponentName);
        break;

      case 'OPPONENT_JOINED':
        this.opponentName = msg.opponentName || 'Player 2';
        this.callbacks.onOpponentJoined(this.opponentName);
        break;

      case 'MATCH_COUNTDOWN':
        this.callbacks.onCountdown(msg.count);
        break;

      case 'MATCH_START':
        this.callbacks.onMatchStart(msg.duration, msg.seed);
        break;

      case 'OPPONENT_STATE':
        this.callbacks.onOpponentState(msg);
        break;

      case 'INCOMING_ATTACK':
        this.callbacks.onIncomingAttack(msg);
        break;

      case 'MATCH_RESULT':
        this.callbacks.onMatchResult(msg);
        break;

      case 'OPPONENT_DISCONNECTED':
        this.callbacks.onOpponentDisconnected();
        break;

      case 'ERROR':
        this.callbacks.onError(msg.message);
        break;
    }
  }

  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  async createRoom(playerName) {
    await this.connect();
    this.send({ type: 'CREATE_ROOM', name: playerName });
  }

  async joinRoom(code, playerName) {
    await this.connect();
    this.send({ type: 'JOIN_ROOM', code, name: playerName });
  }

  startMatch() {
    this.send({ type: 'START_MATCH' });
  }

  sendState(score, lives, time, lane, isFever) {
    this.send({
      type: 'STATE_UPDATE',
      score,
      lives,
      time,
      lane,
      isFever
    });
  }

  sendAttack(attackType = 'deadline_surge', lane = null) {
    this.send({
      type: 'ATTACK_OPPONENT',
      attackType,
      lane
    });
  }

  reportEliminated() {
    this.send({ type: 'PLAYER_ELIMINATED' });
  }

  reportTimeUp() {
    this.send({ type: 'TIME_UP' });
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.isConnected = false;
      this.roomCode = null;
    }
  }
}
