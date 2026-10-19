// FU-DEVER BUG DASH - Web Audio API Procedural Synthesizer
// Clean, low-latency, zero-external-assets audio engine.

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.masterGain = null;

    // Load user preference
    try {
      const saved = localStorage.getItem("fudever_bugdash_muted");
      if (saved !== null) {
        this.enabled = saved !== "true";
      }
    } catch (e) {}
  }

  init() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
  }

  toggleSound() {
    this.enabled = !this.enabled;
    try {
      localStorage.setItem("fudever_bugdash_muted", (!this.enabled).toString());
    } catch (e) {}
    if (this.enabled) {
      this.playTone(600, "sine", 0.08, 0.1);
    }
    return this.enabled;
  }

  playTone(freq, type = "sine", duration = 0.1, gainLevel = 0.1) {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx || !this.masterGain) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(gainLevel, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (err) {
      // AudioContext policy warning can be safely ignored
    }
  }

  playClick() {
    this.playTone(750, "sine", 0.05, 0.08);
  }

  playLaneSwitch() {
    this.playTone(480, "triangle", 0.08, 0.1);
  }

  playLock() {
    this.playTone(600, "sine", 0.08, 0.1);
    setTimeout(() => this.playTone(960, "sine", 0.15, 0.12), 80);
  }

  playHit() {
    // Punchy low frequency hit
    this.playTone(160, "sawtooth", 0.22, 0.2);
    setTimeout(() => this.playTone(90, "triangle", 0.18, 0.18), 40);
  }

  playItemCollect() {
    this.playTone(880, "sine", 0.08, 0.1);
    setTimeout(() => this.playTone(1320, "sine", 0.12, 0.12), 65);
  }

  playBuffActive() {
    this.playTone(523, "triangle", 0.08, 0.12);
    setTimeout(() => this.playTone(659, "triangle", 0.08, 0.12), 60);
    setTimeout(() => this.playTone(784, "triangle", 0.12, 0.14), 120);
    setTimeout(() => this.playTone(1046, "sine", 0.20, 0.16), 180);
  }

  playCountdownTick() {
    this.playTone(440, "sine", 0.08, 0.1);
  }

  playCountdownGo() {
    this.playTone(880, "triangle", 0.25, 0.18);
  }

  playGameOver() {
    this.playTone(320, "sawtooth", 0.2, 0.18);
    setTimeout(() => this.playTone(240, "sawtooth", 0.25, 0.18), 180);
    setTimeout(() => this.playTone(160, "sawtooth", 0.35, 0.2), 380);
  }

  playVictory() {
    const notes = [523, 659, 784, 1046, 1318];
    notes.forEach((freq, idx) => {
      setTimeout(() => this.playTone(freq, "sine", 0.22, 0.15), idx * 100);
    });
  }

  playJump() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(280, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(640, this.ctx.currentTime + 0.16);
      gain.gain.setValueAtTime(0.14, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.16);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.16);
    } catch (e) {}
  }

  playSlide() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(220, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.18);
      gain.gain.setValueAtTime(0.09, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.18);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.18);
    } catch (e) {}
  }

  // --- REACTOR RUSH PROCEDURAL SFX ---
  playEnergyCatch() {
    this.playTone(880, "sine", 0.07, 0.1);
    setTimeout(() => this.playTone(1320, "sine", 0.09, 0.11), 50);
  }

  playSyncCombo() {
    // Harmonized bright dual-burst chord (C6 + E6 + G6)
    const notes = [1046, 1318, 1568];
    notes.forEach((freq, idx) => {
      setTimeout(() => this.playTone(freq, "sine", 0.18, 0.12), idx * 30);
    });
  }

  playSwitchClick() {
    this.playTone(420, "triangle", 0.04, 0.14);
    setTimeout(() => this.playTone(840, "sine", 0.06, 0.12), 35);
  }

  playBulbLight() {
    // Electric surge into warm glowing resonance
    this.playTone(320, "sawtooth", 0.15, 0.12);
    setTimeout(() => this.playTone(659, "triangle", 0.25, 0.15), 60);
    setTimeout(() => this.playTone(1046, "sine", 0.40, 0.18), 120);
  }

  playCoolingWhoosh() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(450, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(160, this.ctx.currentTime + 0.18);
      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.18);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.18);
    } catch (e) {}
  }

  playMissionComplete() {
    const fanfare = [523, 659, 784, 1046, 1318, 1568, 2093];
    fanfare.forEach((freq, idx) => {
      setTimeout(() => this.playTone(freq, "sine", 0.28, 0.16), idx * 85);
    });
  }
}

export const sound = new SoundEngine();
