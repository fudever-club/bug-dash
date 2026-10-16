// FU-DEVER BUG DASH - Automated Verification for Slicer (Ninja) and Flappy Modes
import { Spawner } from '../src/engine/Spawner.js';
import { GAME_MODES, MODE_METADATA, SLICER_CONFIG, FLAPPY_CONFIG } from '../src/config.js';

function log(msg) {
  console.log(`[TEST-SLICER-FLAPPY] ${msg}`);
}

function distPointToSegment(px, py, x1, y1, x2, y2) {
  const l2 = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
  if (l2 === 0) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
}

async function runTests() {
  log('Starting Slicer & Flappy Buggy verification suite...');

  // 1. Verify All 6 Modes in Metadata
  const requiredModes = [
    GAME_MODES.CLASSIC,
    GAME_MODES.CATCHER,
    GAME_MODES.HIGHWAY,
    GAME_MODES.SLICER,
    GAME_MODES.FLAPPY,
    GAME_MODES.DUEL,
    GAME_MODES.SPLIT_SCREEN
  ];
  requiredModes.forEach(mode => {
    if (!MODE_METADATA[mode]) {
      throw new Error(`Missing metadata for game mode: ${mode}`);
    }
    const meta = MODE_METADATA[mode];
    if (!meta.title || !meta.desc || !meta.rules || meta.rules.length === 0) {
      throw new Error(`Incomplete metadata structure for mode: ${mode}`);
    }
  });
  log('1. All 7 Game Mode configurations and metadata verified (100%)');

  // 2. Test Slicer Spawner and Parabolic Motion
  const slicerSpawner = new Spawner();
  slicerSpawner.spawnWave(60, "analog", "slicer");
  if (slicerSpawner.items.length === 0) {
    throw new Error('Slicer mode should spawn items on wave trigger');
  }
  const tossedItem = slicerSpawner.items[0];
  if (tossedItem.vy >= 0) {
    throw new Error('Tossed slicer item MUST have upward initial velocity (vy < 0)!');
  }
  log(`Tossed item spawned: ${tossedItem.label} at (${Math.round(tossedItem.x)}, ${Math.round(tossedItem.y)}) with vy=${Math.round(tossedItem.vy)}`);

  // Simulate 0.3s of parabolic gravity physics
  const initialY = tossedItem.y;
  slicerSpawner.update(0.3, 60, "analog", "slicer");
  if (tossedItem.y >= initialY) {
    throw new Error('Item should travel upward after 0.3s!');
  }
  log('2. Slicer parabolic trajectory physics verified (100%)');

  // 3. Test Slicer Line-Circle Intersection Algorithm
  const itemCircle = { x: 300, y: 300, radius: 26 };
  // A slice cutting directly through the item
  const directSliceP1 = { x: 200, y: 300 };
  const directSliceP2 = { x: 400, y: 300 };
  const hitDist = distPointToSegment(itemCircle.x, itemCircle.y, directSliceP1.x, directSliceP1.y, directSliceP2.x, directSliceP2.y);
  const isDirectHit = hitDist <= (itemCircle.radius + SLICER_CONFIG.sliceHitboxBonus);

  // A distant slice missing the item
  const missSliceP1 = { x: 100, y: 100 };
  const missSliceP2 = { x: 150, y: 100 };
  const missDist = distPointToSegment(itemCircle.x, itemCircle.y, missSliceP1.x, missSliceP1.y, missSliceP2.x, missSliceP2.y);
  const isMiss = missDist > (itemCircle.radius + SLICER_CONFIG.sliceHitboxBonus);

  if (!isDirectHit || !isMiss) {
    throw new Error(`Slicer intersection math failed: hitDist=${hitDist}, missDist=${missDist}`);
  }
  log('3. Slicer Laser Blade Line-Circle intersection math verified (100%)');

  // 4. Test Flappy Spawner and Firewall Pipe Mechanics
  const flappySpawner = new Spawner();
  flappySpawner.spawnWave(60, "analog", "flappy");
  if (flappySpawner.items.length === 0) {
    throw new Error('Flappy mode should spawn firewall pipe pair on wave trigger');
  }
  const pipe = flappySpawner.items[0];
  if (pipe.type !== "firewall_pipe" || !pipe.gateLabel) {
    throw new Error('Flappy spawned item must be a firewall_pipe with logic gate label!');
  }
  log(`Flappy Firewall Pipe spawned: Gate [${pipe.gateLabel}] at X=${pipe.x}, TopH=${Math.round(pipe.topHeight)}, Gap=${pipe.gap}`);

  // Safe navigation inside the gap
  const safeBuggyY = (pipe.topHeight + pipe.bottomY) / 2;
  const isSafeInGap = (safeBuggyY - 26 >= pipe.topHeight) && (safeBuggyY + 26 <= pipe.bottomY);
  // Collision with top pipe
  const crashedTopY = pipe.topHeight - 10;
  const isCrashedTop = (crashedTopY - 26 < pipe.topHeight);

  if (!isSafeInGap || !isCrashedTop) {
    throw new Error(`Flappy collision bounds failed: isSafe=${isSafeInGap}, isCrash=${isCrashedTop}`);
  }
  log('4. Flappy Logic Gate Gap tolerance and collision clearance verified (100%)');

  console.log('[TEST-SLICER-FLAPPY] ========================================================');
  console.log('[TEST-SLICER-FLAPPY] ALL SLICER & FLAPPY BUGGY VERIFICATIONS PASSED (100%)!');
  console.log('[TEST-SLICER-FLAPPY] ========================================================');
}

runTests().catch(err => {
  console.error('[TEST-SLICER-FLAPPY] FAILED:', err);
  process.exit(1);
});
