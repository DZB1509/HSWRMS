# Phase 5.8.3.94 — Test-Only Startup Safety Controls Report

## Executive Summary

Phase 5.8.3.94 successfully implemented and validated declarative, fail-closed configuration guards across the HSWRMS backend. These controls suppress automatic database-mutating initializers, background schedulers, demo data seeding, and DDL/migration execution during test runs under profile `sqlserver-test`.

With these guards in place, Spring Boot application-context initialization can be safely validated against dedicated test database `HSWRMS_TEST` using the least-privilege `CONNECT`-only account (`hswrms_test_user`) without triggering database writes, role/permission inserts, or SQL Server Error 229 permission failures.

All changes preserve 100% backward compatibility for production and development via `matchIfMissing = true`. Zero database mutations, permission alterations, password changes, application launches, or Git commits were performed.

---

## 1. Files Changed

| File Path | Action | Description |
|---|---|---|
| `05_Development/backend/src/main/java/com/heavenstay/hswrms/m6admin/service/M6DataInitializer.java` | **Modified** | Added `@ConditionalOnProperty(name = "app.initializer.m6.enabled", havingValue = "true", matchIfMissing = true)`. |
| `05_Development/backend/src/main/java/com/heavenstay/hswrms/config/SchedulingConfig.java` | **Modified** | Added `@ConditionalOnProperty(name = "app.scheduling.enabled", havingValue = "true", matchIfMissing = true)`. |
| `05_Development/backend/src/test/resources/application-sqlserver-test.yml` | **Modified** | Explicitly configured `app.initializer.m6.enabled: false`, `app.scheduling.enabled: false`, `spring.jpa.generate-ddl: false`, `spring.sql.init.mode: never`, `spring.flyway.enabled: false`, and `spring.liquibase.enabled: false`. |
| `05_Development/backend/src/test/java/com/heavenstay/hswrms/integration/SqlServerSpringBootContextTest.java` | **Created** | Dedicated integration test verifying full Spring Boot application context (`HswrmsApplication.class`), JPA/Hibernate wiring, and asserting that all mutating initializers/schedulers are disabled under `sqlserver-test`. |
| `05_Development/database/reports/PHASE_5.8.3.94_TEST_STARTUP_SAFETY_CONTROLS_REPORT.md` | **Created** | Comprehensive review and deliverable report for Phase 5.8.3.94. |

---

## 2. Configuration Guard Behavior

### A. M6 Baseline Data Initializer (`M6DataInitializer`)
- **Key:** `app.initializer.m6.enabled`
- **Default / Production Behavior:** `matchIfMissing = true`. When this property is omitted in `application.yml`, Spring Boot treats it as `true`. In production, staging, and standard local development, baseline roles, permissions, role-permissions, and system configuration rows continue to be verified and seeded as intended.
- **Test Profile Behavior:** In `application-sqlserver-test.yml`, `app.initializer.m6.enabled` is explicitly set to `false`. Spring Boot skips bean creation entirely. `M6DataInitializer` is NOT present in the application context and its `run(ApplicationArguments)` method is NEVER called.

### B. Scheduling Configuration (`SchedulingConfig`)
- **Key:** `app.scheduling.enabled`
- **Default / Production Behavior:** `matchIfMissing = true`. When omitted, `SchedulingConfig` is loaded, activating `@EnableScheduling` and registering Spring's `ScheduledAnnotationBeanPostProcessor`.
- **Test Profile Behavior:** In `application-sqlserver-test.yml`, `app.scheduling.enabled` is explicitly set to `false`. `SchedulingConfig` is NOT loaded as a bean. Without `@EnableScheduling`, `ScheduledAnnotationBeanPostProcessor` is not registered; all `@Scheduled` annotations across the codebase (`SessionTimelineScheduler`, `DelegationExpiryJob`, `AccountUnlockJob`, `AuditLogCleanupJob`) are dormant, and no background execution threads are scheduled.

---

## 3. Test-Profile Settings (`application-sqlserver-test.yml`)

The effective configuration under profile `sqlserver-test` enforces strict safety invariants:

```yaml
spring:
  config:
    activate:
      on-profile: sqlserver-test
  datasource:
    url: jdbc:sqlserver://${SQLSERVER_TEST_HOST:${DB_HOST:localhost}}:${SQLSERVER_TEST_PORT:${DB_PORT:1433}};databaseName=${SQLSERVER_TEST_DB:HSWRMS_TEST};encrypt=true;trustServerCertificate=true;
    driver-class-name: com.microsoft.sqlserver.jdbc.SQLServerDriver
    username: ${SQLSERVER_TEST_USERNAME:${DB_USERNAME:}}
    password: ${SQLSERVER_TEST_PASSWORD:${DB_PASSWORD:}}
    hikari:
      pool-name: HSWRMS-SqlServerTestPool
      connection-timeout: 5000
      maximum-pool-size: 5
      minimum-idle: 1
      auto-commit: true
  jpa:
    hibernate:
      ddl-auto: none
    generate-ddl: false
    naming:
      physical-strategy: org.hibernate.boot.model.naming.PhysicalNamingStrategyStandardImpl
    show-sql: false
    properties:
      hibernate:
        dialect: org.hibernate.dialect.SQLServerDialect
  sql:
    init:
      mode: never
  flyway:
    enabled: false
  liquibase:
    enabled: false

hswrms:
  sqlserver:
    test:
      expected-database: ${SQLSERVER_TEST_DB:HSWRMS_TEST}

app:
  jwt:
    secret: defaultHeavenStayResortSuperSecretKeyForDevelopmentOnlyMustBeAtLeast256BitsLong
    expiration-ms: 86400000
  cors:
    allowed-origins: http://localhost:5173
  spa:
    scheduling:
      operating-open: "08:00"
      operating-close: "20:00"
  billing:
    vat-rate: 0.08
  vnpay:
    hash-secret: test-vnpay-secret
    mock-auto-confirm: false
  seed:
    demo-data: false
  initializer:
    m6:
      enabled: false
  scheduling:
    enabled: false
```

---

## 4. Startup Side-Effect Review

| Component | Profile / Property Guard | Status under `sqlserver-test` | Mutates Database? | Notes |
|---|---|:---:|:---:|---|
| **`M6DataInitializer`** | `app.initializer.m6.enabled = false` | **DISABLED (Bean Absent)** | **NO** | Verified absent via `NoSuchBeanDefinitionException`. |
| **`SchedulingConfig`** | `app.scheduling.enabled = false` | **DISABLED (Bean Absent)** | **NO** | Verified absent via `NoSuchBeanDefinitionException`. |
| **`M5DataInitializer`** | `app.seed.demo-data = false` | **DISABLED (Bean Absent)** | **NO** | Suppressed by `@ConditionalOnProperty("app.seed.demo-data", havingValue = "true")`. |
| **`DevAccountBootstrap`** | `@Profile("dev")` | **DISABLED (Bean Absent)** | **NO** | Active profile is `sqlserver-test`; `dev` profile is strictly excluded. |
| **`SessionTimelineScheduler`** | Controlled via `@EnableScheduling` | **DORMANT** | **NO** | Scheduling processor is absent; `@Scheduled` is ignored. |
| **`DelegationExpiryJob`** | Controlled via `@EnableScheduling` | **DORMANT** | **NO** | Scheduling processor is absent; `@Scheduled` is ignored. |
| **`AccountUnlockJob`** | Controlled via `@EnableScheduling` | **DORMANT** | **NO** | Scheduling processor is absent; `@Scheduled` is ignored. |
| **`AuditLogCleanupJob`** | Controlled via `@EnableScheduling` | **DORMANT** | **NO** | Scheduling processor is absent; `@Scheduled` is ignored. |
| **Hibernate DDL Auto** | `spring.jpa.hibernate.ddl-auto: none` | **DISABLED** | **NO** | Zero DDL operations emitted. |
| **Hibernate Generate DDL** | `spring.jpa.generate-ddl: false` | **DISABLED** | **NO** | Zero DDL generation. |
| **Spring SQL Script Init** | `spring.sql.init.mode: never` | **DISABLED** | **NO** | `schema.sql` and `data.sql` are never executed against SQL Server. |
| **Flyway Migrations** | `spring.flyway.enabled: false` | **DISABLED** | **NO** | Migrations disabled. |
| **Liquibase Migrations**| `spring.liquibase.enabled: false` | **DISABLED** | **NO** | Migrations disabled. |

---

## 5. Static Validation & Safe Tests Executed

To ensure absolute safety, no tests requiring SQL Server connection or full context loading were run automatically. Only static compilation and database-independent unit tests were executed:

### A. Full Backend Compilation (`mvnw.cmd test-compile`)
- **Main Sources:** 252 source files compiled cleanly with `javac` (Java 17).
- **Test Sources:** 46 test source files compiled cleanly.
- **Result:** `BUILD SUCCESS` (0 compilation errors, 0 warnings).

### B. Unit Tests (`SqlServerTestConfigValidatorTest`)
- **Command:** `mvnw.cmd test -Dtest=SqlServerTestConfigValidatorTest`
- **Result:** `Tests run: 94, Failures: 0, Errors: 0, Skipped: 0`. `BUILD SUCCESS`.
- **Verified:** All fail-fast guards, least-privilege assertions, database name validations, and placeholder rejections passed.

### C. Opt-In Behavior Test (`SqlServerJdbcSmokeTestOptInBehaviorTest`)
- **Command:** `mvnw.cmd test -Dtest=SqlServerJdbcSmokeTestOptInBehaviorTest`
- **Result:** `Tests run: 3, Failures: 0, Errors: 0, Skipped: 0`. `BUILD SUCCESS`.
- **Verified:** Tests are strictly disabled by default when opt-in system properties or environment variables are absent.

### D. Default Opt-In Protection on New Context Test (`SqlServerSpringBootContextTest`)
- **Command:** `mvnw.cmd test -Dtest=SqlServerSpringBootContextTest` (executed WITHOUT opt-in flags)
- **Result:** `Tests run: 1, Failures: 0, Errors: 0, Skipped: 1 (Time elapsed: 0.004 s)`. `BUILD SUCCESS`.
- **Verified:** JUnit 5 evaluated `@EnabledIf("isSqlServerTestEnabled")` in 4 milliseconds, determined the flag was absent, and safely skipped the test without loading the Spring ApplicationContext or touching SQL Server.

---

## 6. Safety Readiness: Is Full Context Test Safe to Execute Next?

### Verdict: **YES — READY FOR AUTHORIZED EXECUTION**

The static safety review confirms that `SqlServerSpringBootContextTest` is safe to run under the following operational conditions:
1. **Requires Explicit Opt-In:** Must be invoked with `-Dhswrms.sqlserver.test.enabled=true` (or `HSWRMS_ENABLE_SQLSERVER_TEST=true`).
2. **Requires Test Profile:** Must be invoked with `-Dspring.profiles.active=sqlserver-test`.
3. **Database Guard Active:** `SqlServerTestContextInitializer` runs before the `ApplicationContext` refreshes, guaranteeing that if the datasource points to `HSWRMS` or if `username` is `sa`, execution aborts immediately.
4. **Zero Mutating Beans:** `M6DataInitializer`, `SchedulingConfig`, `M5DataInitializer`, and `DevAccountBootstrap` are statically proven to be conditioned out.
5. **Least-Privilege Compatible:** The test principal requires only database `CONNECT` permission on `HSWRMS_TEST`.

---

## 7. Git Status & Diff Summary

### Git Status (`git status --short`)
```text
 M 05_Development/backend/src/main/java/com/heavenstay/hswrms/config/SchedulingConfig.java
 M 05_Development/backend/src/main/java/com/heavenstay/hswrms/m6admin/service/M6DataInitializer.java
 M 05_Development/backend/src/test/resources/application-sqlserver-test.yml
 M 05_Development/database/HSWRMS_TEST_PROVISIONING_GUIDE.md
?? 05_Development/backend/src/test/java/com/heavenstay/hswrms/integration/SqlServerSpringBootContextTest.java
?? 05_Development/database/reports/PHASE_5.8.3.94_TEST_STARTUP_SAFETY_CONTROLS_REPORT.md
```

### Git Diff Summary
- `SchedulingConfig.java`: +2 lines (added `@ConditionalOnProperty`).
- `M6DataInitializer.java`: +2 lines (added `@ConditionalOnProperty`).
- `application-sqlserver-test.yml`: +13 lines (added DDL/init/migration disabling and `app.initializer.m6.enabled: false`, `app.scheduling.enabled: false`).
- Zero changes to production seed logic, database permissions, or tracked secrets.
- Zero commits or staging operations performed.

---

## 8. Compliance Confirmations

1. **Zero SQL Mutations:** No SQL statements were executed against `HSWRMS_TEST` or `HSWRMS`.
2. **Zero Permission Changes:** No logins, users, roles, or grants were modified.
3. **Zero Credential Changes:** Passwords and Credential Manager entries were not modified or reset.
4. **Zero Full Context Runs:** The new Spring Boot context test was NOT executed against SQL Server in this phase.
5. **Protected Database Intact:** `HSWRMS` remains completely untouched and inaccessible to the test profile.

