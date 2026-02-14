
-- Migration: 20260208000006_subscription_system.sql

-- 1. Create Enums
CREATE TYPE "PlanType" AS ENUM ('start', 'pro', 'premium');
CREATE TYPE "SubscriptionStatus" AS ENUM ('active', 'past_due', 'canceled', 'trialing', 'incomplete', 'incomplete_expired', 'unpaid', 'paused');

-- 2. Create WhatsAppLimits Table (Static definitions per plan)
DROP TABLE IF EXISTS "WhatsAppLimits" CASCADE;
CREATE TABLE IF NOT EXISTS "WhatsAppLimits" (
    "plan" "PlanType" NOT NULL,
    "monthlyTransactional" INTEGER NOT NULL,
    "transactionalMinimum" INTEGER, -- NULL means unlimited
    "monthlyCampaign" INTEGER NOT NULL,
    "dailyCampaign" INTEGER NOT NULL,
    "maxRecipientsPerCampaign" INTEGER NOT NULL,
    "maxTestDaily" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WhatsAppLimits_pkey" PRIMARY KEY ("plan")
);

-- Seed Default Limits
INSERT INTO "WhatsAppLimits" ("plan", "monthlyTransactional", "transactionalMinimum", "monthlyCampaign", "dailyCampaign", "maxRecipientsPerCampaign", "maxTestDaily")
VALUES 
    ('start', 300, 50, 300, 150, 200, 10),
    ('pro', 1500, 200, 5000, 1000, 1000, 20),
    ('premium', 10000, NULL, 20000, 5000, 5000, 50)
ON CONFLICT ("plan") DO UPDATE SET
    "monthlyTransactional" = EXCLUDED."monthlyTransactional",
    "transactionalMinimum" = EXCLUDED."transactionalMinimum",
    "monthlyCampaign" = EXCLUDED."monthlyCampaign",
    "dailyCampaign" = EXCLUDED."dailyCampaign",
    "maxRecipientsPerCampaign" = EXCLUDED."maxRecipientsPerCampaign",
    "maxTestDaily" = EXCLUDED."maxTestDaily",
    "updatedAt" = CURRENT_TIMESTAMP;

-- 3. Create WorkspacePlans Table (Current Plan)
CREATE TABLE IF NOT EXISTS "WorkspacePlans" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "workspaceId" TEXT NOT NULL,
    "plan" "PlanType" NOT NULL DEFAULT 'start',
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkspacePlans_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "WorkspacePlans_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Tenant"("id") ON DELETE CASCADE,
    CONSTRAINT "WorkspacePlans_workspaceId_key" UNIQUE ("workspaceId")
);

-- 4. Create BillingSubscriptions Table (Stripe Sync)
CREATE TABLE IF NOT EXISTS "BillingSubscriptions" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "workspaceId" TEXT NOT NULL,
    "stripeCustomerId" TEXT NOT NULL,
    "stripeSubscriptionId" TEXT NOT NULL,
    "plan" "PlanType" NOT NULL,
    "status" "SubscriptionStatus" NOT NULL,
    "currentPeriodEnd" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BillingSubscriptions_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "BillingSubscriptions_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Tenant"("id") ON DELETE CASCADE,
    CONSTRAINT "BillingSubscriptions_workspaceId_key" UNIQUE ("workspaceId"),
    CONSTRAINT "BillingSubscriptions_stripeSubscriptionId_key" UNIQUE ("stripeSubscriptionId")
);

-- 5. Enable RLS
ALTER TABLE "WhatsAppLimits" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "WorkspacePlans" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BillingSubscriptions" ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies

-- WhatsAppLimits (Publicly readable by authenticated users)
DROP POLICY IF EXISTS "Public read access for WhatsAppLimits" ON "WhatsAppLimits";
CREATE POLICY "Public read access for WhatsAppLimits" ON "WhatsAppLimits"
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- WorkspacePlans (Tenant Isolation)
CREATE POLICY "Tenant isolation for WorkspacePlans" ON "WorkspacePlans"
    USING ("workspaceId" = get_current_tenant_id())
    WITH CHECK ("workspaceId" = get_current_tenant_id());

-- BillingSubscriptions (Tenant Isolation)
CREATE POLICY "Tenant isolation for BillingSubscriptions" ON "BillingSubscriptions"
    USING ("workspaceId" = get_current_tenant_id())
    WITH CHECK ("workspaceId" = get_current_tenant_id());

-- 7. Seed Default Plans for Existing Tenants (Idempotent)
INSERT INTO "WorkspacePlans" ("workspaceId", "plan")
SELECT "id", 'start'
FROM "Tenant"
ON CONFLICT ("workspaceId") DO NOTHING;
