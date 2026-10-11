# HSWRMS - M1 Session Handoff (updated 2026-10-12, branch DucHoangM1)

Status: checkpoint commit for registration + email OTP verification. No E2E claimed.

## 1. Branch

- Branch: DucHoangM1 (must remain; do not switch).
- Baseline HEAD before checkpoint: a3f82d9.

## 2. What this checkpoint includes


- POST /api/v1/auth/register (existing flow, transactional).
- POST /api/v1/auth/verify-email (new): email + 6-digit OTP.
- verifyEmail uses PasswordEncoder.matches only; MAX_OTP_ATTEMPTS=5.
- Failed attempts commit via Transactional noRollbackFor BusinessRuleException.
- Locked single-row OTP read: findLatestUnconsumedOtpForUpdate + Limit.of(1) + PESSIMISTIC_WRITE.
- ConcurrencyFailureException maps to 503 SERVICE_BUSY (retryable).
- Exact SecurityConfig permitAll for POST register and POST verify-email only.

## 3. Test and build results

- mvnw.cmd test: BUILD SUCCESS; Tests run 13, Failures 0, Errors 0.
- AuthServiceTest: 10 tests (2 register + 8 verify). HswrmsApplicationTests: 3 tests.
- The 2 extra blocker-fix tests (Limit contract + lock-error mapping) are NOT in the file yet.
- Known H2-only warning (non-fatal): Schema DBO not found for dbo health_data_deletion_request.

## 4. Explicitly unverified

- No live SQL Server E2E (register/verify/login) has been run.
- UPDLOCK rendering, attempt_count commit-on-400, and concurrent double-submit are reasoned, not observed.
- Frontend auth pages remain fully mocked; no backend login/JWT endpoint exists.
- Port 8080 was occupied by PID 22668 (java.exe); not stopped or identified.

## 5. Excluded from commit

- auth-test.http: temporary scratch file, left untracked.
- _draft_m1_identity_health_profile.sql: unsafe draft migration, left uncommitted.
- No credentials, OTP values, tokens, or secrets are committed.

## 6. Next tasks in priority order

1. Add the 2 missing blocker-fix tests (Limit contract + 503 mapping).
2. Resolve port 8080 / PID 22668, then run dev-profile SQL Server E2E.
3. Design and approve backend login/JWT before frontend wiring.
4. Wire frontend register/verify/login to apiClient (separate approved change).
5. Decide resend-OTP scope separately; exhausted accounts stay PENDING.

## 7. Resume commands

- git branch --show-current; git status --short
- cd 05_Development/backend; mvnw.cmd test
- Backend dev run needs DB_* env vars plus --spring.profiles.active=dev.
- Never run the draft OTP migration; never commit secrets.
