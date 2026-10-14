// FU-DEVER BUG DASH - Automated Verification for PR Catcher & DualFaceTracker

import { DualFaceTracker } from '../src/vision/dualTracker.js';
import { Spawner } from '../src/engine/Spawner.js';
import { CollisionSystem } from '../src/engine/Collision.js';
import { GAME_CONFIG, SPLIT_CONFIG, CATCHER_DEFINITIONS } from '../src/config.js';

function log(msg) {
  console.log(`[TEST-LOGIC] ${msg}`);
}

async function runLogicTests() {
  log('Starting PR Catcher & DualFaceTracker unit test suite...');

  // 1. Test Spawner in "catcher" mode
  const spawner = new Spawner();
  spawner.update(1.0, 60, "analog", "catcher");
  if (spawner.items.length === 0) {
    throw new Error('Spawner should have spawned at least 1 item in catcher mode');
  }
  const item = spawner.items[0];
  log(`Catcher item spawned: ${item.label} (${item.isObstacle ? 'Hazard' : 'Reward'}) at X: ${Math.round(item.x)}`);

  // Verify item is from CATCHER_DEFINITIONS
  const inPool = CATCHER_DEFINITIONS.some(d => d.type === item.type);
  if (!inPool) {
    throw new Error(`Item ${item.type} not in CATCHER_DEFINITIONS!`);
  }
  log('Catcher item pool verified against CATCHER_DEFINITIONS');

  // 2. Test Collision with Catcher Basket Radius (52px)
  const playerX = 320;
  const caughtReward = { x: 330, y: 600, radius: 26 };
  const missedReward = { x: 420, y: 600, radius: 26 };

  const didCatch = CollisionSystem.check(playerX, 600, 52, caughtReward);
  const didMiss = CollisionSystem.check(playerX, 600, 52, missedReward);

  if (!didCatch || didMiss) {
    throw new Error(`Catcher collision failed: didCatch=${didCatch}, didMiss=${didMiss}`);
  }
  log('Catcher collector cradle 52px collision radius verified');

  // 3. Test DualFaceTracker Partitioning and Locking
  let bothLockedTriggered = false;
  const dual = new DualFaceTracker(() => {
    bothLockedTriggered = true;
  });

  const now0 = 1000;
  const faces = [
    { x: 0.20, y: 0.25, w: 0.18, h: 0.24, tilt: 0, rollAngle: 0 }, // P1 (Left side)
    { x: 0.70, y: 0.25, w: 0.18, h: 0.24, tilt: 0, rollAngle: 0 }  // P2 (Right side)
  ];

  // Initial candidate detection
  dual.update(faces, now0);
  let status = dual.getStatus();
  if (status.p1.phase !== 'cand' || status.p2.phase !== 'cand') {
    throw new Error(`Expected candidate phase, got p1=${status.p1.phase}, p2=${status.p2.phase}`);
  }
  log('DualFaceTracker candidate phase verified for both P1 and P2');

  // After 1100ms stable detection -> should lock both players
  const now1 = now0 + 1100;
  dual.update(faces, now1);
  status = dual.getStatus();

  if (status.p1.phase !== 'lock' || status.p2.phase !== 'lock') {
    throw new Error(`Expected lock phase, got p1=${status.p1.phase}, p2=${status.p2.phase}`);
  }
  if (!bothLockedTriggered) {
    throw new Error('onBothLocked callback was not triggered!');
  }
  log('DualFaceTracker 1-camera simultaneous lock verified for P1 & P2');

  // 4. Test Head Tilt & Steering Response in Split-Screen
  // P1 tilts left (tilt = -0.6)
  const tiltedFaces = [
    { x: 0.16, y: 0.25, w: 0.18, h: 0.24, tilt: -0.6, rollAngle: -0.25 },
    { x: 0.76, y: 0.25, w: 0.18, h: 0.24, tilt: 0.6, rollAngle: 0.25 }
  ];
  dual.update(tiltedFaces, now1 + 50);
  status = dual.getStatus();

  if (status.p1.analogNormalized >= 0.5) {
    throw new Error(`P1 tilting left should yield analogNormalized < 0.5, got ${status.p1.analogNormalized}`);
  }
  if (status.p2.analogNormalized <= 0.5) {
    throw new Error(`P2 tilting right should yield analogNormalized > 0.5, got ${status.p2.analogNormalized}`);
  }
  log(`P1 & P2 independent steering verified: P1 norm = ${status.p1.analogNormalized.toFixed(2)}, P2 norm = ${status.p2.analogNormalized.toFixed(2)}`);

  // 5. Test Split-Screen Spawner Lanes
  const spawnerP1 = new Spawner(SPLIT_CONFIG.p1Lanes, SPLIT_CONFIG.p1RoadBounds);
  const spawnerP2 = new Spawner(SPLIT_CONFIG.p2Lanes, SPLIT_CONFIG.p2RoadBounds);

  spawnerP1.update(1.5, 60, "snap3", "splitscreen");
  spawnerP2.update(1.5, 60, "snap3", "splitscreen");

  if (spawnerP1.items.length === 0 || spawnerP2.items.length === 0) {
    throw new Error('Split-screen spawners should generate items for both tracks');
  }

  const p1ItemX = spawnerP1.items[0].x;
  const p2ItemX = spawnerP2.items[0].x;

  if (p1ItemX < 0 || p1ItemX > 320) {
    throw new Error(`P1 item X (${p1ItemX}) is outside P1 half (0..320)`);
  }
  if (p2ItemX < 320 || p2ItemX > 640) {
    throw new Error(`P2 item X (${p2ItemX}) is outside P2 half (320..640)`);
  }
  log(`Split-Screen tracks spatially partitioned: P1 Item X=${p1ItemX}, P2 Item X=${p2ItemX}`);

  log('========================================================');
  log('ALL PR CATCHER & SPLIT-SCREEN LOGIC TESTS PASSED (100%)!');
  log('========================================================');
}

runLogicTests().then(() => {
  process.exit(0);
}).catch(err => {
  console.error('[TEST ERROR]', err);
  process.exit(1);
});
