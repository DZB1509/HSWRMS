package com.heavenstay.hswrms.m1identity.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.heavenstay.hswrms.m1identity.service.CustomerProfileService;
import com.heavenstay.hswrms.m1identity.service.HealthProfileService;
import com.heavenstay.hswrms.m1identity.service.ConsentService;
import com.heavenstay.hswrms.m1identity.service.HealthDataDeletionRequestService;
import com.heavenstay.hswrms.security.CustomUserDetails;
import java.util.List;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
class CustomerEndpointRoleAuthorizationTests {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private CustomerProfileService customerProfileService;

    @MockBean
    private HealthProfileService healthProfileService;

    @MockBean
    private ConsentService consentService;

    @MockBean
    private HealthDataDeletionRequestService deletionRequestService;

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    private void authenticateAs(String role) {
        CustomUserDetails principal = new CustomUserDetails(
                205, "jane@example.com", "", "Jane Doe", true, List.of(role));
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities()));
    }

    @Test
    @DisplayName("Unauthenticated profile GET returns 401")
    void unauthenticatedProfileGet_returns401() throws Exception {
        SecurityContextHolder.clearContext();
        mockMvc.perform(get("/api/v1/customers/me/profile"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Non-customer profile GET returns 403")
    void nonCustomerProfileGet_returns403() throws Exception {
        authenticateAs("Receptionist");
        mockMvc.perform(get("/api/v1/customers/me/profile"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Customer profile GET returns 200")
    void customerProfileGet_returns200() throws Exception {
        authenticateAs("Customer");
        when(customerProfileService.getMyProfile(205)).thenReturn(null);
        mockMvc.perform(get("/api/v1/customers/me/profile"))
                .andExpect(status().isOk());
    }
    @Test
    @DisplayName("Unauthenticated health profile GET returns 401")
    void unauthenticatedHealthGet_returns401() throws Exception {
        SecurityContextHolder.clearContext();
        mockMvc.perform(get("/api/v1/customers/me/health-profile"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Non-customer health profile GET returns 403")
    void nonCustomerHealthGet_returns403() throws Exception {
        authenticateAs("Therapist");
        mockMvc.perform(get("/api/v1/customers/me/health-profile"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Customer health profile GET returns 200")
    void customerHealthGet_returns200() throws Exception {
        authenticateAs("Customer");
        when(healthProfileService.getMyHealthProfile(205)).thenReturn(null);
        mockMvc.perform(get("/api/v1/customers/me/health-profile"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Unauthenticated consent GET returns 401")
    void unauthenticatedConsentGet_returns401() throws Exception {
        SecurityContextHolder.clearContext();
        mockMvc.perform(get("/api/v1/customers/me/consents"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Non-customer consent GET returns 403")
    void nonCustomerConsentGet_returns403() throws Exception {
        authenticateAs("Admin");
        mockMvc.perform(get("/api/v1/customers/me/consents"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Customer consent GET returns 200")
    void customerConsentGet_returns200() throws Exception {
        authenticateAs("Customer");
        when(consentService.listMyConsents(205)).thenReturn(List.of());
        mockMvc.perform(get("/api/v1/customers/me/consents"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Unauthenticated deletion list returns 401")
    void unauthenticatedDeletionList_returns401() throws Exception {
        SecurityContextHolder.clearContext();
        mockMvc.perform(get("/api/v1/customers/me/deletion-requests"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Non-customer deletion list returns 403")
    void nonCustomerDeletionList_returns403() throws Exception {
        authenticateAs("Manager");
        mockMvc.perform(get("/api/v1/customers/me/deletion-requests"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Customer deletion list returns 200")
    void customerDeletionList_returns200() throws Exception {
        authenticateAs("Customer");
        when(deletionRequestService.listDeletionRequests(205)).thenReturn(List.of());
        mockMvc.perform(get("/api/v1/customers/me/deletion-requests"))
                .andExpect(status().isOk());
    }

}
