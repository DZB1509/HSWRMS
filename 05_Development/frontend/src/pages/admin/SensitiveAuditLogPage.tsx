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
            {t('operations.audit.pageTitle', 'Nhật Ký Kiểm Toán Truy Cập Dữ Liệu Nhạy Cảm & Quản Trị')}
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
            {t('topbar.adminClearance', 'Thẩm Quyền Quản Trị Viên')}
          </span>
        </div>
        <p className="hsw-gov-subtitle">
          {t('operations.audit.pageSubtitle', 'Lịch sử kiểm toán theo dòng thời gian chỉ đọc (ngữ nghĩa chỉ ghi tiếp append-only) ghi nhận siêu dữ liệu truy cập, sự kiện xác minh danh tính và các chuyển đổi quản trị theo Nghị định 13 và Luật Cư trú.')}
        </p>
      </div>

      {/* Strict Data Minimization Banner */}
      <div className="hsw-gov-banner privacy">
        <ShieldCheck size={18} style={{ color: 'var(--accent-terracotta)', flexShrink: 0, marginTop: '2px' }} />
        <div>
          <strong style={{ color: 'var(--text-primary)' }}>
            {t('operations.audit.minimizationTitle', 'Ghi Nhật Ký Siêu Dữ Liệu Chặt Chẽ & Tối Thiểu Hóa Dữ Liệu Nhạy Cảm')}
          </strong>
          <span style={{ display: 'block', marginTop: '2px' }}>
            {t('operations.audit.minimizationDesc', 'Để bảo vệ quyền riêng tư của khách hàng, nhật ký kiểm toán này chỉ ghi nhận siêu dữ liệu truy cập và mã định danh giả lập danh tính. Bệnh án y tế thô, triệu chứng dị ứng cụ thể, số CCCD/Hộ chiếu và thông tin thẻ thanh toán TUYỆT ĐỐI KHÔNG lưu trữ hoặc hiển thị trong nhật ký.')}
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
                placeholder={t('operations.audit.searchPlaceholder', 'Tìm theo mã tham chiếu, người thực hiện...')}
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
              <option value="all">{t('operations.audit.allCategories', 'Tất cả danh mục dữ liệu')}</option>
              <option value="HEALTH_WELLNESS">Sức Khỏe & Trị Liệu (HEALTH_WELLNESS)</option>
              <option value="RESIDENCE_IDENTITY">Danh Tính & Tạm Trú (RESIDENCE_IDENTITY)</option>
              <option value="DIETARY_ALLERGY">Dị Ứng & Ẩm Thực (DIETARY_ALLERGY)</option>
              <option value="PAYMENT_TRANSACTION">Giao Dịch & Thanh Toán (PAYMENT_TRANSACTION)</option>
              <option value="SECURITY_GOVERNANCE">Quản Trị Bảo Mật (SECURITY_GOVERNANCE)</option>
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
              <option value="all">{t('operations.audit.allRoles', 'Tất cả vai trò thực hiện')}</option>
              <option value="customer">Khách Hàng (Customer)</option>
              <option value="receptionist">Lễ Tân (Receptionist)</option>
              <option value="therapist">Kỹ Thuật Viên (Therapist)</option>
              <option value="fb_staff">Nhân Viên Bếp / F&B</option>
              <option value="manager">Quản Lý (Manager)</option>
              <option value="admin">Quản Trị Viên (Admin)</option>
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
              <option value="all">{t('operations.audit.allResults', 'Tất cả kết quả')}</option>
              <option value="SUCCESS">THÀNH CÔNG (SUCCESS)</option>
              <option value="DENIED">TỪ CHỐI / BỊ CHẶN (DENIED)</option>
            </select>
          </div>

          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
            {totalItems} {t('operations.audit.eventsMatched', 'sự kiện được ghi nhận')}
          </span>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="hsw-gov-card">
        <div className="hsw-matrix-table-wrap">
          <table className="hsw-matrix-table">
            <thead>
              <tr>
                <th>{t('operations.audit.colEventId', 'Mã Sự Kiện')}</th>
                <th>{t('operations.audit.colTimestamp', 'Thời Gian')}</th>
                <th>{t('operations.audit.colActor', 'Người Thực Hiện & Vai Trò')}</th>
                <th>{t('operations.audit.colAction', 'Hành Động')}</th>
                <th>{t('operations.audit.colCategory', 'Danh Mục Dữ Liệu')}</th>
                <th>{t('operations.audit.colTargetRef', 'Mã Tham Chiếu')}</th>
                <th>{t('operations.audit.colResult', 'Kết Quả')}</th>
                <th>{t('operations.audit.colDetails', 'Ngữ Cảnh Siêu Dữ Liệu')}</th>
              </tr>
            </thead>
            <tbody>
              {paginatedEvents.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--text-muted)' }}>
                    {t('operations.audit.noEvents', 'Không tìm thấy sự kiện kiểm toán nào phù hợp với tiêu chí tìm kiếm và bộ lọc.')}
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
                          {evt.actorRole === 'therapist' ? 'Kỹ thuật viên' : evt.actorRole === 'receptionist' ? 'Lễ tân' : evt.actorRole === 'fb_staff' ? 'Nhân viên bếp' : evt.actorRole === 'admin' ? 'Quản trị viên' : evt.actorRole === 'manager' ? 'Quản lý' : 'Khách hàng'} · {evt.actorId}
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
                          {isSuccess ? 'THÀNH CÔNG' : 'TỪ CHỐI'}
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
