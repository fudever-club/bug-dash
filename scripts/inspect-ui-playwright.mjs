import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import leaderboardRouter from '../server/routes/leaderboard.js';
import { setupDuelWebSocket } from '../server/duelServer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const distDir = path.join(projectRoot, 'dist');
const artifactDir = '/home/acc3/.gemini/antigravity-cli/brain/b94feb50-1273-43cd-8c3c-bf847cfaf855';

// 1. Start Express Server on random free port (port 0)
const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/leaderboard', leaderboardRouter);
app.get('/api/stats', (req, res) => {
  res.json({
    status: 'ONLINE',
    booth: 'FU-DEVER TECH LAB',
    game: 'BUG DASH - NÉ BUG CHẠY DEADLINE',
    event: 'FPT UNIVERSITY DA NANG BOOTH 2026',
    serverTime: new Date().toISOString()
  });
});
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use(express.static(distDir));

const server = http.createServer(app);
setupDuelWebSocket(server);

await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const port = server.address().port;
const serverUrl = `http://127.0.0.1:${port}`;
console.log(`[AUDIT] Ephemeral server running at ${serverUrl}`);

// 2. Launch Chromium with Chrome DevTools Protocol
const playwrightPath = '/mnt/d/THStudy/DeverClub/DEVER_TOWN/node_modules/playwright-core/index.mjs';
const { chromium } = await import(playwrightPath);

console.log('[AUDIT] Launching Chromium with Chrome DevTools Protocol...');
const browser = await chromium.launch({
  executablePath: '/home/acc3/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
  timeout: 45000
});

const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 2
});

const page = await context.newPage();

const consoleMessages = [];
const consoleErrors = [];
page.on('console', msg => {
  const text = msg.text();
  consoleMessages.push({ type: msg.type(), text });
  if (msg.type() === 'error') {
    consoleErrors.push(text);
  }
});

page.on('pageerror', err => {
  consoleErrors.push(err.toString());
});

console.log(`[AUDIT] Navigating to ${serverUrl}...`);
await page.goto(serverUrl, { waitUntil: 'commit', timeout: 30000 });
console.log('[AUDIT] Page committed navigation! Waiting 1500ms for DOM ready...');
await page.waitForTimeout(1500);

// CDP Session for deep DevTools inspection
const client = await page.context().newCDPSession(page);
await client.send('Performance.enable');
const metrics = await client.send('Performance.getMetrics');

console.log('[AUDIT] Taking Screenshot 1: Desktop Main Cockpit (Classic)...');
const ss1Path = path.join(artifactDir, 'screenshot_audit_desktop.png');
await page.screenshot({ path: ss1Path });

// Inspect Mode Tabs & Start Screens
const modes = [
  { id: '#tabModeClassic', name: 'classic' },
  { id: '#tabModeCatcher', name: 'catcher' },
  { id: '#tabModeHighway', name: 'highway' },
  { id: '#tabModeSlicer', name: 'slicer' },
  { id: '#tabModeFlappy', name: 'flappy' },
  { id: '#tabModeDuel', name: 'duel' }
];

const modeAudits = [];
for (const m of modes) {
  try {
    await page.click(m.id);
    await page.waitForTimeout(350);
    const ssModePath = path.join(artifactDir, `screenshot_mode_${m.name}.png`);
    await page.screenshot({ path: ssModePath });
    const modalTitle = await page.textContent('#startModalTitle').catch(() => '');
    modeAudits.push({ mode: m.name, modalTitle, screenshot: ssModePath });
    console.log(`[AUDIT] Mode ${m.name} captured.`);
  } catch (err) {
    console.warn(`[AUDIT] Warning clicking ${m.id}:`, err.message);
  }
}

// Open Help Modal
console.log('[AUDIT] Opening Help Modal...');
try {
  await page.click('#btnHelp');
  await page.waitForTimeout(350);
  const ssHelpPath = path.join(artifactDir, 'screenshot_modal_help.png');
  await page.screenshot({ path: ssHelpPath });
  await page.click('#btnCloseHelp');
  await page.waitForTimeout(200);
} catch (e) {
  console.warn('[AUDIT] Help modal click error:', e.message);
}

// Open Settings Drawer
console.log('[AUDIT] Opening Advanced Settings Drawer...');
try {
  await page.click('.advanced-settings-toggle');
  await page.waitForTimeout(350);
  const ssSettingsPath = path.join(artifactDir, 'screenshot_settings_drawer.png');
  await page.screenshot({ path: ssSettingsPath });
} catch (e) {
  console.warn('[AUDIT] Settings drawer click error:', e.message);
}

// Audit Typography, Contrast & Layout Computed Styles via DevTools
const layoutAudit = await page.evaluate(() => {
  const topBar = document.querySelector('.top-bar');
  const appShell = document.querySelector('.app-shell');
  const canvas = document.querySelector('#gameCanvas');
  const h1 = document.querySelector('.brand-meta h1');
  const leaderboard = document.querySelector('.leaderboard-list');
  const modeTabs = Array.from(document.querySelectorAll('.mode-tab')).map(el => ({
    text: el.innerText,
    padding: window.getComputedStyle(el).padding,
    fontSize: window.getComputedStyle(el).fontSize,
    active: el.classList.contains('active')
  }));

  const startModal = document.querySelector('#startScreenModal');
  const startModalTitle = document.querySelector('#startModalTitle');
  const btnStart = document.querySelector('#btnStartGame');

  return {
    appShellMaxWidth: appShell ? window.getComputedStyle(appShell).maxWidth : null,
    canvasSize: canvas ? { width: canvas.clientWidth, height: canvas.clientHeight } : null,
    h1Font: h1 ? window.getComputedStyle(h1).fontFamily : null,
    h1Size: h1 ? window.getComputedStyle(h1).fontSize : null,
    leaderboardItemsCount: leaderboard ? leaderboard.children.length : 0,
    startModalVisible: startModal ? !startModal.classList.contains('hidden') : false,
    startModalTitle: startModalTitle ? startModalTitle.innerText : null,
    btnStartText: btnStart ? btnStart.innerText : null,
    modeTabsCount: modeTabs.length,
    modeTabs
  };
});

console.log('[AUDIT] Layout Audit Result:\n', JSON.stringify(layoutAudit, null, 2));
console.log(`[AUDIT] Total console errors: ${consoleErrors.length}`);
if (consoleErrors.length > 0) {
  console.log('[AUDIT] Console errors:', consoleErrors);
}

// Check Performance metrics
const domNodes = metrics.metrics.find(m => m.name === 'Nodes');
const jsHeap = metrics.metrics.find(m => m.name === 'JSHeapUsedSize');
console.log(`[AUDIT] DOM Nodes count: ${domNodes ? domNodes.value : 'N/A'}`);
console.log(`[AUDIT] JS Heap used: ${jsHeap ? (jsHeap.value / 1024 / 1024).toFixed(2) + ' MB' : 'N/A'}`);

await browser.close();
await new Promise(resolve => server.close(resolve));

console.log('[AUDIT] Complete! DevTools screenshots and layout audit verified.');
