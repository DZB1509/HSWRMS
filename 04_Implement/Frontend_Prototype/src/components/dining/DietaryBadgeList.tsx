import React from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles, ShieldCheck, Tag } from 'lucide-react';
import type { DietaryMenuItem } from '../../types/dining';
import { getResolvedDietaryBadges } from '../../utils/diningBadges';

interface DietaryBadgeListProps {
  item: Pick<DietaryMenuItem, 'dietaryTags' | 'allergenTags' | 'category'>;
  maxBadges?: number;
  className?: string;
  chipClassName?: string;
  prefix?: string;
}

export const DietaryBadgeList: React.FC<DietaryBadgeListProps> = ({
  item,
  maxBadges = 3,
  className = 'hsw-dietary-chips',
  chipClassName = 'hsw-dietary-chip',
  prefix,
}) => {
  const { t } = useTranslation(['customer']);
  const translate = (key: string, defaultValue?: string): string => {
    return (defaultValue ? t(key, defaultValue) : t(key)) as string;
  };
  const badges = getResolvedDietaryBadges(item, translate, { maxBadges, prefix });

  if (badges.length === 0) return null;

  return (
    <div className={className}>
      {badges.map((b) => {
        let Icon = Sparkles;
        let iconColor = 'var(--accent-olive)';

        if (b.type === 'exclusion') {
          Icon = ShieldCheck;
          iconColor = 'var(--text-tertiary)';
        } else if (b.type === 'attribute') {
          Icon = Tag;
          iconColor = 'var(--accent-sand)';
        }

        return (
          <span key={b.key} className={`${chipClassName} hsw-chip-${b.type}`}>
            <Icon size={11} style={{ color: iconColor }} />
            {b.label}
          </span>
        );
      })}
    </div>
  );
};
