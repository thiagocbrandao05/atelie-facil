-- Ensure supplier uniqueness per tenant by normalized name.
-- This prevents duplicate supplier names and closes race conditions.

CREATE OR REPLACE FUNCTION normalize_supplier_name(input TEXT)
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
    FROM "Supplier"
    WHERE normalize_supplier_name("name") IS NOT NULL
    GROUP BY "tenantId", normalize_supplier_name("name")
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION
      'Cannot create unique supplier name index: duplicate normalized names found in Supplier.';
  END IF;
END
$$;

CREATE UNIQUE INDEX IF NOT EXISTS supplier_tenant_name_norm_uidx
ON "Supplier" ("tenantId", normalize_supplier_name("name"))
WHERE normalize_supplier_name("name") IS NOT NULL;
