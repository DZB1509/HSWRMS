package com.heavenstay.hswrms.config;

import com.heavenstay.hswrms.m1identity.repository.CustomerProfileRepository;
import com.heavenstay.hswrms.m2booking.entity.RetreatBooking;
import com.heavenstay.hswrms.m2booking.repository.RetreatBookingRepository;
import com.heavenstay.hswrms.m2booking.service.BookingPolicyService;
import com.heavenstay.hswrms.m3spa.SpaTestConfig;
import com.heavenstay.hswrms.m3spa.dto.request.ConfirmReservationRequest;
import com.heavenstay.hswrms.m3spa.dto.response.RecoveryResultDto;
import com.heavenstay.hswrms.m3spa.entity.SpaDispatchOutboxEntity;
import com.heavenstay.hswrms.m3spa.entity.SpaScheduleHistory;
import com.heavenstay.hswrms.m3spa.entity.SpaSession;
import com.heavenstay.hswrms.m3spa.entity.SpaTreatment;
import com.heavenstay.hswrms.m3spa.entity.Therapist;
import com.heavenstay.hswrms.m3spa.entity.TherapistTreatmentQualification;
import com.heavenstay.hswrms.m3spa.entity.TreatmentRoom;
import com.heavenstay.hswrms.m3spa.entity.TreatmentRoomCompatibility;
import com.heavenstay.hswrms.m3spa.entity.enums.BookingSource;
import com.heavenstay.hswrms.m3spa.entity.enums.SpaReminderStatus;
import com.heavenstay.hswrms.m3spa.entity.enums.TherapistStatus;
import com.heavenstay.hswrms.m3spa.entity.enums.TreatmentRoomStatus;
import com.heavenstay.hswrms.m3spa.repository.SpaSessionRepository;
import com.heavenstay.hswrms.m3spa.repository.SpaTreatmentRepository;
import com.heavenstay.hswrms.m3spa.repository.TherapistRepository;
import com.heavenstay.hswrms.m3spa.repository.TherapistTreatmentQualificationRepository;
import com.heavenstay.hswrms.m3spa.repository.TreatmentRoomCompatibilityRepository;
import com.heavenstay.hswrms.m3spa.repository.TreatmentRoomRepository;
import com.heavenstay.hswrms.m3spa.service.SessionRecoveryService;
import com.heavenstay.hswrms.m3spa.service.SpaSessionService;
import com.heavenstay.hswrms.m5billing.dto.FolioItemResponseDTO;
import com.heavenstay.hswrms.m5billing.dto.FolioResponseDTO;
import com.heavenstay.hswrms.m5billing.dto.InvoiceResponseDTO;
import com.heavenstay.hswrms.m5billing.dto.PaymentRequestDTO;
import com.heavenstay.hswrms.m5billing.dto.PostChargeRequestDTO;
import com.heavenstay.hswrms.m5billing.entity.AdjustmentRequestEntity;
import com.heavenstay.hswrms.m5billing.entity.CreditNoteEntity;
import com.heavenstay.hswrms.m5billing.entity.CustomerReviewEntity;
import com.heavenstay.hswrms.m5billing.entity.FolioEntity;
import com.heavenstay.hswrms.m5billing.entity.FolioItemEntity;
import com.heavenstay.hswrms.m5billing.entity.InvoiceEntity;
import com.heavenstay.hswrms.m5billing.entity.PaymentTransactionEntity;
import com.heavenstay.hswrms.m5billing.repository.FolioItemRepository;
import com.heavenstay.hswrms.m5billing.repository.FolioRepository;
import com.heavenstay.hswrms.m5billing.repository.InvoiceRepository;
import com.heavenstay.hswrms.m5billing.repository.PaymentTransactionRepository;
import com.heavenstay.hswrms.m5billing.service.CheckoutService;
import com.heavenstay.hswrms.m5billing.service.FolioBillingService;
import com.heavenstay.hswrms.m6admin.entity.AuditLog;
import jakarta.persistence.EntityManagerFactory;
import org.hibernate.engine.spi.SessionFactoryImplementor;
import org.hibernate.metamodel.mapping.AttributeMapping;
import org.hibernate.metamodel.mapping.BasicValuedModelPart;
import org.hibernate.metamodel.mapping.EntityIdentifierMapping;
import org.hibernate.metamodel.mapping.ForeignKeyDescriptor;
import org.hibernate.metamodel.mapping.ModelPart;
import org.hibernate.metamodel.mapping.internal.ToOneAttributeMapping;
import org.hibernate.persister.entity.EntityPersister;
import org.hibernate.type.SqlTypes;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.BadSqlGrammarException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.SQLException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * Automated verification for the SQL Server Compatibility Remediation (Source-Only) phase:
 * - Task 2 & 7: M3 reminder columns/constraints/trigger reconciliation & reminder reset on reschedule/recovery
 * - Task 3: Hibernate 6 Long -> SqlTypes.INTEGER (INT) mapping across all 10 affected entities (20 scalar fields + 8 FK associations)
 * - Task 4: BookingPolicyService native SQL alignment with dbo.SystemConfiguration (configuration_key / configuration_value)
 * - Task 5: M5 Folio charges (normal, voided, partially adjusted) & paid totals (deposit, final invoice, pending VietQR, combined)
 * - Task 6: Migration safety (no hardcoded USE [HSWRMS] across all migration files)
 */
@SpringBootTest(properties = {
        "app.seed.demo-data=true",
        "app.vnpay.mock-auto-confirm=true",
        "app.vnpay.hash-secret=test-vnpay-secret"
})
@Import(SpaTestConfig.class)
@Transactional
class SqlServerCompatibilityRemediationTest {

    @Autowired
    private EntityManagerFactory entityManagerFactory;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private FolioBillingService folioBillingService;

    @Autowired
    private CheckoutService checkoutService;

    @Autowired
    private FolioRepository folioRepository;

    @Autowired
    private FolioItemRepository folioItemRepository;

    @Autowired
    private InvoiceRepository invoiceRepository;

    @Autowired
    private PaymentTransactionRepository paymentTransactionRepository;

    @Autowired
    private CustomerProfileRepository customerProfileRepository;

    @Autowired
    private RetreatBookingRepository retreatBookingRepository;

    @Autowired
    private SpaTreatmentRepository spaTreatmentRepository;

    @Autowired
    private TherapistRepository therapistRepository;

    @Autowired
    private TherapistTreatmentQualificationRepository therapistQualificationRepository;

    @Autowired
    private TreatmentRoomRepository treatmentRoomRepository;

    @Autowired
    private TreatmentRoomCompatibilityRepository treatmentRoomCompatibilityRepository;

    @Autowired
    private SpaSessionRepository spaSessionRepository;

    @Autowired
    private SpaSessionService spaSessionService;

    @Autowired
    private SessionRecoveryService sessionRecoveryService;

    @Test
    void task3_hibernateMetamodelMapsAllTwentyIntBackedLongFieldsAndEightAssociationsToSqlTypesInteger() {
        SessionFactoryImplementor sfi = entityManagerFactory.unwrap(SessionFactoryImplementor.class);

        // 1. Verify 8 @Id fields backed by SQL Server INT columns map to SqlTypes.INTEGER
        Class<?>[] intIdEntities = {
                SpaSession.class,
                FolioEntity.class,
                FolioItemEntity.class,
                InvoiceEntity.class,
                PaymentTransactionEntity.class,
                CustomerReviewEntity.class,
                AdjustmentRequestEntity.class,
                CreditNoteEntity.class
        };
        for (Class<?> entityClass : intIdEntities) {
            EntityPersister persister = sfi.getMappingMetamodel().getEntityDescriptor(entityClass);
            EntityIdentifierMapping idMapping = persister.getIdentifierMapping();
            assertEquals(Long.class, idMapping.getJavaType().getJavaTypeClass(),
                    entityClass.getSimpleName() + " @Id Java type must remain Long");
            BasicValuedModelPart basicId = (BasicValuedModelPart) idMapping;
            assertEquals(SqlTypes.INTEGER, basicId.getJdbcMapping().getJdbcType().getDefaultSqlTypeCode(),
                    entityClass.getSimpleName() + " @Id must map to SqlTypes.INTEGER");
        }

        // 2. Verify 12 non-ID scalar Long fields backed by SQL Server INT columns map to SqlTypes.INTEGER
        Map<Class<?>, List<String>> intBackedScalarLongAttributes = Map.of(
                SpaScheduleHistory.class, List.of("sessionId"),
                SpaDispatchOutboxEntity.class, List.of("sessionId"),
                FolioItemEntity.class, List.of("sourceBookingId", "sourceSpaSessionId", "sourceMealOrderId", "voidedAdjustmentRequestId"),
                AdjustmentRequestEntity.class, List.of("retreatBookingId", "sourceMealOrderId", "requestedByUserId", "approvedByUserId"),
                CreditNoteEntity.class, List.of("issuedByUserId", "settledByUserId")
        );
        int verifiedScalarNonIdCount = 0;
        for (var entry : intBackedScalarLongAttributes.entrySet()) {
            EntityPersister persister = sfi.getMappingMetamodel().getEntityDescriptor(entry.getKey());
            for (String attrName : entry.getValue()) {
                AttributeMapping attr = persister.findAttributeMapping(attrName);
                assertNotNull(attr, "Missing attribute " + entry.getKey().getSimpleName() + "." + attrName);
                BasicValuedModelPart basicPart = (BasicValuedModelPart) attr;
                assertEquals(SqlTypes.INTEGER, basicPart.getJdbcMapping().getJdbcType().getDefaultSqlTypeCode(),
                        entry.getKey().getSimpleName() + "." + attrName + " must map to SqlTypes.INTEGER");
                verifiedScalarNonIdCount++;
            }
        }
        assertEquals(12, verifiedScalarNonIdCount);

        // 3. Verify 8 @ManyToOne / @OneToOne associations targeting INT-backed Long PKs inherit SqlTypes.INTEGER
        Map<Class<?>, List<String>> intBackedToOneAttributes = Map.of(
                FolioItemEntity.class, List.of("folio"),
                InvoiceEntity.class, List.of("folio"),
                PaymentTransactionEntity.class, List.of("invoice"),
                AdjustmentRequestEntity.class, List.of("folioItem", "folio"),
                CreditNoteEntity.class, List.of("invoice", "folioItem", "adjustmentRequest")
        );
        int verifiedAssociationCount = 0;
        for (var entry : intBackedToOneAttributes.entrySet()) {
            EntityPersister persister = sfi.getMappingMetamodel().getEntityDescriptor(entry.getKey());
            for (String assocName : entry.getValue()) {
                AttributeMapping attr = persister.findAttributeMapping(assocName);
                assertInstanceOf(ToOneAttributeMapping.class, attr);
                ForeignKeyDescriptor fk = ((ToOneAttributeMapping) attr).getForeignKeyDescriptor();
                ModelPart keyPart = fk.getKeyPart();
                assertInstanceOf(BasicValuedModelPart.class, keyPart);
                assertEquals(SqlTypes.INTEGER,
                        ((BasicValuedModelPart) keyPart).getJdbcMapping().getJdbcType().getDefaultSqlTypeCode(),
                        entry.getKey().getSimpleName() + "." + assocName + " FK column must inherit SqlTypes.INTEGER");
                verifiedAssociationCount++;
            }
        }
        assertEquals(8, verifiedAssociationCount);

        // 4. Verify BIGINT-backed Long fields remain SqlTypes.BIGINT (not blindly converted to INTEGER)
        assertEquals(SqlTypes.BIGINT, getIdJdbcTypeCode(sfi, AuditLog.class));
        assertEquals(SqlTypes.BIGINT, getIdJdbcTypeCode(sfi, SpaScheduleHistory.class));
        assertEquals(SqlTypes.BIGINT, getIdJdbcTypeCode(sfi, SpaDispatchOutboxEntity.class));
        EntityPersister outboxPersister = sfi.getMappingMetamodel().getEntityDescriptor(SpaDispatchOutboxEntity.class);
        BasicValuedModelPart outboxHistoryId = (BasicValuedModelPart) outboxPersister.findAttributeMapping("historyId");
        assertEquals(SqlTypes.BIGINT, outboxHistoryId.getJdbcMapping().getJdbcType().getDefaultSqlTypeCode());
    }

    private int getIdJdbcTypeCode(SessionFactoryImplementor sfi, Class<?> entityClass) {
        EntityPersister persister = sfi.getMappingMetamodel().getEntityDescriptor(entityClass);
        BasicValuedModelPart idPart = (BasicValuedModelPart) persister.getIdentifierMapping();
        return idPart.getJdbcMapping().getJdbcType().getDefaultSqlTypeCode();
    }

    @Test
    void task4_bookingPolicyServiceReadsActualSystemConfigurationColumnsAndDoesNotSwallowSqlErrors() {
        jdbcTemplate.update("DELETE FROM dbo.SystemConfiguration WHERE configuration_key IN (?, ?, ?, ?)",
                BookingPolicyService.KEY_DEPOSIT_PERCENTAGE,
                BookingPolicyService.KEY_HOLD_MINUTES,
                BookingPolicyService.KEY_CANCELLATION_WINDOW_HOURS,
                BookingPolicyService.KEY_REFUND_PERCENTAGE);

        BookingPolicyService policyService = new BookingPolicyService(jdbcTemplate, "30", "15", "48", "100");

        // 1. When keys are absent from dbo.SystemConfiguration, fallbacks are used
        assertEquals(Optional.of(new BigDecimal("30")), policyService.depositPercentage());
        assertEquals(Optional.of(15), policyService.holdMinutes());
        assertEquals(Optional.of(48), policyService.cancellationWindowHours());
        assertEquals(Optional.of(new BigDecimal("100")), policyService.refundPercentage());

        // 2. Insert ACTIVE rows using actual dbo.SystemConfiguration columns (configuration_key, configuration_value)
        insertSystemConfig(BookingPolicyService.KEY_DEPOSIT_PERCENTAGE, "40", "ACTIVE");
        insertSystemConfig(BookingPolicyService.KEY_HOLD_MINUTES, "25", "ACTIVE");
        insertSystemConfig(BookingPolicyService.KEY_CANCELLATION_WINDOW_HOURS, "72", "ACTIVE");
        insertSystemConfig(BookingPolicyService.KEY_REFUND_PERCENTAGE, "85", "INACTIVE");

        assertEquals(Optional.of(new BigDecimal("40")), policyService.depositPercentage());
        assertEquals(Optional.of(25), policyService.holdMinutes());
        assertEquals(Optional.of(72), policyService.cancellationWindowHours());
        // INACTIVE row falls back to property value ("100")
        assertEquals(Optional.of(new BigDecimal("100")), policyService.refundPercentage());

        // 3. Verify SQL grammar/schema errors are NOT swallowed as missing configuration
        JdbcTemplate failingJdbcTemplate = mock(JdbcTemplate.class);
        when(failingJdbcTemplate.queryForList(anyString(), eq(String.class), anyString()))
                .thenThrow(new BadSqlGrammarException("SystemConfiguration lookup",
                        "SELECT param_value FROM dbo.SystemConfiguration", new SQLException("Invalid column name 'param_value'")));
        BookingPolicyService brokenDbPolicyService = new BookingPolicyService(failingJdbcTemplate, "30", "15", "48", "100");
        assertThrows(BadSqlGrammarException.class, brokenDbPolicyService::holdMinutes);
    }

    private void insertSystemConfig(String key, String value, String status) {
        jdbcTemplate.update(
                "INSERT INTO dbo.SystemConfiguration " +
                        "(configuration_type, configuration_key, configuration_value, configuration_status, updated_at, value_type, manager_editable) " +
                        "VALUES ('BUSINESS_PARAMETER', ?, ?, ?, CURRENT_TIMESTAMP, 'INT', 1)",
                key, value, status
        );
    }

    @Test
    void task5_folioChargesAndPaidTotalsReconcileNormalVoidedAdjustedDepositFinalPendingVietQrAndCombined() {
        RetreatBooking booking = createFreshBookingWithoutInvoice(new BigDecimal("1000.00"));
        Integer bookingId = booking.getRetreatBookingId();

        // 1. Initialize folio with PACKAGE charge ($1,000.00) + SPA ($200.00) + FNB ($150.00) = $1,350.00
        folioBillingService.getFolioByBookingId(bookingId);
        FolioEntity folio = folioRepository.findByRetreatBookingId(bookingId).orElseThrow();

        FolioItemEntity spaCharge = new FolioItemEntity(
                folio, "SPA", "Herbal Therapy", new BigDecimal("200.00"), null, 501L, null);
        spaCharge = folioItemRepository.saveAndFlush(spaCharge);
        folio.addItem(spaCharge);

        FolioItemEntity fnbCharge = new FolioItemEntity(
                folio, "FNB", "Organic Dinner", new BigDecimal("150.00"), null, null, 601L);
        fnbCharge = folioItemRepository.saveAndFlush(fnbCharge);
        folio.addItem(fnbCharge);
        folio = folioRepository.saveAndFlush(folio);

        assertEquals(0, new BigDecimal("1350.00").compareTo(folio.getTotalCharges()));
        assertEquals(0, BigDecimal.ZERO.compareTo(folio.getTotalPaid()));
        assertEquals("OPEN", folio.getFolioStatus());

        // 2. Voided item: void SPA charge ($200.00) -> totalCharges becomes $1,150.00
        spaCharge.setIsVoided(true);
        folioItemRepository.saveAndFlush(spaCharge);
        folio.recalculateTotals();
        folioRepository.saveAndFlush(folio);
        assertEquals(0, new BigDecimal("1150.00").compareTo(folio.getTotalCharges()));

        // 3. Partial adjustment: adjust FNB charge ($150.00) by $50.00 -> payable $100.00 -> totalCharges becomes $1,100.00
        fnbCharge.setAdjustedAmount(new BigDecimal("50.00"));
        folioItemRepository.saveAndFlush(fnbCharge);
        folio.recalculateTotals();
        folioRepository.saveAndFlush(folio);
        assertEquals(0, new BigDecimal("1100.00").compareTo(folio.getTotalCharges()));

        // 4. Deposit payment (SUCCESSFUL $300.00 on retreat_booking_id) -> totalPaid becomes $300.00, status PARTIALLY_PAID
        PaymentTransactionEntity depositTx = new PaymentTransactionEntity(
                booking, null, "DEPOSIT", "VNPAY",
                "DEP-" + UUID.randomUUID(), new BigDecimal("300.00"), "SUCCESSFUL"
        );
        paymentTransactionRepository.saveAndFlush(depositTx);
        FolioResponseDTO folioAfterDeposit = folioBillingService.getFolioByBookingId(bookingId);
        assertEquals(0, new BigDecimal("300.00").compareTo(folioAfterDeposit.getTotalPaid()));
        assertEquals("PARTIALLY_PAID", folioAfterDeposit.getFolioStatus());

        // 5. Issue consolidated invoice (package $1,000 - deposit $300 = $700; net FNB $100 + 8% VAT $8 = $808 finalAmount)
        InvoiceResponseDTO invoiceResp = folioBillingService.generateConsolidatedInvoice(bookingId);
        Long invoiceId = invoiceResp.invoiceId();
        InvoiceEntity invoiceEntity = invoiceRepository.findById(invoiceId).orElseThrow();
        assertEquals(0, new BigDecimal("808.00").compareTo(invoiceResp.finalAmount()));

        // 6. Pending VietQR transaction ($808.00 PENDING on invoice_id) -> MUST NOT contribute to totalPaid
        String vietQrRef = "HSW_INV_" + invoiceId + "_" + UUID.randomUUID().toString().substring(0, 6);
        PaymentTransactionEntity pendingVietQrTx = new PaymentTransactionEntity(
                null, invoiceEntity, "FINAL_PAYMENT", "VIETQR_BANK_TRANSFER",
                vietQrRef, new BigDecimal("808.00"), "PENDING"
        );
        paymentTransactionRepository.saveAndFlush(pendingVietQrTx);

        FolioResponseDTO folioWithPendingVietQr = folioBillingService.getFolioByBookingId(bookingId);
        assertEquals(0, new BigDecimal("300.00").compareTo(folioWithPendingVietQr.getTotalPaid()),
                "Pending VietQR transaction must not contribute to folio totalPaid");
        assertEquals("PARTIALLY_PAID", folioWithPendingVietQr.getFolioStatus());

        // 7. Final invoice payment confirmation + combined deposit ($300) + final ($808) = $1,108.00 without double counting
        assertTrue(checkoutService.confirmGatewayPayment(vietQrRef, true));
        FolioEntity settledFolio = folioRepository.findById(folio.getFolioId()).orElseThrow();
        assertEquals(0, new BigDecimal("1108.00").compareTo(settledFolio.getTotalPaid()));
        assertEquals("CLOSED", settledFolio.getFolioStatus());

        // Repeated getFolioByBookingId / syncFolioPaidState is idempotent, does not double-count, and preserves CLOSED status
        FolioResponseDTO folioReloaded = folioBillingService.getFolioByBookingId(bookingId);
        assertEquals(0, new BigDecimal("1108.00").compareTo(folioReloaded.getTotalPaid()));
        assertEquals("CLOSED", folioReloaded.getFolioStatus());
    }

    @Test
    void task7_rescheduleAndSameTimeRecoveryResetReminderStateForNewSlot() {
        RetreatBooking booking = createFreshBookingWithoutInvoice(new BigDecimal("24500000.00"));
        Integer customerUserId = customerProfileRepository.findByIdWithUser(booking.getCustomerProfileId())
                .map(cp -> cp.getUser().getUserId()).orElse(1);

        SpaTreatment treatment = new SpaTreatment(
                "Deep Tissue Renewal " + UUID.randomUUID().toString().substring(0, 4),
                60,
                new BigDecimal("1200000.00"),
                "Massage",
                "Therapeutic recovery"
        );
        treatment = spaTreatmentRepository.saveAndFlush(treatment);

        Therapist therapist1 = new Therapist(101, TherapistStatus.ACTIVE);
        therapist1.setDisplayName("Therapist One");
        therapist1 = therapistRepository.saveAndFlush(therapist1);

        Therapist therapist2 = new Therapist(102, TherapistStatus.ACTIVE);
        therapist2.setDisplayName("Therapist Two");
        therapist2 = therapistRepository.saveAndFlush(therapist2);

        therapistQualificationRepository.saveAndFlush(new TherapistTreatmentQualification(therapist1, treatment));
        therapistQualificationRepository.saveAndFlush(new TherapistTreatmentQualification(therapist2, treatment));

        TreatmentRoom room = new TreatmentRoom("Lotus Suite " + UUID.randomUUID().toString().substring(0, 4), TreatmentRoomStatus.AVAILABLE);
        room = treatmentRoomRepository.saveAndFlush(room);
        treatmentRoomCompatibilityRepository.saveAndFlush(new TreatmentRoomCompatibility(room, treatment));

        LocalDateTime initialStart = LocalDateTime.now().plusHours(4).withSecond(0).withNano(0);
        LocalDateTime initialEnd = initialStart.plusMinutes(60);

        SpaSession session = new SpaSession(
                booking.getRetreatBookingId(),
                treatment,
                therapist1,
                room,
                initialStart,
                initialStart,
                initialEnd,
                BookingSource.CUSTOMER,
                "Initial slot"
        );
        // Simulate a reminder that was already claimed and sent before reschedule/recovery
        session.setReminderStatus(SpaReminderStatus.SENT);
        session.setReminderClaimedAt(LocalDateTime.now().minusMinutes(10));
        session.setReminderClaimExpiresAt(LocalDateTime.now().minusMinutes(5));
        session.setReminderClaimToken("prev-claim-token");
        session.setReminderSentAt(LocalDateTime.now().minusMinutes(9));
        session = spaSessionRepository.saveAndFlush(session);

        // 1. Same-time recovery when therapist1 becomes SUSPENDED resets reminder state
        therapist1.setTherapistStatus(TherapistStatus.SUSPENDED);
        therapistRepository.saveAndFlush(therapist1);

        RecoveryResultDto recovery = sessionRecoveryService.attemptSameTimeRecovery(session.getSpaSessionId());
        assertTrue(recovery.isRecovered());
        assertEquals(therapist2.getTherapistId(), recovery.getReplacementTherapistId());

        SpaSession afterRecovery = spaSessionRepository.findById(session.getSpaSessionId()).orElseThrow();
        assertEquals(SpaReminderStatus.PENDING, afterRecovery.getReminderStatus());
        assertNull(afterRecovery.getReminderClaimedAt());
        assertNull(afterRecovery.getReminderClaimExpiresAt());
        assertNull(afterRecovery.getReminderClaimToken());
        assertNull(afterRecovery.getReminderSentAt());

        // 2. Customer reschedule after reminder sent also resets reminder state for the new slot
        afterRecovery.setReminderStatus(SpaReminderStatus.SENT);
        afterRecovery.setReminderSentAt(LocalDateTime.now().minusMinutes(2));
        afterRecovery.setReminderClaimToken("second-claim-token");
        spaSessionRepository.saveAndFlush(afterRecovery);

        LocalDateTime newStart = initialStart.plusHours(3);
        ConfirmReservationRequest rescheduleReq = new ConfirmReservationRequest(
                treatment.getTreatmentId(),
                therapist2.getTherapistId(),
                room.getRoomId(),
                newStart,
                newStart.plusMinutes(60),
                booking.getRetreatBookingId(),
                "Rescheduled to afternoon"
        );
        rescheduleReq.setBookingSource(BookingSource.CUSTOMER);
        rescheduleReq.setRescheduleSessionId(session.getSpaSessionId());

        spaSessionService.confirmReservation(rescheduleReq, customerUserId);

        SpaSession afterReschedule = spaSessionRepository.findById(session.getSpaSessionId()).orElseThrow();
        assertEquals(newStart, afterReschedule.getScheduledStartAt());
        assertEquals(SpaReminderStatus.PENDING, afterReschedule.getReminderStatus());
        assertNull(afterReschedule.getReminderClaimedAt());
        assertNull(afterReschedule.getReminderClaimExpiresAt());
        assertNull(afterReschedule.getReminderClaimToken());
        assertNull(afterReschedule.getReminderSentAt());
    }

    @Test
    void task2_5_6_migrationsAreDatabaseContextNeutralAndContainExpectedM3AndM5Definitions() throws IOException {
        Path migrationsDir = Path.of("..", "database", "migrations").normalize();
        assertTrue(Files.isDirectory(migrationsDir), "Migrations directory must exist at " + migrationsDir.toAbsolutePath());

        try (Stream<Path> paths = Files.list(migrationsDir)) {
            List<Path> sqlFiles = paths.filter(p -> p.toString().endsWith(".sql")).toList();
            assertFalse(sqlFiles.isEmpty());
            for (Path sqlFile : sqlFiles) {
                String content = Files.readString(sqlFile);
                assertFalse(content.matches("(?is).*\\bUSE\\s+\\[HSWRMS\\].*"),
                        "Migration file must not contain hardcoded USE [HSWRMS]: " + sqlFile.getFileName());
            }
        }

        // Verify V016 M3 reminder + trigger reconciliation migration
        Path v016 = migrationsDir.resolve("V016__m3_spa_session_reminder_and_trigger_reconciliation.sql");
        assertTrue(Files.isRegularFile(v016), "V016 migration file must exist");
        String v016Sql = Files.readString(v016);
        assertTrue(v016Sql.contains("reminder_status"));
        assertTrue(v016Sql.contains("reminder_claimed_at"));
        assertTrue(v016Sql.contains("reminder_claim_expires_at"));
        assertTrue(v016Sql.contains("reminder_sent_at"));
        Set<String> enumNames = Arrays.stream(SpaReminderStatus.values()).map(Enum::name).collect(Collectors.toSet());
        for (String statusName : enumNames) {
            assertTrue(v016Sql.contains("'" + statusName + "'"),
                    "V016 CK_SpaSession_ReminderStatus must include enum value " + statusName);
        }
        assertTrue(v016Sql.contains("TR_SpaSession_ValidateScheduling"));

        // Verify V017 M5 folio triggers reconciliation migration
        Path v017 = migrationsDir.resolve("V017__m5_folio_triggers_reconciliation.sql");
        assertTrue(Files.isRegularFile(v017), "V017 migration file must exist");
        String v017Sql = Files.readString(v017);
        assertTrue(v017Sql.contains("TR_FolioItem_RecalculateTotal"));
        assertTrue(v017Sql.contains("is_voided"));
        assertTrue(v017Sql.contains("adjusted_amount"));
        assertTrue(v017Sql.contains("TR_PaymentTransaction_RecalculateFolioPaid"));
        assertTrue(v017Sql.contains("retreat_booking_id"));
        assertTrue(v017Sql.contains("FINAL_PAYMENT"));
        assertTrue(v017Sql.contains("SUCCESSFUL"));
    }

    private RetreatBooking createFreshBookingWithoutInvoice(BigDecimal packageEstimate) {
        RetreatBooking existing = retreatBookingRepository.findAll().get(0);
        RetreatBooking fresh = new RetreatBooking();
        fresh.setCustomerProfileId(existing.getCustomerProfileId());
        fresh.setRetreatPackage(existing.getRetreatPackage());
        fresh.setRequestedVillaCategory(existing.getRequestedVillaCategory());
        fresh.setAssignedVilla(existing.getAssignedVilla());
        fresh.setCheckInDate(LocalDate.now().minusDays(2));
        fresh.setCheckOutDate(LocalDate.now().plusDays(1));
        fresh.setBookingStatus("CHECKED_IN");
        fresh.setDepositAmount(BigDecimal.ZERO);
        fresh.setTotalEstimatedAmount(packageEstimate);
        return retreatBookingRepository.saveAndFlush(fresh);
    }
}
