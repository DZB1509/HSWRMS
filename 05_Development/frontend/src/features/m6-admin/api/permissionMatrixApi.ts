import { apiClient } from '../../../api/client/apiClient';
import { evaluatePermission } from './staffAccountsApi';

export interface RoleViewDto {
  roleId: number;
  roleName: string;
  description: string;
}

export interface MatrixRowDto {
  permissionId: number;
  module: string;
  action: string;
  delegable: boolean;
  adminOnly: boolean;
  grants: Record<string, boolean>;
  lockedRoles: string[];
}

export interface MatrixViewDto {
  roles: RoleViewDto[];
  rows: MatrixRowDto[];
}

export interface MatrixChangeDto {
  role: string;
  module: string;
  action: string;
  granted: boolean;
}

export interface MatrixDiffEntryDto {
  role: string;
  module: string;
  action: string;
  from: boolean;
  to: boolean;
}

export interface MatrixChangeRequestDto {
  changes: MatrixChangeDto[];
}

export interface ApiEnvelope<T> {
  timestamp?: string;
  success?: boolean;
  message?: string;
  data: T;
}

/**
 * Metadata for Module / Screen codes
 */
export const MODULE_DESCRIPTIONS: Record<
  string,
  { name: string; domain: string; desc: string; compliance?: string }
> = {
  S10: {
    name: 'Danh Sách Tài Khoản Nhân Viên',
    domain: 'Nhân Sự & Quản Trị',
    desc: 'Xem và quản lý hồ sơ tài khoản nhân sự khu nghỉ dưỡng.',
  },
  S11: {
    name: 'Chi Tiết & Cấp Phát Nhân Sự',
    domain: 'Nhân Sự & Quản Trị',
    desc: 'Thêm mới tài khoản, cập nhật thông tin và khóa/kích hoạt tài khoản.',
  },
  S12: {
    name: 'Dữ Liệu Danh Mục Cốt Lõi',
    domain: 'Dữ Liệu Danh Mục',
    desc: 'Cấu hình danh mục hạng biệt thự, gói nghỉ dưỡng và dịch vụ Spa.',
  },
  S49: {
    name: 'Bảng Điều Khiển Quản Trị',
    domain: 'Giám Sát & Điều Hành',
    desc: 'Tổng quan tình trạng an ninh và cảnh báo đăng nhập thất bại toàn hệ thống.',
  },
  S50: {
    name: 'Tham Số Nghiệp Vụ Vận Hành',
    domain: 'Cấu Hình Hệ Thống',
    desc: 'Cấu hình tỷ lệ cọc, khung giờ hủy phòng và thời gian khóa an toàn.',
  },
  S51: {
    name: 'Ma Trận Phân Quyền (RBAC)',
    domain: 'An Ninh & Phân Quyền',
    desc: 'Thiết lập ma trận phân quyền theo vai trò và kiểm soát ranh giới bảo mật.',
  },
  S52: {
    name: 'Ủy Quyền Quản Lý (Delegation)',
    domain: 'An Ninh & Phân Quyền',
    desc: 'Cấp phát và thu hồi quyền ủy quyền có thời hạn cho vai trò Quản lý.',
  },
  S53: {
    name: 'Nhật Ký Kiểm Toán Nhạy Cảm',
    domain: 'An Ninh & Kiểm Toán',
    desc: 'Truy vết bất biến các hành vi thay đổi cấu hình, phân quyền và dữ liệu cá nhân.',
    compliance: 'Nghị định 13/2023/NĐ-CP & Luật An ninh mạng',
  },
  S54: {
    name: 'Tổng Quan Hệ Thống Quản Lý',
    domain: 'Báo Cáo Quản Lý',
    desc: 'Báo cáo giám sát vận hành cấp cao dành riêng cho Quản lý.',
  },
  S55: {
    name: 'Trung Tâm Điều Hành & Kết Xuất',
    domain: 'Báo Cáo Quản Lý',
    desc: 'Trung tâm tổng hợp báo cáo và tiện ích phân tích vận hành.',
  },
  S55_ADMIN_WIDGETS: {
    name: 'Tiện Ích Quản Trị Nâng Cao S55',
    domain: 'Cấu Hình Hệ Thống',
    desc: 'Tiện ích quản trị nâng cao hiển thị trên màn hình điều hành S55.',
  },
  RESIDENCE_REPORT: {
    name: 'Khai Báo Cư Trú Công An',
    domain: 'Pháp Lý & Cư Trú',
    desc: 'Kết xuất và nộp dữ liệu khai báo tạm trú theo định dạng chuẩn ngành công an.',
    compliance: 'Luật Cư trú 2020 & Nghị định 13/2023/NĐ-CP',
  },
  S02: {
    name: 'Cổng Thông Tin Khách Hàng',
    domain: 'Khách Hàng',
    desc: 'Trang đặt chỗ và quản lý kỳ nghỉ dưỡng của khách.',
  },
  S20: {
    name: 'Điều Hành Lễ Tân (Front-Desk)',
    domain: 'Vận Hành Lễ Tân',
    desc: 'Check-in, check-out, gán biệt thự và tiếp nhận thanh toán dịch vụ.',
  },
  S31: {
    name: 'Lịch Trình Trị Liệu Spa & Yoga',
    domain: 'Sức Khỏe & Spa',
    desc: 'Quản lý lịch phiên trị liệu và phân bổ phòng chuyên dụng 2 chiều.',
  },
  S38: {
    name: 'Điều Hành Bếp Ẩm Thực F&B',
    domain: 'Ẩm Thực F&B',
    desc: 'Chuẩn bị thực đơn dinh dưỡng và kiểm soát suất ăn theo tiêu chuẩn khách sạn.',
  },
  S46: {
    name: 'Báo Cáo Công Suất Buồng Phòng',
    domain: 'Báo Cáo Quản Lý',
    desc: 'Thống kê tỷ lệ lấp đầy phòng theo thời gian thực.',
  },
  S47: {
    name: 'Báo Cáo Doanh Thu Tài Chính',
    domain: 'Báo Cáo Quản Lý',
    desc: 'Doanh thu dịch vụ lưu trú, Spa và ẩm thực nghỉ dưỡng.',
  },
  S48: {
    name: 'Báo Cáo Hiệu Suất Kỹ Thuật Viên',
    domain: 'Báo Cáo Quản Lý',
    desc: 'Thống kê giờ trị liệu và đánh giá năng suất chuyên viên chăm sóc sức khỏe.',
  },
  DATA_HEALTH_FULL: {
    name: 'Hồ Sơ Sức Khỏe Toàn Diện',
    domain: 'Dữ Liệu Cá Nhân Nhạy Cảm',
    desc: 'Chỉ khách hàng sở hữu mới có quyền truy cập toàn bộ hồ sơ y tế/sức khỏe.',
    compliance: 'Nguyên tắc Tối thiểu hóa dữ liệu (Nghị định 13/2023)',
  },
  DATA_HEALTH_TREATMENT: {
    name: 'Ghi Chú Trị Liệu Sức Khỏe',
    domain: 'Dữ Liệu Cá Nhân Nhạy Cảm',
    desc: 'Giới hạn nghiêm ngặt chỉ Khách hàng và Kỹ thuật viên phụ trách phiên.',
    compliance: 'Nguyên tắc Tối thiểu hóa dữ liệu (Nghị định 13/2023)',
  },
  DATA_FOOD_ALLERGY: {
    name: 'Cảnh Báo Dị Ứng Món Ăn',
    domain: 'Dữ Liệu Cá Nhân Nhạy Cảm',
    desc: 'Chia sẻ có kiểm soát giữa Khách hàng và Bếp trưởng/F&B để ngăn ngừa rủi ro sốc phản vệ.',
    compliance: 'Nguyên tắc Tối thiểu hóa dữ liệu (Nghị định 13/2023)',
  },
  DATA_RESIDENCE: {
    name: 'Dữ Liệu Giấy Tờ Tùy Thân & Cư Trú',
    domain: 'Dữ Liệu Pháp Lý',
    desc: 'Chỉ Lễ tân có thẩm quyền khai báo cư trú mới được xử lý thông tin CMND/CCCD/Hộ chiếu.',
    compliance: 'Luật Cư trú 2020 & Nghị định 13/2023/NĐ-CP',
  },
};

export const ACTION_NAMES: Record<string, { label: string; desc: string }> = {
  V: { label: 'Xem (View)', desc: 'Xem danh sách và thông tin chi tiết' },
  C: { label: 'Tạo (Create)', desc: 'Khởi tạo bản ghi mới' },
  U: { label: 'Sửa (Update)', desc: 'Chỉnh sửa và cập nhật dữ liệu' },
  D: { label: 'Khóa / Hủy (Deactivate)', desc: 'Vô hiệu hóa hoặc đình chỉ bản ghi' },
  E: { label: 'Xuất (Export)', desc: 'Kết xuất báo cáo Excel/CSV' },
  A: { label: 'Phân Bổ (Assign)', desc: 'Phân công tài nguyên / nhân sự' },
  G: { label: 'Cấu Hình (Grant)', desc: 'Cấp phát và điều chỉnh ma trận quyền' },
};

export interface PermissionSpec {
  code: string;
  module: string;
  action: string;
  title: string;
  scope: string;
  impact: string;
  domain: string;
  risk: 'LOW' | 'MEDIUM' | 'HIGH';
  compliance?: string;
}

export const PERMISSION_SPECIFICATIONS: Record<string, Omit<PermissionSpec, 'code' | 'module' | 'action'>> = {
  // S10 - Danh Sách Nhân Viên
  'S10:V': {
    title: 'Tra Cứu Danh Sách Nhân Viên',
    scope: 'Xem danh sách toàn bộ nhân sự, mã nhân viên, vị trí công tác, phòng ban và trạng thái tài khoản hoạt động trong khu nghỉ dưỡng.',
    impact: 'Không làm thay đổi hồ sơ nhân sự, phục vụ đối soát thông tin vận hành nội bộ.',
    domain: 'Quản Trị Nhân Sự (S10/S11)',
    risk: 'LOW',
  },
  'S10:C': {
    title: 'Khởi Tạo Hồ Sơ Nhân Viên Mới',
    scope: 'Thêm bản ghi nhân sự mới vào danh bạ nhân sự khu nghỉ dưỡng (họ tên, email, số điện thoại, bộ phận tiếp nhận).',
    impact: 'Mở rộng cơ sở dữ liệu nhân sự của hệ thống.',
    domain: 'Quản Trị Nhân Sự (S10/S11)',
    risk: 'MEDIUM',
  },
  'S10:U': {
    title: 'Cập Nhật Hồ Sơ Nhân Sự',
    scope: 'Chỉnh sửa thông tin liên hệ, phòng ban công tác và cập nhật hồ sơ cá nhân của nhân viên.',
    impact: 'Cập nhật lý lịch nhân sự đang hoạt động.',
    domain: 'Quản Trị Nhân Sự (S10/S11)',
    risk: 'MEDIUM',
  },
  'S10:D': {
    title: 'Đình Chỉ / Vô Hiệu Hóa Hồ Sơ Nhân Viên',
    scope: 'Đình chỉ hồ sơ nhân viên khi nghỉ việc hoặc chuyển công tác, khóa tài khoản khỏi quy trình vận hành.',
    impact: 'Ngăn nhân viên đăng nhập hoặc tham gia phân công ca làm việc.',
    domain: 'Quản Trị Nhân Sự (S10/S11)',
    risk: 'HIGH',
  },

  // S11 - Chi Tiết & Cấp Phát Nhân Sự
  'S11:V': {
    title: 'Xem Chi Tiết Tài Khoản & Vai Trò Phân Bổ',
    scope: 'Tra cứu thông tin tài khoản đăng nhập, vai trò hệ thống (Role) và lịch sử cấp phát quyền của nhân viên.',
    impact: 'Giám sát phân quyền tài khoản của từng nhân sự.',
    domain: 'Quản Trị Nhân Sự (S10/S11)',
    risk: 'LOW',
  },
  'S11:C': {
    title: 'Cấp Mới Tài Khoản Đăng Nhập & Gán Vai Trò',
    scope: 'Tạo tài khoản đăng nhập hệ thống cho nhân viên mới và gán vai trò ban đầu (Receptionist, Therapist, F&B Staff, Manager).',
    impact: 'Cấp quyền truy cập hệ thống nghiệp vụ cho người dùng mới.',
    domain: 'Quản Trị Nhân Sự (S10/S11)',
    risk: 'HIGH',
  },
  'S11:U': {
    title: 'Điều Chỉnh Vai Trò & Đặt Lại Mật Khẩu Nhân Viên',
    scope: 'Thay đổi vai trò hệ thống, đặt lại mật khẩu tạm thời hoặc chỉnh sửa thông tin đăng nhập của nhân viên.',
    impact: 'Thay đổi phạm vi quyền hạn và thông tin xác thực truy cập của nhân viên.',
    domain: 'Quản Trị Nhân Sự (S10/S11)',
    risk: 'HIGH',
  },
  'S11:D': {
    title: 'Khóa Quyền Đăng Nhập Hệ Thống Của Nhân Viên',
    scope: 'Khóa tức thì tài khoản đăng nhập để chấm dứt quyền truy cập hệ thống của nhân viên.',
    impact: 'Thu hồi toàn bộ phiên làm việc của nhân sự ngay lập tức.',
    domain: 'Quản Trị Nhân Sự (S10/S11)',
    risk: 'HIGH',
  },

  // S12 - Quản Trị Danh Mục & Dịch Vụ Cốt Lõi (Delegable S12:V, S12:C, S12:U, S12:D)
  'S12:V': {
    title: 'Tra Cứu Danh Mục Dịch Vụ & Hạng Biệt Thự',
    scope: 'Xem thông số chi tiết bảng giá niêm yết, các hạng biệt thự nghỉ dưỡng, danh mục liệu trình Spa và cấu phần các gói nghỉ dưỡng (Retreat Packages).',
    impact: 'Chỉ đọc thông tin danh mục kinh doanh, không làm biến động dữ liệu.',
    domain: 'Quản Trị Danh Mục & Dịch Vụ (S12)',
    risk: 'LOW',
  },
  'S12:C': {
    title: 'Thêm Mới Hạng Biệt Thự, Gói Nghỉ Dưỡng & Liệu Trình Spa',
    scope: 'Khởi tạo thêm hạng biệt thự mới, cấu hình liệu trình Spa mới (thời lượng, phòng tương thích) hoặc tạo gói nghỉ dưỡng mới đưa vào mở bán.',
    impact: 'Mở rộng danh mục sản phẩm kinh doanh của khu nghỉ dưỡng trên hệ thống.',
    domain: 'Quản Trị Danh Mục & Dịch Vụ (S12)',
    risk: 'MEDIUM',
  },
  'S12:U': {
    title: 'Cập Nhật Giá Bán, Thời Lượng & Tiêu Chuẩn Dịch Vụ',
    scope: 'Chỉnh sửa giá niêm yết, thời lượng trị liệu, mô tả gói nghỉ dưỡng và tiêu chuẩn sức chứa buồng phòng.',
    impact: 'Thay đổi trực tiếp chính sách giá và tiêu chuẩn dịch vụ đang mở bán cho khách.',
    domain: 'Quản Trị Danh Mục & Dịch Vụ (S12)',
    risk: 'MEDIUM',
  },
  'S12:D': {
    title: 'Tạm Dừng / Ngừng Kinh Doanh Gói Nghỉ Dưỡng & Dịch Vụ Spa',
    scope: 'Tạm dừng hoặc vô hiệu hóa gói dịch vụ, liệu trình Spa hoặc loại phòng không còn phục vụ (do sửa chữa, đổi mùa) mà không làm mất lịch sử đặt chỗ cũ.',
    impact: 'Ẩn sản phẩm khỏi màn hình đặt chỗ của Khách hàng và Lễ tân.',
    domain: 'Quản Trị Danh Mục & Dịch Vụ (S12)',
    risk: 'HIGH',
  },

  // S49 - Admin Dashboard
  'S49:V': {
    title: 'Giám Sát Bảng Điều Khiển An Ninh Hệ Thống',
    scope: 'Theo dõi tổng quan tình trạng an ninh, số lượt đăng nhập thất bại, cảnh báo khóa tài khoản và tiến trình sao lưu hệ thống.',
    impact: 'Giám sát chỉ số an ninh thông tin cấp hệ thống.',
    domain: 'An Ninh & Quản Trị Hệ Thống',
    risk: 'LOW',
  },

  // S50 - Tham Số Vận Hành (Delegable S50:V, S50:U)
  'S50:V': {
    title: 'Xem Bảng Tham Số & Chính Sách Vận Hành',
    scope: 'Tra cứu các quy tắc nghiệp vụ: tỷ lệ đặt cọc bắt buộc (%), khung thời hạn hủy phòng hoàn tiền, số ngày lưu trữ dữ liệu kiểm toán.',
    impact: 'Xem chính sách kinh doanh và thông số vận hành.',
    domain: 'Tham Số & Chính Sách Vận Hành (S50)',
    risk: 'LOW',
  },
  'S50:U': {
    title: 'Điều Chỉnh Tham Số Chính Sách Đặt Cọc & Hủy Phòng',
    scope: 'Cập nhật các tham số nghiệp vụ linh hoạt: điều chỉnh tỷ lệ tiền cọc tối thiểu (%), thời hạn hủy phòng miễn phí trước ngày nhận phòng, mức phụ thu quá giờ.',
    impact: 'Ảnh hưởng trực tiếp đến quy chế thanh toán cọc và hoàn tiền áp dụng cho toàn bộ khách hàng.',
    domain: 'Tham Số & Chính Sách Vận Hành (S50)',
    risk: 'HIGH',
  },

  // S51 - RBAC Permission Matrix
  'S51:V': {
    title: 'Xem Ma Trận Phân Quyền Vai Trò (RBAC)',
    scope: 'Tra cứu bảng phân bổ quyền chi tiết giữa 6 vai trò hệ thống (Admin, Manager, Receptionist, Therapist, F&B Staff, Customer).',
    impact: 'Xem tổng thể kiến trúc phân quyền bảo mật của toàn hệ thống.',
    domain: 'An Ninh & Phân Quyền (S51/S52)',
    risk: 'LOW',
  },
  'S51:G': {
    title: 'Cấu Hình & Cập Nhật Ma Trận Phân Quyền (RBAC)',
    scope: 'Cấp phát hoặc thu hồi quyền truy cập theo từng vai trò; xác thực tự động với ranh giới an toàn (Admin Lock & Data Minimization).',
    impact: 'Quyết định trực tiếp thẩm quyền thao tác dữ liệu của tất cả người dùng trong hệ thống.',
    domain: 'An Ninh & Phân Quyền (S51/S52)',
    risk: 'HIGH',
  },

  // S52 - Delegation
  'S52:V': {
    title: 'Tra Cứu Lịch Sử Ủy Quyền Quản Trị Cho Quản Lý',
    scope: 'Xem danh sách các phiên ủy quyền đặc quyền quản trị có thời hạn cho Quản lý (thời gian hiệu lực, các quyền được ủy quyền, trạng thái).',
    impact: 'Giám sát các quyết định ủy quyền tạm thời.',
    domain: 'An Ninh & Phân Quyền (S51/S52)',
    risk: 'LOW',
  },
  'S52:C': {
    title: 'Cấp Mới Quyền Ủy Quyền Quản Trị Cho Quản Lý',
    scope: 'Cấp phát ủy quyền có thời hạn rõ ràng cho Quản lý vận hành đối với các quyền có cờ is_delegable=true theo quy định BR-06.',
    impact: 'Mở rộng tạm thời quyền hạn quản trị cho Quản lý trong khoảng thời gian xác định.',
    domain: 'An Ninh & Phân Quyền (S51/S52)',
    risk: 'HIGH',
  },
  'S52:D': {
    title: 'Thu Hồi Quyền Ủy Quyền Trước Thời Hạn',
    scope: 'Chấm dứt hiệu lực tức thì của một bản ghi ủy quyền trước khi hết thời hạn quy định.',
    impact: 'Tước bỏ các quyền đặc nhiệm đã ủy quyền cho Quản lý ngay tại thời điểm thu hồi.',
    domain: 'An Ninh & Phân Quyền (S51/S52)',
    risk: 'HIGH',
  },

  // S53 - Audit Log (Delegable S53:V)
  'S53:V': {
    title: 'Tra Cứu Nhật Ký Kiểm Toán Hoạt Động (Audit Log)',
    scope: 'Truy vết lịch sử thao tác của nhân viên: thời điểm đổi giá, cập nhật tham số cọc, gán biệt thự, hoàn hủy dịch vụ và xuất báo cáo.',
    impact: 'Phục vụ thanh tra nội bộ, đối soát sự cố và điều tra an ninh.',
    domain: 'Kiểm Toán & Giám Sát (S53)',
    risk: 'MEDIUM',
    compliance: 'Nghị định 13/2023/NĐ-CP & Luật An ninh mạng',
  },
  'S53:E': {
    title: 'Xuất Báo Cáo Nhật Ký Kiểm Toán Ra Tệp Tin',
    scope: 'Kết xuất toàn bộ nhật ký kiểm toán ra định dạng file Excel/CSV để phục vụ lưu trữ pháp lý và đối soát kiểm toán độc lập.',
    impact: 'Xuất bản ghi lịch sử truy vết hệ thống ra bên ngoài.',
    domain: 'Kiểm Toán & Giám Sát (S53)',
    risk: 'HIGH',
    compliance: 'Nghị định 13/2023/NĐ-CP & Luật An ninh mạng',
  },

  // S54 - Manager Executive Dashboard
  'S54:V': {
    title: 'Bảng Điều Khiển Tổng Quan Dành Cho Quản Lý',
    scope: 'Xem các chỉ số KPI vận hành khu nghỉ dưỡng: công suất phòng, doanh thu ước tính, lịch trị liệu Spa và cảnh báo vận hành.',
    impact: 'Phục vụ công tác giám sát điều hành hàng ngày của Quản lý.',
    domain: 'Báo Cáo & Điều Hành',
    risk: 'LOW',
  },

  // S55 - Operations Command Center (Delegable S55_ADMIN_WIDGETS:V)
  'S55:V': {
    title: 'Trung Tâm Điều Hành Hoạt Động & Xuất Báo Cáo',
    scope: 'Truy cập trung tâm điều hành tập trung S55 để theo dõi báo cáo doanh thu, tình trạng buồng phòng và các chỉ số hoạt động.',
    impact: 'Trung tâm tổng hợp báo cáo vận hành chung.',
    domain: 'Báo Cáo & Điều Hành',
    risk: 'LOW',
  },
  'S55_ADMIN_WIDGETS:V': {
    title: 'Mở Khóa Widget Thống Kê & Phân Tích Chuyên Sâu Quản Trị',
    scope: 'Hiển thị các widget thống kê nâng cao của Quản trị viên (tỷ lệ lấp đầy chuyên sâu, chỉ số đối soát tài chính, biểu đồ phân tích tương quan) trên màn hình điều hành S55.',
    impact: 'Cung cấp năng lực phân tích dữ liệu chuyên sâu cho Quản lý khi được ủy quyền.',
    domain: 'Báo Cáo & Điều Hành (S55)',
    risk: 'LOW',
  },

  // RESIDENCE_REPORT - Cư trú công an (Delegable RESIDENCE_REPORT:E)
  'RESIDENCE_REPORT:E': {
    title: 'Xuất Báo Cáo Khai Báo Cư Trú (Cơ Quan Công An)',
    scope: 'Kết xuất và tải danh sách toàn bộ khách đang lưu trú kèm thông tin giấy tờ tùy thân (CCCD/Hộ chiếu, quốc tịch, ngày đến, ngày đi) theo mẫu quy định nộp cơ quan Công an.',
    impact: 'Xử lý và chuyển dữ liệu định danh cư trú pháp lý của khách hàng.',
    domain: 'Pháp Lý & Cư Trú',
    risk: 'HIGH',
    compliance: 'Luật Cư trú 2020 & Nghị định 13/2023/NĐ-CP',
  },

  // S02 - Customer Portal
  'S02:V': {
    title: 'Cổng Trực Tuyến Đặt Kỳ Nghỉ Của Khách Hàng',
    scope: 'Xem thông tin các gói nghỉ dưỡng, kiểm tra tình trạng phòng trống và quản lý lịch trình cá nhân của khách.',
    impact: 'Giao diện tự phục vụ dành cho khách hàng.',
    domain: 'Cổng Khách Hàng',
    risk: 'LOW',
  },

  // S20 - Front-Desk Operations
  'S20:V': {
    title: 'Bàn Điều Hành Lễ Tân (Front-Desk Operations)',
    scope: 'Thực hiện thủ tục Check-in, Check-out, gán số biệt thự vật lý, tiếp nhận yêu cầu và thanh toán dịch vụ cho khách.',
    impact: 'Quy trình tiếp đón và quản lý lưu trú tại sảnh.',
    domain: 'Vận Hành Lễ Tân (S20)',
    risk: 'LOW',
  },

  // S31 - Spa & Wellness Scheduling
  'S31:V': {
    title: 'Lịch Trình Trị Liệu Spa & Lớp Học Yoga',
    scope: 'Xem lịch phân bổ phiên trị liệu theo chuyên viên và phòng dịch vụ; cập nhật trạng thái hoàn thành phiên chăm sóc sức khỏe.',
    impact: 'Điều phối hoạt động chăm sóc sức khỏe và phục hồi tại Spa.',
    domain: 'Vận Hành Spa & Sức Khỏe (S31)',
    risk: 'LOW',
  },

  // S38 / S39 - Dietary & Kitchen F&B
  'S38:V': {
    title: 'Bảng Điều Phối Bếp & Thực Đơn Dinh Dưỡng F&B',
    scope: 'Tiếp nhận đơn món ăn dinh dưỡng, theo dõi cảnh báo dị ứng của khách lưu trú và xác nhận chuẩn bị suất ăn.',
    impact: 'Vận hành bếp và an toàn thực phẩm.',
    domain: 'Ẩm Thực Dinh Dưỡng F&B (S38/S39)',
    risk: 'LOW',
  },
  'S39:V': {
    title: 'Xem Danh Mục Món Ăn & Tiêu Chuẩn Dinh Dưỡng',
    scope: 'Tra cứu danh mục thực đơn món ăn, thành phần nguyên liệu và chỉ số dinh dưỡng trong các gói nghỉ dưỡng.',
    impact: 'Xem thực đơn ẩm thực dưỡng sinh.',
    domain: 'Ẩm Thực Dinh Dưỡng F&B (S38/S39)',
    risk: 'LOW',
  },
  'S39:U': {
    title: 'Cập Nhật Thực Đơn & Thành Phần Dinh Dưỡng',
    scope: 'Điều chỉnh danh mục món ăn, cập nhật ghi chú thành phần nguyên liệu và bổ sung khuyến nghị dinh dưỡng.',
    impact: 'Thay đổi thực đơn ẩm thực phục vụ khách.',
    domain: 'Ẩm Thực Dinh Dưỡng F&B (S38/S39)',
    risk: 'MEDIUM',
  },

  // S46, S47, S48 - Management Analytics
  'S46:V': {
    title: 'Báo Cáo Phân Tích Công Suất Biệt Thự & Lưu Trú',
    scope: 'Xem biểu đồ và chỉ số tỷ lệ lấp đầy phòng theo thời gian thực, thời gian lưu trú trung bình (ALOS).',
    impact: 'Báo cáo hiệu suất kinh doanh buồng phòng.',
    domain: 'Báo Cáo & Phân Tích',
    risk: 'LOW',
  },
  'S47:V': {
    title: 'Báo Cáo Doanh Thu Tài Chính Khu Nghỉ Dưỡng',
    scope: 'Xem phân tích doanh thu tổng hợp từ dịch vụ lưu trú, gói kỳ nghỉ, trị liệu Spa và ẩm thực dinh dưỡng.',
    impact: 'Theo dõi tình hình tài chính kinh doanh của khu resort.',
    domain: 'Báo Cáo & Phân Tích',
    risk: 'LOW',
  },
  'S47:E': {
    title: 'Xuất Dữ Liệu Báo Cáo Doanh Thu (Excel/CSV)',
    scope: 'Tải về bảng phân tích chi tiết doanh thu theo ngày/tháng/năm để phục vụ kế toán và hoạch định tài chính.',
    impact: 'Kết xuất dữ liệu tài chính của doanh nghiệp.',
    domain: 'Báo Cáo & Phân Tích',
    risk: 'MEDIUM',
  },
  'S48:V': {
    title: 'Báo Cáo Hiệu Suất Trị Liệu Của Chuyên Viên Spa',
    scope: 'Xem thống kê số giờ thực hiện trị liệu, đánh giá mức độ hài lòng và công suất phục vụ của từng kỹ thuật viên.',
    impact: 'Đánh giá năng suất lao động của đội ngũ trị liệu viên.',
    domain: 'Báo Cáo & Phân Tích',
    risk: 'LOW',
  },
  'S48:E': {
    title: 'Xuất Báo Cáo Năng Suất Kỹ Thuật Viên Spa',
    scope: 'Tải về bảng tổng hợp thời gian trị liệu và năng suất chuyên viên chăm sóc sức khỏe.',
    impact: 'Kết xuất báo cáo nhân sự vận hành Spa.',
    domain: 'Báo Cáo & Phân Tích',
    risk: 'LOW',
  },

  // Sensitive Data Permissions (Decree 13/2023)
  'DATA_HEALTH_FULL:V': {
    title: 'Hồ Sơ Y Tế & Sức Khỏe Toàn Diện (Nhạy Cảm)',
    scope: 'Truy cập toàn bộ bệnh sử, chỉ số sinh hiệu và thông tin y tế cá nhân. Nghiêm cấm phân quyền cho bất kỳ nhân viên nào.',
    impact: 'Dữ liệu cá nhân đặc biệt nhạy cảm được bảo vệ nghiêm ngặt nhất.',
    domain: 'Dữ Liệu Cá Nhân Nhạy Cảm',
    risk: 'HIGH',
    compliance: 'Nghị định 13/2023/NĐ-CP (Điều 2 & Điều 9)',
  },
  'DATA_HEALTH_TREATMENT:V': {
    title: 'Ghi Chú Sức Khỏe & Vùng Chống Chỉ Định Trị Liệu',
    scope: 'Xem các vùng đau chấn thương, huyết áp hoặc vùng cơ thể cần tránh để kỹ thuật viên đảm bảo an toàn tuyệt đối khi massage/bấm huyệt.',
    impact: 'Giới hạn nghiêm ngặt chỉ kỹ thuật viên trực tiếp thực hiện phiên trị liệu.',
    domain: 'Dữ Liệu Cá Nhân Nhạy Cảm',
    risk: 'HIGH',
    compliance: 'Nghị định 13/2023/NĐ-CP (Tối thiểu hóa dữ liệu)',
  },
  'DATA_FOOD_ALLERGY:V': {
    title: 'Cảnh Báo Dị Ứng Thực Phẩm Của Khách Lưu Trú',
    scope: 'Xem danh sách các chất gây dị ứng thực phẩm nghiêm trọng (hải sản, đậu phộng, gluten...) để Bếp trưởng loại trừ khỏi khẩu phần ăn.',
    impact: 'Giới hạn nghiêm ngặt cho Bếp và F&B Staff nhằm ngăn ngừa nguy cơ sốc phản vệ.',
    domain: 'Dữ Liệu Cá Nhân Nhạy Cảm',
    risk: 'HIGH',
    compliance: 'Nghị định 13/2023/NĐ-CP (Tối thiểu hóa dữ liệu)',
  },
  'DATA_RESIDENCE:V': {
    title: 'Dữ Liệu Giấy Tờ Tùy Thân & Cư Trú (CCCD/Hộ Chiếu)',
    scope: 'Tiếp nhận và tra cứu số định danh cá nhân, hộ chiếu phục vụ thủ tục nhận phòng và khai báo tạm trú theo luật định.',
    impact: 'Giới hạn nghiêm ngặt chỉ nhân viên Lễ tân thực hiện thủ tục cư trú.',
    domain: 'Dữ Liệu Cá Nhân Nhạy Cảm',
    risk: 'HIGH',
    compliance: 'Luật Cư trú 2020 & Nghị định 13/2023/NĐ-CP',
  },
};

export function getPermissionSpecification(permCode: string): PermissionSpec {
  const parts = permCode.split(':');
  const mod = parts[0] || permCode;
  const act = parts[1] || '';

  if (PERMISSION_SPECIFICATIONS[permCode]) {
    const s = PERMISSION_SPECIFICATIONS[permCode];
    return {
      code: permCode,
      module: mod,
      action: act,
      title: s.title,
      scope: s.scope,
      impact: s.impact,
      domain: s.domain,
      risk: s.risk,
      compliance: s.compliance,
    };
  }

  const modDesc = MODULE_DESCRIPTIONS[mod];
  const actDesc = ACTION_NAMES[act];

  return {
    code: permCode,
    module: mod,
    action: act,
    title: `${modDesc?.name || mod} - ${actDesc?.label || act}`,
    scope: modDesc?.desc || `Thao tác trên phân hệ ${mod}`,
    impact: actDesc?.desc || `Thực hiện tác vụ ${act}`,
    domain: modDesc?.domain || 'Nghiệp vụ chung',
    risk: act === 'D' || act === 'G' ? 'HIGH' : act === 'C' || act === 'U' ? 'MEDIUM' : 'LOW',
    compliance: modDesc?.compliance,
  };
}

export const ADMIN_LOCKED_MODULES = new Set([
  'S10',
  'S11',
  'S12',
  'S49',
  'S50',
  'S51',
  'S52',
  'S53',
]);

/**
 * Sensitive data categories and strictly authorized roles (GB-M6-04, AC-04, AC-06, Decree 13/2023).
 */
export const SENSITIVE_DATA_ALLOWED_ROLES: Record<string, Set<string>> = {
  DATA_HEALTH_FULL: new Set(['CUSTOMER']),
  DATA_HEALTH_TREATMENT: new Set(['CUSTOMER', 'THERAPIST']),
  DATA_FOOD_ALLERGY: new Set(['CUSTOMER', 'FNB_STAFF', 'F&B STAFF', 'FB_STAFF']),
  DATA_RESIDENCE: new Set(['RECEPTIONIST']),
};

/**
 * Checks if a specific cell in the matrix is locked from modification.
 */
export function isCellLocked(row: MatrixRowDto, roleName: string): boolean {
  const normRole = roleName.trim().toUpperCase();

  // Admin lock invariant: Admin must never lose core administrative rights
  if (normRole === 'ADMIN' && ADMIN_LOCKED_MODULES.has(row.module)) {
    return true;
  }

  // Sensitive data minimization invariant: Disallowed roles cannot be granted sensitive data
  const allowedRoles = SENSITIVE_DATA_ALLOWED_ROLES[row.module];
  if (allowedRoles) {
    const isAllowed = Array.from(allowedRoles).some((r) => {
      const cleanR = r.toUpperCase().replace(/[^A-Z]/g, '');
      const cleanNorm = normRole.replace(/[^A-Z]/g, '');
      return cleanR === cleanNorm || r.toUpperCase() === normRole;
    });
    if (!isAllowed) {
      return true;
    }
  }

  // Row-level locked roles returned by backend
  if (row.lockedRoles && row.lockedRoles.some((r) => r.toUpperCase() === normRole)) {
    return true;
  }

  // Admin-only permissions cannot be granted to non-admin roles
  if (row.adminOnly && normRole !== 'ADMIN') {
    return true;
  }

  return false;
}

/**
 * Helper to get the canonical reason why a cell is locked.
 */
export function getLockReason(row: MatrixRowDto, roleName: string): string | null {
  const normRole = roleName.trim().toUpperCase();

  if (normRole === 'ADMIN' && ADMIN_LOCKED_MODULES.has(row.module)) {
    return `Ranh giới bảo mật bất biến: Vai trò Quản trị viên (Admin) bắt buộc phải duy trì quyền trên phân hệ ${row.module}. Không thể thu hồi.`;
  }

  if (row.adminOnly && normRole !== 'ADMIN') {
    return `Quyền hạn chỉ dành cho Quản trị viên (Admin-Only). Vai trò ${normRole} chỉ có thể nhận quyền tạm thời qua cơ chế Ủy quyền Quản lý (S52).`;
  }

  if (row.module.startsWith('DATA_')) {
    const allowed = SENSITIVE_DATA_ALLOWED_ROLES[row.module];
    if (allowed) {
      const isAllowed = Array.from(allowed).some((r) => {
        const cleanR = r.toUpperCase().replace(/[^A-Z]/g, '');
        const cleanNorm = normRole.replace(/[^A-Z]/g, '');
        return cleanR === cleanNorm || r.toUpperCase() === normRole;
      });
      if (!isAllowed) {
        return `Ranh giới an toàn tuyệt đối (Nghị định 13/2023/NĐ-CP): Vai trò ${normRole} bị cấm truy cập dữ liệu nhạy cảm ${row.module}.`;
      }
    }
    return 'Ranh giới an toàn tuyệt đối: Tuân thủ nguyên tắc tối thiểu hóa dữ liệu cá nhân theo Nghị định 13/2023/NĐ-CP.';
  }

  return null;
}

/**
 * Authorization validation for viewing and previewing/applying the matrix.
 */
export function validateMatrixAuthorization(
  user: { role?: string; permissions?: string[] } | null | undefined
): { canView: boolean; canPreview: boolean } {
  if (!user) {
    return { canView: false, canPreview: false };
  }

  const canView = evaluatePermission(user, 'S51:V');
  const canPreview = evaluatePermission(user, 'S51:G');

  return { canView, canPreview };
}

/**
 * Computes the list of diff changes between backend matrix and current draft state.
 */
export function computePendingChanges(
  originalRows: MatrixRowDto[],
  draftGrants: Record<string, Record<string, boolean>>
): MatrixChangeDto[] {
  const changes: MatrixChangeDto[] = [];

  for (const row of originalRows) {
    const key = `${row.module}:${row.action}`;
    const rowDraft = draftGrants[key];
    if (!rowDraft) continue;

    for (const [roleName, granted] of Object.entries(rowDraft)) {
      const origVal = Boolean(row.grants[roleName]);
      if (origVal !== granted) {
        changes.push({
          role: roleName,
          module: row.module,
          action: row.action,
          granted,
        });
      }
    }
  }

  return changes;
}

export const permissionMatrixApi = {
  /**
   * Fetches the authoritative RBAC matrix from backend.
   * Requires S51:V permission.
   */
  getMatrix: async (): Promise<MatrixViewDto> => {
    const res = await apiClient.get<ApiEnvelope<MatrixViewDto>>('/admin/permissions/matrix');
    if (res && res.data && Array.isArray(res.data.rows)) {
      return res.data;
    }
    return { roles: [], rows: [] };
  },

  /**
   * Previews planned permission changes without persisting anything.
   * Verified 100% read-only in backend service.
   * Requires S51:G permission.
   */
  previewChanges: async (changes: MatrixChangeDto[]): Promise<MatrixDiffEntryDto[]> => {
    if (!changes || changes.length === 0) {
      return [];
    }

    const res = await apiClient.post<ApiEnvelope<MatrixDiffEntryDto[]>>(
      '/admin/permissions/matrix/preview',
      { changes }
    );

    if (res && res.data && Array.isArray(res.data)) {
      return res.data;
    }
    return [];
  },

  /**
   * Applies validated permission changes to the database and writes audit log records.
   * Requires S51:G permission and Admin role.
   */
  applyChanges: async (changes: MatrixChangeDto[]): Promise<MatrixDiffEntryDto[]> => {
    if (!changes || changes.length === 0) {
      return [];
    }

    const res = await apiClient.put<ApiEnvelope<MatrixDiffEntryDto[]>>(
      '/admin/permissions/matrix',
      { changes }
    );

    if (res && res.data && Array.isArray(res.data)) {
      return res.data;
    }
    return [];
  },
};
