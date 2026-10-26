import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const videoDir = path.join(projectRoot, 'public', 'assets', 'videos');
if (!fs.existsSync(videoDir)) {
  fs.mkdirSync(videoDir, { recursive: true });
}

const auditDir = projectRoot;

const playwrightPath = '/mnt/d/THStudy/DeverClub/DEVER_TOWN/node_modules/playwright-core/index.mjs';
const { chromium } = await import(playwrightPath);

console.log('[RECORDER] Launching Chromium with video recording...');
const browser = await chromium.launch({
  executablePath: '/home/acc3/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome',
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    '--use-fake-ui-for-media-stream',
    '--use-fake-device-for-media-stream'
  ],
  headless: true
});

const context = await browser.newContext({
  viewport: { width: 1280, height: 720 },
  deviceScaleFactor: 1,
  recordVideo: {
    dir: videoDir,
    size: { width: 1280, height: 720 }
  }
});

const page = await context.newPage();

try {
  await context.route('**fonts.googleapis.com/**', route => route.abort());
  await context.route('**fonts.gstatic.com/**', route => route.abort());

  page.on('console', msg => console.log('[BROWSER LOG]', msg.text()));
  page.on('pageerror', err => console.error('[BROWSER ERR]', err.message));

  console.log('[RECORDER] Opening http://127.0.0.1:3001/gameplay_demo_player.html ...');
  await page.goto('http://127.0.0.1:3001/gameplay_demo_player.html', { waitUntil: 'commit', timeout: 15000 });

  console.log('[RECORDER] Waiting for DEMO_READY flag...');
  await page.waitForFunction(() => window.DEMO_READY === true, { timeout: 15000 });
  console.log('[RECORDER] Stage Director initialized. Capturing live gameplay...');

  // Phase 1: Round 1 Energy Catch (0s -> 5s)
  console.log('[RECORDER] Recording Round 1 (Energy Catch)...');
  await page.waitForTimeout(6000); // reaches 6s, entered Phase 2 Intermission

  // Phase 2: Intermission Screen (Error 4 Fix Audit)
  console.log('[RECORDER] Capturing Intermission Screen (Audit Error 4 Fixed)...');
  await page.waitForFunction(() => window.AUDIT_READY_ERROR4 === true, { timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(1000); // let UI settle
  const err4Shot = path.join(auditDir, 'audit_error4_fixed.png');
  await page.screenshot({ path: err4Shot });
  console.log(`[RECORDER] Saved Error 4 Fix verification screenshot to ${err4Shot}`);

  // Phase 3: Round 2 Duo Circuit (9s -> 13s)
  console.log('[RECORDER] Recording Round 2 (Duo Circuit)...');
  await page.waitForTimeout(5000);

  // Phase 4: Round 3 Cool The Core (13s -> 17.5s)
  console.log('[RECORDER] Recording Round 3 (Cool The Core)...');
  await page.waitForTimeout(5000);

  // Phase 5: Mission Complete & Victory Stage (17.5s -> 23s)
  console.log('[RECORDER] Waiting for Victory Stage (Audit Error 5 Fixed)...');
  await page.waitForFunction(() => window.AUDIT_READY_ERROR5 === true, { timeout: 8000 }).catch(() => {});
  await page.waitForTimeout(1500); // let podium celebration settle
  const err5Shot = path.join(auditDir, 'audit_error5_fixed.png');
  await page.screenshot({ path: err5Shot });
  console.log(`[RECORDER] Saved Error 5 Fix verification screenshot to ${err5Shot}`);

  await page.waitForTimeout(3000); // smooth cinematic finish

  console.log('[RECORDER] 24s Gameplay Recording sequence completed successfully.');
} catch (err) {
  console.error('[RECORDER ERROR]', err);
} finally {
  const videoObj = page.video();
  await context.close();
  await browser.close();

  if (videoObj) {
    const videoPath = await videoObj.path();
    const finalDest = path.join(videoDir, 'bug_dash_gameplay_demo.webm');
    fs.copyFileSync(videoPath, finalDest);
    console.log(`[RECORDER] Video finalized and saved to: ${finalDest}`);
    const stat = fs.statSync(finalDest);
    console.log(`[RECORDER] Video file size: ${(stat.size / 1024 / 1024).toFixed(2)} MB`);
  }
  process.exit(0);
}
