// FU-DEVER BUG DASH — SpriteSheet Animation Controller
// High-performance, anti-AI crafted spritesheet animation engine with zero-crash procedural fallback.

const ImageCtor = (typeof Image !== "undefined") ? Image : class { constructor() { this.src = ""; this.complete = false; } };

export class SpriteSheetAnimator {
  /**
   * @param {Object} config
   * @param {string|HTMLImageElement|HTMLCanvasElement} config.image - Source image element or URL path
   * @param {number} config.frameWidth - Width of a single frame
   * @param {number} config.frameHeight - Height of a single frame
   * @param {number} [config.frameCount=1] - Total number of horizontal frames
   * @param {number} [config.fps=10] - Frames per second
   * @param {boolean} [config.loop=true] - Whether animation loops
   * @param {string} [config.fallbackType='generic'] - Fallback vector generator identifier
   * @param {Function} [config.customFallback=null] - Custom fallback drawing function (ctx, dx, dy, dw, dh, options)
   */
  constructor(config = {}) {
    this.frameWidth = Math.max(1, config.frameWidth || 64);
    this.frameHeight = Math.max(1, config.frameHeight || 64);
    this.frameCount = Math.max(1, config.frameCount || 1);
    this.fps = Math.max(0.1, config.fps || 10);
    this.frameDuration = 1 / this.fps;
    this.loop = config.loop !== false;
    this.fallbackType = config.fallbackType || "generic";
    this.customFallback = config.customFallback || null;

    // Load or wrap image
    if (typeof config.image === "string") {
      this.image = new ImageCtor();
      this.image.src = config.image;
    } else if (config.image) {
      this.image = config.image;
    } else {
      this.image = new ImageCtor();
    }

    // Playback state
    this.currentFrame = 0;
    this.frameTimer = 0;
    this.isPlaying = true;
    this.isFinished = false;
    this.totalTime = 0;
  }

  /**
   * Adjust playback speed dynamically
   * @param {number} fps
   */
  setFPS(fps) {
    this.fps = Math.max(0.1, fps);
    this.frameDuration = 1 / this.fps;
  }

  /**
   * Reset playback to start
   */
  reset() {
    this.currentFrame = 0;
    this.frameTimer = 0;
    this.isFinished = false;
  }

  play() {
    this.isPlaying = true;
  }

  pause() {
    this.isPlaying = false;
  }

  setFrame(frameIndex) {
    this.currentFrame = Math.max(0, Math.min(this.frameCount - 1, frameIndex));
  }

  /**
   * Update animation timer and advance frames
   * @param {number} dt - Delta time in seconds
   */
  update(dt) {
    this.totalTime += dt;
    if (!this.isPlaying || this.frameCount <= 1 || this.isFinished) return;

    this.frameTimer += dt;
    while (this.frameTimer >= this.frameDuration) {
      this.frameTimer -= this.frameDuration;
      if (this.currentFrame + 1 < this.frameCount) {
        this.currentFrame++;
      } else if (this.loop) {
        this.currentFrame = 0;
      } else {
        this.isFinished = true;
        this.currentFrame = this.frameCount - 1;
        break;
      }
    }
  }

  /**
   * Check if image is loaded and ready for drawImage
   * @returns {boolean}
   */
  isReady() {
    return !!(this.image && this.image.complete && this.image.naturalWidth > 0);
  }

  /**
   * Draw current frame or execute crash-proof procedural fallback
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} dx - Target X
   * @param {number} dy - Target Y
   * @param {number} dw - Target Width
   * @param {number} dh - Target Height
   * @param {Object} [options={}]
   * @param {boolean} [options.flipX=false]
   * @param {boolean} [options.flipY=false]
   * @param {number} [options.rotation=0]
   * @param {number} [options.scale=1]
   * @param {number} [options.scaleX=1]
   * @param {number} [options.scaleY=1]
   * @param {number} [options.anchorX=0.5]
   * @param {number} [options.anchorY=0.5]
   * @param {number} [options.alpha=1]
   * @param {string} [options.glowColor=null]
   * @param {number} [options.glowBlur=0]
   * @param {string} [options.tint=null]
   * @param {number} [options.tintAlpha=0.25]
   * @param {number} [options.bobbing=0]
   */
  draw(ctx, dx, dy, dw, dh, options = {}) {
    if (!ctx) return;

    const anchorX = options.anchorX !== undefined ? options.anchorX : 0.5;
    const anchorY = options.anchorY !== undefined ? options.anchorY : 0.5;
    const rotation = options.rotation || 0;
    const bobbing = options.bobbing || 0;
    const scale = options.scale !== undefined ? options.scale : 1;
    const scaleX = (options.scaleX !== undefined ? options.scaleX : 1) * scale * (options.flipX ? -1 : 1);
    const scaleY = (options.scaleY !== undefined ? options.scaleY : 1) * scale * (options.flipY ? -1 : 1);
    const alpha = options.alpha !== undefined ? options.alpha : 1;

    const canDrawImage = typeof ctx.drawImage === "function" && this.isReady();

    if (canDrawImage) {
      if (ctx.save) ctx.save();

      // Center pivot point
      const cx = dx + dw * anchorX;
      const cy = dy + dh * anchorY + bobbing;

      if (ctx.translate) ctx.translate(cx, cy);
      if (rotation && ctx.rotate) ctx.rotate(rotation);
      if ((scaleX !== 1 || scaleY !== 1) && ctx.scale) ctx.scale(scaleX, scaleY);
      if (alpha < 1 && ctx.globalAlpha !== undefined) ctx.globalAlpha *= alpha;

      if (options.glowColor && options.glowBlur > 0) {
        ctx.shadowColor = options.glowColor;
        ctx.shadowBlur = options.glowBlur;
      }

      const sx = this.currentFrame * this.frameWidth;
      const sy = 0;
      const sw = this.frameWidth;
      const sh = this.frameHeight;

      // Draw centered around origin (-dw * anchorX, -dh * anchorY)
      const renderX = -dw * anchorX;
      const renderY = -dh * anchorY;

      ctx.drawImage(this.image, sx, sy, sw, sh, renderX, renderY, dw, dh);

      // Optional tint overlay
      if (options.tint && ctx.fillRect && ctx.globalCompositeOperation !== undefined) {
        ctx.save();
        ctx.globalCompositeOperation = "source-atop";
        ctx.fillStyle = options.tint;
        ctx.globalAlpha = options.tintAlpha || 0.25;
        ctx.fillRect(renderX, renderY, dw, dh);
        ctx.restore();
      }

      if (ctx.restore) ctx.restore();
    } else {
      // Safe procedural vector fallback (Zero Crash on headless Node.js tests)
      if (this.customFallback) {
        this.customFallback(ctx, dx, dy, dw, dh, options, this.currentFrame);
      } else {
        this.drawProceduralFallback(ctx, dx, dy, dw, dh, options);
      }
    }
  }

  /**
   * Procedural Vector Fallback Rendering for Node.js / offline headless / loading state
   */
  drawProceduralFallback(ctx, dx, dy, dw, dh, options = {}) {
    if (!ctx) return;
    const type = this.fallbackType;
    const frame = this.currentFrame;
    const bobbing = options.bobbing || 0;
    const cy = dy + bobbing;

    if (ctx.save) ctx.save();

    // Kart Cyan Procedural Vector Fallback
    if (type === "kart_cyan" || type === "kart_pink") {
      const isCyan = type === "kart_cyan";
      const mainColor = isCyan ? "#00f5ff" : "#ff2a8d";
      const darkColor = isCyan ? "#003b46" : "#4a0026";
      const flamePulse = (frame % 2 === 1) ? 1.3 : 1.0;

      // Body shell
      if (ctx.fillStyle !== undefined) ctx.fillStyle = darkColor;
      if (ctx.fillRect) ctx.fillRect(dx + dw * 0.2, cy + dh * 0.3, dw * 0.6, dh * 0.5);

      // Neon highlight
      if (ctx.strokeStyle !== undefined) ctx.strokeStyle = mainColor;
      if (ctx.lineWidth !== undefined) ctx.lineWidth = 3;
      if (ctx.strokeRect) ctx.strokeRect(dx + dw * 0.2, cy + dh * 0.3, dw * 0.6, dh * 0.5);

      // Jet exhaust flame
      if (ctx.fillStyle !== undefined) ctx.fillStyle = isCyan ? "#a5f3fc" : "#fbcfe8";
      if (ctx.beginPath && ctx.arc && ctx.fill) {
        ctx.beginPath();
        ctx.arc(dx + dw * 0.5, cy + dh * 0.82, 8 * flamePulse, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    // Circuit Crane Mecha Procedural Fallback
    else if (type === "circuit_cyan" || type === "circuit_pink") {
      const isCyan = type === "circuit_cyan";
      const color = isCyan ? "#00f5ff" : "#ff2a8d";
      const clawSpread = (frame % 2 === 0) ? 0.35 : 0.25;

      if (ctx.fillStyle !== undefined) ctx.fillStyle = "#1e293b";
      if (ctx.fillRect) ctx.fillRect(dx + dw * 0.3, cy + dh * 0.1, dw * 0.4, dh * 0.4);

      if (ctx.strokeStyle !== undefined) ctx.strokeStyle = color;
      if (ctx.lineWidth !== undefined) ctx.lineWidth = 4;
      if (ctx.beginPath && ctx.moveTo && ctx.lineTo && ctx.stroke) {
        ctx.beginPath();
        ctx.moveTo(dx + dw * 0.35, cy + dh * 0.5);
        ctx.lineTo(dx + dw * clawSpread, cy + dh * 0.85);
        ctx.moveTo(dx + dw * 0.65, cy + dh * 0.5);
        ctx.lineTo(dx + dw * (1 - clawSpread), cy + dh * 0.85);
        ctx.stroke();
      }
    }
    // Cryo Blaster Mecha Procedural Fallback
    else if (type === "cryo_cyan" || type === "cryo_pink") {
      const isCyan = type === "cryo_cyan";
      const frostColor = isCyan ? "#38bdf8" : "#f472b6";

      if (ctx.fillStyle !== undefined) ctx.fillStyle = "#0f172a";
      if (ctx.fillRect) ctx.fillRect(dx + dw * 0.25, cy + dh * 0.2, dw * 0.5, dh * 0.5);

      if (ctx.fillStyle !== undefined) ctx.fillStyle = frostColor;
      if (ctx.beginPath && ctx.arc && ctx.fill) {
        const frostR = 10 + (frame % 4) * 3;
        ctx.beginPath();
        ctx.arc(dx + dw * 0.5, cy + dh * 0.75, frostR, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    // Energy Orb Procedural Fallback
    else if (type === "energy_orb") {
      const pulse = 1 + (frame % 6) * 0.08;
      const r = Math.min(dw, dh) * 0.4 * pulse;

      if (ctx.fillStyle !== undefined) ctx.fillStyle = "#facc15";
      if (ctx.beginPath && ctx.arc && ctx.fill) {
        ctx.beginPath();
        ctx.arc(dx + dw * 0.5, cy + dh * 0.5, r, 0, Math.PI * 2);
        ctx.fill();
      }
      if (ctx.strokeStyle !== undefined) ctx.strokeStyle = "#38bdf8";
      if (ctx.lineWidth !== undefined) ctx.lineWidth = 2;
      if (ctx.stroke) ctx.stroke();
    }
    // Champ Trophy Procedural Fallback
    else if (type === "champ_trophy") {
      if (ctx.fillStyle !== undefined) ctx.fillStyle = "#eab308";
      if (ctx.fillRect) {
        ctx.fillRect(dx + dw * 0.35, cy + dh * 0.5, dw * 0.3, dh * 0.35); // stem & base
        ctx.fillRect(dx + dw * 0.25, cy + dh * 0.2, dw * 0.5, dh * 0.35); // cup
      }
      if (ctx.fillStyle !== undefined) ctx.fillStyle = "#fef08a";
      if (ctx.beginPath && ctx.arc && ctx.fill) {
        const sparkleX = dx + dw * (0.3 + (frame % 4) * 0.15);
        ctx.beginPath();
        ctx.arc(sparkleX, cy + dh * 0.25, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    // Generic Box Fallback
    else {
      if (ctx.fillStyle !== undefined) ctx.fillStyle = "rgba(0, 245, 255, 0.2)";
      if (ctx.fillRect) ctx.fillRect(dx, cy, dw, dh);
      if (ctx.strokeStyle !== undefined) ctx.strokeStyle = "#00f5ff";
      if (ctx.strokeRect) ctx.strokeRect(dx, cy, dw, dh);
    }

    if (ctx.restore) ctx.restore();
  }
}
