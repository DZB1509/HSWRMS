import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDining } from '../../context/DiningContext';
import { OperationalPageHeader } from '../../components/operations/OperationalPageHeader';
import { OperationalPagination } from '../../components/operations/OperationalPagination';
import { useNavigate } from 'react-router-dom';
import { Search, AlertTriangle } from 'lucide-react';

export const MealPrepListPage: React.FC = () => {
  const { t } = useTranslation('operations');
  const { getDailyPrepList, updateFulfillmentStatus, menuItems } = useDining();
  const navigate = useNavigate();

  const [date, setDate] = useState('2024-12-05'); // Hardcoded mock date
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const handleFilterChange = (setter: React.Dispatch<React.SetStateAction<string>>) => (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    setter(e.target.value);
    setCurrentPage(1);
  };

  const rawList = getDailyPrepList(date);

  const filteredList = rawList.filter(item => {
    const matchesType = filterType === 'all' || item.type === filterType;
    const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
    const matchesSearch = item.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (item.villaNumber && item.villaNumber.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesType && matchesStatus && matchesSearch;
  });

  const totalItems = filteredList.length;
  const safeCurrentPage = Math.min(currentPage, Math.max(1, Math.ceil(totalItems / pageSize)));
  if (currentPage !== safeCurrentPage) {
    setCurrentPage(safeCurrentPage);
  }

  const paginatedList = filteredList.slice((safeCurrentPage - 1) * pageSize, safeCurrentPage * pageSize);

  const handleStatusChange = (id: string, type: 'retreat_meal' | 'a_la_carte', newStatus: 'pending' | 'preparing' | 'ready' | 'delivered') => {
    updateFulfillmentStatus(id, type, newStatus);
  };

  return (
    <div className="hsw-page-container">
      <OperationalPageHeader 
        title={t('fnb.prepList.title', 'Daily Meal Prep Queue')}
        subtitle={t('fnb.prepList.subtitle', 'Manage kitchen fulfillment for all customer orders.')}
      />

      <div className="ops-card hsw-card" style={{ marginBottom: 'var(--space-4)', display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 200px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px', color: 'var(--text-secondary)' }}>
            {t('fnb.prepList.date', 'Target Date')}
          </label>
          <input 
            type="date" 
            className="hsw-input" 
            style={{ width: '100%' }}
            value={date}
            onChange={handleFilterChange(setDate)}
          />
        </div>
        <div style={{ flex: '1 1 200px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px', color: 'var(--text-secondary)' }}>
            {t('fnb.prepList.search', 'Search Customer / Villa')}
          </label>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
            <input 
              type="text" 
              className="hsw-input" 
              style={{ width: '100%', paddingLeft: '32px' }}
              placeholder={t('fnb.prepList.searchPlaceholder', 'e.g., Jane Doe, 102')}
              value={searchQuery}
              onChange={handleFilterChange(setSearchQuery)}
            />
          </div>
        </div>
        <div style={{ flex: '1 1 150px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px', color: 'var(--text-secondary)' }}>
            {t('fnb.prepList.type', 'Order Type')}
          </label>
          <select 
            className="hsw-select" 
            style={{ width: '100%' }}
            value={filterType}
            onChange={handleFilterChange(setFilterType)}
          >
            <option value="all">{t('fnb.prepList.allTypes', 'All Types')}</option>
            <option value="retreat_meal">{t('fnb.prepList.typeRetreat', 'Retreat Meals')}</option>
            <option value="a_la_carte">{t('fnb.prepList.typeExtra', 'A-la-carte')}</option>
          </select>
        </div>
        <div style={{ flex: '1 1 150px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px', color: 'var(--text-secondary)' }}>
            {t('fnb.prepList.status', 'Status')}
          </label>
          <select 
            className="hsw-select" 
            style={{ width: '100%' }}
            value={filterStatus}
            onChange={handleFilterChange(setFilterStatus)}
          >
            <option value="all">{t('fnb.prepList.allStatuses', 'All Statuses')}</option>
            <option value="pending">{t('fnb.prepList.statusPending', 'Pending')}</option>
            <option value="preparing">{t('fnb.prepList.statusPreparing', 'Preparing')}</option>
            <option value="ready">{t('fnb.prepList.statusReady', 'Ready')}</option>
            <option value="delivered">{t('fnb.prepList.statusDelivered', 'Delivered')}</option>
          </select>
        </div>
      </div>

      <div className="ops-table-wrap">
        <table className="ops-table">
          <thead>
            <tr>
              <th>{t('fnb.prepList.colTime', 'Time / Period')}</th>
              <th>{t('fnb.prepList.colCustomer', 'Customer (Villa)')}</th>
              <th>{t('fnb.prepList.colItems', 'Items')}</th>
              <th>{t('fnb.prepList.colAlerts', 'Dietary Alerts')}</th>
              <th>{t('fnb.prepList.colStatus', 'Status')}</th>
              <th style={{ width: '100px' }}>{t('fnb.prepList.colAction', 'Action')}</th>
            </tr>
          </thead>
          <tbody>
            {paginatedList.map(item => (
              <tr key={item.id} style={{ opacity: item.status === 'delivered' ? 0.6 : 1 }}>
                <td onClick={() => navigate(`/fb/orders/${item.id}`)} style={{ cursor: 'pointer' }}>
                  <div style={{ fontWeight: 600 }}>{item.targetTime || t(`dining.periods.${item.mealPeriod}`, item.mealPeriod || '')}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                    {item.type === 'retreat_meal' ? t('fnb.prepList.badgeRetreat', 'RETREAT') : t('fnb.prepList.badgeExtra', 'EXTRA')}
                  </div>
                </td>
                <td onClick={() => navigate(`/fb/orders/${item.id}`)} style={{ cursor: 'pointer' }}>
                  <div style={{ fontWeight: 500 }}>{item.customerName}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Villa {item.villaNumber}</div>
                </td>
                <td onClick={() => navigate(`/fb/orders/${item.id}`)} style={{ cursor: 'pointer' }}>
                  <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '13px' }}>
                    {item.items.map((lineItem, idx) => {
                      const menuItem = menuItems.find(m => m.id === lineItem.menuItemId);
                      return <li key={idx}>{lineItem.quantity}x {menuItem?.name.en || 'Unknown Item'}</li>;
                    })}
                  </ul>
                  {item.customerNotes && (
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', background: 'var(--bg-secondary)', padding: '2px 4px', borderRadius: '2px', marginTop: '4px', display: 'inline-block' }}>
                      {item.customerNotes}
                    </div>
                  )}
                </td>
                <td onClick={() => navigate(`/fb/orders/${item.id}`)} style={{ cursor: 'pointer' }}>
                  {item.dietaryNotes.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {item.dietaryNotes.map((note, idx) => (
                        <span key={idx} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'var(--danger-light)', color: 'var(--danger)', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 500 }}>
                          <AlertTriangle size={10} />
                          {note}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span style={{ color: 'var(--text-tertiary)', fontSize: '12px' }}>{t('fnb.prepList.noAlerts', 'None')}</span>
                  )}
                </td>
                <td>
                  <select 
                    className="hsw-select"
                    style={{ 
                      padding: '4px 24px 4px 8px', 
                      fontSize: '12px', 
                      minHeight: '28px',
                      background: item.status === 'pending' ? 'var(--bg-secondary)' : 
                                  item.status === 'preparing' ? '#fff3cd' : 
                                  item.status === 'ready' ? '#d1e7dd' : 'transparent',
                      color: item.status === 'pending' ? 'var(--text-secondary)' : 
                             item.status === 'preparing' ? '#856404' : 
                             item.status === 'ready' ? '#0f5132' : 'var(--text-primary)',
                      border: 'none',
                      fontWeight: 600
                    }}
                    value={item.status}
                    onChange={(e) => handleStatusChange(item.id, item.type, e.target.value as any)}
                  >
                    <option value="pending">PENDING</option>
                    <option value="preparing">PREPARING</option>
                    <option value="ready">READY</option>
                    <option value="delivered">DELIVERED</option>
                  </select>
                </td>
                <td>
                  <button className="hsw-btn hsw-btn-secondary" style={{ padding: '4px 8px', fontSize: '12px', minHeight: 'auto' }} onClick={() => navigate(`/fb/orders/${item.id}`)}>
                    {t('fnb.prepList.viewDetails', 'Details')}
                  </button>
                </td>
              </tr>
            ))}
            {paginatedList.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: 'var(--space-6)', color: 'var(--text-tertiary)' }}>
                  {t('fnb.prepList.noResults', 'No preparation items match the current filters.')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <OperationalPagination
        currentPage={safeCurrentPage}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        pageSizeOptions={[10, 25, 50]}
        onPageSizeChange={setPageSize}
      />
    </div>
  );
};
