package com.heavenstay.hswrms.m3spa.dto.response;

public class RecoveryResultDto {

    private Long sessionId;
    private boolean recovered;
    private boolean preservedSameTime;
    private boolean requiresCustomerConsent;
    private Integer replacementTherapistId;
    private Integer replacementRoomId;
    private String message;

    public RecoveryResultDto() {
    }

    public RecoveryResultDto(Long sessionId, boolean recovered, boolean preservedSameTime,
                             boolean requiresCustomerConsent, Integer replacementTherapistId,
                             Integer replacementRoomId, String message) {
        this.sessionId = sessionId;
        this.recovered = recovered;
        this.preservedSameTime = preservedSameTime;
        this.requiresCustomerConsent = requiresCustomerConsent;
        this.replacementTherapistId = replacementTherapistId;
        this.replacementRoomId = replacementRoomId;
        this.message = message;
    }

    public Long getSessionId() {
        return sessionId;
    }

    public void setSessionId(Long sessionId) {
        this.sessionId = sessionId;
    }

    public boolean isRecovered() {
        return recovered;
    }

    public void setRecovered(boolean recovered) {
        this.recovered = recovered;
    }

    public boolean isPreservedSameTime() {
        return preservedSameTime;
    }

    public void setPreservedSameTime(boolean preservedSameTime) {
        this.preservedSameTime = preservedSameTime;
    }

    public boolean isRequiresCustomerConsent() {
        return requiresCustomerConsent;
    }

    public void setRequiresCustomerConsent(boolean requiresCustomerConsent) {
        this.requiresCustomerConsent = requiresCustomerConsent;
    }

    public Integer getReplacementTherapistId() {
        return replacementTherapistId;
    }

    public void setReplacementTherapistId(Integer replacementTherapistId) {
        this.replacementTherapistId = replacementTherapistId;
    }

    public Integer getReplacementRoomId() {
        return replacementRoomId;
    }

    public void setReplacementRoomId(Integer replacementRoomId) {
        this.replacementRoomId = replacementRoomId;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
