-- Add payment fields to StockEntry
ALTER TABLE "StockEntry" 
ADD COLUMN IF NOT EXISTS "paymentMethod" TEXT,
ADD COLUMN IF NOT EXISTS "installments" INTEGER DEFAULT 1;

-- Update the RPC to include new fields
CREATE OR REPLACE FUNCTION create_stock_entry_transaction(
  p_tenant_id TEXT,
  p_supplier_name TEXT,
  p_freight_cost FLOAT,
  p_total_cost FLOAT,
  p_items JSONB, -- Array of { materialId, quantity, unitCost, color }
  p_note TEXT,
  p_payment_method TEXT DEFAULT NULL,
  p_installments INTEGER DEFAULT 1
)
RETURNS JSON AS $$
DECLARE
  v_entry_id TEXT;
  v_item JSONB;
BEGIN
  -- Verify tenant access
  IF p_tenant_id != get_current_tenant_id() THEN
     RAISE EXCEPTION 'Unauthorized tenant access';
  END IF;

  -- Insert StockEntry
  INSERT INTO "StockEntry" ("id", "tenantId", "supplierName", "freightCost", "totalCost", "note", "paymentMethod", "installments", "createdAt")
  VALUES (gen_random_uuid()::text, p_tenant_id, p_supplier_name, p_freight_cost, p_total_cost, p_note, p_payment_method, p_installments, NOW())
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
