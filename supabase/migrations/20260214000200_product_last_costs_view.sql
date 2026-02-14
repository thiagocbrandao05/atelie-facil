-- Migration: Product Last Costs View

CREATE OR REPLACE VIEW v_product_last_costs AS
SELECT DISTINCT ON (psei."productId", psei."tenantId")
    psei."productId" as product_id,
    psei."tenantId" as tenant_id,
    psei."quantity" as last_quantity,
    psei."unitCost" as base_unit_cost,
    pse."freightCost" as freight_cost,
    pse."totalCost" as total_cost,
    -- Calculate freight multiplier: total_cost / (total_cost - freight_cost)
    -- If total_cost == freight_cost (shouldn't happen with items), multiplier is 1 or handle division by zero
    CASE 
        WHEN (pse."totalCost" - pse."freightCost") > 0 
        THEN pse."unitCost" * (pse."totalCost" / (pse."totalCost" - pse."freightCost"))
        ELSE pse."unitCost"
    END as last_cost_with_freight,
    pse."createdAt" as purchased_at
FROM "ProductStockEntryItem" psei
JOIN "ProductStockEntry" pse ON psei."productStockEntryId" = pse."id"
ORDER BY psei."productId", psei."tenantId", pse."createdAt" DESC;

-- Grant access
GRANT SELECT ON v_product_last_costs TO authenticated;
GRANT SELECT ON v_product_last_costs TO service_role;
