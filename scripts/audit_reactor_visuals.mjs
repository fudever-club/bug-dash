import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const outDir = path.join(projectRoot, 'audit_screenshots');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const playwrightPath = '/mnt/d/THStudy/DeverClub/DEVER_TOWN/node_modules/playwright-core/index.mjs';
const { chromium } = await import(playwrightPath);

console.log('[AUDIT] Launching Chromium...');
const browser = await chromium.launch({
  executablePath: '/home/acc3/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
  timeout: 30000
});

const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1
});

const page = await context.newPage();

await context.route('**fonts.googleapis.com/**', route => route.abort());
await context.route('**fonts.gstatic.com/**', route => route.abort());

await page.goto('http://127.0.0.1:3001/', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(2000);

// 1. Initial Screen
await page.screenshot({ path: path.join(outDir, '01_initial_home.png') });
console.log('[AUDIT] Saved 01_initial_home.png');

// 2. Click Reactor Rush Tab
console.log('[AUDIT] Clicking #tabModeReactor...');
await page.click('#tabModeReactor');
await page.waitForTimeout(600);
await page.screenshot({ path: path.join(outDir, '02_reactor_start_modal.png') });
console.log('[AUDIT] Saved 02_reactor_start_modal.png');

// 3. Inspect Modal Hero Background and Image Sources
const auditInfo = await page.evaluate(() => {
  const app = window.bugDashApp;
  const re = app ? app.reactorEngine : null;
  const modalHeroBg = document.getElementById('modalHeroBg');
  
  return {
    gameMode: app ? app.gameMode : null,
    hasReactorEngine: !!re,
    bgSrcRound1: re ? re.bgImages.round1.src : null,
    bgCompleteRound1: re ? re.bgImages.round1.complete : null,
    bgNaturalWidthRound1: re ? re.bgImages.round1.naturalWidth : null,
    bgNaturalHeightRound1: re ? re.bgImages.round1.naturalHeight : null,
    bgSrcRound2: re ? re.bgImages.round2.src : null,
    bgCompleteRound2: re ? re.bgImages.round2.complete : null,
    bgNaturalWidthRound2: re ? re.bgImages.round2.naturalWidth : null,
    bgNaturalHeightRound2: re ? re.bgImages.round2.naturalHeight : null,
    bgSrcRound3: re ? re.bgImages.round3.src : null,
    bgCompleteRound3: re ? re.bgImages.round3.complete : null,
    bgNaturalWidthRound3: re ? re.bgImages.round3.naturalWidth : null,
    bgNaturalHeightRound3: re ? re.bgImages.round3.naturalHeight : null,
    bgSrcVictory: re ? re.bgImages.victory.src : null,
    bgCompleteVictory: re ? re.bgImages.victory.complete : null,
    bgNaturalWidthVictory: re ? re.bgImages.victory.naturalWidth : null,
    bgNaturalHeightVictory: re ? re.bgImages.victory.naturalHeight : null,
    modalHeroBgStyle: modalHeroBg ? modalHeroBg.getAttribute('style') : null,
    stage: re ? re.stage : null
  };
});
console.log('[AUDIT] Reactor Inspection Data:', JSON.stringify(auditInfo, null, 2));

// 4. Click Start Game to enter Calibration
console.log('[AUDIT] Clicking #btnStartGame...');
await page.click('#btnStartGame');
await page.waitForTimeout(800);
await page.screenshot({ path: path.join(outDir, '03_stage_calibration.png') });
console.log('[AUDIT] Saved 03_stage_calibration.png');

// 5. Transition to Round 1: Energy Catch
await page.evaluate(() => {
  const re = window.bugDashApp.reactorEngine;
  re.stage = 'round1_energy';
  re.stageTime = 0;
  // Put P1 and P2 in lively states with some score
  re.p1.x = 200;
  re.p2.x = 440;
  re.p1.score = 250;
  re.p2.score = 310;
  re.totalScore = 560;
  re.r1Items = [
    { x: 200, y: 350, type: 'energy', value: 10, vy: 120, pulse: 0, pIndex: 0 },
    { x: 440, y: 400, type: 'energy', value: 25, vy: 140, pulse: 1, pIndex: 1 }
  ];
  re.r1SyncActive = true;
  re.r1SyncTimer = 1.0;
});
await page.waitForTimeout(500);
await page.screenshot({ path: path.join(outDir, '04_stage_round1_energy.png') });
console.log('[AUDIT] Saved 04_stage_round1_energy.png');

// 6. Transition to Round 2: Duo Circuit
await page.evaluate(() => {
  const re = window.bugDashApp.reactorEngine;
  re.stage = 'round2_circuit';
  re.stageTime = 5;
  re.p1.handRaised = true;
  re.p2.handRaised = true;
  re.r2Charge = 0.75;
  re.r2PulsesCompleted = 2;
});
await page.waitForTimeout(500);
await page.screenshot({ path: path.join(outDir, '05_stage_round2_circuit.png') });
console.log('[AUDIT] Saved 05_stage_round2_circuit.png');

// 7. Transition to Round 3: Cool The Core
await page.evaluate(() => {
  const re = window.bugDashApp.reactorEngine;
  re.stage = 'round3_cooling';
  re.stageTime = 10;
  re.coreTemp = 38.5;
  re.finalBoostActive = true;
  re.p1.waveVelocity = 120;
  re.p2.waveVelocity = 140;
});
await page.waitForTimeout(500);
await page.screenshot({ path: path.join(outDir, '06_stage_round3_cooling.png') });
console.log('[AUDIT] Saved 06_stage_round3_cooling.png');

// 8. Transition to Mission Complete
await page.evaluate(() => {
  const re = window.bugDashApp.reactorEngine;
  re.stage = 'mission_complete';
  re.totalScore = 1850;
  re.displayScore = 1850;
});
await page.waitForTimeout(500);
await page.screenshot({ path: path.join(outDir, '07_stage_mission_complete.png') });
console.log('[AUDIT] Saved 07_stage_mission_complete.png');

// 9. Inspect Code Slicer & Flappy Buggy Bots
console.log('[AUDIT] Inspecting Code Slicer...');
await page.click('#tabModeSlicer');
await page.waitForTimeout(500);
await page.screenshot({ path: path.join(outDir, '08_slicer_modal.png') });
await page.click('#btnStartGame');
await page.waitForTimeout(500);
await page.screenshot({ path: path.join(outDir, '09_slicer_gameplay.png') });

console.log('[AUDIT] Inspecting Flappy Buggy...');
await page.click('#tabModeFlappy');
await page.waitForTimeout(500);
await page.screenshot({ path: path.join(outDir, '10_flappy_modal.png') });
await page.click('#btnStartGame');
await page.waitForTimeout(500);
await page.screenshot({ path: path.join(outDir, '11_flappy_gameplay.png') });

console.log('[AUDIT] Console Errors:', consoleErrors);
await browser.close();
console.log('[AUDIT] Done!');
