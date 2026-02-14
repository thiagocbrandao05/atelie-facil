-- Migration: Add ProductStockEntry and ProductStockEntryItem

CREATE TABLE IF NOT EXISTS "ProductStockEntry" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "tenantId" TEXT NOT NULL,
    "supplierName" TEXT NOT NULL,
    "freightCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "paymentMethod" TEXT,
    "installments" INTEGER DEFAULT 1,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductStockEntry_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ProductStockEntry_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "ProductStockEntryItem" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "tenantId" TEXT NOT NULL,
    "productStockEntryId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unitCost" DOUBLE PRECISION NOT NULL,
    "subtotal" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "ProductStockEntryItem_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ProductStockEntryItem_productStockEntryId_fkey" FOREIGN KEY ("productStockEntryId") REFERENCES "ProductStockEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProductStockEntryItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Indices
CREATE INDEX "ProductStockEntry_tenantId_idx" ON "ProductStockEntry"("tenantId");
CREATE INDEX "ProductStockEntryItem_productStockEntryId_idx" ON "ProductStockEntryItem"("productStockEntryId");
CREATE INDEX "ProductStockEntryItem_productId_idx" ON "ProductStockEntryItem"("productId");

-- RLS
ALTER TABLE "ProductStockEntry" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ProductStockEntryItem" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation for ProductStockEntry" ON "ProductStockEntry"
  USING ("tenantId" = get_current_tenant_id())
  WITH CHECK ("tenantId" = get_current_tenant_id());

CREATE POLICY "Tenant isolation for ProductStockEntryItem" ON "ProductStockEntryItem"
  USING ("tenantId" = get_current_tenant_id())
  WITH CHECK ("tenantId" = get_current_tenant_id());

-- RPC for atomic transaction
CREATE OR REPLACE FUNCTION create_product_stock_entry_transaction(
  p_tenant_id TEXT,
  p_supplier_name TEXT,
  p_freight_cost FLOAT,
  p_total_cost FLOAT,
  p_items JSONB, -- Array of { productId, quantity, unitCost }
  p_note TEXT,
  p_payment_method TEXT,
  p_installments INTEGER
)
RETURNS JSON AS $$
DECLARE
  v_entry_id TEXT;
  v_item JSONB;
  v_qty FLOAT;
  v_prod_id TEXT;
  v_unit_cost FLOAT;
  v_subtotal FLOAT;
  v_current_qty FLOAT;
BEGIN
  -- 1. Create Entry Header
  INSERT INTO "ProductStockEntry" (
    "tenantId", "supplierName", "freightCost", "totalCost", "paymentMethod", "installments", "note"
  ) VALUES (
    p_tenant_id, p_supplier_name, p_freight_cost, p_total_cost, p_payment_method, p_installments, p_note
  ) RETURNING id INTO v_entry_id;

  -- 2. Process Items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_prod_id := v_item->>'productId';
    v_qty := (v_item->>'quantity')::FLOAT;
    v_unit_cost := (v_item->>'unitCost')::FLOAT;
    v_subtotal := v_qty * v_unit_cost;

    -- a. Insert Entry Item
    INSERT INTO "ProductStockEntryItem" (
      "tenantId", "productStockEntryId", "productId", "quantity", "unitCost", "subtotal"
    ) VALUES (
      p_tenant_id, v_entry_id, v_prod_id, v_qty, v_unit_cost, v_subtotal
    );

    -- b. Record Movement
    INSERT INTO "ProductInventoryMovement" (
      "tenantId", "productId", "type", "quantity", "reason", "reference", "createdAt"
    ) VALUES (
      p_tenant_id, v_prod_id, 'ENTRADA', v_qty, 'Compra de ' || p_supplier_name, v_entry_id, NOW()
    );

    -- c. Update Product Balance
    SELECT quantity INTO v_current_qty FROM "ProductInventory" WHERE "productId" = v_prod_id AND "tenantId" = p_tenant_id;
    
    IF FOUND THEN
      UPDATE "ProductInventory" SET quantity = v_current_qty + v_qty, "updatedAt" = NOW()
      WHERE "productId" = v_prod_id AND "tenantId" = p_tenant_id;
    ELSE
      INSERT INTO "ProductInventory" ("tenantId", "productId", "quantity", "minQuantity", "updatedAt")
      VALUES (p_tenant_id, v_prod_id, v_qty, 0, NOW());
    END IF;

  END LOOP;

  RETURN json_build_object('success', true, 'id', v_entry_id);
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'message', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
