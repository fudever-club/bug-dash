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

  render(dt, playerX, targetX, currentLane, items, particleSystem, isBuffed, isGameOver, isInvulnerable = false, isFever = false, steeringMode = "snap3", opponentData = null, gameMode = "classic") {
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

    // Highway Dash Lines (speed scales in highway mode)
    const roadSpeed = (steeringMode === "highway") ? 620 : 420;
    this.roadOffset = (this.roadOffset + roadSpeed * dt) % 60;
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

    // Catcher Minigame: Render High-Tech PR Collector Basket
    if (gameMode === "catcher") {
      ctx.save();
      ctx.translate(playerX, playerY - pSize * 0.42);
      ctx.strokeStyle = "#10b981";
      ctx.lineWidth = 3;
      ctx.shadowColor = "#10b981";
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.arc(0, 0, 52, Math.PI * 0.15, Math.PI * 0.85, false);
      ctx.stroke();

      // Collector Tray Neon Base
      ctx.fillStyle = "rgba(16, 185, 129, 0.22)";
      ctx.fill();

      // Side Antennae / Sensor Pins
      ctx.fillStyle = "#34d399";
      ctx.fillRect(-48, -6, 5, 12);
      ctx.fillRect(43, -6, 5, 12);

      // Label
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 9px 'JetBrains Mono', monospace";
      ctx.textAlign = "center";
      ctx.fillText("PR CATCHER", 0, 14);
      ctx.restore();
    }

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

    // 6. Duel Opponent Telemetry HUD
    if (opponentData) {
      ctx.save();
      const barW = 270;
      const barH = 34;
      const barX = W / 2 - barW / 2;
      const barY = 12;

      ctx.fillStyle = "rgba(10, 17, 34, 0.88)";
      ctx.strokeStyle = "rgba(239, 68, 68, 0.6)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(barX, barY, barW, barH, 6);
      ctx.fill();
      ctx.stroke();

      // Opponent Info
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 11px 'JetBrains Mono', monospace";
      ctx.textAlign = "left";
      ctx.fillText(`${opponentData.name || 'ĐỐI THỦ'}: ${opponentData.score || 0}`, barX + 12, barY + 21);

      // Opponent Lives
      const oppLives = opponentData.lives !== undefined ? opponentData.lives : 3;
      let heartsText = "";
      for (let i = 0; i < 3; i++) {
        heartsText += i < oppLives ? "● " : "○ ";
      }
      ctx.textAlign = "right";
      ctx.fillStyle = oppLives > 0 ? "#ef4444" : "#64748b";
      ctx.fillText(heartsText.trim(), barX + barW - 12, barY + 21);

      ctx.restore();
    }

    ctx.restore(); // Restore shake
  }

  /**
   * Split-Screen 2-Player Renderer on a Single 640x720 Canvas
   */
  renderSplitScreen(dt, p1, p2, particleSystem, timeLeft = 60) {
    const W = this.canvas.width;
    const H = this.canvas.height;
    const ctx = this.ctx;

    ctx.save();

    // 1. Camera Shake
    if (this.shake > 0) {
      const sx = (Math.random() - 0.5) * this.shake * 12;
      const sy = (Math.random() - 0.5) * this.shake * 12;
      ctx.translate(sx, sy);
      this.shake = Math.max(0, this.shake - dt * 2.5);
    }

    // Base Background
    ctx.fillStyle = "#070c18";
    ctx.fillRect(0, 0, W, H);

    // Dynamic Road Lines offset
    this.roadOffset = (this.roadOffset + 420 * dt) % 60;

    // --- LEFT HALF: P1 Track (Cyan) ---
    ctx.fillStyle = "#0a1324";
    ctx.fillRect(16, 0, 296, H);

    // P1 Dash Dividers
    ctx.strokeStyle = "rgba(6, 182, 212, 0.20)";
    ctx.lineWidth = 2;
    ctx.setLineDash([20, 30]);
    ctx.lineDashOffset = -this.roadOffset;
    ctx.beginPath();
    ctx.moveTo(110, 0); ctx.lineTo(110, H);
    ctx.moveTo(210, 0); ctx.lineTo(210, H);
    ctx.stroke();

    // --- RIGHT HALF: P2 Track (Amber) ---
    ctx.fillStyle = "#160e1f";
    ctx.fillRect(328, 0, 296, H);

    // P2 Dash Dividers
    ctx.strokeStyle = "rgba(245, 158, 11, 0.20)";
    ctx.beginPath();
    ctx.moveTo(430, 0); ctx.lineTo(430, H);
    ctx.moveTo(530, 0); ctx.lineTo(530, H);
    ctx.stroke();
    ctx.setLineDash([]);

    // --- CENTER DIVIDER (VS Neon Beam) ---
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(316, 0, 8, H);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(320, 0); ctx.lineTo(320, H);
    ctx.stroke();

    // Center VS Badge
    ctx.save();
    ctx.fillStyle = "#0f172a";
    ctx.strokeStyle = "#f59e0b";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(320, 72, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 11px 'JetBrains Mono', monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("VS", 320, 73);
    ctx.restore();

    // 2. Render Falling Items for P1
    if (p1.items) {
      p1.items.forEach(it => {
        ctx.save();
        ctx.translate(it.x, it.y);
        ctx.beginPath();
        ctx.arc(0, 0, (it.radius || 24) * 0.85, 0, Math.PI * 2);
        ctx.fillStyle = it.color || "#ef4444";
        ctx.shadowColor = it.color;
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = "#fff";
        ctx.font = "bold 9px 'JetBrains Mono', monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(it.label, 0, 1);
        ctx.restore();
      });
    }

    // 3. Render Falling Items for P2
    if (p2.items) {
      p2.items.forEach(it => {
        ctx.save();
        ctx.translate(it.x, it.y);
        ctx.beginPath();
        ctx.arc(0, 0, (it.radius || 24) * 0.85, 0, Math.PI * 2);
        ctx.fillStyle = it.color || "#ef4444";
        ctx.shadowColor = it.color;
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = "#fff";
        ctx.font = "bold 9px 'JetBrains Mono', monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(it.label, 0, 1);
        ctx.restore();
      });
    }

    // 4. Render P1 Buggy (Chibi size 74px)
    const pSize = 74;
    const playerY = GAME_CONFIG.playerY;

    // P1 Sprite
    ctx.save();
    ctx.translate(p1.playerX, playerY);
    if (p1.isInvulnerable) {
      ctx.globalAlpha = Math.sin(performance.now() * 0.035) > 0 ? 0.35 : 0.95;
    }
    // Cyan aura
    ctx.beginPath();
    ctx.arc(0, 0, pSize * 0.52, 0, Math.PI * 2);
    ctx.strokeStyle = "#06b6d4";
    ctx.lineWidth = 3;
    ctx.stroke();
    const p1Img = p1.isGameOver ? this.sprites.dead : this.sprites.running;
    if (p1Img.complete && p1Img.naturalWidth > 0) {
      ctx.drawImage(p1Img, -pSize / 2, -pSize / 2, pSize, pSize);
    }
    ctx.restore();

    // P2 Sprite
    ctx.save();
    ctx.translate(p2.playerX, playerY);
    if (p2.isInvulnerable) {
      ctx.globalAlpha = Math.sin(performance.now() * 0.035) > 0 ? 0.35 : 0.95;
    }
    // Amber aura
    ctx.beginPath();
    ctx.arc(0, 0, pSize * 0.52, 0, Math.PI * 2);
    ctx.strokeStyle = "#f59e0b";
    ctx.lineWidth = 3;
    ctx.stroke();
    const p2Img = p2.isGameOver ? this.sprites.dead : this.sprites.running;
    if (p2Img.complete && p2Img.naturalWidth > 0) {
      ctx.drawImage(p2Img, -pSize / 2, -pSize / 2, pSize, pSize);
    }
    ctx.restore();

    // 5. Render Particle FX
    if (particleSystem) {
      particleSystem.render(ctx);
    }

    // 6. Split-Screen Top HUD
    // P1 HUD Box
    ctx.save();
    ctx.fillStyle = "rgba(6, 182, 212, 0.15)";
    ctx.strokeStyle = "#06b6d4";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(20, 14, 180, 36, 6);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 11px 'JetBrains Mono', monospace";
    ctx.textAlign = "left";
    ctx.fillText(`P1 (CYAN): ${p1.score || 0}`, 30, 36);

    let p1LivesStr = "";
    for (let i = 0; i < 3; i++) p1LivesStr += (i < p1.lives ? "● " : "○ ");
    ctx.textAlign = "right";
    ctx.fillStyle = p1.lives > 0 ? "#06b6d4" : "#64748b";
    ctx.fillText(p1LivesStr.trim(), 190, 36);
    ctx.restore();

    // P2 HUD Box
    ctx.save();
    ctx.fillStyle = "rgba(245, 158, 11, 0.15)";
    ctx.strokeStyle = "#f59e0b";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(440, 14, 180, 36, 6);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 11px 'JetBrains Mono', monospace";
    ctx.textAlign = "left";
    ctx.fillText(`P2 (AMBER): ${p2.score || 0}`, 450, 36);

    let p2LivesStr = "";
    for (let i = 0; i < 3; i++) p2LivesStr += (i < p2.lives ? "● " : "○ ");
    ctx.textAlign = "right";
    ctx.fillStyle = p2.lives > 0 ? "#f59e0b" : "#64748b";
    ctx.fillText(p2LivesStr.trim(), 610, 36);
    ctx.restore();

    // Center Timer Box
    ctx.save();
    ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
    ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(280, 14, 80, 36, 6);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#f59e0b";
    ctx.font = "800 14px 'JetBrains Mono', monospace";
    ctx.textAlign = "center";
    ctx.fillText(`${Math.ceil(timeLeft)}s`, 320, 37);
    ctx.restore();

    ctx.restore(); // Restore shake
  }
}
