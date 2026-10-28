package com.heavenstay.hswrms.m4fnb.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

public class CreateAlaCarteRequest {

    @NotNull(message = "retreatBookingId is required")
    private Integer retreatBookingId;

    private LocalDate orderDate;
    private String targetTime;
    private String location;

    @NotEmpty(message = "items must not be empty")
    @Valid
    private List<AlaCarteItemRequest> items = new ArrayList<>();

    public CreateAlaCarteRequest() {}

    public CreateAlaCarteRequest(Integer retreatBookingId, LocalDate orderDate, String targetTime,
                                 String location, List<AlaCarteItemRequest> items) {
        this.retreatBookingId = retreatBookingId;
        this.orderDate = orderDate;
        this.targetTime = targetTime;
        this.location = location;
        this.items = items != null ? items : new ArrayList<>();
    }

    public Integer getRetreatBookingId() {
        return retreatBookingId;
    }

    public void setRetreatBookingId(Integer retreatBookingId) {
        this.retreatBookingId = retreatBookingId;
    }

    public LocalDate getOrderDate() {
        return orderDate;
    }

    public void setOrderDate(LocalDate orderDate) {
        this.orderDate = orderDate;
    }

    public String getTargetTime() {
        return targetTime;
    }

    public void setTargetTime(String targetTime) {
        this.targetTime = targetTime;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public List<AlaCarteItemRequest> getItems() {
        return items;
    }

    public void setItems(List<AlaCarteItemRequest> items) {
        this.items = items != null ? items : new ArrayList<>();
    }
}
