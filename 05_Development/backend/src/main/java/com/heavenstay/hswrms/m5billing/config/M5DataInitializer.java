package com.heavenstay.hswrms.m5billing.config;

import com.heavenstay.hswrms.m1identity.entity.CustomerProfileEntity;
import com.heavenstay.hswrms.m1identity.entity.UserEntity;
import com.heavenstay.hswrms.m2booking.entity.PhysicalVillaEntity;
import com.heavenstay.hswrms.m2booking.entity.RetreatBookingEntity;
import com.heavenstay.hswrms.m2booking.repository.PhysicalVillaRepository;
import com.heavenstay.hswrms.m2booking.repository.RetreatBookingRepository;
import com.heavenstay.hswrms.m3spa.entity.SpaSessionEntity;
import com.heavenstay.hswrms.m3spa.entity.TherapistEntity;
import com.heavenstay.hswrms.m3spa.repository.SpaSessionRepository;
import com.heavenstay.hswrms.m3spa.repository.TherapistRepository;
import com.heavenstay.hswrms.m4fnb.entity.MealOrderEntity;
import com.heavenstay.hswrms.m4fnb.repository.MealOrderRepository;
import com.heavenstay.hswrms.m5billing.entity.FolioEntity;
import com.heavenstay.hswrms.m5billing.entity.FolioItemEntity;
import com.heavenstay.hswrms.m5billing.entity.InvoiceEntity;
import com.heavenstay.hswrms.m5billing.entity.PaymentTransactionEntity;
import com.heavenstay.hswrms.m5billing.repository.FolioItemRepository;
import com.heavenstay.hswrms.m5billing.repository.FolioRepository;
import com.heavenstay.hswrms.m5billing.repository.InvoiceRepository;
import com.heavenstay.hswrms.m5billing.repository.PaymentTransactionRepository;
import jakarta.persistence.EntityManager;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Component
@ConditionalOnProperty(name = "app.seed.demo-data", havingValue = "true")
public class M5DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(M5DataInitializer.class);

    private final EntityManager entityManager;
    private final RetreatBookingRepository bookingRepository;
    private final PhysicalVillaRepository villaRepository;
    private final SpaSessionRepository spaSessionRepository;
    private final TherapistRepository therapistRepository;
    private final MealOrderRepository mealOrderRepository;
    private final FolioRepository folioRepository;
    private final FolioItemRepository folioItemRepository;
    private final InvoiceRepository invoiceRepository;
    private final PaymentTransactionRepository paymentTransactionRepository;
    private final javax.sql.DataSource dataSource;

    public M5DataInitializer(EntityManager entityManager,
                             RetreatBookingRepository bookingRepository,
                             PhysicalVillaRepository villaRepository,
                             SpaSessionRepository spaSessionRepository,
                             TherapistRepository therapistRepository,
                             MealOrderRepository mealOrderRepository,
                             FolioRepository folioRepository,
                             FolioItemRepository folioItemRepository,
                             InvoiceRepository invoiceRepository,
                             PaymentTransactionRepository paymentTransactionRepository,
                             javax.sql.DataSource dataSource) {
        this.entityManager = entityManager;
        this.bookingRepository = bookingRepository;
        this.villaRepository = villaRepository;
        this.spaSessionRepository = spaSessionRepository;
        this.therapistRepository = therapistRepository;
        this.mealOrderRepository = mealOrderRepository;
        this.folioRepository = folioRepository;
        this.folioItemRepository = folioItemRepository;
        this.invoiceRepository = invoiceRepository;
        this.paymentTransactionRepository = paymentTransactionRepository;
        this.dataSource = dataSource;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (bookingRepository.count() > 0) {
            log.info("Database already seeded. Skipping M5 test data initialization.");
            return;
        }

        log.info("Seeding realistic M5 demo and test data (Eleanor Vance - HSW-88192)...");

        // 1. Users
        UserEntity customerUser = new UserEntity(null, "Eleanor Vance", "eleanor.vance@heavenstay.resort", "+84901234567");
        customerUser.setAccountStatus("ACTIVE");
        entityManager.persist(customerUser);

        UserEntity therapistUser1 = new UserEntity(null, "Nguyen Thi Lan", "lan.nguyen@heavenstay.resort", "+84902345678");
        entityManager.persist(therapistUser1);

        UserEntity therapistUser2 = new UserEntity(null, "Tran Minh Duc", "duc.tran@heavenstay.resort", "+84903456789");
        entityManager.persist(therapistUser2);

        // 2. Customer Profile
        CustomerProfileEntity profile = new CustomerProfileEntity(null, customerUser);
        profile.setEmergencyContact("Arthur Vance (+84911223344)");
        entityManager.persist(profile);

        // 3. Villas
        PhysicalVillaEntity v102 = villaRepository.findByVillaNumber("V102")
                .orElseGet(() -> villaRepository.save(new PhysicalVillaEntity(null, 1L, "V102", "AVAILABLE")));
        v102.setVillaStatus("OCCUPIED");
        villaRepository.save(v102);

        PhysicalVillaEntity v103 = villaRepository.findByVillaNumber("V103")
                .orElseGet(() -> villaRepository.save(new PhysicalVillaEntity(null, 1L, "V103", "AVAILABLE")));
        villaRepository.save(v103);

        PhysicalVillaEntity v104 = villaRepository.findByVillaNumber("V104")
                .orElseGet(() -> villaRepository.save(new PhysicalVillaEntity(null, 2L, "V104", "AVAILABLE")));
        v104.setVillaStatus("NEEDS_CLEANING");
        villaRepository.save(v104);

        PhysicalVillaEntity v105 = villaRepository.findByVillaNumber("V105")
                .orElseGet(() -> villaRepository.save(new PhysicalVillaEntity(null, 2L, "V105", "AVAILABLE")));
        v105.setVillaStatus("MAINTENANCE");
        villaRepository.save(v105);

        // 4. Therapists
        TherapistEntity therapist1 = new TherapistEntity();
        therapist1.setUser(therapistUser1);
        therapist1.setTherapistStatus("ACTIVE");
        therapistRepository.save(therapist1);

        TherapistEntity therapist2 = new TherapistEntity();
        therapist2.setUser(therapistUser2);
        therapist2.setTherapistStatus("ACTIVE");
        therapistRepository.save(therapist2);

        // Ensure qualification and room compatibility for Spa Sessions if running against Microsoft SQL Server
        try (java.sql.Connection conn = dataSource.getConnection()) {
            String dbName = conn.getMetaData().getDatabaseProductName();
            if (dbName != null && dbName.toLowerCase().contains("sql server")) {
                try (java.sql.Statement stmt = conn.createStatement()) {
                    stmt.executeUpdate("IF NOT EXISTS (SELECT 1 FROM dbo.TherapistTreatmentQualification WHERE therapist_id = " + therapist1.getTherapistId() + " AND treatment_id = 1) INSERT INTO dbo.TherapistTreatmentQualification (therapist_id, treatment_id) VALUES (" + therapist1.getTherapistId() + ", 1)");
                    stmt.executeUpdate("IF NOT EXISTS (SELECT 1 FROM dbo.TherapistTreatmentQualification WHERE therapist_id = " + therapist1.getTherapistId() + " AND treatment_id = 2) INSERT INTO dbo.TherapistTreatmentQualification (therapist_id, treatment_id) VALUES (" + therapist1.getTherapistId() + ", 2)");
                    stmt.executeUpdate("IF NOT EXISTS (SELECT 1 FROM dbo.TreatmentRoomCompatibility WHERE room_id = 1 AND treatment_id = 1) INSERT INTO dbo.TreatmentRoomCompatibility (room_id, treatment_id) VALUES (1, 1)");
                    stmt.executeUpdate("IF NOT EXISTS (SELECT 1 FROM dbo.TreatmentRoomCompatibility WHERE room_id = 2 AND treatment_id = 2) INSERT INTO dbo.TreatmentRoomCompatibility (room_id, treatment_id) VALUES (2, 2)");
                }
            }
        } catch (Exception e) {
            log.warn("SQL Server qualification seed skipped or not applicable: {}", e.getMessage());
        }

        // 5. Booking 1: Eleanor Vance (HSW-88192, id = 1)
        RetreatBookingEntity booking1 = new RetreatBookingEntity();
        booking1.setCustomerProfile(profile);
        booking1.setRetreatPackageId(1L);
        booking1.setRequestedVillaCategoryId(1L);
        booking1.setAssignedVilla(v102);
        booking1.setCheckInDate(LocalDate.now().minusDays(3));
        booking1.setCheckOutDate(LocalDate.now());
        booking1.setBookingStatus("CHECKED_IN");
        booking1.setDepositAmount(new BigDecimal("7350000.00")); // 30% deposit
        booking1.setTotalEstimatedAmount(new BigDecimal("24500000.00"));
        booking1.setSpecialRequest("Ocean view quiet villa, organic herbal tea setup");
        RetreatBookingEntity savedBooking = bookingRepository.save(booking1);

        // 5b. PaymentTransaction: Deposit
        PaymentTransactionEntity depositTx = new PaymentTransactionEntity(
                savedBooking,
                null,
                "DEPOSIT",
                "VNPAY",
                "DEP-HSW-88192-2026",
                new BigDecimal("7350000.00"),
                "SUCCESSFUL"
        );
        paymentTransactionRepository.save(depositTx);

        // 6. Spa Sessions
        // Included session (completed)
        SpaSessionEntity session1 = new SpaSessionEntity();
        session1.setRetreatBooking(savedBooking);
        session1.setTreatmentId(1L);
        session1.setTherapist(therapist1);
        session1.setRoomId(1L);
        session1.setScheduledStartAt(LocalDateTime.now().minusDays(2).withHour(10).withMinute(0));
        session1.setScheduledEndAt(LocalDateTime.now().minusDays(2).withHour(11).withMinute(30));
        session1.setBookingSource("CUSTOMER");
        session1.setSessionStatus("COMPLETED");
        session1.setConfirmationStatus("CONFIRMED");
        session1.setCustomerNote("Holistic body tension release");
        spaSessionRepository.save(session1);

        // Extra session (completed)
        SpaSessionEntity session2 = new SpaSessionEntity();
        session2.setRetreatBooking(savedBooking);
        session2.setTreatmentId(2L);
        session2.setTherapist(therapist1);
        session2.setRoomId(2L);
        session2.setScheduledStartAt(LocalDateTime.now().minusDays(1).withHour(14).withMinute(0));
        session2.setScheduledEndAt(LocalDateTime.now().minusDays(1).withHour(15).withMinute(30));
        session2.setBookingSource("CUSTOMER");
        session2.setSessionStatus("COMPLETED");
        session2.setConfirmationStatus("CONFIRMED");
        session2.setCustomerNote("Therapeutic Mineral Herbal Mud Wrap (Extra Service)");
        SpaSessionEntity savedSession2 = spaSessionRepository.save(session2);

        // 7. Meal Orders
        MealOrderEntity mealOrder1 = new MealOrderEntity();
        mealOrder1.setRetreatBooking(savedBooking);
        mealOrder1.setOrderDate(LocalDate.now().minusDays(1));
        mealOrder1.setMealType("Dinner");
        mealOrder1.setOrderType("A_LA_CARTE");
        mealOrder1.setOrderStatus("DELIVERED");
        MealOrderEntity savedMealOrder = mealOrderRepository.save(mealOrder1);

        // 8. Folio & Folio Items
        FolioEntity folio = new FolioEntity(savedBooking);
        folio.setTotalCharges(new BigDecimal("26600000.00")); // 24.5M pkg + 1.5M spa + 600K dining
        folio.setTotalPaid(new BigDecimal("7350000.00")); // deposit paid
        folio.setFolioStatus("PARTIALLY_PAID");
        FolioEntity savedFolio = folioRepository.save(folio);

        // Item 1: Package
        FolioItemEntity itemPkg = new FolioItemEntity(
                savedFolio,
                "PACKAGE",
                "Sanctuary Retreat Package Accommodation & Full-Board (3 Nights)",
                new BigDecimal("24500000.00"),
                savedBooking.getRetreatBookingId(),
                null,
                null
        );
        folioItemRepository.save(itemPkg);

        // Item 2: Extra Spa Session
        FolioItemEntity itemSpa = new FolioItemEntity(
                savedFolio,
                "SPA",
                "Quấn Bùn Khoáng Thảo Dược Trị Liệu - Mud Wrap Extra",
                new BigDecimal("1500000.00"),
                null,
                savedSession2.getSpaSessionId(),
                null
        );
        folioItemRepository.save(itemSpa);

        // Item 3: Extra F&B Order
        FolioItemEntity itemFnb = new FolioItemEntity(
                savedFolio,
                "FNB",
                "Thực Đơn A-la-carte Tùy Chọn (3 món dưỡng sinh)",
                new BigDecimal("600000.00"),
                null,
                null,
                savedMealOrder.getMealOrderId()
        );
        folioItemRepository.save(itemFnb);

        // 9. Invoice Draft (SRS BF-05 / Data Rule 21 compliant)
        // Subtotal = (24.5M - 7.35M deposit) + 1.5M spa + 0.6M fnb = 19,250,000 VND
        // Tax = 8% on extras (2.1M) = 168,000 VND
        // Final Amount = 19,418,000 VND
        InvoiceEntity invoice = new InvoiceEntity(
                savedFolio,
                "INV-20260927-" + savedFolio.getFolioId(),
                new BigDecimal("19250000.00"),
                new BigDecimal("168000.00"),
                new BigDecimal("19418000.00"),
                "DRAFT"
        );
        invoiceRepository.save(invoice);

        log.info("M5 demo data seeded successfully: Folio ID {}, Invoice ID {}", savedFolio.getFolioId(), invoice.getInvoiceId());
    }
}
