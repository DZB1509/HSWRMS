import React, { useState, useEffect } from 'react';
import { X, Moon, DollarSign, Target, Utensils, Sparkles, Edit2, FileText } from 'lucide-react';
import type { RetreatPackageItem, PackageTreatmentMappingItem, PackageFnBEntitlementItem } from '../../types/spaManagement';
import { formatVND } from '../../i18n';
import { Button } from '../common/Button';

interface RetreatPackageDetailModalProps {
  isOpen: boolean;
  pkg: RetreatPackageItem | null;
  onClose: () => void;
  onEdit: (pkg: RetreatPackageItem) => void;
}

export const RetreatPackageDetailModal: React.FC<RetreatPackageDetailModalProps> = ({
  isOpen,
  pkg,
  onClose,
  onEdit,
}) => {
  const [liveTreatments, setLiveTreatments] = useState<PackageTreatmentMappingItem[]>([]);
  const [liveFnb, setLiveFnb] = useState<PackageFnBEntitlementItem | null>(null);

  useEffect(() => {
    if (pkg) {
      setLiveTreatments(pkg.treatmentMappings || []);
      setLiveFnb(pkg.fnbEntitlement || null);

      // Also try fetching latest live mapping from backend
      const identifier = pkg.dbId || pkg.packageCode || pkg.id;
      Promise.all([
        fetch(`http://localhost:8080/api/v1/retreat-packages/${encodeURIComponent(identifier)}/treatments`)
          .then(r => r.ok ? r.json() : null)
          .catch(() => null),
        fetch(`http://localhost:8080/api/v1/retreat-packages/${encodeURIComponent(identifier)}/fnb`)
          .then(r => r.ok ? r.json() : null)
          .catch(() => null)
      ]).then(([treatmentsRes, fnbRes]) => {
        if (treatmentsRes?.data && Array.isArray(treatmentsRes.data) && treatmentsRes.data.length > 0) {
          const mapped: PackageTreatmentMappingItem[] = treatmentsRes.data.map((item: any) => ({
            treatmentCode: item.spaTreatment?.treatmentCode || '',
            treatmentName: item.spaTreatment?.treatmentName || '',
            category: item.spaTreatment?.category || '',
            durationMinutes: item.spaTreatment?.durationMinutes || 60,
            includedSessions: item.includedSessions || 1,
            entitlementStatus: item.entitlementStatus || 'INCLUDED',
            notes: item.notes || ''
          }));
          setLiveTreatments(mapped);
        }
        if (fnbRes?.data) {
          setLiveFnb(fnbRes.data);
        }
      });
    }
  }, [pkg]);

  if (!isOpen || !pkg) return null;

  return (
    <div className="hsw-modal-backdrop" onClick={onClose}>
      <div
        className="hsw-modal-card"
        style={{ maxWidth: '800px', width: '92%', maxHeight: '90vh', overflowY: 'auto', padding: 0, background: 'var(--surface)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Hero image header */}
        <div style={{ position: 'relative', height: '220px', width: '100%', overflow: 'hidden' }}>
          <img
            src={pkg.image || 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80'}
            alt={pkg.packageName}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80';
            }}
          />
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)'
          }} />
          <button
            type="button"
            className="hsw-modal-close-btn"
            style={{ position: 'absolute', top: '16px', right: '16px', backgroundColor: 'rgba(0,0,0,0.5)', color: '#fff' }}
            onClick={onClose}
            aria-label="Đóng"
          >
            <X size={20} />
          </button>
          <div style={{ position: 'absolute', bottom: '16px', left: '20px', right: '20px', color: '#fff' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span style={{
                padding: '3px 10px',
                borderRadius: 'var(--radius-pill)',
                fontSize: '0.75rem',
                fontWeight: 700,
                backgroundColor: 'rgba(255,255,255,0.25)',
                backdropFilter: 'blur(4px)',
                letterSpacing: '0.04em'
              }}>
                {pkg.packageCode}
              </span>
              <span style={{
                padding: '3px 10px',
                borderRadius: 'var(--radius-pill)',
                fontSize: '0.75rem',
                fontWeight: 600,
                backgroundColor: pkg.status === 'ACTIVE' ? '#2E7D5A' : '#718096',
                color: '#fff'
              }}>
                {pkg.status === 'ACTIVE' ? 'Đang hoạt động' : 'Tạm dừng'}
              </span>
              <span style={{
                padding: '3px 10px',
                borderRadius: 'var(--radius-pill)',
                fontSize: '0.75rem',
                fontWeight: 600,
                backgroundColor: 'rgba(197, 160, 89, 0.4)',
                color: '#FFE29A',
                backdropFilter: 'blur(4px)'
              }}>
                {pkg.durationNights} Đêm Lưu Trú
              </span>
            </div>
            <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 700, textShadow: '0 2px 4px rgba(0,0,0,0.6)' }}>
              {pkg.packageName}
            </h2>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Key metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            <div style={{ padding: '12px', borderRadius: '10px', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                <Moon size={14} color="#2E7D5A" />
                Thời Lượng
              </div>
              <div style={{ fontSize: '1.15rem', fontWeight: 700, marginTop: '4px', color: 'var(--text-primary)' }}>
                {pkg.durationNights} Đêm ({pkg.durationNights + 1}N{pkg.durationNights}D)
              </div>
            </div>

            <div style={{ padding: '12px', borderRadius: '10px', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                <DollarSign size={14} color="#B7791F" />
                Giá Gói Trọn Gói
              </div>
              <div style={{ fontSize: '1.15rem', fontWeight: 700, marginTop: '4px', color: '#B7791F' }}>
                {formatVND(pkg.basePrice)}
              </div>
            </div>

            <div style={{ padding: '12px', borderRadius: '10px', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                <Target size={14} color="#3182CE" />
                Mục Tiêu Sức Khỏe
              </div>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, marginTop: '4px', color: 'var(--text-primary)' }}>
                {pkg.wellnessGoal}
              </div>
            </div>
          </div>

          {/* 1. Mapped Spa Treatments Table (Sheet 4) */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.92rem', fontWeight: 700, color: '#2E7D5A' }}>
                <Sparkles size={16} />
                Danh Mục Liệu Trình Trị Liệu Được Hưởng (Sheet 4 - Package Treatment Mapping)
              </div>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Tổng cộng: {liveTreatments.reduce((sum, t) => sum + (t.includedSessions || 0), 0)} buổi
              </span>
            </div>

            {liveTreatments.length > 0 ? (
              <div style={{ border: '1px solid var(--border-subtle)', borderRadius: '8px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-subtle)', textAlign: 'left' }}>
                      <th style={{ padding: '8px 12px', fontWeight: 600 }}>Mã & Tên Liệu Trình</th>
                      <th style={{ padding: '8px 12px', fontWeight: 600, width: '100px' }}>Phân Nhóm</th>
                      <th style={{ padding: '8px 12px', fontWeight: 600, width: '100px', textAlign: 'center' }}>Số Buổi</th>
                      <th style={{ padding: '8px 12px', fontWeight: 600 }}>Ghi Chú Nghiệp Vụ / Thời Lượng</th>
                    </tr>
                  </thead>
                  <tbody>
                    {liveTreatments.map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: idx < liveTreatments.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
                        <td style={{ padding: '8px 12px' }}>
                          <span style={{ fontWeight: 700, color: '#2E7D5A', marginRight: '6px' }}>{item.treatmentCode}</span>
                          {item.treatmentName}
                        </td>
                        <td style={{ padding: '8px 12px', color: 'var(--text-secondary)' }}>{item.category || 'Spa'}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                          <span style={{
                            padding: '2px 8px', borderRadius: '4px',
                            background: 'rgba(46, 125, 90, 0.12)', color: '#2E7D5A', fontWeight: 700
                          }}>
                            {item.includedSessions} buổi
                          </span>
                        </td>
                        <td style={{ padding: '8px 12px', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{item.notes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ padding: '12px 16px', background: 'var(--bg-secondary)', borderRadius: '8px', fontSize: '0.86rem', whiteSpace: 'pre-line' }}>
                {pkg.includedTreatments || 'Chưa cấu hình liệu trình'}
              </div>
            )}
          </div>

          {/* 2. Package F&B Entitlement (Sheet 5) */}
          <div style={{
            padding: '14px 16px',
            borderRadius: '10px',
            background: 'rgba(214, 158, 46, 0.08)',
            border: '1px solid rgba(214, 158, 46, 0.25)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#9E7A24', fontWeight: 700, fontSize: '0.92rem' }}>
                <Utensils size={16} />
                Định Mức Dinh Dưỡng & Ẩm Thực F&B (Module 4)
              </div>
              {liveFnb && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span style={{ padding: '2px 8px', borderRadius: '4px', background: '#fff', fontSize: '0.78rem', fontWeight: 600 }}>
                    Sáng: {liveFnb.breakfastCount}
                  </span>
                  <span style={{ padding: '2px 8px', borderRadius: '4px', background: '#fff', fontSize: '0.78rem', fontWeight: 600 }}>
                    Trưa: {liveFnb.lunchCount}
                  </span>
                  <span style={{ padding: '2px 8px', borderRadius: '4px', background: '#fff', fontSize: '0.78rem', fontWeight: 600 }}>
                    Tối: {liveFnb.dinnerCount}
                  </span>
                  <span style={{ padding: '2px 8px', borderRadius: '4px', background: '#9E7A24', color: '#fff', fontSize: '0.78rem', fontWeight: 700 }}>
                    Tổng: {liveFnb.totalMeals} bữa
                  </span>
                </div>
              )}
            </div>
            <div style={{ fontSize: '0.86rem', color: 'var(--text-primary)', lineHeight: 1.5, whiteSpace: 'pre-line' }}>
              {liveFnb?.dietaryNotes ? (
                <>
                  <div style={{ fontWeight: 600, color: '#9E7A24' }}>{liveFnb.menuPlan}</div>
                  <div style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>{liveFnb.dietaryNotes}</div>
                </>
              ) : (
                pkg.dietaryPlan || 'Thực đơn tiêu chuẩn resort'
              )}
            </div>
          </div>

          {/* 3. Extra Charge Policy (Rule 21) */}
          {pkg.extraChargePolicy && (
            <div style={{
              padding: '12px 16px',
              borderRadius: '8px',
              background: 'rgba(49, 130, 206, 0.08)',
              border: '1px solid rgba(49, 130, 206, 0.25)',
              fontSize: '0.84rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: '#2B6CB0', marginBottom: '4px' }}>
                <FileText size={15} />
                Quy Tắc Tính Phí Phát Sinh (Extra Charge Policy - Rule 21)
              </div>
              <div style={{ color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {pkg.extraChargePolicy}
              </div>
            </div>
          )}

          {/* Target Guest */}
          {pkg.targetGuest && (
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                Đối Tượng Khách Hàng Phù Hợp
              </div>
              <div style={{ fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                {pkg.targetGuest}
              </div>
            </div>
          )}

          {/* Footer actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
            <Button variant="secondary" onClick={onClose}>
              Đóng
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                onClose();
                onEdit(pkg);
              }}
            >
              <Edit2 size={15} style={{ marginRight: '6px' }} />
              Chỉnh Sửa Gói
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
