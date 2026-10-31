package com.heavenstay.hswrms.m3spa;

import com.heavenstay.hswrms.m3spa.entity.SpaDispatchOutboxEntity;
import com.heavenstay.hswrms.m3spa.service.SpaAcceptedScheduleOutboxDispatcher;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

/** Test-profile dispatch boundary preserves queued rows without invoking providers. */
@Component
@Primary
@Profile("test")
public class TestProfileSpaAcceptedScheduleOutboxDispatcher implements SpaAcceptedScheduleOutboxDispatcher {
    @Override
    public void dispatch(SpaDispatchOutboxEntity outbox) {
        // Deliberately retain the PENDING outbox record for assertions or explicit test dispatch.
    }
}
