package com.heavenstay.hswrms.m6admin.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.heavenstay.hswrms.m1identity.entity.ConsentRecord;
import com.heavenstay.hswrms.m1identity.entity.CustomerProfile;
import com.heavenstay.hswrms.m1identity.entity.HealthDeclarationState;
import com.heavenstay.hswrms.m1identity.entity.HealthProfile;
import com.heavenstay.hswrms.m1identity.entity.Role;
import com.heavenstay.hswrms.m1identity.entity.User;
import com.heavenstay.hswrms.m1identity.entity.UserRole;
import com.heavenstay.hswrms.m1identity.repository.ConsentRecordRepository;
import com.heavenstay.hswrms.m1identity.repository.CustomerProfileRepository;
import com.heavenstay.hswrms.m1identity.repository.HealthProfileRepository;
import com.heavenstay.hswrms.m1identity.repository.RoleRepository;
import com.heavenstay.hswrms.m1identity.repository.UserRepository;
import com.heavenstay.hswrms.m1identity.repository.UserRoleRepository;
import com.heavenstay.hswrms.security.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

import static org.hamcrest.Matchers.is;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * HTTP-level (MockMvc) coverage for GET /api/v1/manager/health-readiness.
 *
 * <p>Guards the regression where {@code CurrentActor} was declared as a handler method
 * parameter: Spring MVC then treats it as a model attribute and answers HTTP 400 for every
 * caller (including an authorised Manager), which service-level tests cannot detect.</p>
 *
 * <p>Uses a dedicated in-memory H2 database (same convention as {@code FnbRoleAccessTest})
 * so the aggregate counts asserted here are deterministic.</p>
 */
@SpringBootTest(properties = {
        "app.seed.demo-data=false",
        "app.initializer.m6.enabled=true",
        "spring.datasource.url=jdbc:h2:mem:health_readiness_it;MODE=MSSQLServer;CASE_INSENSITIVE_IDENTIFIERS=TRUE;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE;INIT=CREATE SCHEMA IF NOT EXISTS DBO",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=123",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.H2Dialect"
})
@AutoConfigureMockMvc
@Transactional
class HealthReadinessControllerSecurityTest {

    private static final String ENDPOINT = "/api/v1/manager/health-readiness";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private UserRoleRepository userRoleRepository;

    @Autowired
    private CustomerProfileRepository customerProfileRepository;

    @Autowired
    private HealthProfileRepository healthProfileRepository;

    @Autowired
    private ConsentRecordRepository consentRecordRepository;

    @Autowired
    private ObjectMapper objectMapper;

    private String managerToken;
    private String therapistToken;

    @BeforeEach
    void setUp() {
        consentRecordRepository.deleteAll();
        healthProfileRepository.deleteAll();
        customerProfileRepository.deleteAll();
        userRoleRepository.deleteAll();
        userRepository.deleteAll();

        Role managerRole = roleRepository.findByRoleNameIgnoreCase("Manager")
                .orElseGet(() -> roleRepository.saveAndFlush(new Role("Manager", "Manager role")));
        Role therapistRole = roleRepository.findByRoleNameIgnoreCase("Therapist")
                .orElseGet(() -> roleRepository.saveAndFlush(new Role("Therapist", "Therapist role")));

        User manager = createUser("mgr.health-readiness@heavenstay.com", "Health Readiness Manager");
        userRoleRepository.saveAndFlush(new UserRole(manager, managerRole));
        managerToken = jwtTokenProvider.generateToken(
                manager.getUserId(), manager.getEmail(), manager.getFullName(), List.of("MANAGER"));

        User therapist = createUser("therapist.health-readiness@heavenstay.com", "Health Readiness Therapist");
        userRoleRepository.saveAndFlush(new UserRole(therapist, therapistRole));
        therapistToken = jwtTokenProvider.generateToken(
                therapist.getUserId(), therapist.getEmail(), therapist.getFullName(), List.of("THERAPIST"));

        // Deterministic dataset: 2 profiles -> 1 complete WITH an active health consent, 1 incomplete WITHOUT.
        User completedCustomer = createUser("completed.customer@heavenstay.com", "Completed Customer");
        createHealthProfile(createCustomerProfile(completedCustomer), true);
        createConsent(completedCustomer, "HEALTH_DATA_PROCESSING", "GRANTED", null);

        User incompleteCustomer = createUser("incomplete.customer@heavenstay.com", "Incomplete Customer");
        createHealthProfile(createCustomerProfile(incompleteCustomer), false);
    }

    @Test
    @DisplayName("Authenticated Manager with S54:V receives HTTP 200 and the aggregate report")
    void managerWithPermissionReceivesReadinessReport() throws Exception {
        mockMvc.perform(get(ENDPOINT).header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.message", is("SUCCESS")))
                .andExpect(jsonPath("$.timestamp").exists())
                .andExpect(jsonPath("$.data.totalProfiles", is(2)))
                .andExpect(jsonPath("$.data.completedProfiles", is(1)))
                .andExpect(jsonPath("$.data.incompleteProfiles", is(1)))
                .andExpect(jsonPath("$.data.activeConsents", is(1)))
                .andExpect(jsonPath("$.data.pendingConsents", is(1)))
                .andExpect(jsonPath("$.data.completionRate", is(50.0)));
    }

    @Test
    @DisplayName("Report payload exposes exactly the six aggregate fields (no individual health data)")
    void reportPayloadContainsExactlySixAggregateFields() throws Exception {
        MvcResult result = mockMvc.perform(get(ENDPOINT).header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode body = objectMapper.readTree(result.getResponse().getContentAsString());
        assertTrue(body.path("success").asBoolean(), "envelope.success must be true");
        assertTrue(body.has("message"), "envelope.message must be present");

        JsonNode data = body.path("data");
        Set<String> fields = new LinkedHashSet<>();
        data.fieldNames().forEachRemaining(fields::add);

        assertEquals(Set.of("totalProfiles", "completedProfiles", "incompleteProfiles",
                        "activeConsents", "pendingConsents", "completionRate"),
                fields,
                "DTO must expose exactly the six aggregate fields");
        assertEquals(6, data.size(), "no additional (health-detail) fields may be returned");
        data.forEach(node -> assertTrue(node.isNumber(), "every aggregate field must be numeric"));
    }

    @Test
    @DisplayName("Authenticated role without S54:V (Therapist) is rejected with HTTP 403")
    void therapistIsForbidden() throws Exception {
        mockMvc.perform(get(ENDPOINT).header("Authorization", "Bearer " + therapistToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Unauthenticated request is rejected with HTTP 401")
    void unauthenticatedIsRejected() throws Exception {
        mockMvc.perform(get(ENDPOINT))
                .andExpect(status().isUnauthorized());
    }

    private User createUser(String email, String fullName) {
        User user = new User(fullName, email, "enc_hash");
        user.setAccountStatus("ACTIVE");
        user.setEmailVerified(true);
        return userRepository.saveAndFlush(user);
    }

    private CustomerProfile createCustomerProfile(User user) {
        CustomerProfile customerProfile = new CustomerProfile();
        customerProfile.setUser(user);
        return customerProfileRepository.saveAndFlush(customerProfile);
    }

    private HealthProfile createHealthProfile(CustomerProfile customerProfile, boolean complete) {
        HealthProfile healthProfile = new HealthProfile();
        healthProfile.setCustomerProfile(customerProfile);
        healthProfile.setAllergiesDeclarationState(HealthDeclarationState.DECLARED);
        healthProfile.setDietaryRequirementsDeclarationState(HealthDeclarationState.DECLARED);
        healthProfile.setComplete(complete);
        return healthProfileRepository.saveAndFlush(healthProfile);
    }

    private ConsentRecord createConsent(User user, String consentType, String consentStatus, Instant revokedAt) {
        ConsentRecord consent = new ConsentRecord();
        consent.setUser(user);
        consent.setConsentType(consentType);
        consent.setConsentStatus(consentStatus);
        consent.setPolicyVersion("v1.0");
        consent.setGrantedAt(Instant.now());
        consent.setRevokedAt(revokedAt);
        return consentRecordRepository.saveAndFlush(consent);
    }

}
