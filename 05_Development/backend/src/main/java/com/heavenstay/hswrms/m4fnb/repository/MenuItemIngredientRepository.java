package com.heavenstay.hswrms.m4fnb.repository;

import com.heavenstay.hswrms.m4fnb.entity.MenuItemIngredient;
import com.heavenstay.hswrms.m4fnb.entity.MenuItemIngredientId;
import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MenuItemIngredientRepository extends JpaRepository<MenuItemIngredient, MenuItemIngredientId> {
    List<MenuItemIngredient> findByMenuItemIdOrderByIngredientIdAsc(Integer menuItemId);
    List<MenuItemIngredient> findByMenuItemIdIn(Collection<Integer> menuItemIds);
    void deleteByMenuItemId(Integer menuItemId);
}
