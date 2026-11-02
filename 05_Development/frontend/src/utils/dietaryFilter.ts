import type { DietaryMenuItem } from '../types/dining';

function stripDiacritics(str: string): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .toLowerCase()
    .trim();
}

/**
 * Checks if a menu item is compatible with a customer's dietary restrictions and allergies.
 * Returns true if the item is SAFE and ALLOWED, or false if it conflicts.
 */
export function isItemDietaryCompatible(
  item: DietaryMenuItem,
  dietaryRestrictions: string[] = [],
  allergies: string[] = []
): boolean {
  // 1. Check Allergies (Strictest safety barrier)
  if (allergies && allergies.length > 0 && item.allergenTags && item.allergenTags.length > 0) {
    const itemAllergenTags = item.allergenTags.map((t) => stripDiacritics(t).replace(/[-_\s]/g, ''));

    for (const rawAllergy of allergies) {
      if (!rawAllergy || !rawAllergy.trim()) continue;
      const allergy = stripDiacritics(rawAllergy).replace(/[-_\s]/g, '');

      for (const tag of itemAllergenTags) {
        // Shellfish / Crustaceans
        const isShellfishTag =
          tag.includes('shellfish') ||
          tag.includes('crustacean') ||
          tag.includes('shrimp') ||
          tag.includes('crab') ||
          tag.includes('lobster');
        const isShellfishAllergy =
          allergy.includes('shellfish') ||
          allergy.includes('crustacean') ||
          allergy.includes('haisan') ||
          allergy.includes('tom') ||
          allergy.includes('cua');
        if (isShellfishTag && isShellfishAllergy) return false;

        // Fish
        const isFishTag = tag.includes('fish');
        const isFishAllergy = allergy.includes('fish') || allergy.includes('ca');
        if (isFishTag && isFishAllergy) return false;

        // Nuts / Peanuts
        const isNutTag = tag.includes('nut') || tag.includes('peanut');
        const isNutAllergy =
          allergy.includes('nut') ||
          allergy.includes('peanut') ||
          allergy.includes('dauphong') ||
          allergy.includes('lac') ||
          allergy.includes('hat');
        if (isNutTag && isNutAllergy) return false;

        // Dairy / Milk / Lactose
        const isDairyTag = tag.includes('dairy') || tag.includes('milk') || tag.includes('lactose');
        const isDairyAllergy =
          allergy.includes('dairy') ||
          allergy.includes('milk') ||
          allergy.includes('sua') ||
          allergy.includes('lactose') ||
          allergy.includes('bo') ||
          allergy.includes('phomai');
        if (isDairyTag && isDairyAllergy) return false;

        // Eggs
        const isEggTag = tag.includes('egg');
        const isEggAllergy = allergy.includes('egg') || allergy.includes('trung');
        if (isEggTag && isEggAllergy) return false;

        // Soy
        const isSoyTag = tag.includes('soy');
        const isSoyAllergy = allergy.includes('soy') || allergy.includes('daunanh') || allergy.includes('dauhu');
        if (isSoyTag && isSoyAllergy) return false;

        // Direct containment
        if (allergy.includes(tag) || tag.includes(allergy)) return false;
      }
    }
  }

  // 2. Check Dietary Restrictions
  if (dietaryRestrictions && dietaryRestrictions.length > 0) {
    const tags = (item.dietaryTags || []).map((t) => stripDiacritics(t).replace(/[-_\s]/g, ''));

    // Check if dish contains meat/fish/poultry keywords in name
    const normalizedName = stripDiacritics(
      typeof item.name === 'string' ? item.name : Object.values(item.name || {}).join(' ')
    );

    for (const rawRestriction of dietaryRestrictions) {
      if (!rawRestriction || !rawRestriction.trim()) continue;
      const restriction = stripDiacritics(rawRestriction).replace(/[-_\s]/g, '');

      // Vegan (Thuần chay): Món phải có tag vegan
      if (restriction.includes('vegan') || restriction.includes('thuanchay')) {
        if (!tags.includes('vegan')) return false;
      }

      // Vegetarian (Ăn chay / Lacto-Ovo Vegetarian):
      // Món phải là vegetarian, vegan, hoặc lactoovovegetarian.
      // Tuyệt đối KHÔNG có cá và thịt đỏ (bò, heo, gà).
      if (
        restriction.includes('vegetarian') ||
        restriction.includes('anchay') ||
        restriction.includes('chay')
      ) {
        const isVeg =
          tags.includes('vegetarian') || tags.includes('vegan') || tags.includes('lactoovovegetarian');
        if (!isVeg) return false;
      }

      // Pescatarian (Ăn chay có cá): Cho phép cá/hải sản và đồ chay, nhưng cấm thịt bò, thịt heo, thịt gia cầm
      if (restriction.includes('pescatarian')) {
        const isPescatarianAllowed =
          tags.includes('pescatarian') ||
          tags.includes('vegetarian') ||
          tags.includes('vegan') ||
          tags.includes('lactoovovegetarian');
        if (!isPescatarianAllowed) return false;
        // Even if pescatarian, prohibit beef/pork/poultry
        if (
          normalizedName.includes('than bo') ||
          normalizedName.includes('thit bo') ||
          normalizedName.includes('beef') ||
          normalizedName.includes('heo') ||
          normalizedName.includes('pork') ||
          normalizedName.includes('ga') ||
          normalizedName.includes('chicken')
        ) {
          return false;
        }
      }

      // Gluten-Free (Không chứa gluten)
      if (restriction.includes('glutenfree') || restriction.includes('khonggluten')) {
        if (!tags.includes('glutenfree') && !tags.includes('glutenconscious')) return false;
      }

      // Dairy-Free (Không chứa sữa động vật)
      if (restriction.includes('dairyfree') || restriction.includes('khongsua')) {
        if (!tags.includes('dairyfree')) return false;
      }

      // Keto / Low-Carb
      if (restriction.includes('keto') || restriction.includes('lowcarb')) {
        if (!tags.includes('keto') && !tags.includes('lowcarb')) return false;
      }
    }
  }

  return true;
}
