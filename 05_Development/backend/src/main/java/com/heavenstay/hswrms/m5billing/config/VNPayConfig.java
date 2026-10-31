package com.heavenstay.hswrms.m5billing.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * VNPay Sandbox parameters for Module 5 (Final Payment). Values come from application.yml (app.vnpay.*),
 * which can be overridden with environment variables (see .env guide).
 */
@Component
public class VNPayConfig {

    private final String tmnCode;
    private final String hashSecret;
    private final String payUrl;
    private final String returnUrl;
    private final String ipnUrl;

    public VNPayConfig(
            @Value("${app.vnpay.tmn-code:CGXZLS0Z}") String tmnCode,
            @Value("${app.vnpay.hash-secret:XNBCJFAKAZQSGGTIIKNBJQVGRHUCXMQN}") String hashSecret,
            @Value("${app.vnpay.pay-url:https://sandbox.vnpayment.vn/paymentv2/vpcpay.html}") String payUrl,
            @Value("${app.vnpay.final-return-url:http://localhost:5173/vnpay-return}") String returnUrl,
            @Value("${app.vnpay.ipn-url:/api/v1/commerce/payment/webhook/vnpay}") String ipnUrl) {
        this.tmnCode = tmnCode == null ? "" : tmnCode.trim();
        this.hashSecret = hashSecret == null ? "" : hashSecret.trim();
        this.payUrl = payUrl;
        this.returnUrl = returnUrl;
        this.ipnUrl = ipnUrl;
    }

    public String getTmnCode() { return tmnCode; }
    public String getHashSecret() { return hashSecret; }
    public String getPayUrl() { return payUrl; }
    public String getReturnUrl() { return returnUrl; }
    public String getIpnUrl() { return ipnUrl; }
}
