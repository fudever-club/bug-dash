// FU-DEVER BUG DASH - 1€ Filter, Ultra-Low Latency & Vertical Gesture Test Suite
import assert from "node:assert";
import { OneEuroFilter } from "../src/vision/OneEuroFilter.js";
import { FaceTracker } from "../src/vision/tracker.js";
import { LaneController } from "../src/vision/laneController.js";
import { VISION_CONFIG } from "../src/config.js";

console.log("[TEST-1EURO] Starting 1€ Filter, Latency, and Vertical Gesture verification...");

// 1. OneEuroFilter Unit Tests
const filter = new OneEuroFilter(30, 1.0, 3.5, 1.0);

// Test A: Initial value passes through directly
const initVal = filter.filter(0.50, 1000);
assert.strictEqual(initVal, 0.50, "First value should be output without distortion");

// Test B: Anti-Jitter when stationary (Low speed filtering)
// Feed small jitter around 0.50 (+-0.01) at 30 FPS (~33ms intervals)
let t = 1000;
let smoothed = initVal;
const jitters = [0.51, 0.49, 0.51, 0.50, 0.49, 0.51, 0.50];
for (const j of jitters) {
  t += 33.3;
  smoothed = filter.filter(j, t);
}
// Smoothed value must stay within a very tight band around 0.50 (<0.004 deviation)
assert(Math.abs(smoothed - 0.50) < 0.004, `Low-speed jitter was not suppressed sufficiently: got ${smoothed}`);
console.log("[TEST-1EURO] 1. Low-speed jitter suppression verified (100%)");

// Test C: High-speed Responsiveness (Speed coefficient beta dynamically opens cutoff)
// Sudden rapid head dodge: jumping from 0.50 to 0.75 within 66ms (2 frames)
t += 33.3;
const step1 = filter.filter(0.65, t);
t += 33.3;
const step2 = filter.filter(0.75, t);
// High speed response should adaptively track the rapid shift (>0.65 on frame 2, >0.71 on frame 3)
assert(step2 > 0.65, `High speed filter did not adapt quickly enough: got ${step2}`);
t += 33.3;
const step3 = filter.filter(0.75, t);
assert(step3 > 0.71, `Frame 3 response should exceed 0.71: got ${step3}`);
console.log("[TEST-1EURO] 2. High-speed rapid dodge responsiveness verified (100%)");


// 2. FaceTracker Integration with 1€ Filter & Vertical Gestures
console.log("[TEST-1EURO] 3. Verifying FaceTracker with 1€ Filter & Vertical Gestures...");

let lockedBox = null;
const tracker = new FaceTracker((box) => {
  lockedBox = box;
});

// A. Candidate lock in ROI
let now = 1000;
const centerFace = { x: 0.35, y: 0.30, w: 0.30, h: 0.40, tilt: 0, rollAngle: 0 };

tracker.update([centerFace], now);
assert.strictEqual(tracker.phase, "cand", "Face in ROI must enter candidate phase");

// Advance past lockMs (1000ms)
now += 1100;
tracker.update([centerFace], now);
assert.strictEqual(tracker.phase, "lock", "Face must transition to lock phase");
assert.notStrictEqual(lockedBox, null, "onLock callback must be triggered");

// B. Steer Tension & Lane Snap Check
// Simulate player tilting head right (+15 deg ~ 0.26 rad) and shifting right (cx = 0.58)
now += 33.3;
const rightTiltFace = { x: 0.43, y: 0.30, w: 0.30, h: 0.40, tilt: 0.20, rollAngle: 0.25 };
tracker.update([rightTiltFace], now);
const status = tracker.getStatus();

assert(status.effectiveSteer > 0, "Right tilt and shift must produce positive effectiveSteer");
assert(status.steerTension > 0.5, "Tension gauge must reflect right steering pressure");

const laneCtrl = new LaneController();
laneCtrl.updateFromTracker(status);
assert.strictEqual(laneCtrl.currentLane, 2, "Strong right steering must snap to Lane 2 (Right)");
console.log("[TEST-1EURO] 4. Steer Tension & Right Lane Snap verified (100%)");


// C. Vertical Jump Detection via Face Velocity (dY/dt)
// Baseline face at y = 0.30 (cy = 0.45).
// Rapid upward head surge: player jumps up -> y moves from 0.30 to 0.22 (cy = 0.37) within 40ms
now += 40;
const jumpFace = { x: 0.35, y: 0.22, w: 0.30, h: 0.40, tilt: 0, rollAngle: 0 };
tracker.update([jumpFace], now);
const jumpStatus = tracker.getStatus();

assert.strictEqual(jumpStatus.isJump, true, "Rapid upward head movement must trigger isJump: true");
assert.strictEqual(jumpStatus.isDuck, false, "Jump gesture must not trigger isDuck");
console.log("[TEST-1EURO] 5. Face-based Jump Detection via dY/dt verified (100%)");


// D. Vertical Duck / Slide Detection via Face Velocity (dY/dt)
// Wait for cooldown (400ms)
now += 450;
// Steady face
tracker.update([{ x: 0.35, y: 0.30, w: 0.30, h: 0.40, tilt: 0, rollAngle: 0 }], now);

// Rapid downward head surge: player crouches -> y moves from 0.30 to 0.40 (cy = 0.55) within 40ms
now += 40;
const duckFace = { x: 0.35, y: 0.40, w: 0.30, h: 0.40, tilt: 0, rollAngle: 0 };
tracker.update([duckFace], now);
const duckStatus = tracker.getStatus();

assert.strictEqual(duckStatus.isDuck, true, "Rapid downward head movement must trigger isDuck: true");
assert.strictEqual(duckStatus.isJump, false, "Duck gesture must not trigger isJump");
console.log("[TEST-1EURO] 6. Face-based Slide / Duck Detection via dY/dt verified (100%)");

console.log("[TEST-1EURO] ========================================================");
console.log("[TEST-1EURO] ALL 1€ FILTER, LATENCY & GESTURE TESTS PASSED (100%)!");
console.log("[TEST-1EURO] ========================================================");
