# PLAN TRIỂN KHAI GAME “NÉ BUG / CHẠY DEADLINE”

> **Phiên bản:** 0.1 — kế hoạch MVP/demo cho CLB  
> **Mục tiêu:** Tạo một web game ngắn 60 giây, điều khiển bằng chuyển động ngang của đầu qua webcam; có thể demo trên laptop tại booth, dễ mở rộng về sau.  
> **Phạm vi quan trọng:** Chỉ sử dụng **face detection** để phát hiện khuôn mặt và một thuật toán tracking nhẹ để khóa một người chơi. Không cần nhận diện danh tính, Face Mesh, Pose Estimation hay tự huấn luyện mô hình ở phiên bản đầu.

---

## 1. Tổng quan ý tưởng

### 1.1. Tên và concept

**Né Bug / Chạy Deadline** — game né chướng ngại vật mang chủ đề đời sống sinh viên và lập trình. Người chơi đứng trước webcam, dịch chuyển đầu sang trái/phải để điều khiển nhân vật đổi giữa ba làn. Trong 60 giây, người chơi né bug, deadline, điểm F và cà phê đổ; đồng thời nhặt các vật phẩm thưởng để đạt điểm cao nhất.

### 1.2. Trải nghiệm mong muốn

- Người chơi không cần chạm chuột hoặc bàn phím trong chế độ bình thường.
- Người đứng xem có thể hiểu cách chơi trong vài giây.
- Mỗi lượt chỉ kéo dài **60 giây**, đủ nhanh để người tiếp theo chơi.
- Hình ảnh vui, phản hồi rõ ràng khi đổi làn, va chạm hoặc nhặt thưởng.
- Thể hiện được phần công nghệ qua camera preview/debug overlay tùy chọn, nhưng giao diện chơi chính vẫn gọn và dễ nhìn.

### 1.3. Nền tảng triển khai

**Ưu tiên số 1: web app chạy trên laptop.** Đây là cách nhanh nhất để phát triển, thử nghiệm và demo tại booth.

- **Bản MVP:** Chrome/Edge trên laptop, webcam tích hợp hoặc webcam USB.
- **Có thể mở rộng:** trình duyệt điện thoại nếu layout và camera được kiểm thử phù hợp.
- **TikTok Effect:** là nhánh triển khai riêng, không nằm trong điều kiện nghiệm thu MVP. Không giả định rằng một web app thông thường có thể được nhúng trực tiếp thành TikTok Effect.

---

## 2. Phạm vi và các quyết định thiết kế

### 2.1. Trong phạm vi MVP

1. Phát hiện nhiều khuôn mặt trong khung hình.
2. Chọn và khóa một người chơi dựa trên vị trí, kích thước khuôn mặt và độ ổn định theo thời gian.
3. Theo dõi khuôn mặt đã khóa qua các frame liên tiếp.
4. Ánh xạ vị trí ngang của đầu thành ba làn: trái, giữa, phải.
5. Game 2D ba làn, lượt chơi 60 giây, có chướng ngại vật, vật phẩm thưởng và bốn mốc độ khó.
6. Màn hình chờ, màn hình kết quả, bảng điểm lưu trên cùng trình duyệt và chế độ chơi bằng bàn phím dự phòng.
7. Debug overlay để kiểm tra bounding box, trạng thái tracking, làn, FPS và thời gian inference.

### 2.2. Không thuộc phạm vi MVP

- Nhận diện danh tính hoặc xác thực ai là ai.
- Ước lượng biểu cảm, hướng nhìn, góc quay đầu chính xác, hoặc theo dõi toàn bộ cơ thể.
- Tự huấn luyện mô hình nhận diện khuôn mặt.
- Leaderboard đồng bộ giữa nhiều thiết bị/server.
- Tích hợp TikTok Effect hoàn chỉnh.
- Lưu video hoặc hình ảnh webcam liên tục.

### 2.3. Quyết định điều khiển

Phiên bản đầu dùng **dịch chuyển tâm khuôn mặt theo trục ngang** để đổi làn. Người chơi nghiêng hoặc xoay đầu tại chỗ nhưng không làm tâm bounding box dịch chuyển đủ rõ có thể không tạo được lệnh ổn định; do đó không quảng bá đây là điều khiển bằng góc nghiêng đầu.

Nếu sau này muốn điều khiển bằng góc quay/nghiêng đầu mà vẫn chỉ dùng detector nhẹ, cần thử nghiệm riêng với các facial keypoints mà detector hỗ trợ, hoặc đánh giá một kỹ thuật bổ sung. Không đưa phần đó vào MVP hiện tại.

---

## 3. Kiến trúc hệ thống

```text
Webcam
  │
  ▼
Video Input (getUserMedia)
  │
  ▼
Face Detector (MediaPipe Face Detector / BlazeFace)
  │   danh sách bounding box của các mặt
  ▼
Target Selector + Single-target Tracker
  │   trạng thái: waiting / candidate / locked / lost / paused
  ▼
Lane Controller
  │   lane = 0 | 1 | 2, confidence/state, timestamp
  ▼
Game Adapter
  │
  ▼
Phaser 2D Game (mục tiêu 60 FPS)
  │
  ├── Score / Timer / Difficulty
  ├── Obstacles / Rewards / Collision
  ├── UI / Sound / Effects
  └── Result / Local Leaderboard
```

### 3.1. Nguyên tắc tách phần

- **Face detection:** chạy theo nhịp riêng, mục tiêu khoảng 20–30 lần/giây tùy hiệu năng máy.
- **Game rendering:** mục tiêu 60 FPS; mỗi frame đọc giá trị lane mới nhất đã được cập nhật.
- **Không cần chạy detector 60 FPS** chỉ để game render ở 60 FPS.
- Nếu inference đồng bộ làm nghẽn luồng giao diện, ưu tiên đưa inference sang luồng nền nếu implementation/thư viện hỗ trợ; nếu chưa, giảm tần suất detect và đo độ trễ trước khi tăng độ phức tạp.
- Game không tự gọi detector. Game chỉ nhận dữ liệu qua một giao diện controller thống nhất, ví dụ `gameInput.lane`, `gameInput.status`, `gameInput.updatedAt`.

### 3.2. Công nghệ đề xuất

| Thành phần | Lựa chọn MVP | Ghi chú |
|---|---|---|
| Ngôn ngữ | JavaScript hoặc TypeScript | Có thể bắt đầu bằng JavaScript để dựng demo nhanh. |
| Dev server/build | Vite | Chạy local, dễ đóng gói và debug. |
| Face detection | MediaPipe Tasks Vision – Face Detector, model BlazeFace | Dùng model có sẵn, không train lại. |
| Tracking | JavaScript thuần | IoU + khoảng cách tâm + điều kiện ổn định khi lock. |
| Game 2D | Phaser | Hợp với game ba làn, sprite, va chạm, âm thanh và hiệu ứng. |
| Lưu điểm | `localStorage` | Chỉ là bảng điểm trên thiết bị/trình duyệt hiện tại. |
| Kiểm thử | Chrome/Edge DevTools | Đo FPS, thời gian inference, lỗi camera và trạng thái tracking. |

> Với prototype tuần 1, có thể giữ một file HTML đơn giản. Khi ghép game, nên tách code thành các module để dễ sửa và kiểm thử.

---

## 4. Face detection và tracking một người chơi

### 4.1. Đầu vào và tiền xử lý

- Khởi tạo camera bằng `getUserMedia`, ưu tiên độ phân giải 640×480 cho MVP.
- Hiển thị camera ở chế độ mirror để giống soi gương.
- Chuẩn hóa bounding box về tọa độ 0–1.
- Đảm bảo phép lật gương chỉ được áp dụng nhất quán một lần trong pipeline tọa độ. Phần hiển thị bbox, ROI và mapping làn phải cùng hệ tọa độ.
- Bỏ qua detection có bounding box quá nhỏ hoặc không hợp lệ để hạn chế chọn người ở xa.

### 4.2. Trạng thái tracking

| Trạng thái | Ý nghĩa | Hành vi UI/game |
|---|---|---|
| `waiting` | Chưa có ứng viên phù hợp | Hiện “Đứng vào khung để chơi”. |
| `candidate` | Đang kiểm tra người có thể trở thành người chơi | Hiện “Giữ vị trí một chút…” và vẽ bbox ứng viên. |
| `locked` | Đã khóa người chơi | Cho phép cập nhật lane và bắt đầu countdown khi game sẵn sàng. |
| `lost` | Tạm thời không tìm thấy mặt đã khóa | Giữ lane trong một khoảng ngắn; hiển thị thông báo mất tracking. |
| `paused` | Mất tracking quá thời gian cho phép | Tạm dừng game; yêu cầu người chơi trở lại khung hoặc xác nhận khóa lại. |

Trạng thái nên được quản lý rõ ràng bằng state machine, tránh việc UI, tracker và game tự thay đổi trạng thái riêng lẻ.

### 4.3. Chọn người chơi (lock-on)

**Mục tiêu:** chọn người chủ động đứng vào vùng xuất phát, không tự động đổi mục tiêu chỉ vì một khuôn mặt khác lớn hơn trong khung hình.

1. Vẽ một vùng ROI “vạch xuất phát” ở giữa video.
2. Chỉ xét các khuôn mặt có tâm bbox nằm trong ROI và kích thước vượt ngưỡng tối thiểu.
3. Tính điểm ứng viên theo kích thước và độ gần tâm ROI, ví dụ:

   `score = w_area * normalized_area + w_center * center_score`

   Trong đó các thành phần đã được chuẩn hóa về phạm vi tương đương; `w_area` và `w_center` là trọng số cấu hình được. Không dùng diện tích pixel thô nếu chưa chuẩn hóa vì giá trị có thể lấn át thành phần điểm còn lại.

4. Theo dõi ứng viên liên tục khoảng **1 giây**. Trong giai đoạn đó, kiểm tra tâm mặt không dịch chuyển quá ngưỡng cho phép và ứng viên vẫn ở trong ROI.
5. Chỉ khóa nếu ứng viên còn được phát hiện trong phần lớn thời gian xác nhận và vị trí tương đối ổn định.
6. Sau khi khóa, ưu tiên duy trì mục tiêu hiện tại; không chọn người mới chỉ vì họ gần camera hơn hoặc có bbox lớn hơn.

**Lưu ý:** điều kiện “đứng yên” ở đây được suy ra từ độ ổn định bounding box, không phải xác minh danh tính. Khi nhiều người đứng sát nhau, thuật toán vẫn có thể nhầm và cần kiểm thử thực tế.

### 4.4. Theo dõi mục tiêu đã khóa

Với mỗi frame có danh sách các khuôn mặt, chọn detection phù hợp nhất với bbox mục tiêu từ frame trước.

Các tín hiệu matching:

- **IoU:** mức độ chồng lấp giữa bbox hiện tại và bbox mục tiêu trước đó.
- **Khoảng cách tâm:** ưu tiên bbox có tâm gần vị trí dự đoán.
- **Kích thước bbox:** hạn chế nhảy sang mặt rất khác kích thước khi có nhiều người.
- **Tính liên tục:** hạn chế chuyển mục tiêu khi điểm matching giữa các ứng viên gần nhau.

Logic đề xuất:

1. Loại detection không hợp lệ/quá nhỏ.
2. Tính IoU và khoảng cách tâm cho các detection còn lại.
3. Chọn ứng viên có điểm matching tốt nhất nếu vượt ngưỡng.
4. Nếu IoU thấp nhưng khoảng cách tâm vẫn hợp lý, có thể dùng fallback theo khoảng cách tâm trong giới hạn cho phép.
5. Nếu không có ứng viên phù hợp, tăng thời gian mất mục tiêu; không lập tức khóa người khác.
6. Có thể bổ sung Kalman filter để dự đoán tâm bbox trong thời gian mất ngắn, nhưng đây là **tùy chọn**, không bắt buộc cho MVP.

> IoU + khoảng cách tâm giúp duy trì tracking nhẹ, nhưng không đảm bảo chính xác khi hai người giao nhau hoặc che khuất mạnh. Không nên mô tả đây là nhận diện danh tính hoặc tracking không thể nhầm.

### 4.5. Xử lý mất mặt và khóa lại

- Mất mặt trong khoảng ngắn, mục tiêu ban đầu khoảng **0,5 giây**: giữ lane hiện tại, có thể giữ vị trí dự đoán; không phát sinh lệnh đổi làn từ dữ liệu thiếu.
- Mất quá thời gian trên: chuyển game sang `paused`, dừng sinh chướng ngại vật/tính thời gian hoặc xác định rõ quy tắc pause ngay từ đầu.
- Khi mặt xuất hiện lại, thử matching với bbox mục tiêu cũ trong một khoảng thời gian hợp lý.
- Nếu không khôi phục được, quay lại quy trình khóa người chơi có chủ đích. Không tự chọn bất kỳ khuôn mặt nào đang xuất hiện.
- Trong game đang chạy, khuyến nghị **pause và yêu cầu tái khóa/xác nhận** thay vì âm thầm chuyển sang người đứng xem.

### 4.6. Tham số khởi đầu để cấu hình

Các giá trị dưới đây là điểm bắt đầu để thử nghiệm, không phải thông số tối ưu đã được benchmark.

| Tham số | Giá trị khởi đầu | Mục đích |
|---|---:|---|
| Độ phân giải camera | 640×480 | Cân bằng chất lượng và tốc độ. |
| Tần suất detection | 20–30 FPS mục tiêu | Không cần detect theo từng frame game. |
| Thời gian xác nhận lock | 1.0 giây | Giảm khả năng người đi ngang bị khóa nhầm. |
| Thời gian giữ mục tiêu tạm thời | 0.5 giây | Bỏ qua dropout ngắn. |
| Diện tích bbox tối thiểu | Khởi đầu khoảng 2% diện tích frame | Giảm ảnh hưởng mặt ở xa; cần hiệu chỉnh tại booth. |
| EMA alpha | Khởi đầu khoảng 0.3–0.4 | Làm mượt tâm X; alpha lớn phản ứng nhanh hơn nhưng rung hơn. |
| IoU tối thiểu | Khởi đầu khoảng 0.15 | Tín hiệu matching ban đầu; cần phối hợp với khoảng cách tâm. |

---

## 5. Mapping vị trí đầu sang ba làn

### 5.1. Calibrate

1. Khi lock thành công, bắt đầu countdown 3–2–1.
2. Lấy tâm X của khuôn mặt đã làm mượt làm vị trí chuẩn `centerX`.
3. Gán trạng thái ban đầu làn giữa.
4. Không tự recalibrate liên tục trong lúc chơi vì như vậy vị trí chuẩn có thể chạy theo người chơi và khiến điều khiển mất tác dụng.
5. Cho phép người chơi recalibrate bằng nút UI hoặc phím tắt trước khi bắt đầu lượt mới.

### 5.2. Chuẩn hóa và phân làn

- Tâm X được chuyển sang hệ tọa độ nhất quán có xét mirror.
- Tính độ lệch: `deltaX = smoothedX - centerX`.
- Dùng hai ngưỡng để quyết định trái/giữa/phải.
- Thêm hysteresis: ngưỡng để rời làn và ngưỡng quay lại làn giữa khác nhau một chút.
- Chỉ phát lệnh đổi làn khi trạng thái mới đã ổn định trong số frame/thời gian tối thiểu; tránh rung qua lại ở ranh giới.
- Khi mất tracking, không tiếp tục cập nhật lane từ bbox cũ hoặc từ mặt khác.

### 5.3. Trải nghiệm điều khiển

- **Làn trái:** đầu dịch sang trái so với vị trí chuẩn.
- **Làn giữa:** đầu gần vị trí chuẩn.
- **Làn phải:** đầu dịch sang phải so với vị trí chuẩn.
- Nhân vật trong game trượt nhanh sang lane mới; animation chỉ dùng để phản hồi trực quan, không được làm lệnh điều khiển trễ đáng kể.
- Có thể hiển thị chỉ báo nhỏ “TRÁI / GIỮA / PHẢI” ở giai đoạn đầu để người chơi hiểu cách điều khiển; tắt trong chế độ trình diễn nếu gây rối mắt.

---

## 6. Game design

### 6.1. Layout

- Khung game 2D nằm ngang, tối ưu màn hình laptop tại booth.
- Ba làn dọc; vật thể di chuyển từ phía trên xuống.
- Nhân vật ở vùng phía dưới, có animation chuyển làn rõ ràng.
- HUD luôn hiển thị điểm, thời gian còn lại, mạng/lượt va chạm và hiệu ứng tăng điểm đang hoạt động.
- UI cần dễ đọc từ khoảng cách vài mét, không dùng quá nhiều chữ nhỏ.

### 6.2. Vật cản và vật phẩm

| Loại | Tên/ví dụ | Tác động đề xuất |
|---|---|---|
| Vật cản | Bug | Trừ 1 mạng hoặc trừ điểm. |
| Vật cản | Deadline | Va chạm gây mất mạng; hiệu ứng cảnh báo rõ. |
| Vật cản | Điểm F | Trừ điểm hoặc mất combo. |
| Vật cản | Ly cà phê đổ | Trừ điểm hoặc làm chậm ngắn; chọn một cơ chế nhất quán. |
| Vật thưởng | Code sạch | +10 điểm. |
| Vật thưởng | Cà phê tăng lực | Nhân đôi điểm trong 5 giây. |
| Vật thưởng | A+ | +30 điểm. |

Không nên cho mọi vật cản cùng lúc trừ cả mạng lẫn điểm ở bản đầu; nên thống nhất luật để người chơi hiểu ngay sau lần va chạm đầu tiên.

### 6.3. Thời lượng và độ khó

Một lượt chơi kéo dài **đúng 60 giây** trong điều kiện game đang chạy; khi game bị pause vì mất tracking, cần chốt rõ timer dừng hay tiếp tục. Khuyến nghị dừng timer khi pause để công bằng.

| Thời gian | Mục tiêu độ khó | Gợi ý triển khai |
|---|---|---|
| 0–15 giây | Làm quen | Vật rơi chậm, chủ yếu một làn có vật thể. |
| 15–30 giây | Tăng nhịp | Tốc độ tăng, có thể xuất hiện vật ở hai làn nhưng vẫn có thời gian phản ứng. |
| 30–45 giây | Thử phản xạ | Thêm pattern phức tạp hoặc vật thể di chuyển chéo có báo hiệu. |
| 45–60 giây | Cao trào | Tốc độ cao, pattern dày hơn nhưng vẫn có đường né hợp lý. |

### 6.4. Spawn pattern và công bằng

- Không dùng random thuần cho mọi lần spawn.
- Dùng một tập pattern được thiết kế trước; có thể dùng seed để tái tạo một lượt chơi khi debug.
- Mỗi cụm chướng ngại vật phải đảm bảo tồn tại ít nhất một làn thoát có thể tới được trong thời gian phản ứng thực tế.
- Không chỉ chừa một làn trống trên lý thuyết: phải xét xem nhân vật có thể chuyển sang làn đó kịp trước khi va chạm hay không.
- Duy trì khoảng cách thời gian tối thiểu giữa các vật cản liên tiếp; chỉ tăng tốc/độ dày khi đã kiểm thử.
- Khi bật power-up x2 điểm, hiển thị bộ đếm thời gian còn lại.

### 6.5. Điểm số và điều kiện kết thúc

- Điểm cộng khi nhặt vật phẩm.
- Va chạm áp dụng quy tắc đã thống nhất: trừ mạng, trừ điểm hoặc mất combo.
- Có thể dùng 3 mạng cho luật đơn giản, nhưng cần chốt theo thời lượng gameplay thực tế.
- Game kết thúc khi hết 60 giây hoặc hết mạng nếu chọn cơ chế mạng.
- Màn hình kết quả gồm tổng điểm, vật phẩm đã nhặt, số lần va chạm và nút “Chơi lại”.

---

## 7. UI/UX và phần polish

### 7.1. Attract mode — màn hình chờ

- Hiện tên game và lời mời: **“Đứng vào khung để chơi”**.
- Có animation/demo loop để người đi ngang dễ hiểu cách chơi.
- Hiển thị hướng dẫn ngắn: “Dịch đầu trái/phải để đổi làn”.
- Khi camera chưa được cấp quyền, giải thích cách bật camera và cung cấp chế độ bàn phím.
- Chỉ bắt đầu countdown khi đã khóa được người chơi và người chơi sẵn sàng.

### 7.2. Debug overlay

Bật/tắt bằng phím tắt, ví dụ `D`, gồm:

- Bounding box của mọi khuôn mặt và bbox của mục tiêu đã khóa.
- ROI khóa người chơi.
- Trạng thái tracking và thời gian kể từ lần phát hiện thành công gần nhất.
- Tâm X đã làm mượt, `centerX`, lane hiện tại.
- FPS game, FPS detection và thời gian inference gần nhất/trung bình.
- Bật debug không được làm thay đổi logic gameplay.

### 7.3. Hiệu ứng

- Âm thanh ngắn khi đổi làn, nhặt thưởng hoặc va chạm.
- Screen shake chỉ dùng nhẹ khi va chạm; cần có thể tắt âm thanh/giảm hiệu ứng.
- Particle khi nhặt vật phẩm.
- Hiệu ứng nhân vật khi đổi lane.
- Màu sắc/phân biệt hình dạng rõ giữa vật cản và vật thưởng, không phụ thuộc hoàn toàn vào màu sắc.

### 7.4. Leaderboard và ảnh kết quả

- Lưu Top 10 trên `localStorage` ở cùng trình duyệt/thiết bị.
- Tên người chơi tối đa 3–12 ký tự, có kiểm tra input; hoặc gợi ý tên ngẫu nhiên vui như “Bug Slayer”.
- Không lưu ảnh hoặc dữ liệu camera tự động.
- Nếu có tính năng chụp ảnh kết quả, chỉ thực hiện khi người chơi bấm nút rõ ràng và thông báo nếu ảnh lấy từ webcam.
- Bảng điểm local sẽ không tự đồng bộ giữa nhiều laptop; nếu cần leaderboard chung thì cần server/backend ở giai đoạn sau.

### 7.5. Fallback khi camera lỗi

- Nếu webcam không khả dụng, người dùng từ chối quyền camera, model tải lỗi hoặc browser không hỗ trợ, hiển thị thông báo dễ hiểu.
- Có thể chọn “Chơi bằng bàn phím” để trải nghiệm game không bị gián đoạn.
- Khi chuyển sang bàn phím, controller phải báo trạng thái `keyboard` và game phải đọc đầu vào chung qua một adapter, thay vì sửa lane theo cách riêng chỉ phục vụ debug.

---

## 8. Hiệu năng, quyền riêng tư và điều kiện chạy

### 8.1. Mục tiêu hiệu năng sơ bộ

Các con số dưới đây là **mục tiêu để kiểm thử**, không phải kết quả đã được xác nhận trên mọi laptop.

- Game rendering: mục tiêu 60 FPS; chấp nhận khoảng 55 FPS trở lên trong phần lớn thời gian trên laptop thử nghiệm.
- Face detection: mục tiêu 20–30 FPS.
- Độ trễ từ khi đầu dịch chuyển tới khi lane đổi: đặt mục tiêu ban đầu dưới khoảng 120 ms ở điều kiện bình thường; đo thực tế trước khi cam kết.
- Không để inference làm giao diện đứng lâu hoặc gây giật game rõ rệt.
- Theo dõi thời gian inference trung bình và P95, FPS game, FPS detection, RAM và số lần tracking bị mất.

### 8.2. Tối ưu khi chậm

Theo thứ tự tăng dần độ phức tạp:

1. Giảm độ phân giải input nếu camera/model đang chạy quá chậm.
2. Giới hạn detector ở 20–30 FPS; không detect lại cùng một frame video.
3. Dùng model nhẹ đã có sẵn và tránh xử lý ảnh không cần thiết.
4. Tắt debug overlay/hiệu ứng nặng khi trình diễn.
5. Nếu inference đồng bộ gây nghẽn, đánh giá việc chuyển detector sang worker/luồng nền khi thư viện và môi trường hỗ trợ.
6. Thử GPU delegate nếu tương thích; nếu khởi tạo GPU thất bại, fallback CPU. Không giả định GPU luôn nhanh hơn trên mọi thiết bị.

### 8.3. Quyền riêng tư và an toàn dữ liệu

- Xử lý video trực tiếp trên thiết bị trong MVP.
- Không tải video lên server, không lưu khuôn mặt và không nhận diện danh tính.
- Có chỉ báo camera đang bật và nút tắt camera rõ ràng.
- Chỉ chụp ảnh kết quả khi người chơi chủ động yêu cầu.
- Thông báo cho người chơi rằng camera được dùng để điều khiển game trước khi họ bắt đầu.

### 8.4. Điều kiện chạy

- Dùng trình duyệt hiện đại, khuyến nghị Chrome/Edge.
- Truy cập camera qua `localhost` hoặc HTTPS và cấp quyền camera.
- Prototype dùng thư viện/model từ CDN cần kết nối Internet. Nếu booth có mạng không ổn định, chuẩn bị phương án cache/host dependency và model local trước ngày demo.
- Kiểm tra trước với webcam thật, không chỉ dùng video giả lập.

---

## 9. Kiểm thử và tiêu chí nghiệm thu

### 9.1. Test case tracking

| Mã | Tình huống | Kết quả mong đợi |
|---|---|---|
| T1 | Một người đứng trong ROI khoảng 1 giây | Khóa đúng người và vào trạng thái `locked`. |
| T2 | Người khác đi ngang qua ROI | Không cướp lock ngay lập tức. |
| T3 | Nhiều người đứng trong khung hình | Chọn ứng viên ổn định theo quy tắc đã định; debug overlay chỉ rõ ai đang bị khóa. |
| T4 | Người chơi dịch đầu trái/phải | Lane đổi đúng hướng, không nhấp nháy liên tục. |
| T5 | Người chơi đứng sát ranh giới hai lane | Hysteresis giúp giữ lane ổn định. |
| T6 | Mặt bị che/mất ngắn | Giữ lane trong thời gian grace period, không nhảy sang người khác. |
| T7 | Người chơi rời khỏi khung hình lâu hơn ngưỡng | Game pause và yêu cầu tái khóa/xác nhận theo quy tắc. |
| T8 | Ánh sáng yếu/ngược sáng | Ghi nhận tỷ lệ mất tracking; thông báo rõ nếu không thể chơi ổn định. |
| T9 | Webcam/model khởi tạo lỗi | Có thông báo và chơi được bằng bàn phím. |
| T10 | Nhấn recalibrate | Lấy lại tâm chuẩn trước khi bắt đầu lượt mới. |

### 9.2. Test case gameplay

- Một lượt chơi hoàn tất đúng 60 giây khi không pause.
- Bốn mốc độ khó được kích hoạt đúng thời điểm.
- Va chạm và nhặt vật phẩm cộng/trừ điểm chính xác.
- Pattern không tạo tình huống bắt buộc va chạm mà người chơi không thể né theo tốc độ di chuyển quy định.
- Nút chơi lại reset timer, score, mạng, vật thể, multiplier và trạng thái controller.
- Bàn phím hoạt động khi chọn chế độ fallback.
- Leaderboard giữ dữ liệu sau khi reload trang trong cùng trình duyệt.

### 9.3. Tiêu chí nghiệm thu MVP

MVP được coi là sẵn sàng demo khi:

1. Người chơi có thể bật camera, được khóa sau khi đứng ổn định trong ROI và điều khiển ba làn.
2. Trong bài test nhiều người, hệ thống không tự đổi mục tiêu ngay chỉ vì một người khác xuất hiện.
3. Khi mất mặt, hệ thống xử lý theo thời gian grace/pause, không tạo lệnh lane sai từ dữ liệu không còn hợp lệ.
4. Có thể chơi một lượt 60 giây với chướng ngại vật, vật phẩm, điểm số và màn hình kết quả.
5. Có chế độ bàn phím dự phòng.
6. Đã đo và ghi nhận FPS game, tốc độ detector, thời gian inference và số lần mất tracking trên laptop mục tiêu.
7. Có thông báo sử dụng camera và không lưu video khuôn mặt tự động.

---

## 10. Timeline triển khai 3 tuần

### Tuần 1 — Webcam, face detection, lock-on và lane controller

**Công việc**

- Khởi tạo project và môi trường chạy local.
- Bật webcam và tích hợp MediaPipe Face Detector/BlazeFace.
- Vẽ bounding box và ROI.
- Viết state machine: `waiting`, `candidate`, `locked`, `lost`, `paused`.
- Hoàn thiện lock-on theo ROI + độ ổn định + matching IoU/khoảng cách tâm.
- Hoàn thiện calibration, smoothing, hysteresis và mapping ba làn.
- Thêm debug overlay và fallback bàn phím cơ bản.
- Test với một người, nhiều người, che mặt, đi khỏi khung hình và ánh sáng khác nhau.

**Đầu ra**

- Prototype chạy trên trình duyệt.
- Hiển thị bbox/trạng thái/lane.
- Báo cáo ngắn số liệu FPS, thời gian inference và các lỗi tracking quan sát được.

### Tuần 2 — Hoàn thiện gameplay và tích hợp controller

**Công việc**

- Tạo scene Phaser và layout ba làn.
- Thêm nhân vật, chuyển làn, chướng ngại vật và vật phẩm thưởng.
- Xây dựng timer 60 giây, score, mạng/va chạm và multiplier.
- Làm bốn mốc độ khó.
- Tạo các spawn pattern đã kiểm soát, kiểm tra đường thoát.
- Nối game với controller qua adapter đầu vào chung.
- Xử lý trạng thái `paused` khi tracking mất, không để game tiếp tục nhận lệnh lane giả.

**Đầu ra**

- Chơi được một lượt hoàn chỉnh từ countdown đến màn hình kết quả.
- Có thể chơi bằng webcam và bàn phím.

### Tuần 3 — Polish, leaderboard và kiểm thử booth

**Công việc**

- Làm attract mode, tutorial ngắn và màn hình kết quả.
- Thêm âm thanh, particle, hiệu ứng va chạm/chuyển làn.
- Thêm leaderboard local Top 10.
- Tinh chỉnh tốc độ, kích thước hitbox, thời gian phản ứng và pattern spawn.
- Kiểm thử webcam, ánh sáng ngược, đông người, máy chạy CPU và điều kiện mạng.
- Tối ưu lỗi ưu tiên cao, khóa dependency/model hoặc chuẩn bị phương án khi CDN không truy cập được.
- Chốt checklist vận hành booth.

**Đầu ra**

- Bản demo có thể chạy lặp lại tại booth.
- README hướng dẫn chạy, bật camera, điều khiển và xử lý sự cố.
- Bảng kết quả kiểm thử trên laptop mục tiêu.

---

## 11. Rủi ro và phương án xử lý

| Rủi ro | Tác động | Giảm thiểu |
|---|---|---|
| Ánh sáng ngược/thiếu sáng | Detector bỏ sót mặt hoặc bbox dao động | Test tại địa điểm sớm; điều chỉnh vị trí đèn/camera; giảm yêu cầu thay vì chỉ chỉnh CSS video. Nếu tiền xử lý ảnh thì bảo đảm detector dùng ảnh đã xử lý. |
| Người đi ngang cướp lock | Điều khiển chuyển sang người xem | ROI, xác nhận ứng viên khoảng 1 giây, kiểm tra độ ổn định và không tự đổi mục tiêu khi đã lock. |
| Hai mặt che nhau/giao nhau | Tracking có thể nhảy mục tiêu | Matching nhiều tín hiệu, giữ trạng thái lost ngắn, pause và yêu cầu tái khóa khi không chắc chắn. |
| Inference chặn luồng UI | Game giật/độ trễ cao | Giới hạn tần suất detect, đo thời gian inference, giảm resolution; cân nhắc worker nếu phù hợp. |
| GPU delegate không tương thích | Không khởi tạo model | Có fallback CPU và thông báo lỗi rõ ràng. |
| Mạng booth không ổn định | CDN/model không tải được | Chuẩn bị dependency/model được host local hoặc kiểm tra mạng trước giờ demo. |
| Điều khiển rung ở biên làn | Game khó chơi | EMA, hysteresis, thời gian ổn định tối thiểu và điều chỉnh ngưỡng tại booth. |
| Spawn không công bằng | Người chơi buộc phải va chạm | Pattern có kiểm soát, kiểm thử reachability và giới hạn độ dày vật thể. |
| Camera bị từ chối/quyền truy cập lỗi | Không chơi được bằng đầu | Màn hình hướng dẫn và fallback bàn phím. |
| Hình ảnh bị lưu ngoài ý muốn | Rủi ro quyền riêng tư | Không lưu/stream camera mặc định; chỉ chụp ảnh khi người chơi chủ động bấm. |

---

## 12. Gợi ý cấu trúc thư mục khi chuyển sang project thực

```text
ne-bug-game/
├── public/
│   ├── models/                 # Model nếu đóng gói local
│   ├── assets/
│   │   ├── sprites/
│   │   ├── audio/
│   │   └── demo-loop/
├── src/
│   ├── vision/
│   │   ├── camera.js           # Khởi tạo/tắt webcam
│   │   ├── detector.js         # MediaPipe Face Detector
│   │   ├── tracker.js          # Lock-on và single-target tracking
│   │   └── lane-controller.js  # Calibration, EMA, hysteresis, mapping lane
│   ├── game/
│   │   ├── scenes/
│   │   ├── entities/
│   │   ├── spawner.js
│   │   ├── scoring.js
│   │   └── difficulty.js
│   ├── ui/
│   │   ├── attract-screen.js
│   │   ├── result-screen.js
│   │   └── debug-overlay.js
│   ├── input/
│   │   └── input-adapter.js    # Chọn webcam controller hoặc keyboard
│   ├── storage/
│   │   └── leaderboard.js
│   ├── config.js
│   └── main.js
├── index.html
├── package.json
└── README.md
```

Prototype một file HTML vẫn dùng được để xác nhận thuật toán. Cấu trúc thư mục trên nên áp dụng khi bắt đầu ghép Phaser để phần CV, game, UI và lưu điểm không phụ thuộc chặt vào nhau.

---

## 13. Checklist vận hành booth

### Trước sự kiện

- [ ] Kiểm tra camera được cấp quyền và không bị ứng dụng khác chiếm.
- [ ] Kiểm tra ánh sáng và vị trí người chơi đứng.
- [ ] Chạy thử với nhiều người trong khung hình.
- [ ] Kiểm tra FPS game, FPS detector và độ trễ điều khiển.
- [ ] Xác nhận game pause đúng khi mất tracking.
- [ ] Kiểm tra chế độ bàn phím và nút chơi lại.
- [ ] Kiểm tra model/thư viện tải được; chuẩn bị phương án khi mất mạng.
- [ ] Đặt hướng dẫn dễ thấy và thông báo webcam dùng để điều khiển game.

### Khi demo

- [ ] Để màn hình ở attract mode giữa các lượt.
- [ ] Chỉ bắt đầu khi đã khóa đúng người chơi.
- [ ] Nếu tracker nhầm hoặc mất người chơi, pause và khóa lại; không tiếp tục một lượt sai.
- [ ] Có người hỗ trợ nếu webcam/ánh sáng phát sinh sự cố.

---

## 14. Quyết định cần chốt trước khi code tuần 2

1. **Luật va chạm:** mỗi lần va chạm trừ điểm, mất mạng hay kết hợp? Khuyến nghị bắt đầu với 3 mạng và hiệu ứng rõ ràng.
2. **Pause khi mất tracking:** khuyến nghị dừng timer và spawn khi mất mặt quá khoảng 0,5 giây.
3. **Leaderboard:** bản đầu lưu local trên một máy; chỉ làm backend nếu cần bảng điểm chung giữa nhiều thiết bị.
4. **Phong cách hình ảnh:** pixel-art, cartoon vui hoặc phong cách campus/terminal; chọn một phong cách để tránh tốn thời gian làm asset.
5. **TikTok Effect:** chỉ xem xét sau khi web MVP chạy ổn và nếu CLB vẫn cần một bản native Effect riêng.

---

## 15. Tóm tắt quyết định triển khai

- Làm **web game trước**, ưu tiên laptop/booth.
- Dùng **MediaPipe Face Detector + BlazeFace**, không train model mới.
- Tracking một người bằng **ROI + xác nhận ổn định + IoU/khoảng cách tâm + state machine**.
- Điều khiển bằng **dịch chuyển ngang của tâm mặt**, qua smoothing và hysteresis.
- Game dùng **Phaser**, rendering mục tiêu 60 FPS; detector chạy khoảng 20–30 FPS và đo hiệu năng thực tế.
- Giữ lượt chơi 60 giây, bốn mốc độ khó, spawn có kiểm soát và luôn có đường né khả thi.
- Có attract mode, debug overlay, leaderboard local, màn hình kết quả và fallback bàn phím.
- Không lưu video/nhận diện danh tính mặc định.
- Ba tuần là khả thi cho một **MVP demo có giới hạn phạm vi**, với điều kiện hoàn thiện tracking tuần 1 trước khi mở rộng gameplay và polish.
