import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Sparkles,
  Brush,
  Wrench,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  X,
} from 'lucide-react';
import { useOperations } from '../../context/OperationsContext';
import { useToast } from '../../components/common/Toast';
import { OperationalPageHeader } from '../../components/operations/OperationalPageHeader';
import { VillaStatusChip } from '../../components/operations/VillaStatusChip';
import type { Villa, VillaStatus, HousekeepingStatus } from '../../types/operations';

export const VillaStatusPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { villas, updateVillaStatus } = useOperations();
  const { showToast } = useToast();

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Modal confirmation state for transitions
  const [transitionModal, setTransitionModal] = useState<{
    isOpen: boolean;
    villa: Villa | null;
    targetStatus: VillaStatus;
    targetHousekeeping?: HousekeepingStatus;
    reasonText?: string;
  }>({
    isOpen: false,
    villa: null,
    targetStatus: 'ready',
  });

  const currentLang = (i18n.language || 'en') as 'en' | 'vi' | 'zh-CN' | 'ja' | 'fr';

  // Stats
  const total = villas.length;
  const readyCount = villas.filter((v) => v.status === 'ready').length;
  const occupiedCount = villas.filter((v) => v.status === 'occupied').length;
  const cleaningCount = villas.filter((v) => v.status === 'cleaning').length;
  const maintenanceCount = villas.filter((v) => v.status === 'maintenance').length;
  const reservedCount = villas.filter((v) => v.status === 'reserved').length;

  const categories = useMemo(() => {
    return Array.from(new Set(villas.map((v) => v.category)));
  }, [villas]);

  const filteredVillas = useMemo(() => {
    return villas.filter((v) => {
      const matchStatus = statusFilter === 'all' || v.status === statusFilter;
      const matchCat = selectedCategory === 'all' || v.category === selectedCategory;
      return matchStatus && matchCat;
    });
  }, [villas, statusFilter, selectedCategory]);

  const openTransitionConfirm = (
    villa: Villa,
    targetStatus: VillaStatus,
    targetHousekeeping?: HousekeepingStatus
  ) => {
    // Validate illegal transitions immediately
    if (villa.status === 'occupied' && targetStatus === 'ready') {
      showToast('An occupied villa cannot transition directly to Ready. Please initiate Cleaning & Housekeeping inspection first.', 'error');
      return;
    }

    setTransitionModal({
      isOpen: true,
      villa,
      targetStatus,
      targetHousekeeping,
      reasonText: targetStatus === 'maintenance' ? 'Scheduled plumbing and filtration inspection' : undefined,
    });
  };

  const confirmTransition = () => {
    if (!transitionModal.villa) return;

    const res = updateVillaStatus(
      transitionModal.villa.id,
      transitionModal.targetStatus,
      transitionModal.targetHousekeeping
    );

    if (res.success) {
      showToast(res.message, 'success');
    } else {
      showToast(res.message, 'error');
    }

    setTransitionModal({ isOpen: false, villa: null, targetStatus: 'ready' });
  };

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto' }}>
      {/* Header */}
      <OperationalPageHeader
        title={t('operations.villaStatus.title', 'Villa Status Management')}
        subtitle={t('operations.villaStatus.subtitle', 'Live resort inventory, housekeeping status tracking, and maintenance operations.')}
        badge="Screen #24"
      />

      {/* KPI Stats Strip */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 'var(--space-3)',
          marginBottom: 'var(--space-6)',
        }}
      >
        <div style={{ padding: '12px 14px', backgroundColor: 'var(--surface)', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Villas</div>
          <div style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>{total}</div>
        </div>

        <div style={{ padding: '12px 14px', backgroundColor: '#E8F5E9', borderRadius: 'var(--radius-xs)', border: '1px solid #C8E6C9' }}>
          <div style={{ fontSize: '11px', color: '#1B5E20', fontWeight: 600 }}>Ready / Inspected</div>
          <div style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: '#1B5E20', marginTop: '2px' }}>{readyCount}</div>
        </div>

        <div style={{ padding: '12px 14px', backgroundColor: '#ECEFF1', borderRadius: 'var(--radius-xs)', border: '1px solid #CFD8DC' }}>
          <div style={{ fontSize: '11px', color: '#263238', fontWeight: 600 }}>Occupied</div>
          <div style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: '#263238', marginTop: '2px' }}>{occupiedCount}</div>
        </div>

        <div style={{ padding: '12px 14px', backgroundColor: '#FFF8E1', borderRadius: 'var(--radius-xs)', border: '1px solid #FFE082' }}>
          <div style={{ fontSize: '11px', color: '#8C5400', fontWeight: 600 }}>Cleaning</div>
          <div style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: '#8C5400', marginTop: '2px' }}>{cleaningCount}</div>
        </div>

        <div style={{ padding: '12px 14px', backgroundColor: '#E3F2FD', borderRadius: 'var(--radius-xs)', border: '1px solid #BBDEFB' }}>
          <div style={{ fontSize: '11px', color: '#0D47A1', fontWeight: 600 }}>Reserved</div>
          <div style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: '#0D47A1', marginTop: '2px' }}>{reservedCount}</div>
        </div>

        <div style={{ padding: '12px 14px', backgroundColor: '#FFEBEE', borderRadius: 'var(--radius-xs)', border: '1px solid #FFCDD2' }}>
          <div style={{ fontSize: '11px', color: '#C62828', fontWeight: 600 }}>Maintenance</div>
          <div style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: '#C62828', marginTop: '2px' }}>{maintenanceCount}</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--space-3)',
          padding: 'var(--space-3) var(--space-4)',
          backgroundColor: 'var(--surface)',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-subtle)',
          marginBottom: 'var(--space-4)',
        }}
      >
        {/* Status Filter Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          {['all', 'ready', 'occupied', 'cleaning', 'reserved', 'maintenance'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={statusFilter === st ? 'hsw-btn hsw-btn-primary' : 'hsw-btn hsw-btn-secondary'}
              style={{
                minHeight: '30px',
                padding: '0 10px',
                fontSize: '11px',
                textTransform: 'capitalize',
              }}
            >
              {st === 'all' ? t('operations.common.all', 'All Statuses') : st}
            </button>
          ))}
        </div>

        {/* Category Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>
            Category:
          </span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{
              height: '30px',
              padding: '0 8px',
              fontSize: '11px',
              borderRadius: 'var(--radius-xs)',
              border: '1px solid var(--border-strong)',
              backgroundColor: 'var(--bg-canvas)',
              outline: 'none',
            }}
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Villa Board Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 'var(--space-4)' }}>
        {filteredVillas.map((villa) => {
          return (
            <div
              key={villa.id}
              style={{
                backgroundColor: 'var(--surface)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
                padding: 'var(--space-5)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                {/* Header: Code & Chip */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Villa #{villa.code}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                      ({villa.capacity} Persons)
                    </span>
                  </div>
                  <VillaStatusChip status={villa.status} housekeeping={villa.housekeeping} />
                </div>

                {/* Name & Category */}
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--accent-forest)', marginBottom: '2px' }}>
                  {villa.name[currentLang] || villa.name.en}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                  {villa.category} • {villa.bedType}
                </div>

                {/* Stay Info / Occupancy Details */}
                <div style={{ padding: '8px 10px', borderRadius: 'var(--radius-xs)', backgroundColor: 'var(--bg-canvas)', fontSize: '11px', marginBottom: '12px' }}>
                  {villa.status === 'occupied' && (
                    <div>
                      <div style={{ color: 'var(--text-tertiary)', marginBottom: '2px' }}>Current Stay:</div>
                      <strong style={{ color: 'var(--text-primary)' }}>{villa.currentCustomerName}</strong>
                      <div style={{ color: 'var(--accent-forest)', fontFamily: 'monospace' }}>
                        Ref: {villa.currentBookingRef}
                      </div>
                    </div>
                  )}

                  {villa.status === 'reserved' && (
                    <div>
                      <div style={{ color: 'var(--text-tertiary)', marginBottom: '2px' }}>Reserved For:</div>
                      <strong style={{ color: 'var(--text-primary)' }}>{villa.currentCustomerName || 'Scheduled Arrival'}</strong>
                      {villa.currentBookingRef && (
                        <div style={{ color: 'var(--accent-forest)', fontFamily: 'monospace' }}>
                          Ref: {villa.currentBookingRef}
                        </div>
                      )}
                    </div>
                  )}

                  {villa.status === 'ready' && (
                    <div style={{ color: '#1B5E20', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <CheckCircle2 size={13} />
                      <span>Ready for check-in inspection.</span>
                    </div>
                  )}

                  {villa.status === 'cleaning' && (
                    <div style={{ color: '#8C5400', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Brush size={13} />
                      <span>Housekeeping service underway.</span>
                    </div>
                  )}

                  {villa.status === 'maintenance' && (
                    <div style={{ color: '#C62828', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Wrench size={13} />
                      <span>{villa.maintenanceReason || 'Under technical repair'}</span>
                    </div>
                  )}
                </div>

                {/* Features & Next Arrival */}
                {villa.nextArrival && villa.status !== 'occupied' && (
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                    Next ETA: <strong>{villa.nextArrival.time}</strong> ({villa.nextArrival.customerName})
                  </div>
                )}
              </div>

              {/* Status Action Buttons */}
              <div style={{ paddingTop: 'var(--space-3)', borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {/* If Occupied -> Can mark Cleaning after checkout */}
                {villa.status === 'occupied' && (
                  <button
                    type="button"
                    onClick={() => openTransitionConfirm(villa, 'cleaning', 'in_progress')}
                    className="hsw-btn hsw-btn-secondary"
                    style={{ flex: 1, minHeight: '32px', fontSize: '11px', color: '#8C5400' }}
                  >
                    <Brush size={12} />
                    <span>{t('operations.villaStatus.markCleaning', 'Mark Cleaning')}</span>
                  </button>
                )}

                {/* If Cleaning -> Can mark Ready (Inspected) */}
                {villa.status === 'cleaning' && (
                  <button
                    type="button"
                    onClick={() => openTransitionConfirm(villa, 'ready', 'inspected')}
                    className="hsw-btn hsw-btn-primary"
                    style={{ flex: 1, minHeight: '32px', fontSize: '11px' }}
                  >
                    <Sparkles size={12} />
                    <span>{t('operations.villaStatus.markReady', 'Mark Clean & Ready')}</span>
                  </button>
                )}

                {/* If Ready -> Can put into maintenance or reserved */}
                {villa.status === 'ready' && (
                  <>
                    <button
                      type="button"
                      onClick={() => openTransitionConfirm(villa, 'maintenance', 'dirty')}
                      className="hsw-btn hsw-btn-secondary"
                      style={{ flex: 1, minHeight: '32px', fontSize: '11px', color: '#C62828' }}
                    >
                      <Wrench size={12} />
                      <span>{t('operations.villaStatus.markMaintenance', 'Report Maintenance')}</span>
                    </button>
                  </>
                )}

                {/* If Maintenance -> Can mark Ready once fixed */}
                {villa.status === 'maintenance' && (
                  <button
                    type="button"
                    onClick={() => openTransitionConfirm(villa, 'ready', 'inspected')}
                    className="hsw-btn hsw-btn-primary"
                    style={{ flex: 1, minHeight: '32px', fontSize: '11px' }}
                  >
                    <CheckCircle2 size={12} />
                    <span>Repairs Complete → Set Ready</span>
                  </button>
                )}

                {/* If Reserved -> Can release or inspect */}
                {villa.status === 'reserved' && (
                  <button
                    type="button"
                    onClick={() => openTransitionConfirm(villa, 'ready', 'inspected')}
                    className="hsw-btn hsw-btn-secondary"
                    style={{ flex: 1, minHeight: '32px', fontSize: '11px' }}
                  >
                    <RotateCcw size={12} />
                    <span>Release Reservation</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Confirmation Modal */}
      {transitionModal.isOpen && transitionModal.villa && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 'var(--space-4)',
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--surface)',
              borderRadius: 'var(--radius-sm)',
              maxWidth: '440px',
              width: '100%',
              padding: 'var(--space-6)',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={18} style={{ color: 'var(--accent-forest)' }} />
                <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                  {t('operations.villaStatus.confirmTitle', 'Confirm Status Change')}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setTransitionModal({ isOpen: false, villa: null, targetStatus: 'ready' })}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)' }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 'var(--space-4)' }}>
              {t('operations.villaStatus.confirmPrompt', 'Are you sure you want to transition Villa to this status?')}
            </p>

            <div style={{ padding: '12px', backgroundColor: 'var(--bg-soft)', borderRadius: 'var(--radius-xs)', fontSize: 'var(--text-xs)', marginBottom: 'var(--space-5)' }}>
              <div>
                Villa: <strong>Villa #{transitionModal.villa.code} ({transitionModal.villa.name[currentLang] || transitionModal.villa.name.en})</strong>
              </div>
              <div style={{ marginTop: '4px' }}>
                Current Status: <strong style={{ textTransform: 'capitalize' }}>{transitionModal.villa.status}</strong> → New Status: <strong style={{ textTransform: 'capitalize', color: 'var(--accent-forest)' }}>{transitionModal.targetStatus}</strong>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
              <button
                type="button"
                onClick={() => setTransitionModal({ isOpen: false, villa: null, targetStatus: 'ready' })}
                className="hsw-btn hsw-btn-secondary"
                style={{ minHeight: '36px', fontSize: 'var(--text-xs)' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmTransition}
                className="hsw-btn hsw-btn-primary"
                style={{ minHeight: '36px', fontSize: 'var(--text-xs)' }}
              >
                Confirm Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
