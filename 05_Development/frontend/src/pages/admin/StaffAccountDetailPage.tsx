import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  UserX,
  Building,
  Mail,
  Phone,
  Calendar,
  Clock,
  Lock,
  ShieldAlert
} from 'lucide-react';
import { INITIAL_STAFF_ACCOUNTS } from '../../data/mockStaff';
import { staffAccountsApi } from '../../features/m6-admin/api/staffAccountsApi';
import type { StaffAccount, StaffStatus } from '../../types/staff';
import type { Role } from '../../types/auth';
import { Button } from '../../components/common/Button';
import { useToast } from '../../components/common/Toast';

export const StaffAccountDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation(['operations', 'common']);
  const { showToast } = useToast();

  const [staff, setStaff] = useState<StaffAccount>(INITIAL_STAFF_ACCOUNTS[0]);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!id) return;
    staffAccountsApi
      .get(id)
      .then((s) => { setStaff(s); setLoaded(true); })
      .catch((err: any) => showToast(err?.message || 'Không thể tải hồ sơ nhân viên', 'error'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const toggleStatus = async () => {
    if (staff.role === 'admin') return;
    const nextStatus: StaffStatus = staff.status === 'active' ? 'suspended' : 'active';
    try {
      const updated = await staffAccountsApi.setStatus(staff.id, nextStatus === 'active');
      setStaff(updated);
      setStatusModalOpen(false);
      showToast(
        nextStatus === 'active'
          ? t('operations.staffDetail.reactivatedToast', 'Đã khôi phục quyền truy cập tài khoản nhân viên (Hoạt động)')
          : t('operations.staffDetail.suspendedToast', 'Đã tạm khóa quyền truy cập tài khoản nhân viên'),
        nextStatus === 'active' ? 'success' : 'info'
      );
    } catch (err: any) {
      showToast(err?.message || 'Không thể cập nhật trạng thái tài khoản', 'error');
    }
  };

  const getRoleScopeDescription = (role: Role) => {
    switch (role) {
      case 'admin':
        return {
          title: t('operations.staffDetail.scopeAdminTitle', 'Thẩm Quyền Quản Trị Hệ Thống & Quản Trị Dữ Liệu'),
          desc: t('operations.staffDetail.scopeAdminDesc', 'Toàn quyền quản lý dữ liệu danh mục gốc (Master Data), cấu hình tham số kinh doanh & vận hành, phân quyền ma trận RBAC, ủy quyền điều hành và giám sát nhật ký kiểm toán bảo mật nhạy cảm.'),
          minimization: t('operations.staffDetail.scopeAdminMin', 'Quyền quản trị hệ thống không bao gồm quyền truy cập vào hồ sơ bệnh án thô hoặc thông tin thẻ thanh toán của khách hàng.')
        };
      case 'manager':
        return {
          title: t('operations.staffDetail.scopeManagerTitle', 'Thẩm Quyền Quản Lý Điều Hành & Phân Tích Vận Hành'),
          desc: t('operations.staffDetail.scopeManagerDesc', 'Được phép xem báo cáo doanh thu cấp cao, tỷ lệ lấp đầy biệt thự, hiệu suất kỹ thuật viên và tình trạng vận hành hệ thống.'),
          minimization: t('operations.staffDetail.scopeManagerMin', 'Quyền phân tích chỉ đọc nghiêm ngặt. Quản lý không thể xem hồ sơ bệnh án cá nhân hoặc ghi đè thanh toán trả phòng.')
        };
      case 'receptionist':
        return {
          title: t('operations.staffDetail.scopeRecTitle', 'Thẩm Quyền Lễ Tân & Tiếp Đón Lưu Trú'),
          desc: t('operations.staffDetail.scopeRecDesc', 'Được phép quản lý khách đến hàng ngày, thu thập thông tin cư trú, phân bổ biệt thự, ghi nhận dịch vụ spa bổ sung và tạo hóa đơn thanh toán trả phòng.'),
          minimization: t('operations.staffDetail.scopeRecMin', 'Dữ liệu sức khỏe được bảo vệ và tối thiểu hóa; lễ tân không thể truy cập hồ sơ bệnh án y tế.')
        };
      case 'therapist':
        return {
          title: t('operations.staffDetail.scopeThTitle', 'Thẩm Quyền Trị Liệu Spa & Chăm Sóc Sức Khỏe'),
          desc: t('operations.staffDetail.scopeThDesc', 'Quyền xem các buổi trị liệu được phân công trong ngày, cập nhật kết quả buổi trị liệu (Hoạt thành/Vắng mặt) và xem ghi chú sức khỏe phục vụ trị liệu.'),
          minimization: t('operations.staffDetail.scopeThMin', 'Kỹ thuật viên chỉ xem các chống chỉ định thể chất (chấn thương, dị ứng) và chỉ đối với khách hàng được phân công trực tiếp (BR-03).')
        };
      case 'fb_staff':
        return {
          title: t('operations.staffDetail.scopeFbTitle', 'Thẩm Quyền Ẩm Thực Dinh Dưỡng & Bếp (F&B)'),
          desc: t('operations.staffDetail.scopeFbDesc', 'Quyền kiểm tra hàng đợi chuẩn bị món ăn hàng ngày, cập nhật tiến độ chế biến và thực hiện các món ăn gọi thêm tại biệt thự.'),
          minimization: t('operations.staffDetail.scopeFbMin', 'Nhân viên bếp chỉ xem nhãn cảnh báo dị ứng thực phẩm và yêu cầu chế độ ăn uống, không được tiếp cận tiền sử y tế (BR-03).')
        };
      default:
        return {
          title: 'Quyền Truy Cập Tiêu Chuẩn',
          desc: 'Quyền truy cập cổng thông tin cơ bản.',
          minimization: 'Áp dụng chính sách tối thiểu hóa dữ liệu.'
        };
    }
  };

  const scopeInfo = getRoleScopeDescription(staff.role);

  return (
    <div style={{ padding: 'var(--space-6) var(--space-8)' }}>
      {/* Back button */}
      <div style={{ marginBottom: 'var(--space-4)' }}>
        <Link
          to="/admin/staff"
          className="hsw-btn hsw-btn-tertiary hsw-btn-sm"
          style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <ArrowLeft size={14} />
          {t('operations.staffDetail.backToList', 'Quay lại Danh Sách Nhân Viên')}
        </Link>
      </div>

      {/* Header Profile Card */}
      <div className="hsw-gov-card" style={{ marginBottom: 'var(--space-6)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: '#f2f0ea',
              color: 'var(--accent-forest)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '22px',
              border: '2px solid var(--border-subtle)'
            }}>
              {staff.avatar}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                  {staff.name}
                </h1>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-pill)',
                  fontSize: '11px',
                  fontWeight: 600,
                  backgroundColor: staff.status === 'active' ? '#7FFFD4' : '#fbeeed',
                  color: staff.status === 'active' ? '#004d40' : 'var(--danger)'
                }}>
                  {staff.status === 'active' ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
                  {staff.status === 'active' ? 'HOẠT ĐỘNG' : 'TẠM KHÓA'}
                </span>
              </div>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                {staff.title} · <span style={{ textTransform: 'capitalize' }}>{staff.department}</span>
              </p>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Mã tài khoản nhân viên: <code>{staff.id}</code>
              </div>
            </div>
          </div>

          {loaded && staff.role !== 'admin' && (<div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <Button
              variant={staff.status === 'active' ? 'destructive' : 'primary'}
              size="sm"
              icon={staff.status === 'active' ? <UserX size={14} /> : <UserCheck size={14} />}
              onClick={() => setStatusModalOpen(true)}
            >
              {staff.status === 'active'
                ? t('operations.staffDetail.suspendBtn', 'Tạm Khóa Quyền Truy Cập')
                : t('operations.staffDetail.activateBtn', 'Khôi Phục Quyền Truy Cập')}
            </Button>
          </div>)}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)' }}>
        {/* Left Column: Official Personnel & Contact Information */}
        <div className="hsw-gov-card" style={{ marginBottom: 0 }}>
          <div className="hsw-gov-card-header">
            <h2 className="hsw-gov-card-title">
              <Building size={18} style={{ color: 'var(--accent-forest)' }} />
              {t('operations.staffDetail.contactSectionTitle', 'Hồ Sơ Nhân Sự & Thông Tin Liên Hệ')}
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', fontSize: 'var(--text-xs)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-2) 0', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Mail size={13} /> {t('common.forms.email', 'Email Công Việc')}
              </span>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{staff.email}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-2) 0', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Phone size={13} /> {t('common.forms.phone', 'Số Điện Thoại Nội Bộ')}
              </span>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{staff.phone || '+84 258 399 1000'}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-2) 0', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Building size={13} /> {t('operations.staffList.colDept', 'Phòng Ban Trực Thuộc')}
              </span>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{staff.department}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-2) 0', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Calendar size={13} /> {t('operations.staffDetail.joinedDate', 'Ngày Cấp Tài Khoản')}
              </span>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{staff.joinedDate}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-2) 0' }}>
              <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={13} /> {t('operations.staffList.colLastActive', 'Lần Hoạt Động Gần Nhất')}
              </span>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{staff.lastActiveAt}</span>
            </div>
          </div>
        </div>

        {/* Right Column: RBAC Authorization & Data Minimization Scope */}
        <div className="hsw-gov-card" style={{ marginBottom: 0 }}>
          <div className="hsw-gov-card-header">
            <h2 className="hsw-gov-card-title">
              <ShieldCheck size={18} style={{ color: 'var(--accent-forest)' }} />
              {t('operations.staffDetail.rbacScopeTitle', 'Phạm Vi Quyền Hạn Nghiệp Vụ RBAC')}
            </h2>
          </div>

          <div style={{ padding: 'var(--space-3)', backgroundColor: '#faf9f6', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', marginBottom: 'var(--space-4)' }}>
            <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 var(--space-1) 0' }}>
              {scopeInfo.title}
            </h3>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
              {scopeInfo.desc}
            </p>
            {staff.role === 'admin' && (
              <div style={{ marginTop: 'var(--space-3)', paddingTop: 'var(--space-3)', borderTop: '1px dashed var(--border-subtle)' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--accent-forest)', display: 'block', marginBottom: '6px' }}>
                  {t('operations.staffDetail.adminClearanceListTitle', 'Các Phân Hệ Quyền Hạn Quản Trị Trực Thuộc:')}
                </span>
                <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  <li><strong>Dữ Liệu Gốc (Master Data):</strong> Quản lý danh mục Biệt thự, Dịch vụ Spa và Thực đơn F&B.</li>
                  <li><strong>Tài Khoản Nhân Sự:</strong> Quản lý danh sách, phân vai trò và kiểm soát vòng đời truy cập nhân viên.</li>
                  <li><strong>Tham Số Vận Hành:</strong> Thiết lập chính sách cọc, hạn hủy, giờ bếp và chốt chặn trả phòng BR-02.</li>
                  <li><strong>Phân Quyền Ma Trận RBAC:</strong> Kiểm soát ranh giới năng lực và chính sách tối thiểu hóa dữ liệu BR-03.</li>
                  <li><strong>Ủy Quyền Hành Chính:</strong> Thiết lập ủy quyền tạm thời có thời hạn cho Quản lý Khu nghỉ dưỡng.</li>
                  <li><strong>Kiểm Toán Bảo Mật:</strong> Giám sát nhật ký kiểm toán (Audit Log) truy cập thông tin nhạy cảm.</li>
                </ul>
              </div>
            )}
          </div>

          <div style={{ padding: 'var(--space-3)', backgroundColor: '#faf5f3', borderRadius: 'var(--radius-sm)', border: '1px solid #f0ded6' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-2)' }}>
              <ShieldAlert size={16} style={{ color: 'var(--accent-terracotta)', flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ fontSize: 'var(--text-xs)', color: 'var(--text-primary)' }}>
                  {t('operations.staffDetail.minimizationRuleTitle', 'Chính Sách Bảo Vệ Tối Thiểu Hóa Dữ Liệu BR-03')}
                </strong>
                <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '2px 0 0 0', lineHeight: 1.4 }}>
                  {scopeInfo.minimization}
                </p>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 'var(--space-4)', padding: 'var(--space-2) 0', borderTop: '1px solid var(--border-subtle)', fontSize: '11px', color: 'var(--text-muted)' }}>
            <Lock size={12} style={{ display: 'inline', marginRight: '4px' }} />
            {t('operations.staffDetail.credentialSafetyNotice', 'Mã băm xác thực, mật khẩu và phiên đăng nhập được quản lý nghiêm ngặt tại tầng định danh, không lưu trữ trên thẻ nhân sự.')}
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Status Toggle */}
      {statusModalOpen && staff.role !== 'admin' && (
        <div className="hsw-gov-modal-backdrop" onClick={() => setStatusModalOpen(false)}>
          <div className="hsw-gov-modal" onClick={(e) => e.stopPropagation()}>
            <div className="hsw-gov-modal-header">
              <h3 className="hsw-gov-modal-title">
                {staff.status === 'active' ? <AlertTriangle size={18} style={{ color: 'var(--danger)' }} /> : <CheckCircle2 size={18} style={{ color: 'var(--accent-forest)' }} />}
                {staff.status === 'active'
                  ? t('operations.staffDetail.confirmSuspendTitle', 'Xác Nhận Tạm Khóa Tài Khoản')
                  : t('operations.staffDetail.confirmRestoreTitle', 'Xác Nhận Khôi Phục Tài Khoản')}
              </h3>
            </div>

            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 'var(--space-3) 0' }}>
              {staff.status === 'active'
                ? t('operations.staffDetail.confirmSuspendDesc', 'Tạm khóa tài khoản này sẽ thu hồi ngay lập tức quyền truy cập vào các hệ thống vận hành. Các lịch hẹn hoặc nhiệm vụ đã phân công vẫn được bảo lưu để quản trị viên đối soát.')
                : t('operations.staffDetail.confirmRestoreDesc', 'Khôi phục tài khoản nhân viên này sẽ kích hoạt lại toàn bộ quyền hạn vận hành tương ứng với vai trò RBAC được phân công.')}
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-5)' }}>
              <Button variant="secondary" onClick={() => setStatusModalOpen(false)}>
                {t('common.actions.cancel', 'Hủy Bỏ')}
              </Button>
              <Button
                variant={staff.status === 'active' ? 'destructive' : 'primary'}
                onClick={toggleStatus}
              >
                {staff.status === 'active'
                  ? t('operations.staffDetail.btnExecuteSuspend', 'Thực Hiện Tạm Khóa')
                  : t('operations.staffDetail.btnExecuteRestore', 'Khôi Phục Quyền Truy Cập')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
