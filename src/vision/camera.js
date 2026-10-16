// FU-DEVER BUG DASH - Camera Stream Controller
// Manages webcam lifecycle, permissions, and video resolution.

export class CameraController {
  constructor(videoElement) {
    this.video = videoElement;
    this.stream = null;
    this.isActive = false;
  }

  async start(options = {}) {
    const width = options.width || 640;
    const height = options.height || 480;

    const constraints = {
      audio: false,
      video: {
        width: { ideal: width },
        height: { ideal: height },
        facingMode: "user",
        frameRate: { ideal: 60, min: 30 }
      }
    };

    try {
      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.video.srcObject = this.stream;
      await this.video.play();
      this.isActive = true;
      return true;
    } catch (err) {
      console.error("[CameraController] Failed to acquire camera stream:", err);
      this.isActive = false;
      throw err;
    }
  }

  stop() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    if (this.video) {
      this.video.srcObject = null;
    }
    this.isActive = false;
  }

  getVideoSize() {
    return {
      width: this.video.videoWidth || 640,
      height: this.video.videoHeight || 480
    };
  }
}
