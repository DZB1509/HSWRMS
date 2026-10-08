package com.heavenstay.hswrms.common.exception;

public class ConflictException extends RuntimeException {

    private final String conflictCode;

    public ConflictException(String message) {
        super(message);
        this.conflictCode = "RESOURCE_CONFLICT";
    }

    public ConflictException(String conflictCode, String message) {
        super(message);
        this.conflictCode = conflictCode;
    }

    public String getConflictCode() {
        return conflictCode;
    }
}
