package com.heavenstay.hswrms.m1identity.service;

import com.heavenstay.hswrms.common.exception.ResourceNotFoundException;
import com.heavenstay.hswrms.m1identity.dto.CustomerProfileResponse;
import com.heavenstay.hswrms.m1identity.dto.UpdateCustomerProfileRequest;
import com.heavenstay.hswrms.m1identity.entity.CustomerProfile;
import com.heavenstay.hswrms.m1identity.entity.User;
import com.heavenstay.hswrms.m1identity.repository.CustomerProfileRepository;
import com.heavenstay.hswrms.m1identity.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

/**
 * Authenticated customer profile read/update.
 *
 * The current user is always derived from the caller-supplied userId resolved
 * from the security principal (CustomUserDetails). Client-supplied user IDs are
 * never accepted, so one customer cannot read or modify another profile.
 */
@Service
public class CustomerProfileService {

    private final UserRepository userRepository;
    private final CustomerProfileRepository customerProfileRepository;

    public CustomerProfileService(UserRepository userRepository,
                                  CustomerProfileRepository customerProfileRepository) {
        this.userRepository = userRepository;
        this.customerProfileRepository = customerProfileRepository;
    }

    @Transactional(readOnly = true)
    public CustomerProfileResponse getMyProfile(Integer userId) {
        User user = loadUser(userId);
        CustomerProfile profile = loadOrCreateProfile(user);
        return toResponse(user, profile);
    }

    @Transactional
    public CustomerProfileResponse updateMyProfile(Integer userId, UpdateCustomerProfileRequest request) {
        User user = loadUser(userId);
        CustomerProfile profile = loadOrCreateProfile(user);

        if (request.getFullName() != null) {
            user.setFullName(request.getFullName().trim());
        }
        if (request.getPhoneNumber() != null) {
            String phone = request.getPhoneNumber().trim();
            user.setPhoneNumber(phone.isEmpty() ? null : phone);
        }
        if (request.getDateOfBirth() != null) {
            assertNotFutureDateOfBirth(request.getDateOfBirth());
            profile.setDateOfBirth(request.getDateOfBirth());
        }
        if (request.getResidentialAddress() != null) {
            String address = request.getResidentialAddress().trim();
            profile.setResidentialAddress(address.isEmpty() ? null : address);
        }
        if (request.getPreferredLanguage() != null) {
            profile.setPreferredLanguage(request.getPreferredLanguage());
        }
        if (request.getEmergencyContactName() != null) {
            String name = request.getEmergencyContactName().trim();
            profile.setEmergencyContactName(name.isEmpty() ? null : name);
        }
        if (request.getEmergencyContactPhone() != null) {
            String phone = request.getEmergencyContactPhone().trim();
            profile.setEmergencyContactPhone(phone.isEmpty() ? null : phone);
        }
        if (request.getEmergencyContactRelationship() != null) {
            String relationship = request.getEmergencyContactRelationship().trim();
            profile.setEmergencyContactRelationship(relationship.isEmpty() ? null : relationship);
        }

        userRepository.save(user);
        CustomerProfile saved = customerProfileRepository.save(profile);
        return toResponse(user, saved);
    }

    private User loadUser(Integer userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "userId", String.valueOf(userId)));
    }

    private CustomerProfile loadOrCreateProfile(User user) {
        return customerProfileRepository.findByUserId(user.getUserId())
                .orElseGet(() -> customerProfileRepository.save(new CustomerProfile(user)));
    }

    private void assertNotFutureDateOfBirth(LocalDate dateOfBirth) {
        if (dateOfBirth.isAfter(LocalDate.now())) {
            throw new IllegalArgumentException("Date of birth must not be in the future.");
        }
    }

    private CustomerProfileResponse toResponse(User user, CustomerProfile profile) {
        return new CustomerProfileResponse(
                user.getUserId(),
                user.getFullName(),
                user.getEmail(),
                user.getPhoneNumber(),
                profile.getDateOfBirth(),
                profile.getResidentialAddress(),
                profile.getPreferredLanguage(),
                profile.getEmergencyContactName(),
                profile.getEmergencyContactPhone(),
                profile.getEmergencyContactRelationship()
        );
    }
}
