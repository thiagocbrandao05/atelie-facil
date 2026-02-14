-- Consolidated Migration Init V2



-- ==========================================
-- Original Migration: 20260205000000_snapshot.sql
-- ==========================================

-- ========================================================
-- ATELIÊ FÁCIL: COMPLETE SCHEMA SNAPSHOT
-- Generated: 2026-02-05
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
    "cost" DOUBLE PRECISION DEFAULT NULL,
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

-- Settings
CREATE TABLE "Settings" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "tenantId" TEXT NOT NULL,
    "storeName" TEXT NOT NULL DEFAULT 'Ateliê Fácil',
    "phone" TEXT,
    "hourlyRate" DECIMAL(65,30) NOT NULL DEFAULT 20.00,
    "msgQuotation" TEXT,
    "msgReady" TEXT,
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


-- ==========================================
-- Original Migration: 20260205000001_settings_expansion.sql
-- ==========================================

-- Add missing columns to Settings table for advanced pricing and feature set
ALTER TABLE "Settings" ADD COLUMN IF NOT EXISTS "email" TEXT;
ALTER TABLE "Settings" ADD COLUMN IF NOT EXISTS "instagram" TEXT;
ALTER TABLE "Settings" ADD COLUMN IF NOT EXISTS "facebook" TEXT;
ALTER TABLE "Settings" ADD COLUMN IF NOT EXISTS "msgApproved" TEXT;
ALTER TABLE "Settings" ADD COLUMN IF NOT EXISTS "msgFinished" TEXT;
ALTER TABLE "Settings" ADD COLUMN IF NOT EXISTS "logoUrl" TEXT;
ALTER TABLE "Settings" ADD COLUMN IF NOT EXISTS "addressStreet" TEXT;
ALTER TABLE "Settings" ADD COLUMN IF NOT EXISTS "addressNumber" TEXT;
ALTER TABLE "Settings" ADD COLUMN IF NOT EXISTS "addressComplement" TEXT;
ALTER TABLE "Settings" ADD COLUMN IF NOT EXISTS "addressNeighborhood" TEXT;
ALTER TABLE "Settings" ADD COLUMN IF NOT EXISTS "addressCity" TEXT;
ALTER TABLE "Settings" ADD COLUMN IF NOT EXISTS "addressState" TEXT;
ALTER TABLE "Settings" ADD COLUMN IF NOT EXISTS "addressZip" TEXT;
ALTER TABLE "Settings" ADD COLUMN IF NOT EXISTS "quotationValidityDays" INTEGER DEFAULT 15;
ALTER TABLE "Settings" ADD COLUMN IF NOT EXISTS "defaultQuotationNotes" TEXT;
ALTER TABLE "Settings" ADD COLUMN IF NOT EXISTS "monthlyFixedCosts" JSONB DEFAULT '[]'::jsonb;
ALTER TABLE "Settings" ADD COLUMN IF NOT EXISTS "desirableSalary" DECIMAL(65,30) DEFAULT 2000.00;
ALTER TABLE "Settings" ADD COLUMN IF NOT EXISTS "workingHoursPerMonth" INTEGER DEFAULT 160;
ALTER TABLE "Settings" ADD COLUMN IF NOT EXISTS "defaultProfitMargin" DECIMAL(65,30) DEFAULT 50.00;


-- ==========================================
-- Original Migration: 20260206000002_add_discounts.sql
-- ==========================================

-- Migration to add discount columns and update RPC functions
ALTER TABLE "Order" ADD COLUMN "discount" DOUBLE PRECISION DEFAULT 0;
ALTER TABLE "OrderItem" ADD COLUMN "discount" DOUBLE PRECISION DEFAULT 0;

-- Update create_order RPC
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


-- ==========================================
-- Original Migration: 20260206000003_whatsapp_notification_logs.sql
-- ==========================================

-- WhatsApp notification logs table for automatic messaging
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

CREATE POLICY "Tenant isolation for WhatsAppNotificationLog" ON "WhatsAppNotificationLog"
  USING ("tenantId" = get_current_tenant_id())
  WITH CHECK ("tenantId" = get_current_tenant_id());


-- ==========================================
-- Original Migration: 20260208000001_whatsapp_settings.sql
-- ==========================================

-- Add WhatsApp Cloud API credential columns to Settings table
ALTER TABLE "Settings" ADD COLUMN IF NOT EXISTS "whatsappPhoneNumberId" TEXT;
ALTER TABLE "Settings" ADD COLUMN IF NOT EXISTS "whatsappAccessToken" TEXT;
ALTER TABLE "Settings" ADD COLUMN IF NOT EXISTS "whatsappConfigVerified" BOOLEAN DEFAULT FALSE;


-- ==========================================
-- Original Migration: 20260208000002_create_stock_entry.sql
-- ==========================================

-- Create StockEntry (Purchases)
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

-- Create StockEntryItem
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

-- Enable RLS
ALTER TABLE "StockEntry" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "StockEntryItem" ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Tenant isolation for StockEntry" ON "StockEntry"
  USING ("tenantId" = get_current_tenant_id())
  WITH CHECK ("tenantId" = get_current_tenant_id());

CREATE POLICY "Tenant isolation for StockEntryItem" ON "StockEntryItem"
  USING ("tenantId" = get_current_tenant_id())
  WITH CHECK ("tenantId" = get_current_tenant_id());

-- RPC: Create Stock Entry Transaction
CREATE OR REPLACE FUNCTION create_stock_entry_transaction(
  p_tenant_id TEXT,
  p_supplier_name TEXT,
  p_freight_cost FLOAT,
  p_total_cost FLOAT,
  p_items JSONB, -- Array of { materialId, quantity, unitCost, color? }
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

  -- Insert StockEntry
  INSERT INTO "StockEntry" ("id", "tenantId", "supplierName", "freightCost", "totalCost", "note", "createdAt")
  VALUES (gen_random_uuid()::text, p_tenant_id, p_supplier_name, p_freight_cost, p_total_cost, p_note, NOW())
  RETURNING "id" INTO v_entry_id;

  -- Insert Items and Update Material Stock
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    -- Insert Entry Item
    INSERT INTO "StockEntryItem" ("stockEntryId", "tenantId", "materialId", "quantity", "unitCost", "color")
    VALUES (
      v_entry_id,
      p_tenant_id,
      v_item->>'materialId',
      (v_item->>'quantity')::FLOAT,
      (v_item->>'unitCost')::FLOAT,
      v_item->>'color'
    );

    -- Update Material Quantity
    UPDATE "Material"
    SET quantity = quantity + (v_item->>'quantity')::FLOAT,
        cost = (v_item->>'unitCost')::FLOAT -- Update current cost to last purchase cost
    WHERE id = (v_item->>'materialId') AND "tenantId" = p_tenant_id;

    -- Record in InventoryMovement (Optional, but good for consistency)
    -- We can call record_inventory_movement here if we want redundant logging or just rely on StockEntry
    -- For now, let's Insert into InventoryMovement to keep stock history consistent
    INSERT INTO "InventoryMovement" ("id", "tenantId", "materialId", "type", "quantity", "reason", "reference", "createdAt")
    VALUES (
      gen_random_uuid()::text,
      p_tenant_id,
      v_item->>'materialId',
      'ENTRADA', -- Type IN
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


-- ==========================================
-- Original Migration: 20260208000002z_create_material_view.sql
-- ==========================================

-- View to get the last purchase cost for each material
-- Created AFTER StockEntry tables (must come after 20260208000002_create_stock_entry.sql)

CREATE OR REPLACE VIEW v_material_last_costs AS
SELECT DISTINCT ON (sei."materialId", sei."tenantId")
    sei."materialId" as material_id,
    sei."tenantId" as tenant_id,
    sei."unitCost" as last_cost,
    se."createdAt" as created_at
FROM "StockEntryItem" sei
JOIN "StockEntry" se ON sei."stockEntryId" = se."id"
ORDER BY sei."materialId", sei."tenantId", se."createdAt" DESC;

-- Grant access to authenticated users
GRANT SELECT ON v_material_last_costs TO authenticated;
GRANT SELECT ON v_material_last_costs TO service_role;


-- ==========================================
-- Original Migration: 20260208000003_campaigns_and_public_ids.sql
-- ==========================================

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


-- ==========================================
-- Original Migration: 20260208000004_update_create_order_rpc.sql
-- ==========================================

-- Migration: 20260208000004_update_create_order_rpc.sql

CREATE OR REPLACE FUNCTION create_order(
    p_tenant_id UUID,
    p_customer_id UUID,
    p_status TEXT,
    p_due_date TIMESTAMP WITH TIME ZONE,
    p_total_value DOUBLE PRECISION,
    p_items JSONB,
    p_discount DOUBLE PRECISION
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_order_id UUID;
    v_item JSONB;
    v_public_id TEXT;
BEGIN
    -- Generates publicId automatically via default value
    INSERT INTO "Order" (
        "tenantId",
        "customerId",
        "status",
        "dueDate",
        "totalValue",
        "discount"
    ) VALUES (
        p_tenant_id,
        p_customer_id,
        p_status,
        p_due_date,
        p_total_value,
        p_discount
    )
    RETURNING "id", "publicId" INTO v_order_id, v_public_id;

    -- Insert Items
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        INSERT INTO "OrderItem" (
            "orderId",
            "productId",
            "quantity",
            "price",
            "discount"
        ) VALUES (
            v_order_id,
            (v_item->>'productId')::UUID,
            (v_item->>'quantity')::INTEGER,
            (v_item->>'price')::DOUBLE PRECISION,
            COALESCE((v_item->>'discount')::DOUBLE PRECISION, 0)
        );
        
        -- Deduct stock logic (handled in app or triggers, but usually separate action for robust inventory)
        -- Keeping simple insertion here as per original RPC design
    END LOOP;

    RETURN jsonb_build_object('id', v_order_id, 'publicId', v_public_id);
END;
$$;


-- ==========================================
-- Original Migration: 20260208000005_whatsapp_limits.sql
-- ==========================================

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


-- ==========================================
-- Original Migration: 20260208000006_subscription_system.sql
-- ==========================================


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


-- ==========================================
-- Original Migration: 20260211000000_encrypt_pii.sql
-- ==========================================

-- Migration: Add encrypted columns for PII data (LGPD Compliance)
-- Date: 2026-02-11
-- Purpose: Encrypt phone and email fields for Customer and Supplier tables

-- =====================================================
-- CUSTOMER TABLE
-- =====================================================

-- Add encrypted columns (keeping originals temporarily for safe migration)
ALTER TABLE "Customer" 
ADD COLUMN IF NOT EXISTS phone_encrypted TEXT,
ADD COLUMN IF NOT EXISTS email_encrypted TEXT;

-- Create indices for encrypted columns (even though encrypted, for existence checks)
CREATE INDEX IF NOT EXISTS "Customer_phone_encrypted_idx" 
ON "Customer"(phone_encrypted) 
WHERE phone_encrypted IS NOT NULL;

CREATE INDEX IF NOT EXISTS "Customer_email_encrypted_idx" 
ON "Customer"(email_encrypted) 
WHERE email_encrypted IS NOT NULL;

-- Add comment explaining the encryption
COMMENT ON COLUMN "Customer".phone_encrypted IS 'AES-256-GCM encrypted phone number (LGPD compliance)';
COMMENT ON COLUMN "Customer".email_encrypted IS 'AES-256-GCM encrypted email (LGPD compliance)';

-- =====================================================
-- SUPPLIER TABLE
-- =====================================================

-- Add encrypted columns
ALTER TABLE "Supplier" 
ADD COLUMN IF NOT EXISTS phone_encrypted TEXT,
ADD COLUMN IF NOT EXISTS email_encrypted TEXT;

-- Create indices
CREATE INDEX IF NOT EXISTS "Supplier_phone_encrypted_idx" 
ON "Supplier"(phone_encrypted) 
WHERE phone_encrypted IS NOT NULL;

CREATE INDEX IF NOT EXISTS "Supplier_email_encrypted_idx" 
ON "Supplier"(email_encrypted) 
WHERE email_encrypted IS NOT NULL;

-- Add comments
COMMENT ON COLUMN "Supplier".phone_encrypted IS 'AES-256-GCM encrypted phone number (LGPD compliance)';
COMMENT ON COLUMN "Supplier".email_encrypted IS 'AES-256-GCM encrypted email (LGPD compliance)';

-- =====================================================
-- NOTES FOR DEPLOYMENT
-- =====================================================

-- 1. Run this migration in staging first
-- 2. Run data migration script (scripts/migrate-encrypt-data.ts)
-- 3. Verify encrypted data works correctly (1 week testing)
-- 4. Deploy to production
-- 5. After 2 weeks of validation, drop original columns:
--    ALTER TABLE "Customer" DROP COLUMN phone, DROP COLUMN email;
--    ALTER TABLE "Supplier" DROP COLUMN phone, DROP COLUMN email;

-- =====================================================
-- ROLLBACK (if needed)
-- =====================================================

-- To rollback this migration:
-- ALTER TABLE "Customer" DROP COLUMN phone_encrypted, DROP COLUMN email_encrypted;
-- ALTER TABLE "Supplier" DROP COLUMN phone_encrypted, DROP COLUMN email_encrypted;


-- ==========================================
-- Original Migration: 20260211000001_whatsapp_manual_template.sql
-- ==========================================

-- Add template field for manual WhatsApp notifications
-- This template is used for the "Notify via WhatsApp" button available in Start and Pro plans

ALTER TABLE "Settings"
ADD COLUMN IF NOT EXISTS "whatsappNotifyTemplate" TEXT DEFAULT 'Olá {cliente}, seu pedido #{numero} está {status}!';

COMMENT ON COLUMN "Settings"."whatsappNotifyTemplate" IS 
'Template de mensagem para notificações manuais via botão WhatsApp. 
Variáveis disponíveis: {cliente}, {numero}, {status}, {valor}. 
Usado em planos Start e Pro que não têm acesso à API automática.';

-- Index for faster queries
CREATE INDEX IF NOT EXISTS "idx_settings_whatsapp_template" 
ON "Settings"("tenantId") 
WHERE "whatsappNotifyTemplate" IS NOT NULL;
