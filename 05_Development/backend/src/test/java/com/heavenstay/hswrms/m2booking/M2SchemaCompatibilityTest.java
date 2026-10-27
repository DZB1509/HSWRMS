package com.heavenstay.hswrms.m2booking;

import com.heavenstay.hswrms.m1identity.entity.CustomerProfile;
import com.heavenstay.hswrms.m1identity.entity.User;
import com.heavenstay.hswrms.m1identity.repository.CustomerProfileRepository;
import com.heavenstay.hswrms.m1identity.repository.UserRepository;
import com.heavenstay.hswrms.m2booking.entity.PhysicalVilla;
import com.heavenstay.hswrms.m2booking.entity.ResidenceRecord;
import com.heavenstay.hswrms.m2booking.entity.RetreatBooking;
import com.heavenstay.hswrms.m2booking.entity.RetreatPackage;
import com.heavenstay.hswrms.m2booking.entity.VillaCategory;
import com.heavenstay.hswrms.m2booking.repository.PhysicalVillaRepository;
import com.heavenstay.hswrms.m2booking.repository.ResidenceRecordRepository;
import com.heavenstay.hswrms.m2booking.repository.RetreatBookingRepository;
import com.heavenstay.hswrms.m2booking.repository.RetreatPackageRepository;
import com.heavenstay.hswrms.m2booking.repository.VillaCategoryRepository;
import com.heavenstay.hswrms.m3spa.port.DefaultCustomerStayAdapter;
import com.heavenstay.hswrms.m3spa.port.StayContextDto;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@Transactional
public class M2SchemaCompatibilityTest {

    @Autowired
    private RetreatPackageRepository retreatPackageRepository;

    @Autowired
    private VillaCategoryRepository villaCategoryRepository;

    @Autowired
    private PhysicalVillaRepository physicalVillaRepository;

    @Autowired
    private RetreatBookingRepository retreatBookingRepository;

    @Autowired
    private ResidenceRecordRepository residenceRecordRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CustomerProfileRepository customerProfileRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private DefaultCustomerStayAdapter customerStayAdapter;

    @Test
    @DisplayName("Verify RetreatPackage entity mappings with all 7 reconciled schema columns")
    void testRetreatPackageEntityCompatibility() {
        RetreatPackage pkg = new RetreatPackage();
        pkg.setPackageCode("PKG-TEST-001");
        pkg.setPackageName("Rejuvenation Wellness Retreat");
        pkg.setWellnessGoal("Holistic detox and mindfulness");
        pkg.setDurationNights(5);
        pkg.setDurationUnit("Đêm (Nights)");
        pkg.setBasePrice(new BigDecimal("15000000.00"));
        pkg.setBasePriceUnit("VND/khách/gói");
        pkg.setIncludedTreatments("Signature Massage, Herbal Steam");
        pkg.setDietaryPlan("Organic vegetarian full-board");
        pkg.setExtraChargePolicy("Airport transfer included, alcoholic beverages billed separately");
        pkg.setTargetGuest("Adults seeking intensive wellness restoration");
        pkg.setPackageStatus("ACTIVE");

        RetreatPackage saved = retreatPackageRepository.saveAndFlush(pkg);
        assertThat(saved.getRetreatPackageId()).isNotNull();

        RetreatPackage found = retreatPackageRepository.findById(saved.getRetreatPackageId()).orElseThrow();
        assertThat(found.getPackageCode()).isEqualTo("PKG-TEST-001");
        assertThat(found.getPackageName()).isEqualTo("Rejuvenation Wellness Retreat");
        assertThat(found.getWellnessGoal()).isEqualTo("Holistic detox and mindfulness");
        assertThat(found.getDurationNights()).isEqualTo(5);
        assertThat(found.getDurationUnit()).isEqualTo("Đêm (Nights)");
        assertThat(found.getBasePrice()).isEqualByComparingTo("15000000.00");
        assertThat(found.getBasePriceUnit()).isEqualTo("VND/khách/gói");
        assertThat(found.getIncludedTreatments()).isEqualTo("Signature Massage, Herbal Steam");
        assertThat(found.getDietaryPlan()).isEqualTo("Organic vegetarian full-board");
        assertThat(found.getExtraChargePolicy()).isEqualTo("Airport transfer included, alcoholic beverages billed separately");
        assertThat(found.getTargetGuest()).isEqualTo("Adults seeking intensive wellness restoration");
        assertThat(found.getPackageStatus()).isEqualTo("ACTIVE");
    }

    @Test
    @DisplayName("Verify VillaCategory entity mappings with all 8 reconciled schema columns")
    void testVillaCategoryEntityCompatibility() {
        VillaCategory cat = new VillaCategory();
        cat.setCategoryName("Oceanfront Sunset Villa");
        cat.setMaxOccupancy(4);
        cat.setPriceModifier(new BigDecimal("3500000.00"));
        cat.setCategoryStatus("ACTIVE");
        cat.setInventoryCount(8);
        cat.setBedroomCount(2);
        cat.setBedroomDescription("1 King Bed, 2 Single Beds");
        cat.setAreaDescription("180 sqm indoor/outdoor living");
        cat.setHasPrivatePool(true);
        cat.setPoolDescription("Private infinity plunge pool 30 sqm");
        cat.setFeaturesAndAmenities("High-speed WiFi, Espresso Machine, Outdoor Rain Shower");
        cat.setEligiblePackages("ALL");

        VillaCategory saved = villaCategoryRepository.saveAndFlush(cat);
        assertThat(saved.getVillaCategoryId()).isNotNull();

        VillaCategory found = villaCategoryRepository.findById(saved.getVillaCategoryId()).orElseThrow();
        assertThat(found.getCategoryName()).isEqualTo("Oceanfront Sunset Villa");
        assertThat(found.getMaxOccupancy()).isEqualTo(4);
        assertThat(found.getPriceModifier()).isEqualByComparingTo("3500000.00");
        assertThat(found.getCategoryStatus()).isEqualTo("ACTIVE");
        assertThat(found.getInventoryCount()).isEqualTo(8);
        assertThat(found.getBedroomCount()).isEqualTo(2);
        assertThat(found.getBedroomDescription()).isEqualTo("1 King Bed, 2 Single Beds");
        assertThat(found.getAreaDescription()).isEqualTo("180 sqm indoor/outdoor living");
        assertThat(found.getHasPrivatePool()).isTrue();
        assertThat(found.getPoolDescription()).isEqualTo("Private infinity plunge pool 30 sqm");
        assertThat(found.getFeaturesAndAmenities()).isEqualTo("High-speed WiFi, Espresso Machine, Outdoor Rain Shower");
        assertThat(found.getEligiblePackages()).isEqualTo("ALL");
    }

    @Test
    @DisplayName("Verify PhysicalVilla entity mappings with all 7 reconciled schema columns and category relation")
    void testPhysicalVillaEntityCompatibility() {
        VillaCategory cat = new VillaCategory();
        cat.setCategoryName("Garden Sanctuary Villa");
        cat.setMaxOccupancy(2);
        cat.setPriceModifier(BigDecimal.ZERO);
        cat.setCategoryStatus("ACTIVE");
        cat.setInventoryCount(5);
        cat.setBedroomCount(1);
        VillaCategory savedCat = villaCategoryRepository.saveAndFlush(cat);

        PhysicalVilla villa = new PhysicalVilla();
        villa.setVillaCategory(savedCat);
        villa.setVillaNumber("GSV-201");
        villa.setFloor("Ground");
        villa.setVillaStatus("AVAILABLE");
        villa.setZoneName("Sanctuary Zone B");
        villa.setBedroomInfo("Master Bedroom with Garden View");
        villa.setMaxOccupancy(2);
        villa.setAreaSqm(new BigDecimal("95.50"));
        villa.setHasPrivatePool(false);
        villa.setPoolInfo("No private pool - shared resort lagoon access");
        villa.setViewAndOperationalNotes("Quiet zone, near herbal gardens; housekeeping schedule: 10:00");

        PhysicalVilla savedVilla = physicalVillaRepository.saveAndFlush(villa);
        assertThat(savedVilla.getVillaId()).isNotNull();

        PhysicalVilla found = physicalVillaRepository.findById(savedVilla.getVillaId()).orElseThrow();
        assertThat(found.getVillaCategory().getVillaCategoryId()).isEqualTo(savedCat.getVillaCategoryId());
        assertThat(found.getVillaNumber()).isEqualTo("GSV-201");
        assertThat(found.getFloor()).isEqualTo("Ground");
        assertThat(found.getVillaStatus()).isEqualTo("AVAILABLE");
        assertThat(found.getZoneName()).isEqualTo("Sanctuary Zone B");
        assertThat(found.getBedroomInfo()).isEqualTo("Master Bedroom with Garden View");
        assertThat(found.getMaxOccupancy()).isEqualTo(2);
        assertThat(found.getAreaSqm()).isEqualByComparingTo("95.50");
        assertThat(found.getHasPrivatePool()).isFalse();
        assertThat(found.getPoolInfo()).isEqualTo("No private pool - shared resort lagoon access");
        assertThat(found.getViewAndOperationalNotes()).isEqualTo("Quiet zone, near herbal gardens; housekeeping schedule: 10:00");
    }

    @Test
    @DisplayName("Verify ResidenceRecord persistence and one-to-one relationship with RetreatBooking")
    void testResidenceRecordEntityCompatibility() {
        User user = new User("Jane Guest", "jane.guest.schema.test@heavenstay.com", "hash");
        User savedUser = userRepository.saveAndFlush(user);

        CustomerProfile profile = new CustomerProfile(savedUser);
        profile.setResidentialAddress("456 Beach Road, Da Nang");
        CustomerProfile savedProfile = customerProfileRepository.saveAndFlush(profile);

        RetreatPackage pkg = new RetreatPackage();
        pkg.setPackageName("Quick Detox 2D1N");
        pkg.setDurationNights(1);
        pkg.setBasePrice(new BigDecimal("5000000.00"));
        RetreatPackage savedPkg = retreatPackageRepository.saveAndFlush(pkg);

        VillaCategory cat = new VillaCategory();
        cat.setCategoryName("Standard Retreat Villa");
        cat.setMaxOccupancy(2);
        VillaCategory savedCat = villaCategoryRepository.saveAndFlush(cat);

        RetreatBooking booking = new RetreatBooking();
        booking.setCustomerProfileId(savedProfile.getCustomerProfileId());
        booking.setRetreatPackage(savedPkg);
        booking.setRequestedVillaCategory(savedCat);
        booking.setCheckInDate(LocalDate.now());
        booking.setCheckOutDate(LocalDate.now().plusDays(1));
        booking.setBookingStatus("CHECKED_IN");
        RetreatBooking savedBooking = retreatBookingRepository.saveAndFlush(booking);

        ResidenceRecord record = new ResidenceRecord();
        record.setRetreatBooking(savedBooking);
        record.setIdentificationNumber("048195000123");
        record.setIdentificationType("CCCD");
        record.setNationality("Vietnamese");
        record.setPermanentAddress("456 Beach Road, Da Nang");
        record.setCollectedAt(LocalDateTime.now());
        ResidenceRecord savedRecord = residenceRecordRepository.saveAndFlush(record);

        assertThat(savedRecord.getResidenceRecordId()).isNotNull();
        ResidenceRecord foundRecord = residenceRecordRepository.findById(savedRecord.getResidenceRecordId()).orElseThrow();
        assertThat(foundRecord.getRetreatBooking().getRetreatBookingId()).isEqualTo(savedBooking.getRetreatBookingId());
        assertThat(foundRecord.getIdentificationNumber()).isEqualTo("048195000123");
        assertThat(foundRecord.getIdentificationType()).isEqualTo("CCCD");
        assertThat(foundRecord.getNationality()).isEqualTo("Vietnamese");
    }

    @Test
    @DisplayName("Verify RetreatPackageSpaTreatment bridge table integration with DefaultCustomerStayAdapter")
    void testSpaTreatmentPackageBridgeRelation() {
        // Setup package
        RetreatPackage pkg = new RetreatPackage();
        pkg.setPackageName("Spa Intensive Retreat");
        pkg.setDurationNights(3);
        pkg.setBasePrice(new BigDecimal("12000000.00"));
        RetreatPackage savedPkg = retreatPackageRepository.saveAndFlush(pkg);
        int packageId = savedPkg.getRetreatPackageId();
        int includedTreatmentId = 101;
        int nonIncludedTreatmentId = 999;

        // Insert into bridge table with reconciled schema columns
        jdbcTemplate.update(
                "INSERT INTO dbo.RetreatPackageSpaTreatment (retreat_package_id, treatment_id, included_sessions, entitlement_status, notes) " +
                "VALUES (?, ?, ?, ?, ?)",
                packageId, includedTreatmentId, 2, "INCLUDED", "Daily morning treatment"
        );

        // Verify adapter finds included treatment
        boolean isIncluded = customerStayAdapter.isTreatmentIncludedInPackage(packageId, includedTreatmentId);
        assertThat(isIncluded).isTrue();

        // Verify non-included treatment returns false
        boolean notIncluded = customerStayAdapter.isTreatmentIncludedInPackage(packageId, nonIncludedTreatmentId);
        assertThat(notIncluded).isFalse();

        // Verify null arguments fail-closed safely
        assertThat(customerStayAdapter.isTreatmentIncludedInPackage(null, includedTreatmentId)).isFalse();
        assertThat(customerStayAdapter.isTreatmentIncludedInPackage(packageId, null)).isFalse();
    }

    @Test
    @DisplayName("Verify DefaultCustomerStayAdapter stay queries against live relational schema")
    void testDefaultCustomerStayAdapterActiveStayIntegration() {
        User user = new User("John Traveler", "john.traveler.stay.test@heavenstay.com", "hash");
        User savedUser = userRepository.saveAndFlush(user);

        CustomerProfile profile = new CustomerProfile(savedUser);
        CustomerProfile savedProfile = customerProfileRepository.saveAndFlush(profile);

        RetreatPackage pkg = new RetreatPackage();
        pkg.setPackageName("Ultimate Ayurvedic Renewal");
        pkg.setDurationNights(7);
        pkg.setBasePrice(new BigDecimal("28000000.00"));
        RetreatPackage savedPkg = retreatPackageRepository.saveAndFlush(pkg);

        VillaCategory cat = new VillaCategory();
        cat.setCategoryName("Ayurvedic Sanctuary Villa");
        cat.setMaxOccupancy(2);
        VillaCategory savedCat = villaCategoryRepository.saveAndFlush(cat);

        // 1. PENDING booking - adapter should NOT treat as active stay
        RetreatBooking pendingBooking = new RetreatBooking();
        pendingBooking.setCustomerProfileId(savedProfile.getCustomerProfileId());
        pendingBooking.setRetreatPackage(savedPkg);
        pendingBooking.setRequestedVillaCategory(savedCat);
        pendingBooking.setCheckInDate(LocalDate.now());
        pendingBooking.setCheckOutDate(LocalDate.now().plusDays(7));
        pendingBooking.setBookingStatus("PENDING");
        retreatBookingRepository.saveAndFlush(pendingBooking);

        Optional<StayContextDto> pendingStay = customerStayAdapter.getActiveStayForUser(savedUser.getUserId());
        assertThat(pendingStay).isEmpty();

        // 2. CONFIRMED booking - adapter should resolve active stay context
        pendingBooking.setBookingStatus("CONFIRMED");
        RetreatBooking confirmedBooking = retreatBookingRepository.saveAndFlush(pendingBooking);


        Optional<StayContextDto> activeStay = customerStayAdapter.getActiveStayForUser(savedUser.getUserId());
        assertThat(activeStay).isPresent();
        StayContextDto stayDto = activeStay.get();
        assertThat(stayDto.getBookingId()).isEqualTo(confirmedBooking.getRetreatBookingId());
        assertThat(stayDto.getBookingReference()).isEqualTo("HSW-" + confirmedBooking.getRetreatBookingId());
        assertThat(stayDto.getCustomerProfileId()).isEqualTo(savedProfile.getCustomerProfileId());
        assertThat(stayDto.getUserId()).isEqualTo(savedUser.getUserId());
        assertThat(stayDto.getCustomerName()).isEqualTo("John Traveler");
        assertThat(stayDto.getPackageId()).isEqualTo(savedPkg.getRetreatPackageId());
        assertThat(stayDto.getPackageName()).isEqualTo("Ultimate Ayurvedic Renewal");
        assertThat(stayDto.getCheckInDate()).isEqualTo(LocalDate.now());
        assertThat(stayDto.getCheckOutDate()).isEqualTo(LocalDate.now().plusDays(7));
        assertThat(stayDto.isActive()).isTrue();

        // 3. Query stay by booking ID
        Optional<StayContextDto> stayById = customerStayAdapter.getStayById(confirmedBooking.getRetreatBookingId());
        assertThat(stayById).isPresent();
        assertThat(stayById.get().getBookingId()).isEqualTo(confirmedBooking.getRetreatBookingId());
        assertThat(stayById.get().getUserId()).isEqualTo(savedUser.getUserId());

        // 4. Non-existent booking ID
        Optional<StayContextDto> nonExistentStay = customerStayAdapter.getStayById(99999);
        assertThat(nonExistentStay).isEmpty();
        assertThat(customerStayAdapter.getStayById(null)).isEmpty();
    }
}
