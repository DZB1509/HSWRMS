package com.heavenstay.hswrms.m3spa;

import com.heavenstay.hswrms.m3spa.port.CustomerStayPort;
import com.heavenstay.hswrms.m3spa.port.StayContextDto;
import com.heavenstay.hswrms.m3spa.repository.SpaTreatmentRepository;
import org.springframework.beans.factory.annotation.Autowired;
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
    public CustomerStayPort testCustomerStayPort(@Autowired(required = false) SpaTreatmentRepository treatmentRepository) {
        return new CustomerStayPort() {
            @Override
            public Optional<StayContextDto> getActiveStayForUser(Integer userId) {
                if (userId != null && userId.equals(999)) {
                    return Optional.empty();
                }
                if (userId != null && userId.equals(2)) {
                    StayContextDto dto2 = new StayContextDto(
                            102, "HSW-102", 2, 2, "Second Customer", 1,
                            "Ultimate Rejuvenation", LocalDate.of(2026, 9, 1), LocalDate.of(2027, 1, 1), true
                    );
                    dto2.setCustomerEmail("customer2@heavenstay.com");
                    return Optional.of(dto2);
                }
                StayContextDto dto1 = new StayContextDto(
                        101, "HSW-101", 1, userId != null ? userId : 1, "First Customer", 1,
                        "Ultimate Rejuvenation", LocalDate.of(2026, 9, 1), LocalDate.of(2027, 1, 1), true
                );
                dto1.setCustomerEmail("customer1@heavenstay.com");
                return Optional.of(dto1);
            }

            @Override
            public Optional<StayContextDto> getStayById(Integer bookingId) {
                if (bookingId == null) {
                    return Optional.empty();
                }
                StayContextDto dto = new StayContextDto(
                        bookingId, "HSW-" + bookingId, 1, 1, "Test Customer", 1,
                        "Ultimate Rejuvenation", LocalDate.of(2026, 9, 1), LocalDate.of(2027, 1, 1), true
                );
                dto.setCustomerEmail("guest" + bookingId + "@heavenstay.com");
                return Optional.of(dto);
            }

            @Override
            public boolean isTreatmentIncludedInPackage(Integer packageId, Integer treatmentId) {
                if (packageId == null || treatmentId == null || !packageId.equals(1)) {
                    return false;
                }
                if (treatmentId.equals(1)) {
                    return true;
                }
                if (treatmentRepository != null) {
                    return treatmentRepository.findById(treatmentId)
                            .map(t -> "Massage".equalsIgnoreCase(t.getCategory()) || (t.getTreatmentName() != null && t.getTreatmentName().contains("Signature")))
                            .orElse(false);
                }
                return false;
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
