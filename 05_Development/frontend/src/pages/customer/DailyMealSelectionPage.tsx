import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useDining } from '../../context/DiningContext';
import { useCustomer } from '../../context/CustomerContext';
import { isItemDietaryCompatible } from '../../utils/dietaryFilter';
import type { MealPeriod, LocalizedString, DietaryMenuItem } from '../../types/dining';
import {
  AlertCircle,
  CheckCircle2,
  Info,
  Calendar,
  Clock,
  Sun,
  Moon,
  Coffee,
  ShieldCheck,
  Sparkles,
  Utensils,
  Leaf
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../app/providers/AuthProvider';
import { FoodImage } from '../../components/common/FoodImage';
import { DietaryBadgeList } from '../../components/dining/DietaryBadgeList';
import { AmanoiDiningLocationPicker } from '../../components/dining/DiningLocationPicker';
import {
  parseDiningNotes,
  buildAmanoiDiningNotes,
  type DiningServiceLocation,
} from '../../utils/diningServiceHelper';

export interface RetreatPackageCulinaryMeta {
  code: string;
  name: string;
  goal: string;
  durationNights: number;
  regimen: string;
  targetCalories: string;
  itemIds: number[];
}

export const RETREAT_PACKAGES_METADATA: Record<string, RetreatPackageCulinaryMeta> = {
  'RET-DETOX-03': {
    code: 'RET-DETOX-03',
    name: '3D2N Thải Độc & Thanh Lọc Tinh Khiết (Pure Detox)',
    goal: 'Detox & Purification',
    durationNights: 2,
    regimen: 'Thực đơn Detox thanh lọc, nước ép lạnh hữu cơ, không đường & không chất béo bão hòa',
    targetCalories: '1.200 - 1.400 kcal/ngày',
    itemIds: [96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 3, 4, 6, 7, 8, 9, 10, 11, 12],
  },
  'RET-DETOX-05': {
    code: 'RET-DETOX-05',
    name: '5D4N Tái Tạo Năng Lượng & Thải Độc Chuyên Sâu (Deep Detox & Reset)',
    goal: 'Deep Detoxification',
    durationNights: 4,
    regimen: 'Liệu trình ăn kiêng gián đoạn / Plant-based chuyên sâu, trà thảo mộc đào thải kim loại nặng',
    targetCalories: '1.300 - 1.500 kcal/ngày',
    itemIds: [106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 3, 4, 6, 7, 8, 9, 10, 11, 12],
  },
  'RET-SLEEP-03': {
    code: 'RET-SLEEP-03',
    name: '3D2N Khôi Phục Giấc Ngủ Sâu (Holistic Deep Sleep)',
    goal: 'Sleep Improvement',
    durationNights: 2,
    regimen: 'Thực đơn tăng sinh Melatonin tự nhiên: hạt sen, cá ngừ, hạnh nhân, trà hoa cúc buổi tối',
    targetCalories: '1.500 - 1.700 kcal/ngày',
    itemIds: [126, 127, 128, 129, 130, 131, 132, 133, 134, 135, 141, 5, 8],
  },
  'RET-STRESS-04': {
    code: 'RET-STRESS-04',
    name: '4D3N Chữa Lành Thân - Tâm & Buông Thư (Mind-Body Harmony)',
    goal: 'Stress Reduction',
    durationNights: 3,
    regimen: 'Thực đơn dưỡng tâm bổ khí, cân bằng năng lượng Âm - Dương, đồ uống thảo dược phục hồi',
    targetCalories: '1.600 - 1.800 kcal/ngày',
    itemIds: [142, 143, 144, 145, 146, 147, 148, 149, 150, 151, 152, 1, 6],
  },
  'RET-AGING-04': {
    code: 'RET-AGING-04',
    name: '4D3N Trẻ Hóa Tế Bào & Sắc Diện Hoàng Gia (Longevity & Radiance)',
    goal: 'Anti-Aging & Cellular Care',
    durationNights: 3,
    regimen: 'Thực đơn giàu Collagen, chất chống oxy hóa cao (Antioxidants), các loại quả mọng và Superfoods',
    targetCalories: '1.500 - 1.700 kcal/ngày',
    itemIds: [153, 154, 155, 156, 157, 158, 159, 160, 1, 5, 9, 12],
  },
  'RET-ALIGN-03': {
    code: 'RET-ALIGN-03',
    name: '3D2N Nắn Chỉnh Cột Sống & Phục Hồi Thể Lực (Spine & Posture Care)',
    goal: 'Physical Therapy & Posture',
    durationNights: 2,
    regimen: 'Thực đơn hỗ trợ xương khớp: bổ sung Canxi hữu cơ, Glucosamine tự nhiên, nước hầm xương hữu cơ',
    targetCalories: '1.600 - 1.800 kcal/ngày',
    itemIds: [161, 162, 163, 164, 2, 7, 10],
  },
  'RET-VITAL-05': {
    code: 'RET-VITAL-05',
    name: '5D4N Tăng Cường Sinh Lực & Quản Lý Vóc Dáng (Vitality & Weight Trim)',
    goal: 'Fitness & Body Shaping',
    durationNights: 4,
    regimen: 'Thực đơn Macro-balanced chuẩn Calories deficit nhẹ, đạm thực vật cao cấp, ít muối (Low-sodium)',
    targetCalories: '1.400 - 1.600 kcal/ngày',
    itemIds: [165, 166, 167, 3, 10, 11, 12],
  },
  'RET-MOM-03': {
    code: 'RET-MOM-03',
    name: '3D2N Nghỉ Dưỡng Chữa Lành Mẹ Bầu (Gentle Nurturing Prenatal)',
    goal: 'Maternal Wellness',
    durationNights: 2,
    regimen: 'Thực đơn hữu cơ lành tính, giàu Axit Folic, Sắt, Vitamin tự nhiên theo khuyến nghị dinh dưỡng thai kỳ',
    targetCalories: '2.000 - 2.200 kcal/ngày',
    itemIds: [168, 169, 170, 171, 172, 173, 174, 175, 8, 9],
  },
};

function resolvePackageMeta(bookingName?: string, slug?: string): RetreatPackageCulinaryMeta {
  const text = `${bookingName || ''} ${slug || ''}`.toLowerCase();
  if (text.includes('detox') && (text.includes('05') || text.includes('5d4n') || text.includes('sâu') || text.includes('reset'))) {
    return RETREAT_PACKAGES_METADATA['RET-DETOX-05'];
  }
  if (text.includes('detox')) {
    return RETREAT_PACKAGES_METADATA['RET-DETOX-03'];
  }
  if (text.includes('sleep') || text.includes('ngủ')) {
    return RETREAT_PACKAGES_METADATA['RET-SLEEP-03'];
  }
  if (text.includes('stress') || text.includes('buông thư') || text.includes('harmony') || text.includes('chữa lành thân')) {
    return RETREAT_PACKAGES_METADATA['RET-STRESS-04'];
  }
  if (text.includes('aging') || text.includes('trẻ hóa') || text.includes('radiance') || text.includes('longevity')) {
    return RETREAT_PACKAGES_METADATA['RET-AGING-04'];
  }
  if (text.includes('align') || text.includes('cột sống') || text.includes('posture') || text.includes('spine')) {
    return RETREAT_PACKAGES_METADATA['RET-ALIGN-03'];
  }
  if (text.includes('vital') || text.includes('vóc dáng') || text.includes('slimming') || text.includes('weight')) {
    return RETREAT_PACKAGES_METADATA['RET-VITAL-05'];
  }
  if (text.includes('mom') || text.includes('mẹ bầu') || text.includes('prenatal')) {
    return RETREAT_PACKAGES_METADATA['RET-MOM-03'];
  }
  return RETREAT_PACKAGES_METADATA['RET-DETOX-03'];
}

const DailyMealSelectionPageForIdentity: React.FC = () => {
  const { t, i18n } = useTranslation('customer');
  const { menuItems, saveMealSelection, getMealSelection } = useDining();
  const { activeBooking, wellnessProfile, profile } = useCustomer();
  const navigate = useNavigate();

  const currentLang = (i18n.language || 'en') as keyof LocalizedString;
  const localize = (ls?: LocalizedString | null): string => {
    if (!ls) return '';
    if (typeof ls === 'string') return ls;
    return ls[currentLang] || ls.en || Object.values(ls)[0] || '';
  };

  const dietaryRestrictions = wellnessProfile?.dietaryProfile?.dietaryRestrictions?.length
    ? wellnessProfile.dietaryProfile.dietaryRestrictions
    : [];
  const allergies = wellnessProfile?.dietaryProfile?.allergies?.length
    ? wellnessProfile.dietaryProfile.allergies
    : [];
  const customerId = profile?.id ?? '';

  const [activeDate, setActiveDate] = useState<string>('');
  const [activePeriod, setActivePeriod] = useState<MealPeriod>('breakfast');
  const [filterMode, setFilterMode] = useState<'package' | 'all'>('package');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'starter' | 'main' | 'dessert' | 'beverage'>('all');
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({});
  const [diningLocation, setDiningLocation] = useState<DiningServiceLocation>('DINING_PAVILION');
  const [selectedWellnessTags, setSelectedWellnessTags] = useState<string[]>([]);
  const [customNotes, setCustomNotes] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const todayStr = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, []);

  const retreatMeta = useMemo(() => {
    return resolvePackageMeta(
      typeof activeBooking?.retreatName === 'string' ? activeBooking.retreatName : activeBooking?.retreatName?.vi,
      activeBooking?.retreatSlug
    );
  }, [activeBooking]);

  // Calculate dates based on the guest's booked retreat package, strictly excluding past dates
  const dates = useMemo(() => {
    if (!activeBooking) return [];
    const start = new Date(activeBooking.startDate);
    const end = new Date(activeBooking.endDate);
    const result: string[] = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      if (dateStr >= todayStr) {
        result.push(dateStr);
      }
    }
    if (result.length === 0) {
      const base = new Date();
      for (let i = 0; i < 4; i++) {
        const next = new Date(base);
        next.setDate(base.getDate() + i);
        result.push(next.toISOString().split('T')[0]);
      }
    }
    return result;
  }, [activeBooking, todayStr]);

  // Automatically default to the first available date
  useEffect(() => {
    if (dates.length > 0 && (!activeDate || !dates.includes(activeDate) || activeDate < todayStr)) {
      setActiveDate(dates[0]);
    }
  }, [dates, activeDate, todayStr]);

  useEffect(() => {
    if (activeDate && activeBooking) {
      const existing = getMealSelection(activeBooking.id, activeDate, activePeriod);
      if (existing) {
        const itemMap: Record<string, number> = {};
        if (existing.items && existing.items.length > 0) {
          existing.items.forEach(it => {
            if (it.menuItemId) itemMap[it.menuItemId] = it.quantity || 1;
          });
        } else if (existing.menuItemIds && existing.menuItemIds.length > 0) {
          existing.menuItemIds.forEach(id => {
            itemMap[id] = existing.quantity || 1;
          });
        }
        setSelectedItems(itemMap);
        const parsed = parseDiningNotes(existing.notes);
        setDiningLocation(parsed.location);
        setSelectedWellnessTags(parsed.wellnessTags);
        setCustomNotes(parsed.cleanNotes);
      } else {
        setSelectedItems({});
        setDiningLocation('DINING_PAVILION');
        setSelectedWellnessTags([]);
        setCustomNotes('');
      }
      setSaveSuccess(false);
    }
  }, [activeDate, activePeriod, activeBooking, getMealSelection]);

  // Filter available items: included in package, period matched, dietary compatible
  const availableItems = useMemo(() => {
    return menuItems.filter((item) => {
      // 0. Exclude extra A-la-carte dishes (package daily meals are inclusive)
      if (item.isExtra) return false;

      // 1. Match period
      const matchesPeriod =
        item.mealPeriods.includes(activePeriod) || item.mealPeriods.includes('all_day');
      if (!matchesPeriod) return false;

      // 2. Match package recommendation filter
      if (filterMode === 'package') {
        const numericId = Number(item.backendId ?? item.id);
        const isPackageDish = retreatMeta.itemIds.includes(numericId);
        if (!isPackageDish) return false;
      }

      // 3. Match category filter
      if (categoryFilter !== 'all') {
        const itemCat = String(item.category || '').toLowerCase();
        if (categoryFilter === 'starter' && !itemCat.includes('starter') && !itemCat.includes('soup')) return false;
        if (categoryFilter === 'main' && !itemCat.includes('main')) return false;
        if (categoryFilter === 'dessert' && !itemCat.includes('dessert') && !itemCat.includes('snack')) return false;
        if (categoryFilter === 'beverage' && !itemCat.includes('beverage') && !itemCat.includes('drink')) return false;
      }

      // 4. Dietary compatibility
      return isItemDietaryCompatible(item, dietaryRestrictions, allergies);
    });
  }, [menuItems, activePeriod, filterMode, categoryFilter, retreatMeta, dietaryRestrictions, allergies]);

  const hasAllergyWarning = (item: DietaryMenuItem) => {
    return (item.allergenTags || []).some((tag: string) => allergies.includes(tag.toLowerCase()));
  };

  const handleToggleTag = (tag: string) => {
    setSelectedWellnessTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const selectedEntries = Object.entries(selectedItems).filter(([_, qty]) => qty > 0);

  const handleSave = async () => {
    if (!activeBooking || selectedEntries.length === 0 || isSaving) return;
    setSaveError(null);
    setIsSaving(true);
    const finalNotes = buildAmanoiDiningNotes(
      diningLocation,
      selectedWellnessTags,
      customNotes,
      activeBooking.villaNumber
    );

    const items = selectedEntries.map(([mId, qty]) => ({
      menuItemId: mId,
      quantity: qty,
      notes: finalNotes,
    }));
    const menuItemIds = selectedEntries.map(([mId]) => mId);
    const totalPortions = selectedEntries.reduce((sum, [_, qty]) => sum + qty, 0);

    try {
      await saveMealSelection({
        bookingId: activeBooking.id,
        customerId,
        date: activeDate,
        mealPeriod: activePeriod,
        menuItemIds,
        quantity: totalPortions,
        items,
        notes: finalNotes,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'The server did not confirm the meal selection.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!activeBooking) {
    return (
      <div className="hsw-dining-container">
        <div
          style={{
            textAlign: 'center',
            padding: 'var(--space-12) var(--space-6)',
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            maxWidth: '540px',
            margin: 'var(--space-8) auto',
          }}
        >
          <Info size={36} style={{ color: 'var(--text-tertiary)', margin: '0 auto var(--space-3)' }} />
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)', marginBottom: 'var(--space-2)' }}>
            {t('dining.select.noBooking', 'No Active Retreat')}
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-4)' }}>
            {t('dining.select.noBookingDesc', 'You need an active retreat booking to select daily meals.')}
          </p>
          <button
            type="button"
            className="hsw-btn hsw-btn-primary"
            onClick={() => navigate('/customer/bookings')}
          >
            {t('dining.select.viewBookings', 'Return to My Bookings')}
          </button>
        </div>
      </div>
    );
  }

  const periodIcons: Record<string, React.ReactNode> = {
    breakfast: <Coffee size={16} />,
    lunch: <Sun size={16} />,
    dinner: <Moon size={16} />,
  };

  return (
    <div className="hsw-dining-container" id="screen-35-daily-meal-selection">
      {/* Page Header */}
      <div className="hsw-dining-header">
        <h1 className="hsw-dining-title">{t('dining.select.title', 'Daily Meal Selection')}</h1>
        <p className="hsw-dining-subtitle">
          {t('dining.select.subtitle', 'Plan your included retreat meals. Chef selections adapt to your wellness profile.')}
        </p>
      </div>

      {/* Hero Package Banner: Synced from Retreat Catalog (Excel Specification) */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(46, 90, 54, 0.08) 0%, rgba(200, 160, 100, 0.08) 100%)',
          border: '1px solid rgba(46, 90, 54, 0.22)',
          borderRadius: 'var(--radius-md, 8px)',
          padding: '16px 20px',
          marginBottom: 'var(--space-6, 24px)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
        }}
        id="synced-retreat-package-card"
      >
        <div style={{ flex: '1 1 320px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                padding: '2px 8px',
                borderRadius: 'var(--radius-pill)',
                backgroundColor: 'var(--accent-forest, #2e5a36)',
                color: '#fff',
              }}
            >
              {retreatMeta.code}
            </span>
            <span
              style={{
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--accent-olive, #5c6f50)',
              }}
            >
              🎯 {retreatMeta.goal} · {retreatMeta.durationNights} Đêm
            </span>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: 'var(--radius-pill)',
                backgroundColor: 'rgba(46, 125, 50, 0.12)',
                color: 'var(--accent-forest, #2e7d32)',
              }}
            >
              ✓ 100% Đã Bao Gồm Trong Gói (0đ)
            </span>
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', margin: '0 0 6px 0', color: 'var(--text-primary)' }}>
            {retreatMeta.name}
          </h2>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
            <strong>Chế độ dinh dưỡng F&B:</strong> {retreatMeta.regimen} ({retreatMeta.targetCalories})
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            className={`hsw-btn hsw-btn-sm ${filterMode === 'package' ? 'hsw-btn-primary' : 'hsw-btn-secondary'}`}
            onClick={() => setFilterMode('package')}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Sparkles size={14} />
            <span>Thực Đơn Gợi Ý Theo Gói</span>
          </button>
          <button
            type="button"
            className={`hsw-btn hsw-btn-sm ${filterMode === 'all' ? 'hsw-btn-primary' : 'hsw-btn-secondary'}`}
            onClick={() => setFilterMode('all')}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Utensils size={14} />
            <span>Toàn Bộ 95 Món Dưỡng Sinh</span>
          </button>
        </div>
      </div>

      {/* Main 2-Column Planning Layout */}
      <div className="hsw-meal-select-layout">
        {/* Left Sticky Planning Rail */}
        <aside className="hsw-planning-rail" aria-label="Meal planning controls">
          {/* Villa & Guest Summary */}
          <div
            style={{
              padding: '10px 12px',
              backgroundColor: 'var(--bg-soft)',
              borderRadius: 'var(--radius-sm)',
              marginBottom: 'var(--space-3)',
              borderLeft: '3px solid var(--accent-forest)',
            }}
          >
            <div
              style={{
                fontSize: '10px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: 'var(--accent-olive)',
                marginBottom: '2px',
              }}
            >
              {t('dining.select.retreatPackage', 'Retreat Stay')}
            </div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3 }}>
              {localize(activeBooking.retreatName)}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
              {activeBooking.villaNumber ? `Biệt Thự ${activeBooking.villaNumber}` : 'Standard Villa'} · {dates[0]} → {dates[dates.length - 1]}
            </div>
          </div>

          {/* Date Selector */}
          <div style={{ marginBottom: 'var(--space-4)' }}>
            <h3 className="hsw-rail-section-title">
              <Calendar size={13} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'text-bottom' }} />
              {t('dining.select.selectDate', 'Retreat Days')}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {dates.map((d, index) => {
                const dateObj = new Date(d);
                const isSelected = activeDate === d;
                const isToday = d === todayStr;
                const formattedDate = dateObj.toLocaleDateString(i18n.language || 'vi', {
                  weekday: 'short',
                  month: 'numeric',
                  day: 'numeric',
                });
                return (
                  <button
                    key={d}
                    type="button"
                    className={`hsw-date-pill-btn ${isSelected ? 'active' : ''}`}
                    onClick={() => setActiveDate(d)}
                    style={{
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      position: 'relative',
                    }}
                    id={`btn-date-${d}`}
                    title={formattedDate}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                      <span style={{ fontWeight: 600 }}>Ngày {index + 1}</span>
                      {isToday && (
                        <span
                          style={{
                            fontSize: '9px',
                            fontWeight: 700,
                            padding: '1px 5px',
                            borderRadius: 'var(--radius-pill)',
                            backgroundColor: 'rgba(46, 90, 54, 0.12)',
                            color: 'var(--accent-forest, #2e5a36)',
                          }}
                        >
                          {t('labels.today', 'Hôm nay')}
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: '11px', opacity: 0.85 }}>{formattedDate}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Meal Period Selector */}
          <div style={{ marginBottom: 'var(--space-4)' }}>
            <h3 className="hsw-rail-section-title">
              <Clock size={13} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'text-bottom' }} />
              {t('dining.select.selectPeriod', 'Meal Period')}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {(['breakfast', 'lunch', 'dinner'] as MealPeriod[]).map((period) => (
                <button
                  key={period}
                  type="button"
                  className={`hsw-period-pill-btn ${activePeriod === period ? 'active' : ''}`}
                  onClick={() => setActivePeriod(period)}
                  id={`btn-period-${period}`}
                >
                  {periodIcons[period]}
                  <span>{t(`dining.periods.${period}`, period.charAt(0).toUpperCase() + period.slice(1))}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Category Quick Filter */}
          <div>
            <h3 className="hsw-rail-section-title">
              <Leaf size={13} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'text-bottom' }} />
              Phân Loại Món
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {[
                { id: 'all', label: 'Tất cả phân loại' },
                { id: 'main', label: 'Món chính dưỡng sinh' },
                { id: 'starter', label: 'Khai vị & Canh tiềm' },
                { id: 'dessert', label: 'Tráng miệng & Chè thảo mộc' },
                { id: 'beverage', label: 'Nước ép & Trà thanh lọc' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategoryFilter(cat.id as any)}
                  style={{
                    padding: '6px 10px',
                    fontSize: '11px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid',
                    borderColor: categoryFilter === cat.id ? 'var(--accent-forest)' : 'var(--border-subtle)',
                    backgroundColor: categoryFilter === cat.id ? 'rgba(46, 90, 54, 0.08)' : 'transparent',
                    color: categoryFilter === cat.id ? 'var(--accent-forest)' : 'var(--text-secondary)',
                    fontWeight: categoryFilter === cat.id ? 700 : 500,
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Right Workspace: Meal Cards & Notes */}
        <div>
          {/* Active Period Workspace Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 'var(--space-4)',
              borderBottom: '1px solid var(--border-subtle)',
              paddingBottom: 'var(--space-3)',
              flexWrap: 'wrap',
              gap: 'var(--space-2)',
            }}
          >
            <div>
              <span
                style={{
                  fontFamily: 'var(--font-ui)',
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--accent-olive)',
                }}
              >
                {t(`dining.periods.${activePeriod}`, activePeriod.toUpperCase())} · {filterMode === 'package' ? `Khuyên dùng cho ${retreatMeta.code}` : 'Toàn bộ danh mục'}
              </span>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)', margin: '2px 0 0 0' }}>
                {activeDate
                  ? new Date(activeDate).toLocaleDateString(i18n.language || 'vi', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                    })
                  : ''}
              </h2>
            </div>
            <button
              type="button"
              className="hsw-btn hsw-btn-secondary"
              onClick={() => navigate('/customer/dining/orders')}
            >
              {t('dining.select.viewPlan', 'View My Plan')}
            </button>
          </div>

          {/* Dietary Safeguard Notice */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              backgroundColor: 'rgba(46, 125, 50, 0.08)',
              border: '1px solid rgba(46, 125, 50, 0.25)',
              borderRadius: 'var(--radius-sm)',
              padding: '10px 14px',
              marginBottom: 'var(--space-4)',
              fontSize: '12px',
              color: 'var(--text-primary)',
            }}
          >
            <ShieldCheck size={18} style={{ color: '#2e7d32', flexShrink: 0 }} />
            <div>
              <span style={{ fontWeight: 600 }}>
                {t('dining.select.safeguardTitle', 'Tự động lọc theo hồ sơ dưỡng sinh')}:
              </span>{' '}
              <span style={{ color: 'var(--accent-forest, #2e7d32)' }}>
                {dietaryRestrictions.join(', ') || 'Chế độ tiêu chuẩn gói'}
              </span>
              {allergies.length > 0 && (
                <span style={{ color: 'var(--text-danger, #d32f2f)', marginLeft: '6px' }}>
                  (Dị ứng: {allergies.join(', ')})
                </span>
              )}
              . Món ăn hiển thị đã được kiểm định an toàn và hỗ trợ mục tiêu {retreatMeta.goal}.
            </div>
          </div>

          {availableItems.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: 'var(--space-8)',
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              <Info size={32} style={{ color: 'var(--text-tertiary)', margin: '0 auto var(--space-3)' }} />
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-lg)', marginBottom: 'var(--space-2)' }}>
                {t('dining.select.noOptions', 'Chưa có món phù hợp với bộ lọc này')}
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginBottom: '12px' }}>
                Quý khách có thể chuyển sang chế độ "Toàn Bộ 95 Món Dưỡng Sinh" hoặc đổi phân loại món để chọn thêm.
              </p>
              <button
                type="button"
                className="hsw-btn hsw-btn-secondary hsw-btn-sm"
                onClick={() => { setFilterMode('all'); setCategoryFilter('all'); }}
              >
                Hiển Thị Toàn Bộ Thực Đơn
              </button>
            </div>
          ) : (
            <>
              {/* Meal Options Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: 'var(--space-4)',
                  marginBottom: 'var(--space-6)',
                }}
              >
                {availableItems.map((item) => {
                  const isSelected = Boolean(selectedItems[item.id]);
                  const itemPortion = selectedItems[item.id] || 1;
                  const warning = hasAllergyWarning(item);
                  const localizedName = localize(item.name);
                  const localizedDesc = localize(item.description);
                  const servingsLeft = item.availableServings ?? 50;
                  const isAvailable = item.available !== false && servingsLeft > 0;

                  const toggleSelection = () => {
                    if (!isAvailable) return;
                    setSelectedItems((prev) => {
                      const next = { ...prev };
                      if (next[item.id]) {
                        delete next[item.id];
                      } else {
                        next[item.id] = 1;
                      }
                      return next;
                    });
                  };

                  return (
                    <div
                      key={item.id}
                      className={`hsw-culinary-card hsw-selectable-meal-card ${isSelected ? 'is-selected' : ''} ${!isAvailable ? 'is-unavailable' : ''}`}
                      style={{
                        opacity: isAvailable ? 1 : 0.62,
                        cursor: isAvailable ? 'pointer' : 'not-allowed',
                        position: 'relative',
                        border: isSelected ? '2px solid var(--accent-forest)' : undefined,
                      }}
                      onClick={toggleSelection}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          toggleSelection();
                        }
                      }}
                      tabIndex={isAvailable ? 0 : -1}
                      role="checkbox"
                      aria-checked={isSelected}
                      aria-disabled={!isAvailable}
                      id={`select-card-${item.id}`}
                    >
                      <div style={{ position: 'relative' }}>
                        <FoodImage src={item.image} alt={localizedName} aspectRatio="16 / 10" />
                        {isSelected && (
                          <div className="hsw-selected-badge" title="Selected">
                            <CheckCircle2 size={18} />
                          </div>
                        )}
                      </div>

                      <div className="hsw-culinary-card-body">
                        {/* Header: Name & Availability Indicator Pill */}
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '6px' }}>
                          <h3 className="hsw-culinary-dish-name" style={{ margin: 0, flex: 1, fontSize: '15px' }}>
                            {localizedName}
                          </h3>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '11px',
                              fontWeight: 600,
                              padding: '2px 8px',
                              borderRadius: 'var(--radius-pill)',
                              backgroundColor: isAvailable ? 'rgba(46, 125, 50, 0.1)' : 'rgba(211, 47, 47, 0.1)',
                              color: isAvailable ? 'var(--accent-forest)' : '#d32f2f',
                              border: `1px solid ${isAvailable ? 'rgba(46, 125, 50, 0.25)' : 'rgba(211, 47, 47, 0.25)'}`,
                              whiteSpace: 'nowrap',
                              flexShrink: 0,
                            }}
                            id={`availability-badge-${item.id}`}
                          >
                            <span
                              style={{
                                width: '6px',
                                height: '6px',
                                borderRadius: '50%',
                                backgroundColor: isAvailable ? 'var(--accent-forest)' : '#d32f2f',
                              }}
                            />
                            {isAvailable ? `Còn ${servingsLeft} suất` : t('dining.select.unavailable', 'Tạm hết')}
                          </span>
                        </div>

                        {/* Dish Description */}
                        <p className="hsw-culinary-desc">{localizedDesc}</p>

                        {/* Price & Package Inclusion Badge */}
                        <div
                          className="hsw-culinary-dish-price"
                          style={{
                            margin: '8px 0',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                          }}
                          id={`price-tag-${item.id}`}
                        >
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              padding: '3px 8px',
                              borderRadius: 'var(--radius-pill)',
                              backgroundColor: 'rgba(46, 90, 54, 0.12)',
                              color: 'var(--accent-forest)',
                              border: '1px solid rgba(46, 90, 54, 0.25)',
                            }}
                          >
                            ✓ {t('dining.select.includedInPackage', 'Bao gồm trong gói (0đ)')}
                          </span>
                          {item.price !== undefined && item.price > 0 && (
                            <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', textDecoration: 'line-through' }}>
                              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price)}
                            </span>
                          )}
                        </div>

                        {/* Dietary Badges */}
                        <DietaryBadgeList item={item} />

                        {warning && (
                          <div className="hsw-allergy-alert-box" role="alert" style={{ marginTop: '8px' }}>
                            <AlertCircle size={14} style={{ flexShrink: 0, marginTop: '1px' }} />
                            <span>{t('dining.menu.allergyWarning', 'Contains an allergen listed in your dietary profile.')}</span>
                          </div>
                        )}

                        {/* Quantity / Portion Selector on card when selected */}
                        {isSelected && isAvailable && (
                          <div
                            className="hsw-portion-selector-box"
                            style={{
                              marginTop: 'var(--space-3)',
                              padding: '8px 12px',
                              backgroundColor: 'var(--bg-soft)',
                              borderRadius: 'var(--radius-sm)',
                              border: '1px solid var(--border-subtle)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                            }}
                            onClick={(e) => e.stopPropagation()}
                            id={`portion-selector-${item.id}`}
                          >
                            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                              {t('dining.select.portionCount', 'Khẩu phần / Số lượng')}:
                            </span>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                              <button
                                type="button"
                                className="hsw-btn hsw-btn-secondary hsw-btn-sm"
                                style={{ padding: '0 8px', height: '26px', minWidth: '26px', fontWeight: 700 }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedItems((prev) => {
                                    const current = prev[item.id] || 1;
                                    if (current <= 1) {
                                      const next = { ...prev };
                                      delete next[item.id];
                                      return next;
                                    }
                                    return { ...prev, [item.id]: current - 1 };
                                  });
                                }}
                                id={`btn-portion-dec-${item.id}`}
                                title="Giảm số lượng (hoặc bỏ chọn nếu về 0)"
                              >
                                -
                              </button>
                              <span style={{ fontWeight: 700, fontSize: '13px', minWidth: '60px', textAlign: 'center', color: 'var(--text-primary)' }}>
                                {itemPortion} {t('dining.select.portion', 'suất')}
                              </span>
                              <button
                                type="button"
                                className="hsw-btn hsw-btn-secondary hsw-btn-sm"
                                style={{ padding: '0 8px', height: '26px', minWidth: '26px', fontWeight: 700 }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedItems((prev) => ({
                                    ...prev,
                                    [item.id]: Math.min(10, (prev[item.id] || 1) + 1),
                                  }));
                                }}
                                id={`btn-portion-inc-${item.id}`}
                                title="Tăng số lượng"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Amanoi Luxury Wellness Dining Venue & Requests Section */}
              <AmanoiDiningLocationPicker
                location={diningLocation}
                onLocationChange={setDiningLocation}
                selectedTags={selectedWellnessTags}
                onToggleTag={handleToggleTag}
                customNotes={customNotes}
                onCustomNotesChange={setCustomNotes}
                villaNumber={activeBooking.villaNumber}
                lang={currentLang === 'vi' ? 'vi' : 'en'}
              />

              <div className="hsw-meal-save-card">
                {selectedEntries.length > 0 && (
                  <div style={{ marginBottom: 'var(--space-3)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                    <span style={{ fontSize: 'var(--text-sm)', color: 'var(--accent-forest)', fontWeight: 700 }}>
                      {t('dining.select.selectedBadge', 'Selected')} ({selectedEntries.length} món):{' '}
                      {selectedEntries.map(([mId, qty]) => {
                        const m = menuItems.find((it) => it.id === mId);
                        return `${qty}x ${m ? localize(m.name) : mId}`;
                      }).join(', ')}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 600 }}>
                      {diningLocation === 'IN_VILLA'
                        ? '🏡 Phục vụ riêng tại Biệt thự'
                        : '🍽️ Phục vụ tại Nhà hàng Trung tâm'}
                    </span>
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="hsw-btn hsw-btn-primary"
                    disabled={selectedEntries.length === 0 || activeDate < todayStr || isSaving}
                    onClick={handleSave}
                    id="btn-save-meal-selection"
                  >
                    <CheckCircle2 size={16} />
                    <span>
                      {isSaving ? 'Đang gửi đơn về bếp...' : t('dining.select.saveSelection', 'Xác Nhận & Lưu Thực Đơn')}
                      {selectedEntries.length > 0 ? ` (${selectedEntries.length} món)` : ''}
                    </span>
                  </button>

                  {activeDate < todayStr && (
                    <span style={{ color: '#d32f2f', fontSize: 'var(--text-sm)', fontWeight: 600 }}>
                      {t('dining.select.pastDateNotice', 'Past date — meal selection cannot be modified')}
                    </span>
                  )}

                  {saveSuccess && (
                    <span
                      style={{
                        color: 'var(--success)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: 'var(--text-sm)',
                        fontWeight: 600,
                      }}
                      role="status"
                    >
                      <CheckCircle2 size={16} />
                      {t('dining.select.saveSuccess', 'Meal selection saved successfully for this period.')}
                    </span>
                  )}
                  {saveError && <span role="alert" style={{ color: 'var(--danger)' }}>{saveError}</span>}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export const DailyMealSelectionPage: React.FC = () => {
  const { currentUser } = useAuth();
  return <DailyMealSelectionPageForIdentity key={currentUser?.id ?? 'anonymous'} />;
};
