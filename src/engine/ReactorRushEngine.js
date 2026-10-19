// FU-DEVER BUG DASH — Reactor Rush Gameplay Engine (STEM FAIR 2026)
// 2 Players per Turn • 3 Rounds • 1 Team Mission (3-4 Members per Team with Rotation)
// Lab Room Webcam & Big TV Display Optimization (High-Contrast Neon Visuals & Team Roster Rotation)

import { REACTOR_CONFIG } from "../config.js";
import { sound } from "../audio/SoundEngine.js";

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
    this.ctx = canvas.getContext("2d");
    this.W = canvas.width || 640;
    this.H = canvas.height || 720;

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
      this.addFloatingText(this.W / 2, 280, "VÒNG 2: BẮT ĐẦU!", "#facc15");
    } else if (this.stage === REACTOR_STAGES.SWAP_ROUND_3) {
      sound.playCountdownGo();
      this.stage = REACTOR_STAGES.ROUND_3_COOLING;
      this.stageTime = 0;
      this.addFloatingText(this.W / 2, 280, "VÒNG 3: BẮT ĐẦU!", "#00f5ff");
    }
  }

  update(dt) {
    this.totalTime += dt;
    this.stageTime += dt;

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
      this.addFloatingText(this.W / 2, 220, "⚡ FINAL BOOST KÍCH HOẠT! VẪY TAY CỰC ĐẠI!", "#facc15");
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
    this.W = W;
    this.H = H;

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
    ctx.save();
    ctx.fillStyle = "rgba(10, 16, 36, 0.90)";
    ctx.strokeStyle = "rgba(56, 189, 248, 0.32)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(16, 12, W - 32, 54, 8);
    ctx.fill();
    ctx.stroke();

    // Left brand text
    ctx.font = "900 13px 'Be Vietnam Pro', sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.fillText("FU-DEVER", 32, 36);

    ctx.font = "700 11px 'JetBrains Mono', monospace";
    ctx.fillStyle = "#38bdf8";
    ctx.fillText("SCIENCE ARENA", 108, 36);

    // Center Stage Indicator & Active Team
    let stageTitle = "CALIBRATION";
    let stageIndex = "00 / 03";
    if (this.stage === REACTOR_STAGES.ROUND_1_ENERGY) {
      stageTitle = "ROUND 01 — ENERGY CATCH";
      stageIndex = "01 / 03";
    } else if (this.stage === REACTOR_STAGES.SWAP_ROUND_2) {
      stageTitle = "ĐỔI CA — CHUẨN BỊ VÒNG 2";
      stageIndex = "ĐỔI CA";
    } else if (this.stage === REACTOR_STAGES.ROUND_2_CIRCUIT) {
      stageTitle = "ROUND 02 — DUO CIRCUIT";
      stageIndex = "02 / 03";
    } else if (this.stage === REACTOR_STAGES.SWAP_ROUND_3) {
      stageTitle = "ĐỔI CA — CHUẨN BỊ VÒNG 3";
      stageIndex = "ĐỔI CA";
    } else if (this.stage === REACTOR_STAGES.ROUND_3_COOLING) {
      stageTitle = "ROUND 03 — COOL THE CORE";
      stageIndex = "03 / 03";
    } else if (this.stage === REACTOR_STAGES.MISSION_COMPLETE) {
      stageTitle = "MISSION COMPLETE!";
      stageIndex = "HOÀN TẤT";
    }

    ctx.font = "800 12px 'JetBrains Mono', monospace";
    ctx.fillStyle = "#facc15";
    ctx.textAlign = "center";
    ctx.fillText(`${this.teamName} • ${stageIndex}`, W / 2, 34);

    // Right status pill
    ctx.textAlign = "right";
    ctx.font = "800 11px 'JetBrains Mono', monospace";
    ctx.fillStyle = "#4ade80";
    ctx.fillText("● STEM FAIR 2026", W - 32, 36);

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
    this.drawCyberBuggy(ctx, mascotX, mascotY, label.includes("P1") ? "cyan" : "pink", {
      handsRaised: player.handRaised,
      isReady: player.isReady,
      scale: 1.15
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

    ctx.font = "900 20px 'Be Vietnam Pro', sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "left";
    ctx.fillText("ROUND 01 — ENERGY CATCH", 32, 98);

    ctx.font = "600 13px 'Be Vietnam Pro', sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
    ctx.fillText("Dùng tay điều khiển robot • Bắt năng lượng • Tránh vật phẩm đỏ", 32, 122);

    this.renderMiniCameraPIP(ctx, W - 145, 82, 120, 68);

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
    }

    // Render Cyber Buggies on floor with Nametags
    this.drawCyberBuggy(ctx, this.p1.x, this.p1.y, "cyan", {
      handsRaised: false,
      isCatching: true,
      scale: 1.05,
      playerName: pair.p1Name
    });

    this.drawCyberBuggy(ctx, this.p2.x, this.p2.y, "pink", {
      handsRaised: false,
      isCatching: true,
      scale: 1.05,
      playerName: pair.p2Name
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
    ctx.fillText("🔄 ĐỔI CA THÀNH VIÊN TRONG TEAM!", W / 2, boxY + 45);
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
    const pulseScale = 1.0 + Math.sin(it.pulse) * 0.12;
    const r = it.isHazard ? 18 * pulseScale : 16 * pulseScale;

    const glow = ctx.createRadialGradient(it.x, it.y, r * 0.2, it.x, it.y, r * 2.0);
    glow.addColorStop(0, it.color);
    glow.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(it.x, it.y, r * 2.0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = it.color;
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

    ctx.font = "900 24px 'Be Vietnam Pro', sans-serif";
    ctx.fillStyle = "#facc15";
    ctx.textAlign = "center";
    ctx.shadowColor = "#facc15";
    ctx.shadowBlur = 15;
    ctx.fillText("SYNC COMBO +15!", this.W / 2, this.p1.y - 130);

    ctx.restore();
  }

  // --- RENDER ROUND 2: DUO CIRCUIT ---
  renderRound2(ctx, W, H) {
    ctx.save();
    const pair = this.getActivePair();

    ctx.font = "900 20px 'Be Vietnam Pro', sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "left";
    ctx.fillText("ROUND 02 — DUO CIRCUIT", 32, 98);

    ctx.font = "600 13px 'Be Vietnam Pro', sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
    ctx.fillText("Cả hai cùng giơ tay để đóng công tắc và thắp sáng bóng đèn", 32, 122);

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
      ctx.font = "900 22px 'Be Vietnam Pro', sans-serif";
      ctx.fillStyle = "#facc15";
      ctx.shadowColor = "#facc15";
      ctx.shadowBlur = 12;
      ctx.fillText("CIRCUIT COMPLETE!", bulbX, centerY + 105);
    } else {
      ctx.font = "800 14px 'Be Vietnam Pro', sans-serif";
      ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
      ctx.fillText("WAIT FOR YOUR TEAMMATE...", bulbX, centerY + 105);
    }

    // Render Cyber Buggies with Nametags
    this.drawCyberBuggy(ctx, 110, REACTOR_CONFIG.floorY, "cyan", {
      handsRaised: this.p1.handRaised,
      scale: 1.05,
      playerName: pair.p1Name
    });

    this.drawCyberBuggy(ctx, W - 110, REACTOR_CONFIG.floorY, "pink", {
      handsRaised: this.p2.handRaised,
      scale: 1.05,
      playerName: pair.p2Name
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

    ctx.font = "900 20px 'Be Vietnam Pro', sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "left";
    ctx.fillText("ROUND 03 — COOL THE CORE", 32, 98);

    ctx.font = "600 13px 'Be Vietnam Pro', sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
    ctx.fillText("Phối hợp làm mát reactor bằng chuyển động tay", 32, 122);

    this.renderMiniCameraPIP(ctx, W - 145, 82, 120, 68);

    const coreX = W / 2;
    const coreY = 320;

    this.renderReactorCore(ctx, coreX, coreY, this.coreTemp, this.coreAngle);

    for (const p of this.coolingParticles) {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // P1 Robot (Left) with Nametag
    this.drawCyberBuggy(ctx, 120, REACTOR_CONFIG.floorY, "cyan", {
      isWaving: true,
      scale: 1.15,
      playerName: pair.p1Name
    });

    // P2 Robot (Right) with Nametag
    this.drawCyberBuggy(ctx, W - 120, REACTOR_CONFIG.floorY, "pink", {
      isWaving: true,
      scale: 1.15,
      playerName: pair.p2Name
    });

    ctx.font = "900 24px 'JetBrains Mono', monospace";
    ctx.fillStyle = "#00f5ff";
    ctx.fillText("> >", 205, 330);

    ctx.fillStyle = "#ff2a8d";
    ctx.fillText("< <", W - 225, 330);

    if (this.finalBoostActive) {
      ctx.font = "900 18px 'JetBrains Mono', monospace";
      ctx.fillStyle = "#facc15";
      ctx.textAlign = "center";
      ctx.fillText("⚡ FINAL BOOST!", coreX, 195);
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

  // --- RENDER STAGE: MISSION COMPLETE (Full Team Honor) ---
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
    ctx.font = "900 36px 'Be Vietnam Pro', sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.shadowColor = "#facc15";
    ctx.shadowBlur = 18;
    ctx.fillText("MISSION COMPLETE!", W / 2, 145);

    ctx.font = "900 18px 'JetBrains Mono', monospace";
    ctx.fillStyle = "#38bdf8";
    ctx.shadowBlur = 0;
    ctx.fillText(this.teamName, W / 2, 185);

    // Total Score Number
    ctx.font = "900 64px 'JetBrains Mono', monospace";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(Math.round(this.displayScore).toLocaleString(), W / 2, 260);

    ctx.font = "800 13px 'JetBrains Mono', monospace";
    ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
    ctx.fillText("TỔNG ĐIỂM TÍCH LŨY CẢ ĐỘI (3 VÒNG)", W / 2, 290);

    // Full Team Members Roster Honor Card
    const cardW = 540;
    const cardH = 95;
    const cardX = W / 2 - cardW / 2;
    const cardY = 315;

    ctx.fillStyle = "rgba(15, 23, 42, 0.90)";
    ctx.strokeStyle = "rgba(56, 189, 248, 0.4)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardW, cardH, 12);
    ctx.fill();
    ctx.stroke();

    ctx.font = "800 12px 'Be Vietnam Pro', sans-serif";
    ctx.fillStyle = "#facc15";
    ctx.fillText("DANH SÁCH ANH HÙNG KHOA HỌC TRONG TEAM:", W / 2, cardY + 24);

    // Render Member Names Pills
    const memCount = this.teamMembers.length;
    const itemW = Math.min(125, (cardW - 40) / memCount);
    const startMemX = W / 2 - (memCount * itemW) / 2;

    this.teamMembers.forEach((name, idx) => {
      const ix = startMemX + idx * itemW + itemW / 2;
      ctx.fillStyle = "rgba(56, 189, 248, 0.15)";
      ctx.beginPath();
      ctx.roundRect(ix - itemW / 2 + 5, cardY + 38, itemW - 10, 38, 8);
      ctx.fill();

      ctx.font = "800 11px 'JetBrains Mono', monospace";
      ctx.fillStyle = idx % 2 === 0 ? "#00f5ff" : "#ff2a8d";
      ctx.fillText(`★ ĐỒNG ĐỘI`, ix, cardY + 52);

      ctx.font = "900 12px 'Be Vietnam Pro', sans-serif";
      ctx.fillStyle = "#ffffff";
      ctx.fillText(name, ix, cardY + 68);
    });

    // Badge: SCIENCE EXPLORERS
    const badgeW = 240;
    const badgeY = 430;
    ctx.fillStyle = "rgba(16, 185, 129, 0.2)";
    ctx.strokeStyle = "#10b981";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(W / 2 - badgeW / 2, badgeY, badgeW, 36, 18);
    ctx.fill();
    ctx.stroke();

    ctx.font = "900 13px 'JetBrains Mono', monospace";
    ctx.fillStyle = "#34d399";
    ctx.fillText("SCIENCE EXPLORERS", W / 2, badgeY + 23);

    // Slogan: SCIENCE IS FOR EVERYONE
    ctx.font = "800 15px 'Be Vietnam Pro', sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    ctx.fillText("• SCIENCE IS FOR EVERYONE •", W / 2, 495);

    // Celebrating Mascot Pair (only draw vector fallback if background image not yet loaded)
    if (!this.bgImages.victory || !this.bgImages.victory.complete) {
      this.drawCyberBuggy(ctx, W / 2 - 85, 575, "cyan", {
        handsRaised: true,
        scale: 1.2
      });

      this.drawCyberBuggy(ctx, W / 2 + 85, 575, "pink", {
        handsRaised: true,
        scale: 1.2
      });
    }

    ctx.font = "800 11px 'JetBrains Mono', monospace";
    ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
    ctx.fillText("POWERED BY FU-DEVER • STEM FAIR 2026", W / 2, H - 28);

    ctx.restore();
  }

  // --- MASCOT RENDERER: CYBER BUGGY (with Big TV Player Nametag) ---
  drawCyberBuggy(ctx, x, y, colorTheme = "cyan", options = {}) {
    ctx.save();
    ctx.translate(x, y);

    const scale = options.scale || 1.0;
    ctx.scale(scale, scale);

    const isCyan = colorTheme === "cyan";
    const primaryColor = isCyan ? "#00f5ff" : "#ff2a8d";
    const darkShell = isCyan ? "#0369a1" : "#9d174d";
    const lightGlow = isCyan ? "#a5f3fc" : "#fbcfe8";

    // Player Nametag on top for Lab Room TV readability
    if (options.playerName) {
      ctx.save();
      ctx.font = "900 11px 'Be Vietnam Pro', sans-serif";
      ctx.fillStyle = primaryColor;
      ctx.textAlign = "center";
      ctx.shadowColor = primaryColor;
      ctx.shadowBlur = 6;
      ctx.fillText(options.playerName, 0, -62);
      ctx.restore();
    }

    const antennaBob = Math.sin(this.totalTime * 6) * 3;

    // Ground Jet Glow / Shadow
    const shadowGlow = ctx.createRadialGradient(0, 22, 5, 0, 22, 28);
    shadowGlow.addColorStop(0, primaryColor);
    shadowGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = shadowGlow;
    ctx.beginPath();
    ctx.ellipse(0, 22, 32, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // Antennae
    ctx.strokeStyle = primaryColor;
    ctx.lineWidth = 2.5;

    ctx.beginPath();
    ctx.moveTo(-10, -28);
    ctx.quadraticCurveTo(-22, -45 + antennaBob, -20, -52 + antennaBob);
    ctx.stroke();

    ctx.fillStyle = "#facc15";
    ctx.beginPath();
    ctx.arc(-20, -52 + antennaBob, 4.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(10, -28);
    ctx.quadraticCurveTo(22, -45 - antennaBob, 20, -52 - antennaBob);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(20, -52 - antennaBob, 4.5, 0, Math.PI * 2);
    ctx.fill();

    // Rounded Cyber Buggy Body
    const shellGrad = ctx.createLinearGradient(0, -32, 0, 18);
    shellGrad.addColorStop(0, primaryColor);
    shellGrad.addColorStop(0.4, darkShell);
    shellGrad.addColorStop(1, "#070b19");
    ctx.fillStyle = shellGrad;
    ctx.strokeStyle = primaryColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-26, -32, 52, 50, 18);
    ctx.fill();
    ctx.stroke();

    // Visor
    ctx.fillStyle = "#030712";
    ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(-20, -24, 40, 24, 8);
    ctx.fill();
    ctx.stroke();

    // LED Eyes
    ctx.fillStyle = lightGlow;
    ctx.shadowColor = primaryColor;
    ctx.shadowBlur = 8;

    if (options.handsRaised || options.isReady) {
      ctx.strokeStyle = lightGlow;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(-10, -11, 5, Math.PI, 0);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(10, -11, 5, Math.PI, 0);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(-10, -12, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(10, -12, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;

    // Robotic Arms
    ctx.strokeStyle = primaryColor;
    ctx.lineWidth = 3.5;
    ctx.lineCap = "round";

    if (options.handsRaised) {
      ctx.beginPath();
      ctx.moveTo(-22, -6);
      ctx.lineTo(-32, -38);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(22, -6);
      ctx.lineTo(32, -38);
      ctx.stroke();
    } else if (options.isWaving) {
      const waveOffset = Math.sin(this.totalTime * 14) * 8;
      ctx.beginPath();
      ctx.moveTo(-22, -6);
      ctx.lineTo(-35 + waveOffset, -14);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(22, -6);
      ctx.lineTo(35 - waveOffset, -14);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(-22, -6);
      ctx.lineTo(-32, 4);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(22, -6);
      ctx.lineTo(32, 4);
      ctx.stroke();
    }

    ctx.fillStyle = "#1e293b";
    ctx.fillRect(-16, 18, 32, 6);

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
