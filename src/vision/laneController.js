// FU-DEVER BUG DASH - Lane Steering Controller
// Maps face position deltas or keyboard inputs to 3 lanes (0: Left, 1: Middle, 2: Right).

import { VISION_CONFIG } from "../config.js";

export class LaneController {
  constructor(onLaneChange) {
    this.currentLane = 1; // Default middle lane
    this.threshold = VISION_CONFIG.defaultThreshold; // default 0.09
    this.hysteresis = VISION_CONFIG.hyst;            // 0.02
    this.onLaneChange = onLaneChange || (() => {});
    this.manualOverride = false;
  }

  setThresholdPercent(percent) {
    this.threshold = Math.max(0.04, Math.min(0.20, percent / 100));
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
    this.setLane(this.currentLane - 1, true);
  }

  shiftRight() {
    this.setLane(this.currentLane + 1, true);
  }

  updateFromTracker(trackerStatus) {
    // Only update from vision if locked
    if (trackerStatus.phase !== "lock") return;

    const deltaX = trackerStatus.deltaX;
    const t = this.threshold;
    const h = this.hysteresis;
    let target = this.currentLane;

    if (this.currentLane === 1) {
      if (deltaX < -t) target = 0;
      else if (deltaX > t) target = 2;
    } else if (this.currentLane === 0) {
      if (deltaX > -t + h) target = 1;
    } else if (this.currentLane === 2) {
      if (deltaX < t - h) target = 1;
    }

    if (target !== this.currentLane) {
      this.setLane(target, false);
    }
  }
}
