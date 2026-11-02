# M4 Ingredient Unit Configuration

The active SQL Server schema has no unit column on `dbo.Ingredient`. The backend therefore owns one canonical inventory unit per exact ingredient name through Spring configuration. Recipe quantities (`MenuItemIngredient.required_quantity`) and batch quantities (`IngredientBatch.remaining_quantity`) are always interpreted in that configured unit. The API does not accept a per-request unit or perform implicit conversions.

Configure all active ingredient names in the deployment configuration before creating recipes or receiving stock:

```yaml
app:
  fnb:
    inventory:
      units:
        "<ingredient_name exactly as stored in dbo.Ingredient>": "g"
```

Add one entry per ingredient; use a canonical unit such as `g`, `ml`, or `piece` as decided by the kitchen. If stock is purchased in another unit, convert it to the configured unit before submitting the batch. Do not convert mass to volume without an ingredient-specific approved conversion.

Ingredient names are matched after trimming whitespace and ignoring case. The configured name must still correspond to the database ingredient name. A new or renamed ingredient without a configuration entry is rejected by ingredient creation, recipe management, batch receipt, availability, demand, and consumption operations with `INGREDIENT_UNIT_NOT_CONFIGURED`.

The unit returned by ingredient, recipe, batch, and dashboard APIs comes from this backend registry. Frontend code must display that returned value and must not infer units from ingredient names or maintain its own unit table. Configuration changes require the normal application configuration reload/restart process.

The registry is deliberately empty by default. Populate it with the project's real ingredient catalogue and kitchen-approved units before enabling M4 inventory operations; no ingredient names or units are assumed here.
