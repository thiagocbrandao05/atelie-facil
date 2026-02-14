-- ========================================================
-- ATELIÊ FÁCIL: COMPLETE CONSOLIDATED SCHEMA
-- Generated: 2026-02-12
-- ========================================================

-- 1. CLEANUP & EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUMS
DO $$ BEGIN
    CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'LOGIN_FAILED', 'ACCESS_DENIED', 'EXPORT', 'IMPORT', 'BACKUP', 'RESTORE', 'SETTINGS_CHANGED', 'CUSTOM');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE "AuditStatus" AS ENUM ('SUCCESS', 'FAILED', 'PARTIAL');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE "NotificationType" AS ENUM ('STOCK_ALERT', 'ORDER_DEADLINE', 'ORDER_READY', 'SYSTEM', 'INFO');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE "NotificationPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE "PlanType" AS ENUM ('start', 'pro', 'premium');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE "SubscriptionStatus" AS ENUM ('active', 'past_due', 'canceled', 'trialing', 'incomplete', 'incomplete_expired', 'unpaid', 'paused');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3. CORE TABLES

-- Tenant
CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "plan" TEXT NOT NULL DEFAULT 'free',
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Tenant_slug_key" ON "Tenant"("slug");

-- User
CREATE TABLE "User" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenantId" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "image" TEXT,
    "role" TEXT NOT NULL DEFAULT 'admin',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "User_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "User_tenantId_idx" ON "User"("tenantId");

-- Supplier
CREATE TABLE "Supplier" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contact" TEXT,
    "phone" TEXT,
    "phone_encrypted" TEXT,
    "email" TEXT,
    "email_encrypted" TEXT,
    "address" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Supplier_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Material
CREATE TABLE "Material" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "tenantId" TEXT NOT NULL,
    "supplierId" TEXT,
    "name" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "cost" DOUBLE PRECISION DEFAULT 0,
    "quantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "minQuantity" DOUBLE PRECISION,
    "colors" TEXT[] DEFAULT '{}',
    CONSTRAINT "Material_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Material_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Material_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Product
CREATE TABLE "Product" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "imageUrl" TEXT,
    "laborTime" INTEGER NOT NULL,
    "profitMargin" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Product_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Product_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- ProductMaterial
CREATE TABLE "ProductMaterial" (
    "productId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'un',
    "color" TEXT,
    CONSTRAINT "ProductMaterial_pkey" PRIMARY KEY ("productId", "materialId"),
    CONSTRAINT "ProductMaterial_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProductMaterial_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Customer
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "phone_encrypted" TEXT,
    "email" TEXT,
    "email_encrypted" TEXT,
    "address" TEXT,
    "birthday" DATE,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Customer_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Order
CREATE TABLE "Order" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "publicId" TEXT DEFAULT gen_random_uuid()::text,
    "tenantId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "orderNumber" INTEGER,
    "totalValue" DOUBLE PRECISION NOT NULL,
    "discount" DOUBLE PRECISION DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Order_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Order_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Order_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "Order_publicId_key" ON "Order"("publicId");

-- OrderItem
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "discount" DOUBLE PRECISION DEFAULT 0,
    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- StockEntry
CREATE TABLE "StockEntry" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "tenantId" TEXT NOT NULL,
    "supplierName" TEXT NOT NULL,
    "freightCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalCost" DOUBLE PRECISION NOT NULL,
    "paymentMethod" TEXT,
    "installments" INTEGER DEFAULT 1,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StockEntry_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "StockEntry_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- StockEntryItem
CREATE TABLE "StockEntryItem" (
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

-- InventoryMovement
CREATE TABLE "InventoryMovement" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "tenantId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "type" TEXT NOT NULL, -- 'ENTRADA' | 'SAIDA' | 'AJUSTE'
    "quantity" DOUBLE PRECISION NOT NULL,
    "reason" TEXT NOT NULL,
    "reference" TEXT,
    "color" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,
    CONSTRAINT "InventoryMovement_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "InventoryMovement_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "InventoryMovement_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Settings
CREATE TABLE "Settings" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "tenantId" TEXT NOT NULL,
    "storeName" TEXT NOT NULL DEFAULT 'Ateliê Fácil',
    "phone" TEXT,
    "hourlyRate" DECIMAL(65,30) NOT NULL DEFAULT 20.00,
    "msgQuotation" TEXT,
    "msgReady" TEXT,
    "msgApproved" TEXT,
    "msgFinished" TEXT,
    "primaryColor" TEXT NOT NULL DEFAULT 'indigo',
    "whatsappPhoneNumberId" TEXT,
    "whatsappAccessToken" TEXT,
    "whatsappConfigVerified" BOOLEAN DEFAULT FALSE,
    "whatsappNotifyTemplate" TEXT DEFAULT 'Olá {cliente}, seu pedido #{numero} está {status}!',
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Settings_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Settings_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "Settings_tenantId_key" ON "Settings"("tenantId");

-- WhatsApp Notification Logic
CREATE TABLE "WhatsAppNotificationLog" (
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

-- Campaigns
CREATE TABLE "Campaign" (
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
CREATE UNIQUE INDEX "Campaign_campaignToken_key" ON "Campaign"("campaignToken");

CREATE TABLE "CampaignRecipient" (
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

-- Billing & Subscriptions
CREATE TABLE "WhatsAppLimits" (
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
ON CONFLICT ("plan") DO UPDATE SET "monthlyTransactional" = EXCLUDED."monthlyTransactional", "updatedAt" = CURRENT_TIMESTAMP;

CREATE TABLE "WorkspacePlans" (
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

CREATE TABLE "BillingSubscriptions" (
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

-- StockAlert
CREATE TABLE "StockAlert" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "tenantId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "threshold" DOUBLE PRECISION NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "lastAlerted" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StockAlert_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "StockAlert_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StockAlert_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "StockAlert_materialId_key" ON "StockAlert"("materialId");

-- Notification
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "tenantId" TEXT NOT NULL,
    "userId" UUID,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "priority" "NotificationPriority" NOT NULL DEFAULT 'NORMAL',
    "read" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "entityType" TEXT,
    "entityId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Notification_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Real-time Stock Alert Trigger
CREATE OR REPLACE FUNCTION check_low_stock() RETURNS TRIGGER AS $$
DECLARE
    v_min_qty FLOAT;
    v_material_name TEXT;
BEGIN
    SELECT "minQuantity", "name" INTO v_min_qty, v_material_name 
    FROM "Material" WHERE id = NEW.id;

    IF v_min_qty IS NOT NULL AND NEW.quantity < v_min_qty THEN
        -- Upsert StockAlert
        INSERT INTO "StockAlert" ("tenantId", "materialId", "threshold", "updatedAt")
        VALUES (NEW."tenantId", NEW.id, v_min_qty, NOW())
        ON CONFLICT ("materialId") DO UPDATE 
        SET "updatedAt" = NOW();

        -- Create Notification
        INSERT INTO "Notification" ("tenantId", "title", "message", "type", "priority", "entityType", "entityId")
        VALUES (
            NEW."tenantId", 
            'Estoque Baixo: ' || v_material_name,
            'O material ' || v_material_name || ' atingiu ' || NEW.quantity || ' ' || NEW.unit || '. (Mínimo: ' || v_min_qty || ')',
            'STOCK_ALERT',
            'HIGH',
            'Material',
            NEW.id
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_check_low_stock
AFTER UPDATE OF quantity ON "Material"
FOR EACH ROW EXECUTE FUNCTION check_low_stock();

-- 4. RLS POLICIES

-- Tenant ID helper
CREATE OR REPLACE FUNCTION get_current_tenant_id() RETURNS text AS $$
  SELECT COALESCE(
    (auth.jwt() -> 'user_metadata' ->> 'tenantId'),
    (SELECT "tenantId" FROM "User" WHERE id = auth.uid())
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Enable RLS
ALTER TABLE "Tenant" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Supplier" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Material" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Product" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ProductMaterial" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Customer" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Order" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "OrderItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "StockEntry" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "StockEntryItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "InventoryMovement" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Settings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "WhatsAppNotificationLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Campaign" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CampaignRecipient" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "WhatsAppLimits" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "WorkspacePlans" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BillingSubscriptions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "StockAlert" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Notification" ENABLE ROW LEVEL SECURITY;

-- Standard Isolation Policies
CREATE POLICY "Tenant isolation for Tenant" ON "Tenant" USING (id = get_current_tenant_id());
CREATE POLICY "Tenant isolation for User" ON "User" USING ("tenantId" = get_current_tenant_id());
CREATE POLICY "Tenant isolation for Supplier" ON "Supplier" USING ("tenantId" = get_current_tenant_id()) WITH CHECK ("tenantId" = get_current_tenant_id());
CREATE POLICY "Tenant isolation for Material" ON "Material" USING ("tenantId" = get_current_tenant_id()) WITH CHECK ("tenantId" = get_current_tenant_id());
CREATE POLICY "Tenant isolation for Product" ON "Product" USING ("tenantId" = get_current_tenant_id()) WITH CHECK ("tenantId" = get_current_tenant_id());
CREATE POLICY "Tenant isolation for Customer" ON "Customer" USING ("tenantId" = get_current_tenant_id()) WITH CHECK ("tenantId" = get_current_tenant_id());
CREATE POLICY "Tenant isolation for Order" ON "Order" USING ("tenantId" = get_current_tenant_id()) WITH CHECK ("tenantId" = get_current_tenant_id());
CREATE POLICY "Tenant isolation for StockEntry" ON "StockEntry" USING ("tenantId" = get_current_tenant_id()) WITH CHECK ("tenantId" = get_current_tenant_id());
CREATE POLICY "Tenant isolation for StockEntryItem" ON "StockEntryItem" USING ("tenantId" = get_current_tenant_id()) WITH CHECK ("tenantId" = get_current_tenant_id());
CREATE POLICY "Tenant isolation for InventoryMovement" ON "InventoryMovement" USING ("tenantId" = get_current_tenant_id()) WITH CHECK ("tenantId" = get_current_tenant_id());
CREATE POLICY "Tenant isolation for Settings" ON "Settings" USING ("tenantId" = get_current_tenant_id()) WITH CHECK ("tenantId" = get_current_tenant_id());
CREATE POLICY "Tenant isolation for WhatsAppNotificationLog" ON "WhatsAppNotificationLog" USING ("tenantId" = get_current_tenant_id()) WITH CHECK ("tenantId" = get_current_tenant_id());
CREATE POLICY "Tenant isolation for Campaign" ON "Campaign" USING ("tenantId" = get_current_tenant_id()) WITH CHECK ("tenantId" = get_current_tenant_id());
CREATE POLICY "Tenant isolation for WorkspacePlans" ON "WorkspacePlans" USING ("workspaceId" = get_current_tenant_id()) WITH CHECK ("workspaceId" = get_current_tenant_id());
CREATE POLICY "Tenant isolation for BillingSubscriptions" ON "BillingSubscriptions" USING ("workspaceId" = get_current_tenant_id()) WITH CHECK ("workspaceId" = get_current_tenant_id());
CREATE POLICY "Tenant isolation for StockAlert" ON "StockAlert" USING ("tenantId" = get_current_tenant_id()) WITH CHECK ("tenantId" = get_current_tenant_id());
CREATE POLICY "Tenant isolation for Notification" ON "Notification" USING ("tenantId" = get_current_tenant_id()) WITH CHECK ("tenantId" = get_current_tenant_id());

CREATE POLICY "Tenant isolation for OrderItem" ON "OrderItem" USING (EXISTS (SELECT 1 FROM "Order" WHERE "Order".id = "OrderItem"."orderId" AND "Order"."tenantId" = get_current_tenant_id()));
CREATE POLICY "Tenant isolation for ProductMaterial" ON "ProductMaterial" USING (EXISTS (SELECT 1 FROM "Product" WHERE "Product".id = "ProductMaterial"."productId" AND "Product"."tenantId" = get_current_tenant_id()));
CREATE POLICY "Tenant isolation for CampaignRecipient" ON "CampaignRecipient" USING (EXISTS (SELECT 1 FROM "Campaign" WHERE "Campaign".id = "CampaignRecipient"."campaignId" AND "Campaign"."tenantId" = get_current_tenant_id()));
CREATE POLICY "Public read for WhatsAppLimits" ON "WhatsAppLimits" FOR SELECT USING (true);

-- 5. RPC FUNCTIONS

-- Create Order RPC
CREATE OR REPLACE FUNCTION create_order(
  p_tenant_id TEXT,
  p_customer_id TEXT,
  p_status TEXT,
  p_due_date TIMESTAMP,
  p_total_value FLOAT,
  p_items JSONB, -- Array of { productId, quantity, price, discount }
  p_discount FLOAT DEFAULT 0
) RETURNS JSON AS $$
DECLARE
  v_order_id TEXT;
  v_item JSONB;
BEGIN
  IF p_tenant_id != get_current_tenant_id() THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  INSERT INTO "Order" ("tenantId", "customerId", "status", "dueDate", "totalValue", "discount")
  VALUES (p_tenant_id, p_customer_id, p_status, p_due_date, p_total_value, p_discount)
  RETURNING "id" INTO v_order_id;
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    INSERT INTO "OrderItem" ("orderId", "productId", "quantity", "price", "discount")
    VALUES (v_order_id, v_item->>'productId', (v_item->>'quantity')::INTEGER, (v_item->>'price')::FLOAT, COALESCE((v_item->>'discount')::FLOAT, 0));
  END LOOP;
  RETURN json_build_object('success', true, 'id', v_order_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Stock Entry RPC
CREATE OR REPLACE FUNCTION create_stock_entry_transaction(
  p_tenant_id TEXT,
  p_supplier_name TEXT,
  p_freight_cost FLOAT,
  p_total_cost FLOAT,
  p_items JSONB,
  p_note TEXT DEFAULT NULL,
  p_payment_method TEXT DEFAULT NULL,
  p_installments INTEGER DEFAULT 1
) RETURNS JSON AS $$
DECLARE
  v_entry_id TEXT;
  v_item JSONB;
BEGIN
  IF p_tenant_id != get_current_tenant_id() THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  INSERT INTO "StockEntry" ("tenantId", "supplierName", "freightCost", "totalCost", "note", "paymentMethod", "installments")
  VALUES (p_tenant_id, p_supplier_name, p_freight_cost, p_total_cost, p_note, p_payment_method, p_installments)
  RETURNING "id" INTO v_entry_id;
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    INSERT INTO "StockEntryItem" ("stockEntryId", "tenantId", "materialId", "quantity", "unitCost", "color")
    VALUES (v_entry_id, p_tenant_id, v_item->>'materialId', (v_item->>'quantity')::FLOAT, (v_item->>'unitCost')::FLOAT, v_item->>'color');
    UPDATE "Material" SET quantity = quantity + (v_item->>'quantity')::FLOAT, cost = (v_item->>'unitCost')::FLOAT
    WHERE id = (v_item->>'materialId') AND "tenantId" = p_tenant_id;
    INSERT INTO "InventoryMovement" ("tenantId", "materialId", "type", "quantity", "reason", "reference", "color")
    VALUES (p_tenant_id, v_item->>'materialId', 'ENTRADA', (v_item->>'quantity')::FLOAT, 'Compra - ' || p_supplier_name, v_entry_id, v_item->>'color');
  END LOOP;
  RETURN json_build_object('success', true, 'id', v_entry_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- record_inventory_movement RPC
CREATE OR REPLACE FUNCTION record_inventory_movement(
  p_tenant_id TEXT,
  p_material_id TEXT,
  p_type TEXT,
  p_quantity FLOAT,
  p_reason TEXT,
  p_reference TEXT DEFAULT NULL,
  p_color TEXT DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
  v_current_qty FLOAT;
BEGIN
  IF p_tenant_id != get_current_tenant_id() THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  SELECT quantity INTO v_current_qty FROM "Material" WHERE id = p_material_id AND "tenantId" = p_tenant_id;
  IF p_type = 'ENTRADA' THEN v_current_qty := v_current_qty + p_quantity;
  ELSIF p_type = 'SAIDA' THEN v_current_qty := v_current_qty - p_quantity;
  ELSE v_current_qty := p_quantity; END IF;
  UPDATE "Material" SET quantity = v_current_qty WHERE id = p_material_id;
  INSERT INTO "InventoryMovement" ("tenantId", "materialId", "type", "quantity", "reason", "reference", "color")
  VALUES (p_tenant_id, p_material_id, p_type, p_quantity, p_reason, p_reference, p_color);
  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create Product with Materials RPC
CREATE OR REPLACE FUNCTION create_product_with_materials(
  p_tenant_id TEXT,
  p_name TEXT,
  p_image_url TEXT,
  p_labor_time INTEGER,
  p_profit_margin FLOAT,
  p_materials JSONB -- Array of { id, quantity, unit, color }
) RETURNS JSON AS $$
DECLARE
  v_product_id TEXT;
  v_mat JSONB;
BEGIN
  IF p_tenant_id != get_current_tenant_id() THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  INSERT INTO "Product" ("tenantId", "name", "imageUrl", "laborTime", "profitMargin")
  VALUES (p_tenant_id, p_name, p_image_url, p_labor_time, p_profit_margin)
  RETURNING "id" INTO v_product_id;
  FOR v_mat IN SELECT * FROM jsonb_array_elements(p_materials) LOOP
    INSERT INTO "ProductMaterial" ("productId", "materialId", "quantity", "unit", "color")
    VALUES (v_product_id, v_mat->>'id', (v_mat->>'quantity')::FLOAT, v_mat->>'unit', v_mat->>'color');
  END LOOP;
  RETURN json_build_object('success', true, 'id', v_product_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create Order with Items atomically
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
  IF p_tenant_id != get_current_tenant_id() THEN
     RAISE EXCEPTION 'Unauthorized tenant access';
  END IF;

  INSERT INTO "Order" ("id", "tenantId", "customerId", "status", "dueDate", "totalValue", "discount", "createdAt")
  VALUES (gen_random_uuid()::text, p_tenant_id, p_customer_id, p_status, p_due_date, p_total_value, p_discount, NOW())
  RETURNING "id" INTO v_order_id;

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

-- Delete Order RPC
CREATE OR REPLACE FUNCTION delete_order(
  p_order_id TEXT,
  p_tenant_id TEXT
)
RETURNS JSON AS $$
BEGIN
  IF p_tenant_id != get_current_tenant_id() THEN
     RAISE EXCEPTION 'Unauthorized tenant access';
  END IF;

  DELETE FROM "Order" WHERE "id" = p_order_id AND "tenantId" = p_tenant_id;
  
  RETURN json_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'message', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger set_order_sequential_number
CREATE OR REPLACE FUNCTION set_order_sequential_number()
RETURNS TRIGGER AS $$
BEGIN
    SELECT COALESCE(MAX("orderNumber"), 0) + 1
    INTO NEW."orderNumber"
    FROM "Order"
    WHERE "tenantId" = NEW."tenantId";
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_order_number ON "Order";
CREATE TRIGGER trg_set_order_number
BEFORE INSERT ON "Order"
FOR EACH ROW
EXECUTE FUNCTION set_order_sequential_number();

-- Update Product with Materials RPC
CREATE OR REPLACE FUNCTION update_product_with_materials(
  p_product_id TEXT,
  p_tenant_id TEXT,
  p_name TEXT,
  p_image_url TEXT,
  p_labor_time INTEGER,
  p_profit_margin FLOAT,
  p_materials JSONB -- Array of { id, quantity, unit, color }
) RETURNS JSON AS $$
DECLARE
  v_mat JSONB;
BEGIN
  IF p_tenant_id != get_current_tenant_id() THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  UPDATE "Product" SET "name" = p_name, "imageUrl" = p_image_url, "laborTime" = p_labor_time, "profitMargin" = p_profit_margin
  WHERE "id" = p_product_id AND "tenantId" = p_tenant_id;
  DELETE FROM "ProductMaterial" WHERE "productId" = p_product_id;
  FOR v_mat IN SELECT * FROM jsonb_array_elements(p_materials) LOOP
    INSERT INTO "ProductMaterial" ("productId", "materialId", "quantity", "unit", "color")
    VALUES (p_product_id, v_mat->>'id', (v_mat->>'quantity')::FLOAT, v_mat->>'unit', v_mat->>'color');
  END LOOP;
  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Delete Product RPC
CREATE OR REPLACE FUNCTION delete_product(
  p_product_id TEXT,
  p_tenant_id TEXT
) RETURNS JSON AS $$
BEGIN
  IF p_tenant_id != get_current_tenant_id() THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  DELETE FROM "Product" WHERE "id" = p_product_id AND "tenantId" = p_tenant_id;
  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Analytics: Get Top Products
CREATE OR REPLACE FUNCTION get_top_products(
  p_tenant_id TEXT,
  p_limit INTEGER DEFAULT 5
)
RETURNS TABLE (
  "productId" TEXT,
  "productName" TEXT,
  "totalQuantity" BIGINT
) AS $$
BEGIN
  IF p_tenant_id != get_current_tenant_id() THEN
     RAISE EXCEPTION 'Unauthorized tenant access';
  END IF;

  RETURN QUERY
  SELECT 
    p."id" as "productId",
    p."name" as "productName",
    SUM(oi."quantity")::BIGINT as "totalQuantity"
  FROM "OrderItem" oi
  JOIN "Order" o ON oi."orderId" = o."id"
  JOIN "Product" p ON oi."productId" = p."id"
  WHERE 
    o."tenantId" = p_tenant_id
    AND o."status" NOT IN ('CANCELLED', 'CANCELED')
  GROUP BY p."id", p."name"
  ORDER BY "totalQuantity" DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. VIEWS
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
