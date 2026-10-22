/**
 * ============================================================================
 * Amanoi Luxury Wellness Retreat — Culinary Service & Location Helper
 * Module: M4 - Food & Beverage Management (F&B)
 * Model: Amanoi Wellness Retreat Operational Standard
 * 
 * Rules:
 * - Default Venue: Central Dining Pavilion (Nhà hàng Trung tâm)
 * - Optional In-Villa: Private In-Villa Dining (Phục vụ tại Biệt thự)
 * - Zero DB schema modification: encapsulated in standard special_notes field.
 * ============================================================================
 */

export type DiningServiceLocation = 'DINING_PAVILION' | 'IN_VILLA';

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
}

/**
 * Parses raw special_notes string into Amanoi luxury dining service attributes.
 */
export function parseDiningNotes(rawNotes?: string | null): ParsedDiningNotes {
  const raw = (rawNotes || '').trim();
  if (!raw) {
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
    };
  }

  const upper = raw.toUpperCase();
  const isVilla =
    upper.includes('IN-VILLA') ||
    upper.includes('IN VILLA') ||
    upper.includes('BIỆT THỰ') ||
    upper.includes('TẠI VILLA') ||
    upper.includes('GIAO VILLA') ||
    upper.includes('VILLA DELIVERY') ||
    upper.includes('ROOM SERVICE');

  // Extract bracketed wellness tags like [Ăn thanh đạm / Ít muối], [Không cay], etc.
  const bracketMatches: string[] = raw.match(/\[(.*?)\]/g) || [];
  const wellnessTags: string[] = [];
  bracketMatches.forEach((match) => {
    const inner = match.replace(/^\[+|\]+$/g, '').trim();
    const innerUpper = inner.toUpperCase();
    if (
      !innerUpper.includes('IN-VILLA') &&
      !innerUpper.includes('DINING PAVILION') &&
      !innerUpper.includes('NHÀ HÀNG')
    ) {
      wellnessTags.push(inner);
    }
  });

  // Strip location and bracket tags to get customer clean free-text notes
  let clean = raw
    .replace(/\[IN-VILLA DINING.*?\]/gi, '')
    .replace(/\[DINING PAVILION.*?\]/gi, '')
    .replace(/\[Phục vụ tại.*?\]/gi, '');

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
  };
}

/**
 * Builds the canonical Amanoi luxury dining special_notes payload.
 */
export function buildAmanoiDiningNotes(
  location: DiningServiceLocation,
  wellnessTags: string[],
  customNotes: string,
  villaNumber?: string
): string {
  const parts: string[] = [];

  if (location === 'IN_VILLA') {
    const vStr = villaNumber ? ` - ${villaNumber}` : '';
    parts.push(`[IN-VILLA DINING${vStr}]`);
  } else {
    parts.push('[DINING PAVILION]');
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
