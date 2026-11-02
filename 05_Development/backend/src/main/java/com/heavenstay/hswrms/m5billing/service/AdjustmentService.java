package com.heavenstay.hswrms.m5billing.service;

import com.heavenstay.hswrms.m5billing.dto.*;

import java.util.Collection;
import java.util.List;

public interface AdjustmentService {

    AdjustmentResponseDTO submitAdjustmentRequest(CreateAdjustmentRequestDTO request, Long requestedByUserId);

    AdjustmentResponseDTO processAdjustmentDecision(Long requestId, AdjustmentDecisionDTO decision,
                                                   Long approverUserId, Collection<String> approverRoles);

    List<AdjustmentResponseDTO> getAdjustmentRequestsForFolio(Long folioId);

    List<AdjustmentResponseDTO> getAdjustmentRequestsForBooking(Long retreatBookingId);

    List<AdjustmentResponseDTO> getAdjustmentRequestsByStatus(String status);

    AdjustmentResponseDTO getAdjustmentRequestDetails(Long requestId);

    CreditNoteResponseDTO getCreditNoteDetails(Long creditNoteId);

    CreditNoteResponseDTO getCreditNoteByNumber(String creditNoteNumber);

    List<CreditNoteResponseDTO> getCreditNotesForInvoice(Long invoiceId);

    List<CreditNoteResponseDTO> getCreditNotesByStatus(String status);

    CreditNoteResponseDTO confirmRefundSettlement(Long creditNoteId, SettleRefundDTO settleDTO,
                                                 Long settledByUserId, Collection<String> userRoles);
}
