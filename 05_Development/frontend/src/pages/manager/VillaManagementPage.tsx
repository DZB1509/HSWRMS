import React, { useState, useMemo, useEffect } from 'react';
import {
  Home,
  Layers,
  MapPin,
  Sparkles,
  Search,
  CheckCircle2,
  Clock,
  Wrench,
  AlertTriangle,
  Eye,
  Waves,
  Maximize2,
  Users,
  Bed,
  ShieldAlert,
  ShieldCheck,
  X,
  Crown,
  Trees,
  Mountain,
  Droplets,
  Plus,
  DollarSign,
  Package,
  Lock,
  Database,
  RefreshCw,
  Ban,
  Edit3,
  Trash2
} from 'lucide-react';
import {
  PHYSICAL_VILLAS,
  VILLA_CATEGORIES,
  RESORT_ZONES,
  VILLA_FUNCTIONAL_AREAS
} from '../../data/mockVillaData';
import { INITIAL_PACKAGES_MASTER } from '../../data/mockMasterData';
import type {
  PhysicalVillaItem,
  VillaCategoryItem,
  ResortZoneItem,
  VillaFunctionalAreaItem,
  VillaOperationalStatus
} from '../../types/villaManagement';
import type { RetreatPackageMaster } from '../../types/masterData';
import { useAuth } from '../../hooks/useAuth';
import { useGovernance } from '../../hooks/useGovernance';
import { useToast } from '../../components/common/Toast';
import { formatVND } from '../../i18n';
import { Button } from '../../components/common/Button';
import { AddVillaModal } from '../../components/operations/AddVillaModal';
import { EditVillaModal } from '../../components/operations/EditVillaModal';
import { AddVillaCategoryModal } from '../../components/operations/AddVillaCategoryModal';
import { AddRetreatPackageModal } from '../../components/operations/AddRetreatPackageModal';
import { EditVillaPriceModal } from '../../components/operations/EditVillaPriceModal';
import { EditPackagePriceModal } from '../../components/operations/EditPackagePriceModal';
import { EditCategoryPriceModal } from '../../components/operations/EditCategoryPriceModal';
import { getAuthToken } from '../../api/client/apiClient';

type TabKey = 'villas' | 'categories' | 'packages' | 'zones' | 'functional_areas';

export const VillaManagementPage: React.FC = () => {
  const { role } = useAuth();
  const { hasCapability, managerDelegatedCapabilities, logAuditEvent } = useGovernance();
  const { showToast } = useToast();

  const getAuthHeaders = () => {
    const token = getAuthToken();
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
  };

  const [activeTab, setActiveTab] = useState<TabKey>('villas');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Master state for villas, categories, packages, zones, functional areas
  const [villas, setVillas] = useState<PhysicalVillaItem[]>(PHYSICAL_VILLAS);
  const [categories, setCategories] = useState<VillaCategoryItem[]>(VILLA_CATEGORIES);
  const [packages, setPackages] = useState<RetreatPackageMaster[]>(INITIAL_PACKAGES_MASTER);
  const [zones, setZones] = useState<ResortZoneItem[]>(RESORT_ZONES);
  const [functionalAreas, setFunctionalAreas] = useState<VillaFunctionalAreaItem[]>(VILLA_FUNCTIONAL_AREAS);

  // Database sync indicator state
  const [isDbSynced, setIsDbSynced] = useState<boolean>(false);
  const [isLoadingDb, setIsLoadingDb] = useState<boolean>(false);

  // Fetch all inventory directly from backend Database on mount
  const fetchAllFromDatabase = async () => {
    setIsLoadingDb(true);
    try {
      const [villasRes, catsRes, pkgsRes, zonesRes, areasRes] = await Promise.all([
        fetch('http://localhost:8080/api/v1/villas').then((r) => r.ok ? r.json() : null),
        fetch('http://localhost:8080/api/v1/villa-categories').then((r) => r.ok ? r.json() : null),
        fetch('http://localhost:8080/api/v1/retreat-packages').then((r) => r.ok ? r.json() : null),
        fetch('http://localhost:8080/api/v1/resort-zones').then((r) => r.ok ? r.json() : null),
        fetch('http://localhost:8080/api/v1/villa-functional-areas').then((r) => r.ok ? r.json() : null)
      ]);

      if (villasRes?.data && Array.isArray(villasRes.data) && villasRes.data.length > 0) {
        const loadedVillas: PhysicalVillaItem[] = villasRes.data.map((item: any) => ({
          id: item.villaNumber,
          villaNumber: item.villaNumber,
          categoryId: item.villaCategory?.villaCategoryId || 1,
          categoryName: item.villaCategory?.categoryName || 'Villa',
          zoneName: item.zoneName || 'Garden Zone',
          floor: item.floor || 'Tầng 1 (Ground)',
          bedroomCount: item.villaCategory?.bedroomCount || 1,
          bedroomInfo: item.bedroomInfo || item.villaCategory?.bedroomDescription || '1 King Bed',
          bedType: item.bedType || item.villaCategory?.bedType || '1 King Bed (1.8m x 2.0m)',
          maxAdults: item.maxAdults ?? item.villaCategory?.maxAdults ?? 2,
          maxChildren: item.maxChildren ?? item.villaCategory?.maxChildren ?? 1,
          maxOccupancy: item.maxOccupancy ?? item.villaCategory?.maxOccupancy ?? 3,
          areaSqm: typeof item.areaSqm === 'number' ? item.areaSqm : Number(item.areaSqm) || 100,
          nightlyRate: typeof item.nightlyRate === 'number' ? item.nightlyRate : (Number(item.nightlyRate) || 4500000),
          hasPrivatePool: Boolean(item.hasPrivatePool),
          poolInfo: item.poolInfo || (item.hasPrivatePool ? 'Có hồ bơi riêng' : 'Không có hồ bơi'),
          status: (item.villaStatus || 'AVAILABLE') as VillaOperationalStatus,
          viewAndOperationalNotes: item.viewAndOperationalNotes || '',
          image: item.image || item.villaCategory?.image || 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
          amenities: typeof item.amenities === 'string'
            ? item.amenities.split(',').map((s: string) => s.trim())
            : (item.amenities || ['Vườn thiền riêng', 'Bồn tắm thảo dược', 'Wi-Fi 6 tốc độ cao', 'Hiên trà ngoài trời'])
        }));
        setVillas(loadedVillas);
        setIsDbSynced(true);
      }

      if (catsRes?.data && Array.isArray(catsRes.data) && catsRes.data.length > 0) {
        const loadedCats: VillaCategoryItem[] = catsRes.data.map((item: any) => ({
          id: item.villaCategoryId,
          categoryName: item.categoryName,
          categoryCode: `CAT-${item.villaCategoryId}`,
          inventoryCount: item.inventoryCount,
          bedroomCount: item.bedroomCount,
          bedType: item.bedType || '1 King Bed (1.8m x 2.0m)',
          bedroomDescription: item.bedroomDescription || `${item.bedroomCount} PN`,
          maxAdults: item.maxAdults ?? 2,
          maxChildren: item.maxChildren ?? 1,
          maxOccupancy: item.maxOccupancy,
          standardOccupancy: item.maxAdults ?? 2,
          areaRange: item.areaDescription || '100 m²',
          basePrice: typeof item.basePrice === 'number' ? item.basePrice : (Number(item.basePrice) || 4500000),
          priceModifier: typeof item.priceModifier === 'number' ? item.priceModifier : (Number(item.priceModifier) || 0),
          hasPrivatePool: Boolean(item.hasPrivatePool),
          poolDescription: item.poolDescription || '',
          featuresAndAmenities: item.featuresAndAmenities || '',
          eligiblePackages: typeof item.eligiblePackages === 'string'
            ? item.eligiblePackages.split(',').map((s: string) => s.trim())
            : (item.eligiblePackages || []),
          image: item.image || 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80',
          highlights: item.highlights ? item.highlights.split('|').map((h: string) => h.trim()) : ['Biệt lập thiên nhiên', 'Bồn tắm thảo mộc', 'Gần Spa Pavilion']
        }));
        setCategories(loadedCats);
      }

      if (pkgsRes?.data && Array.isArray(pkgsRes.data) && pkgsRes.data.length > 0) {
        const loadedPkgs: RetreatPackageMaster[] = pkgsRes.data.map((item: any) => ({
          id: `PKG-${item.retreatPackageId}`,
          packageName: item.packageName,
          wellnessGoal: item.wellnessGoal || 'Thư giãn & Phục hồi Thân Tâm',
          durationNights: item.durationNights || 3,
          basePrice: typeof item.basePrice === 'number' ? item.basePrice : (Number(item.basePrice) || 18500000),
          packageStatus: item.packageStatus === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE',
          includedTreatmentsCount: 4,
          mealsPerDay: 3,
          applicableCategories: ['1-Bedroom Garden Villa', '1-Bedroom Beachfront Pool Villa', '2-Bedroom Pool Villa']
        }));
        setPackages(loadedPkgs);
      }

      if (zonesRes?.data && Array.isArray(zonesRes.data) && zonesRes.data.length > 0) {
        const loadedZones: ResortZoneItem[] = zonesRes.data.map((item: any, idx: number) => ({
          id: item.zoneId || idx + 1,
          zoneName: item.zoneName,
          zoneCode: `ZONE-${item.zoneId || idx + 1}`,
          landscapeDescription: item.landscapeDescription || '',
          villaCount: item.villaCount || 0,
          villaNumbers: item.zoneName.includes('Garden')
            ? ['V101', 'V102', 'V103', 'V104', 'V105', 'V106', 'V107', 'V108']
            : item.zoneName.includes('Beachfront')
            ? ['V201', 'V202', 'V203', 'V204', 'V205', 'V206']
            : item.zoneName.includes('Lagoon')
            ? ['V301', 'V302', 'V303', 'V304', 'V305', 'V306']
            : item.zoneName.includes('Ocean')
            ? ['V401', 'V402', 'V403', 'V404']
            : item.zoneName.includes('Hillside')
            ? ['V501', 'V502']
            : ['V601'],
          applicableCategory: item.applicableCategory || '',
          relativePriceTier: item.relativePriceTier || 'Tiêu chuẩn',
          operationalAdvantages: item.operationalAdvantages || '',
          iconName: item.zoneName.includes('Beach') ? 'Waves' : item.zoneName.includes('Ocean') ? 'Mountain' : 'Trees',
          gradient: 'linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(16, 185, 129, 0.05) 100%)'
        }));
        setZones(loadedZones);
      }

      if (areasRes?.data && Array.isArray(areasRes.data) && areasRes.data.length > 0) {
        const loadedAreas: VillaFunctionalAreaItem[] = areasRes.data.map((item: any) => ({
          id: item.areaId,
          spaceGroup: item.spaceGroup,
          roomName: item.roomName,
          areaRangeSqm: item.areaRangeSqm,
          quantityIn1Br: item.quantityIn1Br,
          quantityIn23Br: item.quantityIn23Br,
          quantityInEstate46Br: item.quantityInEstate46Br,
          keyFurnishing: item.keyFurnishing,
          operationalPurpose: item.operationalPurpose
        }));
        setFunctionalAreas(loadedAreas);
      }
    } catch (err) {
      console.warn('Backend API connection warning, using local baseline data:', err);
    } finally {
      setIsLoadingDb(false);
    }
  };

  useEffect(() => {
    fetchAllFromDatabase();
  }, []);

  // Add modals state
  const [isAddVillaModalOpen, setIsAddVillaModalOpen] = useState(false);
  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);
  const [isAddPackageModalOpen, setIsAddPackageModalOpen] = useState(false);

  // Edit price modals state
  const [editingPriceVilla, setEditingPriceVilla] = useState<PhysicalVillaItem | null>(null);
  const [editingPricePackage, setEditingPricePackage] = useState<RetreatPackageMaster | null>(null);
  const [editingPriceCategory, setEditingPriceCategory] = useState<VillaCategoryItem | null>(null);

  // Edit villa full info modal state
  const [editingVilla, setEditingVilla] = useState<PhysicalVillaItem | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedZone, setSelectedZone] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [filterPoolOnly, setFilterPoolOnly] = useState(false);

  // Detail Modal / Drawer
  const [selectedVilla, setSelectedVilla] = useState<PhysicalVillaItem | null>(null);

  // Status Change State in Drawer
  const [pendingStatus, setPendingStatus] = useState<VillaOperationalStatus | ''>('');
  const [statusReason, setStatusReason] = useState('');

  // Permission Checks:
  // Admin has full rights; Manager has rights only if explicitly delegated
  const isAdmin = role === 'admin';
  const canManageInventory = isAdmin || hasCapability('manager', 'manage_villa_inventory') || managerDelegatedCapabilities.includes('manage_villa_inventory');
  const canManageMaintenance = isAdmin || hasCapability('manager', 'manage_villa_maintenance') || managerDelegatedCapabilities.includes('manage_villa_maintenance');
  const canManageCategories = isAdmin || hasCapability('manager', 'manage_villa_categories') || managerDelegatedCapabilities.includes('manage_villa_categories');
  const canManagePricing = isAdmin || hasCapability('manager', 'manage_pricing') || managerDelegatedCapabilities.includes('manage_pricing');

  // Filtered Villas
  const filteredVillas = useMemo(() => {
    return villas.filter((v) => {
      const matchSearch =
        v.villaNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.categoryName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.zoneName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.viewAndOperationalNotes.toLowerCase().includes(searchQuery.toLowerCase());

      const matchZone = selectedZone === 'all' || v.zoneName.includes(selectedZone);
      const matchCategory = selectedCategory === 'all' || v.categoryName === selectedCategory;
      const matchStatus = selectedStatus === 'all' || v.status === selectedStatus;
      const matchPool = !filterPoolOnly || v.hasPrivatePool;

      return matchSearch && matchZone && matchCategory && matchStatus && matchPool;
    });
  }, [villas, searchQuery, selectedZone, selectedCategory, selectedStatus, filterPoolOnly]);

  // Statistics
  const stats = useMemo(() => {
    const total = villas.length;
    const available = villas.filter((v) => v.status === 'AVAILABLE').length;
    const occupied = villas.filter((v) => v.status === 'OCCUPIED').length;
    const cleaning = villas.filter((v) => v.status === 'NEEDS_CLEANING').length;
    const maintenance = villas.filter((v) => v.status === 'MAINTENANCE').length;
    const inactive = villas.filter((v) => v.status === 'INACTIVE').length;
    const withPool = villas.filter((v) => v.hasPrivatePool).length;
    const occupancyRate = total > 0 ? Math.round((occupied / total) * 100) : 0;

    return { total, available, occupied, cleaning, maintenance, inactive, withPool, occupancyRate };
  }, [villas]);

  const handleOpenVillaDetail = (villa: PhysicalVillaItem) => {
    setSelectedVilla(villa);
    setPendingStatus(villa.status);
    setStatusReason('');
  };

  const handleUpdateVillaStatus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVilla || !pendingStatus) return;

    if (!canManageMaintenance && !canManageInventory) {
      showToast('Thao tác bị từ chối: Quản lý cần được Quản Trị Viên ủy quyền để thay đổi trạng thái biệt thự.', 'error');
      return;
    }

    setVillas((prev) =>
      prev.map((v) =>
        v.id === selectedVilla.id
          ? {
              ...v,
              status: pendingStatus,
              viewAndOperationalNotes: statusReason ? `${v.viewAndOperationalNotes} | [Ghi chú: ${statusReason}]` : v.viewAndOperationalNotes
            }
          : v
      )
    );

    // Sync status change directly to backend Database
    fetch(`http://localhost:8080/api/v1/villas/${selectedVilla.villaNumber}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status: pendingStatus })
    }).catch((err) => console.warn('Failed to sync villa status to DB:', err));

    logAuditEvent({
      actorId: role === 'admin' ? 'usr-admin-01' : 'usr-mgr-01',
      actorName: role === 'admin' ? 'Alexander Wright' : 'Sarah Jenkins',
      actorRole: role || 'manager',
      action: 'UPDATE',
      dataCategory: 'SECURITY_GOVERNANCE',
      targetRef: `VILLA-${selectedVilla.villaNumber}`,
      result: 'SUCCESS',
      detailsKey: 'operations.audit.villaStatusChanged',
      detailsFallback: `Đã chuyển trạng thái căn ${selectedVilla.villaNumber} sang ${pendingStatus}. Lý do: ${statusReason || 'Cập nhật vận hành thường kỳ'}`
    });

    showToast(`Đã cập nhật trạng thái biệt thự ${selectedVilla.villaNumber} thành công!`, 'success');
    setSelectedVilla(null);
  };

  const handleSaveVilla = async (updatedVilla: PhysicalVillaItem, reason: string) => {
    if (!canManageInventory) {
      showToast('Thao tác bị từ chối: Quản trị viên hoặc quyền quản lý kho biệt thự là bắt buộc.', 'error');
      return;
    }

    setVillas((prev) =>
      prev.map((v) => (v.id === updatedVilla.id || v.villaNumber === updatedVilla.villaNumber ? updatedVilla : v))
    );
    if (selectedVilla && (selectedVilla.id === updatedVilla.id || selectedVilla.villaNumber === updatedVilla.villaNumber)) {
      setSelectedVilla(updatedVilla);
    }

    try {
      const res = await fetch(`http://localhost:8080/api/v1/villas/${updatedVilla.villaNumber}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          villaCategoryId: updatedVilla.categoryId,
          zoneName: updatedVilla.zoneName,
          floor: updatedVilla.floor,
          bedroomInfo: updatedVilla.bedroomInfo,
          bedType: updatedVilla.bedType,
          maxAdults: updatedVilla.maxAdults,
          maxChildren: updatedVilla.maxChildren,
          maxOccupancy: updatedVilla.maxOccupancy,
          areaSqm: updatedVilla.areaSqm,
          nightlyRate: updatedVilla.nightlyRate,
          hasPrivatePool: updatedVilla.hasPrivatePool,
          poolInfo: updatedVilla.poolInfo,
          viewAndOperationalNotes: updatedVilla.viewAndOperationalNotes,
          villaStatus: updatedVilla.status,
          image: updatedVilla.image,
          amenities: Array.isArray(updatedVilla.amenities) ? updatedVilla.amenities.join(', ') : updatedVilla.amenities
        })
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.message || `Lỗi máy chủ (${res.status})`);
      }
      showToast(`Đã cập nhật thông tin biệt thự ${updatedVilla.villaNumber} vào CSDL thành công!`, 'success');
    } catch (err: any) {
      console.warn('Backend sync warning:', err);
      showToast(`Đã cập nhật thông tin biệt thự ${updatedVilla.villaNumber}!`, 'success');
    }

    logAuditEvent({
      actorId: role === 'admin' ? 'usr-admin-01' : 'usr-mgr-01',
      actorName: role === 'admin' ? 'Alexander Wright' : 'Sarah Jenkins',
      actorRole: role || 'manager',
      action: 'UPDATE',
      dataCategory: 'SECURITY_GOVERNANCE',
      targetRef: `VILLA-${updatedVilla.villaNumber}`,
      result: 'SUCCESS',
      detailsKey: 'operations.audit.villaUpdated',
      detailsFallback: `Đã chỉnh sửa thông tin biệt thự ${updatedVilla.villaNumber}: ${updatedVilla.categoryName}, ${updatedVilla.zoneName}. Lý do: ${reason}`
    });
  };

  const handleDeleteVilla = async (villaNumber: string) => {
    if (!isAdmin) {
      showToast('Chỉ Quản Trị Viên (Admin) mới có thẩm quyền xóa hoặc ngừng kích hoạt căn biệt thự.', 'error');
      return;
    }

    if (!window.confirm(`Xác nhận xóa biệt thự ${villaNumber} khỏi hệ thống kho phòng?`)) {
      return;
    }

    setVillas((prev) => prev.filter((v) => v.villaNumber !== villaNumber));
    if (selectedVilla?.villaNumber === villaNumber) {
      setSelectedVilla(null);
    }

    try {
      const res = await fetch(`http://localhost:8080/api/v1/villas/${villaNumber}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.message || `Lỗi máy chủ (${res.status})`);
      }
      showToast(`Đã xóa biệt thự ${villaNumber} thành công!`, 'success');
    } catch (err: any) {
      console.warn('Backend sync warning:', err);
      showToast(`Đã xóa căn ${villaNumber} khỏi danh sách hiển thị.`, 'info');
    }

    logAuditEvent({
      actorId: 'usr-admin-01',
      actorName: 'Alexander Wright',
      actorRole: 'admin',
      action: 'DELETE',
      dataCategory: 'SECURITY_GOVERNANCE',
      targetRef: `VILLA-${villaNumber}`,
      result: 'SUCCESS',
      detailsKey: 'operations.audit.villaDeleted',
      detailsFallback: `Đã xóa biệt thự ${villaNumber} khỏi kho resort`
    });
  };

  const handleAddVilla = async (newVilla: PhysicalVillaItem) => {
    try {
      const res = await fetch('http://localhost:8080/api/v1/villas', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          villaNumber: newVilla.villaNumber,
          villaCategoryId: newVilla.categoryId,
          zoneName: newVilla.zoneName,
          floor: newVilla.floor,
          bedroomInfo: newVilla.bedroomInfo,
          bedType: newVilla.bedType,
          maxAdults: newVilla.maxAdults,
          maxChildren: newVilla.maxChildren,
          maxOccupancy: newVilla.maxOccupancy,
          areaSqm: newVilla.areaSqm,
          nightlyRate: newVilla.nightlyRate,
          hasPrivatePool: newVilla.hasPrivatePool,
          poolInfo: newVilla.poolInfo,
          viewAndOperationalNotes: newVilla.viewAndOperationalNotes,
          villaStatus: newVilla.status,
          image: newVilla.image,
          amenities: Array.isArray(newVilla.amenities) ? newVilla.amenities.join(', ') : newVilla.amenities
        })
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || `Lỗi máy chủ (${res.status})`);
      }

      // Reload all state directly from database to ensure complete consistency
      await fetchAllFromDatabase();

      logAuditEvent({
        actorId: role === 'admin' ? 'usr-admin-01' : 'usr-mgr-01',
        actorName: role === 'admin' ? 'Alexander Wright' : 'Sarah Jenkins',
        actorRole: role || 'manager',
        action: 'CREATE',
        dataCategory: 'SECURITY_GOVERNANCE',
        targetRef: `VILLA-${newVilla.villaNumber}`,
        result: 'SUCCESS',
        detailsKey: 'operations.audit.villaCreated',
        detailsFallback: `Đã khởi tạo biệt thự vật lý mới ${newVilla.villaNumber} (${newVilla.categoryName}, ${newVilla.bedroomInfo}, Tối đa: ${newVilla.maxOccupancy} khách) vào CSDL SQL Server`
      });

      showToast(`Đã thêm thành công biệt thự ${newVilla.villaNumber} vào CSDL SQL Server!`, 'success');
    } catch (err: any) {
      console.error('Lỗi lưu biệt thự vào CSDL:', err);
      showToast(`Không thể lưu biệt thự vào CSDL: ${err.message}`, 'error');
    }
  };

  const handleAddCategory = async (newCategory: VillaCategoryItem) => {
    try {
      const res = await fetch('http://localhost:8080/api/v1/villa-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryName: newCategory.categoryName,
          maxOccupancy: newCategory.maxOccupancy,
          maxAdults: newCategory.maxAdults,
          maxChildren: newCategory.maxChildren,
          bedType: newCategory.bedType,
          priceModifier: newCategory.priceModifier,
          inventoryCount: newCategory.inventoryCount,
          bedroomCount: newCategory.bedroomCount,
          bedroomDescription: newCategory.bedroomDescription,
          areaDescription: newCategory.areaRange,
          hasPrivatePool: newCategory.hasPrivatePool,
          poolDescription: newCategory.poolDescription,
          featuresAndAmenities: newCategory.featuresAndAmenities,
          eligiblePackages: Array.isArray(newCategory.eligiblePackages) ? newCategory.eligiblePackages.join(', ') : newCategory.eligiblePackages
        })
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || `Lỗi máy chủ (${res.status})`);
      }

      await fetchAllFromDatabase();

      logAuditEvent({
        actorId: role === 'admin' ? 'usr-admin-01' : 'usr-mgr-01',
        actorName: role === 'admin' ? 'Alexander Wright' : 'Sarah Jenkins',
        actorRole: role || 'manager',
        action: 'CREATE',
        dataCategory: 'SECURITY_GOVERNANCE',
        targetRef: `CATEGORY-${newCategory.categoryName}`,
        result: 'SUCCESS',
        detailsKey: 'operations.audit.villaCategoryCreated',
        detailsFallback: `Đã ban hành hạng biệt thự mới ${newCategory.categoryName} (${newCategory.bedroomCount} PN, ${newCategory.bedType}, Tối đa: ${newCategory.maxAdults} Lớn + ${newCategory.maxChildren} Trẻ) vào CSDL`
      });

      showToast(`Đã ban hành hạng biệt thự mới "${newCategory.categoryName}" vào CSDL thành công!`, 'success');
    } catch (err: any) {
      console.error('Lỗi ban hành hạng biệt thự:', err);
      showToast(`Không thể lưu hạng biệt thự vào CSDL: ${err.message}`, 'error');
    }
  };

  const handleSaveVillaPrice = async (villaId: string, newRate: number, reason: string) => {
    if (!canManagePricing) {
      showToast('Thao tác bị từ chối: Quản lý cần được Quản Trị Viên ủy quyền để sửa giá biệt thự.', 'error');
      return;
    }

    setVillas((prev) =>
      prev.map((v) => (v.id === villaId ? { ...v, nightlyRate: newRate } : v))
    );
    if (selectedVilla && selectedVilla.id === villaId) {
      setSelectedVilla((prev) => (prev ? { ...prev, nightlyRate: newRate } : null));
    }

    // Persist to Database via backend API
    try {
      const res = await fetch(`http://localhost:8080/api/v1/villas/${villaId}/price`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ nightlyRate: newRate })
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.message || `Lỗi máy chủ (${res.status})`);
      }
      showToast(`Đã lưu giá thuê biệt thự ${villaId} vào cơ sở dữ liệu thành công (${formatVND(newRate)}/đêm)!`, 'success');
    } catch (err: any) {
      console.warn('Failed to persist villa price to DB:', err);
      showToast(`Không thể lưu vào CSDL: ${err.message || 'Lỗi mạng'}`, 'error');
    }

    logAuditEvent({
      actorId: role === 'admin' ? 'usr-admin-01' : 'usr-mgr-01',
      actorName: role === 'admin' ? 'Alexander Wright' : 'Sarah Jenkins',
      actorRole: role || 'manager',
      action: 'UPDATE',
      dataCategory: 'SECURITY_GOVERNANCE',
      targetRef: `VILLA-${villaId}`,
      result: 'SUCCESS',
      detailsKey: 'operations.audit.villaPriceUpdated',
      detailsFallback: `Đã cập nhật giá thuê đêm biệt thự ${villaId} thành ${formatVND(newRate)}/đêm. Lý do: ${reason}`
    });
  };

  const handleSavePackagePrice = async (pkgId: string, newBasePrice: number, reason: string) => {
    if (!canManagePricing) {
      showToast('Thao tác bị từ chối: Quản lý cần được Quản Trị Viên ủy quyền để sửa giá gói nghỉ dưỡng.', 'error');
      return;
    }

    setPackages((prev) =>
      prev.map((p) => (p.id === pkgId ? { ...p, basePrice: newBasePrice } : p))
    );

    // Extract numeric ID if pkgId is PKG-1 or similar
    const numId = pkgId.replace(/\D/g, '') || pkgId;
    try {
      const res = await fetch(`http://localhost:8080/api/v1/retreat-packages/${encodeURIComponent(numId)}/price`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ basePrice: newBasePrice })
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.message || `Lỗi máy chủ (${res.status})`);
      }
      showToast(`Đã lưu đơn giá gói nghỉ dưỡng vào cơ sở dữ liệu thành công!`, 'success');
    } catch (err: any) {
      console.warn('Failed to persist package price to DB:', err);
      showToast(`Không thể lưu vào CSDL: ${err.message || 'Lỗi mạng'}`, 'error');
    }

    logAuditEvent({
      actorId: role === 'admin' ? 'usr-admin-01' : 'usr-mgr-01',
      actorName: role === 'admin' ? 'Alexander Wright' : 'Sarah Jenkins',
      actorRole: role || 'manager',
      action: 'UPDATE',
      dataCategory: 'SECURITY_GOVERNANCE',
      targetRef: `PACKAGE-${pkgId}`,
      result: 'SUCCESS',
      detailsKey: 'operations.audit.packagePriceUpdated',
      detailsFallback: `Đã cập nhật đơn giá gói ${pkgId} thành ${formatVND(newBasePrice)}. Lý do: ${reason}`
    });
  };

  const handleSaveCategoryPrice = async (
    categoryId: number,
    newBasePrice: number,
    newModifier: number,
    reason: string
  ) => {
    if (!canManagePricing) {
      showToast('Thao tác bị từ chối: Quản lý cần được Quản Trị Viên ủy quyền để sửa biểu giá hạng phòng.', 'error');
      return;
    }

    setCategories((prev) =>
      prev.map((c) =>
        c.id === categoryId
          ? { ...c, basePrice: newBasePrice, priceModifier: newModifier }
          : c
      )
    );

    // Persist to Database via backend API
    try {
      const res = await fetch(`http://localhost:8080/api/v1/villa-categories/${categoryId}/price`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ basePrice: newBasePrice, priceModifier: newModifier })
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.message || `Lỗi máy chủ (${res.status})`);
      }
      showToast(`Đã lưu biểu giá và phụ thu hạng biệt thự vào cơ sở dữ liệu thành công!`, 'success');
    } catch (err: any) {
      console.warn('Failed to persist category price to DB:', err);
      showToast(`Không thể lưu vào CSDL: ${err.message || 'Lỗi mạng'}`, 'error');
    }

    logAuditEvent({
      actorId: role === 'admin' ? 'usr-admin-01' : 'usr-mgr-01',
      actorName: role === 'admin' ? 'Alexander Wright' : 'Sarah Jenkins',
      actorRole: role || 'manager',
      action: 'UPDATE',
      dataCategory: 'SECURITY_GOVERNANCE',
      targetRef: `CATEGORY-${categoryId}`,
      result: 'SUCCESS',
      detailsKey: 'operations.audit.categoryPriceUpdated',
      detailsFallback: `Đã điều chỉnh biểu giá hạng phòng ID ${categoryId}: Giá chuẩn ${formatVND(newBasePrice)}/đêm, Phụ thu ${formatVND(newModifier)}. Lý do: ${reason}`
    });
  };

  const handleAddPackage = (newPkg: RetreatPackageMaster) => {
    if (!canManageInventory && !canManageCategories) {
      showToast('Thao tác bị từ chối: Quản lý cần được Quản Trị Viên ủy quyền để tạo gói nghỉ dưỡng.', 'error');
      return;
    }

    setPackages((prev) => [newPkg, ...prev]);

    fetch('http://localhost:8080/api/v1/retreat-packages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: newPkg.code,
        name: newPkg.name,
        durationDays: newPkg.durationDays,
        durationNights: newPkg.durationNights,
        goal: newPkg.goal,
        includedSpaSessions: newPkg.includedSpaSessions,
        basePrice: newPkg.basePrice,
        description: newPkg.description
      })
    }).catch(() => {});

    logAuditEvent({
      actorId: role === 'admin' ? 'usr-admin-01' : 'usr-mgr-01',
      actorName: role === 'admin' ? 'Alexander Wright' : 'Sarah Jenkins',
      actorRole: role || 'manager',
      action: 'CREATE',
      dataCategory: 'SECURITY_GOVERNANCE',
      targetRef: `PACKAGE-${newPkg.code}`,
      result: 'SUCCESS',
      detailsKey: 'operations.audit.packageCreated',
      detailsFallback: `Đã ban hành gói nghỉ dưỡng mới ${newPkg.name} (${newPkg.code}, Đơn giá: ${formatVND(newPkg.basePrice)})`
    });

    showToast(`Đã ban hành gói nghỉ dưỡng "${newPkg.name}" thành công!`, 'success');
  };

  const getStatusBadge = (status: VillaOperationalStatus) => {
    switch (status) {
      case 'AVAILABLE':
        return {
          label: 'Sẵn Sàng Đón Khách',
          bg: '#e8f8f0',
          text: '#0d7a46',
          border: '#a3e6c0',
          icon: <CheckCircle2 size={12} />
        };
      case 'OCCUPIED':
        return {
          label: 'Đang Có Khách Cư Trú',
          bg: '#eff6ff',
          text: '#1e40af',
          border: '#bfdbfe',
          icon: <Users size={12} />
        };
      case 'NEEDS_CLEANING':
        return {
          label: 'Chờ Housekeeping Dọn',
          bg: '#fef9c3',
          text: '#854d0e',
          border: '#fde047',
          icon: <Clock size={12} />
        };
      case 'MAINTENANCE':
        return {
          label: 'Đang Bảo Trì Kỹ Thuật',
          bg: '#fff7ed',
          text: '#c2410c',
          border: '#fed7aa',
          icon: <Wrench size={12} />
        };
      case 'INACTIVE':
        return {
          label: 'Ngừng',
          bg: '#fee2e2',
          text: '#991b1b',
          border: '#f87171',
          icon: <Ban size={12} />
        };
      default:
        return {
          label: status,
          bg: '#f3f4f6',
          text: '#374151',
          border: '#d1d5db',
          icon: <AlertTriangle size={12} />
        };
    }
  };

  return (
    <div style={{ padding: 'var(--space-6) var(--space-8)', maxWidth: '1600px', margin: '0 auto' }}>
      {/* 1. Header & Title */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: 'var(--space-4)',
        marginBottom: 'var(--space-6)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-1)' }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '3px 10px',
              borderRadius: 'var(--radius-pill)',
              backgroundColor: 'var(--accent-sand-soft, #f4efe9)',
              color: 'var(--accent-forest, #2d4a3e)',
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.05em',
              textTransform: 'uppercase'
            }}>
              <Home size={12} />
              Quản Trị Cơ Sở Lưu Trú Resort (Module 6)
            </span>

            {/* Inventory Delegation Clearance Pill */}
            {canManageInventory ? (
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '3px 10px',
                borderRadius: 'var(--radius-pill)',
                backgroundColor: '#e6f7ef',
                color: '#087443',
                fontSize: '11px',
                fontWeight: 600,
                border: '1px solid #b6ebd0'
              }}>
                <ShieldCheck size={12} />
                {isAdmin ? 'Thẩm Quyền Admin Toàn Phần' : 'Được Admin Cấp Quyền Kho Biệt Thự'}
              </span>
            ) : (
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '3px 10px',
                borderRadius: 'var(--radius-pill)',
                backgroundColor: '#f3f4f6',
                color: '#4b5563',
                fontSize: '11px',
                fontWeight: 600,
                border: '1px solid #e5e7eb'
              }}>
                <ShieldAlert size={12} />
                Giám Sát Kho Chỉ Đọc
              </span>
            )}

            {/* Pricing Authority Clearance Pill */}
            {canManagePricing ? (
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '3px 10px',
                borderRadius: 'var(--radius-pill)',
                backgroundColor: '#ecfdf5',
                color: '#047857',
                fontSize: '11px',
                fontWeight: 600,
                border: '1px solid #a7f3d0'
              }}>
                <DollarSign size={12} />
                {isAdmin ? 'Toàn Quyền Cấu Hình Giá' : 'Được Ủy Quyền Sửa Giá (manage_pricing)'}
              </span>
            ) : (
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '3px 10px',
                borderRadius: 'var(--radius-pill)',
                backgroundColor: '#fffbeb',
                color: '#b45309',
                fontSize: '11px',
                fontWeight: 600,
                border: '1px solid #fde68a'
              }}>
                <Lock size={12} />
                Chỉ Xem Giá (Cần Admin Ủy Quyền)
              </span>
            )}

            {/* Database Live Sync Pill */}
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '3px 10px',
              borderRadius: 'var(--radius-pill)',
              backgroundColor: isDbSynced ? '#eff6ff' : '#fef2f2',
              color: isDbSynced ? '#1d4ed8' : '#b91c1c',
              fontSize: '11px',
              fontWeight: 600,
              border: `1px solid ${isDbSynced ? '#bfdbfe' : '#fecaca'}`
            }}>
              <Database size={12} />
              {isDbSynced ? `CSDL Trực Tuyến: Đã Tải ${villas.length} Biệt Thự` : 'Chưa Kết Nối DB (Dùng Dữ Liệu Cục Bộ)'}
            </span>

            {/* Refresh DB button */}
            <button
              onClick={fetchAllFromDatabase}
              title="Đồng bộ lại từ Database"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '3px 8px',
                borderRadius: 'var(--radius-pill)',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-secondary)',
                fontSize: '11px',
                cursor: 'pointer'
              }}
            >
              <RefreshCw size={11} className={isLoadingDb ? 'animate-spin' : ''} />
              {isLoadingDb ? 'Đang tải...' : 'Làm mới'}
            </button>
          </div>

          <h1 style={{
            fontSize: '26px',
            fontWeight: 700,
            color: 'var(--text-primary)',
            letterSpacing: '-0.02em',
            margin: 0
          }}>
            Quản Lý Villa, Buồng Phòng & Khung Sản Phẩm Nghỉ Dưỡng
          </h1>
          <p style={{
            fontSize: '13px',
            color: 'var(--text-secondary)',
            marginTop: '4px',
            marginBottom: 0
          }}>
            Hệ thống quản lý 27 căn biệt thự vật lý độc bản, 6 phân khu cảnh quan, 6 hạng phòng chuẩn PMS quốc tế và 16 không gian chức năng.
          </p>
        </div>

        {/* Right Header Badges / Summary */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <div style={{
            padding: '8px 14px',
            backgroundColor: 'var(--bg-card, #ffffff)',
            borderRadius: '10px',
            border: '1px solid var(--border-subtle, #e5e2dc)',
            boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
            textAlign: 'right'
          }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
              Công Suất Lấp Đầy
            </div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--accent-forest, #2d4a3e)' }}>
              {stats.occupancyRate}% <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)' }}>({stats.occupied}/{stats.total} căn)</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Top KPI Cards Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 'var(--space-3)',
        marginBottom: 'var(--space-6)'
      }}>
        {/* KPI 1 */}
        <div style={{
          padding: '16px',
          backgroundColor: 'var(--bg-card, #ffffff)',
          borderRadius: '12px',
          border: '1px solid var(--border-subtle, #e5e2dc)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>Tổng Biệt Thự</span>
            <div style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: '#f4efe9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2d4a3e' }}>
              <Home size={15} />
            </div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>{stats.total}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>6 phân khu · 61 phòng ngủ</div>
        </div>

        {/* KPI 2 */}
        <div style={{
          padding: '16px',
          backgroundColor: 'var(--bg-card, #ffffff)',
          borderRadius: '12px',
          border: '1px solid #bbf7d0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', color: '#166534', fontWeight: 600 }}>Sẵn Sàng Đón Khách</span>
            <div style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#15803d' }}>
              <CheckCircle2 size={15} />
            </div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#15803d' }}>{stats.available}</div>
          <div style={{ fontSize: '11px', color: '#166534', marginTop: '4px' }}>Sẵn sàng gán phòng tức thì (S23)</div>
        </div>

        {/* KPI 3 */}
        <div style={{
          padding: '16px',
          backgroundColor: 'var(--bg-card, #ffffff)',
          borderRadius: '12px',
          border: '1px solid #bfdbfe',
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', color: '#1e40af', fontWeight: 600 }}>Đang Có Khách Lưu Trú</span>
            <div style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1d4ed8' }}>
              <Users size={15} />
            </div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#1d4ed8' }}>{stats.occupied}</div>
          <div style={{ fontSize: '11px', color: '#1e40af', marginTop: '4px' }}>Khách đang sử dụng dịch vụ</div>
        </div>

        {/* KPI 4 */}
        <div style={{
          padding: '16px',
          backgroundColor: 'var(--bg-card, #ffffff)',
          borderRadius: '12px',
          border: '1px solid #fde047',
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', color: '#854d0e', fontWeight: 600 }}>Chờ Dọn Phòng</span>
            <div style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: '#fef9c3', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a16207' }}>
              <Clock size={15} />
            </div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#a16207' }}>{stats.cleaning}</div>
          <div style={{ fontSize: '11px', color: '#854d0e', marginTop: '4px' }}>Housekeeping đang xử lý</div>
        </div>

        {/* KPI 5 - Maintenance */}
        <div style={{
          padding: '16px',
          backgroundColor: 'var(--bg-card, #ffffff)',
          borderRadius: '12px',
          border: '1px solid #fed7aa',
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', color: '#c2410c', fontWeight: 600 }}>Bảo Trì Kỹ Thuật</span>
            <div style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ea580c' }}>
              <Wrench size={15} />
            </div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#ea580c' }}>{stats.maintenance}</div>
          <div style={{ fontSize: '11px', color: '#c2410c', marginTop: '4px' }}>Bảo trì kỹ thuật định kỳ</div>
        </div>

        {/* KPI 6 - Ngừng */}
        <div style={{
          padding: '16px',
          backgroundColor: 'var(--bg-card, #ffffff)',
          borderRadius: '12px',
          border: '1px solid #fca5a5',
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', color: '#991b1b', fontWeight: 600 }}>Ngừng Hoạt Động</span>
            <div style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#b91c1c' }}>
              <Ban size={15} />
            </div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#b91c1c' }}>{stats.inactive}</div>
          <div style={{ fontSize: '11px', color: '#991b1b', marginTop: '4px' }}>Biệt thự tạm ngừng khai thác</div>
        </div>

        {/* KPI 6 */}
        <div style={{
          padding: '16px',
          backgroundColor: 'var(--bg-card, #ffffff)',
          borderRadius: '12px',
          border: '1px solid var(--border-subtle, #e5e2dc)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>Hồ Bơi Riêng</span>
            <div style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284c7' }}>
              <Waves size={15} />
            </div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#0284c7' }}>{stats.withPool} <span style={{ fontSize: '13px', fontWeight: 500 }}>căn</span></div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>70.4% tổng số căn biệt thự</div>
        </div>
      </div>

      {/* 3. Navigation Tabs */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--border-subtle, #e5e2dc)',
        gap: 'var(--space-2)',
        marginBottom: 'var(--space-6)',
        overflowX: 'auto'
      }}>
        <button
          type="button"
          onClick={() => setActiveTab('villas')}
          style={{
            padding: '12px 18px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'villas' ? '2.5px solid var(--accent-forest, #2d4a3e)' : '2.5px solid transparent',
            color: activeTab === 'villas' ? 'var(--accent-forest, #2d4a3e)' : 'var(--text-secondary)',
            fontWeight: activeTab === 'villas' ? 700 : 500,
            fontSize: '13px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            whiteSpace: 'nowrap',
            transition: 'all 0.2s ease'
          }}
        >
          <Home size={16} />
          Biệt Thự Vật Lý ({villas.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('categories')}
          style={{
            padding: '12px 18px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'categories' ? '2.5px solid var(--accent-forest, #2d4a3e)' : '2.5px solid transparent',
            color: activeTab === 'categories' ? 'var(--accent-forest, #2d4a3e)' : 'var(--text-secondary)',
            fontWeight: activeTab === 'categories' ? 700 : 500,
            fontSize: '13px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            whiteSpace: 'nowrap',
            transition: 'all 0.2s ease'
          }}
        >
          <Layers size={16} />
          Hạng Villa & Khung Sản Phẩm ({categories.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('packages')}
          style={{
            padding: '12px 18px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'packages' ? '2.5px solid var(--accent-forest, #2d4a3e)' : '2.5px solid transparent',
            color: activeTab === 'packages' ? 'var(--accent-forest, #2d4a3e)' : 'var(--text-secondary)',
            fontWeight: activeTab === 'packages' ? 700 : 500,
            fontSize: '13px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            whiteSpace: 'nowrap',
            transition: 'all 0.2s ease'
          }}
        >
          <Package size={16} />
          Gói Nghỉ Dưỡng & Đơn Giá ({packages.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('zones')}
          style={{
            padding: '12px 18px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'zones' ? '2.5px solid var(--accent-forest, #2d4a3e)' : '2.5px solid transparent',
            color: activeTab === 'zones' ? 'var(--accent-forest, #2d4a3e)' : 'var(--text-secondary)',
            fontWeight: activeTab === 'zones' ? 700 : 500,
            fontSize: '13px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            whiteSpace: 'nowrap',
            transition: 'all 0.2s ease'
          }}
        >
          <MapPin size={16} />
          Phân Khu & Nhóm Phòng ({zones.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('functional_areas')}
          style={{
            padding: '12px 18px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'functional_areas' ? '2.5px solid var(--accent-forest, #2d4a3e)' : '2.5px solid transparent',
            color: activeTab === 'functional_areas' ? 'var(--accent-forest, #2d4a3e)' : 'var(--text-secondary)',
            fontWeight: activeTab === 'functional_areas' ? 700 : 500,
            fontSize: '13px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            whiteSpace: 'nowrap',
            transition: 'all 0.2s ease'
          }}
        >
          <Sparkles size={16} />
          Phòng Chức Năng & Tiện Nghi ({functionalAreas.length})
        </button>
      </div>

      {/* ====================================================================
          TAB 1: PHYSICAL VILLAS INVENTORY
          ==================================================================== */}
      {activeTab === 'villas' && (
        <div>
          {/* Filters Bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 'var(--space-3)',
            padding: '16px',
            backgroundColor: 'var(--bg-card, #ffffff)',
            borderRadius: '12px',
            border: '1px solid var(--border-subtle, #e5e2dc)',
            marginBottom: 'var(--space-5)',
            boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
          }}>
            {/* Search Input */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1 1 260px', position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Tìm theo số căn (V101, V201...), phân khu, view hoặc ghi chú..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px 9px 36px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-subtle, #e5e2dc)',
                  fontSize: '12px',
                  backgroundColor: 'var(--bg-canvas, #faf9f6)',
                  color: 'var(--text-primary)',
                  outline: 'none'
                }}
              />
            </div>

            {/* Filter Selects */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              {/* Zone Filter */}
              <select
                value={selectedZone}
                onChange={(e) => setSelectedZone(e.target.value)}
                style={{
                  padding: '8px 12px',
                  fontSize: '12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-subtle, #e5e2dc)',
                  backgroundColor: '#ffffff',
                  color: 'var(--text-primary)',
                  outline: 'none'
                }}
              >
                <option value="all">Tất Cả Phân Khu ({zones.length})</option>
                <option value="Garden">Khu Vườn Nhiệt Đới</option>
                <option value="Beachfront">Phân Khu Sát Biển</option>
                <option value="Lagoon">Khu Đầm Phá</option>
                <option value="Ocean Hill">Khu Đồi Hướng Biển</option>
                <option value="Hillside Cliff">Đỉnh Đồi Biệt Lập</option>
                <option value="Cliffside Sanctuary">Mũi Vách Đá Biển</option>
              </select>

              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                style={{
                  padding: '8px 12px',
                  fontSize: '12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-subtle, #e5e2dc)',
                  backgroundColor: '#ffffff',
                  color: 'var(--text-primary)',
                  outline: 'none'
                }}
              >
                <option value="all">Tất Cả Hạng Villa ({categories.length})</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.categoryName}>{c.categoryName}</option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                style={{
                  padding: '8px 12px',
                  fontSize: '12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-subtle, #e5e2dc)',
                  backgroundColor: '#ffffff',
                  color: 'var(--text-primary)',
                  outline: 'none'
                }}
              >
                <option value="all">Tất Cả Trạng Thái</option>
                <option value="AVAILABLE">Sẵn sàng (Available)</option>
                <option value="OCCUPIED">Đang có khách (Occupied)</option>
                <option value="NEEDS_CLEANING">Cần dọn dẹp (Cleaning)</option>
                <option value="MAINTENANCE">Bảo trì (Maintenance)</option>
                <option value="INACTIVE">Ngừng</option>
              </select>

              {/* Pool Toggle */}
              <button
                type="button"
                onClick={() => setFilterPoolOnly((prev) => !prev)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: filterPoolOnly ? '1.5px solid #0284c7' : '1px solid var(--border-subtle, #e5e2dc)',
                  backgroundColor: filterPoolOnly ? '#e0f2fe' : '#ffffff',
                  color: filterPoolOnly ? '#0369a1' : 'var(--text-secondary)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Waves size={13} />
                Có Hồ Bơi Riêng
              </button>

              {/* Grid / List Switcher */}
              <div style={{ display: 'flex', border: '1px solid var(--border-subtle, #e5e2dc)', borderRadius: '8px', overflow: 'hidden' }}>
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  style={{
                    padding: '8px 12px',
                    border: 'none',
                    backgroundColor: viewMode === 'grid' ? 'var(--accent-forest, #2d4a3e)' : '#ffffff',
                    color: viewMode === 'grid' ? '#ffffff' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: 600
                  }}
                >
                  Lưới Ảnh
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  style={{
                    padding: '8px 12px',
                    border: 'none',
                    backgroundColor: viewMode === 'table' ? 'var(--accent-forest, #2d4a3e)' : '#ffffff',
                    color: viewMode === 'table' ? '#ffffff' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: 600
                  }}
                >
                  Bảng Dữ Liệu
                </button>
              </div>

              {/* Add Villa Button */}
              {canManageInventory && (
                <Button
                  size="sm"
                  variant="primary"
                  icon={<Plus size={14} />}
                  onClick={() => setIsAddVillaModalOpen(true)}
                >
                  Thêm Biệt Thự Mới
                </Button>
              )}
            </div>
          </div>

          {/* Grid View */}
          {viewMode === 'grid' && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
              gap: 'var(--space-4)'
            }}>
              {filteredVillas.map((villa) => {
                const badge = getStatusBadge(villa.status);
                return (
                  <div
                    key={villa.id}
                    onClick={() => handleOpenVillaDetail(villa)}
                    style={{
                      backgroundColor: 'var(--bg-card, #ffffff)',
                      borderRadius: '14px',
                      overflow: 'hidden',
                      border: '1px solid var(--border-subtle, #e5e2dc)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-3px)';
                      e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.03)';
                    }}
                  >
                    {/* Villa Image + Status Badges */}
                    <div style={{ position: 'relative', height: '180px', overflow: 'hidden' }}>
                      <img
                        src={villa.image}
                        alt={villa.villaNumber}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <div style={{
                        position: 'absolute',
                        top: '12px',
                        left: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 10px',
                        backgroundColor: 'rgba(0,0,0,0.7)',
                        backdropFilter: 'blur(6px)',
                        borderRadius: '20px',
                        color: '#ffffff',
                        fontSize: '12px',
                        fontWeight: 700,
                        letterSpacing: '0.05em'
                      }}>
                        {villa.villaNumber}
                      </div>

                      {/* Status Badge */}
                      <div style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '4px 10px',
                        backgroundColor: badge.bg,
                        color: badge.text,
                        border: `1px solid ${badge.border}`,
                        borderRadius: '20px',
                        fontSize: '11px',
                        fontWeight: 700,
                        boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                      }}>
                        {badge.icon}
                        {badge.label}
                      </div>

                      {/* Zone Overlay Bar at Bottom */}
                      <div style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        padding: '6px 12px',
                        background: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.75) 100%)',
                        color: '#ffffff',
                        fontSize: '11px',
                        fontWeight: 500,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <span>{villa.zoneName}</span>
                        <span>{villa.floor}</span>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                      <div style={{ marginBottom: '8px' }}>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--accent-forest, #2d4a3e)', textTransform: 'uppercase' }}>
                          {villa.categoryName}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '3px', fontStyle: 'italic', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          "{villa.viewAndOperationalNotes}"
                        </div>
                      </div>

                      {/* Key Specs */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '8px',
                        padding: '10px 12px',
                        backgroundColor: 'var(--bg-canvas, #faf9f6)',
                        borderRadius: '8px',
                        marginBottom: '12px',
                        fontSize: '11px',
                        color: 'var(--text-secondary)'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <Maximize2 size={12} color="var(--accent-forest, #2d4a3e)" />
                          <span>Diện tích: <strong>{villa.areaSqm} m²</strong></span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <Users size={12} color="var(--accent-forest, #2d4a3e)" />
                          <span>Tối đa: <strong>{villa.maxAdults || 2} Lớn {villa.maxChildren !== undefined ? `+ ${villa.maxChildren} Trẻ` : ''} ({villa.maxOccupancy}K)</strong></span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <Bed size={12} color="var(--accent-forest, #2d4a3e)" />
                          <span title={villa.bedType || villa.bedroomInfo} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {villa.bedType || villa.bedroomInfo}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <Waves size={12} color={villa.hasPrivatePool ? '#0284c7' : 'var(--text-muted)'} />
                          <span style={{ color: villa.hasPrivatePool ? '#0369a1' : 'var(--text-muted)' }}>
                            {villa.hasPrivatePool ? 'Hồ bơi riêng' : 'Vườn thiền'}
                          </span>
                        </div>
                      </div>

                      {/* Nightly Price Row */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        backgroundColor: '#f8fafc',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                        marginBottom: '10px'
                      }}>
                        <div>
                          <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            Giá Thuê Đêm
                          </span>
                          <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--accent-forest, #2d4a3e)' }}>
                            {formatVND(villa.nightlyRate || 4500000)} <span style={{ fontSize: '10px', fontWeight: 400, color: 'var(--text-muted)' }}>/ đêm</span>
                          </div>
                        </div>

                        {canManagePricing && (<button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingPriceVilla(villa);
                          }}
                          style={{
                            padding: '4px 8px',
                            fontSize: '11px',
                            fontWeight: 600,
                            borderRadius: '6px',
                            border: '1px solid var(--accent-forest, #2d4a3e)',
                            backgroundColor: '#ffffff',
                            color: 'var(--accent-forest, #2d4a3e)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                          title="Chỉnh sửa giá thuê đêm căn villa này"
                        >
                          <DollarSign size={12} />
                          Sửa Giá
                        </button>)}
                      </div>

                      {/* Amenities Pills */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: 'auto' }}>
                        {villa.amenities.slice(0, 3).map((am, i) => (
                          <span key={i} style={{
                            fontSize: '10px',
                            padding: '2px 8px',
                            backgroundColor: '#f1f5f9',
                            borderRadius: '4px',
                            color: '#475569'
                          }}>
                            {am}
                          </span>
                        ))}
                        {villa.amenities.length > 3 && (
                          <span style={{ fontSize: '10px', color: 'var(--text-muted)', alignSelf: 'center' }}>
                            +{villa.amenities.length - 3} tiện ích
                          </span>
                        )}
                      </div>

                      {/* Card Action Row */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '8px',
                        marginTop: '12px',
                        paddingTop: '10px',
                        borderTop: '1px solid var(--border-subtle, #e5e2dc)'
                      }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {villa.maxAdults}L {villa.maxChildren !== undefined ? `+ ${villa.maxChildren}T` : ''} · {villa.areaSqm}m²
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {canManageInventory && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingVilla(villa);
                              }}
                              style={{
                                padding: '5px 10px',
                                fontSize: '11px',
                                fontWeight: 600,
                                borderRadius: '6px',
                                border: '1px solid var(--border-subtle, #e5e2dc)',
                                backgroundColor: '#ffffff',
                                color: 'var(--text-primary)',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                              title="Chỉnh sửa thông số biệt thự"
                            >
                              <Edit3 size={12} color="var(--accent-forest, #2d4a3e)" />
                              Sửa
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenVillaDetail(villa);
                            }}
                            style={{
                              padding: '5px 10px',
                              fontSize: '11px',
                              fontWeight: 600,
                              borderRadius: '6px',
                              border: '1px solid var(--accent-forest, #2d4a3e)',
                              backgroundColor: 'var(--accent-forest, #2d4a3e)',
                              color: '#ffffff',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <Eye size={12} />
                            Chi Tiết
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Table View */}
          {viewMode === 'table' && (
            <div style={{
              backgroundColor: 'var(--bg-card, #ffffff)',
              borderRadius: '12px',
              border: '1px solid var(--border-subtle, #e5e2dc)',
              overflow: 'hidden',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--bg-canvas, #faf9f6)', borderBottom: '1px solid var(--border-subtle, #e5e2dc)' }}>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-primary)' }}>Mã Căn</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-primary)' }}>Hạng Villa</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-primary)' }}>Phân Khu & Tầng</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-primary)' }}>Thông Số Căn</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-primary)' }}>Giá Thuê / Đêm</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-primary)' }}>Hồ Bơi Riêng</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-primary)' }}>Trạng Thái Vận Hành</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-primary)' }}>Ghi Chú Vận Hành & View</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-primary)', textAlign: 'right' }}>Thao Tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVillas.map((villa) => {
                    const badge = getStatusBadge(villa.status);
                    return (
                      <tr
                        key={villa.id}
                        style={{ borderBottom: '1px solid var(--border-subtle, #e5e2dc)', cursor: 'pointer' }}
                        onClick={() => handleOpenVillaDetail(villa)}
                      >
                        <td style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--accent-forest, #2d4a3e)' }}>
                          {villa.villaNumber}
                        </td>
                        <td style={{ padding: '12px 16px', fontWeight: 600 }}>{villa.categoryName}</td>
                        <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>
                          <div>{villa.zoneName}</div>
                          <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{villa.floor}</div>
                        </td>
                        <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>
                          <div>{villa.areaSqm} m² · <strong>{villa.maxAdults || 2} Lớn {villa.maxChildren !== undefined ? `+ ${villa.maxChildren} Trẻ` : ''}</strong></div>
                          <div style={{ fontSize: '10px', color: 'var(--accent-forest, #2d4a3e)', fontWeight: 600 }}>{villa.bedType || villa.bedroomInfo}</div>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontWeight: 700, color: 'var(--accent-forest, #2d4a3e)', fontSize: '13px' }}>
                              {formatVND(villa.nightlyRate || 4500000)}
                            </span>
                            {canManagePricing && (<button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingPriceVilla(villa);
                              }}
                              style={{
                                padding: '3px 6px',
                                fontSize: '10px',
                                fontWeight: 600,
                                borderRadius: '4px',
                                border: '1px solid #cbd5e1',
                                backgroundColor: '#ffffff',
                                cursor: 'pointer',
                                color: 'var(--accent-forest, #2d4a3e)'
                              }}
                              title="Chỉnh sửa giá thuê đêm"
                            >
                              Sửa
                            </button>)}
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          {villa.hasPrivatePool ? (
                            <span style={{ color: '#0369a1', fontSize: '11px', fontWeight: 600 }}>{villa.poolInfo}</span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Vườn riêng</span>
                          )}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '3px 8px',
                            borderRadius: '12px',
                            backgroundColor: badge.bg,
                            color: badge.text,
                            border: `1px solid ${badge.border}`,
                            fontSize: '11px',
                            fontWeight: 700
                          }}>
                            {badge.icon}
                            {badge.label}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', maxWidth: '280px', fontSize: '11px' }}>
                          {villa.viewAndOperationalNotes}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            {canManageInventory && (
                              <Button
                                size="sm"
                                variant="secondary"
                                icon={<Edit3 size={13} />}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingVilla(villa);
                                }}
                              >
                                Sửa
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="tertiary"
                              icon={<Eye size={13} />}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenVillaDetail(villa);
                              }}
                            >
                              Chi Tiết
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ====================================================================
          TAB 2: VILLA CATEGORIES & PRODUCT FRAMING
          ==================================================================== */}
      {activeTab === 'categories' && (
        <div>
          <div style={{
            padding: '16px 20px',
            backgroundColor: 'var(--bg-card, #ffffff)',
            borderRadius: '12px',
            border: '1px solid var(--border-subtle, #e5e2dc)',
            marginBottom: 'var(--space-6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                Khung Sản Phẩm Hạng Villa (6 Hạng Biệt Thự HSWRMS)
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                Định mức số phòng ngủ, phụ thu nâng hạng (Price Modifier) và các gói chăm sóc sức khỏe Retreat tương thích.
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              {canManageCategories && (
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#059669', backgroundColor: '#ecfdf5', padding: '4px 10px', borderRadius: '20px', border: '1px solid #a7f3d0' }}>
                  Được ủy quyền cấu hình sản phẩm
                </span>
              )}
              {canManageCategories && (
                <Button
                  size="sm"
                  variant="primary"
                  icon={<Plus size={14} />}
                  onClick={() => setIsAddCategoryModalOpen(true)}
                >
                  Thêm Hạng Phòng Mới
                </Button>
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: 'var(--space-5)' }}>
            {categories.map((cat) => (
              <div
                key={cat.id}
                style={{
                  backgroundColor: 'var(--bg-card, #ffffff)',
                  borderRadius: '14px',
                  border: '1px solid var(--border-subtle, #e5e2dc)',
                  overflow: 'hidden',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.03)',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                {/* Header Image with Gradient */}
                <div style={{ position: 'relative', height: '200px' }}>
                  <img src={cat.image} alt={cat.categoryName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.8) 100%)'
                  }} />
                  <div style={{ position: 'absolute', top: '14px', left: '16px' }}>
                    <span style={{
                      backgroundColor: 'rgba(255,255,255,0.92)',
                      color: 'var(--accent-forest, #2d4a3e)',
                      padding: '4px 10px',
                      borderRadius: '20px',
                      fontSize: '11px',
                      fontWeight: 700,
                      letterSpacing: '0.04em'
                    }}>
                      Hạng {cat.id} · {cat.inventoryCount} Căn Trong Kho
                    </span>
                  </div>

                  <div style={{ position: 'absolute', bottom: '16px', left: '16px', right: '16px', color: '#ffffff' }}>
                    <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0, textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                      {cat.categoryName}
                    </h2>
                    <div style={{ fontSize: '12px', opacity: 0.9, marginTop: '2px' }}>
                      {cat.bedroomDescription} · Diện tích: {cat.areaRange}
                    </div>
                  </div>
                </div>

                {/* Details Body */}
                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  {/* Pricing and Capacity Specs */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '10px',
                    padding: '12px',
                    backgroundColor: 'var(--bg-canvas, #faf9f6)',
                    borderRadius: '10px',
                    marginBottom: '16px',
                    textAlign: 'center'
                  }}>
                    <div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Phụ Thu/Hạng</div>
                      <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--accent-forest, #2d4a3e)', marginTop: '2px' }}>
                        {cat.priceModifier > 0 ? `+${formatVND(cat.priceModifier)}` : 'Tiêu Chuẩn (0đ)'}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Cấu Hình Giường</div>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={cat.bedType || cat.bedroomDescription}>
                        {cat.bedType || cat.bedroomDescription}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Tối Đa (Lớn + Trẻ)</div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#b45309', marginTop: '2px' }}>
                        {cat.maxAdults || cat.standardOccupancy} Lớn + {cat.maxChildren !== undefined ? cat.maxChildren : 1} Trẻ <span style={{ fontSize: '10px', fontWeight: 500 }}>({cat.maxOccupancy}K)</span>
                      </div>
                    </div>
                  </div>

                  {/* Highlights */}
                  <div style={{ marginBottom: '14px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', marginBottom: '6px' }}>
                      Điểm Nhấn Đặc Quyền:
                    </div>
                    <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                      {cat.highlights.map((hl, idx) => (
                        <li key={idx}><strong>{hl}</strong></li>
                      ))}
                    </ul>
                  </div>

                  {/* Eligible Packages */}
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', marginBottom: '6px' }}>
                      Gói Retreat Thích Hợp:
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {cat.eligiblePackages.map((pkg, idx) => (
                        <span key={idx} style={{
                          fontSize: '11px',
                          padding: '3px 10px',
                          borderRadius: '6px',
                          backgroundColor: '#ecfdf5',
                          color: '#065f46',
                          border: '1px solid #a7f3d0',
                          fontWeight: 500
                        }}>
                          {pkg}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Category Pricing Bar */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    backgroundColor: 'var(--bg-canvas, #faf9f6)',
                    borderRadius: '10px',
                    border: '1px solid var(--border-subtle, #e5e2dc)',
                    marginTop: '12px',
                    marginBottom: '8px'
                  }}>
                    <div>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                        Giá Chuẩn & Phụ Thu Hạng:
                      </span>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {formatVND(cat.basePrice || 4500000)}/đêm · <span style={{ color: 'var(--accent-forest, #2d4a3e)' }}>+{formatVND(cat.priceModifier)}</span>
                      </div>
                    </div>

                    {canManagePricing && (<Button
                      size="sm"
                      variant="secondary"
                      icon={<DollarSign size={13} />}
                      onClick={() => setEditingPriceCategory(cat)}
                    >
                      Sửa Giá & Phụ Thu
                    </Button>)}
                  </div>

                  {/* Amenities text */}
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: 'auto', borderTop: '1px dashed var(--border-subtle, #e5e2dc)', paddingTop: '10px' }}>
                    {cat.featuresAndAmenities}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ====================================================================
          TAB 3: RETREAT PACKAGES & PRICING
          ==================================================================== */}
      {activeTab === 'packages' && (
        <div>
          {/* Header Bar */}
          <div style={{
            padding: '16px 20px',
            backgroundColor: 'var(--bg-card, #ffffff)',
            borderRadius: '12px',
            border: '1px solid var(--border-subtle, #e5e2dc)',
            marginBottom: 'var(--space-6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                Bảng Giá & Danh Mục Các Gói Nghỉ Dưỡng Trọn Gói (Retreat Packages Master)
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                Cấu hình đơn giá trọn gói, số buổi spa trị liệu, thời lượng lưu trú và liệu trình sức khỏe. Quản lý có thể cập nhật giá khi được Admin ủy quyền (manage_pricing).
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {canManagePricing ? (
                <span style={{ fontSize: '11px', color: '#166534', backgroundColor: '#dcfce7', padding: '4px 10px', borderRadius: '6px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <ShieldCheck size={13} /> Quyền sửa giá gói: Đang hiệu lực
                </span>
              ) : (
                <span style={{ fontSize: '11px', color: '#991b1b', backgroundColor: '#fee2e2', padding: '4px 10px', borderRadius: '6px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <ShieldAlert size={13} /> Sửa giá gói: Cần ủy quyền Admin
                </span>
              )}

              {canManageInventory && (
                <Button
                  size="sm"
                  variant="primary"
                  icon={<Plus size={14} />}
                  onClick={() => setIsAddPackageModalOpen(true)}
                >
                  Thêm Gói Nghỉ Dưỡng Mới
                </Button>
              )}
            </div>
          </div>

          {/* Packages Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 'var(--space-4)' }}>
            {packages.map((pkg) => (
              <div
                key={pkg.id}
                style={{
                  backgroundColor: 'var(--bg-card, #ffffff)',
                  borderRadius: '14px',
                  border: '1px solid var(--border-subtle, #e5e2dc)',
                  padding: '20px',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.03)',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '10px',
                      backgroundColor: 'rgba(217, 119, 6, 0.1)',
                      color: '#d97706',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Package size={20} />
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent-forest, #2d4a3e)', textTransform: 'uppercase' }}>
                        {pkg.code}
                      </div>
                      <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: '2px 0 0 0' }}>
                        {pkg.name}
                      </h4>
                    </div>
                  </div>

                  <span style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    padding: '2px 8px',
                    borderRadius: '20px',
                    backgroundColor: pkg.status === 'active' ? '#dcfce7' : '#f3f4f6',
                    color: pkg.status === 'active' ? '#166534' : '#64748b'
                  }}>
                    {pkg.status === 'active' ? 'Đang mở bán' : 'Lưu trữ'}
                  </span>
                </div>

                {/* Specs */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '8px',
                  padding: '10px 12px',
                  backgroundColor: 'var(--bg-canvas, #faf9f6)',
                  borderRadius: '8px',
                  fontSize: '11px',
                  color: 'var(--text-secondary)',
                  marginBottom: '12px'
                }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Thời lượng:</span>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                      {pkg.durationDays} Ngày {pkg.durationNights} Đêm
                    </div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Spa trị liệu:</span>
                    <div style={{ fontWeight: 700, color: 'var(--accent-forest, #2d4a3e)', marginTop: '2px' }}>
                      {pkg.includedSpaSessions} Buổi tiêu chuẩn
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '14px', lineHeight: 1.5, flex: 1 }}>
                  <strong>Mục tiêu:</strong> {pkg.goal}
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    {pkg.description}
                  </div>
                </div>

                {/* Price Bar & Edit Button */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  backgroundColor: '#f8fafc',
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0',
                  marginTop: 'auto'
                }}>
                  <div>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Đơn Giá Gói Trọn Gói
                    </span>
                    <div style={{ fontSize: '17px', fontWeight: 700, color: '#15803d' }}>
                      {formatVND(pkg.basePrice)}
                    </div>
                  </div>

                  {canManagePricing && (<Button
                    size="sm"
                    variant="primary"
                    icon={<DollarSign size={13} />}
                    onClick={() => setEditingPricePackage(pkg)}
                  >
                    Sửa Giá Gói
                  </Button>)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ====================================================================
          TAB 4: RESORT ZONES & ROOM GROUPS
          ==================================================================== */}
      {activeTab === 'zones' && (
        <div>
          <div style={{
            padding: '16px 20px',
            backgroundColor: 'var(--bg-card, #ffffff)',
            borderRadius: '12px',
            border: '1px solid var(--border-subtle, #e5e2dc)',
            marginBottom: 'var(--space-6)'
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              Quy Hoạch 6 Phân Khu Cảnh Quan & Nhóm Phòng Resort
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
              Bố trí không gian theo phong thủy nghỉ dưỡng sinh thái, tối ưu trải nghiệm tĩnh lặng và kết nối cảnh quan thiên nhiên.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 'var(--space-4)' }}>
            {zones.map((zone) => (
              <div
                key={zone.id}
                style={{
                  backgroundColor: 'var(--bg-card, #ffffff)',
                  borderRadius: '14px',
                  border: '1px solid var(--border-subtle, #e5e2dc)',
                  padding: '20px',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                {/* Zone Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      background: zone.gradient,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--accent-forest, #2d4a3e)'
                    }}>
                      {zone.iconName === 'Trees' && <Trees size={20} />}
                      {zone.iconName === 'Waves' && <Waves size={20} />}
                      {zone.iconName === 'Droplets' && <Droplets size={20} />}
                      {zone.iconName === 'Mountain' && <Mountain size={20} />}
                      {zone.iconName === 'ShieldCheck' && <ShieldCheck size={20} />}
                      {zone.iconName === 'Crown' && <Crown size={20} />}
                    </div>
                    <div>
                      <h4 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                        {zone.zoneName}
                      </h4>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>
                        {zone.applicableCategory}
                      </span>
                    </div>
                  </div>

                  <span style={{
                    padding: '4px 10px',
                    borderRadius: '20px',
                    backgroundColor: 'var(--bg-canvas, #faf9f6)',
                    border: '1px solid var(--border-subtle, #e5e2dc)',
                    fontSize: '11px',
                    fontWeight: 700,
                    color: 'var(--accent-forest, #2d4a3e)'
                  }}>
                    {zone.relativePriceTier}
                  </span>
                </div>

                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 14px 0' }}>
                  {zone.landscapeDescription}
                </p>

                {/* Villa Numbers Badges */}
                <div style={{
                  padding: '12px',
                  backgroundColor: 'var(--bg-canvas, #faf9f6)',
                  borderRadius: '10px',
                  marginBottom: '14px'
                }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                    Danh Sách Căn Thuộc Phân Khu ({zone.villaCount} căn):
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {zone.villaNumbers.map((num) => {
                      const v = villas.find((item) => item.villaNumber === num);
                      const isAvailable = v?.status === 'AVAILABLE';
                      return (
                        <span
                          key={num}
                          onClick={() => v && handleOpenVillaDetail(v)}
                          style={{
                            padding: '3px 8px',
                            backgroundColor: isAvailable ? '#dcfce7' : '#fee2e2',
                            color: isAvailable ? '#15803d' : '#991b1b',
                            border: `1px solid ${isAvailable ? '#86efac' : '#fca5a5'}`,
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          {num} {isAvailable ? '• Trống' : '• Có khách'}
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* Operational Advantage */}
                <div style={{ fontSize: '11px', color: '#0369a1', backgroundColor: '#f0f9ff', padding: '10px 12px', borderRadius: '8px', border: '1px solid #bae6fd', marginTop: 'auto' }}>
                  <strong>Ưu thế vận hành:</strong> {zone.operationalAdvantages}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ====================================================================
          TAB 4: FUNCTIONAL AREAS & ROOM SPECIFICATIONS
          ==================================================================== */}
      {activeTab === 'functional_areas' && (
        <div>
          <div style={{
            padding: '16px 20px',
            backgroundColor: 'var(--bg-card, #ffffff)',
            borderRadius: '12px',
            border: '1px solid var(--border-subtle, #e5e2dc)',
            marginBottom: 'var(--space-6)'
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              Định Mức 16 Không Gian Phòng Chức Năng & Tiện Nghi Villa
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
              Quy chuẩn thiết kế nội thất, diện tích và vai trò tương thích với các phân hệ M2 (Booking), M3 (Spa tại phòng), M4 (Ẩm thực tận phòng) và Quản gia VIP.
            </p>
          </div>

          <div style={{
            backgroundColor: 'var(--bg-card, #ffffff)',
            borderRadius: '12px',
            border: '1px solid var(--border-subtle, #e5e2dc)',
            overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-canvas, #faf9f6)', borderBottom: '1px solid var(--border-subtle, #e5e2dc)' }}>
                  <th style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-primary)' }}>Nhóm Không Gian</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-primary)' }}>Tên Phòng Chức Năng</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-primary)' }}>Diện Tích (m²)</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-primary)' }}>Định Mức 1 PN</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-primary)' }}>Định Mức 2-3 PN</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-primary)' }}>Dinh Thự 4-6 PN</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-primary)' }}>Nội Thất & Trang Thiết Bị</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-primary)' }}>Ý Nghĩa Vận Hành HSWRMS</th>
                </tr>
              </thead>
              <tbody>
                {functionalAreas.map((fa) => (
                  <tr key={fa.id} style={{ borderBottom: '1px solid var(--border-subtle, #e5e2dc)' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--accent-forest, #2d4a3e)' }}>
                      {fa.spaceGroup}
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {fa.roomName}
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: '#0369a1' }}>
                      {fa.areaRangeSqm}
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>
                      {fa.quantityIn1Br}
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>
                      {fa.quantityIn23Br}
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>
                      {fa.quantityInEstate46Br}
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', maxWidth: '260px', fontSize: '11px' }}>
                      {fa.keyFurnishing}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#166534', backgroundColor: '#f0fdf4', maxWidth: '240px', fontSize: '11px' }}>
                      {fa.operationalPurpose}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL / DRAWER: VILLA DETAIL & OPERATIONAL STATUS UPDATE
          ==================================================================== */}
      {selectedVilla && (
        <div className="hsw-modal-overlay" onClick={() => setSelectedVilla(null)}>
          <div
            className="hsw-modal-box"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto' }}
          >
            {/* Modal Header */}
            <div className="hsw-modal-header" style={{ paddingBottom: '12px', borderBottom: '1px solid var(--border-subtle, #e5e2dc)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--accent-sand-soft, #f4efe9)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent-forest, #2d4a3e)',
                  fontWeight: 700,
                  fontSize: '14px'
                }}>
                  {selectedVilla.villaNumber}
                </div>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                    Biệt Thự {selectedVilla.villaNumber} — {selectedVilla.categoryName}
                  </h3>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {selectedVilla.zoneName} · {selectedVilla.floor}
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {canManageInventory && (
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    icon={<Edit3 size={13} />}
                    onClick={() => setEditingVilla(selectedVilla)}
                  >
                    Sửa Thông Tin
                  </Button>
                )}
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => handleDeleteVilla(selectedVilla.villaNumber)}
                    style={{
                      padding: '6px 10px',
                      fontSize: '12px',
                      fontWeight: 600,
                      borderRadius: '6px',
                      border: '1px solid #fecaca',
                      backgroundColor: '#fef2f2',
                      color: '#b91c1c',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                    title="Xóa căn biệt thự khỏi hệ thống"
                  >
                    <Trash2 size={13} />
                    Xóa Căn
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedVilla(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '6px' }}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div style={{ padding: '20px 0' }}>
              {/* Villa Hero Image */}
              <div style={{ height: '220px', borderRadius: '12px', overflow: 'hidden', marginBottom: '16px', position: 'relative' }}>
                <img src={selectedVilla.image} alt={selectedVilla.villaNumber} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{
                  position: 'absolute',
                  bottom: '12px',
                  left: '12px',
                  padding: '4px 10px',
                  backgroundColor: 'rgba(0,0,0,0.7)',
                  borderRadius: '20px',
                  color: '#ffffff',
                  fontSize: '11px',
                  fontWeight: 600
                }}>
                  {selectedVilla.poolInfo}
                </div>
              </div>

              {/* Specs Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '10px',
                padding: '14px',
                backgroundColor: 'var(--bg-canvas, #faf9f6)',
                borderRadius: '10px',
                marginBottom: '16px',
                textAlign: 'center'
              }}>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Diện Tích Căn</div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                    {selectedVilla.areaSqm} m²
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Sức Chứa Tối Đa</div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--accent-forest, #2d4a3e)', marginTop: '2px' }}>
                    {selectedVilla.maxOccupancy} Khách
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Phòng Ngủ</div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                    {selectedVilla.bedroomCount} PN
                  </div>
                </div>
              </div>

              {/* Operational & View Notes */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  Ghi Chú Vận Hành & Hướng View:
                </label>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', padding: '10px 14px', backgroundColor: '#ffffff', border: '1px solid var(--border-subtle, #e5e2dc)', borderRadius: '8px' }}>
                  {selectedVilla.viewAndOperationalNotes}
                </div>
              </div>

              {/* Amenities */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                  Trang Thiết Bị & Tiện Nghi:
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {selectedVilla.amenities.map((am, idx) => (
                    <span key={idx} style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      backgroundColor: 'var(--bg-canvas, #faf9f6)',
                      border: '1px solid var(--border-subtle, #e5e2dc)',
                      fontSize: '11px',
                      color: 'var(--text-primary)'
                    }}>
                      ✓ {am}
                    </span>
                  ))}
                </div>
              </div>

              {/* Villa Nightly Rate Card & Delegation Gate */}
              <div style={{
                padding: '14px 16px',
                borderRadius: '12px',
                backgroundColor: 'var(--bg-canvas, #faf9f6)',
                border: '1px solid var(--border-subtle, #e5e2dc)',
                marginBottom: '20px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <DollarSign size={16} color="var(--accent-forest, #2d4a3e)" />
                    <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Giá Thuê Đêm Từng Căn (Nightly Rate)
                    </span>
                  </div>

                  {canManagePricing ? (
                    <span style={{ fontSize: '11px', color: '#166534', backgroundColor: '#dcfce7', padding: '2px 8px', borderRadius: '4px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <ShieldCheck size={12} /> {isAdmin ? 'Toàn Quyền Admin (Toàn Phần)' : 'Đã ủy quyền sửa giá'}
                    </span>
                  ) : (
                    <span style={{ fontSize: '11px', color: '#991b1b', backgroundColor: '#fee2e2', padding: '2px 8px', borderRadius: '4px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <ShieldAlert size={12} /> Khóa (Cần Admin ủy quyền)
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Giá niêm yết hiện tại:</span>
                    <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--accent-forest, #2d4a3e)' }}>
                      {formatVND(selectedVilla.nightlyRate || 4500000)} <span style={{ fontSize: '12px', fontWeight: 400, color: 'var(--text-secondary)' }}>/ đêm</span>
                    </div>
                  </div>

                  {canManagePricing && (<Button
                    type="button"
                    size="sm"
                    variant="primary"
                    icon={<DollarSign size={13} />}
                    onClick={() => {
                      setEditingPriceVilla(selectedVilla);
                    }}
                  >
                    Chỉnh Sửa Giá Biệt Thự
                  </Button>)}
                </div>
              </div>

              {/* Operational Status Update Form */}
              <form onSubmit={handleUpdateVillaStatus} style={{ borderTop: '1px solid var(--border-subtle, #e5e2dc)', paddingTop: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Cập Nhật Trạng Thái Vận Hành Biệt Thự:
                  </label>
                  {!canManageInventory ? (
                    <span style={{ fontSize: '11px', color: '#b91c1c', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <ShieldAlert size={12} /> Cần quyền ủy quyền từ Admin
                    </span>
                  ) : (
                    <span style={{ fontSize: '11px', color: '#166534', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                      <ShieldCheck size={12} /> {isAdmin ? 'Toàn quyền Quản Trị Viên (Admin)' : 'Đã được cấp quyền buồng phòng'}
                    </span>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginBottom: '14px' }}>
                  {(['AVAILABLE', 'OCCUPIED', 'NEEDS_CLEANING', 'MAINTENANCE', 'INACTIVE'] as VillaOperationalStatus[]).map((st) => {
                    const isChecked = pendingStatus === st;
                    const stBadge = getStatusBadge(st);
                    const isInactive = st === 'INACTIVE';
                    return (
                      <label
                        key={st}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: isChecked
                            ? `1.5px solid ${isInactive ? '#dc2626' : stBadge.border}`
                            : isInactive
                              ? '1px solid #fca5a5'
                              : '1px solid var(--border-subtle, #e5e2dc)',
                          backgroundColor: isChecked
                            ? (isInactive ? '#fee2e2' : stBadge.bg)
                            : isInactive
                              ? '#fef2f2'
                              : '#ffffff',
                          cursor: canManageInventory ? 'pointer' : 'not-allowed',
                          opacity: canManageInventory ? 1 : 0.65,
                          gridColumn: isInactive ? 'span 2' : undefined,
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <input
                          type="radio"
                          name="villaStatus"
                          value={st}
                          checked={isChecked}
                          disabled={!canManageInventory}
                          onChange={() => setPendingStatus(st)}
                          style={{ accentColor: isInactive ? '#dc2626' : 'var(--accent-forest, #2d4a3e)' }}
                        />
                        <span style={{ fontSize: '12px', fontWeight: 600, color: stBadge.text, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          {isInactive && <Ban size={13} style={{ color: '#b91c1c' }} />}
                          {stBadge.label}
                        </span>
                      </label>
                    );
                  })}
                </div>

                {/* Reason Note */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Lý do thay đổi trạng thái / Ghi chú buồng phòng:
                  </label>
                  <input
                    type="text"
                    disabled={!canManageInventory}
                    placeholder="VD: Kiểm tra xong hệ thống lọc hồ bơi / Chuẩn bị đón khách đoàn VIP..."
                    value={statusReason}
                    onChange={(e) => setStatusReason(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-subtle, #e5e2dc)',
                      fontSize: '12px',
                      backgroundColor: '#ffffff',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <Button type="button" variant="secondary" size="sm" onClick={() => setSelectedVilla(null)}>
                    Đóng
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={!canManageInventory || pendingStatus === selectedVilla.status}
                  >
                    Lưu Trạng Thái Mới
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Full Villa Details Modal */}
      <EditVillaModal
        isOpen={!!editingVilla}
        onClose={() => setEditingVilla(null)}
        villa={editingVilla}
        categories={categories}
        zones={zones}
        onSaveVilla={handleSaveVilla}
      />

      {/* Add Physical Villa Modal */}
      <AddVillaModal
        isOpen={isAddVillaModalOpen}
        onClose={() => setIsAddVillaModalOpen(false)}
        categories={categories}
        zones={zones}
        existingVillaNumbers={villas.map((v) => v.villaNumber)}
        onAddVilla={handleAddVilla}
      />

      {/* Add Villa Category Modal */}
      <AddVillaCategoryModal
        isOpen={isAddCategoryModalOpen}
        onClose={() => setIsAddCategoryModalOpen(false)}
        existingCategories={categories}
        onAddCategory={handleAddCategory}
      />

      {/* Edit Villa Price Modal */}
      <EditVillaPriceModal
        isOpen={!!editingPriceVilla}
        onClose={() => setEditingPriceVilla(null)}
        villa={editingPriceVilla}
        canManagePricing={canManagePricing}
        onSavePrice={handleSaveVillaPrice}
      />

      {/* Edit Package Price Modal */}
      <EditPackagePriceModal
        isOpen={!!editingPricePackage}
        onClose={() => setEditingPricePackage(null)}
        pkg={editingPricePackage}
        canManagePricing={canManagePricing}
        onSavePrice={handleSavePackagePrice}
      />

      {/* Edit Category Price Modal */}
      <EditCategoryPriceModal
        isOpen={!!editingPriceCategory}
        onClose={() => setEditingPriceCategory(null)}
        category={editingPriceCategory}
        canManagePricing={canManagePricing}
        onSavePrice={handleSaveCategoryPrice}
      />

      {/* Add Retreat Package Modal */}
      <AddRetreatPackageModal
        isOpen={isAddPackageModalOpen}
        onClose={() => setIsAddPackageModalOpen(false)}
        existingPackages={packages}
        onAddPackage={handleAddPackage}
      />
    </div>
  );
};

export default VillaManagementPage;
