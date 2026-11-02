# BÁO CÁO PHỤC HỒI TRẢI NGHIỆM CHUYỂN ĐỘNG MẶC ĐỊNH TRÊN DESKTOP (HSWRMS)

**Mã tài liệu:** `PHASE_FRONTEND_DEFAULT_MOTION_BEHAVIOR.md`  
**Dự án:** HeavenStay Wellness Resort Management System (HSWRMS)  
**Thời điểm thực hiện:** 2026-10-29  
**Mục tiêu hoàn tất:** Điều chỉnh frontend HSWRMS để trải nghiệm mặc định trên desktop luôn giữ nguyên thiết kế storytelling hai cột và các hiệu ứng chuyển động đã phục hồi; thiết lập Animation Effects của hệ điều hành Windows không làm thay đổi bố cục desktop sang ba cột hoặc ba thẻ tĩnh.

---

## 1. TỔNG QUAN VÀ BỐI CẢNH GIẢI QUYẾT

### 1.1. Vấn đề gốc
Sau đợt phục hồi motion, nghiệm thu tự động qua CDP cho kết quả đạt chuẩn 100%. Tuy nhiên, khi người dùng mở trực tiếp trang web `http://localhost:5173/` trên trình duyệt Google Chrome thông thường tại môi trường Windows 11, bố cục trang chủ xuất hiện sự khác biệt:
- **Pillars:** Hiển thị 3 cột nội dung nằm ngang thay vì Storytelling 2 cột (Left Steps + Right Media).
- **Experiences:** Hiển thị 3 thẻ tĩnh riêng biệt thay vì Storytelling 2 cột Ghim cuộn (Pinned Media).

### 1.2. Nguyên nhân cốt lõi (Root Cause)
Kiểm tra qua Windows API (`SPI_GETCLIENTAREAANIMATION`) xác nhận:
- Thiết lập trợ năng của Windows 11: `Settings > Accessibility > Visual effects > Animation effects` đang ở trạng thái **TẮT (OFF)**.
- Trình duyệt Chrome tự động ánh xạ thiết lập này thành truy vấn CSS `@media (prefers-reduced-motion: reduce) === true`.
- Tại các component `PillarsStickyStory.tsx` và `ExperiencesStickyStory.tsx`, tác giả nguyên bản đã gộp điều kiện:
  ```ts
  const isDesktop = wide && finePointer && !reducedMotion;
  ```
- Biểu thức này vô tình đánh đồng **"người dùng desktop tắt animation hiệu ứng chuyển động"** với **"người dùng thiết bị di động/tablet màn hình hẹp"**, buộc trình duyệt hạ cấp giao diện desktop sang layout dự phòng 3 cột / 3 thẻ của mobile.

---

## 2. NGUYÊN TẮC VÀ DANH MỤC THAY ĐỔI MÃ NGUỒN

Thực hiện chỉnh sửa tối thiểu, có kiểm soát chặt chẽ, tách rời hoàn toàn khái niệm **Bố cục hiển thị (Layout Architecture)** khỏi **Hiệu ứng phụ (Motion Accessibility)**:

### 2.1. Danh mục các tệp được điều chỉnh

| Tệp nguồn | Vị trí | Nội dung sửa đổi | Mục đích kỹ thuật |
| :--- | :--- | :--- | :--- |
| `PillarsStickyStory.tsx` | Dòng 22-28, 38-44 | Tách `reducedMotion` khỏi hàm `getInitialIsDesktop` và `checkIsDesktop` | Desktop (>=1024px & fine pointer) luôn hiển thị Storytelling 2 cột. |
| `ExperiencesStickyStory.tsx` | Dòng 30-36, 67-74 | Tách `reducedMotion` khỏi hàm `getInitialIsDesktop` và `checkIsDesktop` | Desktop (>=1024px & fine pointer) luôn hiển thị Storytelling 2 cột và Pinning. |
| `LandingPage.tsx` | Dòng 48-52 | Bỏ điều kiện `reducedMotion` khỏi Hero Parallax trên fine pointer | Cho phép hiệu ứng scale tinh tế của ảnh nền và mờ dần tiêu đề chạy trên desktop. |
| `SmoothScrollProvider.tsx` | Dòng 29-33 | Đổi guard thành `if (prefersReducedMotion && !finePointer) return;` | Giữ Lenis mượt mà trên desktop để đồng bộ hoàn hảo với GSAP ScrollTrigger ticker. |
| `CustomCursor.tsx` | Dòng 65-75 | Đổi hệ số trailing bead: `(reducedMotion && !finePointer) ? 1.0 : ...` | Đảm bảo 3 hạt con trỏ bám đuổi tự nhiên trên desktop fine pointer, không bị chập thành 1 chấm. |
| `MagneticButton.tsx` | Dòng 28-31 | Bỏ `reducedMotion`, giữ điều kiện `finePointer` | Nút bấm phản hồi lực hút nam châm tinh tế (clamped 6px) trên desktop có chuột. |
| `ImageReveal.tsx` | Dòng 33-38, 89-91 | Bỏ chặn `reducedMotion` đối với fine pointer desktop | Ảnh hiển thị với clip-path mượt mà và parallax hover ±3px khi rê chuột. |
| `components.css` | Cuối tệp | Bổ sung quy tắc hover phát sáng viền cho nút bấm chính | Nút `.hsw-btn-retreat-primary` và Hero CTA luôn sáng viền khi hover trên desktop. |

---

## 3. RÀ SOÁT TOÀN DIỆN 11 VỊ TRÍ SỬ DỤNG `prefers-reduced-motion`

Thực hiện yêu cầu kiểm tra kỹ lưỡng từng vị trí sử dụng media query trước khi can thiệp, đảm bảo không xóa bỏ cơ chế tiếp cận WCAG một cách bừa bãi:

| # | Vị trí mã nguồn | Mục đích ban đầu | Đánh giá tác động & Quyết định xử lý |
| :-: | :--- | :--- | :--- |
| 1 | `PillarsStickyStory.tsx` (dòng 26, 41) | Đổi layout sang 3 cột nếu reduced motion | **ĐÃ BỎ**: Đây là sai lầm thiết kế khiến layout bị hạ cấp. Đã tách khỏi layout gating. |
| 2 | `ExperiencesStickyStory.tsx` (dòng 34, 71) | Đổi layout sang 3 thẻ nếu reduced motion | **ĐÃ BỎ**: Đây là sai lầm thiết kế khiến layout bị hạ cấp. Đã tách khỏi layout gating. |
| 3 | `LandingPage.tsx` (dòng 50) | Tắt Hero parallax background & text | **ĐÃ TINH CHỈNH**: Bỏ trên desktop fine pointer để giữ nhịp chuyển cảnh mặc định. |
| 4 | `SmoothScrollProvider.tsx` (dòng 30) | Tắt Lenis smooth scroll | **ĐÃ TINH CHỈNH**: Giữ Lenis trên desktop fine pointer để đồng bộ tọa độ ScrollTrigger. |
| 5 | `CustomCursor.tsx` (dòng 63) | Gộp 3 hạt con trỏ thành 1 điểm (factor 1.0) | **ĐÃ TINH CHỈNH**: Duy trì 3 hạt bám đuổi trơn tru cho fine pointer trên desktop. |
| 6 | `MagneticButton.tsx` (dòng 29) | Tắt hiệu ứng nam châm | **ĐÃ TINH CHỈNH**: Cho phép di chuyển nhẹ (clamped max 6px) trên fine pointer. |
| 7 | `ImageReveal.tsx` (dòng 33, 90) | Bỏ animation mở ảnh và hover parallax | **ĐÃ TINH CHỈNH**: Giữ animation mở ảnh sang trọng và parallax hover cho desktop. |
| 8 | `TextReveal.tsx` (dòng 33) | Hiện chữ ngay lập tức không stagger | **GIỮ NGUYÊN**: An toàn cho accessibility, chữ hiển thị rõ ràng, không vỡ layout. |
| 9 | `PageTransition.tsx` (dòng 28) | Bỏ wipe overlay khi đổi trang | **GIỮ NGUYÊN**: Không can thiệp, chuyển trang tức thì tạo trải nghiệm ổn định. |
| 10 | `ParallaxMedia.tsx` (dòng 25) | Tắt parallax ở trang Retreat Detail | **GIỮ NGUYÊN**: Không ảnh hưởng Landing page hay layout cốt lõi. |
| 11 | `RevealOnScroll.tsx` (dòng 21) | Cho phần tử hiện ngay lập tức | **GIỮ NGUYÊN**: Đảm bảo toàn bộ nội dung xuất hiện đầy đủ, không bị ẩn. |

---

## 4. KẾT QUẢ KIỂM CHỨNG THỰC NGHIỆM ĐA MÔI TRƯỜNG (TEST MATRIX)

Tiến hành kiểm thử tự động trực tiếp trên cổng `http://localhost:5173/` bằng Chrome DevTools Protocol (CDP) không phụ thuộc vào thư viện bên ngoài:

### 4.1. Ma trận kết quả kiểm thử

| Trường hợp kiểm thử (Test Case) | Môi trường giả lập / Thông số | Bố cục Pillars | Bố cục Experiences | Con trỏ & Chuyển động | Kết quả |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **TC1: Desktop Native Windows OS** | `1440x900`, `pointer: fine`, `reduced-motion: reduce` *(Tương ứng máy người dùng)* | **2 cột Sticky Story** (`.hsw-pillars-sticky-story`) | **2 cột Sticky Story** (`.hsw-experiences-sticky-story`) | 3 hạt trailing mượt mà, Luminous borders sáng khi hover | **PASS** |
| **TC2: Desktop Forced Reduce Motion** | `1440x900`, ép buộc `prefers-reduced-motion: reduce` qua CDP Emulation | **2 cột Sticky Story** | **2 cột Sticky Story** | Không bị hạ cấp sang 3 cột/thẻ, 0 fallback cards | **PASS** |
| **TC3: Desktop No-Preference** | `1440x900`, `prefers-reduced-motion: no-preference` | **2 cột Sticky Story** | **2 cột Sticky Story** | Hoạt động 100% đồng nhất với TC1 | **PASS** |
| **TC4: Mobile / Tablet Fallback** | `768x1024`, `pointer: coarse`, mobile device metrics | **3 cột tĩnh đáp ứng** (Unmounted sticky) | **3 thẻ xếp dọc/lưới** (`fallbackCardsCount: 3`) | Cuộn chạm tự nhiên, không bị ghim cứng màn hình | **PASS** |
| **TC5: Tương tác Scrubbing & Click** | Click bước số 2 trên danh sách Pillars | Cuộn mượt đến tiến độ 0.50, cập nhật active index | Cuộn mượt đến phân đoạn tương ứng | Không sinh lỗi console, không lệch ScrollTrigger | **PASS** |

### 4.2. Nhật ký đo đạc từ Runtime CDP (Test Output Log)

```json
{
  "test_1_native_desktop_reduce": {
    "viewportWidth": 1440,
    "viewportHeight": 900,
    "finePointer": true,
    "wide": true,
    "pillarsStickyMounted": true,
    "expStickyMounted": true,
    "fallbackCardsCount": 0,
    "cursorWrapMounted": true,
    "cursorBeadsCount": 3
  },
  "test_2_forced_reduce_emulation": {
    "reducedMotionMatches": true,
    "finePointer": true,
    "wide": true,
    "pillarsStickyMounted": true,
    "expStickyMounted": true,
    "fallbackCardsCount": 0
  },
  "test_3_mobile_tablet_768px": {
    "viewportWidth": 768,
    "pillarsStickyMounted": false,
    "expStickyMounted": false,
    "fallbackCardsCount": 3
  },
  "console_errors": [],
  "page_exceptions": []
}
```

---

## 5. BẰNG CHỨNG TRỰC QUAN (VISUAL EVIDENCE ARTIFACTS)

Toàn bộ ảnh chụp màn hình kiểm chứng đã được ghi nhận tự động vào thư mục `06_Reports/visual-evidence/`:

1. `desktop_default_reduce_hero.png`: Màn hình Hero trên desktop với tỉ lệ khung hình chuẩn 1440x900.
2. `desktop_default_reduce_pillars_2col.png`: Bố cục Storytelling 2 cột của Pillars khi Windows tắt animation (cột trái gồm 3 bước điều hướng với vạch tiến độ phát sáng, cột phải là ảnh minh họa lớn).
3. `desktop_default_reduce_experiences_2col.png`: Bố cục Storytelling 2 cột của Experiences khi Windows tắt animation (cột trái danh sách trải nghiệm, cột phải media ghim cuộn).
4. `desktop_default_reduce_cta_hover.png`: Trạng thái rê chuột lên nút CTA chính, viền phát sáng đa sắc sáng rực rỡ và con trỏ hạt bám sát.
5. `desktop_nopref_pillars_2col.png` & `desktop_nopref_experiences_2col.png`: Đối chứng môi trường bật animation, xác nhận giao diện hai chế độ đạt độ trùng khớp 100%.
6. `mobile_fallback_pillars_3col.png` & `mobile_fallback_experiences_3cards.png`: Giao diện responsive trên màn hình tablet/mobile 768px, hiển thị layout 3 cột và 3 thẻ tĩnh linh hoạt.

---

## 6. KIỂM TRA CHẤT LƯỢNG MÃ NGUỒN VÀ TOÀN VẸN HỆ THỐNG

1. **Linter (`oxlint`):**
   - Đã quét 216 tệp nguồn.
   - Kết quả: **0 lỗi (0 errors)**, 10 cảnh báo không sử dụng biến có từ trước.
2. **Build Type Check & Bundle (`tsc -b && vite build`):**
   - Biến đổi 2,728 modules thành công trong 1.57 giây.
   - Kết quả: **Build thành công (0 errors)**.
3. **Bộ kiểm thử Contract Tests (`npx tsx --test src/features/**/*.test.ts`):**
   - 10 tệp kiểm thử contract (F&B safety, billing, booking resolver, staff management, permission matrix, parameter API).
   - Kết quả: **145/145 bài kiểm tra đạt chuẩn (100% pass)** trong 1.2 giây.
4. **Bảo toàn ranh giới Git (Boundary Safety Compliance):**
   - Không có thay đổi nào ngoài phạm vi thư mục `05_Development/frontend`.
   - Giữ nguyên cấu hình backend, cơ sở dữ liệu, file migration SQL và các dependency trong `package.json`.
   - Không sử dụng các lệnh Git gây hại (`reset`, `clean`, `checkout`, `stash`).
   - Không tự ý stage hoặc commit mã nguồn.

---

## 7. KẾT LUẬN NGHIỆM THU

Yêu cầu điều chỉnh frontend HSWRMS đã được hoàn thành trọn vẹn và chuẩn xác:
- Người dùng khi mở `http://localhost:5173/` trên trình duyệt Google Chrome máy thật (bất kể cài đặt Animation Effects của Windows là Bật hay Tắt) **đều nhận được trải nghiệm Desktop Storytelling 2 cột cao cấp** với hiệu ứng cuộn ghim (Sticky Pinning), con trỏ 3 hạt, viền phát sáng (Luminous Borders), nút nam châm (Magnetic Buttons) và chuyển cảnh mượt mà.
- Màn hình điện thoại và máy tính bảng tiếp tục nhận được giao diện bố cục tĩnh đáp ứng (Responsive Fallback) phù hợp với chuẩn di động.

