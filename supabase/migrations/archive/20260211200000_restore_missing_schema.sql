-- Restore missing schema elements due to failed init_v2 migration
-- This covers everything from 'add_discounts' onwards

-- 1. Add Discounts (Safe Wrap)
DO $$
BEGIN
    ALTER TABLE "Order" ADD COLUMN "discount" DOUBLE PRECISION DEFAULT 0;
EXCEPTION
    WHEN duplicate_column THEN NULL;
END $$;

DO $$
BEGIN
    ALTER TABLE "OrderItem" ADD COLUMN "discount" DOUBLE PRECISION DEFAULT 0;
EXCEPTION
    WHEN duplicate_column THEN NULL;
END $$;

-- 2. Update create_order RPC
CREATE OR REPLACE FUNCTION create_order(
  p_tenant_id TEXT,
  p_customer_id TEXT,
  p_status TEXT,
  p_due_date TIMESTAMP,
  p_total_value FLOAT,
  p_items JSONB, -- Array of { productId, quantity, price, discount }
  p_discount FLOAT DEFAULT 0
)
RETURNS JSON AS $$
DECLARE
  v_order_id TEXT;
  v_item JSONB;
BEGIN
  -- Verify tenant access
  IF p_tenant_id != get_current_tenant_id() THEN
     RAISE EXCEPTION 'Unauthorized tenant access';
  END IF;

  -- Insert Order
  INSERT INTO "Order" ("id", "tenantId", "customerId", "status", "dueDate", "totalValue", "discount", "createdAt")
  VALUES (gen_random_uuid()::text, p_tenant_id, p_customer_id, p_status, p_due_date, p_total_value, p_discount, NOW())
  RETURNING "id" INTO v_order_id;

  -- Insert Items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO "OrderItem" ("orderId", "productId", "quantity", "price", "discount")
    VALUES (
      v_order_id, 
      v_item->>'productId', 
      (v_item->>'quantity')::INTEGER, 
      (v_item->>'price')::FLOAT,
      COALESCE((v_item->>'discount')::FLOAT, 0)
    );
  END LOOP;

  RETURN json_build_object('success', true, 'id', v_order_id);
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'message', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. WhatsApp Notification Log
CREATE TABLE IF NOT EXISTS "WhatsAppNotificationLog" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "tenantId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "customerPhone" TEXT,
    "statusFrom" TEXT,
    "statusTo" TEXT NOT NULL,
    "messageType" TEXT NOT NULL,
    "templateKey" TEXT,
    "messageBody" TEXT,
    "payload" JSONB,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastAttemptAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "errorMessage" TEXT,
    "providerMessageId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WhatsAppNotificationLog_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "WhatsAppNotificationLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WhatsAppNotificationLog_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "WhatsAppNotificationLog_tenantId_idx" ON "WhatsAppNotificationLog"("tenantId");
CREATE INDEX IF NOT EXISTS "WhatsAppNotificationLog_orderId_idx" ON "WhatsAppNotificationLog"("orderId");
CREATE INDEX IF NOT EXISTS "WhatsAppNotificationLog_status_idx" ON "WhatsAppNotificationLog"("status");
CREATE INDEX IF NOT EXISTS "WhatsAppNotificationLog_createdAt_idx" ON "WhatsAppNotificationLog"("createdAt");
CREATE INDEX IF NOT EXISTS "WhatsAppNotificationLog_tenantId_status_idx" ON "WhatsAppNotificationLog"("tenantId", "status");

ALTER TABLE "WhatsAppNotificationLog" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant isolation for WhatsAppNotificationLog" ON "WhatsAppNotificationLog";
CREATE POLICY "Tenant isolation for WhatsAppNotificationLog" ON "WhatsAppNotificationLog"
  USING ("tenantId" = get_current_tenant_id())
  WITH CHECK ("tenantId" = get_current_tenant_id());

-- 4. WhatsApp Settings
ALTER TABLE "Settings" ADD COLUMN IF NOT EXISTS "whatsappPhoneNumberId" TEXT;
ALTER TABLE "Settings" ADD COLUMN IF NOT EXISTS "whatsappAccessToken" TEXT;
ALTER TABLE "Settings" ADD COLUMN IF NOT EXISTS "whatsappConfigVerified" BOOLEAN DEFAULT FALSE;

-- 5. Stock Entry
CREATE TABLE IF NOT EXISTS "StockEntry" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "tenantId" TEXT NOT NULL,
    "supplierName" TEXT NOT NULL,
    "freightCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalCost" DOUBLE PRECISION NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockEntry_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "StockEntry_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "StockEntry_tenantId_idx" ON "StockEntry"("tenantId");
CREATE INDEX IF NOT EXISTS "StockEntry_createdAt_idx" ON "StockEntry"("createdAt");

CREATE TABLE IF NOT EXISTS "StockEntryItem" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "tenantId" TEXT NOT NULL,
    "stockEntryId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unitCost" DOUBLE PRECISION NOT NULL,
    "color" TEXT,

    CONSTRAINT "StockEntryItem_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "StockEntryItem_stockEntryId_fkey" FOREIGN KEY ("stockEntryId") REFERENCES "StockEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StockEntryItem_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "StockEntryItem_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "StockEntryItem_stockEntryId_idx" ON "StockEntryItem"("stockEntryId");
CREATE INDEX IF NOT EXISTS "StockEntryItem_materialId_idx" ON "StockEntryItem"("materialId");

ALTER TABLE "StockEntry" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "StockEntryItem" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant isolation for StockEntry" ON "StockEntry";
CREATE POLICY "Tenant isolation for StockEntry" ON "StockEntry"
  USING ("tenantId" = get_current_tenant_id())
  WITH CHECK ("tenantId" = get_current_tenant_id());

DROP POLICY IF EXISTS "Tenant isolation for StockEntryItem" ON "StockEntryItem";
CREATE POLICY "Tenant isolation for StockEntryItem" ON "StockEntryItem"
  USING ("tenantId" = get_current_tenant_id())
  WITH CHECK ("tenantId" = get_current_tenant_id());

CREATE OR REPLACE FUNCTION create_stock_entry_transaction(
  p_tenant_id TEXT,
  p_supplier_name TEXT,
  p_freight_cost FLOAT,
  p_total_cost FLOAT,
  p_items JSONB,
  p_note TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_entry_id TEXT;
  v_item JSONB;
BEGIN
  IF p_tenant_id != get_current_tenant_id() THEN
     RAISE EXCEPTION 'Unauthorized tenant access';
  END IF;

  INSERT INTO "StockEntry" ("id", "tenantId", "supplierName", "freightCost", "totalCost", "note", "createdAt")
  VALUES (gen_random_uuid()::text, p_tenant_id, p_supplier_name, p_freight_cost, p_total_cost, p_note, NOW())
  RETURNING "id" INTO v_entry_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO "StockEntryItem" ("stockEntryId", "tenantId", "materialId", "quantity", "unitCost", "color")
    VALUES (
      v_entry_id,
      p_tenant_id,
      v_item->>'materialId',
      (v_item->>'quantity')::FLOAT,
      (v_item->>'unitCost')::FLOAT,
      v_item->>'color'
    );

    UPDATE "Material"
    SET quantity = quantity + (v_item->>'quantity')::FLOAT,
        cost = (v_item->>'unitCost')::FLOAT
    WHERE id = (v_item->>'materialId') AND "tenantId" = p_tenant_id;

    INSERT INTO "InventoryMovement" ("id", "tenantId", "materialId", "type", "quantity", "reason", "reference", "createdAt")
    VALUES (
      gen_random_uuid()::text,
      p_tenant_id,
      v_item->>'materialId',
      'ENTRADA',
      (v_item->>'quantity')::FLOAT,
      'Compra de Material - ' || p_supplier_name,
      v_entry_id,
      NOW()
    );

  END LOOP;

  RETURN json_build_object('success', true, 'id', v_entry_id);
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'message', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Material View (The one reported missing)
CREATE OR REPLACE VIEW v_material_last_costs AS
SELECT DISTINCT ON (sei."materialId", sei."tenantId")
    sei."materialId" as material_id,
    sei."tenantId" as tenant_id,
    sei."unitCost" as last_cost,
    se."createdAt" as created_at
FROM "StockEntryItem" sei
JOIN "StockEntry" se ON sei."stockEntryId" = se."id"
ORDER BY sei."materialId", sei."tenantId", se."createdAt" DESC;

GRANT SELECT ON v_material_last_costs TO authenticated;
GRANT SELECT ON v_material_last_costs TO service_role;

-- 7. Campaigns
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "publicId" TEXT DEFAULT gen_random_uuid()::text;
CREATE UNIQUE INDEX IF NOT EXISTS "Order_publicId_key" ON "Order"("publicId");

CREATE TABLE IF NOT EXISTS "Campaign" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "messageText" TEXT NOT NULL,
    "imageUrl" TEXT,
    "campaignToken" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Campaign_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "Campaign_campaignToken_key" ON "Campaign"("campaignToken");
CREATE INDEX IF NOT EXISTS "Campaign_tenantId_idx" ON "Campaign"("tenantId");

CREATE TABLE IF NOT EXISTS "CampaignRecipient" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "campaignId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "sentAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CampaignRecipient_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "CampaignRecipient_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE,
    CONSTRAINT "CampaignRecipient_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "CampaignRecipient_campaignId_idx" ON "CampaignRecipient"("campaignId");
CREATE INDEX IF NOT EXISTS "CampaignRecipient_customerId_idx" ON "CampaignRecipient"("customerId");

ALTER TABLE "Campaign" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CampaignRecipient" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant isolation for Campaign" ON "Campaign";
CREATE POLICY "Tenant isolation for Campaign" ON "Campaign"
    USING ("tenantId" = get_current_tenant_id())
    WITH CHECK ("tenantId" = get_current_tenant_id());

DROP POLICY IF EXISTS "Tenant isolation for CampaignRecipient" ON "CampaignRecipient";
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

-- 8. WhatsApp Usage & Limits
CREATE TABLE IF NOT EXISTS "WhatsAppUsageDaily" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "tenantId" TEXT NOT NULL,
    "date" DATE NOT NULL DEFAULT CURRENT_DATE,
    "type" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WhatsAppUsageDaily_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "WhatsAppUsageDaily_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE,
    CONSTRAINT "WhatsAppUsageDaily_tenantId_date_type_key" UNIQUE ("tenantId", "date", "type")
);

ALTER TABLE "WhatsAppUsageDaily" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant isolation for WhatsAppUsageDaily" ON "WhatsAppUsageDaily";
CREATE POLICY "Tenant isolation for WhatsAppUsageDaily" ON "WhatsAppUsageDaily"
    USING ("tenantId" = get_current_tenant_id())
    WITH CHECK ("tenantId" = get_current_tenant_id());

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

-- 9. Subscription System
-- Helper to safely create enums if they exist? Postgres 9.3+ doesn't have IF NOT EXISTS for types easily, but we can catch error
-- However Supabase usually handles it. If not:
-- DO $$ BEGIN CREATE TYPE "PlanType" AS ENUM ...; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
-- But simple CREATE TYPE might fail.
-- I'll wrap them.

DO $$ BEGIN
    CREATE TYPE "PlanType" AS ENUM ('start', 'pro', 'premium');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE "SubscriptionStatus" AS ENUM ('active', 'past_due', 'canceled', 'trialing', 'incomplete', 'incomplete_expired', 'unpaid', 'paused');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DROP TABLE IF EXISTS "WhatsAppLimits" CASCADE;
CREATE TABLE IF NOT EXISTS "WhatsAppLimits" (
    "plan" "PlanType" NOT NULL,
    "monthlyTransactional" INTEGER NOT NULL,
    "transactionalMinimum" INTEGER,
    "monthlyCampaign" INTEGER NOT NULL,
    "dailyCampaign" INTEGER NOT NULL,
    "maxRecipientsPerCampaign" INTEGER NOT NULL,
    "maxTestDaily" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WhatsAppLimits_pkey" PRIMARY KEY ("plan")
);

INSERT INTO "WhatsAppLimits" ("plan", "monthlyTransactional", "transactionalMinimum", "monthlyCampaign", "dailyCampaign", "maxRecipientsPerCampaign", "maxTestDaily")
VALUES 
    ('start', 300, 50, 300, 150, 200, 10),
    ('pro', 1500, 200, 5000, 1000, 1000, 20),
    ('premium', 10000, NULL, 20000, 5000, 5000, 50)
ON CONFLICT ("plan") DO UPDATE SET
    "monthlyTransactional" = EXCLUDED."monthlyTransactional",
    "updatedAt" = CURRENT_TIMESTAMP;

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

ALTER TABLE "WhatsAppLimits" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "WorkspacePlans" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BillingSubscriptions" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read access for WhatsAppLimits" ON "WhatsAppLimits";
CREATE POLICY "Public read access for WhatsAppLimits" ON "WhatsAppLimits"
    FOR SELECT
    USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Tenant isolation for WorkspacePlans" ON "WorkspacePlans";
CREATE POLICY "Tenant isolation for WorkspacePlans" ON "WorkspacePlans"
    USING ("workspaceId" = get_current_tenant_id())
    WITH CHECK ("workspaceId" = get_current_tenant_id());

DROP POLICY IF EXISTS "Tenant isolation for BillingSubscriptions" ON "BillingSubscriptions";
CREATE POLICY "Tenant isolation for BillingSubscriptions" ON "BillingSubscriptions"
    USING ("workspaceId" = get_current_tenant_id())
    WITH CHECK ("workspaceId" = get_current_tenant_id());

INSERT INTO "WorkspacePlans" ("workspaceId", "plan")
SELECT "id", 'start'
FROM "Tenant"
ON CONFLICT ("workspaceId") DO NOTHING;

-- 10. Encrypt PII
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS phone_encrypted TEXT;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS email_encrypted TEXT;

CREATE INDEX IF NOT EXISTS "Customer_phone_encrypted_idx" ON "Customer"(phone_encrypted) WHERE phone_encrypted IS NOT NULL;
CREATE INDEX IF NOT EXISTS "Customer_email_encrypted_idx" ON "Customer"(email_encrypted) WHERE email_encrypted IS NOT NULL;

ALTER TABLE "Supplier" ADD COLUMN IF NOT EXISTS phone_encrypted TEXT;
ALTER TABLE "Supplier" ADD COLUMN IF NOT EXISTS email_encrypted TEXT;

CREATE INDEX IF NOT EXISTS "Supplier_phone_encrypted_idx" ON "Supplier"(phone_encrypted) WHERE phone_encrypted IS NOT NULL;
CREATE INDEX IF NOT EXISTS "Supplier_email_encrypted_idx" ON "Supplier"(email_encrypted) WHERE email_encrypted IS NOT NULL;

-- 11. WhatsApp Manual Template
ALTER TABLE "Settings" ADD COLUMN IF NOT EXISTS "whatsappNotifyTemplate" TEXT DEFAULT 'Olá {cliente}, seu pedido #{numero} está {status}!';

CREATE INDEX IF NOT EXISTS "idx_settings_whatsapp_template" 
ON "Settings"("tenantId") 
WHERE "whatsappNotifyTemplate" IS NOT NULL;
