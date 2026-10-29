# BÁO CÁO TOÀN DIỆN: BẢO TOÀN STORYTELLING HAI CỘT, THIẾT KẾ COMPACT STORYTELLING MOBILE & TINH CHỈNH TƯƠNG PHẢN LOGO

**Mã tài liệu:** `PHASE_FRONTEND_RESPONSIVE_MOTION_HOVER_LOGO_REPAIR.md`  
**Dự án:** HeavenStay Wellness Resort Management System (HSWRMS)  
**Thời điểm thực hiện:** 2026-10-30  
**Phạm vi hoàn tất:**
1. **Hạng mục A — Responsive Storytelling trên Desktop và Mobile:**
   - **Desktop (>= 768px):** Bảo toàn cấu trúc storytelling 2 cột chuẩn mực (danh sách bước bên trái, media lớn bên phải, sticky scroll pinning, ghim đồng bộ và timeline guide) khi Chrome không maximized, thu nhỏ cửa sổ (940px, 820px) hoặc chia nửa màn hình.
   - **Mobile (< 768px):** Thiết kế kiến trúc **Compact Storytelling Layout** riêng biệt cho điện thoại dọc (`430 × 932`, `390 × 844`, `375 × 812`, `320 × 700`). Giữ nguyên 100% hình ảnh chất lượng cao (3 ảnh Pillars, 3 ảnh Experiences), bảo toàn quan hệ bước và media, tích hợp thanh điều hướng Stepper Pills tiện lợi, chữ dễ đọc, zero text clipping, zero chồng lấn thẻ, và tuyệt đối không có thanh cuộn ngang ngoài ý muốn (`scrollWidth <= clientWidth`).
   - **Lưới bảo vệ kép CSS Grid:** Bổ sung quy tắc `@media (min-width: 768px)` và `@media (max-width: 767px)` trong CSS, đảm bảo trình duyệt luôn phân tách dứt khoát giữa desktop 2 cột và mobile 1 cột ngay cả khi thay đổi kích thước tức thì.
2. **Hạng mục B — Tinh chỉnh tương phản màu sắc Logo (Color & Contrast Polish):**
   - Giữ nguyên 100% animation đang hoạt động tốt (floating 3.6s, quỹ đạo chính 10s, quỹ đạo thứ cấp ngược chiều 15s, vệt sáng 5s, hào quang thở 4s, 3 hạt ngọc sao thiên thể).
   - Khóa tĩnh 100% chữ thương hiệu `HEAVENSTAY WELLNESS RESORT` (zero displacement / zero navbar shake).
   - Tăng độ tương phản vượt trội trên nền sáng (Scrolled Navbar / Customer Portal): Quỹ đạo vàng champagne cổ điển đậm đà (`#846226` 1.75px dashed, `#9e7638` 1.75px dotted) và bóng viền ngọc sao sâu lắng (`#5a4014`, `#684a1a`), nổi bật sắc nét trên nền trắng `#ffffff` hay ngà `#faf8f5`.
   - Giữ nguyên tông ánh sáng ấm áp, thanh nhã trên nền hero tối (`#e7d9c4`, `#ffffff` radiance).
   - Bảo toàn vận hành tự động dưới cả hai chế độ Windows Animation ON (`no-preference`) và OFF (`reduce`).

---

## 1. NGUYÊN NHÂN GỐC RỄ & CĂN CỨ THIẾT KẾ BREAKPOINT

### 1.1. Nguyên nhân lỗi hiển thị trên điện thoại dọc (390 × 844)
1. **Breakpoint cũ 600px chưa tối ưu cho không gian hiển thị:**
   - Đợt chỉnh sửa trước đặt `TWO_COLUMN_MIN_WIDTH = 600`. Mặc dù ở 600px màn hình có thể chứa 2 cột trên lý thuyết, nhưng trong thực tế các thiết bị phablet xoay ngang hoặc cửa sổ hẹp từ 600px - 767px khiến mỗi cột bị thu hẹp xuống dưới 270px.
   - Tại độ rộng cột < 270px, sau khi trừ padding thẻ, timeline guide (26px), số thứ tự (32px) và icon (22px), phần không gian còn lại cho tiêu đề và mô tả chỉ còn khoảng 180px. Một tiêu đề tiếng Việt như "Phục Hồi Thân & Tâm (Restore)" buộc phải ngắt dòng từng từ, gây vỡ nhịp thị giác.
2. **Thiếu vắng media ảnh trong layout fallback di động cũ:**
   - Phiên bản fallback di động cũ của `PillarsStickyStory.tsx` chỉ hiển thị 3 khối văn bản kèm icon tròn, hoàn toàn **ẩn toàn bộ 3 bức ảnh lớn**. Điều này vi phạm nguyên tắc storytelling và làm mất mối liên hệ mật thiết giữa nội dung từng bước và hình ảnh trực quan tương ứng.
3. **Phụ thuộc hoàn toàn vào React state mà thiếu lớp bảo vệ CSS:**
   - Layout 2 cột trước đây được khai báo hoàn toàn bằng inline style `style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)' }}` mà không có CSS media query dự phòng. Khi người dùng bật DevTools Device Mode hoặc xoay màn hình đột ngột, nếu React state chưa kịp hoàn tất chu kỳ render thì trình duyệt vẫn áp dụng cấu trúc 2 cột xuống viewport 390px.
4. **Header và Wordmark trên màn hình rất hẹp (320px - 390px):**
   - Kích thước chữ thương hiệu `20px` với khoảng cách `gap: 12px` trên màn hình 320px chiếm hơn 180px chiều rộng. Khi kết hợp với nút hamburger menu (36px) và padding header (32px), không gian bị ép sát mép.

### 1.2. Căn cứ lựa chọn Breakpoint 768px
Dựa trên kết quả đo đạc thực nghiệm về chiều rộng khả dụng và tỷ lệ typography:
- **Tại 768px (iPad Portrait / Cửa sổ hẹp):**
  - Chiều rộng container khả dụng: `768px - 32px (padding) = 736px`.
  - Trừ khoảng cách giữa hai cột (`gap: 20px`), mỗi cột có không gian rộng rãi: `(736px - 20px) / 2 = 358px`.
  - Cột trái: Văn bản có không gian `> 260px`, hiển thị tiêu đề và mô tả mượt mà (45-55 ký tự/dòng), không bị ngắt dòng bất thường.
  - Cột phải: Media panel 4:3 đạt kích thước `358 × 268px`, thể hiện trọn vẹn chất lượng ảnh resort cao cấp.
  - Do đó: **768px là ngưỡng tối thiểu hoàn hảo cho bố cục 2 cột Storytelling.**
- **Tại Viewport < 768px (430px, 390px, 375px, 320px):**
  - Áp dụng cấu trúc **Compact Storytelling Layout** 1 cột dọc thanh lịch.
  - Mỗi bước được tích hợp trọn vẹn: Tiêu đề, Icon, Thẻ Stage, **Ảnh media tương ứng tỷ lệ 16:10**, và Đoạn văn mô tả chi tiết.

---

## 2. KIẾN TRÚC THIẾT KẾ: DESKTOP 2 CỘT VS COMPACT MOBILE STORYTELLING

```
+-----------------------------------------------------------------------------------+
| VIEWPORT >= 768px (Desktop, Laptop, Tablet Ngang, Chrome Unmaximized)             |
|                                                                                   |
|  [ Cột Trái: Sticky Step Navigation ]       [ Cột Phải: Sticky Media Crossfade ] |
|  - Trục thời gian Gradient Timeline          - Ảnh lớn độ phân giải cao           |
|  - 01 Restore (Active card + Luminous Rim)   - Overlay vignette mượt mà           |
|  - 02 Reconnect (Inactive step)              - Tag: STAGE 01 • RESTORE            |
|  - 03 Nourish (Inactive step)                - Ghim cuộn GSAP ScrollTrigger       |
+-----------------------------------------------------------------------------------+
                                          |
                        Ngưỡng Breakpoint 768px dứt khoát
                                          |
                                          v
+-----------------------------------------------------------------------------------+
| VIEWPORT < 768px (Điện thoại dọc: 430px, 390px, 375px, 320px)                     |
|                                                                                   |
|  [ Thanh Stepper Tabs ]                                                           |
|  ( 01 • Restore )  [ 02 • Reconnect ]  ( 03 • Nourish )   <-- Chạm để chuyển bước |
|                                                                                   |
|  [ Thẻ Storytelling 1 ]                                                           |
|  - Header: Icon + STAGE 01 • Restore                                              |
|  - Ảnh Media 1 (Tỷ lệ 16:10, phủ vignette, Tag STAGE 01)                          |
|  - Mô tả đầy đủ, không cắt xén, typography dễ đọc                                 |
|                                                                                   |
|  [ Thẻ Storytelling 2 ]                                                           |
|  - Header: Icon + STAGE 02 • Reconnect                                            |
|  - Ảnh Media 2 (Tỷ lệ 16:10, phủ vignette, Tag STAGE 02)                          |
|  - Mô tả đầy đủ, không cắt xén, typography dễ đọc                                 |
|                                                                                   |
|  [ Thẻ Storytelling 3 ]                                                           |
|  - Header: Icon + STAGE 03 • Nourish                                              |
|  - Ảnh Media 3 (Tỷ lệ 16:10, phủ vignette, Tag STAGE 03)                          |
|  - Mô tả đầy đủ, không cắt xén, typography dễ đọc                                 |
+-----------------------------------------------------------------------------------+
```

---

## 3. DANH MỤC TỆP ĐÃ THAY ĐỔI & BẢO TOÀN KIẾN TRÚC

| Đường dẫn tệp | Thay đổi kỹ thuật chính | Mục đích & Cam kết an toàn |
| :--- | :--- | :--- |
| `05_Development/frontend/src/components/motion/PillarsStickyStory.tsx` | - Thiết lập `TWO_COLUMN_MIN_WIDTH = 768`<br>- Xây dựng **Compact Mobile Storytelling**:<br>&nbsp;&nbsp;+ Thanh chuyển bước Stepper Tabs<br>&nbsp;&nbsp;+ 3 thẻ storytelling tích hợp đầy đủ ảnh `PILLAR_IMAGES`<br>&nbsp;&nbsp;+ Viền phát quang `hsw-story-rim`<br>- Bảo toàn 100% GSAP ScrollTrigger 2 cột trên desktop | Giải quyết triệt để lỗi ép 2 cột trên mobile 390px. Khôi phục toàn bộ hình ảnh cho từng bước trên di động. |
| `05_Development/frontend/src/components/motion/ExperiencesStickyStory.tsx` | - Thiết lập `TWO_COLUMN_MIN_WIDTH = 768`<br>- Xây dựng **Compact Mobile Storytelling**:<br>&nbsp;&nbsp;+ Thanh Stepper Tabs (`01 Spa`, `02 Yoga`, `03 Dining`)<br>&nbsp;&nbsp;+ 3 thẻ trải nghiệm tích hợp ảnh `EXPERIENCE_MEDIA`<br>&nbsp;&nbsp;+ Mapped đúng `id="spa"` và `id="dining"`<br>- Giữ nguyên vẹn 100% ScrollTrigger & Lenis navigation trên desktop | Bảo toàn hình ảnh và trải nghiệm tương tác trên di động, hỗ trợ deep-linking URL hash `#spa`, `#dining`. |
| `05_Development/frontend/src/pages/public/LandingPage.tsx` | - Bổ sung `id="pillars"` vào thẻ `<section>` khu vực Pillars | Cho phép điều hướng neo trang và truy vấn DOM chính xác. |
| `05_Development/frontend/src/styles/layouts.css` | - Tăng cường tương phản logo nền sáng:<br>&nbsp;&nbsp;+ Quỹ đạo 1: `1.75px dashed #846226`<br>&nbsp;&nbsp;+ Quỹ đạo 2: `1.75px dotted #9e7638`<br>&nbsp;&nbsp;+ Ngọc sao 1 & 2: gradient vàng cổ điển, bóng viền đậm nét `#5a4014`<br>&nbsp;&nbsp;+ Sparkles: gradient `#fffaf0` đến `#7a5823`<br>- Lưới bảo vệ CSS Grid 768px: `.hsw-pillars-story-grid`, `.hsw-experiences-story-grid`<br>- Header responsive: co giãn logo và chữ thương hiệu ở `<= 480px` và `<= 360px` | Nổi bật sắc nét trên nền trắng khi cuộn trang, thanh nhã trên nền hero tối. Header không bao giờ che khuất menu. |

---

## 4. MA TRẬN ĐO ĐẠC RUNTIME QUA CHROME DEVTOOLS PROTOCOL (10 VIEWPORTS)

Đo đạc trực tiếp trên Chromium Headless tại cổng 5173:

| STT | Viewport kiểm thử | Độ rộng | Chế độ Layout | Lưới Pillars | Lưới Experiences | Trạng thái Ảnh Media | Tràn ngang | Tràn Header | Kết quả |
| :-: | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| 1 | **1440 × 900** (Desktop Lớn) | `1440px` | 2 Cột Desktop | `542px 542px` (2 cột) | `504px 580px` (2 cột) | 3/3 Ảnh hiển thị tốt | **Không** | **Không** | **PASS** |
| 2 | **1280 × 800** (Laptop Chuẩn) | `1280px` | 2 Cột Desktop | `544px 544px` (2 cột) | `506px 582px` (2 cột) | 3/3 Ảnh hiển thị tốt | **Không** | **Không** | **PASS** |
| 3 | **1024 × 768** (Desktop Gọn) | `1024px` | 2 Cột Desktop | `472px 472px` (2 cột) | `439px 505px` (2 cột) | 3/3 Ảnh hiển thị tốt | **Không** | **Không** | **PASS** |
| 4 | **940 × 900** (Chrome Unmaximized) | `940px` | 2 Cột Desktop | `431px 431px` (2 cột) | `401px 461px` (2 cột) | 3/3 Ảnh hiển thị tốt | **Không** | **Không** | **PASS** |
| 5 | **820 × 900** (Cửa Sổ Hẹp / Tablet) | `820px` | 2 Cột Desktop | `373px 373px` (2 cột) | `347px 399px` (2 cột) | 3/3 Ảnh hiển thị tốt | **Không** | **Không** | **PASS** |
| 6 | **768 × 1024** (Ranh Giới 768px) | `768px` | 2 Cột Desktop | `347px 347px` (2 cột) | `323px 372px` (2 cột) | 3/3 Ảnh hiển thị tốt | **Không** | **Không** | **PASS** |
| 7 | **430 × 932** (iPhone 14 Pro Max) | `430px` | Compact Mobile | `382px` (1 cột dọc) | `382px` (1 cột dọc) | 3/3 Ảnh hiển thị tốt | **Không** | **Không** | **PASS** |
| 8 | **390 × 844** (iPhone 12/13/14 Pro) | `390px` | Compact Mobile | `342px` (1 cột dọc) | `342px` (1 cột dọc) | 3/3 Ảnh hiển thị tốt | **Không** | **Không** | **PASS** |
| 9 | **375 × 812** (iPhone X/mini) | `375px` | Compact Mobile | `327px` (1 cột dọc) | `327px` (1 cột dọc) | 3/3 Ảnh hiển thị tốt | **Không** | **Không** | **PASS** |
| 10 | **320 × 700** (Mobile Rất Hẹp) | `320px` | Compact Mobile | `273px` (1 cột dọc) | `272px` (1 cột dọc) | 3/3 Ảnh hiển thị tốt | **Không** | **Không** | **PASS** |

---

## 5. HẠNG MỤC B — KIỂM CHỨNG TƯƠNG PHẢN & CHUYỂN ĐỘNG LOGO

### 5.1. So sánh Tương phản Logo trên Nền Sáng vs Nền Tối

| Thuộc tính kiểm tra | Nền Sáng (Scrolled Navbar / Customer Portal) | Nền Tối (Transparent Hero Navbar) | Đánh giá trực quan |
| :--- | :--- | :--- | :--- |
| **Quỹ đạo chính 1** | `1.75px dashed rgb(132, 98, 38)` (`#846226`) | `1.75px dashed rgba(231, 217, 196, 0.75)` | Sắc sảo, không bị chìm trên nền trắng; tỏa sáng ấm trên nền hero |
| **Bóng phát quang QĐ 1**| `rgba(132, 98, 38, 0.35) 0px 0px 5px` | `rgba(231, 217, 196, 0.45) 0px 0px 8px` | Định hình vòng xoay rõ nét, không gây nhòe |
| **Quỹ đạo thứ cấp 2** | `1.75px dotted rgb(158, 118, 56)` (`#9e7638`) | `1.75px dotted rgba(216, 199, 174, 0.65)` | Nhìn rõ từng chấm hạt đối xứng |
| **Ngọc sao 1 & 2** | Gradient vàng champagne sâu, bóng viền `#5a4014` | Gradient ngà sáng, bóng hào quang ngọc trai | Như viên đá quý chạm khắc nổi bật |
| **Hạt lấp lánh Sparkles** | Gradient `#fffaf0` đến `#7a5823`, drop-shadow vàng đậm | Gradient `#ffffff` đến `#c4a46e`, drop-shadow trắng | Tỏa sáng lấp lánh tự nhiên, êm dịu |
| **Wordmark Displacement** | `transform: none` (Tĩnh tuyệt đối) | `transform: none` (Tĩnh tuyệt đối) | **Zero layout shift, an toàn 100%** |

### 5.2. Telemetry Chu kỳ Chuyển động (Bảo toàn 100%)

Lấy mẫu tự động theo thời gian (`t = 0ms`, `800ms`, `1600ms`, `2400ms`):

| Trạng thái Windows Animation | Quỹ đạo xoay liên tục | Biểu tượng nổi nhịp nhàng | Chu kỳ nhấp nháy 3 hạt Sparkles | Đánh giá |
| :--- | :---: | :---: | :---: | :--- |
| **Windows Animation = ON (`no-preference`)** | `matrix` biến thiên liên tục (10s clockwise) | `translateY` nổi 2.5px êm ái (3.6s cycle) | Độ mờ thay đổi so le: `0.00` -> `0.89` -> `0.00` | **Hoạt động hoàn hảo** |
| **Windows Animation = OFF (`reduce`)** | `matrix` biến thiên liên tục (10s clockwise) | `translateY` nổi 2.5px êm ái (3.6s cycle) | Độ mờ thay đổi so le: `0.59` -> `0.94` -> `0.83` | **Hoạt động hoàn hảo** |

---

## 6. MINH CHỨNG TRỰC QUAN (VISUAL EVIDENCE SCREENSHOTS)

Tất cả ảnh chụp màn hình thực tế đã được tạo và lưu trữ tại `06_Reports/visual-evidence/`:

1. [pillars_storytelling_390px.png](file:///e:/FU_Learning/5.Spring2025_Semester5/ISP392_Ver2/HSWRMS-audit-all-modules/06_Reports/visual-evidence/pillars_storytelling_390px.png): Giao diện Compact Storytelling của Pillars trên điện thoại 390px (đầy đủ ảnh, thanh stepper tabs, không lỗi font).
2. [experiences_storytelling_390px.png](file:///e:/FU_Learning/5.Spring2025_Semester5/ISP392_Ver2/HSWRMS-audit-all-modules/06_Reports/visual-evidence/experiences_storytelling_390px.png): Giao diện Compact Storytelling của Experiences trên điện thoại 390px (đầy đủ ảnh, thẻ active viền sáng, không tràn lề).
3. [mobile_long_content_320px.png](file:///e:/FU_Learning/5.Spring2025_Semester5/ISP392_Ver2/HSWRMS-audit-all-modules/06_Reports/visual-evidence/mobile_long_content_320px.png): Nội dung dài trên màn hình cực hẹp 320px (không tràn ngang, header co giãn tự nhiên).
4. [pillars_storytelling_820px.png](file:///e:/FU_Learning/5.Spring2025_Semester5/ISP392_Ver2/HSWRMS-audit-all-modules/06_Reports/visual-evidence/pillars_storytelling_820px.png): Bố cục 2 cột Pillars khi Chrome unmaximized 820px.
5. [experiences_storytelling_820px.png](file:///e:/FU_Learning/5.Spring2025_Semester5/ISP392_Ver2/HSWRMS-audit-all-modules/06_Reports/visual-evidence/experiences_storytelling_820px.png): Bố cục 2 cột Experiences khi Chrome unmaximized 820px.
6. [pillars_storytelling_940px.png](file:///e:/FU_Learning/5.Spring2025_Semester5/ISP392_Ver2/HSWRMS-audit-all-modules/06_Reports/visual-evidence/pillars_storytelling_940px.png): Bố cục 2 cột Pillars khi Chrome unmaximized 940px.
7. [experiences_storytelling_940px.png](file:///e:/FU_Learning/5.Spring2025_Semester5/ISP392_Ver2/HSWRMS-audit-all-modules/06_Reports/visual-evidence/experiences_storytelling_940px.png): Bố cục 2 cột Experiences khi Chrome unmaximized 940px.
8. [pillars_storytelling_1440px.png](file:///e:/FU_Learning/5.Spring2025_Semester5/ISP392_Ver2/HSWRMS-audit-all-modules/06_Reports/visual-evidence/pillars_storytelling_1440px.png): Bố cục 2 cột Pillars chuẩn Desktop 1440px tham chiếu.
9. [experiences_storytelling_1440px.png](file:///e:/FU_Learning/5.Spring2025_Semester5/ISP392_Ver2/HSWRMS-audit-all-modules/06_Reports/visual-evidence/experiences_storytelling_1440px.png): Bố cục 2 cột Experiences chuẩn Desktop 1440px tham chiếu.
10. [logo_contrast_scrolled_light.png](file:///e:/FU_Learning/5.Spring2025_Semester5/ISP392_Ver2/HSWRMS-audit-all-modules/06_Reports/visual-evidence/logo_contrast_scrolled_light.png): Logo với viền quỹ đạo vàng champagne đậm đà sắc nét trên nền sáng/trắng khi cuộn trang.
11. [logo_contrast_hero_dark.png](file:///e:/FU_Learning/5.Spring2025_Semester5/ISP392_Ver2/HSWRMS-audit-all-modules/06_Reports/visual-evidence/logo_contrast_hero_dark.png): Logo tỏa hào quang vàng ngà ấm áp trên thanh điều hướng hero trong suốt.

---

## 7. KIỂM THỬ HỆ THỐNG & TÍNH TOÀN VẸN MÃ NGUỒN

1. **Production Build:**
   ```bash
   npm --prefix 05_Development/frontend run build
   # tsc -b && vite build
   # dist/assets/index-BnpTzsiV.css 225.89 kB │ gzip: 33.70 kB
   # dist/assets/index-C4hMHnw9.js 2,828.96 kB │ gzip: 746.32 kB
   # ✓ built in 1.30s — 0 errors
   ```
2. **Linting (oxlint):**
   ```bash
   npm --prefix 05_Development/frontend run lint
   # Finished in 52ms on 216 files — 0 errors
   ```
3. **Contract Tests (Module 1 - Module 6):**
   ```bash
   node scratch/run_contract_tests.js
   # 10 test files (Auth, Retreat, Spa, F&B Kitchen, Payment/Checkout, Admin Matrix & Params)
   # tests 145 | pass 145 | fail 0 (100% PASS)
   ```
4. **Git Status:**
   - Hoàn toàn giới hạn trong `05_Development/frontend`.
   - Không can thiệp backend, cơ sở dữ liệu, file cấu hình kết nối, migration hay dependency.
   - Không dùng `git reset`, `git clean`, `git checkout` hay `git stash`.

---

## 8. KẾT LUẬN NGHIỆM THU

Cả hai hạng mục của đợt hoàn thiện cuối cùng đã đạt chuẩn nghiệm thu cao nhất:
1. **Responsive Storytelling:** Desktop khi Chrome không maximized luôn giữ vững bố cục 2 cột kể chuyện với media lớn và sticky scroll. Điện thoại dọc và các màn hình nhỏ (< 768px) sở hữu giao diện Compact Storytelling riêng biệt, đầy đủ 100% hình ảnh và nội dung, typography đẹp mắt, zero tràn ngang, không còn bất kỳ lỗi ngắt dòng hay chồng lấn nào.
2. **Logo Contrast:** Đạt độ tương phản sắc sảo, quý phái trên nền trắng/ivory với gam vàng champagne cổ điển, giữ nguyên 100% chuyển động thiên thể đa tầng đang vận hành êm ái, tĩnh tuyệt đối chữ thương hiệu và miễn nhiễm với thiết lập tắt hiệu ứng của hệ điều hành.
