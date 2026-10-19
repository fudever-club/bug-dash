// FU-DEVER BUG DASH — Automated Test Suite for Reactor Rush (STEM FAIR 2026)
// Verifies FSM transitions, Team Roster Rotation, Multimodal CV inputs, Sync Combo, Circuit series logic, and Core Cooling physics.

import assert from "node:assert";
import { REACTOR_CONFIG, GAME_MODES, MODE_METADATA } from "../src/config.js";
import { ReactorRushEngine, REACTOR_STAGES } from "../src/engine/ReactorRushEngine.js";

console.log("[TEST-REACTOR] Starting Reactor Rush & Team Roster verification suite...");

// Mock Canvas & 2D Context for Headless Node.js Test Runner
class MockContext2D {
  createLinearGradient() { return { addColorStop: () => {} }; }
  createRadialGradient() { return { addColorStop: () => {} }; }
  fillRect() {}
  beginPath() {}
  roundRect() {}
  fill() {}
  stroke() {}
  moveTo() {}
  lineTo() {}
  arc() {}
  ellipse() {}
  quadraticCurveTo() {}
  save() {}
  restore() {}
  translate() {}
  scale() {}
  rotate() {}
  fillText() {}
  setLineDash() {}
}

const mockCanvas = {
  width: 640,
  height: 720,
  getContext: () => new MockContext2D()
};

// 1. Verify Configuration & Mode Metadata
assert.strictEqual(GAME_MODES.REACTOR, "reactor", "GAME_MODES.REACTOR must be 'reactor'");
assert.ok(MODE_METADATA.reactor, "MODE_METADATA.reactor must be defined");
assert.strictEqual(MODE_METADATA.reactor.badge, "CO-OP STEM FAIR 2026", "Reactor badge must match");
assert.ok(REACTOR_CONFIG.round1Duration > 0, "Round 1 duration must be positive");
assert.ok(REACTOR_CONFIG.r1SyncWindow > 0, "Sync Combo window must be positive");
assert.ok(REACTOR_CONFIG.safeTemp < REACTOR_CONFIG.startTemp, "Safe temp must be lower than start temp");
console.log("[TEST-REACTOR] 1. Reactor Rush configuration & metadata verified (100%)");

// 2. Initialize Engine & Verify Team Roster System
const engine = new ReactorRushEngine(mockCanvas);
assert.strictEqual(engine.stage, REACTOR_STAGES.CALIBRATION, "Engine must start at CALIBRATION stage");

// Configure a 4-member Team
engine.setTeamRoster("TEAM ROBO-DEVER", ["Minh Nam", "Quang Nhật", "Đình Khoa", "Thái Hưng"]);
assert.strictEqual(engine.teamName, "TEAM ROBO-DEVER", "Team name must be updated to uppercase");
assert.strictEqual(engine.teamMembers.length, 4, "Team must have 4 members");

// Verify Roster Rotation for Round 1
const pair1 = engine.getActivePair();
assert.strictEqual(pair1.p1Name, "Minh Nam", "P1 Round 1 must be Member 1");
assert.strictEqual(pair1.p2Name, "Quang Nhật", "P2 Round 1 must be Member 2");
console.log(`[TEST-REACTOR] 2. Team Roster registered: ${engine.teamName} with 4 members. Round 1 Pair: ${pair1.p1Name} & ${pair1.p2Name}`);

// 3. Verify Calibration Logic (Both Hands Raised)
engine.setInputs({ p1HandRaised: true, p2HandRaised: false });
engine.update(0.5);
assert.strictEqual(engine.stage, REACTOR_STAGES.CALIBRATION, "Only P1 ready must NOT advance calibration");

// Now both raise hands
engine.setInputs({ p1HandRaised: true, p2HandRaised: true });
engine.update(REACTOR_CONFIG.calibrationDuration + 0.2);
assert.strictEqual(engine.stage, REACTOR_STAGES.ROUND_1_ENERGY, "Both hands raised must advance to ROUND_1_ENERGY");
console.log("[TEST-REACTOR] 3. Camera Calibration & Simultaneous Dual-Player Hand-Raise verified (100%)");

// 4. Verify Round 1: Energy Catch & Sync Combo
const initScore = engine.totalScore;
// Catch an energy item with P1
const mockYellowEnergy = {
  track: "p1",
  x: engine.p1.x,
  y: engine.p1.y,
  type: "yellow_plus",
  points: 10,
  isHazard: false
};
engine.handleR1Catch("p1", mockYellowEnergy);
assert.strictEqual(engine.p1.score, 10, "P1 score must increase by 10");
assert.strictEqual(engine.totalScore, initScore + 10, "Total team score must increase by 10");

// Immediate catch by P2 within sync window triggers Sync Combo
const mockGreenEnergy = {
  track: "p2",
  x: engine.p2.x,
  y: engine.p2.y,
  type: "green_plus",
  points: 20,
  isHazard: false
};
engine.handleR1Catch("p2", mockGreenEnergy);
assert.strictEqual(engine.p2.score, 20 + REACTOR_CONFIG.r1SyncBonus, "P2 must receive 20 points + Sync Bonus");
assert.strictEqual(engine.p1.score, 10 + REACTOR_CONFIG.r1SyncBonus, "P1 must receive Sync Bonus");
assert.strictEqual(engine.syncComboCount, 1, "Sync Combo count must be 1");
assert.strictEqual(engine.r1SyncActive, true, "Sync active flag must be true");
console.log(`[TEST-REACTOR] 4. Round 1 Energy Catch & Sync Combo verified! (Sync Bonus: +${REACTOR_CONFIG.r1SyncBonus})`);

// Hazard collision check
const p1BeforeHazard = engine.p1.score;
const mockHazard = {
  track: "p1",
  x: engine.p1.x,
  y: engine.p1.y,
  type: "hazard_red",
  points: -REACTOR_CONFIG.r1HazardDeduct,
  isHazard: true
};
engine.handleR1Catch("p1", mockHazard);
assert.ok(engine.p1.score < p1BeforeHazard, "Hazard must deduct score");
assert.ok(engine.p1.stunTimer > 0, "Hazard must stun robot");

// Complete Round 1 duration
engine.update(REACTOR_CONFIG.round1Duration + 1.0);
assert.strictEqual(engine.stage, REACTOR_STAGES.SWAP_ROUND_2, "Round 1 completion must transition to SWAP_ROUND_2");
console.log("[TEST-REACTOR] 5. Round 1 finished -> Intermission Swap Round 2 reached");

// 5. Verify Intermission & Roster Rotation for Round 2
const pair2 = engine.getActivePair();
assert.strictEqual(pair2.p1Name, "Đình Khoa", "Round 2 P1 must rotate to Member 3");
assert.strictEqual(pair2.p2Name, "Thái Hưng", "Round 2 P2 must rotate to Member 4");
console.log(`[TEST-REACTOR] 6. Roster Rotation verified! Round 2 Pair: ${pair2.p1Name} (P1) & ${pair2.p2Name} (P2)`);

// Skip intermission to enter Round 2
engine.skipIntermission();
assert.strictEqual(engine.stage, REACTOR_STAGES.ROUND_2_CIRCUIT, "Must advance to ROUND_2_CIRCUIT");

// 6. Verify Round 2: Duo Circuit (Series Circuit Logic)
engine.setInputs({ p1HandRaised: true, p2HandRaised: false });
engine.update(1.0);
assert.strictEqual(engine.r2PulsesCompleted, 0, "Single switch closed must NOT complete circuit");

// Both switches closed
engine.setInputs({ p1HandRaised: true, p2HandRaised: true });
engine.update(REACTOR_CONFIG.r2ChargeTimeRequired + 0.1);
assert.strictEqual(engine.r2PulsesCompleted, 1, "Both switches closed must complete circuit pulse");
assert.ok(engine.totalScore > initScore, "Circuit completion must award team score");

// Advance through remaining pulses
engine.r2PulsesCompleted = engine.r2TargetPulses;
engine.update(0.1);
assert.strictEqual(engine.stage, REACTOR_STAGES.SWAP_ROUND_3, "Round 2 complete must advance to SWAP_ROUND_3");
console.log("[TEST-REACTOR] 7. Round 2 Duo Circuit series logic verified (100%)");

// 7. Verify Intermission & Roster Rotation for Round 3
engine.skipIntermission();
assert.strictEqual(engine.stage, REACTOR_STAGES.ROUND_3_COOLING, "Must advance to ROUND_3_COOLING");
const pair3 = engine.getActivePair();
console.log(`[TEST-REACTOR] 8. Round 3 Cool The Core reached! Active Pair: ${pair3.p1Name} & ${pair3.p2Name}`);

// 8. Verify Round 3: Cool The Core Physics
assert.strictEqual(engine.coreTemp, REACTOR_CONFIG.startTemp, "Core temp must start at 90°C");

// Blast cooling waves from P1 and P2
for (let i = 0; i < 20; i++) {
  engine.triggerP1Wave();
  engine.triggerP2Wave();
  engine.update(0.1);
}

assert.ok(engine.coreTemp <= REACTOR_CONFIG.boostTemp, "Core temp must reach Final Boost threshold");
assert.strictEqual(engine.finalBoostActive, true, "Final boost must be activated");

// Continue cooling until safe temperature (28°C)
for (let i = 0; i < 30; i++) {
  engine.triggerP1Wave();
  engine.triggerP2Wave();
  engine.update(0.1);
}

assert.ok(engine.coreTemp <= REACTOR_CONFIG.safeTemp, "Core temp must reach safe temperature <= 28°C");
assert.strictEqual(engine.stage, REACTOR_STAGES.MISSION_COMPLETE, "Reaching safe temp must complete mission");
console.log(`[TEST-REACTOR] 9. Core Cooling physics verified: 90°C -> ${engine.coreTemp}°C (Safe Zone)`);

// 9. Verify Mission Complete & Full Team Honor
assert.ok(engine.totalScore >= 500, "Cumulative team score must be substantial");
assert.strictEqual(engine.teamMembers.length, 4, "All 4 members must be retained for honor screen");
console.log(`[TEST-REACTOR] 10. MISSION COMPLETE VERIFIED! Team: ${engine.teamName} | Total Points: ${engine.totalScore}`);

console.log("[TEST-REACTOR] ========================================================");
console.log("[TEST-REACTOR] ALL 10 REACTOR RUSH & MULTI-PLAYER CV TESTS PASSED (100%)!");
console.log("[TEST-REACTOR] ========================================================");
