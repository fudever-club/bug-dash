// FU-DEVER BUG DASH - Dual-Player Face Tracker for 1-Camera Split-Screen
// Tracks two simultaneous players standing side-by-side in front of a single laptop webcam.
// P1 is partitioned to Left Half (0.0 .. 0.50), P2 is partitioned to Right Half (0.50 .. 1.0).

import { VISION_CONFIG, SPLIT_CONFIG } from "../config.js";
import { FaceTracker } from "./tracker.js";

class SingleSlotTracker {
  constructor(slotId, roiX0, roiX1, defaultCenterX) {
    this.slotId = slotId; // "p1" | "p2"
    this.roi = { x0: roiX0, x1: roiX1 };
    this.phase = "wait"; // "wait" | "cand" | "lock" | "lost"
    this.cand = null;
    this.candSince = 0;
    this.box = null;
    this.lostFrames = 0;
    this.defaultCenterX = defaultCenterX;
    this.smoothedX = defaultCenterX;
    this.centerX = defaultCenterX;
    this.smoothedTilt = 0;
    this.centerTilt = 0;
    this.currentLane = 1;
    this.analogNormalized = 0.5;
  }

  reset() {
    this.phase = "wait";
    this.cand = null;
    this.box = null;
    this.lostFrames = 0;
    this.smoothedX = this.defaultCenterX;
    this.centerX = this.defaultCenterX;
    this.smoothedTilt = 0;
    this.centerTilt = 0;
    this.currentLane = 1;
    this.analogNormalized = 0.5;
  }

  calibrateCenter() {
    if (this.phase === "lock" && this.box) {
      this.centerX = this.smoothedX;
      this.centerTilt = this.smoothedTilt;
      return true;
    }
    return false;
  }

  update(facesInSlot, now) {
    // 1. If currently locked or in lost grace period: match best face in slot
    if (this.phase === "lock" || this.phase === "lost") {
      let bestMatch = null;
      let highestScore = 0.28;

      for (const f of facesInSlot) {
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

        // Compute steering offset normalized to slot width (0.50 width)
        const slotWidth = this.roi.x1 - this.roi.x0;
        const deltaX = (this.smoothedX - this.centerX) / slotWidth;
        const tilt = this.smoothedTilt || 0;
        const effectiveSteer = deltaX + tilt * (VISION_CONFIG.tiltWeight || 0.45);

        // Continuous analog steering [0.0 .. 1.0]
        this.analogNormalized = Math.max(0.0, Math.min(1.0, 0.5 + effectiveSteer * 2.2));

        // Discrete 3-Lane snap [0, 1, 2]
        if (effectiveSteer < -0.16) {
          this.currentLane = 0;
        } else if (effectiveSteer > 0.16) {
          this.currentLane = 2;
        } else {
          this.currentLane = 1;
        }
      }
      return;
    }

    // 2. Not locked: find candidate face inside slot ROI
    let primary = null;
    let maxScore = -1;
    for (const f of facesInSlot) {
      const cx = FaceTracker.getCenterX(f);
      const score = (f.w * f.h * 0.6) + (1 - Math.abs(cx - this.defaultCenterX) * 2) * 0.4;
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

    if (this.cand && FaceTracker.computeIoU(primary, this.cand) > 0.25) {
      this.cand = primary;
      this.phase = "cand";
      if (now - this.candSince >= VISION_CONFIG.lockMs) {
        this.box = primary;
        this.phase = "lock";
        this.lostFrames = 0;
        this.smoothedX = this.centerX = FaceTracker.getCenterX(primary);
        this.smoothedTilt = this.centerTilt = primary.tilt || 0;
      }
    } else {
      this.cand = primary;
      this.candSince = now;
      this.phase = "cand";
    }
  }

  getStatus() {
    return {
      slotId: this.slotId,
      phase: this.phase,
      box: this.box,
      roi: this.roi,
      currentLane: this.currentLane,
      analogNormalized: this.analogNormalized,
      smoothedTilt: this.smoothedTilt,
      rollAngle: this.box ? (this.box.rollAngle || 0) : 0,
      candProgress: (this.phase === "cand") ? Math.min(1.0, (performance.now() - this.candSince) / VISION_CONFIG.lockMs) : 0
    };
  }
}

export class DualFaceTracker {
  constructor(onBothLockedCallback) {
    // Player 1 (Left): 0.05 to 0.48, default center = 0.26
    this.p1 = new SingleSlotTracker("p1", 0.05, 0.48, 0.26);
    // Player 2 (Right): 0.52 to 0.95, default center = 0.74
    this.p2 = new SingleSlotTracker("p2", 0.52, 0.95, 0.74);
    this.onBothLocked = onBothLockedCallback || (() => {});
    this.bothLockedNotified = false;
  }

  reset() {
    this.p1.reset();
    this.p2.reset();
    this.bothLockedNotified = false;
  }

  calibrateAll() {
    const c1 = this.p1.calibrateCenter();
    const c2 = this.p2.calibrateCenter();
    return c1 || c2;
  }

  update(faces, now) {
    const validFaces = faces.filter(f => (f.w * f.h) >= VISION_CONFIG.minArea);

    // Partition faces by horizontal midpoint 0.50
    const p1Faces = validFaces.filter(f => FaceTracker.getCenterX(f) < 0.50);
    const p2Faces = validFaces.filter(f => FaceTracker.getCenterX(f) >= 0.50);

    this.p1.update(p1Faces, now);
    this.p2.update(p2Faces, now);

    if (this.p1.phase === "lock" && this.p2.phase === "lock" && !this.bothLockedNotified) {
      this.bothLockedNotified = true;
      this.onBothLocked();
    }
  }

  getStatus() {
    return {
      p1: this.p1.getStatus(),
      p2: this.p2.getStatus(),
      isReady: this.p1.phase === "lock" && this.p2.phase === "lock"
    };
  }
}
