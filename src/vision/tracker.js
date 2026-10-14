// FU-DEVER BUG DASH - Single-Player Robust Face Tracker
// Implements ROI gating, Candidate confirmation lock, IoU tracking, and EMA smoothing.

import { VISION_CONFIG } from "../config.js";

export class FaceTracker {
  constructor(onLockCallback) {
    this.phase = "wait"; // "wait" | "cand" | "lock" | "lost"
    this.cand = null;
    this.candSince = 0;
    this.box = null;
    this.lostFrames = 0;
    this.smoothedX = 0.5;
    this.centerX = 0.5;
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

  reset() {
    this.phase = "wait";
    this.cand = null;
    this.box = null;
    this.lostFrames = 0;
    this.smoothedX = 0.5;
    this.centerX = 0.5;
    this.smoothedTilt = 0;
    this.centerTilt = 0;
  }

  calibrateCenter() {
    if (this.phase === "lock" && this.box) {
      this.centerX = this.smoothedX;
      this.centerTilt = this.smoothedTilt;
      return true;
    }
    return false;
  }

  update(faces, now) {
    // 1. Filter out background faces (far away)
    const validFaces = faces.filter(f => (f.w * f.h) >= VISION_CONFIG.minArea);

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
        }
      }

      if (this.phase === "lock" && this.box) {
        const cx = FaceTracker.getCenterX(this.box);
        this.smoothedX += (cx - this.smoothedX) * VISION_CONFIG.ema;

        const currentTilt = this.box.tilt || 0;
        this.smoothedTilt += (currentTilt - this.smoothedTilt) * (VISION_CONFIG.tiltEma || 0.35);
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
        this.smoothedX = this.centerX = FaceTracker.getCenterX(primary);
        this.smoothedTilt = this.centerTilt = primary.tilt || 0;
        this.onLock(this.box);
      }
    } else {
      this.cand = primary;
      this.candSince = now;
      this.phase = "cand";
    }
  }

  getStatus() {
    return {
      phase: this.phase,
      box: this.box,
      smoothedX: this.smoothedX,
      centerX: this.centerX,
      deltaX: this.smoothedX - this.centerX,
      smoothedTilt: this.smoothedTilt || 0,
      rollAngle: this.box ? (this.box.rollAngle || 0) : 0,
      lostFrames: this.lostFrames,
      candProgress: (this.phase === "cand") ? Math.min(1.0, (performance.now() - this.candSince) / VISION_CONFIG.lockMs) : 0
    };
  }
}
