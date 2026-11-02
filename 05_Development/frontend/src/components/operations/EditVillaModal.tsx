import React, { useState, useEffect } from 'react';
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
  ShieldCheck,
  DollarSign,
  AlertCircle
} from 'lucide-react';
import type {
  PhysicalVillaItem,
  VillaCategoryItem,
  ResortZoneItem,
  VillaOperationalStatus
} from '../../types/villaManagement';
import { Button } from '../common/Button';
import { formatVND } from '../../i18n';

interface EditVillaModalProps {
  isOpen: boolean;
  onClose: () => void;
  villa: PhysicalVillaItem | null;
  categories: VillaCategoryItem[];
  zones: ResortZoneItem[];
  onSaveVilla: (updatedVilla: PhysicalVillaItem, reason: string) => void;
}

export const EditVillaModal: React.FC<EditVillaModalProps> = ({
  isOpen,
  onClose,
  villa,
  categories,
  zones,
  onSaveVilla
}) => {
  const [categoryId, setCategoryId] = useState<number>(1);
  const [zoneName, setZoneName] = useState<string>('Garden Zone');
  const [floor, setFloor] = useState('Tầng 1 (Ground)');
  const [bedType, setBedType] = useState('1 King Bed (1.8m x 2.0m)');
  const [bedroomCount, setBedroomCount] = useState(1);
  const [maxAdults, setMaxAdults] = useState(2);
  const [maxChildren, setMaxChildren] = useState(1);
  const [areaSqm, setAreaSqm] = useState(95);
  const [nightlyRate, setNightlyRate] = useState<number>(4500000);
  const [hasPrivatePool, setHasPrivatePool] = useState(false);
  const [poolInfo, setPoolInfo] = useState('Không (Vườn thiền riêng)');
  const [status, setStatus] = useState<VillaOperationalStatus>('AVAILABLE');
  const [viewAndOperationalNotes, setViewAndOperationalNotes] = useState('');
  const [amenitiesText, setAmenitiesText] = useState('');
  const [reason, setReason] = useState('Cập nhật thông số kỹ thuật biệt thự theo tiêu chuẩn vận hành');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (villa) {
      setCategoryId(villa.categoryId || 1);
      setZoneName(villa.zoneName || (zones[0]?.zoneName ?? 'Garden Zone'));
      setFloor(villa.floor || 'Tầng 1 (Ground)');
      setBedType(villa.bedType || '1 King Bed (1.8m x 2.0m)');
      setBedroomCount(villa.bedroomCount || 1);
      setMaxAdults(villa.maxAdults || 2);
      setMaxChildren(villa.maxChildren !== undefined ? villa.maxChildren : 1);
      setAreaSqm(villa.areaSqm || 95);
      setNightlyRate(villa.nightlyRate || 4500000);
      setHasPrivatePool(Boolean(villa.hasPrivatePool));
      setPoolInfo(villa.poolInfo || (villa.hasPrivatePool ? 'Hồ bơi riêng' : 'Không (Vườn riêng)'));
      setStatus(villa.status || 'AVAILABLE');
      setViewAndOperationalNotes(villa.viewAndOperationalNotes || '');
      setAmenitiesText(
        Array.isArray(villa.amenities)
          ? villa.amenities.join(', ')
          : (villa.amenities || '')
      );
      setReason('');
      setErrorMsg('');
    }
  }, [villa, zones]);

  if (!isOpen || !villa) return null;

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
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (Number(maxAdults) < 1) {
      setErrorMsg('Số người lớn tối thiểu là 1');
      return;
    }
    if (Number(areaSqm) <= 0) {
      setErrorMsg('Diện tích villa phải lớn hơn 0 m²');
      return;
    }

    const maxOccupancy = Number(maxAdults) + Number(maxChildren);
    const parsedAmenities = amenitiesText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const updatedVilla: PhysicalVillaItem = {
      ...villa,
      categoryId,
      categoryName: selectedCategory ? selectedCategory.categoryName : villa.categoryName,
      zoneName,
      floor,
      bedroomCount: Number(bedroomCount),
      bedroomInfo: `${bedroomCount} PN (${bedType})`,
      bedType,
      maxAdults: Number(maxAdults),
      maxChildren: Number(maxChildren),
      maxOccupancy,
      areaSqm: Number(areaSqm),
      nightlyRate: Number(nightlyRate),
      hasPrivatePool,
      poolInfo: hasPrivatePool ? (poolInfo || 'Hồ bơi riêng biệt lập') : 'Không (Vườn riêng)',
      status,
      viewAndOperationalNotes: viewAndOperationalNotes.trim(),
      amenities: parsedAmenities.length > 0 ? parsedAmenities : villa.amenities
    };

    onSaveVilla(updatedVilla, reason.trim() || 'Cập nhật thông tin biệt thự');
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
      zIndex: 9999,
      padding: '16px'
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '720px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        overflow: 'hidden',
        border: '1px solid var(--border-subtle, #e5e2dc)'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-subtle, #e5e2dc)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'var(--bg-canvas, #faf9f6)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              backgroundColor: 'rgba(45, 74, 62, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-forest, #2d4a3e)'
            }}>
              <Home size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                Chỉnh Sửa Thông Tin Biệt Thự {villa.villaNumber}
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  {villa.categoryName} · {villa.zoneName}
                </span>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#15803d',
                  backgroundColor: '#dcfce7',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <ShieldCheck size={12} /> Thẩm Quyền Admin Toàn Phần
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} style={{ overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {errorMsg && (
            <div style={{
              padding: '12px 14px',
              backgroundColor: '#fee2e2',
              color: '#991b1b',
              borderRadius: '8px',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <AlertCircle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Row 1: Category & Zone */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                <Layers size={14} color="var(--accent-forest, #2d4a3e)" /> Hạng Biệt Thự (Villa Category)
              </label>
              <select
                value={categoryId}
                onChange={(e) => handleCategoryChange(Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-subtle, #e5e2dc)',
                  fontSize: '13px',
                  backgroundColor: '#ffffff'
                }}
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.categoryName} ({c.bedroomCount} PN - {c.maxOccupancy}K)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                <MapPin size={14} color="var(--accent-forest, #2d4a3e)" /> Phân Khu Cảnh Quan (Resort Zone)
              </label>
              <select
                value={zoneName}
                onChange={(e) => setZoneName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-subtle, #e5e2dc)',
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

          {/* Row 2: Floor & Area */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                Vị Trí Tầng / Khối Nhà
              </label>
              <input
                type="text"
                value={floor}
                onChange={(e) => setFloor(e.target.value)}
                placeholder="VD: Tầng 1 (Ground), Tầng 2..."
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-subtle, #e5e2dc)',
                  fontSize: '13px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                <Maximize2 size={14} color="var(--accent-forest, #2d4a3e)" /> Diện Tích Sử Dụng (m²)
              </label>
              <input
                type="number"
                min="30"
                max="2000"
                value={areaSqm}
                onChange={(e) => setAreaSqm(Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-subtle, #e5e2dc)',
                  fontSize: '13px',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          {/* Row 3: Bed Type & Capacity */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                <Bed size={14} color="var(--accent-forest, #2d4a3e)" /> Cấu Hình Giường
              </label>
              <input
                type="text"
                value={bedType}
                onChange={(e) => setBedType(e.target.value)}
                placeholder="VD: 1 King Bed, 2 Twin Beds..."
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-subtle, #e5e2dc)',
                  fontSize: '13px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                <Users size={14} color="var(--accent-forest, #2d4a3e)" /> Số Người Lớn Tối Đa
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={maxAdults}
                onChange={(e) => setMaxAdults(Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-subtle, #e5e2dc)',
                  fontSize: '13px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                <Baby size={14} color="var(--accent-forest, #2d4a3e)" /> Trẻ Em Đi Kèm
              </label>
              <input
                type="number"
                min="0"
                max="10"
                value={maxChildren}
                onChange={(e) => setMaxChildren(Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-subtle, #e5e2dc)',
                  fontSize: '13px',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          {/* Row 4: Nightly Rate */}
          <div style={{
            padding: '14px 16px',
            borderRadius: '10px',
            backgroundColor: 'var(--bg-canvas, #faf9f6)',
            border: '1px solid var(--border-subtle, #e5e2dc)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                <DollarSign size={14} color="var(--accent-forest, #2d4a3e)" /> Đơn Giá Thuê Đêm (Nightly Rate VND)
              </label>
              <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--accent-forest, #2d4a3e)' }}>
                {formatVND(nightlyRate)} / đêm
              </span>
            </div>
            <input
              type="number"
              step="50000"
              value={nightlyRate}
              onChange={(e) => setNightlyRate(Number(e.target.value))}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-subtle, #e5e2dc)',
                fontSize: '13px',
                backgroundColor: '#ffffff',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Row 5: Private Pool */}
          <div style={{
            padding: '14px 16px',
            borderRadius: '10px',
            backgroundColor: 'var(--bg-canvas, #faf9f6)',
            border: '1px solid var(--border-subtle, #e5e2dc)'
          }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', marginBottom: '8px' }}>
              <input
                type="checkbox"
                checked={hasPrivatePool}
                onChange={(e) => {
                  setHasPrivatePool(e.target.checked);
                  if (e.target.checked && poolInfo.startsWith('Không')) {
                    setPoolInfo('Hồ bơi riêng tràn bờ (Private Infinity Pool)');
                  }
                }}
                style={{ width: '16px', height: '16px', accentColor: 'var(--accent-forest, #2d4a3e)' }}
              />
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Waves size={16} color="#0369a1" /> Có hồ bơi riêng biệt lập (Private Pool)
              </span>
            </label>

            {hasPrivatePool && (
              <input
                type="text"
                value={poolInfo}
                onChange={(e) => setPoolInfo(e.target.value)}
                placeholder="VD: Hồ bơi riêng tràn bờ 35m², view đại dương..."
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-subtle, #e5e2dc)',
                  fontSize: '12px',
                  backgroundColor: '#ffffff',
                  boxSizing: 'border-box'
                }}
              />
            )}
          </div>

          {/* Row 6: View & Operational Notes */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
              Tầm Nhìn & Ghi Chú Vận Hành Biệt Thự:
            </label>
            <textarea
              rows={2}
              value={viewAndOperationalNotes}
              onChange={(e) => setViewAndOperationalNotes(e.target.value)}
              placeholder="VD: Tầm nhìn 180 độ biển Đông, đón bình minh, cực kỳ yên tĩnh..."
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-subtle, #e5e2dc)',
                fontSize: '12px',
                resize: 'vertical',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Row 7: Amenities */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
              Tiện Nghi & Đặc Quyền Nổi Bật (phân cách bằng dấu phẩy):
            </label>
            <input
              type="text"
              value={amenitiesText}
              onChange={(e) => setAmenitiesText(e.target.value)}
              placeholder="VD: Bồn tắm khoáng, Vườn thiền riêng, Butler 24/7, Gần Spa Pavilion..."
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-subtle, #e5e2dc)',
                fontSize: '12px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Row 8: Reason Note */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
              Lý Do Thay Đổi / Ghi Chú Audit Log Quản Trị:
            </label>
            <input
              type="text"
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="VD: Cập nhật thông số bàn giao sau đợt nâng cấp tiện nghi quý IV..."
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-subtle, #e5e2dc)',
                fontSize: '12px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Footer Actions */}
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
            paddingTop: '16px',
            borderTop: '1px solid var(--border-subtle, #e5e2dc)'
          }}>
            <Button type="button" variant="secondary" size="md" onClick={onClose}>
              Hủy Bỏ
            </Button>
            <Button type="submit" variant="primary" size="md" icon={<CheckCircle2 size={16} />}>
              Lưu Thay Đổi Biệt Thự
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
