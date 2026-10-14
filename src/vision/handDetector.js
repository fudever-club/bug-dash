// FU-DEVER BUG DASH - MediaPipe HandLandmarker Wrapper
// Detects 21 hand landmarks, palm position, and vertical gestures (Jump / Slide) for gesture steering.

import { FilesetResolver, HandLandmarker } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/+esm";
import { VISION_CONFIG } from "../config.js";

export class HandDetectorWrapper {
  constructor() {
    this.handLandmarker = null;
    this.isReady = false;
    this.isLoading = false;
    this.lastTimestamp = -1;
  }

  async init() {
    if (this.isReady) return true;
    if (this.isLoading) return false;
    this.isLoading = true;

    try {
      const vision = await FilesetResolver.forVisionTasks(VISION_CONFIG.wasmUrl);
      this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
          delegate: "GPU",
        },
        runningMode: "VIDEO",
        numHands: 1,
        minHandDetectionConfidence: 0.5,
        minHandPresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });
      this.isReady = true;
      this.isLoading = false;
      return true;
    } catch (err) {
      console.warn("[HandDetectorWrapper] GPU delegate initialization failed, trying CPU fallback:", err);
      try {
        const vision = await FilesetResolver.forVisionTasks(VISION_CONFIG.wasmUrl);
        this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
            delegate: "CPU",
          },
          runningMode: "VIDEO",
          numHands: 1,
          minHandDetectionConfidence: 0.4,
          minHandPresenceConfidence: 0.4,
          minTrackingConfidence: 0.4,
        });
        this.isReady = true;
        this.isLoading = false;
        return true;
      } catch (e2) {
        console.error("[HandDetectorWrapper] Failed to initialize HandLandmarker:", e2);
        this.isReady = false;
        this.isLoading = false;
        throw e2;
      }
    }
  }

  detectForVideo(videoElement, timestamp) {
    if (!this.isReady || !this.handLandmarker) return null;
    if (timestamp === this.lastTimestamp) return null;
    this.lastTimestamp = timestamp;

    try {
      const result = this.handLandmarker.detectForVideo(videoElement, timestamp);
      if (!result || !result.landmarks || result.landmarks.length === 0) {
        return null;
      }

      const rawLandmarks = result.landmarks[0]; // Primary tracked hand
      // Mirror X coordinates for intuitive mirror-view steering (1 - x)
      const landmarks = rawLandmarks.map(pt => ({
        x: 1 - pt.x,
        y: pt.y,
        z: pt.z
      }));

      // Palm Center: midpoint of wrist (0) and middle MCP (9)
      const palmX = (landmarks[0].x + landmarks[9].x) * 0.5;
      const palmY = (landmarks[0].y + landmarks[9].y) * 0.5;

      // Index fingertip (8)
      const indexTip = landmarks[8];

      // Vertical Gestures:
      // High Hand (Jump): Palm or index tip raised into upper third (y < 0.32)
      // Low Hand (Slide): Palm or index tip lowered into bottom third (y > 0.68)
      const isHighHand = palmY < 0.32 || indexTip.y < 0.28;
      const isLowHand = palmY > 0.68 || indexTip.y > 0.72;

      // Distance between index tip (8) and thumb tip (4) to identify open palm
      const pinchDist = Math.hypot(landmarks[8].x - landmarks[4].x, landmarks[8].y - landmarks[4].y);
      const isOpenPalm = pinchDist > 0.12;

      return {
        landmarks,
        palmX,
        palmY,
        indexTip,
        isHighHand,
        isLowHand,
        isOpenPalm
      };
    } catch (err) {
      return null;
    }
  }
}
