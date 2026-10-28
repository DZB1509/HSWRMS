package com.heavenstay.hswrms.common.exception;

/**
 * Email-delivery failure for OTP dispatch (SMTP outage, bad credentials,
 * missing provider configuration).
 *
 * <p>Thrown by {@code EmailDeliveryAdapter} implementations instead of a raw
 * {@link IllegalStateException} so the API returns a controlled
 * {@code 503 EMAIL_DELIVERY_FAILED} (retryable infrastructure error) rather
 * than a generic 500 — and so callers never report "OTP dispatched" when no
 * email actually left the server. Carries no OTP, credential, or personal
 * data.</p>
 */
public class EmailDeliveryException extends RuntimeException {

    private static final String CODE = "EMAIL_DELIVERY_FAILED";

    public EmailDeliveryException(String message) {
        super(message);
    }

    public EmailDeliveryException(String message, Throwable cause) {
        super(message, cause);
    }

    public String getErrorCode() {
        return CODE;
    }
}
