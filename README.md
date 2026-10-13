# BUG DASH — NÉ BUG / CHẠY DEADLINE

> **Trò chơi Web Arcade tương tác 60 giây kết hợp Computer Vision AI & Văn hóa Lập trình sinh viên.**  
> Phát triển bởi **CLB Học thuật Lập trình FU-DEVER** — Trường Đại học FPT Đà Nẵng.

---

## 1. Giới thiệu tổng quan

**Bug Dash (Né Bug / Chạy Deadline)** là tựa game tương tác tốc độ cao, người chơi sử dụng **chuyển động dịch chuyển đầu ngang qua Webcam** để điều khiển nhân vật né tránh các hiểm họa quen thuộc của giới developer và sinh viên CNTT:
- **Bug (Syntax Error) & Deadline 23:59:** Gây mất mạng (khiên bảo vệ).
- **Điểm F:** Gây trừ điểm số trực tiếp.
- **Clean Code & Cà phê FPTU:** Tăng điểm số, kích hoạt nhân đôi điểm (x2 Buff Combo).

Mỗi lượt chơi kéo dài đúng **60 giây**, mang lại trải nghiệm dồn dập, hào hứng, phù hợp để trình diễn tại các gian hàng công nghệ (**Club Day, Tech Expo, Hackathon Booth**).

---

## 2. Kiến trúc Công nghệ & AI Vision

Hệ thống được thiết kế theo mô hình phân tầng độc lập giữa luồng Computer Vision và luồng Render đồ họa:

```text
Webcam Input (getUserMedia 640x480 Mirror)
  │
  ▼
MediaPipe Vision Face Detector (BlazeFace Short-Range Float16)
  │ (Bounding box chuẩn hóa 0..1, tần suất 20-30 FPS)
  ▼
Target Lock-on Selector & Tracker
  │ (ROI Vạch xuất phát + Kiểm tra ổn định 1.0s + IoU & Center matching)
  ▼
Lane Controller (EMA Smoothing α=0.4 + Hysteresis Dead-zone)
  │ (Phân 3 làn: Trái = 0 | Giữa = 1 | Phải = 2)
  ▼
Game Viewport & Cyber Runway (60 FPS Visuals)
  │ (Web Audio API Synthesizer + Telemetry HUD + Local Leaderboard)
```

### Điểm nhấn kỹ thuật:
1. **Khóa mục tiêu thông minh (Anti-Crowd Stealing):** Người chơi đứng vào vùng ROI vàng giữa màn hình trong 1 giây để khóa mục tiêu (`locked`). Thuật toán ngăn chặn việc người đi ngang qua cướp quyền điều khiển.
2. **Làm mượt EMA & Hysteresis:** Chống rung giật ở ranh giới giữa 2 làn, phản hồi mượt mà trong vòng <120ms.
3. **Chế độ Bàn phím Dự phòng (Keyboard Fallback):** Khi không có webcam hoặc ánh sáng yếu, người chơi có thể chuyển sang điều khiển bằng phím `←` / `→` mà không làm gián đoạn luồng game.
4. **Bảo vệ quyền riêng tư 100%:** Xử lý AI on-device trực tiếp trên trình duyệt bằng WebAssembly & GPU delegate, không lưu trữ hay gửi video/hình ảnh khuôn mặt lên máy chủ.

---

## 3. Phong cách Giao diện & Thẩm mỹ (Taste & Impeccable DNA)

Giao diện được chế tác theo bộ quy chuẩn thẩm mỹ **`taste-skill` v2** và **`impeccable` frontend craftsmanship**:
- **Anti-Slop AI Design:** Không sử dụng các dải màu gradient tím sáo rỗng, không căn giữa máy móc, không rải emoji bừa bãi vào nút bấm.
- **Bảng màu nhận diện FU-DEVER:**
  - Nền Obsidian đa tầng (`#070a13`, `#0d1424`).
  - Điểm nhấn DEVER Electric Amber (`#f59e0b`) & FPT Orange (`#f26f21`).
  - Trạng thái thành công Neon Emerald (`#10b981`), Cyber Cyan (`#06b6d4`), Danger Crimson (`#ef4444`).
- **Typography:** `Be Vietnam Pro` (tiếng Việt chuẩn nét) kết hợp `JetBrains Mono` / `Space Grotesk` hiển thị số liệu terminal.
- **Sound Engine Xúc giác (Web Audio API):** Tự động phát âm thanh procedural synth khi khóa mục tiêu, đổi làn và tương tác nút mà không cần nạp file audio ngoài.

---

## 4. Phím Tắt Điều Khiển

| Phím | Chức năng |
|---|---|
| `SPACE` | Bắt đầu lượt chơi mới / Tiếp tục |
| `C` | Calibrate lại: Đặt vị trí đầu hiện tại làm tâm chuẩn (Làn giữa) |
| `D` | Bật/Tắt Debug Grid: Hiện khung bbox, ROI, phân làn |
| `M` | Bật/Tắt Âm thanh: Mute / Unmute procedural synth SFX |
| `←` / `→` hoặc `A` / `D` | Di chuyển sang trái / sang phải (Keyboard fallback) |

---

## 5. Cấu trúc Thư mục Dự Án (Full-Stack Modular Architecture)

```text
bug-dash/
├── index.html                  # App Shell HTML tải module CSS & JavaScript
├── vite.config.js              # Cấu hình Vite Dev Server & API Reverse Proxy
├── package.json                # Dependencies: Express, Cors, Vite
├── assets/                     # Tài nguyên đồ họa thương hiệu (Logos, Mascots)
├── server/                     # Backend API & Server
│   ├── server.js               # Express Server (Port 3001), Health check & Static host
│   ├── routes/
│   │   └── leaderboard.js      # REST API: GET/POST bảng vàng điểm số top 10
│   └── data/
│       └── leaderboard.json    # Cơ sở dữ liệu điểm số cục bộ
├── src/                        # Kiến trúc Frontend ES Modules
│   ├── config.js               # Tham số cân bằng (Vision, Game, Spawner, Assets)
│   ├── main.js                 # Entry Point khởi tạo và điều phối game loop
│   ├── api/
│   │   └── apiClient.js        # REST Client + Auto Fallback LocalStorage
│   ├── audio/
│   │   └── SoundEngine.js      # Web Audio API Procedural Synthesizer
│   ├── vision/                 # Phân hệ Computer Vision MediaPipe BlazeFace
│   │   ├── camera.js           # Quản lý Webcam stream & quyền truy cập
│   │   ├── detector.js         # Wrapper BlazeFace Short-Range GPU Delegate
│   │   ├── tracker.js          # Single-Player Confirmation, IoU, EMA filter
│   │   └── laneController.js   # Bộ điều khiển chuyển 3 làn (Hysteresis & Keyboard)
│   ├── engine/                 # Động cơ 2D Canvas Arcade Runner 60 FPS
│   │   ├── GameState.js        # FSM (Idle, Countdown, Playing, GameOver, Victory)
│   │   ├── Spawner.js          # Thuật toán sinh chướng ngại vật & đảm bảo làn thoát
│   │   ├── Collision.js        # Hệ thống kiểm tra va chạm Circle-Circle
│   │   ├── ParticleSystem.js   # Hạt nổ burst sparks & text bay combat
│   │   └── RoadRenderer.js     # Render đường đua phối cảnh Neon & Sprite Mascot
│   ├── ui/
│   │   └── UIController.js     # Quản lý HUD, PIP Video, Modals, Live Leaderboard
│   └── styles/
│       └── main.css            # Hệ thống phong cách Neo-Arcade Craftsmanship
├── plan_ne_bug_chay_deadline.md# Bản kế hoạch chi tiết MVP 3 tuần
└── README.md                   # Tài liệu kiến trúc và hướng dẫn vận hành booth
```

---

## 6. Hướng Dẫn Cài Đặt & Chạy Dự Án

### Chế độ Full-stack Server (Khuyến nghị cho Booth triển lãm)
```bash
# 1. Cài đặt các gói phụ thuộc
npm install

# 2. Khởi động Express Server (bao gồm cả Leaderboard API và Game)
npm start
# Game chạy tại: http://localhost:3001
# API Leaderboard: http://localhost:3001/api/leaderboard
```

### Chế độ Development (Vite HMR)
```bash
# Khởi động Vite dev server với Hot Module Replacement
npm run dev
# Mở trình duyệt tại: http://localhost:5173
```

### Đóng gói Production
```bash
npm run build
# Bản build tối ưu hóa sẽ được tạo tại thư mục dist/
```

---

## 7. Đơn Vị Phát Triển

- **Tổ chức:** [CLB Lập Trình FU-DEVER — FPT University Da Nang](https://www.fudever.com/)
- **Lead Developer & Architect:** RaH11 (`hungnguyen.190206@gmail.com`)
- **Repository:** [https://github.com/fudever-club/bug-dash](https://github.com/fudever-club/bug-dash)
