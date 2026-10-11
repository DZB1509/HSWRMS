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
  const { t, i18n } = useTranslation();
  const { getTherapistUtilizationAnalytics } = useFolio();

  const analytics = getTherapistUtilizationAnalytics();

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

  const durationInfo = formatDuration(analytics.totalBookedMinutes, analytics.totalBookedHours, i18n.language);

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
              {t('manager.therapists.title', 'Báo Cáo Hiệu Suất Kỹ Thuật Viên')}
            </h1>
          </div>

          <div className="hsw-manager-privacy-notice">
            <ShieldCheck size={14} />
            <span>{t('manager.therapists.privacyNotice', 'Thẩm Quyền Quản Lý · Chỉ Xem Khối Lượng Vận Hành · Không Bao Gồm Hồ Sơ Bệnh Án')}</span>
          </div>
        </div>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
          {t(
            'manager.therapists.subtitle',
            'Chỉ số khối lượng công việc dựa trên hoạt động trị liệu đã lên lịch. Dữ liệu công suất ca trực không được giả lập.'
          )}
        </p>
      </div>

      {/* KPI Cards Row (Rule 43 & 44: No therapist ratings or fabricated capacity!) */}
      <div className="hsw-manager-kpi-grid">
        {/* Total Active Practitioners */}
        <div className="hsw-manager-kpi-card" style={{ borderLeft: '4px solid var(--accent-forest)' }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
            {t('manager.therapists.totalPractitioners', 'Kỹ Thuật Viên Đang Làm Việc')}
          </div>
          <div style={{ fontSize: 'var(--text-3xl)', fontWeight: 700, color: 'var(--text-primary)' }}>
            {analytics.totalTherapists}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {t('manager.therapists.registeredStaff', 'Trị liệu viên & Hướng dẫn viên Yoga')}
          </div>
        </div>

        {/* Total Scheduled Sessions */}
        <div className="hsw-manager-kpi-card" style={{ borderLeft: '4px solid #2563eb' }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
            {t('manager.therapists.totalSessions', 'Tổng Ca Trị Liệu Lên Lịch')}
          </div>
          <div style={{ fontSize: 'var(--text-3xl)', fontWeight: 700, color: '#1d4ed8' }}>
            {analytics.totalScheduledSessions}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {analytics.completedSessions} {t('manager.therapists.completedSub', 'hoàn tất')} · {analytics.noShowSessions} {t('manager.therapists.noShowSub', 'vắng mặt')}
          </div>
        </div>

        {/* Booked Treatment Minutes */}
        <div className="hsw-manager-kpi-card" style={{ borderLeft: '4px solid #d97706' }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
            {t('manager.therapists.totalMinutes', 'Thời Gian Trị Liệu Đã Đặt')}
          </div>
          <div style={{ fontSize: 'var(--text-3xl)', fontWeight: 700, color: '#b45309' }}>
            {analytics.totalBookedMinutes.toLocaleString()} <span style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>{durationInfo.minUnit}</span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {durationInfo.formattedHours} {durationInfo.hrUnit} {t('manager.therapists.hoursTreatment', 'giờ trị liệu thực tế')}
          </div>
        </div>

        {/* Booked Treatment Hours (Factual workload metric, replacing unsupported utilization %) */}
        <div className="hsw-manager-kpi-card" style={{ borderLeft: '4px solid #10b981' }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
            {t('manager.therapists.totalHours', 'Tổng Giờ Trị Liệu Đã Đặt')}
          </div>
          <div style={{ fontSize: 'var(--text-3xl)', fontWeight: 700, color: '#047857' }}>
            {durationInfo.formattedHours} <span style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>{durationInfo.hrUnit}</span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {t('manager.therapists.hoursDerivedFactual', 'Tổng số giờ trị liệu thực tế theo lịch')}
          </div>
        </div>
      </div>

      {/* Workload Visualization Chart (Recharts) */}
      <div className="hsw-manager-chart-card">
        <div className="hsw-manager-chart-title">
          <span>{t('manager.therapists.chartTitle', 'Phân Bổ Khối Lượng Công Việc (Số Phút Đặt Lịch)')}</span>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            {analytics.totalBookedMinutes.toLocaleString()} {t('manager.therapists.totalTreatmentMinutes', 'Tổng Số Phút Trị Liệu')}
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
                  value: t('manager.therapists.axisMinutes', 'Phút'),
                  angle: -90,
                  position: 'insideLeft',
                  fontSize: 11
                }}
              />
              <Tooltip
                formatter={(val: any, _name: any, item: any) => {
                  const dur = formatDuration(Number(val) || 0, item.payload.bookedHours, i18n.language);
                  return [
                    `${dur.minText} (${item.payload.sessions} ${t('manager.therapists.sessionsUnit', 'buổi')} · ${dur.hrText})`,
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
            <span>{t('manager.therapists.tableTitle', 'Tổng Hợp Lịch Trình & Khối Lượng Công Việc')}</span>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            {t('manager.therapists.showingCount', 'Hiển thị {{count}} kỹ thuật viên', { count: totalItems })}
          </div>
        </div>

        <div className="hsw-folio-table-wrapper">
          <table className="hsw-folio-table">
            <thead>
              <tr>
                <th>{t('manager.therapists.colName', 'Tên Kỹ Thuật Viên')}</th>
                <th>{t('manager.therapists.colSpecialty', 'Mã Nhân Viên')}</th>
                <th style={{ textAlign: 'center' }}>{t('manager.therapists.colSessions', 'Tổng Số Buổi')}</th>
                <th style={{ textAlign: 'center' }}>{t('manager.therapists.colCompleted', 'Đã Hoàn Tất')}</th>
                <th style={{ textAlign: 'center' }}>{t('manager.therapists.colNoShow', 'Vắng Mặt')}</th>
                <th style={{ textAlign: 'right' }}>{t('manager.therapists.colMinutes', 'Thời Gian (Phút)')}</th>
                <th style={{ textAlign: 'right' }}>{t('manager.therapists.colHours', 'Thời Gian (Giờ)')}</th>
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
                    {therapist.bookedMinutes.toLocaleString()} {durationInfo.minUnit}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <span style={{ fontWeight: 700, color: 'var(--accent-forest)' }}>
                      {formatDuration(0, therapist.bookedHours, i18n.language).hrText}
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
