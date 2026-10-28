package com.heavenstay.hswrms.m4fnb.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.heavenstay.hswrms.m1identity.entity.CustomerProfile;
import com.heavenstay.hswrms.m1identity.entity.Role;
import com.heavenstay.hswrms.m1identity.entity.User;
import com.heavenstay.hswrms.m1identity.entity.UserRole;
import com.heavenstay.hswrms.m1identity.repository.CustomerProfileRepository;
import com.heavenstay.hswrms.m1identity.repository.RoleRepository;
import com.heavenstay.hswrms.m1identity.repository.UserRepository;
import com.heavenstay.hswrms.m1identity.repository.UserRoleRepository;
import com.heavenstay.hswrms.m2booking.entity.RetreatBooking;
import com.heavenstay.hswrms.m2booking.entity.RetreatPackage;
import com.heavenstay.hswrms.m2booking.entity.VillaCategory;
import com.heavenstay.hswrms.m2booking.repository.RetreatBookingRepository;
import com.heavenstay.hswrms.m2booking.repository.RetreatPackageRepository;
import com.heavenstay.hswrms.m2booking.repository.VillaCategoryRepository;
import com.heavenstay.hswrms.m4fnb.dto.CreateDailyMealRequest;
import com.heavenstay.hswrms.m4fnb.dto.UpdateOrderStatusRequest;
import com.heavenstay.hswrms.m4fnb.entity.MealOrderEntity;
import com.heavenstay.hswrms.m4fnb.entity.MenuItemEntity;
import com.heavenstay.hswrms.m4fnb.repository.MealOrderRepository;
import com.heavenstay.hswrms.m4fnb.repository.MenuItemRepository;
import com.heavenstay.hswrms.security.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {
        "app.seed.demo-data=false"
})
@AutoConfigureMockMvc
@Transactional
public class FnbControllersSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

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
    private RetreatBookingRepository bookingRepository;

    @Autowired
    private VillaCategoryRepository villaCategoryRepository;

    @Autowired
    private RetreatPackageRepository retreatPackageRepository;

    @Autowired
    private MenuItemRepository menuItemRepository;

    @Autowired
    private MealOrderRepository mealOrderRepository;

    private User fnbStaffUser;
    private User customerUser;
    private String fnbStaffToken;
    private String customerToken;
    private RetreatBooking testBooking;
    private MenuItemEntity testMenuItem;
    private MealOrderEntity testOrder;

    @BeforeEach
    void setUp() {
        Role fnbRole = roleRepository.findByRoleNameIgnoreCase("Fnb_Staff")
                .or(() -> roleRepository.findByRoleNameIgnoreCase("FNB_STAFF"))
                .orElseGet(() -> roleRepository.saveAndFlush(new Role("FNB_STAFF", "F&B Staff role")));

        Role customerRole = roleRepository.findByRoleNameIgnoreCase("Customer")
                .or(() -> roleRepository.findByRoleNameIgnoreCase("CUSTOMER"))
                .orElseGet(() -> roleRepository.saveAndFlush(new Role("CUSTOMER", "Customer role")));

        long ts = System.currentTimeMillis();

        // Create FNB staff user
        fnbStaffUser = new User("Chef Anton " + ts, "fnb." + ts + "@heavenstay.com", "enc_hash");
        fnbStaffUser.setAccountStatus("ACTIVE");
        fnbStaffUser.setEmailVerified(true);
        fnbStaffUser = userRepository.saveAndFlush(fnbStaffUser);
        userRoleRepository.saveAndFlush(new UserRole(fnbStaffUser, fnbRole));
        fnbStaffToken = jwtTokenProvider.generateToken(
                fnbStaffUser.getUserId(), fnbStaffUser.getEmail(), fnbStaffUser.getFullName(), List.of("FNB_STAFF"));

        // Create Customer user
        customerUser = new User("Guest Lucy " + ts, "lucy." + ts + "@heavenstay.com", "enc_hash");
        customerUser.setAccountStatus("ACTIVE");
        customerUser.setEmailVerified(true);
        customerUser = userRepository.saveAndFlush(customerUser);
        userRoleRepository.saveAndFlush(new UserRole(customerUser, customerRole));
        customerToken = jwtTokenProvider.generateToken(
                customerUser.getUserId(), customerUser.getEmail(), customerUser.getFullName(), List.of("CUSTOMER"));

        CustomerProfile cp = new CustomerProfile(customerUser);
        cp = customerProfileRepository.saveAndFlush(cp);

        // Booking & Menu items
        VillaCategory cat = new VillaCategory();
        cat.setCategoryName("Test Category " + ts);
        cat.setMaxOccupancy(2);
        cat.setPriceModifier(BigDecimal.ZERO);
        cat.setCategoryStatus("ACTIVE");
        cat.setInventoryCount(5);
        cat.setBedroomCount(1);
        cat = villaCategoryRepository.saveAndFlush(cat);

        RetreatPackage pkg = new RetreatPackage();
        pkg.setPackageCode("PKG-" + ts);
        pkg.setPackageName("Package " + ts);
        pkg.setDurationNights(3);
        pkg.setBasePrice(BigDecimal.valueOf(1000));
        pkg.setPackageStatus("ACTIVE");
        pkg = retreatPackageRepository.saveAndFlush(pkg);

        testBooking = new RetreatBooking();
        testBooking.setCustomerProfileId(cp.getCustomerProfileId());
        testBooking.setRetreatPackage(pkg);
        testBooking.setRequestedVillaCategory(cat);
        testBooking.setCheckInDate(LocalDate.now());
        testBooking.setCheckOutDate(LocalDate.now().plusDays(3));
        testBooking.setBookingStatus("CONFIRMED");
        testBooking.setDepositAmount(BigDecimal.valueOf(500));
        testBooking.setTotalEstimatedAmount(BigDecimal.valueOf(1000));
        testBooking = bookingRepository.saveAndFlush(testBooking);

        testMenuItem = new MenuItemEntity("Special Soup " + ts, "SOUP", "ALL_DAY",
                BigDecimal.valueOf(80), "vegan", null, "AVAILABLE");
        testMenuItem = menuItemRepository.saveAndFlush(testMenuItem);

        testOrder = new MealOrderEntity();
        testOrder.setRetreatBooking(testBooking);
        testOrder.setOrderDate(LocalDate.now());
        testOrder.setMealType("LUNCH");
        testOrder.setOrderType("DAILY_MEAL");
        testOrder.setOrderStatus("PENDING");
        testOrder.setCreatedAt(LocalDateTime.now());
        testOrder = mealOrderRepository.saveAndFlush(testOrder);
    }

    @Test
    @DisplayName("FNB-SEC-01: Unauthenticated request to /api/v1/fnb/kds/queue is rejected with 401")
    void unauthenticatedKdsQueue_Returns401() throws Exception {
        mockMvc.perform(get("/api/v1/fnb/kds/queue"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("FNB-SEC-02: Customer role is FORBIDDEN from accessing /api/v1/fnb/kds/queue (403)")
    void customerAccessToKdsQueue_Returns403() throws Exception {
        mockMvc.perform(get("/api/v1/fnb/kds/queue")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("FNB-SEC-03: FNB_STAFF role is permitted to access /api/v1/fnb/kds/queue (200 OK)")
    void fnbStaffAccessToKdsQueue_Returns200() throws Exception {
        mockMvc.perform(get("/api/v1/fnb/kds/queue")
                        .header("Authorization", "Bearer " + fnbStaffToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @DisplayName("FNB-SEC-04: Customer role is FORBIDDEN from updating order status on KDS (403)")
    void customerAccessToUpdateStatus_Returns403() throws Exception {
        UpdateOrderStatusRequest req = new UpdateOrderStatusRequest("PREPARING", null);

        mockMvc.perform(patch("/api/v1/fnb/kds/orders/" + testOrder.getMealOrderId() + "/status")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("FNB-SEC-05: FNB_STAFF is permitted to update order status (200 OK)")
    void fnbStaffUpdateStatus_Returns200() throws Exception {
        UpdateOrderStatusRequest req = new UpdateOrderStatusRequest("PREPARING", null);

        mockMvc.perform(patch("/api/v1/fnb/kds/orders/" + testOrder.getMealOrderId() + "/status")
                        .header("Authorization", "Bearer " + fnbStaffToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.orderStatus").value("PREPARING"));
    }

    @Test
    @DisplayName("FNB-SEC-06: Menu items endpoint is accessible without authentication (200 OK)")
    void anyoneCanBrowseMenu_Returns200() throws Exception {
        mockMvc.perform(get("/api/v1/fnb/customer/menu-items"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @DisplayName("FNB-SEC-07: Customer can create daily meal order for own booking (201 Created)")
    void customerCanCreateDailyMealOrder_Returns201() throws Exception {
        CreateDailyMealRequest req = new CreateDailyMealRequest(
                testBooking.getRetreatBookingId(),
                LocalDate.now(),
                "DINNER",
                List.of(testMenuItem.getMenuItemId()),
                "Allergy note"
        );

        mockMvc.perform(post("/api/v1/fnb/customer/daily-meals")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.orderType").value("DAILY_MEAL"));
    }

    @Test
    @DisplayName("FNB-SEC-08: Unauthenticated user cannot create daily meal order (401)")
    void unauthenticatedDailyMealOrder_Returns401() throws Exception {
        CreateDailyMealRequest req = new CreateDailyMealRequest(
                testBooking.getRetreatBookingId(),
                LocalDate.now(),
                "DINNER",
                List.of(testMenuItem.getMenuItemId()),
                null
        );

        mockMvc.perform(post("/api/v1/fnb/customer/daily-meals")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isUnauthorized());
    }
}
