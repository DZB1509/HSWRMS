package com.heavenstay.hswrms.m2booking;

import com.heavenstay.hswrms.m2booking.controller.VillaInventoryController;
import com.heavenstay.hswrms.m2booking.entity.PhysicalVilla;
import com.heavenstay.hswrms.m2booking.repository.PhysicalVillaRepository;
import com.heavenstay.hswrms.m2booking.repository.ResortZoneRepository;
import com.heavenstay.hswrms.m2booking.repository.VillaCategoryRepository;
import com.heavenstay.hswrms.m2booking.repository.VillaFunctionalAreaRepository;
import com.heavenstay.hswrms.m2booking.service.ReceptionistOperationService;
import com.heavenstay.hswrms.security.CustomUserDetails;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class VillaInventoryControllerActorTest {

    @Mock
    private PhysicalVillaRepository villaRepo;
    @Mock
    private VillaCategoryRepository categoryRepo;
    @Mock
    private ResortZoneRepository zoneRepo;
    @Mock
    private VillaFunctionalAreaRepository areaRepo;
    @Mock
    private ReceptionistOperationService receptionistService;

    @InjectMocks
    private VillaInventoryController controller;

    @Test
    void recordsTheAuthenticatedCustomUserDetailsIdAsTheActor() {
        PhysicalVilla villa = new PhysicalVilla();
        villa.setVillaId(17);
        villa.setVillaNumber("V-017");
        when(villaRepo.findByVillaNumber("V-017")).thenReturn(Optional.of(villa));
        when(villaRepo.findById(17)).thenReturn(Optional.of(villa));
        CustomUserDetails actor = new CustomUserDetails(842, "receptionist@example.test", "", "Receptionist", true,
                List.of("RECEPTIONIST"));

        controller.updateVillaStatus("V-017", Map.of("status", "MAINTENANCE"), actor);

        verify(receptionistService).updateVillaStatus(17, "MAINTENANCE", null, 842);
    }

    @Test
    void rejectsAnUnresolvedAuthenticatedPrincipalWithoutLookingUpOrUpdatingVilla() {
        assertThrows(AccessDeniedException.class,
                () -> controller.updateVillaStatus("V-017", Map.of("status", "MAINTENANCE"), null));

        verifyNoInteractions(villaRepo, receptionistService);
    }

    @Test
    void rejectsCustomPrincipalWithoutUserIdInsteadOfUsingFallbackActor() {
        CustomUserDetails actorWithoutId = new CustomUserDetails(null, "unknown@example.test", "", "Unknown", true,
                List.of("RECEPTIONIST"));

        assertThrows(AccessDeniedException.class,
                () -> controller.updateVillaStatus("V-017", Map.of("status", "MAINTENANCE"), actorWithoutId));

        verifyNoInteractions(villaRepo, receptionistService);
        verify(receptionistService, never()).updateVillaStatus(17, "MAINTENANCE", null, 1);
    }
}
