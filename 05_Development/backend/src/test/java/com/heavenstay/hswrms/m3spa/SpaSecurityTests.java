package com.heavenstay.hswrms.m3spa;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Import(SpaTestConfig.class)
public class SpaSecurityTests {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @DisplayName("Security 1. Protected Spa Customer endpoint without authentication returns HTTP 401")
    public void testUnauthenticatedCustomerEndpointReturns401() throws Exception {
        mockMvc.perform(get("/api/v1/spa/sessions"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Security 2. Protected Therapist endpoint without authentication returns HTTP 401")
    public void testUnauthenticatedTherapistEndpointReturns401() throws Exception {
        mockMvc.perform(get("/api/v1/therapist/dashboard"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Security 3. Authenticated Customer calling Therapist endpoint returns HTTP 403 Forbidden")
    @WithMockUser(username = "customer@heavenstay.com", roles = {"CUSTOMER"})
    public void testCustomerCallingTherapistEndpointReturns403() throws Exception {
        mockMvc.perform(get("/api/v1/therapist/dashboard"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Security 4. Authenticated Therapist calling Customer booking endpoint returns HTTP 403 Forbidden")
    @WithMockUser(username = "therapist@heavenstay.com", roles = {"THERAPIST"})
    public void testTherapistCallingCustomerBookingEndpointReturns403() throws Exception {
        mockMvc.perform(post("/api/v1/spa/sessions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Security 5. Spa treatment catalog is public and returns HTTP 200 without authentication")
    public void testPublicCatalogAccessibleWithoutAuth() throws Exception {
        mockMvc.perform(get("/api/v1/spa/treatments"))
                .andExpect(status().isOk());
    }
}
