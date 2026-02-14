-- 1. Add color column to InventoryMovement
ALTER TABLE "InventoryMovement" 
ADD COLUMN IF NOT EXISTS "color" TEXT;

-- 2. Update record_inventory_movement RPC to accept color
CREATE OR REPLACE FUNCTION record_inventory_movement(
  p_tenant_id TEXT,
  p_material_id TEXT,
  p_type TEXT,
  p_quantity FLOAT,
  p_reason TEXT,
  p_reference TEXT DEFAULT NULL,
  p_color TEXT DEFAULT NULL
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
  
  -- Calculate new quantity (Total aggregate quantity)
  IF p_type = 'IN' THEN
    v_new_quantity := v_material.quantity + p_quantity;
  ELSIF p_type = 'OUT' THEN
    v_new_quantity := v_material.quantity - p_quantity;
    -- Optional: Allow negative stock? For now, prevent.
    -- IF v_new_quantity < 0 THEN
    --   RETURN json_build_object('success', false, 'message', 'Quantidade insuficiente');
    -- END IF;
  ELSE
    v_new_quantity := p_quantity;
  END IF;
  
  -- Update material total quantity
  UPDATE "Material" SET quantity = v_new_quantity WHERE id = p_material_id;
  
  -- Record movement with color
  INSERT INTO "InventoryMovement" ("id", "tenantId", "materialId", "type", "quantity", "reason", "reference", "createdAt", "color")
  VALUES (gen_random_uuid()::text, p_tenant_id, p_material_id, p_type, p_quantity, p_reason, p_reference, NOW(), p_color);
  
  RETURN json_build_object('success', true, 'message', 'Movimentação registrada');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Update create_stock_entry_transaction RPC to insert color into InventoryMovement
CREATE OR REPLACE FUNCTION create_stock_entry_transaction(
  p_tenant_id TEXT,
  p_supplier_name TEXT,
  p_freight_cost FLOAT,
  p_total_cost FLOAT,
  p_items JSONB,
  p_note TEXT,
  p_payment_method TEXT DEFAULT NULL,
  p_installments INTEGER DEFAULT 1
)
RETURNS JSON AS $$
DECLARE
  v_entry_id TEXT;
  v_item JSONB;
BEGIN
  IF p_tenant_id != get_current_tenant_id() THEN
     RAISE EXCEPTION 'Unauthorized tenant access';
  END IF;

  INSERT INTO "StockEntry" ("id", "tenantId", "supplierName", "freightCost", "totalCost", "note", "paymentMethod", "installments", "createdAt")
  VALUES (gen_random_uuid()::text, p_tenant_id, p_supplier_name, p_freight_cost, p_total_cost, p_note, p_payment_method, p_installments, NOW())
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

    -- Include color in InventoryMovement
    INSERT INTO "InventoryMovement" ("id", "tenantId", "materialId", "type", "quantity", "reason", "reference", "createdAt", "color")
    VALUES (
      gen_random_uuid()::text, 
      p_tenant_id, 
      v_item->>'materialId', 
      'ENTRADA', 
      (v_item->>'quantity')::FLOAT, 
      'Compra de Material - ' || p_supplier_name,
      v_entry_id,
      NOW(),
      v_item->>'color'
    );
  END LOOP;

  RETURN json_build_object('success', true, 'id', v_entry_id);
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'message', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
