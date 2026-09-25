/**
 * Screen #26 — Spa Session Booking
 * Customer selects treatment, date, therapist preference and time slot.
 * Uses ATOMIC booking: Therapist + Room must BOTH be available.
 */

import React, { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSpa } from '../../context/SpaContext';
import { useCustomer } from '../../context/CustomerContext';
import {
  Calendar,
  Clock,
  User,
  MapPin,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Sparkles,
  Check,
} from 'lucide-react';
import type { LocalizedString, AvailableSlot } from '../../types/spa';

const useLocalized = (ls: LocalizedString): string => {
  const { i18n } = useTranslation();
  const lang = i18n.language as keyof LocalizedString;
  return ls[lang] || ls.en;
};

export const SpaBookingPage: React.FC = () => {
  const { t } = useTranslation('customer');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const treatmentIdFromQuery = searchParams.get('treatment');

  const { treatments, therapists, getAvailableSlots } = useSpa();
  const { activeBooking, profile } = useCustomer();

  const [selectedTreatmentId, setSelectedTreatmentId] = useState(treatmentIdFromQuery || '');
  const [selectedDate, setSelectedDate] = useState('2026-09-26');
  const [preferredTherapistId, setPreferredTherapistId] = useState('');
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [specialRequest, setSpecialRequest] = useState('');

  const selectedTreatment = treatments.find((t) => t.id === selectedTreatmentId);

  // Get available slots when treatment and date are selected
  const availableSlots = useMemo(() => {
    if (!selectedTreatmentId || !selectedDate) return [];
    return getAvailableSlots(
      selectedTreatmentId,
      selectedDate,
      preferredTherapistId || undefined
    );
  }, [selectedTreatmentId, selectedDate, preferredTherapistId, getAvailableSlots]);

  // Group slots by time for display
  const slotsByTime = useMemo(() => {
    const map = new Map<string, AvailableSlot[]>();
    for (const slot of availableSlots) {
      const key = `${slot.startTime}-${slot.endTime}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(slot);
    }
    return map;
  }, [availableSlots]);

  // Available dates (next 7 days for demo)
  const availableDates = useMemo(() => {
    const dates: string[] = [];
    const base = new Date('2026-09-25');
    for (let i = 0; i < 7; i++) {
      const d = new Date(base);
      d.setDate(d.getDate() + i);
      dates.push(d.toISOString().split('T')[0]);
    }
    return dates;
  }, []);

  // Eligible therapists for selected treatment
  const eligibleTherapists = useMemo(() => {
    if (!selectedTreatment) return [];
    return therapists.filter(
      (th) =>
        th.specializations.includes(selectedTreatment.category) &&
        th.availability !== 'off_duty' &&
        th.availability !== 'on_leave'
    );
  }, [selectedTreatment, therapists]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  const handleProceed = () => {
    if (!selectedSlot || !selectedTreatment || !activeBooking) return;

    // Check if slot is currently available (both therapist and room)
    const currentSlots = getAvailableSlots(selectedTreatmentId, selectedDate, preferredTherapistId || undefined);
    const stillAvailable = currentSlots.some(
      (s) =>
        s.startTime === selectedSlot.startTime &&
        s.therapistId === selectedSlot.therapistId &&
        s.roomId === selectedSlot.roomId
    );

    if (!stillAvailable) {
      // Slot became unavailable -> guide to alternatives (Screen 27)
      navigate(`/customer/spa/alternatives?treatment=${selectedTreatmentId}&date=${selectedDate}`);
      return;
    }

    // Available -> proceed to confirmation (Screen 28) with pending booking parameters
    const pendingState = {
      bookingReference: activeBooking.bookingReference,
      customerId: profile.id,
      customerName: profile.fullName,
      treatmentId: selectedTreatmentId,
      therapistId: selectedSlot.therapistId,
      roomId: selectedSlot.roomId,
      date: selectedDate,
      startTime: selectedSlot.startTime,
      endTime: selectedSlot.endTime,
      chargeType: selectedTreatment.isIncludedInRetreat ? 'included' : 'extra',
      customerSpecialRequest: specialRequest || undefined,
    };

    navigate(
      `/customer/spa/confirmation?treatment=${selectedTreatmentId}&date=${selectedDate}&time=${selectedSlot.startTime}&therapist=${selectedSlot.therapistId}&room=${selectedSlot.roomId}${specialRequest ? `&request=${encodeURIComponent(specialRequest)}` : ''}`,
      { state: pendingState }
    );
  };

  const localize = (ls: LocalizedString) => useLocalized(ls);

  return (
    <div className="spa-booking-page" id="screen-26-spa-session-booking">
      {/* Back Navigation */}
      <button className="spa-back-btn" onClick={() => navigate('/customer/spa')}>
        <ChevronLeft size={20} />
        <span>{t('spa.backToTreatments', 'Back to Treatments')}</span>
      </button>

      <div className="spa-booking-layout">
        {/* Left: Booking Form */}
        <div className="spa-booking-form">
          <h1 className="spa-booking-title">
            <Sparkles size={24} />
            {t('spa.bookASession', 'Book a Spa Session')}
          </h1>

          {/* Step 1: Treatment Selection */}
          <div className="spa-booking-step">
            <div className="spa-step-header">
              <span className="spa-step-number">1</span>
              <h2>{t('spa.selectTreatment', 'Select Treatment')}</h2>
            </div>
            <div className="spa-treatment-select-grid">
              {treatments.map((tr) => (
                <button
                  key={tr.id}
                  className={`spa-treatment-option ${selectedTreatmentId === tr.id ? 'spa-treatment-option--active' : ''}`}
                  onClick={() => {
                    setSelectedTreatmentId(tr.id);
                    setSelectedSlot(null);
                    setPreferredTherapistId('');
                  }}
                  id={`spa-select-treatment-${tr.id}`}
                >
                  <img src={tr.imageUrl} alt={localize(tr.name)} className="spa-option-thumb" />
                  <div className="spa-option-info">
                    <span className="spa-option-name">{localize(tr.name)}</span>
                    <span className="spa-option-meta">
                      <Clock size={12} /> {tr.durationMinutes} {t('spa.minutes', 'min')}
                      {tr.isIncludedInRetreat ? (
                        <span className="spa-option-included">{t('spa.included', 'Included')}</span>
                      ) : (
                        <span className="spa-option-price">{formatPrice(tr.price)}</span>
                      )}
                    </span>
                  </div>
                  {selectedTreatmentId === tr.id && <Check size={18} className="spa-option-check" />}
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: Select Date */}
          {selectedTreatment && (
            <div className="spa-booking-step">
              <div className="spa-step-header">
                <span className="spa-step-number">2</span>
                <h2>{t('spa.selectDate', 'Select Date')}</h2>
              </div>
              <div className="spa-date-picker">
                {availableDates.map((date) => {
                  const d = new Date(date + 'T00:00:00');
                  const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
                  const dayNum = d.getDate();
                  const monthName = d.toLocaleDateString('en-US', { month: 'short' });
                  return (
                    <button
                      key={date}
                      className={`spa-date-btn ${selectedDate === date ? 'spa-date-btn--active' : ''}`}
                      onClick={() => {
                        setSelectedDate(date);
                        setSelectedSlot(null);
                      }}
                      id={`spa-date-${date}`}
                    >
                      <span className="spa-date-day">{dayName}</span>
                      <span className="spa-date-num">{dayNum}</span>
                      <span className="spa-date-month">{monthName}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 3: Therapist Preference */}
          {selectedTreatment && selectedDate && (
            <div className="spa-booking-step">
              <div className="spa-step-header">
                <span className="spa-step-number">3</span>
                <h2>{t('spa.therapistPreference', 'Therapist Preference')}</h2>
              </div>
              <div className="spa-therapist-grid">
                <button
                  className={`spa-therapist-option ${preferredTherapistId === '' ? 'spa-therapist-option--active' : ''}`}
                  onClick={() => {
                    setPreferredTherapistId('');
                    setSelectedSlot(null);
                  }}
                >
                  <div className="spa-therapist-avatar spa-therapist-avatar--any">
                    <User size={20} />
                  </div>
                  <span className="spa-therapist-name">{t('spa.anyTherapist', 'Any Available')}</span>
                  <span className="spa-therapist-title">{t('spa.bestMatch', 'Best Available Match')}</span>
                </button>
                {eligibleTherapists.map((th) => (
                  <button
                    key={th.id}
                    className={`spa-therapist-option ${preferredTherapistId === th.id ? 'spa-therapist-option--active' : ''}`}
                    onClick={() => {
                      setPreferredTherapistId(th.id);
                      setSelectedSlot(null);
                    }}
                    id={`spa-select-therapist-${th.id}`}
                  >
                    <img src={th.avatarUrl} alt={th.name} className="spa-therapist-avatar" />
                    <span className="spa-therapist-name">{th.name}</span>
                    <span className="spa-therapist-title">{localize(th.title)}</span>
                    <span className="spa-therapist-exp">
                      {th.yearsExperience} {t('spa.yearsExp', 'yrs')}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Time Slot Selection */}
          {selectedTreatment && selectedDate && (
            <div className="spa-booking-step">
              <div className="spa-step-header">
                <span className="spa-step-number">4</span>
                <h2>{t('spa.selectTimeSlot', 'Select Time Slot')}</h2>
              </div>

              {availableSlots.length === 0 ? (
                <div className="spa-no-slots">
                  <AlertCircle size={32} />
                  <p>{t('spa.noSlotsAvailable', 'No available slots for this combination. Try a different date or therapist.')}</p>
                  <button
                    className="spa-alt-btn"
                    onClick={() => navigate(`/customer/spa/alternatives?treatment=${selectedTreatmentId}&date=${selectedDate}`)}
                  >
                    {t('spa.viewAlternatives', 'View Alternative Slots')}
                    <ChevronRight size={16} />
                  </button>
                </div>
              ) : (
                <div className="spa-slots-grid">
                  {Array.from(slotsByTime.entries()).map(([timeKey, slots]) => {
                    const firstSlot = slots[0];
                    const isSelected = selectedSlot?.startTime === firstSlot.startTime &&
                      selectedSlot?.therapistId === firstSlot.therapistId &&
                      selectedSlot?.roomId === firstSlot.roomId;

                    return (
                      <button
                        key={`${timeKey}-${firstSlot.therapistId}-${firstSlot.roomId}`}
                        className={`spa-slot-btn ${isSelected ? 'spa-slot-btn--active' : ''}`}
                        onClick={() => setSelectedSlot(firstSlot)}
                        id={`spa-slot-${firstSlot.startTime.replace(':', '')}`}
                      >
                        <div className="spa-slot-time">
                          <Clock size={14} />
                          <span>{firstSlot.startTime} — {firstSlot.endTime}</span>
                        </div>
                        <div className="spa-slot-details">
                          <span className="spa-slot-therapist">
                            <User size={12} /> {firstSlot.therapistName}
                          </span>
                          <span className="spa-slot-room">
                            <MapPin size={12} /> {localize(firstSlot.roomName)}
                          </span>
                        </div>
                        {isSelected && <Check size={16} className="spa-slot-check" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Special Request */}
          {selectedSlot && (
            <div className="spa-booking-step">
              <div className="spa-step-header">
                <span className="spa-step-number">5</span>
                <h2>{t('spa.specialRequest', 'Special Requests')}</h2>
              </div>
              <textarea
                className="spa-special-request"
                value={specialRequest}
                onChange={(e) => setSpecialRequest(e.target.value)}
                placeholder={t('spa.specialRequestPlaceholder', 'Any preferences or notes for your therapist...')}
                rows={3}
                id="spa-special-request"
              />
            </div>
          )}
        </div>

        {/* Right: Booking Summary */}
        <div className="spa-booking-summary">
          <div className="spa-summary-card">
            <h3>{t('spa.bookingSummary', 'Booking Summary')}</h3>

            {selectedTreatment ? (
              <>
                <div className="spa-summary-image">
                  <img src={selectedTreatment.imageUrl} alt={localize(selectedTreatment.name)} />
                </div>
                <div className="spa-summary-row">
                  <span className="spa-summary-label">{t('spa.treatment', 'Treatment')}</span>
                  <span className="spa-summary-value">{localize(selectedTreatment.name)}</span>
                </div>
                <div className="spa-summary-row">
                  <span className="spa-summary-label">{t('spa.duration', 'Duration')}</span>
                  <span className="spa-summary-value">{selectedTreatment.durationMinutes} {t('spa.minutes', 'min')}</span>
                </div>
                {selectedDate && (
                  <div className="spa-summary-row">
                    <span className="spa-summary-label">{t('spa.date', 'Date')}</span>
                    <span className="spa-summary-value">
                      {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                )}
                {selectedSlot && (
                  <>
                    <div className="spa-summary-row">
                      <span className="spa-summary-label">{t('spa.time', 'Time')}</span>
                      <span className="spa-summary-value">{selectedSlot.startTime} — {selectedSlot.endTime}</span>
                    </div>
                    <div className="spa-summary-row">
                      <span className="spa-summary-label">{t('spa.therapist', 'Therapist')}</span>
                      <span className="spa-summary-value">{selectedSlot.therapistName}</span>
                    </div>
                    <div className="spa-summary-row">
                      <span className="spa-summary-label">{t('spa.room', 'Room')}</span>
                      <span className="spa-summary-value">{localize(selectedSlot.roomName)}</span>
                    </div>
                  </>
                )}

                <div className="spa-summary-divider" />

                <div className="spa-summary-row spa-summary-row--total">
                  <span className="spa-summary-label">{t('spa.charge', 'Charge')}</span>
                  <span className="spa-summary-value">
                    {selectedTreatment.isIncludedInRetreat ? (
                      <span className="spa-summary-included">{t('spa.includedInPackage', 'Included in Package')}</span>
                    ) : (
                      formatPrice(selectedTreatment.price)
                    )}
                  </span>
                </div>


                <button
                  className="spa-confirm-btn"
                  disabled={!selectedSlot}
                  onClick={handleProceed}
                  id="spa-proceed-to-confirmation"
                >
                  <Sparkles size={16} />
                  {t('spa.proceedToConfirmation', 'Review & Confirm')}
                </button>
              </>
            ) : (
              <div className="spa-summary-empty">
                <Calendar size={48} />
                <p>{t('spa.selectTreatmentPrompt', 'Select a treatment to begin booking')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
