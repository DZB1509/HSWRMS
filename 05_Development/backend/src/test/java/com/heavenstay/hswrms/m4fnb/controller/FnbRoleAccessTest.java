package com.heavenstay.hswrms.m4fnb.controller;

import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.RequestBuilder;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

/**
 * M4 backend authorization: Admin is read-only tracking (no dietary data, no writes);
 * Customers never reach kitchen endpoints; F&B Staff is not blocked by role checks.
 *
 * <p>Request bodies are valid on purpose: bean validation runs before method security,
 * so an invalid body would mask a role failure with a 400.
 */
@SpringBootTest(properties = "spring.datasource.url=jdbc:h2:mem:fnbroles;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE;INIT=CREATE SCHEMA IF NOT EXISTS dbo")
@AutoConfigureMockMvc
class FnbRoleAccessTest {

    private static final String STATUS = "{\"status\":\"READY\"}";
    private static final String ORDER = "{\"bookingId\":1,\"orderDate\":\"2030-01-01\",\"mealType\":\"LUNCH\","
            + "\"items\":[{\"menuItemId\":1,\"quantity\":1}]}";
    private static final String MENU = "{\"itemName\":\"X\",\"price\":1.00,\"availabilityStatus\":\"AVAILABLE\"}";
    private static final String RECIPE = "{\"ingredients\":[{\"ingredientId\":1,\"requiredQuantity\":1.000}]}";
    private static final String INGREDIENT = "{\"ingredientName\":\"X\"}";
    private static final String BATCH = "{\"ingredientId\":1,\"receivedDate\":\"2020-01-01\","
            + "\"expirationDate\":\"2030-01-01\",\"remainingQuantity\":1.000,\"stockCondition\":\"FRESH\"}";
    private static final String CONDITION = "{\"stockCondition\":\"HOLD\"}";

    @Autowired
    private MockMvc mockMvc;

    private static RequestPostProcessor as(String role) {
        return user("tester").authorities(new SimpleGrantedAuthority(role));
    }

    private static RequestBuilder json(MockHttpServletRequestBuilder builder, RequestPostProcessor who, String body) {
        return builder.with(who).contentType(MediaType.APPLICATION_JSON).content(body);
    }

    private int statusOf(RequestBuilder builder) throws Exception {
        return mockMvc.perform(builder).andReturn().getResponse().getStatus();
    }

    @Test
    @DisplayName("Unauthenticated callers get 401 on every M4 area")
    void anonymousIs401() throws Exception {
        mockMvc.perform(get("/api/v1/fnb/menu")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/v1/fnb/orders")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/v1/fnb/dashboard")).andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Admin cannot read kitchen orders or the dashboard (dietary projection)")
    void adminCannotSeeDietaryData() throws Exception {
        RequestPostProcessor admin = as("ROLE_ADMIN");
        mockMvc.perform(get("/api/v1/fnb/orders").with(admin)).andExpect(status().isForbidden());
        mockMvc.perform(get("/api/v1/fnb/orders/1").with(admin)).andExpect(status().isForbidden());
        mockMvc.perform(get("/api/v1/fnb/dashboard").with(admin)).andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Admin cannot perform any M4 write operation")
    void adminHasNoWrites() throws Exception {
        RequestPostProcessor admin = as("ROLE_ADMIN");
        mockMvc.perform(json(patch("/api/v1/fnb/orders/1/status"), admin, STATUS)).andExpect(status().isForbidden());
        mockMvc.perform(json(patch("/api/v1/fnb/orders/1/items/1/preparation-status"), admin, STATUS))
                .andExpect(status().isForbidden());
        mockMvc.perform(json(post("/api/v1/fnb/menu"), admin, MENU)).andExpect(status().isForbidden());
        mockMvc.perform(json(put("/api/v1/fnb/menu/1"), admin, MENU)).andExpect(status().isForbidden());
        mockMvc.perform(json(put("/api/v1/fnb/menu/1/recipe"), admin, RECIPE)).andExpect(status().isForbidden());
        mockMvc.perform(json(post("/api/v1/fnb/ingredients"), admin, INGREDIENT)).andExpect(status().isForbidden());
        mockMvc.perform(json(post("/api/v1/fnb/inventory/batches"), admin, BATCH)).andExpect(status().isForbidden());
        mockMvc.perform(json(patch("/api/v1/fnb/inventory/batches/1/condition"), admin, CONDITION))
                .andExpect(status().isForbidden());
        mockMvc.perform(json(post("/api/v1/fnb/orders/daily-meals"), admin, ORDER)).andExpect(status().isForbidden());
        mockMvc.perform(json(post("/api/v1/fnb/orders/ala-carte"), admin, ORDER)).andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Admin keeps read-only tracking of non-dietary stock data")
    void adminReadOnlyTracking() throws Exception {
        RequestPostProcessor admin = as("ROLE_ADMIN");
        assertNotEquals(403, statusOf(get("/api/v1/fnb/ingredients").with(admin)));
        assertNotEquals(403, statusOf(get("/api/v1/fnb/inventory/batches").with(admin)));
        assertNotEquals(403, statusOf(get("/api/v1/fnb/menu/availability").with(admin)));
    }

    @Test
    @DisplayName("Customer cannot reach kitchen, inventory, or menu-management endpoints")
    void customerBlockedFromStaffEndpoints() throws Exception {
        RequestPostProcessor customer = as("ROLE_CUSTOMER");
        mockMvc.perform(get("/api/v1/fnb/orders").with(customer)).andExpect(status().isForbidden());
        mockMvc.perform(get("/api/v1/fnb/orders/1").with(customer)).andExpect(status().isForbidden());
        mockMvc.perform(get("/api/v1/fnb/dashboard").with(customer)).andExpect(status().isForbidden());
        mockMvc.perform(get("/api/v1/fnb/inventory/batches").with(customer)).andExpect(status().isForbidden());
        mockMvc.perform(get("/api/v1/fnb/ingredients").with(customer)).andExpect(status().isForbidden());
        mockMvc.perform(get("/api/v1/fnb/menu/availability").with(customer)).andExpect(status().isForbidden());
        mockMvc.perform(json(patch("/api/v1/fnb/orders/1/status"), customer, STATUS)).andExpect(status().isForbidden());
        mockMvc.perform(json(put("/api/v1/fnb/menu/1/recipe"), customer, RECIPE)).andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Other staff roles (Receptionist, Therapist, Manager) get no M4 kitchen access")
    void otherRolesBlocked() throws Exception {
        for (String role : new String[] { "ROLE_RECEPTIONIST", "ROLE_THERAPIST", "ROLE_MANAGER" }) {
            mockMvc.perform(get("/api/v1/fnb/orders").with(as(role))).andExpect(status().isForbidden());
            mockMvc.perform(get("/api/v1/fnb/dashboard").with(as(role))).andExpect(status().isForbidden());
            mockMvc.perform(json(patch("/api/v1/fnb/orders/1/status"), as(role), STATUS))
                    .andExpect(status().isForbidden());
        }
    }

    @Test
    @DisplayName("Staff cannot place or read customer orders")
    void staffCannotPlaceOrders() throws Exception {
        RequestPostProcessor staff = as("ROLE_F&B STAFF");
        mockMvc.perform(json(post("/api/v1/fnb/orders/daily-meals"), staff, ORDER)).andExpect(status().isForbidden());
        mockMvc.perform(json(post("/api/v1/fnb/orders/ala-carte"), staff, ORDER)).andExpect(status().isForbidden());
        mockMvc.perform(get("/api/v1/fnb/orders/mine?bookingId=1").with(staff)).andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("F&B Staff passes role checks on kitchen endpoints")
    void fnbStaffNotBlockedByRole() throws Exception {
        RequestPostProcessor staff = as("ROLE_F&B STAFF");
        assertNotEquals(403, statusOf(get("/api/v1/fnb/orders").with(staff)));
        assertNotEquals(403, statusOf(get("/api/v1/fnb/dashboard").with(staff)));
        assertNotEquals(403, statusOf(get("/api/v1/fnb/ingredients").with(staff)));
    }
}
