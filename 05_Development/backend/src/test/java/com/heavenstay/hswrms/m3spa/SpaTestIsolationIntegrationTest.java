package com.heavenstay.hswrms.m3spa;

import com.heavenstay.hswrms.m3spa.entity.SpaSession;
import com.heavenstay.hswrms.m3spa.entity.SpaDispatchOutboxEntity;
import com.heavenstay.hswrms.m3spa.entity.SpaScheduleHistory;
import com.heavenstay.hswrms.m3spa.entity.enums.SpaSessionStatus;
import com.heavenstay.hswrms.m3spa.port.SpaCalendarPort;
import com.heavenstay.hswrms.m3spa.port.SpaNotificationPort;
import com.heavenstay.hswrms.m3spa.repository.SpaDispatchOutboxRepository;
import com.heavenstay.hswrms.m3spa.repository.SpaScheduleHistoryRepository;
import com.heavenstay.hswrms.m3spa.service.SpaAcceptedScheduleOutboxDispatcher;
import com.heavenstay.hswrms.m3spa.service.event.SpaScheduleAcceptedEvent;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.context.annotation.Import;
import org.springframework.core.env.Environment;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import javax.sql.DataSource;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;

@SpringBootTest
@ActiveProfiles("test")
@Import(SpaTestConfig.class)
class SpaTestIsolationIntegrationTest {
    private static final long SESSION_ID = 1_773_101L;

    @Autowired Environment environment;
    @Autowired ConfigurableApplicationContext applicationContext;
    @Autowired DataSource dataSource;
    @Autowired ApplicationEventPublisher eventPublisher;
    @Autowired SpaScheduleHistoryRepository historyRepository;
    @Autowired SpaDispatchOutboxRepository outboxRepository;
    @Autowired SpaAcceptedScheduleOutboxDispatcher outboxDispatcher;
    @Autowired SpaNotificationPort notificationPort;
    @Autowired SpaCalendarPort calendarPort;
    @Autowired PlatformTransactionManager transactionManager;

    @Test
    void testProfileUsesH2AndDoesNotRegisterScheduledWorkersOrExternalProviders() throws Exception {
        assertThat(environment.getActiveProfiles()).contains("test");
        assertThat(environment.getProperty("app.scheduling.enabled", Boolean.class)).isFalse();
        try (var connection = dataSource.getConnection()) {
            assertThat(connection.getMetaData().getURL()).startsWith("jdbc:h2:mem:");
        }
        assertThat(applicationContext.containsBean("org.springframework.context.annotation.internalScheduledAnnotationProcessor"))
                .isFalse();
        assertThat(outboxDispatcher).isInstanceOf(TestProfileSpaAcceptedScheduleOutboxDispatcher.class);
        assertThat(notificationPort).isInstanceOf(TestProfileSpaNotificationAdapter.class);
        assertThat(calendarPort).isInstanceOf(TestProfileSpaCalendarAdapter.class);
    }

    @Test
    void acceptedSchedulePersistsHistoryAndPendingOutboxWithoutDispatch() {
        publishAcceptedEvent(SESSION_ID);

        List<SpaScheduleHistory> histories = historyRepository.findBySessionIdOrderByHistoryIdAsc(SESSION_ID);
        List<SpaDispatchOutboxEntity> outboxRows = outboxRepository.findBySessionIdOrderByCreatedAtAsc(SESSION_ID);
        assertThat(histories).hasSize(1);
        assertThat(histories.get(0).getChangeType()).isEqualTo("CREATED");
        assertThat(histories.get(0).getNewStatus()).isEqualTo("SCHEDULED");
        assertThat(outboxRows).hasSize(2);
        assertThat(outboxRows).extracting(SpaDispatchOutboxEntity::getChannel)
                .containsExactlyInAnyOrder("CALENDAR", "EMAIL");
        assertThat(outboxRows).allSatisfy(row -> {
            assertThat(row.getSessionId()).isEqualTo(SESSION_ID);
            assertThat(row.getHistoryId()).isEqualTo(histories.get(0).getHistoryId());
            assertThat(row.getStatus()).isEqualTo("PENDING");
            assertThat(row.getCustomerEmail()).isEqualTo("synthetic@example.invalid");
            assertThat(row.getCustomerName()).isEqualTo("Synthetic Customer");
            assertThat(row.getIdempotencyKey()).startsWith("outbox-session-" + SESSION_ID + "-hist-");
            assertThat(row.getChangeType()).isEqualTo("CREATED");
            assertThat(row.getChangeDetails()).isEqualTo("CREATED: isolation-test");
        });
    }

    @Test
    void rollbackRemovesHistoryAndOutboxTogether() {
        long rollbackSessionId = SESSION_ID + 1;
        TransactionTemplate transaction = new TransactionTemplate(transactionManager);
        assertThrows(ForcedRollback.class, () -> transaction.execute(status -> {
            publishAcceptedEvent(rollbackSessionId);
            throw new ForcedRollback();
        }));

        assertThat(historyRepository.findBySessionIdOrderByHistoryIdAsc(rollbackSessionId)).isEmpty();
        assertThat(outboxRepository.findBySessionIdOrderByCreatedAtAsc(rollbackSessionId)).isEmpty();
    }

    private void publishAcceptedEvent(long sessionId) {
        LocalDateTime start = LocalDateTime.of(2027, 1, 10, 10, 0);
        SpaSession session = new SpaSession();
        session.setSpaSessionId(sessionId);
        session.setSessionStatus(SpaSessionStatus.SCHEDULED);
        eventPublisher.publishEvent(new SpaScheduleAcceptedEvent(session, "CREATED", null, "SCHEDULED",
                null, start, null, 81, null, 91, 7, "CUSTOMER", "isolation-test",
                "synthetic@example.invalid", "Synthetic Customer"));
    }

    private static final class ForcedRollback extends RuntimeException { }
}
