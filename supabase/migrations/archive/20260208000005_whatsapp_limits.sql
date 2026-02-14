-- Migration: 20260208000005_whatsapp_limits.sql

-- WhatsAppLimits table creation moved to 20260208000006_subscription_system.sql to avoid conflicts with plan-based schema


-- 2. Create WhatsAppUsageDaily Table
CREATE TABLE IF NOT EXISTS "WhatsAppUsageDaily" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "tenantId" TEXT NOT NULL,
    "date" DATE NOT NULL DEFAULT CURRENT_DATE,
    "type" TEXT NOT NULL, -- 'transactional', 'campaign', 'test'
    "count" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WhatsAppUsageDaily_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "WhatsAppUsageDaily_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE,
    CONSTRAINT "WhatsAppUsageDaily_tenantId_date_type_key" UNIQUE ("tenantId", "date", "type")
);

-- 3. Enable RLS
ALTER TABLE "WhatsAppUsageDaily" ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
-- WhatsAppUsageDaily
DROP POLICY IF EXISTS "Tenant isolation for WhatsAppUsageDaily" ON "WhatsAppUsageDaily";
CREATE POLICY "Tenant isolation for WhatsAppUsageDaily" ON "WhatsAppUsageDaily"
    USING ("tenantId" = get_current_tenant_id())
    WITH CHECK ("tenantId" = get_current_tenant_id());

-- 5. RPC for Atomic Increment
CREATE OR REPLACE FUNCTION increment_whatsapp_usage(
    p_tenant_id TEXT,
    p_date DATE,
    p_type TEXT,
    p_count INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO "WhatsAppUsageDaily" ("tenantId", "date", "type", "count")
    VALUES (p_tenant_id, p_date, p_type, p_count)
    ON CONFLICT ("tenantId", "date", "type")
    DO UPDATE SET 
        "count" = "WhatsAppUsageDaily"."count" + EXCLUDED."count",
        "updatedAt" = CURRENT_TIMESTAMP;
END;
$$;
