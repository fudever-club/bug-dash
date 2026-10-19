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
    this.lastMultiTimestamp = 0;
    this.prevP1PalmX = null;
    this.prevP1PalmY = null;
    this.prevP2PalmX = null;
    this.prevP2PalmY = null;
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
        numHands: 4,
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
          numHands: 4,
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

  detectMultiHandsForVideo(videoElement, timestamp) {
    if (!this.isReady || !this.handLandmarker) return null;
    try {
      const result = this.handLandmarker.detectForVideo(videoElement, timestamp);
      if (!result || !result.landmarks || result.landmarks.length === 0) {
        return null;
      }

      const allHands = [];
      const p1Hands = [];
      const p2Hands = [];

      for (let i = 0; i < result.landmarks.length; i++) {
        const rawLandmarks = result.landmarks[i];
        // Mirror X
        const landmarks = rawLandmarks.map(pt => ({
          x: 1 - pt.x,
          y: pt.y,
          z: pt.z
        }));

        const palmX = (landmarks[0].x + landmarks[9].x) * 0.5;
        const palmY = (landmarks[0].y + landmarks[9].y) * 0.5;
        const indexTip = landmarks[8];
        const isRaised = palmY < 0.38 || (indexTip && indexTip.y < 0.35);

        const handObj = {
          landmarks,
          palmX,
          palmY,
          indexTip,
          isRaised
        };
        allHands.push(handObj);

        if (palmX < 0.50) {
          p1Hands.push(handObj);
        } else {
          p2Hands.push(handObj);
        }
      }

      const dt = this.lastMultiTimestamp > 0 ? Math.max(0.016, (timestamp - this.lastMultiTimestamp) / 1000) : 0.033;
      this.lastMultiTimestamp = timestamp;

      // Process Player 1 (Left Half: 0.0 .. 0.50)
      let p1Data = null;
      if (p1Hands.length > 0) {
        // Pick primary hand (the highest or closest)
        p1Hands.sort((a, b) => a.palmY - b.palmY);
        const best = p1Hands[0];
        const normX = Math.max(0, Math.min(1.0, (best.palmX - 0.05) / 0.40));

        let waveVelocity = 0;
        if (this.prevP1PalmX !== null && this.prevP1PalmY !== null) {
          const dx = (best.palmX - this.prevP1PalmX) * 640;
          const dy = (best.palmY - this.prevP1PalmY) * 480;
          waveVelocity = Math.hypot(dx, dy) / dt;
        }
        this.prevP1PalmX = best.palmX;
        this.prevP1PalmY = best.palmY;

        p1Data = {
          landmarks: best.landmarks,
          palmX: best.palmX,
          palmY: best.palmY,
          normX,
          isRaised: best.isRaised,
          waveVelocity,
          handCount: p1Hands.length
        };
      } else {
        this.prevP1PalmX = null;
        this.prevP1PalmY = null;
      }

      // Process Player 2 (Right Half: 0.50 .. 1.00)
      let p2Data = null;
      if (p2Hands.length > 0) {
        p2Hands.sort((a, b) => a.palmY - b.palmY);
        const best = p2Hands[0];
        const normX = Math.max(0, Math.min(1.0, (best.palmX - 0.55) / 0.40));

        let waveVelocity = 0;
        if (this.prevP2PalmX !== null && this.prevP2PalmY !== null) {
          const dx = (best.palmX - this.prevP2PalmX) * 640;
          const dy = (best.palmY - this.prevP2PalmY) * 480;
          waveVelocity = Math.hypot(dx, dy) / dt;
        }
        this.prevP2PalmX = best.palmX;
        this.prevP2PalmY = best.palmY;

        p2Data = {
          landmarks: best.landmarks,
          palmX: best.palmX,
          palmY: best.palmY,
          normX,
          isRaised: best.isRaised,
          waveVelocity,
          handCount: p2Hands.length
        };
      } else {
        this.prevP2PalmX = null;
        this.prevP2PalmY = null;
      }

      return {
        allHands,
        p1: p1Data,
        p2: p2Data
      };
    } catch (err) {
      return null;
    }
  }
}
