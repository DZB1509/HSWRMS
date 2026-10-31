package com.heavenstay.hswrms.common.api;

import com.heavenstay.hswrms.security.JwtTokenProvider;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.context.ApplicationContext;
import org.springframework.http.ResponseEntity;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
public class DevAuthControllerSecurityTest {

    @Autowired
    private ApplicationContext applicationContext;

    @Autowired
    private MockMvc mockMvc;

    private final ApplicationContextRunner contextRunner = new ApplicationContextRunner()
            .withBean(JwtTokenProvider.class, () -> {
                JwtTokenProvider provider = mock(JwtTokenProvider.class);
                when(provider.generateToken(anyInt(), anyString(), anyString(), anyList()))
                        .thenReturn("signed-dev-jwt-token");
                return provider;
            })
            .withUserConfiguration(DevAuthController.class);

    @Test
    @DisplayName("P0-01: DevAuthController is unavailable when dev/local/test profile is not active (e.g., prod)")
    void devAuthControllerUnavailableInProductionProfileEvenIfPropertyTrue() {
        contextRunner
                .withSystemProperties("spring.profiles.active=prod")
                .withInitializer(ctx -> ctx.getEnvironment().setActiveProfiles("prod"))
                .withPropertyValues("app.auth.dev-token-enabled=true")
                .run(context -> {
                    assertThat(context).doesNotHaveBean(DevAuthController.class);
                });
    }

    @Test
    @DisplayName("P0-01: DevAuthController is unavailable when app.auth.dev-token-enabled property is missing (defaults to disabled)")
    void devAuthControllerUnavailableWhenPropertyMissing() {
        contextRunner
                .withInitializer(ctx -> ctx.getEnvironment().setActiveProfiles("dev"))
                .run(context -> {
                    assertThat(context).doesNotHaveBean(DevAuthController.class);
                });
    }

    @Test
    @DisplayName("P0-01: DevAuthController is unavailable when app.auth.dev-token-enabled is false")
    void devAuthControllerUnavailableWhenPropertyFalse() {
        contextRunner
                .withInitializer(ctx -> ctx.getEnvironment().setActiveProfiles("dev"))
                .withPropertyValues("app.auth.dev-token-enabled=false")
                .run(context -> {
                    assertThat(context).doesNotHaveBean(DevAuthController.class);
                });
    }

    @Test
    @DisplayName("P0-01: DevAuthController is available ONLY when both permitted profile (dev/local/test) and explicit opt-in property are active")
    void devAuthControllerAvailableOnlyWhenProfileAndOptInPropertyActive() {
        for (String allowedProfile : new String[]{"dev", "local", "test"}) {
            contextRunner
                    .withInitializer(ctx -> ctx.getEnvironment().setActiveProfiles(allowedProfile))
                    .withPropertyValues("app.auth.dev-token-enabled=true")
                    .run(context -> {
                        assertThat(context).hasSingleBean(DevAuthController.class);
                        DevAuthController controller = context.getBean(DevAuthController.class);
                        ResponseEntity<ApiResponse<Map<String, String>>> response = controller.getDevToken("CUSTOMER");
                        assertEquals(200, response.getStatusCode().value());
                        assertNotNull(response.getBody());
                        assertEquals("signed-dev-jwt-token", response.getBody().getData().get("token"));
                    });
        }
    }

    @Test
    @DisplayName("P0-01: Default Spring Boot context does not register DevAuthController and blocks unauthenticated /api/v1/auth/dev-token")
    void defaultContextBlocksDevTokenEndpoint() throws Exception {
        assertTrue(applicationContext.getBeansOfType(DevAuthController.class).isEmpty(),
                "DevAuthController must not be registered when app.auth.dev-token-enabled is not explicitly true");

        mockMvc.perform(get("/api/v1/auth/dev-token").param("role", "ADMIN"))
                .andExpect(status().isUnauthorized());
    }
}

