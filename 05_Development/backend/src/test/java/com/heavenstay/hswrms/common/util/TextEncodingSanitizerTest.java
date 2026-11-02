package com.heavenstay.hswrms.common.util;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.nio.charset.StandardCharsets;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class TextEncodingSanitizerTest {

    @Test
    @DisplayName("Should auto-heal Vietnamese UTF-8 strings corrupted by ISO-8859-1")
    void shouldHealMojibakeStrings() {
        String original = "Cá Chẽm Vịnh Vĩnh Hy Hấp Trà Xanh & Gừng Non";
        // Simulate corruption: UTF-8 bytes read as ISO-8859-1 (Latin-1)
        String corrupted = new String(original.getBytes(StandardCharsets.UTF_8), StandardCharsets.ISO_8859_1);

        String healed = TextEncodingSanitizer.sanitize(corrupted);
        assertEquals(original, healed);
    }

    @Test
    @DisplayName("Should heal other common menu and ingredient names")
    void shouldHealCommonNames() {
        String[] samples = {
            "Cơm Gạo Lứt Đỏ Hạt Sen & Hạt Kê Dưỡng Sinh",
            "Chè Yến Ngũ Vị & Hạt Sen Long Nhãn",
            "Salad Rau Rừng Núi Chúa & Sốt Mè Rang Hữu Cơ",
            "Súp Bí Đỏ Hạnh Nhân & Nấm Đông Cô",
            "Trà Thảo Mộc An Miên Hoa Cúc & Táo Đỏ"
        };

        for (String sample : samples) {
            String corrupted = new String(sample.getBytes(StandardCharsets.UTF_8), StandardCharsets.ISO_8859_1);
            assertEquals(sample, TextEncodingSanitizer.sanitize(corrupted));
        }
    }

    @Test
    @DisplayName("Should leave already clean Vietnamese strings untouched")
    void shouldLeaveCleanStringsUntouched() {
        String clean = "Cơm Gạo Lứt Đỏ Hạt Sen & Hạt Kê Dưỡng Sinh";
        assertEquals(clean, TextEncodingSanitizer.sanitize(clean));
    }
}
