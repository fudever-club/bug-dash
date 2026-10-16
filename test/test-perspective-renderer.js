// FU-DEVER BUG DASH - Verification of Pseudo-3D Perspective Math & Zero-Regression
import { RoadRenderer } from '../src/engine/RoadRenderer.js';
import { GAME_CONFIG } from '../src/config.js';

function log(msg) {
  console.log(`[TEST-PERSPECTIVE] ${msg}`);
}

async function runPerspectiveTests() {
  log('Starting Pseudo-3D Perspective Math & Visual Alignment verification...');

  // Mock canvas and 2D context for headless node environment
  const mockCanvas = {
    width: 640,
    height: 720,
    getContext: () => ({
      save: () => {},
      restore: () => {},
      translate: () => {},
      scale: () => {},
      rotate: () => {},
      beginPath: () => {},
      closePath: () => {},
      moveTo: () => {},
      lineTo: () => {},
      stroke: () => {},
      fill: () => {},
      fillRect: () => {},
      strokeRect: () => {},
      arc: () => {},
      ellipse: () => {},
      roundRect: () => {},
      fillText: () => {},
      drawImage: () => {},
      createLinearGradient: () => ({ addColorStop: () => {} }),
      createRadialGradient: () => ({ addColorStop: () => {} }),
      setLineDash: () => {},
    })
  };

  const renderer = new RoadRenderer(mockCanvas);

  // 1. Perspective Scale Monotonicity & Baseline Checks
  const sHorizon = renderer.getPerspectiveScale(160);
  const sPlayer = renderer.getPerspectiveScale(600);
  const sBottom = renderer.getPerspectiveScale(720);

  log(`Scale checks: Horizon(160)=${sHorizon.toFixed(3)}, Player(600)=${sPlayer.toFixed(3)}, Bottom(720)=${sBottom.toFixed(3)}`);

  if (Math.abs(sPlayer - 1.0) > 0.001) {
    throw new Error(`Scale at player baseline (y=600) MUST be exactly 1.0, got: ${sPlayer}`);
  }
  if (sHorizon >= sPlayer || sPlayer >= sBottom) {
    throw new Error('Perspective scale must be strictly monotonic increasing from horizon to bottom!');
  }
  log('1. Perspective Scale monotonic gradient verified (100%)');

  // 2. Road Curvature & Banking Invariance at Player Baseline
  renderer.roadCurve = 0.85; // Full sharp right curve
  const offsetPlayer = renderer.getCurveOffset(600, 1.0);
  const offsetHorizon = renderer.getCurveOffset(160, sHorizon);

  log(`Curve offsets: At Player=${offsetPlayer.toFixed(3)}, At Horizon=${offsetHorizon.toFixed(3)}`);
  if (Math.abs(offsetPlayer) > 0.0001) {
    throw new Error(`Curvature offset at player baseline MUST be 0 to maintain hitbox alignment, got: ${offsetPlayer}`);
  }
  if (Math.abs(offsetHorizon) < 10) {
    throw new Error('Curvature offset at horizon should be pronounced for visual depth!');
  }
  log('2. Road Curvature Zero-Deflection at Player baseline verified (100%)');

  // 3. Screen Position Alignment for all 3 Lanes at y=600
  GAME_CONFIG.laneX.forEach((laneX, idx) => {
    const sp = renderer.getScreenPos(laneX, 600);
    if (Math.abs(sp.x - laneX) > 0.001) {
      throw new Error(`Lane ${idx} screen X (${sp.x}) does not match logical X (${laneX}) at y=600!`);
    }
  });
  log('3. 100% Coordinate alignment for Lane 0, Lane 1, Lane 2 at player level verified (100%)');

  // 4. Horizon Convergence Check
  // At horizon, all lanes must converge inwards toward Vanishing Point (320)
  const spL0 = renderer.getScreenPos(GAME_CONFIG.laneX[0], 160);
  const spL2 = renderer.getScreenPos(GAME_CONFIG.laneX[2], 160);
  const widthAtHorizon = spL2.x - spL0.x;
  const widthAtPlayer = GAME_CONFIG.laneX[2] - GAME_CONFIG.laneX[0];

  log(`Lane spread: At Player=${widthAtPlayer}px, At Horizon=${widthAtHorizon.toFixed(1)}px (converged)`);
  if (widthAtHorizon >= widthAtPlayer * 0.45) {
    throw new Error('Lanes did not sufficiently converge at horizon vanishing point!');
  }
  log('4. Perspective Vanishing Point Frustum Convergence verified (100%)');

  console.log('[TEST-PERSPECTIVE] ========================================================');
  console.log('[TEST-PERSPECTIVE] ALL PSEUDO-3D PERSPECTIVE RENDERING TESTS PASSED (100%)!');
  console.log('[TEST-PERSPECTIVE] ========================================================');
}

runPerspectiveTests().catch(err => {
  console.error('[TEST-PERSPECTIVE] FAILED:', err);
  process.exit(1);
});
