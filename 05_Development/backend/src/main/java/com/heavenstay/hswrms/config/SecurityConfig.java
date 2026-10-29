package com.heavenstay.hswrms.config;

import com.heavenstay.hswrms.m1identity.sso.SsoAvailabilityFilter;
import com.heavenstay.hswrms.m1identity.sso.SsoOAuth2FailureHandler;
import com.heavenstay.hswrms.m1identity.sso.SsoOAuth2SuccessHandler;
import com.heavenstay.hswrms.m1identity.sso.SsoUserInfoDiagnosticsService;
import com.heavenstay.hswrms.security.JwtAuthenticationFilter;
import com.heavenstay.hswrms.security.RestAccessDeniedHandler;
import com.heavenstay.hswrms.security.RestAuthenticationEntryPoint;
import org.springframework.beans.factory.annotation.Value;
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
     *
     * <p>Kept separate from the main stateless JWT chain because Spring Security's
     * OAuth login needs a short-lived HTTP session to store the {@code state}/{@code nonce}
     * for the duration of the redirect to Google and back (an explicitly accepted
     * exception for the handshake only). All regular API authentication continues
     * to run through {@link JwtAuthenticationFilter} on the stateless chain below.</p>
     *
     * <ul>
     *   <li>{@code GET /api/v1/auth/sso/google} — authorization start.</li>
     *   <li>{@code GET /api/v1/auth/sso/callback/google} — OAuth callback; the success
     *       handler issues a one-time ticket and redirects to the SPA.</li>
     *   <li>{@code POST /api/v1/auth/sso/tickets/exchange|resolve} — public ticket
     *       endpoints (the ticket itself is the credential).</li>
     * </ul>
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
                        // TEMPORARY: logs granted scopes + returned field names (never
                        // values) during SSO userinfo loading to diagnose provider-side
                        // missing-email responses. Behavior is identical to Spring's
                        // default user services. See SsoUserInfoDiagnosticsService.
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
        http
                .cors(Customizer.withDefaults())
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(exceptions -> exceptions
                        .authenticationEntryPoint(authenticationEntryPoint)
                        .accessDeniedHandler(accessDeniedHandler))
                .authorizeHttpRequests(authorize -> authorize
                        .requestMatchers("/api/v1/health").permitAll()
                                                // Public authentication endpoints from M1
                        .requestMatchers(HttpMethod.POST, "/api/v1/auth/register").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/v1/auth/register/sso").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/v1/auth/verify-email").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/v1/auth/login").permitAll()

                        // Public package catalog from M1: GET only
                        .requestMatchers(HttpMethod.GET, "/api/v1/packages", "/api/v1/packages/**").permitAll()

                        // Public SPA treatment catalog from M3: GET only
                        .requestMatchers(HttpMethod.GET, "/api/v1/spa/treatments", "/api/v1/spa/treatments/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/spa-treatments/**", "/api/v1/treatment-rooms/**", "/api/v1/spa/treatment-rooms/**", "/api/v1/room-types/**", "/api/v1/qualifications/**").permitAll()

                        // Public retreat packages and villa categories catalog from M2: GET only
                        .requestMatchers(HttpMethod.GET, "/api/v1/retreat-packages", "/api/v1/retreat-packages/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/villas/**", "/api/v1/villa-categories/**", "/api/v1/resort-zones/**", "/api/v1/villa-functional-areas/**").permitAll()

                        // Public F&B menu catalog from M4: GET only
                        .requestMatchers(HttpMethod.GET, "/api/v1/fnb/customer/menu-items", "/api/v1/fnb/customer/menu-items/**").permitAll()

                        // Public read-only booking calculation from M2: POST only
                        .requestMatchers(HttpMethod.POST, "/api/v1/retreat-packages/calculate").permitAll()

                        // Public VNPay IPN and return callbacks from M2: with cryptographic HMAC-SHA512 verification in service
                        .requestMatchers("/api/v1/payments/**").permitAll()

                        // Receptionist operations from M2: RECEPTIONIST, MANAGER, ADMIN
                        .requestMatchers("/api/v1/receptionist/**").hasAnyRole("RECEPTIONIST", "MANAGER", "ADMIN")

                        // Customer retreat booking detail lookup: accessible to CUSTOMER (for own booking) and RECEPTIONIST, MANAGER, ADMIN
                        .requestMatchers(HttpMethod.GET, "/api/v1/customer/bookings/*").hasAnyRole("CUSTOMER", "RECEPTIONIST", "MANAGER", "ADMIN")

                        // Customer retreat bookings from M2: requires CUSTOMER, MANAGER or ADMIN
                        .requestMatchers("/api/v1/customer/bookings/**").hasAnyRole("CUSTOMER", "MANAGER", "ADMIN")

                        // Therapist operations from M3
                        .requestMatchers("/api/v1/therapist/**").hasAnyRole("THERAPIST", "MANAGER", "ADMIN")

                        // Customer and receptionist SPA operations from M3
                        .requestMatchers("/api/v1/spa/**").hasAnyRole("CUSTOMER", "RECEPTIONIST", "MANAGER", "ADMIN")

                        // Module 4: F&B Kitchen Display System (KDS) operations: FNB_STAFF, MANAGER, ADMIN
                        .requestMatchers("/api/v1/fnb/kds/**").hasAnyRole("FNB_STAFF", "MANAGER", "ADMIN")

                        // Module 4: F&B Customer ordering operations: CUSTOMER, RECEPTIONIST, MANAGER, ADMIN
                        .requestMatchers("/api/v1/fnb/customer/**").hasAnyRole("CUSTOMER", "RECEPTIONIST", "MANAGER", "ADMIN")

                        // Module 5: VNPay commerce IPN/webhook is authenticated by HMAC-SHA512 checksum, not by JWT
                        .requestMatchers("/api/v1/commerce/payment/webhook/vnpay").permitAll()

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
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}