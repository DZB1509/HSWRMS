package com.heavenstay.hswrms.m2booking.dto;

public class AssignVillaRequest {

    private Integer physicalVillaId;

    private String villaNumber;

    private Boolean healthProfileConfirmed = false;

    public AssignVillaRequest() {
    }

    public Integer getPhysicalVillaId() {
        return physicalVillaId;
    }

    public void setPhysicalVillaId(Integer physicalVillaId) {
        this.physicalVillaId = physicalVillaId;
    }

    public String getVillaNumber() {
        return villaNumber;
    }

    public void setVillaNumber(String villaNumber) {
        this.villaNumber = villaNumber;
    }

    public Boolean getHealthProfileConfirmed() {
        return healthProfileConfirmed;
    }

    public void setHealthProfileConfirmed(Boolean healthProfileConfirmed) {
        this.healthProfileConfirmed = healthProfileConfirmed;
    }
}
