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
  ShieldAlert,
  RefreshCw
} from 'lucide-react';
import { staffAccountsApi } from '../../features/m6-admin/api/staffAccountsApi';
import type { StaffAccount } from '../../types/staff';
import type { Role } from '../../types/auth';
import { Button } from '../../components/common/Button';
import { useToast } from '../../components/common/Toast';
import { useAuth } from '../../hooks/useAuth';

export const StaffAccountDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation(['operations', 'common']);
  const { showToast } = useToast();
  const { hasPermission } = useAuth();

  const canView = hasPermission('S11:V');
  const canChangeStatus = hasPermission('S11:D');

  const [staff, setStaff] = useState<StaffAccount | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    if (!id || isNaN(Number(id))) {
      setError('Mã định danh nhân viên không hợp lệ.');
      setLoading(false);
      return;
    }
    if (!canView) {
      setError('Bạn không có quyền xem chi tiết hồ sơ nhân sự (Yêu cầu quyền S11:V).');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    staffAccountsApi
      .get(id)
      .then((s) => {
        setStaff(s);
      })
      .catch((err: any) => {
        const msg = err?.message || 'Không thể tải hồ sơ nhân viên từ máy chủ';
        setError(msg);
        showToast(msg, 'error');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id, canView, showToast]);

  const toggleStatus = async () => {
    if (!staff || staff.role === 'admin') return;
    if (!canChangeStatus) {
      showToast('Bạn không có quyền thay đổi trạng thái tài khoản (Yêu cầu quyền S11:D)', 'error');
      return;
    }

    const nextActive = staff.status !== 'active';
    setToggling(true);
    try {
      const updated = await staffAccountsApi.setStatus(staff.id, nextActive);
      setStaff(updated);
      setStatusModalOpen(false);
      showToast(
        nextActive
          ? t('operations.staffDetail.reactivatedToast', 'Đã khôi phục quyền truy cập thành công')
          : t('operations.staffDetail.suspendedToast', 'Đã tạm khóa tài khoản thành công'),
        nextActive ? 'success' : 'info'
      );
    } catch (err: any) {
      showToast(err?.message || 'Không thể cập nhật trạng thái nhân viên', 'error');
    } finally {
      setToggling(false);
    }
  };

  const getRoleScopeDescription = (role: Role) => {
    switch (role) {
      case 'admin':
        return {
          title: t('operations.staffDetail.scopeAdminTitle', 'Thẩm Quyền Quản Trị Hệ Thống & Bảo Mật'),
          desc: t('operations.staffDetail.scopeAdminDesc', 'Toàn quyền cấu hình tham số vận hành, duy trì ma trận phân quyền RBAC, quản lý danh sách nhân sự và giám sát nhật ký kiểm toán.'),
          minimization: t('operations.staffDetail.scopeAdminMin', 'Quản trị viên không có quyền truy cập bệnh án y tế cá nhân thô hoặc thông tin thẻ thanh toán của khách hàng.')
        };
      case 'manager':
        return {
          title: t('operations.staffDetail.scopeManagerTitle', 'Thẩm Quyền Quản Lý Điều Hành & Báo Cáo Phân Tích'),
          desc: t('operations.staffDetail.scopeManagerDesc', 'Xem báo cáo doanh thu cấp điều hành, thống kê công suất phòng villa, hiệu suất kỹ thuật viên và tổng quan sức khỏe hệ thống.'),
          minimization: t('operations.staffDetail.scopeManagerMin', 'Nghiêm ngặt chỉ đọc báo cáo phân tích. Quản lý không xem hồ sơ bệnh án hoặc can thiệp vượt quyền thanh toán.')
        };
      case 'receptionist':
        return {
          title: t('operations.staffDetail.scopeRecTitle', 'Thẩm Quyền Tiền Sảnh & Khai Báo Lưu Trú'),
          desc: t('operations.staffDetail.scopeRecDesc', 'Tiếp nhận khách hàng, thu thập giấy tờ tùy thân, chỉ định biệt thự, đặt lịch spa bổ sung và lập hóa đơn folio quyết toán.'),
          minimization: t('operations.staffDetail.scopeRecMin', 'Dữ liệu y tế được tối thiểu hóa; lễ tân không thể xem hồ sơ chẩn đoán sức khỏe cá nhân của khách hàng.')
        };
      case 'therapist':
        return {
          title: t('operations.staffDetail.scopeThTitle', 'Thẩm Quyền Chăm Sóc Sức Khỏe & Trị Liệu Spa'),
          desc: t('operations.staffDetail.scopeThDesc', 'Xem các buổi trị liệu được phân công, cập nhật trạng thái hoàn thành và ghi chú thể chất phục vụ bài trị liệu.'),
          minimization: t('operations.staffDetail.scopeThMin', 'Kỹ thuật viên chỉ thấy ghi chú thể chất và chỉ đối với những khách hàng mình trực tiếp phục vụ (BR-03).')
        };
      case 'fb_staff':
        return {
          title: t('operations.staffDetail.scopeFbTitle', 'Thẩm Quyền Vận Hành Bếp & Dinh Dưỡng Ẩm Thực'),
          desc: t('operations.staffDetail.scopeFbDesc', 'Kiểm tra danh sách chế biến món ăn hàng ngày, cập nhật tiến độ chuẩn bị và phục vụ các yêu cầu ăn uống a-la-carte.'),
          minimization: t('operations.staffDetail.scopeFbMin', 'Đầu bếp chỉ thấy cảnh báo dị ứng thực phẩm và chế độ dinh dưỡng, không thấy bệnh án khách hàng (BR-03).')
        };
      default:
        return {
          title: 'Quyền Hạn Tiêu Chuẩn',
          desc: 'Truy cập cổng cơ bản.',
          minimization: 'Áp dụng chính sách tối thiểu hóa dữ liệu.'
        };
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
        <RefreshCw size={28} className="hsw-spin" style={{ color: 'var(--accent-forest)', margin: '0 auto var(--space-3)' }} />
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
          Đang tải hồ sơ nhân viên từ máy chủ...
        </p>
      </div>
    );
  }

  if (error || !staff) {
    return (
      <div style={{ padding: 'var(--space-8)' }}>
        <div style={{ marginBottom: 'var(--space-4)' }}>
          <Link
            to="/admin/staff"
            className="hsw-btn hsw-btn-tertiary hsw-btn-sm"
            style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <ArrowLeft size={14} />
            {t('operations.staffDetail.backToList', 'Quay Lại Danh Sách')}
          </Link>
        </div>
        <div className="hsw-gov-card" style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
          <AlertTriangle size={36} style={{ color: 'var(--danger)', margin: '0 auto var(--space-4)' }} />
          <h2 style={{ fontSize: 'var(--text-xl)', marginBottom: 'var(--space-2)' }}>
            Không Thể Tải Hồ Sơ Nhân Viên
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', maxWidth: '500px', margin: '0 auto var(--space-6)' }}>
            {error || 'Không tìm thấy thông tin nhân sự với mã định danh được cung cấp.'}
          </p>
          <Link to="/admin/staff" className="hsw-btn hsw-btn-primary">
            Quay Về Danh Sách Nhân Sự
          </Link>
        </div>
      </div>
    );
  }

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
          {t('operations.staffDetail.backToList', 'Quay Lại Danh Sách Nhân Sự')}
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
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)', margin: 0, color: 'var(--text-primary)' }}>
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

              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginTop: '4px' }}>
                {staff.title} · {staff.department}
              </div>
            </div>
          </div>

          {/* Action Button */}
          {staff.role !== 'admin' && canChangeStatus && (
            <Button
              variant={staff.status === 'active' ? 'destructive' : 'primary'}
              icon={staff.status === 'active' ? <UserX size={15} /> : <UserCheck size={15} />}
              onClick={() => setStatusModalOpen(true)}
            >
              {staff.status === 'active'
                ? t('operations.staffDetail.btnSuspend', 'Tạm Khóa Tài Khoản')
                : t('operations.staffDetail.btnRestore', 'Kích Hoạt Lại')}
            </Button>
          )}
        </div>
      </div>

      {/* Main Grid: Personnel Info + Security Clearance */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 'var(--space-6)' }}>
        {/* Left Column: Personnel Metadata */}
        <div className="hsw-gov-card">
          <div className="hsw-gov-card-header">
            <h2 className="hsw-gov-card-title">
              <Building size={18} style={{ color: 'var(--accent-forest)' }} />
              {t('operations.staffDetail.metadataTitle', 'Thông Tin Hồ Sơ & Liên Hệ')}
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', fontSize: 'var(--text-xs)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-2) 0', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Mã Định Danh (ID)</span>
              <code style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{staff.id}</code>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-2) 0', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Mail size={13} /> Email
              </span>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{staff.email}</span>
            </div>

            {staff.phone && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-2) 0', borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Phone size={13} /> Số Điện Thoại
                </span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{staff.phone}</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-2) 0', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Vai Trò Hệ Thống</span>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)', textTransform: 'uppercase' }}>
                {staff.role}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-2) 0', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Calendar size={13} /> Ngày Tham Gia
              </span>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{staff.joinedDate || 'Chưa ghi nhận'}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-2) 0' }}>
              <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={13} /> Lần Đăng Nhập Gần Nhất
              </span>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{staff.lastActiveAt}</span>
            </div>
          </div>
        </div>

        {/* Right Column: RBAC Clearance & Minimization */}
        <div className="hsw-gov-card">
          <div className="hsw-gov-card-header">
            <h2 className="hsw-gov-card-title">
              <ShieldCheck size={18} style={{ color: 'var(--accent-forest)' }} />
              {t('operations.staffDetail.rbacScopeTitle', 'Phạm Vi Quyền Hạn Nghiệp Vụ RBAC')}
            </h2>
          </div>

          <div style={{ padding: 'var(--space-3)', backgroundColor: '#faf9f6', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', marginBottom: 'var(--space-4)' }}>
            <strong style={{ fontSize: 'var(--text-xs)', color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>
              {scopeInfo.title}
            </strong>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
              {scopeInfo.desc}
            </p>
            {staff.role === 'admin' && (
              <div style={{ marginTop: 'var(--space-3)', paddingTop: 'var(--space-3)', borderTop: '1px dashed var(--border-subtle)' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--accent-forest)', display: 'block', marginBottom: '6px' }}>
                  Các Phân Hệ Quyền Hạn Quản Trị Trực Thuộc:
                </span>
                <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  <li><strong>Tài Khoản Nhân Sự (S10/S11):</strong> Quản lý danh sách, phân vai trò và kiểm soát vòng đời nhân viên.</li>
                  <li><strong>Tham Số Vận Hành (S50):</strong> Thiết lập chính sách cọc, hạn hủy, giờ bếp và chốt chặn trả phòng BR-02.</li>
                  <li><strong>Phân Quyền Ma Trận RBAC (S51):</strong> Kiểm soát ranh giới năng lực và chính sách tối thiểu hóa dữ liệu BR-03.</li>
                  <li><strong>Ủy Quyền Hành Chính (S52):</strong> Thiết lập ủy quyền tạm thời có thời hạn cho Quản lý Khu nghỉ dưỡng.</li>
                  <li><strong>Kiểm Toán Bảo Mật (S53):</strong> Giám sát nhật ký kiểm toán (Audit Log) truy cập thông tin nhạy cảm.</li>
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
      {statusModalOpen && staff.role !== 'admin' && canChangeStatus && (
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
              <Button variant="secondary" onClick={() => setStatusModalOpen(false)} disabled={toggling}>
                {t('common.actions.cancel', 'Hủy Bỏ')}
              </Button>
              <Button
                variant={staff.status === 'active' ? 'destructive' : 'primary'}
                onClick={toggleStatus}
                disabled={toggling}
              >
                {toggling
                  ? 'Đang Xử Lý...'
                  : staff.status === 'active'
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
