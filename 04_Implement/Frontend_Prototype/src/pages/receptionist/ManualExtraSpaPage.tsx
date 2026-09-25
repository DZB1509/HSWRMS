/**
 * Screen #30 — Manual Extra Spa Booking (Receptionist)
 * Receptionist selects a checked-in Customer and manually books an extra
 * Spa/Therapy service. Charge is posted to the Customer's Folio.
 * This is an operational workflow, NOT a cinematic customer-facing booking.
 */

import React, { useState, useMemo } from 'react';
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

  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [selectedTreatmentId, setSelectedTreatmentId] = useState('');
  const [selectedDate, setSelectedDate] = useState('2026-09-26');
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const localize = (ls: LocalizedString) => useLocalized(ls);

  // Only show checked-in customers
  const checkedInCustomers = useMemo(
    () => arrivals.filter((a) => a.arrivalStatus === 'checked_in'),
    [arrivals]
  );

  const selectedArrival = checkedInCustomers.find((a) => a.bookingReference === selectedCustomer);
  const selectedTreatment = treatments.find((t) => t.id === selectedTreatmentId);

  const availableSlots = useMemo(() => {
    if (!selectedTreatmentId || !selectedDate) return [];
    return getAvailableSlots(selectedTreatmentId, selectedDate);
  }, [selectedTreatmentId, selectedDate, getAvailableSlots]);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

  const handleBook = () => {
    if (!selectedSlot || !selectedTreatment || !selectedArrival) return;
    setIsSubmitting(true);
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
      if (res.success) {
        // Reset form after success
        setTimeout(() => {
          setSelectedSlot(null);
          setResult(null);
        }, 3000);
      }
      setIsSubmitting(false);
    }, 600);
  };

  return (
    <div className="ops-extra-spa-page" id="screen-30-manual-extra-spa">
      <div className="ops-page-header">
        <HeartHandshake size={28} />
        <div>
          <h1>{t('extraSpa.title', 'Manual Extra Spa Booking')}</h1>
          <p className="ops-page-subtitle">
            {t('extraSpa.subtitle', 'Book an additional spa service for a checked-in customer. Charges will be posted to their folio.')}
          </p>
        </div>
      </div>

      <div className="ops-extra-spa-layout">
        {/* Form */}
        <div className="ops-extra-spa-form">
          {/* Step 1: Select Customer */}
          <div className="ops-form-section">
            <h3>
              <span className="ops-step-num">1</span>
              {t('extraSpa.selectCustomer', 'Select Customer')}
            </h3>
            {checkedInCustomers.length > 0 ? (
              <div className="ops-customer-select">
                {checkedInCustomers.map((a) => (
                  <button
                    key={a.bookingReference}
                    className={`ops-customer-option ${selectedCustomer === a.bookingReference ? 'ops-customer-option--active' : ''}`}
                    onClick={() => {
                      setSelectedCustomer(a.bookingReference);
                      setResult(null);
                    }}
                    id={`ops-customer-${a.bookingReference}`}
                  >
                    <User size={16} />
                    <div>
                      <span className="ops-customer-name">{a.customerName}</span>
                      <span className="ops-customer-ref">{a.bookingReference} · {a.assignedVillaNumber}</span>
                    </div>
                    {selectedCustomer === a.bookingReference && <Check size={16} />}
                  </button>
                ))}
              </div>
            ) : (
              <div className="ops-empty-notice">
                <AlertCircle size={20} />
                <span>{t('extraSpa.noCheckedIn', 'No checked-in customers available.')}</span>
              </div>
            )}
          </div>

          {/* Step 2: Select Treatment */}
          {selectedCustomer && (
            <div className="ops-form-section">
              <h3>
                <span className="ops-step-num">2</span>
                {t('extraSpa.selectTreatment', 'Select Extra Treatment')}
              </h3>
              <div className="ops-treatment-list">
                {treatments.filter((t) => !t.isIncludedInRetreat).map((tr) => (
                  <button
                    key={tr.id}
                    className={`ops-treatment-item ${selectedTreatmentId === tr.id ? 'ops-treatment-item--active' : ''}`}
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
                        <Clock size={12} /> {tr.durationMinutes} min
                      </span>
                    </div>
                    <span className="ops-treatment-price">{formatPrice(tr.price)}</span>
                    {selectedTreatmentId === tr.id && <Check size={16} />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Date & Time Slot */}
          {selectedTreatment && (
            <div className="ops-form-section">
              <h3>
                <span className="ops-step-num">3</span>
                {t('extraSpa.selectSlot', 'Select Date & Time')}
              </h3>
              <div className="ops-date-row">
                <Calendar size={16} />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setSelectedSlot(null);
                  }}
                  className="ops-date-input"
                  id="ops-spa-date"
                />
              </div>

              {availableSlots.length > 0 ? (
                <div className="ops-slot-list">
                  {availableSlots.slice(0, 12).map((slot, idx) => {
                    const isSelected = selectedSlot?.startTime === slot.startTime &&
                      selectedSlot?.therapistId === slot.therapistId;
                    return (
                      <button
                        key={`${slot.startTime}-${slot.therapistId}-${idx}`}
                        className={`ops-slot-item ${isSelected ? 'ops-slot-item--active' : ''}`}
                        onClick={() => setSelectedSlot(slot)}
                      >
                        <span className="ops-slot-time">{slot.startTime}–{slot.endTime}</span>
                        <span className="ops-slot-therapist"><User size={12} /> {slot.therapistName}</span>
                        <span className="ops-slot-room"><MapPin size={12} /> {localize(slot.roomName)}</span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="ops-empty-notice">
                  <AlertCircle size={16} />
                  <span>{t('extraSpa.noSlots', 'No available slots for this date.')}</span>
                </div>
              )}
            </div>
          )}

          {/* Result */}
          {result && (
            <div className={`ops-booking-result ${result.success ? 'ops-booking-result--success' : 'ops-booking-result--error'}`}>
              {result.success ? <Check size={18} /> : <AlertCircle size={18} />}
              <span>{result.message}</span>
            </div>
          )}
        </div>

        {/* Summary Sidebar */}
        <div className="ops-extra-spa-summary">
          <div className="ops-summary-card">
            <h3>{t('extraSpa.bookingSummary', 'Booking Summary')}</h3>
            {selectedArrival && (
              <div className="ops-summary-row">
                <span>{t('extraSpa.customer', 'Customer')}</span>
                <strong>{selectedArrival.customerName}</strong>
              </div>
            )}
            {selectedTreatment && (
              <>
                <div className="ops-summary-row">
                  <span>{t('extraSpa.treatment', 'Treatment')}</span>
                  <strong>{localize(selectedTreatment.name)}</strong>
                </div>
                <div className="ops-summary-row">
                  <span>{t('extraSpa.duration', 'Duration')}</span>
                  <strong>{selectedTreatment.durationMinutes} min</strong>
                </div>
                <div className="ops-summary-row">
                  <span>{t('extraSpa.charge', 'Charge to Folio')}</span>
                  <strong className="ops-price-highlight">{formatPrice(selectedTreatment.price)}</strong>
                </div>
              </>
            )}
            {selectedSlot && (
              <>
                <div className="ops-summary-divider" />
                <div className="ops-summary-row">
                  <span>{t('extraSpa.time', 'Time')}</span>
                  <strong>{selectedSlot.startTime}–{selectedSlot.endTime}</strong>
                </div>
                <div className="ops-summary-row">
                  <span>{t('extraSpa.therapist', 'Therapist')}</span>
                  <strong>{selectedSlot.therapistName}</strong>
                </div>
                <div className="ops-summary-row">
                  <span>{t('extraSpa.room', 'Room')}</span>
                  <strong>{localize(selectedSlot.roomName)}</strong>
                </div>
              </>
            )}

            <button
              className="ops-confirm-btn"
              disabled={!selectedSlot || isSubmitting || result?.success}
              onClick={handleBook}
              id="ops-confirm-extra-spa"
            >
              <DollarSign size={16} />
              {isSubmitting
                ? t('extraSpa.processing', 'Processing...')
                : result?.success
                ? t('extraSpa.booked', 'Booked ✓')
                : t('extraSpa.confirmAndCharge', 'Confirm & Charge to Folio')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
