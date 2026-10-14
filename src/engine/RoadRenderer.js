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

  render(dt, playerX, targetX, currentLane, items, particleSystem, isBuffed, isGameOver, isInvulnerable = false, isFever = false, steeringMode = "snap3") {
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
    ctx.strokeStyle = isFever ? "rgba(245, 158, 11, 0.9)" : "rgba(242, 111, 33, 0.45)";
    ctx.lineWidth = isFever ? 6 : 4;
    ctx.beginPath();
    ctx.moveTo(40, 0); ctx.lineTo(40, H);
    ctx.moveTo(W - 40, 0); ctx.lineTo(W - 40, H);
    ctx.stroke();

    // Active Floor Accent Glow
    if (steeringMode === "analog") {
      ctx.fillStyle = isFever ? "rgba(245, 158, 11, 0.15)" : "rgba(245, 158, 11, 0.08)";
      ctx.fillRect(playerX - 60, 0, 120, H);
    } else {
      const activeLaneX = GAME_CONFIG.laneX[currentLane];
      ctx.fillStyle = isFever ? "rgba(245, 158, 11, 0.15)" : "rgba(245, 158, 11, 0.06)";
      ctx.fillRect(activeLaneX - 85, 0, 170, H);
    }

    // 3. Render Falling Items
    items.forEach(it => {
      ctx.save();
      ctx.translate(it.x, it.y);

      // Glowing badge circle
      ctx.beginPath();
      ctx.arc(0, 0, it.radius, 0, Math.PI * 2);
      ctx.fillStyle = it.color;
      ctx.shadowColor = it.color;
      ctx.shadowBlur = isFever ? 20 : 14;
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

    // Dynamic tilt & squash-stretch feel
    const moveDiff = targetX - playerX;
    const tilt = Math.max(-0.25, Math.min(0.25, moveDiff * 0.003));
    ctx.rotate(tilt);

    const squashX = 1 + Math.abs(tilt) * 0.30;
    const stretchY = 1 - Math.abs(tilt) * 0.15;
    ctx.scale(squashX, stretchY);

    // Invulnerability i-frames blink
    if (isInvulnerable) {
      const blink = Math.sin(performance.now() * 0.035) > 0;
      ctx.globalAlpha = blink ? 0.35 : 0.95;
    }

    // Fever Mode or Coffee Aura
    if (isFever) {
      // Golden Fever Shield
      ctx.beginPath();
      ctx.arc(0, 0, pSize * 0.58, 0, Math.PI * 2);
      ctx.strokeStyle = "#f59e0b";
      ctx.lineWidth = 5;
      ctx.shadowColor = "#f59e0b";
      ctx.shadowBlur = 24;
      ctx.stroke();

      // Outer Pulse Ring
      const pulse = (Math.sin(performance.now() * 0.01) + 1) * 6;
      ctx.beginPath();
      ctx.arc(0, 0, pSize * 0.62 + pulse, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(245, 158, 11, 0.4)";
      ctx.lineWidth = 2;
      ctx.stroke();
    } else if (isBuffed) {
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
