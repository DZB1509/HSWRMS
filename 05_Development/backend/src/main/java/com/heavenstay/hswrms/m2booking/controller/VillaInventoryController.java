package com.heavenstay.hswrms.m2booking.controller;

import com.heavenstay.hswrms.common.api.ApiResponse;
import com.heavenstay.hswrms.common.exception.ResourceNotFoundException;
import com.heavenstay.hswrms.m2booking.entity.PhysicalVilla;
import com.heavenstay.hswrms.m2booking.entity.ResortZone;
import com.heavenstay.hswrms.m2booking.entity.VillaCategory;
import com.heavenstay.hswrms.m2booking.entity.VillaFunctionalArea;
import com.heavenstay.hswrms.m2booking.repository.PhysicalVillaRepository;
import com.heavenstay.hswrms.m2booking.repository.ResortZoneRepository;
import com.heavenstay.hswrms.m2booking.repository.VillaCategoryRepository;
import com.heavenstay.hswrms.m2booking.repository.VillaFunctionalAreaRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1")
public class VillaInventoryController {

    private final PhysicalVillaRepository villaRepo;
    private final VillaCategoryRepository categoryRepo;
    private final ResortZoneRepository zoneRepo;
    private final VillaFunctionalAreaRepository areaRepo;

    public VillaInventoryController(PhysicalVillaRepository villaRepo,
                                    VillaCategoryRepository categoryRepo,
                                    ResortZoneRepository zoneRepo,
                                    VillaFunctionalAreaRepository areaRepo) {
        this.villaRepo = villaRepo;
        this.categoryRepo = categoryRepo;
        this.zoneRepo = zoneRepo;
        this.areaRepo = areaRepo;
    }

    @GetMapping("/villas")
    public ResponseEntity<ApiResponse<List<PhysicalVilla>>> getAllVillas(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String zone) {
        if (status != null && !status.isBlank()) {
            return ResponseEntity.ok(ApiResponse.ok(villaRepo.findByVillaStatus(status.toUpperCase())));
        }
        if (zone != null && !zone.isBlank()) {
            return ResponseEntity.ok(ApiResponse.ok(villaRepo.findByZoneName(zone)));
        }
        return ResponseEntity.ok(ApiResponse.ok(villaRepo.findAll()));
    }

    @GetMapping("/villas/{villaNumber}")
    public ResponseEntity<ApiResponse<PhysicalVilla>> getVillaByNumber(@PathVariable String villaNumber) {
        PhysicalVilla villa = villaRepo.findByVillaNumber(villaNumber)
                .orElseThrow(() -> new ResourceNotFoundException("PhysicalVilla", "villaNumber", villaNumber));
        return ResponseEntity.ok(ApiResponse.ok(villa));
    }

    // Operational status (S24) is Receptionist work; Admin always allowed. Manager is read-only.
    @PatchMapping("/villas/{villaNumber}/status")
    public ResponseEntity<ApiResponse<PhysicalVilla>> updateVillaStatus(
            @PathVariable String villaNumber,
            @RequestBody Map<String, String> payload) {
        String newStatus = payload.get("status");
        if (newStatus == null || newStatus.isBlank()) {
            throw new IllegalArgumentException("Status field is required");
        }
        PhysicalVilla villa = villaRepo.findByVillaNumber(villaNumber)
                .orElseThrow(() -> new ResourceNotFoundException("PhysicalVilla", "villaNumber", villaNumber));
        villa.setVillaStatus(newStatus.toUpperCase());
        return ResponseEntity.ok(ApiResponse.ok("Villa status updated successfully", villaRepo.save(villa)));
    }

    @PutMapping("/villas/{villaNumber}")
    @PreAuthorize("@perm.has('S12','U')")
    public ResponseEntity<ApiResponse<PhysicalVilla>> updateVilla(
            @PathVariable String villaNumber,
            @RequestBody Map<String, Object> payload) {
        PhysicalVilla villa = villaRepo.findByVillaNumber(villaNumber)
                .orElseThrow(() -> new ResourceNotFoundException("PhysicalVilla", "villaNumber", villaNumber));

        if (payload.containsKey("villaCategoryId") && payload.get("villaCategoryId") != null) {
            Integer catId = Integer.valueOf(payload.get("villaCategoryId").toString());
            VillaCategory cat = categoryRepo.findById(catId)
                    .orElseThrow(() -> new ResourceNotFoundException("VillaCategory", "villaCategoryId", catId));
            villa.setVillaCategory(cat);
        }
        if (payload.containsKey("floor") && payload.get("floor") != null) {
            villa.setFloor((String) payload.get("floor"));
        }
        if (payload.containsKey("zoneName") && payload.get("zoneName") != null) {
            villa.setZoneName((String) payload.get("zoneName"));
        }
        if (payload.containsKey("bedroomInfo") && payload.get("bedroomInfo") != null) {
            villa.setBedroomInfo((String) payload.get("bedroomInfo"));
        }
        if (payload.containsKey("bedType") && payload.get("bedType") != null) {
            villa.setBedType((String) payload.get("bedType"));
        }
        if (payload.containsKey("maxAdults") && payload.get("maxAdults") != null) {
            villa.setMaxAdults(Integer.parseInt(payload.get("maxAdults").toString()));
        }
        if (payload.containsKey("maxChildren") && payload.get("maxChildren") != null) {
            villa.setMaxChildren(Integer.parseInt(payload.get("maxChildren").toString()));
        }
        if (payload.containsKey("maxOccupancy") && payload.get("maxOccupancy") != null) {
            villa.setMaxOccupancy(Integer.parseInt(payload.get("maxOccupancy").toString()));
        }
        if (payload.containsKey("areaSqm") && payload.get("areaSqm") != null) {
            villa.setAreaSqm(new BigDecimal(payload.get("areaSqm").toString()));
        }
        if (payload.containsKey("nightlyRate") && payload.get("nightlyRate") != null) {
            villa.setNightlyRate(new BigDecimal(payload.get("nightlyRate").toString()));
        }
        if (payload.containsKey("hasPrivatePool") && payload.get("hasPrivatePool") != null) {
            villa.setHasPrivatePool(Boolean.parseBoolean(payload.get("hasPrivatePool").toString()));
        }
        if (payload.containsKey("poolInfo") && payload.get("poolInfo") != null) {
            villa.setPoolInfo((String) payload.get("poolInfo"));
        }
        if (payload.containsKey("viewAndOperationalNotes") && payload.get("viewAndOperationalNotes") != null) {
            villa.setViewAndOperationalNotes((String) payload.get("viewAndOperationalNotes"));
        }
        if (payload.containsKey("villaStatus") && payload.get("villaStatus") != null) {
            villa.setVillaStatus((String) payload.get("villaStatus"));
        }
        if (payload.containsKey("amenities") && payload.get("amenities") != null) {
            Object am = payload.get("amenities");
            villa.setAmenities(am instanceof List<?> list ? String.join(", ", list.stream().map(Object::toString).toList()) : am.toString());
        }
        if (payload.containsKey("image") && payload.get("image") != null) {
            villa.setImage((String) payload.get("image"));
        }

        PhysicalVilla saved = villaRepo.save(villa);
        return ResponseEntity.ok(ApiResponse.ok("Villa updated successfully", saved));
    }

    @DeleteMapping("/villas/{villaNumber}")
    @PreAuthorize("@perm.has('S12','D')")
    public ResponseEntity<ApiResponse<Void>> deleteVilla(@PathVariable String villaNumber) {
        PhysicalVilla villa = villaRepo.findByVillaNumber(villaNumber)
                .orElseThrow(() -> new ResourceNotFoundException("PhysicalVilla", "villaNumber", villaNumber));
        villaRepo.delete(villa);
        return ResponseEntity.ok(ApiResponse.ok("Villa deleted successfully", null));
    }

    @GetMapping("/villa-categories")
    public ResponseEntity<ApiResponse<List<VillaCategory>>> getAllCategories() {
        return ResponseEntity.ok(ApiResponse.ok(categoryRepo.findAll()));
    }

    @GetMapping("/resort-zones")
    public ResponseEntity<ApiResponse<List<ResortZone>>> getAllZones() {
        return ResponseEntity.ok(ApiResponse.ok(zoneRepo.findAll()));
    }

    @PreAuthorize("@perm.has('S12','C')")
    public ResponseEntity<ApiResponse<PhysicalVilla>> createVilla(@RequestBody Map<String, Object> payload) {
        String villaNumber = (String) payload.get("villaNumber");
        if (villaNumber == null || villaNumber.isBlank()) {
            throw new IllegalArgumentException("villaNumber is required");
        }
        if (villaRepo.findByVillaNumber(villaNumber).isPresent()) {
            throw new IllegalArgumentException("Villa with number " + villaNumber + " already exists");
        }

        Integer categoryId = payload.get("villaCategoryId") != null
                ? Integer.valueOf(payload.get("villaCategoryId").toString())
                : null;
        VillaCategory category;
        if (categoryId != null) {
            category = categoryRepo.findById(categoryId)
                    .orElseThrow(() -> new ResourceNotFoundException("VillaCategory", "villaCategoryId", categoryId));
        } else {
            category = categoryRepo.findAll().stream().findFirst()
                    .orElseThrow(() -> new IllegalStateException("No VillaCategory available"));
        }

        PhysicalVilla villa = new PhysicalVilla();
        villa.setVillaNumber(villaNumber);
        villa.setVillaCategory(category);
        villa.setFloor((String) payload.getOrDefault("floor", "Tầng 1 (Ground)"));
        villa.setZoneName((String) payload.getOrDefault("zoneName", "Garden Zone"));
        villa.setBedroomInfo((String) payload.getOrDefault("bedroomInfo", category.getBedroomDescription() != null ? category.getBedroomDescription() : "1 PN (King Bed)"));
        villa.setBedType((String) payload.getOrDefault("bedType", category.getBedType() != null ? category.getBedType() : "1 King Bed"));
        villa.setMaxAdults(payload.get("maxAdults") != null ? Integer.parseInt(payload.get("maxAdults").toString()) : (category.getMaxAdults() != null ? category.getMaxAdults() : 2));
        villa.setMaxChildren(payload.get("maxChildren") != null ? Integer.parseInt(payload.get("maxChildren").toString()) : (category.getMaxChildren() != null ? category.getMaxChildren() : 1));
        villa.setMaxOccupancy(payload.get("maxOccupancy") != null
                ? Integer.parseInt(payload.get("maxOccupancy").toString())
                : (villa.getMaxAdults() + villa.getMaxChildren()));
        if (payload.get("areaSqm") != null) {
            villa.setAreaSqm(new BigDecimal(payload.get("areaSqm").toString()));
        }
        if (payload.get("nightlyRate") != null) {
            villa.setNightlyRate(new BigDecimal(payload.get("nightlyRate").toString()));
        } else if (category.getBasePrice() != null) {
            villa.setNightlyRate(category.getBasePrice());
        }
        villa.setHasPrivatePool(Boolean.parseBoolean(String.valueOf(payload.getOrDefault("hasPrivatePool", category.isHasPrivatePool()))));
        villa.setPoolInfo((String) payload.getOrDefault("poolInfo", category.getPoolDescription() != null ? category.getPoolDescription() : "Không"));
        villa.setViewAndOperationalNotes((String) payload.getOrDefault("viewAndOperationalNotes", ""));
        villa.setVillaStatus((String) payload.getOrDefault("villaStatus", PhysicalVilla.AVAILABLE));
        villa.setImage((String) payload.getOrDefault("image", category.getImage()));
        villa.setAmenities((String) payload.getOrDefault("amenities", category.getFeaturesAndAmenities()));

        PhysicalVilla saved = villaRepo.save(villa);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created("Villa created successfully", saved));
    }

    @PreAuthorize("@perm.has('S12','C')")
    public ResponseEntity<ApiResponse<VillaCategory>> createVillaCategory(@RequestBody Map<String, Object> payload) {
        String categoryName = (String) payload.get("categoryName");
        if (categoryName == null || categoryName.isBlank()) {
            throw new IllegalArgumentException("categoryName is required");
        }
        VillaCategory cat = new VillaCategory();
        cat.setCategoryName(categoryName);
        cat.setMaxOccupancy(payload.get("maxOccupancy") != null ? Integer.parseInt(payload.get("maxOccupancy").toString()) : 2);
        if (payload.get("priceModifier") != null) {
            cat.setPriceModifier(new BigDecimal(payload.get("priceModifier").toString()));
        }
        cat.setCategoryStatus((String) payload.getOrDefault("categoryStatus", VillaCategory.ACTIVE));
        cat.setInventoryCount(payload.get("inventoryCount") != null ? Integer.parseInt(payload.get("inventoryCount").toString()) : 1);
        cat.setBedroomCount(payload.get("bedroomCount") != null ? Integer.parseInt(payload.get("bedroomCount").toString()) : 1);
        cat.setBedroomDescription((String) payload.getOrDefault("bedroomDescription", "1 PN (King Bed)"));
        cat.setAreaDescription((String) payload.getOrDefault("areaDescription", "100 m²"));
        cat.setHasPrivatePool(Boolean.parseBoolean(String.valueOf(payload.getOrDefault("hasPrivatePool", false))));
        cat.setPoolDescription((String) payload.getOrDefault("poolDescription", ""));
        cat.setFeaturesAndAmenities((String) payload.getOrDefault("featuresAndAmenities", ""));
        cat.setEligiblePackages((String) payload.getOrDefault("eligiblePackages", ""));

        VillaCategory saved = categoryRepo.save(cat);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created("Villa category created successfully", saved));
    }

    @PatchMapping("/villas/{villaNumber}/price")
    @PreAuthorize("@perm.has('S12','U')")
    public ResponseEntity<ApiResponse<PhysicalVilla>> updateVillaPrice(
            @PathVariable String villaNumber,
            @RequestBody Map<String, Object> payload) {
        PhysicalVilla villa = villaRepo.findByVillaNumber(villaNumber)
                .orElseThrow(() -> new ResourceNotFoundException("PhysicalVilla", "villaNumber", villaNumber));
        if (payload.get("nightlyRate") != null) {
            villa.setNightlyRate(new BigDecimal(payload.get("nightlyRate").toString()));
        }
        return ResponseEntity.ok(ApiResponse.ok("Villa price updated successfully", villaRepo.save(villa)));
    }

    @PatchMapping("/villa-categories/{categoryId}/price")
    @PreAuthorize("@perm.has('S12','U')")
    public ResponseEntity<ApiResponse<VillaCategory>> updateCategoryPrice(
            @PathVariable Integer categoryId,
            @RequestBody Map<String, Object> payload) {
        VillaCategory cat = categoryRepo.findById(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException("VillaCategory", "villaCategoryId", categoryId));
        if (payload.get("basePrice") != null) {
            cat.setBasePrice(new BigDecimal(payload.get("basePrice").toString()));
        }
        if (payload.get("priceModifier") != null) {
            cat.setPriceModifier(new BigDecimal(payload.get("priceModifier").toString()));
        }
        return ResponseEntity.ok(ApiResponse.ok("Villa category price updated successfully", categoryRepo.save(cat)));
    }

    @GetMapping("/villa-functional-areas")
    public ResponseEntity<ApiResponse<List<VillaFunctionalArea>>> getAllFunctionalAreas(
            @RequestParam(required = false) String spaceGroup) {
        if (spaceGroup != null && !spaceGroup.isBlank()) {
            return ResponseEntity.ok(ApiResponse.ok(areaRepo.findBySpaceGroup(spaceGroup)));
        }
        return ResponseEntity.ok(ApiResponse.ok(areaRepo.findAll()));
    }
}
