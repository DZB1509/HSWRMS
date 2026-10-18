package com.heavenstay.hswrms.m3spa;

import com.heavenstay.hswrms.m3spa.port.CustomerStayPort;
import com.heavenstay.hswrms.m3spa.port.StayContextDto;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;

import java.time.LocalDate;
import java.util.Optional;

/**
 * Isolated test configuration for M3 test scope.
 * Provides test stay context without hardcoding mock data into production runtime adapters.
 */
@TestConfiguration
public class SpaTestConfig {

    @Bean
    @Primary
    public CustomerStayPort testCustomerStayPort() {
        return new CustomerStayPort() {
            @Override
            public Optional<StayContextDto> getActiveStayForUser(Integer userId) {
                if (userId != null && userId.equals(2)) {
                    return Optional.of(new StayContextDto(
                            102, "HSW-102", 2, 2, "Second Customer", 1,
                            "Ultimate Rejuvenation", LocalDate.now().minusDays(1), LocalDate.now().plusDays(6), true
                    ));
                }
                return Optional.of(new StayContextDto(
                        101, "HSW-101", 1, userId != null ? userId : 1, "First Customer", 1,
                        "Ultimate Rejuvenation", LocalDate.now().minusDays(1), LocalDate.now().plusDays(6), true
                ));
            }

            @Override
            public Optional<StayContextDto> getStayById(Integer bookingId) {
                if (bookingId == null) {
                    return Optional.empty();
                }
                return Optional.of(new StayContextDto(
                        bookingId, "HSW-" + bookingId, 1, 1, "Test Customer", 1,
                        "Ultimate Rejuvenation", LocalDate.now().minusDays(1), LocalDate.now().plusDays(6), true
                ));
            }

            @Override
            public boolean isTreatmentIncludedInPackage(Integer packageId, Integer treatmentId) {
                // For test fixtures: package 1 includes treatment 1
                return packageId != null && packageId.equals(1) && treatmentId != null && treatmentId.equals(1);
            }
        };
    }

    @Bean
    @Primary
    public com.heavenstay.hswrms.m3spa.port.TherapistHealthProjectionPort testTherapistHealthProjectionPort() {
        return new com.heavenstay.hswrms.m3spa.port.TherapistHealthProjectionPort() {
            @Override
            public com.heavenstay.hswrms.m3spa.port.TreatmentSafetyNotesDto getTreatmentSafetyNotes(Integer retreatBookingId) {
                return new com.heavenstay.hswrms.m3spa.port.TreatmentSafetyNotesDto(
                        "TestCustomer",
                        "Gentle shoulder pressure requested.",
                        "Avoid deep tissue on neck area."
                );
            }
        };
    }
}
