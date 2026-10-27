import React, { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Search,
  ArrowRight,
  AlertCircle,
  Plus,
  X,
} from 'lucide-react';
import { useOperations } from '../../context/OperationsContext';
import { useToast } from '../../components/common/Toast';
import { Button } from '../../components/common/Button';
import { OperationalPageHeader } from '../../components/operations/OperationalPageHeader';
import { OperationalStatusChip } from '../../components/operations/OperationalStatusChip';
import { ResidenceDeclarationSummary } from '../../components/operations/ResidenceDeclarationSummary';
import { OperationalPagination } from '../../components/operations/OperationalPagination';
import {
  createWalkInBooking,
  getRetreatPackages,
  getVillaCategories,
  type RetreatPackageDto,
  type VillaCategoryDto,
} from '../../api/booking/retreatBookingApi';

export const DailyArrivalsPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { arrivals, todayDate } = useOperations();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [readinessFilter, setReadinessFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Walk-in booking state
  const [isWalkInModalOpen, setIsWalkInModalOpen] = useState(false);
  const [packages, setPackages] = useState<RetreatPackageDto[]>([]);
  const [categories, setCategories] = useState<VillaCategoryDto[]>([]);
  const [walkInName, setWalkInName] = useState('');
  const [walkInEmail, setWalkInEmail] = useState('');
  const [walkInPhone, setWalkInPhone] = useState('');
  const [walkInPkgId, setWalkInPkgId] = useState<number>(1);
  const [walkInCatId, setWalkInCatId] = useState<number>(1);
  const todayStr = new Date().toISOString().split('T')[0];
  const [walkInCheckIn, setWalkInCheckIn] = useState(todayStr);
  const [walkInCheckOut, setWalkInCheckOut] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split('T')[0];
  });
  const [walkInGuests, setWalkInGuests] = useState<number>(1);
  const [walkInPaymentMethod, setWalkInPaymentMethod] = useState<'CASH' | 'POS' | 'VNPAY'>('CASH');
  const [walkInSubmitting, setWalkInSubmitting] = useState(false);
  const [walkInError, setWalkInError] = useState<string | null>(null);

  const autoCalcCheckOut = (inDate: string, pkgId: number, currentPkgs: RetreatPackageDto[] = packages) => {
    const pkg = currentPkgs.find((p) => p.retreatPackageId === pkgId);
    const nights = pkg ? pkg.durationNights : 3;
    if (!inDate) return;
    const parts = inDate.split('-');
    if (parts.length === 3) {
      const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      d.setDate(d.getDate() + nights);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      setWalkInCheckOut(`${yyyy}-${mm}-${dd}`);
    }
  };

  useEffect(() => {
    getRetreatPackages().then((pkgs) => {
      setPackages(pkgs);
      if (pkgs && pkgs.length > 0) {
        setWalkInPkgId(pkgs[0].retreatPackageId);
        autoCalcCheckOut(walkInCheckIn, pkgs[0].retreatPackageId, pkgs);
        if (pkgs[0].eligibleVillaCategories && pkgs[0].eligibleVillaCategories.length > 0) {
          setWalkInCatId(pkgs[0].eligibleVillaCategories[0].villaCategoryId);
        }
      }
    }).catch(() => {});
    getVillaCategories().then(setCategories).catch(() => {});
  }, []);

  const handleCreateWalkIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setWalkInError(null);

    if (!walkInName.trim()) {
      setWalkInError('Vui lòng nhập họ và tên đầy đủ của khách (theo CCCD/Hộ chiếu).');
      return;
    }
    if (!walkInEmail.trim() || !walkInEmail.includes('@')) {
      setWalkInError('Vui lòng nhập địa chỉ email hợp lệ.');
      return;
    }
    if (!walkInPhone.trim()) {
      setWalkInError('Vui lòng nhập số điện thoại liên hệ.');
      return;
    }
    if (walkInCheckIn < todayStr) {
      setWalkInError('Ngày nhận phòng không thể ở trong quá khứ.');
      return;
    }
    if (walkInCheckOut <= walkInCheckIn) {
      setWalkInError('Ngày trả phòng phải sau ngày nhận phòng.');
      return;
    }

    setWalkInSubmitting(true);
    try {
      const res = await createWalkInBooking({
        customerFullName: walkInName.trim(),
        customerEmail: walkInEmail.trim(),
        customerPhone: walkInPhone.trim(),
        retreatPackageId: walkInPkgId,
        requestedVillaCategoryId: walkInCatId,
        checkInDate: walkInCheckIn,
        checkOutDate: walkInCheckOut,
        guestCount: walkInGuests,
        depositPaymentMethod: walkInPaymentMethod,
      });

      setIsWalkInModalOpen(false);
      showToast(`Tạo đặt phòng trực tiếp thành công! Mã đặt chỗ: #${res.retreatBookingId}`, 'success');
      navigate(`/receptionist/check-in/${res.retreatBookingId}`);
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || err?.message || 'Không thể tạo đặt phòng trực tiếp.';
      setWalkInError(errMsg);
    } finally {
      setWalkInSubmitting(false);
    }
  };

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

  // Reset to page 1 when filters change
  const handleFilterChange = (setter: React.Dispatch<React.SetStateAction<string>>) => (value: string) => {
    setter(value);
    setCurrentPage(1);
  };

  // Paginated slice
  const paginatedArrivals = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredArrivals.slice(start, start + pageSize);
  }, [filteredArrivals, currentPage, pageSize]);

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto' }}>
      {/* Header */}
      <OperationalPageHeader
        title={t('operations.arrivals.title', 'Daily Arrivals & Check-In Queue')}
        subtitle={t('operations.arrivals.subtitle', 'Monitor expected customer arrivals, review villa assignments, and verify check-in readiness.')}
        badge="Screen #21"
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
              {todayDate}
            </span>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsWalkInModalOpen(true)}
              icon={<Plus size={14} />}
            >
              + Tạo Đặt Phòng Trực Tiếp (Walk-in)
            </Button>
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
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
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
              onChange={(e) => handleFilterChange(setStatusFilter)(e.target.value)}
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
              onChange={(e) => handleFilterChange(setReadinessFilter)(e.target.value)}
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
          <>
          <div className="ops-table-wrap">
            <table className="ops-table ops-table-striped" style={{ fontSize: 'var(--text-xs)' }}>
              <thead>
                <tr>
                  <th>
                    {t('operations.common.eta', 'ETA')}
                  </th>
                  <th>
                    {t('operations.common.customer', 'Customer')}
                  </th>
                  <th>
                    {t('operations.common.bookingRef', 'Booking Ref')}
                  </th>
                  <th>
                    {t('operations.common.retreat', 'Retreat')}
                  </th>
                  <th>
                    {t('operations.common.dates', 'Stay Dates')}
                  </th>
                  <th>
                    {t('operations.common.deposit', 'Deposit')}
                  </th>
                  <th>
                    {t('operations.common.villa', 'Villa Assignment')}
                  </th>
                  <th>
                    {t('operations.common.status', 'Arrival Status')}
                  </th>
                  <th>
                    {t('operations.common.residenceDecl', 'Residence Decl.')}
                  </th>
                  <th style={{ textAlign: 'right' }}>
                    {t('operations.common.action', 'Action')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedArrivals.map((arrival) => {
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
          {/* Pagination */}
          <OperationalPagination
            currentPage={currentPage}
            totalItems={filteredArrivals.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            pageSizeOptions={[10, 25, 50]}
            onPageSizeChange={setPageSize}
          />
          </>
        )}
      </div>
      {/* Walk-In Booking Modal */}
      {isWalkInModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 19, 0.65)',
            backdropFilter: 'blur(4px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'var(--space-4)',
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--surface)',
              borderRadius: 'var(--radius-md)',
              maxWidth: '540px',
              width: '100%',
              padding: 'var(--space-6)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Plus size={18} style={{ color: 'var(--accent-forest)' }} />
                <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, margin: 0 }}>
                  + Tạo Thủ Tục Đặt Phòng Trực Tiếp Tại Quầy
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsWalkInModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            {walkInError && (
              <div style={{ padding: '10px 12px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(185, 28, 28, 0.08)', color: '#b91c1c', fontSize: 'var(--text-xs)', marginBottom: 'var(--space-4)' }}>
                {walkInError}
              </div>
            )}

            <form onSubmit={handleCreateWalkIn}>
              <div style={{ marginBottom: 'var(--space-3)' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '4px' }}>Họ và Tên Đầy Đủ Của Khách (Theo CCCD/Hộ Chiếu) *</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Nguyễn Văn An"
                  value={walkInName}
                  onChange={(e) => setWalkInName(e.target.value)}
                  style={{ width: '100%', padding: '8px', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-xs)' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '4px' }}>Địa Chỉ Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="khachhang@example.com"
                    value={walkInEmail}
                    onChange={(e) => setWalkInEmail(e.target.value)}
                    style={{ width: '100%', padding: '8px', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-xs)' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '4px' }}>Số Điện Thoại Liên Hệ *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+84 901 234 567"
                    value={walkInPhone}
                    onChange={(e) => setWalkInPhone(e.target.value)}
                    style={{ width: '100%', padding: '8px', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-xs)' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 'var(--space-3)' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '4px' }}>Gói Nghỉ Dưỡng *</label>
                <select
                  value={walkInPkgId}
                  onChange={(e) => {
                    const pkgId = parseInt(e.target.value, 10);
                    setWalkInPkgId(pkgId);
                    const pkg = packages.find((p) => p.retreatPackageId === pkgId);
                    if (pkg && pkg.eligibleVillaCategories && pkg.eligibleVillaCategories.length > 0) {
                      setWalkInCatId(pkg.eligibleVillaCategories[0].villaCategoryId);
                    }
                    autoCalcCheckOut(walkInCheckIn, pkgId);
                  }}
                  style={{ width: '100%', padding: '8px', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-xs)' }}
                >
                  {packages.map((p) => (
                    <option key={p.retreatPackageId} value={p.retreatPackageId}>
                      {p.packageName} ({p.durationNights} Đêm - {p.wellnessGoal})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: 'var(--space-3)' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '4px' }}>Hạng Biệt Thự *</label>
                <select
                  value={walkInCatId}
                  onChange={(e) => setWalkInCatId(parseInt(e.target.value, 10))}
                  style={{ width: '100%', padding: '8px', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-xs)' }}
                >
                  {categories.map((c) => (
                    <option key={c.villaCategoryId} value={c.villaCategoryId}>
                      {c.categoryName} (Tối đa {c.maxOccupancy} khách)
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '4px' }}>Ngày Nhận Phòng *</label>
                  <input
                    type="date"
                    required
                    min={todayStr}
                    value={walkInCheckIn}
                    onChange={(e) => {
                      const val = e.target.value;
                      setWalkInCheckIn(val);
                      autoCalcCheckOut(val, walkInPkgId);
                    }}
                    style={{ width: '100%', padding: '8px', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-xs)' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '4px' }}>Ngày Trả Phòng *</label>
                  <input
                    type="date"
                    required
                    value={walkInCheckOut}
                    onChange={(e) => setWalkInCheckOut(e.target.value)}
                    style={{ width: '100%', padding: '8px', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-xs)' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)', marginBottom: 'var(--space-5)' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '4px' }}>Số Lượng Khách *</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    required
                    value={walkInGuests}
                    onChange={(e) => setWalkInGuests(parseInt(e.target.value, 10) || 1)}
                    style={{ width: '100%', padding: '8px', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-xs)' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '4px' }}>Phương Thức Thanh Toán Tiền Cọc *</label>
                  <select
                    value={walkInPaymentMethod}
                    onChange={(e) => setWalkInPaymentMethod(e.target.value as any)}
                    style={{ width: '100%', padding: '8px', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-xs)' }}
                  >
                    <option value="CASH">Tiền mặt tại quầy lễ tân</option>
                    <option value="VNPAY">Quét mã QR VNPay</option>
                    <option value="POS">Quẹt thẻ POS tại quầy</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
                <Button variant="secondary" size="sm" type="button" onClick={() => setIsWalkInModalOpen(false)}>
                  Hủy Bỏ
                </Button>
                <Button variant="primary" size="sm" type="submit" disabled={walkInSubmitting}>
                  {walkInSubmitting ? 'Đang tạo đặt phòng...' : 'Tạo Đặt Phòng & Chuyển Sang Nhận Phòng'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

