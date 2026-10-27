import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  UserPlus,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  X,
  RefreshCw,
  Lock,
} from 'lucide-react';
import { staffAccountsApi } from '../../features/m6-admin/api/staffAccountsApi';
import type { StaffAccount } from '../../types/staff';
import type { Role } from '../../types/auth';
import { Button } from '../../components/common/Button';
import { useToast } from '../../components/common/Toast';
import { useAuth } from '../../hooks/useAuth';

export const StaffAccountListPage: React.FC = () => {
  const { t } = useTranslation(['operations', 'common']);
  const { showToast } = useToast();
  const { hasPermission } = useAuth();

  const canView = hasPermission('S10:V');
  const canCreate = hasPermission('S11:C');

  const [staffList, setStaffList] = useState<StaffAccount[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // New staff modal state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newRole, setNewRole] = useState<Role>('therapist');
  const [newTitle, setNewTitle] = useState('');
  const [newDepartment, setNewDepartment] = useState('Chăm Sóc Sức Khỏe & Spa');
  const [submitting, setSubmitting] = useState(false);

  // Temporary password modal state
  const [tempCredential, setTempCredential] = useState<{ email: string; password: string } | null>(null);

  const loadStaff = useCallback(async () => {
    if (!canView) {
      setLoading(false);
      setError('Bạn không có quyền xem danh sách nhân sự (Yêu cầu quyền S10:V)');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const data = await staffAccountsApi.list();
      setStaffList(data);
    } catch (err: any) {
      const msg = err?.message || 'Không thể tải danh sách nhân viên từ máy chủ';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  }, [canView, showToast]);

  useEffect(() => {
    loadStaff();
  }, [loadStaff]);

  const filteredStaff = staffList.filter((staff) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = staff.name.toLowerCase().includes(q);
      const matchEmail = staff.email.toLowerCase().includes(q);
      const matchId = staff.id.toLowerCase().includes(q);
      if (!matchName && !matchEmail && !matchId) return false;
    }
    if (roleFilter !== 'all' && staff.role !== roleFilter) {
      return false;
    }
    if (statusFilter !== 'all' && staff.status !== statusFilter) {
      return false;
    }
    return true;
  });

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreate) {
      showToast('Bạn không có quyền cấp tài khoản nhân viên (Yêu cầu quyền S11:C)', 'error');
      return;
    }
    if (!newName.trim() || !newEmail.trim()) {
      showToast(t('common.forms.requiredFields', 'Họ tên và email là bắt buộc'), 'error');
      return;
    }

    setSubmitting(true);
    try {
      const result = await staffAccountsApi.create({
        fullName: newName.trim(),
        email: newEmail.trim(),
        phoneNumber: newPhone.trim() || undefined,
        role: newRole,
      });

      setStaffList((prev) => [result.staff, ...prev]);
      setAddModalOpen(false);
      setNewName('');
      setNewEmail('');
      setNewPhone('');
      setNewTitle('');

      if (result.temporaryPassword) {
        setTempCredential({ email: result.staff.email, password: result.temporaryPassword });
      } else {
        showToast(t('operations.staffList.createdToast', 'Đã cấp tài khoản nhân viên thành công trên máy chủ'), 'success');
      }
    } catch (err: any) {
      showToast(err?.message || 'Không thể cấp tài khoản nhân sự', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const getRoleBadgeStyle = (role: Role) => {
    switch (role) {
      case 'admin':
        return { bg: 'var(--actor-admin)', text: 'var(--actor-admin-text)' };
      case 'manager':
        return { bg: 'var(--actor-manager)', text: 'var(--actor-manager-text)' };
      case 'receptionist':
        return { bg: 'var(--actor-receptionist)', text: 'var(--actor-receptionist-text)' };
      case 'therapist':
        return { bg: 'var(--actor-therapist)', text: 'var(--actor-therapist-text)' };
      case 'fb_staff':
        return { bg: 'var(--actor-fb)', text: 'var(--actor-fb-text)' };
      default:
        return { bg: '#e0e0e0', text: '#333333' };
    }
  };

  if (!canView) {
    return (
      <div style={{ padding: 'var(--space-8)' }}>
        <div className="hsw-gov-card" style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
          <Lock size={36} style={{ color: 'var(--danger)', margin: '0 auto var(--space-4)' }} />
          <h2 style={{ fontSize: 'var(--text-xl)', marginBottom: 'var(--space-2)' }}>
            Truy Cập Bị Giới Hạn (RBAC)
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', maxWidth: '500px', margin: '0 auto' }}>
            Tài khoản hiện tại không có quyền xem danh sách nhân sự (Yêu cầu quyền <code>S10:V</code>).
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 'var(--space-6) var(--space-8)' }}>
      {/* Header */}
      <div className="hsw-gov-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-1)' }}>
              <h1 className="hsw-gov-title">
                {t('operations.staffList.pageTitle', 'Quản Lý Danh Sách Tài Khoản Nhân Viên')}
              </h1>
              <span style={{
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                padding: '3px 8px',
                borderRadius: 'var(--radius-pill)',
                backgroundColor: 'var(--actor-admin)',
                color: 'var(--actor-admin-text)'
              }}>
                {t('topbar.adminClearance', 'Thẩm Quyền Quản Trị')}
              </span>
            </div>
            <p className="hsw-gov-subtitle">
              {t('operations.staffList.pageSubtitle', 'Danh sách nhân sự chính thức của khu nghỉ dưỡng, phân quyền vai trò và thẩm quyền vận hành.')}
            </p>
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
            <Button
              variant="secondary"
              icon={<RefreshCw size={15} className={loading ? 'hsw-spin' : ''} />}
              onClick={loadStaff}
              disabled={loading}
            >
              {t('common.actions.refresh', 'Làm Mới')}
            </Button>
            {canCreate && (
              <Button
                variant="primary"
                icon={<UserPlus size={16} />}
                onClick={() => setAddModalOpen(true)}
              >
                {t('operations.staffList.addStaffBtn', 'Cấp Tài Khoản Mới')}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Security & Data Minimization Banner */}
      <div className="hsw-gov-banner">
        <ShieldCheck size={18} style={{ color: 'var(--accent-forest)', flexShrink: 0, marginTop: '2px' }} />
        <div>
          <strong style={{ color: 'var(--text-primary)' }}>
            {t('operations.staffList.privacyBannerTitle', 'Bảo Vệ Thông Tin Xác Thực & Kiểm Soát Truy Cập')}
          </strong>
          <span style={{ display: 'block', marginTop: '2px' }}>
            {t('operations.staffList.privacyBannerDesc', 'Mã băm mật khẩu, token OAuth và khóa bảo mật tuyệt đối không hiển thị trên giao diện quản trị nhân sự. Quyền hạn nhân viên được kiểm soát chặt chẽ bởi ma trận phân quyền RBAC.')}
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="hsw-gov-grid">
        <div className="hsw-gov-kpi">
          <span className="hsw-gov-kpi-label">{t('operations.staffList.totalStaff', 'Tổng Số Nhân Sự')}</span>
          <span className="hsw-gov-kpi-val">{staffList.length}</span>
          <span className="hsw-gov-kpi-sub">{t('operations.staffList.totalStaffSub', 'Nhân viên đã thiết lập trên hệ thống')}</span>
        </div>
        <div className="hsw-gov-kpi">
          <span className="hsw-gov-kpi-label">{t('operations.staffList.activeAccounts', 'Tài Khoản Hoạt Động')}</span>
          <span className="hsw-gov-kpi-val" style={{ color: 'var(--accent-forest)' }}>
            {staffList.filter((s) => s.status === 'active').length}
          </span>
          <span className="hsw-gov-kpi-sub">{t('operations.staffList.activeAccountsSub', 'Được phép đăng nhập vận hành')}</span>
        </div>
        <div className="hsw-gov-kpi">
          <span className="hsw-gov-kpi-label">{t('operations.staffList.suspendedAccounts', 'Tài Khoản Tạm Khóa')}</span>
          <span className="hsw-gov-kpi-val" style={{ color: staffList.some(s => s.status === 'suspended') ? 'var(--danger)' : 'var(--text-muted)' }}>
            {staffList.filter((s) => s.status === 'suspended').length}
          </span>
          <span className="hsw-gov-kpi-sub">{t('operations.staffList.suspendedAccountsSub', 'Quyền truy cập tạm thời bị đình chỉ')}</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="hsw-gov-card" style={{ marginBottom: 'var(--space-4)', padding: 'var(--space-3) var(--space-4)' }}>
        <div className="hsw-filter-toolbar" style={{ margin: 0, justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('operations.staffList.searchPlaceholder', 'Tìm theo tên, email hoặc ID...')}
                className="hsw-filter-input"
              />
            </div>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="hsw-filter-select"
            >
              <option value="all">{t('operations.staffList.filterAllRoles', 'Tất Cả Vai Trò')}</option>
              <option value="admin">Quản Trị Viên (Admin)</option>
              <option value="manager">Quản Lý (Manager)</option>
              <option value="receptionist">Lễ Tân (Receptionist)</option>
              <option value="therapist">Chuyên Viên Trị Liệu (Therapist)</option>
              <option value="fb_staff">Nhân Viên Bếp/F&B (F&B Staff)</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="hsw-filter-select"
            >
              <option value="all">{t('operations.staffList.filterAllStatuses', 'Tất Cả Trạng Thái')}</option>
              <option value="active">Hoạt Động (Active)</option>
              <option value="suspended">Tạm Khóa (Suspended)</option>
            </select>
          </div>

          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
            {t('common.showing', 'Hiển thị')} <strong>{filteredStaff.length}</strong> / {staffList.length} {t('operations.staffList.personnelLabel', 'nhân sự')}
          </div>
        </div>
      </div>

      {/* Staff Table / States */}
      <div className="hsw-gov-card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
              Đang tải danh sách nhân viên từ máy chủ...
            </div>
          </div>
        ) : error && staffList.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
            <AlertTriangle size={32} style={{ color: 'var(--danger)', margin: '0 auto var(--space-2)' }} />
            <p style={{ color: 'var(--danger)', fontSize: 'var(--text-sm)' }}>{error}</p>
            <Button variant="secondary" onClick={loadStaff} style={{ marginTop: 'var(--space-3)' }}>
              Thử Lại
            </Button>
          </div>
        ) : (
          <table className="hsw-gov-table">
            <thead>
              <tr>
                <th>{t('operations.staffList.colMember', 'Nhân Sự')}</th>
                <th>{t('operations.staffList.colRole', 'Vai Trò Phân Bổ')}</th>
                <th>{t('operations.staffList.colDept', 'Bộ Phận')}</th>
                <th>{t('operations.staffList.colStatus', 'Trạng Thái')}</th>
                <th>{t('operations.staffList.colLastActive', 'Lần Đăng Nhập')}</th>
                <th style={{ textAlign: 'right' }}>{t('common.actions.title', 'Thao Tác')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--text-muted)' }}>
                    Không có nhân sự nào khớp với tiêu chí tìm kiếm.
                  </td>
                </tr>
              ) : (
                filteredStaff.map((staff) => {
                  const badgeStyle = getRoleBadgeStyle(staff.role);
                  return (
                    <tr key={staff.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                          <div style={{
                            width: '34px',
                            height: '34px',
                            borderRadius: '50%',
                            backgroundColor: '#f2f0ea',
                            color: 'var(--accent-forest)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '12px'
                          }}>
                            {staff.avatar}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{staff.name}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{staff.email} · ID: {staff.id}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span style={{
                          display: 'inline-block',
                          padding: '3px 8px',
                          borderRadius: 'var(--radius-pill)',
                          fontSize: '11px',
                          fontWeight: 600,
                          backgroundColor: badgeStyle.bg,
                          color: badgeStyle.text,
                          textTransform: 'capitalize'
                        }}>
                          {staff.role === 'admin' ? 'Quản Trị Viên' : staff.role === 'manager' ? 'Quản Lý' : staff.role === 'receptionist' ? 'Lễ Tân' : staff.role === 'therapist' ? 'Kỹ Thuật Viên' : staff.role === 'fb_staff' ? 'Nhân Viên Bếp' : staff.role}
                        </span>
                      </td>
                      <td style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                        {staff.department}
                      </td>
                      <td>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-pill)',
                          fontSize: '11px',
                          fontWeight: 600,
                          backgroundColor: staff.status === 'active' ? '#eaf3ed' : '#fbeeed',
                          color: staff.status === 'active' ? 'var(--accent-forest)' : 'var(--danger)'
                        }}>
                          {staff.status === 'active' ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
                          {staff.status === 'active' ? 'HOẠT ĐỘNG' : 'TẠM KHÓA'}
                        </span>
                      </td>
                      <td style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                        {staff.lastActiveAt}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <Link
                          to={`/admin/staff/${staff.id}`}
                          className="hsw-btn hsw-btn-tertiary hsw-btn-sm"
                          style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                          {t('common.actions.view', 'Xem Chi Tiết')}
                          <ArrowRight size={13} />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Staff Modal */}
      {addModalOpen && canCreate && (
        <div className="hsw-gov-modal-backdrop" onClick={() => setAddModalOpen(false)}>
          <div className="hsw-gov-modal" onClick={(e) => e.stopPropagation()}>
            <div className="hsw-gov-modal-header">
              <h3 className="hsw-gov-modal-title">
                <UserPlus size={18} style={{ color: 'var(--accent-forest)' }} />
                {t('operations.staffList.modalTitle', 'Cấp Tài Khoản Nhân Viên Mới')}
              </h3>
              <button
                onClick={() => setAddModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateStaff}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <div>
                  <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: 'var(--space-1)' }}>
                    {t('common.forms.fullName', 'Họ và Tên')} *
                  </label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Ví dụ: Trần Bảo Ngọc"
                    className="hsw-filter-input"
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: 'var(--space-1)' }}>
                    {t('common.forms.email', 'Email Công Việc')} *
                  </label>
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="Ví dụ: ngoc.tran@heavenstay.com"
                    className="hsw-filter-input"
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: 'var(--space-1)' }}>
                    Số Điện Thoại (Tùy chọn)
                  </label>
                  <input
                    type="tel"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="Ví dụ: 0912345678"
                    className="hsw-filter-input"
                    style={{ width: '100%' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: 'var(--space-1)' }}>
                      {t('operations.staffList.colRole', 'Phân Quyền Vai Trò')}
                    </label>
                    <select
                      value={newRole}
                      onChange={(e) => {
                        const r = e.target.value as Role;
                        setNewRole(r);
                        if (r === 'therapist') setNewDepartment('Chăm Sóc Sức Khỏe & Spa');
                        else if (r === 'receptionist') setNewDepartment('Bộ Phận Tiền Sảnh');
                        else if (r === 'fb_staff') setNewDepartment('Ẩm Thực & Dinh Dưỡng F&B');
                        else if (r === 'manager') setNewDepartment('Ban Quản Lý Điều Hành');
                        else if (r === 'admin') setNewDepartment('Công Nghệ & Hệ Thống Thông Tin');
                      }}
                      className="hsw-filter-select"
                      style={{ width: '100%' }}
                    >
                      <option value="receptionist">Lễ Tân</option>
                      <option value="therapist">Chuyên Viên Trị Liệu / Yoga</option>
                      <option value="fb_staff">Nhân Viên F&B / Bếp</option>
                      <option value="manager">Quản Lý</option>
                      <option value="admin">Quản Trị Viên Hệ Thống</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: 'var(--space-1)' }}>
                      {t('operations.staffList.colDept', 'Bộ Phận')}
                    </label>
                    <input
                      type="text"
                      value={newDepartment}
                      onChange={(e) => setNewDepartment(e.target.value)}
                      className="hsw-filter-input"
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: 'var(--space-1)' }}>
                    {t('operations.staffList.titleLabel', 'Chức Danh / Vị Trí')}
                  </label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Ví dụ: Chuyên Viên Trị Liệu Spa"
                    className="hsw-filter-input"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-5)' }}>
                <Button variant="secondary" onClick={() => setAddModalOpen(false)} disabled={submitting}>
                  {t('common.actions.cancel', 'Hủy Bỏ')}
                </Button>
                <Button variant="primary" type="submit" disabled={submitting}>
                  {submitting ? 'Đang Xử Lý...' : t('operations.staffList.confirmCreate', 'Xác Nhận Cấp Tài Khoản')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Temporary Password Modal (Shown once upon real backend generation) */}
      {tempCredential && (
        <div className="hsw-gov-modal-backdrop" onClick={() => setTempCredential(null)}>
          <div className="hsw-gov-modal" onClick={(e) => e.stopPropagation()}>
            <div className="hsw-gov-modal-header">
              <h3 className="hsw-gov-modal-title" style={{ color: 'var(--accent-forest)' }}>
                <CheckCircle2 size={18} />
                Tài Khoản Nhân Viên Đã Được Cấp
              </h3>
            </div>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', margin: 'var(--space-3) 0' }}>
              Tài khoản đã được khởi tạo thành công trên cơ sở dữ liệu. Mật khẩu tạm thời dưới đây chỉ hiển thị <strong>một lần duy nhất</strong>:
            </p>
            <div style={{
              padding: 'var(--space-3) var(--space-4)',
              backgroundColor: '#f2f0ea',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-medium)',
              marginBottom: 'var(--space-4)'
            }}>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Email Đăng Nhập:</div>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 'var(--space-2)' }}>{tempCredential.email}</div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Mật Khẩu Tạm Thời:</div>
              <div style={{ fontFamily: 'monospace', fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--accent-forest)' }}>
                {tempCredential.password}
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="primary" onClick={() => setTempCredential(null)}>
                Đã Lưu Lại Thông Tin
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
