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
import { useToast } from '../../components/common/Toast';
import { OperationalPageHeader } from '../../components/operations/OperationalPageHeader';
import { OperationalStatusChip } from '../../components/operations/OperationalStatusChip';
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
  } = useOperations();

  const arrival = getArrivalByBookingRef(bookingId || '');
  const assignedVilla = arrival?.assignedVillaId ? getVillaById(arrival.assignedVillaId) : undefined;

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
    nationality: arrival?.identityVerification?.nationality || 'Vietnam',
    dateOfBirth: arrival?.identityVerification?.dateOfBirth || '',
    idType: arrival?.identityVerification?.idType || 'passport',
    idNumber: arrival?.identityVerification?.idNumber || '',
    issueDate: arrival?.identityVerification?.issueDate || '',
    expiryDate: arrival?.identityVerification?.expiryDate || '',
    permanentAddress: arrival?.identityVerification?.permanentAddress || '',
    residenceCountry: arrival?.identityVerification?.residenceCountry || 'Vietnam',
    arrivalTransport: arrival?.identityVerification?.arrivalTransport || 'Resort Airport Shuttle',
    receptionistNotes: arrival?.identityVerification?.receptionistNotes || '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!arrival) {
    return (
      <div style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
        <AlertCircle size={40} style={{ color: '#C62828', margin: '0 auto 12px' }} />
        <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, color: 'var(--text-primary)' }}>
          Arrival Record Not Found
        </h2>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-4)' }}>
          No arrival matching booking reference "{bookingId}" was found in the daily queue.
        </p>
        <Link to="/receptionist/arrivals" className="hsw-btn hsw-btn-secondary">
          <ArrowLeft size={14} />
          <span>Return to Daily Arrivals</span>
        </Link>
      </div>
    );
  }

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
  const isVillaAssigned = Boolean(arrival.assignedVillaId && assignedVilla);
  const isVillaReady = assignedVilla?.status === 'ready' || assignedVilla?.status === 'reserved';
  const isVillaBlocked = assignedVilla?.status === 'maintenance' || assignedVilla?.status === 'cleaning';

  const canCompleteCheckIn = isDepositPaid && isIdentityComplete && isVillaAssigned && isVillaReady && !isVillaBlocked;

  const handleInputChange = (field: keyof CustomerIdentityVerification, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveDraft = () => {
    saveCheckInDraft(arrival.bookingReference, formData);
    showToast(t('operations.checkIn.draftSaved', 'Check-in and residence details saved to operational draft.'), 'info');
  };

  const handleComplete = () => {
    if (!canCompleteCheckIn || !arrival.assignedVillaId) {
      showToast(t('operations.checkIn.cannotCheckInNotice', 'All readiness requirements must be fulfilled before completing check-in.'), 'warning');
      return;
    }

    setIsSubmitting(true);
    const result = completeCheckIn(arrival.bookingReference, formData, arrival.assignedVillaId);

    if (result.success) {
      showToast(result.message, 'success');
      // Navigate to arrivals or refresh view
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
        title={t('operations.checkIn.title', 'Check-In & Residence Information')}
        subtitle={t('operations.checkIn.subtitle', 'Verify retreat reservation, complete mandatory residence reporting details, and finalize villa check-in.')}
        badge="Screen #22"
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Link
              to="/receptionist/arrivals"
              className="hsw-btn hsw-btn-secondary"
              style={{ fontSize: 'var(--text-xs)', minHeight: '36px' }}
            >
              <ArrowLeft size={14} />
              <span>{t('operations.common.back', 'Back to Arrivals')}</span>
            </Link>
            <button
              type="button"
              onClick={handleSaveDraft}
              className="hsw-btn hsw-btn-secondary"
              style={{ fontSize: 'var(--text-xs)', minHeight: '36px' }}
            >
              <Save size={14} />
              <span>{t('operations.common.saveDraft', 'Save Draft')}</span>
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
                  ? t('operations.arrivals.checkedInBadge', 'Already Checked In')
                  : t('operations.common.complete', 'Complete Check-In')}
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
          <div
            style={{
              backgroundColor: 'var(--surface)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
              padding: 'var(--space-5)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)', paddingBottom: 'var(--space-3)', borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={18} style={{ color: 'var(--accent-forest)' }} />
                <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                  {t('operations.checkIn.bookingVerification', 'Booking Verification')}
                </h2>
              </div>
              <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 'var(--text-xs)', color: 'var(--accent-forest)', backgroundColor: 'var(--bg-soft)', padding: '2px 8px', borderRadius: 'var(--radius-pill)' }}>
                {arrival.bookingReference}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-3)', fontSize: 'var(--text-xs)' }}>
              <div>
                <span style={{ color: 'var(--text-tertiary)', display: 'block', marginBottom: '2px' }}>
                  {t('operations.common.customer', 'Customer')}:
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
                  {t('operations.common.retreat', 'Retreat Package')}:
                </span>
                <strong style={{ color: 'var(--text-primary)', fontSize: 'var(--text-sm)' }}>
                  {retreatTitle}
                </strong>
                <div style={{ color: 'var(--text-secondary)', marginTop: '2px' }}>
                  {arrival.nights} Nights ({arrival.startDate} → {arrival.endDate})
                </div>
              </div>

              <div>
                <span style={{ color: 'var(--text-tertiary)', display: 'block', marginBottom: '2px' }}>
                  {t('operations.common.partySize', 'Party Size')}:
                </span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  {arrival.partySize} {arrival.partySize === 1 ? 'Customer (Solo)' : 'Customers'}
                </span>
              </div>

              <div>
                <span style={{ color: 'var(--text-tertiary)', display: 'block', marginBottom: '2px' }}>
                  Required Deposit:
                </span>
                <OperationalStatusChip type="deposit" status={arrival.depositStatus} size="sm" />
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  {formatVND(arrival.depositAmount)} ({Math.round((arrival.depositAmount / (arrival.totalPrice || 1)) * 100)}% of total)
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
                <span>Wellness Intake Status:</span>
                <strong style={{ color: 'var(--accent-forest)' }}>
                  {t('operations.common.wellnessProfileCompleted', 'Wellness Profile Completed')}
                </strong>
              </div>
              <span style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>
                (Health details restricted to Therapist)
              </span>
            </div>
          </div>

          {/* Section B & C: Identity Verification & Residence Information */}
          <div
            style={{
              backgroundColor: 'var(--surface)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
              padding: 'var(--space-5)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-3)', paddingBottom: 'var(--space-3)', borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <User size={18} style={{ color: 'var(--accent-forest)' }} />
                <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                  {t('operations.checkIn.identityVerification', 'Identity & Residence Verification')}
                </h2>
              </div>
              <OperationalStatusChip type="residence" status={arrival.residenceDeclarationStatus} size="sm" />
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
              <span>{t('operations.common.protectedSensitiveData', 'Protected sensitive information — processed strictly under residency compliance standards.')}</span>
            </div>

            {/* Form Fields */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-4)', fontSize: 'var(--text-xs)' }}>
              
              {/* Legal Name */}
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  {t('operations.checkIn.fullLegalName', 'Full Legal Name (as in Passport/ID)')} *
                </label>
                <input
                  type="text"
                  value={formData.fullLegalName}
                  onChange={(e) => handleInputChange('fullLegalName', e.target.value)}
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
                  {t('operations.checkIn.nationality', 'Nationality')} *
                </label>
                <input
                  type="text"
                  value={formData.nationality}
                  onChange={(e) => handleInputChange('nationality', e.target.value)}
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
                  {t('operations.checkIn.dob', 'Date of Birth')} *
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
                  {t('operations.checkIn.idType', 'Identity Document Type')} *
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
                  <option value="passport">{t('operations.checkIn.passport', 'Passport')}</option>
                  <option value="national_id">{t('operations.checkIn.nationalId', 'National Citizen ID')}</option>
                  <option value="driver_license">{t('operations.checkIn.driverLicense', "Driver's License")}</option>
                </select>
              </div>

              {/* ID Number */}
              <div>
                <label style={{ display: 'block', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  {t('operations.checkIn.idNumber', 'Document Number')} *
                </label>
                <input
                  type="text"
                  value={formData.idNumber}
                  onChange={(e) => handleInputChange('idNumber', e.target.value)}
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
                  {t('operations.checkIn.permanentAddress', 'Permanent Address / Residential City')} *
                </label>
                <input
                  type="text"
                  value={formData.permanentAddress}
                  onChange={(e) => handleInputChange('permanentAddress', e.target.value)}
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
                  {t('operations.checkIn.arrivalTransport', 'Arrival Transportation')}
                </label>
                <input
                  type="text"
                  value={formData.arrivalTransport}
                  onChange={(e) => handleInputChange('arrivalTransport', e.target.value)}
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
                  {t('operations.checkIn.receptionistNotes', 'Front Desk / Arrival Notes')}
                </label>
                <input
                  type="text"
                  value={formData.receptionistNotes}
                  onChange={(e) => handleInputChange('receptionistNotes', e.target.value)}
                  placeholder="Optional operational remarks..."
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          
          {/* Section E: Villa Assignment Status */}
          <div
            style={{
              backgroundColor: 'var(--surface)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
              padding: 'var(--space-5)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)', paddingBottom: 'var(--space-3)', borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Home size={18} style={{ color: 'var(--accent-forest)' }} />
                <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                  {t('operations.checkIn.villaAssignmentStatus', 'Assigned Villa Status')}
                </h2>
              </div>
              <Link
                to={`/receptionist/check-in/${arrival.bookingReference}/villa`}
                className="hsw-btn hsw-btn-secondary"
                style={{ minHeight: '30px', padding: '0 10px', fontSize: '11px' }}
              >
                {arrival.assignedVillaId
                  ? t('operations.checkIn.changeVilla', 'Change Villa')
                  : t('operations.checkIn.assignVillaNow', 'Assign Villa')}
              </Link>
            </div>

            {assignedVilla ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Villa #{assignedVilla.code} — {assignedVilla.name[currentLang] || assignedVilla.name.en}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      {assignedVilla.category} • Capacity: {assignedVilla.capacity} Persons • {assignedVilla.bedType}
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
                    ⚠️ Housekeeping is currently cleaning this villa. Check-in cannot be finalized until room is marked Ready.
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
                    ❌ Villa is undergoing maintenance. Please reassign to an available ready villa.
                  </div>
                )}
              </div>
            ) : (
              <div style={{ padding: 'var(--space-4)', textAlign: 'center', backgroundColor: 'var(--bg-canvas)', borderRadius: 'var(--radius-xs)' }}>
                <div style={{ color: '#C62828', fontWeight: 600, fontSize: 'var(--text-xs)', marginBottom: '8px' }}>
                  {t('operations.checkIn.notAssigned', 'No villa assigned yet')}
                </div>
                <Link
                  to={`/receptionist/check-in/${arrival.bookingReference}/villa`}
                  className="hsw-btn hsw-btn-primary"
                  style={{ minHeight: '34px', fontSize: '11px' }}
                >
                  <Home size={14} />
                  <span>{t('operations.checkIn.assignVillaNow', 'Assign Villa Now')}</span>
                </Link>
              </div>
            )}
          </div>

          {/* Section F: Check-In Readiness Verification Checklist */}
          <div
            style={{
              backgroundColor: 'var(--surface)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
              padding: 'var(--space-5)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-4)', paddingBottom: 'var(--space-3)', borderBottom: '1px solid var(--border-subtle)' }}>
              <CheckCircle2 size={18} style={{ color: 'var(--accent-forest)' }} />
              <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                {t('operations.checkIn.readinessChecklist', 'Check-In Readiness Verification')}
              </h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {/* 1. Deposit Paid */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', borderRadius: 'var(--radius-xs)', backgroundColor: isDepositPaid ? '#E8F5E9' : '#FFF8E1' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px' }}>
                  {isDepositPaid ? <CheckCircle2 size={16} color="#1B5E20" /> : <Clock size={16} color="#8C5400" />}
                  <span style={{ fontWeight: 600, color: isDepositPaid ? '#1B5E20' : '#8C5400' }}>
                    1. Required Deposit Satisfied ({arrival.depositStatus === 'paid' ? 'Confirmed' : 'Pending'})
                  </span>
                </div>
                <span style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', color: isDepositPaid ? '#1B5E20' : '#8C5400' }}>
                  {isDepositPaid ? 'Verified' : 'Pending'}
                </span>
              </div>

              {/* 2. Identity Verification Complete */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', borderRadius: 'var(--radius-xs)', backgroundColor: isIdentityComplete ? '#E8F5E9' : '#FFF8E1' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px' }}>
                  {isIdentityComplete ? <CheckCircle2 size={16} color="#1B5E20" /> : <Clock size={16} color="#8C5400" />}
                  <span style={{ fontWeight: 600, color: isIdentityComplete ? '#1B5E20' : '#8C5400' }}>
                    2. Residence Information & ID Complete
                  </span>
                </div>
                <span style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', color: isIdentityComplete ? '#1B5E20' : '#8C5400' }}>
                  {isIdentityComplete ? 'Ready' : 'Incomplete'}
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
                    3. Villa Assigned & Clean / Ready
                  </span>
                </div>
                <span style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', color: isVillaAssigned && isVillaReady && !isVillaBlocked ? '#1B5E20' : '#C62828' }}>
                  {isVillaAssigned && isVillaReady && !isVillaBlocked ? 'Ready' : 'Not Ready'}
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
                      ? 'Stay Already Checked In'
                      : t('operations.common.complete', 'Complete Check-In & Issue Key')}
                  </span>
                </button>
              ) : (
                <div style={{ textAlign: 'center', fontSize: '11px', color: 'var(--text-secondary)', padding: 'var(--space-2)' }}>
                  {t('operations.checkIn.cannotCheckInNotice', 'All 3 readiness requirements must be fulfilled before completing check-in.')}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
