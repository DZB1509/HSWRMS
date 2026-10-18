package com.heavenstay.hswrms.config;

import com.heavenstay.hswrms.m1identity.sso.SsoAvailabilityFilter;
import com.heavenstay.hswrms.m1identity.sso.SsoOAuth2FailureHandler;
import com.heavenstay.hswrms.m1identity.sso.SsoOAuth2SuccessHandler;
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
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
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
    private final ClientRegistrationRepository clientRegistrationRepository;

    @Value("${app.sso.frontend-base-url:http://localhost:5173}")
    private String ssoFrontendBaseUrl;

    public SecurityConfig(
            JwtAuthenticationFilter jwtAuthenticationFilter,
            RestAuthenticationEntryPoint authenticationEntryPoint,
            RestAccessDeniedHandler accessDeniedHandler,
            SsoOAuth2SuccessHandler ssoOAuth2SuccessHandler,
            SsoOAuth2FailureHandler ssoOAuth2FailureHandler,
            ClientRegistrationRepository clientRegistrationRepository) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.authenticationEntryPoint = authenticationEntryPoint;
        this.accessDeniedHandler = accessDeniedHandler;
        this.ssoOAuth2SuccessHandler = ssoOAuth2SuccessHandler;
        this.ssoOAuth2FailureHandler = ssoOAuth2FailureHandler;
        this.clientRegistrationRepository = clientRegistrationRepository;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
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

                        // CHANGED: Narrowed from wildcard to exact public registration endpoint
                        .requestMatchers(HttpMethod.POST, "/api/v1/auth/register").permitAll()
                        // Google SSO registration completion (ticket-validated; public like /register)
                        .requestMatchers(HttpMethod.POST, "/api/v1/auth/register/sso").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/v1/auth/verify-email").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/v1/auth/login").permitAll()

                        // Public Retreat Packages Catalog & F&B Package Plans
                        .requestMatchers("/api/v1/packages/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/fnb/packages", "/api/v1/fnb/packages/*").permitAll()

                        // Any other request requires valid authentication
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}