// FU-DEVER BUG DASH — Main Application Entry Point
// Connects Computer Vision, Audio Synthesizer, 2D Game Engine, UI, and Backend API.

import { VISION_CONFIG, GAME_CONFIG, GAME_MODES, SPLIT_CONFIG, CONTROL_INPUTS } from "./config.js";
import { sound } from "./audio/SoundEngine.js";
import { CameraController } from "./vision/camera.js";
import { FaceDetectorWrapper } from "./vision/detector.js";
import { HandDetectorWrapper } from "./vision/handDetector.js";
import { FaceTracker } from "./vision/tracker.js";
import { DualFaceTracker } from "./vision/dualTracker.js";
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
    this.inputSource = CONTROL_INPUTS.FACE;
    this.opponentData = null;
    this.lastNetSync = 0;

    // Jump & Slide State
    this.jumpState = { isJumping: false, progress: 0, duration: 0.65, elapsed: 0 };
    this.slideState = { isSliding: false, progress: 0, duration: 0.65, elapsed: 0 };

    // 1. Initialize Subsystems
    this.camera = new CameraController(this.videoElement);
    this.detector = new FaceDetectorWrapper();
    this.handDetector = new HandDetectorWrapper();
    
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

    this.dualTracker = new DualFaceTracker(() => {
      sound.playLock();
    });

    this.gameStateP2 = new GameStateManager({
      onScoreUpdate: () => {},
      onLivesUpdate: () => {},
      onTimerUpdate: () => {},
      onComboUpdate: () => {},
      onStateChange: () => {},
      onEliminated: () => {},
      onTimeUp: () => {}
    });

    this.spawner = new Spawner();
    this.spawnerP2 = new Spawner(SPLIT_CONFIG.p2Lanes, SPLIT_CONFIG.p2RoadBounds);
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
      onSelectDuelType: (type) => this.setDuelType(type),
      onStartSplitMatch: () => this.startSplitMatch(),
      onSelectInputSource: (src) => this.setInputSource(src),
      onSelectSteeringMode: (mode) => {
        this.laneController.setSteeringMode(mode);
        this.ui.updateSteeringModeUI(mode);
        sound.playClick();
      },
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
    this.playerX_P1 = SPLIT_CONFIG.p1Lanes[1];
    this.playerX_P2 = SPLIT_CONFIG.p2Lanes[1];
    this.lastGameTime = performance.now();
    this.isVisionRunning = false;
    this.fpsFrames = 0;
    this.lastFpsTime = performance.now();

    this.initKeyboardControls();
    this.startRenderLoop();
  }

  initKeyboardControls() {
    window.addEventListener("keydown", (e) => {
      // Space to start / restart or Jump during play
      if (e.key === " ") {
        if (this.gameState.state !== GameStates.PLAYING) {
          e.preventDefault();
          this.startGame();
        } else {
          e.preventDefault();
          this.jump();
        }
      }
      // Jump & Slide keyboard controls
      if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") {
        e.preventDefault();
        this.jump();
      }
      if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") {
        e.preventDefault();
        this.slide();
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

  async setInputSource(src) {
    this.inputSource = src;
    this.ui.updateInputSourceUI(src);
    if (src === CONTROL_INPUTS.HAND) {
      if (!this.handDetector.isReady && !this.handDetector.isLoading) {
        this.particles.addFloatingText(320, 260, "ĐANG NẠP AI BÀN TAY...", "#10b981");
        try {
          await this.handDetector.init();
          this.particles.addFloatingText(320, 260, "AI BÀN TAY ĐÃ SẴN SÀNG!", "#10b981");
          sound.playBuffActive();
        } catch (e) {
          console.error("[BugDashApp] Hand tracking init error:", e);
        }
      }
    }
  }

  jump() {
    if (this.jumpState.isJumping || this.slideState.isSliding) return;
    this.jumpState.isJumping = true;
    this.jumpState.progress = 0;
    this.jumpState.elapsed = 0;
    sound.playJump();
    this.particles.addCollectBurst(this.playerX, GAME_CONFIG.playerY + 20, "#06b6d4", 8);
  }

  slide() {
    if (this.slideState.isSliding || this.jumpState.isJumping) return;
    this.slideState.isSliding = true;
    this.slideState.progress = 0;
    this.slideState.elapsed = 0;
    sound.playSlide();
    this.particles.addCollectBurst(this.playerX, GAME_CONFIG.playerY + 35, "#f59e0b", 8);
  }

  setGameMode(mode) {
    this.gameMode = mode;
    this.gameState.setGameMode(mode);
    this.ui.updateGameModeUI(mode);

    if (this.gameState.state === GameStates.PLAYING) {
      this.gameState.setState(GameStates.IDLE);
    }

    if (mode === GAME_MODES.HIGHWAY) {
      this.laneController.setSteeringMode("analog");
      this.ui.updateSteeringModeUI("analog");
      this.ui.showStartScreenForMode(GAME_MODES.HIGHWAY);
      sound.playBuffActive();
    } else if (mode === GAME_MODES.CATCHER) {
      this.laneController.setSteeringMode("analog");
      this.ui.updateSteeringModeUI("analog");
      this.ui.showStartScreenForMode(GAME_MODES.CATCHER);
      sound.playBuffActive();
    } else if (mode === GAME_MODES.DUEL) {
      this.ui.showDuelLobby();
      if (this.ui.dom.btnDuelTabWifi) this.ui.dom.btnDuelTabWifi.click();
      sound.playClick();
    } else if (mode === GAME_MODES.SPLIT_SCREEN) {
      this.ui.showDuelLobby();
      if (this.ui.dom.btnDuelTabSplit) this.ui.dom.btnDuelTabSplit.click();
      sound.playClick();
    } else {
      this.laneController.setSteeringMode("snap3");
      this.ui.updateSteeringModeUI("snap3");
      this.ui.showStartScreenForMode(GAME_MODES.CLASSIC);
      sound.playClick();
    }
  }

  setDuelType(type) {
    if (type === "split") {
      this.gameMode = GAME_MODES.SPLIT_SCREEN;
      this.gameState.setGameMode(GAME_MODES.SPLIT_SCREEN);
    } else {
      this.gameMode = GAME_MODES.DUEL;
      this.gameState.setGameMode(GAME_MODES.DUEL);
    }
  }

  startSplitMatch() {
    sound.init();
    this.gameMode = GAME_MODES.SPLIT_SCREEN;
    this.gameState.setGameMode(GAME_MODES.SPLIT_SCREEN);
    this.spawner = new Spawner(SPLIT_CONFIG.p1Lanes, SPLIT_CONFIG.p1RoadBounds);
    this.spawnerP2 = new Spawner(SPLIT_CONFIG.p2Lanes, SPLIT_CONFIG.p2RoadBounds);
    this.particles.reset();
    this.playerX_P1 = SPLIT_CONFIG.p1Lanes[1];
    this.playerX_P2 = SPLIT_CONFIG.p2Lanes[1];
    this.gameState.startSession();
    this.gameStateP2.startSession();
    this.ui.hideAllModals();
    sound.playVictory();
    this.particles.addFloatingText(320, 240, "TRẬN ĐẤU SPLIT-SCREEN BẮT ĐẦU!", "#f59e0b");
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
    this.laneController.reset();
    this.spawner.reset();
    this.particles.reset();
    this.jumpState = { isJumping: false, progress: 0, duration: 0.65, elapsed: 0 };
    this.slideState = { isSliding: false, progress: 0, duration: 0.65, elapsed: 0 };
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

    // FPS calculation
    this.fpsFrames++;
    let currentFps;
    if (this.fpsFrames % 30 === 0) {
      currentFps = Math.round(30000 / (now - this.lastFpsTime));
      this.lastFpsTime = now;
      this.ui.updateCameraStatus("lock", currentFps);
    }

    // 1. Hand Tracking Mode
    if (this.inputSource === CONTROL_INPUTS.HAND) {
      let handStatus = null;
      if (this.handDetector.isReady) {
        handStatus = this.handDetector.detectForVideo(video, now);
        if (handStatus) {
          this.laneController.updateFromHand(handStatus);
          // High Hand -> Jump; Low Hand -> Slide
          if (handStatus.isHighHand && !this.jumpState.isJumping) {
            this.jump();
          } else if (handStatus.isLowHand && !this.slideState.isSliding) {
            this.slide();
          }
        }
      }
      this.ui.drawVisionOverlay(null, null, null, false, null, handStatus, this.inputSource);
      return;
    }

    // 2. Face Tracking Mode (BlazeFace)
    const faces = this.detector.detectForVideo(video, now);

    if (this.gameMode === GAME_MODES.SPLIT_SCREEN) {
      this.dualTracker.update(faces, now);
      const dualStatus = this.dualTracker.getStatus();
      this.ui.drawVisionOverlay(null, faces, null, true, dualStatus, null, this.inputSource);
    } else {
      this.tracker.update(faces, now);
      const trackerStatus = this.tracker.getStatus();
      this.laneController.updateFromTracker(trackerStatus);
      this.ui.updateCameraStatus(trackerStatus.phase, currentFps);
      this.ui.drawVisionOverlay(trackerStatus, faces, VISION_CONFIG.roi, false, null, null, this.inputSource);
    }
  }

  // ====== Main 60 FPS Game Render Loop ======
  startRenderLoop() {
    const loop = (now) => {
      const dt = Math.min(0.06, (now - this.lastGameTime) / 1000);
      this.lastGameTime = now;

      // ==========================================
      // SPLIT-SCREEN 2-PLAYER LOCAL LOOP
      // ==========================================
      if (this.gameMode === GAME_MODES.SPLIT_SCREEN) {
        const dualStatus = this.dualTracker.getStatus();
        const p1Norm = dualStatus.p1 ? dualStatus.p1.analogNormalized : 0.5;
        const p2Norm = dualStatus.p2 ? dualStatus.p2.analogNormalized : 0.5;

        const targetP1 = SPLIT_CONFIG.p1RoadBounds.minX + p1Norm * (SPLIT_CONFIG.p1RoadBounds.maxX - SPLIT_CONFIG.p1RoadBounds.minX);
        const targetP2 = SPLIT_CONFIG.p2RoadBounds.minX + p2Norm * (SPLIT_CONFIG.p2RoadBounds.maxX - SPLIT_CONFIG.p2RoadBounds.minX);

        this.playerX_P1 += (targetP1 - this.playerX_P1) * 0.28;
        this.playerX_P2 += (targetP2 - this.playerX_P2) * 0.28;

        if (this.gameState.state === GameStates.PLAYING) {
          this.gameState.update(dt);
          this.gameStateP2.update(dt);

          this.spawner.update(dt, this.gameState.timeLeft, "analog", "splitscreen");
          this.spawnerP2.update(dt, this.gameState.timeLeft, "analog", "splitscreen");

          // P1 Collisions
          const colP1 = CollisionSystem.findFirstCollision(this.playerX_P1, this.spawner.items, GAME_CONFIG.playerY, SPLIT_CONFIG.playerRadius);
          if (colP1 !== -1) {
            const item = this.spawner.items[colP1];
            if (item.isObstacle) {
              const damaged = item.damage ? this.gameState.takeDamage(item.damage) : false;
              if (damaged) {
                sound.playHit();
                this.renderer.triggerShake(0.8);
                this.particles.addSparks(item.x, item.y, "#ef4444", 14);
                this.particles.addFloatingText(this.playerX_P1, item.y - 15, "-1 HP (P1)!", "#ef4444");
              }
            } else {
              sound.playItemCollect();
              this.gameState.addReward(item.points);
              this.particles.addSparks(item.x, item.y, item.color || "#10b981", 12);
              this.particles.addFloatingText(this.playerX_P1, item.y - 15, `+${item.points} (P1)!`, "#10b981");
            }
            this.spawner.removeItem(colP1);
          }

          // P2 Collisions
          const colP2 = CollisionSystem.findFirstCollision(this.playerX_P2, this.spawnerP2.items, GAME_CONFIG.playerY, SPLIT_CONFIG.playerRadius);
          if (colP2 !== -1) {
            const item = this.spawnerP2.items[colP2];
            if (item.isObstacle) {
              const damaged = item.damage ? this.gameStateP2.takeDamage(item.damage) : false;
              if (damaged) {
                sound.playHit();
                this.renderer.triggerShake(0.8);
                this.particles.addSparks(item.x, item.y, "#ef4444", 14);
                this.particles.addFloatingText(this.playerX_P2, item.y - 15, "-1 HP (P2)!", "#ef4444");
              }
            } else {
              sound.playItemCollect();
              this.gameStateP2.addReward(item.points);
              this.particles.addSparks(item.x, item.y, item.color || "#10b981", 12);
              this.particles.addFloatingText(this.playerX_P2, item.y - 15, `+${item.points} (P2)!`, "#f59e0b");
            }
            this.spawnerP2.removeItem(colP2);
          }

          // Check Knockout or Time Up
          if (this.gameState.state === GameStates.GAMEOVER || this.gameStateP2.state === GameStates.GAMEOVER || this.gameState.timeLeft <= 0) {
            this.gameState.setState(GameStates.GAMEOVER);
            this.gameStateP2.setState(GameStates.GAMEOVER);

            let winnerText = "HÒA NHAU!";
            let isP1Winner = false;
            if (this.gameState.lives <= 0 && this.gameStateP2.lives > 0) {
              winnerText = "P2 THẮNG KNOCKOUT (AMBER)!";
              isP1Winner = false;
            } else if (this.gameStateP2.lives <= 0 && this.gameState.lives > 0) {
              winnerText = "P1 THẮNG KNOCKOUT (CYAN)!";
              isP1Winner = true;
            } else {
              if (this.gameState.score > this.gameStateP2.score) {
                winnerText = "P1 THẮNG ĐIỂM SỐ (CYAN)!";
                isP1Winner = true;
              } else if (this.gameStateP2.score > this.gameState.score) {
                winnerText = "P2 THẮNG ĐIỂM SỐ (AMBER)!";
                isP1Winner = false;
              }
            }

            this.ui.showDuelResult(isP1Winner, {
              reason: this.gameState.lives <= 0 || this.gameStateP2.lives <= 0 ? 'knockout' : 'score',
              winnerName: winnerText,
              hostScore: this.gameState.score,
              guestScore: this.gameStateP2.score
            });
            sound.playVictory();
          }
        }

        this.particles.update(dt);

        this.renderer.renderSplitScreen(
          dt,
          {
            playerX: this.playerX_P1,
            items: this.spawner.items,
            isGameOver: this.gameState.state === GameStates.GAMEOVER,
            isInvulnerable: this.gameState.isInvulnerable,
            score: this.gameState.score,
            lives: this.gameState.lives
          },
          {
            playerX: this.playerX_P2,
            items: this.spawnerP2.items,
            isGameOver: this.gameStateP2.state === GameStates.GAMEOVER,
            isInvulnerable: this.gameStateP2.isInvulnerable,
            score: this.gameStateP2.score,
            lives: this.gameStateP2.lives
          },
          this.particles,
          this.gameState.timeLeft
        );

        requestAnimationFrame(loop);
        return;
      }

      // ==========================================
      // STANDARD / HIGHWAY / CATCHER / DUEL LOOP
      // ==========================================
      const targetX = this.laneController.getTargetX();
      const lerpSpeed = (this.laneController.steeringMode === "analog") ? 0.30 : 0.22;
      this.playerX += (targetX - this.playerX) * lerpSpeed;

      // 2. Gameplay Logic Updates
      if (this.gameState.state === GameStates.PLAYING) {
        this.gameState.update(dt);
        const spawnSteerMode = (this.gameMode === GAME_MODES.HIGHWAY) ? "highway" : this.laneController.steeringMode;
        this.spawner.update(dt, this.gameState.timeLeft, spawnSteerMode, this.gameMode);

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

        // Update Jump Physics
        if (this.jumpState.isJumping) {
          this.jumpState.elapsed += dt;
          this.jumpState.progress = Math.min(1.0, this.jumpState.elapsed / this.jumpState.duration);
          if (this.jumpState.progress >= 1.0) {
            this.jumpState.isJumping = false;
            this.jumpState.progress = 0;
          }
        }

        // Update Slide Physics
        if (this.slideState.isSliding) {
          this.slideState.elapsed += dt;
          this.slideState.progress = Math.min(1.0, this.slideState.elapsed / this.slideState.duration);
          if (this.slideState.progress >= 1.0) {
            this.slideState.isSliding = false;
            this.slideState.progress = 0;
          }
        }

        // Check obstacle evasion rewards for jump and slide
        if (this.jumpState.isJumping || this.slideState.isSliding) {
          const checkRad = (this.gameMode === GAME_MODES.CATCHER) ? 52 : GAME_CONFIG.playerRadius;
          for (let i = 0; i < this.spawner.items.length; i++) {
            const it = this.spawner.items[i];
            if (it.isObstacle && !it.evaded && Math.hypot(it.x - this.playerX, it.y - GAME_CONFIG.playerY) < (checkRad + it.radius)) {
              if (this.jumpState.isJumping && (it.type === "bug" || it.type === "bug_crash" || it.type === "drop_db" || it.type === "grade_f")) {
                it.evaded = true;
                this.gameState.addReward(50);
                this.particles.addFloatingText(this.playerX, GAME_CONFIG.playerY - 80, "⚡ NHẢY NÉ CÚ PHÁP! (+50)", "#38bdf8");
                sound.playBuffActive();
              } else if (this.slideState.isSliding && (it.type === "deadline" || it.type === "conflict")) {
                it.evaded = true;
                this.gameState.addReward(50);
                this.particles.addFloatingText(this.playerX, GAME_CONFIG.playerY - 20, "⚡ TRƯỢT NÉ DEADLINE! (+50)", "#f59e0b");
                sound.playBuffActive();
              }
            }
          }
        }

        // Check Collisions (Catcher mode has slightly wider collector basket hitbox)
        const radius = (this.gameMode === GAME_MODES.CATCHER) ? 52 : GAME_CONFIG.playerRadius;
        const collidingIdx = CollisionSystem.findFirstCollision(
          this.playerX,
          this.spawner.items,
          GAME_CONFIG.playerY,
          radius,
          this.jumpState.isJumping,
          this.slideState.isSliding
        );
        if (collidingIdx !== -1) {
          const item = this.spawner.items[collidingIdx];

          if (item.isObstacle) {
            if (this.gameState.isFever) {
              sound.playBuffActive();
              this.renderer.triggerShake(0.6);
              this.particles.addSparks(item.x, item.y, "#f59e0b", 22);
              this.gameState.addReward(60);
              this.particles.addFloatingText(item.x, item.y - 15, "+60 PTS (BUG SMASHED)!", "#f59e0b");
            } else {
              const isDamaged = item.damage ? this.gameState.takeDamage(item.damage) : false;
              if (isDamaged) {
                sound.playHit();
                this.renderer.triggerShake(1.0);
                this.particles.addSparks(item.x, item.y, "#ef4444", 16);
                const desc = this.gameMode === GAME_MODES.CATCHER ? "-1 HP (DÍNH BUG)!" : "-1 HP (DEADLINE DÍ)!";
                this.particles.addFloatingText(item.x, item.y - 15, desc, "#ef4444");
              }
              if (item.scoreDeduct && !this.gameState.isInvulnerable) {
                this.gameState.deductScore(item.scoreDeduct);
                this.particles.addFloatingText(item.x, item.y - 15, `-${item.scoreDeduct} PTS!`, "#dc2626");
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
              const earned = item.points * this.gameState.combo;
              this.particles.addFloatingText(item.x, item.y - 15, `+${earned} PTS (${item.label})!`, item.color || "#10b981");
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
        (this.gameMode === GAME_MODES.DUEL) ? this.opponentData : null,
        this.gameMode,
        this.jumpState,
        this.slideState
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
