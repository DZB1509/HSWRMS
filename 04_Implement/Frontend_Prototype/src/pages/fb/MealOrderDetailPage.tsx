import React from 'react';
import { useTranslation } from 'react-i18next';
import { useDining } from '../../context/DiningContext';
import { OperationalPageHeader } from '../../components/operations/OperationalPageHeader';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle, Clock, MapPin, User, ChevronLeft, Shield, Utensils, CheckCircle } from 'lucide-react';
import { FoodImage } from '../../components/common/FoodImage';
import type { LocalizedString } from '../../types/dining';

export const MealOrderDetailPage: React.FC = () => {
  const { t, i18n } = useTranslation(['operations', 'customer']);
  const { getDailyPrepList, updateFulfillmentStatus, menuItems } = useDining();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const formatDietaryNote = (note: string) => {
    const normalized = note.toLowerCase().replace(/[\s-]+/g, '_');
    return t(`customer:dining.dietary.${normalized}`, t(`customer:dining.dietaryTags.${normalized}`, note));
  };

  const formatAllergyNote = (note: string) => {
    const normalized = note.toLowerCase().replace(/[\s-&]+/g, '_');
    return t(`customer:dining.allergies.${normalized}`, note);
  };

  const currentLang = (i18n.language?.startsWith('vi') ? 'vi' :
    i18n.language?.startsWith('zh') ? 'zh' :
    i18n.language?.startsWith('ja') ? 'ja' :
    i18n.language?.startsWith('fr') ? 'fr' : 'en') as keyof LocalizedString;

  // Search canonical dates to find the prep item
  const datesToSearch = ['2026-09-24', '2026-09-25', '2026-09-26', '2026-09-27', '2024-12-05'];
  let item = undefined;
  for (const d of datesToSearch) {
    const list = getDailyPrepList(d);
    const found = list.find((i) => i.id === id);
    if (found) {
      item = found;
      break;
    }
  }

  if (!item) {
    return (
      <div className="hsw-page-container">
        <OperationalPageHeader title={t('fnb.orderDetail.notFound', 'Order Not Found')} />
        <button className="hsw-btn hsw-btn-secondary" onClick={() => navigate('/fb/meal-prep')}>
          <ChevronLeft size={16} /> {t('fnb.orderDetail.backToList', 'Back to Queue')}
        </button>
      </div>
    );
  }

  const handleStatusChange = (newStatus: 'pending' | 'preparing' | 'ready' | 'delivered') => {
    updateFulfillmentStatus(item!.id, item!.type, newStatus);
  };

  const isAllergy = (note: string) => {
    const lower = note.toLowerCase();
    return (
      lower.includes('peanut') ||
      lower.includes('shellfish') ||
      lower.includes('crustacean') ||
      lower.includes('nut') ||
      lower.includes('allergy') ||
      lower.includes('allergic') ||
      lower.includes('dị ứng') ||
      lower.includes('đậu phộng') ||
      lower.includes('hải sản')
    );
  };

  const allergies = item.dietaryNotes.filter(isAllergy);
  const preferences = item.dietaryNotes.filter((n) => !isAllergy(n));

  const formatVilla = (villa?: string) => {
    if (!villa) return '—';
    return villa.toLowerCase().startsWith('villa') ? villa : `Villa ${villa}`;
  };

  const orderTypeLabel = item.type === 'retreat_meal'
    ? t('fnb.orderDetail.orderTypeRetreat', 'Retreat Meal')
    : t('fnb.orderDetail.orderTypeExtra', 'A-la-carte Order');

  return (
    <div className="hsw-page-container">
      <div style={{ marginBottom: 'var(--space-4)' }}>
        <button
          className="hsw-btn hsw-btn-secondary"
          style={{ background: 'transparent', border: 'none', padding: 0, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          onClick={() => navigate('/fb/meal-prep')}
        >
          <ChevronLeft size={16} /> {t('fnb.orderDetail.backToList', 'Back to Prep Queue')}
        </button>
      </div>

      <OperationalPageHeader
        title={`${orderTypeLabel} — ${item.id}`}
        subtitle={t('fnb.orderDetail.subtitle', 'Fulfillment details and dietary requirements.')}
        actions={
          <div className="hsw-order-status-badge-container">
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
              {t('fnb.orderDetail.statusLabel', 'Status')}:
            </span>
            <select
              className={`hsw-status-select hsw-status-${item.status}`}
              value={item.status}
              onChange={(e) => handleStatusChange(e.target.value as any)}
            >
              <option value="pending">{t('fnb.prepList.statusPending', 'PENDING')}</option>
              <option value="preparing">{t('fnb.prepList.statusPreparing', 'PREPARING')}</option>
              <option value="ready">{t('fnb.prepList.statusReady', 'READY')}</option>
              <option value="delivered">{t('fnb.prepList.statusDelivered', 'DELIVERED')}</option>
            </select>
          </div>
        }
      />

      <div className="hsw-order-detail-layout">
        {/* Main Column: Items & Notes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div className="hsw-card ops-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 'var(--space-2)' }}>
              <h3 style={{ fontSize: 'var(--text-lg)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Utensils size={18} style={{ color: 'var(--accent-forest)' }} />
                {t('fnb.orderDetail.orderItems', 'Order Items')}
              </h3>
              <span className="hsw-tag-item" style={{ background: 'var(--bg-secondary)', fontWeight: 600 }}>
                {item.items.reduce((acc, curr) => acc + curr.quantity, 0)} {t('fnb.orderDetail.itemsCount', 'items')}
              </span>
            </div>

            <div className="hsw-order-items-list">
              {item.items.map((lineItem, idx) => {
                const menuItem = menuItems.find((m) => m.id === lineItem.menuItemId);
                if (!menuItem) return null;
                const nameStr = menuItem.name[currentLang] || menuItem.name.en;
                const descStr = menuItem.description[currentLang] || menuItem.description.en;

                return (
                  <div key={idx} className="hsw-order-item-card">
                    <div className="hsw-order-item-thumb">
                      <FoodImage
                        src={menuItem.image}
                        alt={nameStr}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '4px' }}>
                        <h4 style={{ fontSize: 'var(--text-md)', margin: 0, fontWeight: 600 }}>
                          <span style={{ color: 'var(--accent-forest)', marginRight: '6px' }}>{lineItem.quantity}×</span>
                          {nameStr}
                        </h4>
                      </div>
                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 8px 0', lineHeight: 1.4 }}>
                        {descStr}
                      </p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {menuItem.dietaryTags.map((tag: string) => (
                          <span key={tag} className="hsw-tag-item" style={{ fontSize: '11px' }}>
                            {t(`customer:dining.dietaryTags.${tag}`, t(`customer:dining.dietary.${tag}`, tag.replace(/_/g, ' ')))}
                          </span>
                        ))}
                      </div>
                      {lineItem.notes && (
                        <div style={{ marginTop: '6px', fontSize: '12px', fontStyle: 'italic', color: 'var(--accent-sand)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span>Note:</span> "{lineItem.notes}"
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {item.customerNotes && (
              <div className="hsw-order-notes-callout">
                <h4 style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '6px' }}>
                  {t('fnb.orderDetail.customerNotes', 'Customer Preparation Notes')}
                </h4>
                <p style={{ margin: 0, fontSize: '14px', fontStyle: 'italic', color: 'var(--text-primary)' }}>
                  "{item.customerNotes}"
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Column: Delivery & Dietary Profile */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', position: 'sticky', top: '16px' }}>
          {/* Delivery Information */}
          <div className="hsw-card ops-card">
            <h3 style={{ fontSize: 'var(--text-md)', marginBottom: 'var(--space-3)', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px', fontWeight: 600 }}>
              {t('fnb.orderDetail.deliveryInfo', 'Delivery Information')}
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <User size={16} style={{ color: 'var(--accent-forest)', marginTop: '2px', flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{t('fnb.orderDetail.customerName', 'Customer Name')}</div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.customerName}</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <MapPin size={16} style={{ color: 'var(--accent-forest)', marginTop: '2px', flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{t('fnb.orderDetail.location', 'Location')}</div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{formatVilla(item.villaNumber)}</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <Clock size={16} style={{ color: 'var(--accent-forest)', marginTop: '2px', flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{t('fnb.orderDetail.targetTime', 'Target Time')}</div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.targetTime || item.mealPeriod}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Dietary & Allergies (Separated Semantics) */}
          <div className="hsw-card ops-card">
            <h3 style={{ fontSize: 'var(--text-md)', marginBottom: 'var(--space-3)', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px', fontWeight: 600 }}>
              {t('fnb.orderDetail.dietaryProfile', 'Dietary & Allergies')}
            </h3>

            {/* Critical Allergies */}
            {allergies.length > 0 && (
              <div style={{ marginBottom: 'var(--space-3)', padding: 'var(--space-2) var(--space-3)', background: '#fdf0ef', border: '1px solid #f5c2be', borderRadius: 'var(--radius-xs)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--danger)', fontWeight: 600, fontSize: '12px', marginBottom: '6px' }}>
                  <AlertTriangle size={15} />
                  <span>{t('fnb.orderDetail.allergiesTitle', 'Allergies & High Attention')}</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {allergies.map((allergy, idx) => (
                    <span key={idx} className="hsw-alert-allergy">
                      <AlertTriangle size={11} />
                      {formatAllergyNote(allergy)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Dietary Preferences / Restrictions */}
            {preferences.length > 0 && (
              <div style={{ marginBottom: 'var(--space-3)' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  {t('fnb.orderDetail.dietaryPreferencesTitle', 'Dietary Preferences')}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {preferences.map((pref, idx) => (
                    <span key={idx} className="hsw-alert-dietary">
                      {formatDietaryNote(pref)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* No restrictions */}
            {allergies.length === 0 && preferences.length === 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '13px', margin: 'var(--space-2) 0' }}>
                <CheckCircle size={15} style={{ color: 'var(--accent-forest)' }} />
                <span>{t('fnb.orderDetail.noAllergies', 'No specific allergies or dietary restrictions recorded for this customer.')}</span>
              </div>
            )}

            {/* Privacy notice */}
            <div style={{ marginTop: 'var(--space-3)', paddingTop: 'var(--space-3)', borderTop: '1px solid var(--border-subtle)', fontSize: '11px', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'flex-start', gap: '6px', lineHeight: 1.4 }}>
              <Shield size={14} style={{ flexShrink: 0, marginTop: '1px' }} />
              <span>{t('fnb.orderDetail.privacyNote', 'Privacy Notice: Only culinary-relevant restrictions are shown. Medical details are restricted.')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
