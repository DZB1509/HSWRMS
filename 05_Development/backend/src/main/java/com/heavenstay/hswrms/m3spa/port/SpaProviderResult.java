package com.heavenstay.hswrms.m3spa.port;

/** Provider outcome used by the durable M3 outbox. */
public record SpaProviderResult(Disposition disposition, String externalReference, String detail) {
    public enum Disposition {
        ACCEPTED,
        RETRYABLE_FAILURE,
        PERMANENT_FAILURE,
        AMBIGUOUS,
        SUPPRESSED
    }

    public static SpaProviderResult accepted(String reference) {
        return new SpaProviderResult(Disposition.ACCEPTED, reference, null);
    }

    public static SpaProviderResult retryable(String detail) {
        return new SpaProviderResult(Disposition.RETRYABLE_FAILURE, null, detail);
    }

    public static SpaProviderResult permanent(String detail) {
        return new SpaProviderResult(Disposition.PERMANENT_FAILURE, null, detail);
    }

    public static SpaProviderResult ambiguous(String detail) {
        return new SpaProviderResult(Disposition.AMBIGUOUS, null, detail);
    }

    public static SpaProviderResult suppressed(String detail) {
        return new SpaProviderResult(Disposition.SUPPRESSED, null, detail);
    }
}
