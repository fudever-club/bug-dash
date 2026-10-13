// FU-DEVER BUG DASH - Central Configuration & Balance Parameters

export const VISION_CONFIG = {
  roi: { x0: 0.25, x1: 0.75 },     // Vùng "vạch xuất phát" chuẩn hóa 0..1
  lockMs: 1000,                    // Đứng yên trong ROI 1.0 giây để khóa người chơi
  lostFrames: 15,                  // Mất mặt quá 15 frame (~0.5s ở 30fps) thì chuyển trạng thái lost
  minIoU: 0.15,                    // Ngưỡng IoU tối thiểu để coi là cùng 1 người
  minArea: 0.02,                   // Bounding box < 2% khung hình thì bỏ qua (lọc người đứng xa phía sau)
  ema: 0.4,                        // Hệ số làm mượt tâm đầu X (EMA)
  hyst: 0.02,                      // Vùng chết (hysteresis) tránh rung giật ở ranh giới 2 làn
  defaultThreshold: 0.09,          // Ngưỡng lệch tâm để chuyển làn mặc định 9%
  modelUrl: "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite",
  wasmUrl: "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
};

export const GAME_CONFIG = {
  sessionDuration: 60,             // Một lượt chơi chuẩn 60 giây
  initialLives: 3,                 // 3 Mạng (Khiên)
  roadWidth: 640,
  roadHeight: 720,
  laneX: [130, 320, 510],          // Tọa độ pixel X của 3 làn: Trái (0), Giữa (1), Phải (2)
  playerY: 600,                    // Tọa độ pixel Y của nhân vật Buggy
  playerRadius: 46,
  playerSize: 105,
  initialSpeed: 340,               // Tốc độ rơi ban đầu (px/s)
  speedAcceleration: 3.5,          // Tốc độ tăng dần theo thời gian còn lại
};

export const OBJECT_DEFINITIONS = [
  { type: "bug", label: "BUG", color: "#ef4444", radius: 26, isObstacle: true, damage: 1, textDesc: "Syntax Error" },
  { type: "deadline", label: "DEADLINE", color: "#f97316", radius: 30, isObstacle: true, damage: 1, textDesc: "Deadline 23:59" },
  { type: "grade_f", label: "F", color: "#dc2626", radius: 24, isObstacle: true, damage: 0, scoreDeduct: 30, textDesc: "Rớt Môn SWE" },
  { type: "coffee", label: "COFFEE", color: "#06b6d4", radius: 24, isObstacle: false, points: 20, buff: "x2", textDesc: "Cà Phê FPTU" },
  { type: "clean_code", label: "CODE", color: "#10b981", radius: 26, isObstacle: false, points: 50, textDesc: "PR Merged" },
];

export const ASSET_PATHS = {
  fptuLogo: "assets/fptu_logo_white.png",
  deverLogo: "assets/dever_logo_white.png",
  playerRunning: "assets/player_running.png",
  playerDead: "assets/player_dead.png",
  buggyChampion: "assets/buggy_champion.png"
};
