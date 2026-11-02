package com.heavenstay.hswrms.m1identity.repository;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.heavenstay.hswrms.m1identity.entity.EmailOtp;
import jakarta.persistence.LockModeType;
import java.lang.reflect.Method;
import java.util.Optional;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Limit;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;

/**
 * Plain-reflection contract test for the locked OTP lookup on {@link EmailOtpRepository}.
 * No Spring context is started for annotation inspection.
 *
 * Limitations: this pins the declared locking/query/limit contract of the repository
 * interface only. It does NOT prove that the SQL Server dialect renders TOP (1),
 * UPDLOCK, ROWLOCK, or any specific locking SQL, nor any real concurrent behavior.
 * The call-site limit (Limit.of(1) in AuthService) is asserted separately in
 * {@code AuthServiceTest#testVerifyEmail_LockedOtpLookup_RequestsAtMostOneRow}.
 */
class EmailOtpRepositoryContractTest {

    private static final String LOCKED_LOOKUP_METHOD = "findLatestUnconsumedOtpForUpdate";

    private Method lockedLookup() throws NoSuchMethodException {
        // Fails with NoSuchMethodException (test failure) if the method or its
        // exact parameter types (Integer, String, Limit) do not exist.
        return EmailOtpRepository.class.getMethod(
                LOCKED_LOOKUP_METHOD, Integer.class, String.class, Limit.class);
    }

    @Test
    @DisplayName("findLatestUnconsumedOtpForUpdate exists with (Integer, String, Limit) parameters")
    void lockedLookup_existsWithExpectedParameterTypes() throws Exception {
        Method method = lockedLookup();

        assertEquals(Optional.class, method.getReturnType(),
                "Locked OTP lookup must return Optional<EmailOtp>");
    }

    @Test
    @DisplayName("findLatestUnconsumedOtpForUpdate retains PESSIMISTIC_WRITE lock and its @Query declaration")
    void lockedLookup_retainsPessimisticWriteLockAndQuery() throws Exception {
        Method method = lockedLookup();

        Lock lock = method.getAnnotation(Lock.class);
        assertNotNull(lock, "@Lock annotation must be retained on " + LOCKED_LOOKUP_METHOD);
        assertEquals(LockModeType.PESSIMISTIC_WRITE, lock.value(),
                "Locked OTP lookup must keep PESSIMISTIC_WRITE locking semantics");

        Query query = method.getAnnotation(Query.class);
        assertNotNull(query, "@Query declaration must be retained on " + LOCKED_LOOKUP_METHOD);
        assertFalse(query.value().isBlank(), "@Query JPQL must not be blank");
    }

    @Test
    @DisplayName("findLatestUnconsumedOtpForUpdate signature accepts a Spring Data Limit parameter")
    void lockedLookup_signatureContainsSpringDataLimitParameter() throws Exception {
        Method method = lockedLookup();

        boolean hasLimitParameter = false;
        for (Class<?> parameterType : method.getParameterTypes()) {
            if (Limit.class.equals(parameterType)) {
                hasLimitParameter = true;
                break;
            }
        }
        assertTrue(hasLimitParameter,
                "Method signature must accept a Spring Data Limit parameter to cap the locked read");
    }
}