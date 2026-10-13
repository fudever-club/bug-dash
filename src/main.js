// FU-DEVER BUG DASH — Main Application Entry Point
// Connects Computer Vision, Audio Synthesizer, 2D Game Engine, UI, and Backend API.

import { VISION_CONFIG, GAME_CONFIG } from "./config.js";
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

class BugDashApp {
  constructor() {
    this.videoElement = document.getElementById("video");
    this.gameCanvas = document.getElementById("gameCanvas");

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
      onStateChange: (newState) => this.handleGameStateChange(newState)
    });

    this.spawner = new Spawner();
    this.particles = new ParticleSystem();
    this.renderer = new RoadRenderer(this.gameCanvas);

    // 2. Initialize UI Controller
    this.ui = new UIController({
      onStartGame: () => this.startGame(),
      onRestartGame: () => this.startGame(),
      onCalibrate: () => this.calibrateTracker(),
      onToggleSound: () => sound.toggleSound(),
      onToggleDebug: (show) => {},
      onLaneSelect: (lane) => this.laneController.setLane(lane, true),
      onStartCamera: () => this.startCamera()
    });

    // 3. Runtime Animation State
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
      this.ui.showGameOver(this.gameState.getSummary());
    } else if (newState === GameStates.VICTORY) {
      sound.playVictory();
      this.ui.showVictory(this.gameState.getSummary());
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

      // 1. Smooth Player Position Interpolation
      const targetLaneX = GAME_CONFIG.laneX[this.laneController.currentLane];
      this.playerX += (targetLaneX - this.playerX) * 0.22;

      // 2. Gameplay Logic Updates
      if (this.gameState.state === GameStates.PLAYING) {
        this.gameState.update(dt);
        this.spawner.update(dt, this.gameState.timeLeft);

        // Check Collisions
        const collidingIdx = CollisionSystem.findFirstCollision(this.playerX, this.spawner.items);
        if (collidingIdx !== -1) {
          const item = this.spawner.items[collidingIdx];

          if (item.isObstacle) {
            // Hit obstacle
            sound.playHit();
            this.renderer.triggerShake(1.0);
            this.particles.addSparks(item.x, item.y, "#ef4444", 15);

            if (item.damage) {
              this.gameState.takeDamage(item.damage);
              this.particles.addFloatingText(item.x, item.y - 15, "-1 HP (DEADLINE DÍ)!", "#ef4444");
            }
            if (item.scoreDeduct) {
              this.gameState.deductScore(item.scoreDeduct);
              this.particles.addFloatingText(item.x, item.y - 15, "-30 PTS (RỚT MÔN)!", "#dc2626");
            }
          } else {
            // Collect Reward
            this.particles.addSparks(item.x, item.y, "#10b981", 12);

            if (item.buff === "x2") {
              sound.playBuffActive();
              this.gameState.addReward(item.points, true);
              this.particles.addFloatingText(item.x, item.y - 15, "+20 PTS (CÀ PHÊ GÁNH TEAM)!", "#06b6d4");
            } else {
              sound.playItemCollect();
              this.gameState.addReward(item.points, false);
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
      this.renderer.render(
        dt,
        this.playerX,
        targetLaneX,
        this.laneController.currentLane,
        this.spawner.items,
        this.particles,
        isBuffed,
        isGameOver
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
