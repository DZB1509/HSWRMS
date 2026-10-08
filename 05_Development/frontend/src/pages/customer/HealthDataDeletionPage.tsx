import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCustomer } from '../../context/CustomerContext';
import { useToast } from '../../components/common/Toast';
import { Container } from '../../components/common/Container';
import { Button } from '../../components/common/Button';
import { CustomerPageHeader } from '../../components/customer/CustomerPageHeader';
import { PrivacyNotice } from '../../components/customer/PrivacyNotice';
import {
  Trash2,
  Clock,
  ArrowLeft,
  Calendar,
} from 'lucide-react';

export const HealthDataDeletionPage: React.FC = () => {
  const { t } = useTranslation();
  const { activeBooking, deletionRequest, submitDeletionRequest, cancelDeletionRequest } = useCustomer();
  const { showToast } = useToast();

  const [reason, setReason] = useState('');
  const [acknowledged, setAcknowledged] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!acknowledged) return;

    const result = submitDeletionRequest(reason, acknowledged);
    showToast(result.message, result.status === 'deferred_active_retreat' ? 'info' : 'success');
  };

  const handleCancel = () => {
    cancelDeletionRequest();
    showToast('Deletion request has been cancelled.', 'info');
  };

  return (
    <div className="hsw-health-deletion-page" style={{ padding: 'var(--space-6) 0 var(--space-16)' }}>
      <Container size="narrow">
        <CustomerPageHeader
          badge={t('customer.deletion.badge', 'Right to Erasure (GDPR / Decree 13)')}
          title={t('customer.deletion.title', 'Health Data Deletion Request')}
          subtitle={t(
            'customer.deletion.subtitle',
            'Submit a formal request to purge your confidential wellness notes and dietary records from our systems.'
          )}
          action={
            <Link to="/customer/health-profile">
              <Button variant="tertiary" size="sm" icon={<ArrowLeft size={14} />}>
                {t('customer.deletion.backToProfile', 'Return to Health Profile')}
              </Button>
            </Link>
          }
        />

        {/* Informative Policy Box */}
        <div style={{ marginBottom: 'var(--space-8)' }}>
          <PrivacyNotice
            title="Important Wellness Data Retention & Safety Rule"
            description={t(
              'customer.deletion.policyAlert',
              'Health data deletion cannot immediately occur while an active or upcoming retreat is in progress, as customer safety and treatment protocol require verified health notes during your stay.'
            )}
            variant="warning"
          />
        </div>

        {/* Active Retreat Status Notice */}
        {activeBooking ? (
          <div
            style={{
              backgroundColor: '#fffbeb',
              border: '1px solid #fde68a',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-5)',
              marginBottom: 'var(--space-8)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 'var(--space-4)',
            }}
          >
            <Calendar size={22} style={{ color: '#d97706', flexShrink: 0, marginTop: '2px' }} />
            <div>
              <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: '#92400e', margin: '0 0 var(--space-1)' }}>
                {t('customer.deletion.activeRetreatWarning', 'Active / Upcoming Retreat Detected')}
              </h4>
              <p style={{ fontSize: 'var(--text-xs)', color: '#b45309', margin: 0, lineHeight: 1.5 }}>
                You currently have an active reservation (<strong>Ref: {activeBooking.bookingReference}</strong> · {activeBooking.startDate} to {activeBooking.endDate}).
                Your health data deletion will be registered immediately and safely executed following retreat check-out.
              </p>
            </div>
          </div>
        ) : (
          <div
            style={{
              backgroundColor: 'rgba(44, 76, 56, 0.05)',
              border: '1px solid rgba(44, 76, 56, 0.15)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-4)',
              marginBottom: 'var(--space-8)',
              fontSize: 'var(--text-xs)',
              color: 'var(--accent-forest)',
            }}
          >
            ✓ {t('customer.deletion.eligibleNotice', 'No active retreats found. Your health records are eligible for immediate purge.')}
          </div>
        )}

        {/* Existing Deletion Request Card */}
        {deletionRequest ? (
          <div
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-8)',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-4)' }}>
              <Clock size={20} style={{ color: 'var(--accent-olive)' }} />
              <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                {t('customer.deletion.statusTitle', 'Current Request Status')}:{' '}
                <span
                  style={{
                    color:
                      deletionRequest.status === 'deferred_active_retreat'
                        ? '#d97706'
                        : deletionRequest.status === 'completed'
                        ? 'var(--accent-forest)'
                        : 'var(--text-primary)',
                  }}
                >
                  {deletionRequest.status === 'deferred_active_retreat'
                    ? t('customer.deletion.statusDeferred', 'Deferred (Active Retreat in Progress)')
                    : deletionRequest.status === 'pending'
                    ? t('customer.deletion.statusPending', 'Pending Administrative Review')
                    : t('customer.deletion.statusCompleted', 'Completed & Purged')}
                </span>
              </h3>
            </div>

            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 'var(--space-5)' }}>
              <div><strong>Request ID:</strong> {deletionRequest.id}</div>
              <div><strong>Submitted At:</strong> {new Date(deletionRequest.requestedAt).toLocaleString()}</div>
              {deletionRequest.activeRetreatNotice && (
                <div style={{ marginTop: 'var(--space-2)', color: '#92400e', fontStyle: 'italic' }}>
                  {deletionRequest.activeRetreatNotice}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
              <Button variant="secondary" size="sm" onClick={handleCancel}>
                {t('customer.deletion.cancelBtn', 'Withdraw Request')}
              </Button>
              <Link to="/customer/health-profile">
                <Button variant="tertiary" size="sm">
                  {t('customer.deletion.backToProfile', 'Return to Health Profile')}
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-8)',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            {/* Target Records Included */}
            <div style={{ marginBottom: 'var(--space-6)' }}>
              <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 'var(--space-3)' }}>
                {t('customer.deletion.dataIncludedTitle', 'Records Included in Deletion:')}
              </h3>
              <ul style={{ margin: 0, paddingLeft: 'var(--space-5)', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                <li>Confidential treatment notes and therapist session logs</li>
                <li>Allergy safeguards, dietary principles, and ingredient notes</li>
                <li>Mobility recommendations and joint/spine tension areas</li>
                <li>Medical consent agreement history</li>
              </ul>
            </div>

            {/* Optional Reason */}
            <div style={{ marginBottom: 'var(--space-5)' }}>
              <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                {t('customer.deletion.reasonLabel', 'Reason for Request (Optional)')}
              </label>
              <textarea
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={t('customer.deletion.reasonPlaceholder', 'Please share why you wish to remove your health data...')}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  fontSize: 'var(--text-sm)',
                  fontFamily: 'inherit',
                }}
              />
            </div>

            {/* Confirmation Checkbox */}
            <div style={{ marginBottom: 'var(--space-6)' }}>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={acknowledged}
                  onChange={(e) => setAcknowledged(e.target.checked)}
                  required
                  style={{ marginTop: '3px' }}
                />
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-primary)', lineHeight: 1.6 }}>
                  {t(
                    'customer.deletion.confirmCheckbox',
                    'I understand that purging my health records will reset all therapist personalization and dietary safety profiles for future retreats.'
                  )}
                </span>
              </label>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
              <Button
                type="submit"
                variant="destructive"
                size="md"
                disabled={!acknowledged}
                icon={<Trash2 size={16} />}
              >
                {t('customer.deletion.submitBtn', 'Submit Deletion Request')}
              </Button>
              <Link to="/customer/health-profile">
                <Button variant="tertiary" size="md">
                  {t('customer.deletion.backToProfile', 'Return to Health Profile')}
                </Button>
              </Link>
            </div>
          </form>
        )}
      </Container>
    </div>
  );
};
