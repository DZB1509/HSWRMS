import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  UserPlus,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  X
} from 'lucide-react';
import { INITIAL_STAFF_ACCOUNTS } from '../../data/mockStaff';
import type { StaffAccount } from '../../types/staff';
import type { Role } from '../../types/auth';
import { Button } from '../../components/common/Button';
import { useToast } from '../../components/common/Toast';

export const StaffAccountListPage: React.FC = () => {
  const { t } = useTranslation(['operations', 'common']);
  const { showToast } = useToast();

  const [staffList, setStaffList] = useState<StaffAccount[]>(INITIAL_STAFF_ACCOUNTS);
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

  const handleCreateStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) {
      showToast('Name and email are required', 'error');
      return;
    }

    const newId = `usr-${newRole.slice(0, 3)}-${Math.floor(10 + Math.random() * 90)}`;
    const initials = newName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    const nowStr = new Date().toISOString().split('T')[0];

    const newAccount: StaffAccount = {
      id: newId,
      name: newName.trim(),
      email: newEmail.trim(),
      role: newRole,
      title: newTitle.trim() || `${newRole.toUpperCase()} Professional`,
      department: newDepartment,
      status: 'active',
      joinedDate: nowStr,
      lastActiveAt: 'Just now',
      avatar: initials
    };

    setStaffList((prev) => [newAccount, ...prev]);
    setAddModalOpen(false);
    setNewName('');
    setNewEmail('');
    setNewTitle('');
    showToast(t('operations.staffList.createdToast', 'Staff account created successfully (client-side prototype)'), 'success');
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

  return (
    <div style={{ padding: 'var(--space-6) var(--space-8)' }}>
      {/* Header */}
      <div className="hsw-gov-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-1)' }}>
              <h1 className="hsw-gov-title">
                {t('operations.staffList.pageTitle', 'Staff Account Management Directory')}
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
                {t('topbar.adminClearance', 'Administrator Clearance')}
              </span>
            </div>
            <p className="hsw-gov-subtitle">
              {t('operations.staffList.pageSubtitle', 'Official administrative roster of resort personnel, role authorizations, and operational clearance.')}
            </p>
          </div>

          <Button
            variant="primary"
            icon={<UserPlus size={16} />}
            onClick={() => setAddModalOpen(true)}
          >
            {t('operations.staffList.addStaffBtn', 'Provision Staff Account')}
          </Button>
        </div>
      </div>

      {/* Security & Data Minimization Banner */}
      <div className="hsw-gov-banner">
        <ShieldCheck size={18} style={{ color: 'var(--accent-forest)', flexShrink: 0, marginTop: '2px' }} />
        <div>
          <strong style={{ color: 'var(--text-primary)' }}>
            {t('operations.staffList.privacyBannerTitle', 'Access Control & Credential Protection')}
          </strong>
          <span style={{ display: 'block', marginTop: '2px' }}>
            {t('operations.staffList.privacyBannerDesc', 'Password hashes, OAuth tokens, and authentication secrets are never exposed in staff management interfaces. Personnel permissions are strictly governed by the system RBAC matrix.')}
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="hsw-gov-grid">
        <div className="hsw-gov-kpi">
          <span className="hsw-gov-kpi-label">{t('operations.staffList.totalStaff', 'Total Personnel')}</span>
          <span className="hsw-gov-kpi-val">{staffList.length}</span>
          <span className="hsw-gov-kpi-sub">{t('operations.staffList.totalStaffSub', 'Active on-duty staff members')}</span>
        </div>
        <div className="hsw-gov-kpi">
          <span className="hsw-gov-kpi-label">{t('operations.staffList.activeAccounts', 'Active Accounts')}</span>
          <span className="hsw-gov-kpi-val" style={{ color: 'var(--accent-forest)' }}>
            {staffList.filter((s) => s.status === 'active').length}
          </span>
          <span className="hsw-gov-kpi-sub">{t('operations.staffList.activeAccountsSub', 'Authorized for duty')}</span>
        </div>
        <div className="hsw-gov-kpi">
          <span className="hsw-gov-kpi-label">{t('operations.staffList.suspendedAccounts', 'Suspended Accounts')}</span>
          <span className="hsw-gov-kpi-val" style={{ color: staffList.some(s => s.status === 'suspended') ? 'var(--danger)' : 'var(--text-muted)' }}>
            {staffList.filter((s) => s.status === 'suspended').length}
          </span>
          <span className="hsw-gov-kpi-sub">{t('operations.staffList.suspendedAccountsSub', 'Access temporarily revoked')}</span>
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
                placeholder={t('operations.staffList.searchPlaceholder', 'Search staff name, email, or ID...')}
                className="hsw-filter-input"
              />
            </div>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="hsw-filter-select"
            >
              <option value="all">{t('operations.staffList.filterAllRoles', 'All Roles')}</option>
              <option value="admin">{t('operations.sidebar.admin', 'Admin')}</option>
              <option value="manager">{t('operations.sidebar.manager', 'Manager')}</option>
              <option value="receptionist">{t('common.roles.receptionist', 'Receptionist')}</option>
              <option value="therapist">{t('common.roles.therapist', 'Therapist')}</option>
              <option value="fb_staff">{t('common.roles.fb_staff', 'F&B Staff / Chef')}</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="hsw-filter-select"
            >
              <option value="all">{t('operations.staffList.filterAllStatuses', 'All Statuses')}</option>
              <option value="active">{t('common.status.active', 'Active')}</option>
              <option value="suspended">{t('common.status.suspended', 'Suspended')}</option>
            </select>
          </div>

          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
            {t('common.showing', 'Showing')} <strong>{filteredStaff.length}</strong> / {staffList.length} {t('operations.staffList.personnelLabel', 'personnel')}
          </div>
        </div>
      </div>

      {/* Staff Table */}
      <div className="hsw-gov-card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="hsw-gov-table">
          <thead>
            <tr>
              <th>{t('operations.staffList.colMember', 'Staff Member')}</th>
              <th>{t('operations.staffList.colRole', 'Assigned Role')}</th>
              <th>{t('operations.staffList.colDept', 'Department')}</th>
              <th>{t('operations.staffList.colStatus', 'Status')}</th>
              <th>{t('operations.staffList.colLastActive', 'Last Activity')}</th>
              <th style={{ textAlign: 'right' }}>{t('common.actions.title', 'Action')}</th>
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
                      color: badgeStyle.text,
                      textTransform: 'capitalize'
                    }}>
                      {staff.role.replace('_', ' ')}
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
                      {staff.status.toUpperCase()}
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
                      {t('common.actions.view', 'View Detail')}
                      <ArrowRight size={13} />
                    </Link>
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
                {t('operations.staffList.modalTitle', 'Provision New Staff Account')}
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
                    {t('common.forms.fullName', 'Full Name')} *
                  </label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Tran Bao Ngoc"
                    className="hsw-filter-input"
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: 'var(--space-1)' }}>
                    {t('common.forms.email', 'Work Email')} *
                  </label>
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="e.g. ngoc.tran@heavenstay.com"
                    className="hsw-filter-input"
                    style={{ width: '100%' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: 'var(--space-1)' }}>
                      {t('operations.staffList.colRole', 'Role Authorization')}
                    </label>
                    <select
                      value={newRole}
                      onChange={(e) => {
                        const r = e.target.value as Role;
                        setNewRole(r);
                        if (r === 'therapist') setNewDepartment('Spa & Wellness');
                        else if (r === 'receptionist') setNewDepartment('Front Office');
                        else if (r === 'fb_staff') setNewDepartment('Dietary Food & Beverage');
                        else if (r === 'manager') setNewDepartment('Resort Management');
                        else if (r === 'admin') setNewDepartment('Information Systems');
                      }}
                      className="hsw-filter-select"
                      style={{ width: '100%' }}
                    >
                      <option value="receptionist">Receptionist</option>
                      <option value="therapist">Spa Therapist / Yoga Instructor</option>
                      <option value="fb_staff">F&B Staff / Chef</option>
                      <option value="manager">Manager</option>
                      <option value="admin">System Administrator</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: 'var(--space-1)' }}>
                      {t('operations.staffList.colDept', 'Department')}
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
                    {t('operations.staffList.titleLabel', 'Position / Job Title')}
                  </label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Certified Ayurvedic Practitioner"
                    className="hsw-filter-input"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-5)' }}>
                <Button variant="secondary" onClick={() => setAddModalOpen(false)}>
                  {t('common.actions.cancel', 'Cancel')}
                </Button>
                <Button variant="primary" type="submit">
                  {t('operations.staffList.confirmCreate', 'Provision Account')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
