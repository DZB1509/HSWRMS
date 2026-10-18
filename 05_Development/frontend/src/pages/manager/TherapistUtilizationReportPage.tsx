import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Users2,
  HeartHandshake,
  ShieldCheck,
  FileSpreadsheet,
  RotateCw,
  Calendar,
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
import { billingApi } from '../../features/m5-billing/api/billingApi';
import type { TherapistUtilization } from '../../features/m5-billing/types';

export const TherapistUtilizationReportPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { getTherapistUtilizationAnalytics } = useFolio();

  const localAnalytics = getTherapistUtilizationAnalytics();

  // Date range filter
  const [dateRange, setDateRange] = useState<'7d' | '30d' | 'ytd'>('30d');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [liveAnalytics, setLiveAnalytics] = useState<TherapistUtilization | null>(null);

  const getDates = () => {
    const to = new Date().toISOString().slice(0, 10);
    const d = new Date();
    if (dateRange === '7d') d.setDate(d.getDate() - 7);
    else if (dateRange === '30d') d.setDate(d.getDate() - 30);
    else d.setFullYear(d.getFullYear(), 0, 1);
    const from = d.toISOString().slice(0, 10);
    return { from, to };
  };

  useEffect(() => {
    const { from, to } = getDates();
    billingApi.getTherapistUtilization(from, to)
      .then(setLiveAnalytics)
      .catch(() => {
        // Fallback to local context
      });
  }, [dateRange]);

  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      const { from, to } = getDates();
      await billingApi.downloadExcelReport('therapist', from, to);
    } catch (err) {
      console.error('Failed to export therapist excel:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const totalTherapists = liveAnalytics?.totalTherapists ?? localAnalytics.totalTherapists;
  const totalScheduledSessions = liveAnalytics?.totalScheduledSessions ?? localAnalytics.totalScheduledSessions;
  const completedSessions = liveAnalytics?.completedSessions ?? localAnalytics.completedSessions;
  const noShowSessions = liveAnalytics?.noShowSessions ?? localAnalytics.noShowSessions;
  const totalBookedHours = liveAnalytics?.totalBookedHours ?? localAnalytics.totalBookedHours;
  const totalBookedMinutes = (liveAnalytics?.totalBookedHours ? Math.round(liveAnalytics.totalBookedHours * 60) : undefined) ?? localAnalytics.totalBookedMinutes;

  // Helper for locale-aware units (e.g., VI: "510 phút", "8,5 giờ"; EN: "510 min", "8.5 hrs")
  const formatDuration = (mins: number, hours: number, lang: string) => {
    const isVi = lang === 'vi';
    const isZh = lang === 'zh-CN';
    const isJa = lang === 'ja';
    const isFr = lang === 'fr';

    let minLabel = 'min';
    let hrLabel = 'hrs';

    if (isVi) {
      minLabel = 'phút';
      hrLabel = 'giờ';
    } else if (isZh) {
      minLabel = '分钟';
      hrLabel = '小时';
    } else if (isJa) {
      minLabel = '分';
      hrLabel = '時間';
    } else if (isFr) {
      minLabel = 'min';
      hrLabel = 'h';
    }

    const formattedHours = isVi
      ? hours.toLocaleString('vi-VN', { minimumFractionDigits: 0, maximumFractionDigits: 1 })
      : isFr
      ? hours.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 1 })
      : hours.toFixed(1);

    return {
      minText: `${mins.toLocaleString()} ${minLabel}`,
      minUnit: minLabel,
      hrText: `${formattedHours} ${hrLabel}`,
      hrUnit: hrLabel,
      formattedHours,
    };
  };

  const durationInfo = formatDuration(totalBookedMinutes, totalBookedHours, i18n.language);

  // Pagination for therapist table
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const currentTherapistDetails = (liveAnalytics?.therapistDetails && liveAnalytics.therapistDetails.length > 0)
    ? liveAnalytics.therapistDetails
    : localAnalytics.therapistDetails;

  const totalItems = currentTherapistDetails.length;
  const paginatedTherapists = currentTherapistDetails.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const chartData = currentTherapistDetails.map((td) => ({
    name: td.name.split(' ').slice(-1)[0],
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

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
            {/* Date Range Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'var(--surface-sunken)', padding: '4px 8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <Calendar size={14} style={{ color: 'var(--text-secondary)' }} />
              <div style={{ display: 'flex', gap: '4px' }}>
                {(['7d', '30d', 'ytd'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setDateRange(r)}
                    style={{
                      border: 'none',
                      background: dateRange === r ? 'var(--accent-forest)' : 'transparent',
                      color: dateRange === r ? '#ffffff' : 'var(--text-secondary)',
                      fontSize: '11px',
                      fontWeight: 600,
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {r.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Export Excel Button */}
            <button
              type="button"
              className="hsw-btn hsw-btn-secondary"
              onClick={handleExportExcel}
              disabled={isExporting}
              style={{ padding: '6px 14px', fontSize: '12px' }}
              id="btn-export-therapist-excel"
            >
              {isExporting ? (
                <RotateCw size={14} className="hsw-spin" />
              ) : (
                <FileSpreadsheet size={14} style={{ color: '#047857' }} />
              )}
              <span>{isExporting ? t('common.exporting', 'Exporting...') : t('manager.revenue.exportExcel', 'Export to Excel (.xlsx)')}</span>
            </button>

            <div className="hsw-manager-privacy-notice">
              <ShieldCheck size={14} />
              <span>{t('manager.therapists.privacyNotice', 'Manager Clearance · Operational Workload Only · Health & Clinical Notes Excluded')}</span>
            </div>
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
            {totalTherapists}
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
            {totalScheduledSessions}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {completedSessions} {t('manager.therapists.completedSub', 'completed')} · {noShowSessions} {t('manager.therapists.noShowSub', 'no-show')}
          </div>
        </div>

        {/* Booked Treatment Minutes */}
        <div className="hsw-manager-kpi-card" style={{ borderLeft: '4px solid #d97706' }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
            {t('manager.therapists.totalMinutes', 'Booked Treatment Time')}
          </div>
          <div style={{ fontSize: 'var(--text-3xl)', fontWeight: 700, color: '#b45309' }}>
            {totalBookedMinutes.toLocaleString()} <span style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>{durationInfo.minUnit}</span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {durationInfo.formattedHours} {durationInfo.hrUnit} {t('manager.therapists.hoursTreatment', 'hours of hands-on therapy')}
          </div>
        </div>

        {/* Booked Treatment Hours (Factual workload metric, replacing unsupported utilization %) */}
        <div className="hsw-manager-kpi-card" style={{ borderLeft: '4px solid #10b981' }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
            {t('manager.therapists.totalHours', 'Booked Treatment Hours')}
          </div>
          <div style={{ fontSize: 'var(--text-3xl)', fontWeight: 700, color: '#047857' }}>
            {durationInfo.formattedHours} <span style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>{durationInfo.hrUnit}</span>
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
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            {totalBookedMinutes.toLocaleString()} {t('manager.therapists.totalTreatmentMinutes', 'Total Treatment Minutes')}
          </span>
        </div>
        <div style={{ width: '100%', height: 280 }}>
          <ResponsiveContainer>
            <BarChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis
                tick={{ fontSize: 11 }}
                label={{
                  value: t('manager.therapists.axisMinutes', 'Minutes'),
                  angle: -90,
                  position: 'insideLeft',
                  fontSize: 11
                }}
              />
              <Tooltip
                formatter={(val: any, _name: any, item: any) => {
                  const dur = formatDuration(Number(val) || 0, item.payload.bookedHours, i18n.language);
                  return [
                    `${dur.minText} (${item.payload.sessions} ${t('manager.therapists.sessionsUnit', 'sessions')} · ${dur.hrText})`,
                    item.payload.fullName,
                  ];
                }}
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
              {paginatedTherapists.map((therapist) => {
                const staffId = 'therapistId' in therapist ? `TH-${therapist.therapistId}` : therapist.id;
                return (
                  <tr key={staffId}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {therapist.name}
                      </div>
                    </td>
                    <td>
                      <span className="hsw-source-badge">{staffId}</span>
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
                    {therapist.bookedMinutes.toLocaleString()} {durationInfo.minUnit}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <span style={{ fontWeight: 700, color: 'var(--accent-forest)' }}>
                      {formatDuration(0, therapist.bookedHours, i18n.language).hrText}
                    </span>
                  </td>
                </tr>
              );
            })}
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
