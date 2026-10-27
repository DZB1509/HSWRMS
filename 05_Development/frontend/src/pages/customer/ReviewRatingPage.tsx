import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Star,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Send,
  Home,
  Receipt,
  Coffee,
  HeartHandshake,
  RotateCw,
} from 'lucide-react';
import { Container } from '../../components/common/Container';
import { useFolio } from '../../context/FolioContext';
import { useCustomer } from '../../context/CustomerContext';
import { billingApi } from '../../features/m5-billing/api/billingApi';

export const ReviewRatingPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { bookingId } = useParams<{ bookingId?: string }>();
  const { profile, activeBooking } = useCustomer();
  const {
    isStayCheckedOut,
    getReviewForBooking,
    submitReview,
    getFolioForBooking,
  } = useFolio();

  const targetBookingRef = bookingId || activeBooking?.bookingReference || 'HSW-88192';
  const folioData = getFolioForBooking(targetBookingRef);
  const isCheckedOut = isStayCheckedOut(targetBookingRef);
  const existingReview = getReviewForBooking(targetBookingRef);

  // Form State
  const [overallRating, setOverallRating] = useState<number>(existingReview?.overallRating || 5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  // Category Ratings (Task 6.5.3)
  const [villaRating, setVillaRating] = useState<number>(5);
  const [spaRating, setSpaRating] = useState<number>(5);
  const [diningRating, setDiningRating] = useState<number>(5);

  const [feedback, setFeedback] = useState<string>(existingReview?.feedback || '');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(!!existingReview);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // ── 1. GUARD: Review only allowed post-checkout (Rule 5 & 31) ─────
  if (!isCheckedOut) {
    return (
      <div className="hsw-folio-page">
        <Container size="narrow">
          <div className="hsw-payment-card" style={{ textAlign: 'center', padding: 'var(--space-10) var(--space-8)' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: 'rgba(217, 119, 6, 0.12)',
                color: '#d97706',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 'var(--space-4)',
              }}
            >
              <AlertCircle size={32} />
            </div>

            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)', fontWeight: 500, marginBottom: 'var(--space-2)' }}>
              {t('review.guardTitle', 'Review Available Post-Checkout')}
            </h1>

            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', maxWidth: '480px', margin: '0 auto var(--space-6)', lineHeight: 1.6 }}>
              {t(
                'review.guardText',
                'To maintain genuine reflections on your complete retreat experience, stay reviews and ratings can only be submitted after your resort departure and villa handover have been completed.'
              )}
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-3)' }}>
              <Link to="/customer/folio" className="hsw-btn hsw-btn-secondary" id="btn-guard-folio">
                <Receipt size={16} />
                <span>{t('review.guardBtnFolio', 'View Stay Folio')}</span>
              </Link>
              <Link to="/customer/dashboard" className="hsw-btn hsw-btn-retreat-primary" id="btn-guard-dashboard">
                <Home size={16} />
                <span>{t('review.guardBtnDashboard', 'Return to Dashboard')}</span>
              </Link>
            </div>
          </div>
        </Container>
      </div>
    );
  }

  // ── 2. COMPLETED REVIEW CONFIRMATION (Rule 32) ───────────────────
  if (isSubmitted || existingReview) {
    const displayReview = existingReview || {
      overallRating,
      feedback,
      submittedAt: new Date().toISOString(),
    };

    return (
      <div className="hsw-folio-page">
        <Container size="narrow">
          <div className="hsw-result-card">
            <div className="hsw-result-icon-circle success">
              <CheckCircle2 size={40} />
            </div>

            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-3xl)', fontWeight: 500, marginBottom: 'var(--space-2)' }}>
              {t('review.submittedTitle', 'Thank You for Your Reflections')}
            </h1>

            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', maxWidth: '520px', margin: '0 auto var(--space-6)' }}>
              {t(
                'review.submittedSubtitle',
                'Your wellness feedback has been gracefully received. Your thoughts help our practitioners, therapists, and culinary artisans nurture future guest journeys.'
              )}
            </p>

            <div
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-5)',
                textAlign: 'left',
                marginBottom: 'var(--space-6)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  {t('review.stayExperience', 'Overall Sanctuary Rating')}
                </span>
                <div style={{ display: 'flex', gap: '3px', color: '#f59e0b' }}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      size={18}
                      fill={s <= displayReview.overallRating ? '#f59e0b' : 'none'}
                    />
                  ))}
                </div>
              </div>

              {displayReview.feedback && (
                <div style={{ fontStyle: 'italic', fontSize: 'var(--text-sm)', color: 'var(--text-primary)', borderLeft: '3px solid var(--accent-forest)', paddingLeft: 'var(--space-3)', marginTop: 'var(--space-3)' }}>
                  "{displayReview.feedback}"
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-3)' }}>
              <Link to="/customer/folio" className="hsw-btn hsw-btn-secondary" id="btn-review-done-folio">
                <Receipt size={16} />
                <span>{t('review.viewFinalFolio', 'View Settled Folio')}</span>
              </Link>
              <Link to="/customer/dashboard" className="hsw-btn hsw-btn-retreat-primary" id="btn-review-done-home">
                <Home size={16} />
                <span>{t('review.returnHome', 'Return to HeavenStay')}</span>
              </Link>
            </div>
          </div>
        </Container>
      </div>
    );
  }

  // ── 3. POST-CHECKOUT REVIEW FORM ──────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      // Backend submission
      try {
        await billingApi.submitReview({
          retreatBookingId: Number(bookingId) || 1,
          overallRating,
          roomRating: villaRating,
          spaRating: spaRating,
          diningRating: diningRating,
          comments: feedback,
        });
      } catch (err: any) {
        if (err?.code === 'DUPLICATE_REVIEW') {
          setErrorMsg('A review has already been submitted for this stay.');
          setIsSubmitting(false);
          return;
        }
      }

      // Context sync
      const result = submitReview(targetBookingRef, {
        bookingReference: targetBookingRef,
        customerId: profile.id,
        customerName: profile.fullName,
        overallRating,
        feedback,
      });

      if (result.success) {
        setIsSubmitted(true);
      } else {
        setErrorMsg(result.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="hsw-folio-page">
      <Container size="narrow">
        <div className="hsw-payment-container">
          <Link
            to="/customer/folio"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              color: 'var(--text-secondary)',
              fontSize: 'var(--text-sm)',
              marginBottom: 'var(--space-4)',
              textDecoration: 'none',
            }}
          >
            <ArrowLeft size={16} />
            <span>{t('review.backToFolio', 'Back to Folio')}</span>
          </Link>

          <div className="hsw-payment-card">
            {/* Header */}
            <div
              style={{
                padding: 'var(--space-6) var(--space-8)',
                borderBottom: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--bg-surface)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <Sparkles size={22} style={{ color: 'var(--accent-sand)' }} />
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)', fontWeight: 500 }}>
                  {t('review.pageTitle', 'Reflections & Stay Feedback')}
                </h1>
              </div>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                {t(
                  'review.pageSubtitle',
                  'Share your experience of quiet luxury, holistic healing, and nourishment at HeavenStay.'
                )}
              </p>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: 'var(--space-6) var(--space-8)' }}>
              {/* Stay Reference */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: 'var(--space-3) var(--space-4)',
                  backgroundColor: '#fbfbfa',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: 'var(--space-6)',
                  fontSize: 'var(--text-xs)',
                  color: 'var(--text-secondary)',
                }}
              >
                <span>{t('review.bookingRef', 'Completed Stay')}: <strong style={{ color: 'var(--text-primary)' }}>{targetBookingRef}</strong></span>
                <span>{t('review.sanctuaryVilla', 'Sanctuary Villa')}: <strong style={{ color: 'var(--text-primary)' }}>{folioData.villaCode}</strong></span>
              </div>

              {/* Overall Star Rating */}
              <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)', padding: 'var(--space-4)', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-md)' }}>
                <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 'var(--space-3)' }}>
                  {t('review.overallLabel', 'Overall Sanctuary Stay Experience')}
                </label>
                <div className="hsw-rating-stars" role="radiogroup" aria-label="Overall Rating">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className={`hsw-rating-star-btn ${star <= (hoverRating || overallRating) ? 'active' : ''}`}
                      onClick={() => setOverallRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(null)}
                      aria-label={`${star} of 5 stars`}
                      id={`star-${star}`}
                    >
                      <Star size={30} fill={star <= (hoverRating || overallRating) ? '#f59e0b' : 'none'} />
                    </button>
                  ))}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: 'var(--space-2)' }}>
                  {overallRating === 5 && t('review.rating5', 'Exceptional Sanctuary Experience')}
                  {overallRating === 4 && t('review.rating4', 'Very Relaxing & Nurturing')}
                  {overallRating === 3 && t('review.rating3', 'Pleasant Stay')}
                  {overallRating <= 2 && t('review.ratingLow', 'Constructive Observations')}
                </div>
              </div>

              {/* Category Ratings */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: 'var(--space-6)' }}>
                {/* Villa Rating */}
                <div style={{ padding: '10px', backgroundColor: '#fcfcfc', border: '1px solid #f0f0f0', borderRadius: '8px', textAlign: 'center' }}>
                  <Home size={16} style={{ color: 'var(--accent-forest)', marginBottom: '4px' }} />
                  <div style={{ fontSize: '11px', fontWeight: 600, marginBottom: '6px' }}>Sanctuary Villa</div>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '2px' }}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        size={14}
                        fill={s <= villaRating ? '#f59e0b' : 'none'}
                        color="#f59e0b"
                        style={{ cursor: 'pointer' }}
                        onClick={() => setVillaRating(s)}
                      />
                    ))}
                  </div>
                </div>

                {/* Spa Rating */}
                <div style={{ padding: '10px', backgroundColor: '#fcfcfc', border: '1px solid #f0f0f0', borderRadius: '8px', textAlign: 'center' }}>
                  <HeartHandshake size={16} style={{ color: 'var(--accent-forest)', marginBottom: '4px' }} />
                  <div style={{ fontSize: '11px', fontWeight: 600, marginBottom: '6px' }}>Holistic Spa</div>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '2px' }}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        size={14}
                        fill={s <= spaRating ? '#f59e0b' : 'none'}
                        color="#f59e0b"
                        style={{ cursor: 'pointer' }}
                        onClick={() => setSpaRating(s)}
                      />
                    ))}
                  </div>
                </div>

                {/* Dining Rating */}
                <div style={{ padding: '10px', backgroundColor: '#fcfcfc', border: '1px solid #f0f0f0', borderRadius: '8px', textAlign: 'center' }}>
                  <Coffee size={16} style={{ color: 'var(--accent-forest)', marginBottom: '4px' }} />
                  <div style={{ fontSize: '11px', fontWeight: 600, marginBottom: '6px' }}>Nourishing Dining</div>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '2px' }}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        size={14}
                        fill={s <= diningRating ? '#f59e0b' : 'none'}
                        color="#f59e0b"
                        style={{ cursor: 'pointer' }}
                        onClick={() => setDiningRating(s)}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Written reflections with character counter */}
              <div style={{ marginBottom: 'var(--space-6)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label
                    htmlFor="txt-feedback"
                    style={{ fontSize: 'var(--text-xs)', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-secondary)' }}
                  >
                    {t('review.writtenLabel', 'Written Reflections (Optional)')}
                  </label>
                  <span style={{ fontSize: '11px', color: feedback.length > 1900 ? '#dc2626' : 'var(--text-muted)' }}>
                    {feedback.length} / 2,000 characters
                  </span>
                </div>
                <textarea
                  id="txt-feedback"
                  rows={4}
                  maxLength={2000}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder={t(
                    'review.writtenPlaceholder',
                    'Describe your healing journey, favorite therapy moments, or culinary experiences...'
                  )}
                  style={{
                    width: '100%',
                    padding: 'var(--space-3) var(--space-4)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                    fontFamily: 'var(--font-ui)',
                    fontSize: 'var(--text-sm)',
                    lineHeight: 1.5,
                    resize: 'vertical',
                  }}
                />
              </div>

              {errorMsg && (
                <div style={{ padding: 'var(--space-3)', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: '4px', fontSize: '13px', marginBottom: 'var(--space-4)' }}>
                  {errorMsg}
                </div>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <button
                  type="submit"
                  className="hsw-btn hsw-btn-retreat-primary"
                  disabled={isSubmitting}
                  style={{ width: '100%', justifyContent: 'center' }}
                  id="btn-submit-review"
                >
                  {isSubmitting ? <RotateCw size={16} className="animate-spin" /> : <Send size={16} />}
                  <span>{isSubmitting ? 'Submitting Reflections...' : t('review.btnSubmit', 'Submit Reflections')}</span>
                </button>

                <button
                  type="button"
                  className="hsw-btn hsw-btn-secondary"
                  onClick={() => navigate('/customer/dashboard')}
                  style={{ width: '100%', justifyContent: 'center' }}
                  id="btn-skip-review"
                >
                  <span>{t('review.btnSkip', 'Skip for Now')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default ReviewRatingPage;
