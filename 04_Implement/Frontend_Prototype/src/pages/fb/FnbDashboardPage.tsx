import React from 'react';
import { useTranslation } from 'react-i18next';
import { useDining } from '../../context/DiningContext';
import { OperationalPageHeader } from '../../components/operations/OperationalPageHeader';
import { ChefHat, UtensilsCrossed, AlertCircle, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const FnbDashboardPage: React.FC = () => {
  const { t } = useTranslation('operations');
  const { getDailyPrepList } = useDining();
  const navigate = useNavigate();

  const todaysList = getDailyPrepList('2024-12-05'); // Hardcoded to match mock data date for prototype visibility

  const mealsToPrepare = todaysList.filter(item => item.type === 'retreat_meal').length;
  const extraOrders = todaysList.filter(item => item.type === 'a_la_carte').length;
  const dietaryAlerts = todaysList.filter(item => item.dietaryNotes.length > 0).length;
  const pendingCount = todaysList.filter(item => item.status === 'pending').length;
  const preparingCount = todaysList.filter(item => item.status === 'preparing').length;

  return (
    <div className="hsw-page-container">
      <OperationalPageHeader 
        title={t('fnb.dashboard.title', 'F&B Dashboard')}
        subtitle={t('fnb.dashboard.subtitle', 'Culinary operations overview for today.')}
        actions={
          <button className="hsw-btn hsw-btn-primary" onClick={() => navigate('/fb/meal-prep')}>
            {t('fnb.dashboard.viewPrepList', 'View Full Prep List')}
          </button>
        }
      />

      <div className="hsw-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
        <div className="hsw-card ops-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <div style={{ padding: '10px', background: 'var(--bg-secondary)', borderRadius: '50%', color: 'var(--text-secondary)' }}>
              <UtensilsCrossed size={20} />
            </div>
            <h3 style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', fontWeight: 500, margin: 0 }}>
              {t('fnb.dashboard.retreatMeals', 'Retreat Meals (Today)')}
            </h3>
          </div>
          <div style={{ fontSize: '32px', fontWeight: 600 }}>{mealsToPrepare}</div>
        </div>

        <div className="hsw-card ops-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <div style={{ padding: '10px', background: 'var(--bg-secondary)', borderRadius: '50%', color: 'var(--accent-forest)' }}>
              <ChefHat size={20} />
            </div>
            <h3 style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', fontWeight: 500, margin: 0 }}>
              {t('fnb.dashboard.extraOrders', 'Extra A-la-carte')}
            </h3>
          </div>
          <div style={{ fontSize: '32px', fontWeight: 600 }}>{extraOrders}</div>
        </div>

        <div className="hsw-card ops-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <div style={{ padding: '10px', background: 'var(--danger-light)', borderRadius: '50%', color: 'var(--danger)' }}>
              <AlertCircle size={20} />
            </div>
            <h3 style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', fontWeight: 500, margin: 0 }}>
              {t('fnb.dashboard.dietaryAlerts', 'Dietary/Allergy Alerts')}
            </h3>
          </div>
          <div style={{ fontSize: '32px', fontWeight: 600 }}>{dietaryAlerts}</div>
        </div>

        <div className="hsw-card ops-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <div style={{ padding: '10px', background: 'var(--bg-secondary)', borderRadius: '50%', color: 'var(--accent-sand)' }}>
              <Clock size={20} />
            </div>
            <h3 style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', fontWeight: 500, margin: 0 }}>
              {t('fnb.dashboard.pendingPreparing', 'Pending / Preparing')}
            </h3>
          </div>
          <div style={{ fontSize: '32px', fontWeight: 600 }}>{pendingCount} <span style={{ color: 'var(--text-tertiary)', fontSize: '24px' }}>/ {preparingCount}</span></div>
        </div>
      </div>

      <h2 style={{ fontSize: 'var(--text-xl)', marginBottom: 'var(--space-4)' }}>{t('fnb.dashboard.urgentQueue', 'Urgent Prep Queue (Preview)')}</h2>
      
      <div className="ops-table-wrap">
        <table className="ops-table">
          <thead>
            <tr>
              <th>{t('fnb.prep.time', 'Time')}</th>
              <th>{t('fnb.prep.customer', 'Customer')}</th>
              <th>{t('fnb.prep.type', 'Type')}</th>
              <th>{t('fnb.prep.status', 'Status')}</th>
            </tr>
          </thead>
          <tbody>
            {todaysList.slice(0, 5).map(item => (
              <tr key={item.id} onClick={() => navigate(`/fb/orders/${item.id}`)} style={{ cursor: 'pointer' }}>
                <td>{item.targetTime || t(`dining.periods.${item.mealPeriod}`, item.mealPeriod || '')}</td>
                <td>
                  <div style={{ fontWeight: 500 }}>{item.customerName}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Villa {item.villaNumber}</div>
                </td>
                <td>{item.type === 'retreat_meal' ? t('fnb.prep.typeRetreat', 'Retreat Meal') : t('fnb.prep.typeExtra', 'A-la-carte')}</td>
                <td>
                  <span style={{ 
                    display: 'inline-block', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600,
                    background: item.status === 'pending' ? 'var(--bg-secondary)' : 
                                item.status === 'preparing' ? '#fff3cd' : 
                                item.status === 'ready' ? '#d1e7dd' : 'transparent',
                    color: item.status === 'pending' ? 'var(--text-secondary)' : 
                           item.status === 'preparing' ? '#856404' : 
                           item.status === 'ready' ? '#0f5132' : 'var(--text-primary)'
                  }}>
                    {item.status.toUpperCase()}
                  </span>
                </td>
              </tr>
            ))}
            {todaysList.length === 0 && (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', padding: 'var(--space-4)', color: 'var(--text-tertiary)' }}>
                  {t('fnb.dashboard.noQueue', 'No items in the prep queue.')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
