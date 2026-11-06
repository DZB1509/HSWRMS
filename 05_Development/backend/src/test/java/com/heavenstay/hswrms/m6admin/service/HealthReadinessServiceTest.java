package com.heavenstay.hswrms.m6admin.service;

import com.heavenstay.hswrms.m1identity.entity.ConsentRecord;
import com.heavenstay.hswrms.m1identity.entity.CustomerProfile;
import com.heavenstay.hswrms.m1identity.entity.HealthDeclarationState;
import com.heavenstay.hswrms.m1identity.entity.HealthProfile;
import com.heavenstay.hswrms.m1identity.entity.User;
import com.heavenstay.hswrms.m1identity.repository.ConsentRecordRepository;
import com.heavenstay.hswrms.m1identity.repository.CustomerProfileRepository;
import com.heavenstay.hswrms.m1identity.repository.HealthProfileRepository;
import com.heavenstay.hswrms.m1identity.repository.UserRepository;
import com.heavenstay.hswrms.m1identity.repository.UserRoleRepository;
import com.heavenstay.hswrms.m6admin.dto.HealthReadinessDto;
import com.heavenstay.hswrms.m6admin.security.CurrentActor;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(properties = {
        "app.seed.demo-data=false",
        "spring.datasource.url=jdbc:h2:mem:health_readiness_service_it;MODE=MSSQLServer;CASE_INSENSITIVE_IDENTIFIERS=TRUE;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE;INIT=CREATE SCHEMA IF NOT EXISTS DBO",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=123",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.H2Dialect"
})
@Transactional
class HealthReadinessServiceTest {

    @Autowired
    private HealthReadinessService healthReadinessService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserRoleRepository userRoleRepository;

    @Autowired
    private CustomerProfileRepository customerProfileRepository;

    @Autowired
    private HealthProfileRepository healthProfileRepository;

    @Autowired
    private ConsentRecordRepository consentRecordRepository;

    private CurrentActor managerActor;

    @BeforeEach
    void setUp() {
        managerActor = new CurrentActor(1, "manager@heavenstay.com", "MANAGER", true);
        consentRecordRepository.deleteAll();
        healthProfileRepository.deleteAll();
        customerProfileRepository.deleteAll();
        userRoleRepository.deleteAll();
        userRepository.deleteAll();
    }

    private User createUser(String email, String fullName) {
        User user = new User();
        user.setFullName(fullName);
        user.setEmail(email);
        user.setAccountStatus("ACTIVE");
        user.setEmailVerified(true);
        return userRepository.save(user);
    }

    private CustomerProfile createCustomerProfile(User user) {
        CustomerProfile cp = new CustomerProfile();
        cp.setUser(user);
        return customerProfileRepository.save(cp);
    }

    private HealthProfile createHealthProfile(CustomerProfile cp, boolean isComplete) {
        HealthProfile hp = new HealthProfile();
        hp.setCustomerProfile(cp);
        hp.setComplete(isComplete);
        hp.setAllergiesDeclarationState(HealthDeclarationState.DECLARED);
        hp.setDietaryRequirementsDeclarationState(HealthDeclarationState.DECLARED);
        return healthProfileRepository.save(hp);
    }

    private ConsentRecord createConsent(User user, String consentType, String consentStatus, Instant revokedAt) {
        ConsentRecord c = new ConsentRecord();
        c.setUser(user);
        c.setConsentType(consentType);
        c.setConsentStatus(consentStatus);
        c.setPolicyVersion("v1.0");
        c.setGrantedAt(Instant.now());
        c.setRevokedAt(revokedAt);
        return consentRecordRepository.save(c);
    }

    @Test
    @DisplayName("Empty database: all counts are zero")
    void emptyDatabaseAllCountsZero() {
        HealthReadinessDto dto = healthReadinessService.getHealthReadiness(managerActor);
        assertEquals(0, dto.totalProfiles());
        assertEquals(0, dto.completedProfiles());
        assertEquals(0, dto.incompleteProfiles());
        assertEquals(0, dto.activeConsents());
        assertEquals(0, dto.pendingConsents());
        assertEquals(0.0, dto.completionRate());
    }

    @Test
    @DisplayName("All profiles complete")
    void allProfilesComplete() {
        User u1 = createUser("u1@h.com", "U1");
        User u2 = createUser("u2@h.com", "U2");
        createHealthProfile(createCustomerProfile(u1), true);
        createHealthProfile(createCustomerProfile(u2), true);
        HealthReadinessDto dto = healthReadinessService.getHealthReadiness(managerActor);
        assertEquals(2, dto.totalProfiles());
        assertEquals(2, dto.completedProfiles());
        assertEquals(0, dto.incompleteProfiles());
        assertEquals(100.0, dto.completionRate());
    }

    @Test
    @DisplayName("Active consent: GRANTED and revokedAt IS NULL")
    void activeConsentCounted() {
        User u1 = createUser("u1@h.com", "U1");
        CustomerProfile cp1 = createCustomerProfile(u1);
        createHealthProfile(cp1, true);
        createConsent(u1, "HEALTH_DATA_PROCESSING", "GRANTED", null);
        HealthReadinessDto dto = healthReadinessService.getHealthReadiness(managerActor);
        assertEquals(1, dto.activeConsents());
        assertEquals(0, dto.pendingConsents());
    }

    @Test
    @DisplayName("Revoked consent: not counted as active")
    void revokedConsentNotActive() {
        User u1 = createUser("u1@h.com", "U1");
        CustomerProfile cp1 = createCustomerProfile(u1);
        createHealthProfile(cp1, true);
        createConsent(u1, "HEALTH_DATA_PROCESSING", "GRANTED", Instant.now());
        HealthReadinessDto dto = healthReadinessService.getHealthReadiness(managerActor);
        assertEquals(0, dto.activeConsents());
        assertEquals(1, dto.pendingConsents());
    }

    @Test
    @DisplayName("Declined consent: not counted as active")
    void declinedConsentNotActive() {
        User u1 = createUser("u1@h.com", "U1");
        CustomerProfile cp1 = createCustomerProfile(u1);
        createHealthProfile(cp1, true);
        createConsent(u1, "HEALTH_DATA_PROCESSING", "DECLINED", null);
        HealthReadinessDto dto = healthReadinessService.getHealthReadiness(managerActor);
        assertEquals(0, dto.activeConsents());
        assertEquals(1, dto.pendingConsents());
    }

    @Test
    @DisplayName("No consent record: counted as pending")
    void noConsentRecordIsPending() {
        User u1 = createUser("u1@h.com", "U1");
        CustomerProfile cp1 = createCustomerProfile(u1);
        createHealthProfile(cp1, true);
        HealthReadinessDto dto = healthReadinessService.getHealthReadiness(managerActor);
        assertEquals(0, dto.activeConsents());
        assertEquals(1, dto.pendingConsents());
    }

    @Test
    @DisplayName("Multiple consent records: no double counting")
    void multipleConsentRecordsNoDoubleCounting() {
        User u1 = createUser("u1@h.com", "U1");
        CustomerProfile cp1 = createCustomerProfile(u1);
        createHealthProfile(cp1, true);
        createConsent(u1, "HEALTH_DATA_PROCESSING", "GRANTED", null);
        createConsent(u1, "HEALTH_DATA_PROCESSING", "REVOKED", Instant.now());
        createConsent(u1, "DIETARY_SHARING", "GRANTED", null);
        HealthReadinessDto dto = healthReadinessService.getHealthReadiness(managerActor);
        assertEquals(1, dto.activeConsents());
        assertEquals(0, dto.pendingConsents());
    }

    @Test
    @DisplayName("Wrong consent type: not counted as active")
    void wrongConsentTypeNotActive() {
        User u1 = createUser("u1@h.com", "U1");
        CustomerProfile cp1 = createCustomerProfile(u1);
        createHealthProfile(cp1, true);
        createConsent(u1, "DIETARY_SHARING", "GRANTED", null);
        HealthReadinessDto dto = healthReadinessService.getHealthReadiness(managerActor);
        assertEquals(0, dto.activeConsents());
        assertEquals(1, dto.pendingConsents());
    }

    @Test
    @DisplayName("Pending consent status: not counted as active")
    void pendingConsentStatusNotActive() {
        User u1 = createUser("u1@h.com", "U1");
        CustomerProfile cp1 = createCustomerProfile(u1);
        createHealthProfile(cp1, true);
        createConsent(u1, "HEALTH_DATA_PROCESSING", "PENDING", null);
        HealthReadinessDto dto = healthReadinessService.getHealthReadiness(managerActor);
        assertEquals(0, dto.activeConsents());
        assertEquals(1, dto.pendingConsents());
    }

    @Test
    @DisplayName("Pending = total - active")
    void pendingEqualsTotalMinusActive() {
        User u1 = createUser("u1@h.com", "U1");
        User u2 = createUser("u2@h.com", "U2");
        User u3 = createUser("u3@h.com", "U3");
        createHealthProfile(createCustomerProfile(u1), true);
        createHealthProfile(createCustomerProfile(u2), true);
        createHealthProfile(createCustomerProfile(u3), true);
        createConsent(u1, "HEALTH_DATA_PROCESSING", "GRANTED", null);
        createConsent(u2, "HEALTH_DATA_PROCESSING", "GRANTED", Instant.now());
        HealthReadinessDto dto = healthReadinessService.getHealthReadiness(managerActor);
        assertEquals(3, dto.totalProfiles());
        assertEquals(1, dto.activeConsents());
        assertEquals(2, dto.pendingConsents());
        assertEquals(dto.totalProfiles() - dto.activeConsents(), dto.pendingConsents());
    }

    @Test
    @DisplayName("Completion rate zero when no profiles")
    void completionRateZeroWhenNoProfiles() {
        HealthReadinessDto dto = healthReadinessService.getHealthReadiness(managerActor);
        assertEquals(0.0, dto.completionRate());
    }

    @Test
    @DisplayName("All profiles incomplete")
    void allProfilesIncomplete() {
        User u1 = createUser("u1@h.com", "U1");
        User u2 = createUser("u2@h.com", "U2");
        createHealthProfile(createCustomerProfile(u1), false);
        createHealthProfile(createCustomerProfile(u2), false);
        HealthReadinessDto dto = healthReadinessService.getHealthReadiness(managerActor);
        assertEquals(2, dto.totalProfiles());
        assertEquals(0, dto.completedProfiles());
        assertEquals(2, dto.incompleteProfiles());
        assertEquals(0.0, dto.completionRate());
    }

    @Test
    @DisplayName("Mixed profiles")
    void mixedProfiles() {
        User u1 = createUser("u1@h.com", "U1");
        User u2 = createUser("u2@h.com", "U2");
        User u3 = createUser("u3@h.com", "U3");
        createHealthProfile(createCustomerProfile(u1), true);
        createHealthProfile(createCustomerProfile(u2), false);
        createHealthProfile(createCustomerProfile(u3), false);
        HealthReadinessDto dto = healthReadinessService.getHealthReadiness(managerActor);
        assertEquals(3, dto.totalProfiles());
        assertEquals(1, dto.completedProfiles());
        assertEquals(2, dto.incompleteProfiles());
        assertEquals(33.33333333333333, dto.completionRate(), 0.001);
    }
}