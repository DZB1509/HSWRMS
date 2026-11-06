/**
 * ============================================================================
 * Amanoi Luxury Wellness Retreat — Culinary Service & Location Helper
 * Module: M4 - Food & Beverage Management (F&B)
 * Model: Amanoi Wellness Retreat Operational Standard
 * 
 * Rules:
 * - Default Venue: Central Dining Pavilion (Nhà hàng Trung tâm) - SLA: 15-25 phút
 * - Optional In-Villa: Private In-Villa Dining (Phục vụ tại Biệt thự) - SLA: 30-45 phút
 * - Zero DB schema modification: encapsulated in standard special_notes field.
 * ============================================================================
 */

export type DiningServiceLocation = 'DINING_PAVILION' | 'IN_VILLA';
export type DeliveryTimingOption = 'ASAP' | 'SCHEDULED';

export interface AmanoiWellnessTag {
  id: string;
  labelVi: string;
  labelEn: string;
  icon?: string;
}

export const AMANOI_WELLNESS_TAGS: AmanoiWellnessTag[] = [
  { id: 'low_sodium', labelVi: 'Ăn thanh đạm / Ít muối', labelEn: 'Low sodium / Light seasoning' },
  { id: 'plant_based', labelVi: 'Thuần chay dưỡng sinh', labelEn: 'Plant-based whole food' },
  { id: 'mild_spice', labelVi: 'Không cay', labelEn: 'Mild / No chili' },
  { id: 'gluten_free', labelVi: 'Không chứa Gluten', labelEn: 'Gluten-free' },
  { id: 'warm_lemon_water', labelVi: 'Nước ấm chanh mật ong trước bữa', labelEn: 'Warm honey lemon water' },
  { id: 'prompt_service', labelVi: 'Phục vụ đúng giờ hẹn', labelEn: 'Serve promptly on schedule' },
];

export interface ParsedDiningNotes {
  location: DiningServiceLocation;
  isVillaDelivery: boolean;
  locationLabelVi: string;
  locationLabelEn: string;
  serviceInstructionsVi: string;
  serviceInstructionsEn: string;
  wellnessTags: string[];
  cleanNotes: string;
  rawNotes: string;
  deliveryTiming: DeliveryTimingOption;
  scheduledTime?: string;
  leadTimeMinutes: number;
  etaWindow: string;
  estimatedTime?: string;
}

/**
 * Parses raw special_notes string into Amanoi luxury dining service attributes.
 */
export function parseDiningNotes(rawNotes?: string | null, createdAt?: string | null): ParsedDiningNotes {
  const raw = (rawNotes || '').trim();
  if (!raw) {
    const leadTimeMinutes = 20;
    const etaWindow = '15 - 25 phút';
    let estimatedTime: string | undefined;
    if (createdAt) {
      try {
        const d = new Date(createdAt);
        d.setMinutes(d.getMinutes() + leadTimeMinutes);
        estimatedTime = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } catch {
        // fallback
      }
    }
    return {
      location: 'DINING_PAVILION',
      isVillaDelivery: false,
      locationLabelVi: 'Nhà hàng Trung tâm (Dining Pavilion)',
      locationLabelEn: 'Central Dining Pavilion',
      serviceInstructionsVi: 'Bày đĩa sứ mỹ nghệ fine-dining, phục vụ trực tiếp tại bàn ăn Nhà hàng Trung tâm.',
      serviceInstructionsEn: 'Plate on fine artisan porcelain, serve at table in Central Dining Pavilion.',
      wellnessTags: [],
      cleanNotes: '',
      rawNotes: '',
      deliveryTiming: 'ASAP',
      leadTimeMinutes,
      etaWindow,
      estimatedTime,
    };
  }

  const upper = raw.toUpperCase();
  const isVilla =
    upper.includes('IN-VILLA') ||
    upper.includes('IN VILLA') ||
    upper.includes('BIỆT THỰ') ||
    upper.includes('BIET THU') ||
    upper.includes('TẠI VILLA') ||
    upper.includes('TAI VILLA') ||
    upper.includes('GIAO VILLA') ||
    upper.includes('VILLA DELIVERY') ||
    upper.includes('ROOM SERVICE');

  // Check scheduled delivery time, e.g. [SCHEDULED: 19:30] or [TARGET: 12:45]
  let deliveryTiming: DeliveryTimingOption = 'ASAP';
  let scheduledTime: string | undefined;
  const scheduledMatch = raw.match(/\[(?:SCHEDULED|TARGET|HẸN GIỜ|HEN GIO):\s*(\d{1,2}:\d{2})\]/i);
  if (scheduledMatch) {
    deliveryTiming = 'SCHEDULED';
    scheduledTime = scheduledMatch[1];
  } else if (upper.includes('[ASAP]') || upper.includes('[GIAO NGAY]')) {
    deliveryTiming = 'ASAP';
  }

  const leadTimeMinutes = isVilla ? 35 : 20;
  const etaWindow = isVilla ? '30 - 45 phút' : '15 - 25 phút';

  let estimatedTime: string | undefined = scheduledTime;
  if (!estimatedTime && createdAt) {
    try {
      const d = new Date(createdAt);
      d.setMinutes(d.getMinutes() + leadTimeMinutes);
      estimatedTime = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      // fallback
    }
  }

  // Extract bracketed wellness tags
  const bracketMatches: string[] = raw.match(/\[(.*?)\]/g) || [];
  const wellnessTags: string[] = [];
  bracketMatches.forEach((match) => {
    const inner = match.replace(/^\[+|\]+$/g, '').trim();
    const innerUpper = inner.toUpperCase();
    if (
      !innerUpper.includes('IN-VILLA') &&
      !innerUpper.includes('DINING PAVILION') &&
      !innerUpper.includes('NHÀ HÀNG') &&
      !innerUpper.includes('SCHEDULED') &&
      !innerUpper.includes('TARGET') &&
      !innerUpper.includes('HẸN GIỜ') &&
      !innerUpper.includes('HEN GIO') &&
      !innerUpper.includes('ASAP') &&
      !innerUpper.includes('GIAO NGAY')
    ) {
      wellnessTags.push(inner);
    }
  });

  // Strip location, timing, and bracket tags to get customer clean free-text notes
  let clean = raw
    .replace(/\[IN-VILLA DINING.*?\]/gi, '')
    .replace(/\[DINING PAVILION.*?\]/gi, '')
    .replace(/\[Phục vụ tại.*?\]/gi, '')
    .replace(/\[(?:SCHEDULED|TARGET|HẸN GIỜ|HEN GIO):.*?\]/gi, '')
    .replace(/\[ASAP\]/gi, '')
    .replace(/\[GIAO NGAY\]/gi, '');

  bracketMatches.forEach((m) => {
    clean = clean.replace(m, '');
  });
  clean = clean.replace(/^(Ghi chú|Note):\s*/i, '').trim();

  return {
    location: isVilla ? 'IN_VILLA' : 'DINING_PAVILION',
    isVillaDelivery: isVilla,
    locationLabelVi: isVilla ? 'Phục vụ tại Biệt thự (In-Villa Dining)' : 'Nhà hàng Trung tâm (Dining Pavilion)',
    locationLabelEn: isVilla ? 'Private In-Villa Dining' : 'Central Dining Pavilion',
    serviceInstructionsVi: isVilla
      ? 'Đóng nắp ủ nhiệt Cloche giữ ấm, xếp thùng giữ nhiệt và điều phối Butler / Xe điện giao tận Biệt thự.'
      : 'Bày đĩa sứ mỹ nghệ fine-dining, phục vụ trực tiếp tại bàn ăn Nhà hàng Trung tâm.',
    serviceInstructionsEn: isVilla
      ? 'Cover with insulated cloche domes, pack in thermal carrier and dispatch via electric buggy/butler to Villa.'
      : 'Plate on fine artisan porcelain, serve at table in Central Dining Pavilion.',
    wellnessTags,
    cleanNotes: clean,
    rawNotes: raw,
    deliveryTiming,
    scheduledTime,
    leadTimeMinutes,
    etaWindow,
    estimatedTime,
  };
}

/**
 * Builds the canonical Amanoi luxury dining special_notes payload.
 */
export function buildAmanoiDiningNotes(
  location: DiningServiceLocation,
  wellnessTags: string[],
  customNotes: string,
  villaNumber?: string,
  deliveryTiming: DeliveryTimingOption = 'ASAP',
  scheduledTime?: string
): string {
  const parts: string[] = [];

  if (location === 'IN_VILLA') {
    const vStr = villaNumber ? ` - ${villaNumber}` : '';
    parts.push(`[IN-VILLA DINING${vStr}]`);
  } else {
    parts.push('[DINING PAVILION]');
  }

  if (deliveryTiming === 'SCHEDULED' && scheduledTime && scheduledTime.trim()) {
    parts.push(`[SCHEDULED: ${scheduledTime.trim()}]`);
  } else {
    parts.push('[ASAP]');
  }

  wellnessTags.forEach((tag) => {
    if (tag && tag.trim()) {
      parts.push(`[${tag.trim()}]`);
    }
  });

  const trimmedCustom = customNotes.trim();
  if (trimmedCustom) {
    parts.push(trimmedCustom);
  }

  return parts.join(' ').trim();
}

/**
 * Returns the current date formatted as YYYY-MM-DD in the user's local timezone.
 */
export function getLocalDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
