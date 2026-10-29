package com.heavenstay.hswrms.m4fnb.entity;

import java.io.Serializable;
import java.util.Objects;

public class MenuItemIngredientId implements Serializable {
    private static final long serialVersionUID = 1L;
    private Integer menuItemId;
    private Integer ingredientId;

    public MenuItemIngredientId() { }

    public MenuItemIngredientId(Integer menuItemId, Integer ingredientId) {
        this.menuItemId = menuItemId;
        this.ingredientId = ingredientId;
    }

    public Integer getMenuItemId() { return menuItemId; }
    public void setMenuItemId(Integer menuItemId) { this.menuItemId = menuItemId; }
    public Integer getIngredientId() { return ingredientId; }
    public void setIngredientId(Integer ingredientId) { this.ingredientId = ingredientId; }

    @Override
    public boolean equals(Object other) {
        if (this == other) return true;
        if (!(other instanceof MenuItemIngredientId that)) return false;
        return Objects.equals(menuItemId, that.menuItemId)
                && Objects.equals(ingredientId, that.ingredientId);
    }

    @Override
    public int hashCode() { return Objects.hash(menuItemId, ingredientId); }
}
