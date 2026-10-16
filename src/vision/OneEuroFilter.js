// FU-DEVER BUG DASH - 1€ Filter (One Euro Filter)
// Reference: Casiez, Roussel, Vogel (CHI 2012)
// Adaptive low-pass filter that eliminates jitter at low speeds and eliminates lag at high speeds.

class LowPassFilter {
  constructor(alpha = 0.5, initVal = 0) {
    this.s = initVal;
    this.alpha = Math.max(0, Math.min(1, alpha));
    this.initialized = false;
  }

  setAlpha(alpha) {
    this.alpha = Math.max(0, Math.min(1, alpha));
  }

  filter(val) {
    if (!this.initialized) {
      this.s = val;
      this.initialized = true;
      return val;
    }
    this.s = this.alpha * val + (1 - this.alpha) * this.s;
    return this.s;
  }

  filterWithAlpha(val, alpha) {
    this.setAlpha(alpha);
    return this.filter(val);
  }

  last() {
    return this.s;
  }

  reset() {
    this.initialized = false;
  }
}

export class OneEuroFilter {
  constructor(freq = 30, minCutoff = 1.0, beta = 3.5, dCutoff = 1.0) {
    this.freq = Math.max(1, freq);
    this.minCutoff = Math.max(0.001, minCutoff);
    this.beta = Math.max(0, beta);
    this.dCutoff = Math.max(0.001, dCutoff);

    this.xFilter = new LowPassFilter(this.calcAlpha(this.minCutoff, this.freq));
    this.dxFilter = new LowPassFilter(this.calcAlpha(this.dCutoff, this.freq));
    this.lastTime = 0;
  }

  calcAlpha(cutoff, rate) {
    const te = 1.0 / rate;
    const tau = 1.0 / (2 * Math.PI * cutoff);
    return 1.0 / (1.0 + tau / te);
  }

  filter(val, timestamp = performance.now()) {
    if (this.lastTime === 0) {
      this.lastTime = timestamp;
      return this.xFilter.filter(val);
    }

    const dt = Math.max(0.001, (timestamp - this.lastTime) / 1000);
    this.freq = 1.0 / dt;
    this.lastTime = timestamp;

    const prevX = this.xFilter.last();
    const dx = (val - prevX) * this.freq;
    const edx = this.dxFilter.filterWithAlpha(dx, this.calcAlpha(this.dCutoff, this.freq));

    // Dynamic cutoff frequency: increases as velocity increases
    const cutoff = this.minCutoff + this.beta * Math.abs(edx);
    return this.xFilter.filterWithAlpha(val, this.calcAlpha(cutoff, this.freq));
  }

  reset() {
    this.xFilter.reset();
    this.dxFilter.reset();
    this.lastTime = 0;
  }
}
