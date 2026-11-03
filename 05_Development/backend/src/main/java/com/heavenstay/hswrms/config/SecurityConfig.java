package com.heavenstay.hswrms.config;

import com.heavenstay.hswrms.m1identity.sso.SsoAvailabilityFilter;
import com.heavenstay.hswrms.m1identity.sso.SsoOAuth2FailureHandler;
import com.heavenstay.hswrms.m1identity.sso.SsoOAuth2SuccessHandler;
import com.heavenstay.hswrms.m1identity.sso.SsoUserInfoDiagnosticsService;
import com.heavenstay.hswrms.security.JwtAuthenticationFilter;
import com.heavenstay.hswrms.security.RestAccessDeniedHandler;
import com.heavenstay.hswrms.security.RestAuthenticationEntryPoint;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.web.OAuth2AuthorizationRequestRedirectFilter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final RestAuthenticationEntryPoint authenticationEntryPoint;
    private final RestAccessDeniedHandler accessDeniedHandler;
    private final SsoOAuth2SuccessHandler ssoOAuth2SuccessHandler;
    private final SsoOAuth2FailureHandler ssoOAuth2FailureHandler;
    private final SsoUserInfoDiagnosticsService ssoUserInfoDiagnosticsService;
    private final ClientRegistrationRepository clientRegistrationRepository;

    @Value("${app.sso.frontend-base-url:http://localhost:5173}")
    private String ssoFrontendBaseUrl;

    @Value("${app.auth.dev-token-enabled:false}")
    private boolean devTokenEnabled;

    @Autowired(required = false)
    private Environment environment;

    public SecurityConfig(
            JwtAuthenticationFilter jwtAuthenticationFilter,
            RestAuthenticationEntryPoint authenticationEntryPoint,
            RestAccessDeniedHandler accessDeniedHandler,
            SsoOAuth2SuccessHandler ssoOAuth2SuccessHandler,
            SsoOAuth2FailureHandler ssoOAuth2FailureHandler,
            SsoUserInfoDiagnosticsService ssoUserInfoDiagnosticsService,
            ClientRegistrationRepository clientRegistrationRepository) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.authenticationEntryPoint = authenticationEntryPoint;
        this.accessDeniedHandler = accessDeniedHandler;
        this.ssoOAuth2SuccessHandler = ssoOAuth2SuccessHandler;
        this.ssoOAuth2FailureHandler = ssoOAuth2FailureHandler;
        this.ssoUserInfoDiagnosticsService = ssoUserInfoDiagnosticsService;
        this.clientRegistrationRepository = clientRegistrationRepository;
    }

    /**
     * Dedicated chain for the Google OAuth2/OIDC handshake.
     */
    @Bean
    @Order(1)
    public SecurityFilterChain ssoSecurityFilterChain(HttpSecurity http) throws Exception {
        http
                .securityMatcher("/api/v1/auth/sso/**")
                .cors(Customizer.withDefaults())
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED))
                .authorizeHttpRequests(authorize -> authorize.anyRequest().permitAll())
                .oauth2Login(oauth2 -> oauth2
                        .authorizationEndpoint(endpoint -> endpoint.baseUri("/api/v1/auth/sso"))
                        .redirectionEndpoint(endpoint -> endpoint.baseUri("/api/v1/auth/sso/callback/*"))
                        .userInfoEndpoint(endpoint -> endpoint.userService(ssoUserInfoDiagnosticsService))
                        .successHandler(ssoOAuth2SuccessHandler)
                        .failureHandler(ssoOAuth2FailureHandler))
                .addFilterBefore(
                        new SsoAvailabilityFilter(clientRegistrationRepository, ssoFrontendBaseUrl),
                        OAuth2AuthorizationRequestRedirectFilter.class);

        return http.build();
    }

    @Bean
    @Order(2)
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        boolean allowDevTokenEndpoint = devTokenEnabled && environment != null
                && environment.acceptsProfiles(Profiles.of("dev", "local", "test"));
        http
                .cors(Customizer.withDefaults())
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(exceptions -> exceptions
                        .authenticationEntryPoint(authenticationEntryPoint)
                        .accessDeniedHandler(accessDeniedHandler))
                .authorizeHttpRequests(authorize -> {
                    if (allowDevTokenEndpoint) {
                        authorize.requestMatchers("/api/v1/auth/dev/**", "/api/v1/auth/dev-token").permitAll();
                    }
                    authorize
                        .requestMatchers("/api/v1/health").permitAll()
                        // Public authentication endpoints from M1
                        .requestMatchers(HttpMethod.POST, "/api/v1/auth/register").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/v1/auth/register/sso").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/v1/auth/verify-email").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/v1/auth/login").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/v1/auth/switch-role").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/v1/auth/forgot-password").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/v1/auth/reset-password").permitAll()
                        // Dev token endpoint is conditionally registered above only when profile + app.auth.dev-token-enabled=true

                        // Public package catalog from M1: GET only
                        .requestMatchers(HttpMethod.GET, "/api/v1/packages", "/api/v1/packages/**").permitAll()

                        // Public SPA treatment catalog from M3: GET only
                        .requestMatchers(HttpMethod.GET, "/api/v1/spa/treatments", "/api/v1/spa/treatments/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/spa-treatments", "/api/v1/spa-treatments/**", "/api/v1/treatment-rooms", "/api/v1/treatment-rooms/**", "/api/v1/spa/treatment-rooms/**", "/api/v1/room-types/**", "/api/v1/qualifications/**").permitAll()

                        // Public retreat packages and villa categories catalog from M2: GET only
                        .requestMatchers(HttpMethod.GET, "/api/v1/retreat-packages", "/api/v1/retreat-packages/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/retreat-packages-inventory", "/api/v1/retreat-packages-inventory/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/villas/**", "/api/v1/villa-categories/**", "/api/v1/resort-zones/**", "/api/v1/villa-functional-areas/**").permitAll()

                        // Public F&B menu catalog from M4: GET only
                        .requestMatchers(HttpMethod.GET, "/api/v1/fnb/customer/menu-items", "/api/v1/fnb/customer/menu-items/**").permitAll()

                        // Public read-only booking calculation from M2: POST only
                        .requestMatchers(HttpMethod.POST, "/api/v1/retreat-packages/calculate").permitAll()

                        // Public VNPay IPN and return callbacks from M2 & M5 (cryptographically verified by HMAC-SHA512 checksum)
                        .requestMatchers(HttpMethod.GET, "/api/v1/payments/vnpay-ipn", "/api/v1/payments/vnpay-return").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/payments/vnpay/verify-return").permitAll()

                        // S42 Final Payment checkout APIs: QR generation, VNPay URL creation, status polling
                        .requestMatchers(HttpMethod.POST, "/api/v1/payments/vnpay/create-payment-url").hasAnyRole("CUSTOMER", "RECEPTIONIST", "ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/v1/payments/status/**", "/api/v1/invoices/*/payment-status").hasAnyRole("CUSTOMER", "RECEPTIONIST", "ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/v1/billing/invoices/*/vietqr", "/api/v1/billing/checkout/vietqr/*", "/api/v1/billing/deposit/*/vietqr", "/api/v1/billing/checkout/deposit/*/vietqr").hasAnyRole("CUSTOMER", "RECEPTIONIST", "ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/v1/billing/payments/transactions/*/status").hasAnyRole("CUSTOMER", "RECEPTIONIST", "ADMIN")

                        // Dev/Sandbox simulation endpoints: strictly restricted to Staff/Admin and isolated in @Profile({"dev", "local", "test"})
                        .requestMatchers("/api/v1/payments/vnpay/simulate", "/api/v1/payments/simulate-sandbox", "/api/v1/customer/bookings/vnpay/simulate-sandbox-payment").hasAnyRole("RECEPTIONIST", "ADMIN")

                        // Receptionist operations from M2: RECEPTIONIST, MANAGER, ADMIN
                        .requestMatchers(HttpMethod.GET, "/api/v1/receptionist/**").hasAnyRole("RECEPTIONIST", "MANAGER", "ADMIN")
                        .requestMatchers("/api/v1/receptionist/**").hasAnyRole("RECEPTIONIST", "ADMIN")

                        // Customer retreat booking detail lookup: accessible to CUSTOMER (for own booking) and RECEPTIONIST, MANAGER, ADMIN
                        .requestMatchers(HttpMethod.GET, "/api/v1/customer/bookings/*").hasAnyRole("CUSTOMER", "RECEPTIONIST", "MANAGER", "ADMIN")

                        // Customer retreat bookings from M2: requires CUSTOMER, MANAGER or ADMIN
                        .requestMatchers("/api/v1/customer/profile", "/api/v1/customer/profile/**").hasAnyRole("CUSTOMER", "RECEPTIONIST", "MANAGER", "ADMIN")
                        .requestMatchers("/api/v1/customer/bookings/**").hasAnyRole("CUSTOMER", "MANAGER", "ADMIN")

                        // Therapist operations from M3
                        // Operational status updates for therapists from M3/M6: MANAGER, ADMIN, RECEPTIONIST
                        .requestMatchers(HttpMethod.PATCH, "/api/v1/therapist/*/status").hasAnyRole("MANAGER", "ADMIN", "RECEPTIONIST")

                        // Therapist clinical & schedule operations from M3 (Screens 31, 32, 33): THERAPIST only
                        .requestMatchers("/api/v1/therapist/**").hasRole("THERAPIST")

                        // Customer and receptionist SPA operations from M3
                        .requestMatchers("/api/v1/spa/**").hasAnyRole("CUSTOMER", "RECEPTIONIST", "MANAGER", "ADMIN")

                        // Module 4: F&B Kitchen Display System (KDS) operations: FNB_STAFF, MANAGER, ADMIN
                        .requestMatchers("/api/v1/fnb/kds/**").hasAnyRole("FNB_STAFF", "MANAGER", "ADMIN")

                        // Module 4: F&B Customer ordering operations: CUSTOMER, RECEPTIONIST, MANAGER, ADMIN
                        .requestMatchers("/api/v1/fnb/customer/**").hasAnyRole("CUSTOMER", "RECEPTIONIST", "MANAGER", "ADMIN")

                        // Module 5: Payment webhooks (VNPay & VietQR) authenticated by HMAC-SHA512 checksum / secret, not by JWT
                        .requestMatchers("/api/v1/commerce/payment/webhook/**").permitAll()

                        // Module 5: Management Analytics restricted to MANAGER and ADMIN
                        .requestMatchers("/api/v1/analytics/**").hasAnyRole("MANAGER", "ADMIN")

                        // Module 5: Customer Reviews (ownership and completion verified at service/method level)
                        .requestMatchers("/api/v1/customer/reviews/**").hasAnyRole("CUSTOMER", "RECEPTIONIST", "ADMIN")

                        // Module 5: Billing, Folio, Invoices and Payments (granular ownership evaluated via @billingAccess)
                        .requestMatchers("/api/v1/billing/**").authenticated()

                        // Module 6: Administration, Staff Management, Governance, Delegation & Sensitive Audit Logs
                        .requestMatchers("/api/v1/admin/**").hasAnyRole("ADMIN", "MANAGER")

                        // Public F&B package plans from M4: GET only
                        .requestMatchers(HttpMethod.GET, "/api/v1/fnb/packages", "/api/v1/fnb/packages/*").permitAll()
                        .anyRequest().authenticated();
                }
                )
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
