package com.heavenstay.hswrms.m3spa;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.heavenstay.hswrms.m3spa.dto.response.CandidateGenerationResultDto;
import com.heavenstay.hswrms.m3spa.dto.response.SpaSessionDto;
import com.heavenstay.hswrms.m3spa.service.SchedulingEngineService;
import com.heavenstay.hswrms.m3spa.service.SpaSessionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.LinkedHashMap;
import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.clearInvocations;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Import(SpaTestConfig.class)
class SpaBookingValidationTests {

    private static final String CANDIDATES_URL = "/api/v1/spa/candidates";
    private static final String SESSIONS_URL = "/api/v1/spa/sessions";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private SchedulingEngineService schedulingEngineService;

    @MockBean
    private SpaSessionService spaSessionService;

    @BeforeEach
    void resetMocks() {
        clearInvocations(schedulingEngineService, spaSessionService);
        when(schedulingEngineService.generateCandidates(any())).thenReturn(new CandidateGenerationResultDto());
        when(spaSessionService.confirmReservation(any(), isNull())).thenReturn(new SpaSessionDto());
    }

    @Test
    @WithMockUser(roles = "CUSTOMER")
    void rejectsMissingAndNullConfirmationFieldsBeforeCallingServices() throws Exception {
        Map<String, Object> valid = validConfirmation();
        for (String field : new String[]{"treatmentId", "therapistId", "roomId", "scheduledStartAt", "scheduledEndAt"}) {
            Map<String, Object> missing = new LinkedHashMap<>(valid);
            missing.remove(field);
            assertValidationFailure(SESSIONS_URL, missing);
            verifyNoInteractions(schedulingEngineService, spaSessionService);

            Map<String, Object> explicitNull = new LinkedHashMap<>(valid);
            explicitNull.put(field, null);
            assertValidationFailure(SESSIONS_URL, explicitNull);
            verifyNoInteractions(schedulingEngineService, spaSessionService);
        }
    }

    @Test
    @WithMockUser(roles = "CUSTOMER")
    void rejectsMissingAndNullCandidateFieldsBeforeCallingServices() throws Exception {
        Map<String, Object> valid = Map.of("treatmentId", 1, "preferredDate", "2030-01-02");
        for (String field : new String[]{"treatmentId", "preferredDate"}) {
            Map<String, Object> missing = new LinkedHashMap<>(valid);
            missing.remove(field);
            assertValidationFailure(CANDIDATES_URL, missing);
            verifyNoInteractions(schedulingEngineService, spaSessionService);

            Map<String, Object> explicitNull = new LinkedHashMap<>(valid);
            explicitNull.put(field, null);
            assertValidationFailure(CANDIDATES_URL, explicitNull);
            verifyNoInteractions(schedulingEngineService, spaSessionService);
        }
    }

    @Test
    @WithMockUser(roles = "CUSTOMER")
    void rejectsReversedAndZeroLengthIntervalsBeforeCallingServices() throws Exception {
        Map<String, Object> reversed = validConfirmation();
        reversed.put("scheduledStartAt", "2030-01-02T11:00:00");
        reversed.put("scheduledEndAt", "2030-01-02T10:00:00");
        assertValidationFailure(SESSIONS_URL, reversed);
        verifyNoInteractions(schedulingEngineService, spaSessionService);

        Map<String, Object> zeroLength = validConfirmation();
        zeroLength.put("scheduledStartAt", "2030-01-02T10:00:00");
        zeroLength.put("scheduledEndAt", "2030-01-02T10:00:00");
        assertValidationFailure(SESSIONS_URL, zeroLength);
        verifyNoInteractions(schedulingEngineService, spaSessionService);
    }

    @Test
    @WithMockUser(roles = "CUSTOMER")
    void validRequestsReachTheirControllerServices() throws Exception {
        mockMvc.perform(post(CANDIDATES_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(Map.of("treatmentId", 1, "preferredDate", "2030-01-02"))))
                .andExpect(status().isOk());
        verify(schedulingEngineService).generateCandidates(any());

        mockMvc.perform(post(SESSIONS_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(validConfirmation())))
                .andExpect(status().isCreated());
        verify(spaSessionService).confirmReservation(any(), isNull());
    }

    private void assertValidationFailure(String url, Map<String, Object> body) throws Exception {
        mockMvc.perform(post(url)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(body)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"))
                .andExpect(jsonPath("$.errors").isArray());
    }

    private Map<String, Object> validConfirmation() {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("treatmentId", 1);
        body.put("therapistId", 1);
        body.put("roomId", 1);
        body.put("scheduledStartAt", "2030-01-02T10:00:00");
        body.put("scheduledEndAt", "2030-01-02T11:00:00");
        return body;
    }
}
