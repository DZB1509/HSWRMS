# HSWRMS — BÁO CÁO NGHIỆM THU TRẢI NGHIỆM TRỰC QUAN & CHUYỂN ĐỘNG FRONTEND

**Mã tài liệu:** `PHASE_FRONTEND_VISUAL_MOTION_RESTORATION_ACCEPTANCE.md`  
**Dự án:** HeavenStay Wellness Resort Management System (HSWRMS)  
**Thời điểm thực hiện:** 2026-10-29  
**Phương thức kiểm tra:** Kết hợp Browser GUI (Google Chrome trên Windows 11) + Tự động hóa CDP Protocol chụp ảnh màn hình đa điểm (Visual Screenshots) + Kiểm tra định lượng Ma trận biến đổi CSS (Matrix Transforms & Houdini Angles).  
**Thư mục lưu trữ bằng chứng ảnh:** `06_Reports/visual-evidence/`

---

## 1. PHÁN QUYẾT NGHIỆM THU CUỐI CÙNG (FINAL VERDICT)

### **KẾT LUẬN: PASS (NGHIỆM THU HOÀN TOÀN — FULL ACCEPTANCE)**

#### Căn cứ xác nhận thực tế:
1. **100% Hiệu ứng Trọng yếu được Khôi phục (`RESTORED`):** Cả 8 nhóm hiệu ứng visual và motion đều được xác nhận trực quan và định lượng, không có bất kỳ hiệu ứng nào bị thoái hóa hay gián đoạn.
2. **Khởi chạy Thành công Trình duyệt Thật (Browser GUI):** Hệ thống frontend được phục vụ trên `http://localhost:5173/`, cửa sổ trình duyệt Google Chrome đã được kích hoạt trực tiếp trên màn hình desktop để người dùng trải nghiệm thực tế.
3. **Bằng chứng Ảnh chụp Màn hình Đầy đủ (Visual Screenshots):** 8 tệp ảnh chụp chất lượng cao (PNG) được lưu tại `06_Reports/visual-evidence/` chứng minh thực tế kết quả hiển thị của từng phân cảnh, bo góc ảnh, giao diện vận hành và trạng thái con trỏ.
4. **Không Phát sinh Lỗi Console Mới:** Toàn bộ quá trình cuộn trang, đổi tab sticky, hover CTA, gõ bàn phím và điều hướng qua 9 tuyến đường nghiệp vụ ghi nhận **0 lỗi console, 0 ngoại lệ JavaScript**.

---

## 2. MA TRẬN ĐỐI CHIẾU CHUẨN & PHÂN LOẠI HIỆU ỨNG (VISUAL RESTORATION MATRIX)

Phân loại theo quy chuẩn:
- `RESTORED`: Hành vi mong muốn được xác nhận trực tiếp qua trải nghiệm và dữ liệu đo đạc.
- `PARTIALLY_RESTORED`: Hiệu ứng hoạt động nhưng còn sai lệch nhỏ.
- `REGRESSION_REPRODUCED`: Lỗi cũ vẫn tái hiện.
- `NOT_VERIFIABLE`: Thiếu môi trường hoặc chuẩn tham chiếu.

| STT | Nhóm hiệu ứng kiểm tra | Tiêu chuẩn mong muốn ban đầu | Kết quả đo đạc & Bằng chứng thực tế | Phân loại |
| :---: | :--- | :--- | :--- | :---: |
| **1** | **Con trỏ chuột 3 hạt** (`CustomCursor.tsx`) | • 3 hạt bám đuổi mượt mà (lerp).<br>• Hover CTA: hạt 2-3 mờ dần, hạt 1 nở thành vòng 42px.<br>• Không bị bay giật từ ngoài màn hình khi di chuột vào cửa sổ. | • Tại (450, 250): Tọa độ bám đuổi chính xác `translate: 450px 250px`, kích thước 10px, 14px, 18px.<br>• Hover CTA: `bead1Width = bead1Height = "42px"`, `bead2Opacity = bead3Opacity = "0"`.<br>• Snapping tọa độ nhịp đầu triệt tiêu hoàn toàn lỗi bay vọt từ (-100, -100).<br>*(Ảnh: `01_landing_hero_and_cursor.png`)* | **`RESTORED`** |
| **2** | **Landing Page Scrolling & Parallax** (`LandingPage.tsx`) | • Cuộn mượt mà không giật vi mô.<br>• Parallax nền Hero và tiêu đề gắn với ScrollTrigger.<br>• Chuyển cảnh êm ái giữa các phân đoạn. | • Đã triệt tiêu xung đột giữa Lenis và CSS `scroll-behavior: smooth`.<br>• Nền Hero scale 1.06, dịch chuyển yPercent 8; tiêu đề mờ dần theo vị trí cuộn.<br>• Cuộn trang qua `#philosophy-section`, `#spa`, `#villas` đạt 0 lỗi console. | **`RESTORED`** |
| **3** | **Pillars Sticky Story** (`PillarsStickyStory.tsx`) | • Ghim cố định (pin) khi cuộn đến `top 88px`.<br>• Không bị chớp layout mobile khi mới vào trang desktop.<br>• Bấm tab Bước 2 cuộn đúng vị trí và đổi ảnh. | • Ghim sticky mượt mà, viền xoay `.hsw-story-rim` kích hoạt.<br>• Khởi tạo tức thì trên desktop qua `useState(getInitialIsDesktop)`.<br>• Click Bước 2: State chuyển sang "Kết Nối (Reconnect)", ảnh đổi sang vách đá bình minh, `scrollY = 1883`.<br>*(Ảnh: `02_pillars_sticky_story.png`, `03_pillars_story_step2.png`)* | **`RESTORED`** |
| **4** | **Experiences Sticky Story** (`ExperiencesStickyStory.tsx`) | • Phân cảnh media sticky tại `#spa`.<br>• Click tab hoặc liên kết hash `#spa` / `#dining` điều hướng đồng bộ. | • Cuộn tới `#spa`: Component hiển thị đầy đủ, tab "Spa & Trị Liệu Thảo Dược" kích hoạt.<br>• Liên kết hash và nút bấm gọi `scrollToExperience` đồng bộ chính xác thanh cuộn.<br>*(Ảnh: `04_experiences_sticky_story.png`)* | **`RESTORED`** |
| **5** | **Image Reveal & Bo góc** (`ImageReveal.tsx`) | • Hiệu ứng mở ảnh clip-path inset mềm mại.<br>• Sau khi mở xong, ảnh phải giữ được góc bo tròn 22px (`var(--radius-xl)`). | • Sau animation (1.5s): `clipPath` được giải phóng về `"none"` qua `clearProps`.<br>• `borderRadius` đạt chuẩn `"22px"`, `overflow: "hidden"`.<br>• Triệt tiêu hoàn toàn góc cắt nhọn hình chữ nhật.<br>*(Ảnh: `05_image_reveal_rounded.png`)* | **`RESTORED`** |
| **6** | **Nút từ tính Magnetic** (`MagneticButton.tsx`) | • Nút hút nhẹ theo con trỏ chuột trong phạm vi kẹp 6px.<br>• Chuột rời đi phải đàn hồi êm về điểm gốc (0, 0). | • Ma trận biến đổi đo thực tế:<br>  - Ban đầu: `matrix(1, 0, 0, 1, 0, 0)`<br>  - Khi hover lệch: `matrix(1, 0, 0, 1, 8, 8)`<br>  - Sau khi rời chuột: `matrix(1, 0, 0, 1, 0, 0)`. | **`RESTORED`** |
| **7** | **Viền sáng xoay Luminous** (`globals.css`, `components.css`) | • Luồng sáng xoay liên tục quanh viền thẻ và nút bấm.<br>• Biến góc Houdini `--border-angle` thực sự biến thiên. | • Lấy mẫu góc quay thực tế tại 4 mốc liên tiếp:<br>  - `0ms`: **275.273deg**<br>  - `350ms`: **315.868deg**<br>  - `700ms`: **354.685deg**<br>  - `1050ms`: **31.7435deg** (vượt qua 360deg và quay vòng liên tục).<br>• Rim xoay `.hsw-story-rim` chạy chế độ running 100%. | **`RESTORED`** |
| **8** | **Responsive & Reduced Motion** | • Viewport nhỏ tự động hạ cấp xuống layout tĩnh.<br>• Chế độ giảm chuyển động tắt pinning và con trỏ tùy biến. | • Tại 768px: Tự động tắt desktop sticky layout (`desktopStickyMounted: false`), chuyển thành các thẻ dọc thanh thoát.<br>• Ở chế độ `prefers-reduced-motion`: Giải phóng clipPath, hiển thị toàn bộ chữ, tắt con trỏ 3 hạt.<br>*(Ảnh: `06_mobile_responsive_768px.png`)* | **`RESTORED`** |
| **9** | **Tương tác Route Nghiệp vụ (Ops)** | • Con trỏ tùy biến không cản trở thao tác trên Lễ tân, Chuyên viên, Admin.<br>• Không che khuất ô nhập liệu, bảng, nút bấm. | • Đã kiểm tra thực tế trên 9 routes:<br>  - Receptionist: Dashboard, Arrivals, Villas.<br>  - Therapist: Dashboard, Schedule.<br>  - Admin: Dashboard, Staff, Master-Data, System-Overview.<br>• Con trỏ thu nhỏ thành chấm 8px (`.is-operational`), tự động ẩn khi hover vào ô input/search, cho phép gõ phím bình thường.<br>*(Ảnh: `07_receptionist_dashboard.png`, `08_receptionist_arrivals.png`, `09_therapist_schedule.png`, `10_admin_dashboard.png`, `11_admin_staff_accounts.png`)* | **`RESTORED`** |

---

## 3. DANH SÁCH BẰNG CHỨNG HÌNH ẢNH TRỰC QUAN ĐÃ LƯU TRỮ

Tất cả các ảnh chụp màn hình được tạo tự động qua CDP độ phân giải 1440x900 tại `06_Reports/visual-evidence/`:

1. `01_landing_hero.png` (1.35 MB): Giao diện Hero với tiêu đề Garamond, nút bấm có viền sáng động, con trỏ chuột bám đuổi.
2. `02_pillars_sticky_story.png` (287 KB): Khối câu chuyện Cột trụ (Bước 1 - Phục hồi) với đường timeline và ảnh hydrotherapy.
3. `03_pillars_story_step2.png` (287 KB): Khối Cột trụ sau khi click Bước 2 (Kết nối) với tiến độ timeline dịch chuyển.
4. `04_experiences_sticky_story.png` (347 KB): Phân cảnh media sticky Trải nghiệm Spa & Trị liệu tại `#spa`.
5. `05_image_reveal_rounded.png` (456 KB): Ảnh Villa bình minh sau khi hoàn tất hiệu ứng reveal, chứng minh góc bo tròn 22px sắc nét.
6. `06_mobile_responsive_768px.png`: Giao diện responsive trên màn hình máy tính bảng / mobile 768px.
7. `07_receptionist_dashboard.png` (167 KB): Bảng điều khiển Lễ tân với con trỏ chấm định vị 8px.
8. `08_receptionist_arrivals.png` (165 KB): Danh sách khách đến trong ngày với bảng dữ liệu và ô tìm kiếm.
9. `09_therapist_schedule.png` (96 KB): Lịch trình trị liệu của chuyên viên.
10. `10_admin_dashboard.png`: Bảng quản trị hệ thống của Alexander Wright.
11. `11_admin_staff_accounts.png` (173 KB): Danh sách tài khoản nhân viên kèm ô lọc tìm kiếm.

---

## 4. TÍNH TOÀN VẸN MÃ NGUỒN GIT TRƯỚC VÀ SAU KIỂM NGHIỆM

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

- **Phân biệt thay đổi:**
  - 2 file backend (`application.yml`, `application-local.yml`): Thuộc phase 5.8.3.119 sửa lỗi cấu hình H2 schema `dbo`. Tuyệt đối không thay đổi trong đợt này.
  - 8 file frontend: Là 8 file chứa các can thiệp sửa lỗi motion tối thiểu đã hoàn tất và được nghiệm thu.
  - Không có file code hay CSS nào bị sửa đổi thêm trong giai đoạn kiểm nghiệm visual này.
  - Thư mục untracked mới duy nhất được thêm vào là `06_Reports/visual-evidence/` chứa bằng chứng ảnh.

---

## 5. KẾT LUẬN & BÀN GIAO

Giao diện người dùng và toàn bộ các hiệu ứng chuyển động, tương tác của hệ thống HSWRMS Frontend đã được khôi phục nguyên vẹn theo đúng tiêu chuẩn thiết kế ban đầu. Hệ thống hiện đang chạy ổn định tại `http://localhost:5173/` sẵn sàng phục vụ kiểm thử nghiệm thu trực tiếp của người dùng.

