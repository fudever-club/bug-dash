// FU-DEVER BUG DASH - Visual FX & Particle System
// Burst sparks, dust, and floating combat text.

export class ParticleSystem {
  constructor() {
    this.particles = [];
    this.floatingTexts = [];
  }

  reset() {
    this.particles = [];
    this.floatingTexts = [];
  }

  addSparks(x, y, color = "#f59e0b", count = 12) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 60 + Math.random() * 160;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        size: 3 + Math.random() * 4,
        alpha: 1.0,
        decay: 1.8 + Math.random() * 1.2
      });
    }
  }

  addFloatingText(x, y, text, color = "#f8fafc") {
    this.floatingTexts.push({
      x,
      y,
      text,
      color,
      alpha: 1.0,
      dy: -55
    });
  }

  update(dt) {
    // Update sparks
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.alpha -= p.decay * dt;
      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // Update floating texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y += ft.dy * dt;
      ft.alpha -= dt * 1.35;
      if (ft.alpha <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  render(ctx) {
    // Render sparks
    this.particles.forEach(p => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // Render floating texts
    this.floatingTexts.forEach(ft => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, ft.alpha);
      ctx.fillStyle = ft.color;
      ctx.shadowColor = ft.color;
      ctx.shadowBlur = 10;
      ctx.font = "800 13px 'Be Vietnam Pro', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    });
  }
}
