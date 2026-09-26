import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Users,
  CheckCircle2,
  Clock,
  Home,
  Brush,
  ArrowRight,
  Sparkles,
  BedDouble,
  Wrench,
  BookmarkCheck,
} from 'lucide-react';
import { useOperations } from '../../context/OperationsContext';
import { OperationalPageHeader } from '../../components/operations/OperationalPageHeader';
import { OperationalStatusChip } from '../../components/operations/OperationalStatusChip';
import { OperationalAlertBanner } from '../../components/operations/OperationalAlertBanner';
import { ResidenceDeclarationSummary } from '../../components/operations/ResidenceDeclarationSummary';

export const ReceptionistDashboardPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { arrivals, villas, todayDate, alerts } = useOperations();

  // Metrics
  const totalArrivals = arrivals.length;
  const checkedInCount = arrivals.filter((a) => a.arrivalStatus === 'checked_in').length;
  const pendingCheckIns = arrivals.filter((a) => a.arrivalStatus !== 'checked_in').length;
  const occupiedVillas = villas.filter((v) => v.status === 'occupied').length;
  const cleaningVillas = villas.filter((v) => v.status === 'cleaning').length;
  const readyVillas = villas.filter((v) => v.status === 'ready').length;
  const maintenanceVillas = villas.filter((v) => v.status === 'maintenance').length;
  const reservedVillas = villas.filter((v) => v.status === 'reserved').length;

  const currentLang = (i18n.language || 'en') as 'en' | 'vi' | 'zh-CN' | 'ja' | 'fr';

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto' }}>
      {/* Page Header */}
      <OperationalPageHeader
        title={t('operations.dashboard.title', 'Front Desk & Receptionist Operations')}
        subtitle={t('operations.dashboard.subtitle', 'Daily arrival queue, residence compliance, and resort villa allocations.')}
        badge="Screen #20"
        actions={
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <Link
              to="/receptionist/arrivals"
              className="hsw-btn hsw-btn-primary"
              style={{ fontSize: 'var(--text-xs)', minHeight: '38px' }}
            >
              <span>{t('operations.dashboard.viewAllArrivals', 'View Daily Arrivals')}</span>
              <ArrowRight size={14} />
            </Link>
            <Link
              to="/receptionist/villas"
              className="hsw-btn hsw-btn-secondary"
              style={{ fontSize: 'var(--text-xs)', minHeight: '38px' }}
            >
              <span>{t('operations.dashboard.manageVillas', 'Manage Villas')}</span>
            </Link>
          </div>
        }
      />

      {/* Operational Alerts */}
      <OperationalAlertBanner alerts={alerts} />

      {/* Section A: Shift Overview KPI Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 'var(--space-4)',
          marginBottom: 'var(--space-6)',
        }}
      >
        {/* Arrivals Today */}
        <div className="ops-card" style={{ padding: 'var(--space-4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', fontWeight: 500 }}>
              {t('operations.dashboard.arrivalsToday', 'Arrivals Today')}
            </span>
            <Users size={16} style={{ color: 'var(--accent-forest)' }} />
          </div>
          <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--text-primary)' }}>
            {totalArrivals}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
            {todayDate}
          </div>
        </div>

        {/* Checked In */}
        <div className="ops-card" style={{ padding: 'var(--space-4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', fontWeight: 500 }}>
              {t('operations.dashboard.checkedIn', 'Checked In')}
            </span>
            <CheckCircle2 size={16} style={{ color: '#1B5E20' }} />
          </div>
          <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: '#1B5E20' }}>
            {checkedInCount}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
            {t('operations.dashboard.completedPercent', { percent: Math.round((checkedInCount / (totalArrivals || 1)) * 100), defaultValue: `${Math.round((checkedInCount / (totalArrivals || 1)) * 100)}% completed` })}
          </div>
        </div>

        {/* Pending Check-Ins */}
        <div className="ops-card" style={{ padding: 'var(--space-4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', fontWeight: 500 }}>
              {t('operations.dashboard.pendingCheckIns', 'Pending Check-Ins')}
            </span>
            <Clock size={16} style={{ color: '#B26A00' }} />
          </div>
          <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: '#B26A00' }}>
            {pendingCheckIns}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
            {t('operations.dashboard.awaitingArrivalOrRoom', 'Awaiting arrival or room check')}
          </div>
        </div>

        {/* Occupied Villas */}
        <div className="ops-card" style={{ padding: 'var(--space-4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', fontWeight: 500 }}>
              {t('operations.dashboard.occupiedVillas', 'Occupied Villas')}
            </span>
            <Home size={16} style={{ color: 'var(--accent-forest)' }} />
          </div>
          <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--text-primary)' }}>
            {occupiedVillas} <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', fontWeight: 400 }}>/ {villas.length}</span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
            {t('operations.dashboard.resortOccupancyPercent', { percent: Math.round((occupiedVillas / villas.length) * 100), defaultValue: `${Math.round((occupiedVillas / villas.length) * 100)}% resort occupancy` })}
          </div>
        </div>

        {/* Cleaning / Attention */}
        <div className="ops-card" style={{ padding: 'var(--space-4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', fontWeight: 500 }}>
              {t('operations.dashboard.villasNeedingAttention', 'Villas Needing Housekeeping')}
            </span>
            <Brush size={16} style={{ color: '#B26A00' }} />
          </div>
          <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: cleaningVillas > 0 ? '#B26A00' : 'var(--text-primary)' }}>
            {cleaningVillas}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
            {t('operations.dashboard.housekeepingInProgress', 'Housekeeping in progress')}
          </div>
        </div>
      </div>

      {/* Section C: Residence Declaration Summary Bar */}
      <ResidenceDeclarationSummary />

      {/* Section B & D: Today's Arrivals Preview & Villa Readiness Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: 'var(--space-6)', alignItems: 'start' }}>
        
        {/* Left Column: Today's Arrivals Preview */}
        <div
          style={{
            backgroundColor: 'var(--surface)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: 'var(--space-4) var(--space-5)',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                {t('operations.dashboard.todayArrivalsPreview', "Today's Arrivals Preview")}
              </h2>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                {t('operations.dashboard.sortedByExpectedArrival', 'Sorted by expected arrival schedule')}
              </span>
            </div>
            <Link
              to="/receptionist/arrivals"
              style={{
                fontSize: 'var(--text-xs)',
                fontWeight: 600,
                color: 'var(--accent-forest)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <span>{t('operations.common.all', 'View All')} ({arrivals.length})</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          <div className="ops-table-wrap">
            <table className="ops-table ops-table-striped">
              <thead>
                <tr>
                  <th>
                    {t('operations.common.bookingRef', 'Booking Ref')}
                  </th>
                  <th>
                    {t('operations.common.customer', 'Customer')}
                  </th>
                  <th>
                    {t('operations.common.retreat', 'Retreat')}
                  </th>
                  <th>
                    {t('operations.common.eta', 'ETA')}
                  </th>
                  <th>
                    {t('operations.common.villa', 'Villa')}
                  </th>
                  <th>
                    {t('operations.common.status', 'Status')}
                  </th>
                  <th style={{ textAlign: 'right' }}>
                    {t('operations.common.action', 'Action')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {arrivals.slice(0, 5).map((arrival) => {
                  const retreatTitle =
                    typeof arrival.retreatName === 'object'
                      ? arrival.retreatName[currentLang] || arrival.retreatName.en
                      : arrival.retreatName;

                  return (
                    <tr key={arrival.id}>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          {arrival.bookingReference}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          {arrival.customerName}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                          {arrival.partySize === 1
                            ? t('operations.common.customerSolo', '1 Customer (Solo)')
                            : t('operations.common.customerCount', { count: arrival.partySize, defaultValue: `${arrival.partySize} Customers` })} • {arrival.customerPhone}
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-secondary)', maxWidth: '160px' }}>
                        <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={retreatTitle}>
                          {retreatTitle}
                        </div>
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {arrival.expectedArrivalTime}
                      </td>
                      <td>
                        {arrival.assignedVillaNumber ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                              {arrival.assignedVillaNumber}
                            </span>
                            <span
                              style={{
                                fontSize: '10px',
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
                          </div>
                        ) : (
                          <span style={{ color: '#C62828', fontWeight: 600, fontSize: '11px' }}>
                            {t('operations.common.notAssigned', 'Not Assigned')}
                          </span>
                        )}
                      </td>
                      <td>
                        <OperationalStatusChip type="arrival" status={arrival.arrivalStatus} size="sm" />
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {arrival.arrivalStatus === 'checked_in' ? (
                          <Link
                            to={`/receptionist/check-in/${arrival.bookingReference}`}
                            className="hsw-btn hsw-btn-secondary"
                            style={{ minHeight: '30px', padding: '0 8px', fontSize: '11px' }}
                          >
                            {t('operations.common.view', 'View')}
                          </Link>
                        ) : (
                          <Link
                            to={`/receptionist/check-in/${arrival.bookingReference}`}
                            className="hsw-btn hsw-btn-primary"
                            style={{ minHeight: '30px', padding: '0 10px', fontSize: '11px' }}
                          >
                            {t('operations.arrivals.startCheckIn', 'Check-In')}
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Villa Readiness Overview */}
        <div className="ops-card" style={{ padding: 'var(--space-5)' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 'var(--space-4)',
              paddingBottom: 'var(--space-3)',
              borderBottom: '1px solid var(--border-subtle)',
            }}
          >
            <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
              {t('operations.dashboard.villaReadiness', 'Villa Readiness Overview')}
            </h2>
            <Link
              to="/receptionist/villas"
              style={{
                fontSize: 'var(--text-xs)',
                fontWeight: 600,
                color: 'var(--accent-forest)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <span>{t('operations.common.manage', 'Manage')}</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {/* Ready */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px',
                borderRadius: 'var(--radius-xs)',
                backgroundColor: '#E8F5E9',
                border: '1px solid #C8E6C9',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={16} style={{ color: '#1B5E20' }} />
                <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: '#1B5E20' }}>
                  {t('operations.statuses.ready', 'Ready / Inspected')}
                </span>
              </div>
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: '#1B5E20' }}>
                {readyVillas}
              </span>
            </div>

            {/* Occupied */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px',
                borderRadius: 'var(--radius-xs)',
                backgroundColor: '#ECEFF1',
                border: '1px solid #CFD8DC',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BedDouble size={16} style={{ color: '#263238' }} />
                <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: '#263238' }}>
                  {t('operations.statuses.occupied', 'Occupied')}
                </span>
              </div>
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: '#263238' }}>
                {occupiedVillas}
              </span>
            </div>

            {/* Cleaning */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px',
                borderRadius: 'var(--radius-xs)',
                backgroundColor: '#FFF8E1',
                border: '1px solid #FFE082',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Brush size={16} style={{ color: '#B26A00' }} />
                <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: '#B26A00' }}>
                  {t('operations.statuses.cleaning', 'Cleaning')}
                </span>
              </div>
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: '#B26A00' }}>
                {cleaningVillas}
              </span>
            </div>

            {/* Reserved */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px',
                borderRadius: 'var(--radius-xs)',
                backgroundColor: '#E3F2FD',
                border: '1px solid #BBDEFB',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BookmarkCheck size={16} style={{ color: '#0D47A1' }} />
                <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: '#0D47A1' }}>
                  {t('operations.statuses.reserved', 'Reserved for Arrival')}
                </span>
              </div>
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: '#0D47A1' }}>
                {reservedVillas}
              </span>
            </div>

            {/* Maintenance */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px',
                borderRadius: 'var(--radius-xs)',
                backgroundColor: '#FFEBEE',
                border: '1px solid #FFCDD2',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Wrench size={16} style={{ color: '#C62828' }} />
                <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: '#C62828' }}>
                  {t('operations.statuses.maintenance', 'Maintenance')}
                </span>
              </div>
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: '#C62828' }}>
                {maintenanceVillas}
              </span>
            </div>
          </div>

          {/* Quick Actions Card */}
          <div style={{ marginTop: 'var(--space-5)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)', display: 'block', marginBottom: 'var(--space-2)' }}>
              {t('operations.dashboard.quickActions', 'Quick Operational Actions')}
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <button
                type="button"
                onClick={() => navigate('/receptionist/arrivals')}
                className="hsw-btn hsw-btn-secondary"
                style={{ justifyContent: 'flex-start', minHeight: '34px', fontSize: 'var(--text-xs)' }}
              >
                <Users size={14} />
                <span>{t('operations.dashboard.processTodayCheckIns', "Process Today's Check-Ins")}</span>
              </button>
              <button
                type="button"
                onClick={() => navigate('/receptionist/villas')}
                className="hsw-btn hsw-btn-secondary"
                style={{ justifyContent: 'flex-start', minHeight: '34px', fontSize: 'var(--text-xs)' }}
              >
                <Brush size={14} />
                <span>{t('operations.dashboard.updateHousekeepingStatus', 'Update Housekeeping Status')}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
