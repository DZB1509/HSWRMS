import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Container } from '../../components/common/Container';
import { Button } from '../../components/common/Button';
import { CustomerPageHeader } from '../../components/customer/CustomerPageHeader';
import { formatVND } from '../../i18n';
import { useCustomer } from '../../context/CustomerContext';
import { useAuth } from '../../hooks/useAuth';
import {
  Calendar,
  Sparkles,
  ArrowRight,
  Home,
  AlertCircle,
  Loader2,
  CheckCircle2,
  User,
  AlertTriangle,
} from 'lucide-react';
import {
  getRetreatPackages,
  getVillaCategories,
  calculateBooking,
  createCustomerBooking,
  type RetreatPackageDto,
  type VillaCategoryDto,
  type BookingCalculationResponse,
} from '../../api/booking/retreatBookingApi';

export const RetreatBookingPage: React.FC = () => {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { profile } = useCustomer();
  const { currentUser } = useAuth();

  const [packages, setPackages] = useState<RetreatPackageDto[]>([]);
  const [categories, setCategories] = useState<VillaCategoryDto[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [selectedPackageId, setSelectedPackageId] = useState<number | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);

  // Today string for date constraint
  const todayStr = new Date().toISOString().split('T')[0];

  // Default start date: tomorrow
  const getDefaultStartDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  };

  const [startDate, setStartDate] = useState(getDefaultStartDate);
  const [guestCount, setGuestCount] = useState(1);
  const [specialRequests, setSpecialRequests] = useState('');

  // Customer Personal Information Fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');

  // Form Validation & Errors (Vietnamese)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  // Calculation state
  const [calculation, setCalculation] = useState<BookingCalculationResponse | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [calcError, setCalcError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Auto-fill from customer profile or current auth persona
  useEffect(() => {
    if (!fullName) {
      setFullName(profile?.fullName || currentUser?.name || 'Eleanor Vance');
    }
    if (!email) {
      setEmail(profile?.email || currentUser?.email || 'customer@heavenstay.com');
    }
    if (!phoneNumber) {
      setPhoneNumber(profile?.phone || '+84 901 234 567');
    }
    if (!emergencyContact) {
      const contactStr = profile?.emergencyContact
        ? `${profile.emergencyContact.name} (${profile.emergencyContact.phone} - ${profile.emergencyContact.relationship})`
        : 'Mr. Vance (+84 909 888 777)';
      setEmergencyContact(contactStr);
    }
  }, [profile, currentUser]);

  // 1. Initial Load from SQL Server
  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      setLoadingInitial(true);
      setLoadError(null);
      try {
        const [pkgs, cats] = await Promise.all([
          getRetreatPackages(),
          getVillaCategories(),
        ]);

        if (!isMounted) return;
        setPackages(pkgs);
        setCategories(cats);

        // Determine initially selected package from packageId, retreat, or retreatPackageId query parameter
        const retreatQuery =
          searchParams.get('packageId') ||
          searchParams.get('retreat') ||
          searchParams.get('retreatPackageId');

        let initialPkg = pkgs[0];
        if (retreatQuery) {
          const match = pkgs.find(
            (p) =>
              String(p.retreatPackageId) === retreatQuery ||
              p.packageCode.toLowerCase() === retreatQuery.toLowerCase()
          );
          if (match) initialPkg = match;
        }

        if (initialPkg) {
          setSelectedPackageId(initialPkg.retreatPackageId);
          // Choose first eligible category or fallback
          const eligible = initialPkg.eligibleVillaCategories;
          if (eligible && eligible.length > 0) {
            setSelectedCategoryId(eligible[0].villaCategoryId);
          } else if (cats.length > 0) {
            setSelectedCategoryId(cats[0].villaCategoryId);
          }
        }
      } catch (err: any) {
        if (!isMounted) return;
        setLoadError(err?.message || 'Không thể kết nối đến danh mục gói nghỉ dưỡng trên SQL Server.');
      } finally {
        if (isMounted) setLoadingInitial(false);
      }
    };

    init();
    return () => {
      isMounted = false;
    };
  }, [searchParams]);

  // Selected package object
  const selectedPkg = packages.find((p) => p.retreatPackageId === selectedPackageId) || null;

  // Filter categories to only those eligible for the package
  const eligibleCategories = selectedPkg?.eligibleVillaCategories && selectedPkg.eligibleVillaCategories.length > 0
    ? selectedPkg.eligibleVillaCategories
    : categories;

  // Selected category object
  const selectedCat = categories.find((c) => c.villaCategoryId === selectedCategoryId) || null;

  // Compute end date based on package nights
  const calculateEndDate = (start: string, nights: number) => {
    try {
      const d = new Date(start);
      d.setDate(d.getDate() + nights);
      return d.toISOString().split('T')[0];
    } catch {
      return start;
    }
  };

  const endDate = selectedPkg ? calculateEndDate(startDate, selectedPkg.durationNights) : startDate;

  // 2. Validate Check-in Date
  const handleStartDateChange = (val: string) => {
    setStartDate(val);
    const newErrors = { ...fieldErrors };
    if (!val) {
      newErrors.startDate = 'Vui lòng chọn ngày nhận phòng.';
    } else if (val < todayStr) {
      newErrors.startDate = 'Ngày nhận phòng không được là ngày trong quá khứ. Vui lòng chọn từ ngày hôm nay trở đi.';
    } else {
      delete newErrors.startDate;
    }
    setFieldErrors(newErrors);
  };

  // 3. Trigger Pricing Calculation whenever parameters change
  useEffect(() => {
    if (!selectedPackageId || !selectedCategoryId || !startDate || !selectedPkg || startDate < todayStr) {
      return;
    }

    let isCancelled = false;
    const runCalculation = async () => {
      setCalculating(true);
      setCalcError(null);
      try {
        const computedEndDate = calculateEndDate(startDate, selectedPkg.durationNights);
        const res = await calculateBooking({
          retreatPackageId: selectedPackageId,
          villaCategoryId: selectedCategoryId,
          checkInDate: startDate,
          checkOutDate: computedEndDate,
          guestCount,
        });

        if (!isCancelled) {
          setCalculation(res);
        }
      } catch (err: any) {
        if (!isCancelled) {
          setCalcError(err?.message || 'Không thể kiểm tra giá và phòng trống trên SQL Server.');
          setCalculation(null);
        }
      } finally {
        if (!isCancelled) setCalculating(false);
      }
    };

    runCalculation();
    return () => {
      isCancelled = true;
    };
  }, [selectedPackageId, selectedCategoryId, startDate, guestCount, selectedPkg, todayStr]);

  // 4. Handle Package Selection Change
  const handlePackageChange = (pkgId: number) => {
    setSelectedPackageId(pkgId);
    const pkg = packages.find((p) => p.retreatPackageId === pkgId);
    if (pkg && pkg.eligibleVillaCategories && pkg.eligibleVillaCategories.length > 0) {
      setSelectedCategoryId(pkg.eligibleVillaCategories[0].villaCategoryId);
    }
  };

  // 5. Validation Logic
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Customer Personal Information
    if (!fullName || !fullName.trim()) {
      errors.fullName = 'Họ và tên khách hàng là bắt buộc.';
    } else if (fullName.trim().length < 2) {
      errors.fullName = 'Họ và tên phải có ít nhất 2 ký tự.';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !email.trim()) {
      errors.email = 'Địa chỉ Email là bắt buộc.';
    } else if (!emailRegex.test(email.trim())) {
      errors.email = 'Địa chỉ Email không đúng định dạng (ví dụ: name@example.com).';
    }

    const phoneClean = phoneNumber.replace(/[\s\-\(\)\.]/g, '');
    if (!phoneNumber || !phoneNumber.trim()) {
      errors.phoneNumber = 'Số điện thoại liên hệ là bắt buộc.';
    } else if (phoneClean.length < 8 || phoneClean.length > 15) {
      errors.phoneNumber = 'Số điện thoại không hợp lệ (phải từ 8 đến 15 chữ số).';
    }

    if (!emergencyContact || !emergencyContact.trim()) {
      errors.emergencyContact = 'Thông tin liên hệ khẩn cấp là bắt buộc (Họ tên và Số điện thoại).';
    }

    // Booking Details
    if (!selectedPackageId) {
      errors.package = 'Vui lòng chọn một gói nghỉ dưỡng.';
    }

    if (!selectedCategoryId) {
      errors.category = 'Vui lòng chọn hạng biệt thự mong muốn.';
    }

    if (!startDate) {
      errors.startDate = 'Vui lòng chọn ngày nhận phòng.';
    } else if (startDate < todayStr) {
      errors.startDate = 'Ngày nhận phòng không được là ngày trong quá khứ. Vui lòng chọn từ ngày hôm nay trở đi.';
    }

    const maxOcc = selectedCat?.maxOccupancy || 4;
    if (!guestCount || guestCount < 1) {
      errors.guestCount = 'Số lượng khách phải ít nhất là 1.';
    } else if (guestCount > maxOcc) {
      errors.guestCount = `Số lượng khách (${guestCount}) vượt quá sức chứa tối đa (${maxOcc} khách) của hạng biệt thự này.`;
    }

    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      setGeneralError('Vui lòng kiểm tra và điền đầy đủ các thông tin bắt buộc còn thiếu bên dưới.');
      return false;
    }

    setGeneralError(null);
    return true;
  };

  // 6. Submit and Create Real Booking in SQL Server
  const handleContinue = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (!selectedPackageId || !selectedCategoryId) return;

    if (!calculation || !calculation.available || calculation.availableCount <= 0) {
      setGeneralError('Hạng biệt thự đã chọn không còn phòng trống trong khoảng thời gian này. Vui lòng chọn ngày khác hoặc hạng phòng khác.');
      return;
    }

    setSubmitting(true);
    setGeneralError(null);
    try {
      const booking = await createCustomerBooking({
        retreatPackageId: selectedPackageId,
        requestedVillaCategoryId: selectedCategoryId,
        checkInDate: startDate,
        checkOutDate: endDate,
        guestCount,
        specialRequest: specialRequests.trim() || undefined,
        fullName: fullName.trim(),
        email: email.trim(),
        phoneNumber: phoneNumber.trim(),
        emergencyContact: emergencyContact.trim(),
      });

      // Save to sessionStorage for summary screen
      sessionStorage.setItem('hsw_active_draft_booking', JSON.stringify(booking));
      navigate(`/customer/booking/summary?bookingId=${booking.retreatBookingId}`);
    } catch (err: any) {
      setGeneralError('Lỗi tạo hồ sơ đặt phòng: ' + (err?.message || 'Lỗi kết nối máy chủ'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingInitial) {
    return (
      <div style={{ textAlign: 'center', padding: 'var(--space-16) 0' }}>
        <Container size="standard">
          <Loader2 className="animate-spin" size={36} style={{ color: 'var(--accent-forest)', margin: '0 auto var(--space-4)' }} />
          <p style={{ color: 'var(--text-secondary)' }}>Đang tải danh mục gói nghỉ dưỡng từ SQL Server...</p>
        </Container>
      </div>
    );
  }

  if (loadError) {
    return (
      <div style={{ textAlign: 'center', padding: 'var(--space-16) 0' }}>
        <Container size="standard">
          <AlertCircle size={40} style={{ color: '#b91c1c', margin: '0 auto var(--space-4)' }} />
          <h2 style={{ fontSize: 'var(--text-lg)', marginBottom: 'var(--space-2)' }}>Không thể kết nối đến hệ thống</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-6)' }}>{loadError}</p>
          <Button variant="primary" onClick={() => window.location.reload()}>Thử Lại</Button>
        </Container>
      </div>
    );
  }

  return (
    <div className="hsw-booking-form-page" style={{ padding: 'var(--space-6) 0 var(--space-16)' }}>
      <Container size="standard">
        <CustomerPageHeader
          badge="Bước 1 / 3 · Hệ Thống Đặt Chỗ Trực Tuyến"
          title="Đặt Kỳ Nghỉ Dưỡng & Trị Liệu Sức Khỏe"
          subtitle="Dữ liệu kết nối trực tiếp SQL Server, tính toán tiền cọc 30% minh bạch và giữ phòng tự động."
        />

        {/* General Error Alert Banner */}
        {generalError && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: '#FFEBEE',
              border: '1px solid #EF9A9A',
              color: '#C62828',
              fontSize: 'var(--text-sm)',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: 'var(--space-6)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <AlertTriangle size={18} style={{ flexShrink: 0 }} />
            <span>{generalError}</span>
          </div>
        )}

        <form onSubmit={handleContinue} noValidate>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))',
              gap: 'var(--space-8)',
              alignItems: 'flex-start',
            }}
          >
            {/* Left Column: Form Controls */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
              {/* 1. Customer Personal Information Form */}
              <div
                style={{
                  backgroundColor: 'var(--surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: 'var(--space-6)',
                  boxShadow: 'var(--shadow-card)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
                  <User size={18} style={{ color: 'var(--accent-forest)' }} />
                  <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 600, margin: 0 }}>
                    1. Thông Tin Cá Nhân Của Khách Hàng
                  </h3>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  {/* Full Name */}
                  <div>
                    <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: '6px' }}>
                      Họ và tên khách hàng <span style={{ color: '#b91c1c' }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => {
                        setFullName(e.target.value);
                        if (fieldErrors.fullName) {
                          const errs = { ...fieldErrors };
                          delete errs.fullName;
                          setFieldErrors(errs);
                        }
                      }}
                      placeholder="Nguyễn Văn A"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: 'var(--radius-sm)',
                        border: fieldErrors.fullName ? '1px solid #b91c1c' : '1px solid var(--border-subtle)',
                        fontSize: 'var(--text-sm)',
                        backgroundColor: fieldErrors.fullName ? '#FFF8F8' : '#ffffff',
                      }}
                    />
                    {fieldErrors.fullName && (
                      <div style={{ color: '#b91c1c', fontSize: '11px', marginTop: '4px', fontWeight: 500 }}>
                        {fieldErrors.fullName}
                      </div>
                    )}
                  </div>

                  {/* Email & Phone Row */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: '6px' }}>
                        Địa chỉ Email <span style={{ color: '#b91c1c' }}>*</span>
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (fieldErrors.email) {
                            const errs = { ...fieldErrors };
                            delete errs.email;
                            setFieldErrors(errs);
                          }
                        }}
                        placeholder="customer@heavenstay.com"
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: 'var(--radius-sm)',
                          border: fieldErrors.email ? '1px solid #b91c1c' : '1px solid var(--border-subtle)',
                          fontSize: 'var(--text-sm)',
                          backgroundColor: fieldErrors.email ? '#FFF8F8' : '#ffffff',
                        }}
                      />
                      {fieldErrors.email && (
                        <div style={{ color: '#b91c1c', fontSize: '11px', marginTop: '4px', fontWeight: 500 }}>
                          {fieldErrors.email}
                        </div>
                      )}
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: '6px' }}>
                        Số điện thoại liên hệ <span style={{ color: '#b91c1c' }}>*</span>
                      </label>
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => {
                          setPhoneNumber(e.target.value);
                          if (fieldErrors.phoneNumber) {
                            const errs = { ...fieldErrors };
                            delete errs.phoneNumber;
                            setFieldErrors(errs);
                          }
                        }}
                        placeholder="+84 901 234 567"
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: 'var(--radius-sm)',
                          border: fieldErrors.phoneNumber ? '1px solid #b91c1c' : '1px solid var(--border-subtle)',
                          fontSize: 'var(--text-sm)',
                          backgroundColor: fieldErrors.phoneNumber ? '#FFF8F8' : '#ffffff',
                        }}
                      />
                      {fieldErrors.phoneNumber && (
                        <div style={{ color: '#b91c1c', fontSize: '11px', marginTop: '4px', fontWeight: 500 }}>
                          {fieldErrors.phoneNumber}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Emergency Contact */}
                  <div>
                    <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: '6px' }}>
                      Thông tin liên hệ khẩn cấp <span style={{ color: '#b91c1c' }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={emergencyContact}
                      onChange={(e) => {
                        setEmergencyContact(e.target.value);
                        if (fieldErrors.emergencyContact) {
                          const errs = { ...fieldErrors };
                          delete errs.emergencyContact;
                          setFieldErrors(errs);
                        }
                      }}
                      placeholder="Họ tên người thân và SĐT (ví dụ: Trần Thị B - 0987654321)"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: 'var(--radius-sm)',
                        border: fieldErrors.emergencyContact ? '1px solid #b91c1c' : '1px solid var(--border-subtle)',
                        fontSize: 'var(--text-sm)',
                        backgroundColor: fieldErrors.emergencyContact ? '#FFF8F8' : '#ffffff',
                      }}
                    />
                    {fieldErrors.emergencyContact && (
                      <div style={{ color: '#b91c1c', fontSize: '11px', marginTop: '4px', fontWeight: 500 }}>
                        {fieldErrors.emergencyContact}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 2. Selected Retreat Package Selector */}
              <div
                style={{
                  backgroundColor: 'var(--surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: 'var(--space-6)',
                  boxShadow: 'var(--shadow-card)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
                  <Sparkles size={18} style={{ color: 'var(--accent-forest)' }} />
                  <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 600, margin: 0 }}>
                    2. Chọn Gói Nghỉ Dưỡng <span style={{ color: '#b91c1c' }}>*</span>
                  </h3>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  {packages.map((pkg) => {
                    const isSelected = pkg.retreatPackageId === selectedPackageId;
                    return (
                      <div
                        key={pkg.retreatPackageId}
                        onClick={() => handlePackageChange(pkg.retreatPackageId)}
                        style={{
                          padding: 'var(--space-4)',
                          borderRadius: 'var(--radius-sm)',
                          border: isSelected ? '2px solid var(--accent-forest)' : '1px solid var(--border-subtle)',
                          backgroundColor: isSelected ? 'rgba(44, 76, 56, 0.04)' : '#ffffff',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                          <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: isSelected ? 'var(--accent-forest)' : 'var(--text-primary)' }}>
                            {pkg.packageName} ({pkg.packageCode})
                          </span>
                          <span style={{ fontWeight: 700, fontSize: 'var(--text-sm)', color: 'var(--accent-forest)' }}>
                            {formatVND(pkg.basePrice, i18n.language)}
                          </span>
                        </div>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                          {pkg.durationNights + 1} Ngày {pkg.durationNights} Đêm · {pkg.wellnessGoal}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {fieldErrors.package && (
                  <div style={{ color: '#b91c1c', fontSize: '11px', marginTop: '6px', fontWeight: 500 }}>
                    {fieldErrors.package}
                  </div>
                )}
              </div>

              {/* 3. Villa Category Selector (Filtered by Package Eligibility) */}
              <div
                style={{
                  backgroundColor: 'var(--surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: 'var(--space-6)',
                  boxShadow: 'var(--shadow-card)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
                  <Home size={18} style={{ color: 'var(--accent-forest)' }} />
                  <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 600, margin: 0 }}>
                    3. Chọn Hạng Biệt Thự <span style={{ color: '#b91c1c' }}>*</span>
                  </h3>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  {eligibleCategories.map((cat) => {
                    const isSelected = cat.villaCategoryId === selectedCategoryId;
                    return (
                      <div
                        key={cat.villaCategoryId}
                        onClick={() => setSelectedCategoryId(cat.villaCategoryId)}
                        style={{
                          padding: 'var(--space-4)',
                          borderRadius: 'var(--radius-sm)',
                          border: isSelected ? '2px solid var(--accent-forest)' : '1px solid var(--border-subtle)',
                          backgroundColor: isSelected ? 'rgba(44, 76, 56, 0.04)' : '#ffffff',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: isSelected ? 'var(--accent-forest)' : 'var(--text-primary)' }}>
                            {cat.categoryName}
                          </span>
                          <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-secondary)' }}>
                            {cat.priceModifier > 0 ? `+${formatVND(cat.priceModifier, i18n.language)}` : 'Đã bao gồm'}
                          </span>
                        </div>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                          Sức chứa tối đa: {cat.maxOccupancy} khách · {cat.bedroomDescription || cat.bedroomCount + ' PN'} {cat.hasPrivatePool ? '· Hồ bơi riêng' : ''}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {fieldErrors.category && (
                  <div style={{ color: '#b91c1c', fontSize: '11px', marginTop: '6px', fontWeight: 500 }}>
                    {fieldErrors.category}
                  </div>
                )}
              </div>

              {/* 4. Dates & Party Size */}
              <div
                style={{
                  backgroundColor: 'var(--surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: 'var(--space-6)',
                  boxShadow: 'var(--shadow-card)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
                  <Calendar size={18} style={{ color: 'var(--accent-forest)' }} />
                  <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 600, margin: 0 }}>
                    4. Lịch Trình Lưu Trú & Số Khách
                  </h3>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: '6px' }}>
                      Ngày nhận phòng <span style={{ color: '#b91c1c' }}>*</span>
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      min={todayStr}
                      onChange={(e) => handleStartDateChange(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: 'var(--radius-sm)',
                        border: fieldErrors.startDate ? '1px solid #b91c1c' : '1px solid var(--border-subtle)',
                        fontSize: 'var(--text-sm)',
                        backgroundColor: fieldErrors.startDate ? '#FFF8F8' : '#ffffff',
                      }}
                      required
                    />
                    {fieldErrors.startDate && (
                      <div style={{ color: '#b91c1c', fontSize: '11px', marginTop: '4px', fontWeight: 500 }}>
                        {fieldErrors.startDate}
                      </div>
                    )}
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: '6px' }}>
                      Ngày trả phòng (Tự động tính)
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      disabled
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-subtle)',
                        backgroundColor: 'var(--surface-muted, #f8f9fa)',
                        fontSize: 'var(--text-sm)',
                        color: 'var(--text-secondary)',
                      }}
                    />
                    <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                      Theo đúng {selectedPkg?.durationNights || 3} đêm của gói
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: 'var(--space-4)' }}>
                  <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: '6px' }}>
                    Số lượng khách lưu trú <span style={{ color: '#b91c1c' }}>*</span> (Tối đa hạng này: {selectedCat?.maxOccupancy || 4} khách)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={selectedCat?.maxOccupancy || 10}
                    value={guestCount}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10) || 1;
                      setGuestCount(val);
                      if (fieldErrors.guestCount) {
                        const errs = { ...fieldErrors };
                        delete errs.guestCount;
                        setFieldErrors(errs);
                      }
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-sm)',
                      border: fieldErrors.guestCount ? '1px solid #b91c1c' : '1px solid var(--border-subtle)',
                      fontSize: 'var(--text-sm)',
                    }}
                    required
                  />
                  {fieldErrors.guestCount && (
                    <div style={{ color: '#b91c1c', fontSize: '11px', marginTop: '4px', fontWeight: 500 }}>
                      {fieldErrors.guestCount}
                    </div>
                  )}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: '6px' }}>
                    Yêu cầu đặc biệt / Ghi chú (Tùy chọn)
                  </label>
                  <textarea
                    rows={2}
                    value={specialRequests}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                    placeholder="Dị ứng thực phẩm, tầng cao, vị trí yên tĩnh, giờ đến dự kiến..."
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-subtle)',
                      fontSize: 'var(--text-sm)',
                      resize: 'vertical',
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Right Column: Pricing & Availability Summary */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
              <div
                style={{
                  backgroundColor: 'var(--surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: 'var(--space-6)',
                  boxShadow: 'var(--shadow-card)',
                }}
              >
                <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 600, marginBottom: 'var(--space-4)' }}>
                  Tóm Tắt Chi Phí & Tình Trạng Phòng
                </h3>

                {calculating && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: 'var(--space-4)', color: 'var(--text-secondary)' }}>
                    <Loader2 className="animate-spin" size={16} />
                    <span style={{ fontSize: 'var(--text-sm)' }}>Đang kiểm tra tình trạng phòng thực tế từ SQL Server...</span>
                  </div>
                )}

                {calcError && (
                  <div style={{ padding: 'var(--space-4)', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(185, 28, 28, 0.06)', color: '#b91c1c', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-4)' }}>
                    <AlertCircle size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'text-bottom' }} />
                    {calcError}
                  </div>
                )}

                {calculation && !calculating && (
                  <div>
                    {/* Availability status */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: calculation.available ? 'rgba(44, 76, 56, 0.08)' : 'rgba(185, 28, 28, 0.08)',
                        color: calculation.available ? 'var(--accent-forest)' : '#b91c1c',
                        fontWeight: 600,
                        fontSize: 'var(--text-sm)',
                        marginBottom: 'var(--space-4)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {calculation.available ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                        <span>{calculation.available ? 'Còn phòng trong cơ sở dữ liệu' : 'Hết phòng / Trùng lịch'}</span>
                      </div>
                      <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700 }}>
                        {calculation.availableCount} Villa Khả Dụng
                      </span>
                    </div>

                    {/* Breakdown */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-4)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Giá gói cơ bản ({guestCount} Khách)</span>
                        <span>{formatVND(calculation.packageBaseAmount, i18n.language)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Phụ phí nâng hạng biệt thự</span>
                        <span>{formatVND(calculation.villaModifierAmount, i18n.language)}</span>
                      </div>
                      <div style={{ height: '1px', backgroundColor: 'var(--border-subtle)', margin: '4px 0' }} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 'var(--text-base)' }}>
                        <span>Tổng tiền dự kiến</span>
                        <span style={{ color: 'var(--accent-forest)' }}>{formatVND(calculation.totalEstimatedAmount, i18n.language)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#b45309', fontWeight: 600 }}>
                        <span>Tiền cọc bắt buộc ({calculation.depositPercentage}%)</span>
                        <span>{formatVND(calculation.requiredDepositAmount, i18n.language)}</span>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      variant="primary"
                      size="lg"
                      disabled={!calculation.available || submitting}
                      style={{ width: '100%', justifyContent: 'center', marginTop: 'var(--space-2)' }}
                      icon={submitting ? <Loader2 className="animate-spin" size={16} /> : <ArrowRight size={16} />}
                    >
                      {submitting ? 'Đang Khởi Tạo Đặt Phòng...' : 'Tiếp Tục Đến Thanh Toán Tiền Cọc'}
                    </Button>
                  </div>
                )}
              </div>

              {/* Policy Notes */}
              <div
                style={{
                  padding: 'var(--space-4)',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'rgba(44, 76, 56, 0.03)',
                  border: '1px solid var(--border-subtle)',
                  fontSize: 'var(--text-xs)',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.6,
                }}
              >
                <div style={{ fontWeight: 600, color: 'var(--accent-forest)', marginBottom: '4px' }}>
                  ✓ Quy Định Đặt Phòng HSWRMS (SRS FR-M2-02)
                </div>
                • Hệ thống giữ chỗ tạm thời trong 15 phút để hoàn tất thanh toán tiền cọc qua cổng VNPay.
                <br />
                • Miễn phí hủy phòng trước 48 giờ so với giờ nhận phòng (hoàn 100% tiền cọc).
                <br />
                • Biệt thự vật lý sẽ được Lễ tân gán chính xác khi khách xuất trình giấy tờ tùy thân lúc Check-in.
              </div>
            </div>
          </div>
        </form>
      </Container>
    </div>
  );
};
