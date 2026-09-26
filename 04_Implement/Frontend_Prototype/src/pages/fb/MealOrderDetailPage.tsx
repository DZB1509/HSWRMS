import React from 'react';
import { useTranslation } from 'react-i18next';
import { useDining } from '../../context/DiningContext';
import { OperationalPageHeader } from '../../components/operations/OperationalPageHeader';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle, Clock, MapPin, User, ChevronLeft } from 'lucide-react';

export const MealOrderDetailPage: React.FC = () => {
  const { t } = useTranslation('operations');
  const { getDailyPrepList, updateFulfillmentStatus, menuItems } = useDining();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  // In reality, we'd fetch by ID directly. For mock, search the list.
  const date = '2024-12-05'; // matching our mock date
  const rawList = getDailyPrepList(date);
  const item = rawList.find(i => i.id === id);

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
    updateFulfillmentStatus(item.id, item.type, newStatus);
    // In a real app this would refresh the state/data
  };

  return (
    <div className="hsw-page-container">
      <div style={{ marginBottom: 'var(--space-4)' }}>
        <button 
          className="hsw-btn hsw-btn-secondary" 
          style={{ background: 'transparent', border: 'none', padding: 0 }}
          onClick={() => navigate('/fb/meal-prep')}
        >
          <ChevronLeft size={16} /> {t('fnb.orderDetail.backToList', 'Back to Prep Queue')}
        </button>
      </div>

      <OperationalPageHeader 
        title={`${item.type === 'retreat_meal' ? 'Retreat Meal' : 'A-la-carte Order'} - ${item.id}`}
        subtitle={t('fnb.orderDetail.subtitle', 'Fulfillment details and dietary requirements.')}
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Status:</span>
            <select 
              className="hsw-select"
              style={{ 
                background: item.status === 'pending' ? 'var(--bg-secondary)' : 
                            item.status === 'preparing' ? '#fff3cd' : 
                            item.status === 'ready' ? '#d1e7dd' : 'transparent',
                fontWeight: 600
              }}
              value={item.status}
              onChange={(e) => handleStatusChange(e.target.value as any)}
            >
              <option value="pending">PENDING</option>
              <option value="preparing">PREPARING</option>
              <option value="ready">READY</option>
              <option value="delivered">DELIVERED</option>
            </select>
          </div>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 'var(--space-6)', alignItems: 'start' }}>
        
        {/* Main Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div className="hsw-card ops-card">
            <h3 style={{ fontSize: 'var(--text-lg)', marginBottom: 'var(--space-3)' }}>{t('fnb.orderDetail.orderItems', 'Order Items')}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {item.items.map((lineItem, idx) => {
                const menuItem = menuItems.find(m => m.id === lineItem.menuItemId);
                if (!menuItem) return null;
                return (
                <div key={idx} style={{ display: 'flex', gap: 'var(--space-4)', padding: 'var(--space-3)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                  <img src={menuItem.image} alt={menuItem.name.en} style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }} />
                  <div style={{ flex: 1 }}>
                    <h4 style={{ fontSize: 'var(--text-md)', margin: '0 0 4px 0' }}>{lineItem.quantity}x {menuItem.name.en}</h4>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 8px 0' }}>{menuItem.description.en}</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {menuItem.dietaryTags.map((tag: string) => (
                        <span key={tag} style={{ fontSize: '11px', background: 'var(--bg-primary)', padding: '2px 8px', borderRadius: '4px', color: 'var(--text-secondary)' }}>
                          {tag.replace('_', ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                );
              })}
            </div>

            {item.customerNotes && (
              <div style={{ marginTop: 'var(--space-4)', padding: 'var(--space-3)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
                <h4 style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>
                  {t('fnb.orderDetail.customerNotes', 'Customer Preparation Notes')}
                </h4>
                <p style={{ margin: 0, fontSize: '14px', fontStyle: 'italic' }}>"{item.customerNotes}"</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div className="hsw-card ops-card">
            <h3 style={{ fontSize: 'var(--text-md)', marginBottom: 'var(--space-3)', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px' }}>
              {t('fnb.orderDetail.deliveryInfo', 'Delivery Information')}
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <User size={16} style={{ color: 'var(--text-tertiary)', marginTop: '2px' }} />
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{t('fnb.orderDetail.customerName', 'Customer Name')}</div>
                  <div style={{ fontWeight: 500 }}>{item.customerName}</div>
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <MapPin size={16} style={{ color: 'var(--text-tertiary)', marginTop: '2px' }} />
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{t('fnb.orderDetail.location', 'Location')}</div>
                  <div style={{ fontWeight: 500 }}>Villa {item.villaNumber}</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <Clock size={16} style={{ color: 'var(--text-tertiary)', marginTop: '2px' }} />
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{t('fnb.orderDetail.targetTime', 'Target Time')}</div>
                  <div style={{ fontWeight: 500 }}>{item.targetTime || item.mealPeriod}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="hsw-card ops-card" style={{ border: item.dietaryNotes.length > 0 ? '1px solid var(--danger)' : '1px solid var(--border-subtle)' }}>
            <h3 style={{ fontSize: 'var(--text-md)', marginBottom: 'var(--space-3)', display: 'flex', alignItems: 'center', gap: '8px', color: item.dietaryNotes.length > 0 ? 'var(--danger)' : 'inherit' }}>
              <AlertTriangle size={18} />
              {t('fnb.orderDetail.dietaryProfile', 'Dietary & Allergies')}
            </h3>
            
            {item.dietaryNotes.length > 0 ? (
              <ul style={{ margin: 0, paddingLeft: '20px', color: 'var(--danger)', fontWeight: 500 }}>
                {item.dietaryNotes.map((note, idx) => (
                  <li key={idx} style={{ marginBottom: '4px' }}>{note}</li>
                ))}
              </ul>
            ) : (
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '13px' }}>
                {t('fnb.orderDetail.noAllergies', 'No specific allergies or dietary restrictions recorded for this customer.')}
              </p>
            )}
            
            <div style={{ marginTop: 'var(--space-3)', paddingTop: 'var(--space-3)', borderTop: '1px solid var(--border-subtle)', fontSize: '11px', color: 'var(--text-tertiary)' }}>
              {t('fnb.orderDetail.privacyNote', 'Privacy Notice: Only culinary-relevant restrictions are shown. Medical details are restricted.')}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
