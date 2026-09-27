import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Users2,
  HeartHandshake,
  ShieldCheck,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { useFolio } from '../../context/FolioContext';
import { OperationalPagination } from '../../components/operations/OperationalPagination';

export const TherapistUtilizationReportPage: React.FC = () => {
  const { t } = useTranslation();
  const { getTherapistUtilizationAnalytics } = useFolio();

  const analytics = getTherapistUtilizationAnalytics();

  // Pagination for therapist table
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const totalItems = analytics.therapistDetails.length;
  const paginatedTherapists = analytics.therapistDetails.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const chartData = analytics.therapistDetails.map((td) => ({
    name: td.name.split(' ').slice(-1)[0], // last name / short name for readable bar charts
    fullName: td.name,
    bookedMinutes: td.bookedMinutes,
    bookedHours: td.bookedHours,
    sessions: td.sessionsCount,
  }));

  return (
    <div className="hsw-manager-page" style={{ padding: 'var(--space-6)' }}>
      {/* Header */}
      <div className="hsw-manager-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-4)', marginBottom: 'var(--space-2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <Users2 size={24} style={{ color: 'var(--actor-manager)' }} />
            <h1 style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--text-primary)' }}>
              {t('manager.therapists.title', 'Therapist Utilization Report')}
            </h1>
          </div>

          <div className="hsw-manager-privacy-notice">
            <ShieldCheck size={14} />
            <span>{t('manager.therapists.privacyNotice', 'Manager Clearance · Operational Workload Only · Health & Clinical Notes Excluded')}</span>
          </div>
        </div>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
          {t(
            'manager.therapists.subtitle',
            'Workload indicators based on scheduled treatment activity. Shift-capacity data is not available in the current prototype.'
          )}
        </p>
      </div>

      {/* KPI Cards Row (Rule 43 & 44: No therapist ratings or fabricated capacity!) */}
      <div className="hsw-manager-kpi-grid">
        {/* Total Active Practitioners */}
        <div className="hsw-manager-kpi-card" style={{ borderLeft: '4px solid var(--accent-forest)' }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
            {t('manager.therapists.totalPractitioners', 'Active Practitioners')}
          </div>
          <div style={{ fontSize: 'var(--text-3xl)', fontWeight: 700, color: 'var(--text-primary)' }}>
            {analytics.totalTherapists}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {t('manager.therapists.registeredStaff', 'Therapists & Yoga instructors')}
          </div>
        </div>

        {/* Total Scheduled Sessions */}
        <div className="hsw-manager-kpi-card" style={{ borderLeft: '4px solid #2563eb' }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
            {t('manager.therapists.totalSessions', 'Scheduled Sessions')}
          </div>
          <div style={{ fontSize: 'var(--text-3xl)', fontWeight: 700, color: '#1d4ed8' }}>
            {analytics.totalScheduledSessions}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {analytics.completedSessions} {t('manager.therapists.completedSub', 'completed')} · {analytics.noShowSessions} {t('manager.therapists.noShowSub', 'no-show')}
          </div>
        </div>

        {/* Booked Treatment Minutes */}
        <div className="hsw-manager-kpi-card" style={{ borderLeft: '4px solid #d97706' }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
            {t('manager.therapists.totalMinutes', 'Booked Treatment Time')}
          </div>
          <div style={{ fontSize: 'var(--text-3xl)', fontWeight: 700, color: '#b45309' }}>
            {analytics.totalBookedMinutes} <span style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>min</span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {analytics.totalBookedHours} {t('manager.therapists.hoursTreatment', 'hours of hands-on therapy')}
          </div>
        </div>

        {/* Booked Treatment Hours (Factual workload metric, replacing unsupported utilization %) */}
        <div className="hsw-manager-kpi-card" style={{ borderLeft: '4px solid #10b981' }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
            {t('manager.therapists.totalHours', 'Booked Treatment Hours')}
          </div>
          <div style={{ fontSize: 'var(--text-3xl)', fontWeight: 700, color: '#047857' }}>
            {analytics.totalBookedHours} <span style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>hrs</span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {t('manager.therapists.hoursDerivedFactual', 'Factual sum of scheduled treatments')}
          </div>
        </div>
      </div>

      {/* Workload Visualization Chart (Recharts) */}
      <div className="hsw-manager-chart-card">
        <div className="hsw-manager-chart-title">
          <span>{t('manager.therapists.chartTitle', 'Practitioner Workload Distribution (Minutes Booked)')}</span>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{analytics.totalBookedMinutes} Total Treatment Minutes</span>
        </div>
        <div style={{ width: '100%', height: 280 }}>
          <ResponsiveContainer>
            <BarChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 11 }} label={{ value: 'Minutes', angle: -90, position: 'insideLeft', fontSize: 11 }} />
              <Tooltip
                formatter={(val: any, _name: any, item: any) => [
                  `${val} min (${item.payload.sessions} sessions · ${item.payload.bookedHours} hrs)`,
                  item.payload.fullName,
                ]}
              />
              <Bar dataKey="bookedMinutes" fill="var(--accent-forest)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Practitioner Detail Table with Pagination */}
      <div className="hsw-folio-section">
        <div className="hsw-folio-section-header">
          <div className="hsw-folio-section-title">
            <HeartHandshake size={18} style={{ color: 'var(--actor-manager)' }} />
            <span>{t('manager.therapists.tableTitle', 'Practitioner Schedule & Workload Summary')}</span>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            {t('manager.therapists.showingCount', 'Showing {{count}} therapists', { count: totalItems })}
          </div>
        </div>

        <div className="hsw-folio-table-wrapper">
          <table className="hsw-folio-table">
            <thead>
              <tr>
                <th>{t('manager.therapists.colName', 'Practitioner Name')}</th>
                <th>{t('manager.therapists.colSpecialty', 'Staff ID')}</th>
                <th style={{ textAlign: 'center' }}>{t('manager.therapists.colSessions', 'Total Sessions')}</th>
                <th style={{ textAlign: 'center' }}>{t('manager.therapists.colCompleted', 'Completed')}</th>
                <th style={{ textAlign: 'center' }}>{t('manager.therapists.colNoShow', 'No-Show')}</th>
                <th style={{ textAlign: 'right' }}>{t('manager.therapists.colMinutes', 'Treatment Time')}</th>
                <th style={{ textAlign: 'right' }}>{t('manager.therapists.colHours', 'Treatment Hours')}</th>
              </tr>
            </thead>
            <tbody>
              {paginatedTherapists.map((therapist) => (
                <tr key={therapist.id}>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {therapist.name}
                    </div>
                  </td>
                  <td>
                    <span className="hsw-source-badge">{therapist.id}</span>
                  </td>
                  <td style={{ textAlign: 'center', fontWeight: 600 }}>
                    {therapist.sessionsCount}
                  </td>
                  <td style={{ textAlign: 'center', color: 'var(--accent-forest)' }}>
                    {therapist.completedCount}
                  </td>
                  <td style={{ textAlign: 'center', color: therapist.noShowCount > 0 ? '#dc2626' : 'var(--text-muted)' }}>
                    {therapist.noShowCount}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>
                    {therapist.bookedMinutes} min
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <span style={{ fontWeight: 700, color: 'var(--accent-forest)' }}>
                      {therapist.bookedHours} hrs
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalItems > pageSize && (
          <div style={{ padding: 'var(--space-4) var(--space-6)', borderTop: '1px solid var(--border-subtle)' }}>
            <OperationalPagination
              currentPage={currentPage}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default TherapistUtilizationReportPage;
