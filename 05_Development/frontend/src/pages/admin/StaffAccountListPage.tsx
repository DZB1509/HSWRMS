import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  UserPlus,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  UserX,
  X
} from 'lucide-react';
import { staffAccountsApi } from '../../features/m6-admin/api/staffAccountsApi';
import type { StaffAccount } from '../../types/staff';
import type { Role } from '../../types/auth';
import { Button } from '../../components/common/Button';
import { useToast } from '../../components/common/Toast';

export const StaffAccountListPage: React.FC = () => {
  const { t } = useTranslation(['operations', 'common']);
  const { showToast } = useToast();

  const [staffList, setStaffList] = useState<StaffAccount[]>([]);
  const [tempCredential, setTempCredential] = useState<{ email: string; password: string } | null>(null);

  const loadStaff = async () => {
    try {
      setStaffList(await staffAccountsApi.list());
    } catch (err: any) {
      showToast(err?.message || 'Không thể tải danh sách nhân viên từ máy chủ', 'error');
    }
  };

  useEffect(() => {
    loadStaff();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // New staff modal state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<Role>('therapist');
  const [newTitle, setNewTitle] = useState('');
  const [newDepartment, setNewDepartment] = useState('Spa & Wellness');

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
    if (!newName.trim() || !newEmail.trim()) {
      showToast('Name and email are required', 'error');
      return;
    }

    try {
      const result = await staffAccountsApi.create({
        fullName: newName.trim(),
        email: newEmail.trim(),
        role: newRole,
      });
      await loadStaff();
      setAddModalOpen(false);
      setTempCredential({ email: result.staff.email, password: result.temporaryPassword });
      setNewName('');
      setNewEmail('');
      setNewTitle('');
      showToast(t('operations.staffList.createdToast', 'Đã cấp tài khoản nhân viên và lưu vào cơ sở dữ liệu'), 'success');
    } catch (err: any) {
      showToast(err?.message || 'Không thể tạo tài khoản nhân viên', 'error');
    }
  };

  const handleQuickToggleStatus = async (staffId: string, currentStatus: string, staffName: string) => {
    const activate = currentStatus !== 'active';
    try {
      await staffAccountsApi.setStatus(staffId, activate);
      await loadStaff();
      showToast(
        activate
          ? `Đã khôi phục quyền truy cập: ${staffName}`
          : `Đã tạm khóa tài khoản nhân viên: ${staffName} (không thể đăng nhập / truy cập nữa)`,
        activate ? 'success' : 'info'
      );
    } catch (err: any) {
      showToast(err?.message || 'Không thể cập nhật trạng thái tài khoản', 'error');
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

  const getRoleLabel = (role: Role): string => {
    switch (role) {
      case 'admin': return 'Quản Trị Viên';
      case 'manager': return 'Quản Lý';
      case 'receptionist': return 'Lễ Tân';
      case 'therapist': return 'Trị Liệu Viên';
      case 'fb_staff': return 'Nhân Viên F&B';
      default: return 'Khách Hàng';
    }
  };

  return (
    <div style={{ padding: 'var(--space-6) var(--space-8)' }}>
      {/* Header */}
      <div className="hsw-gov-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-1)' }}>
              <h1 className="hsw-gov-title">
                {t('operations.staffList.pageTitle', 'Danh Sách Tài Khoản Nhân Viên')}
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
                {t('topbar.adminClearance', 'Quyền Quản Trị Hệ Thống')}
              </span>
            </div>
            <p className="hsw-gov-subtitle">
              {t('operations.staffList.pageSubtitle', 'Danh bạ nhân sự khu nghỉ dưỡng chính thức, phân quyền vai trò và trạng thái làm việc.')}
            </p>
          </div>

          <Button
            variant="primary"
            icon={<UserPlus size={16} />}
            onClick={() => setAddModalOpen(true)}
          >
            {t('operations.staffList.addStaffBtn', 'Cấp Tài Khoản Mới')}
          </Button>
        </div>
      </div>

      {/* Security & Data Minimization Banner */}
      <div className="hsw-gov-banner">
        <ShieldCheck size={18} style={{ color: 'var(--accent-forest)', flexShrink: 0, marginTop: '2px' }} />
        <div>
          <strong style={{ color: 'var(--text-primary)' }}>
            {t('operations.staffList.privacyBannerTitle', 'Kiểm Soát Truy Cập & Bảo Vệ Thông Tin Định Danh')}
          </strong>
          <span style={{ display: 'block', marginTop: '2px' }}>
            {t('operations.staffList.privacyBannerDesc', 'Mã băm mật khẩu, mã xác thực OAuth và thông tin bảo mật không bao giờ hiển thị trên giao diện quản trị nhân sự. Quyền hạn của nhân viên được điều chỉnh nghiêm ngặt theo ma trận RBAC.')}
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="hsw-gov-grid">
        <div className="hsw-gov-kpi">
          <span className="hsw-gov-kpi-label">{t('operations.staffList.totalStaff', 'Tổng Nhân Sự')}</span>
          <span className="hsw-gov-kpi-val">{staffList.length}</span>
          <span className="hsw-gov-kpi-sub">{t('operations.staffList.totalStaffSub', 'Nhân viên đang trong biên chế')}</span>
        </div>
        <div className="hsw-gov-kpi">
          <span className="hsw-gov-kpi-label">{t('operations.staffList.activeAccounts', 'Tài Khoản Hoạt Động')}</span>
          <span className="hsw-gov-kpi-val" style={{ color: 'var(--accent-forest)' }}>
            {staffList.filter((s) => s.status === 'active').length}
          </span>
          <span className="hsw-gov-kpi-sub">{t('operations.staffList.activeAccountsSub', 'Đủ điều kiện làm việc')}</span>
        </div>
        <div className="hsw-gov-kpi">
          <span className="hsw-gov-kpi-label">{t('operations.staffList.suspendedAccounts', 'Tài Khoản Tạm Dừng')}</span>
          <span className="hsw-gov-kpi-val" style={{ color: staffList.some(s => s.status === 'suspended') ? 'var(--danger)' : 'var(--text-muted)' }}>
            {staffList.filter((s) => s.status === 'suspended').length}
          </span>
          <span className="hsw-gov-kpi-sub">{t('operations.staffList.suspendedAccountsSub', 'Tạm thời thu hồi quyền truy cập')}</span>
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
                placeholder={t('operations.staffList.searchPlaceholder', 'Tìm tên nhân viên, email hoặc mã số...')}
                className="hsw-filter-input"
              />
            </div>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="hsw-filter-select"
            >
              <option value="all">{t('operations.staffList.filterAllRoles', 'Tất Cả Vai Trò')}</option>
              <option value="admin">{t('operations.sidebar.admin', 'Quản Trị Viên')}</option>
              <option value="manager">{t('operations.sidebar.manager', 'Quản Lý')}</option>
              <option value="receptionist">{t('common.roles.receptionist', 'Lễ Tân')}</option>
              <option value="therapist">{t('common.roles.therapist', 'Chuyên Viên Trị Liệu')}</option>
              <option value="fb_staff">{t('common.roles.fb_staff', 'Nhân Viên F&B / Bếp')}</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="hsw-filter-select"
            >
              <option value="all">{t('operations.staffList.filterAllStatuses', 'Tất Cả Trạng Thái')}</option>
              <option value="active">{t('common.status.active', 'Đang Hoạt Động')}</option>
              <option value="suspended">{t('common.status.suspended', 'Tạm Dừng')}</option>
            </select>
          </div>

          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
            {t('common.showing', 'Hiển thị')} <strong>{filteredStaff.length}</strong> / {staffList.length} {t('operations.staffList.personnelLabel', 'nhân sự')}
          </div>
        </div>
      </div>

      {/* Staff Table */}
      <div className="hsw-gov-card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="hsw-gov-table">
          <thead>
            <tr>
              <th>{t('operations.staffList.colMember', 'Nhân Viên')}</th>
              <th>{t('operations.staffList.colRole', 'Vai Trò Hệ Thống')}</th>
              <th>{t('operations.staffList.colDept', 'Bộ Phận')}</th>
              <th>{t('operations.staffList.colStatus', 'Trạng Thái')}</th>
              <th>{t('operations.staffList.colLastActive', 'Hoạt Động Gần Nhất')}</th>
              <th style={{ textAlign: 'right' }}>{t('common.actions.title', 'Thao Tác')}</th>
            </tr>
          </thead>
          <tbody>
            {filteredStaff.map((staff) => {
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
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{staff.email} · {staff.id}</div>
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
                      color: badgeStyle.text
                    }}>
                      {getRoleLabel(staff.role)}
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
                      backgroundColor: staff.status === 'active' ? '#7FFFD4' : '#fbeeed',
                      color: staff.status === 'active' ? '#004d40' : 'var(--danger)'
                    }}>
                      {staff.status === 'active' ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
                      {staff.status === 'active' ? 'HOẠT ĐỘNG' : 'TẠM DỪNG'}
                    </span>
                  </td>
                  <td style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                    {staff.lastActiveAt}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end' }}>
                      {staff.role !== 'admin' && (
                        <button
                          type="button"
                          onClick={() => handleQuickToggleStatus(staff.id, staff.status, staff.name)}
                          className="hsw-btn hsw-btn-sm"
                          style={{
                            padding: '3px 8px',
                            fontSize: '11px',
                            fontWeight: 600,
                            borderRadius: 'var(--radius-pill)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            backgroundColor: staff.status === 'active' ? '#fff5f5' : '#e6f7f2',
                            color: staff.status === 'active' ? 'var(--danger)' : '#00695c',
                            border: `1px solid ${staff.status === 'active' ? '#feb2b2' : '#80cbc4'}`,
                            cursor: 'pointer'
                          }}
                          title={staff.status === 'active' ? 'Tạm dừng / Khóa tài khoản' : 'Mở khóa / Kích hoạt lại'}
                        >
                          {staff.status === 'active' ? (
                            <>
                              <UserX size={12} />
                              <span>Khóa</span>
                            </>
                          ) : (
                            <>
                              <UserCheck size={12} />
                              <span>Mở khóa</span>
                            </>
                          )}
                        </button>
                      )}
                      <Link
                        to={`/admin/staff/${staff.id}`}
                        className="hsw-btn hsw-btn-tertiary hsw-btn-sm"
                        style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        {t('common.actions.view', 'Xem Chi Tiết')}
                        <ArrowRight size={13} />
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add Staff Modal */}
      {addModalOpen && (
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
                    {t('operations.staffList.titleLabel', 'Chức Danh / Vị Trí Công Việc')}
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
                <Button variant="secondary" onClick={() => setAddModalOpen(false)}>
                  {t('common.actions.cancel', 'Hủy Bỏ')}
                </Button>
                <Button variant="primary" type="submit">
                  {t('operations.staffList.confirmCreate', 'Xác Nhận Cấp Tài Khoản')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Temporary password shown once after creation */}
      {tempCredential && (
        <div className="hsw-gov-modal-backdrop" onClick={() => setTempCredential(null)}>
          <div className="hsw-gov-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="hsw-gov-modal-title">Tài khoản đã được tạo</h3>
            <p style={{ fontSize: 'var(--text-sm)' }}>
              Email đăng nhập: <strong>{tempCredential.email}</strong>
            </p>
            <p style={{ fontSize: 'var(--text-sm)' }}>
              Mật khẩu tạm thời (chỉ hiển thị một lần): <strong>{tempCredential.password}</strong>
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-4)' }}>
              <Button variant="primary" onClick={() => setTempCredential(null)}>Đã ghi lại</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
