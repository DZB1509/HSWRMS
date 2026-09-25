import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Search,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import { useOperations } from '../../context/OperationsContext';
import { OperationalPageHeader } from '../../components/operations/OperationalPageHeader';
import { OperationalStatusChip } from '../../components/operations/OperationalStatusChip';
import { ResidenceDeclarationSummary } from '../../components/operations/ResidenceDeclarationSummary';

export const DailyArrivalsPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { arrivals, todayDate } = useOperations();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [readinessFilter, setReadinessFilter] = useState<string>('all');

  const currentLang = (i18n.language || 'en') as 'en' | 'vi' | 'zh-CN' | 'ja' | 'fr';

  // Filtered & sorted arrivals
  const filteredArrivals = useMemo(() => {
    return arrivals.filter((arrival) => {
      // Search
      const search = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !search ||
        arrival.customerName.toLowerCase().includes(search) ||
        arrival.bookingReference.toLowerCase().includes(search) ||
        arrival.customerPhone.includes(search) ||
        (arrival.assignedVillaNumber && arrival.assignedVillaNumber.toLowerCase().includes(search));

      // Arrival status filter
      const matchesStatus =
        statusFilter === 'all' || arrival.arrivalStatus === statusFilter;

      // Villa readiness filter
      const matchesReadiness =
        readinessFilter === 'all' ||
        (readinessFilter === 'unassigned' && !arrival.assignedVillaId) ||
        arrival.villaReadiness === readinessFilter;

      return matchesSearch && matchesStatus && matchesReadiness;
    }).sort((a, b) => a.expectedArrivalTime.localeCompare(b.expectedArrivalTime));
  }, [arrivals, searchTerm, statusFilter, readinessFilter]);

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto' }}>
      {/* Header */}
      <OperationalPageHeader
        title={t('operations.arrivals.title', 'Daily Arrivals & Check-In Queue')}
        subtitle={t('operations.arrivals.subtitle', 'Monitor expected customer arrivals, review villa assignments, and verify check-in readiness.')}
        badge="Screen #21"
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
              {todayDate}
            </span>
          </div>
        }
      />

      {/* Residence Declaration Summary Bar */}
      <ResidenceDeclarationSummary />

      {/* Search & Filter Toolbar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--space-3)',
          padding: 'var(--space-4)',
          backgroundColor: 'var(--surface)',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-subtle)',
          marginBottom: 'var(--space-4)',
        }}
      >
        {/* Search Input */}
        <div style={{ position: 'relative', flex: '1 1 280px', maxWidth: '420px' }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-tertiary)',
            }}
          />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('operations.arrivals.searchPlaceholder', 'Search customer name, booking reference (e.g. HSW-84920)...')}
            style={{
              width: '100%',
              height: '38px',
              paddingLeft: '36px',
              paddingRight: '12px',
              fontSize: 'var(--text-xs)',
              borderRadius: 'var(--radius-xs)',
              border: '1px solid var(--border-strong)',
              backgroundColor: 'var(--bg-canvas)',
              color: 'var(--text-primary)',
              outline: 'none',
            }}
          />
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
          {/* Status Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>
              {t('operations.arrivals.filterArrivalStatus', 'Status')}:
            </span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                height: '34px',
                padding: '0 var(--space-3)',
                fontSize: 'var(--text-xs)',
                borderRadius: 'var(--radius-xs)',
                border: '1px solid var(--border-strong)',
                backgroundColor: 'var(--bg-canvas)',
                color: 'var(--text-primary)',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="all">{t('operations.common.all', 'All Statuses')}</option>
              <option value="expected">{t('operations.statuses.expected', 'Expected')}</option>
              <option value="arrived">{t('operations.statuses.arrived', 'Arrived')}</option>
              <option value="checked_in">{t('operations.statuses.checked_in', 'Checked In')}</option>
              <option value="delayed">{t('operations.statuses.delayed', 'Delayed')}</option>
            </select>
          </div>

          {/* Villa Readiness Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>
              {t('operations.arrivals.filterVillaReadiness', 'Villa')}:
            </span>
            <select
              value={readinessFilter}
              onChange={(e) => setReadinessFilter(e.target.value)}
              style={{
                height: '34px',
                padding: '0 var(--space-3)',
                fontSize: 'var(--text-xs)',
                borderRadius: 'var(--radius-xs)',
                border: '1px solid var(--border-strong)',
                backgroundColor: 'var(--bg-canvas)',
                color: 'var(--text-primary)',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="all">{t('operations.common.all', 'All Villa States')}</option>
              <option value="ready">{t('operations.statuses.ready', 'Ready')}</option>
              <option value="cleaning">{t('operations.statuses.cleaning', 'Cleaning')}</option>
              <option value="unassigned">{t('operations.common.notAssigned', 'Not Assigned')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Arrivals Table / List */}
      <div
        style={{
          backgroundColor: 'var(--surface)',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-subtle)',
          overflow: 'hidden',
        }}
      >
        {filteredArrivals.length === 0 ? (
          <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <AlertCircle size={32} style={{ margin: '0 auto 8px', color: 'var(--text-tertiary)' }} />
            <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>
              {t('operations.arrivals.noArrivalsFound', 'No arrivals match the selected filter criteria.')}
            </div>
            <div style={{ fontSize: 'var(--text-xs)', marginTop: '4px' }}>
              {t('operations.arrivals.emptySearchHelper', 'Try adjusting your search terms or clearing the status filters.')}
            </div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-xs)' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-soft)', textAlign: 'left', borderBottom: '1px solid var(--border-subtle)' }}>
                  <th style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    {t('operations.common.eta', 'ETA')}
                  </th>
                  <th style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    {t('operations.common.customer', 'Customer')}
                  </th>
                  <th style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    {t('operations.common.bookingRef', 'Booking Ref')}
                  </th>
                  <th style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    {t('operations.common.retreat', 'Retreat')}
                  </th>
                  <th style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    {t('operations.common.dates', 'Stay Dates')}
                  </th>
                  <th style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    {t('operations.common.deposit', 'Deposit')}
                  </th>
                  <th style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    {t('operations.common.villa', 'Villa Assignment')}
                  </th>
                  <th style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    {t('operations.common.status', 'Arrival Status')}
                  </th>
                  <th style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    {t('operations.common.residenceDecl', 'Residence Decl.')}
                  </th>
                  <th style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'right' }}>
                    {t('operations.common.action', 'Action')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredArrivals.map((arrival) => {
                  const retreatTitle =
                    typeof arrival.retreatName === 'object'
                      ? arrival.retreatName[currentLang] || arrival.retreatName.en
                      : arrival.retreatName;

                  return (
                    <tr
                      key={arrival.id}
                      style={{
                        borderBottom: '1px solid var(--border-subtle)',
                        transition: 'background-color 150ms ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-canvas)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      {/* ETA */}
                      <td style={{ padding: '14px', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                        {arrival.expectedArrivalTime}
                        {arrival.actualArrivalTime && (
                          <div style={{ fontSize: '10px', color: '#1B5E20', fontWeight: 500 }}>
                            {t('operations.common.arrivedAt', { time: arrival.actualArrivalTime, defaultValue: `Arrived ${arrival.actualArrivalTime}` })}
                          </div>
                        )}
                      </td>

                      {/* Customer */}
                      <td style={{ padding: '14px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          {arrival.customerName}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                          {arrival.partySize === 1
                            ? t('operations.common.customerSolo', '1 Customer (Solo)')
                            : t('operations.common.customerCount', { count: arrival.partySize, defaultValue: `${arrival.partySize} Customers` })} • {arrival.customerPhone}
                        </div>
                      </td>

                      {/* Booking Ref */}
                      <td style={{ padding: '14px', fontFamily: 'monospace', fontWeight: 600, color: 'var(--accent-forest)' }}>
                        {arrival.bookingReference}
                      </td>

                      {/* Retreat */}
                      <td style={{ padding: '14px', maxWidth: '170px' }}>
                        <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 500 }} title={retreatTitle}>
                          {retreatTitle}
                        </div>
                        <div style={{ fontSize: '10px', color: 'var(--accent-olive)' }}>
                          {t('operations.common.nightsRetreat', { count: arrival.nights, defaultValue: `${arrival.nights} Nights Retreat` })}
                        </div>
                      </td>

                      {/* Dates */}
                      <td style={{ padding: '14px', whiteSpace: 'nowrap', color: 'var(--text-secondary)' }}>
                        <div>{arrival.startDate}</div>
                        <div style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>
                          {t('operations.common.toDate', { date: arrival.endDate, defaultValue: `to ${arrival.endDate}` })}
                        </div>
                      </td>

                      {/* Deposit Status */}
                      <td style={{ padding: '14px' }}>
                        <OperationalStatusChip type="deposit" status={arrival.depositStatus} size="sm" />
                      </td>

                      {/* Assigned Villa & Readiness */}
                      <td style={{ padding: '14px' }}>
                        {arrival.assignedVillaNumber ? (
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                              {arrival.assignedVillaNumber}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                              <span
                                style={{
                                  fontSize: '10px',
                                  fontWeight: 600,
                                  textTransform: 'capitalize',
                                  color:
                                    arrival.villaReadiness === 'ready'
                                      ? '#1B5E20'
                                      : arrival.villaReadiness === 'cleaning'
                                      ? '#B26A00'
                                      : '#C62828',
                                }}
                              >
                                {t(`operations.statuses.${arrival.villaReadiness}`, arrival.villaReadiness)}
                              </span>
                              <Link
                                to={`/receptionist/check-in/${arrival.bookingReference}/villa`}
                                style={{ fontSize: '10px', textDecoration: 'underline', color: 'var(--text-tertiary)' }}
                              >
                                {t('operations.common.change', 'Change')}
                              </Link>
                            </div>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                            <span style={{ color: '#C62828', fontWeight: 600, fontSize: '11px' }}>
                              {t('operations.common.notAssigned', 'Not Assigned')}
                            </span>
                            <Link
                              to={`/receptionist/check-in/${arrival.bookingReference}/villa`}
                              style={{
                                fontSize: '11px',
                                fontWeight: 600,
                                color: 'var(--accent-forest)',
                                textDecoration: 'underline',
                              }}
                            >
                              {t('operations.common.assignNow', 'Assign Now')}
                            </Link>
                          </div>
                        )}
                      </td>

                      {/* Arrival Status */}
                      <td style={{ padding: '14px' }}>
                        <OperationalStatusChip type="arrival" status={arrival.arrivalStatus} size="sm" />
                      </td>

                      {/* Residence Declaration */}
                      <td style={{ padding: '14px' }}>
                        <OperationalStatusChip type="residence" status={arrival.residenceDeclarationStatus} size="sm" />
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '14px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        {arrival.arrivalStatus === 'checked_in' ? (
                          <button
                            type="button"
                            onClick={() => navigate(`/receptionist/check-in/${arrival.bookingReference}`)}
                            className="hsw-btn hsw-btn-secondary"
                            style={{ minHeight: '32px', padding: '0 10px', fontSize: '11px' }}
                          >
                            <span>{t('operations.common.viewDetails', 'View Details')}</span>
                          </button>
                        ) : !arrival.assignedVillaId ? (
                          <button
                            type="button"
                            onClick={() => navigate(`/receptionist/check-in/${arrival.bookingReference}/villa`)}
                            className="hsw-btn hsw-btn-secondary"
                            style={{ minHeight: '32px', padding: '0 10px', fontSize: '11px', color: 'var(--accent-forest)' }}
                          >
                            <span>{t('operations.arrivals.assignVilla', 'Assign Villa')}</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => navigate(`/receptionist/check-in/${arrival.bookingReference}`)}
                            className="hsw-btn hsw-btn-primary"
                            style={{ minHeight: '32px', padding: '0 12px', fontSize: '11px' }}
                          >
                            <span>{t('operations.arrivals.startCheckIn', 'Check-In')}</span>
                            <ArrowRight size={12} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
