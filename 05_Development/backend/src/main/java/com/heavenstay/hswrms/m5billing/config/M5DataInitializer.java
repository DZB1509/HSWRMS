package com.heavenstay.hswrms.m5billing.config;

import com.heavenstay.hswrms.m1identity.entity.CustomerProfile;
import com.heavenstay.hswrms.m1identity.entity.User;
import com.heavenstay.hswrms.m1identity.repository.CustomerProfileRepository;
import com.heavenstay.hswrms.m1identity.repository.UserRepository;
import com.heavenstay.hswrms.m2booking.entity.PhysicalVilla;
import com.heavenstay.hswrms.m2booking.entity.RetreatBooking;
import com.heavenstay.hswrms.m2booking.entity.RetreatPackage;
import com.heavenstay.hswrms.m2booking.entity.VillaCategory;
import com.heavenstay.hswrms.m2booking.repository.PhysicalVillaRepository;
import com.heavenstay.hswrms.m2booking.repository.RetreatBookingRepository;
import com.heavenstay.hswrms.m2booking.repository.RetreatPackageRepository;
import com.heavenstay.hswrms.m2booking.repository.VillaCategoryRepository;
import com.heavenstay.hswrms.m3spa.entity.SpaSession;
import com.heavenstay.hswrms.m3spa.entity.SpaTreatment;
import com.heavenstay.hswrms.m3spa.entity.Therapist;
import com.heavenstay.hswrms.m3spa.entity.TreatmentRoom;
import com.heavenstay.hswrms.m3spa.entity.enums.BookingSource;
import com.heavenstay.hswrms.m3spa.entity.enums.SpaConfirmationStatus;
import com.heavenstay.hswrms.m3spa.entity.enums.SpaSessionStatus;
import com.heavenstay.hswrms.m3spa.entity.enums.TherapistStatus;
import com.heavenstay.hswrms.m3spa.entity.enums.TreatmentRoomStatus;
import com.heavenstay.hswrms.m3spa.repository.SpaSessionRepository;
import com.heavenstay.hswrms.m3spa.repository.SpaTreatmentRepository;
import com.heavenstay.hswrms.m3spa.repository.TherapistRepository;
import com.heavenstay.hswrms.m3spa.repository.TherapistTreatmentQualificationRepository;
import com.heavenstay.hswrms.m3spa.repository.TreatmentRoomCompatibilityRepository;
import com.heavenstay.hswrms.m3spa.repository.RetreatPackageSpaTreatmentRepository;
import com.heavenstay.hswrms.m3spa.entity.TherapistTreatmentQualification;
import com.heavenstay.hswrms.m3spa.entity.TreatmentRoomCompatibility;
import com.heavenstay.hswrms.m3spa.entity.RetreatPackageSpaTreatment;
import com.heavenstay.hswrms.m3spa.repository.TreatmentRoomRepository;
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
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
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
    private final UserRepository userRepository;
    private final CustomerProfileRepository customerProfileRepository;
    private final RetreatBookingRepository bookingRepository;
    private final PhysicalVillaRepository villaRepository;
    private final VillaCategoryRepository villaCategoryRepository;
    private final RetreatPackageRepository retreatPackageRepository;
    private final SpaSessionRepository spaSessionRepository;
    private final SpaTreatmentRepository spaTreatmentRepository;
    private final TreatmentRoomRepository treatmentRoomRepository;
    private final TherapistRepository therapistRepository;
    private final MealOrderRepository mealOrderRepository;
    private final FolioRepository folioRepository;
    private final FolioItemRepository folioItemRepository;
    private final InvoiceRepository invoiceRepository;
    private final PaymentTransactionRepository paymentTransactionRepository;
    private final Environment environment;
    private final TherapistTreatmentQualificationRepository qualificationRepository;
    private final TreatmentRoomCompatibilityRepository roomCompatibilityRepository;
    private final RetreatPackageSpaTreatmentRepository retreatPackageSpaTreatmentRepository;

    public M5DataInitializer(EntityManager entityManager,
                             UserRepository userRepository,
                             CustomerProfileRepository customerProfileRepository,
                             RetreatBookingRepository bookingRepository,
                             PhysicalVillaRepository villaRepository,
                             VillaCategoryRepository villaCategoryRepository,
                             RetreatPackageRepository retreatPackageRepository,
                             SpaSessionRepository spaSessionRepository,
                             SpaTreatmentRepository spaTreatmentRepository,
                             TreatmentRoomRepository treatmentRoomRepository,
                             TherapistRepository therapistRepository,
                             MealOrderRepository mealOrderRepository,
                             FolioRepository folioRepository,
                             FolioItemRepository folioItemRepository,
                             InvoiceRepository invoiceRepository,
                             PaymentTransactionRepository paymentTransactionRepository,
                             Environment environment) {
        this(entityManager, userRepository, customerProfileRepository, bookingRepository,
             villaRepository, villaCategoryRepository, retreatPackageRepository, spaSessionRepository,
             spaTreatmentRepository, treatmentRoomRepository, therapistRepository, mealOrderRepository,
             folioRepository, folioItemRepository, invoiceRepository, paymentTransactionRepository,
             environment, null, null, null);
    }

    // Overloaded with M3 qualification & compatibility repositories
    @org.springframework.beans.factory.annotation.Autowired
    public M5DataInitializer(EntityManager entityManager,
                             UserRepository userRepository,
                             CustomerProfileRepository customerProfileRepository,
                             RetreatBookingRepository bookingRepository,
                             PhysicalVillaRepository villaRepository,
                             VillaCategoryRepository villaCategoryRepository,
                             RetreatPackageRepository retreatPackageRepository,
                             SpaSessionRepository spaSessionRepository,
                             SpaTreatmentRepository spaTreatmentRepository,
                             TreatmentRoomRepository treatmentRoomRepository,
                             TherapistRepository therapistRepository,
                             MealOrderRepository mealOrderRepository,
                             FolioRepository folioRepository,
                             FolioItemRepository folioItemRepository,
                             InvoiceRepository invoiceRepository,
                             PaymentTransactionRepository paymentTransactionRepository,
                             Environment environment,
                             @org.springframework.beans.factory.annotation.Autowired(required = false) TherapistTreatmentQualificationRepository qualificationRepository,
                             @org.springframework.beans.factory.annotation.Autowired(required = false) TreatmentRoomCompatibilityRepository roomCompatibilityRepository,
                             @org.springframework.beans.factory.annotation.Autowired(required = false) RetreatPackageSpaTreatmentRepository retreatPackageSpaTreatmentRepository) {
        this.entityManager = entityManager;
        this.userRepository = userRepository;
        this.customerProfileRepository = customerProfileRepository;
        this.bookingRepository = bookingRepository;
        this.villaRepository = villaRepository;
        this.villaCategoryRepository = villaCategoryRepository;
        this.retreatPackageRepository = retreatPackageRepository;
        this.spaSessionRepository = spaSessionRepository;
        this.spaTreatmentRepository = spaTreatmentRepository;
        this.treatmentRoomRepository = treatmentRoomRepository;
        this.therapistRepository = therapistRepository;
        this.mealOrderRepository = mealOrderRepository;
        this.folioRepository = folioRepository;
        this.folioItemRepository = folioItemRepository;
        this.invoiceRepository = invoiceRepository;
        this.paymentTransactionRepository = paymentTransactionRepository;
        this.environment = environment;
        this.qualificationRepository = qualificationRepository;
        this.roomCompatibilityRepository = roomCompatibilityRepository;
        this.retreatPackageSpaTreatmentRepository = retreatPackageSpaTreatmentRepository;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (bookingRepository.count() > 0) {
            log.info("Database already seeded. Skipping M5 test data initialization.");
            seedCustomerBAcceptanceFixture();
            return;
        }

        log.info("Seeding synthetic M5 demo and test data for the local Customer account...");

        // 0. Base Categories & Packages
        VillaCategory cat1 = villaCategoryRepository.findAll().stream().findFirst().orElseGet(() -> {
            VillaCategory c = new VillaCategory();
            c.setCategoryName("Sanctuary Pool Villa");
            c.setMaxOccupancy(3);
            c.setPriceModifier(BigDecimal.ZERO);
            c.setCategoryStatus("ACTIVE");
            c.setInventoryCount(10);
            c.setBedroomCount(1);
            return villaCategoryRepository.save(c);
        });

        RetreatPackage pkg1 = retreatPackageRepository.findAll().stream().findFirst().orElseGet(() -> {
            RetreatPackage p = new RetreatPackage();
            p.setPackageCode("PKG-SANCTUARY-3N");
            p.setPackageName("Sanctuary Wellness Retreat Package (3 Nights)");
            p.setDurationNights(3);
            p.setBasePrice(new BigDecimal("24500000.00"));
            p.setPackageStatus("ACTIVE");
            return retreatPackageRepository.save(p);
        });

        // 1. Users
        User customerUser = userRepository.findByEmail("customer@heavenstay.dev").orElse(null);
        if (customerUser == null) {
            customerUser = new User();
            customerUser.setFullName("Demo Customer");
            customerUser.setEmail("customer@heavenstay.dev");
            customerUser.setAccountStatus("ACTIVE");
            customerUser.setEmailVerified(true);
            entityManager.persist(customerUser);
        }

        User therapistUser1 = new User();
        therapistUser1.setFullName("Nguyen Thi Lan");
        therapistUser1.setEmail("lan.nguyen@heavenstay.resort");
        therapistUser1.setPhoneNumber("+84902345678");
        therapistUser1.setAccountStatus("ACTIVE");
        therapistUser1.setEmailVerified(true);
        entityManager.persist(therapistUser1);

        User therapistUser2 = new User();
        therapistUser2.setFullName("Tran Minh Duc");
        therapistUser2.setEmail("duc.tran@heavenstay.resort");
        therapistUser2.setPhoneNumber("+84903456789");
        therapistUser2.setAccountStatus("ACTIVE");
        therapistUser2.setEmailVerified(true);
        entityManager.persist(therapistUser2);

        // 2. Customer Profile
        CustomerProfile profile = customerProfileRepository.findByUserId(customerUser.getUserId()).orElse(null);
        if (profile == null) {
            profile = new CustomerProfile();
            profile.setUser(customerUser);
            entityManager.persist(profile);
        }

        // 3. Villas
        PhysicalVilla v102 = new PhysicalVilla();
        v102.setVillaCategory(cat1);
        v102.setVillaNumber("Villa #102");
        v102.setVillaStatus("OCCUPIED");
        v102.setMaxOccupancy(3);
        villaRepository.save(v102);

        PhysicalVilla v103 = new PhysicalVilla();
        v103.setVillaCategory(cat1);
        v103.setVillaNumber("Villa #103");
        v103.setVillaStatus("AVAILABLE");
        v103.setMaxOccupancy(3);
        villaRepository.save(v103);

        PhysicalVilla v104 = new PhysicalVilla();
        v104.setVillaCategory(cat1);
        v104.setVillaNumber("Villa #104");
        v104.setVillaStatus("NEEDS_CLEANING");
        v104.setMaxOccupancy(3);
        villaRepository.save(v104);

        PhysicalVilla v105 = new PhysicalVilla();
        v105.setVillaCategory(cat1);
        v105.setVillaNumber("Villa #105");
        v105.setVillaStatus("MAINTENANCE");
        v105.setMaxOccupancy(3);
        villaRepository.save(v105);

        // 4. Therapists
        Therapist therapist1 = new Therapist(therapistUser1.getUserId(), TherapistStatus.ACTIVE);
        therapistRepository.save(therapist1);

        Therapist therapist2 = new Therapist(therapistUser2.getUserId(), TherapistStatus.ACTIVE);
        therapistRepository.save(therapist2);

        // 4b. Treatments and Rooms
        SpaTreatment treatment1 = spaTreatmentRepository.findAll().stream().findFirst().orElseGet(() -> {
            SpaTreatment t = new SpaTreatment("Holistic Herbal Massage", 90, new BigDecimal("1500000.00"), "Massage", "Holistic treatment");
            return spaTreatmentRepository.save(t);
        });

        SpaTreatment treatment2 = spaTreatmentRepository.save(new SpaTreatment(
                "Therapeutic Mineral Mud Wrap", 90, new BigDecimal("1500000.00"), "Body Wrap", "Extra service"
        ));

        TreatmentRoom room1 = treatmentRoomRepository.findAll().stream().findFirst().orElseGet(() ->
                treatmentRoomRepository.save(new TreatmentRoom("Lotus Room", TreatmentRoomStatus.AVAILABLE, "STANDARD")));

        TreatmentRoom room2 = treatmentRoomRepository.save(new TreatmentRoom("Bamboo Room", TreatmentRoomStatus.AVAILABLE, "VIP"));

        // 4c. Therapist Qualifications & Room Compatibility
        if (qualificationRepository != null) {
            for (Therapist t : therapistRepository.findAll()) {
                if (!qualificationRepository.existsByTherapist_TherapistIdAndTreatment_TreatmentId(t.getTherapistId(), treatment1.getTreatmentId())) {
                    qualificationRepository.save(new TherapistTreatmentQualification(t, treatment1));
                }
                if (!qualificationRepository.existsByTherapist_TherapistIdAndTreatment_TreatmentId(t.getTherapistId(), treatment2.getTreatmentId())) {
                    qualificationRepository.save(new TherapistTreatmentQualification(t, treatment2));
                }
            }
        }
        if (roomCompatibilityRepository != null) {
            for (TreatmentRoom r : treatmentRoomRepository.findAll()) {
                if (!roomCompatibilityRepository.existsByTreatmentRoom_RoomIdAndTreatment_TreatmentId(r.getRoomId(), treatment1.getTreatmentId())) {
                    roomCompatibilityRepository.save(new TreatmentRoomCompatibility(r, treatment1));
                }
                if (!roomCompatibilityRepository.existsByTreatmentRoom_RoomIdAndTreatment_TreatmentId(r.getRoomId(), treatment2.getTreatmentId())) {
                    roomCompatibilityRepository.save(new TreatmentRoomCompatibility(r, treatment2));
                }
            }
        }
        if (retreatPackageSpaTreatmentRepository != null) {
            if (retreatPackageSpaTreatmentRepository.findByRetreatPackageId(pkg1.getRetreatPackageId()).isEmpty()) {
                retreatPackageSpaTreatmentRepository.save(new RetreatPackageSpaTreatment(
                        pkg1, treatment1, 1, "INCLUDED", "Included 90-min herbal massage"
                ));
            }
        }

        // 5. Booking 1: Eleanor Vance (HSW-88192, id = 1)
        RetreatBooking booking1 = new RetreatBooking();
        booking1.setCustomerProfileId(profile.getCustomerProfileId());
        booking1.setRetreatPackage(pkg1);
        booking1.setRequestedVillaCategory(cat1);
        booking1.setAssignedVilla(v102);
        booking1.setCheckInDate(LocalDate.now().minusDays(3));
        booking1.setCheckOutDate(LocalDate.now());
        booking1.setBookingStatus("CHECKED_IN");
        booking1.setDepositAmount(new BigDecimal("7350000.00")); // 30% deposit
        booking1.setTotalEstimatedAmount(new BigDecimal("24500000.00"));
        booking1.setSpecialRequest("Ocean view quiet villa, organic herbal tea setup");
        RetreatBooking savedBooking = bookingRepository.save(booking1);

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
        SpaSession session1 = new SpaSession();
        session1.setRetreatBookingId(savedBooking.getRetreatBookingId());
        session1.setTreatment(treatment1);
        session1.setTherapist(therapist1);
        session1.setTreatmentRoom(room1);
        session1.setScheduledStartAt(LocalDateTime.now().minusDays(2).withHour(10).withMinute(0));
        session1.setScheduledEndAt(LocalDateTime.now().minusDays(2).withHour(11).withMinute(30));
        session1.setBookingSource(BookingSource.CUSTOMER);
        session1.setSessionStatus(SpaSessionStatus.COMPLETED);
        session1.setConfirmationStatus(SpaConfirmationStatus.CONFIRMED);
        session1.setCustomerNote("Holistic body tension release");
        spaSessionRepository.save(session1);

        // Extra session (completed)
        SpaSession session2 = new SpaSession();
        session2.setRetreatBookingId(savedBooking.getRetreatBookingId());
        session2.setTreatment(treatment2);
        session2.setTherapist(therapist1);
        session2.setTreatmentRoom(room2);
        session2.setScheduledStartAt(LocalDateTime.now().minusDays(1).withHour(14).withMinute(0));
        session2.setScheduledEndAt(LocalDateTime.now().minusDays(1).withHour(15).withMinute(30));
        session2.setBookingSource(BookingSource.CUSTOMER);
        session2.setSessionStatus(SpaSessionStatus.COMPLETED);
        session2.setConfirmationStatus(SpaConfirmationStatus.CONFIRMED);
        session2.setCustomerNote("Therapeutic Mineral Herbal Mud Wrap (Extra Service)");
        SpaSession savedSession2 = spaSessionRepository.save(session2);

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
                savedBooking.getRetreatBookingId().longValue(),
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
        seedCustomerBAcceptanceFixture();
    }

    /** Seeds a second synthetic owner only in explicitly enabled local/demo environments. */
    void seedCustomerBAcceptanceFixture() {
        if (!environment.acceptsProfiles(Profiles.of("local", "demo"))
                || !Boolean.parseBoolean(environment.getProperty("app.demo.bootstrap-enabled", "false"))) {
            return;
        }

        User customerB = userRepository.findByEmail("customer-b@heavenstay.dev").orElse(null);
        if (customerB == null) {
            log.info("Customer B acceptance fixture skipped: local demo account bootstrap is not available.");
            return;
        }
        CustomerProfile profileB = customerProfileRepository.findByUserId(customerB.getUserId()).orElse(null);
        if (profileB == null) {
            log.warn("Customer B acceptance fixture skipped: Customer B profile is not available.");
            return;
        }

        final String fixtureMarker = "Synthetic Batch 4.3 Customer B authorization fixture";
        RetreatBooking bookingB = bookingRepository.findByCustomerProfileIdOrderByCreatedAtDesc(profileB.getCustomerProfileId())
                .stream()
                .filter(booking -> fixtureMarker.equals(booking.getSpecialRequest()))
                .findFirst()
                .orElse(null);
        if (bookingB == null) {
            RetreatBooking template = bookingRepository.findAll().stream().findFirst().orElse(null);
            if (template == null) {
                log.warn("Customer B acceptance fixture skipped: no seeded package/category is available.");
                return;
            }
            bookingB = new RetreatBooking();
            bookingB.setCustomerProfileId(profileB.getCustomerProfileId());
            bookingB.setRetreatPackage(template.getRetreatPackage());
            bookingB.setRequestedVillaCategory(template.getRequestedVillaCategory());
            bookingB.setAssignedVilla(null);
            bookingB.setCheckInDate(LocalDate.now().plusDays(30));
            bookingB.setCheckOutDate(LocalDate.now().plusDays(32));
            bookingB.setBookingStatus("PENDING");
            bookingB.setDepositAmount(BigDecimal.ZERO);
            bookingB.setTotalEstimatedAmount(template.getTotalEstimatedAmount());
            bookingB.setSpecialRequest(fixtureMarker);
            bookingB = bookingRepository.save(bookingB);
        }

        final RetreatBooking persistedBooking = bookingB;
        FolioEntity folio = folioRepository.findByRetreatBookingId(persistedBooking.getRetreatBookingId())
                .orElseGet(() -> {
                    FolioEntity created = new FolioEntity(persistedBooking);
                    created.setTotalCharges(BigDecimal.ZERO);
                    created.setTotalPaid(BigDecimal.ZERO);
                    created.setFolioStatus("OPEN");
                    return folioRepository.save(created);
                });
        if (invoiceRepository.findByFolioId(folio.getFolioId()).isEmpty()) {
            InvoiceEntity invoiceB = new InvoiceEntity(
                    folio,
                    "INV-DEMO-CB-" + persistedBooking.getRetreatBookingId(),
                    BigDecimal.ZERO,
                    BigDecimal.ZERO,
                    BigDecimal.ZERO,
                    "DRAFT");
            invoiceRepository.save(invoiceB);
        }
        log.info("Synthetic Customer B authorization fixture ready for booking ID {}.", persistedBooking.getRetreatBookingId());
    }
}
