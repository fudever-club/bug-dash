import fs from 'fs';
import path from 'path';
import http from 'http';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Simple static server for testing
const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml'
};

const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/') reqPath = '/test_gameplay_visuals.html';
  
  // Try directly from project root, then public/
  let filePath = path.join(projectRoot, reqPath);
  if (!fs.existsSync(filePath)) {
    filePath = path.join(projectRoot, 'public', reqPath);
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*'
    });
    fs.createReadStream(filePath).pipe(res);
  } else {
    console.log('[404]', reqPath);
    res.writeHead(404);
    res.end('Not Found: ' + reqPath);
  }
});

const PORT = 38912;
server.listen(PORT, '127.0.0.1', async () => {
  console.log(`[AUDIT] Static server listening on http://127.0.0.1:${PORT}`);
  
  try {
    const playwrightPath = '/mnt/d/THStudy/DeverClub/DEVER_TOWN/node_modules/playwright-core/index.mjs';
    const { chromium } = await import(playwrightPath);
    
    console.log('[AUDIT] Launching Chromium...');
    const browser = await chromium.launch({
      executablePath: '/home/acc3/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
      timeout: 30000
    });

    const context = await browser.newContext({
      viewport: { width: 1800, height: 2600 },
      deviceScaleFactor: 1
    });

    const page = await context.newPage();
    
    page.on('console', msg => console.log(`[BROWSER ${msg.type()}]`, msg.text()));
    page.on('pageerror', err => console.error('[BROWSER ERROR]', err));

    console.log(`[AUDIT] Navigating to http://127.0.0.1:${PORT}/test_gameplay_visuals.html ...`);
    await page.goto(`http://127.0.0.1:${PORT}/test_gameplay_visuals.html`, { waitUntil: 'load', timeout: 30000 });

    console.log('[AUDIT] Waiting for window.RENDER_COMPLETED...');
    await page.waitForFunction(() => window.RENDER_COMPLETED === true, { timeout: 15000 });
    await page.waitForTimeout(1000);

    const outPath = path.join(projectRoot, 'audit_gameplay_comparison_celshaded.png');
    await page.screenshot({ path: outPath, fullPage: true });
    console.log(`[AUDIT] Successfully saved comparison screenshot to ${outPath}`);

    await browser.close();
  } catch (err) {
    console.error('[AUDIT FAILED]', err);
  } finally {
    server.close();
    process.exit(0);
  }
});
