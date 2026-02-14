-- Migration: 20260208000003_campaigns_and_public_ids.sql

-- 1. Add publicId to Order
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "publicId" TEXT DEFAULT gen_random_uuid()::text;
CREATE UNIQUE INDEX IF NOT EXISTS "Order_publicId_key" ON "Order"("publicId");

-- 2. Create Campaign Table
CREATE TABLE IF NOT EXISTS "Campaign" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "messageText" TEXT NOT NULL,
    "imageUrl" TEXT,
    "campaignToken" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "status" TEXT NOT NULL DEFAULT 'DRAFT', -- DRAFT, COMPLETED
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Campaign_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "Campaign_campaignToken_key" ON "Campaign"("campaignToken");
CREATE INDEX IF NOT EXISTS "Campaign_tenantId_idx" ON "Campaign"("tenantId");

-- 3. Create CampaignRecipient Table
CREATE TABLE IF NOT EXISTS "CampaignRecipient" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "campaignId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING', -- PENDING, SENT, FAILED
    "sentAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CampaignRecipient_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "CampaignRecipient_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE,
    CONSTRAINT "CampaignRecipient_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "CampaignRecipient_campaignId_idx" ON "CampaignRecipient"("campaignId");
CREATE INDEX IF NOT EXISTS "CampaignRecipient_customerId_idx" ON "CampaignRecipient"("customerId");

-- 4. Enable RLS
ALTER TABLE "Campaign" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CampaignRecipient" ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
-- Campaign (Tenant Isolation)
CREATE POLICY "Tenant isolation for Campaign" ON "Campaign"
    USING ("tenantId" = get_current_tenant_id())
    WITH CHECK ("tenantId" = get_current_tenant_id());

-- CampaignRecipient (Tenant Isolation via Campaign)
CREATE POLICY "Tenant isolation for CampaignRecipient" ON "CampaignRecipient"
    USING (
        EXISTS (
            SELECT 1 FROM "Campaign"
            WHERE "Campaign".id = "CampaignRecipient"."campaignId"
            AND "Campaign"."tenantId" = get_current_tenant_id()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM "Campaign"
            WHERE "Campaign".id = "CampaignRecipient"."campaignId"
            AND "Campaign"."tenantId" = get_current_tenant_id()
        )
    );

-- 6. RPCs for Public Access (SECURITY DEFINER)
-- Fetch Public Order Rastreio
CREATE OR REPLACE FUNCTION get_public_order(p_public_id TEXT)
RETURNS TABLE (
    "id" TEXT,
    "publicId" TEXT,
    "status" TEXT,
    "totalValue" DOUBLE PRECISION,
    "dueDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3),
    "customerName" TEXT,
    "tenantName" TEXT,
    "tenantSlug" TEXT,
    "items" JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        o."id",
        o."publicId",
        o."status",
        o."totalValue",
        o."dueDate",
        o."createdAt",
        split_part(c."name", ' ', 1) as "customerName",
        t."name" as "tenantName",
        t."slug" as "tenantSlug",
        jsonb_agg(
            jsonb_build_object(
                'quantity', oi.quantity,
                'productName', p.name
            )
        ) as "items"
    FROM "Order" o
    JOIN "Customer" c ON o."customerId" = c.id
    JOIN "Tenant" t ON o."tenantId" = t.id
    JOIN "OrderItem" oi ON o.id = oi."orderId"
    JOIN "Product" p ON oi."productId" = p.id
    WHERE o."publicId" = p_public_id
    GROUP BY o.id, c.name, t.name, t.slug;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fetch Public Campaign
CREATE OR REPLACE FUNCTION get_public_campaign(p_token TEXT)
RETURNS TABLE (
    "name" TEXT,
    "messageText" TEXT,
    "imageUrl" TEXT,
    "tenantName" TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        c."name",
        c."messageText",
        c."imageUrl",
        t."name" as "tenantName"
    FROM "Campaign" c
    JOIN "Tenant" t ON c."tenantId" = t.id
    WHERE c."campaignToken" = p_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
