# ⚡ BUG DASH — NÉ BUG / CHẠY DEADLINE

> **Trò chơi Web Arcade tương tác 60 giây kết hợp Computer Vision AI & Văn hóa Lập trình sinh viên.**  
> Phát triển bởi **CLB Học thuật Lập trình FU-DEVER** — Trường Đại học FPT Đà Nẵng.

---

## 🎮 1. Giới thiệu tổng quan

**Bug Dash (Né Bug / Chạy Deadline)** là một tựa game tương tác tốc độ cao, người chơi sử dụng **chuyển động dịch chuyển đầu ngang qua Webcam** để điều khiển nhân vật né tránh các hiểm họa quen thuộc của giới developer và sinh viên CNTT:
- 👾 **Bug** & 🚨 **Deadline dí**: Gây mất mạng / trừ điểm.
- 📉 **Điểm F** & ☕ **Cà phê đổ**: Gây tụt combo, mất điểm.
- ✨ **Code sạch** & ⚡ **Cà phê tăng lực**: Nhân đôi điểm số, nạp shield bảo vệ.

Mỗi lượt chơi kéo dài đúng **60 giây**, mang lại trải nghiệm dồn dập, hào hứng, cực kỳ phù hợp để trình diễn tại các gian hàng công nghệ (**Club Day, Tech Expo, Hackathon Booth**).

---

## 🧠 2. Kiến trúc Công nghệ & AI Vision

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
1. **Khóa mục tiêu thông minh (Anti-Crowd Stealing):** Người chơi đứng vào vùng ROI vàng giữa màn hình khoảng 1 giây để khóa mục tiêu (`locked`). Thuật toán ngăn chặn việc người đi ngang qua cướp quyền điều khiển.
2. **Làm mượt EMA & Hysteresis:** Chống rung giật ở ranh giới giữa 2 làn, phản hồi mượt mà trong vòng <120ms.
3. **Chế độ Bàn phím Dự phòng (Keyboard Fallback):** Khi không có webcam hoặc ánh sáng yếu, người chơi có thể chuyển sang điều khiển bằng phím `←` / `→` mà không làm gián đoạn luồng game.
4. **Bảo vệ quyền riêng tư 100%:** Xử lý AI on-device trực tiếp trên trình duyệt bằng WebAssembly & GPU delegate, không lưu trữ hay gửi video/hình ảnh khuôn mặt lên máy chủ.

---

## 🎨 3. Phong cách Giao diện & Thẩm mỹ (Taste & Impeccable DNA)

Giao diện được chế tác theo bộ quy chuẩn thẩm mỹ **`taste-skill` v2** và **`impeccable` frontend craftsmanship**:
- **Anti-Slop AI Design:** Không sử dụng các dải màu gradient tím sáo rỗng, không căn giữa máy móc, không rải emoji bừa bãi vào nút bấm.
- **Bảng màu nhận diện FU-DEVER:**
  - Nền Obsidian đa tầng (`#070a13`, `#0d1424`).
  - Điểm nhấn DEVER Electric Amber (`#f59e0b`) & FPT Orange (`#ff7700`).
  - Trạng thái thành công Neon Emerald (`#10b981`), Cyber Cyan (`#06b6d4`), Danger Crimson (`#ef4444`).
- **Typography:** `Be Vietnam Pro` (tiếng Việt chuẩn nét) kết hợp `JetBrains Mono` / `Space Grotesk` hiển thị số liệu terminal.
- **Sound Engine Xúc giác (Web Audio API):** Tự động phát âm thanh procedural synth khi khóa mục tiêu, đổi làn và tương tác nút mà không cần nạp file audio ngoài.

---

## ⌨️ 4. Phím Tắt Điều Khiển

| Phím | Chức năng |
|---|---|
| `C` | **Calibrate lại:** Đặt vị trí đầu hiện tại làm tâm chuẩn (Làn giữa) |
| `D` | **Bật/Tắt Debug Overlay:** Hiện khung bbox, ROI, ngưỡng chuyển làn |
| `M` | **Bật/Tắt Âm thanh:** Mute / Unmute procedural synth SFX |
| `←` / `→` | **Giả lập chuyển làn:** Debug hoặc chơi bằng bàn phím |
| `K` | **Chuyển chế độ:** Webcam AI ↔ Keyboard Mode |

---

## 📁 5. Cấu trúc Thư mục

```text
bug-dash/
├── index.html                  # Giao diện chính Arcade Cockpit & Controller
├── plan_ne_bug_chay_deadline.md# Bản kế hoạch chi tiết MVP 3 tuần
└── README.md                   # Tài liệu hướng dẫn và kiến trúc tổng quan
```

---

## 🚀 6. Hướng Dẫn Chạy Cục Bộ

1. Mở thư mục bằng Live Server hoặc bất kỳ local HTTP server nào (do yêu cầu quyền truy cập `getUserMedia`):
   ```bash
   # Cách 1: Dùng Python
   python3 -m http.server 8080

   # Cách 2: Dùng Node http-server / npx serve
   npx serve .
   ```
2. Truy cập `http://localhost:8080` trên Google Chrome hoặc Microsoft Edge.
3. Bấm **"BẬT WEBCAM AI"** và cấp quyền camera khi trình duyệt hỏi.
4. Đứng thẳng trước camera, căn chỉnh mặt vào khung vạch xuất phát màu vàng trong 1 giây để khóa mục tiêu và bắt đầu trải nghiệm!

---

## 👥 7. Đơn Vị Phát Triển

- **Tổ chức:** [CLB Lập Trình FU-DEVER — FPT University Da Nang](https://www.fudever.com/)
- **Lead Developer & Architect:** RaH11 (`hungnguyen.190206@gmail.com`)
- **Repository:** [https://github.com/fudever-club/bug-dash](https://github.com/fudever-club/bug-dash)
