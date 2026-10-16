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
    badge: "FLAGSHIP ARCADE RUNNER",
    badgeColor: "var(--fpt-orange)",
    title: "BUGGY DASH — ĐUA XE NÉ DEADLINE",
    mascot: "assets/player_3d_run.png",
    desc: "Chế độ đua xe né deadline đỉnh cao tích hợp toàn diện: Lắc đầu/quét tay né bug, nhảy bổng hất cằm, cúi đầu trượt lướt, hút trọn PR Merged & Git Crystal, và bứt tốc Nitro Highway x1.5!",
    rules: [
      { badge: "CHUYỂN LÀN / BẺ LÁI", badgeClass: "steer-badge", title: "Lắc Đầu Đổi Làn", desc: "Nghiêng đầu nhẹ hoặc bẻ lái vô lăng để chuyển 3 làn Trái - Giữa - Phải hoặc lái tự do Analog" },
      { badge: "NHẢY & TRƯỢT", badgeClass: "loot-badge", title: "Hất Cằm Nhảy / Cúi Trượt", desc: "Hất đầu nhanh để nhảy qua con bug dưới đất; cúi đầu để trượt sát mặt đường né deadline trên cao" },
      { badge: "HÚT PR & NITRO", badgeClass: "avoid-badge", title: "Gom Quà & Bứt Tốc", desc: "Hút Pull Request (+100đ), Sao Vàng (+150đ) và ăn Nitro bứt phá tốc độ Highway x1.5 đâm xuyên bug" }
    ],
    faceRules: [
      { badge: "CHUYỂN LÀN / BẺ LÁI", badgeClass: "steer-badge", title: "Lắc Đầu Đổi Làn", desc: "Nghiêng đầu nhẹ hoặc bẻ lái vô lăng để chuyển 3 làn Trái - Giữa - Phải hoặc lái tự do Analog" },
      { badge: "NHẢY & TRƯỢT", badgeClass: "loot-badge", title: "Hất Cằm Nhảy / Cúi Trượt", desc: "Hất đầu nhanh để nhảy qua con bug dưới đất; cúi đầu để trượt sát mặt đường né deadline trên cao" },
      { badge: "HÚT PR & NITRO", badgeClass: "avoid-badge", title: "Gom Quà & Bứt Tốc", desc: "Hút Pull Request (+100đ), Sao Vàng (+150đ) và ăn Nitro bứt phá tốc độ Highway x1.5 đâm xuyên bug" }
    ],
    handRules: [
      { badge: "QUÉT TAY ĐỔI LÀN", badgeClass: "steer-badge", title: "Di Chuyển Lòng Bàn Tay", desc: "Đưa bàn tay sang Trái / Giữa / Phải trước webcam để Buggy bám theo làn tay tức thì" },
      { badge: "VUỐT LÊN / VUỐT XUỐNG", badgeClass: "loot-badge", title: "Vuốt Tay Nhảy / Trượt", desc: "Quét tay lên cao để nhảy qua bug đất; quét tay xuống thấp để trượt rạp người né deadline" },
      { badge: "GOM PR & NITRO RUSH", badgeClass: "avoid-badge", title: "Đón Quà & Đua Tốc Độ", desc: "Đón trọn Pull Request, Git Crystal và bình Nitro kích hoạt tốc độ 200 km/h bất tử" }
    ],
    tips: "Tận dụng phím T để chuyển giữa 3 Làn Nhạy và Lái Tự Do; ăn Cà Phê nhận x2 Combo và Nitro để bất tử càn quét!",
    ctaText: "Bắt Đầu Buggy Dash (SPACE)"
  },
  [GAME_MODES.CATCHER]: {
    badge: "MINIGAME HỨNG CODE MERGED",
    badgeColor: "#10b981",
    title: "HỨNG PR & GIT CRYSTAL",
    mascot: "assets/player_3d_run_f2.png",
    desc: "Trang bị giỏ hứng công nghệ PR Catcher! Di chuyển liên tục gom trọn Pull Request, Git Crystal và Sao Vàng, tránh xa Syntax Error!",
    rules: [
      { badge: "LÁI ANALOG TỰ DO", badgeClass: "steer-badge", title: "Lắc Đầu Mượt Mà", desc: "Lắc đầu tự do trái/phải — giỏ PR Catcher bám theo đầu mượt mà không bị giới hạn 3 làn" },
      { badge: "GOM CHÙM QUÀ", badgeClass: "loot-badge", title: "Hứng PR & Git Gem", desc: "Đón trọn Pull Request (+100đ), Git Gem (+60đ) và Sao Vàng (+150đ) rơi xuống" },
      { badge: "NÉ THÙNG SẬP DB", badgeClass: "avoid-badge", title: "Tránh Bug 500", desc: "Lắc đầu né xa các thùng sập Database đỏ và Bug Server 500 để không bị trừ điểm" }
    ],
    faceRules: [
      { badge: "LÁI ANALOG TỰ DO", badgeClass: "steer-badge", title: "Lắc Đầu Mượt Mà", desc: "Lắc đầu tự do trái/phải — giỏ PR Catcher bám theo đầu mượt mà không bị giới hạn 3 làn" },
      { badge: "GOM CHÙM QUÀ", badgeClass: "loot-badge", title: "Hứng PR & Git Gem", desc: "Đón trọn Pull Request (+100đ), Git Gem (+60đ) và Sao Vàng (+150đ) rơi xuống" },
      { badge: "NÉ THÙNG SẬP DB", badgeClass: "avoid-badge", title: "Tránh Bug 500", desc: "Lắc đầu né xa các thùng sập Database đỏ và Bug Server 500 để không bị trừ điểm" }
    ],
    handRules: [
      { badge: "BÀN TAY ĐIỀU HƯỚNG", badgeClass: "steer-badge", title: "Bàn Tay 1:1 Siêu Nhạy", desc: "Di chuyển bàn tay ngang qua lại trước webcam — giỏ hứng bám sát theo vị trí lòng bàn tay 1:1" },
      { badge: "QUÉT TAY HỨNG QUÀ", badgeClass: "loot-badge", title: "Đón Mọi Pull Request", desc: "Bàn tay di chuyển linh hoạt gom trọn vẹn mọi dòng code sạch và sao vàng GitHub" },
      { badge: "RÚT TAY NÉ BUG", badgeClass: "avoid-badge", title: "Né Thùng Sập DB", desc: "Né bàn tay khỏi vùng rơi của các con bug đỏ để bảo toàn điểm số kỷ lục" }
    ],
    tips: "Tập trung di chuyển liên tục ở khu vực giữa sân để đón được các chùm sao rơi hai bên sườn!",
    ctaText: "Bắt Đầu Hứng PR Merged (SPACE)"
  },
  [GAME_MODES.HIGHWAY]: {
    badge: "ĐUA XE CAO TỐC FPTU — TỐC ĐỘ X1.5",
    badgeColor: "#f59e0b",
    title: "FPT HIGHWAY RACER",
    mascot: "assets/player_3d_run.png",
    desc: "Lướt trên đại lộ FPT University Đà Nẵng với tốc độ cao! Drift tự do lách qua các chướng ngại vật xuất hiện dồn dập.",
    rules: [
      { badge: "NGHIÊNG ĐẦU ÔM CUA", badgeClass: "steer-badge", title: "Head Tilt Ôm Cua", desc: "Nghiêng đầu (Tilt) sang trái/phải như ôm cua xe máy — Buggy nghiêng bánh drift cực gắt" },
      { badge: "PHẢN XẠ NHANH", badgeClass: "avoid-badge", title: "Tốc Độ Cao x1.5", desc: "Chướng ngại vật lao tới nhanh gấp 1.5 lần, đòi hỏi bạn lắc đầu dứt khoát né chướng ngại" },
      { badge: "NITRO RUSH", badgeClass: "loot-badge", title: "Bình Nitro NOS", desc: "Ăn bình Nitro để kích hoạt Fever Mode 5s đâm xuyên mọi thứ và nhân đôi điểm số" }
    ],
    faceRules: [
      { badge: "NGHIÊNG ĐẦU ÔM CUA", badgeClass: "steer-badge", title: "Head Tilt Ôm Cua", desc: "Nghiêng đầu (Tilt) sang trái/phải như ôm cua xe máy — Buggy nghiêng bánh drift cực gắt" },
      { badge: "PHẢN XẠ NHANH", badgeClass: "avoid-badge", title: "Tốc Độ Cao x1.5", desc: "Chướng ngại vật lao tới nhanh gấp 1.5 lần, đòi hỏi bạn lắc đầu dứt khoát né chướng ngại" },
      { badge: "NITRO RUSH", badgeClass: "loot-badge", title: "Bình Nitro NOS", desc: "Ăn bình Nitro để kích hoạt Fever Mode 5s đâm xuyên mọi thứ và nhân đôi điểm số" }
    ],
    handRules: [
      { badge: "VÔ LĂNG ẢO", badgeClass: "steer-badge", title: "Quét Tay Drift Xe", desc: "Quét tay nhanh sang trái/phải như đang vần vô lăng ảo để drift lướt xe tốc độ cao" },
      { badge: "LÁCH KHE HẸP", badgeClass: "avoid-badge", title: "Phản Xạ Bàn Tay", desc: "Di chuyển tay nhịp nhàng luồn lách qua các khe hẹp giữa 2 chướng ngại vật sát nhau" },
      { badge: "GOM BÌNH NITRO", badgeClass: "loot-badge", title: "Bứt Tốc 200 km/h", desc: "Đưa tay đón bình Nitro để kích hoạt bứt tốc cực hạn và bất tử đâm xuyên bug" }
    ],
    tips: "Tận dụng góc nghiêng đầu hoặc vung tay nhẹ ở giữa làn để giữ độ cân bằng tối đa khi tốc độ tăng cao!",
    ctaText: "Vào Đua FPT Highway Ngay (SPACE)"
  },
  [GAME_MODES.SLICER]: {
    badge: "CHẾ ĐỘ CHÉM BUG NINJA",
    badgeColor: "#f43f5e",
    title: "CODE SLICER — CHÉM BUG BẰNG TAY",
    mascot: "assets/player_3d_run_f2.png",
    desc: "Vung kiếm Cyber Blade chém đứt các con bug bay tung lên! Gom PR Merged, né bom Deadline 23:59!",
    rules: [
      { badge: "VUNG KIẾM LASER", badgeClass: "steer-badge", title: "Vung Tay Nhanh (>260px/s)", desc: "Vung ngón tay hoặc bàn tay chém ngang/dọc dứt khoát để phóng đường kiếm Laser Neon rực sáng" },
      { badge: "CHÉM ĐÔI BUG ĐỎ", badgeClass: "loot-badge", title: "Combo Chém Đứt Bug", desc: "Chém đứt các con bug bay tung lên để nhận chuỗi Combo x2, x3 (+100đ/nhát) và quà Code" },
      { badge: "CẤM CHÉM BOM", badgeClass: "avoid-badge", title: "Né Bom Deadline 23:59", desc: "TUYỆT ĐỐI KHÔNG chém vào quả bom Deadline 23:59 — chém trúng bom sẽ nổ tung trừ 1 mạng!" }
    ],
    handRules: [
      { badge: "VUNG KIẾM LASER", badgeClass: "steer-badge", title: "Vung Tay Nhanh (>260px/s)", desc: "Vung ngón tay hoặc bàn tay chém ngang/dọc dứt khoát để phóng đường kiếm Laser Neon rực sáng" },
      { badge: "CHÉM ĐÔI BUG ĐỎ", badgeClass: "loot-badge", title: "Combo Chém Đứt Bug", desc: "Chém đứt các con bug bay tung lên để nhận chuỗi Combo x2, x3 (+100đ/nhát) và quà Code" },
      { badge: "CẤM CHÉM BOM", badgeClass: "avoid-badge", title: "Né Bom Deadline 23:59", desc: "TUYỆT ĐỐI KHÔNG chém vào quả bom Deadline 23:59 — chém trúng bom sẽ nổ tung trừ 1 mạng!" }
    ],
    faceRules: [
      { badge: "ĐẦU CHÉM LASER", badgeClass: "steer-badge", title: "Lắc Đầu Phóng Kiếm", desc: "Lắc đầu hoặc giật đầu nhanh theo hướng bug đang bay để phóng luồng kiếm Laser Blade" },
      { badge: "GẬT ĐẦU CHÉM BUG", badgeClass: "loot-badge", title: "Cắt Đôi Syntax Error", desc: "Gật đầu dứt khoát khi các con bug đỏ bay vào tầm ngắm để chém đứt nhận điểm" },
      { badge: "NÉ TẦM BOM", badgeClass: "avoid-badge", title: "Tránh Xa Bom Deadline", desc: "Giữ yên đầu tránh xa quả bom deadline đang bay lơ lửng trên không" }
    ],
    tips: "Chờ từ 2-3 con bug bay lên cùng lúc rồi vung 1 nhát chém quét ngang để nhận thưởng Combo Slash!",
    ctaText: "Vào Chém Bug Ninja (SPACE)"
  },
  [GAME_MODES.FLAPPY]: {
    badge: "ĐIỀU KHIỂN BÁM MŨI / BÀN TAY",
    badgeColor: "#06b6d4",
    title: "FLAPPY BUGGY — CÁP QUANG FPTU",
    mascot: "assets/player_3d_run_f2.png",
    desc: "Buggy đập cánh lượn trong đường hầm cáp quang FPT! Dính Buggy vào mũi hoặc lòng bàn tay — mũi/tay nâng hạ đến đâu, Buggy bám theo êm ái đến đó để lọt qua các khe tường lửa Firewall!",
    rules: [
      { badge: "BÁM THEO MŨI (1:1)", badgeClass: "steer-badge", title: "Mũi Dẫn Đường", desc: "Nâng/hạ đầu tự nhiên — Buggy dính theo vị trí mũi lượn lên xuống mượt mà qua khe hở" },
      { badge: "KHE HỞ AN TOÀN", badgeClass: "avoid-badge", title: "Căn Khe Firewall", desc: "Giữ mũi hoặc tay trong khe hở rộng 240px giữa 2 cột tường lửa để bay qua an toàn" },
      { badge: "PASS CỔNG LOGIC", badgeClass: "loot-badge", title: "Pass Bit 1 (+10đ)", desc: "Mỗi cổng logic (AND, OR, XOR, NAND) bay qua thành công nhận ngay +10 điểm và pháo hoa" }
    ],
    faceRules: [
      { badge: "BÁM THEO MŨI (1:1)", badgeClass: "steer-badge", title: "Mũi Dẫn Đường (Nose Track)", desc: "Nâng cằm lên để Buggy bay lên, hạ cằm xuống để Buggy lướt xuống. Cực kỳ mượt mà, không mỏi cổ!" },
      { badge: "CĂN KHE TƯỜNG LỬA", badgeClass: "avoid-badge", title: "Luồn Lách Khe Rộng", desc: "Giữ mũi thẳng hướng vào khe hở giữa 2 cột tường lửa để Buggy vượt qua an toàn tuyệt đối" },
      { badge: "PASS CỔNG LOGIC", badgeClass: "loot-badge", title: "Pass Bit 1 (+10đ)", desc: "Mỗi cổng logic (AND, OR, XOR, NAND) bay qua thành công nhận ngay +10 điểm" }
    ],
    handRules: [
      { badge: "BÁM THEO BÀN TAY", badgeClass: "steer-badge", title: "Bàn Tay 1:1 Siêu Nhạy", desc: "Đưa lòng bàn tay hoặc ngón trỏ lên/xuống — Buggy lướt theo vị trí tay như drone điều khiển từ xa!" },
      { badge: "ĐIỀU TIẾT CAO ĐỘ", badgeClass: "avoid-badge", title: "Giữ Độ Cao Cân Bằng", desc: "Giữ tay ổn định trong khe hở an toàn khi sắp chạm cột Firewall để bay qua êm ái" },
      { badge: "VƯỢT TRỤ AN TOÀN", badgeClass: "loot-badge", title: "Ghi Điểm Cổng Logic", desc: "Bay lọt qua giữa 2 cột Firewall nhận ngay điểm thưởng và hiệu ứng pháo hoa neon" }
    ],
    tips: "Chỉ cần nghiêng/nâng đầu nhẹ nhàng từ 3-5cm là Buggy đã bám theo cực chuẩn. Hãy nhìn trước vào khe hở của cột tiếp theo!",
    ctaText: "Bay Cáp Quang Flappy (SPACE)"
  },
  [GAME_MODES.DUEL]: {
    badge: "ĐỐI KHÁNG ĐỒNG ĐỘI",
    badgeColor: "#ef4444",
    title: "SONG ĐẤU 1V1",
    mascot: "assets/player_3d_run.png",
    desc: "Thử tài so trình né deadline giữa 2 lập trình viên! Chọn đấu 2 máy qua Wi-Fi/LAN hoặc 2 người cùng chơi trên 1 webcam máy tính.",
    rules: [
      { badge: "ĐẤU 2 MÁY WI-FI", badgeClass: "steer-badge", title: "Mỗi Máy 1 Webcam", desc: "Mỗi người ngồi trước 1 laptop, lắc đầu né bug và gom combo sao vàng trên màn hình riêng" },
      { badge: "BẮN DEADLINE", badgeClass: "avoid-badge", title: "Tấn Công Đối Thủ", desc: "Khi bạn ăn chuỗi combo sao vàng, hệ thống tự động bắn bom deadline sang máy đối thủ!" },
      { badge: "SINH TỒN THẮNG CUỘC", badgeClass: "loot-badge", title: "Ai Sống Dai Hơn", desc: "Người sống sót sau cùng hoặc đạt điểm cao hơn khi hết 60s sẽ giành cúp chiến thắng" }
    ],
    faceRules: [
      { badge: "ĐẤU 2 MÁY WI-FI", badgeClass: "steer-badge", title: "Mỗi Máy 1 Webcam", desc: "Mỗi người ngồi trước 1 laptop, lắc đầu né bug và gom combo sao vàng trên màn hình riêng" },
      { badge: "BẮN DEADLINE", badgeClass: "avoid-badge", title: "Tấn Công Đối Thủ", desc: "Khi bạn ăn chuỗi combo sao vàng, hệ thống tự động bắn bom deadline sang máy đối thủ!" },
      { badge: "SINH TỒN THẮNG CUỘC", badgeClass: "loot-badge", title: "Ai Sống Dai Hơn", desc: "Người sống sót sau cùng hoặc đạt điểm cao hơn khi hết 60s sẽ giành cúp chiến thắng" }
    ],
    handRules: [
      { badge: "VUNG TAY ĐỐI KHÁNG", badgeClass: "steer-badge", title: "Cử Chỉ Tay Độc Lập", desc: "Dùng cử chỉ quét tay né chướng ngại vật trên đường đua của mình bằng cảm biến tay" },
      { badge: "PHẢN CÔNG NHANH", badgeClass: "avoid-badge", title: "Dồn Ép Bạn Chơi", desc: "Quét tay gom nhanh quà tặng để kích hoạt đòn phản công dồn dập sang máy bạn" },
      { badge: "KNOCKOUT ĐỐI THỦ", badgeClass: "loot-badge", title: "Chiến Thắng Tuyệt Đối", desc: "Ép đối thủ dính đòn mất hết 3 mạng để giành chiến thắng Knockout!" }
    ],
    tips: "Tập trung giữ mạng trước khi mải mê nhặt quà — chỉ cần đối thủ dính đòn trước là bạn thắng ngay!",
    ctaText: "Mở Sảnh Chờ Song Đấu"
  },
  [GAME_MODES.SPLIT_SCREEN]: {
    badge: "ĐỐI KHÁNG 1 MÁY CHUNG CAM",
    badgeColor: "#06b6d4",
    title: "SPLIT-SCREEN ĐỐI KHÁNG",
    mascot: "assets/player_3d_run.png",
    desc: "Hai bạn cùng đứng kè vai trước webcam máy tính! Màn hình chia đôi thi tài né deadline song song.",
    rules: [
      { badge: "ĐỨNG KÈ VAI (P1 & P2)", badgeClass: "steer-badge", title: "P1 Bên Trái • P2 Bên Phải", desc: "P1 đứng nửa trái camera (Làn Cyan), P2 đứng nửa phải camera (Làn Amber)" },
      { badge: "LẮC ĐẦU ĐỘC LẬP", badgeClass: "loot-badge", title: "Điều Khiển Riêng Biệt", desc: "Mỗi bạn tự do lắc đầu điều khiển Buggy của mình trên nửa màn hình tương ứng" },
      { badge: "SO KÈ TRỰC DIỆN", badgeClass: "avoid-badge", title: "Xem Ai Bị Đè Bẹp Trước", desc: "Ai né bug dai hơn và nhặt nhiều sao vàng hơn trên cùng 1 webcam sẽ thắng cuộc" }
    ],
    faceRules: [
      { badge: "ĐỨNG KÈ VAI (P1 & P2)", badgeClass: "steer-badge", title: "P1 Bên Trái • P2 Bên Phải", desc: "P1 đứng nửa trái camera (Làn Cyan), P2 đứng nửa phải camera (Làn Amber)" },
      { badge: "LẮC ĐẦU ĐỘC LẬP", badgeClass: "loot-badge", title: "Điều Khiển Riêng Biệt", desc: "Mỗi bạn tự do lắc đầu điều khiển Buggy của mình trên nửa màn hình tương ứng" },
      { badge: "SO KÈ TRỰC DIỆN", badgeClass: "avoid-badge", title: "Xem Ai Bị Đè Bẹp Trước", desc: "Ai né bug dai hơn và nhặt nhiều sao vàng hơn trên cùng 1 webcam sẽ thắng cuộc" }
    ],
    handRules: [
      { badge: "TAY TRÁI & TAY PHẢI", badgeClass: "steer-badge", title: "Phân Vùng Bàn Tay", desc: "P1 dùng tay ở nửa trái khung hình, P2 dùng tay ở nửa phải khung hình camera" },
      { badge: "QUÉT TAY SONG SONG", badgeClass: "loot-badge", title: "Đua Cử Chỉ Tay 1 Máy", desc: "Cả 2 cùng so tài cử chỉ tay trên 1 máy tính không cần chạm vào bàn phím!" },
      { badge: "SINH TỒN ĐỐI ĐẦU", badgeClass: "avoid-badge", title: "Loại Trực Tiếp", desc: "Bên nào mất hết 3 mạng trước sẽ thua cuộc ngay lập tức!" }
    ],
    tips: "Đứng cách camera khoảng 0.8m - 1.2m và giữ khoảng cách vai thoải mái để camera nhận diện cả 2 người rõ nhất!",
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
  { type: "bug_crash", label: "BUG 500", color: "#ef4444", radius: 26, isObstacle: true, damage: 1, textDesc: "Server Crash 500" },
  { type: "coffee", label: "COFFEE", color: "#06b6d4", radius: 24, isObstacle: false, points: 30, buff: "x2", textDesc: "Cà Phê FPTU" },
  { type: "clean_code", label: "CODE", color: "#10b981", radius: 26, isObstacle: false, points: 50, textDesc: "Clean Code" },
  { type: "pr_merged", label: "PR MERGE", color: "#10b981", radius: 26, isObstacle: false, points: 100, textDesc: "PR Merged" },
  { type: "star", label: "STAR", color: "#f59e0b", radius: 25, isObstacle: false, points: 150, textDesc: "GitHub Star" },
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
  gravity: 580,            // Trọng lực rơi mềm mại
  flapVelocity: -280,      // Lực nhảy nhấp nhả
  pipeSpeed: 195,          // Tốc độ trôi vừa phải, thư thái dễ quan sát
  pipeSpawnInterval: 2.2,  // Khoảng cách nhịp nhàng giữa các cột
  pipeGap: 240,            // Khe hở rộng rãi (240px) giúp dễ dàng lọt qua bằng cử chỉ mũi / tay
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
  player3dBankRight: "assets/player_3d_bank_right.png",
  item3dStar: "assets/item_3d_star.png",
  item3dCoffee: "assets/item_3d_coffee.png",
  item3dGem: "assets/item_3d_gem.png",
  item3dBug: "assets/item_3d_bug.png",
  item3dDeadline: "assets/item_3d_deadline.png"
};
