// FU-DEVER BUG DASH - Canvas 2D Pseudo-3D Perspective & Arcade Renderer
// High-performance neo-arcade visual craftsmanship with FPTU Cyberpunk Skyline and dynamic road banking.

import { GAME_CONFIG, ASSET_PATHS } from "../config.js";

export class RoadRenderer {
  constructor(canvasElement) {
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext("2d");
    this.roadOffset = 0;
    this.shake = 0;

    // Horizon & Perspective Constants
    this.HORIZON_Y = 160;
    this.VANISHING_X = 320;
    this.roadCurve = 0;
    this.totalTime = 0;

    // Dynamic Tire Trails & Drift Slipstream
    this.tireTrails = [];
    this.cameraRoll = 0;

    // Preload Mascot Sprites (safe in both Browser and Node.js headless test)
    const ImageCtor = (typeof Image !== "undefined") ? Image : class { constructor() { this.src = ""; this.complete = false; } };
    this.sprites = {
      running: new ImageCtor(),
      dead: new ImageCtor(),
      champion: new ImageCtor(),
      player3dRun: new ImageCtor(),
      player3dRunF1: new ImageCtor(),
      player3dRunF2: new ImageCtor(),
      player3dJump: new ImageCtor(),
      player3dSlide: new ImageCtor(),
      player3dBankLeft: new ImageCtor(),
      player3dBankRight: new ImageCtor(),
      item3dStar: new ImageCtor(),
      item3dCoffee: new ImageCtor(),
      item3dGem: new ImageCtor(),
      item3dBug: new ImageCtor(),
      item3dDeadline: new ImageCtor()
    };
    this.sprites.running.src = ASSET_PATHS.playerRunning;
    this.sprites.dead.src = ASSET_PATHS.playerDead;
    this.sprites.champion.src = ASSET_PATHS.buggyChampion;
    this.sprites.player3dRun.src = ASSET_PATHS.player3dRun;
    this.sprites.player3dRunF1.src = ASSET_PATHS.player3dRunF1;
    this.sprites.player3dRunF2.src = ASSET_PATHS.player3dRunF2;
    this.sprites.player3dJump.src = ASSET_PATHS.player3dJump;
    this.sprites.player3dSlide.src = ASSET_PATHS.player3dSlide;
    this.sprites.player3dBankLeft.src = ASSET_PATHS.player3dBankLeft;
    this.sprites.player3dBankRight.src = ASSET_PATHS.player3dBankRight;
    this.sprites.item3dStar.src = ASSET_PATHS.item3dStar;
    this.sprites.item3dCoffee.src = ASSET_PATHS.item3dCoffee;
    this.sprites.item3dGem.src = ASSET_PATHS.item3dGem;
    this.sprites.item3dBug.src = ASSET_PATHS.item3dBug;
    this.sprites.item3dDeadline.src = ASSET_PATHS.item3dDeadline;

    // Precompute Static Cyberpunk Starfield (60 stars, zero GC allocation)
    this.stars = [];
    let seed = 42;
    const pseudoRand = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };
    const colors = ["#ffffff", "#67e8f9", "#fde047", "#a5f3fc", "#fef08a"];
    for (let i = 0; i < 60; i++) {
      this.stars.push({
        x: Math.round(pseudoRand() * 640),
        y: Math.round(pseudoRand() * (this.HORIZON_Y - 18) + 4),
        r: pseudoRand() * 1.5 + 0.6,
        baseAlpha: pseudoRand() * 0.5 + 0.45,
        twinkleSpeed: pseudoRand() * 2.8 + 1.2,
        phase: pseudoRand() * Math.PI * 2,
        color: colors[Math.floor(pseudoRand() * colors.length)]
      });
    }

    // Precompute Static Silhouette Geometry of FPTU Campus & Da Nang City
    this.buildings = [
      // FPT Complex Building (Oval high-tech curves on the left)
      { type: "complex", x: 20, w: 90, h: 58, ledColor: "#06b6d4" },
      { type: "tower", x: 120, w: 28, h: 88, ledColor: "#10b981", antennaH: 26 },
      // Icon: FPT University Da Nang - Tòa Alpha (Origami Chevron Geometry)
      { type: "alpha", x: 165, w: 145, h: 102, ledColor: "#f26f21" },
      // Central Tech Telecom Tower with blinking beacon
      { type: "telecom", x: 316, w: 8, h: 115, beaconColor: "#ef4444" },
      // Da Nang Dragon Bridge Synthwave Arch on the right
      { type: "dragon_bridge", x: 345, w: 160, h: 52, ledColor: "#f59e0b" },
      // Coastal Cyber Towers
      { type: "tower", x: 520, w: 34, h: 74, ledColor: "#06b6d4", antennaH: 18 },
      { type: "tower", x: 570, w: 52, h: 62, ledColor: "#f26f21", antennaH: 12 }
    ];
  }

  triggerShake(intensity = 1.0) {
    this.shake = intensity;
  }

  /**
   * Non-linear Perspective Scale from Horizon (y=160, s=0.32) to Player (y=600, s=1.0)
   */
  getPerspectiveScale(y) {
    if (y <= this.HORIZON_Y) return 0.32;
    const u = (y - this.HORIZON_Y) / 440; // u=1.0 exactly at y=600 (player baseline)
    return 0.32 + 0.68 * Math.pow(Math.max(0, u), 1.25);
  }

  /**
   * Parabolic Road Curvature Offset: Max deflection at horizon, strictly 0 at player baseline
   */
  getCurveOffset(y, scale) {
    const inv = Math.max(0, 1.0 - scale);
    return this.roadCurve * (inv * inv) * 92;
  }

  /**
   * Map logical game coordinates (X: 130..510) to 3D perspective screen coordinates
   */
  getScreenPos(logicX, logicY) {
    const scale = this.getPerspectiveScale(logicY);
    const curve = this.getCurveOffset(logicY, scale);
    const screenX = this.VANISHING_X + (logicX - this.VANISHING_X) * scale + curve;
    return { x: screenX, y: logicY, scale };
  }

  /**
   * Main Neo-Arcade 60 FPS Render Pipeline
   */
  render(dt, playerX, targetX, currentLane, items, particleSystem, isBuffed, isGameOver, isInvulnerable = false, isFever = false, steeringMode = "snap3", opponentData = null, gameMode = "classic", jumpState = null, slideState = null, extraData = null) {
    const W = this.canvas.width;
    const H = this.canvas.height;
    const ctx = this.ctx;
    this.totalTime += dt;

    ctx.save();

    // 1. Camera Shake calculation
    if (this.shake > 0) {
      const sx = (Math.random() - 0.5) * this.shake * 12;
      const sy = (Math.random() - 0.5) * this.shake * 12;
      ctx.translate(sx, sy);
      this.shake = Math.max(0, this.shake - dt * 2.5);
    }

    // Special Dispatch: Slicer Mode
    if (gameMode === "slicer") {
      this.renderSlicer(ctx, W, H, dt, items, particleSystem, extraData && extraData.bladeTrail, isFever, isGameOver);
      ctx.restore();
      return;
    }

    // Special Dispatch: Flappy Buggy Mode
    if (gameMode === "flappy") {
      this.renderFlappy(
        ctx, W, H, dt, playerX,
        extraData && extraData.flappyY,
        extraData && extraData.flappyVy,
        items, particleSystem, isGameOver, isInvulnerable,
        extraData && extraData.flappyTargetY,
        extraData && extraData.inputSource
      );
      ctx.restore();
      return;
    }

    // Special Dispatch: Reactor Rush Mode (STEM Fair 2026)
    if (gameMode === "reactor" && extraData && extraData.reactorEngine) {
      extraData.reactorEngine.render(ctx, W, H, dt);
      ctx.restore();
      return;
    }

    // Smooth Dynamic Road Curvature & Banking (Classic / Highway / Catcher / Duel)
    const steerOffset = (playerX - this.VANISHING_X) / 190;
    const dynamicLean = (targetX - playerX) * 0.006;
    const targetCurve = Math.max(-1.0, Math.min(1.0, steerOffset * 0.65 + dynamicLean * 0.35));
    this.roadCurve += (targetCurve - this.roadCurve) * Math.min(1.0, dt * 7.5);

    // Temple Run & Minion Rush: Dynamic Camera Lateral Roll when steering
    const targetRoll = (targetX - playerX) * 0.00035;
    this.cameraRoll += (targetRoll - this.cameraRoll) * Math.min(1.0, dt * 8.0);
    ctx.translate(W / 2, H / 2);
    ctx.rotate(this.cameraRoll);
    ctx.translate(-W / 2, -H / 2);

    // 2. Parallax Cyberpunk FPTU Skyline & Retro Sun
    this.drawCyberpunkSkyline(ctx, W, this.HORIZON_Y, isFever);

    // 3. Pseudo-3D Perspective Road & Rumble Strips
    const roadSpeed = (steeringMode === "highway") ? 620 : (isFever ? 540 : 420);
    this.roadOffset = (this.roadOffset + roadSpeed * dt) % 64;
    this.drawPerspectiveRoad(ctx, W, H, isFever, steeringMode, currentLane, playerX);

    // 4. Render Falling Items (Perspective Scaled)
    // Sort items by Y so farther items are drawn behind closer items
    const sortedItems = items.slice().sort((a, b) => a.y - b.y);
    sortedItems.forEach(it => {
      const sp = this.getScreenPos(it.x, it.y);
      const effectiveScale = sp.scale * (it.scale || 1.0);

      ctx.save();
      ctx.translate(sp.x, sp.y);

      // Perspective Ground Shadow for falling item
      const itemR = (it.radius || 24) * effectiveScale;
      ctx.beginPath();
      ctx.ellipse(0, itemR * 0.85, itemR * 0.75, itemR * 0.28, 0, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
      ctx.fill();

      // Atmospheric Depth Haze (fades in as item approaches)
      if (it.y < this.HORIZON_Y + 120) {
        ctx.globalAlpha = Math.min(1.0, Math.max(0.4, (it.y - this.HORIZON_Y + 30) / 120));
      }

      this.drawArcadeItem(ctx, it, isFever, effectiveScale);
      ctx.restore();
    });

    // 5. Render Mascot Buggy (Player)
    const playerY = GAME_CONFIG.playerY;
    const pSize = GAME_CONFIG.playerSize;

    // Jump & Slide Physics
    let jumpOffsetY = 0;
    let jumpScale = 1.0;
    let shadowScale = 1.0;
    if (jumpState && jumpState.isJumping) {
      const p = jumpState.progress || 0;
      jumpOffsetY = -Math.sin(p * Math.PI) * 75; // Peak 75px vertical leap
      jumpScale = 1 + Math.sin(p * Math.PI) * 0.16;
      shadowScale = Math.max(0.35, 1 - Math.sin(p * Math.PI) * 0.58);
    }

    let slideScaleX = 1.0;
    let slideScaleY = 1.0;
    let slideOffsetY = 0;
    if (slideState && slideState.isSliding) {
      const p = slideState.progress || 0;
      const crouchFactor = Math.sin(p * Math.PI);
      slideScaleX = 1 + crouchFactor * 0.35; // Widens while sliding
      slideScaleY = 1 - crouchFactor * 0.52; // Compresses to ~48% height
      slideOffsetY = crouchFactor * 22; // Drops closer to road
    }

    // Dynamic Ground Shadow at base playerY
    ctx.save();
    ctx.translate(playerX, playerY + pSize * 0.38);
    ctx.beginPath();
    ctx.ellipse(0, 0, (pSize * 0.40) * shadowScale, (pSize * 0.14) * shadowScale, 0, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
    ctx.fill();

    // High-Tech Neon Underglow (Reflective Ground Lighting)
    const underglowCol = isFever ? "#f59e0b" : (isBuffed ? "#06b6d4" : "#f26f21");
    const ugRadius = (pSize * 0.48) * shadowScale;
    const underglowGrad = ctx.createRadialGradient(0, 0, ugRadius * 0.2, 0, 0, ugRadius);
    underglowGrad.addColorStop(0, underglowCol);
    underglowGrad.addColorStop(1, "transparent");
    ctx.fillStyle = underglowGrad;
    ctx.globalAlpha = isFever ? 0.65 : 0.35;
    ctx.beginPath();
    ctx.ellipse(0, 0, ugRadius, ugRadius * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Tire Drift Slipstream History
    if (this.tireTrails.length > 10) this.tireTrails.shift();
    this.tireTrails.push({ x: playerX, y: playerY + slideOffsetY, isFever, isBuffed, alpha: 1.0 });

    ctx.save();
    for (let i = 0; i < this.tireTrails.length - 1; i++) {
      const t1 = this.tireTrails[i];
      const t2 = this.tireTrails[i + 1];
      const fade = (i / this.tireTrails.length) * 0.45;
      ctx.strokeStyle = isFever ? `rgba(245, 158, 11, ${fade})` : `rgba(6, 182, 212, ${fade})`;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(t1.x - 22, t1.y + 36);
      ctx.lineTo(t2.x - 22, t2.y + 36);
      ctx.moveTo(t1.x + 22, t1.y + 36);
      ctx.lineTo(t2.x + 22, t2.y + 36);
      ctx.stroke();
    }
    ctx.restore();

    // Catcher Minigame: Render High-Tech PR Collector Basket
    if (gameMode === "catcher") {
      ctx.save();
      ctx.translate(playerX, playerY + jumpOffsetY + slideOffsetY - pSize * 0.42);
      ctx.strokeStyle = "#10b981";
      ctx.lineWidth = 3;
      ctx.shadowColor = "#10b981";
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.arc(0, 0, 52, Math.PI * 0.15, Math.PI * 0.85, false);
      ctx.stroke();

      // Collector Tray Neon Base
      ctx.fillStyle = "rgba(16, 185, 129, 0.25)";
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

    // Draw 3D Stylized Buggy Mascot with Minion Run Wobble & dynamic action states
    ctx.save();
    
    // Minion-style run bob & wobble
    const isAction = (jumpState && jumpState.isJumping) || (slideState && slideState.isSliding) || isGameOver;
    const runBob = isAction ? 0 : Math.abs(Math.sin(this.totalTime * 14)) * 3.5;
    const runWobble = isAction ? 0 : Math.sin(this.totalTime * 14) * 0.035;

    ctx.translate(playerX, playerY + jumpOffsetY + slideOffsetY - runBob);

    const moveDiff = targetX - playerX;
    const tilt = Math.max(-0.25, Math.min(0.25, moveDiff * 0.003 - this.roadCurve * 0.08));
    ctx.rotate(tilt + runWobble);

    const squashX = (1 + Math.abs(tilt) * 0.30) * slideScaleX * jumpScale;
    const stretchY = (1 - Math.abs(tilt) * 0.15) * slideScaleY * jumpScale;
    ctx.scale(squashX, stretchY);

    // 3D Soft Contact Drop Shadow (under feet)
    if (!jumpState || !jumpState.isJumping) {
      ctx.save();
      ctx.translate(0, pSize * 0.44);
      ctx.scale(1.0, 0.28);
      ctx.beginPath();
      ctx.arc(0, 0, pSize * 0.38, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0, 0, 0, 0.42)";
      ctx.fill();
      ctx.restore();
    }

    // Slide Skid Sparks & Jump Air Swoosh
    if (slideState && slideState.isSliding) {
      ctx.strokeStyle = "rgba(245, 158, 11, 0.85)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-pSize * 0.35, pSize * 0.35);
      ctx.lineTo(-pSize * 0.60, pSize * 0.45);
      ctx.moveTo(pSize * 0.35, pSize * 0.35);
      ctx.lineTo(pSize * 0.60, pSize * 0.45);
      ctx.stroke();
    }
    if (jumpState && jumpState.isJumping) {
      ctx.strokeStyle = "rgba(6, 182, 212, 0.75)";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, pSize * 0.45, pSize * 0.36, Math.PI * 0.2, Math.PI * 0.8);
      ctx.stroke();
    }

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
      ctx.shadowBlur = 26;
      ctx.stroke();

      // Outer Pulse Ring
      const pulse = (Math.sin(performance.now() * 0.01) + 1) * 6;
      ctx.beginPath();
      ctx.arc(0, 0, pSize * 0.62 + pulse, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(245, 158, 11, 0.45)";
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

    // High-Resolution Smooth Interpolation
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    // Dynamic 3D Insect Holographic Wings Flapping (Active behind body carapace)
    if (!isGameOver) {
      this.drawInsectWings(ctx, pSize, jumpState, slideState, isFever, isBuffed, tilt);
    }

    // Select 3D Buggy Mascot Action Sprite with Frame-by-Frame Run Cycle
    const runSpeedMult = isFever ? 9 : 6.2;
    const stepPhase = Math.floor((this.totalTime * runSpeedMult) % 2);
    const activeRunSprite = (stepPhase === 0)
      ? (this.sprites.player3dRunF1.complete ? this.sprites.player3dRunF1 : this.sprites.player3dRun)
      : (this.sprites.player3dRunF2.complete ? this.sprites.player3dRunF2 : this.sprites.player3dRun);

    let currentImg = activeRunSprite;
    if (isGameOver) {
      currentImg = this.sprites.dead;
    } else if (jumpState && jumpState.isJumping && this.sprites.player3dJump.complete) {
      currentImg = this.sprites.player3dJump;
    } else if (slideState && slideState.isSliding && this.sprites.player3dSlide.complete) {
      currentImg = this.sprites.player3dSlide;
    } else if (tilt < -0.13 && this.sprites.player3dBankLeft.complete) {
      currentImg = this.sprites.player3dBankLeft;
    } else if (tilt > 0.13 && this.sprites.player3dBankRight.complete) {
      currentImg = this.sprites.player3dBankRight;
    }

    // Fallback to legacy 2D sprite if 3D sprite not yet loaded
    if (!currentImg.complete || currentImg.naturalWidth === 0) {
      currentImg = isGameOver ? this.sprites.dead : this.sprites.running;
    }

    if (currentImg.complete && currentImg.naturalWidth > 0) {
      const imgAspect = currentImg.naturalWidth / currentImg.naturalHeight;
      let drawW = pSize;
      let drawH = pSize;
      if (imgAspect > 1) {
        drawW = pSize * imgAspect;
      } else {
        drawH = pSize / imgAspect;
      }
      const renderOffsetY = (slideState && slideState.isSliding) ? pSize * 0.12 : 0;
      ctx.drawImage(currentImg, -drawW / 2, -drawH / 2 + renderOffsetY, drawW, drawH);
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, 36, 0, Math.PI * 2);
      ctx.fillStyle = "#f26f21";
      ctx.fill();
    }

    ctx.restore();

    // 6. Render Particle FX & Floating Texts
    if (particleSystem) {
      particleSystem.render(ctx);
    }

    // 7. Duel Opponent Telemetry HUD
    if (opponentData) {
      this.drawDuelTelemetryHUD(ctx, W, opponentData);
    }

    ctx.restore(); // Restore shake
  }

  /**
   * Render High-Performance Dynamic 3D Insect Fluttering Wings
   * Creates a visible, satisfying Pixar/Cyberpunk wing flapping animation at 60 FPS
   */
  drawInsectWings(ctx, pSize, jumpState, slideState, isFever, isBuffed, tilt = 0) {
    if (slideState && slideState.isSliding) {
      // Wings tuck tightly against carapace during low sliding
      return;
    }

    const isJumping = jumpState && jumpState.isJumping;
    const flapFreq = isJumping ? 38 : (isFever ? 32 : 22);
    const flapPhase = Math.sin(this.totalTime * flapFreq);

    // Flap cycle angles
    const baseAngle = isJumping ? 0.38 : 0.18;
    const flapRange = isJumping ? 0.65 : 0.45;
    const currentFlapAngle = flapPhase * flapRange;

    // Wing Span and Dimensions (Large visible wings spanning beyond body sides)
    const wingScale = isJumping ? 1.30 : 1.08;
    const wingLen = pSize * 0.72 * wingScale;
    const wingWidth = pSize * 0.40 * wingScale;

    // Wing Anchor Pivot at upper back carapace
    const pivotY = -pSize * 0.12;
    const pivotSeparation = pSize * 0.16;

    // Color Theme: Neon Iridescent Glass Cyan/Purple or Golden Sun during Fever
    const strokeCol = isFever ? "rgba(254, 240, 138, 0.95)" : "rgba(186, 230, 253, 0.95)";
    const fillInner = isFever ? "rgba(245, 158, 11, 0.60)" : "rgba(56, 189, 248, 0.48)";
    const fillOuter = isFever ? "rgba(251, 191, 36, 0.22)" : "rgba(147, 197, 253, 0.18)";
    const veinCol = isFever ? "rgba(254, 243, 199, 0.85)" : "rgba(255, 255, 255, 0.78)";

    // Render Left Wing
    ctx.save();
    ctx.translate(-pivotSeparation, pivotY);
    const yForeshorten = Math.cos(this.totalTime * flapFreq);
    ctx.rotate(-baseAngle + currentFlapAngle + tilt * 0.35);
    ctx.scale(1.0, 0.62 + yForeshorten * 0.38);
    this.renderSingleWing(ctx, -1, wingLen, wingWidth, fillInner, fillOuter, strokeCol, veinCol);
    ctx.restore();

    // Render Right Wing
    ctx.save();
    ctx.translate(pivotSeparation, pivotY);
    ctx.rotate(baseAngle - currentFlapAngle + tilt * 0.35);
    ctx.scale(1.0, 0.62 + yForeshorten * 0.38);
    this.renderSingleWing(ctx, 1, wingLen, wingWidth, fillInner, fillOuter, strokeCol, veinCol);
    ctx.restore();

    // Aerodynamic Wind Ripples behind fluttering wing tips
    if (Math.abs(flapPhase) > 0.5) {
      ctx.save();
      ctx.strokeStyle = isFever ? "rgba(251, 191, 36, 0.55)" : "rgba(125, 211, 252, 0.50)";
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.arc(-pivotSeparation - wingLen * 0.82, pivotY - currentFlapAngle * 22, 14, Math.PI * 0.75, Math.PI * 1.45);
      ctx.arc(pivotSeparation + wingLen * 0.82, pivotY + currentFlapAngle * 22, 14, -Math.PI * 0.45, Math.PI * 0.25);
      ctx.stroke();
      ctx.restore();
    }
  }

  /**
   * Helper to draw an aerodynamic insect wing with micro-veins
   */
  renderSingleWing(ctx, dir, len, width, fillInner, fillOuter, strokeCol, veinCol) {
    const tipX = dir * len;
    const tipY = -len * 0.25;

    const wingGrad = ctx.createRadialGradient(0, 0, len * 0.1, tipX * 0.6, tipY * 0.6, len * 0.95);
    wingGrad.addColorStop(0.0, fillInner);
    wingGrad.addColorStop(0.7, fillOuter);
    wingGrad.addColorStop(1.0, "rgba(255, 255, 255, 0.08)");

    ctx.fillStyle = wingGrad;
    ctx.strokeStyle = strokeCol;
    ctx.lineWidth = 2.0;
    ctx.shadowColor = strokeCol;
    ctx.shadowBlur = 10;

    // Aerodynamic Wing Outer Contour
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(dir * len * 0.35, -width * 0.95, dir * len * 0.75, -width * 0.72, tipX, tipY);
    ctx.bezierCurveTo(dir * len * 0.85, width * 0.48, dir * len * 0.35, width * 0.68, 0, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Micro Vein Structure
    ctx.shadowBlur = 0;
    ctx.strokeStyle = veinCol;
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(dir * len * 0.5, -width * 0.32, tipX * 0.92, tipY * 0.92);
    ctx.moveTo(dir * len * 0.28, -width * 0.16);
    ctx.lineTo(dir * len * 0.52, width * 0.22);
    ctx.moveTo(dir * len * 0.52, -width * 0.20);
    ctx.lineTo(dir * len * 0.75, width * 0.16);
    ctx.stroke();
  }

  /**
   * Render Parallax Cyberpunk FPTU Skyline with Retro Synthwave Sun
   */
  drawCyberpunkSkyline(ctx, W, horizonY, isFever) {
    ctx.save();

    // 1. Sky Gradient (Obsidian space -> Deep Cyber Navy -> Synthwave Horizon Violet)
    const skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
    skyGrad.addColorStop(0.0, "#02040a");
    skyGrad.addColorStop(0.35, "#080e22");
    skyGrad.addColorStop(0.75, "#160e2e");
    skyGrad.addColorStop(1.0, isFever ? "#2d1204" : "#240b3b");
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, W, horizonY);

    // 2. Twinkling Cyber Starfield
    this.stars.forEach(s => {
      const alpha = s.baseAlpha + Math.sin(this.totalTime * s.twinkleSpeed + s.phase) * 0.28;
      ctx.fillStyle = s.color;
      ctx.globalAlpha = Math.max(0.15, Math.min(1.0, alpha));
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1.0;

    // 3. Synthwave Digital Sun / Cyber Moon
    const sunX = this.VANISHING_X - this.roadCurve * 18;
    const sunY = 92;
    const sunR = 48;

    const sunGrad = ctx.createRadialGradient(sunX, sunY - 10, sunR * 0.15, sunX, sunY, sunR);
    if (isFever) {
      sunGrad.addColorStop(0.0, "#fffbeb");
      sunGrad.addColorStop(0.3, "#fef08a");
      sunGrad.addColorStop(0.7, "#f59e0b");
      sunGrad.addColorStop(1.0, "#b45309");
    } else {
      sunGrad.addColorStop(0.0, "#fef08a");
      sunGrad.addColorStop(0.35, "#f59e0b");
      sunGrad.addColorStop(0.75, "#f43f5e");
      sunGrad.addColorStop(1.0, "#831843");
    }

    ctx.save();
    ctx.beginPath();
    ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
    ctx.fillStyle = sunGrad;
    ctx.shadowColor = isFever ? "#f59e0b" : "#f43f5e";
    ctx.shadowBlur = 24;
    ctx.fill();

    // Synthwave Scanline Bars slicing lower half of sun
    ctx.shadowBlur = 0;
    ctx.fillStyle = skyGrad;
    const scanlineCount = 5;
    for (let i = 0; i < scanlineCount; i++) {
      const lineH = 1.5 + i * 0.85;
      const lineY = sunY + 6 + i * 7.5;
      ctx.fillRect(sunX - sunR - 4, lineY, (sunR + 4) * 2, lineH);
    }
    ctx.restore();

    // 4. Parallax Silhouette Layer (FPTU Alpha, Complex, Dragon Bridge)
    const parallaxShift = -this.roadCurve * 15;
    ctx.save();
    ctx.translate(parallaxShift, 0);

    // Render Buildings
    this.buildings.forEach(b => {
      const bx = b.x;
      const by = horizonY - b.h;

      // Dark obsidian structure
      ctx.fillStyle = "#070c18";
      ctx.fillRect(bx, by, b.w, b.h);

      if (b.type === "alpha") {
        // Tòa Alpha FPT University Da Nang (Origami Chevron Geometry)
        ctx.strokeStyle = isFever ? "#f59e0b" : "#f26f21";
        ctx.lineWidth = 1.8;
        ctx.shadowColor = ctx.strokeStyle;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        // Chevron sloped roof facets
        ctx.moveTo(bx, horizonY);
        ctx.lineTo(bx + 18, by);
        ctx.lineTo(bx + b.w / 2, by + 16);
        ctx.lineTo(bx + b.w - 18, by);
        ctx.lineTo(bx + b.w, horizonY);
        ctx.stroke();

        // Architectural Windows (illuminated FPTU labs)
        ctx.shadowBlur = 0;
        ctx.fillStyle = "rgba(254, 240, 138, 0.85)";
        for (let row = 0; row < 5; row++) {
          for (let col = 0; col < 6; col++) {
            if ((row + col) % 2 === 0) {
              ctx.fillRect(bx + 16 + col * 19, by + 28 + row * 13, 9, 5);
            }
          }
        }

        // Roof Hologram Badge: FU-DEVER LABS
        ctx.fillStyle = isFever ? "#fef08a" : "#06b6d4";
        ctx.font = "bold 8px 'JetBrains Mono', monospace";
        ctx.textAlign = "center";
        ctx.fillText("FU-DEVER LABS", bx + b.w / 2, by - 6);
      } else if (b.type === "complex") {
        // FPT Complex Curved Ring Building
        ctx.strokeStyle = "rgba(6, 182, 212, 0.75)";
        ctx.lineWidth = 1.5;
        ctx.strokeRect(bx, by, b.w, b.h);

        ctx.fillStyle = "rgba(6, 182, 212, 0.65)";
        for (let row = 0; row < 3; row++) {
          ctx.fillRect(bx + 8, by + 12 + row * 14, b.w - 16, 3);
        }
      } else if (b.type === "dragon_bridge") {
        // Da Nang Dragon Bridge Synthwave Arch
        ctx.strokeStyle = isFever ? "#f59e0b" : "#f97316";
        ctx.lineWidth = 2.2;
        ctx.shadowColor = ctx.strokeStyle;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.moveTo(bx, horizonY);
        ctx.quadraticCurveTo(bx + b.w * 0.35, by - 12, bx + b.w * 0.7, by + 18);
        ctx.quadraticCurveTo(bx + b.w * 0.88, by + 4, bx + b.w, horizonY);
        ctx.stroke();

        // Arch Suspender Cables
        ctx.shadowBlur = 0;
        ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
        ctx.lineWidth = 1;
        for (let c = 0; c < 7; c++) {
          const cx = bx + 18 + c * 16;
          ctx.beginPath();
          ctx.moveTo(cx, horizonY);
          ctx.lineTo(cx, by + 8);
          ctx.stroke();
        }
      } else if (b.type === "telecom") {
        // High Beacon Telecom Antenna
        ctx.strokeStyle = "#475569";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(bx + b.w / 2, horizonY);
        ctx.lineTo(bx + b.w / 2, by);
        ctx.stroke();

        // Pulsing Red Beacon Light on top
        const beaconPulse = Math.sin(this.totalTime * 6) > 0;
        ctx.fillStyle = beaconPulse ? "#ef4444" : "#7f1d1d";
        ctx.shadowColor = "#ef4444";
        ctx.shadowBlur = beaconPulse ? 12 : 2;
        ctx.beginPath();
        ctx.arc(bx + b.w / 2, by, 3.5, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Standard Modern High-Rise
        ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
        ctx.lineWidth = 1;
        ctx.strokeRect(bx, by, b.w, b.h);

        // Antenna
        if (b.antennaH) {
          ctx.strokeStyle = "#64748b";
          ctx.beginPath();
          ctx.moveTo(bx + b.w / 2, by);
          ctx.lineTo(bx + b.w / 2, by - b.antennaH);
          ctx.stroke();
        }

        // Window matrix
        ctx.fillStyle = "rgba(6, 182, 212, 0.4)";
        for (let r = 0; r < 3; r++) {
          ctx.fillRect(bx + 6, by + 12 + r * 16, b.w - 12, 4);
        }
      }
    });

    ctx.restore();

    // 5. Horizon Depth Fog & Atmospheric Light Bloom
    const fogGrad = ctx.createLinearGradient(0, horizonY - 26, 0, horizonY + 2);
    fogGrad.addColorStop(0.0, "transparent");
    fogGrad.addColorStop(0.65, isFever ? "rgba(245, 158, 11, 0.28)" : "rgba(6, 182, 212, 0.22)");
    fogGrad.addColorStop(1.0, isFever ? "rgba(242, 111, 33, 0.45)" : "rgba(14, 165, 233, 0.35)");
    ctx.fillStyle = fogGrad;
    ctx.fillRect(0, horizonY - 26, W, 28);

    ctx.restore();
  }

  /**
   * Render Pseudo-3D Perspective Road Runway with Dynamic Rumble Strips & Curvature
   */
  drawPerspectiveRoad(ctx, W, H, isFever, steeringMode, currentLane, playerX) {
    const horizonY = this.HORIZON_Y;
    const roadHalfWidthBottom = 275; // Road half-width at bottom baseline (y=600..720)
    const segments = 26;

    // 1. Off-Road Synthwave Floor Grids (Left & Right Terrains)
    ctx.fillStyle = "#040711";
    ctx.fillRect(0, horizonY, W, H - horizonY);

    // Off-road perspective radial grid lines
    ctx.strokeStyle = "rgba(6, 182, 212, 0.08)";
    ctx.lineWidth = 1;
    for (let gx = -240; gx <= W + 240; gx += 80) {
      const topX = this.VANISHING_X + (gx - this.VANISHING_X) * 0.28 + this.getCurveOffset(horizonY, 0.32);
      ctx.beginPath();
      ctx.moveTo(topX, horizonY);
      ctx.lineTo(gx, H);
      ctx.stroke();
    }

    // 2. Main Asphalt Road Surface (Perspective Polygon)
    ctx.save();
    ctx.beginPath();

    // Trace left curb from horizon down to bottom
    for (let i = 0; i <= segments; i++) {
      const y = horizonY + (i / segments) * (H - horizonY);
      const scale = this.getPerspectiveScale(y);
      const curve = this.getCurveOffset(y, scale);
      const xLeft = this.VANISHING_X - roadHalfWidthBottom * scale + curve;
      if (i === 0) ctx.moveTo(xLeft, y);
      else ctx.lineTo(xLeft, y);
    }

    // Trace right curb from bottom up to horizon
    for (let i = segments; i >= 0; i--) {
      const y = horizonY + (i / segments) * (H - horizonY);
      const scale = this.getPerspectiveScale(y);
      const curve = this.getCurveOffset(y, scale);
      const xRight = this.VANISHING_X + roadHalfWidthBottom * scale + curve;
      ctx.lineTo(xRight, y);
    }
    ctx.closePath();

    // Dark asphalt gradient with cyber sheen
    const asphaltGrad = ctx.createLinearGradient(0, horizonY, 0, H);
    asphaltGrad.addColorStop(0.0, "#080e1c");
    asphaltGrad.addColorStop(0.5, "#0a1226");
    asphaltGrad.addColorStop(1.0, "#060b17");
    ctx.fillStyle = asphaltGrad;
    ctx.fill();

    // 3. Active Lane Floor Accent Glow
    if (steeringMode === "analog") {
      const scale = 1.0;
      ctx.fillStyle = isFever ? "rgba(245, 158, 11, 0.18)" : "rgba(6, 182, 212, 0.10)";
      ctx.fillRect(playerX - 65, horizonY, 130, H - horizonY);
    } else {
      const activeLaneX = GAME_CONFIG.laneX[currentLane];
      const laneDelta = activeLaneX - this.VANISHING_X;

      ctx.beginPath();
      for (let i = 0; i <= segments; i++) {
        const y = horizonY + (i / segments) * (H - horizonY);
        const scale = this.getPerspectiveScale(y);
        const curve = this.getCurveOffset(y, scale);
        const cx = this.VANISHING_X + laneDelta * scale + curve;
        const hw = 85 * scale;
        if (i === 0) ctx.moveTo(cx - hw, y);
        else ctx.lineTo(cx - hw, y);
      }
      for (let i = segments; i >= 0; i--) {
        const y = horizonY + (i / segments) * (H - horizonY);
        const scale = this.getPerspectiveScale(y);
        const curve = this.getCurveOffset(y, scale);
        const cx = this.VANISHING_X + laneDelta * scale + curve;
        const hw = 85 * scale;
        ctx.lineTo(cx + hw, y);
      }
      ctx.closePath();
      ctx.fillStyle = isFever ? "rgba(245, 158, 11, 0.16)" : "rgba(242, 111, 33, 0.09)";
      ctx.fill();
    }

    // 4. Perspective Rumble Strips / Racing Curbstones
    const curbWBottom = 26;
    for (let i = 0; i < segments; i++) {
      const y1 = horizonY + Math.pow(i / segments, 1.45) * (H - horizonY);
      const y2 = horizonY + Math.pow((i + 1) / segments, 1.45) * (H - horizonY);

      const s1 = this.getPerspectiveScale(y1);
      const s2 = this.getPerspectiveScale(y2);
      const c1 = this.getCurveOffset(y1, s1);
      const c2 = this.getCurveOffset(y2, s2);

      const rw1 = roadHalfWidthBottom * s1;
      const rw2 = roadHalfWidthBottom * s2;
      const cw1 = curbWBottom * s1;
      const cw2 = curbWBottom * s2;

      // Color alternating pattern moving with speed offset
      const patternIdx = Math.floor((i + this.roadOffset / 14) % 2);
      let curbFill;
      if (isFever) {
        curbFill = (patternIdx === 0) ? "#f59e0b" : "#ef4444";
      } else {
        curbFill = (patternIdx === 0) ? "#f26f21" : "#0f172a";
      }

      // Left Curb Quad
      ctx.fillStyle = curbFill;
      ctx.beginPath();
      ctx.moveTo(this.VANISHING_X - rw1 - cw1 + c1, y1);
      ctx.lineTo(this.VANISHING_X - rw1 + c1, y1);
      ctx.lineTo(this.VANISHING_X - rw2 + c2, y2);
      ctx.lineTo(this.VANISHING_X - rw2 - cw2 + c2, y2);
      ctx.closePath();
      ctx.fill();

      // Right Curb Quad
      ctx.beginPath();
      ctx.moveTo(this.VANISHING_X + rw1 + c1, y1);
      ctx.lineTo(this.VANISHING_X + rw1 + cw1 + c1, y1);
      ctx.lineTo(this.VANISHING_X + rw2 + cw2 + c2, y2);
      ctx.lineTo(this.VANISHING_X + rw2 + c2, y2);
      ctx.closePath();
      ctx.fill();
    }

    // 5. Glowing Neon Road Rails (Guiding Curbs)
    ctx.strokeStyle = isFever ? "#f59e0b" : "#06b6d4";
    ctx.lineWidth = isFever ? 4.5 : 3.0;
    ctx.shadowColor = ctx.strokeStyle;
    ctx.shadowBlur = isFever ? 18 : 12;

    // Left Neon Rail
    ctx.beginPath();
    for (let i = 0; i <= segments; i++) {
      const y = horizonY + (i / segments) * (H - horizonY);
      const scale = this.getPerspectiveScale(y);
      const curve = this.getCurveOffset(y, scale);
      const x = this.VANISHING_X - roadHalfWidthBottom * scale + curve;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Right Neon Rail
    ctx.beginPath();
    for (let i = 0; i <= segments; i++) {
      const y = horizonY + (i / segments) * (H - horizonY);
      const scale = this.getPerspectiveScale(y);
      const curve = this.getCurveOffset(y, scale);
      const x = this.VANISHING_X + roadHalfWidthBottom * scale + curve;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    // 6. Perspective Lane Dividers (Dashed High-Speed Lines)
    const laneDivL = (GAME_CONFIG.laneX[0] + GAME_CONFIG.laneX[1]) / 2 - this.VANISHING_X;
    const laneDivR = (GAME_CONFIG.laneX[1] + GAME_CONFIG.laneX[2]) / 2 - this.VANISHING_X;

    for (let i = 0; i < segments; i++) {
      // Perspective line dashing: only draw even segment intervals
      const dashProgress = (i + this.roadOffset / 16) % 3;
      if (dashProgress > 1.4) continue;

      const y1 = horizonY + Math.pow(i / segments, 1.35) * (H - horizonY);
      const y2 = horizonY + Math.pow((i + 0.8) / segments, 1.35) * (H - horizonY);

      const s1 = this.getPerspectiveScale(y1);
      const s2 = this.getPerspectiveScale(y2);
      const c1 = this.getCurveOffset(y1, s1);
      const c2 = this.getCurveOffset(y2, s2);

      const xL1 = this.VANISHING_X + laneDivL * s1 + c1;
      const xL2 = this.VANISHING_X + laneDivL * s2 + c2;
      const xR1 = this.VANISHING_X + laneDivR * s1 + c1;
      const xR2 = this.VANISHING_X + laneDivR * s2 + c2;

      ctx.strokeStyle = "rgba(255, 255, 255, 0.42)";
      ctx.lineWidth = 2.5 * s2;
      ctx.beginPath();
      ctx.moveTo(xL1, y1); ctx.lineTo(xL2, y2);
      ctx.moveTo(xR1, y1); ctx.lineTo(xR2, y2);
      ctx.stroke();
    }

    // 7. Cyberpunk Speed Streaks in Fever or Highway mode
    if (isFever || steeringMode === "highway") {
      ctx.strokeStyle = isFever ? "rgba(245, 158, 11, 0.45)" : "rgba(6, 182, 212, 0.35)";
      ctx.lineWidth = 2;
      for (let i = 0; i < 7; i++) {
        const laneX = GAME_CONFIG.laneX[i % 3] + ((i * 47) % 60 - 30);
        const yTop = horizonY + ((this.roadOffset * 6 + i * 110) % (H - horizonY));
        const yBot = Math.min(H, yTop + 65);
        const sTop = this.getPerspectiveScale(yTop);
        const sBot = this.getPerspectiveScale(yBot);
        const cTop = this.getCurveOffset(yTop, sTop);
        const cBot = this.getCurveOffset(yBot, sBot);

        ctx.beginPath();
        ctx.moveTo(this.VANISHING_X + (laneX - this.VANISHING_X) * sTop + cTop, yTop);
        ctx.lineTo(this.VANISHING_X + (laneX - this.VANISHING_X) * sBot + cBot, yBot);
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  /**
   * Top Telemetry HUD for 1v1 LAN / Wi-Fi Duel
   */
  drawDuelTelemetryHUD(ctx, W, opponentData) {
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

    ctx.fillStyle = "#ffffff";
    ctx.font = "700 11px 'Be Vietnam Pro', sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(`${opponentData.name || 'ĐỐI THỦ'}: ${opponentData.score || 0}`, barX + 12, barY + 21);

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

  /**
   * Split-Screen 2-Player Renderer on a Single 640x720 Canvas (Enhanced Cyberpunk Duel Tracks)
   */
  renderSplitScreen(dt, p1, p2, particleSystem, timeLeft = 60) {
    const W = this.canvas.width;
    const H = this.canvas.height;
    const ctx = this.ctx;
    this.totalTime += dt;

    ctx.save();

    // 1. Camera Shake
    if (this.shake > 0) {
      const sx = (Math.random() - 0.5) * this.shake * 12;
      const sy = (Math.random() - 0.5) * this.shake * 12;
      ctx.translate(sx, sy);
      this.shake = Math.max(0, this.shake - dt * 2.5);
    }

    // Base Background
    ctx.fillStyle = "#040711";
    ctx.fillRect(0, 0, W, H);

    // Dynamic Road Lines offset
    this.roadOffset = (this.roadOffset + 420 * dt) % 64;

    // --- LEFT HALF: P1 Track (Cyber Cyan) ---
    const p1Grad = ctx.createLinearGradient(0, 0, 0, H);
    p1Grad.addColorStop(0, "#081324");
    p1Grad.addColorStop(1, "#040a16");
    ctx.fillStyle = p1Grad;
    ctx.fillRect(16, 0, 296, H);

    // P1 Neon Border
    ctx.strokeStyle = "rgba(6, 182, 212, 0.45)";
    ctx.lineWidth = 2.5;
    ctx.strokeRect(16, 0, 296, H);

    // P1 Dash Dividers
    ctx.strokeStyle = "rgba(6, 182, 212, 0.25)";
    ctx.lineWidth = 2;
    ctx.setLineDash([20, 30]);
    ctx.lineDashOffset = -this.roadOffset;
    ctx.beginPath();
    ctx.moveTo(110, 0); ctx.lineTo(110, H);
    ctx.moveTo(210, 0); ctx.lineTo(210, H);
    ctx.stroke();

    // --- RIGHT HALF: P2 Track (Electric Amber) ---
    const p2Grad = ctx.createLinearGradient(0, 0, 0, H);
    p2Grad.addColorStop(0, "#1c1008");
    p2Grad.addColorStop(1, "#0e0804");
    ctx.fillStyle = p2Grad;
    ctx.fillRect(328, 0, 296, H);

    // P2 Neon Border
    ctx.strokeStyle = "rgba(245, 158, 11, 0.45)";
    ctx.lineWidth = 2.5;
    ctx.strokeRect(328, 0, 296, H);

    // P2 Dash Dividers
    ctx.strokeStyle = "rgba(245, 158, 11, 0.25)";
    ctx.beginPath();
    ctx.moveTo(430, 0); ctx.lineTo(430, H);
    ctx.moveTo(530, 0); ctx.lineTo(530, H);
    ctx.stroke();
    ctx.setLineDash([]);

    // --- CENTER DIVIDER (VS Neon Beam) ---
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(314, 0, 12, H);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.65)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(320, 0); ctx.lineTo(320, H);
    ctx.stroke();

    // Center VS Badge
    ctx.save();
    ctx.fillStyle = "#0f172a";
    ctx.strokeStyle = "#f59e0b";
    ctx.lineWidth = 2.5;
    ctx.shadowColor = "#f59e0b";
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(320, 72, 19, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;
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

    // 4. Render P1 Buggy & P2 Buggy
    const pSize = 74;
    const playerY = GAME_CONFIG.playerY;

    // P1 Sprite
    ctx.save();
    ctx.translate(p1.playerX, playerY);
    if (p1.isInvulnerable) {
      ctx.globalAlpha = Math.sin(performance.now() * 0.035) > 0 ? 0.35 : 0.95;
    }
    ctx.beginPath();
    ctx.arc(0, 0, pSize * 0.52, 0, Math.PI * 2);
    ctx.strokeStyle = "#06b6d4";
    ctx.lineWidth = 3.5;
    ctx.shadowColor = "#06b6d4";
    ctx.shadowBlur = 14;
    ctx.stroke();
    ctx.shadowBlur = 0;
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
    ctx.beginPath();
    ctx.arc(0, 0, pSize * 0.52, 0, Math.PI * 2);
    ctx.strokeStyle = "#f59e0b";
    ctx.lineWidth = 3.5;
    ctx.shadowColor = "#f59e0b";
    ctx.shadowBlur = 14;
    ctx.stroke();
    ctx.shadowBlur = 0;
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
    ctx.fillStyle = "rgba(6, 182, 212, 0.18)";
    ctx.strokeStyle = "#06b6d4";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(20, 14, 180, 36, 6);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#ffffff";
    ctx.font = "700 11px 'Be Vietnam Pro', sans-serif";
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
    ctx.fillStyle = "rgba(245, 158, 11, 0.18)";
    ctx.strokeStyle = "#f59e0b";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(440, 14, 180, 36, 6);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#ffffff";
    ctx.font = "700 11px 'Be Vietnam Pro', sans-serif";
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
    ctx.fillStyle = "rgba(15, 23, 42, 0.92)";
    ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
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
   * Code Slicer (Fruit Ninja Style) 60 FPS Canvas Renderer
   */
  renderSlicer(ctx, W, H, dt, items, particleSystem, bladeTrail, isFever, isGameOver) {
    // 1. Matrix Hologram Space Arena Background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0.0, "#030612");
    bgGrad.addColorStop(0.5, "#0b061d");
    bgGrad.addColorStop(1.0, "#19082b");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // Laser Matrix Floor Grid
    ctx.strokeStyle = isFever ? "rgba(245, 158, 11, 0.15)" : "rgba(244, 63, 94, 0.12)";
    ctx.lineWidth = 1;
    for (let x = 0; x <= W; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0); ctx.lineTo(x, H);
      ctx.stroke();
    }
    for (let y = 0; y <= H; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y); ctx.lineTo(W, y);
      ctx.stroke();
    }

    // Top Slicer Arena Banner
    ctx.save();
    ctx.fillStyle = "rgba(244, 63, 94, 0.15)";
    ctx.strokeStyle = isFever ? "#f59e0b" : "#f43f5e";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(W / 2 - 130, 14, 260, 32, 6);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 11px 'JetBrains Mono', monospace";
    ctx.textAlign = "center";
    ctx.fillText(isFever ? "FEVER RUSH — TẤN CÔNG X2 ĐIỂM!" : "CODE SLICER — CHÉM BUG BẰNG TAY", W / 2, 34);
    ctx.restore();

    // 2. Render Tossed Items with Rotation and Sliced Halves
    items.forEach(it => {
      ctx.save();
      if (it.isSliced && it.pieces) {
        // Draw both sliced halves separating
        it.pieces.forEach(p => {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.angle);
          ctx.beginPath();
          if (p.isLeft) {
            ctx.rect(-it.radius * 1.5, -it.radius * 1.5, it.radius * 1.5, it.radius * 3);
          } else {
            ctx.rect(0, -it.radius * 1.5, it.radius * 1.5, it.radius * 3);
          }
          ctx.clip();
          this.drawArcadeItem(ctx, it, isFever, (it.scale || 1.15));
          ctx.restore();
        });
      } else {
        // Normal item flying in air
        ctx.translate(it.x, it.y);
        ctx.rotate(it.angle || 0);

        // Warning Glow for Bomb Deadline
        if (it.type === "deadline") {
          const pulse = (Math.sin(performance.now() * 0.015) + 1) * 8;
          ctx.beginPath();
          ctx.arc(0, 0, (it.radius || 30) + pulse, 0, Math.PI * 2);
          ctx.strokeStyle = "rgba(239, 68, 68, 0.65)";
          ctx.lineWidth = 2.5;
          ctx.stroke();
        }

        this.drawArcadeItem(ctx, it, isFever, it.scale || 1.15);
      }
      ctx.restore();
    });

    // 3. Render Cyber Blade Trail
    if (bladeTrail && bladeTrail.length >= 2) {
      ctx.save();
      // Outer Neon Aura
      ctx.strokeStyle = isFever ? "#f59e0b" : "#06b6d4";
      ctx.lineWidth = 14;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.shadowColor = ctx.strokeStyle;
      ctx.shadowBlur = 22;
      ctx.globalAlpha = 0.45;
      ctx.beginPath();
      ctx.moveTo(bladeTrail[0].x, bladeTrail[0].y);
      for (let i = 1; i < bladeTrail.length; i++) {
        ctx.lineTo(bladeTrail[i].x, bladeTrail[i].y);
      }
      ctx.stroke();

      // Sharp Core Blade
      ctx.lineWidth = 5;
      ctx.strokeStyle = "#a5f3fc";
      ctx.globalAlpha = 0.85;
      ctx.stroke();

      // Razor Center
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#ffffff";
      ctx.globalAlpha = 1.0;
      ctx.shadowBlur = 0;
      ctx.stroke();

      // Blade Tip Flare
      const tip = bladeTrail[bladeTrail.length - 1];
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(tip.x, tip.y, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 4. Render Particle FX
    if (particleSystem) {
      particleSystem.render(ctx);
    }
  }

  /**
   * Flappy Buggy (Logic Gates & Firewall Pipes) 60 FPS Canvas Renderer
   */
  renderFlappy(ctx, W, H, dt, playerX, flappyY, flappyVy, items, particleSystem, isGameOver, isInvulnerable, flappyTargetY, inputSource) {
    const yPos = (flappyY !== undefined && flappyY !== null) ? flappyY : 360;
    const vy = (flappyVy !== undefined && flappyVy !== null) ? flappyVy : 0;
    const bX = 140; // Fixed horizontal position for Flappy Buggy

    // 1. Fiber Optic Tunnel Background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0.0, "#020713");
    bgGrad.addColorStop(0.5, "#06152b");
    bgGrad.addColorStop(1.0, "#030c1b");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // Speed Lines traveling leftward
    const tunnelOffset = (this.totalTime * 280) % 80;
    ctx.strokeStyle = "rgba(6, 182, 212, 0.15)";
    ctx.lineWidth = 1.5;
    for (let y = 50; y < H - 50; y += 70) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }
    for (let x = -tunnelOffset; x < W + 80; x += 80) {
      ctx.beginPath();
      ctx.moveTo(x, 30);
      ctx.lineTo(x - 40, H - 30);
      ctx.stroke();
    }

    // Ceiling & Floor Electromagnetic Hazard Rails
    ctx.fillStyle = "#0a1324";
    ctx.fillRect(0, 0, W, 32);
    ctx.fillRect(0, H - 32, W, 32);

    ctx.strokeStyle = "#06b6d4";
    ctx.lineWidth = 3;
    ctx.shadowColor = "#06b6d4";
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.moveTo(0, 32); ctx.lineTo(W, 32);
    ctx.moveTo(0, H - 32); ctx.lineTo(W, H - 32);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Direct Tracking Reticle & Target Altitude Guide (Nose / Hand)
    if (!isGameOver && flappyTargetY !== undefined && flappyTargetY !== null) {
      ctx.save();
      const targetLabel = (inputSource === "hand") ? "✋ BÁM TAY" : "🎯 BÁM MŨI";
      const targetColor = "#06b6d4";

      // Subtle dashed guide line towards Buggy
      ctx.strokeStyle = "rgba(6, 182, 212, 0.28)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(12, flappyTargetY);
      ctx.lineTo(bX - 35, flappyTargetY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Neon reticle circle at target altitude
      ctx.strokeStyle = targetColor;
      ctx.lineWidth = 2;
      ctx.fillStyle = "rgba(6, 182, 212, 0.18)";
      ctx.beginPath();
      ctx.arc(28, flappyTargetY, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Mini crosshair lines
      ctx.beginPath();
      ctx.moveTo(16, flappyTargetY); ctx.lineTo(40, flappyTargetY);
      ctx.moveTo(28, flappyTargetY - 12); ctx.lineTo(28, flappyTargetY + 12);
      ctx.stroke();

      // Label
      ctx.font = "bold 10px 'JetBrains Mono', monospace";
      ctx.fillStyle = targetColor;
      ctx.fillText(targetLabel, 44, flappyTargetY + 3.5);
      ctx.restore();
    }

    // 2. Render Firewall Logic Gate Pipes
    items.forEach(it => {
      if (it.type !== "firewall_pipe") return;
      const px = it.x;
      const pw = it.width || 68;
      const topH = it.topHeight;
      const botY = it.bottomY;

      // Top Pipe Column
      const topGrad = ctx.createLinearGradient(px, 0, px + pw, 0);
      topGrad.addColorStop(0, "#1e293b");
      topGrad.addColorStop(0.5, "#334155");
      topGrad.addColorStop(1, "#0f172a");
      ctx.fillStyle = topGrad;
      ctx.fillRect(px, 32, pw, topH - 32);

      // Top Pipe Rim
      ctx.fillStyle = "#ef4444";
      ctx.strokeStyle = "#fca5a5";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(px - 4, topH - 24, pw + 8, 24, 4);
      ctx.fill();
      ctx.stroke();

      // Bottom Pipe Column
      ctx.fillStyle = topGrad;
      ctx.fillRect(px, botY, pw, H - 32 - botY);

      // Bottom Pipe Rim
      ctx.fillStyle = "#ef4444";
      ctx.beginPath();
      ctx.roundRect(px - 4, botY, pw + 8, 24, 4);
      ctx.fill();
      ctx.stroke();

      // Logic Gate Hologram Badge in Gap
      ctx.save();
      const midY = (topH + botY) / 2;
      ctx.fillStyle = "rgba(6, 182, 212, 0.15)";
      ctx.strokeStyle = "#06b6d4";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(px - 14, midY - 14, pw + 28, 28, 6);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#67e8f9";
      ctx.font = "bold 10px 'JetBrains Mono', monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(it.gateLabel || "GATE", px + pw / 2, midY);

      // Electric Arc Spark between terminals
      const arcSpark = Math.sin(this.totalTime * 18 + px) > 0.4;
      if (arcSpark) {
        ctx.strokeStyle = "#fef08a";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(px + pw / 2, topH);
        ctx.lineTo(px + pw / 2 + (Math.random() - 0.5) * 16, midY);
        ctx.lineTo(px + pw / 2, botY);
        ctx.stroke();
      }
      ctx.restore();
    });

    // 3. Render Mascot Flying Buggy with Dynamic Flapping Wings
    const pSize = 92;
    const bY = Math.max(48, Math.min(H - 48, yPos));

    ctx.save();
    ctx.translate(bX, bY);

    // Tilt based on vertical velocity: climb vs dive
    const tilt = Math.max(-0.45, Math.min(0.55, vy * 0.0016));
    ctx.rotate(tilt);

    // Dynamic 3D Insect Fluttering Wings during flight
    if (!isGameOver) {
      this.drawInsectWings(ctx, pSize, { isJumping: true, progress: 0.5 }, null, false, false, tilt);
    }

    // Jet Propulsion Exhaust Particles
    const exhaustPulse = (Math.sin(this.totalTime * 30) + 1) * 8;
    ctx.fillStyle = "#f59e0b";
    ctx.shadowColor = "#f59e0b";
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.ellipse(-pSize * 0.42, 0, 10 + exhaustPulse, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Invulnerability Blink
    if (isInvulnerable) {
      ctx.globalAlpha = Math.sin(performance.now() * 0.035) > 0 ? 0.35 : 0.95;
    }

    // Buggy Sprite (3D Jump / 3D Run / Fallback)
    let currentImg = this.sprites.player3dJump.complete ? this.sprites.player3dJump : (this.sprites.player3dRun.complete ? this.sprites.player3dRun : this.sprites.champion);
    if (isGameOver) {
      currentImg = this.sprites.dead;
    }
    if (currentImg.complete && currentImg.naturalWidth > 0) {
      const imgAspect = currentImg.naturalWidth / currentImg.naturalHeight;
      let drawW = pSize;
      let drawH = pSize;
      if (imgAspect > 1) {
        drawW = pSize * imgAspect;
      } else {
        drawH = pSize / imgAspect;
      }
      ctx.drawImage(currentImg, -drawW / 2, -drawH / 2, drawW, drawH);
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, 36, 0, Math.PI * 2);
      ctx.fillStyle = "#06b6d4";
      ctx.fill();
    }
    ctx.restore();

    // 4. Particle FX
    if (particleSystem) {
      particleSystem.render(ctx);
    }
  }

  /**
   * High-Fidelity Procedural Vector Arcade Items
   */
  drawArcadeItem(ctx, it, isFever, scale = 1.0) {
    const R = (it.radius || 24) * scale;
    const t = performance.now() * 0.003;
    const type = it.type;

    ctx.save();

    const isCollectible = (type === "star" || type === "coffee" || type === "clean_code" || type === "pr_merged");

    // 1. 3D Ground Light Ring & Projection Aura
    ctx.save();
    ctx.scale(1.0, 0.32);
    ctx.beginPath();
    ctx.arc(0, R * 1.6, R * (isCollectible ? 1.0 : 1.25), 0, Math.PI * 2);
    if (type === "star") {
      ctx.fillStyle = "rgba(250, 204, 21, 0.35)";
    } else if (type === "coffee") {
      ctx.fillStyle = "rgba(6, 182, 212, 0.40)";
    } else if (type === "clean_code" || type === "pr_merged") {
      ctx.fillStyle = "rgba(16, 185, 129, 0.38)";
    } else {
      ctx.fillStyle = "rgba(239, 68, 68, 0.32)";
    }
    ctx.fill();
    ctx.restore();

    // 2. 3D Floating Bobbing & Y-Axis Spin (Temple Run / Minion Rush Coin Mechanic)
    if (isCollectible) {
      const bobY = Math.sin(t * 6 + (it.x * 0.08)) * (5 * scale);
      ctx.translate(0, bobY);

      const spinAngle = t * 4.2 + (it.x * 0.05);
      const spinScaleX = Math.cos(spinAngle);
      // Continuous 3D spin on vertical axis
      ctx.scale(Math.abs(spinScaleX) * 0.72 + 0.28, 1.0);

      // 3D Rim / Bevel depth highlight when tilted
      const edgeWidth = (1 - Math.abs(spinScaleX)) * (6 * scale);
      if (edgeWidth > 1.2) {
        ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
        ctx.beginPath();
        ctx.roundRect(-edgeWidth / 2, -R * 0.85, edgeWidth, R * 1.7, 3);
        ctx.fill();
      }
    }

    switch (type) {
      case "bug":
      case "bug_crash": {
        if (this.sprites.item3dBug && this.sprites.item3dBug.complete && this.sprites.item3dBug.naturalWidth > 0) {
          const isCrash = type === "bug_crash";
          const s = R * 2.3;
          ctx.save();
          if (isCrash) {
            ctx.shadowColor = "#ef4444";
            ctx.shadowBlur = 18;
          }
          ctx.drawImage(this.sprites.item3dBug, -s / 2, -s / 2, s, s);
          if (isCrash) {
            ctx.strokeStyle = "#fef08a";
            ctx.lineWidth = 2.5 * scale;
            ctx.beginPath();
            ctx.moveTo(-s * 0.25, -s * 0.1);
            ctx.lineTo(s * 0.05, s * 0.05);
            ctx.lineTo(-s * 0.05, s * 0.2);
            ctx.lineTo(s * 0.25, s * 0.35);
            ctx.stroke();
          }
          ctx.restore();
          break;
        }

        // --- ARCADE BEETLE / BUG FALLBACK ---
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
        if (this.sprites.item3dDeadline && this.sprites.item3dDeadline.complete && this.sprites.item3dDeadline.naturalWidth > 0) {
          const ringShake = Math.sin(t * 26) * 1.5;
          ctx.translate(ringShake, 0);
          const s = R * 2.3;
          ctx.save();
          ctx.shadowColor = "#f97316";
          ctx.shadowBlur = isFever ? 18 : 8;
          ctx.drawImage(this.sprites.item3dDeadline, -s / 2, -s / 2, s, s);
          ctx.restore();
          break;
        }

        // --- RETRO ALARM CLOCK (23:59) FALLBACK ---
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
        if (this.sprites.item3dCoffee && this.sprites.item3dCoffee.complete && this.sprites.item3dCoffee.naturalWidth > 0) {
          const s = R * 2.3;
          ctx.save();
          ctx.shadowColor = "#06b6d4";
          ctx.shadowBlur = isFever ? 18 : 8;
          ctx.drawImage(this.sprites.item3dCoffee, -s / 2, -s / 2, s, s);
          ctx.restore();
          break;
        }

        // --- TAKEAWAY COFFEE CUP (FPTU BOOST) FALLBACK ---
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
        if (this.sprites.item3dGem && this.sprites.item3dGem.complete && this.sprites.item3dGem.naturalWidth > 0) {
          const s = R * 2.3;
          ctx.save();
          ctx.shadowColor = "#10b981";
          ctx.shadowBlur = isFever ? 20 : 12;
          ctx.drawImage(this.sprites.item3dGem, -s / 2, -s / 2, s, s);
          ctx.restore();
          break;
        }

        // --- SPARKLING EMERALD GIT CRYSTAL / GEM FALLBACK ---
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
        if (this.sprites.item3dStar && this.sprites.item3dStar.complete && this.sprites.item3dStar.naturalWidth > 0) {
          const s = R * 2.4;
          ctx.save();
          ctx.shadowColor = "#f59e0b";
          ctx.shadowBlur = isFever ? 22 : 12;
          ctx.drawImage(this.sprites.item3dStar, -s / 2, -s / 2, s, s);
          ctx.restore();
          break;
        }

        // --- 5-POINTED GOLDEN ARCADE STAR FALLBACK ---
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
        ctx.font = `900 ${Math.round(R * 1.1)}px 'Be Vietnam Pro', sans-serif`;
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
        ctx.font = `700 ${Math.round(10 * scale)}px 'Be Vietnam Pro', sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(it.label || "?", 0, 1);
        break;
      }
    }

    ctx.restore();
  }
}

