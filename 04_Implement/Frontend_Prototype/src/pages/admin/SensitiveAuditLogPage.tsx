import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldCheck } from 'lucide-react';
import { useGovernance } from '../../hooks/useGovernance';
import { OperationalPagination } from '../../components/operations/OperationalPagination';

export const SensitiveAuditLogPage: React.FC = () => {
  const { t } = useTranslation(['operations', 'common']);
  const { auditEvents } = useGovernance();

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterResult, setFilterResult] = useState<string>('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Filter evaluation
  const filteredEvents = auditEvents.filter((evt) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchesRef = evt.targetRef.toLowerCase().includes(q);
      const matchesActor = evt.actorName.toLowerCase().includes(q);
      const matchesDetails = evt.detailsFallback.toLowerCase().includes(q);
      if (!matchesRef && !matchesActor && !matchesDetails) return false;
    }

    if (filterCategory !== 'all' && evt.dataCategory !== filterCategory) {
      return false;
    }

    if (filterRole !== 'all' && evt.actorRole !== filterRole) {
      return false;
    }

    if (filterResult !== 'all' && evt.result !== filterResult) {
      return false;
    }

    return true;
  });

  const totalItems = filteredEvents.length;
  const paginatedEvents = filteredEvents.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div style={{ padding: 'var(--space-6) var(--space-8)' }}>
      {/* Header */}
      <div className="hsw-gov-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-1)' }}>
          <h1 className="hsw-gov-title">
            {t('operations.audit.pageTitle', 'Sensitive Data Access & Governance Audit Log')}
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
          {t('operations.audit.pageSubtitle', 'Read-only chronological audit history (append-only prototype semantics) recording access metadata, identity verification events, and governance transitions modeled around Decree 13 and Law on Residence requirements.')}
        </p>
      </div>

      {/* Strict Data Minimization Banner */}
      <div className="hsw-gov-banner privacy">
        <ShieldCheck size={18} style={{ color: 'var(--accent-terracotta)', flexShrink: 0, marginTop: '2px' }} />
        <div>
          <strong style={{ color: 'var(--text-primary)' }}>
            {t('operations.audit.minimizationTitle', 'Strict Metadata Logging & Sensitive Data Minimization')}
          </strong>
          <span style={{ display: 'block', marginTop: '2px' }}>
            {t('operations.audit.minimizationDesc', 'To protect customer confidentiality, this audit log records access metadata and pseudonymous references only. Raw health diagnoses, specific allergy symptoms, passport/identity numbers, and payment credentials are NEVER stored or exposed in audit records.')}
          </span>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="hsw-gov-card" style={{ marginBottom: 'var(--space-4)', padding: 'var(--space-3) var(--space-4)' }}>
        <div className="hsw-filter-toolbar" style={{ margin: 0, justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
            {/* Search Input */}
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder={t('operations.audit.searchPlaceholder', 'Search target ref or actor...')}
                className="hsw-filter-input"
              />
            </div>

            {/* Category Filter */}
            <select
              value={filterCategory}
              onChange={(e) => {
                setFilterCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="hsw-filter-select"
            >
              <option value="all">{t('operations.audit.allCategories', 'All Categories')}</option>
              <option value="HEALTH_WELLNESS">HEALTH_WELLNESS</option>
              <option value="RESIDENCE_IDENTITY">RESIDENCE_IDENTITY</option>
              <option value="DIETARY_ALLERGY">DIETARY_ALLERGY</option>
              <option value="PAYMENT_TRANSACTION">PAYMENT_TRANSACTION</option>
              <option value="SECURITY_GOVERNANCE">SECURITY_GOVERNANCE</option>
            </select>

            {/* Role Filter */}
            <select
              value={filterRole}
              onChange={(e) => {
                setFilterRole(e.target.value);
                setCurrentPage(1);
              }}
              className="hsw-filter-select"
            >
              <option value="all">{t('operations.audit.allRoles', 'All Actor Roles')}</option>
              <option value="customer">Customer</option>
              <option value="receptionist">Receptionist</option>
              <option value="therapist">Therapist</option>
              <option value="fb_staff">F&B Staff / Chef</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>

            {/* Result Filter */}
            <select
              value={filterResult}
              onChange={(e) => {
                setFilterResult(e.target.value);
                setCurrentPage(1);
              }}
              className="hsw-filter-select"
            >
              <option value="all">{t('operations.audit.allResults', 'All Outcomes')}</option>
              <option value="SUCCESS">SUCCESS</option>
              <option value="DENIED">DENIED (RBAC Block)</option>
            </select>
          </div>

          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
            {totalItems} {t('operations.audit.eventsMatched', 'events recorded')}
          </span>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="hsw-gov-card">
        <div className="hsw-matrix-table-wrap">
          <table className="hsw-matrix-table">
            <thead>
              <tr>
                <th>{t('operations.audit.colEventId', 'Event ID')}</th>
                <th>{t('operations.audit.colTimestamp', 'Timestamp')}</th>
                <th>{t('operations.audit.colActor', 'Actor & Role')}</th>
                <th>{t('operations.audit.colAction', 'Action')}</th>
                <th>{t('operations.audit.colCategory', 'Category')}</th>
                <th>{t('operations.audit.colTargetRef', 'Target Ref')}</th>
                <th>{t('operations.audit.colResult', 'Result')}</th>
                <th>{t('operations.audit.colDetails', 'Metadata Context')}</th>
              </tr>
            </thead>
            <tbody>
              {paginatedEvents.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--text-muted)' }}>
                    {t('operations.audit.noEvents', 'No audit events found matching the specified search and filter criteria.')}
                  </td>
                </tr>
              ) : (
                paginatedEvents.map((evt) => {
                  const isSuccess = evt.result === 'SUCCESS';

                  return (
                    <tr key={evt.id}>
                      <td>
                        <code style={{ fontWeight: 600, fontSize: '11px' }}>{evt.id}</code>
                      </td>
                      <td style={{ whiteSpace: 'nowrap', fontSize: '11px', color: 'var(--text-secondary)' }}>
                        {evt.timestamp}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{evt.actorName}</div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                          {evt.actorRole} · {evt.actorId}
                        </div>
                      </td>
                      <td>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: 600,
                          backgroundColor: '#f2f0ea',
                          padding: '2px 6px',
                          borderRadius: '3px',
                          color: 'var(--text-primary)'
                        }}>
                          {evt.action}
                        </span>
                      </td>
                      <td>
                        <span className="hsw-audit-cat">{evt.dataCategory}</span>
                      </td>
                      <td>
                        <code style={{ fontSize: '11px', fontWeight: 600 }}>{evt.targetRef}</code>
                      </td>
                      <td>
                        <span className={`hsw-audit-pill ${isSuccess ? 'success' : 'denied'}`}>
                          {evt.result}
                        </span>
                      </td>
                      <td style={{ maxWidth: '320px', fontSize: '11px', color: 'var(--text-primary)', lineHeight: 1.4 }}>
                        {t(evt.detailsKey, evt.detailsFallback)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {totalItems > pageSize && (
          <div style={{ marginTop: 'var(--space-4)' }}>
            <OperationalPagination
              currentPage={currentPage}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
              pageSizeOptions={[10, 25, 50]}
            />
          </div>
        )}
      </div>
    </div>
  );
};
