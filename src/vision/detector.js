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
        let rollAngle = 0;
        let tilt = 0;

        // Compute Head Tilt (Roll angle) from eye keypoints if available
        if (d.keypoints && d.keypoints.length >= 2) {
          const kp0 = d.keypoints[0]; // Subject's right eye
          const kp1 = d.keypoints[1]; // Subject's left eye
          if (kp0 && kp1) {
            // Mirrored X coordinates
            const eyeRx = 1 - kp0.x;
            const eyeRy = kp0.y;
            const eyeLx = 1 - kp1.x;
            const eyeLy = kp1.y;

            const dx = eyeRx - eyeLx;
            const dy = eyeRy - eyeLy;
            if (Math.abs(dx) > 0.001) {
              rollAngle = Math.atan2(dy, dx); // radians
              // Normalize to [-1.0, 1.0] for +/-20 degrees (~0.35 rad)
              tilt = Math.max(-1.0, Math.min(1.0, rollAngle / 0.35));
            }
          }
        }

        // Nose tip keypoint (index 2 in BlazeFace standard)
        let noseX = 1 - (b.originX + b.width / 2) / W;
        let noseY = (b.originY + b.height * 0.55) / H;
        if (d.keypoints && d.keypoints.length >= 3 && d.keypoints[2]) {
          noseX = 1 - d.keypoints[2].x;
          noseY = d.keypoints[2].y;
        }

        return {
          // Flip X horizontally so player tilting right maps to right lane
          x: 1 - (b.originX + b.width) / W,
          y: b.originY / H,
          w: b.width / W,
          h: b.height / H,
          confidence: (d.categories && d.categories[0]) ? d.categories[0].score : 1.0,
          rollAngle: rollAngle,
          tilt: tilt,
          nose: { x: noseX, y: noseY }
        };
      });
    } catch (err) {
      console.warn("[FaceDetectorWrapper] Detection frame error:", err);
      return [];
    }
  }
}
