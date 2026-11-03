package com.heavenstay.hswrms.m5billing.config;

import com.heavenstay.hswrms.m1identity.entity.CustomerProfile;
import com.heavenstay.hswrms.m1identity.entity.User;
import com.heavenstay.hswrms.m1identity.repository.CustomerProfileRepository;
import com.heavenstay.hswrms.m1identity.repository.UserRepository;
import com.heavenstay.hswrms.m2booking.entity.RetreatBooking;
import com.heavenstay.hswrms.m2booking.entity.RetreatPackage;
import com.heavenstay.hswrms.m2booking.entity.VillaCategory;
import com.heavenstay.hswrms.m2booking.repository.PhysicalVillaRepository;
import com.heavenstay.hswrms.m2booking.repository.RetreatBookingRepository;
import com.heavenstay.hswrms.m2booking.repository.RetreatPackageRepository;
import com.heavenstay.hswrms.m2booking.repository.VillaCategoryRepository;
import com.heavenstay.hswrms.m3spa.repository.SpaSessionRepository;
import com.heavenstay.hswrms.m3spa.repository.SpaTreatmentRepository;
import com.heavenstay.hswrms.m3spa.repository.TherapistRepository;
import com.heavenstay.hswrms.m3spa.repository.TreatmentRoomRepository;
import com.heavenstay.hswrms.m4fnb.repository.MealOrderRepository;
import com.heavenstay.hswrms.m5billing.entity.FolioEntity;
import com.heavenstay.hswrms.m5billing.entity.InvoiceEntity;
import com.heavenstay.hswrms.m5billing.repository.FolioItemRepository;
import com.heavenstay.hswrms.m5billing.repository.FolioRepository;
import com.heavenstay.hswrms.m5billing.repository.InvoiceRepository;
import com.heavenstay.hswrms.m5billing.repository.PaymentTransactionRepository;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class M5DataInitializerCustomerBFixtureTest {
    @Mock EntityManager entityManager;
    @Mock UserRepository userRepository;
    @Mock CustomerProfileRepository customerProfileRepository;
    @Mock RetreatBookingRepository bookingRepository;
    @Mock PhysicalVillaRepository villaRepository;
    @Mock VillaCategoryRepository villaCategoryRepository;
    @Mock RetreatPackageRepository retreatPackageRepository;
    @Mock SpaSessionRepository spaSessionRepository;
    @Mock SpaTreatmentRepository spaTreatmentRepository;
    @Mock TreatmentRoomRepository treatmentRoomRepository;
    @Mock TherapistRepository therapistRepository;
    @Mock MealOrderRepository mealOrderRepository;
    @Mock FolioRepository folioRepository;
    @Mock FolioItemRepository folioItemRepository;
    @Mock InvoiceRepository invoiceRepository;
    @Mock PaymentTransactionRepository paymentTransactionRepository;
    @Mock Environment environment;

    private M5DataInitializer initializer;

    @BeforeEach
    void setUp() {
        initializer = new M5DataInitializer(entityManager, userRepository, customerProfileRepository,
                bookingRepository, villaRepository, villaCategoryRepository, retreatPackageRepository,
                spaSessionRepository, spaTreatmentRepository, treatmentRoomRepository, therapistRepository,
                mealOrderRepository, folioRepository, folioItemRepository, invoiceRepository,
                paymentTransactionRepository, environment);
    }

    @Test
    void doesNotCreateFixtureOutsideLocalOrDemoProfile() {
        when(environment.acceptsProfiles(any(Profiles.class))).thenReturn(false);

        initializer.seedCustomerBAcceptanceFixture();

        verifyNoInteractions(userRepository, customerProfileRepository, bookingRepository, folioRepository, invoiceRepository);
    }

    @Test
    void doesNotCreateFixtureWithoutExplicitBootstrapOptIn() {
        when(environment.acceptsProfiles(any(Profiles.class))).thenReturn(true);
        when(environment.getProperty("app.demo.bootstrap-enabled", "false")).thenReturn("false");

        initializer.seedCustomerBAcceptanceFixture();

        verifyNoInteractions(userRepository, customerProfileRepository, bookingRepository, folioRepository, invoiceRepository);
    }

    @Test
    void createsOnlyOneOwnedBookingFolioAndDraftInvoiceAcrossRepeatedRuns() {
        when(environment.acceptsProfiles(any(Profiles.class))).thenReturn(true);
        when(environment.getProperty("app.demo.bootstrap-enabled", "false")).thenReturn("true");
        User customer = new User("Synthetic Customer B", "customer-b@heavenstay.dev", "encoded-local-demo-secret");
        customer.setUserId(20);
        CustomerProfile profile = new CustomerProfile(customer);
        profile.setCustomerProfileId(200);
        when(userRepository.findByEmail("customer-b@heavenstay.dev")).thenReturn(Optional.of(customer));
        when(customerProfileRepository.findByUserId(20)).thenReturn(Optional.of(profile));

        RetreatPackage retreatPackage = new RetreatPackage();
        retreatPackage.setRetreatPackageId(1);
        retreatPackage.setPackageName("Synthetic Demo Package");
        VillaCategory category = new VillaCategory();
        category.setVillaCategoryId(1);
        category.setCategoryName("Synthetic Demo Category");
        RetreatBooking customerABooking = new RetreatBooking();
        customerABooking.setRetreatBookingId(1);
        customerABooking.setRetreatPackage(retreatPackage);
        customerABooking.setRequestedVillaCategory(category);
        customerABooking.setTotalEstimatedAmount(new BigDecimal("1000.00"));
        when(bookingRepository.findAll()).thenReturn(List.of(customerABooking));

        AtomicReference<RetreatBooking> createdBooking = new AtomicReference<>();
        AtomicReference<FolioEntity> createdFolio = new AtomicReference<>();
        AtomicReference<InvoiceEntity> createdInvoice = new AtomicReference<>();
        when(bookingRepository.findByCustomerProfileIdOrderByCreatedAtDesc(200)).thenAnswer(invocation ->
                createdBooking.get() == null ? List.of() : List.of(createdBooking.get()));
        when(bookingRepository.save(any(RetreatBooking.class))).thenAnswer(invocation -> {
            RetreatBooking booking = invocation.getArgument(0);
            booking.setRetreatBookingId(2);
            createdBooking.set(booking);
            return booking;
        });
        when(folioRepository.findByRetreatBookingId(2)).thenAnswer(invocation -> Optional.ofNullable(createdFolio.get()));
        when(folioRepository.save(any(FolioEntity.class))).thenAnswer(invocation -> {
            FolioEntity folio = invocation.getArgument(0);
            folio.setFolioId(20L);
            createdFolio.set(folio);
            return folio;
        });
        when(invoiceRepository.findByFolioId(20L)).thenAnswer(invocation -> Optional.ofNullable(createdInvoice.get()));
        when(invoiceRepository.save(any(InvoiceEntity.class))).thenAnswer(invocation -> {
            InvoiceEntity invoice = invocation.getArgument(0);
            invoice.setInvoiceId(30L);
            createdInvoice.set(invoice);
            return invoice;
        });

        initializer.seedCustomerBAcceptanceFixture();
        initializer.seedCustomerBAcceptanceFixture();

        assertNotNull(createdBooking.get());
        assertEquals(200, createdBooking.get().getCustomerProfileId());
        assertEquals("PENDING", createdBooking.get().getBookingStatus());
        assertTrue(createdBooking.get().getSpecialRequest().contains("Synthetic Batch 4.3"));
        assertNull(createdBooking.get().getAssignedVilla());
        assertSame(createdBooking.get(), createdFolio.get().getRetreatBooking());
        assertEquals(BigDecimal.ZERO, createdFolio.get().getTotalCharges());
        assertSame(createdFolio.get(), createdInvoice.get().getFolio());
        assertEquals("DRAFT", createdInvoice.get().getInvoiceStatus());
        assertEquals(BigDecimal.ZERO, createdInvoice.get().getFinalAmount());
        verify(bookingRepository, times(1)).save(any(RetreatBooking.class));
        verify(folioRepository, times(1)).save(any(FolioEntity.class));
        verify(invoiceRepository, times(1)).save(any(InvoiceEntity.class));
        verifyNoInteractions(paymentTransactionRepository);
    }
}
