package com.heavenstay.hswrms.m3spa.service;

import com.heavenstay.hswrms.m3spa.entity.SpaDispatchOutboxEntity;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

/** Production dispatch adapter. Test profile replaces this boundary with a no-op. */
@Component
@Profile("!test")
public class ImmediateSpaAcceptedScheduleOutboxDispatcher implements SpaAcceptedScheduleOutboxDispatcher {
    private final SpaDispatchOutboxWorker outboxWorker;

    public ImmediateSpaAcceptedScheduleOutboxDispatcher(SpaDispatchOutboxWorker outboxWorker) {
        this.outboxWorker = outboxWorker;
    }

    @Override
    public void dispatch(SpaDispatchOutboxEntity outbox) {
        outboxWorker.processEntry(outbox);
    }
}
