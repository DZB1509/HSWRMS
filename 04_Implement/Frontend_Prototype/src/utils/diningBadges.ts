import type { DietaryMenuItem } from '../types/dining';

export interface ResolvedDietaryBadge {
  key: string;
  label: string;
  type: 'diet' | 'exclusion' | 'attribute';
}

/**
 * Returns prioritized, ingredient-aware dietary badges for display across
 * Customer and F&B screens (Screens 34, 35, 36, 37, 39, 40).
 */
export function getResolvedDietaryBadges(
  item: Pick<DietaryMenuItem, 'dietaryTags' | 'allergenTags' | 'category'>,
  t: (key: string, defaultValue?: string) => string,
  options?: {
    maxBadges?: number;
    prefix?: string;
  }
): ResolvedDietaryBadge[] {
  const prefix = options?.prefix ?? 'dining.dietaryTags.';
  const maxBadges = options?.maxBadges ?? 3;

  const isBeverage = item.category === 'beverage' || item.category === 'wellness_drink';

  // 1. Dietary Compatibility (Priority 1)
  const DIET_PRIORITY: Record<string, number> = {
    vegan: 100,
    pescatarian: 90,
    flexitarian: 85,
    lacto_ovo_vegetarian: 80,
    vegetarian: 70,
  };

  // 2. Important Exclusions (Priority 2)
  const EXCLUSION_PRIORITY: Record<string, number> = {
    gluten_free: 60,
    gluten_conscious: 55,
    dairy_free: 50,
  };

  // 3. Secondary Attributes (Priority 3)
  const ATTRIBUTE_PRIORITY: Record<string, number> = {
    keto: 30,
  };

  const getWeight = (tag: string): number => {
    return DIET_PRIORITY[tag] ?? EXCLUSION_PRIORITY[tag] ?? ATTRIBUTE_PRIORITY[tag] ?? 0;
  };

  // Filter tags according to beverage suppression rules
  const candidateTags = (item.dietaryTags || []).filter((tag) => {
    // Beverage badge reduction rule:
    // For simple beverages/drinks, hide generic vegetarian compatibility badge
    // because it adds little decision value for non-meat liquid infusions.
    if (isBeverage && tag === 'vegetarian') {
      return false;
    }
    return true;
  });

  // Sort candidate tags by visual priority
  candidateTags.sort((a, b) => getWeight(b) - getWeight(a));

  // Cap at 2-3 meaningful badges per card to avoid badge overload
  const displayTags = candidateTags.slice(0, maxBadges);

  return displayTags.map((tag) => {
    let label = '';
    let type: 'diet' | 'exclusion' | 'attribute' = 'diet';

    if (tag === 'lacto_ovo_vegetarian') {
      type = 'diet';
      const hasEggs = item.allergenTags?.includes('eggs');
      const hasDairy = item.allergenTags?.includes('dairy');

      if (hasEggs && !hasDairy) {
        label = t(`${prefix}lacto_ovo_egg`, 'Ăn chay có trứng');
      } else if (hasDairy && !hasEggs) {
        label = t(`${prefix}lacto_ovo_dairy`, 'Ăn chay có sữa');
      } else if (hasEggs && hasDairy) {
        label = t(`${prefix}lacto_ovo_both`, 'Ăn chay có trứng/sữa');
      } else {
        label = t(`${prefix}lacto_ovo_vegetarian`, 'Ăn chay lacto-ovo');
      }
    } else {
      label = t(`${prefix}${tag}`, tag.replace(/_/g, ' '));
      if (EXCLUSION_PRIORITY[tag]) {
        type = 'exclusion';
      } else if (ATTRIBUTE_PRIORITY[tag]) {
        type = 'attribute';
      } else {
        type = 'diet';
      }
    }

    return {
      key: tag,
      label,
      type,
    };
  });
}
