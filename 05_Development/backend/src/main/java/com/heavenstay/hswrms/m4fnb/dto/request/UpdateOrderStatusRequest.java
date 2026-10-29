package com.heavenstay.hswrms.m4fnb.dto.request;

import jakarta.validation.constraints.NotBlank;

public record UpdateOrderStatusRequest(@NotBlank String status) { }
