import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const assetsDir = path.join(projectRoot, 'assets', 'reactor');
const publicAssetsDir = path.join(projectRoot, 'public', 'assets', 'reactor');

const playwrightPath = '/mnt/d/THStudy/DeverClub/DEVER_TOWN/node_modules/playwright-core/index.mjs';
const { chromium } = await import(playwrightPath);

console.log('[SPRITESHEET-GEN] Launching Headless Chromium to generate authentic animation sheets...');
const browser = await chromium.launch({
  executablePath: '/home/acc3/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
});

const page = await browser.newPage();

// Helper to read local base sprite as base64 data URI
function getBase64DataUri(filename) {
  const filePath = path.join(assetsDir, filename);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Base sprite not found: ${filePath}`);
  }
  const buf = fs.readFileSync(filePath);
  return `data:image/png;base64,${buf.toString('base64')}`;
}

const baseSprites = {
  kartCyan: getBase64DataUri('sprite_kart_cyan.png'),
  kartPink: getBase64DataUri('sprite_kart_pink.png'),
  circuitCyan: getBase64DataUri('sprite_circuit_cyan.png'),
  circuitPink: getBase64DataUri('sprite_circuit_pink.png'),
  cryoCyan: getBase64DataUri('sprite_cryo_cyan.png'),
  cryoPink: getBase64DataUri('sprite_cryo_pink.png'),
  energyOrb: getBase64DataUri('sprite_energy_orb.png'),
  champTrophy: getBase64DataUri('sprite_champ_trophy.png')
};

const resultSheets = await page.evaluate(async (bases) => {
  const loadImage = (src) => new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

  const imgKartCyan = await loadImage(bases.kartCyan);
  const imgKartPink = await loadImage(bases.kartPink);
  const imgCircuitCyan = await loadImage(bases.circuitCyan);
  const imgCircuitPink = await loadImage(bases.circuitPink);
  const imgCryoCyan = await loadImage(bases.cryoCyan);
  const imgCryoPink = await loadImage(bases.cryoPink);
  const imgEnergyOrb = await loadImage(bases.energyOrb);
  const imgChampTrophy = await loadImage(bases.champTrophy);

  const sheets = {};

  // 1. Generate Kart Spritesheet (4 frames: 180x250 -> 720x250)
  function createKartSheet(baseImg, isCyan) {
    const fw = 180;
    const fh = 250;
    const frames = 4;
    const canvas = document.createElement('canvas');
    canvas.width = fw * frames;
    canvas.height = fh;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;

    const neonColor = isCyan ? '#00f5ff' : '#ff2a8d';
    const flameColor = isCyan ? '#38bdf8' : '#f472b6';

    for (let f = 0; f < frames; f++) {
      ctx.save();
      const ox = f * fw;
      
      // Dynamic bouncing & bobbing
      let dy = 0;
      let rot = 0;
      let wheelPulse = 0;
      let flameScale = 1.0;

      if (f === 0) {
        dy = 0;
        rot = 0;
        flameScale = 0.9;
      } else if (f === 1) {
        dy = -2.5;
        rot = isCyan ? 0.015 : -0.015;
        wheelPulse = 4;
        flameScale = 1.25;
      } else if (f === 2) {
        dy = -4.0;
        rot = 0;
        wheelPulse = 6;
        flameScale = 1.4;
      } else if (f === 3) {
        dy = 1.5;
        rot = isCyan ? -0.012 : 0.012;
        wheelPulse = 2;
        flameScale = 1.05;
      }

      ctx.translate(ox + fw / 2, fh / 2 + dy);
      ctx.rotate(rot);

      // Draw base sprite centered
      ctx.drawImage(baseImg, -fw / 2, -fh / 2, fw, fh);

      // Neon Underglow Glow
      ctx.save();
      ctx.shadowColor = neonColor;
      ctx.shadowBlur = 10 + wheelPulse * 2;
      ctx.fillStyle = neonColor;
      ctx.globalAlpha = 0.35 + (f % 2) * 0.15;
      ctx.beginPath();
      ctx.ellipse(0, fh * 0.38, fw * 0.35, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Exhaust Thruster Flames
      ctx.save();
      ctx.fillStyle = flameColor;
      ctx.shadowColor = neonColor;
      ctx.shadowBlur = 8;
      ctx.globalAlpha = 0.85;
      const flameH = 14 * flameScale;
      // Dual exhaust nozzles
      [-28, 28].forEach(xOff => {
        ctx.beginPath();
        ctx.moveTo(xOff - 5, fh * 0.36);
        ctx.lineTo(xOff + 5, fh * 0.36);
        ctx.lineTo(xOff, fh * 0.36 + flameH);
        ctx.closePath();
        ctx.fill();

        // Inner white hot core
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(xOff, fh * 0.36 + 3, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = flameColor;
      });
      ctx.restore();

      // Wheel Rim Kinetic Sparks (Frames 1 & 2)
      if (wheelPulse > 0) {
        ctx.save();
        ctx.strokeStyle = neonColor;
        ctx.lineWidth = 2;
        ctx.shadowColor = neonColor;
        ctx.shadowBlur = 6;
        // Left wheel rim arc
        ctx.beginPath();
        ctx.arc(-fw * 0.4, fh * 0.22, 16, 0.4 + f * 0.5, 2.2 + f * 0.5);
        ctx.stroke();
        // Right wheel rim arc
        ctx.beginPath();
        ctx.arc(fw * 0.4, fh * 0.22, 16, 0.4 - f * 0.5, 2.2 - f * 0.5);
        ctx.stroke();
        ctx.restore();
      }

      ctx.restore();
    }

    return canvas.toDataURL('image/png');
  }

  sheets.sheetKartCyan = createKartSheet(imgKartCyan, true);
  sheets.sheetKartPink = createKartSheet(imgKartPink, false);

  // 2. Generate Circuit Mecha Crane Spritesheet (4 frames: 290x215 -> 1160x215)
  function createCircuitSheet(baseImg, isCyan) {
    const fw = 290;
    const fh = 215;
    const frames = 4;
    const canvas = document.createElement('canvas');
    canvas.width = fw * frames;
    canvas.height = fh;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;

    const arcColor = isCyan ? '#00f5ff' : '#ff2a8d';
    const coreColor = '#ffffff';

    for (let f = 0; f < frames; f++) {
      ctx.save();
      const ox = f * fw;
      let armFlexY = 0;
      let clawSpread = 0;

      if (f === 0) {
        armFlexY = 0;
        clawSpread = 0;
      } else if (f === 1) {
        armFlexY = 2;
        clawSpread = -3;
      } else if (f === 2) {
        armFlexY = 4;
        clawSpread = -6; // tightly gripped
      } else if (f === 3) {
        armFlexY = 1;
        clawSpread = 2; // releasing
      }

      ctx.translate(ox + fw / 2, fh / 2 + armFlexY);
      ctx.drawImage(baseImg, -fw / 2, -fh / 2, fw, fh);

      // High-voltage electric arc discharge between claws (Frames 1 & 2 peak)
      if (f === 1 || f === 2) {
        ctx.save();
        ctx.strokeStyle = arcColor;
        ctx.lineWidth = f === 2 ? 3.5 : 2.5;
        ctx.shadowColor = arcColor;
        ctx.shadowBlur = 12;

        // Zigzag electric plasma arc across the probe tips
        ctx.beginPath();
        const startX = -35 + clawSpread;
        const startY = 32;
        const endX = 35 - clawSpread;
        const endY = 32;
        ctx.moveTo(startX, startY);
        ctx.lineTo(startX * 0.5, startY + (f === 2 ? -8 : 6));
        ctx.lineTo(0, startY + (f === 2 ? 7 : -7));
        ctx.lineTo(endX * 0.5, startY + (f === 2 ? -6 : 8));
        ctx.lineTo(endX, endY);
        ctx.stroke();

        // White hot center arc
        ctx.strokeStyle = coreColor;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Glowing electrode tips
        ctx.fillStyle = coreColor;
        ctx.shadowColor = arcColor;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(startX, startY, 4, 0, Math.PI * 2);
        ctx.arc(endX, endY, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }

      ctx.restore();
    }

    return canvas.toDataURL('image/png');
  }

  sheets.sheetCircuitCyan = createCircuitSheet(imgCircuitCyan, true);
  sheets.sheetCircuitPink = createCircuitSheet(imgCircuitPink, false);

  // 3. Generate Cryo Blaster Mecha Spritesheet (4 frames: 280x215 -> 1120x215)
  function createCryoSheet(baseImg, isCyan) {
    const fw = 280;
    const fh = 215;
    const frames = 4;
    const canvas = document.createElement('canvas');
    canvas.width = fw * frames;
    canvas.height = fh;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;

    const frostColor = isCyan ? '#38bdf8' : '#f472b6';
    const iceColor = isCyan ? '#e0f2fe' : '#fdf2f8';

    for (let f = 0; f < frames; f++) {
      ctx.save();
      const ox = f * fw;
      let recoilX = 0;
      if (f === 1) recoilX = isCyan ? -3 : 3;
      if (f === 2) recoilX = isCyan ? -5 : 5;
      if (f === 3) recoilX = isCyan ? -1 : 1;

      ctx.translate(ox + fw / 2 + recoilX, fh / 2);
      ctx.drawImage(baseImg, -fw / 2, -fh / 2, fw, fh);

      // Frost nozzle blast & ice crystal emission (Frames 1, 2, 3)
      if (f > 0) {
        ctx.save();
        const blastLength = f === 1 ? 40 : (f === 2 ? 65 : 30);
        const blastWidth = f === 1 ? 14 : (f === 2 ? 26 : 18);
        const nozzleX = isCyan ? 36 : -36;
        const nozzleY = 16;
        const dir = isCyan ? 1 : -1;

        // Sub-zero frost plume
        const frostGrad = ctx.createRadialGradient(
          nozzleX + dir * (blastLength * 0.4), nozzleY, 4,
          nozzleX + dir * (blastLength * 0.5), nozzleY, blastLength * 0.7
        );
        frostGrad.addColorStop(0, iceColor);
        frostGrad.addColorStop(0.5, frostColor);
        frostGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');

        ctx.fillStyle = frostGrad;
        ctx.shadowColor = frostColor;
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.ellipse(nozzleX + dir * (blastLength * 0.5), nozzleY, blastLength * 0.5, blastWidth, 0, 0, Math.PI * 2);
        ctx.fill();

        // Shimmering crystalline ice flakes
        ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 4; i++) {
          const fx = nozzleX + dir * (15 + i * 14 + (f * 4));
          const fy = nozzleY + ((i % 2 === 0 ? 1 : -1) * (6 + i * 2));
          ctx.beginPath();
          ctx.arc(fx, fy, 2, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }

      ctx.restore();
    }

    return canvas.toDataURL('image/png');
  }

  sheets.sheetCryoCyan = createCryoSheet(imgCryoCyan, true);
  sheets.sheetCryoPink = createCryoSheet(imgCryoPink, false);

  // 4. Generate Energy Orb Spritesheet (6 frames: 40x40 -> 240x40)
  function createEnergyOrbSheet(baseImg) {
    const fw = 40;
    const fh = 40;
    const frames = 6;
    const canvas = document.createElement('canvas');
    canvas.width = fw * frames;
    canvas.height = fh;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;

    for (let f = 0; f < frames; f++) {
      ctx.save();
      const ox = f * fw;
      const cx = ox + fw / 2;
      const cy = fh / 2;
      const pulse = 1 + Math.sin((f / frames) * Math.PI * 2) * 0.14;

      // Base orb with subtle rotation
      ctx.translate(cx, cy);
      ctx.rotate((f / frames) * Math.PI * 2);
      ctx.scale(pulse, pulse);
      ctx.drawImage(baseImg, -fw / 2, -fh / 2, fw, fh);
      ctx.restore();

      // Orbiting energy spark particles
      ctx.save();
      const angle1 = (f / frames) * Math.PI * 2;
      const angle2 = angle1 + Math.PI;
      const rOrb = 14 * pulse;

      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#00f5ff';
      ctx.shadowBlur = 6;

      ctx.beginPath();
      ctx.arc(cx + Math.cos(angle1) * rOrb, cy + Math.sin(angle1) * rOrb, 2, 0, Math.PI * 2);
      ctx.arc(cx + Math.cos(angle2) * rOrb, cy + Math.sin(angle2) * rOrb, 1.8, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    return canvas.toDataURL('image/png');
  }

  sheets.sheetEnergyOrb = createEnergyOrbSheet(imgEnergyOrb);

  // 5. Generate Champion Trophy Spritesheet (6 frames: 190x275 -> 1140x275)
  function createChampTrophySheet(baseImg) {
    const fw = 190;
    const fh = 275;
    const frames = 6;
    const canvas = document.createElement('canvas');
    canvas.width = fw * frames;
    canvas.height = fh;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;

    for (let f = 0; f < frames; f++) {
      ctx.save();
      const ox = f * fw;
      const hoverY = Math.sin((f / frames) * Math.PI * 2) * 3;
      const tilt = Math.sin((f / frames) * Math.PI * 2) * 0.02;

      ctx.translate(ox + fw / 2, fh / 2 + hoverY);
      ctx.rotate(tilt);
      ctx.drawImage(baseImg, -fw / 2, -fh / 2, fw, fh);

      // Specular Glint & Golden Gleam sweep
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      const glintProg = f / frames;
      const glintX = -fw * 0.35 + glintProg * fw * 0.7;

      const glintGrad = ctx.createLinearGradient(glintX - 20, -fh * 0.2, glintX + 20, fh * 0.1);
      glintGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
      glintGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.45)');
      glintGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');

      ctx.fillStyle = glintGrad;
      ctx.fillRect(-fw * 0.35, -fh * 0.25, fw * 0.7, fh * 0.45);

      // Star sparkle gleam
      if (f === 1 || f === 2 || f === 4) {
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#facc15';
        ctx.shadowBlur = 8;
        const spX = (f === 1) ? -fw * 0.25 : ((f === 2) ? 0 : fw * 0.22);
        const spY = (f === 1) ? -fh * 0.2 : ((f === 2) ? -fh * 0.15 : -fh * 0.18);
        
        ctx.beginPath();
        // 4-pointed sparkle
        ctx.moveTo(spX, spY - 7);
        ctx.lineTo(spX + 2, spY - 2);
        ctx.lineTo(spX + 7, spY);
        ctx.lineTo(spX + 2, spY + 2);
        ctx.lineTo(spX, spY + 7);
        ctx.lineTo(spX - 2, spY + 2);
        ctx.lineTo(spX - 7, spY);
        ctx.lineTo(spX - 2, spY - 2);
        ctx.closePath();
        ctx.fill();
      }

      ctx.restore();
      ctx.restore();
    }

    return canvas.toDataURL('image/png');
  }

  sheets.sheetChampTrophy = createChampTrophySheet(imgChampTrophy);

  return sheets;
}, baseSprites);

await browser.close();

// Save all sheets to assets/reactor and public/assets/reactor
const fileMap = {
  'sheet_kart_cyan.png': resultSheets.sheetKartCyan,
  'sheet_kart_pink.png': resultSheets.sheetKartPink,
  'sheet_circuit_cyan.png': resultSheets.sheetCircuitCyan,
  'sheet_circuit_pink.png': resultSheets.sheetCircuitPink,
  'sheet_cryo_cyan.png': resultSheets.sheetCryoCyan,
  'sheet_cryo_pink.png': resultSheets.sheetCryoPink,
  'sheet_energy_orb.png': resultSheets.sheetEnergyOrb,
  'sheet_champ_trophy.png': resultSheets.sheetChampTrophy
};

for (const [filename, dataUrl] of Object.entries(fileMap)) {
  const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');
  const buffer = Buffer.from(base64Data, 'base64');
  
  const dest1 = path.join(assetsDir, filename);
  const dest2 = path.join(publicAssetsDir, filename);

  fs.writeFileSync(dest1, buffer);
  fs.writeFileSync(dest2, buffer);
  console.log(`[SPRITESHEET-GEN] Successfully generated: ${filename} (${buffer.length} bytes)`);
}

console.log('[SPRITESHEET-GEN] All 8 Reactor Rush Spritesheets successfully created!');
