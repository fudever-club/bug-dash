// FU-DEVER BUG DASH - API Client for Leaderboard & Telemetry
// Auto-fallbacks to LocalStorage if offline or backend server is unreachable.

const API_BASE = "/api";
const LOCAL_STORAGE_KEY = "fudever_bugdash_leaderboard";

// Default initial high scores if completely empty
const DEFAULT_SCORES = [
  { rank: 1, name: "Hoàng Long (K20)", studentId: "DE180012", major: "SE", score: 1450, streak: 8, timeSurvived: 60, createdAt: "2026-10-10T10:00:00Z" },
  { rank: 2, name: "Thu Hà (K21)", studentId: "DE190045", major: "AI", score: 1220, streak: 6, timeSurvived: 60, createdAt: "2026-10-11T14:30:00Z" },
  { rank: 3, name: "Hải Nam (K22)", studentId: "DE200109", major: "IA", score: 980, streak: 5, timeSurvived: 58, createdAt: "2026-10-12T09:15:00Z" },
  { rank: 4, name: "Quang Nhật (Gen 9)", studentId: "DE170088", major: "SE", score: 850, streak: 4, timeSurvived: 55, createdAt: "2026-10-12T16:40:00Z" },
  { rank: 5, name: "Bảo Trâm (K21)", studentId: "DE190201", major: "GD", score: 720, streak: 4, timeSurvived: 52, createdAt: "2026-10-13T11:20:00Z" }
];

function getLocalLeaderboard() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(DEFAULT_SCORES));
      return DEFAULT_SCORES;
    }
    return JSON.parse(raw);
  } catch (e) {
    return DEFAULT_SCORES;
  }
}

function saveLocalLeaderboard(list) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn("[ApiClient] LocalStorage write failed", e);
  }
}

export const ApiClient = {
  /**
   * Fetch current Top Leaderboard entries
   * @param {number} limit 
   * @returns {Promise<Array>}
   */
  async getLeaderboard(limit = 10) {
    try {
      const res = await fetch(`${API_BASE}/leaderboard?limit=${limit}`, {
        headers: { "Accept": "application/json" }
      });
      if (res.ok) {
        const json = await res.json();
        if (json && json.success && Array.isArray(json.data)) {
          saveLocalLeaderboard(json.data);
          return json.data;
        }
      }
    } catch (err) {
      console.info("[ApiClient] Backend API offline, fallback to LocalStorage.");
    }
    return getLocalLeaderboard().slice(0, limit);
  },

  /**
   * Submit new player score to Leaderboard
   * @param {Object} entry { name, studentId, major, score, streak, timeSurvived }
   * @returns {Promise<Object>}
   */
  async submitScore(entry) {
    const payload = {
      name: (entry.name || "Coder FPTU").trim().slice(0, 30),
      studentId: (entry.studentId || "K22").trim().slice(0, 15),
      major: (entry.major || "SE").trim().toUpperCase().slice(0, 10),
      score: Math.max(0, parseInt(entry.score, 10) || 0),
      streak: Math.max(1, parseInt(entry.streak, 10) || 1),
      timeSurvived: Math.min(60, Math.max(0, parseInt(entry.timeSurvived, 10) || 0))
    };

    // Try posting to backend
    try {
      const res = await fetch(`${API_BASE}/leaderboard`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const json = await res.json();
        if (json && json.success) {
          return { success: true, rank: json.rank, data: json.data };
        }
      }
    } catch (err) {
      console.info("[ApiClient] Backend submission failed, storing to LocalStorage fallback.");
    }

    // Local fallback logic
    const current = getLocalLeaderboard();
    const newEntry = {
      ...payload,
      createdAt: new Date().toISOString()
    };
    current.push(newEntry);
    current.sort((a, b) => b.score - a.score || b.timeSurvived - a.timeSurvived);
    
    // Assign ranks
    const ranked = current.map((item, idx) => ({ ...item, rank: idx + 1 }));
    saveLocalLeaderboard(ranked);

    const userRank = ranked.findIndex(item => item === newEntry) + 1;
    return { success: true, rank: userRank || 99, data: ranked };
  },

  /**
   * Health check endpoint
   */
  async checkHealth() {
    try {
      const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(2000) });
      return res.ok;
    } catch {
      return false;
    }
  }
};
