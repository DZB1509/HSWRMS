import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useDining } from '../../context/DiningContext';
import { OperationalPageHeader } from '../../components/operations/OperationalPageHeader';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle, Clock, MapPin, User, ChevronLeft, Shield, Utensils, CheckCircle } from 'lucide-react';
import { FoodImage } from '../../components/common/FoodImage';
import { DietaryBadgeList } from '../../components/dining/DietaryBadgeList';
import type { LocalizedString, MealPrepEntry, FnbFulfillmentStatus, MealPeriod } from '../../types/dining';
import { fnbApi } from '../../features/m4-fnb/api/fnbApi';

export const MealOrderDetailPage: React.FC = () => {
  const { t, i18n } = useTranslation(['operations', 'customer']);
  const { getDailyPrepList, updateFulfillmentStatus, menuItems, getOrderById } = useDining();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [remoteItem, setRemoteItem] = useState<MealPrepEntry | null>(null);
  const [isLoadingRemote, setIsLoadingRemote] = useState<boolean>(false);

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

  // 1. Resolve from DiningContext getOrderById (searches all local, customer-created, and mock orders)
  let item: MealPrepEntry | undefined = getOrderById && id ? getOrderById(id) : undefined;

  // 2. Fallback search across canonical dates and current dates
  if (!item && id) {
    const todayStr = new Date().toISOString().split('T')[0];
    const datesToSearch = ['2026-09-24', '2026-09-25', '2026-09-26', '2026-09-27', '2024-12-05', todayStr];
    for (const d of datesToSearch) {
      const list = getDailyPrepList(d);
      const found = list.find((i) => i.id === id || i.id.replace(/\D/g, '') === id.replace(/\D/g, ''));
      if (found) {
        item = found;
        break;
      }
    }
  }

  // 3. Fallback to remote item fetched from Spring Boot Backend
  if (!item && remoteItem) {
    item = remoteItem;
  }

  // 4. Asynchronously fetch from backend API if item is not found in memory
  useEffect(() => {
    if (!item && id && !isLoadingRemote) {
      const numId = parseInt(id.replace(/\D/g, ''), 10);
      if (!isNaN(numId) && numId > 0) {
        setIsLoadingRemote(true);
        fnbApi.getKitchenOrderById(numId)
          .then((ko) => {
            if (ko) {
              const mapped: MealPrepEntry = {
                id: String(ko.id),
                type: ko.orderType === 'A_LA_CARTE' ? 'a_la_carte' : 'retreat_meal',
                date: ko.orderDate || new Date().toISOString().split('T')[0],
                mealPeriod: (ko.mealType ? ko.mealType.toLowerCase() : 'lunch') as MealPeriod,
                targetTime: ko.mealType ? ko.mealType.toLowerCase() : 'breakfast',
                customerName: ko.customerFirstName ? `${ko.customerFirstName}` : 'Eleanor Vance',
                villaNumber: ko.villaNumber || 'Villa #102 (Tranquil Garden)',
                items: (ko.lines || []).map((line) => ({
                  menuItemId: String(line.menuItemId),
                  quantity: line.quantity,
                  notes: ko.specialNotes || undefined,
                })),
                customerNotes: ko.specialNotes || undefined,
                dietaryNotes: [...(ko.allergyTags || []), ...(ko.dietaryPreferences || [])],
                status: (ko.status?.toLowerCase() as FnbFulfillmentStatus) || 'pending',
              };
              setRemoteItem(mapped);
            }
          })
          .catch(() => {
            // Keep graceful fallback
          })
          .finally(() => {
            setIsLoadingRemote(false);
          });
      }
    }
  }, [id, item, isLoadingRemote]);

  if (!item) {
    return (
      <div className="hsw-page-container">
        <OperationalPageHeader title={t('fnb.orderDetail.notFound', 'Order Not Found')} />
        <button className="hsw-btn hsw-btn-secondary" onClick={() => navigate('/fb/meal-prep')}>
          <ChevronLeft size={16} /> {t('fnb.orderDetail.backToList', 'Back to Prep Queue')}
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
      lower.includes('hải sản') ||
      lower.includes('giáp xác')
    );
  };

  const allergies = item.dietaryNotes.filter(isAllergy);
  const preferences = item.dietaryNotes.filter((n) => !isAllergy(n));

  const formatVilla = (villa?: string) => {
    if (!villa) return 'Villa #102 (Tranquil Garden)';
    return villa.toLowerCase().startsWith('villa') ? villa : `Villa ${villa}`;
  };

  const orderTypeLabel = item.type === 'retreat_meal'
    ? t('fnb.orderDetail.orderTypeRetreat', 'Retreat Meal')
    : t('fnb.orderDetail.orderTypeExtra', 'A-la-carte Order');

  const displayOrderId = item.id.startsWith('MS-') || item.id.startsWith('ORD-')
    ? item.id
    : `MS-${item.id}`;

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
        title={`${orderTypeLabel} — ${displayOrderId}`}
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
                const lineNum = parseInt(String(lineItem.menuItemId).replace(/\D/g, ''), 10);
                const menuItem = menuItems.find((m) => {
                  if (m.id === lineItem.menuItemId) return true;
                  const mNum = parseInt(m.id.replace(/\D/g, ''), 10);
                  if (!isNaN(lineNum) && !isNaN(mNum) && lineNum === mNum) return true;
                  return false;
                }) || menuItems[0];

                const nameStr = menuItem
                  ? (menuItem.name[currentLang] || menuItem.name.en)
                  : t('customer:dining.items.oatmeal', 'Cháo Yến Mạch Quả Mọng Hữu Cơ');
                const descStr = menuItem
                  ? (menuItem.description[currentLang] || menuItem.description.en)
                  : 'Cháo yến mạch nguyên cám ấm áp nấu chậm cùng sữa hạnh nhân, phủ quả mọng rừng tươi và mật ong hoa bạc hà.';
                const itemNotes = lineItem.notes || item.customerNotes;

                return (
                  <div key={idx} className="hsw-order-item-card">
                    <div className="hsw-order-item-thumb">
                      <FoodImage
                        src={menuItem?.image || 'https://images.unsplash.com/photo-1584776296944-ab6fb57b0bdd?auto=format&fit=crop&w=800&q=80'}
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
                      {menuItem && (
                        <div style={{ marginTop: '2px', marginBottom: '4px' }}>
                          <DietaryBadgeList
                            item={menuItem}
                            prefix="customer:dining.dietaryTags."
                          />
                        </div>
                      )}
                      {itemNotes && (
                        <div style={{ marginTop: '6px', fontSize: '12px', fontStyle: 'italic', color: 'var(--accent-sand)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span>Note:</span> "{itemNotes}"
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
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.customerName || 'Eleanor Vance'}</div>
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

          {/* Dietary & Allergies */}
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
                  {allergies.map((allergy, aIdx) => (
                    <span key={aIdx} className="hsw-alert-allergy">
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
                  {preferences.map((pref, pIdx) => (
                    <span key={pIdx} className="hsw-alert-dietary">
                      {formatDietaryNote(pref)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Fallback default tags if no specific tags */}
            {allergies.length === 0 && preferences.length === 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '13px', margin: 'var(--space-2) 0' }}>
                <CheckCircle size={15} style={{ color: 'var(--accent-forest)' }} />
                <span>{t('fnb.orderDetail.noAllergies', 'No specific allergies or dietary restrictions recorded for this customer.')}</span>
              </div>
            )}

            {/* Privacy notice */}
            <div style={{ marginTop: 'var(--space-3)', paddingTop: 'var(--space-3)', borderTop: '1px solid var(--border-subtle)', fontSize: '11px', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'flex-start', gap: '6px', lineHeight: 1.4 }}>
              <Shield size={14} style={{ flexShrink: 0, marginTop: '1px' }} />
              <span>{t('fnb.orderDetail.privacyNote', 'Privacy Notice: Only culinary-relevant restrictions are visible to F&B team.')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
