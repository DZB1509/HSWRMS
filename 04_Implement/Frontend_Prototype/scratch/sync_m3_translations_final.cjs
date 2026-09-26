const fs = require('fs');
const path = require('path');

const locales = ['en', 'vi', 'zh-CN', 'ja', 'fr'];

const translations = {
  en: {
    extraSpa: {
      subtitle: 'Book an additional spa service for a checked-in customer. Charges will be recorded for pending folio posting at checkout.',
      selectCustomerPrompt: 'Select an in-house checked-in customer',
      selectTreatmentPrompt: 'Choose an add-on therapy',
      selectSlotPrompt: 'Pick treatment date and available start time',
      atomicResourcesLocked: 'Specific resources locked for atomic reservation',
      step4DisabledHint: 'Prerequisite: Choose a slot in Step 3 to assign resources',
      licensedSpecialist: 'Certified Spa Specialist',
      sanitizedSuite: 'Private Therapy Sanctuary',
      resourcesPlaceholder: 'Therapist and Treatment Suite will lock upon slot selection.',
      readyToPost: 'Atomic availability verified. Ready for pending folio posting.',
      completeStepsPrompt: 'Complete preceding steps to enable confirmation.',
      atomicCheckPassed: 'Atomic Availability Verified',
      atomicCheckPassedDesc: 'Both Therapist and Suite are verified vacant. Spa session will be recorded with pending folio posting.',
      validationPending: 'Validation Incomplete',
      missingFields: 'Missing required selections:',
      bookingRef: 'Booking Ref',
      schedule: 'Scheduled Time',
      folioCharge: 'Pending Folio Posting',
      folioStatusNote: 'Pending Folio Posting — will be finalized and settled during checkout.',
      readyToConfirm: 'All Prerequisites Valid',
      incompletePill: 'Incomplete Selections',
      confirmAction: 'Confirm Extra Spa Session',
      booked: 'Spa Session Booked ✓'
    },
    therapist: {
      start: 'Start'
    }
  },
  vi: {
    extraSpa: {
      subtitle: 'Đặt thêm dịch vụ spa cho khách hàng đang lưu trú. Chi phí sẽ được ghi nhận chờ kết toán hồ sơ khi trả phòng.',
      selectCustomerPrompt: 'Chọn khách hàng đang lưu trú đã hoàn tất nhận phòng',
      selectTreatmentPrompt: 'Chọn liệu trình trị liệu bổ sung',
      selectSlotPrompt: 'Chọn ngày và khung giờ trống khả dụng',
      atomicResourcesLocked: 'Chuyên viên và phòng trị liệu được khóa đồng bộ',
      step4DisabledHint: 'Điều kiện: Chọn khung giờ ở Bước 3 để phân bổ tài nguyên',
      licensedSpecialist: 'Chuyên viên trị liệu chứng chỉ',
      sanitizedSuite: 'Phòng trị liệu riêng biệt',
      resourcesPlaceholder: 'Chuyên viên và phòng trị liệu sẽ được khóa sau khi chọn khung giờ.',
      readyToPost: 'Đã xác thực tính khả dụng đồng bộ. Sẵn sàng ghi nhận chuyển tiếp hồ sơ thanh toán.',
      completeStepsPrompt: 'Vui lòng hoàn thành các bước trước để xác nhận.',
      atomicCheckPassed: 'Đã xác thực khả dụng đồng bộ',
      atomicCheckPassedDesc: 'Cả chuyên viên và phòng trị liệu đều trống. Phiên trị liệu sẽ được ghi nhận chờ kết toán hồ sơ.',
      validationPending: 'Chưa hoàn tất xác thực',
      missingFields: 'Còn thiếu thông tin:',
      bookingRef: 'Mã đặt phòng',
      schedule: 'Thời gian đã xếp',
      folioCharge: 'Chờ kết toán hồ sơ',
      folioStatusNote: 'Chờ chuyển tiếp hồ sơ thanh toán — sẽ được tổng hợp và quyết toán khi trả phòng.',
      readyToConfirm: 'Đã đáp ứng đủ điều kiện',
      incompletePill: 'Chưa chọn đủ thông tin',
      confirmAction: 'Xác nhận phiên trị liệu thêm',
      booked: 'Đã đặt phiên trị liệu ✓'
    },
    therapist: {
      start: 'Bắt đầu'
    }
  },
  'zh-CN': {
    extraSpa: {
      subtitle: '为在店客户预订额外水疗服务。费用将记入待退房转账总账中。',
      selectCustomerPrompt: '选择已办理入住的住店客户',
      selectTreatmentPrompt: '选择附加水疗疗程',
      selectSlotPrompt: '选择护理日期及可用时段',
      atomicResourcesLocked: '理疗师与护理套房已同步锁定',
      step4DisabledHint: '前置条件：请在步骤3中选择时段以分配资源',
      licensedSpecialist: '专业认证理疗师',
      sanitizedSuite: '私密水疗静修室',
      resourcesPlaceholder: '选择时段后将自动锁定理疗师及专属套房。',
      readyToPost: '原子可用性已验证。已准备计入待结账账单。',
      completeStepsPrompt: '请完成上述步骤以启用确认。',
      atomicCheckPassed: '原子可用性验证通过',
      atomicCheckPassedDesc: '理疗师与套房均已确认空闲。水疗会话将记录为待转入退房账单。',
      validationPending: '验证未完成',
      missingFields: '缺少必要选项：',
      bookingRef: '预订编号',
      schedule: '预约时间',
      folioCharge: '待计入客户总账',
      folioStatusNote: '待计入客户总账 — 将在退房时进行统一结算。',
      readyToConfirm: '所有前置条件有效',
      incompletePill: '选项未完成',
      confirmAction: '确认附加水疗会话',
      booked: '水疗会话已预订 ✓'
    },
    therapist: {
      start: '开始'
    }
  },
  ja: {
    extraSpa: {
      subtitle: 'チェックイン済みのお客様に追加のスパサービスを予約します。料金はチェックアウト時フォリオ転記待ちとして記録されます。',
      selectCustomerPrompt: 'チェックイン済みの滞在顧客を選択してください',
      selectTreatmentPrompt: '追加トリートメントを選択してください',
      selectSlotPrompt: 'トリートメント日と空き時間枠を選択してください',
      atomicResourcesLocked: 'セラピストとトリートメントスイートが同時ロックされました',
      step4DisabledHint: '前提条件：ステップ3で時間枠を選択してリソースを割り当ててください',
      licensedSpecialist: '認定スパスペシャリスト',
      sanitizedSuite: 'プライベートトリートメントサンクチュアリ',
      resourcesPlaceholder: '時間枠を選択するとセラピストとスイートがロックされます。',
      readyToPost: 'リソースの空きを確認しました。フォリオ未確定転記の準備が完了しています。',
      completeStepsPrompt: '確認を有効にするには前のステップを完了してください。',
      atomicCheckPassed: '同時リソース空き確認済み',
      atomicCheckPassedDesc: 'セラピストおよびスイートの両方が空いています。スパセッションはチェックアウト時フォリオ転記待ちとして記録されます。',
      validationPending: '確認が未完了です',
      missingFields: '未入力項目:',
      bookingRef: '予約番号',
      schedule: '予約日時',
      folioCharge: 'チェックアウト時フォリオ転記待ち',
      folioStatusNote: 'チェックアウト時フォリオ転記待ち — チェックアウト時に最終精算されます。',
      readyToConfirm: 'すべての前提条件が有効です',
      incompletePill: '選択が未完了です',
      confirmAction: '追加スパセッションを確定する',
      booked: 'スパセッション予約完了 ✓'
    },
    therapist: {
      start: '開始'
    }
  },
  fr: {
    extraSpa: {
      subtitle: 'Réservez un soin spa supplémentaire pour un client séjournant. Les frais seront enregistrés en attente de transfert sur le folio.',
      selectCustomerPrompt: 'Sélectionnez un client séjournant actuellement enregistré',
      selectTreatmentPrompt: 'Choisissez un soin spa supplémentaire',
      selectSlotPrompt: 'Sélectionnez la date du soin et le créneau disponible',
      atomicResourcesLocked: 'Thérapeute et suite de soin verrouillés de manière atomique',
      step4DisabledHint: 'Condition préalable : choisissez un créneau à l\'Étape 3 pour attribuer les ressources',
      licensedSpecialist: 'Spécialiste spa certifié',
      sanitizedSuite: 'Sanctuaire de thérapie privé',
      resourcesPlaceholder: 'Le thérapeute et la suite seront verrouillés après sélection du créneau.',
      readyToPost: 'Disponibilité atomique vérifiée. Prêt pour enregistrement en attente de folio.',
      completeStepsPrompt: 'Veuillez compléter les étapes précédentes pour confirmer.',
      atomicCheckPassed: 'Disponibilité atomique vérifiée',
      atomicCheckPassedDesc: 'Le thérapeute et la suite sont libres. La séance sera enregistrée en attente de transfert sur le folio.',
      validationPending: 'Validation incomplète',
      missingFields: 'Sélections manquantes :',
      bookingRef: 'Réf. Réservation',
      schedule: 'Horaire programmé',
      folioCharge: 'En attente d\'inscription au folio',
      folioStatusNote: 'En attente d\'inscription au folio — sera finalisé et réglé lors du départ.',
      readyToConfirm: 'Toutes les conditions préalables sont valides',
      incompletePill: 'Sélections incomplètes',
      confirmAction: 'Confirmer la séance de spa supplémentaire',
      booked: 'Séance de spa réservée ✓'
    },
    therapist: {
      start: 'Démarrer'
    }
  }
};

locales.forEach((loc) => {
  const filePath = path.join(__dirname, '..', 'src', 'i18n', 'locales', loc, 'operations.json');
  if (!fs.existsSync(filePath)) {
    console.error('File not found:', filePath);
    return;
  }
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const locTrans = translations[loc];

  if (!data.extraSpa) data.extraSpa = {};
  if (!data.therapist) data.therapist = {};

  Object.assign(data.extraSpa, locTrans.extraSpa);
  Object.assign(data.therapist, locTrans.therapist);

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
  console.log(`Updated locale: ${loc}`);
});
