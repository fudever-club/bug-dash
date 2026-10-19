// FU-DEVER BUG DASH — Main Application Entry Point
// Connects Computer Vision, Audio Synthesizer, 2D Game Engine, UI, and Backend API.

import { VISION_CONFIG, GAME_CONFIG, GAME_MODES, SPLIT_CONFIG, CONTROL_INPUTS, SLICER_CONFIG, FLAPPY_CONFIG, REACTOR_CONFIG } from "./config.js";
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
import { ReactorRushEngine, REACTOR_STAGES } from "./engine/ReactorRushEngine.js";

// Helper: Distance from point to line segment
function distPointToSegment(px, py, x1, y1, x2, y2) {
  const l2 = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
  if (l2 === 0) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
}

class BugDashApp {
  constructor() {
    this.videoElement = document.getElementById("video");
    this.gameCanvas = document.getElementById("gameCanvas");

    this.gameMode = GAME_MODES.CLASSIC;
    this.inputSource = CONTROL_INPUTS.FACE;
    this.opponentData = null;
    this.lastNetSync = 0;

    // Slicer Blade Trail & Flappy Buggy Flight Physics
    this.bladeTrail = [];
    this.flappyY = 360;
    this.flappyVy = 0;
    this.flappyTargetY = 360;

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
    this.reactorEngine = new ReactorRushEngine(this.gameCanvas);

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
      onSetReactorRoster: (teamName, members) => {
        if (this.reactorEngine) {
          this.reactorEngine.setTeamRoster(teamName, members);
        }
      },
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
    this.initPointerControls();
    this.startRenderLoop();
  }

  initPointerControls() {
    const canvas = this.gameCanvas;
    if (!canvas) return;

    let isPointerDown = false;
    canvas.addEventListener("pointerdown", (e) => {
      isPointerDown = true;
      const rect = canvas.getBoundingClientRect();
      const px = ((e.clientX - rect.left) / rect.width) * canvas.width;
      const py = ((e.clientY - rect.top) / rect.height) * canvas.height;
      this.addBladePoint(px, py);
      if (this.gameMode === GAME_MODES.FLAPPY) {
        this.flappyFlap();
      } else if (this.gameMode === GAME_MODES.REACTOR) {
        if (this.reactorEngine.stage === REACTOR_STAGES.SWAP_ROUND_2 || this.reactorEngine.stage === REACTOR_STAGES.SWAP_ROUND_3) {
          this.reactorEngine.skipIntermission();
        } else if (this.reactorEngine.stage === REACTOR_STAGES.MISSION_COMPLETE) {
          this.reactorEngine.reset();
        }
      }
    });

    canvas.addEventListener("pointermove", (e) => {
      if (!isPointerDown && this.gameMode !== GAME_MODES.SLICER) return;
      const rect = canvas.getBoundingClientRect();
      const px = ((e.clientX - rect.left) / rect.width) * canvas.width;
      const py = ((e.clientY - rect.top) / rect.height) * canvas.height;
      this.addBladePoint(px, py);
    });

    window.addEventListener("pointerup", () => {
      isPointerDown = false;
    });
  }

  flappyFlap() {
    if (this.gameState.state !== GameStates.PLAYING) return;
    this.flappyTargetY = Math.max(90, (this.flappyTargetY || this.flappyY) - 95);
    this.flappyVy = FLAPPY_CONFIG.flapVelocity;
    sound.playJump();
    this.particles.addCollectBurst(140, this.flappyY + 15, "#06b6d4", 6);
  }

  addBladePoint(x, y) {
    const now = performance.now();
    const pt = { x, y, t: now };
    if (this.bladeTrail.length > 0) {
      const prev = this.bladeTrail[this.bladeTrail.length - 1];
      if (this.gameMode === GAME_MODES.SLICER && this.gameState.state === GameStates.PLAYING) {
        this.checkSlicerHits(prev, pt);
      }
    }
    this.bladeTrail.push(pt);
    if (this.bladeTrail.length > SLICER_CONFIG.bladeTrailMaxPoints) {
      this.bladeTrail.shift();
    }
  }

  checkSlicerHits(p1, p2) {
    for (let i = 0; i < this.spawner.items.length; i++) {
      const it = this.spawner.items[i];
      if (it.isSliced) continue;
      const bonus = SLICER_CONFIG.sliceHitboxBonus;
      const dist = distPointToSegment(it.x, it.y, p1.x, p1.y, p2.x, p2.y);
      if (dist <= (it.radius || 24) + bonus) {
        it.isSliced = true;
        if (it.type === "deadline") {
          // Bomb deadline hit
          this.gameState.takeDamage(1);
          sound.playHit();
          this.renderer.triggerShake(1.5);
          this.particles.addSparks(it.x, it.y, "#ef4444", 32);
          this.particles.addFloatingText(it.x, it.y, "BOM DEADLINE NỔ TUNG! (-1 HP)", "#ef4444");
        } else if (it.isObstacle) {
          // Sliced Bug / Error
          it.pieces = [
            { x: it.x - 14, y: it.y, vx: (it.vx || 0) - 130, vy: (it.vy || -200) - 60, angle: it.angle || 0, vRot: -6, isLeft: true },
            { x: it.x + 14, y: it.y, vx: (it.vx || 0) + 130, vy: (it.vy || -200) - 60, angle: it.angle || 0, vRot: 6, isLeft: false }
          ];
          this.gameState.addReward(50);
          sound.playItemCollect();
          this.renderer.triggerShake(0.35);
          this.particles.addSparks(it.x, it.y, "#f43f5e", 18);
          this.particles.addFloatingText(it.x, it.y, "+50 BUG SLICED!", "#f43f5e");
        } else {
          // Sliced Clean Code / PR / Star / Coffee
          this.gameState.addReward(it.points || 100);
          sound.playBuffActive();
          this.particles.addSparks(it.x, it.y, it.color || "#10b981", 20);
          this.particles.addFloatingText(it.x, it.y, `+${it.points || 100} (${it.label})!`, "#10b981");
        }
      }
    }
  }

  initKeyboardControls() {
    window.addEventListener("keydown", (e) => {
      // Reactor Rush 2-Player Controls (Lab Room & Booth Setup)
      if (this.gameMode === GAME_MODES.REACTOR) {
        if (e.key === " ") {
          e.preventDefault();
          if (this.reactorEngine.stage === REACTOR_STAGES.SWAP_ROUND_2 || this.reactorEngine.stage === REACTOR_STAGES.SWAP_ROUND_3) {
            this.reactorEngine.skipIntermission();
            return;
          }
          if (this.reactorEngine.stage === REACTOR_STAGES.MISSION_COMPLETE) {
            this.reactorEngine.reset();
            return;
          }
        }
        // Player 1 (Cyan): A (Left), D (Right), W (Raise Hand / Fan)
        if (e.code === "KeyA") {
          this.reactorEngine.p1.targetX = Math.max(REACTOR_CONFIG.p1FloorBounds.minX, this.reactorEngine.p1.targetX - 25);
        }
        if (e.code === "KeyD") {
          this.reactorEngine.p1.targetX = Math.min(REACTOR_CONFIG.p1FloorBounds.maxX, this.reactorEngine.p1.targetX + 25);
        }
        if (e.code === "KeyW") {
          this.reactorEngine.p1.handRaised = true;
          this.reactorEngine.triggerP1Wave();
          setTimeout(() => { if (this.reactorEngine) this.reactorEngine.p1.handRaised = false; }, 350);
        }

        // Player 2 (Pink): J (Left), L (Right), I (Raise Hand / Fan)
        if (e.code === "KeyJ") {
          this.reactorEngine.p2.targetX = Math.max(REACTOR_CONFIG.p2FloorBounds.minX, this.reactorEngine.p2.targetX - 25);
        }
        if (e.code === "KeyL") {
          this.reactorEngine.p2.targetX = Math.min(REACTOR_CONFIG.p2FloorBounds.maxX, this.reactorEngine.p2.targetX + 25);
        }
        if (e.code === "KeyI") {
          this.reactorEngine.p2.handRaised = true;
          this.reactorEngine.triggerP2Wave();
          setTimeout(() => { if (this.reactorEngine) this.reactorEngine.p2.handRaised = false; }, 350);
        }
      }

      // Fullscreen toggle for Big TV display in Lab room
      if (e.key === "f" || e.key === "F") {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
        } else {
          document.exitFullscreen().catch(() => {});
        }
      }

      // Space to start / restart or Jump during play
      if (e.key === " " && this.gameMode !== GAME_MODES.REACTOR) {
        if (this.gameState.state !== GameStates.PLAYING) {
          e.preventDefault();
          this.startGame();
        } else if (this.gameMode === GAME_MODES.FLAPPY) {
          e.preventDefault();
          this.flappyFlap();
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
      // Input source toggle (Face Tracking vs Hand Gestures)
      if (e.key === "i" || e.key === "I") {
        const nextSrc = this.inputSource === "face" ? "hand" : "face";
        this.setInputSource(nextSrc);
        sound.playClick();
        this.particles.addFloatingText(320, 300, nextSrc === "hand" ? "ĐỔI SANG BÀN TAY (HAND)" : "ĐỔI SANG KHUÔN MẶT (FACE)", nextSrc === "hand" ? "#10b981" : "#f59e0b");
      }
      // Help modal shortcut
      if (e.key === "h" || e.key === "H") {
        if (this.ui.dom.btnHelp) this.ui.dom.btnHelp.click();
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
    } else if (mode === GAME_MODES.SLICER) {
      this.ui.showStartScreenForMode(GAME_MODES.SLICER);
      sound.playBuffActive();
      // Auto-init hand detector if user switches to Slicer
      if (!this.handDetector.isReady && !this.handDetector.isLoading) {
        this.handDetector.init().catch(() => {});
      }
    } else if (mode === GAME_MODES.FLAPPY) {
      this.flappyY = 360;
      this.flappyVy = 0;
      this.flappyTargetY = 360;
      this.ui.showStartScreenForMode(GAME_MODES.FLAPPY);
      sound.playBuffActive();
    } else if (mode === GAME_MODES.REACTOR) {
      this.reactorEngine.reset();
      this.ui.showStartScreenForMode(GAME_MODES.REACTOR);
      sound.playBuffActive();
      if (!this.handDetector.isReady && !this.handDetector.isLoading) {
        this.handDetector.init().catch(() => {});
      }
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
    if (this.gameMode === GAME_MODES.REACTOR) {
      this.reactorEngine.reset();
      this.ui.hideAllModals();
      return;
    }
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

    // Zero-latency hardware frame synchronization with rAF fallback
    if (this.videoElement && 'requestVideoFrameCallback' in this.videoElement) {
      this.videoElement.requestVideoFrameCallback(() => this.visionLoop());
    } else {
      requestAnimationFrame(() => this.visionLoop());
    }

    const video = this.videoElement;
    if (!video || video.readyState < 2) return;

    const now = performance.now();

    // FPS calculation
    this.fpsFrames++;
    let currentFps;
    if (this.fpsFrames % 30 === 0) {
      currentFps = Math.round(30000 / (now - this.lastFpsTime));
      this.lastFpsTime = now;
      this.ui.updateCameraStatus("lock", currentFps);
    }

    // ============================================================
    // 1. DEDICATED REACTOR RUSH LOCAL CO-OP TRACKING (Hands + Faces)
    // Tách riêng hoàn toàn: Reactor Rush tự động kích hoạt Đa Cảm Biến
    // nhận diện cả 2 người chơi (P1 & P2), không phụ thuộc vào công tắc
    // chọn mặt/tay đơn của các game Bug Dash 1 người chơi cũ!
    // ============================================================
    if (this.gameMode === GAME_MODES.REACTOR) {
      // Run multi-hand tracking for P1 (left half) & P2 (right half)
      let multiHands = null;
      if (this.handDetector.isReady) {
        multiHands = this.handDetector.detectMultiHandsForVideo(video, now);
      }

      // Run dual face tracking concurrently
      const faces = this.detector.detectForVideo(video, now);
      this.dualTracker.update(faces, now);
      const dualStatus = this.dualTracker.getStatus();

      const p1Hand = multiHands && multiHands.p1;
      const p2Hand = multiHands && multiHands.p2;
      const p1Face = dualStatus.p1;
      const p2Face = dualStatus.p2;

      const inputs = {
        // P1: Left Side (0.0 .. 0.50)
        p1NormX: p1Hand ? p1Hand.normX : (p1Face ? p1Face.analogNormalized : undefined),
        p1HandRaised: (p1Hand && p1Hand.isRaised) || (p1Face && p1Face.isJump),
        p1WaveVelocity: p1Hand && p1Hand.waveVelocity ? p1Hand.waveVelocity : (p1Face && p1Face.isJump ? 260 : 0),

        // P2: Right Side (0.50 .. 1.00)
        p2NormX: p2Hand ? p2Hand.normX : (p2Face ? p2Face.analogNormalized : undefined),
        p2HandRaised: (p2Hand && p2Hand.isRaised) || (p2Face && p2Face.isJump),
        p2WaveVelocity: p2Hand && p2Hand.waveVelocity ? p2Hand.waveVelocity : (p2Face && p2Face.isJump ? 260 : 0)
      };

      this.reactorEngine.setInputs(inputs);
      this.ui.drawVisionOverlay(null, faces, null, true, dualStatus, multiHands, "coop_multimodal", this.gameMode);
      return;
    }

    // 2. Hand Tracking Mode or Slicer Mode (Single Player)
    if (this.inputSource === CONTROL_INPUTS.HAND || this.gameMode === GAME_MODES.SLICER) {
      let handStatus = null;
      if (this.handDetector.isReady) {
        handStatus = this.handDetector.detectForVideo(video, now);
        if (handStatus) {
          if (handStatus.indexTip) {
            const hx = handStatus.indexTip.x * 640;
            const hy = handStatus.indexTip.y * 720;
            this.addBladePoint(hx, hy);
          }
          this.laneController.updateFromHand(handStatus);

          if (this.gameMode === GAME_MODES.FLAPPY) {
            // Direct Hand Altitude Tracking (Bám theo bàn tay 1:1)
            const palmY = (handStatus.palmY !== undefined) ? handStatus.palmY : (handStatus.indexTip ? handStatus.indexTip.y : 0.5);
            const normHand = Math.max(0, Math.min(1, (palmY - 0.18) / 0.60));
            this.flappyTargetY = 90 + normHand * 540;
          } else {
            // High Hand -> Jump; Low Hand -> Slide
            if (handStatus.isHighHand && !this.jumpState.isJumping) {
              this.jump();
            } else if (handStatus.isLowHand && !this.slideState.isSliding) {
              this.slide();
            }
          }
        }
      }
      this.ui.drawVisionOverlay(null, null, null, false, null, handStatus, this.inputSource, this.gameMode);
      if (this.gameMode === GAME_MODES.SLICER) return;
      if (this.inputSource === CONTROL_INPUTS.HAND) return;
    }

    // 3. Face Tracking Mode (BlazeFace Single/Split-screen)
    const faces = this.detector.detectForVideo(video, now);


    if (this.gameMode === GAME_MODES.SPLIT_SCREEN) {
      this.dualTracker.update(faces, now);
      const dualStatus = this.dualTracker.getStatus();
      this.ui.drawVisionOverlay(null, faces, null, true, dualStatus, null, this.inputSource, this.gameMode);
    } else {
      this.tracker.update(faces, now);
      const trackerStatus = this.tracker.getStatus();
      this.laneController.updateFromTracker(trackerStatus);

      if (this.gameMode === GAME_MODES.FLAPPY) {
        // Direct Nose Tracking: Mũi đi đâu, Buggy lượn theo đó!
        const rawNoseY = (trackerStatus.noseY !== undefined) ? trackerStatus.noseY : trackerStatus.smoothedY;
        const centerNose = (trackerStatus.centerNoseY !== undefined) ? trackerStatus.centerNoseY : (trackerStatus.centerY || 0.50);
        const deltaNose = rawNoseY - centerNose;
        // Sensitivity 2.2: +/-0.20 delta in webcam covers full height (80 to 640px)
        let normY = 0.50 + deltaNose * 2.2;
        normY = Math.max(0.08, Math.min(0.92, normY));
        this.flappyTargetY = 80 + normY * 560;
      } else {
        // Physical Jump & Duck gestures via Face Box Velocity (dY/dt)
        if (trackerStatus.isJump && !this.jumpState.isJumping && !this.slideState.isSliding) {
          this.jump();
        } else if (trackerStatus.isDuck && !this.slideState.isSliding && !this.jumpState.isJumping) {
          this.slide();
        }
      }

      this.ui.updateCameraStatus(trackerStatus.phase, currentFps);
      this.ui.drawVisionOverlay(trackerStatus, faces, VISION_CONFIG.roi, false, null, null, this.inputSource, this.gameMode);
    }
  }

  // ====== Main 60 FPS Game Render Loop ======
  startRenderLoop() {
    const loop = (now) => {
      const dt = Math.min(0.06, (now - this.lastGameTime) / 1000);
      this.lastGameTime = now;

      // ==========================================
      // REACTOR RUSH 2-PLAYER LOCAL CO-OP LOOP (STEM FAIR 2026)
      // ==========================================
      if (this.gameMode === GAME_MODES.REACTOR) {
        this.reactorEngine.update(dt);
        this.ui.updateScore(this.reactorEngine.totalScore);

        this.renderer.render(
          dt,
          this.reactorEngine.p1.x,
          this.reactorEngine.p1.targetX,
          1,
          [],
          this.particles,
          false,
          false,
          false,
          false,
          "analog",
          null,
          this.gameMode,
          this.jumpState,
          this.slideState,
          {
            reactorEngine: this.reactorEngine,
            inputSource: this.inputSource
          }
        );

        requestAnimationFrame(loop);
        return;
      }

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

        // Fade out old blade trail points
        this.bladeTrail = this.bladeTrail.filter(pt => (now - pt.t) < 140);

        if (this.gameMode === GAME_MODES.FLAPPY) {
          // Direct Nose/Hand Altitude Glide Tracking
          const prevY = this.flappyY;
          const targetY = (this.flappyTargetY !== undefined) ? this.flappyTargetY : 360;
          const lerpFactor = Math.min(1.0, 14 * dt);
          this.flappyY += (targetY - this.flappyY) * lerpFactor;
          this.flappyVy = (this.flappyY - prevY) / Math.max(0.001, dt);

          if (this.flappyY < 48) {
            this.flappyY = 48;
            this.flappyVy = 0;
          }
          if (this.flappyY > 672) {
            this.flappyY = 672;
            this.flappyVy = 0;
          }

          // Check Flappy collisions with Firewall Pipe pairs
          const bRadius = 26;
          const bX = 140;
          for (let i = 0; i < this.spawner.items.length; i++) {
            const it = this.spawner.items[i];
            if (it.type !== "firewall_pipe") continue;

            // Passed pipe reward (+10 pts)
            if (it.x + it.width < bX && !it.passed) {
              it.passed = true;
              this.gameState.addReward(10);
              sound.playItemCollect();
              this.particles.addFloatingText(bX, this.flappyY - 25, `PASS ${it.gateLabel} (+10)!`, "#10b981");
            }

            // Pipe Collision Check
            if (bX + bRadius > it.x && bX - bRadius < it.x + it.width) {
              if (this.flappyY - bRadius < it.topHeight || this.flappyY + bRadius > it.bottomY) {
                if (!this.gameState.isInvulnerable) {
                  const isDamaged = this.gameState.takeDamage(1);
                  if (isDamaged) {
                    sound.playHit();
                    this.renderer.triggerShake(1.2);
                    this.particles.addSparks(bX, this.flappyY, "#ef4444", 24);
                    this.particles.addFloatingText(bX, this.flappyY, "ĐÂM FIREWALL (-1 HP)!", "#ef4444");
                  }
                }
              }
            }
          }
        } else if (this.gameMode === GAME_MODES.SLICER) {
          // Slicer mode: Hitboxes are checked interactively in real-time via addBladePoint / checkSlicerHits
        } else {
          // Standard / Highway / Catcher / Duel Collision Checks
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
        this.slideState,
        {
          bladeTrail: this.bladeTrail,
          flappyY: this.flappyY,
          flappyVy: this.flappyVy,
          flappyTargetY: this.flappyTargetY,
          inputSource: this.inputSource
        }
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
