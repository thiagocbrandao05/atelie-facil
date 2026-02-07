-- View to get the last purchase cost for each material
CREATE OR REPLACE VIEW v_material_last_costs AS
SELECT DISTINCT ON (sei.material_id, sei.tenant_id)
    sei.material_id,
    sei.tenant_id,
    sei.unit_cost as last_cost,
    se.created_at
FROM stock_entry_items sei
JOIN stock_entries se ON sei.stock_entry_id = se.id
ORDER BY sei.material_id, sei.tenant_id, se.created_at DESC;

-- Grant access to authenticated users
GRANT SELECT ON v_material_last_costs TO authenticated;
GRANT SELECT ON v_material_last_costs TO service_role;
