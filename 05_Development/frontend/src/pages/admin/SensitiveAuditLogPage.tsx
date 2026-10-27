import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, AlertCircle, RefreshCw, Search, Lock, X, Eye, Filter, Calendar } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { OperationalPagination } from '../../components/operations/OperationalPagination';
import {
  auditLogApi,
  formatAuditTimestamp,
  normalizeAuditStatus,
  validateAuditDateRange,
  validateAuditAuthorization,
  type AuditViewDto
} from '../../features/m6-admin/api/auditLogApi';

export const SensitiveAuditLogPage: React.FC = () => {
  const { t } = useTranslation(['operations', 'common']);
  const { currentUser } = useAuth();

  // Authorization Evaluation (Fail-Closed)
  const authStatus = validateAuditAuthorization(currentUser);

  // Data & State
  const [auditLogs, setAuditLogs] = useState<AuditViewDto[]>([]);
  const [totalElements, setTotalElements] = useState<number>(0);
  const [, setTotalPages] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters matching backend AuditFilter
  const [searchAction, setSearchAction] = useState<string>('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterDataType, setFilterDataType] = useState<string>('all');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [dateError, setDateError] = useState<string | null>(null);

  // Pagination (1-indexed for OperationalPagination component)
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);

  // Selected Log for Inspection Drawer
  const [selectedLog, setSelectedLog] = useState<AuditViewDto | null>(null);

  // Fetch real audit logs from GET /api/v1/admin/audit-logs
  const fetchAuditLogs = useCallback(async () => {
    if (!authStatus.canView) {
      setLoading(false);
      setError('Tài khoản không có thẩm quyền truy cập Nhật Ký Kiểm Toán Nhạy Cảm (Thiếu quyền S53:V).');
      return;
    }

    // Validate date range if both dates provided
    if (fromDate && toDate) {
      const dateCheck = validateAuditDateRange(
        fromDate ? `${fromDate}T00:00:00` : undefined,
        toDate ? `${toDate}T23:59:59` : undefined
      );
      if (!dateCheck.valid) {
        setDateError(dateCheck.error || 'Khoảng ngày không hợp lệ.');
        return;
      }
    }
    setDateError(null);

    setLoading(true);
    setError(null);

    try {
      const pageData = await auditLogApi.list({
        from: fromDate ? `${fromDate}T00:00:00` : undefined,
        to: toDate ? `${toDate}T23:59:59` : undefined,
        role: filterRole !== 'all' ? filterRole : undefined,
        action: searchAction.trim() ? searchAction.trim() : undefined,
        dataType: filterDataType !== 'all' ? filterDataType : undefined,
        status: filterStatus !== 'all' ? filterStatus : undefined,
        page: currentPage - 1, // backend is 0-indexed
        size: pageSize
      });

      setAuditLogs(pageData.items);
      setTotalElements(pageData.totalElements);
      setTotalPages(pageData.totalPages);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Không thể kết nối đến máy chủ để tải nhật ký kiểm toán.';
      setError(errMsg);
      setAuditLogs([]);
    } finally {
      setLoading(false);
    }
  }, [authStatus.canView, fromDate, toDate, filterRole, searchAction, filterDataType, filterStatus, currentPage, pageSize]);

  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

  // Handle search submit / enter
  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchAuditLogs();
  };

  const handleResetFilters = () => {
    setSearchAction('');
    setFilterRole('all');
    setFilterStatus('all');
    setFilterDataType('all');
    setFromDate('');
    setToDate('');
    setDateError(null);
    setCurrentPage(1);
  };

  return (
    <div style={{ padding: 'var(--space-6) var(--space-8)' }}>
      {/* Header */}
      <div className="hsw-gov-header" style={{ marginBottom: 'var(--space-4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-1)' }}>
              <h1 className="hsw-gov-title" style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>
                {t('operations.audit.pageTitle', 'Sensitive Data Access & Governance Audit Log')}
              </h1>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  padding: '3px 8px',
                  borderRadius: 'var(--radius-pill)',
                  backgroundColor: authStatus.isManagerDelegated ? 'var(--actor-manager, #3b82f6)' : 'var(--actor-admin, #8b5cf6)',
                  color: '#ffffff'
                }}
              >
                {authStatus.isManagerDelegated ? 'Quyền Quản Lý Được Ủy Quyền (S53:V)' : t('topbar.adminClearance', 'Administrator Clearance')}
              </span>
            </div>
            <p className="hsw-gov-subtitle" style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '13px' }}>
              {t('operations.audit.pageSubtitle', 'Nhật ký kiểm toán nối tiếp (append-only) theo thời gian thực ghi nhận truy cập dữ liệu nhạy cảm, giao dịch phân quyền và bảo mật theo Nghị định 13 & Luật Cư trú.')}
            </p>
          </div>

          {/* Action Toolbar: CSV Export (Explicitly Deferred in Phase 5.5) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <button
              disabled
              className="hsw-gov-btn"
              style={{
                opacity: 0.6,
                cursor: 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                fontSize: '13px',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                backgroundColor: '#f3f4f6',
                color: '#6b7280'
              }}
              title="Tính năng xuất báo cáo CSV bị trì hoãn (Phase 5.5 - Chế độ Read-Only an toàn)"
            >
              <Lock size={15} />
              {t('operations.audit.exportCsv', 'Xuất Báo Cáo CSV (Khóa)')}
            </button>
            <button
              onClick={fetchAuditLogs}
              disabled={loading}
              className="hsw-gov-btn"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                fontSize: '13px',
                borderRadius: '6px',
                border: '1px solid var(--border-color, #e5e7eb)',
                backgroundColor: '#ffffff',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
              title="Tải lại dữ liệu kiểm toán"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
              {t('common.refresh', 'Làm mới')}
            </button>
          </div>
        </div>
      </div>

      {/* Strict Data Minimization Banner (Decree 13 / GDPR Compliance) */}
      <div
        className="hsw-gov-banner privacy"
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 'var(--space-3)',
          backgroundColor: '#fef3c7',
          border: '1px solid #fde68a',
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: 'var(--space-4)'
        }}
      >
        <ShieldCheck size={20} style={{ color: '#d97706', flexShrink: 0, marginTop: '2px' }} />
        <div>
          <strong style={{ color: '#92400e', fontSize: '13px', display: 'block' }}>
            {t('operations.audit.minimizationTitle', 'Nguyên Tắc Giảm Thiểu Dữ Liệu & Ghi Nhận Metadata Nghiêm Ngặt')}
          </strong>
          <span style={{ display: 'block', marginTop: '2px', fontSize: '12px', color: '#78350f', lineHeight: 1.4 }}>
            {t('operations.audit.minimizationDesc', 'Hệ thống bảo vệ tối đa tính bí mật của khách hàng: chỉ ghi nhận metadata truy cập và định danh tham chiếu. Chẩn đoán sức khỏe, dị ứng thực đơn chi tiết, số định danh CCCD/hộ chiếu và thông tin thẻ thanh toán TUYỆT ĐỐI KHÔNG lưu trữ trong nhật ký kiểm toán.')}
          </span>
        </div>
      </div>

      {/* Date Range Error Alert */}
      {dateError && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#fee2e2',
            border: '1px solid #fca5a5',
            color: '#b91c1c',
            padding: '10px 14px',
            borderRadius: '6px',
            marginBottom: 'var(--space-4)',
            fontSize: '13px'
          }}
        >
          <AlertCircle size={16} />
          <span>{dateError}</span>
        </div>
      )}

      {/* Backend Filters Toolbar */}
      <div className="hsw-gov-card" style={{ marginBottom: 'var(--space-4)', padding: 'var(--space-4)' }}>
        <form onSubmit={handleFilterSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-3)', alignItems: 'flex-end' }}>
            {/* Action Search */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                Hành động (Action)
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={searchAction}
                  onChange={(e) => setSearchAction(e.target.value)}
                  placeholder="Tìm hành động (ví dụ: Update, View...)"
                  style={{
                    width: '100%',
                    padding: '7px 10px 7px 30px',
                    fontSize: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px'
                  }}
                />
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: '#9ca3af' }} />
              </div>
            </div>

            {/* Role Filter */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                Vai trò thực hiện (Role)
              </label>
              <select
                value={filterRole}
                onChange={(e) => {
                  setFilterRole(e.target.value);
                  setCurrentPage(1);
                }}
                style={{
                  width: '100%',
                  padding: '7px 10px',
                  fontSize: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  backgroundColor: '#ffffff'
                }}
              >
                <option value="all">Tất cả vai trò</option>
                <option value="ADMIN">Quản trị viên (ADMIN)</option>
                <option value="MANAGER">Quản lý (MANAGER)</option>
                <option value="RECEPTIONIST">Lễ tân (RECEPTIONIST)</option>
                <option value="THERAPIST">Kỹ thuật viên Spa (THERAPIST)</option>
                <option value="FNB_STAFF">Nhân viên F&B (FNB_STAFF)</option>
                <option value="CUSTOMER">Khách hàng (CUSTOMER)</option>
              </select>
            </div>

            {/* Target Data Type Filter */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                Loại dữ liệu (Target Type)
              </label>
              <select
                value={filterDataType}
                onChange={(e) => {
                  setFilterDataType(e.target.value);
                  setCurrentPage(1);
                }}
                style={{
                  width: '100%',
                  padding: '7px 10px',
                  fontSize: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  backgroundColor: '#ffffff'
                }}
              >
                <option value="all">Tất cả loại dữ liệu</option>
                <option value="User">Tài khoản (User)</option>
                <option value="SystemConfiguration">Tham số hệ thống (SystemConfiguration)</option>
                <option value="RolePermission">Ma trận quyền (RolePermission)</option>
                <option value="RightDelegation">Ủy quyền (RightDelegation)</option>
                <option value="AuditLog">Nhật ký kiểm toán (AuditLog)</option>
                <option value="Folio">Hóa đơn Folio (Folio)</option>
                <option value="MealOrder">Đơn suất ăn F&B (MealOrder)</option>
                <option value="SpaBooking">Đặt lịch Spa (SpaBooking)</option>
                <option value="RetreatBooking">Đặt kỳ nghỉ (RetreatBooking)</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                Kết quả (Status)
              </label>
              <select
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setCurrentPage(1);
                }}
                style={{
                  width: '100%',
                  padding: '7px 10px',
                  fontSize: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  backgroundColor: '#ffffff'
                }}
              >
                <option value="all">Tất cả kết quả</option>
                <option value="SUCCESS">Thành công (SUCCESS)</option>
                <option value="DENIED">Bị từ chối (DENIED)</option>
              </select>
            </div>

            {/* From Date */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                Từ ngày
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => {
                    setFromDate(e.target.value);
                    setCurrentPage(1);
                  }}
                  style={{
                    width: '100%',
                    padding: '6px 10px 6px 28px',
                    fontSize: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px'
                  }}
                />
                <Calendar size={13} style={{ position: 'absolute', left: '8px', top: '9px', color: '#9ca3af' }} />
              </div>
            </div>

            {/* To Date */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                Đến ngày
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => {
                    setToDate(e.target.value);
                    setCurrentPage(1);
                  }}
                  style={{
                    width: '100%',
                    padding: '6px 10px 6px 28px',
                    fontSize: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px'
                  }}
                />
                <Calendar size={13} style={{ position: 'absolute', left: '8px', top: '9px', color: '#9ca3af' }} />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'var(--space-3)', paddingTop: 'var(--space-2)', borderTop: '1px solid #f3f4f6' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="submit"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: 'var(--actor-admin, #8b5cf6)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '6px 14px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <Filter size={13} />
                Lọc dữ liệu
              </button>
              <button
                type="button"
                onClick={handleResetFilters}
                style={{
                  backgroundColor: 'transparent',
                  color: 'var(--text-secondary, #6b7280)',
                  border: '1px solid #d1d5db',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                Đặt lại
              </button>
            </div>

            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Tìm thấy <strong style={{ color: 'var(--text-primary)' }}>{totalElements}</strong> bản ghi kiểm toán
            </span>
          </div>
        </form>
      </div>

      {/* Main Table Card */}
      <div className="hsw-gov-card" style={{ padding: 0, overflow: 'hidden', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
        {/* Error State */}
        {error ? (
          <div style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
            <AlertCircle size={36} style={{ color: '#ef4444', margin: '0 auto var(--space-2)' }} />
            <h3 style={{ margin: '0 0 var(--space-1)', fontSize: '15px', color: '#111827' }}>Không thể tải nhật ký kiểm toán</h3>
            <p style={{ margin: '0 0 var(--space-4)', fontSize: '13px', color: '#6b7280' }}>{error}</p>
            <button
              onClick={fetchAuditLogs}
              style={{
                backgroundColor: 'var(--actor-admin, #8b5cf6)',
                color: '#ffffff',
                border: 'none',
                padding: '8px 18px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Thử lại
            </button>
          </div>
        ) : loading ? (
          /* Loading State */
          <div style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
            <RefreshCw size={28} className="animate-spin" style={{ color: 'var(--actor-admin, #8b5cf6)', margin: '0 auto var(--space-2)' }} />
            <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>Đang tải nhật ký kiểm toán từ hệ thống...</p>
          </div>
        ) : (
          /* Table View */
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                  <th style={{ padding: '10px 14px', fontWeight: 600, color: '#374151', width: '80px' }}>ID</th>
                  <th style={{ padding: '10px 14px', fontWeight: 600, color: '#374151', width: '160px' }}>Thời gian</th>
                  <th style={{ padding: '10px 14px', fontWeight: 600, color: '#374151', width: '140px' }}>Tác nhân (Actor)</th>
                  <th style={{ padding: '10px 14px', fontWeight: 600, color: '#374151' }}>Hành động (Action)</th>
                  <th style={{ padding: '10px 14px', fontWeight: 600, color: '#374151', width: '160px' }}>Dữ liệu tác động</th>
                  <th style={{ padding: '10px 14px', fontWeight: 600, color: '#374151', width: '120px' }}>Tham chiếu</th>
                  <th style={{ padding: '10px 14px', fontWeight: 600, color: '#374151', width: '100px' }}>Kết quả</th>
                  <th style={{ padding: '10px 14px', fontWeight: 600, color: '#374151', width: '70px', textAlign: 'center' }}>Chi tiết</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: 'var(--space-8)', color: '#9ca3af' }}>
                      Không có bản ghi nhật ký kiểm toán nào khớp với bộ lọc.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => {
                    const status = normalizeAuditStatus(log.accessStatus);
                    const isSuccess = status === 'SUCCESS';

                    return (
                      <tr
                        key={log.auditLogId}
                        style={{ borderBottom: '1px solid #f3f4f6', transition: 'background-color 0.15s ease' }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#fafafa')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        <td style={{ padding: '10px 14px' }}>
                          <code style={{ fontSize: '11px', fontWeight: 600, color: '#4b5563' }}>#{log.auditLogId}</code>
                        </td>
                        <td style={{ padding: '10px 14px', color: '#6b7280', whiteSpace: 'nowrap' }}>
                          {formatAuditTimestamp(log.createdAt)}
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <div style={{ fontWeight: 600, color: '#111827' }}>
                            {log.actorRole || 'SYSTEM'}
                          </div>
                          <div style={{ fontSize: '10px', color: '#9ca3af' }}>
                            {log.actorUserId ? `User ID: ${log.actorUserId}` : 'Hệ thống'}
                            {log.delegationId ? ` · Ủy quyền #${log.delegationId}` : ''}
                          </div>
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <span
                            style={{
                              backgroundColor: '#f3f4f6',
                              color: '#1f2937',
                              padding: '2px 7px',
                              borderRadius: '4px',
                              fontWeight: 600,
                              fontSize: '11px'
                            }}
                          >
                            {log.action}
                          </span>
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <span
                            style={{
                              fontSize: '11px',
                              color: '#4b5563',
                              fontFamily: 'monospace',
                              backgroundColor: '#eef2ff',
                              padding: '2px 6px',
                              borderRadius: '3px'
                            }}
                          >
                            {log.targetDataType || '—'}
                          </span>
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <code style={{ fontSize: '11px', color: '#374151' }}>{log.targetRefId || '—'}</code>
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: '12px',
                              backgroundColor: isSuccess ? '#dcfce7' : '#fee2e2',
                              color: isSuccess ? '#15803d' : '#b91c1c'
                            }}
                          >
                            {log.accessStatus}
                          </span>
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                          <button
                            onClick={() => setSelectedLog(log)}
                            style={{
                              border: 'none',
                              backgroundColor: '#f3f4f6',
                              padding: '5px',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              color: '#4b5563'
                            }}
                            title="Xem chi tiết bản ghi"
                          >
                            <Eye size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Operational Pagination Footer */}
        {totalElements > 0 && (
          <div style={{ padding: 'var(--space-3) var(--space-4)', borderTop: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
            <OperationalPagination
              currentPage={currentPage}
              totalItems={totalElements}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={(newSize) => {
                setPageSize(newSize);
                setCurrentPage(1);
              }}
              pageSizeOptions={[10, 20, 50, 100]}
            />
          </div>
        )}
      </div>

      {/* Record Inspection Drawer */}
      {selectedLog && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            zIndex: 1000,
            display: 'flex',
            justifyContent: 'flex-end'
          }}
          onClick={() => setSelectedLog(null)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '480px',
              height: '100%',
              backgroundColor: '#ffffff',
              boxShadow: '-4px 0 20px rgba(0, 0, 0, 0.15)',
              display: 'flex',
              flexDirection: 'column',
              padding: 'var(--space-6)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e5e7eb', paddingBottom: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#111827' }}>
                  Chi Tiết Bản Ghi Kiểm Toán #{selectedLog.auditLogId}
                </h2>
                <span style={{ fontSize: '11px', color: '#6b7280' }}>
                  Thời gian: {formatAuditTimestamp(selectedLog.createdAt)}
                </span>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#6b7280' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <div style={{ padding: '10px', backgroundColor: '#f9fafb', borderRadius: '6px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: '#6b7280' }}>Tác nhân thực hiện</div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>
                    {selectedLog.actorRole || 'SYSTEM'} (User ID: {selectedLog.actorUserId ?? 'N/A'})
                  </div>
                  {selectedLog.delegationId && (
                    <div style={{ fontSize: '11px', color: '#2563eb', marginTop: '2px' }}>
                      Thực hiện theo Ủy Quyền ID #{selectedLog.delegationId}
                    </div>
                  )}
                </div>

                <div style={{ padding: '10px', backgroundColor: '#f9fafb', borderRadius: '6px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: '#6b7280' }}>Hành động & Dữ liệu</div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>{selectedLog.action}</div>
                  <div style={{ fontSize: '11px', color: '#4b5563', marginTop: '2px' }}>
                    Loại đối tượng: <strong>{selectedLog.targetDataType || 'N/A'}</strong> · Tham chiếu: <code>{selectedLog.targetRefId || 'N/A'}</code>
                  </div>
                </div>

                <div style={{ padding: '10px', backgroundColor: '#f9fafb', borderRadius: '6px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: '#6b7280' }}>Kết quả kiểm toán</div>
                  <span
                    style={{
                      display: 'inline-block',
                      marginTop: '4px',
                      fontSize: '12px',
                      fontWeight: 700,
                      padding: '3px 10px',
                      borderRadius: '12px',
                      backgroundColor: normalizeAuditStatus(selectedLog.accessStatus) === 'SUCCESS' ? '#dcfce7' : '#fee2e2',
                      color: normalizeAuditStatus(selectedLog.accessStatus) === 'SUCCESS' ? '#15803d' : '#b91c1c'
                    }}
                  >
                    {selectedLog.accessStatus}
                  </span>
                </div>

                {(selectedLog.oldValue || selectedLog.newValue) && (
                  <div style={{ padding: '10px', backgroundColor: '#f9fafb', borderRadius: '6px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: '#6b7280', marginBottom: '6px' }}>
                      Biến Động Dữ Liệu Cấu Hình (Diff)
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <div style={{ padding: '8px', backgroundColor: '#fee2e2', borderRadius: '4px' }}>
                        <div style={{ fontSize: '10px', fontWeight: 700, color: '#991b1b' }}>GIÁ TRỊ CŨ (Old)</div>
                        <code style={{ fontSize: '11px', color: '#7f1d1d', wordBreak: 'break-all' }}>
                          {selectedLog.oldValue || '(trống)'}
                        </code>
                      </div>
                      <div style={{ padding: '8px', backgroundColor: '#dcfce7', borderRadius: '4px' }}>
                        <div style={{ fontSize: '10px', fontWeight: 700, color: '#166534' }}>GIÁ TRỊ MỚI (New)</div>
                        <code style={{ fontSize: '11px', color: '#14532d', wordBreak: 'break-all' }}>
                          {selectedLog.newValue || '(trống)'}
                        </code>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div style={{ paddingTop: 'var(--space-3)', borderTop: '1px solid #e5e7eb' }}>
              <button
                onClick={() => setSelectedLog(null)}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '6px',
                  border: '1px solid #d1d5db',
                  backgroundColor: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
