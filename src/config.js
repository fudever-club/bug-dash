// FU-DEVER BUG DASH - Central Configuration & Balance Parameters

export const VISION_CONFIG = {
  roi: { x0: 0.25, x1: 0.75 },     // Vùng "vạch xuất phát" chuẩn hóa 0..1
  lockMs: 1000,                    // Đứng yên trong ROI 1.0 giây để khóa người chơi
  lostFrames: 15,                  // Mất mặt quá 15 frame (~0.5s ở 30fps) thì chuyển trạng thái lost
  maxLostFrames: 60,               // Giữ lock dự phòng tối đa 60 frame (~2.0s) trước khi nhả lock
  minIoU: 0.15,                    // Ngưỡng IoU tối thiểu
  minArea: 0.02,                   // Bounding box < 2% khung hình thì bỏ qua (lọc người đứng xa phía sau)
  ema: 0.4,                        // Hệ số làm mượt tâm đầu X (EMA fallback)
  tiltEma: 0.35,                   // Hệ số làm mượt góc nghiêng đầu (Tilt fallback)
  tiltWeight: 0.65,                // Trọng số góc nghiêng đầu kết hợp vào độ lệch chuyển làn (ôm cua xe máy)
  hyst: 0.02,                      // Vùng chết (hysteresis) tránh rung giật ở ranh giới 2 làn
  defaultThreshold: 0.09,          // Ngưỡng lệch tâm để chuyển làn mặc định 9%
  useOneEuro: true,                // Sử dụng 1€ Filter triệt tiêu rung giật và giảm độ trễ <5ms
  oneEuro: {
    minCutoff: 1.0,                // Hz (tần số cắt chống rung khi đứng yên)
    beta: 3.5,                     // Hệ số tăng tốc đáp ứng chuẩn hóa cho tọa độ 0..1
    dCutoff: 1.0                   // Tần số cắt đạo hàm vận tốc
  },
  verticalGesture: {
    jumpVelocity: -0.32,           // Vận tốc dY/dt giật lên kích hoạt JUMP
    duckVelocity: 0.35,            // Vận tốc dY/dt giật xuống kích hoạt SLIDE/DUCK
    cooldownMs: 400                // Thời gian hồi chiêu giữa 2 lần nhún nhảy
  },
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
  SLICER: "slicer",                // Code Slicer (Chém Bug Bằng Tay - Fruit Ninja style)
  FLAPPY: "flappy",                // Flappy Buggy (Bay Cáp Quang FPT & Cổng Logic)
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
  [GAME_MODES.SLICER]: {
    badge: "CHẾ ĐỘ CHÉM BUG NINJA",
    badgeColor: "#f43f5e",
    title: "CODE SLICER — CHÉM BUG BẰNG TAY",
    mascot: "assets/buggy_champion.png",
    desc: "Dùng ngón tay hoặc chuột vung kiếm Cyber Blade chém đứt các con bug bay tung lên! Gom PR Merged, né bom Deadline 23:59!",
    rules: [
      { badge: "CẦN CHÉM", badgeClass: "avoid-badge", title: "Bug & Syntax Error", desc: "Chém đứt đôi các con bug đỏ để nhận điểm combo" },
      { badge: "CẦN ĂN", badgeClass: "loot-badge", title: "PR Merged & Cà Phê", desc: "Chém gom Code sạch +100đ, Cà Phê x2" },
      { badge: "TRÁNH CHÉM", badgeClass: "steer-badge", title: "Bom Deadline 23:59", desc: "Chém trúng bom Deadline sẽ nổ trừ 1 mạng!" }
    ],
    ctaText: "Vào Chém Bug Ninja (SPACE)"
  },
  [GAME_MODES.FLAPPY]: {
    badge: "HỘI CHỨNG DEADLINE FPT",
    badgeColor: "#06b6d4",
    title: "FLAPPY BUGGY — CÁP QUANG FPTU",
    mascot: "assets/player_running.png",
    desc: "Nhún đầu hoặc ngẩng mặt lên để Buggy đập cánh bay lượn qua các cổng logic bitwise và tường lửa Firewall trong đường cáp quang FPT!",
    rules: [
      { badge: "ĐIỀU KHIỂN", badgeClass: "steer-badge", title: "Gật / Ngẩng Đầu", desc: "Ngẩng đầu lên hoặc bấm SPACE để Buggy đập cánh bay lên" },
      { badge: "CẦN VƯỢT", badgeClass: "avoid-badge", title: "Cổng Logic & Firewall", desc: "Luồn lách qua khe hở giữa 2 cột tường lửa" },
      { badge: "ĐIỂM THƯỞNG", badgeClass: "loot-badge", title: "Pass Bit 1 (+10đ)", desc: "Mỗi cổng logic vượt qua thành công nhận +10 điểm" }
    ],
    ctaText: "Bay Cáp Quang Flappy (SPACE)"
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
  },
  [GAME_MODES.SPLIT_SCREEN]: {
    badge: "ĐỐI KHÁNG 1 MÁY CHUNG CAM",
    badgeColor: "#06b6d4",
    title: "SPLIT-SCREEN ĐỐI KHÁNG",
    mascot: "assets/player_running.png",
    desc: "Hai bạn cùng đứng kè vai trước webcam máy tính! Màn hình chia đôi thi tài né deadline song song.",
    rules: [
      { badge: "NỬA TRÁI (P1)", badgeClass: "steer-badge", title: "Người Chơi 1", desc: "Đứng bên trái webcam, lái xe làn Cyan" },
      { badge: "NỬA PHẢI (P2)", badgeClass: "loot-badge", title: "Người Chơi 2", desc: "Đứng bên phải webcam, lái xe làn Amber" },
      { badge: "MỤC TIÊU", badgeClass: "avoid-badge", title: "Ai Sống Dai Hơn", desc: "Người sống sót sau cùng hoặc điểm cao hơn sẽ thắng" }
    ],
    ctaText: "Bắt Đầu Đấu Split-Screen Ngay"
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

export const SLICER_CONFIG = {
  gravity: 680,            // Trọng lực px/s^2 kéo vật thể rơi xuống
  bladeTrailMaxPoints: 12, // Số điểm lưu vết kiếm neon
  minSliceVelocity: 260,   // Vận tốc vung tay tối thiểu để kích hoạt nhát chém (px/s)
  sliceHitboxBonus: 18,    // Biên độ nhận diện nhát chém rộng hơn
};

export const FLAPPY_CONFIG = {
  gravity: 720,            // Trọng lực rơi của Buggy
  flapVelocity: -290,      // Lực nhảy khi nhún đầu hoặc bấm Space
  pipeSpeed: 210,          // Tốc độ trôi của cột Firewall từ phải sang trái
  pipeSpawnInterval: 1.85, // Khoảng thời gian sinh cột mới (giây)
  pipeGap: 175,            // Khe hở an toàn để bay qua (px)
  pipeWidth: 68,           // Độ rộng cột Firewall (px)
};

export const ASSET_PATHS = {
  fptuLogo: "assets/fptu_logo_white.png",
  deverLogo: "assets/dever_logo_white.png",
  playerRunning: "assets/player_running.png",
  playerDead: "assets/player_dead.png",
  buggyChampion: "assets/buggy_champion.png",
  player3dRun: "assets/player_3d_run.png",
  player3dRunF1: "assets/player_3d_run_f1.png",
  player3dRunF2: "assets/player_3d_run_f2.png",
  player3dJump: "assets/player_3d_jump.png",
  player3dSlide: "assets/player_3d_slide.png",
  player3dBankLeft: "assets/player_3d_bank_left.png",
  player3dBankRight: "assets/player_3d_bank_right.png"
};
