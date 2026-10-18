package com.heavenstay.hswrms.m2booking.dto;

import jakarta.validation.constraints.NotNull;

public class AssignVillaRequest {

    @NotNull(message = "Physical Villa ID is required")
    private Integer physicalVillaId;

    public AssignVillaRequest() {
    }

    public Integer getPhysicalVillaId() {
        return physicalVillaId;
    }

    public void setPhysicalVillaId(Integer physicalVillaId) {
        this.physicalVillaId = physicalVillaId;
    }
}
