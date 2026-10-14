import React from 'react';
import { useTranslation } from 'react-i18next';
import { HeartPulse, Utensils, Moon, Sun, MapPin } from 'lucide-react';
import type { ItineraryDay } from '../../types/customer';

export interface TimelineItineraryProps {
  days: ItineraryDay[];
}

export const TimelineItinerary: React.FC<TimelineItineraryProps> = ({ days }) => {
  const { i18n } = useTranslation();
  const lang = (i18n.language as 'vi' | 'en' | 'zh-CN' | 'ja' | 'fr') || 'en';

  if (!days || days.length === 0) {
    return (
      <div
        style={{
          padding: 'var(--space-8)',
          textAlign: 'center',
          backgroundColor: 'var(--surface)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
          color: 'var(--text-secondary)',
          fontSize: 'var(--text-sm)',
        }}
      >
        No scheduled itinerary available.
      </div>
    );
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'spa':
        return <HeartPulse size={15} style={{ color: 'var(--accent-olive)' }} />;
      case 'dining':
        return <Utensils size={15} style={{ color: '#b45309' }} />;
      case 'mindfulness':
        return <Moon size={15} style={{ color: '#4338ca' }} />;
      case 'wellness':
      default:
        return <Sun size={15} style={{ color: 'var(--accent-forest)' }} />;
    }
  };

  return (
    <div className="hsw-timeline-itinerary" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
      {days.map((dayPlan) => {
        const dayTitle = dayPlan.title[lang] || dayPlan.title.en || dayPlan.title.vi;

        return (
          <div
            key={dayPlan.day}
            style={{
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-6)',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-3)',
                marginBottom: 'var(--space-5)',
                paddingBottom: 'var(--space-3)',
                borderBottom: '1px solid var(--border-subtle)',
              }}
            >
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--accent-forest)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 700,
                }}
              >
                {dayPlan.day}
              </div>
              <h3
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'var(--text-xl)',
                  fontWeight: 500,
                  color: 'var(--text-primary)',
                  margin: 0,
                }}
              >
                {dayTitle}
              </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', position: 'relative' }}>
              {dayPlan.activities.map((act, actIdx) => {
                const actName = act.name[lang] || act.name.en || act.name.vi;

                return (
                  <div
                    key={actIdx}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 'var(--space-4)',
                      padding: 'var(--space-3) var(--space-4)',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: actIdx % 2 === 0 ? 'var(--bg-soft)' : 'transparent',
                      border: '1px solid transparent',
                      transition: 'background-color 0.2s',
                    }}
                  >
                    <div
                      style={{
                        fontFamily: 'var(--font-mono, monospace)',
                        fontSize: '12px',
                        fontWeight: 700,
                        color: 'var(--accent-forest)',
                        minWidth: '50px',
                        paddingTop: '2px',
                      }}
                    >
                      {act.time}
                    </div>

                    <div style={{ marginTop: '2px' }}>{getActivityIcon(act.type)}</div>

                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2px' }}>
                        {actName}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text-tertiary)' }}>
                        <MapPin size={11} />
                        <span>{act.location}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};
