package com.heavenstay.hswrms.m4fnb.repository;

import com.heavenstay.hswrms.m4fnb.entity.MenuItem;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MenuItemRepository extends JpaRepository<MenuItem, Integer> {
    List<MenuItem> findByAvailabilityStatusOrderByItemNameAsc(String availabilityStatus);
    List<MenuItem> findAllByOrderByItemNameAsc();
    boolean existsByItemNameIgnoreCase(String itemName);
}
