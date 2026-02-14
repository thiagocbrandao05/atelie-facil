-- View to get the last purchase cost for each material
-- Created AFTER StockEntry tables (must come after 20260208000002_create_stock_entry.sql)

CREATE OR REPLACE VIEW v_material_last_costs AS
SELECT DISTINCT ON (sei."materialId", sei."tenantId")
    sei."materialId" as material_id,
    sei."tenantId" as tenant_id,
    sei."unitCost" as last_cost,
    se."createdAt" as created_at
FROM "StockEntryItem" sei
JOIN "StockEntry" se ON sei."stockEntryId" = se."id"
ORDER BY sei."materialId", sei."tenantId", se."createdAt" DESC;

-- Grant access to authenticated users
GRANT SELECT ON v_material_last_costs TO authenticated;
GRANT SELECT ON v_material_last_costs TO service_role;
