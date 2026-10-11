import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Shield,
  Check,
  Minus,
  Lock,
  Filter,
  Users2,
  Sparkles
} from 'lucide-react';
import { useGovernance } from '../../hooks/useGovernance';
import type { Role } from '../../types/auth';

const ROLES: { key: Role; labelKey: string; defaultLabel: string }[] = [
  { key: 'customer', labelKey: 'common.roles.customer', defaultLabel: 'Khách Hàng' },
  { key: 'receptionist', labelKey: 'common.roles.receptionist', defaultLabel: 'Lễ Tân' },
  { key: 'therapist', labelKey: 'common.roles.therapist', defaultLabel: 'Kỹ Thuật Viên / Yoga' },
  { key: 'fb_staff', labelKey: 'common.roles.fb_staff', defaultLabel: 'Nhân Viên Bếp / F&B' },
  { key: 'manager', labelKey: 'operations.sidebar.manager', defaultLabel: 'Quản Lý' },
  { key: 'admin', labelKey: 'operations.sidebar.admin', defaultLabel: 'Quản Trị Viên' }
];

export const PermissionMatrixPage: React.FC = () => {
  const { t } = useTranslation(['operations', 'common']);
  const { permissionRules, activeDelegations } = useGovernance();

  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [selectedCellInfo, setSelectedCellInfo] = useState<{
    capabilityName: string;
    roleName: string;
    status: string;
    isImmutable: boolean;
    reason?: string;
  } | null>(null);

  const categories = Array.from(new Set(permissionRules.map((r) => r.defaultCategory)));

  const filteredRules = filterCategory === 'all'
    ? permissionRules
    : permissionRules.filter((r) => r.defaultCategory === filterCategory);

  const activeManagerCapabilities = activeDelegations
    .filter((d) => d.delegateRole === 'manager')
    .flatMap((d) => d.capabilities);

  const handleCellClick = (
    ruleName: string,
    roleLabel: string,
    grantState: 'granted' | 'denied',
    isDelegable: boolean,
    isImmutable: boolean,
    reason?: string
  ) => {
    let statusText = grantState === 'granted' ? 'Được cấp quyền trực tiếp' : 'Bị từ chối / Giới hạn';
    if (roleLabel === 'Quản Lý' && isDelegable) {
      statusText = 'Có thể ủy quyền qua Quản trị ủy quyền (Màn hình S52)';
    }

    setSelectedCellInfo({
      capabilityName: ruleName,
      roleName: roleLabel,
      status: statusText,
      isImmutable,
      reason
    });
  };

  return (
    <div style={{ padding: 'var(--space-6) var(--space-8)' }}>
      {/* Header */}
      <div className="hsw-gov-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-1)' }}>
          <h1 className="hsw-gov-title">
            {t('operations.matrix.pageTitle', 'Ma Trận Phân Quyền Kiểm Soát Truy Cập Dựa Trên Vai Trò (RBAC)')}
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
          {t('operations.matrix.pageSubtitle', 'Phân bổ năng lực chức năng giữa các vai trò, ranh giới thẩm quyền vận hành và bất biến tối thiểu hóa dữ liệu nhạy cảm.')}
        </p>
      </div>

      {/* Legend & Privacy Boundary Notice */}
      <div className="hsw-gov-banner privacy">
        <Shield size={18} style={{ color: 'var(--accent-terracotta)', flexShrink: 0, marginTop: '2px' }} />
        <div>
          <strong style={{ color: 'var(--text-primary)' }}>
            {t('operations.matrix.legendTitle', 'Ma Trận Bảo Mật & Tối Thiểu Hóa Dữ Liệu Theo Luật Định')}
          </strong>
          <span style={{ display: 'block', marginTop: '2px' }}>
            {t('operations.matrix.legendDesc', 'Các ô có biểu tượng khóa thể hiện ranh giới bảo vệ dữ liệu bắt buộc không thể thương lượng theo Nghị định 13/2023/NĐ-CP, Luật Cư trú 2020 và kiểm soát tài chính. Quyền của Quản lý nghiêm ngặt chỉ đọc báo cáo trừ khi được ủy quyền.')}
          </span>
        </div>
      </div>

      {/* Toolbar: Category Filter & Legend Badges */}
      <div className="hsw-gov-card" style={{ marginBottom: 'var(--space-4)', padding: 'var(--space-3) var(--space-4)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Filter size={15} style={{ color: 'var(--text-secondary)' }} />
            <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-secondary)' }}>
              {t('operations.matrix.filterCategory', 'Lọc theo miền chức năng')}:
            </span>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="hsw-filter-select"
            >
              <option value="all">{t('operations.matrix.allDomains', 'Tất cả miền chức năng')} ({permissionRules.length})</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap', fontSize: '11px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span className="hsw-perm-badge granted"><Check size={11} /> Được Cấp Quyền</span>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span className="hsw-perm-badge denied"><Minus size={11} /> Từ Chối</span>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span className="hsw-perm-badge delegable"><Users2 size={11} /> Có Thể Ủy Quyền Cho Quản Lý</span>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent-terracotta)', fontWeight: 600 }}>
              <Lock size={12} /> Ranh Giới An Toàn Bất Biến
            </span>
          </div>
        </div>
      </div>

      {/* Matrix Table */}
      <div className="hsw-matrix-table-wrap">
        <table className="hsw-matrix-table">
          <thead>
            <tr>
              <th style={{ minWidth: '280px' }}>
                {t('operations.matrix.colCapability', 'Năng Lực / Miền Chức Năng Nghiệp Vụ')}
              </th>
              {ROLES.map((r) => (
                <th key={r.key} className="role-col" style={{ minWidth: '120px' }}>
                  {t(r.labelKey, r.defaultLabel)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredRules.map((rule) => {
              return (
                <tr key={rule.capability}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                      {rule.isImmutableBoundary && (
                        <span title={rule.defaultBoundaryReason} className="hsw-perm-lock">
                          <Lock size={14} />
                        </span>
                      )}
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 'var(--text-xs)' }}>
                          {t(rule.nameKey, rule.defaultName)}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: 1.3 }}>
                          {t(rule.descriptionKey, rule.defaultDescription)}
                        </div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                          Miền nghiệp vụ: <strong>{rule.defaultCategory}</strong> · Khóa: <code>{rule.capability}</code>
                        </div>
                      </div>
                    </div>
                  </td>

                  {ROLES.map((role) => {
                    const grantState = rule.grants[role.key];
                    const isManager = role.key === 'manager';
                    const isDelegable = isManager && !!rule.isDelegableToManager;
                    const isCurrentlyDelegated = isManager && activeManagerCapabilities.includes(rule.capability);

                    return (
                      <td
                        key={role.key}
                        className="role-col"
                        style={{ cursor: 'pointer' }}
                        onClick={() =>
                          handleCellClick(
                            rule.defaultName,
                            role.defaultLabel,
                            grantState,
                            isDelegable,
                            rule.isImmutableBoundary,
                            rule.defaultBoundaryReason
                          )
                        }
                      >
                        {grantState === 'granted' ? (
                          <span className="hsw-perm-badge granted">
                            <Check size={12} />
                            {t('operations.matrix.granted', 'Được Phép')}
                          </span>
                        ) : isCurrentlyDelegated ? (
                          <span className="hsw-perm-badge delegable" style={{ backgroundColor: '#dcf4f2' }}>
                            <Sparkles size={11} />
                            {t('operations.matrix.activeDelegated', 'Đang Ủy Quyền')}
                          </span>
                        ) : isDelegable ? (
                          <span className="hsw-perm-badge delegable">
                            <Users2 size={11} />
                            {t('operations.matrix.delegable', 'Có Thể Ủy Quyền')}
                          </span>
                        ) : (
                          <span className="hsw-perm-badge denied">
                            <Minus size={11} />
                            {t('operations.matrix.denied', 'Từ Chối')}
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Selected Cell Inspector Drawer / Card */}
      {selectedCellInfo && (
        <div className="hsw-gov-card" style={{ marginTop: 'var(--space-4)', backgroundColor: '#faf9f6' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--space-4)' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-1)' }}>
                {selectedCellInfo.isImmutable ? (
                  <Lock size={16} style={{ color: 'var(--accent-terracotta)' }} />
                ) : (
                  <Shield size={16} style={{ color: 'var(--accent-forest)' }} />
                )}
                <h4 style={{ margin: 0, fontSize: 'var(--text-sm)', fontWeight: 600 }}>
                  {selectedCellInfo.capabilityName} ↔ {selectedCellInfo.roleName}
                </h4>
                <span className="hsw-audit-cat">{selectedCellInfo.status}</span>
              </div>

              {selectedCellInfo.isImmutable && selectedCellInfo.reason && (
                <p style={{ margin: 'var(--space-1) 0 0 0', fontSize: 'var(--text-xs)', color: 'var(--accent-terracotta)', fontWeight: 500 }}>
                  {selectedCellInfo.reason}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() => setSelectedCellInfo(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
