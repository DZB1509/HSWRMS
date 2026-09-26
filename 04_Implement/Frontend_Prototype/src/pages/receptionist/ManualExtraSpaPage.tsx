/**
 * Screen #30 — Manual Extra Spa Booking (Receptionist)
 * Receptionist selects a checked-in Customer and manually books an extra
 * Spa/Therapy service. Charge is posted to the Customer's Folio.
 *
 * Major Structure Repair (Phase 2.4.2):
 * 2-Column desktop layout (Left ~68% / Right ~32%)
 * ALL 5 workflow sections are visible from the start:
 * 1 Customer / Active Stay
 * 2 Treatment
 * 3 Date & Time
 * 4 Therapist + Treatment Room
 * 5 Availability Result
 * Downstream sections are disabled until prerequisites are met, but NOT hidden.
 */

import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSpa } from '../../context/SpaContext';
import { useOperations } from '../../context/OperationsContext';
import {
  HeartHandshake,
  User,
  Clock,
  Calendar,
  MapPin,
  Check,
  AlertCircle,
  DollarSign,
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import type { LocalizedString, AvailableSlot } from '../../types/spa';

const useLocalized = (ls: LocalizedString): string => {
  const { i18n } = useTranslation();
  const lang = i18n.language as keyof LocalizedString;
  return ls[lang] || ls.en;
};

export const ManualExtraSpaPage: React.FC = () => {
  const { t } = useTranslation('operations');
  const { arrivals } = useOperations();
  const { treatments, bookSpaSession, getAvailableSlots } = useSpa();

  // Only show checked-in customers eligible for in-stay charges
  const checkedInCustomers = useMemo(
    () => arrivals.filter((a) => a.arrivalStatus === 'checked_in'),
    [arrivals]
  );

  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(() => {
    const firstCheckedIn = arrivals.find((a) => a.arrivalStatus === 'checked_in');
    return firstCheckedIn ? firstCheckedIn.bookingReference : null;
  });

  useEffect(() => {
    if (!selectedCustomer && checkedInCustomers.length > 0) {
      setSelectedCustomer(checkedInCustomers[0].bookingReference);
    }
  }, [checkedInCustomers, selectedCustomer]);

  const [selectedTreatmentId, setSelectedTreatmentId] = useState('');
  const [selectedDate, setSelectedDate] = useState('2026-09-26');
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const localize = (ls: LocalizedString) => useLocalized(ls);

  const selectedArrival = checkedInCustomers.find((a) => a.bookingReference === selectedCustomer);
  const selectedTreatment = treatments.find((t) => t.id === selectedTreatmentId);

  const availableSlots = useMemo(() => {
    if (!selectedTreatmentId || !selectedDate) return [];
    return getAvailableSlots(selectedTreatmentId, selectedDate);
  }, [selectedTreatmentId, selectedDate, getAvailableSlots]);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

  const isFormValid = Boolean(selectedArrival && selectedTreatment && selectedSlot);

  const handleBook = () => {
    if (!selectedSlot || !selectedTreatment || !selectedArrival) return;
    setIsSubmitting(true);
    setResult(null);

    setTimeout(() => {
      const res = bookSpaSession({
        bookingReference: selectedArrival.bookingReference,
        customerId: selectedArrival.customerId,
        customerName: selectedArrival.customerName,
        treatmentId: selectedTreatmentId,
        therapistId: selectedSlot.therapistId,
        roomId: selectedSlot.roomId,
        date: selectedDate,
        startTime: selectedSlot.startTime,
        chargeType: 'extra',
        bookingSource: 'receptionist_manual',
      });

      setResult({ success: res.success, message: res.message });
      setIsSubmitting(false);

      if (res.success) {
        // Clear slot after short pause
        setTimeout(() => {
          setSelectedSlot(null);
        }, 4000);
      }
    }, 600);
  };

  return (
    <div className="ops-extra-spa-page" id="screen-30-manual-extra-spa">
      {/* Page Header */}
      <div className="ops-page-header">
        <div className="ops-header-icon-box">
          <HeartHandshake size={24} />
        </div>
        <div className="ops-header-text">
          <h1>{t('extraSpa.title', 'Manual Extra Spa Booking')}</h1>
          <p className="ops-page-subtitle">
            {t(
              'extraSpa.subtitle',
              'Book an additional spa service for a checked-in customer. Charges will be recorded for pending folio posting at checkout.'
            )}
          </p>
        </div>
      </div>

      {/* 2-Column Desktop Operational Layout */}
      <div className="ops-extra-spa-layout">
        {/* LEFT COLUMN: 5 Visible Workflow Steps (~68%) */}
        <div className="ops-extra-spa-form">
          {/* STEP 1: Customer / Active Stay */}
          <section className="ops-form-section" id="ops-extra-step-1">
            <div className="ops-section-heading">
              <span className={`ops-step-num ${selectedArrival ? 'ops-step-num--done' : ''}`}>
                {selectedArrival ? <Check size={14} /> : '1'}
              </span>
              <div className="ops-section-heading-text">
                <h3>{t('extraSpa.step1Title', '1. Customer / Active Stay')}</h3>
                <span className="ops-section-sub">
                  {selectedArrival
                    ? `${selectedArrival.customerName} · ${selectedArrival.bookingReference} (Villa ${selectedArrival.assignedVillaNumber})`
                    : t('extraSpa.selectCustomerPrompt', 'Select an in-house checked-in customer')}
                </span>
              </div>
            </div>

            {checkedInCustomers.length > 0 ? (
              <div className="ops-customer-select">
                {checkedInCustomers.map((a) => {
                  const isSelected = selectedCustomer === a.bookingReference;
                  return (
                    <button
                      key={a.bookingReference}
                      type="button"
                      className={`ops-customer-option ${isSelected ? 'ops-customer-option--active' : ''}`}
                      onClick={() => {
                        setSelectedCustomer(a.bookingReference);
                        setResult(null);
                      }}
                      id={`ops-customer-${a.bookingReference}`}
                    >
                      <User size={16} />
                      <div className="ops-customer-meta">
                        <span className="ops-customer-name">{a.customerName}</span>
                        <span className="ops-customer-ref">
                          {a.bookingReference} · Villa {a.assignedVillaNumber}
                        </span>
                      </div>
                      {isSelected && <Check size={16} className="ops-customer-check" />}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="ops-empty-notice">
                <AlertCircle size={18} />
                <span>{t('extraSpa.noCheckedIn', 'No checked-in customers currently in resort.')}</span>
              </div>
            )}
          </section>

          {/* STEP 2: Extra Treatment Selection */}
          <section
            className="ops-form-section"
            id="ops-extra-step-2"
          >
            <div className="ops-section-heading">
              <span className={`ops-step-num ${selectedTreatment ? 'ops-step-num--done' : ''}`}>
                {selectedTreatment ? <Check size={14} /> : '2'}
              </span>
              <div className="ops-section-heading-text">
                <h3>{t('extraSpa.step2Title', '2. Extra Spa Treatment')}</h3>
                <span className="ops-section-sub">
                  {selectedTreatment
                    ? `${localize(selectedTreatment.name)} · ${formatPrice(selectedTreatment.price)}`
                    : t('extraSpa.selectTreatmentPrompt', 'Choose an add-on therapy')}
                </span>
              </div>
            </div>

            <div className="ops-treatment-list">
              {treatments
                .filter((t) => !t.isIncludedInRetreat)
                .map((tr) => {
                  const isSelected = selectedTreatmentId === tr.id;
                  return (
                    <button
                      key={tr.id}
                      type="button"
                      className={`ops-treatment-item ${isSelected ? 'ops-treatment-item--active' : ''}`}
                      onClick={() => {
                        setSelectedTreatmentId(tr.id);
                        setSelectedSlot(null);
                        setResult(null);
                      }}
                      id={`ops-treatment-${tr.id}`}
                    >
                      <div className="ops-treatment-info">
                        <span className="ops-treatment-name">{localize(tr.name)}</span>
                        <span className="ops-treatment-meta">
                          <Clock size={12} /> {tr.durationMinutes} min · {tr.category}
                        </span>
                      </div>
                      <span className="ops-treatment-price">{formatPrice(tr.price)}</span>
                      {isSelected && <Check size={16} />}
                    </button>
                  );
                })}
            </div>
          </section>

          {/* STEP 3: Date & Time Slot Selection */}
          <section
            className={`ops-form-section ${!selectedTreatmentId ? 'ops-form-section--disabled' : ''}`}
            id="ops-extra-step-3"
          >
            <div className="ops-section-heading">
              <span className={`ops-step-num ${selectedSlot ? 'ops-step-num--done' : ''}`}>
                {selectedSlot ? <Check size={14} /> : '3'}
              </span>
              <div className="ops-section-heading-text">
                <h3>{t('extraSpa.step3Title', '3. Date & Available Time')}</h3>
                <span className="ops-section-sub">
                  {!selectedTreatmentId
                    ? t('extraSpa.step3DisabledHint', 'Prerequisite: Select a treatment in Step 2')
                    : selectedSlot
                    ? `${selectedDate} at ${selectedSlot.startTime}–${selectedSlot.endTime}`
                    : t('extraSpa.selectSlotPrompt', 'Pick treatment date and available start time')}
                </span>
              </div>
            </div>

            <div className="ops-date-row">
              <Calendar size={16} />
              <input
                type="date"
                disabled={!selectedTreatmentId}
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setSelectedSlot(null);
                }}
                className="ops-date-input"
                id="ops-spa-date"
              />
            </div>

            {selectedTreatmentId && (
              availableSlots.length > 0 ? (
                <div className="ops-slot-list">
                  {availableSlots.slice(0, 12).map((slot, idx) => {
                    const isSelected =
                      selectedSlot?.startTime === slot.startTime &&
                      selectedSlot?.therapistId === slot.therapistId;
                    return (
                      <button
                        key={`${slot.startTime}-${slot.therapistId}-${idx}`}
                        type="button"
                        className={`ops-slot-item ${isSelected ? 'ops-slot-item--active' : ''}`}
                        onClick={() => setSelectedSlot(slot)}
                        id={`ops-slot-${slot.startTime.replace(':', '')}`}
                      >
                        <span className="ops-slot-time">
                          <Clock size={12} /> {slot.startTime}–{slot.endTime}
                        </span>
                        <span className="ops-slot-therapist">
                          <User size={12} /> {slot.therapistName}
                        </span>
                        <span className="ops-slot-room">
                          <MapPin size={12} /> {localize(slot.roomName)}
                        </span>
                        {isSelected && <Check size={14} />}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="ops-empty-notice">
                  <AlertCircle size={16} />
                  <span>{t('extraSpa.noSlots', 'No available slots for this combination on this date.')}</span>
                </div>
              )
            )}
          </section>

          {/* STEP 4: Therapist + Treatment Room Assignment */}
          <section
            className={`ops-form-section ${!selectedSlot ? 'ops-form-section--disabled' : ''}`}
            id="ops-extra-step-4"
          >
            <div className="ops-section-heading">
              <span className={`ops-step-num ${selectedSlot ? 'ops-step-num--done' : ''}`}>
                {selectedSlot ? <Check size={14} /> : '4'}
              </span>
              <div className="ops-section-heading-text">
                <h3>{t('extraSpa.step4Title', '4. Therapist & Treatment Suite Assignment')}</h3>
                <span className="ops-section-sub">
                  {selectedSlot
                    ? t('extraSpa.atomicResourcesLocked', 'Specific resources locked for atomic reservation')
                    : t('extraSpa.step4DisabledHint', 'Prerequisite: Choose a slot in Step 3 to assign resources')}
                </span>
              </div>
            </div>

            {selectedSlot ? (
              <div className="ops-resource-assignment-grid">
                <div className="ops-resource-card">
                  <div className="ops-resource-icon">
                    <User size={18} />
                  </div>
                  <div className="ops-resource-details">
                    <span className="ops-resource-label">{t('extraSpa.therapist', 'Assigned Therapist')}</span>
                    <strong className="ops-resource-value">{selectedSlot.therapistName}</strong>
                    <span className="ops-resource-sub">{t('extraSpa.licensedSpecialist', 'Certified Spa Specialist')}</span>
                  </div>
                </div>

                <div className="ops-resource-card">
                  <div className="ops-resource-icon">
                    <MapPin size={18} />
                  </div>
                  <div className="ops-resource-details">
                    <span className="ops-resource-label">{t('extraSpa.room', 'Assigned Treatment Room')}</span>
                    <strong className="ops-resource-value">{localize(selectedSlot.roomName)}</strong>
                    <span className="ops-resource-sub">{t('extraSpa.sanitizedSuite', 'Private Therapy Sanctuary')}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="ops-placeholder-box">
                <ShieldCheck size={16} />
                <span>{t('extraSpa.resourcesPlaceholder', 'Therapist and Treatment Suite will lock upon slot selection.')}</span>
              </div>
            )}
          </section>

          {/* STEP 5: Atomic Availability & Folio Result */}
          <section className="ops-form-section" id="ops-extra-step-5">
            <div className="ops-section-heading">
              <span className={`ops-step-num ${isFormValid ? 'ops-step-num--done' : ''}`}>
                {isFormValid ? <Check size={14} /> : '5'}
              </span>
              <div className="ops-section-heading-text">
                <h3>{t('extraSpa.step5Title', '5. Availability & Folio Verification')}</h3>
                <span className="ops-section-sub">
                  {isFormValid
                    ? t('extraSpa.readyToPost', 'Atomic availability verified. Ready for pending folio posting.')
                    : t('extraSpa.completeStepsPrompt', 'Complete preceding steps to enable confirmation.')}
                </span>
              </div>
            </div>

            {result ? (
              <div
                className={`ops-booking-result ${
                  result.success ? 'ops-booking-result--success' : 'ops-booking-result--error'
                }`}
              >
                {result.success ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
                <span>{result.message}</span>
              </div>
            ) : isFormValid ? (
              <div className="ops-status-notice ops-status-notice--ready">
                <CheckCircle size={18} />
                <div>
                  <strong>{t('extraSpa.atomicCheckPassed', 'Atomic Availability Verified')}</strong>
                  <p>
                    {t(
                      'extraSpa.atomicCheckPassedDesc',
                      'Both Therapist and Suite are verified vacant. Spa session will be recorded with pending folio posting.'
                    )}
                  </p>
                </div>
              </div>
            ) : (
              <div className="ops-status-notice ops-status-notice--pending">
                <AlertCircle size={18} />
                <div>
                  <strong>{t('extraSpa.validationPending', 'Validation Incomplete')}</strong>
                  <p>
                    {t('extraSpa.missingFields', 'Missing required selections:')}{' '}
                    {[
                      !selectedArrival && 'Customer',
                      !selectedTreatment && 'Treatment',
                      !selectedSlot && 'Time Slot',
                    ]
                      .filter(Boolean)
                      .join(', ')}
                  </p>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* RIGHT COLUMN: Live Booking Summary & Folio Posting (~32%) */}
        <aside className="ops-extra-spa-summary">
          <div className="ops-summary-card">
            <h3>{t('extraSpa.bookingSummary', 'Live Booking Summary')}</h3>

            <div className="ops-summary-row">
              <span>{t('extraSpa.customer', 'Customer')}</span>
              <strong>{selectedArrival ? selectedArrival.customerName : '—'}</strong>
            </div>

            <div className="ops-summary-row">
              <span>{t('extraSpa.bookingRef', 'Booking Ref')}</span>
              <strong>
                {selectedArrival
                  ? `${selectedArrival.bookingReference} (Villa ${selectedArrival.assignedVillaNumber})`
                  : '—'}
              </strong>
            </div>

            <div className="ops-summary-row">
              <span>{t('extraSpa.treatment', 'Treatment')}</span>
              <strong>{selectedTreatment ? localize(selectedTreatment.name) : '—'}</strong>
            </div>

            <div className="ops-summary-row">
              <span>{t('extraSpa.duration', 'Duration')}</span>
              <strong>{selectedTreatment ? `${selectedTreatment.durationMinutes} min` : '—'}</strong>
            </div>

            <div className="ops-summary-row">
              <span>{t('extraSpa.schedule', 'Scheduled Time')}</span>
              <strong>
                {selectedSlot
                  ? `${selectedDate} · ${selectedSlot.startTime}–${selectedSlot.endTime}`
                  : selectedDate
                  ? `${selectedDate}`
                  : '—'}
              </strong>
            </div>

            <div className="ops-summary-row">
              <span>{t('extraSpa.therapist', 'Therapist')}</span>
              <strong>{selectedSlot ? selectedSlot.therapistName : '—'}</strong>
            </div>

            <div className="ops-summary-row">
              <span>{t('extraSpa.room', 'Treatment Suite')}</span>
              <strong>{selectedSlot ? localize(selectedSlot.roomName) : '—'}</strong>
            </div>

            <div className="ops-summary-divider" />

            <div className="ops-summary-row ops-summary-row--folio">
              <span>{t('extraSpa.folioCharge', 'Pending Folio Posting')}</span>
              <strong className="ops-price-highlight">
                {selectedTreatment ? formatPrice(selectedTreatment.price) : '0 ₫'}
              </strong>
            </div>
            <span className="ops-folio-sub">
              {t('extraSpa.folioStatusNote', 'Pending Folio Posting — will be finalized and settled during checkout.')}
            </span>

            {/* Validation pill */}
            <div className="ops-validation-status">
              {isFormValid ? (
                <div className="ops-val-pill ops-val-pill--valid">
                  <Check size={13} />
                  <span>{t('extraSpa.readyToConfirm', 'All Prerequisites Valid')}</span>
                </div>
              ) : (
                <div className="ops-val-pill ops-val-pill--invalid">
                  <AlertCircle size={13} />
                  <span>{t('extraSpa.incompletePill', 'Incomplete Selections')}</span>
                </div>
              )}
            </div>

            {/* Primary Action Button */}
            <button
              type="button"
              className="ops-confirm-btn"
              disabled={!isFormValid || isSubmitting || result?.success}
              onClick={handleBook}
              id="ops-confirm-extra-spa"
            >
              <DollarSign size={16} />
              <span>
                {isSubmitting
                  ? t('extraSpa.processing', 'Processing...')
                  : result?.success
                  ? t('extraSpa.booked', 'Spa Session Booked ✓')
                  : t('extraSpa.confirmAction', 'Confirm Extra Spa Session')}
              </span>
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
};
