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
