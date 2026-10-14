// FU-DEVER BUG DASH - Lane & Analog Steering Controller
// Supports both Discrete 3-Lane Snap and Free Analog Head-Tilt Racing.

import { VISION_CONFIG, GAME_CONFIG, STEERING_MODES } from "../config.js";

export class LaneController {
  constructor(onLaneChange) {
    this.currentLane = 1; // Default middle lane
    this.threshold = VISION_CONFIG.defaultThreshold; // default 0.09
    this.hysteresis = VISION_CONFIG.hyst;            // 0.02
    this.onLaneChange = onLaneChange || (() => {});
    this.manualOverride = false;

    // Steering Mode: "snap3" (3-Lane discrete) or "analog" (Free head-tilt steering)
    this.steeringMode = STEERING_MODES.SNAP3;
    this.analogNormalizedX = 0.5; // 0.0 (Left) to 1.0 (Right)
    this.analogTargetX = GAME_CONFIG.laneX[1];
    this.effectiveSteer = 0;
  }

  setSteeringMode(mode) {
    if (mode === STEERING_MODES.SNAP3 || mode === STEERING_MODES.ANALOG) {
      this.steeringMode = mode;
      return this.steeringMode;
    }
    return this.steeringMode;
  }

  toggleSteeringMode() {
    this.steeringMode = (this.steeringMode === STEERING_MODES.SNAP3) 
      ? STEERING_MODES.ANALOG 
      : STEERING_MODES.SNAP3;
    return this.steeringMode;
  }

  setThresholdPercent(percent) {
    this.threshold = Math.max(0.04, Math.min(0.20, percent / 100));
  }

  reset() {
    this.currentLane = 1;
    this.analogNormalizedX = 0.5;
    this.analogTargetX = GAME_CONFIG.laneX[1];
    this.manualOverride = false;
    this.effectiveSteer = 0;
  }

  setLane(newLane, isManual = false) {
    newLane = Math.max(0, Math.min(2, newLane));
    if (this.currentLane !== newLane) {
      const oldLane = this.currentLane;
      this.currentLane = newLane;
      if (isManual) this.manualOverride = true;
      this.onLaneChange(this.currentLane, oldLane);
    }
  }

  shiftLeft() {
    if (this.steeringMode === STEERING_MODES.ANALOG) {
      this.analogNormalizedX = Math.max(0.0, this.analogNormalizedX - 0.25);
      this.analogTargetX = GAME_CONFIG.roadMinX + this.analogNormalizedX * (GAME_CONFIG.roadMaxX - GAME_CONFIG.roadMinX);
      this.updateLaneFromNormalized();
    } else {
      this.setLane(this.currentLane - 1, true);
    }
  }

  shiftRight() {
    if (this.steeringMode === STEERING_MODES.ANALOG) {
      this.analogNormalizedX = Math.min(1.0, this.analogNormalizedX + 0.25);
      this.analogTargetX = GAME_CONFIG.roadMinX + this.analogNormalizedX * (GAME_CONFIG.roadMaxX - GAME_CONFIG.roadMinX);
      this.updateLaneFromNormalized();
    } else {
      this.setLane(this.currentLane + 1, true);
    }
  }

  updateLaneFromNormalized() {
    const lane = (this.analogNormalizedX < 0.35) ? 0 : ((this.analogNormalizedX > 0.65) ? 2 : 1);
    if (lane !== this.currentLane) {
      const oldLane = this.currentLane;
      this.currentLane = lane;
      this.onLaneChange(this.currentLane, oldLane);
    }
  }

  getTargetX() {
    if (this.steeringMode === STEERING_MODES.ANALOG) {
      return this.analogTargetX;
    }
    return GAME_CONFIG.laneX[this.currentLane];
  }

  updateFromTracker(trackerStatus) {
    // Only update from vision if locked
    if (trackerStatus.phase !== "lock") return;

    // Combine horizontal displacement + Head Roll Tilt
    const deltaX = trackerStatus.deltaX;
    const tilt = trackerStatus.smoothedTilt || 0;
    const effectiveSteer = deltaX + tilt * (VISION_CONFIG.tiltWeight || 0.45);
    this.effectiveSteer = effectiveSteer;

    if (this.steeringMode === STEERING_MODES.ANALOG) {
      // Continuous Analog Head Steering
      // Scale effectiveSteer to road bounds
      const norm = Math.max(0.0, Math.min(1.0, 0.5 + effectiveSteer * 2.5));
      this.analogNormalizedX = norm;
      this.analogTargetX = GAME_CONFIG.roadMinX + norm * (GAME_CONFIG.roadMaxX - GAME_CONFIG.roadMinX);
      this.updateLaneFromNormalized();
      return;
    }

    // Discrete 3-Lane Snap Mode with Hysteresis
    const t = this.threshold;
    const h = this.hysteresis;
    let target = this.currentLane;

    if (this.currentLane === 1) {
      if (effectiveSteer < -t) target = 0;
      else if (effectiveSteer > t) target = 2;
    } else if (this.currentLane === 0) {
      if (effectiveSteer > -t + h) target = 1;
    } else if (this.currentLane === 2) {
      if (effectiveSteer < t - h) target = 1;
    }

    if (target !== this.currentLane) {
      this.setLane(target, false);
    }
  }

  updateFromHand(handStatus) {
    if (!handStatus) return;
    const rawX = handStatus.palmX; // Normalized 0..1 (already mirrored)
    if (rawX === undefined || rawX === null) return;

    // Smooth hand position using EMA (0.60 weight for responsive feel)
    const emaAlpha = 0.60;
    this.analogNormalizedX = this.analogNormalizedX * (1 - emaAlpha) + rawX * emaAlpha;
    this.analogNormalizedX = Math.max(0.05, Math.min(0.95, this.analogNormalizedX));

    if (this.steeringMode === STEERING_MODES.ANALOG) {
      this.analogTargetX = GAME_CONFIG.roadMinX + this.analogNormalizedX * (GAME_CONFIG.roadMaxX - GAME_CONFIG.roadMinX);
      this.updateLaneFromNormalized();
    } else {
      // 3-Lane Snap from hand position
      let target = 1;
      if (this.analogNormalizedX < 0.38) target = 0;
      else if (this.analogNormalizedX > 0.62) target = 2;
      if (target !== this.currentLane) {
        this.setLane(target, false);
      }
    }
  }
}
