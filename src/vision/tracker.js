// FU-DEVER BUG DASH - Single-Player Robust Face Tracker
// Implements ROI gating, Candidate confirmation lock, Hybrid matching,
// 1€ Filter (One Euro Filter) for ultra-low latency & anti-jitter,
// Dynamic Auto-Zeroing Baseline, and Vertical Gesture (Jump / Duck) detection.

import { VISION_CONFIG } from "../config.js";
import { OneEuroFilter } from "./OneEuroFilter.js";

export class FaceTracker {
  constructor(onLockCallback) {
    this.phase = "wait"; // "wait" | "cand" | "lock" | "lost"
    this.cand = null;
    this.candSince = 0;
    this.box = null;
    this.lostFrames = 0;

    // Spatial coordinates & baselines
    this.smoothedX = 0.5;
    this.centerX = 0.5;
    this.smoothedTilt = 0;
    this.centerTilt = 0;
    this.smoothedY = 0.5;
    this.centerY = 0.5;
    this.smoothedNoseX = 0.5;
    this.smoothedNoseY = 0.5;
    this.centerNoseY = 0.5;

    // Vertical gestures (Jump / Duck) via dY/dt
    this.prevY = 0.5;
    this.prevTimestamp = 0;
    this.velocityDy = 0;
    this.isJump = false;
    this.isDuck = false;
    this.lastVerticalGestureTime = 0;

    // 1€ Filter instances
    const oe = VISION_CONFIG.oneEuro || { minCutoff: 1.0, beta: 0.007, dCutoff: 1.0 };
    this.filterX = new OneEuroFilter(30, oe.minCutoff, oe.beta, oe.dCutoff);
    this.filterTilt = new OneEuroFilter(30, oe.minCutoff, oe.beta, oe.dCutoff);
    this.filterY = new OneEuroFilter(30, oe.minCutoff, oe.beta, oe.dCutoff);
    this.filterNoseX = new OneEuroFilter(30, oe.minCutoff, oe.beta, oe.dCutoff);
    this.filterNoseY = new OneEuroFilter(30, oe.minCutoff, oe.beta, oe.dCutoff);

    this.onLock = onLockCallback || (() => {});
  }

  // Intersection over Union
  static computeIoU(a, b) {
    if (!a || !b) return 0;
    const x1 = Math.max(a.x, b.x);
    const y1 = Math.max(a.y, b.y);
    const x2 = Math.min(a.x + a.w, b.x + b.w);
    const y2 = Math.min(a.y + a.h, b.y + b.h);
    const inter = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
    const areaA = a.w * a.h;
    const areaB = b.w * b.h;
    return inter / (areaA + areaB - inter || 1);
  }

  // Hybrid matching: IoU + Euclidean Distance + Area Similarity
  static computeMatchScore(a, b) {
    if (!a || !b) return 0;
    const iou = FaceTracker.computeIoU(a, b);
    const cxA = FaceTracker.getCenterX(a);
    const cyA = a.y + a.h / 2;
    const cxB = FaceTracker.getCenterX(b);
    const cyB = b.y + b.h / 2;
    const dist = Math.hypot(cxA - cxB, cyA - cyB);

    const areaA = a.w * a.h;
    const areaB = b.w * b.h;
    const areaRatio = Math.min(areaA, areaB) / Math.max(areaA, areaB);

    // Primary: IoU is positive and significant
    if (iou >= VISION_CONFIG.minIoU) {
      return 0.5 * iou + 0.3 * (1 - Math.min(1, dist * 3)) + 0.2 * areaRatio;
    }

    // Fallback: Sudden head dodge/tilt causing IoU drop to zero, but center distance & size are close
    if (dist < 0.28 && areaRatio > 0.50) {
      return 0.25 + 0.45 * (1 - dist / 0.28) + 0.30 * areaRatio;
    }

    return 0;
  }

  static getCenterX(box) {
    return box.x + box.w / 2;
  }

  static getCenterY(box) {
    return box.y + box.h / 2;
  }

  reset() {
    this.phase = "wait";
    this.cand = null;
    this.box = null;
    this.lostFrames = 0;
    this.smoothedX = 0.5;
    this.centerX = 0.5;
    this.smoothedTilt = 0;
    this.centerTilt = 0;
    this.smoothedY = 0.5;
    this.centerY = 0.5;
    this.smoothedNoseX = 0.5;
    this.smoothedNoseY = 0.5;
    this.centerNoseY = 0.5;
    this.velocityDy = 0;
    this.isJump = false;
    this.isDuck = false;
    this.prevTimestamp = 0;

    this.filterX.reset();
    this.filterTilt.reset();
    this.filterY.reset();
    this.filterNoseX.reset();
    this.filterNoseY.reset();
  }

  calibrateCenter() {
    if (this.phase === "lock" && this.box) {
      this.centerX = this.smoothedX;
      this.centerTilt = this.smoothedTilt;
      this.centerY = this.smoothedY;
      this.centerNoseY = this.smoothedNoseY;
      return true;
    }
    return false;
  }

  update(faces, now = performance.now()) {
    // 1. Filter out background faces (far away)
    const validFaces = faces.filter(f => (f.w * f.h) >= VISION_CONFIG.minArea);

    // Reset single-frame gesture triggers
    this.isJump = false;
    this.isDuck = false;

    // 2. If locked or temporarily lost: keep tracking the target person
    if (this.phase === "lock" || this.phase === "lost") {
      let bestMatch = null;
      let highestScore = 0.30; // Threshold score for continuous tracking

      for (const f of validFaces) {
        const score = FaceTracker.computeMatchScore(f, this.box);
        if (score > highestScore) {
          highestScore = score;
          bestMatch = f;
        }
      }

      if (bestMatch) {
        this.box = bestMatch;
        this.lostFrames = 0;
        this.phase = "lock";
      } else {
        this.lostFrames++;
        if (this.lostFrames > VISION_CONFIG.lostFrames) {
          this.phase = "lost";
        }
        // Only release lock after generous grace period (maxLostFrames = 60 frames ~ 2s)
        if (this.lostFrames > (VISION_CONFIG.maxLostFrames || 60)) {
          this.phase = "wait";
          this.box = null;
          this.filterX.reset();
          this.filterTilt.reset();
          this.filterY.reset();
          this.filterNoseX.reset();
          this.filterNoseY.reset();
        }
      }

      if (this.phase === "lock" && this.box) {
        const rawCx = FaceTracker.getCenterX(this.box);
        const rawTilt = this.box.tilt || 0;
        const rawCy = FaceTracker.getCenterY(this.box);
        const rawNoseX = this.box.nose ? this.box.nose.x : rawCx;
        const rawNoseY = this.box.nose ? this.box.nose.y : (this.box.y + this.box.h * 0.55);

        // Apply 1€ Filter (or EMA fallback)
        if (VISION_CONFIG.useOneEuro) {
          this.smoothedX = this.filterX.filter(rawCx, now);
          this.smoothedTilt = this.filterTilt.filter(rawTilt, now);
          this.smoothedY = this.filterY.filter(rawCy, now);
          this.smoothedNoseX = this.filterNoseX.filter(rawNoseX, now);
          this.smoothedNoseY = this.filterNoseY.filter(rawNoseY, now);
        } else {
          this.smoothedX += (rawCx - this.smoothedX) * VISION_CONFIG.ema;
          this.smoothedTilt += (rawTilt - this.smoothedTilt) * (VISION_CONFIG.tiltEma || 0.35);
          this.smoothedY += (rawCy - this.smoothedY) * 0.4;
          this.smoothedNoseX += (rawNoseX - this.smoothedNoseX) * 0.4;
          this.smoothedNoseY += (rawNoseY - this.smoothedNoseY) * 0.4;
        }

        // Vertical Gesture Analysis (Jump / Duck via dY/dt with position gating)
        if (this.prevTimestamp > 0) {
          const dt = Math.max(0.005, (now - this.prevTimestamp) / 1000);
          const rawDy = (rawCy - this.prevY) / dt;

          // If frame gap is large (>150ms), reset velocity to avoid carrying old momentum
          if (dt > 0.15) {
            this.velocityDy = rawDy;
          } else {
            this.velocityDy = this.velocityDy * 0.5 + rawDy * 0.5;
          }

          const vg = VISION_CONFIG.verticalGesture || { jumpVelocity: -0.32, duckVelocity: 0.35, cooldownMs: 400 };
          const cooldownOk = (now - this.lastVerticalGestureTime) >= vg.cooldownMs;

          if (cooldownOk) {
            // Position gating ensures upward recovery from duck doesn't trigger jump, and vice versa
            const isAboveCenter = rawCy < (this.centerY - 0.02);
            const isBelowCenter = rawCy > (this.centerY + 0.02);

            if (isAboveCenter && this.velocityDy < vg.jumpVelocity) {
              this.isJump = true;
              this.lastVerticalGestureTime = now;
            } else if (isBelowCenter && this.velocityDy > vg.duckVelocity) {
              this.isDuck = true;
              this.lastVerticalGestureTime = now;
            }
          }
        }
        this.prevY = rawCy;
        this.prevTimestamp = now;
      }
      return;
    }

    // 3. Not locked: find candidate in ROI
    const inRoi = validFaces.filter(f => {
      const cx = FaceTracker.getCenterX(f);
      return cx >= VISION_CONFIG.roi.x0 && cx <= VISION_CONFIG.roi.x1;
    });

    let primary = null;
    let maxScore = -1;
    for (const f of inRoi) {
      const cx = FaceTracker.getCenterX(f);
      const score = (f.w * f.h * 0.6) + (1 - Math.abs(cx - 0.5) * 2) * 0.4;
      if (score > maxScore) {
        maxScore = score;
        primary = f;
      }
    }

    if (!primary) {
      this.phase = "wait";
      this.cand = null;
      return;
    }

    // Check candidate stability
    if (this.cand && FaceTracker.computeIoU(primary, this.cand) > 0.3) {
      this.cand = primary;
      this.phase = "cand";
      if (now - this.candSince >= VISION_CONFIG.lockMs) {
        this.box = primary;
        this.phase = "lock";
        this.lostFrames = 0;

        const initCx = FaceTracker.getCenterX(primary);
        const initTilt = primary.tilt || 0;
        const initCy = FaceTracker.getCenterY(primary);
        const initNoseX = primary.nose ? primary.nose.x : initCx;
        const initNoseY = primary.nose ? primary.nose.y : (primary.y + primary.h * 0.55);

        this.smoothedX = this.centerX = initCx;
        this.smoothedTilt = this.centerTilt = initTilt;
        this.smoothedY = this.centerY = initCy;
        this.smoothedNoseX = initNoseX;
        this.smoothedNoseY = this.centerNoseY = initNoseY;
        this.prevY = initCy;
        this.prevTimestamp = now;

        this.filterX.reset();
        this.filterTilt.reset();
        this.filterY.reset();
        this.filterNoseX.reset();
        this.filterNoseY.reset();
        this.filterX.filter(initCx, now);
        this.filterTilt.filter(initTilt, now);
        this.filterY.filter(initCy, now);
        this.filterNoseX.filter(initNoseX, now);
        this.filterNoseY.filter(initNoseY, now);

        this.onLock(this.box);
      }
    } else {
      this.cand = primary;
      this.candSince = now;
      this.phase = "cand";
    }
  }

  getStatus() {
    const deltaX = this.smoothedX - this.centerX;
    const deltaTilt = this.smoothedTilt - this.centerTilt;
    const tiltWeight = VISION_CONFIG.tiltWeight || 0.65;
    const effectiveSteer = deltaX + deltaTilt * tiltWeight;
    const steerThreshold = VISION_CONFIG.defaultThreshold || 0.09;
    const steerTension = Math.max(-1.5, Math.min(1.5, effectiveSteer / steerThreshold));

    return {
      phase: this.phase,
      box: this.box,
      smoothedX: this.smoothedX,
      centerX: this.centerX,
      deltaX: deltaX,
      smoothedTilt: this.smoothedTilt,
      centerTilt: this.centerTilt,
      deltaTilt: deltaTilt,
      rollAngle: this.box ? (this.box.rollAngle || 0) : 0,
      smoothedY: this.smoothedY,
      centerY: this.centerY,
      deltaY: this.smoothedY - this.centerY,
      noseX: this.smoothedNoseX,
      noseY: this.smoothedNoseY,
      centerNoseY: this.centerNoseY,
      deltaNoseY: this.smoothedNoseY - this.centerNoseY,
      velocityDy: this.velocityDy,
      isJump: this.isJump,
      isDuck: this.isDuck,
      effectiveSteer: effectiveSteer,
      steerTension: steerTension, // -1.0 (full left threshold) .. +1.0 (full right threshold)
      lostFrames: this.lostFrames,
      candProgress: (this.phase === "cand") ? Math.min(1.0, (performance.now() - this.candSince) / VISION_CONFIG.lockMs) : 0
    };
  }
}
