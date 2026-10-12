import React, { useState } from 'react';
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
import type { StaffAccount, StaffStatus } from '../../types/staff';
import type { Role } from '../../types/auth';
import { Button } from '../../components/common/Button';
import { useToast } from '../../components/common/Toast';

export const StaffAccountDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation(['operations', 'common']);
  const { showToast } = useToast();

  const initialStaff = INITIAL_STAFF_ACCOUNTS.find((s) => s.id === id) || INITIAL_STAFF_ACCOUNTS[0];
  const [staff, setStaff] = useState<StaffAccount>(initialStaff);
  const [statusModalOpen, setStatusModalOpen] = useState(false);

  const toggleStatus = () => {
    const nextStatus: StaffStatus = staff.status === 'active' ? 'suspended' : 'active';
    setStaff((prev) => ({ ...prev, status: nextStatus }));
    setStatusModalOpen(false);
    showToast(
      nextStatus === 'active'
        ? t('operations.staffDetail.reactivatedToast', 'Staff account access restored to Active')
        : t('operations.staffDetail.suspendedToast', 'Staff account access temporarily suspended'),
      nextStatus === 'active' ? 'success' : 'info'
    );
  };

  const getRoleScopeDescription = (role: Role) => {
    switch (role) {
      case 'admin':
        return {
          title: t('operations.staffDetail.scopeAdminTitle', 'System Administration & Governance Authority'),
          desc: t('operations.staffDetail.scopeAdminDesc', 'Full clearance to manage master data, configure business parameters, maintain the RBAC matrix, and audit sensitive data access logs.'),
          minimization: t('operations.staffDetail.scopeAdminMin', 'Administrative governance does not grant access to raw medical records or customer payment card credentials.')
        };
      case 'manager':
        return {
          title: t('operations.staffDetail.scopeManagerTitle', 'Executive Management & Operational Analytics Authority'),
          desc: t('operations.staffDetail.scopeManagerDesc', 'Authorized for high-level executive revenue reporting, villa occupancy statistics, therapist utilization, and system operational health.'),
          minimization: t('operations.staffDetail.scopeManagerMin', 'Strictly read-only analytical access. Manager cannot access individual medical files or override checkout billing.')
        };
      case 'receptionist':
        return {
          title: t('operations.staffDetail.scopeRecTitle', 'Front Desk & Customer Accommodation Authority'),
          desc: t('operations.staffDetail.scopeRecDesc', 'Authorized to manage daily arrivals, collect residence identification, assign physical villas, post extra spa services, and generate consolidated checkout folios.'),
          minimization: t('operations.staffDetail.scopeRecMin', 'Protected health data is minimized; receptionist cannot access medical diagnosis records.')
        };
      case 'therapist':
        return {
          title: t('operations.staffDetail.scopeThTitle', 'Spa Therapy & Physical Wellness Authority'),
          desc: t('operations.staffDetail.scopeThDesc', 'Clearance to view assigned daily treatment sessions, update session outcomes (Completed/No-Show), and access treatment-relevant physical notes.'),
          minimization: t('operations.staffDetail.scopeThMin', 'Therapist sees strictly physical contraindications (injuries, allergies) and only for assigned customers (BR-03).')
        };
      case 'fb_staff':
        return {
          title: t('operations.staffDetail.scopeFbTitle', 'Dietary Culinary & Kitchen Operations Authority'),
          desc: t('operations.staffDetail.scopeFbDesc', 'Clearance to inspect daily meal preparation queues, update meal preparation progress, and fulfill extra a-la-carte dining orders.'),
          minimization: t('operations.staffDetail.scopeFbMin', 'Culinary team sees strictly food-related allergy and dietary warnings without access to medical history (BR-03).')
        };
      default:
        return {
          title: 'Standard Access',
          desc: 'Basic portal access.',
          minimization: 'Data minimization applies.'
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
          {t('operations.staffDetail.backToList', 'Back to Staff Directory')}
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
                  {staff.status.toUpperCase()}
                </span>
              </div>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                {staff.title} · <span style={{ textTransform: 'capitalize' }}>{staff.department}</span>
              </p>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Account Identifier: <code>{staff.id}</code>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <Button
              variant={staff.status === 'active' ? 'destructive' : 'primary'}
              size="sm"
              icon={staff.status === 'active' ? <UserX size={14} /> : <UserCheck size={14} />}
              onClick={() => setStatusModalOpen(true)}
            >
              {staff.status === 'active'
                ? t('operations.staffDetail.suspendBtn', 'Suspend Account Access')
                : t('operations.staffDetail.activateBtn', 'Restore Account Access')}
            </Button>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)' }}>
        {/* Left Column: Official Personnel & Contact Information */}
        <div className="hsw-gov-card" style={{ marginBottom: 0 }}>
          <div className="hsw-gov-card-header">
            <h2 className="hsw-gov-card-title">
              <Building size={18} style={{ color: 'var(--accent-forest)' }} />
              {t('operations.staffDetail.contactSectionTitle', 'Operational Profile & Contact Metadata')}
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', fontSize: 'var(--text-xs)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-2) 0', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Mail size={13} /> {t('common.forms.email', 'Work Email')}
              </span>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{staff.email}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-2) 0', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Phone size={13} /> {t('common.forms.phone', 'Internal Telephone Extension')}
              </span>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{staff.phone || '+84 258 399 1000'}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-2) 0', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Building size={13} /> {t('operations.staffList.colDept', 'Assigned Department')}
              </span>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{staff.department}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-2) 0', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Calendar size={13} /> {t('operations.staffDetail.joinedDate', 'Provisions Date')}
              </span>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{staff.joinedDate}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-2) 0' }}>
              <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={13} /> {t('operations.staffList.colLastActive', 'Last Activity Recorded')}
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
              {t('operations.staffDetail.rbacScopeTitle', 'RBAC Operational Clearance Scope')}
            </h2>
          </div>

          <div style={{ padding: 'var(--space-3)', backgroundColor: '#faf9f6', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', marginBottom: 'var(--space-4)' }}>
            <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 var(--space-1) 0' }}>
              {scopeInfo.title}
            </h3>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
              {scopeInfo.desc}
            </p>
          </div>

          <div style={{ padding: 'var(--space-3)', backgroundColor: '#faf5f3', borderRadius: 'var(--radius-sm)', border: '1px solid #f0ded6' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-2)' }}>
              <ShieldAlert size={16} style={{ color: 'var(--accent-terracotta)', flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ fontSize: 'var(--text-xs)', color: 'var(--text-primary)' }}>
                  {t('operations.staffDetail.minimizationRuleTitle', 'BR-03 Data Minimization Protection')}
                </strong>
                <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '2px 0 0 0', lineHeight: 1.4 }}>
                  {scopeInfo.minimization}
                </p>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 'var(--space-4)', padding: 'var(--space-2) 0', borderTop: '1px solid var(--border-subtle)', fontSize: '11px', color: 'var(--text-muted)' }}>
            <Lock size={12} style={{ display: 'inline', marginRight: '4px' }} />
            {t('operations.staffDetail.credentialSafetyNotice', 'Authentication hashes, password credentials, and session tokens are strictly managed in identity layers and not stored on personnel cards.')}
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Status Toggle */}
      {statusModalOpen && (
        <div className="hsw-gov-modal-backdrop" onClick={() => setStatusModalOpen(false)}>
          <div className="hsw-gov-modal" onClick={(e) => e.stopPropagation()}>
            <div className="hsw-gov-modal-header">
              <h3 className="hsw-gov-modal-title">
                {staff.status === 'active' ? <AlertTriangle size={18} style={{ color: 'var(--danger)' }} /> : <CheckCircle2 size={18} style={{ color: 'var(--accent-forest)' }} />}
                {staff.status === 'active'
                  ? t('operations.staffDetail.confirmSuspendTitle', 'Confirm Account Suspension')
                  : t('operations.staffDetail.confirmRestoreTitle', 'Confirm Account Restoration')}
              </h3>
            </div>

            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 'var(--space-3) 0' }}>
              {staff.status === 'active'
                ? t('operations.staffDetail.confirmSuspendDesc', 'Suspending this staff account will immediately revoke their access clearance to operational systems. Existing scheduled sessions or assignments will remain attached for administrative review.')
                : t('operations.staffDetail.confirmRestoreDesc', 'Restoring this staff account will reinstate their operational privileges according to their assigned RBAC role.')}
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-5)' }}>
              <Button variant="secondary" onClick={() => setStatusModalOpen(false)}>
                {t('common.actions.cancel', 'Cancel')}
              </Button>
              <Button
                variant={staff.status === 'active' ? 'destructive' : 'primary'}
                onClick={toggleStatus}
              >
                {staff.status === 'active'
                  ? t('operations.staffDetail.btnExecuteSuspend', 'Execute Suspension')
                  : t('operations.staffDetail.btnExecuteRestore', 'Reinstate Access')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
