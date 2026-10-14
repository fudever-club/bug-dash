// FU-DEVER BUG DASH - Jump, Slide, Gesture & Mode Switching Verification Suite
import assert from "node:assert";
import { CollisionSystem } from "../src/engine/Collision.js";
import { LaneController } from "../src/vision/laneController.js";
import { GAME_CONFIG, GAME_MODES, MODE_METADATA, CONTROL_INPUTS } from "../src/config.js";

console.log("[TEST-GESTURE] Starting Jump, Slide, Hand Steering & Mode metadata verification...");

// 1. Vertical Evasion Unit Tests
const groundBug = { type: "bug", label: "BUG", radius: 26, isObstacle: true, x: 320, y: 600 };
const overheadDeadline = { type: "deadline", label: "DEADLINE", radius: 30, isObstacle: true, x: 320, y: 600 };
const normalCoffee = { type: "coffee", label: "COFFEE", radius: 24, isObstacle: false, x: 320, y: 600 };

// Case A: Standing still (no jump, no slide) -> Collides with both
assert.strictEqual(
  CollisionSystem.check(320, 600, 46, groundBug, false, false),
  true,
  "Standing player must collide with ground bug"
);
assert.strictEqual(
  CollisionSystem.check(320, 600, 46, overheadDeadline, false, false),
  true,
  "Standing player must collide with overhead deadline"
);

// Case B: Jumping -> Evades ground bug, but hits overhead deadline
assert.strictEqual(
  CollisionSystem.check(320, 600, 46, groundBug, true, false),
  false,
  "Jumping player MUST evade ground bug!"
);
assert.strictEqual(
  CollisionSystem.check(320, 600, 46, overheadDeadline, true, false),
  true,
  "Jumping player still collides with overhead deadline"
);

// Case C: Sliding -> Evades overhead deadline, but hits ground bug
assert.strictEqual(
  CollisionSystem.check(320, 600, 46, overheadDeadline, false, true),
  false,
  "Sliding player MUST evade overhead deadline!"
);
assert.strictEqual(
  CollisionSystem.check(320, 600, 46, groundBug, false, true),
  true,
  "Sliding player still collides with ground bug"
);

// Case D: Non-obstacle items (rewards) are always collectible regardless of jump/slide
assert.strictEqual(
  CollisionSystem.check(320, 600, 46, normalCoffee, true, false),
  true,
  "Rewards can still be collected while jumping"
);
console.log("[TEST-GESTURE] 1. Vertical Jump/Slide collision evasion verified (100%)");

// 2. LaneController Reset & Hand Tracking Steering Tests
let changedLane = -1;
const controller = new LaneController((lane) => {
  changedLane = lane;
});

// Shift right to lane 2
controller.setLane(2, true);
assert.strictEqual(controller.currentLane, 2);

// Calling reset() must restore center lane 1, analogNormalizedX = 0.5, and analogTargetX
controller.reset();
assert.strictEqual(controller.currentLane, 1, "reset() must restore currentLane to 1");
assert.strictEqual(controller.analogNormalizedX, 0.5, "reset() must restore analogNormalizedX to 0.5");
assert.strictEqual(controller.analogTargetX, GAME_CONFIG.laneX[1], "reset() must restore target X to center lane");
console.log("[TEST-GESTURE] 2. LaneController.reset() verified (100%)");

// Hand Tracking Steering Tests
// A: Hand shifted left (palmX = 0.20)
controller.updateFromHand({ palmX: 0.15 });
assert.strictEqual(controller.currentLane, 0, "Hand on left must steer to Left Lane (0)");

// B: Hand shifted right (palmX = 0.85)
controller.updateFromHand({ palmX: 0.85 });
controller.updateFromHand({ palmX: 0.85 });
assert.strictEqual(controller.currentLane, 2, "Hand on right must steer to Right Lane (2)");

// C: Analog mode hand steering
controller.setSteeringMode("analog");
controller.updateFromHand({ palmX: 0.30 });
assert.ok(controller.analogTargetX < GAME_CONFIG.laneX[1], "Analog hand steering updates continuous targetX");
console.log("[TEST-GESTURE] 3. Hand gesture steering controller verified (100%)");

// 3. Mode Metadata Verification
const modes = [GAME_MODES.CLASSIC, GAME_MODES.CATCHER, GAME_MODES.HIGHWAY, GAME_MODES.DUEL];
modes.forEach(m => {
  const meta = MODE_METADATA[m];
  assert.ok(meta, `Metadata for mode '${m}' must exist`);
  assert.ok(meta.title && meta.title.length > 0, `Mode '${m}' must have title`);
  assert.ok(meta.badge && meta.badge.length > 0, `Mode '${m}' must have badge`);
  assert.ok(meta.desc && meta.desc.length > 0, `Mode '${m}' must have description`);
  assert.ok(Array.isArray(meta.rules) && meta.rules.length >= 3, `Mode '${m}' must have at least 3 rules`);
  assert.ok(meta.ctaText && meta.ctaText.length > 0, `Mode '${m}' must have ctaText`);
});
console.log("[TEST-GESTURE] 4. All game modes metadata verified (100%)");

console.log("[TEST-GESTURE] ========================================================");
console.log("[TEST-GESTURE] ALL JUMP, SLIDE, GESTURE & MODE METADATA TESTS PASSED (100%)!");
console.log("[TEST-GESTURE] ========================================================");
