package com.heavenstay.hswrms.m3spa.dto.request;

public class ConfirmAttendanceRequest {
    private String note;

    public ConfirmAttendanceRequest() {
    }

    public ConfirmAttendanceRequest(String note) {
        this.note = note;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }
}
