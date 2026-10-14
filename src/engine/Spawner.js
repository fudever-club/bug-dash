// FU-DEVER BUG DASH - Intelligent Obstacle & Reward Spawner
// Guarantees at least 1 safe path, accelerates speed and density dynamically.

import { GAME_CONFIG, OBJECT_DEFINITIONS } from "../config.js";

export class Spawner {
  constructor() {
    this.spawnTimer = 0;
    this.items = [];
  }

  reset() {
    this.spawnTimer = 0;
    this.items = [];
  }

  update(dt, timeLeft, steeringMode = "snap3") {
    this.spawnTimer += dt;

    // Difficulty curve based on time left in 60s session
    let spawnInterval = 1.30; // Phase 1: 0 - 15s elapsed (timeLeft: 60 - 45)
    if (timeLeft < 45) spawnInterval = 1.05; // Phase 2: 15 - 30s elapsed
    if (timeLeft < 30) spawnInterval = 0.85; // Phase 3: 30 - 45s elapsed
    if (timeLeft < 15) spawnInterval = 0.65; // Phase 4: 45 - 60s elapsed (rush)

    if (this.spawnTimer >= spawnInterval) {
      this.spawnTimer = 0;
      this.spawnWave(timeLeft, steeringMode);
    }

    // Move existing items down
    for (let i = this.items.length - 1; i >= 0; i--) {
      const it = this.items[i];
      it.y += it.speed * dt;

      // Remove items that crossed the bottom of the screen
      if (it.y > GAME_CONFIG.roadHeight + 60) {
        this.items.splice(i, 1);
      }
    }
  }

  spawnWave(timeLeft, steeringMode = "snap3") {
    const lanes = [0, 1, 2];
    // Guarantee at least 1 lane is completely empty/safe
    const countToSpawn = (timeLeft < 30 && Math.random() < 0.45) ? 2 : 1;

    // Shuffle lane indices
    lanes.sort(() => Math.random() - 0.5);
    const chosenLanes = lanes.slice(0, countToSpawn);

    let speed = GAME_CONFIG.initialSpeed + (GAME_CONFIG.sessionDuration - timeLeft) * GAME_CONFIG.speedAcceleration;
    if (steeringMode === "highway") {
      speed *= 1.35; // FPT Highway Racer higher velocity
    }

    chosenLanes.forEach(laneIdx => {
      // Highway mode spawns more nitro rewards (40% rewards, 60% obstacles)
      const obstacleChance = (steeringMode === "highway") ? 0.60 : 0.68;
      const isObstacle = Math.random() < obstacleChance;
      const candidates = OBJECT_DEFINITIONS.filter(o => o.isObstacle === isObstacle);
      const def = candidates[Math.floor(Math.random() * candidates.length)];

      let posX = GAME_CONFIG.laneX[laneIdx];
      // In analog or highway racer mode, slightly perturb obstacle X coordinates for slalom challenge
      if (steeringMode === "analog" || steeringMode === "highway") {
        const jitter = (Math.random() - 0.5) * 60;
        posX = Math.max(GAME_CONFIG.roadMinX + 35, Math.min(GAME_CONFIG.roadMaxX - 35, posX + jitter));
      }

      this.items.push({
        ...def,
        id: Math.random().toString(36).substring(2, 9),
        lane: laneIdx,
        x: posX,
        y: -40,
        speed: speed,
        scale: 1.0,
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
