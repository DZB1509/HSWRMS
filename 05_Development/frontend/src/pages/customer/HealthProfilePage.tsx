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
  HeartPulse,
  Utensils,
  ShieldCheck,
  Lock,
  Save,
  Trash2,
} from 'lucide-react';

export const HealthProfilePage: React.FC = () => {
  const { t } = useTranslation();
  const { wellnessProfile, updateWellnessProfile } = useCustomer();
  const { showToast } = useToast();

  const [hasConsented, setHasConsented] = useState(wellnessProfile.consent.hasConsented);

  const [healthNotes, setHealthNotes] = useState({
    medicalConditions: wellnessProfile.healthNotes.medicalConditions.join(', '),
    injuriesOrSurgeries: wellnessProfile.healthNotes.injuriesOrSurgeries,
    mobilityConsiderations: wellnessProfile.healthNotes.mobilityConsiderations,
    currentMedications: wellnessProfile.healthNotes.currentMedications,
    stressLevel: wellnessProfile.healthNotes.stressLevel,
    treatmentPreferences: wellnessProfile.healthNotes.treatmentPreferences.join(', '),
  });

  const [dietary, setDietary] = useState({
    allergies: wellnessProfile.dietaryProfile.allergies.join(', '),
    dietaryRestrictions: wellnessProfile.dietaryProfile.dietaryRestrictions.join(', '),
    intolerances: wellnessProfile.dietaryProfile.intolerances.join(', '),
    dislikedIngredients: wellnessProfile.dietaryProfile.dislikedIngredients.join(', '),
    specialInstructions: wellnessProfile.dietaryProfile.specialInstructions,
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    updateWellnessProfile({
      consent: {
        ...wellnessProfile.consent,
        hasConsented,
        consentedAt: hasConsented ? new Date().toISOString() : '',
      },
      healthNotes: {
        ...wellnessProfile.healthNotes,
        medicalConditions: healthNotes.medicalConditions
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        injuriesOrSurgeries: healthNotes.injuriesOrSurgeries,
        mobilityConsiderations: healthNotes.mobilityConsiderations,
        currentMedications: healthNotes.currentMedications,
        stressLevel: healthNotes.stressLevel as 'mild' | 'moderate' | 'high',
        treatmentPreferences: healthNotes.treatmentPreferences
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      },
      dietaryProfile: {
        ...wellnessProfile.dietaryProfile,
        allergies: dietary.allergies
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        dietaryRestrictions: dietary.dietaryRestrictions
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        intolerances: dietary.intolerances
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        dislikedIngredients: dietary.dislikedIngredients
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        specialInstructions: dietary.specialInstructions,
      },
      isComplete: hasConsented,
    });

    showToast(t('customer.healthProfile.saveSuccess', 'Wellness & Dietary Profile updated successfully.'), 'success');
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

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
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

            <div style={{ marginTop: 'var(--space-4)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={hasConsented}
                  onChange={(e) => setHasConsented(e.target.checked)}
                  required
                />
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {t('customer.healthProfile.consentGranted', 'I Agree & Grant Consent (v1.2 — Treatment Purpose Limitation)')}
                </span>
              </label>
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
                    onChange={(e) => setHealthNotes((p) => ({ ...p, stressLevel: e.target.value as 'mild' | 'moderate' | 'high' }))}
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
                <input
                  type="text"
                  value={dietary.allergies}
                  onChange={(e) => setDietary((p) => ({ ...p, allergies: e.target.value }))}
                  placeholder={t('customer.healthProfile.allergiesHint', 'e.g., Peanuts, Crustaceans, Shellfish, Tree Nuts')}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-danger)',
                    fontSize: 'var(--text-sm)',
                    backgroundColor: 'var(--surface-danger)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
                <div>
                  <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                    {t('customer.healthProfile.dietaryRestrictions', 'Dietary Principles')}
                  </label>
                  <input
                    type="text"
                    value={dietary.dietaryRestrictions}
                    onChange={(e) => setDietary((p) => ({ ...p, dietaryRestrictions: e.target.value }))}
                    placeholder={t('customer.healthProfile.dietaryRestrictionsHint', 'e.g., Vegetarian, Pescatarian, Gluten-Conscious, Low-Sodium')}
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
