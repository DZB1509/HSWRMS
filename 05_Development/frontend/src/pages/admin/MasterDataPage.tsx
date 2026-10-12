import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Sparkles,
  Building,
  Calendar,
  CheckCircle2,
  Clock,
  Edit2,
  X,
  ShieldCheck
} from 'lucide-react';
import {
  INITIAL_PACKAGES_MASTER,
  INITIAL_SPA_SERVICES_MASTER,
  INITIAL_VILLAS_MASTER
} from '../../data/mockMasterData';
import type { MasterDataCategory, RetreatPackageMaster, SpaServiceMaster, VillaCategoryMaster } from '../../types/masterData';
import { formatVND } from '../../i18n';
import { Button } from '../../components/common/Button';
import { useToast } from '../../components/common/Toast';

export const MasterDataPage: React.FC = () => {
  const { t, i18n } = useTranslation(['operations', 'common']);
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<MasterDataCategory>('packages');
  const [searchQuery, setSearchQuery] = useState('');

  // Domain states
  const [packages, setPackages] = useState<RetreatPackageMaster[]>(INITIAL_PACKAGES_MASTER);
  const [spaServices, setSpaServices] = useState<SpaServiceMaster[]>(INITIAL_SPA_SERVICES_MASTER);
  const [villas, setVillas] = useState<VillaCategoryMaster[]>(INITIAL_VILLAS_MASTER);

  // Edit item modal state
  const [editingItem, setEditingItem] = useState<{
    category: MasterDataCategory;
    id: string;
    name: string;
    price: number;
    status: 'active' | 'archived';
  } | null>(null);

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    if (editingItem.category === 'packages') {
      setPackages((prev) =>
        prev.map((p) =>
          p.id === editingItem.id
            ? { ...p, name: editingItem.name, totalPrice: editingItem.price, basePrice: editingItem.price, status: editingItem.status }
            : p
        )
      );
    } else if (editingItem.category === 'spa') {
      setSpaServices((prev) =>
        prev.map((s) =>
          s.id === editingItem.id
            ? { ...s, name: editingItem.name, basePrice: editingItem.price, status: editingItem.status }
            : s
        )
      );
    } else if (editingItem.category === 'villas') {
      setVillas((prev) =>
        prev.map((v) =>
          v.id === editingItem.id
            ? { ...v, name: editingItem.name, baseNightlyRate: editingItem.price, status: editingItem.status }
            : v
        )
      );
    }

    setEditingItem(null);
    showToast(t('operations.masterData.savedToast', 'Đã cập nhật bản ghi dữ liệu gốc thành công (mô phỏng giao diện)'), 'success');
  };

  return (
    <div style={{ padding: 'var(--space-6) var(--space-8)' }}>
      {/* Header */}
      <div className="hsw-gov-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-1)' }}>
              <h1 className="hsw-gov-title">
                {t('operations.masterData.pageTitle', 'Quản Lý Dữ Liệu Gốc Khu Nghỉ Dưỡng Sức Khỏe')}
              </h1>
              <span style={{
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                padding: '3px 8px',
                borderRadius: 'var(--radius-pill)',
                backgroundColor: 'var(--actor-admin)',
                color: 'var(--actor-admin-text)'
              }}>
                {t('topbar.adminClearance', 'Thẩm Quyền Quản Trị Viên')}
              </span>
            </div>
            <p className="hsw-gov-subtitle">
              {t('operations.masterData.pageSubtitle', 'Danh mục quản trị trung tâm định nghĩa Gói Nghỉ Dưỡng, Dịch Vụ Spa & Trị Liệu, và Hạng Biệt Thự Lưu Trú.')}
            </p>
          </div>
        </div>
      </div>

      {/* Wellness Taxonomy Banner */}
      <div className="hsw-gov-banner">
        <ShieldCheck size={18} style={{ color: 'var(--accent-forest)', flexShrink: 0, marginTop: '2px' }} />
        <div>
          <strong style={{ color: 'var(--text-primary)' }}>
            {t('operations.masterData.taxonomyTitle', 'Chuẩn Hóa Danh Mục Viện Sức Khỏe Toàn Cầu (GWI)')}
          </strong>
          <span style={{ display: 'block', marginTop: '2px' }}>
            {t('operations.masterData.taxonomyDesc', 'Tất cả các gói, dịch vụ trị liệu và biệt thự tuân thủ thuật ngữ du lịch chăm sóc sức khỏe chuẩn hóa thay cho phân loại khách sạn thông thường.')}
          </span>
        </div>
      </div>

      {/* Category Tabs */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', borderBottom: '1px solid var(--border-medium)', marginBottom: 'var(--space-4)' }}>
        <button
          onClick={() => { setActiveTab('packages'); setSearchQuery(''); }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: 'var(--space-3) var(--space-5)',
            border: 'none',
            borderBottom: activeTab === 'packages' ? '2px solid var(--accent-forest)' : '2px solid transparent',
            backgroundColor: 'transparent',
            color: activeTab === 'packages' ? 'var(--accent-forest)' : 'var(--text-secondary)',
            fontWeight: activeTab === 'packages' ? 600 : 500,
            fontSize: 'var(--text-sm)',
            cursor: 'pointer'
          }}
        >
          <Calendar size={16} />
          {t('operations.masterData.tabPackages', 'Gói Nghỉ Dưỡng')} ({packages.length})
        </button>

        <button
          onClick={() => { setActiveTab('spa'); setSearchQuery(''); }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: 'var(--space-3) var(--space-5)',
            border: 'none',
            borderBottom: activeTab === 'spa' ? '2px solid var(--accent-forest)' : '2px solid transparent',
            backgroundColor: 'transparent',
            color: activeTab === 'spa' ? 'var(--accent-forest)' : 'var(--text-secondary)',
            fontWeight: activeTab === 'spa' ? 600 : 500,
            fontSize: 'var(--text-sm)',
            cursor: 'pointer'
          }}
        >
          <Sparkles size={16} />
          {t('operations.masterData.tabSpa', 'Danh Mục Spa & Trị Liệu')} ({spaServices.length})
        </button>

        <button
          onClick={() => { setActiveTab('villas'); setSearchQuery(''); }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: 'var(--space-3) var(--space-5)',
            border: 'none',
            borderBottom: activeTab === 'villas' ? '2px solid var(--accent-forest)' : '2px solid transparent',
            backgroundColor: 'transparent',
            color: activeTab === 'villas' ? 'var(--accent-forest)' : 'var(--text-secondary)',
            fontWeight: activeTab === 'villas' ? 600 : 500,
            fontSize: 'var(--text-sm)',
            cursor: 'pointer'
          }}
        >
          <Building size={16} />
          {t('operations.masterData.tabVillas', 'Phân Hạng Biệt Thự')} ({villas.length})
        </button>
      </div>

      {/* Search Toolbar */}
      <div className="hsw-gov-card" style={{ marginBottom: 'var(--space-4)', padding: 'var(--space-3) var(--space-4)' }}>
        <div className="hsw-filter-toolbar" style={{ margin: 0, justifyContent: 'space-between' }}>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('operations.masterData.searchPlaceholder', 'Tìm theo mã hoặc tên dữ liệu gốc...')}
              className="hsw-filter-input"
            />
          </div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
            {t('operations.masterData.authorityNotice', 'Thay đổi quản trị cập nhật danh mục dữ liệu gốc mô phỏng giao diện.')}
          </div>
        </div>
      </div>

      {/* Tab 1: Retreat Packages */}
      {activeTab === 'packages' && (
        <div className="hsw-gov-card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="hsw-gov-table">
            <thead>
              <tr>
                <th>{t('operations.masterData.colPackage', 'Gói Nghỉ Dưỡng')}</th>
                <th>{t('operations.masterData.colDuration', 'Thời Lượng')}</th>
                <th>{t('operations.masterData.colWellnessGoal', 'Mục Tiêu Sức Khỏe')}</th>
                <th>{t('operations.masterData.colSpaSessions', 'Spa Bao Gồm')}</th>
                <th>{t('operations.masterData.colBasePrice', 'Giá Cơ Bản (VND)')}</th>
                <th>{t('operations.masterData.colStatus', 'Trạng Thái')}</th>
                <th style={{ textAlign: 'right' }}>{t('common.actions.title', 'Thao Tác')}</th>
              </tr>
            </thead>
            <tbody>
              {packages
                .filter((p) => !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.code.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((pkg) => (
                  <tr key={pkg.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '14px', marginBottom: '4px' }}>{pkg.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <code style={{ background: '#f5f4f0', padding: '1px 6px', borderRadius: '4px', border: '1px solid #e5e2dc', color: 'var(--accent-forest)' }}>{pkg.code}</code>
                        <span>·</span>
                        <span>{pkg.id}</span>
                      </div>
                    </td>
                    <td style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                      {pkg.durationDays}N / {pkg.durationNights}Đ
                    </td>
                    <td style={{ fontSize: '13px', color: 'var(--accent-forest)', fontWeight: 500 }}>
                      {pkg.goal}
                    </td>
                    <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                      {pkg.includedSpaSessions} buổi
                    </td>
                    <td style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {formatVND(pkg.basePrice, i18n.language)}
                    </td>
                    <td>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '4px 10px',
                        borderRadius: 'var(--radius-pill)',
                        fontSize: '11px',
                        fontWeight: 600,
                        backgroundColor: pkg.status === 'active' ? '#7FFFD4' : '#f4f3ef',
                        color: pkg.status === 'active' ? '#004d40' : 'var(--text-muted)'
                      }}>
                        <CheckCircle2 size={13} />
                        {pkg.status === 'active' ? 'HOẠT ĐỘNG' : 'LƯU TRỮ'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={() => setEditingItem({
                          category: 'packages',
                          id: pkg.id,
                          name: pkg.name,
                          price: pkg.basePrice,
                          status: pkg.status
                        })}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          cursor: 'pointer',
                          border: '1px solid var(--border-subtle, #e5e2dc)',
                          backgroundColor: '#ffffff',
                          color: 'var(--text-primary)',
                          fontWeight: 500
                        }}
                      >
                        <Edit2 size={13} style={{ color: 'var(--accent-forest)' }} />
                        {t('common.actions.edit', 'Chỉnh Sửa')}
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 2: Spa Services */}
      {activeTab === 'spa' && (
        <div className="hsw-gov-card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="hsw-gov-table">
            <thead>
              <tr>
                <th>{t('operations.masterData.colTreatment', 'Tên Dịch Vụ Trị Liệu')}</th>
                <th>{t('operations.masterData.colCategory', 'Danh Mục')}</th>
                <th>{t('operations.masterData.colDuration', 'Thời Lượng')}</th>
                <th>{t('operations.masterData.colPractitioner', 'Kỹ Thuật Viên Yêu Cầu')}</th>
                <th>{t('operations.masterData.colBasePrice', 'Giá Cơ Bản (VND)')}</th>
                <th>{t('operations.masterData.colStatus', 'Trạng Thái')}</th>
                <th style={{ textAlign: 'right' }}>{t('common.actions.title', 'Thao Tác')}</th>
              </tr>
            </thead>
            <tbody>
              {spaServices
                .filter((s) => !searchQuery || s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.code.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((srv) => (
                  <tr key={srv.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '14px', marginBottom: '4px' }}>{srv.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <code style={{ background: '#f5f4f0', padding: '1px 6px', borderRadius: '4px', border: '1px solid #e5e2dc', color: 'var(--accent-forest)' }}>{srv.code}</code>
                        <span>·</span>
                        <span>{srv.id}</span>
                      </div>
                    </td>
                    <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                      {srv.category}
                    </td>
                    <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                        <Clock size={13} style={{ color: 'var(--text-muted)' }} />
                        {srv.durationMinutes} phút
                      </span>
                    </td>
                    <td style={{ fontSize: '13px', color: 'var(--accent-forest)', fontWeight: 500 }}>
                      {srv.practitionerType}
                    </td>
                    <td style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {formatVND(srv.basePrice, i18n.language)}
                    </td>
                    <td>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '4px 10px',
                        borderRadius: 'var(--radius-pill)',
                        fontSize: '11px',
                        fontWeight: 600,
                        backgroundColor: srv.status === 'active' ? '#7FFFD4' : '#f4f3ef',
                        color: srv.status === 'active' ? '#004d40' : 'var(--text-muted)'
                      }}>
                        <CheckCircle2 size={13} />
                        {srv.status === 'active' ? 'HOẠT ĐỘNG' : 'LƯU TRỮ'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={() => setEditingItem({
                          category: 'spa',
                          id: srv.id,
                          name: srv.name,
                          price: srv.basePrice,
                          status: srv.status
                        })}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          cursor: 'pointer',
                          border: '1px solid var(--border-subtle, #e5e2dc)',
                          backgroundColor: '#ffffff',
                          color: 'var(--text-primary)',
                          fontWeight: 500
                        }}
                      >
                        <Edit2 size={13} style={{ color: 'var(--accent-forest)' }} />
                        {t('common.actions.edit', 'Chỉnh Sửa')}
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 3: Villa Classifications */}
      {activeTab === 'villas' && (
        <div className="hsw-gov-card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="hsw-gov-table">
            <thead>
              <tr>
                <th>{t('operations.masterData.colVillaCat', 'Phân Hạng Biệt Thự')}</th>
                <th>{t('operations.masterData.colOccupancy', 'Sức Chứa Tối Đa')}</th>
                <th>{t('operations.masterData.colFeatures', 'Tiện Ích Sức Khỏe')}</th>
                <th>{t('operations.masterData.colCount', 'Số Lượng Biệt Thự')}</th>
                <th>{t('operations.masterData.colRate', 'Giá Chuẩn / Đêm (VND)')}</th>
                <th>{t('operations.masterData.colStatus', 'Trạng Thái')}</th>
                <th style={{ textAlign: 'right' }}>{t('common.actions.title', 'Thao Tác')}</th>
              </tr>
            </thead>
            <tbody>
              {villas
                .filter((v) => !searchQuery || v.name.toLowerCase().includes(searchQuery.toLowerCase()) || v.code.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((vil) => (
                  <tr key={vil.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '14px', marginBottom: '4px' }}>{vil.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <code style={{ background: '#f5f4f0', padding: '1px 6px', borderRadius: '4px', border: '1px solid #e5e2dc', color: 'var(--accent-forest)' }}>{vil.code}</code>
                        <span>·</span>
                        <span>{vil.id}</span>
                      </div>
                    </td>
                    <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                      {vil.maxOccupancy} {t('operations.masterData.customersUnit', 'Khách hàng')}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {vil.hasPrivatePool && (
                          <span style={{
                            fontSize: '11px',
                            fontWeight: 500,
                            color: 'var(--accent-forest, #4f5a50)',
                            backgroundColor: '#eef3ef',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            border: '1px solid #d8e5dc'
                          }}>
                            Bể bơi riêng
                          </span>
                        )}
                        {vil.hasTreatmentPavilion && (
                          <span style={{
                            fontSize: '11px',
                            fontWeight: 500,
                            color: 'var(--accent-olive, #6d7466)',
                            backgroundColor: '#f5f4ef',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            border: '1px solid #e5e3db'
                          }}>
                            Chòi trị liệu riêng
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {vil.totalVillasCount} căn biệt thự
                    </td>
                    <td style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {formatVND(vil.baseNightlyRate, i18n.language)}
                    </td>
                    <td>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '4px 10px',
                        borderRadius: 'var(--radius-pill)',
                        fontSize: '11px',
                        fontWeight: 600,
                        backgroundColor: vil.status === 'active' ? '#7FFFD4' : '#f4f3ef',
                        color: vil.status === 'active' ? '#004d40' : 'var(--text-muted)'
                      }}>
                        <CheckCircle2 size={13} />
                        {vil.status === 'active' ? 'HOẠT ĐỘNG' : 'LƯU TRỮ'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={() => setEditingItem({
                          category: 'villas',
                          id: vil.id,
                          name: vil.name,
                          price: vil.baseNightlyRate,
                          status: vil.status
                        })}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          cursor: 'pointer',
                          border: '1px solid var(--border-subtle, #e5e2dc)',
                          backgroundColor: '#ffffff',
                          color: 'var(--text-primary)',
                          fontWeight: 500
                        }}
                      >
                        <Edit2 size={13} style={{ color: 'var(--accent-forest)' }} />
                        {t('common.actions.edit', 'Chỉnh Sửa')}
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Modal */}
      {editingItem && (
        <div className="hsw-gov-modal-backdrop" onClick={() => setEditingItem(null)}>
          <div className="hsw-gov-modal" onClick={(e) => e.stopPropagation()}>
            <div className="hsw-gov-modal-header">
              <h3 className="hsw-gov-modal-title">
                <Edit2 size={18} style={{ color: 'var(--accent-forest)' }} />
                {t('operations.masterData.editRecordTitle', 'Chỉnh Sửa Bản Ghi Danh Mục Dữ Liệu Gốc')}
              </h3>
              <button
                onClick={() => setEditingItem(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <div>
                  <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: 'var(--space-1)' }}>
                    {t('operations.masterData.colRecordName', 'Tên Bản Ghi Chính Thức')}
                  </label>
                  <input
                    type="text"
                    required
                    value={editingItem.name}
                    onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                    className="hsw-filter-input"
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: 'var(--space-1)' }}>
                    {t('operations.masterData.colBenchmarkPrice', 'Giá Cơ Bản / Đơn Giá (VND)')}
                  </label>
                  <input
                    type="number"
                    required
                    step="50000"
                    min="0"
                    value={editingItem.price}
                    onChange={(e) => setEditingItem({ ...editingItem, price: Number(e.target.value) })}
                    className="hsw-filter-input"
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: 'var(--space-1)' }}>
                    {t('operations.masterData.colStatus', 'Trạng Thái Vòng Đời Danh Mục')}
                  </label>
                  <select
                    value={editingItem.status}
                    onChange={(e) => setEditingItem({ ...editingItem, status: e.target.value as 'active' | 'archived' })}
                    className="hsw-filter-select"
                    style={{ width: '100%' }}
                  >
                    <option value="active">{t('common.status.active', 'Đang Hoạt Động')}</option>
                    <option value="archived">{t('common.status.archived', 'Lưu Trữ / Tạm Ẩn')}</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-5)' }}>
                <Button variant="secondary" onClick={() => setEditingItem(null)}>
                  {t('common.actions.cancel', 'Hủy Bỏ')}
                </Button>
                <Button variant="primary" type="submit">
                  {t('common.actions.save', 'Lưu Thay Đổi')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
