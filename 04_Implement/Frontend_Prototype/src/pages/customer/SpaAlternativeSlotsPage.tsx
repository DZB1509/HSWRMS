/**
 * Screen #27 — Available / Alternative Slot Selection
 * Shown when the originally requested Therapist+Room is unavailable.
 * Displays all available alternatives for the selected treatment and date.
 */

import React, { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSpa } from '../../context/SpaContext';
import { useCustomer } from '../../context/CustomerContext';
import {
  ChevronLeft,
  Clock,
  User,
  MapPin,
  Calendar,
  RefreshCw,
  Sparkles,
  Check,
  AlertTriangle,
} from 'lucide-react';
import type { LocalizedString, AvailableSlot } from '../../types/spa';

const useLocalized = (ls: LocalizedString): string => {
  const { i18n } = useTranslation();
  const lang = i18n.language as keyof LocalizedString;
  return ls[lang] || ls.en;
};

export const SpaAlternativeSlotsPage: React.FC = () => {
  const { t } = useTranslation('customer');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const treatmentId = searchParams.get('treatment') || '';
  const date = searchParams.get('date') || '2026-09-26';

  const { treatments, getAvailableSlots } = useSpa();
  const { activeBooking, profile } = useCustomer();

  const [selectedDate, setSelectedDate] = useState(date);
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);

  const treatment = treatments.find((tr) => tr.id === treatmentId);

  const availableSlots = useMemo(() => {
    if (!treatmentId || !selectedDate) return [];
    return getAvailableSlots(treatmentId, selectedDate);
  }, [treatmentId, selectedDate, getAvailableSlots]);

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

  const localize = (ls: LocalizedString) => useLocalized(ls);

  const handleProceed = () => {
    if (!selectedSlot || !treatment || !activeBooking) return;

    const pendingState = {
      bookingReference: activeBooking.bookingReference,
      customerId: profile.id,
      customerName: profile.fullName,
      treatmentId,
      therapistId: selectedSlot.therapistId,
      roomId: selectedSlot.roomId,
      date: selectedDate,
      startTime: selectedSlot.startTime,
      endTime: selectedSlot.endTime,
      chargeType: treatment.isIncludedInRetreat ? 'included' : 'extra',
    };

    navigate(
      `/customer/spa/confirmation?treatment=${treatmentId}&date=${selectedDate}&time=${selectedSlot.startTime}&therapist=${selectedSlot.therapistId}&room=${selectedSlot.roomId}`,
      { state: pendingState }
    );
  };

  return (
    <div className="spa-alt-page" id="screen-27-alternative-slot-selection">
      <button className="spa-back-btn" onClick={() => navigate(-1)}>
        <ChevronLeft size={20} />
        <span>{t('spa.back', 'Back')}</span>
      </button>

      <div className="spa-alt-header">
        <div className="spa-alt-icon">
          <RefreshCw size={28} />
        </div>
        <h1>{t('spa.alternativeSlots', 'Alternative Available Slots')}</h1>
        {treatment && (
          <p className="spa-alt-subtitle">
            {t('spa.altDesc', 'Showing all available combinations for')} <strong>{localize(treatment.name)}</strong>
          </p>
        )}
      </div>

      {/* Date Selection */}
      <div className="spa-alt-dates">
        <Calendar size={18} />
        <div className="spa-date-picker">
          {availableDates.map((d) => {
            const dt = new Date(d + 'T00:00:00');
            return (
              <button
                key={d}
                className={`spa-date-btn ${selectedDate === d ? 'spa-date-btn--active' : ''}`}
                onClick={() => {
                  setSelectedDate(d);
                  setSelectedSlot(null);
                }}
              >
                <span className="spa-date-day">{dt.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                <span className="spa-date-num">{dt.getDate()}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Slots */}
      {availableSlots.length > 0 ? (
        <div className="spa-alt-slots">
          {availableSlots.slice(0, 15).map((slot, idx) => {
            const isSelected =
              selectedSlot?.startTime === slot.startTime &&
              selectedSlot?.therapistId === slot.therapistId &&
              selectedSlot?.roomId === slot.roomId;

            return (
              <button
                key={`${slot.startTime}-${slot.therapistId}-${slot.roomId}-${idx}`}
                className={`spa-alt-slot-card ${isSelected ? 'spa-alt-slot-card--active' : ''}`}
                onClick={() => setSelectedSlot(slot)}
              >
                <div className="spa-alt-slot-time">
                  <Clock size={16} />
                  <span>{slot.startTime} — {slot.endTime}</span>
                </div>
                <div className="spa-alt-slot-info">
                  <span><User size={14} /> {slot.therapistName}</span>
                  <span><MapPin size={14} /> {localize(slot.roomName)}</span>
                </div>
                {isSelected && <Check size={18} className="spa-alt-check" />}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="spa-alt-empty">
          <AlertTriangle size={48} />
          <h3>{t('spa.noAlternatives', 'No slots available for this date')}</h3>
          <p>{t('spa.tryAnotherDate', 'Please try selecting a different date above.')}</p>
        </div>
      )}

      {/* Confirm Button */}
      {selectedSlot && (
        <div className="spa-alt-footer">
          <div className="spa-alt-selected-info">
            <Sparkles size={16} />
            <span>
              {selectedSlot.startTime} — {selectedSlot.endTime} · {selectedSlot.therapistName} · {localize(selectedSlot.roomName)}
            </span>
          </div>
          <button
            className="spa-confirm-btn"
            onClick={handleProceed}
            id="spa-alt-confirm"
          >
            <Sparkles size={16} />
            {t('spa.proceedToConfirmation', 'Review & Confirm')}
          </button>
        </div>
      )}
    </div>
  );
};
