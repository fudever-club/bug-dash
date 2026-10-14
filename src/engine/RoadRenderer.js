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

    // Curbside Hazard Racing Stripes (Left & Right Shoulders)
    const stripeH = 32;
    const stripeOffset = this.roadOffset % (stripeH * 2);
    for (let y = -stripeH * 2; y < H + stripeH; y += stripeH * 2) {
      const sy = y + stripeOffset;
      ctx.fillStyle = isFever ? "rgba(245, 158, 11, 0.45)" : "rgba(242, 111, 33, 0.32)";
      ctx.fillRect(8, sy, 24, stripeH);
      ctx.fillRect(W - 32, sy, 24, stripeH);
    }

    // Highway Dash Lines (speed scales in highway mode)
    const roadSpeed = (steeringMode === "highway") ? 620 : 420;
    this.roadOffset = (this.roadOffset + roadSpeed * dt) % 60;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.14)";
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
    ctx.strokeStyle = isFever ? "rgba(245, 158, 11, 0.95)" : "rgba(242, 111, 33, 0.65)";
    ctx.lineWidth = isFever ? 6 : 4;
    ctx.beginPath();
    ctx.moveTo(40, 0); ctx.lineTo(40, H);
    ctx.moveTo(W - 40, 0); ctx.lineTo(W - 40, H);
    ctx.stroke();

    // Active Floor Accent Glow
    if (steeringMode === "analog") {
      ctx.fillStyle = isFever ? "rgba(245, 158, 11, 0.18)" : "rgba(245, 158, 11, 0.08)";
      ctx.fillRect(playerX - 60, 0, 120, H);
    } else {
      const activeLaneX = GAME_CONFIG.laneX[currentLane];
      ctx.fillStyle = isFever ? "rgba(245, 158, 11, 0.18)" : "rgba(245, 158, 11, 0.08)";
      ctx.fillRect(activeLaneX - 85, 0, 170, H);
    }

    // Speed stream lines in Fever or Highway mode
    if (isFever || steeringMode === "highway") {
      ctx.strokeStyle = isFever ? "rgba(245, 158, 11, 0.22)" : "rgba(6, 182, 212, 0.18)";
      ctx.lineWidth = 2;
      for (let i = 0; i < 5; i++) {
        const lx = 90 + i * 110;
        const ly = ((this.roadOffset * 5 + i * 145) % H);
        ctx.beginPath();
        ctx.moveTo(lx, ly);
        ctx.lineTo(lx, ly + 45);
        ctx.stroke();
      }
    }

    // 3. Render Falling Items (High-Fidelity Procedural Vector Sprites)
    items.forEach(it => {
      ctx.save();
      ctx.translate(it.x, it.y);
      this.drawArcadeItem(ctx, it, isFever, 1.0);
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
        this.drawArcadeItem(ctx, it, false, 0.85);
        ctx.restore();
      });
    }

    // 3. Render Falling Items for P2
    if (p2.items) {
      p2.items.forEach(it => {
        ctx.save();
        ctx.translate(it.x, it.y);
        this.drawArcadeItem(ctx, it, false, 0.85);
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

  /**
   * High-Fidelity Procedural Vector Arcade Items
   */
  drawArcadeItem(ctx, it, isFever, scale = 1.0) {
    const R = (it.radius || 24) * scale;
    const t = performance.now() * 0.003;
    const type = it.type;

    ctx.save();

    switch (type) {
      case "bug":
      case "bug_crash": {
        // --- ARCADE BEETLE / BUG ---
        const isCrash = type === "bug_crash";
        const primaryColor = isCrash ? "#dc2626" : "#ef4444";
        const shadowCol = isCrash ? "#ef4444" : "#f87171";

        // 1. Legs (6 articulated arcade legs)
        const legWobble = Math.sin(t * 8) * 2.5;
        ctx.strokeStyle = "#450a0a";
        ctx.lineWidth = 2.5 * scale;
        ctx.lineCap = "round";
        for (let i = -1; i <= 1; i++) {
          const ly = i * (R * 0.42);
          const dir = i === 0 ? 0 : (i > 0 ? 1 : -1);
          // Left leg
          ctx.beginPath();
          ctx.moveTo(-R * 0.5, ly);
          ctx.lineTo(-R * 0.9, ly + dir * 4 + legWobble);
          ctx.lineTo(-R * 1.25, ly + dir * 10 - legWobble);
          ctx.stroke();
          // Right leg
          ctx.beginPath();
          ctx.moveTo(R * 0.5, ly);
          ctx.lineTo(R * 0.9, ly + dir * 4 - legWobble);
          ctx.lineTo(R * 1.25, ly + dir * 10 + legWobble);
          ctx.stroke();
        }

        // 2. Carapace (Glossy Red Shell)
        ctx.shadowColor = shadowCol;
        ctx.shadowBlur = isFever ? 18 : 10;
        const shellGrad = ctx.createRadialGradient(-R * 0.25, -R * 0.2, R * 0.2, 0, 0, R);
        shellGrad.addColorStop(0, "#fca5a5");
        shellGrad.addColorStop(0.3, primaryColor);
        shellGrad.addColorStop(1, "#7f1d1d");

        ctx.fillStyle = shellGrad;
        ctx.beginPath();
        ctx.ellipse(0, R * 0.1, R * 0.78, R * 0.95, 0, 0, Math.PI * 2);
        ctx.fill();

        // Shell Seam
        ctx.shadowBlur = 0;
        ctx.strokeStyle = "#450a0a";
        ctx.lineWidth = 1.8 * scale;
        ctx.beginPath();
        ctx.moveTo(0, -R * 0.3);
        ctx.lineTo(0, R * 0.95);
        ctx.stroke();

        // Gloss highlight
        ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
        ctx.beginPath();
        ctx.ellipse(-R * 0.32, -R * 0.2, R * 0.22, R * 0.38, -0.4, 0, Math.PI * 2);
        ctx.fill();

        // 3. Head & Eyes
        ctx.fillStyle = "#1e1b4b";
        ctx.beginPath();
        ctx.arc(0, -R * 0.55, R * 0.46, Math.PI, Math.PI * 2);
        ctx.fill();

        // Expressive Angled Eyes
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.ellipse(-R * 0.22, -R * 0.62, R * 0.14, R * 0.18, 0.2, 0, Math.PI * 2);
        ctx.ellipse(R * 0.22, -R * 0.62, R * 0.14, R * 0.18, -0.2, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = isCrash ? "#fbbf24" : "#06b6d4";
        ctx.beginPath();
        ctx.arc(-R * 0.22, -R * 0.62, R * 0.08, 0, Math.PI * 2);
        ctx.arc(R * 0.22, -R * 0.62, R * 0.08, 0, Math.PI * 2);
        ctx.fill();

        // 4. Antennae
        ctx.strokeStyle = "#1e1b4b";
        ctx.lineWidth = 2 * scale;
        const antWobble = Math.sin(t * 10) * 3;
        // Left antenna
        ctx.beginPath();
        ctx.moveTo(-R * 0.2, -R * 0.85);
        ctx.quadraticCurveTo(-R * 0.5, -R * 1.25, -R * 0.7 + antWobble, -R * 1.35);
        ctx.stroke();
        // Right antenna
        ctx.beginPath();
        ctx.moveTo(R * 0.2, -R * 0.85);
        ctx.quadraticCurveTo(R * 0.5, -R * 1.25, R * 0.7 - antWobble, -R * 1.35);
        ctx.stroke();

        // Glowing Antenna Bulbs
        ctx.fillStyle = isCrash ? "#fbbf24" : "#f59e0b";
        ctx.beginPath();
        ctx.arc(-R * 0.7 + antWobble, -R * 1.35, 3.5 * scale, 0, Math.PI * 2);
        ctx.arc(R * 0.7 - antWobble, -R * 1.35, 3.5 * scale, 0, Math.PI * 2);
        ctx.fill();

        // Crash Mode: Yellow Lightning Bolt across Carapace
        if (isCrash) {
          ctx.strokeStyle = "#fef08a";
          ctx.lineWidth = 2.5 * scale;
          ctx.shadowColor = "#facc15";
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.moveTo(-R * 0.35, -R * 0.1);
          ctx.lineTo(R * 0.1, R * 0.15);
          ctx.lineTo(-R * 0.1, R * 0.4);
          ctx.lineTo(R * 0.3, R * 0.75);
          ctx.stroke();
        }
        break;
      }

      case "deadline": {
        // --- RETRO ALARM CLOCK (23:59) ---
        const clockColor = "#ea580c";
        const ringShake = Math.sin(t * 26) * 1.5;

        ctx.translate(ringShake, 0);

        // 1. Clock Feet
        ctx.fillStyle = "#94a3b8";
        ctx.beginPath();
        ctx.rect(-R * 0.65, R * 0.7, R * 0.25, R * 0.35);
        ctx.rect(R * 0.4, R * 0.7, R * 0.25, R * 0.35);
        ctx.fill();

        // 2. Twin Ringing Bells on Top
        ctx.fillStyle = "#f97316";
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 1.5 * scale;

        // Left Bell
        ctx.save();
        ctx.translate(-R * 0.62, -R * 0.7);
        ctx.rotate(-0.55);
        ctx.beginPath();
        ctx.arc(0, 0, R * 0.35, Math.PI, Math.PI * 2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        // Right Bell
        ctx.save();
        ctx.translate(R * 0.62, -R * 0.7);
        ctx.rotate(0.55);
        ctx.beginPath();
        ctx.arc(0, 0, R * 0.35, Math.PI, Math.PI * 2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        // Hammer between bells
        ctx.strokeStyle = "#cbd5e1";
        ctx.lineWidth = 2 * scale;
        const hammerWobble = Math.sin(t * 26) * (R * 0.18);
        ctx.beginPath();
        ctx.moveTo(0, -R * 0.7);
        ctx.lineTo(hammerWobble, -R * 0.95);
        ctx.stroke();
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(hammerWobble, -R * 0.95, 3 * scale, 0, Math.PI * 2);
        ctx.fill();

        // Soundwave ripples
        ctx.strokeStyle = "rgba(249, 115, 22, 0.6)";
        ctx.lineWidth = 2 * scale;
        ctx.beginPath();
        ctx.arc(-R * 0.9, -R * 0.8, R * 0.3, Math.PI * 0.8, Math.PI * 1.5);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(R * 0.9, -R * 0.8, R * 0.3, -Math.PI * 0.5, Math.PI * 0.2);
        ctx.stroke();

        // 3. Main Clock Body
        ctx.shadowColor = "#f97316";
        ctx.shadowBlur = isFever ? 18 : 10;
        const bodyGrad = ctx.createRadialGradient(-R * 0.2, -R * 0.2, R * 0.1, 0, 0, R);
        bodyGrad.addColorStop(0, "#fb923c");
        bodyGrad.addColorStop(0.7, clockColor);
        bodyGrad.addColorStop(1, "#9a3412");
        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        ctx.arc(0, 0, R * 0.85, 0, Math.PI * 2);
        ctx.fill();

        // White Dial Face
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(0, 0, R * 0.65, 0, Math.PI * 2);
        ctx.fill();

        // Chrome Ring
        ctx.strokeStyle = "#fed7aa";
        ctx.lineWidth = 2 * scale;
        ctx.stroke();

        // Tick marks (12, 3, 6, 9)
        ctx.strokeStyle = "#334155";
        ctx.lineWidth = 2 * scale;
        for (let a = 0; a < 4; a++) {
          const ang = (a * Math.PI) / 2;
          ctx.beginPath();
          ctx.moveTo(Math.cos(ang) * R * 0.52, Math.sin(ang) * R * 0.52);
          ctx.lineTo(Math.cos(ang) * R * 0.62, Math.sin(ang) * R * 0.62);
          ctx.stroke();
        }

        // Clock Hands at 23:59 (Urgent!)
        ctx.strokeStyle = "#0f172a";
        ctx.lineWidth = 2.5 * scale;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-R * 0.1, -R * 0.38);
        ctx.stroke();

        // Minute Hand -> pointing at 59 (-6 deg)
        ctx.strokeStyle = "#0f172a";
        ctx.lineWidth = 2 * scale;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-R * 0.04, -R * 0.52);
        ctx.stroke();

        // Red Second Hand -> ticking
        const secAng = (t * 8) % (Math.PI * 2);
        ctx.strokeStyle = "#ef4444";
        ctx.lineWidth = 1.2 * scale;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(secAng) * R * 0.52, Math.sin(secAng) * R * 0.52);
        ctx.stroke();

        // Center Pin
        ctx.fillStyle = "#ef4444";
        ctx.beginPath();
        ctx.arc(0, 0, 2.5 * scale, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case "coffee": {
        // --- TAKEAWAY COFFEE CUP (FPTU BOOST) ---
        // 1. Steam Wisps rising above lid
        ctx.strokeStyle = "rgba(6, 182, 212, 0.75)";
        ctx.lineWidth = 2 * scale;
        ctx.lineCap = "round";
        for (let s = -1; s <= 1; s++) {
          const sx = s * (R * 0.3);
          const sy = -R * 0.75;
          const wPhase = t * 4 + s * 1.5;
          const curve1 = Math.sin(wPhase) * (R * 0.2);
          const curve2 = Math.cos(wPhase) * (R * 0.2);
          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.bezierCurveTo(sx + curve1, sy - R * 0.3, sx + curve2, sy - R * 0.6, sx + curve1, sy - R * 0.85);
          ctx.stroke();
        }

        // 2. Cup Body (Trapezoid)
        ctx.shadowColor = "#06b6d4";
        ctx.shadowBlur = isFever ? 18 : 8;

        const topW = R * 0.7;
        const botW = R * 0.5;
        const cupH = R * 1.2;
        const cupTopY = -R * 0.5;
        const cupBotY = cupTopY + cupH;

        const cupGrad = ctx.createLinearGradient(-topW, 0, topW, 0);
        cupGrad.addColorStop(0, "#e2e8f0");
        cupGrad.addColorStop(0.35, "#ffffff");
        cupGrad.addColorStop(1, "#cbd5e1");

        ctx.fillStyle = cupGrad;
        ctx.beginPath();
        ctx.moveTo(-topW, cupTopY);
        ctx.lineTo(topW, cupTopY);
        ctx.lineTo(botW, cupBotY);
        ctx.lineTo(-botW, cupBotY);
        ctx.closePath();
        ctx.fill();

        // 3. Cardboard Heat Sleeve (Amber)
        ctx.shadowBlur = 0;
        const slvTopY = cupTopY + cupH * 0.28;
        const slvBotY = cupTopY + cupH * 0.72;
        const slvTopW = topW - (topW - botW) * 0.28;
        const slvBotW = topW - (topW - botW) * 0.72;

        const slvGrad = ctx.createLinearGradient(-slvTopW, 0, slvTopW, 0);
        slvGrad.addColorStop(0, "#b45309");
        slvGrad.addColorStop(0.5, "#f59e0b");
        slvGrad.addColorStop(1, "#92400e");
        ctx.fillStyle = slvGrad;
        ctx.beginPath();
        ctx.moveTo(-slvTopW, slvTopY);
        ctx.lineTo(slvTopW, slvTopY);
        ctx.lineTo(slvBotW, slvBotY);
        ctx.lineTo(-slvBotW, slvBotY);
        ctx.closePath();
        ctx.fill();

        // Sleeve Mascot Icon
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(0, (slvTopY + slvBotY) / 2, R * 0.16, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#b45309";
        ctx.font = `bold ${Math.round(8 * scale)}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("D", 0, (slvTopY + slvBotY) / 2 + 0.5);

        // 4. Cup Lid (Cyan plastic cap)
        ctx.fillStyle = "#0891b2";
        ctx.beginPath();
        ctx.roundRect(-topW * 1.08, cupTopY - R * 0.18, topW * 2.16, R * 0.22, 3);
        ctx.fill();
        // Sipping Spout
        ctx.fillStyle = "#06b6d4";
        ctx.beginPath();
        ctx.roundRect(-topW * 0.35, cupTopY - R * 0.3, topW * 0.7, R * 0.14, 2);
        ctx.fill();
        break;
      }

      case "clean_code":
      case "pr_merged": {
        // --- SPARKLING EMERALD GIT CRYSTAL / GEM ---
        ctx.shadowColor = "#10b981";
        ctx.shadowBlur = isFever ? 20 : 12;

        // Gem shape (Brilliant hexagonal cut)
        const gemGrad = ctx.createLinearGradient(-R * 0.7, -R * 0.7, R * 0.7, R * 0.7);
        gemGrad.addColorStop(0, "#6ee7b7");
        gemGrad.addColorStop(0.35, "#10b981");
        gemGrad.addColorStop(1, "#047857");

        ctx.fillStyle = gemGrad;
        ctx.beginPath();
        ctx.moveTo(0, -R * 0.95);
        ctx.lineTo(R * 0.85, -R * 0.38);
        ctx.lineTo(R * 0.7, R * 0.7);
        ctx.lineTo(0, R * 0.98);
        ctx.lineTo(-R * 0.7, R * 0.7);
        ctx.lineTo(-R * 0.85, -R * 0.38);
        ctx.closePath();
        ctx.fill();

        // Facet lines
        ctx.shadowBlur = 0;
        ctx.strokeStyle = "rgba(255, 255, 255, 0.55)";
        ctx.lineWidth = 1.6 * scale;
        ctx.beginPath();
        // Inner diamond facet
        ctx.moveTo(0, -R * 0.45);
        ctx.lineTo(R * 0.45, 0);
        ctx.lineTo(0, R * 0.55);
        ctx.lineTo(-R * 0.45, 0);
        ctx.closePath();
        ctx.stroke();

        // Facet connectors to outer vertices
        ctx.beginPath();
        ctx.moveTo(0, -R * 0.95); ctx.lineTo(0, -R * 0.45);
        ctx.moveTo(R * 0.85, -R * 0.38); ctx.lineTo(R * 0.45, 0);
        ctx.moveTo(R * 0.7, R * 0.7); ctx.lineTo(0, R * 0.55);
        ctx.moveTo(0, R * 0.98); ctx.lineTo(0, R * 0.55);
        ctx.moveTo(-R * 0.7, R * 0.7); ctx.lineTo(0, R * 0.55);
        ctx.moveTo(-R * 0.85, -R * 0.38); ctx.lineTo(-R * 0.45, 0);
        ctx.stroke();

        // Git Branch Icon in Center
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2.2 * scale;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(-R * 0.18, R * 0.3);
        ctx.lineTo(-R * 0.18, -R * 0.25);
        ctx.stroke();

        // Branch curve
        ctx.beginPath();
        ctx.moveTo(-R * 0.18, R * 0.05);
        ctx.quadraticCurveTo(0, -R * 0.05, R * 0.2, -R * 0.2);
        ctx.stroke();

        // Commit dots
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(-R * 0.18, -R * 0.25, 2.5 * scale, 0, Math.PI * 2);
        ctx.arc(-R * 0.18, R * 0.3, 2.5 * scale, 0, Math.PI * 2);
        ctx.arc(R * 0.2, -R * 0.2, 2.5 * scale, 0, Math.PI * 2);
        ctx.fill();

        // Twinkle sparkle at corner
        const twPhase = (t * 5) % (Math.PI * 2);
        const twSize = (Math.sin(twPhase) + 1) * 3 * scale;
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(R * 0.55, -R * 0.6, twSize, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case "star": {
        // --- 5-POINTED GOLDEN ARCADE STAR ---
        ctx.shadowColor = "#f59e0b";
        ctx.shadowBlur = isFever ? 22 : 14;

        const starGrad = ctx.createRadialGradient(0, 0, R * 0.1, 0, 0, R);
        starGrad.addColorStop(0, "#fef08a");
        starGrad.addColorStop(0.5, "#facc15");
        starGrad.addColorStop(1, "#d97706");
        ctx.fillStyle = starGrad;

        ctx.beginPath();
        const numPoints = 5;
        const outerR = R * 1.05;
        const innerR = R * 0.48;
        for (let i = 0; i < numPoints * 2; i++) {
          const r = i % 2 === 0 ? outerR : innerR;
          const a = (i * Math.PI) / numPoints - Math.PI / 2;
          const px = Math.cos(a) * r;
          const py = Math.sin(a) * r;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();

        ctx.shadowBlur = 0;
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1.8 * scale;
        ctx.stroke();

        // 3D Bevel Facet Shading
        ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
        for (let i = 0; i < numPoints; i++) {
          const aTip = (i * 2 * Math.PI) / numPoints - Math.PI / 2;
          const aInner = ((i * 2 + 1) * Math.PI) / numPoints - Math.PI / 2;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(Math.cos(aTip) * outerR, Math.sin(aTip) * outerR);
          ctx.lineTo(Math.cos(aInner) * innerR, Math.sin(aInner) * innerR);
          ctx.closePath();
          ctx.fill();
        }

        // Cute Arcade Star Eyes
        ctx.fillStyle = "#0f172a";
        ctx.beginPath();
        ctx.ellipse(-R * 0.18, R * 0.05, 2 * scale, 4.5 * scale, 0, 0, Math.PI * 2);
        ctx.ellipse(R * 0.18, R * 0.05, 2 * scale, 4.5 * scale, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(-R * 0.18, R * 0.02, 1.2 * scale, 0, Math.PI * 2);
        ctx.arc(R * 0.18, R * 0.02, 1.2 * scale, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case "nitro": {
        // --- SCI-FI NOS ROCKET CANISTER ---
        ctx.shadowColor = "#0284c7";
        ctx.shadowBlur = isFever ? 20 : 12;

        const canW = R * 0.7;
        const canH = R * 1.35;
        const canY = -canH / 2;

        // Canister Body
        const canGrad = ctx.createLinearGradient(-canW, 0, canW, 0);
        canGrad.addColorStop(0, "#0369a1");
        canGrad.addColorStop(0.35, "#38bdf8");
        canGrad.addColorStop(0.7, "#0284c7");
        canGrad.addColorStop(1, "#0c4a6e");
        ctx.fillStyle = canGrad;

        ctx.beginPath();
        ctx.roundRect(-canW, canY, canW * 2, canH, [R * 0.35, R * 0.35, R * 0.25, R * 0.25]);
        ctx.fill();

        // Silver Valve Cap
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#cbd5e1";
        ctx.beginPath();
        ctx.roundRect(-canW * 0.5, canY - R * 0.25, canW, R * 0.28, 2);
        ctx.fill();
        ctx.fillStyle = "#e2e8f0";
        ctx.fillRect(-canW * 0.2, canY - R * 0.4, canW * 0.4, R * 0.18);

        // Neon Glow Energy Bands
        ctx.strokeStyle = "rgba(6, 182, 212, 0.9)";
        ctx.lineWidth = 2 * scale;
        ctx.beginPath();
        ctx.moveTo(-canW, canY + canH * 0.25); ctx.lineTo(canW, canY + canH * 0.25);
        ctx.moveTo(-canW, canY + canH * 0.75); ctx.lineTo(canW, canY + canH * 0.75);
        ctx.stroke();

        // Center Lightning Bolt (NOS Energy)
        ctx.fillStyle = "#fef08a";
        ctx.shadowColor = "#facc15";
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.moveTo(canW * 0.1, canY + canH * 0.3);
        ctx.lineTo(-canW * 0.3, canY + canH * 0.55);
        ctx.lineTo(canW * 0.05, canY + canH * 0.55);
        ctx.lineTo(-canW * 0.1, canY + canH * 0.8);
        ctx.lineTo(canW * 0.35, canY + canH * 0.5);
        ctx.lineTo(canW * 0.02, canY + canH * 0.5);
        ctx.closePath();
        ctx.fill();
        break;
      }

      case "grade_f": {
        // --- FIERY GRADE F STAMP / EMBLEM ---
        ctx.shadowColor = "#ef4444";
        ctx.shadowBlur = isFever ? 18 : 10;

        // Burning Octagonal Seal
        const sealGrad = ctx.createRadialGradient(0, 0, R * 0.2, 0, 0, R);
        sealGrad.addColorStop(0, "#f87171");
        sealGrad.addColorStop(0.7, "#dc2626");
        sealGrad.addColorStop(1, "#7f1d1d");
        ctx.fillStyle = sealGrad;

        ctx.beginPath();
        const sides = 8;
        for (let i = 0; i < sides; i++) {
          const a = (i * 2 * Math.PI) / sides;
          const px = Math.cos(a) * R * 0.95;
          const py = Math.sin(a) * R * 0.95;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();

        ctx.shadowBlur = 0;
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2 * scale;
        ctx.stroke();

        // Bold Varsity Letter 'F'
        ctx.fillStyle = "#ffffff";
        ctx.font = `900 ${Math.round(R * 1.1)}px 'Space Grotesk', 'Be Vietnam Pro', sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("F", 0, R * 0.04);
        break;
      }

      case "conflict": {
        // --- GIT MERGE CONFLICT (Crossed Warning Blades) ---
        ctx.shadowColor = "#f97316";
        ctx.shadowBlur = 12;

        ctx.fillStyle = "#ea580c";
        ctx.beginPath();
        ctx.arc(0, 0, R * 0.85, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0;
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2.5 * scale;
        ctx.stroke();

        // Crossed warning blades
        ctx.strokeStyle = "#fef08a";
        ctx.lineWidth = 3.5 * scale;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(-R * 0.45, -R * 0.45); ctx.lineTo(R * 0.45, R * 0.45);
        ctx.moveTo(R * 0.45, -R * 0.45); ctx.lineTo(-R * 0.45, R * 0.45);
        ctx.stroke();

        // Center Impact Flare
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(0, 0, R * 0.18, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case "drop_db": {
        // --- DROP DATABASE (Fractured Server Cylinder) ---
        ctx.shadowColor = "#dc2626";
        ctx.shadowBlur = 12;

        const cylW = R * 0.85;
        const cylH = R * 1.2;
        const cyTop = -cylH / 2;

        // 3-Tier Cylinder Stack
        for (let tier = 0; tier < 3; tier++) {
          const ty = cyTop + tier * (cylH * 0.33);
          const tH = cylH * 0.28;

          ctx.fillStyle = tier === 1 ? "#7f1d1d" : "#991b1b";
          ctx.beginPath();
          ctx.roundRect(-cylW, ty, cylW * 2, tH, 3);
          ctx.fill();

          // Server LED
          ctx.fillStyle = tier === 1 ? "#ef4444" : "#10b981";
          ctx.beginPath();
          ctx.arc(cylW * 0.65, ty + tH / 2, 2.5 * scale, 0, Math.PI * 2);
          ctx.fill();
        }

        // Glowing Fissure Crack through center
        ctx.shadowBlur = 0;
        ctx.strokeStyle = "#fef08a";
        ctx.lineWidth = 2 * scale;
        ctx.beginPath();
        ctx.moveTo(-cylW * 0.2, cyTop);
        ctx.lineTo(cylW * 0.1, cyTop + cylH * 0.45);
        ctx.lineTo(-cylW * 0.15, cyTop + cylH * 0.7);
        ctx.lineTo(cylW * 0.25, cyTop + cylH);
        ctx.stroke();
        break;
      }

      default: {
        ctx.beginPath();
        ctx.arc(0, 0, R, 0, Math.PI * 2);
        ctx.fillStyle = it.color || "#f59e0b";
        ctx.shadowColor = it.color || "#f59e0b";
        ctx.shadowBlur = 12;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = "#ffffff";
        ctx.font = `bold ${Math.round(10 * scale)}px 'JetBrains Mono', monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(it.label || "?", 0, 1);
        break;
      }
    }

    ctx.restore();
  }
}

