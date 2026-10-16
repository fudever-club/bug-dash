// FU-DEVER BUG DASH - Intelligent Obstacle & Reward Spawner
// Guarantees at least 1 safe path, accelerates speed and density dynamically.

import { GAME_CONFIG, OBJECT_DEFINITIONS, CATCHER_DEFINITIONS, SPLIT_CONFIG, SLICER_CONFIG, FLAPPY_CONFIG } from "../config.js";

export class Spawner {
  constructor(customLanes = null, customBounds = null) {
    this.spawnTimer = 0;
    this.items = [];
    this.customLanes = customLanes; // For Split-Screen P1 or P2
    this.customBounds = customBounds;
  }

  reset() {
    this.spawnTimer = 0;
    this.items = [];
  }

  update(dt, timeLeft, steeringMode = "snap3", gameMode = "classic") {
    this.spawnTimer += dt;

    // Difficulty curve based on time left in 60s session
    let spawnInterval = 1.30;
    if (gameMode === "slicer") {
      spawnInterval = (timeLeft < 30) ? 0.95 : 1.25;
    } else if (gameMode === "flappy") {
      spawnInterval = FLAPPY_CONFIG.pipeSpawnInterval;
    } else if (gameMode === "catcher") {
      spawnInterval = 0.85; // Faster, continuous rhythm for PR Catcher
      if (timeLeft < 30) spawnInterval = 0.70;
      if (timeLeft < 15) spawnInterval = 0.55;
    } else {
      if (timeLeft < 45) spawnInterval = 1.05;
      if (timeLeft < 30) spawnInterval = 0.85;
      if (timeLeft < 15) spawnInterval = 0.65;
    }

    if (this.spawnTimer >= spawnInterval) {
      this.spawnTimer = 0;
      this.spawnWave(timeLeft, steeringMode, gameMode);
    }

    // Update existing items according to game mode physics
    for (let i = this.items.length - 1; i >= 0; i--) {
      const it = this.items[i];

      if (gameMode === "slicer") {
        // Parabolic physics for tossed items
        it.x += it.vx * dt;
        it.y += it.vy * dt;
        it.vy += it.gravity * dt;
        it.angle = (it.angle || 0) + (it.vRot || 2) * dt;

        // If sliced, update sliced pieces trajectory
        if (it.isSliced && it.pieces) {
          it.pieces.forEach(p => {
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vy += it.gravity * dt;
            p.angle += p.vRot * dt;
          });
        }

        // Remove item after falling off screen bottom
        if (it.y > GAME_CONFIG.roadHeight + 90 && it.vy > 0) {
          this.items.splice(i, 1);
        }
      } else if (gameMode === "flappy") {
        // Horizontal leftward drift for Firewall Logic Pipes
        it.x -= it.speed * dt;
        if (it.x + (it.width || 68) < -30) {
          this.items.splice(i, 1);
        }
      } else {
        // Standard vertical falling items
        it.y += it.speed * dt;
        if (it.y > GAME_CONFIG.roadHeight + 60) {
          this.items.splice(i, 1);
        }
      }
    }
  }

  spawnWave(timeLeft, steeringMode = "snap3", gameMode = "classic") {
    // 1. Slicer Mode: Toss 1-3 bugs / rewards up into the air
    if (gameMode === "slicer") {
      const count = (timeLeft < 25) ? (Math.random() < 0.6 ? 3 : 2) : (Math.random() < 0.5 ? 2 : 1);
      const pool = (Math.random() < 0.35) ? CATCHER_DEFINITIONS : OBJECT_DEFINITIONS;

      for (let c = 0; c < count; c++) {
        const def = pool[Math.floor(Math.random() * pool.length)];
        const posX = 110 + Math.random() * 420;
        const centerBias = (320 - posX) * 0.42;
        const vx = centerBias + (Math.random() - 0.5) * 120;
        const vy = -(680 + Math.random() * 200);
        const vRot = (Math.random() - 0.5) * 6;

        this.items.push({
          ...def,
          id: Math.random().toString(36).substring(2, 9),
          x: posX,
          y: 735,
          vx: vx,
          vy: vy,
          vRot: vRot,
          angle: 0,
          gravity: SLICER_CONFIG.gravity,
          isSliced: false,
          scale: 1.15,
        });
      }
      return;
    }

    // 2. Flappy Mode: Spawn Fiber Optic Firewall Pipe Pair with Logic Gate
    if (gameMode === "flappy") {
      const gap = FLAPPY_CONFIG.pipeGap;
      const pipeW = FLAPPY_CONFIG.pipeWidth;
      const minTop = 85;
      const maxTop = 440;
      const topHeight = minTop + Math.random() * (maxTop - minTop);
      const bottomY = topHeight + gap;
      const logicGates = ["AND", "OR", "XOR", "NOT", "NAND", "NOR"];
      const gateLabel = logicGates[Math.floor(Math.random() * logicGates.length)];

      this.items.push({
        type: "firewall_pipe",
        id: Math.random().toString(36).substring(2, 9),
        x: 660,
        topHeight: topHeight,
        bottomY: bottomY,
        gap: gap,
        width: pipeW,
        speed: FLAPPY_CONFIG.pipeSpeed + (GAME_CONFIG.sessionDuration - timeLeft) * 1.5,
        gateLabel: gateLabel,
        passed: false,
      });
      return;
    }

    // 3. Catcher Minigame Mode: PR & Star Collector
    if (gameMode === "catcher") {
      const isObstacle = Math.random() < 0.35; // 65% Catchable Rewards, 35% Bugs to avoid
      const pool = CATCHER_DEFINITIONS.filter(o => o.isObstacle === isObstacle);
      const def = pool[Math.floor(Math.random() * pool.length)];

      const minX = GAME_CONFIG.roadMinX + 35;
      const maxX = GAME_CONFIG.roadMaxX - 35;
      const posX = minX + Math.random() * (maxX - minX);
      const speed = 280 + (GAME_CONFIG.sessionDuration - timeLeft) * 2.2;

      this.items.push({
        ...def,
        id: Math.random().toString(36).substring(2, 9),
        x: posX,
        y: -40,
        speed: speed,
        scale: 1.0,
      });
      return;
    }

    // 2. Standard / Highway / Split-Screen Modes
    const baseLanes = this.customLanes || GAME_CONFIG.laneX;
    const laneIndices = [0, 1, 2];
    const countToSpawn = (timeLeft < 30 && Math.random() < 0.45) ? 2 : 1;

    laneIndices.sort(() => Math.random() - 0.5);
    const chosenLanes = laneIndices.slice(0, countToSpawn);

    let speed = GAME_CONFIG.initialSpeed + (GAME_CONFIG.sessionDuration - timeLeft) * GAME_CONFIG.speedAcceleration;
    if (steeringMode === "highway") {
      speed *= 1.35; // FPT Highway Racer higher velocity
    }

    chosenLanes.forEach(laneIdx => {
      const obstacleChance = (steeringMode === "highway") ? 0.60 : 0.68;
      const isObstacle = Math.random() < obstacleChance;
      const candidates = OBJECT_DEFINITIONS.filter(o => o.isObstacle === isObstacle);
      const def = candidates[Math.floor(Math.random() * candidates.length)];

      let posX = baseLanes[laneIdx];
      if (steeringMode === "analog" || steeringMode === "highway") {
        const jitter = (Math.random() - 0.5) * 50;
        const minX = this.customBounds ? this.customBounds.minX : GAME_CONFIG.roadMinX + 35;
        const maxX = this.customBounds ? this.customBounds.maxX : GAME_CONFIG.roadMaxX - 35;
        posX = Math.max(minX, Math.min(maxX, posX + jitter));
      }

      this.items.push({
        ...def,
        id: Math.random().toString(36).substring(2, 9),
        lane: laneIdx,
        x: posX,
        y: -40,
        speed: speed,
        scale: this.customLanes ? 0.85 : 1.0,
      });
    });
  }

  spawnIncomingAttack(attackType = "deadline_surge", laneIdx = 1) {
    const lane = Math.max(0, Math.min(2, laneIdx));
    this.items.push({
      type: "boss_deadline",
      label: "DEADLINE!",
      color: "#dc2626",
      radius: 38,
      isObstacle: true,
      damage: 1,
      scoreDeduct: 50,
      textDesc: "Tấn công từ đối thủ!",
      id: Math.random().toString(36).substring(2, 9),
      lane: lane,
      x: GAME_CONFIG.laneX[lane],
      y: -60,
      speed: 460,
      scale: 1.3,
      isAttack: true
    });
  }

  removeItem(index) {
    if (index >= 0 && index < this.items.length) {
      this.items.splice(index, 1);
    }
  }
}
