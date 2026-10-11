package com.heavenstay.hswrms.m4fnb.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;
import java.math.BigDecimal;

@Entity
@Table(name = "MenuItemIngredient", schema = "dbo")
@IdClass(MenuItemIngredientId.class)
public class MenuItemIngredient {
    @Id
    @Column(name = "menu_item_id", nullable = false)
    private Integer menuItemId;

    @Id
    @Column(name = "ingredient_id", nullable = false)
    private Integer ingredientId;

    @Column(name = "quantity_per_serving", nullable = false, precision = 18, scale = 3)
    private BigDecimal quantityPerServing;

    protected MenuItemIngredient() { }

    public MenuItemIngredient(Integer menuItemId, Integer ingredientId, BigDecimal quantityPerServing) {
        this.menuItemId = menuItemId;
        this.ingredientId = ingredientId;
        this.quantityPerServing = quantityPerServing;
    }

    public Integer getMenuItemId() { return menuItemId; }
    public Integer getIngredientId() { return ingredientId; }
    public BigDecimal getQuantityPerServing() { return quantityPerServing; }
}
