import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useToast } from '../../components/common/Toast';
import { Container } from '../../components/common/Container';
import { Button } from '../../components/common/Button';
import { CustomerPageHeader } from '../../components/customer/CustomerPageHeader';
import { PrivacyNotice } from '../../components/customer/PrivacyNotice';
import { HeartPulse, Utensils, ShieldCheck, Lock, Save, Trash2 } from 'lucide-react';
import { getMyHealthProfile, updateMyHealthProfile, type HealthProfileData, type HealthDeclarationState } from '../../api/health/healthProfileApi';
import { listMyConsents } from '../../api/health/consentApi';
import { AppApiError } from '../../api/errors/apiError';
import { useAuth } from '../../app/providers/AuthProvider';

type StressLevel = 'mild' | 'moderate' | 'high';
const splitList = (value: string): string[] => value.split(',').map((s) => s.trim()).filter(Boolean);
const joinList = (values: string[] | null | undefined): string => (values ?? []).join(', ');
const textOrEmpty = (value: string | null | undefined): string => value ?? '';
const formatDateTime = (iso: string | null): string => { if (!iso) return ''; try { return new Date(iso).toLocaleString(); } catch { return iso; } };

const HealthProfilePageForIdentity: React.FC<{ isCurrentIdentity: () => boolean }> = ({ isCurrentIdentity }) => {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [reloadSequence, setReloadSequence] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const navigate = useNavigate();
  const [serverConsented, setServerConsented] = useState(false);
  const [consentVersion, setConsentVersion] = useState<string | null>(null);
  const [consentGrantedAt, setConsentGrantedAt] = useState<string | null>(null);
  const [healthNotes, setHealthNotes] = useState({ medicalConditions: '', injuriesOrSurgeries: '', mobilityConsiderations: '', currentMedications: '', stressLevel: '' as StressLevel | '', treatmentPreferences: '' });
  const [dietary, setDietary] = useState({ allergies: '', dietaryRestrictions: '', intolerances: '', dislikedIngredients: '', specialInstructions: '' });
  const [allergiesState, setAllergiesState] = useState<HealthDeclarationState>('NOT_DECLARED');
  const [dietaryState, setDietaryState] = useState<HealthDeclarationState>('NOT_DECLARED');
  const applyServer = (data: HealthProfileData): void => {
    setServerConsented(data.hasConsented);
    setHealthNotes({ medicalConditions: textOrEmpty(data.currentHealthCondition), injuriesOrSurgeries: textOrEmpty(data.injurySurgeryHistory), mobilityConsiderations: textOrEmpty(data.mobilityJointNotes), currentMedications: textOrEmpty(data.currentMedications), stressLevel: ((data.stressFatigueLevel as StressLevel) || ''), treatmentPreferences: joinList(data.therapyPreferences) });
    setDietary({ allergies: joinList(data.foodAllergies), dietaryRestrictions: joinList(data.dietaryRequirements), intolerances: textOrEmpty(data.foodIntoleranceNotes), dislikedIngredients: textOrEmpty(data.dislikedIngredients), specialInstructions: textOrEmpty(data.kitchenNotes) });
    setAllergiesState(data.allergiesDeclarationState ?? 'NOT_DECLARED');
    setDietaryState(data.dietaryRequirementsDeclarationState ?? 'NOT_DECLARED');
  };
  useEffect(() => {
    let cancelled = false;
    getMyHealthProfile().then((r) => { if (!cancelled) applyServer(r.data); }).catch((e: unknown) => { if (!cancelled) setLoadError(e instanceof AppApiError ? e.message : 'Could not load your saved health profile.'); }).finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [reloadSequence]);
  useEffect(() => {
    let cancelled = false;
    listMyConsents().then((r) => {
      if (cancelled) return;
      const rec = r.data.find((c) => c.consentType === 'HEALTH_DATA_PROCESSING' && c.active);
      setConsentVersion(rec ? rec.policyVersion : null);
      setConsentGrantedAt(rec ? rec.grantedAt : null);
    }).catch(() => { /* consent meta is non-fatal to the profile */ });
    return () => { cancelled = true; };
  }, [reloadSequence]);
  const toMsg = (error: unknown, fallback: string): string => {
    if (error instanceof AppApiError) {
      if (error.code === 'HEALTH_CONSENT_REQUIRED') return t('customer.healthProfile.consentRequiredError', 'Please agree to health-data processing before saving.');
      if (error.code === 'NETWORK_ERROR') return t('customer.healthProfile.networkError', 'Backend unreachable. Check that the API is running.');
      return error.message;
    }
    return fallback;
  };
  const handleSave = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (isSaving || isLoading || !isCurrentIdentity()) return;
    setSaveError(null);
    setIsSaving(true);
    try {
      if (!isCurrentIdentity()) return;
      const allergenItems = splitList(dietary.allergies);
      const requirementItems = splitList(dietary.dietaryRestrictions);
      await updateMyHealthProfile({ currentHealthCondition: healthNotes.medicalConditions.trim() || null, injurySurgeryHistory: healthNotes.injuriesOrSurgeries.trim() || null, mobilityJointNotes: healthNotes.mobilityConsiderations.trim() || null, currentMedications: healthNotes.currentMedications.trim() || null, stressFatigueLevel: healthNotes.stressLevel || null, foodAllergies: allergenItems, foodIntoleranceNotes: dietary.intolerances.trim() || null, dietaryRequirements: requirementItems, therapyPreferences: splitList(healthNotes.treatmentPreferences), dislikedIngredients: dietary.dislikedIngredients.trim() || null, kitchenNotes: dietary.specialInstructions.trim() || null, allergiesDeclarationState: allergenItems.length > 0 ? 'DECLARED' : 'EXPLICITLY_NONE', dietaryRequirementsDeclarationState: requirementItems.length > 0 ? 'DECLARED' : 'EXPLICITLY_NONE' });
      if (!isCurrentIdentity()) return;
      const saved = (await getMyHealthProfile()).data;
      if (!isCurrentIdentity()) return;
      applyServer(saved);
      showToast(t('customer.healthProfile.saveSuccess', 'Health profile saved successfully.'), 'success');
    } catch (error) { const m = toMsg(error, t('customer.healthProfile.saveFailed', 'Could not save your health profile.')); setSaveError(m); showToast(m, 'error'); }
    finally { setIsSaving(false); }
  };
  const handleRetry = (): void => {
    setLoadError(null);
    setIsLoading(true);
    setReloadSequence((sequence) => sequence + 1);
  };
  return (
    <div className="hsw-health-profile-page" style={{ padding: 'var(--space-6) 0 var(--space-16)' }}>
      <Container size="standard">
        <CustomerPageHeader
          badge={t('customer.healthProfile.badge', 'Confidential Wellness Care')}
          title={t('customer.healthProfile.title', 'Health & Dietary Profile')}
          subtitle={t(
            'customer.healthProfile.subtitle',
            'Ensure your therapists and culinary masters tailor every session safely to your physical needs.'
          )}
        />

        {isLoading ? (
          <div style={{ padding: 'var(--space-4)', textAlign: 'center', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
            {t('customer.healthProfile.loading', 'Loading your saved health profile…')}
          </div>
        ) : null}
        {loadError && !isLoading ? (
          <div
            role="alert"
            style={{
              padding: 'var(--space-4)',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--danger-bg)',
              color: 'var(--danger)',
              fontSize: 'var(--text-sm)',
              lineHeight: 1.5,
            }}
          >
            <div style={{ marginBottom: 'var(--space-2)' }}>{loadError}</div>
            <Button variant="secondary" size="sm" onClick={handleRetry}>
              {t('customer.healthProfile.retry', 'Retry')}
            </Button>
          </div>
        ) : null}
        {saveError ? (
          <div
            role="alert"
            style={{
              padding: 'var(--space-3) var(--space-4)',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--danger-bg)',
              color: 'var(--danger)',
              fontSize: 'var(--text-sm)',
              lineHeight: 1.5,
            }}
          >
            {saveError}
          </div>
        ) : null}
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }} aria-busy={isSaving || isLoading}>
          {/* ====================================================================
              1. Consent & Purpose Limitation Section
              ==================================================================== */}
          <div
            style={{
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-6)',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-4)', paddingBottom: 'var(--space-3)', borderBottom: '1px solid var(--border-subtle)' }}>
              <ShieldCheck size={20} style={{ color: 'var(--accent-forest)' }} />
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-lg)', fontWeight: 500, margin: 0, color: 'var(--text-primary)' }}>
                {t('customer.healthProfile.consentSection', 'Data Privacy & Medical Consent')}
              </h2>
            </div>

            <PrivacyNotice
              title={t('customer.healthProfile.consentTitle', 'Wellness Purpose Limitation Agreement')}
              description={t(
                'customer.healthProfile.consentText',
                'I explicitly consent to HeavenStay collecting and storing my health notes and dietary preferences solely for personalized therapeutic treatments and safe meal preparation during my retreat stay.'
              )}
              variant="highlight"
            />

                        <div style={{ marginTop: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {t('customer.healthProfile.consentStatusLabel', 'Status')}:
                </span>
                {serverConsented ? (
                  <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--accent-forest)', backgroundColor: 'var(--accent-sand-soft)', padding: '2px 10px', borderRadius: 'var(--radius-pill)', border: '1px solid var(--accent-sand)' }}>
                    {t('customer.healthProfile.consentStatusConfirmed', 'Consent confirmed')}
                  </span>
                ) : (
                  <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-warning)', backgroundColor: 'var(--surface-warning)', padding: '2px 10px', borderRadius: 'var(--radius-pill)', border: '1px solid var(--border-warning)' }}>
                    {t('customer.healthProfile.consentStatusNotConfirmed', 'Not confirmed')}
                  </span>
                )}
              </div>
              {serverConsented ? (
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  {t('customer.healthProfile.consentVersionDisplay', 'Version: {{version}}', { version: consentVersion ?? 'v1.2' })}
                  {consentGrantedAt ? ' · ' + t('customer.healthProfile.consentConfirmedAtDisplay', 'Confirmed at: {{when}}', { when: formatDateTime(consentGrantedAt) }) : ''}
                </div>
              ) : null}
              <div>
                <Button
                  type="button"
                  variant="primary"
                  size="lg"
                  icon={<ShieldCheck size={16} />}
                  onClick={() => navigate(serverConsented ? '/customer/health-profile/consent?mode=review' : '/customer/health-profile/consent')}
                >
                  {serverConsented
                    ? t('customer.healthProfile.consentReviewBtn', 'Review agreement')
                    : t('customer.healthProfile.consentViewConfirmBtn', 'View content and confirm')}
                </Button>
              </div>
            </div>
          </div>

          {/* ====================================================================
              2. Physical & Therapeutic Health Considerations (Therapist Boundary)
              ==================================================================== */}
          <div
            style={{
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-6)',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: 'var(--space-4)', paddingBottom: 'var(--space-3)', borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <HeartPulse size={20} style={{ color: 'var(--accent-forest)' }} />
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-lg)', fontWeight: 500, margin: 0, color: 'var(--text-primary)' }}>
                  {t('customer.healthProfile.therapistSection', 'Therapeutic & Physical Health Considerations')}
                </h2>
              </div>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--accent-olive)', backgroundColor: 'var(--surface-muted)', padding: '2px 8px', borderRadius: 'var(--radius-pill)', border: '1px solid var(--border-subtle)' }}>
                <Lock size={12} />
                <span>Therapist Confidentiality Boundary</span>
              </span>
            </div>

            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: 'var(--space-5)', lineHeight: 1.6 }}>
              {t(
                'customer.healthProfile.therapistNotice',
                'This section is shared exclusively with certified therapists assigned to your treatment room. Receptionists and other resort staff do not have access to these clinical notes.'
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  {t('customer.healthProfile.medicalConditions', 'Current Health Conditions / Tension Areas')}
                </label>
                <input
                  type="text"
                  value={healthNotes.medicalConditions}
                  onChange={(e) => setHealthNotes((p) => ({ ...p, medicalConditions: e.target.value }))}
                  placeholder={t('customer.healthProfile.medicalConditionsHint', 'e.g., lower back stiffness, mild hypertension, muscle tightness')}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: 'var(--text-sm)',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
                <div>
                  <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                    {t('customer.healthProfile.injuries', 'Past Injuries or Surgeries')}
                  </label>
                  <input
                    type="text"
                    value={healthNotes.injuriesOrSurgeries}
                    onChange={(e) => setHealthNotes((p) => ({ ...p, injuriesOrSurgeries: e.target.value }))}
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
                    {t('customer.healthProfile.mobility', 'Mobility / Movement Considerations')}
                  </label>
                  <input
                    type="text"
                    value={healthNotes.mobilityConsiderations}
                    onChange={(e) => setHealthNotes((p) => ({ ...p, mobilityConsiderations: e.target.value }))}
                    placeholder={t('customer.healthProfile.mobilityHint', 'e.g., avoid intense spinal twists, gentle stretching preferred')}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-subtle)',
                      fontSize: 'var(--text-sm)',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
                <div>
                  <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                    {t('customer.healthProfile.medications', 'Current Regular Supplements / Medications')}
                  </label>
                  <input
                    type="text"
                    value={healthNotes.currentMedications}
                    onChange={(e) => setHealthNotes((p) => ({ ...p, currentMedications: e.target.value }))}
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
                    {t('customer.healthProfile.stressLevel', 'Current Stress & Fatigue Level')}
                  </label>
                  <select
                    value={healthNotes.stressLevel}
                    onChange={(e) => setHealthNotes((p) => ({ ...p, stressLevel: e.target.value as StressLevel | '' }))}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-subtle)',
                      fontSize: 'var(--text-sm)',
                      backgroundColor: 'var(--control-bg, var(--surface))',
                      color: 'var(--text-primary)',
                    }}
                  >
                    <option value="">{t('customer.healthProfile.stressUnspecified', 'Not specified')}</option>
                    <option value="mild">{t('customer.healthProfile.stressMild', 'Mild (Seeking peaceful rest)')}</option>
                    <option value="moderate">{t('customer.healthProfile.stressModerate', 'Moderate (Need tension relief)')}</option>
                    <option value="high">{t('customer.healthProfile.stressHigh', 'High (Seeking deep somatic recovery)')}</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  {t('customer.healthProfile.treatmentPreferences', 'Therapy & Essential Oil Preferences')}
                </label>
                <input
                  type="text"
                  value={healthNotes.treatmentPreferences}
                  onChange={(e) => setHealthNotes((p) => ({ ...p, treatmentPreferences: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: 'var(--text-sm)',
                  }}
                />
              </div>
            </div>
          </div>

          {/* ====================================================================
              3. Dietary & Allergy Safeguards (Chef / F&B Boundary)
              ==================================================================== */}
          <div
            style={{
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-6)',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: 'var(--space-4)', paddingBottom: 'var(--space-3)', borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Utensils size={20} style={{ color: 'var(--text-warning)' }} />
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-lg)', fontWeight: 500, margin: 0, color: 'var(--text-primary)' }}>
                  {t('customer.healthProfile.dietarySection', 'Nutritional & Dietary Safeguards')}
                </h2>
              </div>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text-warning)', backgroundColor: 'var(--surface-warning)', padding: '2px 8px', borderRadius: 'var(--radius-pill)', border: '1px solid var(--border-warning)' }}>
                <Lock size={12} />
                <span>Executive Chef Boundary</span>
              </span>
            </div>

            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: 'var(--space-5)', lineHeight: 1.6 }}>
              {t(
                'customer.healthProfile.chefNotice',
                'This section is shared exclusively with the Executive Wellness Chef and F&B culinary crew for food safety and preparation protocols.'
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-danger)', marginBottom: '4px' }}>
                  {t('customer.healthProfile.allergies', 'Known Food Allergies (Strict Safety Alert)')}
                </label>
                <select
                  value={allergiesState}
                  onChange={(e) => setAllergiesState(e.target.value as HealthDeclarationState)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-danger)',
                    fontSize: 'var(--text-sm)',
                    marginBottom: '8px',
                    backgroundColor: 'var(--surface)',
                    color: 'var(--text-primary)',
                  }}
                >
                  <option value="NOT_DECLARED">{t('customer.healthProfile.allergyStateNotDeclared', 'Not declared')}</option>
                  <option value="EXPLICITLY_NONE">{t('customer.healthProfile.allergyStateExplicitlyNone', 'Confirm no allergies')}</option>
                  <option value="DECLARED">{t('customer.healthProfile.allergyStateDeclared', 'Allergies declared')}</option>
                </select>
                <input
                  type="text"
                  value={dietary.allergies}
                  onChange={(e) => setDietary((p) => ({ ...p, allergies: e.target.value }))}
                  disabled={allergiesState !== 'DECLARED'}
                  placeholder={t('customer.healthProfile.allergiesHint', 'e.g., Peanuts, Crustaceans, Shellfish, Tree Nuts')}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-danger)',
                    fontSize: 'var(--text-sm)',
                    backgroundColor: allergiesState !== 'DECLARED' ? 'var(--surface-muted, var(--surface))' : 'var(--surface-danger)',
                    color: 'var(--text-primary)',
                    cursor: allergiesState !== 'DECLARED' ? 'not-allowed' : 'text',
                  }}
                />
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  {allergiesState === 'NOT_DECLARED' && t('customer.healthProfile.allergyStateHintNotDeclared', 'You have not declared your allergies yet.')}
                  {allergiesState === 'EXPLICITLY_NONE' && t('customer.healthProfile.allergyStateHintExplicitlyNone', 'You confirmed you have no food allergies.')}
                  {allergiesState === 'DECLARED' && t('customer.healthProfile.allergyStateHintDeclared', 'Enter allergen names separated by commas.')}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
                <div>
                  <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                    {t('customer.healthProfile.dietaryRestrictions', 'Dietary Principles')}
                  </label>
                  <select
                    value={dietaryState}
                    onChange={(e) => setDietaryState(e.target.value as HealthDeclarationState)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-subtle)',
                      fontSize: 'var(--text-sm)',
                      marginBottom: '8px',
                      backgroundColor: 'var(--surface)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    <option value="NOT_DECLARED">{t('customer.healthProfile.dietaryStateNotDeclared', 'Not declared')}</option>
                    <option value="EXPLICITLY_NONE">{t('customer.healthProfile.dietaryStateExplicitlyNone', 'Confirm no special dietary needs')}</option>
                    <option value="DECLARED">{t('customer.healthProfile.dietaryStateDeclared', 'Dietary needs declared')}</option>
                  </select>
                  <input
                    type="text"
                    value={dietary.dietaryRestrictions}
                    onChange={(e) => setDietary((p) => ({ ...p, dietaryRestrictions: e.target.value }))}
                    disabled={dietaryState !== 'DECLARED'}
                    placeholder={t('customer.healthProfile.dietaryRestrictionsHint', 'e.g., Vegetarian, Pescatarian, Gluten-Conscious, Low-Sodium')}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-subtle)',
                      fontSize: 'var(--text-sm)',
                      backgroundColor: dietaryState !== 'DECLARED' ? 'var(--surface-muted, var(--surface))' : undefined,
                      cursor: dietaryState !== 'DECLARED' ? 'not-allowed' : 'text',
                    }}
                  />
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    {dietaryState === 'NOT_DECLARED' && t('customer.healthProfile.dietaryStateHintNotDeclared', 'You have not declared any special dietary needs yet.')}
                    {dietaryState === 'EXPLICITLY_NONE' && t('customer.healthProfile.dietaryStateHintExplicitlyNone', 'You confirmed you have no special dietary needs.')}
                    {dietaryState === 'DECLARED' && t('customer.healthProfile.dietaryStateHintDeclared', 'Enter dietary needs separated by commas.')}
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                    {t('customer.healthProfile.intolerances', 'Food Intolerances')}
                  </label>
                  <input
                    type="text"
                    value={dietary.intolerances}
                    onChange={(e) => setDietary((p) => ({ ...p, intolerances: e.target.value }))}
                    placeholder={t('customer.healthProfile.intolerancesHint', 'e.g., Lactose, Dairy, Fructose')}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-subtle)',
                      fontSize: 'var(--text-sm)',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  {t('customer.healthProfile.dislikedIngredients', 'Disliked Ingredients')}
                </label>
                <input
                  type="text"
                  value={dietary.dislikedIngredients}
                  onChange={(e) => setDietary((p) => ({ ...p, dislikedIngredients: e.target.value }))}
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
                  {t('customer.healthProfile.specialInstructions', 'Kitchen Preparation Special Notes')}
                </label>
                <textarea
                  rows={3}
                  value={dietary.specialInstructions}
                  onChange={(e) => setDietary((p) => ({ ...p, specialInstructions: e.target.value }))}
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
            </div>
          </div>

          {/* ====================================================================
              4. Submit & Erasure Link Section
              ==================================================================== */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 'var(--space-4)',
              paddingTop: 'var(--space-4)',
            }}
          >
            <Button
              type="submit"
              variant="primary"
              size="lg"
              icon={<Save size={16} />}
              isLoading={isSaving}
              disabled={isLoading}
              style={{ backgroundColor: 'var(--accent-forest)', color: '#ffffff', fontWeight: 600 }}
            >
              {t('customer.healthProfile.saveProfileBtn', 'Save Health & Dietary Profile')}
            </Button>

            <Link
              to="/customer/health-profile/deletion"
              style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--text-warning)',
                textDecoration: 'underline',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <Trash2 size={13} />
              <span>{t('customer.healthProfile.deletionLinkText', 'Need to exercise your right to erasure? Request health data deletion.')}</span>
            </Link>
          </div>
        </form>
      </Container>
    </div>
  );
};

export const HealthProfilePage: React.FC = () => {
  const { currentUser } = useAuth();
  const identity = currentUser?.id ?? null;
  const activeIdentity = useRef(identity);
  activeIdentity.current = identity;
  if (!identity) {
    return <div role="alert">Your health profile is unavailable until your Customer identity is verified.</div>;
  }
  return <HealthProfilePageForIdentity key={identity} isCurrentIdentity={() => activeIdentity.current === identity} />;
};
