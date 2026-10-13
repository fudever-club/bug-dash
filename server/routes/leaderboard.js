import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, '../data/leaderboard.json');

const router = Router();

function readLeaderboard() {
  try {
    if (!fs.existsSync(DB_FILE)) return [];
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading leaderboard:', err);
    return [];
  }
}

function saveLeaderboard(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error saving leaderboard:', err);
    return false;
  }
}

// GET /api/leaderboard - Top 10 High Scores
router.get('/', (req, res) => {
  const list = readLeaderboard();
  list.sort((a, b) => b.score - a.score);
  const ranked = list.slice(0, 10).map((item, idx) => ({
    ...item,
    rank: idx + 1
  }));
  res.json({
    success: true,
    data: ranked,
    totalEntries: list.length
  });
});

// POST /api/leaderboard - Submit new score from booth
router.post('/', (req, res) => {
  const { name, k_class, score } = req.body;

  if (!name || typeof score !== 'number' || isNaN(score)) {
    return res.status(400).json({ success: false, message: 'Tên hoặc điểm số không hợp lệ.' });
  }

  const cleanName = String(name).trim().slice(0, 25) || 'Anonymous Dev';
  const cleanClass = String(k_class || 'K22').trim().slice(0, 10);
  const cleanScore = Math.max(0, Math.min(99999, Math.round(score)));

  const list = readLeaderboard();
  const newEntry = {
    id: Date.now().toString(),
    name: cleanName,
    k_class: cleanClass,
    score: cleanScore,
    date: new Date().toISOString().split('T')[0]
  };

  list.push(newEntry);
  list.sort((a, b) => b.score - a.score);
  
  // Calculate player rank
  const rank = list.findIndex(item => item.id === newEntry.id) + 1;

  // Keep top 50 in storage
  const trimmed = list.slice(0, 50);
  saveLeaderboard(trimmed);

  res.json({
    success: true,
    rank,
    entry: newEntry,
    isTop10: rank <= 10
  });
});

export default router;
