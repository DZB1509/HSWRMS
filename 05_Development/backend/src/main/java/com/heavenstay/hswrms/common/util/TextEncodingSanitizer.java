package com.heavenstay.hswrms.common.util;

import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;

/**
 * Utility to automatically detect and repair mojibake (double-encoded or mis-decoded
 * UTF-8 characters stored as Windows-1252 or ISO-8859-1 in legacy database records).
 */
public final class TextEncodingSanitizer {
    private static final Charset WINDOWS_1252 = Charset.forName("Windows-1252");

    private TextEncodingSanitizer() {}

    /**
     * Sanitizes and auto-heals corrupted Vietnamese characters if mojibake is present.
     * Returns the cleaned string, or the original string if clean or healing fails.
     */
    public static String sanitize(String text) {
        if (text == null || text.isBlank()) {
            return text;
        }

        // Fast detection for common Vietnamese UTF-8 mojibake patterns
        if (!containsMojibakeSignature(text)) {
            return text;
        }

        try {
            // Attempt 1: Re-encode as ISO-8859-1 bytes (lossless 1:1 byte-to-char mapping for 0x00..0xFF)
            String candidateIso = new String(text.getBytes(StandardCharsets.ISO_8859_1), StandardCharsets.UTF_8);
            if (isValidHealing(text, candidateIso)) {
                return candidateIso;
            }
        } catch (Exception ignored) {
        }

        try {
            // Attempt 2: Re-encode as Windows-1252 bytes and interpret as UTF-8
            String candidate = new String(text.getBytes(WINDOWS_1252), StandardCharsets.UTF_8);
            if (isValidHealing(text, candidate)) {
                return candidate;
            }
        } catch (Exception ignored) {
        }

        return text;
    }

    private static boolean containsMojibakeSignature(String text) {
        return text.contains("Ã") || text.contains("Æ") || text.contains("áº")
                || text.contains("á»") || text.contains("Ä‘") || text.contains("Å©")
                || text.contains("â€") || text.contains("Ã¡") || text.contains("Ã©")
                || text.contains("Ã­") || text.contains("Ã³") || text.contains("Ãº")
                || text.contains("Ã½") || text.contains("Ã ") || text.contains("Ã¨")
                || text.contains("Ã²") || text.contains("Ã¹");
    }

    private static boolean isValidHealing(String original, String candidate) {
        // If candidate contains the Unicode replacement character, decoding was lossy
        if (candidate.contains("\uFFFD")) {
            return false;
        }
        // Candidate length must be strictly smaller because multi-char mojibake collapses to 1 character
        return candidate.length() < original.length();
    }
}
