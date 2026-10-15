import type {
  BusinessParameter,
  FeatureFlag,
  PermissionRule,
  AdminDelegation,
  AuditEvent,
  PoliceResidenceExportSummary
} from '../types/governance';

export const INITIAL_BUSINESS_PARAMETERS: BusinessParameter[] = [
  {
    key: 'deposit_default_percentage',
    labelKey: 'governance.params.depositDefault.label',
    defaultLabel: 'Tỷ Lệ Tiền Cọc Đặt Chỗ Nghỉ Dưỡng',
    descriptionKey: 'governance.params.depositDefault.desc',
    defaultDescription: 'Tỷ lệ tiền cọc bắt buộc tính trên giá gói nghỉ dưỡng trước khi xác nhận thanh toán VNPay (mặc định 30% theo hợp đồng đặt chỗ).',
    category: 'booking',
    type: 'percentage',
    currentValue: 30,
    defaultValue: 30,
    unit: '%',
    min: 20,
    max: 100,
    lastUpdatedAt: '2026-09-24 09:00',
    lastUpdatedBy: 'Alexander Wright (Quản trị viên)'
  },
  {
    key: 'free_cancellation_window_hours',
    labelKey: 'governance.params.cancellationWindow.label',
    defaultLabel: 'Thời Hạn Hủy Phòng Miễn Phí',
    descriptionKey: 'governance.params.cancellationWindow.desc',
    defaultDescription: 'Số giờ tối thiểu trước ngày nhận phòng cho phép hủy đặt chỗ miễn phí hoặc hoàn tiền đầy đủ (UC26).',
    category: 'cancellation',
    type: 'hours',
    currentValue: 72,
    defaultValue: 72,
    unit: 'giờ',
    min: 24,
    max: 168,
    lastUpdatedAt: '2026-09-24 09:00',
    lastUpdatedBy: 'Alexander Wright (Quản trị viên)'
  },
  {
    key: 'cancellation_refund_percentage',
    labelKey: 'governance.params.cancellationRefund.label',
    defaultLabel: 'Tỷ Lệ Hoàn Tiền Tiêu Chuẩn Khi Hủy',
    descriptionKey: 'governance.params.cancellationRefund.desc',
    defaultDescription: 'Tỷ lệ tiền cọc được hoàn lại khi hủy trước thời hạn hủy phòng miễn phí (UC26).',
    category: 'cancellation',
    type: 'percentage',
    currentValue: 80,
    defaultValue: 80,
    unit: '%',
    min: 0,
    max: 100,
    lastUpdatedAt: '2026-09-24 09:00',
    lastUpdatedBy: 'Alexander Wright (Quản trị viên)'
  },
  {
    key: 'dietary_preselection_cutoff_hours',
    labelKey: 'governance.params.dietaryCutoff.label',
    defaultLabel: 'Thời Gian Báo Trước Chọn Thực Đơn',
    descriptionKey: 'governance.params.dietaryCutoff.desc',
    defaultDescription: 'Số giờ cần báo trước để Khách hàng chọn thực đơn mỗi ngày nhằm chuẩn bị bếp và kiểm tra dị ứng thực phẩm (UC16).',
    category: 'dietary',
    type: 'hours',
    currentValue: 48,
    defaultValue: 48,
    unit: 'giờ',
    min: 12,
    max: 72,
    lastUpdatedAt: '2026-09-24 09:00',
    lastUpdatedBy: 'Alexander Wright (Quản trị viên)'
  },
  {
    key: 'police_declaration_export_time',
    labelKey: 'governance.params.policeExportTime.label',
    defaultLabel: 'Giờ Kết Xuất Khai Báo Lưu Trú Công An Hàng Ngày',
    descriptionKey: 'governance.params.policeExportTime.desc',
    defaultDescription: 'Giờ địa phương cố định hàng đêm để tạo báo cáo lưu trú tạm trú theo Luật Cư trú Việt Nam 2020.',
    category: 'compliance',
    type: 'time',
    currentValue: '22:00',
    defaultValue: '22:00',
    unit: 'giờ địa phương',
    lastUpdatedAt: '2026-09-25 14:30',
    lastUpdatedBy: 'Alexander Wright (Quản trị viên)'
  }
];

export const INITIAL_FEATURE_FLAGS: FeatureFlag[] = [
  {
    key: 'enable_online_extra_spa_booking',
    nameKey: 'governance.flags.extraSpaOnline.name',
    defaultName: 'Khách Đặt Spa Bổ Sung Trực Tuyến',
    descriptionKey: 'governance.flags.extraSpaOnline.desc',
    defaultDescription: 'Cho phép khách đang lưu trú đặt thêm buổi spa trực tiếp từ cổng thông tin.',
    enabled: true,
    scope: 'customer',
    impactLevel: 'medium',
    lastChangedAt: '2026-09-26 10:15',
    lastChangedBy: 'Alexander Wright (Quản trị viên)'
  },
  {
    key: 'enable_online_extra_fnb_order',
    nameKey: 'governance.flags.extraFnbOnline.name',
    defaultName: 'Khách Đặt Món Dinh Dưỡng Tại Biệt Thự',
    descriptionKey: 'governance.flags.extraFnbOnline.desc',
    defaultDescription: 'Cho phép khách gọi thêm món ăn dưỡng sinh thanh toán vào hóa đơn biệt thự (UC19).',
    enabled: true,
    scope: 'customer',
    impactLevel: 'medium',
    lastChangedAt: '2026-09-26 10:15',
    lastChangedBy: 'Alexander Wright (Quản trị viên)'
  },
  {
    key: 'enable_vietnam_residence_auto_export',
    nameKey: 'governance.flags.residenceExport.name',
    defaultName: 'Tự Động Kết Xuất Báo Cáo Tạm Trú Ban Đêm',
    descriptionKey: 'governance.flags.residenceExport.desc',
    defaultDescription: 'Tự động tổng hợp hồ sơ check-in hàng ngày xuất báo cáo cư trú theo quy định.',
    enabled: true,
    scope: 'compliance',
    impactLevel: 'high',
    lastChangedAt: '2026-09-25 15:00',
    lastChangedBy: 'Alexander Wright (Quản trị viên)'
  },
  {
    key: 'enable_post_checkout_review_invitations',
    nameKey: 'governance.flags.reviewInvites.name',
    defaultName: 'Tự Động Mời Đánh Giá Sau Check-out',
    descriptionKey: 'governance.flags.reviewInvites.desc',
    defaultDescription: 'Gửi lời mời đánh giá trải nghiệm nghỉ dưỡng sau khi hoàn tất thanh toán và trả phòng (UC23).',
    enabled: true,
    scope: 'customer',
    impactLevel: 'low',
    lastChangedAt: '2026-09-24 09:00',
    lastChangedBy: 'Alexander Wright (Quản trị viên)'
  }
];

export const PERMISSION_RULES: PermissionRule[] = [
  // 1. Trải nghiệm khách hàng
  {
    capability: 'book_retreat_package',
    categoryKey: 'governance.permissions.categories.experience',
    defaultCategory: 'Trải Nghiệm Nghỉ Dưỡng Của Khách Hàng',
    nameKey: 'governance.permissions.bookRetreat.name',
    defaultName: 'Đặt Gói Nghỉ Dưỡng & Thanh Toán Tiền Cọc',
    descriptionKey: 'governance.permissions.bookRetreat.desc',
    defaultDescription: 'Duyệt gói, chọn ngày, cấu hình loại biệt thự và đặt cọc qua cổng VNPay.',
    grants: {
      customer: 'granted',
      receptionist: 'denied',
      therapist: 'denied',
      fb_staff: 'denied',
      manager: 'denied',
      admin: 'denied'
    },
    isImmutableBoundary: false
  },
  {
    capability: 'manage_own_health_profile',
    categoryKey: 'governance.permissions.categories.experience',
    defaultCategory: 'Trải Nghiệm Nghỉ Dưỡng Của Khách Hàng',
    nameKey: 'governance.permissions.manageHealth.name',
    defaultName: 'Tự Quản Lý Hồ Sơ Sức Khỏe & Chế Độ Ăn',
    descriptionKey: 'governance.permissions.manageHealth.desc',
    defaultDescription: 'Cung cấp đồng ý minh thị ghi nhận dị ứng, kiêng kỵ dinh dưỡng và chống chỉ định thể chất.',
    grants: {
      customer: 'granted',
      receptionist: 'denied',
      therapist: 'denied',
      fb_staff: 'denied',
      manager: 'denied',
      admin: 'denied'
    },
    isImmutableBoundary: true,
    boundaryReasonKey: 'governance.permissions.boundaries.healthConsent',
    defaultBoundaryReason: 'Ranh giới bảo mật nghiêm ngặt: Dữ liệu sức khỏe nhạy cảm yêu cầu sự đồng ý trực tiếp của khách hàng theo Nghị định 13.'
  },
  {
    capability: 'request_health_data_deletion',
    categoryKey: 'governance.permissions.categories.experience',
    defaultCategory: 'Trải Nghiệm Nghỉ Dưỡng Của Khách Hàng',
    nameKey: 'governance.permissions.deleteHealth.name',
    defaultName: 'Yêu Cầu Xóa Dữ Liệu Sức Khỏe Sau Nghỉ Dưỡng',
    descriptionKey: 'governance.permissions.deleteHealth.desc',
    defaultDescription: 'Thực thi quyền yêu cầu xóa hoặc ẩn danh dữ liệu sức khỏe sau khi hoàn tất kỳ nghỉ (BR-07).',
    grants: {
      customer: 'granted',
      receptionist: 'denied',
      therapist: 'denied',
      fb_staff: 'denied',
      manager: 'denied',
      admin: 'denied'
    },
    isImmutableBoundary: true,
    boundaryReasonKey: 'governance.permissions.boundaries.statutoryDeletion',
    defaultBoundaryReason: 'Quyền hợp pháp của Khách hàng: Nhân viên không thể thay thế yêu cầu xóa dữ liệu của chủ thể dữ liệu.'
  },
  {
    capability: 'view_own_folio',
    categoryKey: 'governance.permissions.categories.experience',
    defaultCategory: 'Trải Nghiệm Nghỉ Dưỡng Của Khách Hàng',
    nameKey: 'governance.permissions.viewOwnFolio.name',
    defaultName: 'Xem Chi Tiết Hóa Đơn Tạm Tính (Folio)',
    descriptionKey: 'governance.permissions.viewOwnFolio.desc',
    defaultDescription: 'Quyền xem chỉ đọc các khoản phí dịch vụ, cọc và chi tiết hóa đơn của biệt thự.',
    grants: {
      customer: 'granted',
      receptionist: 'denied',
      therapist: 'denied',
      fb_staff: 'denied',
      manager: 'denied',
      admin: 'denied'
    },
    isImmutableBoundary: false
  },

  // 2. Nghiệp vụ Lễ tân
  {
    capability: 'view_daily_arrivals',
    categoryKey: 'governance.permissions.categories.frontDesk',
    defaultCategory: 'Nghiệp Vụ Lễ Tân & Tiếp Đón',
    nameKey: 'governance.permissions.viewArrivals.name',
    defaultName: 'Xem Danh Sách Khách Đến Hàng Ngày',
    descriptionKey: 'governance.permissions.viewArrivals.desc',
    defaultDescription: 'Truy cập danh sách khách dự kiến đến, giờ đến và trạng thái chuẩn bị nhận phòng.',
    grants: {
      customer: 'denied',
      receptionist: 'granted',
      therapist: 'denied',
      fb_staff: 'denied',
      manager: 'granted',
      admin: 'granted'
    },
    isImmutableBoundary: false
  },
  {
    capability: 'check_in_customer_collect_residence',
    categoryKey: 'governance.permissions.categories.frontDesk',
    defaultCategory: 'Nghiệp Vụ Lễ Tân & Tiếp Đón',
    nameKey: 'governance.permissions.checkInGuest.name',
    defaultName: 'Thực Hiện Check-in & Thu Thập Thông Tin Cư Trú',
    descriptionKey: 'governance.permissions.checkInGuest.desc',
    defaultDescription: 'Xác minh danh tính khách, thu thập CCCD/Hộ chiếu theo Luật Cư trú và kích hoạt lưu trú.',
    grants: {
      customer: 'denied',
      receptionist: 'granted',
      therapist: 'denied',
      fb_staff: 'denied',
      manager: 'denied',
      admin: 'denied'
    },
    isImmutableBoundary: true,
    boundaryReasonKey: 'governance.permissions.boundaries.frontDeskOnly',
    defaultBoundaryReason: 'Toàn vẹn vận hành: Việc kiểm tra giấy tờ tùy thân và bàn giao chìa khóa thuộc thẩm quyền Lễ tân.'
  },
  {
    capability: 'assign_manage_villas',
    categoryKey: 'governance.permissions.categories.frontDesk',
    defaultCategory: 'Nghiệp Vụ Lễ Tân & Tiếp Đón',
    nameKey: 'governance.permissions.assignVillas.name',
    defaultName: 'Phân Bổ Biệt Thự & Cập Nhật Trạng Thái Vận Hành',
    descriptionKey: 'governance.permissions.assignVillas.desc',
    defaultDescription: 'Gán biệt thự sẵn sàng cho lượt đặt và chuyển đổi trạng thái (Đang dọn, Sẵn sàng, Bảo trì).',
    grants: {
      customer: 'denied',
      receptionist: 'granted',
      therapist: 'denied',
      fb_staff: 'denied',
      manager: 'denied',
      admin: 'denied'
    },
    isImmutableBoundary: false
  },
  {
    capability: 'book_manual_extra_spa',
    categoryKey: 'governance.permissions.categories.frontDesk',
    defaultCategory: 'Nghiệp Vụ Lễ Tân & Tiếp Đón',
    nameKey: 'governance.permissions.bookExtraSpa.name',
    defaultName: 'Đặt Dịch Vụ Spa Bổ Sung Tại Quầy Lễ Tân',
    descriptionKey: 'governance.permissions.bookExtraSpa.desc',
    defaultDescription: 'Lên lịch buổi spa bổ sung với kiểm tra ràng buộc 2 chiều nghiêm ngặt (Kỹ thuật viên + Phòng trị liệu).',
    grants: {
      customer: 'denied',
      receptionist: 'granted',
      therapist: 'denied',
      fb_staff: 'denied',
      manager: 'denied',
      admin: 'denied'
    },
    isImmutableBoundary: false
  },
  {
    capability: 'generate_folio_process_checkout',
    categoryKey: 'governance.permissions.categories.frontDesk',
    defaultCategory: 'Nghiệp Vụ Lễ Tân & Tiếp Đón',
    nameKey: 'governance.permissions.checkoutProcess.name',
    defaultName: 'Tổng Hợp Chi Phí, Thu Tiền & Hoàn Tất Check-out',
    descriptionKey: 'governance.permissions.checkoutProcess.desc',
    defaultDescription: 'Tạo hóa đơn tổng hợp, thu khoản thanh toán cuối và hoàn tất trả phòng khi không còn công nợ chưa thanh toán (BR-02).',
    grants: {
      customer: 'denied',
      receptionist: 'granted',
      therapist: 'denied',
      fb_staff: 'denied',
      manager: 'denied',
      admin: 'denied'
    },
    isImmutableBoundary: true,
    boundaryReasonKey: 'governance.permissions.boundaries.frontDeskCheckout',
    defaultBoundaryReason: 'Trách nhiệm tài chính: Nghiệp vụ thu ngân và nhận lại chìa khóa chỉ thuộc thẩm quyền Lễ tân.'
  },

  // 3. Trị liệu & Sức khỏe
  {
    capability: 'view_assigned_therapist_schedule',
    categoryKey: 'governance.permissions.categories.wellness',
    defaultCategory: 'Dịch Vụ Trị Liệu Spa & Sức Khỏe',
    nameKey: 'governance.permissions.viewTherapistSchedule.name',
    defaultName: 'Xem Lịch Trị Liệu Được Phân Công Cá Nhân',
    descriptionKey: 'governance.permissions.viewTherapistSchedule.desc',
    defaultDescription: 'Truy cập các buổi trị liệu và yoga được phân công trong ngày cùng phòng trị liệu.',
    grants: {
      customer: 'denied',
      receptionist: 'denied',
      therapist: 'granted',
      fb_staff: 'denied',
      manager: 'denied',
      admin: 'denied'
    },
    isImmutableBoundary: false
  },
  {
    capability: 'view_treatment_relevant_health_notes',
    categoryKey: 'governance.permissions.categories.wellness',
    defaultCategory: 'Dịch Vụ Trị Liệu Spa & Sức Khỏe',
    nameKey: 'governance.permissions.viewHealthNotes.name',
    defaultName: 'Xem Ghi Chú Sức Khỏe Phục Vụ Trị Liệu',
    descriptionKey: 'governance.permissions.viewHealthNotes.desc',
    defaultDescription: 'Chỉ xem các chống chỉ định thể chất, chấn thương và vùng cần chú ý của khách hàng được phân công (BR-03).',
    grants: {
      customer: 'denied',
      receptionist: 'denied',
      therapist: 'granted',
      fb_staff: 'denied',
      manager: 'denied',
      admin: 'denied'
    },
    isImmutableBoundary: true,
    boundaryReasonKey: 'governance.permissions.boundaries.therapistHealthOnly',
    defaultBoundaryReason: 'Tối thiểu hóa dữ liệu (BR-03): Ghi chú sức khỏe lâm sàng CHỈ kỹ thuật viên trực tiếp điều trị mới được truy cập.'
  },
  {
    capability: 'complete_spa_sessions',
    categoryKey: 'governance.permissions.categories.wellness',
    defaultCategory: 'Dịch Vụ Trị Liệu Spa & Sức Khỏe',
    nameKey: 'governance.permissions.completeSpa.name',
    defaultName: 'Ghi Nhận Kết Quả Buổi Trị Liệu Spa (Hoàn thành / Vắng mặt)',
    descriptionKey: 'governance.permissions.completeSpa.desc',
    defaultDescription: 'Đánh dấu hoàn tất trị liệu kèm ghi chú chuyên môn hoặc ghi nhận khách vắng mặt.',
    grants: {
      customer: 'denied',
      receptionist: 'denied',
      therapist: 'granted',
      fb_staff: 'denied',
      manager: 'denied',
      admin: 'denied'
    },
    isImmutableBoundary: false
  },

  // 4. Ẩm thực & Dinh dưỡng (F&B)
  {
    capability: 'view_meal_prep_queue',
    categoryKey: 'governance.permissions.categories.culinary',
    defaultCategory: 'Nghiệp Vụ Ẩm Thực & Bếp (F&B)',
    nameKey: 'governance.permissions.viewMealPrep.name',
    defaultName: 'Xem Hàng Đợi Chuẩn Bị Suất Ăn Hàng Ngày',
    descriptionKey: 'governance.permissions.viewMealPrep.desc',
    defaultDescription: 'Truy cập danh sách món ăn tổng hợp theo khung giờ, số biệt thự và trạng thái chuẩn bị.',
    grants: {
      customer: 'denied',
      receptionist: 'denied',
      therapist: 'denied',
      fb_staff: 'granted',
      manager: 'denied',
      admin: 'denied'
    },
    isImmutableBoundary: false
  },
  {
    capability: 'view_dietary_allergy_warnings',
    categoryKey: 'governance.permissions.categories.culinary',
    defaultCategory: 'Nghiệp Vụ Ẩm Thực & Bếp (F&B)',
    nameKey: 'governance.permissions.viewDietaryWarnings.name',
    defaultName: 'Xem Cảnh Báo Dị Ứng & Kiêng Kỵ Dinh Dưỡng',
    descriptionKey: 'governance.permissions.viewDietaryWarnings.desc',
    defaultDescription: 'Chỉ xem nhãn dị ứng thực phẩm và yêu cầu dinh dưỡng, không xem hồ sơ bệnh án tổng quát (BR-03).',
    grants: {
      customer: 'denied',
      receptionist: 'denied',
      therapist: 'denied',
      fb_staff: 'granted',
      manager: 'denied',
      admin: 'denied'
    },
    isImmutableBoundary: true,
    boundaryReasonKey: 'governance.permissions.boundaries.fnbDietaryOnly',
    defaultBoundaryReason: 'Tối thiểu hóa dữ liệu (BR-03): Nhân viên bếp chỉ thấy nhãn dị ứng món ăn; tuyệt đối không thấy bệnh án y tế.'
  },
  {
    capability: 'update_meal_order_status',
    categoryKey: 'governance.permissions.categories.culinary',
    defaultCategory: 'Nghiệp Vụ Ẩm Thực & Bếp (F&B)',
    nameKey: 'governance.permissions.updateMealStatus.name',
    defaultName: 'Cập Nhật Trạng Thái Món Ăn (Đang làm / Đã xong / Đã giao)',
    descriptionKey: 'governance.permissions.updateMealStatus.desc',
    defaultDescription: 'Chuyển trạng thái các món ăn từ khâu chế biến đến bàn giao tới biệt thự.',
    grants: {
      customer: 'denied',
      receptionist: 'denied',
      therapist: 'denied',
      fb_staff: 'granted',
      manager: 'denied',
      admin: 'denied'
    },
    isImmutableBoundary: false
  },

  // 5. Báo cáo & Quản lý
  {
    capability: 'view_revenue_reports',
    categoryKey: 'governance.permissions.categories.management',
    defaultCategory: 'Báo Cáo & Giám Sát Quản Lý',
    nameKey: 'governance.permissions.viewRevenue.name',
    defaultName: 'Xem Báo Cáo Doanh Thu & Tài Chính',
    descriptionKey: 'governance.permissions.viewRevenue.desc',
    defaultDescription: 'Truy cập báo cáo tài chính tổng hợp từ phí gói nghỉ dưỡng, doanh thu spa và ẩm thực.',
    grants: {
      customer: 'denied',
      receptionist: 'denied',
      therapist: 'denied',
      fb_staff: 'denied',
      manager: 'granted',
      admin: 'granted'
    },
    isImmutableBoundary: false
  },
  {
    capability: 'view_occupancy_reports',
    categoryKey: 'governance.permissions.categories.management',
    defaultCategory: 'Báo Cáo & Giám Sát Quản Lý',
    nameKey: 'governance.permissions.viewOccupancy.name',
    defaultName: 'Xem Báo Cáo Công Suất Phòng & Sử Dụng Biệt Thự',
    descriptionKey: 'governance.permissions.viewOccupancy.desc',
    defaultDescription: 'Giám sát tỷ lệ lấp đầy khu nghỉ dưỡng, hiệu suất theo hạng biệt thự và tỷ lệ bảo trì theo thời gian thực.',
    grants: {
      customer: 'denied',
      receptionist: 'denied',
      therapist: 'denied',
      fb_staff: 'denied',
      manager: 'granted',
      admin: 'granted'
    },
    isImmutableBoundary: false
  },
  {
    capability: 'view_therapist_utilization_reports',
    categoryKey: 'governance.permissions.categories.management',
    defaultCategory: 'Báo Cáo & Giám Sát Quản Lý',
    nameKey: 'governance.permissions.viewTherapistReports.name',
    defaultName: 'Xem Báo Cáo Hiệu Suất & Tải Công Việc Kỹ Thuật Viên',
    descriptionKey: 'governance.permissions.viewTherapistReports.desc',
    defaultDescription: 'Giám sát tổng thời lượng trị liệu, số buổi đã thực hiện và tỷ lệ hoàn thành theo từng kỹ thuật viên.',
    grants: {
      customer: 'denied',
      receptionist: 'denied',
      therapist: 'denied',
      fb_staff: 'denied',
      manager: 'granted',
      admin: 'granted'
    },
    isImmutableBoundary: false
  },
  {
    capability: 'view_manager_dashboard',
    categoryKey: 'governance.permissions.categories.management',
    defaultCategory: 'Báo Cáo & Giám Sát Quản Lý',
    nameKey: 'governance.permissions.viewManagerDashboard.name',
    defaultName: 'Truy Cập Bảng Điều Khiển Quản Lý Vận Hành',
    descriptionKey: 'governance.permissions.viewManagerDashboard.desc',
    defaultDescription: 'Bảng thông tin điều hành tổng hợp các chỉ số KPI vận hành chính và báo cáo phân tích.',
    grants: {
      customer: 'denied',
      receptionist: 'denied',
      therapist: 'denied',
      fb_staff: 'denied',
      manager: 'granted',
      admin: 'denied'
    },
    isImmutableBoundary: false
  },

  // 6. Quản trị hệ thống & Tuân thủ
  {
    capability: 'export_police_residence_declaration',
    categoryKey: 'governance.permissions.categories.governance',
    defaultCategory: 'Quản Trị Hệ Thống & Tuân Thủ',
    nameKey: 'governance.permissions.exportPolice.name',
    defaultName: 'Kết Xuất Khai Báo Tạm Trú Với Cơ Quan Công An',
    descriptionKey: 'governance.permissions.exportPolice.desc',
    defaultDescription: 'Tạo tệp dữ liệu chính thức phục vụ việc khai báo tạm trú theo Luật Cư trú 2020.',
    grants: {
      customer: 'denied',
      receptionist: 'denied',
      therapist: 'denied',
      fb_staff: 'denied',
      manager: 'denied',
      admin: 'granted'
    },
    isImmutableBoundary: false
  },
  {
    capability: 'configure_business_parameters',
    categoryKey: 'governance.permissions.categories.governance',
    defaultCategory: 'Quản Trị Hệ Thống & Tuân Thủ',
    nameKey: 'governance.permissions.configureParams.name',
    defaultName: 'Cấu Hình Tham Số Nghiệp Vụ Hệ Thống',
    descriptionKey: 'governance.permissions.configureParams.desc',
    defaultDescription: 'Điều chỉnh tỷ lệ tiền cọc, khung giờ hủy phòng, tỷ lệ hoàn cọc và thời gian báo trước chọn món ăn.',
    grants: {
      customer: 'denied',
      receptionist: 'denied',
      therapist: 'denied',
      fb_staff: 'denied',
      manager: 'denied',
      admin: 'granted'
    },
    isImmutableBoundary: false,
    isDelegableToManager: true
  },
  {
    capability: 'manage_feature_flags',
    categoryKey: 'governance.permissions.categories.governance',
    defaultCategory: 'Quản Trị Hệ Thống & Tuân Thủ',
    nameKey: 'governance.permissions.manageFlags.name',
    defaultName: 'Cấu Hình Quy Trình Vận Hành Tự Động',
    descriptionKey: 'governance.permissions.manageFlags.desc',
    defaultDescription: 'Bật tắt các mô-đun tùy chọn và quy trình tự động hóa tuân thủ.',
    grants: {
      customer: 'denied',
      receptionist: 'denied',
      therapist: 'denied',
      fb_staff: 'denied',
      manager: 'denied',
      admin: 'granted'
    },
    isImmutableBoundary: false,
    isDelegableToManager: false
  },
  {
    capability: 'view_permission_matrix',
    categoryKey: 'governance.permissions.categories.governance',
    defaultCategory: 'Quản Trị Hệ Thống & Tuân Thủ',
    nameKey: 'governance.permissions.viewMatrix.name',
    defaultName: 'Xem Ma Trận Phân Quyền Vai Trò (RBAC)',
    descriptionKey: 'governance.permissions.viewMatrix.desc',
    defaultDescription: 'Đánh giá phân bổ năng lực chức năng giữa các vai trò và các ranh giới bảo mật.',
    grants: {
      customer: 'denied',
      receptionist: 'denied',
      therapist: 'denied',
      fb_staff: 'denied',
      manager: 'denied',
      admin: 'granted'
    },
    isImmutableBoundary: true,
    boundaryReasonKey: 'governance.permissions.boundaries.adminOnly',
    defaultBoundaryReason: 'Quản trị bảo mật: Cấu hình ma trận RBAC chỉ dành riêng cho Quản Trị Viên Hệ Thống.'
  },
  {
    capability: 'delegate_admin_rights',
    categoryKey: 'governance.permissions.categories.governance',
    defaultCategory: 'Quản Trị Hệ Thống & Tuân Thủ',
    nameKey: 'governance.permissions.delegateRights.name',
    defaultName: 'Ủy Quyền Quyền Hạn Quản Trị Cho Quản Lý',
    descriptionKey: 'governance.permissions.delegateRights.desc',
    defaultDescription: 'Cấp quyền hạn quản trị có giới hạn thời gian và phạm vi cho Quản Lý Vận Hành.',
    grants: {
      customer: 'denied',
      receptionist: 'denied',
      therapist: 'denied',
      fb_staff: 'denied',
      manager: 'denied',
      admin: 'granted'
    },
    isImmutableBoundary: true,
    boundaryReasonKey: 'governance.permissions.boundaries.delegationAdminOnly',
    defaultBoundaryReason: 'Bảo vệ leo thang đặc quyền: Quyền ủy quyền không thể được ủy quyền tiếp hoặc tự cấp.'
  },
  {
    capability: 'view_sensitive_data_audit_log',
    categoryKey: 'governance.permissions.categories.governance',
    defaultCategory: 'Quản Trị Hệ Thống & Tuân Thủ',
    nameKey: 'governance.permissions.viewAuditLog.name',
    defaultName: 'Xem Nhật Ký Kiểm Toán Dữ Liệu Nhạy Cảm',
    descriptionKey: 'governance.permissions.viewAuditLog.desc',
    defaultDescription: 'Kiểm tra nhật ký thời gian truy cập dữ liệu sức khỏe, danh tính cá nhân và giao dịch tài chính.',
    grants: {
      customer: 'denied',
      receptionist: 'denied',
      therapist: 'denied',
      fb_staff: 'denied',
      manager: 'denied',
      admin: 'granted'
    },
    isImmutableBoundary: true,
    boundaryReasonKey: 'governance.permissions.boundaries.auditAdminOnly',
    defaultBoundaryReason: 'Trách nhiệm giải trình: Quyền kiểm tra nhật ký kiểm toán chỉ dành riêng cho Quản Trị Viên Hệ Thống.'
  },
  {
    capability: 'view_system_overview',
    categoryKey: 'governance.permissions.categories.governance',
    defaultCategory: 'Quản Trị Hệ Thống & Tuân Thủ',
    nameKey: 'governance.permissions.viewSystemOverview.name',
    defaultName: 'Xem Tổng Quan Vận Hành & Tuân Thủ Toàn Hệ Thống',
    descriptionKey: 'governance.permissions.viewSystemOverview.desc',
    defaultDescription: 'Tổng hợp dữ liệu liên mô-đun về đặt phòng, biệt thự, trị liệu, ẩm thực và tình trạng khai báo công an.',
    grants: {
      customer: 'denied',
      receptionist: 'denied',
      therapist: 'denied',
      fb_staff: 'denied',
      manager: 'granted',
      admin: 'granted'
    },
    isImmutableBoundary: false
  },

  // 7. Quản trị Biệt thự & Cơ sở Lưu trú (Villa & Facility Governance)
  {
    capability: 'view_villa_inventory',
    categoryKey: 'governance.permissions.categories.facility',
    defaultCategory: 'Quản Trị Biệt Thự & Cơ Sở Lưu Trú',
    nameKey: 'governance.permissions.viewVillaInventory.name',
    defaultName: 'Xem Danh Sách & Bản Đồ Biệt Thự Vật Lý',
    descriptionKey: 'governance.permissions.viewVillaInventory.desc',
    defaultDescription: 'Truy cập sơ đồ 27 căn biệt thự, phân khu cảnh quan, trạng thái dọn dẹp và bảo dưỡng buồng phòng.',
    grants: {
      customer: 'denied',
      receptionist: 'granted',
      therapist: 'denied',
      fb_staff: 'denied',
      manager: 'granted',
      admin: 'granted'
    },
    isImmutableBoundary: false,
    isDelegableToManager: false
  },
  {
    capability: 'manage_villa_inventory',
    categoryKey: 'governance.permissions.categories.facility',
    defaultCategory: 'Quản Trị Biệt Thự & Cơ Sở Lưu Trú',
    nameKey: 'governance.permissions.manageVillaInventory.name',
    defaultName: 'Quản Lý Cấu Hình & Thông Số Biệt Thự Vật Lý',
    descriptionKey: 'governance.permissions.manageVillaInventory.desc',
    defaultDescription: 'Chỉnh sửa diện tích, giường ngủ, phân bổ phân khu, tiện nghi và ghi chú vận hành cho 27 căn villa.',
    grants: {
      customer: 'denied',
      receptionist: 'denied',
      therapist: 'denied',
      fb_staff: 'denied',
      manager: 'denied',
      admin: 'granted'
    },
    isImmutableBoundary: false,
    isDelegableToManager: true
  },
  {
    capability: 'view_villa_categories',
    categoryKey: 'governance.permissions.categories.facility',
    defaultCategory: 'Quản Trị Biệt Thự & Cơ Sở Lưu Trú',
    nameKey: 'governance.permissions.viewVillaCategories.name',
    defaultName: 'Xem Cơ Cấu Hạng Biệt Thự & Khung Sản Phẩm',
    descriptionKey: 'governance.permissions.viewVillaCategories.desc',
    defaultDescription: 'Xem định dạng 6 hạng villa chuẩn resort, sức chứa, đặc quyền và các gói retreat tương thích.',
    grants: {
      customer: 'granted',
      receptionist: 'granted',
      therapist: 'denied',
      fb_staff: 'denied',
      manager: 'granted',
      admin: 'granted'
    },
    isImmutableBoundary: false,
    isDelegableToManager: false
  },
  {
    capability: 'manage_villa_categories',
    categoryKey: 'governance.permissions.categories.facility',
    defaultCategory: 'Quản Trị Biệt Thự & Cơ Sở Lưu Trú',
    nameKey: 'governance.permissions.manageVillaCategories.name',
    defaultName: 'Quản Lý Hạng Biệt Thự & Phụ Thu Khung Sản Phẩm',
    descriptionKey: 'governance.permissions.manageVillaCategories.desc',
    defaultDescription: 'Điều chỉnh giá phụ thu nâng hạng (price modifier), tiện ích đặc quyền và liên kết gói nghỉ dưỡng retreat.',
    grants: {
      customer: 'denied',
      receptionist: 'denied',
      therapist: 'denied',
      fb_staff: 'denied',
      manager: 'denied',
      admin: 'granted'
    },
    isImmutableBoundary: false,
    isDelegableToManager: true
  },
  {
    capability: 'view_functional_areas',
    categoryKey: 'governance.permissions.categories.facility',
    defaultCategory: 'Quản Trị Biệt Thự & Cơ Sở Lưu Trú',
    nameKey: 'governance.permissions.viewFunctionalAreas.name',
    defaultName: 'Xem Danh Mục Phòng Chức Năng & Tiện Nghi',
    descriptionKey: 'governance.permissions.viewFunctionalAreas.desc',
    defaultDescription: 'Xem định mức 16 không gian phòng chức năng (nghỉ ngơi, sinh hoạt chung, ngoại thất, tiện ích cao cấp).',
    grants: {
      customer: 'denied',
      receptionist: 'granted',
      therapist: 'denied',
      fb_staff: 'denied',
      manager: 'granted',
      admin: 'granted'
    },
    isImmutableBoundary: false,
    isDelegableToManager: false
  },
  {
    capability: 'manage_functional_areas',
    categoryKey: 'governance.permissions.categories.facility',
    defaultCategory: 'Quản Trị Biệt Thự & Cơ Sở Lưu Trú',
    nameKey: 'governance.permissions.manageFunctionalAreas.name',
    defaultName: 'Quản Lý Định Mức Phòng Chức Năng & Trang Thiết Bị',
    descriptionKey: 'governance.permissions.manageFunctionalAreas.desc',
    defaultDescription: 'Cấu hình tiêu chuẩn diện tích, trang thiết bị nội thất chủ đạo và quy chuẩn phục vụ của từng phòng chức năng.',
    grants: {
      customer: 'denied',
      receptionist: 'denied',
      therapist: 'denied',
      fb_staff: 'denied',
      manager: 'denied',
      admin: 'granted'
    },
    isImmutableBoundary: false,
    isDelegableToManager: true
  },
  {
    capability: 'manage_villa_maintenance',
    categoryKey: 'governance.permissions.categories.facility',
    defaultCategory: 'Quản Trị Biệt Thự & Cơ Sở Lưu Trú',
    nameKey: 'governance.permissions.manageVillaMaintenance.name',
    defaultName: 'Quyết Định Niêm Phong & Bảo Trì Biệt Thự',
    descriptionKey: 'governance.permissions.manageVillaMaintenance.desc',
    defaultDescription: 'Đưa biệt thự vào chế độ bảo trì dài hạn, tạm ngừng đón khách hoặc phê duyệt kế hoạch tân trang.',
    grants: {
      customer: 'denied',
      receptionist: 'denied',
      therapist: 'denied',
      fb_staff: 'denied',
      manager: 'denied',
      admin: 'granted'
    },
    isImmutableBoundary: false,
    isDelegableToManager: true
  }
];

export const INITIAL_DELEGATIONS: AdminDelegation[] = [
  {
    id: 'DEL-2026-001',
    delegateUserId: 'usr-mgr-01',
    delegateName: 'Sarah Jenkins',
    delegateRole: 'manager',
    capabilities: [
      'configure_business_parameters',
      'manage_villa_inventory',
      'manage_villa_maintenance'
    ],
    startsAt: '2026-09-27 08:00',
    expiresAt: '2026-11-30 23:59',
    status: 'active',
    grantedBy: 'Alexander Wright (Quản trị viên)',
    reason: 'Ủy quyền tác nghiệp quản lý danh mục 27 biệt thự, chuyển trạng thái dọn dẹp/bảo trì và cấu hình tham số thời vụ.',
    createdAt: '2026-09-27 07:45'
  },
  {
    id: 'DEL-2026-000',
    delegateUserId: 'usr-mgr-01',
    delegateName: 'Sarah Jenkins',
    delegateRole: 'manager',
    capabilities: ['configure_business_parameters'],
    startsAt: '2026-09-20 08:00',
    expiresAt: '2026-09-22 18:00',
    status: 'expired',
    grantedBy: 'Alexander Wright (Quản trị viên)',
    reason: 'Cấu hình tham số giờ nhận bàn và hủy phòng dịp lễ hội mùa thu.',
    createdAt: '2026-09-20 07:30'
  }
];

export const INITIAL_AUDIT_EVENTS: AuditEvent[] = [
  {
    id: 'AUD-89104',
    timestamp: '2026-09-27 16:42:10',
    actorId: 'usr-th-01',
    actorName: 'David Kim',
    actorRole: 'therapist',
    action: 'READ',
    dataCategory: 'HEALTH_WELLNESS',
    targetRef: 'CUST-8801',
    result: 'SUCCESS',
    detailsKey: 'governance.audit.details.treatmentNotesConsultation',
    detailsFallback: 'Đã tra cứu ghi chú lâm sàng phục vụ điều trị cho buổi tắm thảo dược buổi chiều theo lịch.'
  },
  {
    id: 'AUD-89103',
    timestamp: '2026-09-27 15:30:05',
    actorId: 'usr-rec-01',
    actorName: 'Linh Tran',
    actorRole: 'receptionist',
    action: 'READ',
    dataCategory: 'RESIDENCE_IDENTITY',
    targetRef: 'CUST-8802',
    result: 'SUCCESS',
    detailsKey: 'governance.audit.details.residenceIdVerified',
    detailsFallback: 'Đã xác minh siêu dữ liệu giấy tờ tùy thân của khách khi thực hiện thủ tục nhận phòng trực tiếp.'
  },
  {
    id: 'AUD-89102',
    timestamp: '2026-09-27 14:15:22',
    actorId: 'usr-rec-01',
    actorName: 'Linh Tran',
    actorRole: 'receptionist',
    action: 'READ',
    dataCategory: 'HEALTH_WELLNESS',
    targetRef: 'CUST-8803',
    result: 'DENIED',
    detailsKey: 'governance.audit.details.receptionistHealthBlocked',
    detailsFallback: 'Yêu cầu truy cập toàn bộ chống chỉ định y tế bị chặn bởi chính sách tối thiểu hóa dữ liệu RBAC (BR-03).'
  },
  {
    id: 'AUD-89101',
    timestamp: '2026-09-27 12:05:44',
    actorId: 'usr-fb-01',
    actorName: 'Marcus Chen',
    actorRole: 'fb_staff',
    action: 'READ',
    dataCategory: 'DIETARY_ALLERGY',
    targetRef: 'CUST-8801',
    result: 'SUCCESS',
    detailsKey: 'governance.audit.details.kitchenAllergenCheck',
    detailsFallback: 'Đã truy cập thông tin cảnh báo dị ứng thực phẩm để chuẩn bị bữa trưa (Không dung nạp Gluten & Dị ứng hạt cây).'
  },
  {
    id: 'AUD-89100',
    timestamp: '2026-09-27 11:10:18',
    actorId: 'usr-rec-01',
    actorName: 'Linh Tran',
    actorRole: 'receptionist',
    action: 'UPDATE',
    dataCategory: 'PAYMENT_TRANSACTION',
    targetRef: 'FOLIO-2026-001',
    result: 'SUCCESS',
    detailsKey: 'governance.audit.details.folioSettlementRecorded',
    detailsFallback: 'Đã ghi nhận mã tham chiếu giao dịch cổng VNPay cho quyết toán hóa đơn trả phòng.'
  },
  {
    id: 'AUD-89099',
    timestamp: '2026-09-27 07:45:12',
    actorId: 'usr-adm-01',
    actorName: 'Alexander Wright',
    actorRole: 'admin',
    action: 'CREATE',
    dataCategory: 'SECURITY_GOVERNANCE',
    targetRef: 'DEL-2026-001',
    result: 'SUCCESS',
    detailsKey: 'governance.audit.details.delegationGranted',
    detailsFallback: 'Đã cấp quyền ủy quyền cấu hình tham số tạm thời cho Quản lý Sarah Jenkins.'
  },
  {
    id: 'AUD-89098',
    timestamp: '2026-09-26 18:20:00',
    actorId: 'usr-adm-01',
    actorName: 'Alexander Wright',
    actorRole: 'admin',
    action: 'EXPORT',
    dataCategory: 'RESIDENCE_IDENTITY',
    targetRef: 'BATCH-2026-09-26',
    result: 'SUCCESS',
    detailsKey: 'governance.audit.details.residenceBatchExported',
    detailsFallback: 'Đã tạo gói dữ liệu xuất tuân thủ Luật Cư trú (24 bản ghi khách đang lưu trú).'
  },
  {
    id: 'AUD-89097',
    timestamp: '2026-09-26 10:15:30',
    actorId: 'usr-adm-01',
    actorName: 'Alexander Wright',
    actorRole: 'admin',
    action: 'TOGGLE',
    dataCategory: 'SECURITY_GOVERNANCE',
    targetRef: 'enable_online_extra_spa_booking',
    result: 'SUCCESS',
    detailsKey: 'governance.audit.details.featureFlagToggled',
    detailsFallback: 'Cập nhật cấu hình tham số vận hành sang BẬT trên phạm vi toàn hệ thống.'
  }
];

export const INITIAL_POLICE_EXPORT_SUMMARY: PoliceResidenceExportSummary = {
  batchId: 'POLICE-DEC-20260927',
  generatedAt: '2026-09-27 18:00',
  totalRecords: 14,
  domesticCount: 8,
  foreignCount: 6,
  status: 'READY',
  complianceStandard: 'Luật Cư trú Việt Nam 2020 & Nghị định 13/2023/NĐ-CP'
};
