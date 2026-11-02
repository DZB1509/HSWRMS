package com.heavenstay.hswrms.m4fnb.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "Ingredient", schema = "dbo")
public class Ingredient {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ingredient_id")
    private Integer id;

    @Column(name = "ingredient_name", nullable = false, length = 150)
    private String ingredientName;

    protected Ingredient() { }

    public Ingredient(String ingredientName) {
        this.ingredientName = ingredientName;
    }
    public Integer getId() { return id; }
    public String getIngredientName() { return ingredientName; }
    public void setIngredientName(String ingredientName) { this.ingredientName = ingredientName; }
}
