package com.heavenstay.hswrms.common.api;

import java.time.Instant;

public class ApiResponse<T> {

    private final Instant timestamp;
    private final boolean success;
    private final String message;
    private final T data;

    public ApiResponse(boolean success, String message, T data) {
        this.timestamp = Instant.now();
        this.success = success;
        this.message = message;
        this.data = data;
    }

    public static <T> ApiResponse<T> ok(T data) {
        return new ApiResponse<>(true, "SUCCESS", data);
    }

    public static <T> ApiResponse<T> ok(String message, T data) {
        return new ApiResponse<>(true, message, data);
    }

    public static <T> ApiResponse<T> created(String message, T data) {
        return new ApiResponse<>(true, message, data);
    }

    public static <T> ApiResponse<T> ok(String message) {
        return new ApiResponse<>(true, message, null);
    }

    public Instant getTimestamp() {
        return timestamp;
    }

    public boolean isSuccess() {
        return success;
    }

    public String getMessage() {
        return message;
    }

    public T getData() {
        return data;
    }
}
