-- ========================================================
-- ATELIÊ FÁCIL: COMPLETE SCHEMA SNAPSHOT
-- Generated: 2026-02-05 (Updated with Advanced Features)
-- ========================================================

-- ========================================================
-- 1. CLEANUP (Start Fresh if running full reset)
-- ========================================================

DROP TABLE IF EXISTS "Notification" CASCADE;
DROP TABLE IF EXISTS "AuditLog" CASCADE;
DROP TABLE IF EXISTS "StockAlert" CASCADE;
DROP TABLE IF EXISTS "InventoryMovement" CASCADE;
DROP TABLE IF EXISTS "OrderItem" CASCADE;
DROP TABLE IF EXISTS "Order" CASCADE;
DROP TABLE IF EXISTS "ProductMaterial" CASCADE;
DROP TABLE IF EXISTS "Product" CASCADE;
DROP TABLE IF EXISTS "Material" CASCADE;
DROP TABLE IF EXISTS "Supplier" CASCADE;
DROP TABLE IF EXISTS "CustomerMeasurements" CASCADE;
DROP TABLE IF EXISTS "Customer" CASCADE;
DROP TABLE IF EXISTS "Settings" CASCADE;
DROP TABLE IF EXISTS "User" CASCADE;
DROP TABLE IF EXISTS "Tenant" CASCADE;

-- DROP ENUMS
DROP TYPE IF EXISTS "AuditAction";
DROP TYPE IF EXISTS "AuditStatus";
DROP TYPE IF EXISTS "NotificationType";
DROP TYPE IF EXISTS "NotificationPriority";

-- DROP FUNCTIONS
DROP FUNCTION IF EXISTS get_current_tenant_id();
DROP FUNCTION IF EXISTS record_inventory_movement(TEXT, TEXT, TEXT, DOUBLE PRECISION, TEXT, TEXT);

-- ========================================================
-- 2. TABLES & EXTENSIONS
-- ========================================================

-- Enable pgcrypto for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ENUMS
CREATE TYPE "AuditAction" AS ENUM (
    'CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 
    'LOGIN_FAILED', 'ACCESS_DENIED', 'EXPORT', 'IMPORT', 
    'BACKUP', 'RESTORE', 'SETTINGS_CHANGED', 'CUSTOM'
);

CREATE TYPE "AuditStatus" AS ENUM ('SUCCESS', 'FAILED', 'PARTIAL');

CREATE TYPE "NotificationType" AS ENUM (
    'STOCK_ALERT', 'ORDER_DEADLINE', 'ORDER_READY', 'SYSTEM', 'INFO'
);

CREATE TYPE "NotificationPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- TABLES

-- Tenant
CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "plan" TEXT NOT NULL DEFAULT 'free',
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Tenant_slug_key" ON "Tenant"("slug");

-- User
CREATE TABLE "User" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(), -- Supabase Auth users use UUID
    "tenantId" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "image" TEXT,
    "role" TEXT NOT NULL DEFAULT 'admin',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "User_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "User_tenantId_idx" ON "User"("tenantId");
CREATE INDEX "User_email_idx" ON "User"("email");

-- Supplier
CREATE TABLE "Supplier" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contact" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Supplier_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "Supplier_tenantId_idx" ON "Supplier"("tenantId");
CREATE INDEX "Supplier_tenantId_name_idx" ON "Supplier"("tenantId", "name");

-- Material
CREATE TABLE "Material" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "tenantId" TEXT NOT NULL,
    "supplierId" TEXT,
    "name" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "cost" DOUBLE PRECISION NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "minQuantity" DOUBLE PRECISION,

    CONSTRAINT "Material_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Material_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Material_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "Material_tenantId_idx" ON "Material"("tenantId");
CREATE INDEX "Material_supplierId_idx" ON "Material"("supplierId");
CREATE INDEX "Material_tenantId_name_idx" ON "Material"("tenantId", "name");

-- Product
CREATE TABLE "Product" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "imageUrl" TEXT,
    "laborTime" INTEGER NOT NULL,
    "profitMargin" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Product_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "Product_tenantId_idx" ON "Product"("tenantId");
CREATE INDEX "Product_tenantId_name_idx" ON "Product"("tenantId", "name");

-- ProductMaterial
CREATE TABLE "ProductMaterial" (
    "productId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'un',
    "color" TEXT,

    CONSTRAINT "ProductMaterial_pkey" PRIMARY KEY ("productId", "materialId"),
    CONSTRAINT "ProductMaterial_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ProductMaterial_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "ProductMaterial_productId_idx" ON "ProductMaterial"("productId");
CREATE INDEX "ProductMaterial_materialId_idx" ON "ProductMaterial"("materialId");

-- Customer
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "notes" TEXT,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Customer_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "Customer_tenantId_idx" ON "Customer"("tenantId");
CREATE INDEX "Customer_tenantId_name_idx" ON "Customer"("tenantId", "name");

-- CustomerMeasurements (NEW)
CREATE TABLE "CustomerMeasurements" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "tenantId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "unit" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomerMeasurements_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "CustomerMeasurements_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CustomerMeasurements_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "CustomerMeasurements_customerId_idx" ON "CustomerMeasurements"("customerId");
CREATE INDEX "CustomerMeasurements_tenantId_idx" ON "CustomerMeasurements"("tenantId");

-- Order
CREATE TABLE "Order" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "tenantId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "totalValue" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Order_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Order_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "Order_tenantId_idx" ON "Order"("tenantId");
CREATE INDEX "Order_customerId_idx" ON "Order"("customerId");
CREATE INDEX "Order_status_idx" ON "Order"("status");
CREATE INDEX "Order_dueDate_idx" ON "Order"("dueDate");
CREATE INDEX "Order_createdAt_idx" ON "Order"("createdAt");
CREATE INDEX "Order_tenantId_status_idx" ON "Order"("tenantId", "status");
CREATE INDEX "Order_tenantId_dueDate_idx" ON "Order"("tenantId", "dueDate");

-- OrderItem
CREATE TABLE "OrderItem" (
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("orderId", "productId"),
    CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");
CREATE INDEX "OrderItem_productId_idx" ON "OrderItem"("productId");

-- InventoryMovement
CREATE TABLE "InventoryMovement" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "tenantId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "type" TEXT NOT NULL, -- 'IN' | 'OUT' | 'ADJUSTMENT'
    "quantity" DOUBLE PRECISION NOT NULL,
    "reason" TEXT NOT NULL,
    "reference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,

    CONSTRAINT "InventoryMovement_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "InventoryMovement_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "InventoryMovement_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "InventoryMovement_tenantId_idx" ON "InventoryMovement"("tenantId");
CREATE INDEX "InventoryMovement_materialId_idx" ON "InventoryMovement"("materialId");
CREATE INDEX "InventoryMovement_createdAt_idx" ON "InventoryMovement"("createdAt");
CREATE INDEX "InventoryMovement_tenantId_createdAt_idx" ON "InventoryMovement"("tenantId", "createdAt");

-- StockAlert
CREATE TABLE "StockAlert" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "tenantId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "threshold" DOUBLE PRECISION NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "lastAlerted" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StockAlert_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "StockAlert_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StockAlert_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "StockAlert_materialId_key" ON "StockAlert"("materialId");
CREATE INDEX "StockAlert_tenantId_idx" ON "StockAlert"("tenantId");

-- Settings (UPDATED)
CREATE TABLE "Settings" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "tenantId" TEXT NOT NULL,
    "storeName" TEXT NOT NULL DEFAULT 'Ateliê Fácil',
    "phone" TEXT,
    "email" TEXT,
    "instagram" TEXT,
    "facebook" TEXT,
    "logoUrl" TEXT,
    "addressStreet" TEXT,
    "addressNumber" TEXT,
    "addressComplement" TEXT,
    "addressNeighborhood" TEXT,
    "addressCity" TEXT,
    "addressState" TEXT,
    "addressZip" TEXT,
    "hourlyRate" DECIMAL(65,30) NOT NULL DEFAULT 20.00,
    "monthlyFixedCosts" JSONB DEFAULT '[]'::jsonb,
    "desirableSalary" DECIMAL(65,30) DEFAULT 2000.00,
    "workingHoursPerMonth" INTEGER DEFAULT 160,
    "defaultProfitMargin" DECIMAL(65,30) DEFAULT 50.00,
    "msgQuotation" TEXT,
    "msgApproved" TEXT,
    "msgReady" TEXT,
    "msgFinished" TEXT,
    "quotationValidityDays" INTEGER DEFAULT 15,
    "defaultQuotationNotes" TEXT,
    "primaryColor" TEXT NOT NULL DEFAULT 'indigo',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Settings_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Settings_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "Settings_tenantId_key" ON "Settings"("tenantId");

-- AuditLog
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "tenantId" TEXT NOT NULL,
    "userId" UUID,
    "action" "AuditAction" NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "changes" JSONB,
    "metadata" JSONB,
    "status" "AuditStatus" NOT NULL DEFAULT 'SUCCESS',
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "AuditLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "AuditLog_tenantId_createdAt_idx" ON "AuditLog"("tenantId", "createdAt");
CREATE INDEX "AuditLog_tenantId_userId_idx" ON "AuditLog"("tenantId", "userId");
CREATE INDEX "AuditLog_tenantId_entity_idx" ON "AuditLog"("tenantId", "entity");
CREATE INDEX "AuditLog_tenantId_action_idx" ON "AuditLog"("tenantId", "action");

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
CREATE INDEX "Notification_tenantId_userId_read_idx" ON "Notification"("tenantId", "userId", "read");
CREATE INDEX "Notification_tenantId_createdAt_idx" ON "Notification"("tenantId", "createdAt");

-- ========================================================
-- 3. RLS POLICIES
-- ========================================================

-- Enable RLS on all tables
ALTER TABLE "Tenant" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Customer" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CustomerMeasurements" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Material" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Product" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ProductMaterial" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Order" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "OrderItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "InventoryMovement" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Supplier" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Settings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "StockAlert" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Notification" ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user's tenant_id
CREATE OR REPLACE FUNCTION get_current_tenant_id() RETURNS text AS $$
  SELECT "tenantId" FROM "User" WHERE id = auth.uid()
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Standard Policy: Tenant Isolation

-- Tenant: Users can view their own tenant.
CREATE POLICY "Users can view own tenant" ON "Tenant"
  USING (id = get_current_tenant_id());

-- User: Users can view users in same tenant
CREATE POLICY "Users can view users in own tenant" ON "User"
  USING ("tenantId" = get_current_tenant_id());
  
-- Customer
CREATE POLICY "Tenant isolation for Customer" ON "Customer"
  USING ("tenantId" = get_current_tenant_id())
  WITH CHECK ("tenantId" = get_current_tenant_id());

-- CustomerMeasurements
CREATE POLICY "Tenant isolation for CustomerMeasurements" ON "CustomerMeasurements"
  USING ("tenantId" = get_current_tenant_id())
  WITH CHECK ("tenantId" = get_current_tenant_id());

-- Material
CREATE POLICY "Tenant isolation for Material" ON "Material"
  USING ("tenantId" = get_current_tenant_id())
  WITH CHECK ("tenantId" = get_current_tenant_id());

-- Product
CREATE POLICY "Tenant isolation for Product" ON "Product"
  USING ("tenantId" = get_current_tenant_id())
  WITH CHECK ("tenantId" = get_current_tenant_id());

-- Order
CREATE POLICY "Tenant isolation for Order" ON "Order"
  USING ("tenantId" = get_current_tenant_id())
  WITH CHECK ("tenantId" = get_current_tenant_id());

-- InventoryMovement
CREATE POLICY "Tenant isolation for InventoryMovement" ON "InventoryMovement"
  USING ("tenantId" = get_current_tenant_id())
  WITH CHECK ("tenantId" = get_current_tenant_id());

-- Supplier
CREATE POLICY "Tenant isolation for Supplier" ON "Supplier"
  USING ("tenantId" = get_current_tenant_id())
  WITH CHECK ("tenantId" = get_current_tenant_id());

-- Settings
CREATE POLICY "Tenant isolation for Settings" ON "Settings"
  USING ("tenantId" = get_current_tenant_id())
  WITH CHECK ("tenantId" = get_current_tenant_id());

-- StockAlert
CREATE POLICY "Tenant isolation for StockAlert" ON "StockAlert"
  USING ("tenantId" = get_current_tenant_id())
  WITH CHECK ("tenantId" = get_current_tenant_id());

-- AuditLog
CREATE POLICY "Tenant isolation for AuditLog" ON "AuditLog"
  USING ("tenantId" = get_current_tenant_id())
  WITH CHECK ("tenantId" = get_current_tenant_id());

-- Notification
CREATE POLICY "Tenant isolation for Notification" ON "Notification"
  USING ("tenantId" = get_current_tenant_id())
  WITH CHECK ("tenantId" = get_current_tenant_id());


-- Complex Policies (Tables without direct tenantId)

-- OrderItem (linked via Order)
CREATE POLICY "Tenant isolation for OrderItem" ON "OrderItem"
  USING (
    EXISTS (
      SELECT 1 FROM "Order"
      WHERE "Order".id = "OrderItem"."orderId"
      AND "Order"."tenantId" = get_current_tenant_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "Order"
      WHERE "Order".id = "OrderItem"."orderId"
      AND "Order"."tenantId" = get_current_tenant_id()
    )
  );

-- ProductMaterial (linked via Product)
CREATE POLICY "Tenant isolation for ProductMaterial" ON "ProductMaterial"
  USING (
    EXISTS (
      SELECT 1 FROM "Product"
      WHERE "Product".id = "ProductMaterial"."productId"
      AND "Product"."tenantId" = get_current_tenant_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "Product"
      WHERE "Product".id = "ProductMaterial"."productId"
      AND "Product"."tenantId" = get_current_tenant_id()
    )
  );

-- ========================================================
-- 4. RPC FUNCTIONS (CORE)
-- ========================================================

-- Inventory Movement Function
CREATE OR REPLACE FUNCTION record_inventory_movement(
  p_tenant_id TEXT,
  p_material_id TEXT,
  p_type TEXT,
  p_quantity FLOAT,
  p_reason TEXT,
  p_reference TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_material RECORD;
  v_new_quantity FLOAT;
BEGIN
  -- Verify tenant access
  IF p_tenant_id != get_current_tenant_id() THEN
     RAISE EXCEPTION 'Unauthorized tenant access';
  END IF;

  -- Get current material
  SELECT * INTO v_material FROM "Material" WHERE id = p_material_id AND "tenantId" = p_tenant_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', 'Material não encontrado');
  END IF;
  
  -- Calculate new quantity
  IF p_type = 'IN' THEN
    v_new_quantity := v_material.quantity + p_quantity;
  ELSIF p_type = 'OUT' THEN
    v_new_quantity := v_material.quantity - p_quantity;
    IF v_new_quantity < 0 THEN
      RETURN json_build_object('success', false, 'message', 'Quantidade insuficiente');
    END IF;
  ELSE
    v_new_quantity := p_quantity;
  END IF;
  
  -- Update material
  UPDATE "Material" SET quantity = v_new_quantity WHERE id = p_material_id;
  
  -- Record movement
  INSERT INTO "InventoryMovement" (id, "tenantId", "materialId", type, quantity, reason, reference, "createdAt")
  VALUES (gen_random_uuid()::text, p_tenant_id, p_material_id, p_type, p_quantity, p_reason, p_reference, NOW());
  
  RETURN json_build_object('success', true, 'message', 'Movimentação registrada');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ========================================================
-- 5. RPC FUNCTIONS (ANALYTICS)
-- ========================================================

-- RPC: Get Top Products (Sum quantity by Product)
CREATE OR REPLACE FUNCTION get_top_products(
  p_tenant_id TEXT,
  p_limit INTEGER DEFAULT 5
)
RETURNS TABLE (
  "productName" TEXT,
  "totalQuantity" BIGINT
) AS $$
BEGIN
  IF p_tenant_id != get_current_tenant_id() THEN
     RAISE EXCEPTION 'Unauthorized tenant access';
  END IF;

  RETURN QUERY
  SELECT 
    p."name" as "productName",
    SUM(oi."quantity") as "totalQuantity"
  FROM "OrderItem" oi
  JOIN "Order" o ON oi."orderId" = o."id"
  JOIN "Product" p ON oi."productId" = p."id"
  WHERE 
    o."tenantId" = p_tenant_id
    AND o."status" != 'CANCELLED'
  GROUP BY p."name"
  ORDER BY "totalQuantity" DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- RPC: Get Audit Stats
CREATE OR REPLACE FUNCTION get_audit_stats(p_tenant_id TEXT)
RETURNS JSON AS $$
DECLARE
  v_total_logs INTEGER;
  v_recent_activity INTEGER;
  v_breakdown JSONB;
BEGIN
  IF p_tenant_id != get_current_tenant_id() THEN
     RAISE EXCEPTION 'Unauthorized tenant access';
  END IF;

  -- Total Logs
  SELECT COUNT(*) INTO v_total_logs 
  FROM "AuditLog" 
  WHERE "tenantId" = p_tenant_id;

  -- Recent Activity (Last 24h)
  SELECT COUNT(*) INTO v_recent_activity 
  FROM "AuditLog" 
  WHERE "tenantId" = p_tenant_id 
  AND "createdAt" >= NOW() - INTERVAL '24 hours';

  -- Action Breakdown
  SELECT jsonb_agg(t) INTO v_breakdown
  FROM (
    SELECT "action", COUNT(*) as "count"
    FROM "AuditLog"
    WHERE "tenantId" = p_tenant_id
    GROUP BY "action"
  ) t;

  RETURN json_build_object(
    'totalLogs', v_total_logs,
    'recentActivity', v_recent_activity,
    'actionBreakdown', COALESCE(v_breakdown, '[]'::jsonb)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ========================================================
-- 6. RPC FUNCTIONS (PRODUCT & MATERIALS)
-- ========================================================

-- RPC: Create Product with Materials
CREATE OR REPLACE FUNCTION create_product_with_materials(
  p_tenant_id TEXT,
  p_name TEXT,
  p_image_url TEXT,
  p_labor_time INTEGER,
  p_profit_margin FLOAT,
  p_materials JSONB -- Array of { id, quantity, unit }
)
RETURNS JSON AS $$
DECLARE
  v_product_id TEXT;
  v_mat JSONB;
BEGIN
  IF p_tenant_id != get_current_tenant_id() THEN
     RAISE EXCEPTION 'Unauthorized tenant access';
  END IF;

  -- Insert Product
  INSERT INTO "Product" ("id", "tenantId", "name", "imageUrl", "laborTime", "profitMargin")
  VALUES (gen_random_uuid()::text, p_tenant_id, p_name, p_image_url, p_labor_time, p_profit_margin)
  RETURNING "id" INTO v_product_id;

  -- Insert Product Materials
  FOR v_mat IN SELECT * FROM jsonb_array_elements(p_materials)
  LOOP
    INSERT INTO "ProductMaterial" ("productId", "materialId", "quantity", "unit")
    VALUES (
      v_product_id, 
      v_mat->>'id', 
      (v_mat->>'quantity')::FLOAT, 
      v_mat->>'unit'
    );
  END LOOP;

  RETURN json_build_object('success', true, 'id', v_product_id);
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'message', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- RPC: Update Product with Materials
CREATE OR REPLACE FUNCTION update_product_with_materials(
  p_product_id TEXT,
  p_tenant_id TEXT,
  p_name TEXT,
  p_image_url TEXT,
  p_labor_time INTEGER,
  p_profit_margin FLOAT,
  p_materials JSONB -- Array of { id, quantity, unit }
)
RETURNS JSON AS $$
DECLARE
  v_mat JSONB;
BEGIN
  IF p_tenant_id != get_current_tenant_id() THEN
     RAISE EXCEPTION 'Unauthorized tenant access';
  END IF;

  -- Update Product
  UPDATE "Product" 
  SET 
    "name" = p_name,
    "imageUrl" = p_image_url,
    "laborTime" = p_labor_time,
    "profitMargin" = p_profit_margin
  WHERE "id" = p_product_id AND "tenantId" = p_tenant_id;

  -- Delete existing materials
  DELETE FROM "ProductMaterial" WHERE "productId" = p_product_id;

  -- Insert new materials
  FOR v_mat IN SELECT * FROM jsonb_array_elements(p_materials)
  LOOP
    INSERT INTO "ProductMaterial" ("productId", "materialId", "quantity", "unit")
    VALUES (
      p_product_id, 
      v_mat->>'id', 
      (v_mat->>'quantity')::FLOAT, 
      v_mat->>'unit'
    );
  END LOOP;

  RETURN json_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'message', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- RPC: Delete Product (Cascade Materials)
CREATE OR REPLACE FUNCTION delete_product(
  p_product_id TEXT,
  p_tenant_id TEXT
)
RETURNS JSON AS $$
BEGIN
  IF p_tenant_id != get_current_tenant_id() THEN
     RAISE EXCEPTION 'Unauthorized tenant access';
  END IF;

  -- Delete materials first
  DELETE FROM "ProductMaterial" WHERE "productId" = p_product_id;
  
  -- Delete product
  DELETE FROM "Product" WHERE "id" = p_product_id AND "tenantId" = p_tenant_id;
  
  RETURN json_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'message', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ========================================================
-- 7. RPC FUNCTIONS (TRANSACTIONS & ORDERS)
-- ========================================================

-- RPC: Create Order with Items atomically
CREATE OR REPLACE FUNCTION create_order(
  p_tenant_id TEXT,
  p_customer_id TEXT,
  p_status TEXT,
  p_due_date TIMESTAMP,
  p_total_value FLOAT,
  p_items JSONB -- Array of { productId, quantity, price }
)
RETURNS JSON AS $$
DECLARE
  v_order_id TEXT;
  v_item JSONB;
BEGIN
  -- Verify tenant access (redundant if called via RLS but good practice)
  IF p_tenant_id != get_current_tenant_id() THEN
     RAISE EXCEPTION 'Unauthorized tenant access';
  END IF;

  -- Insert Order
  INSERT INTO "Order" ("id", "tenantId", "customerId", "status", "dueDate", "totalValue", "createdAt")
  VALUES (gen_random_uuid()::text, p_tenant_id, p_customer_id, p_status, p_due_date, p_total_value, NOW())
  RETURNING "id" INTO v_order_id;

  -- Insert Items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO "OrderItem" ("orderId", "productId", "quantity", "price")
    VALUES (
      v_order_id, 
      v_item->>'productId', 
      (v_item->>'quantity')::INTEGER, 
      (v_item->>'price')::FLOAT
    );
  END LOOP;

  RETURN json_build_object('success', true, 'id', v_order_id);
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'message', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- RPC: Deduct Stock for Order (Atomic)
CREATE OR REPLACE FUNCTION deduct_stock_for_order(
  p_order_id TEXT,
  p_tenant_id TEXT
)
RETURNS JSON AS $$
DECLARE
  v_item RECORD;
  v_prod_mat RECORD;
  v_deduction FLOAT;
BEGIN
    IF p_tenant_id != get_current_tenant_id() THEN
       RAISE EXCEPTION 'Unauthorized tenant access';
    END IF;

    -- Iterate over order items
    FOR v_item IN 
      SELECT * FROM "OrderItem" WHERE "orderId" = p_order_id
    LOOP
       -- Find materials for the product
       FOR v_prod_mat IN 
         SELECT * FROM "ProductMaterial" WHERE "productId" = v_item."productId"
       LOOP
          v_deduction := v_prod_mat.quantity * v_item.quantity;
          
          -- Deduct from Material
          UPDATE "Material" 
          SET quantity = quantity - v_deduction 
          WHERE id = v_prod_mat."materialId" AND "tenantId" = p_tenant_id;
       END LOOP;
    END LOOP;

    RETURN json_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'message', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- RPC: Delete Order (Cascade Items)
CREATE OR REPLACE FUNCTION delete_order(
  p_order_id TEXT,
  p_tenant_id TEXT
)
RETURNS JSON AS $$
BEGIN
  IF p_tenant_id != get_current_tenant_id() THEN
     RAISE EXCEPTION 'Unauthorized tenant access';
  END IF;

  -- Delete items first (if no cascade constraint)
  DELETE FROM "OrderItem" WHERE "orderId" = p_order_id;
  
  -- Delete order
  DELETE FROM "Order" WHERE "id" = p_order_id AND "tenantId" = p_tenant_id;
  
  RETURN json_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'message', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
