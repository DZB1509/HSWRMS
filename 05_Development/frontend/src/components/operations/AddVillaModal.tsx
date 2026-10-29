import React, { useState } from 'react';
import {
  X,
  Home,
  Layers,
  MapPin,
  Bed,
  Users,
  Baby,
  Maximize2,
  Waves,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import type { PhysicalVillaItem, VillaCategoryItem, ResortZoneItem, VillaOperationalStatus } from '../../types/villaManagement';
import { Button } from '../common/Button';

interface AddVillaModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: VillaCategoryItem[];
  zones: ResortZoneItem[];
  existingVillaNumbers: string[];
  onAddVilla: (newVilla: PhysicalVillaItem) => void;
}

export const AddVillaModal: React.FC<AddVillaModalProps> = ({
  isOpen,
  onClose,
  categories,
  zones,
  existingVillaNumbers,
  onAddVilla
}) => {
  const [villaNumber, setVillaNumber] = useState('');
  const [categoryId, setCategoryId] = useState<number>(categories[0]?.id || 1);
  const [zoneName, setZoneName] = useState<string>(zones[0]?.zoneName || 'Garden Zone');
  const [floor, setFloor] = useState('Tầng 1 (Ground)');
  const [bedType, setBedType] = useState('1 King Bed (1.8m x 2.0m)');
  const [bedroomCount, setBedroomCount] = useState(1);
  const [maxAdults, setMaxAdults] = useState(2);
  const [maxChildren, setMaxChildren] = useState(1);
  const [areaSqm, setAreaSqm] = useState(95);
  const [hasPrivatePool, setHasPrivatePool] = useState(false);
  const [poolInfo, setPoolInfo] = useState('Không (Vườn thiền riêng)');
  const [status, setStatus] = useState<VillaOperationalStatus>('AVAILABLE');
  const [viewAndOperationalNotes, setViewAndOperationalNotes] = useState('Hướng vườn nhiệt đới sinh thái, yên tĩnh tuyệt đối');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const selectedCategory = categories.find((c) => c.id === categoryId) || categories[0];

  const handleCategoryChange = (catId: number) => {
    setCategoryId(catId);
    const cat = categories.find((c) => c.id === catId);
    if (cat) {
      setBedroomCount(cat.bedroomCount);
      if (cat.bedType) setBedType(cat.bedType);
      if (cat.maxAdults) setMaxAdults(cat.maxAdults);
      if (cat.maxChildren !== undefined) setMaxChildren(cat.maxChildren);
      setHasPrivatePool(cat.hasPrivatePool);
      setPoolInfo(cat.poolDescription || (cat.hasPrivatePool ? 'Hồ bơi riêng' : 'Không'));
      if (cat.hasPrivatePool) {
        setViewAndOperationalNotes(`Biệt thự hồ bơi riêng biệt lập, view ${cat.categoryName.toLowerCase()}`);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNumber = villaNumber.trim().toUpperCase();

    if (!cleanNumber) {
      setErrorMsg('Vui lòng nhập mã phòng/mã căn biệt thự');
      return;
    }
    if (existingVillaNumbers.includes(cleanNumber)) {
      setErrorMsg(`Mã biệt thự "${cleanNumber}" đã tồn tại trong hệ thống!`);
      return;
    }

    const maxOccupancy = Number(maxAdults) + Number(maxChildren);

    const newVilla: PhysicalVillaItem = {
      id: cleanNumber,
      villaNumber: cleanNumber,
      categoryId,
      categoryName: selectedCategory ? selectedCategory.categoryName : '1-Bedroom Garden Villa',
      zoneName,
      floor,
      bedroomCount: Number(bedroomCount),
      bedroomInfo: `${bedroomCount} PN (${bedType})`,
      bedType,
      maxAdults: Number(maxAdults),
      maxChildren: Number(maxChildren),
      maxOccupancy,
      areaSqm: Number(areaSqm),
      nightlyRate: ((selectedCategory?.basePrice ?? 4500000) + (selectedCategory?.priceModifier ?? 0)),
      hasPrivatePool,
      poolInfo: hasPrivatePool ? (poolInfo || 'Hồ bơi riêng') : 'Không (Vườn riêng)',
      status,
      viewAndOperationalNotes: viewAndOperationalNotes.trim() || 'Biệt thự chuẩn wellness sang trọng',
      image: selectedCategory?.image || 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80',
      amenities: selectedCategory?.highlights || ['Vườn thiền riêng biệt lập', 'Bồn tắm khoáng', 'Gần Spa Pavilion']
    };

    onAddVilla(newVilla);
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
        maxWidth: '820px',
        maxHeight: '92vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 24px 48px -12px rgba(0, 0, 0, 0.25)',
        border: '1px solid var(--border-subtle, #e5e2dc)',
        overflow: 'hidden'
      }}>
        {/* Modal Header */}
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
              <Home size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                Thêm Biệt Thự Vật Lý Mới (New Physical Villa)
              </h2>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
                Khai báo mã căn, hạng phòng, phân khu, loại giường và cấu hình sức chứa lưu trú chuẩn HSWRMS.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
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

          {/* Form Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '20px' }}>
            {/* Mã Căn / Villa Number */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: 'var(--text-primary)' }}>
                Mã Phòng / Căn Biệt Thự <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <Home size={15} style={{ position: 'absolute', left: '12px', top: '11px', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: V109, V207, V602..."
                  value={villaNumber}
                  onChange={(e) => { setVillaNumber(e.target.value); setErrorMsg(''); }}
                  style={{
                    width: '100%',
                    padding: '9px 12px 9px 36px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-medium, #d1cbbe)',
                    fontSize: '13px',
                    fontWeight: 600,
                    textTransform: 'uppercase'
                  }}
                />
              </div>
            </div>

            {/* Hạng Phòng / Category */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: 'var(--text-primary)' }}>
                Hạng Phòng / Phân Hạng Villa <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <Layers size={15} style={{ position: 'absolute', left: '12px', top: '11px', color: 'var(--text-muted)' }} />
                <select
                  value={categoryId}
                  onChange={(e) => handleCategoryChange(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '9px 12px 9px 36px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-medium, #d1cbbe)',
                    fontSize: '13px',
                    backgroundColor: '#ffffff'
                  }}
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.categoryName} ({c.bedroomCount} PN)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Phân Khu Cảnh Quan */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: 'var(--text-primary)' }}>
                Phân Khu Resort (Zone) <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <MapPin size={15} style={{ position: 'absolute', left: '12px', top: '11px', color: 'var(--text-muted)' }} />
                <select
                  value={zoneName}
                  onChange={(e) => setZoneName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px 9px 36px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-medium, #d1cbbe)',
                    fontSize: '13px',
                    backgroundColor: '#ffffff'
                  }}
                >
                  {zones.map((z) => (
                    <option key={z.id} value={z.zoneName}>
                      {z.zoneName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Tầng / Vị trí tầng */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: 'var(--text-primary)' }}>
                Tầng / Cao Độ Kiến Trúc
              </label>
              <select
                value={floor}
                onChange={(e) => setFloor(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-medium, #d1cbbe)',
                  fontSize: '13px',
                  backgroundColor: '#ffffff'
                }}
              >
                <option value="Tầng 1 (Ground Floor - Trệt)">Tầng 1 (Ground Floor - Trệt)</option>
                <option value="Tầng 2 (Upper Floor - Lầu 1)">Tầng 2 (Upper Floor - Lầu 1)</option>
                <option value="Tầng 3 (Penthouse / Peak)">Tầng 3 (Penthouse / Peak)</option>
                <option value="Biệt thự độc lập 2 tầng">Biệt thự độc lập 2 tầng</option>
              </select>
            </div>

            {/* Loại Giường */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: 'var(--text-primary)' }}>
                Loại Giường (Bed Type) <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <Bed size={15} style={{ position: 'absolute', left: '12px', top: '11px', color: 'var(--text-muted)' }} />
                <select
                  value={bedType}
                  onChange={(e) => setBedType(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px 9px 36px',
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
            </div>

            {/* Diện tích */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: 'var(--text-primary)' }}>
                Diện Tích Thực Tế (m²) <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <Maximize2 size={15} style={{ position: 'absolute', left: '12px', top: '11px', color: 'var(--text-muted)' }} />
                <input
                  type="number"
                  min="40"
                  max="2000"
                  value={areaSqm}
                  onChange={(e) => setAreaSqm(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '9px 12px 9px 36px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-medium, #d1cbbe)',
                    fontSize: '13px'
                  }}
                />
              </div>
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
                  Tổng Sức Chứa Lưu Trú
                </span>
                <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--accent-forest, #2d4a3e)' }}>
                  {Number(maxAdults) + Number(maxChildren)} Khách Hàng <span style={{ fontSize: '12px', fontWeight: 500, color: '#64748b' }}>({maxAdults} Lớn + {maxChildren} Trẻ)</span>
                </span>
              </div>
            </div>

            {/* Hồ bơi riêng */}
            <div style={{
              gridColumn: 'span 2',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              padding: '12px 14px',
              backgroundColor: hasPrivatePool ? '#f0f9ff' : '#f8fafc',
              border: hasPrivatePool ? '1px solid #bae6fd' : '1px solid #e2e8f0',
              borderRadius: '8px'
            }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}>
                <input
                  type="checkbox"
                  checked={hasPrivatePool}
                  onChange={(e) => {
                    setHasPrivatePool(e.target.checked);
                    if (e.target.checked && poolInfo.includes('Không')) {
                      setPoolInfo('Có (Hồ bơi riêng 30 - 45m²)');
                    }
                  }}
                  style={{ width: '16px', height: '16px', accentColor: 'var(--accent-forest)' }}
                />
                <Waves size={16} color={hasPrivatePool ? '#0284c7' : '#64748b'} />
                Biệt thự có Hồ Bơi Riêng (Private Pool)
              </label>

              {hasPrivatePool && (
                <input
                  type="text"
                  placeholder="Mô tả hồ bơi (ví dụ: Hồ bơi riêng tràn bờ 35m²)"
                  value={poolInfo}
                  onChange={(e) => setPoolInfo(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '6px 10px',
                    borderRadius: '6px',
                    border: '1px solid #bae6fd',
                    fontSize: '12px'
                  }}
                />
              )}
            </div>

            {/* Trạng thái vận hành ban đầu */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: 'var(--text-primary)' }}>
                Trạng Thái Ban Đầu
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as VillaOperationalStatus)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-medium, #d1cbbe)',
                  fontSize: '13px',
                  backgroundColor: '#ffffff'
                }}
              >
                <option value="AVAILABLE">Sẵn Sàng Đón Khách (AVAILABLE)</option>
                <option value="NEEDS_CLEANING">Cần Dọn Buồng Phòng (NEEDS_CLEANING)</option>
                <option value="MAINTENANCE">Bảo Trì Kỹ Thuật (MAINTENANCE)</option>
                <option value="INACTIVE">Ngừng (INACTIVE)</option>
              </select>
            </div>

            {/* Hướng nhìn & Ghi chú */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: 'var(--text-primary)' }}>
                Hướng Nhìn & Ghi Chú Vận Hành
              </label>
              <input
                type="text"
                value={viewAndOperationalNotes}
                onChange={(e) => setViewAndOperationalNotes(e.target.value)}
                placeholder="Ví dụ: View vườn sen, gần khu spa trị liệu..."
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

          {/* Live Preview Card */}
          <div style={{
            padding: '12px 16px',
            backgroundColor: '#faf8f5',
            borderRadius: '10px',
            border: '1px dashed #d1cbbe',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                fontSize: '14px',
                fontWeight: 700,
                color: 'var(--accent-forest, #2d4a3e)',
                backgroundColor: '#e8f0ec',
                padding: '4px 10px',
                borderRadius: '6px'
              }}>
                {villaNumber ? villaNumber.toUpperCase() : 'MÃ CĂN'}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                <strong>{selectedCategory?.categoryName}</strong> · {bedType} · {areaSqm} m²
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                fontSize: '11px',
                fontWeight: 600,
                padding: '3px 8px',
                borderRadius: '12px',
                backgroundColor: '#dcfce7',
                color: '#15803d'
              }}>
                <CheckCircle2 size={12} style={{ display: 'inline', marginRight: '4px' }} />
                {maxAdults} Lớn + {maxChildren} Trẻ
              </span>
              {hasPrivatePool && (
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#0369a1', backgroundColor: '#e0f2fe', padding: '3px 8px', borderRadius: '12px' }}>
                  Hồ bơi riêng
                </span>
              )}
            </div>
          </div>

          {/* Modal Footer Actions */}
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
            <Button type="submit" variant="primary" icon={<Sparkles size={14} />}>
              Lưu & Kích Hoạt Biệt Thự
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
