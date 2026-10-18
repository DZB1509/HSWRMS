package com.heavenstay.hswrms.m3spa.service;

import com.heavenstay.hswrms.common.exception.ResourceNotFoundException;
import com.heavenstay.hswrms.m3spa.dto.response.SpaTreatmentDto;
import com.heavenstay.hswrms.m3spa.entity.SpaTreatment;
import com.heavenstay.hswrms.m3spa.entity.enums.TreatmentStatus;
import com.heavenstay.hswrms.m3spa.port.CustomerStayPort;
import com.heavenstay.hswrms.m3spa.port.StayContextDto;
import com.heavenstay.hswrms.m3spa.repository.SpaTreatmentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class SpaTreatmentService {

    private final SpaTreatmentRepository treatmentRepository;
    private final CustomerStayPort customerStayPort;

    public SpaTreatmentService(SpaTreatmentRepository treatmentRepository, CustomerStayPort customerStayPort) {
        this.treatmentRepository = treatmentRepository;
        this.customerStayPort = customerStayPort;
    }

    public List<SpaTreatmentDto> listActiveTreatments(Integer userId) {
        List<SpaTreatment> treatments = treatmentRepository.findByTreatmentStatus(TreatmentStatus.ACTIVE);
        Optional<StayContextDto> stayOpt = userId != null ? customerStayPort.getActiveStayForUser(userId) : Optional.empty();
        Integer packageId = stayOpt.map(StayContextDto::getPackageId).orElse(null);

        return treatments.stream().map(t -> {
            boolean isIncluded = packageId != null && customerStayPort.isTreatmentIncludedInPackage(packageId, t.getTreatmentId());
            return toDto(t, isIncluded);
        }).collect(Collectors.toList());
    }

    public SpaTreatmentDto getTreatmentById(Integer treatmentId, Integer userId) {
        SpaTreatment treatment = treatmentRepository.findById(treatmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Spa Treatment", "treatmentId", treatmentId));

        Optional<StayContextDto> stayOpt = userId != null ? customerStayPort.getActiveStayForUser(userId) : Optional.empty();
        Integer packageId = stayOpt.map(StayContextDto::getPackageId).orElse(null);
        boolean isIncluded = packageId != null && customerStayPort.isTreatmentIncludedInPackage(packageId, treatment.getTreatmentId());

        return toDto(treatment, isIncluded);
    }

    public SpaTreatment getEntityById(Integer treatmentId) {
        return treatmentRepository.findById(treatmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Spa Treatment", "treatmentId", treatmentId));
    }

    private SpaTreatmentDto toDto(SpaTreatment t, boolean isIncluded) {
        return new SpaTreatmentDto(
                t.getTreatmentId(),
                t.getTreatmentName(),
                t.getDurationMinutes(),
                t.getBasePrice(),
                t.getCategory(),
                t.getDescription(),
                isIncluded,
                t.getTreatmentStatus().name()
        );
    }
}
