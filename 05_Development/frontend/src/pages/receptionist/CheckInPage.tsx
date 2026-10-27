import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  Home,
  FileText,
  User,
  ArrowLeft,
  Save,
  Check,
  Key,
} from 'lucide-react';
import { useOperations } from '../../context/OperationsContext';
import {
  recordResidenceDeclaration,
  getReceptionistBookingDetail,
  type ReceptionistBookingDetailResponseDto,
} from '../../api/booking/retreatBookingApi';
import { useToast } from '../../components/common/Toast';
import { OperationalPageHeader } from '../../components/operations/OperationalPageHeader';
import { VillaStatusChip } from '../../components/operations/VillaStatusChip';
import type { CustomerIdentityVerification } from '../../types/operations';
import { formatVND } from '../../i18n';

export const CheckInPage: React.FC = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { showToast } = useToast();

  const {
    getArrivalByBookingRef,
    getVillaById,
    saveCheckInDraft,
    completeCheckIn,
    startCheckIn,
    refreshOperationsData,
  } = useOperations();

  const arrival = getArrivalByBookingRef(bookingId || '');
  const [backendDetail, setBackendDetail] = useState<ReceptionistBookingDetailResponseDto | null>(null);

  const currentLang = (i18n.language || 'en') as 'en' | 'vi' | 'zh-CN' | 'ja' | 'fr';

  // Mark arrived on entering check-in if currently 'expected'
  useEffect(() => {
    if (arrival && arrival.arrivalStatus === 'expected') {
      startCheckIn(arrival.bookingReference);
    }
  }, [arrival?.bookingReference]);

  // Form State for Identity & Residence (kept transient in-memory / session)
  const [formData, setFormData] = useState<CustomerIdentityVerification>({
    fullLegalName: arrival?.identityVerification?.fullLegalName || arrival?.customerName || '',
    nationality: arrival?.identityVerification?.nationality || 'Việt Nam',
    dateOfBirth: arrival?.identityVerification?.dateOfBirth || '',
    idType: arrival?.identityVerification?.idType || 'national_id',
    idNumber: arrival?.identityVerification?.idNumber || '',
    issueDate: arrival?.identityVerification?.issueDate || '',
    expiryDate: arrival?.identityVerification?.expiryDate || '',
    permanentAddress: arrival?.identityVerification?.permanentAddress || '',
    residenceCountry: arrival?.identityVerification?.residenceCountry || 'Việt Nam',
    arrivalTransport: arrival?.identityVerification?.arrivalTransport || 'Xe đưa đón của Resort',
    receptionistNotes: arrival?.identityVerification?.receptionistNotes || '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // One-way pre-fill: Load customer profile / residence record from SQL Server backend
  useEffect(() => {
    const numBookingId = parseInt((bookingId || '').replace(/\D/g, ''), 10);
    if (!isNaN(numBookingId) && numBookingId > 0) {
      getReceptionistBookingDetail(numBookingId)
        .then((detail) => {
          if (!detail) return;
          setBackendDetail(detail);

          setFormData((prev) => {
            const rec = detail.residenceRecord;
            const cust = detail.customerProfile;

            const fullLegalName =
              rec?.fullName ||
              prev.fullLegalName ||
              cust?.fullName ||
              detail.customerFullName ||
              arrival?.customerName ||
              '';
            const nationality =
              rec?.nationality ||
              (prev.nationality && prev.nationality !== 'Vietnam' ? prev.nationality : 'Việt Nam');
            const dateOfBirth =
              rec?.dateOfBirth ||
              prev.dateOfBirth ||
              (cust?.dateOfBirth ? String(cust.dateOfBirth) : '');
            const permanentAddress =
              rec?.permanentAddress ||
              prev.permanentAddress ||
              cust?.residentialAddress ||
              '';
            const idType = rec?.identificationType
              ? (rec.identificationType.toLowerCase() === 'cccd' || rec.identificationType.toLowerCase() === 'national_id'
                  ? 'national_id'
                  : (rec.identificationType.toLowerCase() as any))
              : prev.idType;
            const idNumber = rec?.identificationNumber || prev.idNumber || '';

            return {
              ...prev,
              fullLegalName,
              nationality,
              dateOfBirth,
              permanentAddress,
              idType,
              idNumber,
            };
          });
        })
        .catch((err) => {
          console.warn('Could not fetch receptionist booking detail:', err);
        });
    }
  }, [bookingId]);

  if (!arrival) {
    return (
      <div style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
        <AlertCircle size={40} style={{ color: '#C62828', margin: '0 auto 12px' }} />
        <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, color: 'var(--text-primary)' }}>
          {t('operations.checkIn.arrivalNotFound', 'Không tìm thấy hồ sơ đến')}
        </h2>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-4)' }}>
          {t('operations.checkIn.noArrivalMatchingRef', { bookingId, defaultValue: `Không tìm thấy lượt đến nào khớp với mã đặt chỗ "${bookingId}".` })}
        </p>
        <Link to="/receptionist/arrivals" className="hsw-btn hsw-btn-secondary">
          <ArrowLeft size={14} />
          <span>{t('operations.checkIn.returnToArrivals', 'Quay lại Danh Sách Đến')}</span>
        </Link>
      </div>
    );
  }

  const assignedVillaId =
    arrival?.assignedVillaId ||
    (backendDetail?.assignedVillaId ? String(backendDetail.assignedVillaId) : undefined);
  const assignedVillaNumber =
    arrival?.assignedVillaNumber ||
    (backendDetail?.assignedVillaNumber ? `Villa #${backendDetail.assignedVillaNumber}` : undefined);

  const assignedVilla =
    (assignedVillaId ? getVillaById(assignedVillaId) : undefined) ||
    (assignedVillaNumber ? getVillaById(assignedVillaNumber) : undefined);

  const retreatTitle =
    typeof arrival.retreatName === 'object'
      ? arrival.retreatName[currentLang] || arrival.retreatName.en
      : arrival.retreatName;

  // Validation conditions for final check-in
  const isDepositPaid = arrival.depositStatus === 'paid';
  const isIdentityComplete = Boolean(
    formData.fullLegalName.trim() &&
    formData.idNumber.trim() &&
    formData.permanentAddress.trim()
  );
  const isVillaAssigned = Boolean((assignedVillaId || assignedVillaNumber) && assignedVilla);
  const isVillaReady = assignedVilla?.status === 'ready' || assignedVilla?.status === 'reserved';
  const isVillaBlocked = assignedVilla?.status === 'maintenance' || assignedVilla?.status === 'cleaning';

  const canCompleteCheckIn = isDepositPaid && isIdentityComplete && isVillaAssigned && isVillaReady && !isVillaBlocked;

  const handleInputChange = (field: keyof CustomerIdentityVerification, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveDraft = async () => {
    saveCheckInDraft(arrival.bookingReference, formData);
    const numBookingId = parseInt(arrival.bookingReference.replace(/\D/g, ''), 10) || parseInt(arrival.id.replace(/\D/g, ''), 10);
    if (!isNaN(numBookingId)) {
      if (!formData.idNumber.trim()) {
        showToast('Vui lòng nhập Số Giấy Tờ Tùy Thân để lưu thông tin cư trú vào SQL Server.', 'warning');
        return;
      }
      try {
        await recordResidenceDeclaration(numBookingId, {
          fullName: formData.fullLegalName || arrival.customerName,
          nationality: formData.nationality,
          identificationNumber: formData.idNumber.trim(),
          identificationType: (formData.idType === 'national_id' ? 'CCCD' : formData.idType.toUpperCase()) || 'CCCD',
          dateOfBirth: formData.dateOfBirth,
          permanentAddress: formData.permanentAddress,
        });
        await refreshOperationsData();
        showToast('Đã lưu thông tin khai báo cư trú thành công vào hệ thống SQL Server.', 'success');
        return;
      } catch (err: any) {
        showToast(err?.response?.data?.message || err?.message || 'Lỗi khi lưu thông tin cư trú xuống SQL Server.', 'error');
        return;
      }
    }
    showToast('Đã lưu bản nháp thông tin nhận phòng và cư trú.', 'info');
  };

  const handleComplete = async () => {
    if (!canCompleteCheckIn) {
      showToast('Vui lòng hoàn tất toàn bộ điều kiện (tiền cọc, cư trú, biệt thự sẵn sàng) trước khi hoàn tất nhận phòng.', 'warning');
      return;
    }

    const targetVillaId = assignedVillaId || (assignedVilla ? assignedVilla.id : '');
    if (!targetVillaId) {
      showToast('Chưa xác định được biệt thự được phân bổ.', 'error');
      return;
    }

    setIsSubmitting(true);
    const result = await completeCheckIn(arrival.bookingReference, formData, targetVillaId);

    if (result.success) {
      showToast(result.message, 'success');
      await refreshOperationsData();
      setTimeout(() => {
        setIsSubmitting(false);
        navigate('/receptionist/arrivals');
      }, 500);
    } else {
      setIsSubmitting(false);
      showToast(result.message, 'error');
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <OperationalPageHeader
        title={t('operations.checkIn.title', 'Thủ Tục Nhận Phòng & Khai Báo Cư Trú')}
        subtitle={t('operations.checkIn.subtitle', 'Xác minh đặt chỗ, hoàn tất thông tin khai báo cư trú bắt buộc và tiến hành hoàn tất nhận phòng.')}
        badge="Screen #22"
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Link
              to="/receptionist/arrivals"
              className="hsw-btn hsw-btn-secondary"
              style={{ fontSize: 'var(--text-xs)', minHeight: '36px' }}
            >
              <ArrowLeft size={14} />
              <span>{t('operations.common.back', 'Quay Lại Danh Sách Đến')}</span>
            </Link>
            <button
              type="button"
              onClick={handleSaveDraft}
              className="hsw-btn hsw-btn-secondary"
              style={{ fontSize: 'var(--text-xs)', minHeight: '36px' }}
            >
              <Save size={14} />
              <span>{t('operations.common.saveDraft', 'Lưu Thông Tin Cư Trú')}</span>
            </button>
            <button
              type="button"
              onClick={handleComplete}
              disabled={!canCompleteCheckIn || isSubmitting || arrival.arrivalStatus === 'checked_in'}
              className="hsw-btn hsw-btn-primary"
              style={{ fontSize: 'var(--text-xs)', minHeight: '36px' }}
            >
              <Check size={14} />
              <span>
                {arrival.arrivalStatus === 'checked_in'
                  ? 'Đã Nhận Phòng'
                  : '✓ Hoàn Tất Nhận Phòng'}
              </span>
            </button>
          </div>
        }
      />

      {/* Main Grid: 2 Columns */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)', gap: 'var(--space-6)', alignItems: 'start' }}>
        
        {/* Left Column: Verification & Identity Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          
          {/* Section A: Booking Verification */}
          <div className="ops-card" style={{ padding: 'var(--space-5)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)', paddingBottom: 'var(--space-3)', borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={18} style={{ color: 'var(--accent-forest)' }} />
                <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                  {t('operations.checkIn.bookingVerification', 'Xác Minh Đặt Chỗ')}
                </h2>
              </div>
              <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 'var(--text-xs)', color: 'var(--accent-forest)', backgroundColor: 'var(--bg-soft)', padding: '2px 8px', borderRadius: 'var(--radius-pill)' }}>
                {arrival.bookingReference}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-3)', fontSize: 'var(--text-xs)' }}>
              <div>
                <span style={{ color: 'var(--text-tertiary)', display: 'block', marginBottom: '2px' }}>
                  {t('operations.common.customer', 'Khách hàng')}:
                </span>
                <strong style={{ color: 'var(--text-primary)', fontSize: 'var(--text-sm)' }}>
                  {arrival.customerName}
                </strong>
                <div style={{ color: 'var(--text-secondary)', marginTop: '2px' }}>
                  {arrival.customerPhone} • {arrival.customerEmail}
                </div>
              </div>

              <div>
                <span style={{ color: 'var(--text-tertiary)', display: 'block', marginBottom: '2px' }}>
                  {t('operations.common.retreat', 'Gói Nghỉ Dưỡng')}:
                </span>
                <strong style={{ color: 'var(--text-primary)', fontSize: 'var(--text-sm)' }}>
                  {retreatTitle}
                </strong>
                <div style={{ color: 'var(--text-secondary)', marginTop: '2px' }}>
                  {arrival.nights} {t('operations.common.nights', 'Đêm')} ({arrival.startDate} → {arrival.endDate})
                </div>
              </div>

              <div>
                <span style={{ color: 'var(--text-tertiary)', display: 'block', marginBottom: '2px' }}>
                  {t('operations.common.partySize', 'Số Lượng Khách')}:
                </span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  {arrival.partySize === 1
                    ? '1 Khách (Đi một mình)'
                    : `${arrival.partySize} Khách`}
                </span>
              </div>

              <div>
                <span style={{ color: 'var(--text-tertiary)', display: 'block', marginBottom: '2px' }}>
                  {t('operations.payment.requiredDeposit', 'Tiền Đặt Cọc Bắt Buộc')}:
                </span>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-pill)',
                    fontSize: '11px',
                    fontWeight: 600,
                    backgroundColor: isDepositPaid ? '#E8F5E9' : '#FFF8E1',
                    color: isDepositPaid ? '#1B5E20' : '#8C5400',
                    border: `1px solid ${isDepositPaid ? '#C8E6C9' : '#FFE082'}`,
                  }}
                >
                  {isDepositPaid ? 'Đã Thanh Toán' : 'Chờ Thanh Toán'}
                </span>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  {formatVND(arrival.depositAmount)} ({arrival.totalPrice ? Math.round((arrival.depositAmount / arrival.totalPrice) * 100) : 30}% tổng tiền)
                </div>
              </div>
            </div>

            {/* Privacy-compliant Safe Wellness Profile Flag */}
            <div
              style={{
                marginTop: 'var(--space-4)',
                padding: 'var(--space-3)',
                borderRadius: 'var(--radius-xs)',
                backgroundColor: 'var(--bg-soft)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '11px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                <CheckCircle2 size={14} style={{ color: '#1B5E20' }} />
                <span>Trạng thái hồ sơ sức khỏe:</span>
                <strong style={{ color: 'var(--accent-forest)' }}>
                  Đã Hoàn Thành Hồ Sơ Sức Khỏe
                </strong>
              </div>
              <span style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>
                (Chi tiết bệnh lý được bảo mật, chỉ Chuyên viên trị liệu được xem)
              </span>
            </div>
          </div>

          {/* Section B & C: Identity Verification & Residence Information */}
          <div className="ops-card" style={{ padding: 'var(--space-5)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-3)', paddingBottom: 'var(--space-3)', borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <User size={18} style={{ color: 'var(--accent-forest)' }} />
                <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                  Xác Minh Định Danh & Cư Trú
                </h2>
              </div>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-pill)',
                  fontSize: '11px',
                  fontWeight: 600,
                  backgroundColor: isIdentityComplete ? '#E8F5E9' : '#FFF8E1',
                  color: isIdentityComplete ? '#1B5E20' : '#8C5400',
                  border: `1px solid ${isIdentityComplete ? '#C8E6C9' : '#FFE082'}`,
                }}
              >
                {isIdentityComplete ? 'Đã Hoàn Thiện' : 'Chưa Đủ Thông Tin'}
              </span>
            </div>

            {/* Privacy Notice Banner (Section 8) */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                borderRadius: 'var(--radius-xs)',
                backgroundColor: 'var(--bg-canvas)',
                border: '1px solid var(--border-subtle)',
                marginBottom: 'var(--space-4)',
                fontSize: '11px',
                color: 'var(--text-secondary)',
              }}
            >
              <ShieldCheck size={16} style={{ color: 'var(--accent-forest)', flexShrink: 0 }} />
              <span>Thông tin định danh được bảo mật nghiêm ngặt — chỉ thu thập để phục vụ khai báo cư trú theo Luật Cư trú 2020.</span>
            </div>

            {/* Form Fields */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-4)', fontSize: 'var(--text-xs)' }}>
              
              {/* Legal Name */}
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Họ và Tên Đầy Đủ (Theo Hộ Chiếu/CCCD) *
                </label>
                <input
                  type="text"
                  value={formData.fullLegalName}
                  onChange={(e) => handleInputChange('fullLegalName', e.target.value)}
                  placeholder="VD: Nguyễn Văn An"
                  style={{
                    width: '100%',
                    height: '36px',
                    padding: '0 10px',
                    fontSize: 'var(--text-xs)',
                    borderRadius: 'var(--radius-xs)',
                    border: '1px solid var(--border-strong)',
                    backgroundColor: 'var(--bg-canvas)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>

              {/* Nationality */}
              <div>
                <label style={{ display: 'block', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Quốc Tịch *
                </label>
                <input
                  type="text"
                  value={formData.nationality}
                  onChange={(e) => handleInputChange('nationality', e.target.value)}
                  placeholder="Việt Nam"
                  style={{
                    width: '100%',
                    height: '36px',
                    padding: '0 10px',
                    fontSize: 'var(--text-xs)',
                    borderRadius: 'var(--radius-xs)',
                    border: '1px solid var(--border-strong)',
                    backgroundColor: 'var(--bg-canvas)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>

              {/* Date of Birth */}
              <div>
                <label style={{ display: 'block', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Ngày Sinh *
                </label>
                <input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                  style={{
                    width: '100%',
                    height: '36px',
                    padding: '0 10px',
                    fontSize: 'var(--text-xs)',
                    borderRadius: 'var(--radius-xs)',
                    border: '1px solid var(--border-strong)',
                    backgroundColor: 'var(--bg-canvas)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>

              {/* ID Type */}
              <div>
                <label style={{ display: 'block', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Loại Giấy Tờ Tùy Thân *
                </label>
                <select
                  value={formData.idType}
                  onChange={(e) => handleInputChange('idType', e.target.value as any)}
                  style={{
                    width: '100%',
                    height: '36px',
                    padding: '0 10px',
                    fontSize: 'var(--text-xs)',
                    borderRadius: 'var(--radius-xs)',
                    border: '1px solid var(--border-strong)',
                    backgroundColor: 'var(--bg-canvas)',
                    color: 'var(--text-primary)',
                  }}
                >
                  <option value="national_id">Căn Cước Công Dân (CCCD)</option>
                  <option value="passport">Hộ Chiếu (Passport)</option>
                  <option value="driver_license">Giấy Phép Lái Xe</option>
                </select>
              </div>

              {/* ID Number */}
              <div>
                <label style={{ display: 'block', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Số Giấy Tờ *
                </label>
                <input
                  type="text"
                  value={formData.idNumber}
                  onChange={(e) => handleInputChange('idNumber', e.target.value)}
                  placeholder="VD: 001088012345"
                  style={{
                    width: '100%',
                    height: '36px',
                    padding: '0 10px',
                    fontSize: 'var(--text-xs)',
                    borderRadius: 'var(--radius-xs)',
                    border: '1px solid var(--border-strong)',
                    backgroundColor: 'var(--bg-canvas)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>

              {/* Permanent Address */}
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Địa Chỉ Thường Trú / Tỉnh Thành *
                </label>
                <input
                  type="text"
                  value={formData.permanentAddress}
                  onChange={(e) => handleInputChange('permanentAddress', e.target.value)}
                  placeholder="VD: Số 28 Trần Hưng Đạo, Hoàn Kiếm, Hà Nội"
                  style={{
                    width: '100%',
                    height: '36px',
                    padding: '0 10px',
                    fontSize: 'var(--text-xs)',
                    borderRadius: 'var(--radius-xs)',
                    border: '1px solid var(--border-strong)',
                    backgroundColor: 'var(--bg-canvas)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>

              {/* Arrival Transportation */}
              <div>
                <label style={{ display: 'block', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Phương Tiện Di Chuyển Đến
                </label>
                <input
                  type="text"
                  value={formData.arrivalTransport}
                  onChange={(e) => handleInputChange('arrivalTransport', e.target.value)}
                  placeholder="VD: Xe riêng / Xe đưa đón resort"
                  style={{
                    width: '100%',
                    height: '36px',
                    padding: '0 10px',
                    fontSize: 'var(--text-xs)',
                    borderRadius: 'var(--radius-xs)',
                    border: '1px solid var(--border-strong)',
                    backgroundColor: 'var(--bg-canvas)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>

              {/* Receptionist Notes */}
              <div>
                <label style={{ display: 'block', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Ghi Chú Tiếp Đón / Lễ Tân
                </label>
                <input
                  type="text"
                  value={formData.receptionistNotes}
                  onChange={(e) => handleInputChange('receptionistNotes', e.target.value)}
                  placeholder="Ghi chú nghiệp vụ lễ tân (tùy chọn)..."
                  style={{
                    width: '100%',
                    height: '36px',
                    padding: '0 10px',
                    fontSize: 'var(--text-xs)',
                    borderRadius: 'var(--radius-xs)',
                    border: '1px solid var(--border-strong)',
                    backgroundColor: 'var(--bg-canvas)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Villa Assignment Status & Readiness Checklist */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', position: 'sticky', top: 'calc(var(--space-6) + 60px)' }}>
          
          {/* Section E: Villa Assignment Status */}
          <div className="ops-card" style={{ padding: 'var(--space-5)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)', paddingBottom: 'var(--space-3)', borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Home size={18} style={{ color: 'var(--accent-forest)' }} />
                <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                  Trạng Thái Villa Phân Bổ
                </h2>
              </div>
              <Link
                to={`/receptionist/check-in/${arrival.bookingReference}/villa`}
                className="hsw-btn hsw-btn-secondary"
                style={{ minHeight: '30px', padding: '0 10px', fontSize: '11px' }}
              >
                {assignedVilla
                  ? 'Đổi Biệt Thự'
                  : 'Phân Bổ Biệt Thự'}
              </Link>
            </div>

            {assignedVilla ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Biệt thự #{assignedVilla.code.replace(/^Villa\s*#?/i, '')} ({assignedVilla.category})
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      {assignedVilla.category} • Sức chứa: {assignedVilla.capacity} người • {assignedVilla.bedType}
                    </div>
                  </div>
                  <VillaStatusChip status={assignedVilla.status} housekeeping={assignedVilla.housekeeping} />
                </div>

                {assignedVilla.status === 'cleaning' && (
                  <div
                    style={{
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-xs)',
                      backgroundColor: '#FFF8E1',
                      border: '1px solid #FFE082',
                      fontSize: '11px',
                      color: '#8C5400',
                    }}
                  >
                    ⚠️ Buồng phòng đang dọn dẹp biệt thự này. Chỉ có thể hoàn tất nhận phòng khi buồng phòng chuyển trạng thái Sẵn Sàng.
                  </div>
                )}

                {assignedVilla.status === 'maintenance' && (
                  <div
                    style={{
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-xs)',
                      backgroundColor: '#FFEBEE',
                      border: '1px solid #FFCDD2',
                      fontSize: '11px',
                      color: '#C62828',
                    }}
                  >
                    ❌ Biệt thự đang bảo trì. Vui lòng đổi sang một căn biệt thự khác đang sẵn sàng.
                  </div>
                )}
              </div>
            ) : (
              <div style={{ padding: 'var(--space-4)', textAlign: 'center', backgroundColor: 'var(--bg-canvas)', borderRadius: 'var(--radius-xs)' }}>
                <div style={{ color: '#C62828', fontWeight: 600, fontSize: 'var(--text-xs)', marginBottom: '8px' }}>
                  Chưa phân bổ villa
                </div>
                <Link
                  to={`/receptionist/check-in/${arrival.bookingReference}/villa`}
                  className="hsw-btn hsw-btn-primary"
                  style={{ minHeight: '34px', fontSize: '11px' }}
                >
                  <Home size={14} />
                  <span>Phân Bổ Villa Ngay</span>
                </Link>
              </div>
            )}
          </div>

          {/* Section F: Check-In Readiness Verification Checklist */}
          <div className="ops-card" style={{ padding: 'var(--space-5)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-4)', paddingBottom: 'var(--space-3)', borderBottom: '1px solid var(--border-subtle)' }}>
              <CheckCircle2 size={18} style={{ color: 'var(--accent-forest)' }} />
              <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                Kiểm Tra Điều Kiện Nhận Phòng
              </h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {/* 1. Deposit Paid */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', borderRadius: 'var(--radius-xs)', backgroundColor: isDepositPaid ? '#E8F5E9' : '#FFF8E1' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px' }}>
                  {isDepositPaid ? <CheckCircle2 size={16} color="#1B5E20" /> : <Clock size={16} color="#8C5400" />}
                  <span style={{ fontWeight: 600, color: isDepositPaid ? '#1B5E20' : '#8C5400' }}>
                    1. Tiền Cọc Đã Xác Nhận (Đã Thanh Toán)
                  </span>
                </div>
                <span style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', color: isDepositPaid ? '#1B5E20' : '#8C5400' }}>
                  {isDepositPaid ? 'ĐÃ XÁC NHẬN' : 'CHỜ THANH TOÁN'}
                </span>
              </div>

              {/* 2. Identity Verification Complete */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', borderRadius: 'var(--radius-xs)', backgroundColor: isIdentityComplete ? '#E8F5E9' : '#FFF8E1' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px' }}>
                  {isIdentityComplete ? <CheckCircle2 size={16} color="#1B5E20" /> : <Clock size={16} color="#8C5400" />}
                  <span style={{ fontWeight: 600, color: isIdentityComplete ? '#1B5E20' : '#8C5400' }}>
                    2. Thông Tin Cư Trú & Định Danh Đầy Đủ
                  </span>
                </div>
                <span style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', color: isIdentityComplete ? '#1B5E20' : '#8C5400' }}>
                  {isIdentityComplete ? 'ĐÃ HOÀN THIỆN' : 'CHƯA ĐỦ THÔNG TIN'}
                </span>
              </div>

              {/* 3. Villa Assigned & Ready */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', borderRadius: 'var(--radius-xs)', backgroundColor: isVillaAssigned && isVillaReady && !isVillaBlocked ? '#E8F5E9' : '#FFEBEE' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px' }}>
                  {isVillaAssigned && isVillaReady && !isVillaBlocked ? (
                    <CheckCircle2 size={16} color="#1B5E20" />
                  ) : (
                    <AlertCircle size={16} color="#C62828" />
                  )}
                  <span style={{ fontWeight: 600, color: isVillaAssigned && isVillaReady && !isVillaBlocked ? '#1B5E20' : '#C62828' }}>
                    3. Đã Phân Bổ Villa & Sạch Sẽ / Sẵn Sàng
                  </span>
                </div>
                <span style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', color: isVillaAssigned && isVillaReady && !isVillaBlocked ? '#1B5E20' : '#C62828' }}>
                  {isVillaAssigned && isVillaReady && !isVillaBlocked ? 'SẴN SÀNG' : 'CHƯA SẴN SÀNG'}
                </span>
              </div>
            </div>

            {/* Check-In Action Button */}
            <div style={{ marginTop: 'var(--space-5)' }}>
              {canCompleteCheckIn ? (
                <button
                  type="button"
                  onClick={handleComplete}
                  disabled={isSubmitting || arrival.arrivalStatus === 'checked_in'}
                  className="hsw-btn hsw-btn-primary"
                  style={{ width: '100%', minHeight: '44px', fontSize: 'var(--text-sm)' }}
                >
                  <Key size={16} />
                  <span>
                    {arrival.arrivalStatus === 'checked_in'
                      ? 'Kỳ Nghỉ Đã Hoàn Tất Nhận Phòng'
                      : '✓ Hoàn Tất Nhận Phòng & Bàn Giao Khóa'}
                  </span>
                </button>
              ) : (
                <div style={{ textAlign: 'center', fontSize: '11px', color: 'var(--text-secondary)', padding: 'var(--space-2)' }}>
                  Cần thỏa mãn đầy đủ cả 3 điều kiện sẵn sàng trước khi hoàn tất nhận phòng.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

