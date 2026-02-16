-- Ensure material uniqueness per tenant by normalized name.
-- This prevents duplicate material names and closes race conditions.

CREATE OR REPLACE FUNCTION normalize_material_name(input TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT NULLIF(regexp_replace(lower(trim(input)), '\s+', ' ', 'g'), '');
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "Material"
    WHERE normalize_material_name("name") IS NOT NULL
    GROUP BY "tenantId", normalize_material_name("name")
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION
      'Cannot create unique material name index: duplicate normalized names found in Material.';
  END IF;
END
$$;

CREATE UNIQUE INDEX IF NOT EXISTS material_tenant_name_norm_uidx
ON "Material" ("tenantId", normalize_material_name("name"))
WHERE normalize_material_name("name") IS NOT NULL;
