package com.heavenstay.hswrms.config;

import com.heavenstay.hswrms.security.JwtAuthenticationFilter;
import com.heavenstay.hswrms.security.RestAccessDeniedHandler;
import com.heavenstay.hswrms.security.RestAuthenticationEntryPoint;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final RestAuthenticationEntryPoint authenticationEntryPoint;
    private final RestAccessDeniedHandler accessDeniedHandler;

    public SecurityConfig(
            JwtAuthenticationFilter jwtAuthenticationFilter,
            RestAuthenticationEntryPoint authenticationEntryPoint,
            RestAccessDeniedHandler accessDeniedHandler) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.authenticationEntryPoint = authenticationEntryPoint;
        this.accessDeniedHandler = accessDeniedHandler;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(Customizer.withDefaults())
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(exceptions -> exceptions
                        .authenticationEntryPoint(authenticationEntryPoint)
                        .accessDeniedHandler(accessDeniedHandler)
                )
                .authorizeHttpRequests(authorize -> authorize
                        // Public Foundation & Health Endpoints
                        .requestMatchers("/api/v1/health").permitAll()
                        // Public Auth Endpoints (Phase 2 extension)
                        .requestMatchers("/api/v1/auth/**").permitAll()
                        // Public Retreat Packages Catalog (Phase 3 extension)
                        .requestMatchers("/api/v1/packages/**").permitAll()
                        // Module 5: VNPay IPN callback is authenticated by HMAC-SHA512 signature, not by JWT
                        .requestMatchers("/api/v1/commerce/payment/webhook/vnpay").permitAll()
                        // Module 5: analytics are Manager/Admin only
                        .requestMatchers("/api/v1/analytics/**").hasAnyRole("MANAGER", "ADMIN")
                        // Module 5: reviews belong to the authenticated Customer (ownership checked in service)
                        .requestMatchers("/api/v1/customer/reviews/**").hasRole("CUSTOMER")
                        // Module 5: billing requires authentication; per-endpoint role/ownership via @PreAuthorize
                        .requestMatchers("/api/v1/billing/**").authenticated()
                        // Any other request requires valid authentication
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
