-- Ensure customer uniqueness per tenant for normalized contact fields.
-- This closes race conditions where concurrent requests can bypass app-level checks.

CREATE OR REPLACE FUNCTION normalize_customer_email(input TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT NULLIF(lower(trim(input)), '');
$$;

CREATE OR REPLACE FUNCTION normalize_customer_phone(input TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  cleaned TEXT;
BEGIN
  IF input IS NULL THEN
    RETURN NULL;
  END IF;

  cleaned := regexp_replace(input, '\D', '', 'g');
  IF cleaned = '' THEN
    RETURN NULL;
  END IF;

  -- Remove country code for Brazilian numbers.
  IF length(cleaned) = 13 AND left(cleaned, 2) = '55' THEN
    RETURN right(cleaned, 11);
  END IF;

  -- Keep last 11 digits for oversized values.
  IF length(cleaned) > 11 THEN
    RETURN right(cleaned, 11);
  END IF;

  RETURN cleaned;
END;
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "Customer"
    WHERE normalize_customer_phone("phone") IS NOT NULL
    GROUP BY "tenantId", normalize_customer_phone("phone")
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION
      'Cannot create unique phone index: duplicate normalized phones found in Customer.';
  END IF;
END
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "Customer"
    WHERE normalize_customer_email("email") IS NOT NULL
    GROUP BY "tenantId", normalize_customer_email("email")
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION
      'Cannot create unique email index: duplicate normalized emails found in Customer.';
  END IF;
END
$$;

CREATE UNIQUE INDEX IF NOT EXISTS customer_tenant_phone_norm_uidx
ON "Customer" ("tenantId", normalize_customer_phone("phone"))
WHERE normalize_customer_phone("phone") IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS customer_tenant_email_norm_uidx
ON "Customer" ("tenantId", normalize_customer_email("email"))
WHERE normalize_customer_email("email") IS NOT NULL;
