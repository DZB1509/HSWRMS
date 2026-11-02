package com.heavenstay.hswrms.m3spa.service;

import com.heavenstay.hswrms.m3spa.entity.SpaDispatchOutboxEntity;

/** Dispatch boundary for outbox rows created from accepted schedule events. */
public interface SpaAcceptedScheduleOutboxDispatcher {
    void dispatch(SpaDispatchOutboxEntity outbox);
}
