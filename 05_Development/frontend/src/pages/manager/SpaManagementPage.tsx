import React, { useState, useMemo, useEffect } from 'react';
import { getAuthToken } from '../../api/client/apiClient';
import {
  Sparkles,
  Package,
  Home,
  Clock,
  DollarSign,
  Search,
  CheckCircle2,
  AlertTriangle,
  Eye,
  Edit2,
  Plus,
  RefreshCw,
  Database,
  Award,
  Layers,
  Utensils,
  Grid,
  List as ListIcon,
  PowerOff,
  ShieldAlert,
  ShieldCheck
} from 'lucide-react';
import {
  SPA_TREATMENTS_INVENTORY,
  RETREAT_PACKAGES_INVENTORY,
  TREATMENT_ROOMS_INVENTORY,
  ROOM_TYPES_MASTER,
  QUALIFICATIONS_MASTER
} from '../../data/mockSpaInventory';
import type {
  SpaTreatmentItem,
  RetreatPackageItem,
  TreatmentRoomItem,
  SpaStatus
} from '../../types/spaManagement';
import { useAuth } from '../../hooks/useAuth';
import { useGovernance } from '../../hooks/useGovernance';
import { useToast } from '../../components/common/Toast';
import { formatVND } from '../../i18n';
import { Button } from '../../components/common/Button';
import { EditSpaTreatmentModal } from '../../components/operations/EditSpaTreatmentModal';
import { EditRetreatPackageModal } from '../../components/operations/EditRetreatPackageModal';
import { AddSpaTreatmentFullModal } from '../../components/operations/AddSpaTreatmentFullModal';
import { AddRetreatPackageFullModal } from '../../components/operations/AddRetreatPackageFullModal';
import { SpaTreatmentDetailModal } from '../../components/operations/SpaTreatmentDetailModal';
import { RetreatPackageDetailModal } from '../../components/operations/RetreatPackageDetailModal';

type ActiveTab = 'treatments' | 'packages' | 'rooms' | 'rules';

export const SpaManagementPage: React.FC = () => {
  const { role } = useAuth();
  const { hasCapability, managerDelegatedCapabilities, logAuditEvent } = useGovernance();
  const { showToast } = useToast();

  const isAdmin = role === 'admin';
  const canManageSpa = isAdmin || hasCapability('manager', 'manage_spa_packages') || managerDelegatedCapabilities.includes('manage_spa_packages');

  const [activeTab, setActiveTab] = useState<ActiveTab>('treatments');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Master Data States
  const [treatments, setTreatments] = useState<SpaTreatmentItem[]>(SPA_TREATMENTS_INVENTORY);
  const [packages, setPackages] = useState<RetreatPackageItem[]>(RETREAT_PACKAGES_INVENTORY);
  const [rooms, setRooms] = useState<TreatmentRoomItem[]>(TREATMENT_ROOMS_INVENTORY);

  // Database sync state
  const [isDbSynced, setIsDbSynced] = useState<boolean>(false);
  const [isLoadingDb, setIsLoadingDb] = useState<boolean>(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Modals state
  const [editingTreatment, setEditingTreatment] = useState<SpaTreatmentItem | null>(null);
  const [viewingTreatment, setViewingTreatment] = useState<SpaTreatmentItem | null>(null);
  const [isAddTreatmentOpen, setIsAddTreatmentOpen] = useState(false);

  const [editingPackage, setEditingPackage] = useState<RetreatPackageItem | null>(null);
  const [viewingPackage, setViewingPackage] = useState<RetreatPackageItem | null>(null);
  const [isAddPackageOpen, setIsAddPackageOpen] = useState(false);

  const getAuthHeaders = () => {
    const token = getAuthToken();
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  // Fetch data directly from backend REST API (SQL Server)
  const fetchSpaDataFromDb = async () => {
    setIsLoadingDb(true);
    try {
      const [treatmentsRes, pkgsRes, roomsRes] = await Promise.all([
        fetch('http://localhost:8080/api/v1/spa/treatments').then((r) => (r.ok ? r.json() : null)),
        fetch('http://localhost:8080/api/v1/retreat-packages').then((r) => (r.ok ? r.json() : null)),
        fetch('http://localhost:8080/api/v1/treatment-rooms').then((r) => (r.ok ? r.json() : null)),
      ]);

      if (treatmentsRes?.data && Array.isArray(treatmentsRes.data) && treatmentsRes.data.length > 0) {
        // Merge backend live data with our rich local inventory
        const mergedTreatments: SpaTreatmentItem[] = treatmentsRes.data.map((item: any) => {
          const matched = SPA_TREATMENTS_INVENTORY.find(
            (t) => t.treatmentCode === item.treatmentCode || t.treatmentName === item.treatmentName
          );
          return {
            id: item.treatmentId || matched?.id || `TRT-${item.treatmentCode}`,
            dbId: item.treatmentId,
            treatmentCode: item.treatmentCode || matched?.treatmentCode || 'SPA-UNKNOWN',
            treatmentName: item.treatmentName || matched?.treatmentName || 'Liệu Trình Spa',
            category: item.category || matched?.category || 'Body Massage',
            durationMinutes: item.durationMinutes || matched?.durationMinutes || 60,
            durationUnit: item.durationUnit || matched?.durationUnit || 'Phút (Minutes)',
            basePrice: item.basePrice != null ? Number(item.basePrice) : (matched?.basePrice || 1000000),
            pricingRule: item.pricingRule || matched?.pricingRule || '',
            roomCompatibility: item.roomCompatibility || matched?.roomCompatibility || 'Phòng Massage Standard/VIP',
            requiredQualificationCode: item.requiredQualificationCode || matched?.requiredQualificationCode || '',
            therapistQualification: item.therapistQualification || matched?.therapistQualification || 'Chứng chỉ Spa',
            contraindications: item.contraindications || matched?.contraindications || '',
            precautions: item.precautions || matched?.precautions || '',
            description: item.description || matched?.description || '',
            status: (item.treatmentStatus || matched?.status || 'ACTIVE') as SpaStatus,
            image: matched?.image || 'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?auto=format&fit=crop&w=800&q=80',
          };
        });
        setTreatments(mergedTreatments);
        setIsDbSynced(true);
      }

      if (pkgsRes?.data && Array.isArray(pkgsRes.data) && pkgsRes.data.length > 0) {
        const mergedPkgs: RetreatPackageItem[] = pkgsRes.data.map((item: any) => {
          const matched = RETREAT_PACKAGES_INVENTORY.find(
            (p) => p.packageCode === item.packageCode || p.packageName === item.packageName
          );
          return {
            id: item.retreatPackageId || matched?.id || `PKG-${item.packageCode}`,
            dbId: item.retreatPackageId,
            packageCode: item.packageCode || matched?.packageCode || 'RET-UNKNOWN',
            packageName: item.packageName || matched?.packageName || 'Gói Nghỉ Dưỡng',
            wellnessGoal: item.wellnessGoal || matched?.wellnessGoal || 'Phục hồi sức khỏe',
            durationNights: item.durationNights || matched?.durationNights || 3,
            durationUnit: item.durationUnit || matched?.durationUnit || 'Đêm (Nights)',
            basePrice: item.basePrice != null ? Number(item.basePrice) : (matched?.basePrice || 15000000),
            basePriceUnit: item.basePriceUnit || matched?.basePriceUnit || 'VND/khách/gói',
            includedTreatments: item.includedTreatments || matched?.includedTreatments || '',
            dietaryPlan: item.dietaryPlan || matched?.dietaryPlan || '',
            extraChargePolicy: item.extraChargePolicy || matched?.extraChargePolicy || '',
            targetGuest: item.targetGuest || matched?.targetGuest || '',
            status: (item.packageStatus || matched?.status || 'ACTIVE') as SpaStatus,
            image: matched?.image || 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80',
            treatmentMappings: matched?.treatmentMappings || [],
            fnbEntitlement: matched?.fnbEntitlement,
          };
        });
        setPackages(mergedPkgs);
        setIsDbSynced(true);
      }

      if (roomsRes?.data && Array.isArray(roomsRes.data) && roomsRes.data.length > 0) {
        setRooms(roomsRes.data.map((r: any) => ({
          id: r.roomId,
          roomName: r.roomName,
          roomType: r.roomType || 'MASSAGE_STANDARD',
          status: r.roomStatus || 'AVAILABLE',
        })));
      }

      showToast('Đã đồng bộ thành công dữ liệu Spa & Retreat từ CSDL SQL Server!', 'success');
    } catch {
      showToast('Không thể kết nối đến backend; đang hiển thị dữ liệu Master Inventory mẫu.', 'warning');
    } finally {
      setIsLoadingDb(false);
    }
  };

  useEffect(() => {
    fetchSpaDataFromDb();
  }, []);

  // Categories list
  const categoriesList = useMemo(() => {
    const set = new Set(treatments.map((t) => t.category));
    return ['ALL', ...Array.from(set)];
  }, [treatments]);

  // Filtered treatments
  const filteredTreatments = useMemo(() => {
    return treatments.filter((t) => {
      const matchSearch =
        searchQuery.trim() === '' ||
        t.treatmentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.treatmentCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.contraindications.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat = selectedCategory === 'ALL' || t.category === selectedCategory;
      const matchStatus = selectedStatus === 'ALL' || t.status === selectedStatus;
      return matchSearch && matchCat && matchStatus;
    });
  }, [treatments, searchQuery, selectedCategory, selectedStatus]);

  // Filtered packages
  const filteredPackages = useMemo(() => {
    return packages.filter((p) => {
      const matchSearch =
        searchQuery.trim() === '' ||
        p.packageName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.packageCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.wellnessGoal.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = selectedStatus === 'ALL' || p.status === selectedStatus;
      return matchSearch && matchStatus;
    });
  }, [packages, searchQuery, selectedStatus]);

  // Handle Save Treatment
  const handleSaveTreatment = async (updated: SpaTreatmentItem) => {
    if (!canManageSpa) {
      showToast('Thao tác bị từ chối: Quản lý chưa được Quản Trị Viên ủy quyền để chỉnh sửa liệu trình Spa.', 'error');
      return;
    }

    setTreatments((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    setEditingTreatment(null);

    try {
      const identifier = updated.dbId || updated.treatmentCode || updated.id;
      const res = await fetch(`http://localhost:8080/api/v1/spa/treatments/${encodeURIComponent(identifier)}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          treatmentName: updated.treatmentName,
          treatmentCode: updated.treatmentCode,
          category: updated.category,
          durationMinutes: updated.durationMinutes,
          durationUnit: updated.durationUnit || 'Phút (Minutes)',
          basePrice: updated.basePrice,
          pricingRule: updated.pricingRule,
          roomCompatibility: updated.roomCompatibility,
          requiredQualificationCode: updated.requiredQualificationCode,
          therapistQualification: updated.therapistQualification,
          contraindications: updated.contraindications,
          precautions: updated.precautions,
          description: updated.description,
          treatmentStatus: updated.status,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.message || `Lỗi máy chủ (${res.status})`);
      }

      showToast(`Đã lưu thay đổi vào CSDL SQL Server cho liệu trình "${updated.treatmentName}"!`, 'success');
    } catch (err: any) {
      console.error('Failed to save treatment to DB:', err);
      showToast(`Không thể lưu vào CSDL: ${err.message || 'Lỗi mạng'}`, 'error');
    }

    logAuditEvent({
      actorId: role === 'admin' ? 'usr-admin' : 'usr-mgr-01',
      actorName: role === 'admin' ? 'Quản trị viên' : 'Sarah Jenkins',
      actorRole: role || 'manager',
      action: 'UPDATE',
      dataCategory: 'SECURITY_GOVERNANCE',
      targetRef: updated.treatmentCode,
      result: 'SUCCESS',
      detailsKey: 'audit.updateSpaTreatment',
      detailsFallback: `Cập nhật liệu trình "${updated.treatmentName}" thành công.`
    });
  };

  // Handle Add Treatment
  const handleAddTreatment = async (newTreatment: SpaTreatmentItem) => {
    if (!canManageSpa) {
      showToast('Thao tác bị từ chối: Quản lý chưa được Quản Trị Viên ủy quyền để thêm liệu trình Spa mới.', 'error');
      return;
    }

    setTreatments((prev) => [newTreatment, ...prev]);
    setIsAddTreatmentOpen(false);

    try {
      const res = await fetch('http://localhost:8080/api/v1/spa/treatments', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          treatmentCode: newTreatment.treatmentCode,
          treatmentName: newTreatment.treatmentName,
          category: newTreatment.category,
          durationMinutes: newTreatment.durationMinutes,
          durationUnit: newTreatment.durationUnit || 'Phút (Minutes)',
          basePrice: newTreatment.basePrice,
          pricingRule: newTreatment.pricingRule,
          roomCompatibility: newTreatment.roomCompatibility,
          requiredQualificationCode: newTreatment.requiredQualificationCode,
          therapistQualification: newTreatment.therapistQualification,
          contraindications: newTreatment.contraindications,
          precautions: newTreatment.precautions,
          description: newTreatment.description,
          treatmentStatus: newTreatment.status,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data?.treatmentId) {
          setTreatments((prev) =>
            prev.map((t) => (t.id === newTreatment.id ? { ...t, dbId: json.data.treatmentId } : t))
          );
        }
      }
    } catch (err) {
      console.warn('Backend sync fallback for add treatment', err);
    }

    showToast(`Đã thêm mới liệu trình "${newTreatment.treatmentName}" thành công!`, 'success');
  };

  // Toggle Treatment Status (Ngừng gói / Kích hoạt lại) - Quy định: Không cho phép xóa, chỉ ngừng gói
  const handleToggleTreatmentStatus = async (item: SpaTreatmentItem) => {
    if (!canManageSpa) {
      showToast('Thao tác bị từ chối: Quản lý cần được Quản Trị Viên ủy quyền để thay đổi trạng thái liệu trình Spa.', 'error');
      return;
    }

    const isStopping = item.status === 'ACTIVE';
    if (isStopping) {
      const confirmed = window.confirm(
        `XÁC NHẬN NGỪNG GÓI LIỆU TRÌNH:\n\nBạn có chắc chắn muốn ngừng áp dụng liệu trình "${item.treatmentName}" (${item.treatmentCode}) không?\n\n• Quy định hệ thống: Gói chỉ được phép ngừng cung cấp (chuyển sang Tạm dừng/Inactive), KHÔNG ĐƯỢC PHÉP XÓA để bảo toàn lịch sử dịch vụ và đối soát.\n• Sau khi ngừng, gói sẽ không xuất hiện cho khách đặt mới.`
      );
      if (!confirmed) return;
    }

    const newStatus: SpaStatus = isStopping ? 'INACTIVE' : 'ACTIVE';
    const updated = { ...item, status: newStatus };
    setTreatments((prev) => prev.map((t) => (t.id === item.id ? updated : t)));

    try {
      const identifier = item.dbId || item.treatmentCode || item.id;
      await fetch(`http://localhost:8080/api/v1/spa/treatments/${encodeURIComponent(identifier)}/status`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ treatmentStatus: newStatus }),
      });
    } catch (err) {
      console.warn('Failed to update status in DB:', err);
    }

    showToast(
      isStopping
        ? `Đã ngừng gói "${item.treatmentName}" (Trạng thái: Tạm dừng)!`
        : `Đã kích hoạt lại gói "${item.treatmentName}" thành công!`,
      isStopping ? 'warning' : 'success'
    );

    logAuditEvent({
      actorId: role === 'admin' ? 'usr-admin' : 'usr-mgr-01',
      actorName: role === 'admin' ? 'Quản trị viên' : 'Sarah Jenkins',
      actorRole: role || 'manager',
      action: 'TOGGLE',
      dataCategory: 'SECURITY_GOVERNANCE',
      targetRef: item.treatmentCode,
      result: 'SUCCESS',
      detailsKey: isStopping ? 'audit.deactivateSpaTreatment' : 'audit.activateSpaTreatment',
      detailsFallback: isStopping
        ? `Ngừng cung cấp liệu trình "${item.treatmentName}".`
        : `Kích hoạt lại liệu trình "${item.treatmentName}".`
    });
  };

  // Handle Save Package
  const handleSavePackage = async (updated: RetreatPackageItem) => {
    if (!canManageSpa) {
      showToast('Thao tác bị từ chối: Quản lý chưa được Quản Trị Viên ủy quyền để chỉnh sửa gói nghỉ dưỡng.', 'error');
      return;
    }

    setPackages((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    setEditingPackage(null);

    try {
      const identifier = updated.dbId || updated.packageCode || updated.id;
      const res = await fetch(`http://localhost:8080/api/v1/retreat-packages/${encodeURIComponent(identifier)}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          packageCode: updated.packageCode,
          packageName: updated.packageName,
          wellnessGoal: updated.wellnessGoal,
          durationNights: updated.durationNights,
          durationUnit: updated.durationUnit || 'Đêm (Nights)',
          basePrice: updated.basePrice,
          basePriceUnit: updated.basePriceUnit || 'VND/khách/gói',
          includedTreatments: updated.includedTreatments,
          dietaryPlan: updated.dietaryPlan,
          extraChargePolicy: updated.extraChargePolicy,
          targetGuest: updated.targetGuest,
          packageStatus: updated.status,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.message || `Lỗi máy chủ (${res.status})`);
      }

      showToast(`Đã lưu thay đổi giá và thông tin gói "${updated.packageName}" vào CSDL SQL Server!`, 'success');
    } catch (err: any) {
      console.error('Failed to save package to DB:', err);
      showToast(`Không thể lưu vào CSDL: ${err.message || 'Lỗi mạng'}`, 'error');
    }

    logAuditEvent({
      actorId: role === 'admin' ? 'usr-admin' : 'usr-mgr-01',
      actorName: role === 'admin' ? 'Quản trị viên' : 'Sarah Jenkins',
      actorRole: role || 'manager',
      action: 'UPDATE',
      dataCategory: 'SECURITY_GOVERNANCE',
      targetRef: updated.packageCode,
      result: 'SUCCESS',
      detailsKey: 'audit.updateRetreatPackage',
      detailsFallback: `Cập nhật gói nghỉ dưỡng "${updated.packageName}" thành công.`
    });
  };

  // Handle Add Package
  const handleAddPackage = async (newPkg: RetreatPackageItem) => {
    if (!canManageSpa) {
      showToast('Thao tác bị từ chối: Quản lý chưa được Quản Trị Viên ủy quyền để thêm gói nghỉ dưỡng mới.', 'error');
      return;
    }

    setPackages((prev) => [newPkg, ...prev]);
    setIsAddPackageOpen(false);

    try {
      const res = await fetch('http://localhost:8080/api/v1/retreat-packages', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          packageCode: newPkg.packageCode,
          packageName: newPkg.packageName,
          wellnessGoal: newPkg.wellnessGoal,
          durationNights: newPkg.durationNights,
          durationUnit: newPkg.durationUnit || 'Đêm (Nights)',
          basePrice: newPkg.basePrice,
          basePriceUnit: newPkg.basePriceUnit || 'VND/khách/gói',
          includedTreatments: newPkg.includedTreatments,
          dietaryPlan: newPkg.dietaryPlan,
          extraChargePolicy: newPkg.extraChargePolicy,
          targetGuest: newPkg.targetGuest,
          packageStatus: newPkg.status,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data?.retreatPackageId) {
          setPackages((prev) =>
            prev.map((p) => (p.id === newPkg.id ? { ...p, dbId: json.data.retreatPackageId } : p))
          );
        }
      }
    } catch (err) {
      console.warn('Backend sync fallback for add package', err);
    }

    showToast(`Đã thêm mới gói nghỉ dưỡng "${newPkg.packageName}" thành công!`, 'success');
  };

  // Toggle Package Status (Ngừng gói / Kích hoạt lại) - Quy định: Không cho phép xóa, chỉ ngừng gói
  const handleTogglePackageStatus = async (item: RetreatPackageItem) => {
    if (!canManageSpa) {
      showToast('Thao tác bị từ chối: Quản lý cần được Quản Trị Viên ủy quyền để thay đổi trạng thái gói nghỉ dưỡng.', 'error');
      return;
    }

    const isStopping = item.status === 'ACTIVE';
    if (isStopping) {
      const confirmed = window.confirm(
        `XÁC NHẬN NGỪNG GÓI RETREAT:\n\nBạn có chắc chắn muốn ngừng áp dụng gói nghỉ dưỡng "${item.packageName}" (${item.packageCode}) không?\n\n• Quy định hệ thống: Gói chỉ được phép ngừng cung cấp (chuyển sang Tạm dừng/Inactive), KHÔNG ĐƯỢC PHÉP XÓA để bảo toàn lịch sử lưu trú, lộ trình trị liệu và thanh toán.\n• Sau khi ngừng, gói sẽ không xuất hiện để đặt mới.`
      );
      if (!confirmed) return;
    }

    const newStatus: SpaStatus = isStopping ? 'INACTIVE' : 'ACTIVE';
    const updated = { ...item, status: newStatus };
    setPackages((prev) => prev.map((p) => (p.id === item.id ? updated : p)));

    try {
      const identifier = item.dbId || item.packageCode || item.id;
      await fetch(`http://localhost:8080/api/v1/retreat-packages/${encodeURIComponent(identifier)}/status`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ packageStatus: newStatus }),
      });
    } catch (err) {
      console.warn('Failed to update status in DB:', err);
    }

    showToast(
      isStopping
        ? `Đã ngừng gói nghỉ dưỡng "${item.packageName}" (Trạng thái: Tạm dừng)!`
        : `Đã kích hoạt lại gói nghỉ dưỡng "${item.packageName}" thành công!`,
      isStopping ? 'warning' : 'success'
    );

    logAuditEvent({
      actorId: role === 'admin' ? 'usr-admin' : 'usr-mgr-01',
      actorName: role === 'admin' ? 'Quản trị viên' : 'Sarah Jenkins',
      actorRole: role || 'manager',
      action: 'TOGGLE',
      dataCategory: 'SECURITY_GOVERNANCE',
      targetRef: item.packageCode,
      result: 'SUCCESS',
      detailsKey: isStopping ? 'audit.deactivateRetreatPackage' : 'audit.activateRetreatPackage',
      detailsFallback: isStopping
        ? `Ngừng cung cấp gói nghỉ dưỡng "${item.packageName}".`
        : `Kích hoạt lại gói nghỉ dưỡng "${item.packageName}".`
    });
  };

  // Stats
  const activeTreatmentsCount = treatments.filter((t) => t.status === 'ACTIVE').length;
  const avgSpaPrice = Math.round(
    treatments.reduce((sum, t) => sum + t.basePrice, 0) / (treatments.length || 1)
  );

  return (
    <div className="hsw-page-container" style={{ padding: '24px', maxWidth: '1440px', margin: '0 auto' }}>
      {/* 1. Header Banner */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              backgroundColor: 'rgba(46, 125, 90, 0.12)',
              color: '#2E7D5A',
              borderRadius: 'var(--radius-pill)',
              fontSize: '0.78rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              <Sparkles size={13} />
              HSWRMS Module 3 — Spa & Wellness Operations
            </span>

            {isDbSynced && (
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 10px',
                backgroundColor: 'rgba(56, 161, 105, 0.15)',
                color: '#276749',
                borderRadius: 'var(--radius-pill)',
                fontSize: '0.75rem',
                fontWeight: 600,
                border: '1px solid rgba(56, 161, 105, 0.3)'
              }}>
                <Database size={12} />
                Đã Đồng Bộ CSDL SQL Server (Live)
              </span>
            )}

            {/* Spa Authority Clearance Pill */}
            {canManageSpa ? (
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 10px',
                backgroundColor: '#e6f7ef',
                color: '#087443',
                borderRadius: 'var(--radius-pill)',
                fontSize: '0.75rem',
                fontWeight: 600,
                border: '1px solid #b6ebd0'
              }}>
                <ShieldCheck size={12} />
                {isAdmin ? 'Thẩm Quyền Admin Toàn Phần' : 'Được Admin Cấp Quyền Quản Trị Spa'}
              </span>
            ) : (
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 10px',
                backgroundColor: '#f3f4f6',
                color: '#4b5563',
                borderRadius: 'var(--radius-pill)',
                fontSize: '0.75rem',
                fontWeight: 600,
                border: '1px solid #e5e7eb'
              }}>
                <ShieldAlert size={12} />
                Giám Sát Spa Chỉ Đọc (Cần Admin Ủy Quyền)
              </span>
            )}
          </div>

          <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Quản Lý Gói Spa & Trị Liệu Chữa Lành
          </h1>
          <p style={{ margin: '6px 0 0 0', color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
            Quản trị danh mục 18 liệu trình A-la-carte, 8 gói Retreat trọn gói, phòng trị liệu và tiêu chuẩn kỹ thuật viên
          </p>
        </div>

        {/* Top Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <Button
            variant="secondary"
            size="sm"
            icon={<RefreshCw size={14} className={isLoadingDb ? 'hsw-spin' : ''} />}
            onClick={fetchSpaDataFromDb}
            disabled={isLoadingDb}
          >
            {isLoadingDb ? 'Đang Tải DB...' : 'Đồng Bộ Database'}
          </Button>

          {canManageSpa && (activeTab === 'treatments' ? (
            <Button
              variant="primary"
              size="sm"
              icon={<Plus size={15} />}
              onClick={() => setIsAddTreatmentOpen(true)}
            >
              Thêm Liệu Trình Mới
            </Button>
          ) : activeTab === 'packages' ? (
            <Button
              variant="primary"
              size="sm"
              icon={<Plus size={15} />}
              onClick={() => setIsAddPackageOpen(true)}
            >
              Tạo Gói Retreat Mới
            </Button>
          ) : null)}
        </div>
      </div>

      {/* 2. KPI Metrics Bar */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div style={{
          padding: '16px 20px',
          background: 'var(--bg-surface)',
          borderRadius: '12px',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-xs)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Liệu Trình Trị Liệu
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(46, 125, 90, 0.1)', color: '#2E7D5A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '8px', color: 'var(--text-primary)' }}>
            {treatments.length}{' '}
            <span style={{ fontSize: '0.8rem', fontWeight: 500, color: '#2E7D5A' }}>
              ({activeTreatmentsCount} Active)
            </span>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            18 liệu trình chuẩn hóa theo Excel
          </div>
        </div>

        <div style={{
          padding: '16px 20px',
          background: 'var(--bg-surface)',
          borderRadius: '12px',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-xs)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Gói Retreat Trọn Gói
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(197, 160, 89, 0.15)', color: '#9E7A24', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Package size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '8px', color: 'var(--text-primary)' }}>
            {packages.length}{' '}
            <span style={{ fontSize: '0.8rem', fontWeight: 500, color: '#9E7A24' }}>
              (Chiva-Som Model)
            </span>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Lộ trình từ 2 đến 4 đêm lưu trú
          </div>
        </div>

        <div style={{
          padding: '16px 20px',
          background: 'var(--bg-surface)',
          borderRadius: '12px',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-xs)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Phòng Trị Liệu Spa
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(49, 130, 206, 0.12)', color: '#2B6CB0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Home size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '8px', color: 'var(--text-primary)' }}>
            {rooms.length}{' '}
            <span style={{ fontSize: '0.8rem', fontWeight: 500, color: '#2B6CB0' }}>
              (100% Sẵn Sàng)
            </span>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            VIP Suite, Vichy Shower, Yoga Sala...
          </div>
        </div>

        <div style={{
          padding: '16px 20px',
          background: 'var(--bg-surface)',
          borderRadius: '12px',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-xs)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Giá Trung Bình Dịch Vụ
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(214, 158, 46, 0.12)', color: '#B7791F', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DollarSign size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 800, marginTop: '8px', color: '#B7791F' }}>
            {formatVND(avgSpaPrice)}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Dao động từ 800.000₫ đến 1.750.000₫
          </div>
        </div>
      </div>

      {/* 3. Navigation Tabs */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--border-subtle)',
        marginBottom: '20px',
        gap: '8px',
        overflowX: 'auto'
      }}>
        <button
          type="button"
          onClick={() => setActiveTab('treatments')}
          style={{
            padding: '10px 18px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'treatments' ? '2px solid var(--primary-accent)' : '2px solid transparent',
            color: activeTab === 'treatments' ? 'var(--text-primary)' : 'var(--text-secondary)',
            fontWeight: activeTab === 'treatments' ? 700 : 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.92rem'
          }}
        >
          <Sparkles size={16} />
          Liệu Trình Spa Đơn Lẻ ({treatments.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('packages')}
          style={{
            padding: '10px 18px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'packages' ? '2px solid var(--primary-accent)' : '2px solid transparent',
            color: activeTab === 'packages' ? 'var(--text-primary)' : 'var(--text-secondary)',
            fontWeight: activeTab === 'packages' ? 700 : 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.92rem'
          }}
        >
          <Package size={16} />
          Gói Retreat Trọn Gói ({packages.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('rooms')}
          style={{
            padding: '10px 18px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'rooms' ? '2px solid var(--primary-accent)' : '2px solid transparent',
            color: activeTab === 'rooms' ? 'var(--text-primary)' : 'var(--text-secondary)',
            fontWeight: activeTab === 'rooms' ? 700 : 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.92rem'
          }}
        >
          <Home size={16} />
          Phòng Trị Liệu ({rooms.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('rules')}
          style={{
            padding: '10px 18px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'rules' ? '2px solid var(--primary-accent)' : '2px solid transparent',
            color: activeTab === 'rules' ? 'var(--text-primary)' : 'var(--text-secondary)',
            fontWeight: activeTab === 'rules' ? 700 : 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.92rem'
          }}
        >
          <Layers size={16} />
          Ràng Buộc Kỹ Thuật (Rule Matrix)
        </button>
      </div>

      {/* 4. Filter & Search Toolbar */}
      {(activeTab === 'treatments' || activeTab === 'packages') && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          padding: '16px',
          background: 'var(--bg-surface)',
          borderRadius: '12px',
          border: '1px solid var(--border-subtle)',
          marginBottom: '20px'
        }}>
          {/* Search Box */}
          <div style={{ position: 'relative', minWidth: '280px', flex: '1 1 300px' }}>
            <Search
              size={16}
              style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}
            />
            <input
              type="text"
              className="hsw-input"
              style={{ paddingLeft: '36px', width: '100%' }}
              placeholder={activeTab === 'treatments' ? 'Tìm theo tên, mã (SPA-MASS-01), chống chỉ định...' : 'Tìm theo tên gói, mã, mục tiêu sức khỏe...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Category Filter for Treatments */}
          {activeTab === 'treatments' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Phân loại:</span>
              <select
                className="hsw-input"
                style={{ width: 'auto', padding: '6px 12px' }}
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                {categoriesList.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat === 'ALL' ? 'Tất cả phân nhóm' : cat}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Status Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Trạng thái:</span>
            <select
              className="hsw-input"
              style={{ width: 'auto', padding: '6px 12px' }}
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="ALL">Tất cả</option>
              <option value="ACTIVE">Đang hoạt động</option>
              <option value="INACTIVE">Tạm dừng</option>
            </select>
          </div>

          {/* View Mode Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--bg-secondary)', padding: '3px', borderRadius: '8px' }}>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              style={{
                padding: '6px 10px',
                border: 'none',
                background: viewMode === 'grid' ? 'var(--bg-surface)' : 'transparent',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                boxShadow: viewMode === 'grid' ? 'var(--shadow-xs)' : 'none'
              }}
              title="Lưới Thẻ"
            >
              <Grid size={15} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              style={{
                padding: '6px 10px',
                border: 'none',
                background: viewMode === 'table' ? 'var(--bg-surface)' : 'transparent',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                boxShadow: viewMode === 'table' ? 'var(--shadow-xs)' : 'none'
              }}
              title="Bảng Chi Tiết"
            >
              <ListIcon size={15} />
            </button>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 1: SPA TREATMENTS LIST
          ===================================================================== */}
      {activeTab === 'treatments' && (
        <>
          {filteredTreatments.length === 0 ? (
            <div style={{ padding: '60px 20px', textAlign: 'center', background: 'var(--bg-surface)', borderRadius: '12px' }}>
              <Sparkles size={36} color="var(--text-secondary)" style={{ margin: '0 auto 12px auto' }} />
              <h3 style={{ margin: 0, fontWeight: 600 }}>Không tìm thấy liệu trình phù hợp</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>Vui lòng thay đổi từ khóa tìm kiếm hoặc bộ lọc phân nhóm.</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '20px'
            }}>
              {filteredTreatments.map((t) => (
                <div
                  key={t.id}
                  style={{
                    background: 'var(--bg-surface)',
                    borderRadius: '14px',
                    border: '1px solid var(--border-subtle)',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: 'var(--shadow-xs)',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                  }}
                >
                  {/* Card Image */}
                  <div style={{ position: 'relative', height: '180px', width: '100%', overflow: 'hidden' }}>
                    <img
                      src={t.image || 'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?auto=format&fit=crop&w=800&q=80'}
                      alt={t.treatmentName}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=800&q=80';
                      }}
                    />
                    <div style={{
                      position: 'absolute',
                      top: '12px',
                      left: '12px',
                      display: 'flex',
                      gap: '6px'
                    }}>
                      <span style={{
                        padding: '3px 8px',
                        background: 'rgba(0,0,0,0.65)',
                        backdropFilter: 'blur(4px)',
                        color: '#fff',
                        borderRadius: 'var(--radius-pill)',
                        fontSize: '0.72rem',
                        fontWeight: 700
                      }}>
                        {t.treatmentCode}
                      </span>
                      <span style={{
                        padding: '3px 8px',
                        background: 'rgba(212, 175, 55, 0.85)',
                        color: '#1a1a1a',
                        borderRadius: 'var(--radius-pill)',
                        fontSize: '0.72rem',
                        fontWeight: 700
                      }}>
                        {t.category}
                      </span>
                    </div>

                    {canManageSpa ? (
                      <button
                        type="button"
                        onClick={() => handleToggleTreatmentStatus(t)}
                        style={{
                          position: 'absolute',
                          top: '12px',
                          right: '12px',
                          padding: '3px 10px',
                          background: t.status === 'ACTIVE'
                            ? 'rgba(46, 125, 90, 0.95)'
                            : 'rgba(113, 128, 150, 0.95)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 'var(--radius-pill)',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                        }}
                        title="Nhấn để ngừng gói hoặc kích hoạt lại"
                      >
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: t.status === 'ACTIVE' ? '#48BB78' : '#E2E8F0' }}></span>
                        {t.status === 'ACTIVE' ? 'Active' : 'Ngừng gói'}
                      </button>
                    ) : (
                      <span
                        style={{
                          position: 'absolute',
                          top: '12px',
                          right: '12px',
                          padding: '3px 10px',
                          background: t.status === 'ACTIVE'
                            ? 'rgba(46, 125, 90, 0.95)'
                            : 'rgba(113, 128, 150, 0.95)',
                          color: '#fff',
                          borderRadius: 'var(--radius-pill)',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          cursor: 'default'
                        }}
                      >
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: t.status === 'ACTIVE' ? '#48BB78' : '#E2E8F0' }}></span>
                        {t.status === 'ACTIVE' ? 'Active' : 'Ngừng gói'}
                      </span>
                    )}
                  </div>

                  {/* Card Content */}
                  <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: 1, gap: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, lineHeight: 1.35, color: 'var(--text-primary)', fontFamily: 'var(--font-ui)' }}>
                        {t.treatmentName}
                      </h3>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '0.85rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-secondary)' }}>
                        <Clock size={14} color="#2E7D5A" />
                        <strong>{t.durationMinutes}</strong> phút
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#B7791F', fontWeight: 700 }}>
                        <DollarSign size={14} />
                        {formatVND(t.basePrice)}
                      </span>
                    </div>

                    <p style={{
                      margin: 0,
                      fontSize: '0.82rem',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.5,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {t.description}
                    </p>

                    {/* Room & Qualification info */}
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px', marginTop: 'auto', paddingTop: '8px', borderTop: '1px solid var(--border-subtle)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Home size={13} color="#2E7D5A" />
                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {t.roomCompatibility}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Award size={13} color="#9E7A24" />
                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {t.therapistQualification}
                        </span>
                      </div>
                    </div>

                    {/* Contraindication Pill */}
                    {t.contraindications && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 10px',
                        background: 'rgba(217, 83, 79, 0.08)',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        color: '#D9534F'
                      }}>
                        <AlertTriangle size={13} style={{ flexShrink: 0 }} />
                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {t.contraindications}
                        </span>
                      </div>
                    )}

                    {/* Card Actions */}
                    <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                      <Button
                        variant="tertiary"
                        size="sm"
                        style={{ flex: 1 }}
                        icon={<Eye size={14} />}
                        onClick={() => setViewingTreatment(t)}
                      >
                        Chi Tiết
                      </Button>
                      {canManageSpa && (
                        <Button
                          variant="secondary"
                          size="sm"
                          style={{ flex: 1 }}
                          icon={<Edit2 size={14} />}
                          onClick={() => {
                            setEditingTreatment(t);
                          }}
                          title="Chỉnh sửa liệu trình & đơn giá"
                        >
                          Chỉnh Sửa
                        </Button>
                      )}
                      {canManageSpa && (
                        <button
                          type="button"
                          onClick={() => handleToggleTreatmentStatus(t)}
                          title={
                            t.status === 'ACTIVE'
                              ? 'Ngừng áp dụng gói này (Chuyển sang Inactive, không xóa)'
                              : 'Kích hoạt lại gói này'
                          }
                          style={{
                            flex: 1,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '5px',
                            padding: '6px 10px',
                            borderRadius: '8px',
                            border: t.status === 'ACTIVE'
                              ? '1px solid rgba(221, 107, 32, 0.35)'
                              : '1px solid rgba(46, 125, 90, 0.35)',
                            background: t.status === 'ACTIVE'
                              ? 'rgba(221, 107, 32, 0.08)'
                              : 'rgba(46, 125, 90, 0.08)',
                            color: t.status === 'ACTIVE'
                              ? '#DD6B20'
                              : '#2E7D5A',
                            cursor: 'pointer',
                            fontWeight: 600,
                            fontSize: '0.8rem',
                            transition: 'all 0.2s ease',
                            opacity: 1
                          }}
                        >
                          {t.status === 'ACTIVE' ? (
                            <>
                              <PowerOff size={13} />
                              <span>Ngừng gói</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 size={13} />
                              <span>Kích hoạt</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Table View */
            <div style={{
              background: 'var(--bg-surface)',
              borderRadius: '12px',
              border: '1px solid var(--border-subtle)',
              overflowX: 'auto'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-subtle)' }}>
                    <th style={{ padding: '12px 16px' }}>Mã & Tên Liệu Trình</th>
                    <th style={{ padding: '12px 16px' }}>Phân Nhóm</th>
                    <th style={{ padding: '12px 16px' }}>Thời Lượng</th>
                    <th style={{ padding: '12px 16px' }}>Đơn Giá</th>
                    <th style={{ padding: '12px 16px' }}>Phòng & Kỹ Thuật Viên</th>
                    <th style={{ padding: '12px 16px' }}>Chống Chỉ Định Y Tế</th>
                    <th style={{ padding: '12px 16px' }}>Trạng Thái</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>Thao Tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTreatments.map((t) => (
                    <tr key={t.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{t.treatmentName}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{t.treatmentCode}</div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ padding: '2px 8px', borderRadius: 'var(--radius-pill)', background: 'var(--bg-secondary)', fontSize: '0.78rem', fontWeight: 600 }}>
                          {t.category}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 600 }}>{t.durationMinutes} phút</td>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: '#C5A059' }}>{formatVND(t.basePrice)}</td>
                      <td style={{ padding: '12px 16px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        <div>{t.roomCompatibility}</div>
                        <div style={{ color: '#9E7A24' }}>{t.therapistQualification}</div>
                      </td>
                      <td style={{ padding: '12px 16px', maxWidth: '240px' }}>
                        <span style={{ fontSize: '0.78rem', color: '#D9534F', lineHeight: 1.3 }}>
                          {t.contraindications || '—'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {canManageSpa ? (
                          <button
                            type="button"
                            onClick={() => handleToggleTreatmentStatus(t)}
                            style={{
                              padding: '3px 8px',
                              background: t.status === 'ACTIVE' ? 'rgba(46, 125, 90, 0.15)' : 'rgba(113, 128, 150, 0.15)',
                              color: t.status === 'ACTIVE' ? '#2E7D5A' : '#718096',
                              border: 'none',
                              borderRadius: 'var(--radius-pill)',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            {t.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                          </button>
                        ) : (
                          <span
                            style={{
                              padding: '3px 8px',
                              background: t.status === 'ACTIVE' ? 'rgba(46, 125, 90, 0.15)' : 'rgba(113, 128, 150, 0.15)',
                              color: t.status === 'ACTIVE' ? '#2E7D5A' : '#718096',
                              borderRadius: 'var(--radius-pill)',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              cursor: 'default'
                            }}
                          >
                            {t.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                          <button
                            type="button"
                            className="hsw-action-btn"
                            onClick={() => setViewingTreatment(t)}
                            title="Xem chi tiết"
                          >
                            <Eye size={15} />
                          </button>
                          {canManageSpa && (
                            <button
                              type="button"
                              className="hsw-action-btn"
                              onClick={() => {
                                setEditingTreatment(t);
                              }}
                              title="Chỉnh sửa liệu trình & đơn giá"
                            >
                              <Edit2 size={15} />
                            </button>
                          )}
                          {canManageSpa && (
                            <button
                              type="button"
                              className="hsw-action-btn"
                              onClick={() => handleToggleTreatmentStatus(t)}
                              title={
                                t.status === 'ACTIVE'
                                  ? 'Ngừng áp dụng gói'
                                  : 'Kích hoạt lại gói'
                              }
                              style={{
                                color: t.status === 'ACTIVE' ? '#DD6B20' : '#2E7D5A',
                                opacity: 1
                              }}
                            >
                              {t.status === 'ACTIVE' ? (
                                <PowerOff size={15} />
                              ) : (
                                <CheckCircle2 size={15} />
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* =====================================================================
          TAB 2: RETREAT PACKAGES
          ===================================================================== */}
      {activeTab === 'packages' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
          gap: '20px'
        }}>
          {filteredPackages.map((p) => (
            <div
              key={p.id}
              style={{
                background: 'var(--bg-surface)',
                borderRadius: '14px',
                border: '1px solid var(--border-subtle)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: 'var(--shadow-xs)'
              }}
            >
              {/* Image header */}
              <div style={{ position: 'relative', height: '170px', width: '100%' }}>
                <img
                  src={p.image || 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80'}
                  alt={p.packageName}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80';
                  }}
                />
                <div style={{ position: 'absolute', top: '12px', left: '12px', display: 'flex', gap: '6px' }}>
                  <span style={{ padding: '3px 8px', background: 'rgba(0,0,0,0.65)', color: '#fff', borderRadius: 'var(--radius-pill)', fontSize: '0.72rem', fontWeight: 700 }}>
                    {p.packageCode}
                  </span>
                  <span style={{ padding: '3px 8px', background: 'rgba(46, 125, 90, 0.9)', color: '#fff', borderRadius: 'var(--radius-pill)', fontSize: '0.72rem', fontWeight: 700 }}>
                    {p.durationNights} Đêm
                  </span>
                </div>
                {canManageSpa ? (
                  <button
                    type="button"
                    onClick={() => handleTogglePackageStatus(p)}
                    style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      padding: '3px 10px',
                      background: p.status === 'ACTIVE' ? '#2E7D5A' : '#718096',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 'var(--radius-pill)',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }}
                    title="Nhấn để ngừng gói hoặc kích hoạt lại"
                  >
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: p.status === 'ACTIVE' ? '#48BB78' : '#E2E8F0' }}></span>
                    {p.status === 'ACTIVE' ? 'Active' : 'Ngừng gói'}
                  </button>
                ) : (
                  <span
                    style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      padding: '3px 10px',
                      background: p.status === 'ACTIVE' ? '#2E7D5A' : '#718096',
                      color: '#fff',
                      borderRadius: 'var(--radius-pill)',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      cursor: 'default'
                    }}
                  >
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: p.status === 'ACTIVE' ? '#48BB78' : '#E2E8F0' }}></span>
                    {p.status === 'ACTIVE' ? 'Active' : 'Ngừng gói'}
                  </span>
                )}
              </div>

              {/* Package Details */}
              <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: 1, gap: '12px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-ui)' }}>
                    {p.packageName}
                  </h3>
                  <div style={{ fontSize: '0.82rem', color: '#9E7A24', fontWeight: 600, marginTop: '4px' }}>
                    Mục tiêu: {p.wellnessGoal}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Giá Gốc Trọn Gói:</span>
                  <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#C5A059' }}>{formatVND(p.basePrice)}</span>
                </div>

                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>Liệu trình trị liệu bao gồm:</div>
                  <div style={{ whiteSpace: 'pre-line', lineHeight: 1.5, maxHeight: '80px', overflowY: 'auto' }}>
                    {p.includedTreatments}
                  </div>
                </div>

                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 'auto', paddingTop: '8px', borderTop: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Utensils size={13} color="#C5A059" />
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {p.dietaryPlan}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                  <Button
                    variant="tertiary"
                    size="sm"
                    style={{ flex: 1 }}
                    icon={<Eye size={14} />}
                    onClick={() => setViewingPackage(p)}
                  >
                    Xem Chi Tiết
                  </Button>
                  {canManageSpa && (
                    <Button
                      variant="secondary"
                      size="sm"
                      style={{ flex: 1 }}
                      icon={<Edit2 size={14} />}
                      onClick={() => {
                        setEditingPackage(p);
                      }}
                      title="Chỉnh sửa gói retreat & biểu giá"
                    >
                      Chỉnh Sửa
                    </Button>
                  )}
                  {canManageSpa && (
                    <button
                      type="button"
                      onClick={() => handleTogglePackageStatus(p)}
                      title={
                        p.status === 'ACTIVE'
                          ? 'Ngừng gói retreat này (Chuyển sang Inactive, không xóa)'
                          : 'Kích hoạt lại gói này'
                      }
                      style={{
                        flex: 1,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '5px',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        border: p.status === 'ACTIVE'
                          ? '1px solid rgba(221, 107, 32, 0.35)'
                          : '1px solid rgba(46, 125, 90, 0.35)',
                        background: p.status === 'ACTIVE'
                          ? 'rgba(221, 107, 32, 0.08)'
                          : 'rgba(46, 125, 90, 0.08)',
                        color: p.status === 'ACTIVE'
                          ? '#DD6B20'
                          : '#2E7D5A',
                        cursor: 'pointer',
                        fontWeight: 600,
                        fontSize: '0.8rem',
                        transition: 'all 0.2s ease',
                        opacity: 1
                      }}
                    >
                      {p.status === 'ACTIVE' ? (
                        <>
                          <PowerOff size={13} />
                          <span>Ngừng gói</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={13} />
                          <span>Kích hoạt</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* =====================================================================
          TAB 3: TREATMENT ROOMS
          ===================================================================== */}
      {activeTab === 'rooms' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '16px'
        }}>
          {rooms.map((r) => (
            <div
              key={r.id}
              style={{
                padding: '16px',
                background: 'var(--bg-surface)',
                borderRadius: '12px',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '2px 8px', background: 'rgba(46, 125, 90, 0.12)', color: '#2E7D5A', borderRadius: 'var(--radius-pill)' }}>
                  {r.roomType}
                </span>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: r.status === 'AVAILABLE' ? '#2E7D5A' : '#E53E3E' }}>
                  ● {r.status}
                </span>
              </div>
              <h4 style={{ margin: '4px 0', fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {r.roomName}
              </h4>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Trang bị theo tiêu chuẩn cách âm cao cấp, hệ thống sưởi khoáng và đèn quang học trị liệu.
              </div>
            </div>
          ))}
        </div>
      )}

      {/* =====================================================================
          TAB 4: RULES & SYSTEM CONFIGURATION
          ===================================================================== */}
      {activeTab === 'rules' && (
        <div style={{
          background: 'var(--bg-surface)',
          borderRadius: '14px',
          border: '1px solid var(--border-subtle)',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Quy Tắc Nghiệp Vụ & Ràng Buộc Kỹ Thuật (Module 3 System Rules)
            </h3>
            <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
              Trích xuất từ Sheet 3: Cấu hình hệ thống HSWRMS & SRS Business Rules
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
            <div style={{ padding: '16px', background: 'var(--bg-secondary)', borderRadius: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: '#2E7D5A' }}>
                <CheckCircle2 size={16} />
                Rule 11: Therapist Qualification Rule
              </div>
              <p style={{ margin: '8px 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Kỹ thuật viên chỉ được hệ thống gán vào các phiên trị liệu có chứng chỉ hợp lệ. Hệ thống tự động lọc (Auto-match) chứng chỉ theo từng dịch vụ.
              </p>
            </div>

            <div style={{ padding: '16px', background: 'var(--bg-secondary)', borderRadius: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: '#2E7D5A' }}>
                <CheckCircle2 size={16} />
                Rule 12: Treatment-Room Compatibility Rule
              </div>
              <p style={{ margin: '8px 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Mỗi phòng chỉ tương thích với một số loại liệu trình (ví dụ: bồn tắm thảo dược cần phòng Hydrotherapy; Vichy Shower cần phòng chuyên dụng).
              </p>
            </div>

            <div style={{ padding: '16px', background: 'var(--bg-secondary)', borderRadius: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: '#C5A059' }}>
                <CheckCircle2 size={16} />
                Rule 13 & 14, GB-M3-05: 2D Atomic Lock
              </div>
              <p style={{ margin: '8px 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Giao dịch đặt lịch chỉ thành công khi cả KTV và Phòng đều trống trong cùng khung giờ. Không chấp nhận đặt thành công một nửa.
              </p>
            </div>

            <div style={{ padding: '16px', background: 'var(--bg-secondary)', borderRadius: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: '#D9534F' }}>
                <AlertTriangle size={16} />
                Rule 4, GB-M3-12: Safety Minimization
              </div>
              <p style={{ margin: '8px 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Màn hình Kỹ thuật viên (S33) CHỈ hiển thị ghi chú y tế liên quan trực tiếp đến buổi spa, ẩn toàn bộ thông tin thanh toán & tài khoản của khách.
              </p>
            </div>

            <div style={{ padding: '16px', background: 'var(--bg-secondary)', borderRadius: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: '#2B6CB0' }}>
                <CheckCircle2 size={16} />
                Rule 20 & 21, GB-M3-15: Extra Spa Folio Boundary
              </div>
              <p style={{ margin: '8px 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Liệu trình trong gói Retreat: Không phát sinh tiền. Liệu trình đặt thêm (Extra): Ghi nợ vào Folio của phòng để quyết toán trả phòng tại quầy lễ tân.
              </p>
            </div>
          </div>

          {/* Section: Master Room Types */}
          <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Home size={18} color="#C5A059" />
              <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Bảng Chuẩn Hóa 11 Loại Phòng Trị Liệu & Tiện Ích (Sheet 6 - Room Types)
              </h4>
            </div>
            <div style={{
              background: 'var(--bg-secondary)',
              borderRadius: '10px',
              border: '1px solid var(--border-subtle)',
              overflowX: 'auto'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ background: 'rgba(0,0,0,0.04)', borderBottom: '1px solid var(--border-subtle)' }}>
                    <th style={{ padding: '10px 14px', width: '220px' }}>Mã Loại Phòng</th>
                    <th style={{ padding: '10px 14px' }}>Tên Loại Phòng Trị Liệu</th>
                    <th style={{ padding: '10px 14px' }}>Thông Số Kỹ Thuật & Tiện Ích</th>
                    <th style={{ padding: '10px 14px', textAlign: 'center', width: '130px' }}>Trạng Thái Chuẩn</th>
                  </tr>
                </thead>
                <tbody>
                  {ROOM_TYPES_MASTER.map((rt) => (
                    <tr key={rt.roomType} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontWeight: 700, color: '#C5A059' }}>
                        {rt.roomType}
                      </td>
                      <td style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {rt.typeName}
                      </td>
                      <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>
                        {rt.technicalSpecs}
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                        <span style={{
                          padding: '2px 8px',
                          background: 'rgba(46, 125, 90, 0.12)',
                          color: '#2E7D5A',
                          borderRadius: 'var(--radius-pill)',
                          fontSize: '0.72rem',
                          fontWeight: 700
                        }}>
                          {rt.designStatus || 'ACTIVE'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section: Master Qualifications */}
          <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Award size={18} color="#2E7D5A" />
              <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Bảng Chuẩn Hóa 17 Chứng Chỉ & Chuyên Môn KTV (Sheet 7 - Qualifications)
              </h4>
            </div>
            <div style={{
              background: 'var(--bg-secondary)',
              borderRadius: '10px',
              border: '1px solid var(--border-subtle)',
              overflowX: 'auto'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ background: 'rgba(0,0,0,0.04)', borderBottom: '1px solid var(--border-subtle)' }}>
                    <th style={{ padding: '10px 14px', width: '260px' }}>Mã Chứng Chỉ</th>
                    <th style={{ padding: '10px 14px' }}>Tên Bằng Cấp / Tiêu Chuẩn Năng Lực</th>
                    <th style={{ padding: '10px 14px', textAlign: 'center', width: '140px' }}>Trạng Thái Chuẩn</th>
                  </tr>
                </thead>
                <tbody>
                  {QUALIFICATIONS_MASTER.map((q) => (
                    <tr key={q.qualificationCode} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontWeight: 700, color: '#2E7D5A' }}>
                        {q.qualificationCode}
                      </td>
                      <td style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {q.qualificationName}
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                        <span style={{
                          padding: '2px 8px',
                          background: 'rgba(46, 125, 90, 0.12)',
                          color: '#2E7D5A',
                          borderRadius: 'var(--radius-pill)',
                          fontSize: '0.72rem',
                          fontWeight: 700
                        }}>
                          {q.baselineStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODALS
          ===================================================================== */}
      {/* 1. Edit Spa Treatment Modal */}
      <EditSpaTreatmentModal
        isOpen={Boolean(editingTreatment)}
        treatment={editingTreatment}
        onClose={() => setEditingTreatment(null)}
        onSave={handleSaveTreatment}
      />

      {/* 2. Add Spa Treatment Modal */}
      <AddSpaTreatmentFullModal
        isOpen={isAddTreatmentOpen}
        onClose={() => setIsAddTreatmentOpen(false)}
        onAdd={handleAddTreatment}
      />

      {/* 3. View Spa Treatment Detail Modal */}
      <SpaTreatmentDetailModal
        isOpen={Boolean(viewingTreatment)}
        treatment={viewingTreatment}
        onClose={() => setViewingTreatment(null)}
        onEdit={(t) => {
          setViewingTreatment(null);
          setEditingTreatment(t);
        }}
        canEdit={canManageSpa}
      />

      {/* 4. Edit Retreat Package Modal */}
      <EditRetreatPackageModal
        isOpen={Boolean(editingPackage)}
        pkg={editingPackage}
        onClose={() => setEditingPackage(null)}
        onSave={handleSavePackage}
      />

      {/* 5. Add Retreat Package Modal */}
      <AddRetreatPackageFullModal
        isOpen={isAddPackageOpen}
        onClose={() => setIsAddPackageOpen(false)}
        onAdd={handleAddPackage}
      />

      {/* 6. View Retreat Package Detail Modal */}
      <RetreatPackageDetailModal
        isOpen={Boolean(viewingPackage)}
        pkg={viewingPackage}
        onClose={() => setViewingPackage(null)}
        onEdit={(p) => {
          setViewingPackage(null);
          setEditingPackage(p);
        }}
        canEdit={canManageSpa}
      />
    </div>
  );
};
