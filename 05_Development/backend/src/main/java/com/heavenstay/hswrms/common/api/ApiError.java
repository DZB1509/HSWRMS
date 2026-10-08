package com.heavenstay.hswrms.common.api;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

public class ApiError {

    private final Instant timestamp;
    private final int status;
    private final String code;
    private final String message;
    private final String path;
    private final List<ValidationErrorDetail> errors;

    public ApiError(int status, String code, String message, String path) {
        this.timestamp = Instant.now();
        this.status = status;
        this.code = code;
        this.message = message;
        this.path = path;
        this.errors = new ArrayList<>();
    }

    public ApiError(int status, String code, String message, String path, List<ValidationErrorDetail> errors) {
        this.timestamp = Instant.now();
        this.status = status;
        this.code = code;
        this.message = message;
        this.path = path;
        this.errors = errors != null ? errors : new ArrayList<>();
    }

    public Instant getTimestamp() {
        return timestamp;
    }

    public int getStatus() {
        return status;
    }

    public String getCode() {
        return code;
    }

    public String getMessage() {
        return message;
    }

    public String getPath() {
        return path;
    }

    public List<ValidationErrorDetail> getErrors() {
        return errors;
    }
}
