package com.heavenstay.hswrms.m1identity.service;

import com.heavenstay.hswrms.common.exception.ResourceNotFoundException;
import com.heavenstay.hswrms.m1identity.dto.HealthProfileResponse;
import com.heavenstay.hswrms.m1identity.dto.UpdateHealthProfileRequest;
import com.heavenstay.hswrms.m1identity.entity.CustomerProfile;
import com.heavenstay.hswrms.m1identity.entity.DietaryRequirement;
import com.heavenstay.hswrms.m1identity.entity.FoodAllergy;
import com.heavenstay.hswrms.m1identity.entity.HealthProfile;
import com.heavenstay.hswrms.m1identity.entity.HealthProfileTherapyPreference;
import com.heavenstay.hswrms.m1identity.entity.User;
import com.heavenstay.hswrms.m1identity.repository.CustomerProfileRepository;
import com.heavenstay.hswrms.m1identity.repository.DietaryRequirementRepository;
import com.heavenstay.hswrms.m1identity.repository.FoodAllergyRepository;
import com.heavenstay.hswrms.m1identity.repository.HealthProfileRepository;
import com.heavenstay.hswrms.m1identity.repository.HealthProfileTherapyPreferenceRepository;
import com.heavenstay.hswrms.m1identity.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
public class HealthProfileService {
    private final UserRepository userRepository;
    private final CustomerProfileRepository customerProfileRepository;
    private final HealthProfileRepository healthProfileRepository;
    private final FoodAllergyRepository foodAllergyRepository;
    private final DietaryRequirementRepository dietaryRequirementRepository;
    private final HealthProfileTherapyPreferenceRepository therapyPreferenceRepository;
    private final ConsentService consentService;
    private final com.heavenstay.hswrms.m6admin.service.AuditLogService auditLogService;

    @org.springframework.beans.factory.annotation.Autowired
    public HealthProfileService(UserRepository userRepository,
                                CustomerProfileRepository customerProfileRepository,
                                HealthProfileRepository healthProfileRepository,
                                FoodAllergyRepository foodAllergyRepository,
                                DietaryRequirementRepository dietaryRequirementRepository,
                                HealthProfileTherapyPreferenceRepository therapyPreferenceRepository,
                                ConsentService consentService,
                                @org.springframework.beans.factory.annotation.Autowired(required = false) com.heavenstay.hswrms.m6admin.service.AuditLogService auditLogService) {
        this.userRepository = userRepository;
        this.customerProfileRepository = customerProfileRepository;
        this.healthProfileRepository = healthProfileRepository;
        this.foodAllergyRepository = foodAllergyRepository;
        this.dietaryRequirementRepository = dietaryRequirementRepository;
        this.therapyPreferenceRepository = therapyPreferenceRepository;
        this.consentService = consentService;
        this.auditLogService = auditLogService;
    }

    public HealthProfileService(UserRepository userRepository,
                                CustomerProfileRepository customerProfileRepository,
                                HealthProfileRepository healthProfileRepository,
                                FoodAllergyRepository foodAllergyRepository,
                                DietaryRequirementRepository dietaryRequirementRepository,
                                HealthProfileTherapyPreferenceRepository therapyPreferenceRepository,
                                ConsentService consentService) {
        this(userRepository, customerProfileRepository, healthProfileRepository, foodAllergyRepository,
                dietaryRequirementRepository, therapyPreferenceRepository, consentService, null);
    }

    @Transactional(readOnly = true)
    public HealthProfileResponse getMyHealthProfile(Integer userId) {
        User user = loadUser(userId);
        CustomerProfile customerProfile = loadOrCreateCustomerProfile(user);
        HealthProfile profile = healthProfileRepository.findByCustomerProfileId(customerProfile.getCustomerProfileId()).orElse(null);
        boolean consented = consentService.hasActiveConsent(userId, ConsentService.HEALTH_DATA_PROCESSING);
        if (profile != null && auditLogService != null) {
            auditLogService.record(userId, "CUSTOMER", "View Sensitive Health Profile", "DATA_HEALTH_FULL",
                    String.valueOf(profile.getHealthProfileId()), com.heavenstay.hswrms.m6admin.service.AuditLogService.SUCCESS, null, null);
        }
        if (profile == null) { return emptyResponse(consented); }
        return toResponse(profile, consented);
    }
    @Transactional
    public HealthProfileResponse updateMyHealthProfile(Integer userId, UpdateHealthProfileRequest request) {
        consentService.requireActiveConsent(userId, ConsentService.HEALTH_DATA_PROCESSING);
        User user = loadUser(userId);
        CustomerProfile customerProfile = loadOrCreateCustomerProfile(user);
        HealthProfile profile = healthProfileRepository.findByCustomerProfileId(customerProfile.getCustomerProfileId()).orElseGet(() -> healthProfileRepository.save(new HealthProfile(customerProfile)));
        if (request.getCurrentHealthCondition() != null) { profile.setCurrentHealthCondition(norm(request.getCurrentHealthCondition())); }
        if (request.getInjurySurgeryHistory() != null) { profile.setInjurySurgeryHistory(norm(request.getInjurySurgeryHistory())); }
        if (request.getMobilityJointNotes() != null) { profile.setMobilityJointNotes(norm(request.getMobilityJointNotes())); }
        if (request.getCurrentMedications() != null) { profile.setCurrentMedications(norm(request.getCurrentMedications())); }
        if (request.getStressFatigueLevel() != null) { profile.setStressFatigueLevel(request.getStressFatigueLevel()); }
        if (request.getFoodIntoleranceNotes() != null) { profile.setFoodIntoleranceNotes(norm(request.getFoodIntoleranceNotes())); }
        if (request.getDislikedIngredients() != null) { profile.setDislikedIngredients(norm(request.getDislikedIngredients())); }
        if (request.getKitchenNotes() != null) { profile.setKitchenNotes(norm(request.getKitchenNotes())); }
        HealthProfile saved = healthProfileRepository.save(profile);
        if (request.getFoodAllergies() != null) { replaceAllergies(saved, request.getFoodAllergies()); }
        if (request.getDietaryRequirements() != null) { replaceRequirements(saved, request.getDietaryRequirements()); }
        if (request.getTherapyPreferences() != null) { replaceTherapies(saved, request.getTherapyPreferences(), request.getTherapyCode()); }
        HealthProfile updated = healthProfileRepository.save(saved);
        if (auditLogService != null) {
            auditLogService.record(userId, "CUSTOMER", "Update Sensitive Health Profile", "DATA_HEALTH_FULL",
                    String.valueOf(updated.getHealthProfileId()), com.heavenstay.hswrms.m6admin.service.AuditLogService.SUCCESS, null, null);
        }
        return toResponse(updated, true);
    }
    private void replaceAllergies(HealthProfile profile, List<String> names) {
        foodAllergyRepository.deleteByHealthProfileHealthProfileId(profile.getHealthProfileId());
        List<FoodAllergy> rows = new ArrayList<>();
        int order = 0;
        for (String raw : names) {
            String name = raw != null ? raw.trim() : "";
            if (name.isEmpty()) { continue; }
            rows.add(new FoodAllergy(profile, name, order++));
        }
        profile.setFoodAllergies(foodAllergyRepository.saveAll(rows));
    }
    private void replaceRequirements(HealthProfile profile, List<String> names) {
        dietaryRequirementRepository.deleteByHealthProfileHealthProfileId(profile.getHealthProfileId());
        List<DietaryRequirement> rows = new ArrayList<>();
        int order = 0;
        for (String raw : names) {
            String name = raw != null ? raw.trim() : "";
            if (name.isEmpty()) { continue; }
            rows.add(new DietaryRequirement(profile, name, order++));
        }
        profile.setDietaryRequirementsList(dietaryRequirementRepository.saveAll(rows));
    }
    private void replaceTherapies(HealthProfile profile, List<String> labels, String therapyCode) {
        therapyPreferenceRepository.deleteByHealthProfileHealthProfileId(profile.getHealthProfileId());
        List<HealthProfileTherapyPreference> rows = new ArrayList<>();
        int order = 0;
        String code = therapyCode != null && !therapyCode.isBlank() ? therapyCode.trim() : null;
        for (String raw : labels) {
            String label = raw != null ? raw.trim() : "";
            if (label.isEmpty()) { continue; }
            rows.add(new HealthProfileTherapyPreference(profile, label, code, order++));
        }
        profile.setTherapyPreferences(therapyPreferenceRepository.saveAll(rows));
    }
    private User loadUser(Integer userId) {
        return userRepository.findById(userId).orElseThrow(() -> new ResourceNotFoundException("User", "userId", String.valueOf(userId)));
    }
    private CustomerProfile loadOrCreateCustomerProfile(User user) {
        return customerProfileRepository.findByUserId(user.getUserId()).orElseGet(() -> customerProfileRepository.save(new CustomerProfile(user)));
    }
    private String norm(String v) {
        String t = v.trim();
        return t.isEmpty() ? null : t;
    }
    private HealthProfileResponse emptyResponse(boolean consented) {
        HealthProfileResponse r = new HealthProfileResponse();
        r.setFoodAllergies(List.of());
        r.setDietaryRequirements(List.of());
        r.setTherapyPreferences(List.of());
        r.setHasConsented(consented);
        return r;
    }
    private HealthProfileResponse toResponse(HealthProfile p, boolean consented) {
        HealthProfileResponse r = new HealthProfileResponse();
        r.setHealthProfileId(p.getHealthProfileId());
        r.setCurrentHealthCondition(p.getCurrentHealthCondition());
        r.setInjurySurgeryHistory(p.getInjurySurgeryHistory());
        r.setMobilityJointNotes(p.getMobilityJointNotes());
        r.setCurrentMedications(p.getCurrentMedications());
        r.setStressFatigueLevel(p.getStressFatigueLevel());
        r.setFoodIntoleranceNotes(p.getFoodIntoleranceNotes());
        r.setDislikedIngredients(p.getDislikedIngredients());
        r.setKitchenNotes(p.getKitchenNotes());
        r.setFoodAllergies(p.getFoodAllergies() != null ? p.getFoodAllergies().stream().map(FoodAllergy::getAllergenName).toList() : List.of());
        r.setDietaryRequirements(p.getDietaryRequirementsList() != null ? p.getDietaryRequirementsList().stream().map(DietaryRequirement::getRequirementName).toList() : List.of());
        r.setTherapyPreferences(p.getTherapyPreferences() != null ? p.getTherapyPreferences().stream().map(HealthProfileTherapyPreference::getPreferenceLabel).toList() : List.of());
        r.setHasConsented(consented);
        return r;
    }
}
