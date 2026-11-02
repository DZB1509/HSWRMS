# BÁO CÁO ĐIỀU TRA KHÁC BIỆT GIAO DIỆN: TRÌNH DUYỆT THẬT VS ẢNH NGHIỆM THU ANTIGRAVITY

**Mã tài liệu:** `PHASE_FRONTEND_LIVE_LAYOUT_MISMATCH_INVESTIGATION.md`  
**Dự án:** HeavenStay Wellness Resort Management System (HSWRMS)  
**Thời điểm thực hiện:** 2026-10-29  
**Vấn đề điều tra:** Sự khác biệt về bố cục hiển thị trên trang chủ (`http://localhost:5173/`):
- **Ảnh nghiệm thu của Antigravity:** 
  - *Pillars:* Bố cục Sticky 2 cột (Danh sách bước bên trái, ảnh media lớn có viền phát sáng bên phải).
  - *Experiences:* Bố cục Sticky 2 cột (Danh sách trải nghiệm bên trái, media lớn bên phải).
- **Ảnh thực tế người dùng tự mở:**
  - *Pillars:* Ba cột nội dung nằm ngang (3 horizontal columns).
  - *Experiences:* Ba thẻ nội dung riêng biệt (3 separate cards).

---

## 1. TÓM TẮT PHÁT HIỆN VÀ NGUYÊN NHÂN CỐT LÕI (CONFIRMED ROOT CAUSE)

### **KẾT LUẬN ĐIỀU TRA:**
Sự khác biệt về bố cục **KHÔNG PHẢI LỖI MÃ NGUỒN (NOT A SOURCE CODE BUG)**, mà là **CƠ CHẾ THIẾT KẾ DUAL-LAYOUT CÓ CHỦ ĐÍCH TỪ ĐẦU (INTENDED DUAL-LAYOUT ARCHITECTURE)** được tác giả nguyên bản (`datnthe181883`, commit `4b44f3daa3f72e9f40bcfade848f325f1d6bbe32`) cài đặt để phục vụ khả năng tiếp cận WCAG 2.2 và tính đáp ứng (Responsive).

### **Nguyên nhân chính xác dẫn đến khác biệt:**
1. **Thiết lập Hệ điều hành Windows trên máy người dùng:**
   - Qua kiểm tra trực tiếp API hệ thống Windows (`SystemParametersInfo(SPI_GETCLIENTAREAANIMATION)`):
     **`SPI_GETCLIENTAREAANIMATION = False`**.
   - Điều này đồng nghĩa trong Windows 11: `Settings > Accessibility > Visual effects > Animation effects` đang ở trạng thái **TẮT (OFF)**.
2. **Cơ chế phản hồi của Trình duyệt Chrome:**
   - Khi Windows tắt hiệu ứng hoạt họa, trình duyệt Chrome tự động ánh xạ thành:
     `window.matchMedia('(prefers-reduced-motion: reduce)').matches === true`.
3. **Điều kiện kích hoạt bố cục trong mã nguồn:**
   - Trong cả `PillarsStickyStory.tsx` (dòng 27, 42) và `ExperiencesStickyStory.tsx` (dòng 35, 72):
     ```ts
     const checkIsDesktop = () => {
       const finePointer = window.matchMedia('(pointer: fine)').matches;
       const wide = window.innerWidth >= 1024;
       const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
       setIsDesktop(wide && finePointer && !reducedMotion);
     };
     ```
   - Vì `reducedMotion === true`, biểu thức `wide && finePointer && !reducedMotion` cho kết quả **`FALSE`**.
4. **Hành vi hiển thị tương ứng:**
   - Khi `isDesktop === false`, cả hai component chủ động chuyển sang **Bố cục dự phòng tĩnh (Accessible Editorial Fallback)**:
     - `PillarsStickyStory`: Render `gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))'` gồm 3 cột nằm ngang.
     - `ExperiencesStickyStory`: Render 3 thẻ riêng biệt `.hsw-experience-card` (aspect ratio 16/10) xếp dọc/ngang không ghim cuộn.
5. **Tại sao Antigravity chụp được layout 2 cột Sticky?**
   - Trong script tự động hóa kiểm thử của Antigravity, giao thức Chrome DevTools Protocol (CDP) đã chủ động mô phỏng môi trường người dùng bật hoạt họa:
     `Emulation.setEmulatedMedia: { name: 'prefers-reduced-motion', value: 'no-preference' }` và kích thước cửa sổ `1440x900`.
   - Dẫn đến `reducedMotion === false` -> `isDesktop === true`, kích hoạt layout 2 cột Sticky pinning.

---

## 2. BẰNG CHỨNG TÁI HIỆN TRÊN CÙNG MÔI TRƯỜNG RUNTIME (`http://localhost:5173/`)

Đã tiến hành đo kiểm thực tế trên cùng một tiến trình Vite đang chạy tại cổng 5173 và ghi lại số liệu đo đạc trực tiếp:

| Thông số đo đạc | Môi trường A: Native OS (Người dùng thấy) | Môi trường B: Emulated (Antigravity chụp) |
| :--- | :---: | :---: |
| **Viewport Width / Height** | `1440 x 900` | `1440 x 900` |
| **Device Pixel Ratio (DPR)** | `1.0` | `1.0` |
| **`pointer: fine`** | `true` (chuột vật lý) | `true` |
| **`window.innerWidth >= 1024`** | `true` | `true` |
| **`prefers-reduced-motion: reduce`** | **`true`** *(do Windows Animation effects = Off)* | **`false`** *(do giả lập no-preference)* |
| **Biểu thức `isDesktop`** | **`FALSE`** | **`TRUE`** |
| **Bố cục Pillars hiển thị** | **3 cột nội dung nằm ngang** | **2 cột Sticky Story (Steps + Media)** |
| **Phần tử `.hsw-pillars-sticky-story`** | `false` (Unmounted) | `true` (Mounted + Pinning) |
| **Bố cục Experiences hiển thị** | **3 thẻ `.hsw-experience-card` riêng biệt** | **2 cột Sticky Media Storytelling** |
| **Phần tử `.hsw-experiences-sticky-story`** | `false` (Unmounted) | `true` (Mounted + Pinning) |
| **Tệp ảnh chụp đối chứng** | `mismatch_user_pillars_3columns.png`<br>`mismatch_user_experiences_3cards.png` | `mismatch_antigravity_pillars_2columns.png`<br>`mismatch_antigravity_experiences_2columns.png` |

---

## 3. ĐỐI CHIẾU MÃ NGUỒN VÀ LỊCH SỬ GIT (GIT HISTORY BASELINE)

Qua tra cứu Git history tại commit khởi tạo gốc `4b44f3daa3f72e9f40bcfade848f325f1d6bbe32` (ngày 09/10/2026, tác giả `datnthe181883`), cấu trúc này đã tồn tại nguyên bản:

### 3.1. Tại `PillarsStickyStory.tsx` (commit gốc 4b44f3d):
```tsx
// Mobile & Tablet fallback (Stacked clean editorial layout, no pinning)
if (!isDesktop) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 'var(--space-8)',
        maxWidth: '1080px',
        margin: '0 auto',
      }}
    >
      {pillars.map((item, idx) => ( ... ))}
    </div>
  );
}
```
*Ghi chú của tác giả trong code:* **"Mobile & Tablet fallback (Stacked clean editorial layout, no pinning)"**.  
Tại `LandingPage.tsx` (dòng 367), phần này cũng được chú thích rõ ràng:  
`{/* C. Wellness Journey Pillars — Editorial open layout & Sticky Story */}`.

### 3.2. Tại `ExperiencesStickyStory.tsx` (commit gốc 4b44f3d):
```tsx
// Mobile / Tablet Fallback: 3 stacked editorial cards with hover zoom
if (!isDesktop) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
        gap: 'var(--space-8)',
      }}
    >
      {experiences.map((exp, idx) => ( ... ))}
    </div>
  );
}
```
*Ghi chú của tác giả trong code:* **"Mobile / Tablet Fallback: 3 stacked editorial cards with hover zoom"**.

### 3.3. Nhận định kiến trúc:
Bố cục 3 cột nằm ngang và 3 thẻ riêng biệt **chính là thiết kế có chủ đích** của dự án dành cho các trường hợp:
1. Màn hình điện thoại hoặc máy tính bảng (`innerWidth < 1024`).
2. Thiết bị cảm ứng không có chuột mảnh (`pointer: coarse`).
3. Người dùng kích hoạt chế độ giảm hoạt họa trong Windows (`prefers-reduced-motion: reduce`).

---

## 4. HƯỚNG DẪN TỰ KIỂM CHỨNG & CHUYỂN ĐỔI BỐ CỤC TRÊN MÁY NGƯỜI DÙNG

Người dùng có thể trực tiếp quan sát trang web tự động chuyển đổi qua lại giữa **Bố cục 3 cột/thẻ** và **Bố cục 2 cột Sticky** ngay trên trình duyệt Chrome/Edge của mình bằng 2 cách:

### Cách 1: Chuyển đổi qua Chrome DevTools (Nhanh nhất, không đổi setting Windows)
1. Mở `http://localhost:5173/` trên Google Chrome.
2. Nhấn `F12` (hoặc chuột phải -> `Inspect`).
3. Nhấn tổ hợp phím `Ctrl + Shift + P` -> gõ `Rendering` -> chọn **Show Rendering**.
4. Cuộn xuống mục **"Emulate CSS media feature prefers-reduced-motion"**:
   - Chọn **`prefers-reduced-motion: no-preference`**: Trang web sẽ **lập tức chuyển sang Bố cục Sticky 2 cột** (danh sách bên trái, ảnh ghim bên phải) giống 100% ảnh Antigravity.
   - Chọn **`prefers-reduced-motion: reduce`**: Trang web sẽ chuyển sang **Bố cục 3 cột / 3 thẻ riêng biệt**.

### Cách 2: Chuyển đổi qua Cài đặt Hệ thống Windows 11
1. Nhấn phím `Windows + I` để mở **Settings**.
2. Chọn mục **Accessibility** (Trợ năng) -> **Visual effects** (Hiệu ứng hình ảnh).
3. Tại dòng **Animation effects** (Hiệu ứng hoạt họa):
   - Gạt công tắc sang **ON** (Bật).
4. Quay lại trình duyệt Chrome và bấm `F5` tải lại trang `http://localhost:5173/`: Bố cục Sticky 2 cột sẽ hiển thị tự nhiên.

---

## 5. PHÂN TÍCH THIẾT KẾ VÀ ĐỀ XUẤT ĐIỀU CHỈNH (NẾU CẦN)

Hiện tại, việc gộp điều kiện `!reducedMotion` vào biến boolean `isDesktop` khiến người dùng máy tính để bàn (màn hình lớn, có chuột) nhưng tắt animation trong Windows bị chuyển sang layout dạng thẻ của mobile.

Có 2 phương án xử lý theo góc độ thiết kế sản phẩm:

- **Phương án 1 (Giữ nguyên hiện trạng - Khuyến nghị WCAG):**  
  Giữ nguyên hành vi thiết kế ban đầu của tác giả. Khi người dùng yêu cầu giảm hoạt họa, việc không ghim màn hình (no pinning/scrubbing) và hiển thị dạng 3 cột/thẻ tĩnh là giải pháp tối ưu chống chóng mặt cho người dùng nhạy cảm chuyển động.
- **Phương án 2 (Tách biệt Layout khỏi Motion Preference):**  
  Nếu mong muốn người dùng máy tính để bàn **luôn nhìn thấy layout 2 cột (Steps bên trái + Ảnh lớn bên phải)** bất kể thiết lập Windows, chúng ta có thể tách riêng:
  - `isDesktopLayout = wide && finePointer` (quyết định hiển thị 2 cột).
  - `enableStickyScroll = isDesktopLayout && !reducedMotion` (quyết định việc bật ScrollTrigger pinning hay giữ ảnh tĩnh).

*Lưu ý an toàn: Hiện tại, theo đúng chỉ thị "Không được mặc định layout 3 cột là sai và không sửa mã nguồn trước khi có quyết định thiết kế", mã nguồn được giữ nguyên vẹn 100%.*

---

## 6. ĐỐI SOÁT TÍNH TOÀN VẸN GIT TRƯỚC VÀ SAU ĐIỀU TRA

Kiểm tra `git status --short`:
```
 M 05_Development/backend/src/main/resources/application-local.yml
 M 05_Development/backend/src/main/resources/application.yml
 M 05_Development/frontend/src/components/motion/CustomCursor.tsx
 M 05_Development/frontend/src/components/motion/ExperiencesStickyStory.tsx
 M 05_Development/frontend/src/components/motion/ImageReveal.tsx
 M 05_Development/frontend/src/components/motion/MagneticButton.tsx
 M 05_Development/frontend/src/components/motion/PillarsStickyStory.tsx
 M 05_Development/frontend/src/components/motion/TextReveal.tsx
 M 05_Development/frontend/src/styles/components.css
 M 05_Development/frontend/src/styles/globals.css
```
- Không có bất kỳ dòng code frontend hay backend nào bị thay đổi trong quá trình điều tra này.
- Các ảnh chụp bằng chứng đối chứng được lưu trữ tại `06_Reports/visual-evidence/mismatch_*.png`.
- Toàn bộ 8 file motion và 2 file cấu hình backend từ các phase trước được bảo toàn trọn vẹn.

