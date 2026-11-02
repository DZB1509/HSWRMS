package com.heavenstay.hswrms.m1identity.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.heavenstay.hswrms.common.exception.ResourceNotFoundException;
import com.heavenstay.hswrms.m1identity.dto.CustomerProfileResponse;
import com.heavenstay.hswrms.m1identity.dto.UpdateCustomerProfileRequest;
import com.heavenstay.hswrms.m1identity.entity.CustomerProfile;
import com.heavenstay.hswrms.m1identity.entity.User;
import com.heavenstay.hswrms.m1identity.repository.CustomerProfileRepository;
import com.heavenstay.hswrms.m1identity.repository.UserRepository;
import java.time.LocalDate;
import java.util.Optional;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class CustomerProfileServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private CustomerProfileRepository customerProfileRepository;

    @InjectMocks
    private CustomerProfileService customerProfileService;

    private User user(Integer userId) {
        User user = new User("Jane Doe", "jane@example.com", "hash");
        user.setUserId(userId);
        user.setAccountStatus("ACTIVE");
        user.setEmailVerified(true);
        return user;
    }

    @Test
    @DisplayName("Read returns only the caller's profile")
    void getMyProfile_returnsCallerProfile() {
        User user = user(205);
        CustomerProfile profile = new CustomerProfile(user);
        profile.setPreferredLanguage("en");
        when(userRepository.findById(205)).thenReturn(Optional.of(user));
        when(customerProfileRepository.findByUserId(205)).thenReturn(Optional.of(profile));

        CustomerProfileResponse response = customerProfileService.getMyProfile(205);

        assertEquals(205, response.getUserId());
        assertEquals("Jane Doe", response.getFullName());
        assertEquals("jane@example.com", response.getEmail());
    }

    @Test
    @DisplayName("Update applies only supported fields and ignores identity fields")
    void updateMyProfile_appliesSupportedFields() {
        User user = user(205);
        CustomerProfile profile = new CustomerProfile(user);
        when(userRepository.findById(205)).thenReturn(Optional.of(user));
        when(customerProfileRepository.findByUserId(205)).thenReturn(Optional.of(profile));
        when(customerProfileRepository.save(any(CustomerProfile.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        UpdateCustomerProfileRequest request = new UpdateCustomerProfileRequest();
        request.setFullName("  Jane Updated  ");
        request.setPhoneNumber("+1 555 0100");
        request.setDateOfBirth(LocalDate.of(1990, 5, 20));
        request.setPreferredLanguage("vi");
        request.setEmergencyContactName("John Doe");

        CustomerProfileResponse response = customerProfileService.updateMyProfile(205, request);

        assertEquals("Jane Updated", response.getFullName());
        assertEquals("jane@example.com", response.getEmail());
        assertEquals("+1 555 0100", response.getPhoneNumber());
        assertEquals("vi", response.getPreferredLanguage());
        verify(userRepository).save(user);
    }

    @Test
    @DisplayName("Missing user raises 404 and never touches the profile repository")
    void missingUser_throwsNotFound() {
        when(userRepository.findById(999)).thenReturn(Optional.empty());

        UpdateCustomerProfileRequest request = new UpdateCustomerProfileRequest();
        request.setFullName("Ghost");

        assertThrows(ResourceNotFoundException.class,
                () -> customerProfileService.updateMyProfile(999, request));
        verify(customerProfileRepository, never()).save(any(CustomerProfile.class));
    }
}
