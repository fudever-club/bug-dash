// FU-DEVER BUG DASH — Reactor Rush Gameplay Engine (STEM FAIR 2026)
// 2 Players per Turn • 3 Rounds • 1 Team Mission (3-4 Members per Team with Rotation)
// Lab Room Webcam & Big TV Display Optimization (High-Contrast Neon Visuals & Team Roster Rotation)

import { REACTOR_CONFIG } from "../config.js";
import { sound } from "../audio/SoundEngine.js";
import { SpriteSheetAnimator } from "./SpriteSheetAnimator.js";

const ImageCtor = (typeof Image !== "undefined") ? Image : class { constructor() { this.src = ""; this.complete = false; } };

export const REACTOR_STAGES = {
  CALIBRATION: "calibration",
  ROUND_1_ENERGY: "round1_energy",
  SWAP_ROUND_2: "swap_round_2",
  ROUND_2_CIRCUIT: "round2_circuit",
  SWAP_ROUND_3: "swap_round_3",
  ROUND_3_COOLING: "round3_cooling",
  MISSION_COMPLETE: "mission_complete"
};

export class ReactorRushEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas && canvas.getContext ? canvas.getContext("2d") : null;
    this.logicalWidth = 640;
    this.logicalHeight = 720;
    this.W = (canvas && canvas.width) || 640;
    this.H = (canvas && canvas.height) || 720;

    // HiDPI Backing Store Setup (Retina 2X / 4K Crisp Rendering)
    this.setupHiDPI();

    // Preload Authentic Cel-Shaded Stage Environments (Anti-AI Craftsmanship)
    this.bgImages = {
      round1: new ImageCtor(),
      round2: new ImageCtor(),
      round3: new ImageCtor(),
      victory: new ImageCtor()
    };
    const basePath = (typeof window !== "undefined" && window.location && window.location.origin) ? (window.location.origin + "/") : "";
    this.bgImages.round1.src = basePath + "assets/reactor/round1_bg.jpg";
    this.bgImages.round2.src = basePath + "assets/reactor/round2_bg.jpg";
    this.bgImages.round3.src = basePath + "assets/reactor/round3_bg.jpg";
    this.bgImages.victory.src = basePath + "assets/reactor/victory_bg.jpg";

    // Preload Authentic Cel-Shaded Character Sprites & Game Props (Zero AI Slop)
    this.sprites = {
      kartCyan: new ImageCtor(),
      kartPink: new ImageCtor(),
      circuitCyan: new ImageCtor(),
      circuitPink: new ImageCtor(),
      cryoCyan: new ImageCtor(),
      cryoPink: new ImageCtor(),
      champCyan: new ImageCtor(),
      champPink: new ImageCtor(),
      champTrophy: new ImageCtor(),
      syncCombo: new ImageCtor(),
      circuitComplete: new ImageCtor(),
      finalBoost: new ImageCtor(),
      energyOrb: new ImageCtor()
    };
    this.sprites.kartCyan.src = basePath + "assets/reactor/sprite_kart_cyan.png";
    this.sprites.kartPink.src = basePath + "assets/reactor/sprite_kart_pink.png";
    this.sprites.circuitCyan.src = basePath + "assets/reactor/sprite_circuit_cyan.png";
    this.sprites.circuitPink.src = basePath + "assets/reactor/sprite_circuit_pink.png";
    this.sprites.cryoCyan.src = basePath + "assets/reactor/sprite_cryo_cyan.png";
    this.sprites.cryoPink.src = basePath + "assets/reactor/sprite_cryo_pink.png";
    this.sprites.champCyan.src = basePath + "assets/reactor/sprite_champ_cyan.png";
    this.sprites.champPink.src = basePath + "assets/reactor/sprite_champ_pink.png";
    this.sprites.champTrophy.src = basePath + "assets/reactor/sprite_champ_trophy.png";
    this.sprites.syncCombo.src = basePath + "assets/reactor/sprite_sync_combo.png";
    this.sprites.circuitComplete.src = basePath + "assets/reactor/sprite_circuit_complete.png";
    this.sprites.finalBoost.src = basePath + "assets/reactor/sprite_final_boost.png";
    this.sprites.energyOrb.src = basePath + "assets/reactor/sprite_energy_orb.png";

    // Animated Spritesheet Controllers (4-frame & 6-frame dynamic animations with procedural fallback)
    this.animators = {
      kartCyan: new SpriteSheetAnimator({
        image: basePath + "assets/reactor/sheet_kart_cyan.png",
        frameWidth: 160,
        frameHeight: 160,
        frameCount: 4,
        fps: 8,
        loop: true,
        fallbackType: "kart_cyan"
      }),
      kartPink: new SpriteSheetAnimator({
        image: basePath + "assets/reactor/sheet_kart_pink.png",
        frameWidth: 160,
        frameHeight: 160,
        frameCount: 4,
        fps: 8,
        loop: true,
        fallbackType: "kart_pink"
      }),
      circuitCyan: new SpriteSheetAnimator({
        image: basePath + "assets/reactor/sheet_circuit_cyan.png",
        frameWidth: 160,
        frameHeight: 160,
        frameCount: 4,
        fps: 8,
        loop: true,
        fallbackType: "circuit_cyan"
      }),
      circuitPink: new SpriteSheetAnimator({
        image: basePath + "assets/reactor/sheet_circuit_pink.png",
        frameWidth: 160,
        frameHeight: 160,
        frameCount: 4,
        fps: 8,
        loop: true,
        fallbackType: "circuit_pink"
      }),
      cryoCyan: new SpriteSheetAnimator({
        image: basePath + "assets/reactor/sheet_cryo_cyan.png",
        frameWidth: 160,
        frameHeight: 160,
        frameCount: 4,
        fps: 8,
        loop: true,
        fallbackType: "cryo_cyan"
      }),
      cryoPink: new SpriteSheetAnimator({
        image: basePath + "assets/reactor/sheet_cryo_pink.png",
        frameWidth: 160,
        frameHeight: 160,
        frameCount: 4,
        fps: 8,
        loop: true,
        fallbackType: "cryo_pink"
      }),
      energyOrb: new SpriteSheetAnimator({
        image: basePath + "assets/reactor/sheet_energy_orb.png",
        frameWidth: 64,
        frameHeight: 64,
        frameCount: 6,
        fps: 12,
        loop: true,
        fallbackType: "energy_orb"
      }),
      champTrophy: new SpriteSheetAnimator({
        image: basePath + "assets/reactor/sheet_champ_trophy.png",
        frameWidth: 128,
        frameHeight: 128,
        frameCount: 4,
        fps: 8,
        loop: true,
        fallbackType: "champ_trophy"
      })
    };

    this.stage = REACTOR_STAGES.CALIBRATION;
    this.stageTime = 0;
    this.totalTime = 0;

    // Team System: 3-4 members per team
    this.teamName = "TEAM NOVA";
    this.teamMembers = ["Hoàng Nam", "Quang Nhật", "Đình Khoa", "Thái Hưng"];
    this.totalScore = 0;
    this.displayScore = 0;
    this.syncComboCount = 0;
    this.r1Score = 0;
    this.r2Score = 0;
    this.r3Score = 0;

    // Player 1 (Cyan Cyber Buggy - Left Half)
    this.p1 = {
      x: 175,
      targetX: 175,
      y: REACTOR_CONFIG.floorY,
      handRaised: false,
      isReady: false,
      readyTime: 0,
      score: 0,
      waveVelocity: 0,
      lastWaveTime: 0,
      lastCatchTime: 0,
      stunTimer: 0,
      color: "#00f5ff",
      accent: "#38bdf8",
      eyeState: "focus" // "focus" | "happy" | "dizzy" | "cool"
    };

    // Player 2 (Pink Cyber Buggy - Right Half)
    this.p2 = {
      x: 465,
      targetX: 465,
      y: REACTOR_CONFIG.floorY,
      handRaised: false,
      isReady: false,
      readyTime: 0,
      score: 0,
      waveVelocity: 0,
      lastWaveTime: 0,
      lastCatchTime: 0,
      stunTimer: 0,
      color: "#ff2a8d",
      accent: "#f472b6",
      eyeState: "focus"
    };

    // Round 1 State: Energy Catch
    this.r1Items = [];
    this.r1SpawnTimer = 0;
    this.r1SyncActive = false;
    this.r1SyncTimer = 0;

    // Round 2 State: Duo Circuit
    this.r2Charge = 0;
    this.r2PulsesCompleted = 0;
    this.r2TargetPulses = REACTOR_CONFIG.r2TargetPulses;
    this.r2JustCompletedTimer = 0;

    // Round 3 State: Cool The Core
    this.coreTemp = REACTOR_CONFIG.startTemp;
    this.coolingParticles = [];
    this.finalBoostActive = false;
    this.coreAngle = 0;

    // Intermission Swap Timer (8s for players to swap positions in front of TV)
    this.swapDuration = 8.0;

    // Confetti particles for Mission Complete
    this.confetti = [];
    this.initConfetti();

    // Floating text feedback popups
    this.floatingTexts = [];

    // Cinematic Stage & Game Transition System
    this.transition = {
      active: false,
      type: null,
      timer: 0,
      duration: 1.2,
      title: "",
      subtitle: "",
      soundPlayed: false
    };
    this.screenShake = 0;
  }

  setTeamRoster(name, members) {
    if (name && typeof name === "string") {
      this.teamName = name.trim().toUpperCase() || "TEAM NOVA";
    }
    if (Array.isArray(members) && members.length >= 3) {
      this.teamMembers = members.slice(0, 4).map(m => String(m).trim() || "Thành viên");
    }
  }

  // Get active pair of player names based on current stage
  getActivePair() {
    const m = this.teamMembers;
    const len = m.length;
    if (this.stage === REACTOR_STAGES.ROUND_1_ENERGY || this.stage === REACTOR_STAGES.CALIBRATION) {
      return { p1Name: m[0] || "Player 1", p2Name: m[1] || "Player 2" };
    }
    if (this.stage === REACTOR_STAGES.ROUND_2_CIRCUIT || this.stage === REACTOR_STAGES.SWAP_ROUND_2) {
      const p1 = len >= 3 ? m[2] : m[0];
      const p2 = len >= 4 ? m[3] : m[0];
      return { p1Name: p1, p2Name: p2 };
    }
    if (this.stage === REACTOR_STAGES.ROUND_3_COOLING || this.stage === REACTOR_STAGES.SWAP_ROUND_3) {
      const p1 = m[1] || m[0];
      const p2 = len >= 3 ? m[2] : m[1];
      return { p1Name: p1, p2Name: p2 };
    }
    return { p1Name: m[0] || "Player 1", p2Name: m[1] || "Player 2" };
  }

  /**
   * HiDPI Backing Store Setup (Retina 2X / 4K Crisp Rendering)
   */
  setupHiDPI() {
    if (!this.canvas) return;
    const rect = (this.canvas.getBoundingClientRect && this.canvas.getBoundingClientRect()) || {
      width: this.canvas.clientWidth || this.logicalWidth || 640,
      height: this.canvas.clientHeight || this.logicalHeight || 720
    };
    const cssWidth = rect.width || this.canvas.clientWidth || this.logicalWidth || 640;
    const cssHeight = rect.height || this.canvas.clientHeight || this.logicalHeight || 720;
    const dpr = Math.min((typeof window !== "undefined" && window.devicePixelRatio) || 1, 2);

    const targetWidth = Math.max(this.logicalWidth || 640, Math.round(cssWidth * dpr));
    const targetHeight = Math.max(this.logicalHeight || 720, Math.round(cssHeight * dpr));

    if (this.canvas.width !== targetWidth || this.canvas.height !== targetHeight) {
      this.canvas.width = targetWidth;
      this.canvas.height = targetHeight;
    }
  }

  initConfetti() {
    this.confetti = [];
    const colors = ["#00f5ff", "#ff2a8d", "#facc15", "#4ade80", "#a855f7", "#ffffff"];
    for (let i = 0; i < 90; i++) {
      this.confetti.push({
        x: Math.random() * this.W,
        y: Math.random() * -this.H,
        vx: (Math.random() - 0.5) * 80,
        vy: Math.random() * 180 + 120,
        size: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 8
      });
    }
  }

  reset() {
    this.stage = REACTOR_STAGES.CALIBRATION;
    this.stageTime = 0;
    this.totalTime = 0;
    this.totalScore = 0;
    this.displayScore = 0;
    this.syncComboCount = 0;
    this.r1Score = 0;
    this.r2Score = 0;
    this.r3Score = 0;

    this.p1.x = 175;
    this.p1.targetX = 175;
    this.p1.handRaised = false;
    this.p1.isReady = false;
    this.p1.readyTime = 0;
    this.p1.score = 0;
    this.p1.stunTimer = 0;
    this.p1.eyeState = "focus";

    this.p2.x = 465;
    this.p2.targetX = 465;
    this.p2.handRaised = false;
    this.p2.isReady = false;
    this.p2.readyTime = 0;
    this.p2.score = 0;
    this.p2.stunTimer = 0;
    this.p2.eyeState = "focus";

    this.r1Items = [];
    this.r1SpawnTimer = 0;
    this.r1SyncActive = false;
    this.r1SyncTimer = 0;

    this.r2Charge = 0;
    this.r2PulsesCompleted = 0;
    this.r2JustCompletedTimer = 0;

    this.coreTemp = REACTOR_CONFIG.startTemp;
    this.coolingParticles = [];
    this.finalBoostActive = false;
    this.coreAngle = 0;

    this.floatingTexts = [];
    this.initConfetti();
    this.transition = {
      active: false,
      type: null,
      timer: 0,
      duration: 1.2,
      title: "",
      subtitle: "",
      soundPlayed: false
    };
    this.screenShake = 0;
  }

  startTransition(type, title, subtitle, duration = 1.2) {
    this.transition = {
      active: true,
      type,
      timer: 0,
      duration,
      title,
      subtitle,
      soundPlayed: false
    };
  }

  addFloatingText(x, y, text, color = "#facc15") {
    this.floatingTexts.push({
      x,
      y,
      text,
      color,
      alpha: 1.0,
      vy: -45,
      life: 1.2
    });
  }

  // Supply telemetry from Webcam (Hands / Face) or Keyboard fallback
  setInputs(inputData) {
    if (!inputData) return;

    // Player 1 inputs
    if (typeof inputData.p1NormX === "number") {
      const bounds = REACTOR_CONFIG.p1FloorBounds;
      this.p1.targetX = bounds.minX + inputData.p1NormX * (bounds.maxX - bounds.minX);
    }
    if (typeof inputData.p1HandRaised === "boolean") {
      this.p1.handRaised = inputData.p1HandRaised;
    }
    if (typeof inputData.p1WaveVelocity === "number") {
      this.p1.waveVelocity = inputData.p1WaveVelocity;
    }

    // Player 2 inputs
    if (typeof inputData.p2NormX === "number") {
      const bounds = REACTOR_CONFIG.p2FloorBounds;
      this.p2.targetX = bounds.minX + inputData.p2NormX * (bounds.maxX - bounds.minX);
    }
    if (typeof inputData.p2HandRaised === "boolean") {
      this.p2.handRaised = inputData.p2HandRaised;
    }
    if (typeof inputData.p2WaveVelocity === "number") {
      this.p2.waveVelocity = inputData.p2WaveVelocity;
    }
  }

  triggerP1Wave() {
    this.p1.waveVelocity = 280;
    this.p1.lastWaveTime = this.totalTime;
    if (this.stage === REACTOR_STAGES.ROUND_3_COOLING) {
      this.spawnCoolingBlasts("p1");
    }
  }

  triggerP2Wave() {
    this.p2.waveVelocity = 280;
    this.p2.lastWaveTime = this.totalTime;
    if (this.stage === REACTOR_STAGES.ROUND_3_COOLING) {
      this.spawnCoolingBlasts("p2");
    }
  }

  spawnCoolingBlasts(side) {
    sound.playCoolingWhoosh();
    const count = 7;
    const startX = side === "p1" ? this.p1.x + 25 : this.p2.x - 25;
    const targetX = 320;
    const targetY = 360;

    for (let i = 0; i < count; i++) {
      this.coolingParticles.push({
        x: startX,
        y: REACTOR_CONFIG.floorY - 20 + (Math.random() - 0.5) * 40,
        vx: (targetX - startX) * (1.8 + Math.random() * 0.8) + (Math.random() - 0.5) * 60,
        vy: (targetY - (REACTOR_CONFIG.floorY - 20)) * 1.5 + (Math.random() - 0.5) * 80,
        r: Math.random() * 5 + 3,
        color: side === "p1" ? "#67e8f9" : "#f472b6",
        life: 0.65,
        maxLife: 0.65
      });
    }

    // Cool the core
    const drop = REACTOR_CONFIG.coolingPerWave * (this.finalBoostActive ? 1.6 : 1.0);
    this.coreTemp = Math.max(REACTOR_CONFIG.safeTemp, this.coreTemp - drop);
    this.addFloatingText(side === "p1" ? this.p1.x + 30 : this.p2.x - 30, 480, `-${drop.toFixed(1)}°C`, side === "p1" ? "#67e8f9" : "#f472b6");
  }

  skipIntermission() {
    if (this.stage === REACTOR_STAGES.SWAP_ROUND_2) {
      sound.playCountdownGo();
      this.stage = REACTOR_STAGES.ROUND_2_CIRCUIT;
      this.stageTime = 0;
      this.startTransition("blast_doors", "CIRCUIT GRID ONLINE", "BẮT ĐẦU VÒNG 02", 0.9);
      this.addFloatingText(this.W / 2, 280, "VÒNG 2: BẮT ĐẦU!", "#facc15");
    } else if (this.stage === REACTOR_STAGES.SWAP_ROUND_3) {
      sound.playCountdownGo();
      this.stage = REACTOR_STAGES.ROUND_3_COOLING;
      this.stageTime = 0;
      this.startTransition("cryo_freeze", "CRYO CHAMBER UNLOCKED", "BẮT ĐẦU VÒNG 03", 0.9);
      this.addFloatingText(this.W / 2, 280, "VÒNG 3: BẮT ĐẦU!", "#00f5ff");
    }
  }

  update(dt) {
    this.totalTime += dt;
    this.stageTime += dt;

    // Advance all animated spritesheet controllers
    if (this.animators) {
      for (const anim of Object.values(this.animators)) {
        anim.update(dt);
      }
    }

    // Cinematic transition progress & screen shake decay
    if (this.transition.active) {
      this.transition.timer += dt;
      if (this.transition.timer >= this.transition.duration) {
        this.transition.active = false;
      }
    }
    if (this.screenShake > 0) {
      this.screenShake = Math.max(0, this.screenShake - dt * 28);
    }

    // Smooth movement towards target X
    this.p1.x += (this.p1.targetX - this.p1.x) * Math.min(1.0, dt * 12);
    this.p2.x += (this.p2.targetX - this.p2.x) * Math.min(1.0, dt * 12);

    // Stun decay
    if (this.p1.stunTimer > 0) {
      this.p1.stunTimer -= dt;
      this.p1.eyeState = "dizzy";
    } else if (this.stage !== REACTOR_STAGES.MISSION_COMPLETE) {
      this.p1.eyeState = this.p1.handRaised ? "happy" : "focus";
    }

    if (this.p2.stunTimer > 0) {
      this.p2.stunTimer -= dt;
      this.p2.eyeState = "dizzy";
    } else if (this.stage !== REACTOR_STAGES.MISSION_COMPLETE) {
      this.p2.eyeState = this.p2.handRaised ? "happy" : "focus";
    }

    // Update floating texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y += ft.vy * dt;
      ft.life -= dt;
      ft.alpha = Math.max(0, ft.life / 1.2);
      if (ft.life <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }

    // State Machine Dispatch
    switch (this.stage) {
      case REACTOR_STAGES.CALIBRATION:
        this.updateCalibration(dt);
        break;
      case REACTOR_STAGES.ROUND_1_ENERGY:
        this.updateRound1(dt);
        break;
      case REACTOR_STAGES.SWAP_ROUND_2:
        this.updateSwapRound2(dt);
        break;
      case REACTOR_STAGES.ROUND_2_CIRCUIT:
        this.updateRound2(dt);
        break;
      case REACTOR_STAGES.SWAP_ROUND_3:
        this.updateSwapRound3(dt);
        break;
      case REACTOR_STAGES.ROUND_3_COOLING:
        this.updateRound3(dt);
        break;
      case REACTOR_STAGES.MISSION_COMPLETE:
        this.updateMissionComplete(dt);
        break;
    }
  }

  // --- STAGE 0: CALIBRATION ---
  updateCalibration(dt) {
    if (this.p1.handRaised) {
      this.p1.readyTime = Math.min(REACTOR_CONFIG.calibrationDuration, this.p1.readyTime + dt);
    } else {
      this.p1.readyTime = Math.max(0, this.p1.readyTime - dt * 1.5);
    }

    if (this.p2.handRaised) {
      this.p2.readyTime = Math.min(REACTOR_CONFIG.calibrationDuration, this.p2.readyTime + dt);
    } else {
      this.p2.readyTime = Math.max(0, this.p2.readyTime - dt * 1.5);
    }

    this.p1.isReady = this.p1.readyTime >= REACTOR_CONFIG.calibrationDuration * 0.7;
    this.p2.isReady = this.p2.readyTime >= REACTOR_CONFIG.calibrationDuration * 0.7;

    const calibrationProgress = Math.min(
      1.0,
      Math.min(this.p1.readyTime, this.p2.readyTime) / REACTOR_CONFIG.calibrationDuration
    );

    if (calibrationProgress >= 1.0) {
      sound.playLock();
      sound.playCountdownGo();
      this.stage = REACTOR_STAGES.ROUND_1_ENERGY;
      this.stageTime = 0;
      this.addFloatingText(this.W / 2, 280, "VÒNG 1: BẮT ĐẦU!", "#00f5ff");
    }
  }

  // --- ROUND 1: ENERGY CATCH ---
  updateRound1(dt) {
    const timeLeft = Math.max(0, REACTOR_CONFIG.round1Duration - this.stageTime);

    // Spawn falling items
    this.r1SpawnTimer += dt;
    if (this.r1SpawnTimer >= REACTOR_CONFIG.r1SpawnInterval) {
      this.r1SpawnTimer = 0;
      this.spawnR1Item();
    }

    // Sync Combo timer decay
    if (this.r1SyncActive) {
      this.r1SyncTimer -= dt;
      if (this.r1SyncTimer <= 0) {
        this.r1SyncActive = false;
      }
    }

    // Update items
    for (let i = this.r1Items.length - 1; i >= 0; i--) {
      const it = this.r1Items[i];
      it.y += it.vy * dt;
      it.pulse += dt * 4;

      // Check collision with P1 (Left track)
      if (it.track === "p1" && Math.abs(it.y - this.p1.y) < 36 && Math.abs(it.x - this.p1.x) < 42) {
        this.handleR1Catch("p1", it);
        this.r1Items.splice(i, 1);
        continue;
      }

      // Check collision with P2 (Right track)
      if (it.track === "p2" && Math.abs(it.y - this.p2.y) < 36 && Math.abs(it.x - this.p2.x) < 42) {
        this.handleR1Catch("p2", it);
        this.r1Items.splice(i, 1);
        continue;
      }

      // Despawn off bottom floor
      if (it.y > this.H + 40) {
        this.r1Items.splice(i, 1);
      }
    }

    if (timeLeft <= 0) {
      sound.playVictory();
      this.r1Score = this.totalScore;
      this.stage = REACTOR_STAGES.SWAP_ROUND_2;
      this.stageTime = 0;
      this.p1.handRaised = false;
      this.p2.handRaised = false;
      this.startTransition("blast_doors", "ACCESSING CIRCUIT DECK", "VÒNG 02: MẠCH ĐIỆN ĐÔI", 1.3);
    }
  }

  spawnR1Item() {
    const tracks = ["p1", "p2"];
    for (const track of tracks) {
      const bounds = track === "p1" ? REACTOR_CONFIG.p1FloorBounds : REACTOR_CONFIG.p2FloorBounds;
      const x = bounds.minX + Math.random() * (bounds.maxX - bounds.minX);
      const isHazard = Math.random() < 0.22;

      let type = "yellow_plus";
      let points = 10;
      let color = "#facc15";

      if (isHazard) {
        type = "hazard_red";
        points = -REACTOR_CONFIG.r1HazardDeduct;
        color = "#ef4444";
      } else {
        const roll = Math.random();
        if (roll < 0.4) {
          type = "green_plus";
          points = 20;
          color = "#4ade80";
        } else if (roll < 0.7) {
          type = "cyan_plus";
          points = 20;
          color = "#38bdf8";
        }
      }

      this.r1Items.push({
        track,
        x,
        y: -20,
        vy: REACTOR_CONFIG.r1ItemSpeed * (0.9 + Math.random() * 0.25),
        type,
        points,
        color,
        isHazard,
        pulse: Math.random() * Math.PI * 2
      });
    }
  }

  handleR1Catch(playerSide, item) {
    const now = this.totalTime;
    const player = playerSide === "p1" ? this.p1 : this.p2;
    const otherPlayer = playerSide === "p1" ? this.p2 : this.p1;

    if (item.isHazard) {
      sound.playHit();
      player.stunTimer = REACTOR_CONFIG.r1HazardStun;
      player.score = Math.max(0, player.score + item.points);
      this.totalScore = Math.max(0, this.totalScore + item.points);
      this.addFloatingText(player.x, player.y - 45, `${item.points} PTS!`, "#ef4444");
      return;
    }

    // Positive Energy Catch
    sound.playEnergyCatch();
    player.score += item.points;
    this.totalScore += item.points;
    player.lastCatchTime = now;
    player.eyeState = "happy";
    this.addFloatingText(player.x, player.y - 40, `+${item.points}`, item.color);

    // Check Sync Combo
    if (Math.abs(now - otherPlayer.lastCatchTime) <= REACTOR_CONFIG.r1SyncWindow) {
      sound.playSyncCombo();
      this.syncComboCount++;
      const bonus = REACTOR_CONFIG.r1SyncBonus;
      player.score += bonus;
      otherPlayer.score += bonus;
      this.totalScore += bonus * 2;
      this.r1SyncActive = true;
      this.r1SyncTimer = 1.0;
      this.addFloatingText(this.W / 2, 380, `SYNC COMBO +${bonus}!`, "#facc15");
    }
  }

  // --- INTERMISSION: SWAP FOR ROUND 2 ---
  updateSwapRound2(dt) {
    if (this.stageTime >= this.swapDuration) {
      this.skipIntermission();
    }
  }

  // --- ROUND 2: DUO CIRCUIT ---
  updateRound2(dt) {
    const timeLeft = Math.max(0, REACTOR_CONFIG.round2Duration - this.stageTime);
    const bothClosed = this.p1.handRaised && this.p2.handRaised;

    if (this.r2JustCompletedTimer > 0) {
      this.r2JustCompletedTimer -= dt;
    }

    if (bothClosed) {
      this.r2Charge += dt / REACTOR_CONFIG.r2ChargeTimeRequired;
      if (this.r2Charge >= 1.0) {
        sound.playBulbLight();
        this.r2Charge = 0;
        this.r2PulsesCompleted++;
        this.r2JustCompletedTimer = 0.8;
        this.p1.score += REACTOR_CONFIG.r2PulseScore;
        this.p2.score += REACTOR_CONFIG.r2PulseScore;
        this.totalScore += REACTOR_CONFIG.r2PulseScore * 2;
        this.addFloatingText(this.W / 2, 280, `CIRCUIT COMPLETE! (+${REACTOR_CONFIG.r2PulseScore * 2})`, "#facc15");
      }
    } else {
      this.r2Charge = Math.max(0, this.r2Charge - dt * 2.0);
    }

    if (this.r2PulsesCompleted >= this.r2TargetPulses || timeLeft <= 0) {
      sound.playVictory();
      this.r2Score = this.totalScore - this.r1Score;
      this.stage = REACTOR_STAGES.SWAP_ROUND_3;
      this.stageTime = 0;
      this.p1.handRaised = false;
      this.p2.handRaised = false;
      this.startTransition("cryo_freeze", "CORE TEMPERATURE CRITICAL", "VÒNG 03: HẠ NHIỆT LÒ NĂNG LƯỢNG", 1.3);
    }
  }

  // --- INTERMISSION: SWAP FOR ROUND 3 ---
  updateSwapRound3(dt) {
    if (this.stageTime >= this.swapDuration) {
      this.skipIntermission();
    }
  }

  // --- ROUND 3: COOL THE CORE ---
  updateRound3(dt) {
    const timeLeft = Math.max(0, REACTOR_CONFIG.round3Duration - this.stageTime);
    this.coreAngle += dt * 1.5;

    // Passive heat rise only if no cooling and not yet in safe zone
    if (this.coreTemp > REACTOR_CONFIG.safeTemp + 0.1) {
      this.coreTemp = Math.min(REACTOR_CONFIG.startTemp, this.coreTemp + REACTOR_CONFIG.passiveHeatRise * dt);
    }

    // Final Boost milestone check
    if (this.coreTemp <= REACTOR_CONFIG.boostTemp && !this.finalBoostActive) {
      this.finalBoostActive = true;
      sound.playBuffActive();
      this.addFloatingText(this.W / 2, 220, "FINAL BOOST KÍCH HOẠT! VẪY TAY CỰC ĐẠI!", "#facc15");
    }

    // Check continuous wave gestures from webcam telemetry
    const p1Waving = (this.p1.waveVelocity >= REACTOR_CONFIG.minWaveVelocity) || this.p1.handRaised;
    const p2Waving = (this.p2.waveVelocity >= REACTOR_CONFIG.minWaveVelocity) || this.p2.handRaised;

    if (p1Waving && (this.totalTime - this.p1.lastWaveTime > 0.18)) {
      this.triggerP1Wave();
    }
    if (p2Waving && (this.totalTime - this.p2.lastWaveTime > 0.18)) {
      this.triggerP2Wave();
    }

    // Update cooling particles
    for (let i = this.coolingParticles.length - 1; i >= 0; i--) {
      const p = this.coolingParticles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) {
        this.coolingParticles.splice(i, 1);
      }
    }

    // Win condition: Temp <= safeTemp (28°C) or time expired
    if (this.coreTemp <= REACTOR_CONFIG.safeTemp + 0.05 || timeLeft <= 0) {
      sound.playMissionComplete();
      const coolingBonus = Math.round((REACTOR_CONFIG.startTemp - this.coreTemp) * 12);
      this.r3Score = coolingBonus;
      this.totalScore += coolingBonus;
      this.stage = REACTOR_STAGES.MISSION_COMPLETE;
      this.stageTime = 0;
      this.startTransition("victory_warp", "MISSION ACCOMPLISHED", "CHÚC MỪNG CHIẾN THẮNG!", 1.6);
    }
  }

  // --- STAGE: MISSION COMPLETE ---
  updateMissionComplete(dt) {
    this.displayScore += (this.totalScore - this.displayScore) * Math.min(1.0, dt * 6);

    for (const c of this.confetti) {
      c.x += c.vx * dt;
      c.y += c.vy * dt;
      c.rotation += c.vRot * dt;
      if (c.y > this.H + 20) {
        c.y = -20;
        c.x = Math.random() * this.W;
      }
    }
  }

  // =========================================================================
  // RENDERING ENGINE (Optimized for Big TV Display & Lab Room Setup)
  // =========================================================================

  render(ctx, W, H, dt) {
    this.ctx = ctx;
    this.setupHiDPI();
    this.W = W || 640;
    this.H = H || 720;

    if (ctx && ctx.imageSmoothingEnabled !== undefined) {
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
    }

    let shaking = false;
    if (this.screenShake > 0) {
      shaking = true;
      ctx.save();
      const sx = (Math.random() - 0.5) * this.screenShake;
      const sy = (Math.random() - 0.5) * this.screenShake;
      ctx.translate(sx, sy);
    }

    this.renderBackground(ctx, W, H);

    switch (this.stage) {
      case REACTOR_STAGES.CALIBRATION:
        this.renderCalibration(ctx, W, H);
        break;
      case REACTOR_STAGES.ROUND_1_ENERGY:
        this.renderRound1(ctx, W, H);
        break;
      case REACTOR_STAGES.SWAP_ROUND_2:
        this.renderIntermissionSwap(ctx, W, H, 2);
        break;
      case REACTOR_STAGES.ROUND_2_CIRCUIT:
        this.renderRound2(ctx, W, H);
        break;
      case REACTOR_STAGES.SWAP_ROUND_3:
        this.renderIntermissionSwap(ctx, W, H, 3);
        break;
      case REACTOR_STAGES.ROUND_3_COOLING:
        this.renderRound3(ctx, W, H);
        break;
      case REACTOR_STAGES.MISSION_COMPLETE:
        this.renderMissionComplete(ctx, W, H);
        break;
    }

    this.renderFloatingTexts(ctx);

    if (this.transition.active) {
      this.renderTransition(ctx, W, H);
    }

    if (shaking) {
      ctx.restore();
    }
  }

  drawBackgroundCover(ctx, img, W, H, darkOverlayAlpha = 0) {
    if (img && img.complete && img.naturalWidth > 0 && ctx.drawImage) {
      const iw = img.naturalWidth;
      const ih = img.naturalHeight;
      const targetAspect = W / H;
      const imgAspect = iw / ih;

      let sx, sy, sw, sh;
      if (imgAspect > targetAspect) {
        sh = ih;
        sw = ih * targetAspect;
        sx = (iw - sw) * 0.5;
        sy = 0;
      } else {
        sw = iw;
        sh = iw / targetAspect;
        sx = 0;
        sy = (ih - sh) * 0.5;
      }

      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, W, H);
    } else {
      const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
      bgGrad.addColorStop(0, "#060914");
      bgGrad.addColorStop(0.65, "#0a1126");
      bgGrad.addColorStop(1, "#101a38");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, W, H);
    }

    if (darkOverlayAlpha > 0) {
      ctx.fillStyle = `rgba(5, 10, 24, ${darkOverlayAlpha})`;
      ctx.fillRect(0, 0, W, H);
    }
  }

  renderBackground(ctx, W, H) {
    let activeBg = this.bgImages.round1;
    let overlayAlpha = 0;

    switch (this.stage) {
      case REACTOR_STAGES.CALIBRATION:
        activeBg = this.bgImages.round1;
        overlayAlpha = 0.08; // High visibility for cel-shaded lab art
        break;
      case REACTOR_STAGES.ROUND_1_ENERGY:
        activeBg = this.bgImages.round1;
        overlayAlpha = 0.04; // Crisp cel-shaded map
        break;
      case REACTOR_STAGES.SWAP_ROUND_2:
        activeBg = this.bgImages.round2;
        overlayAlpha = 0.35;
        break;
      case REACTOR_STAGES.ROUND_2_CIRCUIT:
        activeBg = this.bgImages.round2;
        overlayAlpha = 0.04;
        break;
      case REACTOR_STAGES.SWAP_ROUND_3:
        activeBg = this.bgImages.round3;
        overlayAlpha = 0.35;
        break;
      case REACTOR_STAGES.ROUND_3_COOLING:
        activeBg = this.bgImages.round3;
        overlayAlpha = 0.04;
        break;
      case REACTOR_STAGES.MISSION_COMPLETE:
        activeBg = this.bgImages.victory;
        overlayAlpha = 0;
        break;
    }

    this.drawBackgroundCover(ctx, activeBg, W, H, overlayAlpha);

    // Subtle neon floor guide line for ground-based gameplay
    if (this.stage === REACTOR_STAGES.ROUND_1_ENERGY || this.stage === REACTOR_STAGES.CALIBRATION) {
      ctx.save();
      ctx.strokeStyle = "rgba(0, 245, 255, 0.25)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, REACTOR_CONFIG.floorY + 28);
      ctx.lineTo(W, REACTOR_CONFIG.floorY + 28);
      ctx.stroke();
      ctx.restore();
    }

    this.renderTopHeader(ctx, W);
  }

  renderTopHeader(ctx, W) {
    if (this.stage === REACTOR_STAGES.MISSION_COMPLETE) {
      // Suppress top HUD pills during Victory Stage so the massive championship banner is unhindered
      return;
    }

    ctx.save();
    const pillY = 14;
    const pillH = 34;

    // Determine Stage Name, Color & Time Left
    let stageLabel = "CALIBRATION";
    let stageColor = "#38bdf8";
    let roundTimeLeft = Math.max(0, Math.ceil(REACTOR_CONFIG.calibrationDuration - (this.stageTime || 0)));

    if (this.stage === REACTOR_STAGES.ROUND_1_ENERGY) {
      stageLabel = "ROUND 01";
      stageColor = "#facc15";
      roundTimeLeft = Math.max(0, Math.ceil(REACTOR_CONFIG.round1Duration - (this.stageTime || 0)));
    } else if (this.stage === REACTOR_STAGES.SWAP_ROUND_2 || this.stage === REACTOR_STAGES.SWAP_ROUND_3) {
      stageLabel = "ĐỔI CA";
      stageColor = "#fb923c";
      roundTimeLeft = Math.max(0, Math.ceil((this.swapDuration || 6) - (this.stageTime || 0)));
    } else if (this.stage === REACTOR_STAGES.ROUND_2_CIRCUIT) {
      stageLabel = "ROUND 02";
      stageColor = "#00f5ff";
      roundTimeLeft = Math.max(0, Math.ceil(REACTOR_CONFIG.round2Duration - (this.stageTime || 0)));
    } else if (this.stage === REACTOR_STAGES.ROUND_3_COOLING) {
      stageLabel = "ROUND 03";
      stageColor = "#ec4899";
      roundTimeLeft = Math.max(0, Math.ceil(REACTOR_CONFIG.round3Duration - (this.stageTime || 0)));
    }
    if (isNaN(roundTimeLeft)) roundTimeLeft = 0;

    // Pill 1: Round / Stage Badge (Left)
    const p1W = 145;
    const p1X = 24;
    ctx.save();
    ctx.fillStyle = "rgba(9, 14, 28, 0.90)";
    ctx.strokeStyle = stageColor;
    ctx.lineWidth = 1.5;
    ctx.shadowColor = stageColor;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(p1X, pillY, p1W, pillH, 17);
    else ctx.rect(p1X, pillY, p1W, pillH);
    ctx.fill();
    ctx.stroke();

    // Cyber LED indicator dot
    ctx.fillStyle = stageColor;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(p1X + 18, pillY + pillH / 2, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.font = "900 13px 'JetBrains Mono', monospace";
    ctx.fillStyle = stageColor;
    ctx.textAlign = "center";
    ctx.fillText(stageLabel, p1X + p1W / 2 + 8, pillY + 22);
    ctx.restore();

    // Pill 2: Countdown Timer (Center - Ultra Sharp Vector Stopwatch)
    const p2W = 150;
    const p2X = W / 2 - p2W / 2;
    const isUrgent = roundTimeLeft <= 5;
    const timerColor = isUrgent ? "#ef4444" : "#ffffff";
    const timerBorder = isUrgent ? "#ef4444" : "rgba(103, 232, 249, 0.5)";

    ctx.save();
    ctx.fillStyle = isUrgent ? "rgba(239, 68, 68, 0.3)" : "rgba(9, 14, 28, 0.90)";
    ctx.strokeStyle = timerBorder;
    ctx.lineWidth = 1.5;
    ctx.shadowColor = timerBorder;
    ctx.shadowBlur = isUrgent ? 12 : 6;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(p2X, pillY, p2W, pillH, 17);
    else ctx.rect(p2X, pillY, p2W, pillH);
    ctx.fill();
    ctx.stroke();

    // Vector Stopwatch Icon (Zero Emoji)
    const clockX = p2X + 22;
    const clockY = pillY + pillH / 2;
    ctx.strokeStyle = timerColor;
    ctx.lineWidth = 1.8;
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(clockX, clockY, 6.5, 0, Math.PI * 2);
    ctx.stroke();
    // Clock hands
    ctx.beginPath();
    ctx.moveTo(clockX, clockY);
    ctx.lineTo(clockX, clockY - 3.8);
    ctx.moveTo(clockX, clockY);
    ctx.lineTo(clockX + 3.2, clockY);
    ctx.stroke();
    // Top stem
    ctx.beginPath();
    ctx.moveTo(clockX - 1.5, clockY - 8.5);
    ctx.lineTo(clockX + 1.5, clockY - 8.5);
    ctx.stroke();

    const min = String(Math.floor(roundTimeLeft / 60)).padStart(2, "0");
    const sec = String(roundTimeLeft % 60).padStart(2, "0");
    ctx.font = "800 14px 'JetBrains Mono', monospace";
    ctx.fillStyle = timerColor;
    ctx.textAlign = "center";
    ctx.fillText(`${min}:${sec}`, p2X + p2W / 2 + 10, pillY + 22);
    ctx.restore();

    // Pill 3: Total Team Score (Right - Glowing Amber Cyber Pill)
    const p3W = 165;
    const p3X = W - 24 - p3W;
    ctx.save();
    ctx.fillStyle = "rgba(9, 14, 28, 0.90)";
    ctx.strokeStyle = "rgba(250, 204, 21, 0.75)";
    ctx.lineWidth = 1.5;
    ctx.shadowColor = "#facc15";
    ctx.shadowBlur = 8;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(p3X, pillY, p3W, pillH, 17);
    else ctx.rect(p3X, pillY, p3W, pillH);
    ctx.fill();
    ctx.stroke();

    // Golden Diamond Vector Icon
    const diamondX = p3X + 20;
    const diamondY = pillY + pillH / 2;
    ctx.fillStyle = "#facc15";
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(diamondX, diamondY - 5.5);
    ctx.lineTo(diamondX + 5, diamondY);
    ctx.lineTo(diamondX, diamondY + 5.5);
    ctx.lineTo(diamondX - 5, diamondY);
    ctx.closePath();
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.font = "900 13px 'JetBrains Mono', monospace";
    ctx.fillStyle = "#facc15";
    ctx.textAlign = "center";
    ctx.fillText(`SCORE: ${this.totalScore}`, p3X + p3W / 2 + 8, pillY + 22);
    ctx.restore();

    ctx.restore();
  }

  // --- RENDER STAGE 0: CALIBRATION ---
  renderCalibration(ctx, W, H) {
    ctx.save();

    const pair = this.getActivePair();

    ctx.font = "900 22px 'Be Vietnam Pro', sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "left";
    ctx.fillText("CAMERA CALIBRATION • WEBCAM LAB", 32, 102);

    ctx.font = "600 13.5px 'Be Vietnam Pro', sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.78)";
    ctx.fillText(`Lượt 1: ${pair.p1Name} & ${pair.p2Name} bước vào khung hình và giơ 2 tay lên cao`, 32, 126);

    const boxW = 270;
    const boxH = 340;
    const boxY = 155;

    // P1 Panel (Cyan)
    this.renderCalibrationSlot(ctx, 32, boxY, boxW, boxH, `P1: ${pair.p1Name}`, this.p1, "#00f5ff", "#38bdf8");

    // P2 Panel (Pink)
    this.renderCalibrationSlot(ctx, W - 32 - boxW, boxY, boxW, boxH, `P2: ${pair.p2Name}`, this.p2, "#ff2a8d", "#f472b6");

    // Bottom Calibration Progress Bar
    const progress = Math.min(1.0, Math.min(this.p1.readyTime, this.p2.readyTime) / REACTOR_CONFIG.calibrationDuration);
    const barW = W - 64;
    const barY = 525;

    ctx.fillStyle = "rgba(15, 23, 42, 0.8)";
    ctx.strokeStyle = "rgba(56, 189, 248, 0.3)";
    ctx.beginPath();
    ctx.roundRect(32, barY, barW, 20, 10);
    ctx.fill();
    ctx.stroke();

    const fillW = barW * progress;
    if (fillW > 0) {
      const fillGrad = ctx.createLinearGradient(32, barY, 32 + fillW, barY);
      fillGrad.addColorStop(0, "#00f5ff");
      fillGrad.addColorStop(1, "#4ade80");
      ctx.fillStyle = fillGrad;
      ctx.beginPath();
      ctx.roundRect(32, barY, fillW, 20, 10);
      ctx.fill();
    }

    this.renderBottomTicker(ctx, W, H, "WEBCAM LAB • 2 NGƯỜI VÀO VỊ TRÍ", "Không cần chạm bàn phím (Phím dự phòng: A/D/W & J/L/I)");

    ctx.restore();
  }

  renderCalibrationSlot(ctx, x, y, w, h, label, player, primaryColor, accentColor) {
    ctx.save();
    // Frosted glass panel - allows the stunning cel-shaded background art to shine through
    ctx.fillStyle = "rgba(11, 19, 43, 0.28)";
    ctx.strokeStyle = player.isReady ? primaryColor : "rgba(56, 189, 248, 0.45)";
    ctx.lineWidth = player.isReady ? 2.5 : 1.5;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 14);
    ctx.fill();
    ctx.stroke();

    // Subtle corner brackets instead of dense grid lines
    ctx.strokeStyle = primaryColor;
    ctx.lineWidth = 2;
    const corner = 16;
    // Top-Left
    ctx.beginPath();
    ctx.moveTo(x + 10, y + 10 + corner); ctx.lineTo(x + 10, y + 10); ctx.lineTo(x + 10 + corner, y + 10);
    ctx.stroke();
    // Top-Right
    ctx.beginPath();
    ctx.moveTo(x + w - 10 - corner, y + 10); ctx.lineTo(x + w - 10, y + 10); ctx.lineTo(x + w - 10, y + 10 + corner);
    ctx.stroke();
    // Bottom-Left
    ctx.beginPath();
    ctx.moveTo(x + 10, y + h - 10 - corner); ctx.lineTo(x + 10, y + h - 10); ctx.lineTo(x + 10 + corner, y + h - 10);
    ctx.stroke();
    // Bottom-Right
    ctx.beginPath();
    ctx.moveTo(x + w - 10 - corner, y + h - 10); ctx.lineTo(x + w - 10, y + h - 10); ctx.lineTo(x + w - 10, y + h - 10 - corner);
    ctx.stroke();

    // Member Label (Large text for TV visibility)
    ctx.font = "800 13.5px 'Be Vietnam Pro', sans-serif";
    ctx.fillStyle = primaryColor;
    ctx.textAlign = "left";
    ctx.fillText(label, x + 16, y + 28);

    ctx.textAlign = "right";
    ctx.font = "800 11px 'JetBrains Mono', monospace";
    if (player.isReady) {
      ctx.fillStyle = "#4ade80";
      ctx.fillText("READY ✓", x + w - 16, y + 28);
    } else if (player.handRaised) {
      ctx.fillStyle = "#facc15";
      ctx.fillText("TRACKING ACTIVE", x + w - 16, y + 28);
    } else {
      ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
      ctx.fillText("SEARCHING...", x + w - 16, y + 28);
    }

    const mascotX = x + w / 2;
    const mascotY = y + h / 2 + 10;
    this.drawMechaPilotKart(ctx, mascotX, mascotY, label.includes("P1") ? "cyan" : "pink", {
      handsRaised: player.handRaised,
      isReady: player.isReady,
      scale: 1.15,
      eyeState: player.handRaised ? "happy" : "focus"
    });

    ctx.textAlign = "center";
    ctx.font = "800 12.5px 'Be Vietnam Pro', sans-serif";
    ctx.fillStyle = player.handRaised ? "#4ade80" : "rgba(255, 255, 255, 0.88)";
    ctx.fillText(player.handRaised ? "ĐÃ GIƠ TAY — GIỮ NGUYÊN" : "RAISE HANDS (GIƠ CAO TAY)", x + w / 2, y + h - 22);

    ctx.restore();
  }

  // --- RENDER ROUND 1: ENERGY CATCH ---
  renderRound1(ctx, W, H) {
    ctx.save();
    const pair = this.getActivePair();

    ctx.font = "800 15px 'Be Vietnam Pro', sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    ctx.textAlign = "left";
    ctx.fillText("HỨNG NĂNG LƯỢNG • NÉ GAI ĐỎ", 32, 72);

    ctx.font = "600 12px 'Be Vietnam Pro', sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
    ctx.fillText("Lái robot sang trái/phải • Cùng hứng = SYNC COMBO", 32, 92);

    this.renderMiniCameraPIP(ctx, W - 145, 60, 120, 68);

    // Center divider line
    ctx.strokeStyle = "rgba(56, 189, 248, 0.35)";
    ctx.setLineDash([8, 8]);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(W / 2, 140);
    ctx.lineTo(W / 2, H - 75);
    ctx.stroke();
    ctx.setLineDash([]);

    // Member Name Tag on Top
    ctx.font = "800 13px 'Be Vietnam Pro', sans-serif";
    ctx.fillStyle = "#00f5ff";
    ctx.textAlign = "left";
    ctx.fillText(`P1 / ${pair.p1Name}`, 45, 155);

    ctx.fillStyle = "#ff2a8d";
    ctx.fillText(`P2 / ${pair.p2Name}`, W / 2 + 25, 155);

    // Falling items
    for (const it of this.r1Items) {
      this.drawR1Item(ctx, it);
    }

    if (this.r1SyncActive) {
      this.renderSyncArc(ctx);
      if (ctx.drawImage && this.sprites.syncCombo && this.sprites.syncCombo.complete && this.sprites.syncCombo.naturalWidth > 0) {
        ctx.save();
        const burstW = 200;
        const burstH = 195;
        const pulse = 1.0 + Math.sin(this.totalTime * 14) * 0.08;
        ctx.translate(W / 2, 280);
        ctx.scale(pulse, pulse);
        ctx.drawImage(this.sprites.syncCombo, -burstW / 2, -burstH / 2, burstW, burstH);
        ctx.restore();
      }
    }

    // Render Mecha Pilot Karts on floor with Nametags & Dynamic Steering Tilt
    this.drawMechaPilotKart(ctx, this.p1.x, this.p1.y, "cyan", {
      handsRaised: false,
      isCatching: true,
      scale: 1.05,
      playerName: pair.p1Name,
      steerTilt: (this.p1.targetX - this.p1.x) * 0.005,
      justCaught: (this.totalTime - this.p1.lastCatchTime < 0.45),
      stunned: this.p1.stunTimer > 0,
      eyeState: this.p1.eyeState
    });

    this.drawMechaPilotKart(ctx, this.p2.x, this.p2.y, "pink", {
      handsRaised: false,
      isCatching: true,
      scale: 1.05,
      playerName: pair.p2Name,
      steerTilt: (this.p2.targetX - this.p2.x) * 0.005,
      justCaught: (this.totalTime - this.p2.lastCatchTime < 0.45),
      stunned: this.p2.stunTimer > 0,
      eyeState: this.p2.eyeState
    });

    // Floor Scores
    ctx.font = "900 16px 'JetBrains Mono', monospace";
    ctx.fillStyle = "#00f5ff";
    ctx.textAlign = "left";
    ctx.fillText(`P1 + ${String(this.p1.score).padStart(3, "0")}`, 45, H - 95);

    ctx.fillStyle = "#ff2a8d";
    ctx.fillText(`P2 + ${String(this.p2.score).padStart(3, "0")}`, W / 2 + 25, H - 95);

    this.renderBottomTicker(ctx, W, H, "SCIENCE: NĂNG LƯỢNG CÓ THỂ ĐƯỢC CHUYỂN HÓA", "Bắt đúng = +10..+20 pts • Cùng bắt = SYNC COMBO +15");

    ctx.restore();
  }

  // --- RENDER INTERMISSION: ROSTER ROTATION SWAP SCREEN ---
  renderIntermissionSwap(ctx, W, H, nextRoundNum) {
    ctx.save();
    const remainingSwap = Math.max(0, Math.ceil(this.swapDuration - this.stageTime));
    const pair = this.getActivePair();

    // Backdrop overlay: translucent so the upcoming round's art is visible!
    ctx.fillStyle = "rgba(7, 11, 25, 0.45)";
    ctx.fillRect(0, 72, W, H - 72);

    // Intermission Box
    const boxW = 540;
    const boxH = 430;
    const boxX = W / 2 - boxW / 2;
    const boxY = 120;

    ctx.fillStyle = "rgba(13, 22, 50, 0.72)";
    ctx.strokeStyle = "#facc15";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxW, boxH, 16);
    ctx.fill();
    ctx.stroke();

    // Header Title
    ctx.textAlign = "center";
    ctx.font = "900 24px 'Be Vietnam Pro', sans-serif";
    ctx.fillStyle = "#facc15";
    ctx.shadowColor = "#facc15";
    ctx.shadowBlur = 12;
    ctx.fillText("ĐỔI CA THÀNH VIÊN TRONG TEAM", W / 2, boxY + 45);
    ctx.shadowBlur = 0;

    // Previous round recap
    const prevScore = nextRoundNum === 2 ? this.r1Score : this.r2Score;
    ctx.font = "700 14px 'Be Vietnam Pro', sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(`Vừa hoàn thành Vòng ${nextRoundNum - 1} • Điểm hiện tại: ${this.totalScore} PTS`, W / 2, boxY + 75);

    // Upcoming Round Notification
    ctx.font = "800 18px 'Be Vietnam Pro', sans-serif";
    ctx.fillStyle = "#38bdf8";
    const roundTitle = nextRoundNum === 2 ? "VÒNG 02: DUO CIRCUIT (MẠCH ĐIỆN)" : "VÒNG 03: COOL THE CORE (HẠ NHIỆT LÒ)";
    ctx.fillText(`CHUẨN BỊ CHO ${roundTitle}`, W / 2, boxY + 120);

    // Two New Active Members Stepping In
    ctx.font = "600 14px 'Be Vietnam Pro', sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
    ctx.fillText("2 THÀNH VIÊN TIẾP THEO BƯỚC VÀO TRƯỚC WEBCAM TV:", W / 2, boxY + 155);

    // Member 1 Badge (Cyan)
    const cardY = boxY + 180;
    ctx.fillStyle = "rgba(0, 245, 255, 0.15)";
    ctx.strokeStyle = "#00f5ff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(boxX + 35, cardY, 210, 80, 10);
    ctx.fill();
    ctx.stroke();

    ctx.font = "800 12px 'JetBrains Mono', monospace";
    ctx.fillStyle = "#00f5ff";
    ctx.fillText("P1 (CYBER CYAN)", boxX + 140, cardY + 28);
    ctx.font = "900 16px 'Be Vietnam Pro', sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(pair.p1Name, boxX + 140, cardY + 56);

    // Member 2 Badge (Pink)
    ctx.fillStyle = "rgba(255, 42, 141, 0.15)";
    ctx.strokeStyle = "#ff2a8d";
    ctx.beginPath();
    ctx.roundRect(boxX + 295, cardY, 210, 80, 10);
    ctx.fill();
    ctx.stroke();

    ctx.font = "800 12px 'JetBrains Mono', monospace";
    ctx.fillStyle = "#ff2a8d";
    ctx.fillText("P2 (CYBER PINK)", boxX + 400, cardY + 28);
    ctx.font = "900 16px 'Be Vietnam Pro', sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(pair.p2Name, boxX + 400, cardY + 56);

    // Big Countdown Number
    ctx.font = "900 36px 'JetBrains Mono', monospace";
    ctx.fillStyle = "#facc15";
    ctx.fillText(`TỰ ĐỘNG BẮT ĐẦU TRONG: ${remainingSwap}S`, W / 2, boxY + 315);

    // Skip / Ready Button Hint
    ctx.font = "700 13px 'Be Vietnam Pro', sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
    ctx.fillText("Bấm phím [SPACE] hoặc click chuột để vào chơi ngay lập tức!", W / 2, boxY + 355);

    // Ready CTA Button
    ctx.fillStyle = "#10b981";
    ctx.beginPath();
    ctx.roundRect(W / 2 - 120, boxY + 375, 240, 38, 19);
    ctx.fill();

    ctx.font = "900 13px 'Be Vietnam Pro', sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.fillText("SẴN SÀNG VÀO VÒNG (SPACE)", W / 2, boxY + 399);

    ctx.restore();
  }

  drawR1Item(ctx, it) {
    ctx.save();
    const itemColor = it.color || (it.isHazard ? "#ef4444" : "#facc15");
    const pulseScale = 1.0 + Math.sin(it.pulse || 0) * 0.12;
    const r = it.isHazard ? 18 * pulseScale : 16 * pulseScale;

    const glow = ctx.createRadialGradient(it.x, it.y, r * 0.2, it.x, it.y, r * 2.0);
    glow.addColorStop(0, itemColor);
    glow.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(it.x, it.y, r * 2.0, 0, Math.PI * 2);
    ctx.fill();

    if (!it.isHazard && this.animators && this.animators.energyOrb && this.animators.energyOrb.isReady()) {
      const orbW = 36 * pulseScale;
      this.animators.energyOrb.draw(ctx, it.x - orbW / 2, it.y - orbW / 2, orbW, orbW, {
        glowColor: itemColor,
        glowBlur: 10
      });
    } else if (!it.isHazard && ctx.drawImage && this.sprites.energyOrb && this.sprites.energyOrb.complete && this.sprites.energyOrb.naturalWidth > 0) {
      const orbW = 34 * pulseScale;
      ctx.drawImage(this.sprites.energyOrb, it.x - orbW / 2, it.y - orbW / 2, orbW, orbW);
    } else if (!it.isHazard && this.animators && this.animators.energyOrb) {
      const orbW = 34 * pulseScale;
      this.animators.energyOrb.draw(ctx, it.x - orbW / 2, it.y - orbW / 2, orbW, orbW, {
        glowColor: itemColor,
        glowBlur: 8
      });
    } else {
      ctx.fillStyle = itemColor;
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(it.x, it.y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.font = "900 15px 'Be Vietnam Pro', sans-serif";
      ctx.fillStyle = "#0a0f1d";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(it.isHazard ? "!" : "+", it.x, it.y);
    }

    ctx.restore();
  }

  renderSyncArc(ctx) {
    ctx.save();
    ctx.strokeStyle = "#facc15";
    ctx.lineWidth = 3.5;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(this.p1.x, this.p1.y - 25);
    ctx.quadraticCurveTo(this.W / 2, this.p1.y - 120, this.p2.x, this.p2.y - 25);
    ctx.stroke();

    const hasSyncSprite = Boolean(ctx.drawImage && this.sprites.syncCombo && this.sprites.syncCombo.complete && this.sprites.syncCombo.naturalWidth > 0);
    if (!hasSyncSprite) {
      ctx.font = "900 24px 'Be Vietnam Pro', sans-serif";
      ctx.fillStyle = "#facc15";
      ctx.textAlign = "center";
      ctx.shadowColor = "#facc15";
      ctx.shadowBlur = 15;
      ctx.fillText("SYNC COMBO +15!", this.W / 2, this.p1.y - 130);
    }

    ctx.restore();
  }

  // --- RENDER ROUND 2: DUO CIRCUIT ---
  renderRound2(ctx, W, H) {
    ctx.save();
    const pair = this.getActivePair();

    ctx.font = "800 15px 'Be Vietnam Pro', sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    ctx.textAlign = "left";
    ctx.fillText("MẠCH ĐIỆN NỐI TIẾP • 2 CÔNG TẮC", 32, 72);

    ctx.font = "600 12px 'Be Vietnam Pro', sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
    ctx.fillText("Cả hai cùng giơ tay để đóng mạch và thắp sáng bóng đèn", 32, 92);

    this.renderMiniCameraPIP(ctx, W - 145, 60, 120, 68);

    const centerY = 330;
    const bulbX = W / 2;
    const isBothOn = this.p1.handRaised && this.p2.handRaised;

    // Switch P1 (Left)
    this.renderSwitchBox(ctx, 110, centerY, `P1: ${pair.p1Name}`, this.p1.handRaised, "#00f5ff");

    // Switch P2 (Right)
    this.renderSwitchBox(ctx, W - 110, centerY, `P2: ${pair.p2Name}`, this.p2.handRaised, "#ff2a8d");

    // Wires
    ctx.strokeStyle = isBothOn ? "#facc15" : "rgba(56, 189, 248, 0.4)";
    ctx.lineWidth = isBothOn ? 5 : 3;
    ctx.shadowColor = isBothOn ? "#facc15" : "transparent";
    ctx.shadowBlur = isBothOn ? 18 : 0;

    ctx.beginPath();
    ctx.moveTo(150, centerY);
    ctx.lineTo(bulbX - 45, centerY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(W - 150, centerY);
    ctx.lineTo(bulbX + 45, centerY);
    ctx.stroke();

    this.renderLightbulb(ctx, bulbX, centerY, isBothOn || this.r2JustCompletedTimer > 0);

    ctx.textAlign = "center";
    if (isBothOn || this.r2JustCompletedTimer > 0) {
      if (ctx.drawImage && this.sprites.circuitComplete && this.sprites.circuitComplete.complete && this.sprites.circuitComplete.naturalWidth > 0) {
        const cw = 200;
        const ch = 116;
        ctx.drawImage(this.sprites.circuitComplete, bulbX - cw / 2, centerY + 45, cw, ch);
      } else {
        ctx.font = "900 22px 'Be Vietnam Pro', sans-serif";
        ctx.fillStyle = "#facc15";
        ctx.shadowColor = "#facc15";
        ctx.shadowBlur = 12;
        ctx.fillText("CIRCUIT COMPLETE!", bulbX, centerY + 105);
      }
    } else {
      ctx.font = "800 14px 'Be Vietnam Pro', sans-serif";
      ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
      ctx.fillText("WAIT FOR YOUR TEAMMATE...", bulbX, centerY + 105);
    }

    // Render Mecha Pilot Karts with Nametags, Crane Arms & Steering Tilt
    this.drawMechaPilotKart(ctx, 110, REACTOR_CONFIG.floorY, "cyan", {
      handsRaised: this.p1.handRaised,
      isCircuit: true,
      scale: 1.05,
      playerName: pair.p1Name,
      steerTilt: (this.p1.targetX - this.p1.x) * 0.005,
      eyeState: this.p1.eyeState
    });

    this.drawMechaPilotKart(ctx, W - 110, REACTOR_CONFIG.floorY, "pink", {
      handsRaised: this.p2.handRaised,
      isCircuit: true,
      scale: 1.05,
      playerName: pair.p2Name,
      steerTilt: (this.p2.targetX - this.p2.x) * 0.005,
      eyeState: this.p2.eyeState
    });

    this.renderBottomTicker(ctx, W, H, "SCIENCE: 2 CÔNG TẮC NỐI TIẾP PHẢI CÙNG ĐÓNG", "Mạch kín = Đèn sáng (+120 pts)");

    ctx.restore();
  }

  renderSwitchBox(ctx, x, y, label, isOn, themeColor) {
    ctx.save();
    ctx.translate(x, y);

    ctx.fillStyle = "#0c152e";
    ctx.strokeStyle = isOn ? themeColor : "rgba(56, 189, 248, 0.4)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-45, -50, 90, 100, 10);
    ctx.fill();
    ctx.stroke();

    ctx.font = "800 10.5px 'Be Vietnam Pro', sans-serif";
    ctx.fillStyle = themeColor;
    ctx.textAlign = "center";
    ctx.fillText(label, 0, -32);

    ctx.fillStyle = isOn ? "#22c55e" : "#ef4444";
    ctx.beginPath();
    ctx.roundRect(-28, -15, 56, 30, 6);
    ctx.fill();

    ctx.font = "900 14px 'JetBrains Mono', monospace";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(isOn ? "ON" : "OFF", 0, 5);

    ctx.restore();
  }

  renderLightbulb(ctx, x, y, isLit) {
    ctx.save();
    ctx.translate(x, y);

    if (isLit) {
      const glow = ctx.createRadialGradient(0, 0, 15, 0, 0, 95);
      glow.addColorStop(0, "rgba(250, 204, 21, 0.85)");
      glow.addColorStop(0.5, "rgba(250, 204, 21, 0.25)");
      glow.addColorStop(1, "rgba(250, 204, 21, 0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(0, 0, 95, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = isLit ? "#fef08a" : "rgba(15, 23, 42, 0.75)";
    ctx.strokeStyle = isLit ? "#facc15" : "rgba(255, 255, 255, 0.45)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, -10, 42, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = isLit ? "#ffffff" : "rgba(255, 255, 255, 0.25)";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-15, 10);
    ctx.lineTo(-8, -18);
    ctx.lineTo(0, -8);
    ctx.lineTo(8, -18);
    ctx.lineTo(15, 10);
    ctx.stroke();

    ctx.fillStyle = "#475569";
    ctx.fillRect(-18, 28, 36, 16);

    ctx.restore();
  }

  // --- RENDER ROUND 3: COOL THE CORE ---
  renderRound3(ctx, W, H) {
    ctx.save();
    const pair = this.getActivePair();

    ctx.font = "800 15px 'Be Vietnam Pro', sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    ctx.textAlign = "left";
    ctx.fillText("HẠ NHIỆT LÒ PHẢN ỨNG • CRYO BLAST", 32, 72);

    ctx.font = "600 12px 'Be Vietnam Pro', sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
    ctx.fillText("Vẫy tay liên tục để xả khí lạnh dập lửa nguy hiểm", 32, 92);

    this.renderMiniCameraPIP(ctx, W - 145, 60, 120, 68);

    const coreX = W / 2;
    const coreY = 320;

    this.renderReactorCore(ctx, coreX, coreY, this.coreTemp, this.coreAngle);

    for (const p of this.coolingParticles) {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }

    const p1Waving = (this.p1.waveVelocity >= REACTOR_CONFIG.minWaveVelocity) || this.p1.handRaised;
    const p2Waving = (this.p2.waveVelocity >= REACTOR_CONFIG.minWaveVelocity) || this.p2.handRaised;

    // P1 Robot (Left) with Nametag & Cryo Cannons
    this.drawMechaPilotKart(ctx, 120, REACTOR_CONFIG.floorY, "cyan", {
      isWaving: p1Waving,
      isCooling: true,
      scale: 1.15,
      playerName: pair.p1Name,
      steerTilt: (this.p1.targetX - this.p1.x) * 0.005,
      eyeState: p1Waving ? "happy" : "focus"
    });

    // P2 Robot (Right) with Nametag & Cryo Cannons
    this.drawMechaPilotKart(ctx, W - 120, REACTOR_CONFIG.floorY, "pink", {
      isWaving: p2Waving,
      isCooling: true,
      scale: 1.15,
      playerName: pair.p2Name,
      steerTilt: (this.p2.targetX - this.p2.x) * 0.005,
      eyeState: p2Waving ? "happy" : "focus"
    });

    ctx.font = "900 24px 'JetBrains Mono', monospace";
    ctx.fillStyle = "#00f5ff";
    ctx.fillText("> >", 205, 330);

    ctx.fillStyle = "#ff2a8d";
    ctx.fillText("< <", W - 225, 330);

    if (this.finalBoostActive) {
      if (ctx.drawImage && this.sprites.finalBoost && this.sprites.finalBoost.complete && this.sprites.finalBoost.naturalWidth > 0) {
        const bw = Math.min(W - 40, 480);
        const bh = (bw / 670) * 95;
        ctx.drawImage(this.sprites.finalBoost, W / 2 - bw / 2, 170, bw, bh);
      } else {
        ctx.font = "900 18px 'JetBrains Mono', monospace";
        ctx.fillStyle = "#facc15";
        ctx.textAlign = "center";
        ctx.fillText("⚡ FINAL BOOST!", coreX, 195);
      }
    }

    // Temperature Bar
    const barW = 280;
    const barX = coreX - barW / 2;
    const barY = 460;
    ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
    ctx.strokeStyle = "rgba(56, 189, 248, 0.35)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(barX, barY, barW, 14, 7);
    ctx.fill();
    ctx.stroke();

    const normTemp = (this.coreTemp - REACTOR_CONFIG.safeTemp) / (REACTOR_CONFIG.startTemp - REACTOR_CONFIG.safeTemp);
    const fillW = Math.max(0, barW * normTemp);
    const tempGrad = ctx.createLinearGradient(barX, barY, barX + barW, barY);
    tempGrad.addColorStop(0, "#22c55e");
    tempGrad.addColorStop(0.5, "#facc15");
    tempGrad.addColorStop(1, "#ef4444");
    ctx.fillStyle = tempGrad;
    ctx.beginPath();
    ctx.roundRect(barX, barY, fillW, 14, 7);
    ctx.fill();

    ctx.font = "800 11px 'JetBrains Mono', monospace";
    ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
    ctx.textAlign = "left";
    ctx.fillText("TEMP.", barX, barY + 28);

    this.renderBottomTicker(ctx, W, H, "SCIENCE: CẢM BIẾN ĐO NHIỆT VÀ HỆ THỐNG PHẢN HỒI", "Sensor + Feedback (Vẫy tay giải nhiệt)");

    ctx.restore();
  }

  renderReactorCore(ctx, x, y, temp, angle) {
    ctx.save();
    ctx.translate(x, y);

    const isHot = temp > 50;
    const coreColor = isHot ? "#ef4444" : "#22c55e";

    ctx.strokeStyle = "rgba(56, 189, 248, 0.35)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, 95, 0, Math.PI * 2);
    ctx.stroke();

    for (let i = 0; i < 8; i++) {
      const a = angle + (i * Math.PI) / 4;
      const px = Math.cos(a) * 95;
      const py = Math.sin(a) * 95;
      ctx.fillStyle = i % 2 === 0 ? "#facc15" : "#38bdf8";
      ctx.beginPath();
      ctx.arc(px, py, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.strokeStyle = coreColor;
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(0, 0, 72, 0, Math.PI * 2);
    ctx.stroke();

    const coreGlow = ctx.createRadialGradient(0, 0, 10, 0, 0, 60);
    coreGlow.addColorStop(0, "rgba(255, 255, 255, 0.95)");
    coreGlow.addColorStop(0.4, coreColor);
    coreGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = coreGlow;
    ctx.beginPath();
    ctx.arc(0, 0, 60, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = "800 12px 'JetBrains Mono', monospace";
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.fillText("REACTOR", 0, -10);

    ctx.font = "900 28px 'JetBrains Mono', monospace";
    ctx.fillStyle = coreColor;
    ctx.shadowColor = coreColor;
    ctx.shadowBlur = 12;
    ctx.fillText(`${Math.round(temp)}°C`, 0, 22);

    ctx.restore();
  }

  // --- RENDER STAGE: MISSION COMPLETE (Full Team Honor on 3-Tier Arena Podium) ---
  renderMissionComplete(ctx, W, H) {
    ctx.save();

    for (const c of this.confetti) {
      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.rotate(c.rotation);
      ctx.fillStyle = c.color;
      ctx.fillRect(-c.size / 2, -c.size / 2, c.size, c.size * 0.6);
      ctx.restore();
    }

    ctx.textAlign = "center";

    // 1. Sleek Jumbotron Score Banner (Y = 125 to 195, perfectly framed under stadium header)
    const scoreBoxW = 420;
    const scoreBoxH = 68;
    const scoreBoxX = W / 2 - scoreBoxW / 2;
    const scoreBoxY = 122;

    ctx.fillStyle = "rgba(7, 13, 28, 0.88)";
    ctx.strokeStyle = "rgba(0, 245, 255, 0.45)";
    ctx.lineWidth = 1.5;
    ctx.shadowColor = "rgba(0, 245, 255, 0.35)";
    ctx.shadowBlur = 12;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(scoreBoxX, scoreBoxY, scoreBoxW, scoreBoxH, 12);
    else ctx.rect(scoreBoxX, scoreBoxY, scoreBoxW, scoreBoxH);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.font = "800 11px 'JetBrains Mono', monospace";
    ctx.fillStyle = "#38bdf8";
    ctx.fillText(`TEAM: ${this.teamName.toUpperCase()} • CHIẾN DỊCH HOÀN THÀNH`, W / 2, scoreBoxY + 22);

    ctx.font = "900 34px 'JetBrains Mono', monospace";
    ctx.fillStyle = "#facc15";
    ctx.shadowColor = "#facc15";
    ctx.shadowBlur = 10;
    ctx.fillText(`${Math.round(this.displayScore).toLocaleString()} ĐIỂM`, W / 2, scoreBoxY + 56);
    ctx.shadowBlur = 0;

    // 2. Full Team Members Roster Honor Bar (Y = 202 to 244)
    const memCount = this.teamMembers.length;
    const rosterW = 540;
    const itemW = Math.min(125, (rosterW - 20) / Math.max(1, memCount));
    const startMemX = W / 2 - (memCount * itemW) / 2;

    this.teamMembers.forEach((name, idx) => {
      const ix = startMemX + idx * itemW + itemW / 2;
      const iy = 204;
      ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
      ctx.strokeStyle = idx % 2 === 0 ? "rgba(0, 245, 255, 0.5)" : "rgba(255, 42, 141, 0.5)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(ix - itemW / 2 + 4, iy, itemW - 8, 36, 8);
      else ctx.rect(ix - itemW / 2 + 4, iy, itemW - 8, 36);
      ctx.fill();
      ctx.stroke();

      ctx.font = "800 9.5px 'JetBrains Mono', monospace";
      ctx.fillStyle = idx % 2 === 0 ? "#00f5ff" : "#ff2a8d";
      ctx.fillText(idx === 0 ? "P1" : idx === 1 ? "P2" : "ĐỒNG ĐỘI", ix, iy + 14);

      ctx.font = "900 11px 'Be Vietnam Pro', sans-serif";
      ctx.fillStyle = "#ffffff";
      ctx.fillText(name, ix, iy + 28);
    });

    // 3. Central Animated Golden Trophy on 1st Tier Pedestal (Base at Y = 455)
    const trophyW = 120;
    const trophyH = 120;
    const trophyBaseY = 452;

    // Contact shadow on pedestal 1 top surface
    ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
    ctx.beginPath();
    if (ctx.ellipse) ctx.ellipse(W / 2, trophyBaseY, 38, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    if (this.animators && this.animators.champTrophy && this.animators.champTrophy.isReady()) {
      this.animators.champTrophy.draw(ctx, W / 2 - trophyW / 2, trophyBaseY - trophyH, trophyW, trophyH, {
        glowColor: "#facc15",
        glowBlur: 14
      });
    } else if (ctx.drawImage && this.sprites.champTrophy && this.sprites.champTrophy.complete && this.sprites.champTrophy.naturalWidth > 0) {
      ctx.drawImage(this.sprites.champTrophy, W / 2 - trophyW / 2, trophyBaseY - trophyH, trophyW, trophyH);
    } else if (this.animators && this.animators.champTrophy) {
      this.animators.champTrophy.draw(ctx, W / 2 - trophyW / 2, trophyBaseY - trophyH, trophyW, trophyH, {
        glowColor: "#facc15",
        glowBlur: 10
      });
    }

    // 4. Standing Champion Mascot Pair Grounded on Pedestal 2 (Left, Y=475) & Pedestal 3 (Right, Y=505)
    const champPair = this.getActivePair();

    // P1 (Cyan) on Pedestal 2 (X = 205, Y = 475)
    this.drawCelebrationChampionBot(ctx, 205, 475, "cyan", {
      playerName: champPair.p1Name,
      role: "P1"
    });

    // P2 (Pink) on Pedestal 3 (X = 435, Y = 505)
    this.drawCelebrationChampionBot(ctx, 435, 505, "pink", {
      playerName: champPair.p2Name,
      role: "P2"
    });

    // 5. Bottom Call-To-Action (Clean, pulsating prompt)
    const pulseAlpha = 0.65 + Math.sin(this.totalTime * 4) * 0.35;
    ctx.font = "800 12px 'JetBrains Mono', monospace";
    ctx.fillStyle = `rgba(255, 255, 255, ${pulseAlpha})`;
    ctx.fillText("BẤM SPACE HOẶC GIƠ TAY ĐỂ TIẾP TỤC", W / 2, H - 24);

    ctx.restore();
  }

  // --- CELEBRATION CHAMPION BOT (3D Grounded, Raised Fists, Gold Medal, Stage Rim Lighting) ---
  drawCelebrationChampionBot(ctx, x, y, colorTheme = "cyan", options = {}) {
    ctx.save();
    ctx.translate(x, y);

    const isCyan = colorTheme === "cyan";
    const primaryColor = isCyan ? "#00f5ff" : "#ff2a8d";
    const darkShell = isCyan ? "#0284c7" : "#be185d";
    const medalRibbon = isCyan ? "#0284c7" : "#00f5ff";
    const rimLightColor = isCyan ? "rgba(0, 245, 255, 0.45)" : "rgba(255, 214, 0, 0.45)";

    // Cheering bounce physics
    const cheerBob = Math.sin(this.totalTime * 6) * 3;
    const armWave = Math.sin(this.totalTime * 8) * 0.12;

    // 1. Realistic 3D Pedestal Contact Shadow (Conforms to metallic pedestal surface)
    ctx.save();
    ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
    ctx.beginPath();
    if (ctx.ellipse) ctx.ellipse(0, 0, 36, 11, 0, 0, Math.PI * 2);
    else ctx.arc(0, 0, 24, 0, Math.PI * 2);
    ctx.fill();

    // Dark tight feet occlusion
    ctx.fillStyle = "rgba(0, 0, 0, 0.88)";
    ctx.beginPath();
    if (ctx.ellipse) {
      ctx.ellipse(-16, 0, 13, 5, 0, 0, Math.PI * 2);
      ctx.ellipse(16, 0, 13, 5, 0, 0, Math.PI * 2);
    }
    ctx.fill();
    ctx.restore();

    // 2. Player Nametag (Floating cleanly above head, NO overlap)
    if (options.playerName) {
      ctx.save();
      ctx.font = "900 12px 'Be Vietnam Pro', sans-serif";
      ctx.textAlign = "center";
      const nameText = options.role ? `${options.role}: ${options.playerName}` : options.playerName;
      const tagW = ctx.measureText ? (ctx.measureText(nameText).width + 24) : 88;
      const tagY = -155 + cheerBob;
      ctx.fillStyle = "rgba(7, 13, 28, 0.92)";
      ctx.strokeStyle = primaryColor;
      ctx.lineWidth = 1.5;
      ctx.shadowColor = primaryColor;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(-tagW / 2, tagY, tagW, 22, 11);
      else ctx.rect(-tagW / 2, tagY, tagW, 22);
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#ffffff";
      ctx.fillText(nameText, 0, tagY + 15);
      ctx.restore();
    }

    // 3. Cheering Body & Limbs
    ctx.save();
    ctx.translate(0, cheerBob);

    // Legs in solid victory stance
    // Left Leg
    ctx.fillStyle = "#1e293b";
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 2;
    ctx.fillRect(-22, -42, 10, 24);
    // Left Boot (Cel-shaded armor)
    ctx.fillStyle = darkShell;
    ctx.strokeStyle = primaryColor;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(-25, -20, 15, 20, [4, 4, 6, 6]);
    else ctx.rect(-25, -20, 15, 20);
    ctx.fill(); ctx.stroke();

    // Right Leg
    ctx.fillStyle = "#1e293b";
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 2;
    ctx.fillRect(12, -42, 10, 24);
    // Right Boot
    ctx.fillStyle = darkShell;
    ctx.strokeStyle = primaryColor;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(10, -20, 15, 20, [4, 4, 6, 6]);
    else ctx.rect(10, -20, 15, 20);
    ctx.fill(); ctx.stroke();

    // Pelvis
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(-18, -48, 36, 10);

    // Torso Armor (Cel-shaded primary color with specular highlight)
    if (ctx.createLinearGradient) {
      const torsoGrad = ctx.createLinearGradient(0, -82, 0, -46);
      torsoGrad.addColorStop(0, primaryColor);
      torsoGrad.addColorStop(0.5, darkShell);
      torsoGrad.addColorStop(1, "#090d16");
      ctx.fillStyle = torsoGrad;
    } else {
      ctx.fillStyle = primaryColor;
    }
    ctx.strokeStyle = primaryColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(-20, -82, 40, 36, 8);
    else ctx.rect(-20, -82, 40, 36);
    ctx.fill(); ctx.stroke();

    // Raised Cheering Arms (Cheering Fists)
    // Left Arm (Raised Up-Left)
    ctx.save();
    ctx.translate(-20, -74);
    ctx.rotate(-0.55 + armWave);
    ctx.fillStyle = "#334155";
    ctx.strokeStyle = primaryColor;
    ctx.lineWidth = 1.5;
    ctx.fillRect(-6, -30, 12, 30);
    // Left Fist / Glove
    ctx.fillStyle = primaryColor;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(-8, -44, 16, 16, 4);
    else ctx.rect(-8, -44, 16, 16);
    ctx.fill(); ctx.stroke();
    ctx.restore();

    // Right Arm (Raised Up-Right)
    ctx.save();
    ctx.translate(20, -74);
    ctx.rotate(0.55 - armWave);
    ctx.fillStyle = "#334155";
    ctx.strokeStyle = primaryColor;
    ctx.lineWidth = 1.5;
    ctx.fillRect(-6, -30, 12, 30);
    // Right Fist / Glove
    ctx.fillStyle = primaryColor;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(-8, -44, 16, 16, 4);
    else ctx.rect(-8, -44, 16, 16);
    ctx.fill(); ctx.stroke();
    ctx.restore();

    // Golden Champion Medal & Ribbon
    ctx.strokeStyle = medalRibbon;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-16, -78);
    ctx.lineTo(0, -56);
    ctx.lineTo(16, -78);
    ctx.stroke();

    // Large Gold Medal
    ctx.save();
    ctx.fillStyle = "#facc15";
    ctx.strokeStyle = "#eab308";
    ctx.lineWidth = 2;
    ctx.shadowColor = "#facc15";
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(0, -54, 11, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.restore();

    // Head / Helmet (Rounded Pilot Helmet with 3D gradient)
    if (ctx.createLinearGradient) {
      const helmetGrad = ctx.createLinearGradient(0, -126, 0, -84);
      helmetGrad.addColorStop(0, primaryColor);
      helmetGrad.addColorStop(0.35, darkShell);
      helmetGrad.addColorStop(1, "#070b19");
      ctx.fillStyle = helmetGrad;
    } else {
      ctx.fillStyle = darkShell;
    }
    ctx.strokeStyle = primaryColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(-24, -126, 48, 42, 10);
    else ctx.rect(-24, -126, 48, 42);
    ctx.fill(); ctx.stroke();

    // Antennae with Golden Balls
    ctx.strokeStyle = primaryColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-12, -126); ctx.lineTo(-18, -142);
    ctx.moveTo(12, -126); ctx.lineTo(18, -142);
    ctx.stroke();
    ctx.fillStyle = "#facc15";
    ctx.beginPath();
    ctx.arc(-18, -142, 3.5, 0, Math.PI * 2);
    ctx.arc(18, -142, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Visor (Dark Obsidian Glass)
    ctx.fillStyle = "#050914";
    ctx.strokeStyle = primaryColor;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(-18, -118, 36, 26, 6);
    else ctx.rect(-18, -118, 36, 26);
    ctx.fill(); ctx.stroke();

    // Glowing Happy Visor Face (^ ^)
    ctx.font = "900 13px 'Be Vietnam Pro', sans-serif";
    ctx.fillStyle = primaryColor;
    ctx.shadowColor = primaryColor;
    ctx.shadowBlur = 8;
    ctx.textAlign = "center";
    ctx.fillText("^   ^", 0, -103);
    ctx.shadowBlur = 0;

    // Stage Spotlight Rim Light Effect (Gives 3D depth matching the stadium lights!)
    ctx.save();
    ctx.strokeStyle = rimLightColor;
    ctx.lineWidth = 3;
    ctx.beginPath();
    if (isCyan) {
      ctx.arc(-22, -105, 12, Math.PI * 0.7, Math.PI * 1.3);
      ctx.moveTo(-25, -20); ctx.lineTo(-25, 0);
    } else {
      ctx.arc(22, -105, 12, -Math.PI * 0.3, Math.PI * 0.3);
      ctx.moveTo(25, -20); ctx.lineTo(25, 0);
    }
    ctx.stroke();
    ctx.restore();

    ctx.restore(); // end cheerBob
    ctx.restore(); // end base
  }

  // --- ALIAS FOR COMPATIBILITY ---
  drawCyberBuggy(ctx, x, y, colorTheme = "cyan", options = {}) {
    this.drawMechaPilotKart(ctx, x, y, colorTheme, options);
  }

  // --- TOP-TIER CEL-SHADED MECHA PILOT KART RENDERER ---
  drawMechaPilotKart(ctx, x, y, colorTheme = "cyan", options = {}) {
    ctx.save();
    ctx.translate(x, y);

    const scale = options.scale || 1.0;
    ctx.scale(scale, scale);

    const isCyan = colorTheme === "cyan";
    const primaryColor = isCyan ? "#00f5ff" : "#ff2a8d";
    const darkShell = isCyan ? "#0284c7" : "#be185d";
    const darkMetal = "#090d16";
    const lightGlow = isCyan ? "#a5f3fc" : "#fbcfe8";

    // 1. Suspension & Idle Bounce Physics
    const idleBob = Math.sin(this.totalTime * 8) * 2.2;
    const steerTilt = Math.max(-0.22, Math.min(0.22, options.steerTilt || 0));

    // 2. Nametag for Big TV / Lab Room readability (Safe height above kart roof)
    if (options.playerName) {
      ctx.save();
      ctx.font = "900 12px 'Be Vietnam Pro', sans-serif";
      ctx.textAlign = "center";
      const tagW = ctx.measureText ? (ctx.measureText(options.playerName).width + 20) : 76;
      ctx.fillStyle = "rgba(7, 13, 28, 0.92)";
      ctx.strokeStyle = primaryColor;
      ctx.lineWidth = 1.5;
      ctx.shadowColor = primaryColor;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(-tagW / 2, -162 + idleBob, tagW, 20, 6);
      else ctx.rect(-tagW / 2, -162 + idleBob, tagW, 20);
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.fillStyle = primaryColor;
      ctx.fillText(options.playerName, 0, -148 + idleBob);
      ctx.restore();
    }

    // 3. Ground Shadow & Ambient Occlusion Contact
    ctx.save();
    // Soft wide floor ambient occlusion
    ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
    ctx.beginPath();
    if (ctx.ellipse) ctx.ellipse(0, 4, 46, 12, 0, 0, Math.PI * 2);
    else ctx.arc(0, 4, 24, 0, Math.PI * 2);
    ctx.fill();

    // Dark tight wheel contact occlusion
    ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
    ctx.beginPath();
    if (ctx.ellipse) ctx.ellipse(0, 3, 34, 6, 0, 0, Math.PI * 2);
    else ctx.arc(0, 3, 16, 0, Math.PI * 2);
    ctx.fill();

    // Subtle team underglow on floor directly under chassis
    if (ctx.createRadialGradient) {
      const underglow = ctx.createRadialGradient(0, 2, 4, 0, 2, 38);
      underglow.addColorStop(0, isCyan ? "rgba(0, 245, 255, 0.22)" : "rgba(255, 42, 141, 0.22)");
      underglow.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = underglow;
      ctx.beginPath();
      if (ctx.ellipse) ctx.ellipse(0, 2, 40, 10, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // 4. Rear Rocket Thrusters (Spitting animated plasma flames)
    ctx.save();
    const thrusterBob = idleBob * 0.5;
    const flameFlicker = (Math.sin(this.totalTime * 28) + 1) * 3;
    const flameLen = 14 + flameFlicker;

    // Left Thruster Flame
    ctx.fillStyle = primaryColor;
    ctx.shadowColor = primaryColor;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(-18, 12 + thrusterBob);
    ctx.lineTo(-24, 22 + flameLen + thrusterBob);
    ctx.lineTo(-12, 12 + thrusterBob);
    ctx.closePath();
    ctx.fill();

    // Left Core white flame
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.moveTo(-17, 12 + thrusterBob);
    ctx.lineTo(-20, 18 + flameLen * 0.5 + thrusterBob);
    ctx.lineTo(-13, 12 + thrusterBob);
    ctx.closePath();
    ctx.fill();

    // Right Thruster Flame
    ctx.fillStyle = primaryColor;
    ctx.shadowColor = primaryColor;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(12, 12 + thrusterBob);
    ctx.lineTo(24, 22 + flameLen + thrusterBob);
    ctx.lineTo(18, 12 + thrusterBob);
    ctx.closePath();
    ctx.fill();

    // Right Core white flame
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.moveTo(13, 12 + thrusterBob);
    ctx.lineTo(20, 18 + flameLen * 0.5 + thrusterBob);
    ctx.lineTo(17, 12 + thrusterBob);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Tilt entire kart body into turns
    ctx.save();
    ctx.rotate(steerTilt);
    ctx.translate(0, idleBob);

    // Determine Stage-Appropriate Authentic Sprite & Spritesheet Animator
    let sprite = null;
    let animator = null;
    let targetW = 150;
    let targetH = 150;
    let anchorYRatio = 0.92;

    if (options.isCooling || options.isWaving || this.stage === REACTOR_STAGES.ROUND_3_COOLING) {
      animator = this.animators ? (isCyan ? this.animators.cryoCyan : this.animators.cryoPink) : null;
      sprite = isCyan ? this.sprites.cryoCyan : this.sprites.cryoPink;
      targetW = 150;
      targetH = 150;
      anchorYRatio = 0.92;
    } else if (options.isCircuit || options.handsRaised || this.stage === REACTOR_STAGES.ROUND_2_CIRCUIT) {
      animator = this.animators ? (isCyan ? this.animators.circuitCyan : this.animators.circuitPink) : null;
      sprite = isCyan ? this.sprites.circuitCyan : this.sprites.circuitPink;
      targetW = 150;
      targetH = 150;
      anchorYRatio = 0.92;
    } else {
      animator = this.animators ? (isCyan ? this.animators.kartCyan : this.animators.kartPink) : null;
      sprite = isCyan ? this.sprites.kartCyan : this.sprites.kartPink;
      targetW = 150;
      targetH = 150;
      anchorYRatio = 0.92;
    }

    const drawX = -targetW / 2;
    const drawY = -targetH * anchorYRatio;

    // Caught energy combo scale pulse
    if (options.justCaught && ctx.scale) {
      ctx.scale(1.08, 1.08);
    }

    if (animator && animator.isReady()) {
      animator.draw(ctx, drawX, drawY, targetW, targetH, {
        glowColor: options.justCaught ? primaryColor : null,
        glowBlur: options.justCaught ? 16 : 0
      });
    } else if (ctx.drawImage && sprite && sprite.complete && sprite.naturalWidth > 0) {
      ctx.drawImage(sprite, drawX, drawY, targetW, targetH);
    } else if (animator) {
      animator.draw(ctx, drawX, drawY, targetW, targetH, {
        glowColor: null,
        glowBlur: 0
      });
    } else {
      // 5. Heavy Off-Road Cyber Wheels (Left & Right)
      this.drawCyberWheel(ctx, -30, 8, primaryColor, this.totalTime);
      this.drawCyberWheel(ctx, 30, 8, primaryColor, this.totalTime);

      // 6. Kart Chassis Lower Body (Cel-shaded dark armor with neon side skirts)
      ctx.save();
      ctx.fillStyle = darkMetal;
      ctx.strokeStyle = "#1e293b";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(-28, 2, 56, 18, [4, 4, 8, 8]);
      else ctx.rect(-28, 2, 56, 18);
      ctx.fill();
      ctx.stroke();

      // Neon Side Skirts & Aerodynamic Fins
      ctx.fillStyle = primaryColor;
      ctx.shadowColor = primaryColor;
      ctx.shadowBlur = 8;
      ctx.fillRect(-29, 6, 4, 12);
      ctx.fillRect(25, 6, 4, 12);
      ctx.shadowBlur = 0;

      // Front Bumper with Team Racing Stripe & Headlights
      if (ctx.createLinearGradient) {
        const bumperGrad = ctx.createLinearGradient(0, 12, 0, 24);
        bumperGrad.addColorStop(0, darkShell);
        bumperGrad.addColorStop(1, "#0a0f1d");
        ctx.fillStyle = bumperGrad;
      } else {
        ctx.fillStyle = darkShell;
      }
      ctx.strokeStyle = primaryColor;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(-24, 12, 48, 11, 4);
      else ctx.rect(-24, 12, 48, 11);
      ctx.fill();
      ctx.stroke();

      // Dual Projector LED Headlights
      ctx.fillStyle = "#ffffff";
      ctx.shadowColor = primaryColor;
      ctx.shadowBlur = 12;
      ctx.fillRect(-20, 15, 7, 4);
      ctx.fillRect(13, 15, 7, 4);
      ctx.shadowBlur = 0;

      // Headlight Beam Projection Cones onto Floor
      ctx.save();
      ctx.fillStyle = isCyan ? "rgba(0, 245, 255, 0.16)" : "rgba(255, 42, 141, 0.16)";
      ctx.beginPath();
      ctx.moveTo(-20, 19);
      ctx.lineTo(-34, 44);
      ctx.lineTo(-6, 44);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(13, 19);
      ctx.lineTo(6, 44);
      ctx.lineTo(34, 44);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // Racing Number Badge (01 for P1, 02 for P2)
      ctx.font = "900 8.5px 'JetBrains Mono', monospace";
      ctx.fillStyle = primaryColor;
      ctx.textAlign = "center";
      ctx.fillText(isCyan ? "01" : "02", 0, 21);
      ctx.restore();

      // 7. Cockpit Shell & Rollcage
      ctx.save();
      ctx.fillStyle = "#0c1527";
      ctx.strokeStyle = primaryColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(-20, -18, 40, 24, 6);
      else ctx.rect(-20, -18, 40, 24);
      ctx.fill();
      ctx.stroke();

      // Glowing Dashboard Dials inside Cockpit
      ctx.fillStyle = "#22c55e";
      ctx.fillRect(-12, -4, 4, 2);
      ctx.fillStyle = "#facc15";
      ctx.fillRect(-6, -4, 4, 2);
      ctx.fillStyle = primaryColor;
      ctx.fillRect(0, -4, 12, 2);
      ctx.restore();

      // 8. Chibi Mecha Pilot
      this.drawChibiMechaPilot(ctx, 0, -18, primaryColor, darkShell, lightGlow, options);

      // 9. Round-Specific High-Tech Dynamic Equipment
      if (options.isCatching) {
        // Round 1: Magneto-Electric Energy Catch Net / Funnel
        this.drawEnergyCatchNet(ctx, 0, -32, primaryColor, options);
      } else if (options.isCircuit || options.handsRaised) {
        // Round 2: Telescopic Crane Arm reaching high
        this.drawCircuitCraneArm(ctx, 0, -28, primaryColor, options.handsRaised);
      } else if (options.isWaving || options.isCooling) {
        // Round 3: Twin Cryo Blaster Cannons
        this.drawCryoCannons(ctx, primaryColor, options.isWaving);
      }
    }

    // 10. Winner Trophy Star Aura
    if (options.isWinner) {
      ctx.save();
      const auraPulse = (Math.sin(this.totalTime * 8) + 1) * 3;
      ctx.fillStyle = "#facc15";
      ctx.shadowColor = "#facc15";
      ctx.shadowBlur = 12;
      ctx.font = "900 16px 'JetBrains Mono', monospace";
      ctx.textAlign = "center";
      ctx.fillText("★ 1ST ★", 0, -60 - auraPulse);
      ctx.restore();
    }

    // 11. Stunned Stars when hazard hit
    if (options.stunned || options.eyeState === "dizzy") {
      this.drawStunStars(ctx, 0, -56);
    }

    ctx.restore(); // end steerTilt & idleBob
    ctx.restore(); // end base transform
  }

  drawCyberWheel(ctx, x, y, rimColor, time) {
    ctx.save();
    ctx.translate(x, y);

    // Heavy tire rubber
    ctx.fillStyle = "#0f172a";
    ctx.strokeStyle = "#334155";
    ctx.lineWidth = 2;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(-7, -13, 14, 26, 4);
    else ctx.rect(-7, -13, 14, 26);
    ctx.fill();
    ctx.stroke();

    // Tire tread grip notches
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(-7, -10, 3, 4);
    ctx.fillRect(-7, 0, 3, 4);
    ctx.fillRect(-7, 7, 3, 4);
    ctx.fillRect(4, -10, 3, 4);
    ctx.fillRect(4, 0, 3, 4);
    ctx.fillRect(4, 7, 3, 4);

    // Glowing Neon Rim Core
    ctx.strokeStyle = rimColor;
    ctx.lineWidth = 1.5;
    ctx.shadowColor = rimColor;
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(0, 0, 5.5, 0, Math.PI * 2);
    ctx.stroke();

    // Rotating Spokes
    const rot = (time * 10) % (Math.PI * 2);
    ctx.beginPath();
    ctx.moveTo(-Math.cos(rot) * 5, -Math.sin(rot) * 5);
    ctx.lineTo(Math.cos(rot) * 5, Math.sin(rot) * 5);
    ctx.moveTo(-Math.sin(rot) * 5, Math.cos(rot) * 5);
    ctx.lineTo(Math.sin(rot) * 5, -Math.cos(rot) * 5);
    ctx.stroke();

    // Center Chrome Hub
    ctx.fillStyle = "#ffffff";
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(0, 0, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  drawChibiMechaPilot(ctx, x, y, primaryColor, darkShell, lightGlow, options) {
    ctx.save();
    ctx.translate(x, y);

    // Antennae with inertia bob
    const antBob = Math.sin(this.totalTime * 8) * 3;
    ctx.strokeStyle = primaryColor;
    ctx.lineWidth = 2.5;

    // Left Antenna
    ctx.beginPath();
    ctx.moveTo(-9, -14);
    ctx.quadraticCurveTo(-18, -28 + antBob, -16, -34 + antBob);
    ctx.stroke();

    ctx.fillStyle = "#facc15";
    ctx.shadowColor = "#facc15";
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(-16, -34 + antBob, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Right Antenna
    ctx.beginPath();
    ctx.moveTo(9, -14);
    ctx.quadraticCurveTo(18, -28 - antBob, 16, -34 - antBob);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(16, -34 - antBob, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Rounded Cyber Pilot Helmet
    if (ctx.createLinearGradient) {
      const helmetGrad = ctx.createLinearGradient(0, -22, 0, 4);
      helmetGrad.addColorStop(0, primaryColor);
      helmetGrad.addColorStop(0.4, darkShell);
      helmetGrad.addColorStop(1, "#070b19");
      ctx.fillStyle = helmetGrad;
    } else {
      ctx.fillStyle = primaryColor;
    }
    ctx.strokeStyle = primaryColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(-18, -22, 36, 26, 12);
    else ctx.rect(-18, -22, 36, 26);
    ctx.fill();
    ctx.stroke();

    // Glossy Dark Visor
    ctx.fillStyle = "#030712";
    ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(-14, -16, 28, 16, 6);
    else ctx.rect(-14, -16, 28, 16);
    ctx.fill();
    ctx.stroke();

    // Specular Light Sheen on Visor
    ctx.fillStyle = "rgba(255, 255, 255, 0.28)";
    ctx.beginPath();
    ctx.moveTo(-11, -14);
    ctx.lineTo(-4, -14);
    ctx.lineTo(-9, -7);
    ctx.closePath();
    ctx.fill();

    // Animated LED Matrix Eyes
    ctx.fillStyle = lightGlow;
    ctx.strokeStyle = lightGlow;
    ctx.shadowColor = primaryColor;
    ctx.shadowBlur = 8;

    // Periodic Natural Blink (closes for 0.15s every 3.5s)
    const blinkCycle = (this.totalTime % 3.5);
    const isBlinking = blinkCycle > 3.35;

    const eyeState = options.eyeState || "focus";

    if (isBlinking) {
      // Slit line eyes
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-10, -9); ctx.lineTo(-4, -9);
      ctx.moveTo(4, -9); ctx.lineTo(10, -9);
      ctx.stroke();
    } else if (options.stunned || eyeState === "dizzy") {
      // Dizzy Cross Eyes (X X)
      ctx.lineWidth = 2;
      // Left X
      ctx.beginPath();
      ctx.moveTo(-9, -11); ctx.lineTo(-5, -7);
      ctx.moveTo(-5, -11); ctx.lineTo(-9, -7);
      ctx.stroke();
      // Right X
      ctx.beginPath();
      ctx.moveTo(5, -11); ctx.lineTo(9, -7);
      ctx.moveTo(9, -11); ctx.lineTo(5, -7);
      ctx.stroke();
    } else if (options.handsRaised || options.isReady || options.isWinner || eyeState === "happy") {
      // Cheerful Arched Eyes (^ ^)
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(-7, -8, 4, Math.PI, 0);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(7, -8, 4, Math.PI, 0);
      ctx.stroke();
    } else if (options.isWaving) {
      // Sharp determined eyes (> <)
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-5, -11); ctx.lineTo(-9, -9); ctx.lineTo(-5, -7);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(5, -11); ctx.lineTo(9, -9); ctx.lineTo(5, -7);
      ctx.stroke();
    } else {
      // Default focused LED eyes with oval pupils
      ctx.beginPath();
      if (ctx.ellipse) {
        ctx.ellipse(-7, -9, 3, 4, 0, 0, Math.PI * 2);
        ctx.ellipse(7, -9, 3, 4, 0, 0, Math.PI * 2);
      } else {
        ctx.arc(-7, -9, 3.5, 0, Math.PI * 2);
        ctx.arc(7, -9, 3.5, 0, Math.PI * 2);
      }
      ctx.fill();
    }
    ctx.shadowBlur = 0;

    // Pilot Hands / Gloves grasping steering wheel
    ctx.fillStyle = primaryColor;
    ctx.beginPath();
    ctx.arc(-11, 2, 3.5, 0, Math.PI * 2);
    ctx.arc(11, 2, 3.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  drawEnergyCatchNet(ctx, x, y, primaryColor, options) {
    ctx.save();
    ctx.translate(x, y);

    // Twin mechanical support struts
    ctx.strokeStyle = primaryColor;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-16, 12);
    ctx.lineTo(-24, -8);
    ctx.moveTo(16, 12);
    ctx.lineTo(24, -8);
    ctx.stroke();

    // Parabolic Magnetic Collector Dish
    ctx.fillStyle = "rgba(7, 13, 28, 0.9)";
    ctx.strokeStyle = primaryColor;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, -10, 26, Math.PI * 0.85, Math.PI * 0.15, true);
    ctx.stroke();

    // Glowing Electromagnetic Containment Rings
    const pulse = (Math.sin(this.totalTime * 14) + 1) * 3;
    ctx.strokeStyle = options.justCaught ? "#facc15" : primaryColor;
    ctx.shadowColor = ctx.strokeStyle;
    ctx.shadowBlur = options.justCaught ? 16 : 8;
    ctx.lineWidth = 2;
    ctx.beginPath();
    if (ctx.ellipse) ctx.ellipse(0, -18, 24 + pulse, 7, 0, 0, Math.PI * 2);
    else ctx.arc(0, -18, 24, 0, Math.PI * 2);
    ctx.stroke();

    // Catch Spark Burst when item caught
    if (options.justCaught) {
      ctx.fillStyle = "#ffffff";
      for (let i = 0; i < 6; i++) {
        const ang = (i / 6) * Math.PI * 2 + this.totalTime * 8;
        const dist = 16 + pulse * 2;
        ctx.beginPath();
        ctx.arc(Math.cos(ang) * dist, -18 + Math.sin(ang) * 6, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }

  drawCircuitCraneArm(ctx, x, y, primaryColor, isRaised) {
    ctx.save();
    ctx.translate(x, y);

    const armReach = isRaised ? -58 : -32;
    const jointX = isRaised ? 6 : -4;

    // Heavy Hydraulic Arm Segment 1
    ctx.strokeStyle = "#475569";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(jointX, armReach * 0.55);
    ctx.stroke();

    // Chrome Piston Shaft
    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(jointX, armReach * 0.55);
    ctx.lineTo(0, armReach);
    ctx.stroke();

    // Arm Articulated Joint
    ctx.fillStyle = primaryColor;
    ctx.beginPath();
    ctx.arc(jointX, armReach * 0.55, 4.5, 0, Math.PI * 2);
    ctx.fill();

    // High-Voltage Copper Switch Clamp at Tip
    ctx.fillStyle = "#facc15";
    ctx.shadowColor = "#facc15";
    ctx.shadowBlur = isRaised ? 16 : 6;
    ctx.fillRect(-6, armReach - 8, 12, 8);

    // Tesla Electrical Sparks when raised
    if (isRaised) {
      ctx.strokeStyle = "#00f5ff";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-4, armReach - 8);
      ctx.lineTo(-12 + (Math.random() - 0.5) * 8, armReach - 24);
      ctx.lineTo(0, armReach - 34);
      ctx.lineTo(12 + (Math.random() - 0.5) * 8, armReach - 24);
      ctx.lineTo(4, armReach - 8);
      ctx.stroke();
    }

    ctx.restore();
  }

  drawCryoCannons(ctx, primaryColor, isWaving) {
    ctx.save();

    const recoil = isWaving ? Math.sin(this.totalTime * 24) * 4 : 0;

    // Left Cryo Blaster Cannon
    ctx.fillStyle = "#1e293b";
    ctx.strokeStyle = primaryColor;
    ctx.lineWidth = 2;
    ctx.fillRect(-34, -14 + recoil, 8, 22);
    ctx.strokeRect(-34, -14 + recoil, 8, 22);

    // Left Coolant Coil
    ctx.fillStyle = "#67e8f9";
    ctx.fillRect(-33, -10 + recoil, 6, 4);
    ctx.fillRect(-33, -2 + recoil, 6, 4);

    // Right Cryo Blaster Cannon
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(26, -14 - recoil, 8, 22);
    ctx.strokeRect(26, -14 - recoil, 8, 22);

    // Right Coolant Coil
    ctx.fillStyle = "#67e8f9";
    ctx.fillRect(27, -10 - recoil, 6, 4);
    ctx.fillRect(27, -2 - recoil, 6, 4);

    // Muzzle Frost Vapor rings when waving
    if (isWaving) {
      ctx.strokeStyle = "#a5f3fc";
      ctx.shadowColor = "#00f5ff";
      ctx.shadowBlur = 10;
      ctx.lineWidth = 1.5;
      const puff = (Math.sin(this.totalTime * 18) + 1) * 3;

      ctx.beginPath();
      if (ctx.ellipse) {
        ctx.ellipse(-30, -20 - puff, 6 + puff, 2.5, 0, 0, Math.PI * 2);
        ctx.ellipse(30, -20 - puff, 6 + puff, 2.5, 0, 0, Math.PI * 2);
      } else {
        ctx.arc(-30, -20 - puff, 6, 0, Math.PI * 2);
        ctx.arc(30, -20 - puff, 6, 0, Math.PI * 2);
      }
      ctx.stroke();
    }

    ctx.restore();
  }

  drawStunStars(ctx, x, y) {
    ctx.save();
    ctx.translate(x, y);
    const starCount = 3;
    const angleStep = (Math.PI * 2) / starCount;
    for (let i = 0; i < starCount; i++) {
      const ang = i * angleStep + this.totalTime * 6;
      const sx = Math.cos(ang) * 16;
      const sy = Math.sin(ang) * 6;
      ctx.fillStyle = "#facc15";
      ctx.shadowColor = "#facc15";
      ctx.shadowBlur = 8;
      ctx.font = "900 12px sans-serif";
      ctx.fillText("★", sx, sy);
    }
    ctx.restore();
  }

  renderTransition(ctx, W, H) {
    const tr = this.transition;
    const p = Math.min(1.0, tr.timer / tr.duration);
    ctx.save();

    if (tr.type === "blast_doors") {
      let doorOffset = 0;
      if (p < 0.42) {
        const ease = 1 - Math.pow(1 - (p / 0.42), 3);
        doorOffset = (1 - ease) * (W / 2);
      } else if (p > 0.68) {
        const openEase = Math.pow((p - 0.68) / 0.32, 2.5);
        doorOffset = openEase * (W / 2);
      } else {
        doorOffset = 0;
        if (!tr.soundPlayed) {
          sound.playLock();
          this.screenShake = 16;
          tr.soundPlayed = true;
        }
      }

      // Left Blast Door
      const leftW = W / 2 - doorOffset;
      if (leftW > 0) {
        if (ctx.createLinearGradient) {
          const gradL = ctx.createLinearGradient(0, 0, leftW, 0);
          gradL.addColorStop(0, "#080d1a");
          gradL.addColorStop(0.75, "#131e38");
          gradL.addColorStop(1, "#1e293b");
          ctx.fillStyle = gradL;
        } else {
          ctx.fillStyle = "#131e38";
        }
        ctx.fillRect(0, 0, leftW, H);

        // Industrial hazard caution bar along the left door edge
        const hazardW = 24;
        const hx = leftW - hazardW;
        ctx.save();
        ctx.beginPath();
        ctx.rect(hx, 0, hazardW, H);
        if (ctx.clip) ctx.clip();
        ctx.fillStyle = "#facc15";
        ctx.fillRect(hx, 0, hazardW, H);
        ctx.fillStyle = "#000000";
        for (let y = -30; y < H + 30; y += 32) {
          ctx.beginPath();
          ctx.moveTo(hx, y);
          ctx.lineTo(hx + hazardW, y + hazardW);
          ctx.lineTo(hx + hazardW, y + hazardW + 16);
          ctx.lineTo(hx, y + 16);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();

        // High-tech panel lines
        ctx.strokeStyle = "rgba(56, 189, 248, 0.3)";
        ctx.lineWidth = 2;
        ctx.strokeRect(20, 20, Math.max(0, leftW - 55), H - 40);
      }

      // Right Blast Door
      const rightX = W / 2 + doorOffset;
      const rightW = W - rightX;
      if (rightW > 0) {
        if (ctx.createLinearGradient) {
          const gradR = ctx.createLinearGradient(rightX, 0, W, 0);
          gradR.addColorStop(0, "#1e293b");
          gradR.addColorStop(0.25, "#131e38");
          gradR.addColorStop(1, "#080d1a");
          ctx.fillStyle = gradR;
        } else {
          ctx.fillStyle = "#131e38";
        }
        ctx.fillRect(rightX, 0, rightW, H);

        // Industrial hazard caution bar along the right door edge
        const hazardW = 24;
        ctx.save();
        ctx.beginPath();
        ctx.rect(rightX, 0, hazardW, H);
        if (ctx.clip) ctx.clip();
        ctx.fillStyle = "#facc15";
        ctx.fillRect(rightX, 0, hazardW, H);
        ctx.fillStyle = "#000000";
        for (let y = -30; y < H + 30; y += 32) {
          ctx.beginPath();
          ctx.moveTo(rightX, y + hazardW);
          ctx.lineTo(rightX + hazardW, y);
          ctx.lineTo(rightX + hazardW, y + 16);
          ctx.lineTo(rightX, y + hazardW + 16);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();

        // High-tech panel lines
        ctx.strokeStyle = "rgba(56, 189, 248, 0.3)";
        ctx.lineWidth = 2;
        ctx.strokeRect(rightX + 35, 20, Math.max(0, rightW - 55), H - 40);
      }

      // Center HUD Holographic Seal when sealed
      if (p >= 0.35 && p <= 0.75) {
        const alpha = p < 0.45 ? (p - 0.35) / 0.1 : (p > 0.65 ? (0.75 - p) / 0.1 : 1.0);
        ctx.globalAlpha = Math.max(0, Math.min(1.0, alpha));

        const cW = 440;
        const cH = 120;
        const cx = W / 2 - cW / 2;
        const cy = H / 2 - cH / 2;

        ctx.fillStyle = "rgba(7, 13, 28, 0.94)";
        ctx.strokeStyle = "#facc15";
        ctx.lineWidth = 2.5;
        ctx.shadowColor = "#facc15";
        ctx.shadowBlur = 16;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(cx, cy, cW, cH, 12);
        else ctx.rect(cx, cy, cW, cH);
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;

        ctx.textAlign = "center";
        ctx.font = "900 22px 'JetBrains Mono', monospace";
        ctx.fillStyle = "#facc15";
        ctx.fillText(tr.title || "ACCESSING CIRCUIT DECK", W / 2, cy + 46);

        ctx.font = "800 14px 'Be Vietnam Pro', sans-serif";
        ctx.fillStyle = "#ffffff";
        ctx.fillText(tr.subtitle || "PREPARING NEXT ROUND", W / 2, cy + 82);
      }
    } else if (tr.type === "cryo_freeze") {
      const alarmCycle = Math.sin(tr.timer * 18);
      const freezeAlpha = p < 0.5 ? Math.sin((p / 0.5) * (Math.PI / 2)) : Math.sin(((1 - p) / 0.5) * (Math.PI / 2));

      if (ctx.createRadialGradient) {
        const frostGrad = ctx.createRadialGradient(W / 2, H / 2, 80, W / 2, H / 2, W * 0.75);
        frostGrad.addColorStop(0, "rgba(6, 182, 212, 0)");
        frostGrad.addColorStop(0.5, `rgba(14, 165, 233, ${0.45 * freezeAlpha})`);
        frostGrad.addColorStop(1, `rgba(165, 243, 252, ${0.92 * freezeAlpha})`);
        ctx.fillStyle = frostGrad;
        ctx.fillRect(0, 0, W, H);
      }

      // Warning Klaxon Bars
      if (alarmCycle > 0) {
        ctx.fillStyle = "rgba(239, 68, 68, 0.75)";
        ctx.fillRect(0, 0, W, 28);
        ctx.fillRect(0, H - 28, W, 28);

        ctx.textAlign = "center";
        ctx.font = "900 13px 'JetBrains Mono', monospace";
        ctx.fillStyle = "#ffffff";
        ctx.fillText("WARNING: REACTOR THERMAL RUNAWAY // CRYO SYSTEM ACTIVE", W / 2, 19);
        ctx.fillText("WARNING: REACTOR THERMAL RUNAWAY // CRYO SYSTEM ACTIVE", W / 2, H - 9);
      }

      if (freezeAlpha > 0.3) {
        ctx.globalAlpha = Math.min(1.0, freezeAlpha * 1.2);
        const cW = 460;
        const cH = 110;
        const cx = W / 2 - cW / 2;
        const cy = H / 2 - cH / 2;

        ctx.fillStyle = "rgba(6, 18, 38, 0.94)";
        ctx.strokeStyle = "#00f5ff";
        ctx.lineWidth = 2.5;
        ctx.shadowColor = "#00f5ff";
        ctx.shadowBlur = 18;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(cx, cy, cW, cH, 12);
        else ctx.rect(cx, cy, cW, cH);
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;

        ctx.textAlign = "center";
        ctx.font = "900 21px 'JetBrains Mono', monospace";
        ctx.fillStyle = "#00f5ff";
        ctx.fillText(tr.title || "CORE TEMPERATURE CRITICAL", W / 2, cy + 44);

        ctx.font = "800 14px 'Be Vietnam Pro', sans-serif";
        ctx.fillStyle = "#ffffff";
        ctx.fillText(tr.subtitle || "VÒNG 03: HẠ NHIỆT LÒ NĂNG LƯỢNG", W / 2, cy + 78);
      }
    } else if (tr.type === "victory_warp") {
      const warpAlpha = p < 0.5 ? p / 0.5 : (1 - p) / 0.5;
      ctx.globalAlpha = Math.max(0, Math.min(1.0, warpAlpha));

      const beamCount = 28;
      const angleStep = (Math.PI * 2) / beamCount;
      const beamSpeed = p * 400;

      ctx.save();
      ctx.translate(W / 2, H / 2);
      for (let i = 0; i < beamCount; i++) {
        const ang = i * angleStep + this.totalTime * 2;
        const len = 120 + beamSpeed;
        const width = 3 + Math.sin(i * 1.5) * 2;
        ctx.strokeStyle = (i % 2 === 0) ? "#facc15" : "#00f5ff";
        ctx.lineWidth = width;
        ctx.beginPath();
        ctx.moveTo(Math.cos(ang) * 40, Math.sin(ang) * 40);
        ctx.lineTo(Math.cos(ang) * len, Math.sin(ang) * len);
        ctx.stroke();
      }
      ctx.restore();

      if (ctx.createRadialGradient) {
        const flashGrad = ctx.createRadialGradient(W / 2, H / 2, 20, W / 2, H / 2, 260);
        flashGrad.addColorStop(0, "rgba(255, 255, 255, 0.95)");
        flashGrad.addColorStop(0.4, "rgba(250, 204, 21, 0.65)");
        flashGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = flashGrad;
        ctx.beginPath();
        ctx.arc(W / 2, H / 2, 260, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.textAlign = "center";
      ctx.font = "900 28px 'JetBrains Mono', monospace";
      ctx.fillStyle = "#ffffff";
      ctx.shadowColor = "#facc15";
      ctx.shadowBlur = 18;
      ctx.fillText(tr.title || "MISSION ACCOMPLISHED", W / 2, H / 2 - 10);
      ctx.font = "800 16px 'Be Vietnam Pro', sans-serif";
      ctx.fillStyle = "#facc15";
      ctx.fillText(tr.subtitle || "CHÚC MỪNG CHIẾN THẮNG!", W / 2, H / 2 + 30);
      ctx.shadowBlur = 0;
    }

    ctx.restore();
  }

  renderMiniCameraPIP(ctx, x, y, w, h) {
    ctx.save();
    ctx.fillStyle = "rgba(10, 16, 36, 0.9)";
    ctx.strokeStyle = "rgba(56, 189, 248, 0.4)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 8);
    ctx.fill();
    ctx.stroke();

    ctx.font = "800 8.5px 'JetBrains Mono', monospace";
    ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
    ctx.fillText("WEBCAM LAB / 2P", x + 10, y + 16);

    ctx.strokeStyle = "#00f5ff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x + 35, y + 32, 5, 0, Math.PI * 2);
    ctx.moveTo(x + 35, y + 37);
    ctx.lineTo(x + 35, y + 54);
    ctx.moveTo(x + 24, y + 42);
    ctx.lineTo(x + 46, y + 42);
    ctx.stroke();

    ctx.strokeStyle = "#ff2a8d";
    ctx.beginPath();
    ctx.arc(x + 85, y + 32, 5, 0, Math.PI * 2);
    ctx.moveTo(x + 85, y + 37);
    ctx.lineTo(x + 85, y + 54);
    ctx.moveTo(x + 74, y + 42);
    ctx.lineTo(x + 96, y + 42);
    ctx.stroke();

    ctx.restore();
  }

  renderBottomTicker(ctx, W, H, textLeft, textRight) {
    ctx.save();
    const barY = H - 52;
    ctx.fillStyle = "rgba(8, 14, 30, 0.92)";
    ctx.strokeStyle = "rgba(56, 189, 248, 0.25)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(16, barY, W - 32, 38, 6);
    ctx.fill();
    ctx.stroke();

    ctx.font = "800 11px 'JetBrains Mono', monospace";
    ctx.fillStyle = "#38bdf8";
    ctx.textAlign = "left";
    ctx.fillText(textLeft, 32, barY + 23);

    ctx.font = "700 11px 'Be Vietnam Pro', sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
    ctx.textAlign = "right";
    ctx.fillText(textRight, W - 32, barY + 23);

    ctx.restore();
  }

  renderFloatingTexts(ctx) {
    ctx.save();
    ctx.textAlign = "center";
    ctx.font = "900 16px 'Be Vietnam Pro', sans-serif";
    for (const ft of this.floatingTexts) {
      ctx.fillStyle = ft.color;
      ctx.globalAlpha = ft.alpha;
      ctx.shadowColor = ft.color;
      ctx.shadowBlur = 8;
      ctx.fillText(ft.text, ft.x, ft.y);
    }
    ctx.restore();
  }
}
