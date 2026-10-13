// FU-DEVER BUG DASH - Canvas 2D Road & Arcade Renderer
// High-performance, neo-arcade visual craftsmanship with zero external bloat.

import { GAME_CONFIG, ASSET_PATHS } from "../config.js";

export class RoadRenderer {
  constructor(canvasElement) {
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext("2d");
    this.roadOffset = 0;
    this.shake = 0;

    // Preload Mascot Sprites
    this.sprites = {
      running: new Image(),
      dead: new Image(),
      champion: new Image()
    };
    this.sprites.running.src = ASSET_PATHS.playerRunning;
    this.sprites.dead.src = ASSET_PATHS.playerDead;
    this.sprites.champion.src = ASSET_PATHS.buggyChampion;
  }

  triggerShake(intensity = 1.0) {
    this.shake = intensity;
  }

  render(dt, playerX, targetX, currentLane, items, particleSystem, isBuffed, isGameOver) {
    const W = this.canvas.width;
    const H = this.canvas.height;
    const ctx = this.ctx;

    ctx.save();

    // 1. Camera Shake calculation
    if (this.shake > 0) {
      const sx = (Math.random() - 0.5) * this.shake * 12;
      const sy = (Math.random() - 0.5) * this.shake * 12;
      ctx.translate(sx, sy);
      this.shake = Math.max(0, this.shake - dt * 2.5);
    }

    // 2. Base Road Background
    ctx.fillStyle = "#070c18";
    ctx.fillRect(0, 0, W, H);

    // Dark asphalt core
    ctx.fillStyle = "#0a1122";
    ctx.fillRect(40, 0, W - 80, H);

    // Highway Dash Lines (animated downwards)
    this.roadOffset = (this.roadOffset + 420 * dt) % 60;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
    ctx.lineWidth = 3;
    ctx.setLineDash([25, 35]);

    const divX1 = (GAME_CONFIG.laneX[0] + GAME_CONFIG.laneX[1]) / 2;
    const divX2 = (GAME_CONFIG.laneX[1] + GAME_CONFIG.laneX[2]) / 2;

    ctx.lineDashOffset = -this.roadOffset;
    ctx.beginPath();
    ctx.moveTo(divX1, 0); ctx.lineTo(divX1, H);
    ctx.moveTo(divX2, 0); ctx.lineTo(divX2, H);
    ctx.stroke();
    ctx.setLineDash([]);

    // Glowing Neon Road Curbs (FPT Orange & DEVER Amber)
    ctx.strokeStyle = "rgba(242, 111, 33, 0.45)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(40, 0); ctx.lineTo(40, H);
    ctx.moveTo(W - 40, 0); ctx.lineTo(W - 40, H);
    ctx.stroke();

    // Active Lane Floor Accent Glow
    const activeLaneX = GAME_CONFIG.laneX[currentLane];
    ctx.fillStyle = "rgba(245, 158, 11, 0.06)";
    ctx.fillRect(activeLaneX - 85, 0, 170, H);

    // 3. Render Falling Items
    items.forEach(it => {
      ctx.save();
      ctx.translate(it.x, it.y);

      // Glowing badge circle
      ctx.beginPath();
      ctx.arc(0, 0, it.radius, 0, Math.PI * 2);
      ctx.fillStyle = it.color;
      ctx.shadowColor = it.color;
      ctx.shadowBlur = 14;
      ctx.fill();

      // Sharp white rim
      ctx.shadowBlur = 0;
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Inner text label
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 11px 'JetBrains Mono', monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(it.label, 0, 1);

      ctx.restore();
    });

    // 4. Render Mascot Buggy (Real FU-DEVER Mascot)
    const playerY = GAME_CONFIG.playerY;
    const pSize = GAME_CONFIG.playerSize;

    ctx.save();
    ctx.translate(playerX, playerY);

    // Tilting effect when steering
    const tilt = (targetX - playerX) * 0.0018;
    ctx.rotate(tilt);

    // Combo Aura if Coffee Buff active
    if (isBuffed) {
      ctx.beginPath();
      ctx.arc(0, 0, pSize * 0.52, 0, Math.PI * 2);
      ctx.strokeStyle = "#06b6d4";
      ctx.lineWidth = 4;
      ctx.shadowColor = "#06b6d4";
      ctx.shadowBlur = 20;
      ctx.stroke();
    }

    // Draw sprite
    const currentImg = isGameOver ? this.sprites.dead : this.sprites.running;
    if (currentImg.complete && currentImg.naturalWidth > 0) {
      ctx.drawImage(currentImg, -pSize / 2, -pSize / 2, pSize, pSize);
    } else {
      // Clean fallback if decoding
      ctx.beginPath();
      ctx.arc(0, 0, 36, 0, Math.PI * 2);
      ctx.fillStyle = "#f26f21";
      ctx.fill();
    }

    ctx.restore();

    // 5. Render Particle FX & Floating Texts
    if (particleSystem) {
      particleSystem.render(ctx);
    }

    ctx.restore(); // Restore shake
  }
}
