import React, { useState } from 'react';
import {
  X,
  Layers,
  Users,
  Baby,
  Waves,
  Sparkles,
  DollarSign,
  CheckCircle2
} from 'lucide-react';
import type { VillaCategoryItem } from '../../types/villaManagement';
import { Button } from '../common/Button';
import { formatVND } from '../../i18n';

interface AddVillaCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingCategories: VillaCategoryItem[];
  onAddCategory: (newCategory: VillaCategoryItem) => void;
}

export const AddVillaCategoryModal: React.FC<AddVillaCategoryModalProps> = ({
  isOpen,
  onClose,
  existingCategories,
  onAddCategory
}) => {
  const [categoryName, setCategoryName] = useState('');
  const [categoryCode, setCategoryCode] = useState('');
  const [bedroomCount, setBedroomCount] = useState(1);
  const [bedType, setBedType] = useState('1 King Bed (1.8m x 2.0m)');
  const [maxAdults, setMaxAdults] = useState(2);
  const [maxChildren, setMaxChildren] = useState(1);
  const [areaRange, setAreaRange] = useState('110 - 150 m²');
  const [priceModifier, setPriceModifier] = useState<number>(3000000);
  const [hasPrivatePool, setHasPrivatePool] = useState(true);
  const [poolDescription, setPoolDescription] = useState('Có (Hồ bơi riêng tràn bờ 30 - 45m²)');
  const [hasTreatmentPavilion, setHasTreatmentPavilion] = useState(false);
  const [featuresAndAmenities, setFeaturesAndAmenities] = useState('Bồn ngâm thảo mộc, hiên thiền tĩnh dưỡng, view thiên nhiên');
  const [eligiblePackages, setEligiblePackages] = useState('Detox & Thanh Lọc, Stress Relief, Trẻ Hóa Tế Bào');
  const [image, setImage] = useState('https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = categoryName.trim();
    if (!cleanName) {
      setErrorMsg('Vui lòng nhập tên hạng biệt thự');
      return;
    }

    const cleanCode = (categoryCode.trim() || `CAT-${cleanName.replace(/\s+/g, '-').toUpperCase()}`).toUpperCase();

    if (existingCategories.some((c) => c.categoryName.toLowerCase() === cleanName.toLowerCase())) {
      setErrorMsg(`Hạng biệt thự "${cleanName}" đã tồn tại!`);
      return;
    }

    const maxOccupancy = Number(maxAdults) + Number(maxChildren);
    const standardOccupancy = Number(maxAdults);

    const newCategory: VillaCategoryItem = {
      id: Date.now(),
      categoryName: cleanName,
      categoryCode: cleanCode,
      inventoryCount: 0,
      bedroomCount: Number(bedroomCount),
      bedType,
      bedroomDescription: `${bedroomCount} PN (${bedType})`,
      maxAdults: Number(maxAdults),
      maxChildren: Number(maxChildren),
      maxOccupancy,
      standardOccupancy,
      areaRange: areaRange.trim() || '100 - 150 m²',
      priceModifier: Number(priceModifier),
      hasPrivatePool,
      poolDescription: hasPrivatePool ? poolDescription : 'Không',
      featuresAndAmenities,
      eligiblePackages: eligiblePackages.split(',').map((p) => p.trim()).filter(Boolean),
      image: image.trim() || 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80',
      highlights: [
        bedType,
        hasPrivatePool ? 'Hồ bơi riêng' : 'Vườn thiền riêng',
        hasTreatmentPavilion ? 'Chòi trị liệu riêng' : 'Bồn khoáng thảo mộc'
      ]
    };

    onAddCategory(newCategory);
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(5px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1050,
      padding: 'var(--space-4)'
    }}>
      <div style={{
        backgroundColor: 'var(--bg-card, #ffffff)',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '840px',
        maxHeight: '92vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 24px 48px -12px rgba(0, 0, 0, 0.25)',
        border: '1px solid var(--border-subtle, #e5e2dc)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-subtle, #e5e2dc)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#faf8f5'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              backgroundColor: 'var(--accent-forest, #2d4a3e)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff'
            }}>
              <Layers size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                Thêm Hạng Biệt Thự & Khung Sản Phẩm Mới
              </h2>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
                Định nghĩa phân hạng phòng, số phòng ngủ, loại giường, sức chứa người lớn/trẻ em và giá chuẩn.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '6px' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} style={{ overflowY: 'auto', padding: '24px', flex: 1 }}>
          {errorMsg && (
            <div style={{
              padding: '10px 14px',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              color: '#991b1b',
              fontSize: '13px',
              marginBottom: '16px',
              fontWeight: 500
            }}>
              {errorMsg}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '20px' }}>
            {/* Tên Hạng */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: 'var(--text-primary)' }}>
                Tên Hạng Phòng / Biệt Thự <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Ví dụ: 2-Bedroom Lagoon Wellness Villa"
                value={categoryName}
                onChange={(e) => { setCategoryName(e.target.value); setErrorMsg(''); }}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-medium, #d1cbbe)',
                  fontSize: '13px',
                  fontWeight: 600
                }}
              />
            </div>

            {/* Mã Hạng Phòng */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: 'var(--text-primary)' }}>
                Mã Hạng Phòng (Room Category Code)
              </label>
              <input
                type="text"
                placeholder="Ví dụ: CAT-LAGOON-2BR"
                value={categoryCode}
                onChange={(e) => setCategoryCode(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-medium, #d1cbbe)',
                  fontSize: '13px',
                  textTransform: 'uppercase'
                }}
              />
            </div>

            {/* Số Phòng Ngủ */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: 'var(--text-primary)' }}>
                Số Phòng Ngủ (Bedrooms) <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <select
                value={bedroomCount}
                onChange={(e) => setBedroomCount(Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-medium, #d1cbbe)',
                  fontSize: '13px',
                  backgroundColor: '#ffffff'
                }}
              >
                <option value={1}>1 Phòng Ngủ (1 Bedroom)</option>
                <option value={2}>2 Phòng Ngủ (2 Bedrooms)</option>
                <option value={3}>3 Phòng Ngủ (3 Bedrooms)</option>
                <option value={4}>4 Phòng Ngủ (4 Bedrooms)</option>
                <option value={5}>5 Phòng Ngủ (5 Bedrooms)</option>
                <option value={6}>6 Phòng Ngủ (6 Bedrooms - Presidential)</option>
              </select>
            </div>

            {/* Cấu hình loại giường */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: 'var(--text-primary)' }}>
                Loại Giường Tiêu Chuẩn (Standard Bed Type) <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <select
                value={bedType}
                onChange={(e) => setBedType(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-medium, #d1cbbe)',
                  fontSize: '13px',
                  backgroundColor: '#ffffff'
                }}
              >
                <option value="1 King Bed (1.8m x 2.0m)">1 King Bed (1.8m x 2.0m)</option>
                <option value="1 Super King Bed (2.0m x 2.2m)">1 Super King Bed (2.0m x 2.2m)</option>
                <option value="2 Twin Beds (1.2m x 2.0m)">2 Twin Beds (1.2m x 2.0m)</option>
                <option value="1 King Bed + 2 Twin Beds">1 King Bed + 2 Twin Beds</option>
                <option value="2 King Beds + 2 Twin Beds">2 King Beds + 2 Twin Beds</option>
                <option value="3 King Beds + 4 Twin Beds">3 King Beds + 4 Twin Beds</option>
                <option value="4 Master Kings + 4 Queen Beds">4 Master Kings + 4 Queen Beds</option>
              </select>
            </div>

            {/* Sức chứa: Người lớn & Trẻ em */}
            <div style={{
              gridColumn: 'span 2',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1.2fr',
              gap: '12px',
              padding: '14px',
              backgroundColor: '#f8fafc',
              borderRadius: '10px',
              border: '1px solid #e2e8f0'
            }}>
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: 700, marginBottom: '4px', color: '#1e293b' }}>
                  <Users size={14} color="var(--accent-forest, #2d4a3e)" />
                  Tối Đa Người Lớn
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={maxAdults}
                  onChange={(e) => setMaxAdults(Math.max(1, Number(e.target.value)))}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    fontWeight: 600
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: 700, marginBottom: '4px', color: '#1e293b' }}>
                  <Baby size={14} color="#0284c7" />
                  Tối Đa Trẻ Em
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={maxChildren}
                  onChange={(e) => setMaxChildren(Math.max(0, Number(e.target.value)))}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    fontWeight: 600
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                  Tổng Sức Chứa Hạng Phòng
                </span>
                <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--accent-forest, #2d4a3e)' }}>
                  {Number(maxAdults) + Number(maxChildren)} Khách <span style={{ fontSize: '12px', fontWeight: 500, color: '#64748b' }}>({maxAdults} Người Lớn + {maxChildren} Trẻ Em)</span>
                </span>
              </div>
            </div>

            {/* Khoảng diện tích */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: 'var(--text-primary)' }}>
                Khoảng Diện Tích (m²)
              </label>
              <input
                type="text"
                value={areaRange}
                onChange={(e) => setAreaRange(e.target.value)}
                placeholder="Ví dụ: 120 - 180 m²"
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-medium, #d1cbbe)',
                  fontSize: '13px'
                }}
              />
            </div>

            {/* Giá phụ thu / Giá chuẩn */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: 'var(--text-primary)' }}>
                Giá Chuẩn / Phụ Thu Nâng Hạng (VND) <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <DollarSign size={15} style={{ position: 'absolute', left: '12px', top: '11px', color: 'var(--text-muted)' }} />
                <input
                  type="number"
                  min="0"
                  step="100000"
                  value={priceModifier}
                  onChange={(e) => setPriceModifier(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '9px 12px 9px 36px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-medium, #d1cbbe)',
                    fontSize: '13px',
                    fontWeight: 600
                  }}
                />
              </div>
            </div>

            {/* Tiện nghi đặc quyền: Hồ bơi & Chòi trị liệu */}
            <div style={{
              gridColumn: 'span 2',
              display: 'flex',
              gap: '24px',
              padding: '12px 14px',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              flexWrap: 'wrap'
            }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}>
                <input
                  type="checkbox"
                  checked={hasPrivatePool}
                  onChange={(e) => setHasPrivatePool(e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: 'var(--accent-forest)' }}
                />
                <Waves size={16} color="#0284c7" />
                Có Hồ Bơi Riêng
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}>
                <input
                  type="checkbox"
                  checked={hasTreatmentPavilion}
                  onChange={(e) => setHasTreatmentPavilion(e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: 'var(--accent-forest)' }}
                />
                <Sparkles size={16} color="#059669" />
                Có Chòi Trị Liệu Spa Riêng Tại Biệt Thự
              </label>
              {hasPrivatePool && (
                <input
                  type="text"
                  placeholder="Mô tả hồ bơi (ví dụ: Có hồ bơi riêng tràn bờ 30 - 45m²)"
                  value={poolDescription}
                  onChange={(e) => setPoolDescription(e.target.value)}
                  style={{
                    flex: 1,
                    minWidth: '220px',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    border: '1px solid #bae6fd',
                    fontSize: '12px'
                  }}
                />
              )}
            </div>

            {/* Tiện ích sức khỏe */}
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: 'var(--text-primary)' }}>
                Tiện Ích Sức Khỏe & Đặc Quyền Biệt Thự
              </label>
              <input
                type="text"
                value={featuresAndAmenities}
                onChange={(e) => setFeaturesAndAmenities(e.target.value)}
                placeholder="Bồn ngâm thảo dược, phòng xông hơi đá muối, hiên yoga..."
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-medium, #d1cbbe)',
                  fontSize: '13px'
                }}
              />
            </div>

            {/* Gói Retreat tương thích */}
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: 'var(--text-primary)' }}>
                Các Gói Nghỉ Dưỡng Retreat Tương Thích
              </label>
              <input
                type="text"
                value={eligiblePackages}
                onChange={(e) => setEligiblePackages(e.target.value)}
                placeholder="Detox, Stress Relief, Trẻ Hóa Tế Bào, Sống Khỏe..."
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-medium, #d1cbbe)',
                  fontSize: '13px'
                }}
              />
            </div>

            {/* Hình ảnh đại diện */}
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: 'var(--text-primary)' }}>
                URL Hình Ảnh Đại Diện Biệt Thự
              </label>
              <input
                type="text"
                value={image}
                onChange={(e) => setImage(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-medium, #d1cbbe)',
                  fontSize: '13px'
                }}
              />
            </div>
          </div>

          {/* Live Preview */}
          <div style={{
            padding: '14px 18px',
            backgroundColor: '#faf8f5',
            borderRadius: '10px',
            border: '1px dashed #d1cbbe',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px'
          }}>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--accent-forest, #2d4a3e)' }}>
                {categoryName || 'TÊN HẠNG BIỆT THỰ'}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                {bedroomCount} PN · {bedType} · Tối đa {Number(maxAdults) + Number(maxChildren)} khách ({maxAdults} Lớn, {maxChildren} Trẻ)
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Giá Phụ Thu / Đêm</div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {formatVND(priceModifier, 'vi')}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '10px',
            marginTop: '20px',
            paddingTop: '16px',
            borderTop: '1px solid var(--border-subtle, #e5e2dc)'
          }}>
            <Button type="button" variant="secondary" onClick={onClose}>
              Hủy Bỏ
            </Button>
            <Button type="submit" variant="primary" icon={<CheckCircle2 size={14} />}>
              Lưu & Ban Hành Hạng Biệt Thự
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
