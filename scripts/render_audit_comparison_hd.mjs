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

console.log('[HD-AUDIT] Launching Chromium in HiDPI (deviceScaleFactor = 2)...');
const browser = await chromium.launch({
  executablePath: '/home/acc3/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
  timeout: 60000
});

// Configure 2X Retina / HiDPI context (1440x960 @ 2X -> 2880x1920 physical)
const context = await browser.newContext({
  viewport: { width: 1440, height: 960 },
  deviceScaleFactor: 2
});

const page = await context.newPage();

console.log('[HD-AUDIT] Navigating to http://127.0.0.1:3001/test_gameplay_visuals.html...');
await page.goto('http://127.0.0.1:3001/test_gameplay_visuals.html', { waitUntil: 'load', timeout: 30000 });

console.log('[HD-AUDIT] Waiting for all 4 stages & animators to complete rendering...');
await page.waitForFunction(() => window.RENDER_COMPLETED === true, { timeout: 15000 });
await page.waitForTimeout(600);

// Inspect canvas diagnostic info on cvsR1
const canvasDiag = await page.evaluate(() => {
  const c1 = document.getElementById('cvsR1');
  const ctx = c1.getContext('2d');
  return {
    dpr: window.devicePixelRatio,
    canvasWidth: c1.width,
    canvasHeight: c1.height,
    clientWidth: c1.clientWidth,
    clientHeight: c1.clientHeight,
    aspectRatio: (c1.clientWidth / c1.clientHeight).toFixed(3),
    imageSmoothingEnabled: ctx.imageSmoothingEnabled,
    imageSmoothingQuality: ctx.imageSmoothingQuality
  };
});
console.log('[HD-AUDIT] Canvas HiDPI Diagnostics:', JSON.stringify(canvasDiag, null, 2));

// 1. Capture Stage 1: Round 1 (Energy Catch)
const screen1Path = path.join(outDir, 'hd_01_round1_energy.png');
await page.locator('#cvsR1').screenshot({ path: screen1Path });
console.log(`[HD-AUDIT] Captured ${screen1Path}`);

// 2. Capture Stage 2: Round 2 (Duo Circuit)
const screen2Path = path.join(outDir, 'hd_02_round2_circuit.png');
await page.locator('#cvsR2').screenshot({ path: screen2Path });
console.log(`[HD-AUDIT] Captured ${screen2Path}`);

// 3. Capture Stage 3: Round 3 (Cool The Core)
const screen3Path = path.join(outDir, 'hd_03_round3_cooling.png');
await page.locator('#cvsR3').screenshot({ path: screen3Path });
console.log(`[HD-AUDIT] Captured ${screen3Path}`);

// 4. Capture Stage 4: Mission Complete (Victory Stage)
const screen4Path = path.join(outDir, 'hd_04_mission_complete.png');
await page.locator('#cvsVictory').screenshot({ path: screen4Path });
console.log(`[HD-AUDIT] Captured ${screen4Path}`);

// 5. Full Visual Showcase Grid
const fullStagePath = path.join(outDir, 'hd_05_full_stage_display.png');
await page.screenshot({ path: fullStagePath });
console.log(`[HD-AUDIT] Captured ${fullStagePath}`);

// Generate 4-panel Composite Comparison Image (2x2 Grid with HiDPI details)
console.log('[HD-AUDIT] Generating 4-Panel Comparison Sheet...');
const compositeDataUrl = await page.evaluate(async (paths) => {
  const loadImage = (src) => new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = src;
  });

  const cellW = 640;
  const cellH = 720;
  const headerH = 100;
  const canvas = document.createElement('canvas');
  canvas.width = cellW * 2;
  canvas.height = cellH * 2 + headerH;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Dark cyber background
  ctx.fillStyle = '#050811';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Top Title Bar
  ctx.fillStyle = 'rgba(9, 14, 28, 0.95)';
  ctx.fillRect(0, 0, canvas.width, headerH);
  ctx.strokeStyle = '#00f5ff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, headerH);
  ctx.lineTo(canvas.width, headerH);
  ctx.stroke();

  ctx.font = '900 28px "JetBrains Mono", monospace';
  ctx.fillStyle = '#00f5ff';
  ctx.textAlign = 'left';
  ctx.fillText('FU-DEVER BUG DASH • REACTOR RUSH 2X HiDPI VISUAL AUDIT', 32, 45);

  ctx.font = '700 15px "JetBrains Mono", monospace';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.82)';
  ctx.fillText('Backing Store: 1280x1440 | DPR: 2.0 | Zero-Slop Anti-AI Cel-Shaded Spritesheets', 32, 76);

  // Load and draw 4 stage screenshots
  const img1 = await loadImage(paths[0]);
  const img2 = await loadImage(paths[1]);
  const img3 = await loadImage(paths[2]);
  const img4 = await loadImage(paths[3]);

  const drawCell = (img, x, y, label) => {
    ctx.drawImage(img, x, y, cellW, cellH);
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.45)';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, cellW, cellH);

    // Pill badge
    ctx.fillStyle = 'rgba(6, 12, 28, 0.88)';
    ctx.strokeStyle = '#00f5ff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(x + 20, y + 20, 290, 36, 8);
    ctx.fill();
    ctx.stroke();

    ctx.font = '800 13.5px "JetBrains Mono", monospace';
    ctx.fillStyle = '#00f5ff';
    ctx.textAlign = 'left';
    ctx.fillText(label, x + 35, y + 43);
  };

  drawCell(img1, 0, headerH, '01: ENERGY CATCH (ROUND 1)');
  drawCell(img2, cellW, headerH, '02: DUO CIRCUIT (ROUND 2)');
  drawCell(img3, 0, headerH + cellH, '03: COOL THE CORE (ROUND 3)');
  drawCell(img4, cellW, headerH + cellH, '04: VICTORY PODIUM (COMPLETE)');

  return canvas.toDataURL('image/png');
}, [
  'data:image/png;base64,' + fs.readFileSync(screen1Path).toString('base64'),
  'data:image/png;base64,' + fs.readFileSync(screen2Path).toString('base64'),
  'data:image/png;base64,' + fs.readFileSync(screen3Path).toString('base64'),
  'data:image/png;base64,' + fs.readFileSync(screen4Path).toString('base64')
]);

const comparisonPath = path.join(projectRoot, 'audit_gameplay_comparison_hd.png');
const base64Data = compositeDataUrl.replace(/^data:image\/png;base64,/, '');
fs.writeFileSync(comparisonPath, Buffer.from(base64Data, 'base64'));
console.log(`[HD-AUDIT] Saved 4-Panel Comparison Sheet: ${comparisonPath}`);

await browser.close();
console.log('[HD-AUDIT] Audit successfully completed!');
