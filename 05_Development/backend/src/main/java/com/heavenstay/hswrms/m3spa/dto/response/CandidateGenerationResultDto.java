package com.heavenstay.hswrms.m3spa.dto.response;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

public class CandidateGenerationResultDto {
    private Integer treatmentId;
    private LocalDate requestedDate;
    private boolean hasAvailability;
    private List<SchedulingCandidateDto> candidates = new ArrayList<>();
    private List<SchedulingCandidateDto> alternatives = new ArrayList<>();

    public CandidateGenerationResultDto() {
    }

    public CandidateGenerationResultDto(Integer treatmentId, LocalDate requestedDate, boolean hasAvailability,
                                        List<SchedulingCandidateDto> candidates,
                                        List<SchedulingCandidateDto> alternatives) {
        this.treatmentId = treatmentId;
        this.requestedDate = requestedDate;
        this.hasAvailability = hasAvailability;
        this.candidates = candidates != null ? candidates : new ArrayList<>();
        this.alternatives = alternatives != null ? alternatives : new ArrayList<>();
    }

    public Integer getTreatmentId() {
        return treatmentId;
    }

    public void setTreatmentId(Integer treatmentId) {
        this.treatmentId = treatmentId;
    }

    public LocalDate getRequestedDate() {
        return requestedDate;
    }

    public void setRequestedDate(LocalDate requestedDate) {
        this.requestedDate = requestedDate;
    }

    public boolean isHasAvailability() {
        return hasAvailability;
    }

    public void setHasAvailability(boolean hasAvailability) {
        this.hasAvailability = hasAvailability;
    }

    public List<SchedulingCandidateDto> getCandidates() {
        return candidates;
    }

    public void setCandidates(List<SchedulingCandidateDto> candidates) {
        this.candidates = candidates;
    }

    public List<SchedulingCandidateDto> getAlternatives() {
        return alternatives;
    }

    public void setAlternatives(List<SchedulingCandidateDto> alternatives) {
        this.alternatives = alternatives;
    }
}
