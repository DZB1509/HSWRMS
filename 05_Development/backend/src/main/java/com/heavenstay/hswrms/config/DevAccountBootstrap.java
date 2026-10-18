package com.heavenstay.hswrms.config;

import com.heavenstay.hswrms.m1identity.entity.ConsentRecord;
import com.heavenstay.hswrms.m1identity.entity.CustomerProfile;
import com.heavenstay.hswrms.m1identity.entity.Role;
import com.heavenstay.hswrms.m1identity.entity.User;
import com.heavenstay.hswrms.m1identity.entity.UserRole;
import com.heavenstay.hswrms.m1identity.repository.ConsentRecordRepository;
import com.heavenstay.hswrms.m1identity.repository.CustomerProfileRepository;
import com.heavenstay.hswrms.m1identity.repository.RoleRepository;
import com.heavenstay.hswrms.m1identity.repository.UserRepository;
import com.heavenstay.hswrms.m1identity.repository.UserRoleRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

/**
 * Dev-profile startup bootstrap for Identity & Access (M1).
 *
 * <p>Ensures a freshly cloned environment can demonstrate real JWT login for
 * every system role with zero manual database work: seeds the six canonical
 * roles from {@code schema.sql} section 9 (case-insensitive lookup, with
 * aliases such as FB_STAFF) and one ACTIVE, e-mail-verified demo account per
 * role sharing {@link #DEMO_PASSWORD}. The customer seed also receives a
 * CustomerProfile and the provisional ToS consent, mirroring
 * {@code AuthService.registerGuest}.</p>
 *
 * <p>Idempotent: never overwrites an existing password/status; only adds
 * missing role/profile/consent rows. Runs only under {@code dev} (the default
 * profile in application.yml) — production must run a non-dev profile so no
 * demo account is ever created there.</p>
 */
@Component
@Profile("dev")
public class DevAccountBootstrap implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DevAccountBootstrap.class);

    /** Shared password for all seeded demo accounts (dev-only convenience). */
    static final String DEMO_PASSWORD = "DevDemo123!";

    /** Mirrors AuthService.TOS_CONSENT_TYPE / TOS_POLICY_VERSION (R9-B). */
    private static final String TOS_CONSENT_TYPE = "TO_SERVICE";
    private static final String TOS_POLICY_VERSION = "v1.0";

    /** Canonical role seed — names and descriptions match schema.sql section 9. */
    private record RoleSeed(String canonicalName, List<String> aliases, String description) {
    }

    /** One demo login per role; only the customer seed gets a profile + consent. */
    private record AccountSeed(String email, String fullName, String roleName, boolean customer) {
    }

    private static final List<RoleSeed> ROLE_SEEDS = List.of(
            new RoleSeed("Customer", List.of(), "Authenticated resort customer."),
            new RoleSeed("Receptionist", List.of(), "Front-desk and stay operations staff."),
            new RoleSeed("Therapist", List.of(), "Spa Therapist / Yoga Instructor."),
            new RoleSeed("F&B Staff", List.of("FB_STAFF"), "Food and beverage operational staff / Chef."),
            new RoleSeed("Manager", List.of(), "Management monitoring and approved delegated functions."),
            new RoleSeed("Admin", List.of(), "System administration and governance.")
    );

    private static final List<AccountSeed> ACCOUNT_SEEDS = List.of(
            new AccountSeed("customer@heavenstay.dev", "Demo Customer", "Customer", true),
            new AccountSeed("receptionist@heavenstay.dev", "Demo Receptionist", "Receptionist", false),
            new AccountSeed("therapist@heavenstay.dev", "Demo Therapist", "Therapist", false),
            new AccountSeed("fbstaff@heavenstay.dev", "Demo F&B Staff", "F&B Staff", false),
            new AccountSeed("manager@heavenstay.dev", "Demo Manager", "Manager", false),
            new AccountSeed("admin@heavenstay.dev", "Demo Administrator", "Admin", false)
    );

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final UserRoleRepository userRoleRepository;
    private final CustomerProfileRepository customerProfileRepository;
    private final ConsentRecordRepository consentRecordRepository;
    private final PasswordEncoder passwordEncoder;

    public DevAccountBootstrap(RoleRepository roleRepository, UserRepository userRepository,
                               UserRoleRepository userRoleRepository,
                               CustomerProfileRepository customerProfileRepository,
                               ConsentRecordRepository consentRecordRepository,
                               PasswordEncoder passwordEncoder) {
        this.roleRepository = roleRepository;
        this.userRepository = userRepository;
        this.userRoleRepository = userRoleRepository;
        this.customerProfileRepository = customerProfileRepository;
        this.consentRecordRepository = consentRecordRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(ApplicationArguments args) {
        try {
            seedRoles();
            int created = seedAccounts();
            log.info("HSWRMS dev demo accounts ready ({} newly created). Password for all: {}",
                    created, DEMO_PASSWORD);
            for (AccountSeed seed : ACCOUNT_SEEDS) {
                log.info("  login ready: {} ({})", seed.email(), seed.roleName());
            }
        } catch (Exception ex) {
            log.warn("Dev account bootstrap skipped: {}. Demo logins stay unavailable until the "
                            + "database is reachable and database/schema.sql has been applied.",
                    ex.getMessage());
        }
    }

    private void seedRoles() {
        for (RoleSeed seed : ROLE_SEEDS) {
            if (findRole(seed).isEmpty()) {
                roleRepository.save(new Role(seed.canonicalName(), seed.description()));
                log.info("Seeded system role '{}'", seed.canonicalName());
            }
        }
    }

    private Optional<Role> findRole(RoleSeed seed) {
        Optional<Role> role = roleRepository.findByRoleNameIgnoreCase(seed.canonicalName());
        if (role.isPresent()) {
            return role;
        }
        for (String alias : seed.aliases()) {
            role = roleRepository.findByRoleNameIgnoreCase(alias);
            if (role.isPresent()) {
                return role;
            }
        }
        return Optional.empty();
    }

    /** Resolves a canonical role name (with alias fallback) for an account seed. */
    private Optional<Role> findAccountRole(String canonicalName) {
        return ROLE_SEEDS.stream()
                .filter(seed -> seed.canonicalName().equalsIgnoreCase(canonicalName))
                .findFirst()
                .flatMap(this::findRole)
                .or(() -> roleRepository.findByRoleNameIgnoreCase(canonicalName));
    }

    private int seedAccounts() {
        int created = 0;
        for (AccountSeed seed : ACCOUNT_SEEDS) {
            try {
                if (seedAccount(seed)) {
                    created++;
                }
            } catch (Exception ex) {
                log.warn("Could not seed demo account {}: {}", seed.email(), ex.getMessage());
            }
        }
        return created;
    }

    /** @return true when a new user row was created (false when it already existed). */
    private boolean seedAccount(AccountSeed seed) {
        Role role = findAccountRole(seed.roleName())
                .orElseThrow(() -> new IllegalStateException("Role missing: " + seed.roleName()));

        Optional<User> existing = userRepository.findByEmail(seed.email());
        User user;
        boolean createdNew = existing.isEmpty();
        if (createdNew) {
            user = new User(seed.fullName(), seed.email(), passwordEncoder.encode(DEMO_PASSWORD));
            user.setAccountStatus("ACTIVE");
            user.setEmailVerified(true);
            Instant now = Instant.now();
            user.setCreatedAt(now);
            user.setUpdatedAt(now);
            user = userRepository.save(user);
            log.info("Seeded demo account {} ({})", seed.email(), seed.roleName());
        } else {
            user = existing.get();
        }

        // Heal a partial assignment: add the role only when it is not present yet.
        boolean hasRole = userRoleRepository.findByIdUserId(user.getUserId()).stream()
                .anyMatch(assigned -> role.getRoleId().equals(assigned.getId().getRoleId()));
        if (!hasRole) {
            userRoleRepository.save(new UserRole(user, role));
        }

        if (seed.customer()) {
            if (!customerProfileRepository.existsByUserUserId(user.getUserId())) {
                customerProfileRepository.save(new CustomerProfile(user));
            }
            if (!consentRecordRepository.hasActiveConsent(user.getUserId(), TOS_CONSENT_TYPE)) {
                consentRecordRepository.save(new ConsentRecord(user, TOS_CONSENT_TYPE, TOS_POLICY_VERSION));
            }
        }
        return createdNew;
    }
}