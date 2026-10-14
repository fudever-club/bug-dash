// FU-DEVER BUG DASH - Central Configuration & Balance Parameters

export const VISION_CONFIG = {
  roi: { x0: 0.25, x1: 0.75 },     // Vùng "vạch xuất phát" chuẩn hóa 0..1
  lockMs: 1000,                    // Đứng yên trong ROI 1.0 giây để khóa người chơi
  lostFrames: 15,                  // Mất mặt quá 15 frame (~0.5s ở 30fps) thì chuyển trạng thái lost
  maxLostFrames: 60,               // Giữ lock dự phòng tối đa 60 frame (~2.0s) trước khi nhả lock
  minIoU: 0.15,                    // Ngưỡng IoU tối thiểu
  minArea: 0.02,                   // Bounding box < 2% khung hình thì bỏ qua (lọc người đứng xa phía sau)
  ema: 0.4,                        // Hệ số làm mượt tâm đầu X (EMA)
  tiltEma: 0.35,                   // Hệ số làm mượt góc nghiêng đầu (Tilt)
  tiltWeight: 0.45,                // Trọng số góc nghiêng đầu kết hợp vào độ lệch chuyển làn
  hyst: 0.02,                      // Vùng chết (hysteresis) tránh rung giật ở ranh giới 2 làn
  defaultThreshold: 0.09,          // Ngưỡng lệch tâm để chuyển làn mặc định 9%
  modelUrl: "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite",
  wasmUrl: "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
};

export const STEERING_MODES = {
  SNAP3: "snap3",                  // 3 Làn Snap kinh điển (Trái - Giữa - Phải)
  ANALOG: "analog"                 // Lắc đầu tự do (Continuous Analog / Highway Racer)
};

export const CONTROL_INPUTS = {
  FACE: "face",                    // Cảm biến mặt & lắc đầu
  HAND: "hand"                     // Cảm biến bàn tay & ngón tay (Swipe Up / Down)
};

export const GAME_MODES = {
  CLASSIC: "classic",              // Né Bug Chạy Deadline (Solo Arcade)
  CATCHER: "catcher",              // Hứng PR Merged (Analog Basket Catcher)
  HIGHWAY: "highway",              // FPT Highway Racer (Đua Xe Cao Tốc FPTU)
  DUEL: "duel",                    // Song Đấu 1v1 (2 Laptops qua Wi-Fi/LAN)
  SPLIT_SCREEN: "splitscreen"      // Song Đấu 1 Máy (Chung 1 Camera Chia Đôi Màn Hình)
};

export const MODE_METADATA = {
  [GAME_MODES.CLASSIC]: {
    badge: "CHẾ ĐỘ NÉ BUG SOLO",
    badgeColor: "var(--fpt-orange)",
    title: "NÉ BUG CHẠY DEADLINE",
    mascot: "assets/player_running.png",
    desc: "Đua với deadline 23:59 bằng camera lắc đầu hoặc cử chỉ bàn tay. Né Syntax Error, nhặt cà phê tăng tốc để giành điểm số cao nhất!",
    rules: [
      { badge: "CẦN NÉ", badgeClass: "avoid-badge", title: "Bug & Deadline", desc: "Né Syntax Error & 23:59 (-1 Mạng)" },
      { badge: "CẦN ĂN", badgeClass: "loot-badge", title: "Cà Phê & Clean Code", desc: "Ăn Cà Phê x2 Combo, nhặt PR Merged" },
      { badge: "ĐIỀU KHIỂN", badgeClass: "steer-badge", title: "Lắc Đầu / Bàn Tay", desc: "Nghiêng đầu hoặc quét tay trái/phải, W/S nhảy trượt" }
    ],
    ctaText: "Bắt Đầu Né Bug Solo (SPACE)"
  },
  [GAME_MODES.CATCHER]: {
    badge: "MINIGAME HỨNG CODE MERGED",
    badgeColor: "#10b981",
    title: "HỨNG PR & GIT CRYSTAL",
    mascot: "assets/buggy_champion.png",
    desc: "Trang bị giỏ hứng công nghệ PR Catcher! Lái Buggy di chuyển liên tục gom trọn Pull Request, Git Crystal và Sao Vàng, tránh xa Syntax Error!",
    rules: [
      { badge: "CẦN HỨNG", badgeClass: "loot-badge", title: "PR Merged & Sao Vàng", desc: "Hứng PR Merged +100đ, Sao Vàng +150đ" },
      { badge: "CẦN TRÁNH", badgeClass: "avoid-badge", title: "Server Crash & Drop DB", desc: "Tránh né bug 500 đỏ và thùng sập database" },
      { badge: "CƠ CHẾ LÁI", badgeClass: "steer-badge", title: "Lái Tự Do (Analog)", desc: "Di chuyển tự do mượt mà không giới hạn 3 làn" }
    ],
    ctaText: "Bắt Đầu Hứng PR Merged (SPACE)"
  },
  [GAME_MODES.HIGHWAY]: {
    badge: "ĐUA XE CAO TỐC FPTU — TỐC ĐỘ X1.5",
    badgeColor: "#f59e0b",
    title: "FPT HIGHWAY RACER",
    mascot: "assets/player_running.png",
    desc: "Lướt trên đại lộ FPT University Đà Nẵng với tốc độ cao! Lắc đầu hoặc quét tay drift tự do lách qua các chướng ngại vật xuất hiện liên tục.",
    rules: [
      { badge: "TỐC ĐỘ CAO", badgeClass: "avoid-badge", title: "Tốc Độ Gấp 1.5 Lần", desc: "Đường băng trôi nhanh, chướng ngại vật dồn dập" },
      { badge: "DRIFT TỰ DO", badgeClass: "steer-badge", title: "Lái Tự Do Không Làn", desc: "Nghiêng đầu hoặc quét tay drift mượt mà" },
      { badge: "NITRO BOOST", badgeClass: "loot-badge", title: "Bình Nitro NOS", desc: "Ăn bình Nitro để kích hoạt Fever Mode 5s" }
    ],
    ctaText: "Vào Đua FPT Highway Ngay (SPACE)"
  },
  [GAME_MODES.DUEL]: {
    badge: "ĐỐI KHÁNG ĐỒNG ĐỘI",
    badgeColor: "#ef4444",
    title: "SONG ĐẤU 1V1",
    mascot: "assets/player_running.png",
    desc: "Thử tài so trình né deadline giữa 2 lập trình viên! Chọn đấu 2 máy qua Wi-Fi/LAN hoặc 2 người cùng chơi trên 1 webcam máy tính.",
    rules: [
      { badge: "1 MÁY CHUNG CAM", badgeClass: "steer-badge", title: "Split-Screen", desc: "2 bạn cùng đứng trước webcam chia đôi màn hình" },
      { badge: "2 MÁY WI-FI", badgeClass: "loot-badge", title: "Mạng LAN / Wi-Fi", desc: "Tạo phòng 4 số, mỗi máy dùng 1 webcam riêng" },
      { badge: "PHẢN CÔNG", badgeClass: "avoid-badge", title: "Tấn Công Đối Thủ", desc: "Ăn chuỗi combo để bắn deadline sang máy đối thủ" }
    ],
    ctaText: "Mở Sảnh Chờ Song Đấu"
  }
};

export const GAME_CONFIG = {
  sessionDuration: 60,             // Một lượt chơi chuẩn 60 giây
  initialLives: 3,                 // 3 Mạng (Khiên)
  invulnerableDuration: 1.2,       // 1.2s bất tử chớp tắt (i-frames) sau khi dính đòn
  feverDuration: 5.0,              // 5.0s Fever Mode tăng tốc đâm xuyên
  roadWidth: 640,
  roadHeight: 720,
  roadMinX: 95,                    // Giới hạn lề trái đường đua
  roadMaxX: 545,                   // Giới hạn lề phải đường đua
  laneX: [130, 320, 510],          // Tọa độ pixel X của 3 làn: Trái (0), Giữa (1), Phải (2)
  playerY: 600,                    // Tọa độ pixel Y của nhân vật Buggy
  playerRadius: 46,
  playerSize: 105,
  initialSpeed: 340,               // Tốc độ rơi ban đầu (px/s)
  speedAcceleration: 3.5,          // Tốc độ tăng dần theo thời gian còn lại
};

export const SPLIT_CONFIG = {
  p1Lanes: [60, 160, 260],         // Nửa trái (0 - 320)
  p2Lanes: [380, 480, 580],        // Nửa phải (320 - 640)
  p1RoadBounds: { minX: 30, maxX: 290 },
  p2RoadBounds: { minX: 350, maxX: 610 },
  playerSize: 76,
  playerRadius: 34,
};

export const OBJECT_DEFINITIONS = [
  { type: "bug", label: "BUG", color: "#ef4444", radius: 26, isObstacle: true, damage: 1, textDesc: "Syntax Error" },
  { type: "deadline", label: "DEADLINE", color: "#f97316", radius: 30, isObstacle: true, damage: 1, textDesc: "Deadline 23:59" },
  { type: "grade_f", label: "F", color: "#dc2626", radius: 24, isObstacle: true, damage: 0, scoreDeduct: 30, textDesc: "Rớt Môn SWE" },
  { type: "coffee", label: "COFFEE", color: "#06b6d4", radius: 24, isObstacle: false, points: 20, buff: "x2", textDesc: "Cà Phê FPTU" },
  { type: "clean_code", label: "CODE", color: "#10b981", radius: 26, isObstacle: false, points: 50, textDesc: "PR Merged" },
  { type: "nitro", label: "NITRO", color: "#3b82f6", radius: 24, isObstacle: false, points: 40, buff: "fever", textDesc: "Nitro Rush" },
];

export const CATCHER_DEFINITIONS = [
  { type: "pr_merged", label: "PR MERGE", color: "#10b981", radius: 26, isObstacle: false, points: 100, textDesc: "PR Merged" },
  { type: "clean_code", label: "CODE", color: "#06b6d4", radius: 24, isObstacle: false, points: 60, textDesc: "Clean Code" },
  { type: "star", label: "STAR", color: "#f59e0b", radius: 25, isObstacle: false, points: 150, textDesc: "GitHub Star" },
  { type: "coffee", label: "COFFEE", color: "#a855f7", radius: 24, isObstacle: false, points: 40, buff: "x2", textDesc: "Cà Phê Boost" },
  { type: "bug_crash", label: "BUG 500", color: "#ef4444", radius: 26, isObstacle: true, damage: 1, textDesc: "Server Crash 500" },
  { type: "conflict", label: "CONFLICT", color: "#f97316", radius: 26, isObstacle: true, damage: 1, textDesc: "Merge Conflict" },
  { type: "drop_db", label: "DROP DB", color: "#dc2626", radius: 24, isObstacle: true, damage: 0, scoreDeduct: 40, textDesc: "Drop Database" },
];

export const ASSET_PATHS = {
  fptuLogo: "assets/fptu_logo_white.png",
  deverLogo: "assets/dever_logo_white.png",
  playerRunning: "assets/player_running.png",
  playerDead: "assets/player_dead.png",
  buggyChampion: "assets/buggy_champion.png"
};
