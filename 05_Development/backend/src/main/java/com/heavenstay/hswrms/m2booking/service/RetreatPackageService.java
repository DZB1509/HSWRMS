package com.heavenstay.hswrms.m2booking.service;

import com.heavenstay.hswrms.common.exception.ResourceNotFoundException;
import com.heavenstay.hswrms.m2booking.dto.RetreatPackageResponse;
import com.heavenstay.hswrms.m2booking.dto.VillaCategoryResponse;
import com.heavenstay.hswrms.m2booking.entity.RetreatPackage;
import com.heavenstay.hswrms.m2booking.entity.VillaCategory;
import com.heavenstay.hswrms.m2booking.repository.RetreatPackageRepository;
import com.heavenstay.hswrms.m2booking.repository.VillaCategoryRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class RetreatPackageService {

    private final RetreatPackageRepository packageRepository;
    private final VillaCategoryRepository villaCategoryRepository;

    public RetreatPackageService(RetreatPackageRepository packageRepository,
                                 VillaCategoryRepository villaCategoryRepository) {
        this.packageRepository = packageRepository;
        this.villaCategoryRepository = villaCategoryRepository;
    }

    public List<RetreatPackageResponse> getAllActivePackages(String wellnessGoal) {
        List<RetreatPackage> packages;
        if (wellnessGoal != null && !wellnessGoal.trim().isEmpty()) {
            packages = packageRepository.findByPackageStatusAndWellnessGoalContainingIgnoreCase("ACTIVE", wellnessGoal.trim());
        } else {
            packages = packageRepository.findByPackageStatus("ACTIVE");
        }
        return packages.stream().map(this::toResponse).collect(Collectors.toList());
    }

    public RetreatPackageResponse getPackageById(Integer id) {
        RetreatPackage pkg = packageRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Retreat package with ID " + id + " not found"));
        return toResponse(pkg);
    }

    public List<VillaCategoryResponse> getAllActiveVillaCategories() {
        return villaCategoryRepository.findByCategoryStatus("ACTIVE")
                .stream()
                .map(this::toCategoryResponse)
                .collect(Collectors.toList());
    }

    public RetreatPackageResponse toResponse(RetreatPackage entity) {
        RetreatPackageResponse res = new RetreatPackageResponse();
        res.setRetreatPackageId(entity.getRetreatPackageId());
        res.setPackageCode(entity.getPackageCode());
        res.setPackageName(entity.getPackageName());
        res.setWellnessGoal(entity.getWellnessGoal());
        res.setDurationNights(entity.getDurationNights());
        res.setDurationUnit(entity.getDurationUnit());
        res.setBasePrice(entity.getBasePrice());
        res.setBasePriceUnit(entity.getBasePriceUnit());
        res.setIncludedTreatments(entity.getIncludedTreatments());
        res.setDietaryPlan(entity.getDietaryPlan());
        res.setExtraChargePolicy(entity.getExtraChargePolicy());
        res.setTargetGuest(entity.getTargetGuest());
        res.setPackageStatus(entity.getPackageStatus());
        if (entity.getEligibleVillaCategories() != null) {
            res.setEligibleVillaCategories(
                    entity.getEligibleVillaCategories().stream()
                            .map(this::toCategoryResponse)
                            .collect(Collectors.toList())
            );
        }
        return res;
    }

    public VillaCategoryResponse toCategoryResponse(VillaCategory entity) {
        VillaCategoryResponse res = new VillaCategoryResponse();
        res.setVillaCategoryId(entity.getVillaCategoryId());
        res.setCategoryName(entity.getCategoryName());
        res.setMaxOccupancy(entity.getMaxOccupancy());
        res.setPriceModifier(entity.getPriceModifier());
        res.setCategoryStatus(entity.getCategoryStatus());
        res.setInventoryCount(entity.getInventoryCount());
        res.setBedroomCount(entity.getBedroomCount());
        res.setBedroomDescription(entity.getBedroomDescription());
        res.setAreaDescription(entity.getAreaDescription());
        res.setHasPrivatePool(entity.getHasPrivatePool());
        res.setPoolDescription(entity.getPoolDescription());
        res.setFeaturesAndAmenities(entity.getFeaturesAndAmenities());
        res.setEligiblePackages(entity.getEligiblePackages());
        return res;
    }
}
