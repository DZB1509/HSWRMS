package com.heavenstay.hswrms.m4fnb.dto.response;

public record MenuAvailabilityResponse(Integer menuItemId, String itemName,
        boolean recipeConfigured, boolean available, Integer servingsAvailable,
        String availabilityReason) { }
