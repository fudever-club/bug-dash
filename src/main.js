// FU-DEVER BUG DASH — Main Application Entry Point
// Connects Computer Vision, Audio Synthesizer, 2D Game Engine, UI, and Backend API.

import { VISION_CONFIG, GAME_CONFIG, GAME_MODES } from "./config.js";
import { sound } from "./audio/SoundEngine.js";
import { CameraController } from "./vision/camera.js";
import { FaceDetectorWrapper } from "./vision/detector.js";
import { FaceTracker } from "./vision/tracker.js";
import { LaneController } from "./vision/laneController.js";
import { GameStateManager, GameStates } from "./engine/GameState.js";
import { Spawner } from "./engine/Spawner.js";
import { CollisionSystem } from "./engine/Collision.js";
import { ParticleSystem } from "./engine/ParticleSystem.js";
import { RoadRenderer } from "./engine/RoadRenderer.js";
import { UIController } from "./ui/UIController.js";
import { DuelClient } from "./multiplayer/DuelClient.js";

class BugDashApp {
  constructor() {
    this.videoElement = document.getElementById("video");
    this.gameCanvas = document.getElementById("gameCanvas");

    this.gameMode = GAME_MODES.CLASSIC;
    this.opponentData = null;
    this.lastNetSync = 0;

    // 1. Initialize Subsystems
    this.camera = new CameraController(this.videoElement);
    this.detector = new FaceDetectorWrapper();
    
    this.tracker = new FaceTracker((lockedBox) => {
      sound.playLock();
    });

    this.laneController = new LaneController((newLane) => {
      sound.playLaneSwitch();
      this.ui.updateLaneUI(newLane);
    });

    this.gameState = new GameStateManager({
      onScoreUpdate: (score) => this.ui.updateScore(score),
      onLivesUpdate: (lives) => this.ui.updateLives(lives),
      onTimerUpdate: (time) => this.ui.updateTimer(time),
      onComboUpdate: (combo, isBuffed) => this.ui.updateCombo(combo, isBuffed),
      onStateChange: (newState) => this.handleGameStateChange(newState),
      onEliminated: () => {
        if (this.gameMode === GAME_MODES.DUEL) this.duelClient.reportEliminated();
      },
      onTimeUp: () => {
        if (this.gameMode === GAME_MODES.DUEL) this.duelClient.reportTimeUp();
      },
      onAttackTrigger: (attackType) => {
        if (this.gameMode === GAME_MODES.DUEL) {
          sound.playBuffActive();
          this.duelClient.sendAttack(attackType, this.laneController.currentLane);
          this.particles.addFloatingText(this.playerX, 350, "💥 ĐÃ TUNG DEADLINE TẤN CÔNG ĐỐI THỦ!", "#06b6d4");
        }
      }
    });

    this.spawner = new Spawner();
    this.particles = new ParticleSystem();
    this.renderer = new RoadRenderer(this.gameCanvas);

    // 2. Initialize 1v1 Network Duel Client
    this.duelClient = new DuelClient({
      onRoomCreated: (code) => {
        sound.playLock();
        this.ui.setDuelRoomCode(code);
      },
      onRoomJoined: (code, isHost, oppName) => {
        sound.playLock();
        this.ui.setDuelLobbyMessage(`Đã vào phòng #${code}! Đối thủ: ${oppName}`);
      },
      onOpponentJoined: (oppName) => {
        sound.playVictory();
        this.ui.setDuelOpponentJoined(oppName);
      },
      onCountdown: (count) => {
        sound.playClick();
        this.particles.addFloatingText(GAME_CONFIG.laneX[1], 280, `ĐỐI ĐẦU TRONG ${count}...`, "#f59e0b");
      },
      onMatchStart: () => {
        sound.playVictory();
        this.ui.hideAllModals();
        this.startGame();
      },
      onOpponentState: (state) => {
        this.opponentData = state;
      },
      onIncomingAttack: (msg) => {
        sound.playHit();
        this.renderer.triggerShake(1.2);
        this.spawner.spawnIncomingAttack(msg.attackType, msg.lane);
        this.particles.addFloatingText(this.playerX, 320, "⚠️ ĐỐI THỦ PHẢN CÔNG: DEADLINE ĐANG LAO TỚI!", "#ef4444");
      },
      onMatchResult: (result) => {
        const isWinner = (result.winnerRole === 'host' && this.duelClient.isHost) || 
                         (result.winnerRole === 'guest' && !this.duelClient.isHost);
        this.ui.showDuelResult(isWinner, result);
        if (isWinner) sound.playVictory();
        else sound.playGameOver();
      },
      onOpponentDisconnected: () => {
        alert("Đối thủ đã ngắt kết nối khỏi phòng 1v1!");
        this.setGameMode(GAME_MODES.CLASSIC);
      },
      onError: (msg) => {
        this.ui.setDuelLobbyMessage(msg);
      }
    });

    // 3. Initialize UI Controller
    this.ui = new UIController({
      onStartGame: () => this.startGame(),
      onRestartGame: () => this.startGame(),
      onCalibrate: () => this.calibrateTracker(),
      onToggleSound: () => sound.toggleSound(),
      onToggleDebug: (show) => {},
      onLaneSelect: (lane) => this.laneController.setLane(lane, true),
      onStartCamera: () => this.startCamera(),
      onSelectGameMode: (mode) => this.setGameMode(mode),
      onToggleSteeringMode: () => {
        const mode = this.laneController.toggleSteeringMode();
        this.ui.updateSteeringModeUI(mode);
        sound.playClick();
      },
      onDuelCreateRoom: (name) => this.duelClient.createRoom(name),
      onDuelJoinRoom: (code, name) => this.duelClient.joinRoom(code, name),
      onDuelStartMatch: () => this.duelClient.startMatch()
    });

    // 4. Runtime Animation State
    this.playerX = GAME_CONFIG.laneX[1];
    this.lastGameTime = performance.now();
    this.isVisionRunning = false;
    this.fpsFrames = 0;
    this.lastFpsTime = performance.now();

    this.initKeyboardControls();
    this.startRenderLoop();
  }

  initKeyboardControls() {
    window.addEventListener("keydown", (e) => {
      // Space to start / restart
      if (e.key === " " && this.gameState.state !== GameStates.PLAYING) {
        e.preventDefault();
        this.startGame();
      }
      // Calibration shortcut
      if (e.key === "c" || e.key === "C") {
        this.calibrateTracker();
      }
      // Sound toggle
      if (e.key === "m" || e.key === "M") {
        const enabled = sound.toggleSound();
        this.ui.updateSoundIcons(enabled);
      }
      // Debug toggle
      if (e.key === "d" || e.key === "D") {
        if (this.ui.dom.btnToggleDebug) this.ui.dom.btnToggleDebug.click();
      }
      // Steering mode toggle (3-Lane vs Free Analog Racer)
      if (e.key === "t" || e.key === "T") {
        const mode = this.laneController.toggleSteeringMode();
        this.ui.updateSteeringModeUI(mode);
        sound.playClick();
      }
      // Keyboard steering
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
        this.laneController.shiftLeft();
      }
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
        this.laneController.shiftRight();
      }
    });

    // Listen to threshold slider if present
    const thrSlider = document.getElementById("thr");
    if (thrSlider) {
      thrSlider.addEventListener("input", (e) => {
        this.laneController.setThresholdPercent(parseFloat(e.target.value));
      });
    }
  }

  async startCamera() {
    const btn = document.getElementById("startCamera");
    const btnText = document.getElementById("btnCameraText");
    if (btn) btn.disabled = true;
    if (btnText) btnText.textContent = "Đang Nạp Model AI...";

    try {
      await this.detector.init();
      await this.camera.start({ width: 640, height: 480 });
      if (btn) btn.style.display = "none";
      this.isVisionRunning = true;
      requestAnimationFrame(() => this.visionLoop());
    } catch (err) {
      console.error("[BugDashApp] Camera start error:", err);
      if (btnText) btnText.textContent = "Lỗi Camera (Thử Lại)";
      if (btn) btn.disabled = false;
    }
  }

  setGameMode(mode) {
    this.gameMode = mode;
    this.gameState.setGameMode(mode);
    this.ui.updateGameModeUI(mode);

    if (mode === GAME_MODES.HIGHWAY) {
      this.laneController.setSteeringMode("analog");
      this.ui.updateSteeringModeUI("analog");
      this.particles.addFloatingText(GAME_CONFIG.laneX[1], 300, "🏎️ CHẾ ĐỘ: FPT HIGHWAY RACER!", "#f59e0b");
      sound.playBuffActive();
    } else if (mode === GAME_MODES.DUEL) {
      this.ui.showDuelLobby();
      sound.playClick();
    } else {
      this.laneController.setSteeringMode("snap3");
      this.ui.updateSteeringModeUI("snap3");
      this.ui.showStartScreen();
      sound.playClick();
    }
  }

  calibrateTracker() {
    if (this.tracker.calibrateCenter()) {
      sound.playClick();
      this.laneController.setLane(1, false);
      this.ui.updateLaneUI(1);
    }
  }

  startGame() {
    sound.init();
    this.spawner.reset();
    this.particles.reset();
    this.laneController.setLane(1, false);
    this.playerX = GAME_CONFIG.laneX[1];
    this.ui.hideAllModals();
    this.gameState.startSession();
  }

  handleGameStateChange(newState) {
    if (newState === GameStates.GAMEOVER) {
      sound.playGameOver();
      if (this.gameMode === GAME_MODES.DUEL) {
        this.duelClient.reportEliminated();
      } else {
        this.ui.showGameOver(this.gameState.getSummary());
      }
    } else if (newState === GameStates.VICTORY) {
      sound.playVictory();
      if (this.gameMode === GAME_MODES.DUEL) {
        this.duelClient.reportTimeUp();
      } else {
        this.ui.showVictory(this.gameState.getSummary());
      }
    }
  }

  // ====== Computer Vision Loop ======
  visionLoop() {
    if (!this.isVisionRunning) return;
    requestAnimationFrame(() => this.visionLoop());

    const video = this.videoElement;
    if (video.readyState < 2) return;

    const now = performance.now();
    const faces = this.detector.detectForVideo(video, now);
    this.tracker.update(faces, now);

    const trackerStatus = this.tracker.getStatus();
    this.laneController.updateFromTracker(trackerStatus);

    // FPS calculation
    this.fpsFrames++;
    let currentFps;
    if (this.fpsFrames % 30 === 0) {
      currentFps = Math.round(30000 / (now - this.lastFpsTime));
      this.lastFpsTime = now;
      this.ui.updateCameraStatus(trackerStatus.phase, currentFps);
    } else {
      this.ui.updateCameraStatus(trackerStatus.phase);
    }

    this.ui.drawVisionOverlay(trackerStatus, faces, VISION_CONFIG.roi);
  }

  // ====== Main 60 FPS Game Render Loop ======
  startRenderLoop() {
    const loop = (now) => {
      const dt = Math.min(0.06, (now - this.lastGameTime) / 1000);
      this.lastGameTime = now;

      // 1. Smooth Player Position Interpolation (Supports both 3-Lane Snap and Free Analog Racer)
      const targetX = this.laneController.getTargetX();
      const lerpSpeed = (this.laneController.steeringMode === "analog") ? 0.30 : 0.22;
      this.playerX += (targetX - this.playerX) * lerpSpeed;

      // 2. Gameplay Logic Updates
      if (this.gameState.state === GameStates.PLAYING) {
        this.gameState.update(dt);
        const spawnSteerMode = (this.gameMode === GAME_MODES.HIGHWAY) ? "highway" : this.laneController.steeringMode;
        this.spawner.update(dt, this.gameState.timeLeft, spawnSteerMode);

        // Network State Sync (10 times/second in DUEL mode)
        if (this.gameMode === GAME_MODES.DUEL && now - this.lastNetSync > 100) {
          this.lastNetSync = now;
          this.duelClient.sendState(
            this.gameState.score,
            this.gameState.lives,
            this.gameState.timeLeft,
            this.laneController.currentLane,
            this.gameState.isFever
          );
        }

        // Check Collisions
        const collidingIdx = CollisionSystem.findFirstCollision(this.playerX, this.spawner.items);
        if (collidingIdx !== -1) {
          const item = this.spawner.items[collidingIdx];

          if (item.isObstacle) {
            if (this.gameState.isFever) {
              // FEVER MODE: Smash right through bugs and convert them to huge bonus points!
              sound.playBuffActive();
              this.renderer.triggerShake(0.6);
              this.particles.addSparks(item.x, item.y, "#f59e0b", 22);
              this.gameState.addReward(60);
              this.particles.addFloatingText(item.x, item.y - 15, "+60 PTS (BUG SMASHED)!", "#f59e0b");
            } else {
              // Standard obstacle collision with i-Frames check
              const isDamaged = item.damage ? this.gameState.takeDamage(item.damage) : false;
              if (isDamaged) {
                sound.playHit();
                this.renderer.triggerShake(1.0);
                this.particles.addSparks(item.x, item.y, "#ef4444", 16);
                this.particles.addFloatingText(item.x, item.y - 15, "-1 HP (DEADLINE DÍ)!", "#ef4444");
              }
              if (item.scoreDeduct && !this.gameState.isInvulnerable) {
                this.gameState.deductScore(item.scoreDeduct);
                this.particles.addFloatingText(item.x, item.y - 15, "-30 PTS (RỚT MÔN)!", "#dc2626");
              }
            }
          } else {
            // Collect Reward
            this.particles.addSparks(item.x, item.y, item.color || "#10b981", 14);

            if (item.buff === "fever") {
              sound.playVictory();
              this.gameState.addReward(item.points, "fever");
              this.particles.addFloatingText(item.x, item.y - 15, "NITRO FEVER RUSH (X3 PTS)!", "#f59e0b");
            } else if (item.buff === "x2") {
              sound.playBuffActive();
              this.gameState.addReward(item.points, "x2");
              this.particles.addFloatingText(item.x, item.y - 15, "+20 PTS (CÀ PHÊ GÁNH TEAM)!", "#06b6d4");
            } else {
              sound.playItemCollect();
              this.gameState.addReward(item.points, null);
              this.particles.addFloatingText(item.x, item.y - 15, `+${item.points * this.gameState.combo} PTS (PR MERGED)!`, "#10b981");
            }
          }

          this.spawner.removeItem(collidingIdx);
        }
      }

      this.particles.update(dt);

      // 3. Render Canvas
      const isBuffed = this.gameState.combo > 1;
      const isGameOver = this.gameState.state === GameStates.GAMEOVER;
      const renderSteerMode = (this.gameMode === GAME_MODES.HIGHWAY) ? "highway" : this.laneController.steeringMode;
      this.renderer.render(
        dt,
        this.playerX,
        targetX,
        this.laneController.currentLane,
        this.spawner.items,
        this.particles,
        isBuffed,
        isGameOver,
        this.gameState.isInvulnerable,
        this.gameState.isFever,
        renderSteerMode,
        (this.gameMode === GAME_MODES.DUEL) ? this.opponentData : null
      );

      requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);
  }
}

// Instantiate on DOM Loaded
window.addEventListener("DOMContentLoaded", () => {
  window.bugDashApp = new BugDashApp();
});
