import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCustomer } from '../../context/CustomerContext';
import { useToast } from '../../components/common/Toast';
import { Container } from '../../components/common/Container';
import { Button } from '../../components/common/Button';
import { CustomerPageHeader } from '../../components/customer/CustomerPageHeader';
import { User, Phone, Lock, Bell, Shield, Save } from 'lucide-react';

export const AccountSettingsPage: React.FC = () => {
  const { t } = useTranslation();
  const { profile, updateProfile } = useCustomer();
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    fullName: profile.fullName,
    email: profile.email,
    phone: profile.phone,
    dateOfBirth: profile.dateOfBirth,
    address: profile.address,
    preferredLanguage: profile.preferredLanguage,
    emergencyName: profile.emergencyContact.name,
    emergencyPhone: profile.emergencyContact.phone,
    emergencyRelationship: profile.emergencyContact.relationship,
    notifyEmail: profile.notificationPreferences.email,
    notifySms: profile.notificationPreferences.sms,
    notifyWellness: profile.notificationPreferences.wellnessReminders,
  });

  const [passwordState, setPasswordState] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [passwordError, setPasswordError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      fullName: formData.fullName,
      email: formData.email,
      phone: formData.phone,
      dateOfBirth: formData.dateOfBirth,
      address: formData.address,
      preferredLanguage: formData.preferredLanguage,
      emergencyContact: {
        name: formData.emergencyName,
        phone: formData.emergencyPhone,
        relationship: formData.emergencyRelationship,
      },
      notificationPreferences: {
        email: formData.notifyEmail,
        sms: formData.notifySms,
        wellnessReminders: formData.notifyWellness,
      },
    });

    showToast(t('customer.account.saveSuccess', 'Account settings updated successfully.'), 'success');
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (passwordState.newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters.');
      return;
    }

    if (passwordState.newPassword !== passwordState.confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }

    setPasswordState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    showToast(t('customer.account.passwordChangedSuccess', 'Password updated successfully.'), 'success');
  };

  return (
    <div className="hsw-account-settings-page" style={{ padding: 'var(--space-6) 0 var(--space-16)' }}>
      <Container size="standard">
        <CustomerPageHeader
          badge={t('customer.account.badge', 'Account & Security')}
          title={t('customer.account.title', 'Account Settings')}
          subtitle={t('customer.account.subtitle', 'Manage your profile, communication preferences, and security settings.')}
        />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: 'var(--space-8)' }}>
          {/* ====================================================================
              Left Column: Profile, Emergency Contact, Notifications
              ==================================================================== */}
          <div>
            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
              {/* Personal Information */}
              <div
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: 'var(--space-6)',
                  boxShadow: 'var(--shadow-card)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-5)', paddingBottom: 'var(--space-3)', borderBottom: '1px solid var(--border-subtle)' }}>
                  <User size={18} style={{ color: 'var(--accent-forest)' }} />
                  <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-lg)', fontWeight: 500, margin: 0, color: 'var(--text-primary)' }}>
                    {t('customer.account.profileSection', 'Personal Information')}
                  </h2>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                      {t('customer.account.fullName', 'Full Name')}
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      required
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-subtle)',
                        fontSize: 'var(--text-sm)',
                        backgroundColor: '#ffffff',
                      }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-4)' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                        {t('customer.account.email', 'Email Address')}
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--border-subtle)',
                          fontSize: 'var(--text-sm)',
                          backgroundColor: '#ffffff',
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                        {t('customer.account.phone', 'Phone Number')}
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        required
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--border-subtle)',
                          fontSize: 'var(--text-sm)',
                          backgroundColor: '#ffffff',
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-4)' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                        {t('customer.account.dob', 'Date of Birth')}
                      </label>
                      <input
                        type="date"
                        name="dateOfBirth"
                        value={formData.dateOfBirth}
                        onChange={handleInputChange}
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--border-subtle)',
                          fontSize: 'var(--text-sm)',
                          backgroundColor: '#ffffff',
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                        {t('customer.account.preferredLanguage', 'Preferred Language')}
                      </label>
                      <select
                        name="preferredLanguage"
                        value={formData.preferredLanguage}
                        onChange={handleInputChange}
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--border-subtle)',
                          fontSize: 'var(--text-sm)',
                          backgroundColor: '#ffffff',
                        }}
                      >
                        <option value="vi">Tiếng Việt</option>
                        <option value="en">English</option>
                        <option value="zh-CN">简体中文</option>
                        <option value="ja">日本語</option>
                        <option value="fr">Français</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                      {t('customer.account.address', 'Residential Address')}
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-subtle)',
                        fontSize: 'var(--text-sm)',
                        backgroundColor: '#ffffff',
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Emergency Contact */}
              <div
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: 'var(--space-6)',
                  boxShadow: 'var(--shadow-card)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-5)', paddingBottom: 'var(--space-3)', borderBottom: '1px solid var(--border-subtle)' }}>
                  <Phone size={18} style={{ color: 'var(--accent-olive)' }} />
                  <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-lg)', fontWeight: 500, margin: 0, color: 'var(--text-primary)' }}>
                    {t('customer.account.emergencyContactSection', 'Emergency Contact')}
                  </h2>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-4)' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                      {t('customer.account.contactName', 'Contact Name')}
                    </label>
                    <input
                      type="text"
                      name="emergencyName"
                      value={formData.emergencyName}
                      onChange={handleInputChange}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-subtle)',
                        fontSize: 'var(--text-sm)',
                        backgroundColor: '#ffffff',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                      {t('customer.account.contactPhone', 'Contact Phone')}
                    </label>
                    <input
                      type="tel"
                      name="emergencyPhone"
                      value={formData.emergencyPhone}
                      onChange={handleInputChange}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-subtle)',
                        fontSize: 'var(--text-sm)',
                        backgroundColor: '#ffffff',
                      }}
                    />
                  </div>

                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                      {t('customer.account.relationship', 'Relationship')}
                    </label>
                    <input
                      type="text"
                      name="emergencyRelationship"
                      value={formData.emergencyRelationship}
                      onChange={handleInputChange}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-subtle)',
                        fontSize: 'var(--text-sm)',
                        backgroundColor: '#ffffff',
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Communication Preferences */}
              <div
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: 'var(--space-6)',
                  boxShadow: 'var(--shadow-card)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-5)', paddingBottom: 'var(--space-3)', borderBottom: '1px solid var(--border-subtle)' }}>
                  <Bell size={18} style={{ color: 'var(--accent-forest)' }} />
                  <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-lg)', fontWeight: 500, margin: 0, color: 'var(--text-primary)' }}>
                    {t('customer.account.notificationsSection', 'Communication Preferences')}
                  </h2>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: 'var(--text-sm)', color: 'var(--text-primary)', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      name="notifyEmail"
                      checked={formData.notifyEmail}
                      onChange={handleInputChange}
                    />
                    <span>{t('customer.account.notifyEmail', 'Retreat Updates & Booking Confirmations (Email)')}</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: 'var(--text-sm)', color: 'var(--text-primary)', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      name="notifySms"
                      checked={formData.notifySms}
                      onChange={handleInputChange}
                    />
                    <span>{t('customer.account.notifySms', 'Urgent Pre-Arrival & Villa Reminders (SMS)')}</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: 'var(--text-sm)', color: 'var(--text-primary)', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      name="notifyWellness"
                      checked={formData.notifyWellness}
                      onChange={handleInputChange}
                    />
                    <span>{t('customer.account.notifyWellness', 'Daily Mindfulness & Session Reminders (App/Email)')}</span>
                  </label>
                </div>
              </div>

              <div>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  icon={<Save size={16} />}
                  style={{ backgroundColor: 'var(--accent-forest)', color: '#ffffff', fontWeight: 600 }}
                >
                  {t('customer.account.saveChanges', 'Save Changes')}
                </Button>
              </div>
            </form>
          </div>

          {/* ====================================================================
              Right Column: Security & Membership Card
              ==================================================================== */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
            {/* Membership Status Card */}
            <div
              style={{
                backgroundColor: 'var(--accent-sand-soft)',
                border: '1px solid var(--accent-sand)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-6)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-3)' }}>
                <Shield size={20} style={{ color: 'var(--accent-forest)' }} />
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-lg)', fontWeight: 500, margin: 0, color: 'var(--accent-forest)' }}>
                  {profile.membershipTier}
                </h3>
              </div>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', margin: '0 0 var(--space-4)', lineHeight: 1.6 }}>
                {t('customer.account.memberSince', 'Member Since')}: <strong>{profile.memberSince}</strong>
              </p>
              <div style={{ fontSize: '11px', color: 'var(--accent-olive)', fontWeight: 600 }}>
                ✓ Priority Villa Allocation · Dedicated Wellness Concierge · Seasonal Herbal Blends
              </div>
            </div>

            {/* Password Change Form */}
            <div
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-6)',
                boxShadow: 'var(--shadow-card)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-4)', paddingBottom: 'var(--space-3)', borderBottom: '1px solid var(--border-subtle)' }}>
                <Lock size={18} style={{ color: 'var(--accent-olive)' }} />
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-lg)', fontWeight: 500, margin: 0, color: 'var(--text-primary)' }}>
                  {t('customer.account.securitySection', 'Password & Security')}
                </h2>
              </div>

              {passwordError && (
                <div
                  style={{
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: '#fdf2f2',
                    border: '1px solid #fecaca',
                    color: '#991b1b',
                    fontSize: 'var(--text-xs)',
                    marginBottom: 'var(--space-4)',
                  }}
                >
                  {passwordError}
                </div>
              )}

              <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <div>
                  <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                    {t('customer.account.currentPassword', 'Current Password')}
                  </label>
                  <input
                    type="password"
                    value={passwordState.currentPassword}
                    onChange={(e) => setPasswordState((p) => ({ ...p, currentPassword: e.target.value }))}
                    required
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-subtle)',
                      fontSize: 'var(--text-sm)',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                    {t('customer.account.newPassword', 'New Password')}
                  </label>
                  <input
                    type="password"
                    value={passwordState.newPassword}
                    onChange={(e) => setPasswordState((p) => ({ ...p, newPassword: e.target.value }))}
                    required
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-subtle)',
                      fontSize: 'var(--text-sm)',
                    }}
                  />
                  <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '2px', display: 'block' }}>
                    {t('customer.account.passwordHint', 'At least 8 characters with letters, numbers, and symbols.')}
                  </span>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                    {t('customer.account.confirmPassword', 'Confirm New Password')}
                  </label>
                  <input
                    type="password"
                    value={passwordState.confirmPassword}
                    onChange={(e) => setPasswordState((p) => ({ ...p, confirmPassword: e.target.value }))}
                    required
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-subtle)',
                      fontSize: 'var(--text-sm)',
                    }}
                  />
                </div>

                <div style={{ marginTop: 'var(--space-2)' }}>
                  <Button type="submit" variant="secondary" size="sm">
                    {t('customer.account.changePasswordBtn', 'Update Password')}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
};
