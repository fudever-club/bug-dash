// FU-DEVER BUG DASH - MediaPipe BlazeFace Detector Wrapper
// Initializes and runs BlazeFace Short-Range model with GPU delegate.

import { FilesetResolver, FaceDetector } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/+esm";
import { VISION_CONFIG } from "../config.js";

export class FaceDetectorWrapper {
  constructor() {
    this.detector = null;
    this.isReady = false;
  }

  async init() {
    try {
      const vision = await FilesetResolver.forVisionTasks(VISION_CONFIG.wasmUrl);
      this.detector = await FaceDetector.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: VISION_CONFIG.modelUrl,
          delegate: "GPU",
        },
        runningMode: "VIDEO",
        minDetectionConfidence: 0.5,
      });
      this.isReady = true;
      return true;
    } catch (err) {
      console.error("[FaceDetectorWrapper] MediaPipe initialization error:", err);
      this.isReady = false;
      throw err;
    }
  }

  detectForVideo(videoElement, timestamp) {
    if (!this.isReady || !this.detector) return [];
    try {
      const result = this.detector.detectForVideo(videoElement, timestamp);
      const W = videoElement.videoWidth || 640;
      const H = videoElement.videoHeight || 480;

      // Normalize bounding boxes (mirrored for intuitive left-right steering)
      return result.detections.map(d => {
        const b = d.boundingBox;
        return {
          // Flip X horizontally so player tilting right maps to right lane
          x: 1 - (b.originX + b.width) / W,
          y: b.originY / H,
          w: b.width / W,
          h: b.height / H,
          confidence: (d.categories && d.categories[0]) ? d.categories[0].score : 1.0
        };
      });
    } catch (err) {
      console.warn("[FaceDetectorWrapper] Detection frame error:", err);
      return [];
    }
  }
}
