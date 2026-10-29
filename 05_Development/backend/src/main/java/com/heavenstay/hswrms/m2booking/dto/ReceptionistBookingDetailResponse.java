package com.heavenstay.hswrms.m2booking.dto;

import com.heavenstay.hswrms.m2booking.entity.PaymentTransaction;
import com.heavenstay.hswrms.m2booking.service.CustomerIdentityPort;

import java.util.List;

public class ReceptionistBookingDetailResponse extends ReceptionistBookingResponse {

    private CustomerIdentityPort.CustomerFullDetails customerProfile;
    private ResidenceRecordResponse residenceRecord;
    private CustomerIdentityPort.CustomerHealthSummary healthProfile;
    private List<PaymentTransaction> paymentTransactions;

    public ReceptionistBookingDetailResponse() {
    }

    public CustomerIdentityPort.CustomerFullDetails getCustomerProfile() {
        return customerProfile;
    }

    public void setCustomerProfile(CustomerIdentityPort.CustomerFullDetails customerProfile) {
        this.customerProfile = customerProfile;
    }

    public ResidenceRecordResponse getResidenceRecord() {
        return residenceRecord;
    }

    public void setResidenceRecord(ResidenceRecordResponse residenceRecord) {
        this.residenceRecord = residenceRecord;
    }

    public CustomerIdentityPort.CustomerHealthSummary getHealthProfile() {
        return healthProfile;
    }

    public void setHealthProfile(CustomerIdentityPort.CustomerHealthSummary healthProfile) {
        this.healthProfile = healthProfile;
    }

    public List<PaymentTransaction> getPaymentTransactions() {
        return paymentTransactions;
    }

    public void setPaymentTransactions(List<PaymentTransaction> paymentTransactions) {
        this.paymentTransactions = paymentTransactions;
    }
}
