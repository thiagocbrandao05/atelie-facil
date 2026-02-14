-- Migration: Rigorous Cost Accounting & MPM
-- Adds cost tracking for products and implements MPM in stock entries

-- 1. Add cost column to Product (for resale items)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Product' AND column_name='cost') THEN
        ALTER TABLE "Product" ADD COLUMN "cost" DOUBLE PRECISION DEFAULT 0;
    END IF;
END $$;

-- 2. Refactor Material Stock Entry RPC
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
  v_total_items_value FLOAT := 0;
  v_item_qty FLOAT;
  v_item_unit_cost FLOAT;
  v_item_total_val FLOAT;
  v_apportioned_freight FLOAT;
  v_effective_unit_cost FLOAT;
  v_current_qty FLOAT;
  v_current_cost FLOAT;
  v_new_avg_cost FLOAT;
BEGIN
  IF p_tenant_id != get_current_tenant_id() THEN RAISE EXCEPTION 'Unauthorized'; END IF;

  -- Calculate total items value for freight proportionality
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_total_items_value := v_total_items_value + ((v_item->>'quantity')::FLOAT * (v_item->>'unitCost')::FLOAT);
  END LOOP;

  -- Create Entry Header
  INSERT INTO "StockEntry" ("tenantId", "supplierName", "freightCost", "totalCost", "note", "paymentMethod", "installments")
  VALUES (p_tenant_id, p_supplier_name, p_freight_cost, p_total_cost, p_note, p_payment_method, p_installments)
  RETURNING "id" INTO v_entry_id;

  -- Process Items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_item_qty := (v_item->>'quantity')::FLOAT;
    v_item_unit_cost := (v_item->>'unitCost')::FLOAT;
    v_item_total_val := v_item_qty * v_item_unit_cost;
    
    -- Proportional Freight
    IF v_total_items_value > 0 THEN
      v_apportioned_freight := (v_item_total_val / v_total_items_value) * p_freight_cost;
    ELSE
      v_apportioned_freight := 0;
    END IF;

    -- Effective Unit Cost (Cost + Freight)
    IF v_item_qty > 0 THEN
      v_effective_unit_cost := (v_item_total_val + v_apportioned_freight) / v_item_qty;
    ELSE
      v_effective_unit_cost := v_item_unit_cost;
    END IF;

    -- Update Material with MPM
    SELECT quantity, cost INTO v_current_qty, v_current_cost FROM "Material" 
    WHERE id = (v_item->>'materialId') AND "tenantId" = p_tenant_id;

    IF v_current_qty <= 0 THEN
      v_new_avg_cost := v_effective_unit_cost;
    ELSE
      v_new_avg_cost := ((v_current_qty * v_current_cost) + (v_item_qty * v_effective_unit_cost)) / (v_current_qty + v_item_qty);
    END IF;

    UPDATE "Material" SET 
      quantity = quantity + v_item_qty, 
      cost = v_new_avg_cost
    WHERE id = (v_item->>'materialId') AND "tenantId" = p_tenant_id;

    -- Log Movement
    INSERT INTO "InventoryMovement" ("tenantId", "materialId", "type", "quantity", "reason", "reference", "color")
    VALUES (p_tenant_id, v_item->>'materialId', 'ENTRADA', v_item_qty, 'Compra - ' || p_supplier_name, v_entry_id, v_item->>'color');
    
    -- Record Item in Entry Table
    INSERT INTO "StockEntryItem" ("stockEntryId", "tenantId", "materialId", "quantity", "unitCost", "color")
    VALUES (v_entry_id, p_tenant_id, v_item->>'materialId', v_item_qty, v_item_unit_cost, v_item->>'color');

  END LOOP;

  RETURN json_build_object('success', true, 'id', v_entry_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Refactor Product Stock Entry RPC
CREATE OR REPLACE FUNCTION create_product_stock_entry_transaction(
  p_tenant_id TEXT,
  p_supplier_name TEXT,
  p_freight_cost FLOAT,
  p_total_cost FLOAT,
  p_items JSONB,
  p_note TEXT,
  p_payment_method TEXT,
  p_installments INTEGER
) RETURNS JSON AS $$
DECLARE
  v_entry_id TEXT;
  v_item JSONB;
  v_total_items_value FLOAT := 0;
  v_qty FLOAT;
  v_prod_id TEXT;
  v_unit_cost FLOAT;
  v_subtotal FLOAT;
  v_apportioned_freight FLOAT;
  v_effective_unit_cost FLOAT;
  v_current_qty FLOAT;
  v_current_cost FLOAT;
  v_new_avg_cost FLOAT;
BEGIN
  IF p_tenant_id != get_current_tenant_id() THEN RAISE EXCEPTION 'Unauthorized'; END IF;

  -- Calculate total items value
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_total_items_value := v_total_items_value + ((v_item->>'quantity')::FLOAT * (v_item->>'unitCost')::FLOAT);
  END LOOP;

  -- Create Entry Header
  INSERT INTO "ProductStockEntry" (
    "tenantId", "supplierName", "freightCost", "totalCost", "paymentMethod", "installments", "note"
  ) VALUES (
    p_tenant_id, p_supplier_name, p_freight_cost, p_total_cost, p_payment_method, p_installments, p_note
  ) RETURNING id INTO v_entry_id;

  -- Process Items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_prod_id := v_item->>'productId';
    v_qty := (v_item->>'quantity')::FLOAT;
    v_unit_cost := (v_item->>'unitCost')::FLOAT;
    v_subtotal := v_qty * v_unit_cost;

    -- Proportional Freight
    IF v_total_items_value > 0 THEN
      v_apportioned_freight := (v_subtotal / v_total_items_value) * p_freight_cost;
    ELSE
      v_apportioned_freight := 0;
    END IF;

    -- Effective Unit Cost
    IF v_qty > 0 THEN
      v_effective_unit_cost := (v_subtotal + v_apportioned_freight) / v_qty;
    ELSE
      v_effective_unit_cost := v_unit_cost;
    END IF;

    -- Update Product Cost (MPM)
    SELECT p.cost, COALESCE(pi.quantity, 0) INTO v_current_cost, v_current_qty 
    FROM "Product" p
    LEFT JOIN "ProductInventory" pi ON p.id = pi."productId" AND p."tenantId" = pi."tenantId"
    WHERE p.id = v_prod_id AND p."tenantId" = p_tenant_id;

    IF v_current_qty <= 0 THEN
      v_new_avg_cost := v_effective_unit_cost;
    ELSE
      v_new_avg_cost := ((v_current_qty * v_current_cost) + (v_qty * v_effective_unit_cost)) / (v_current_qty + v_qty);
    END IF;

    -- Update Product main cost
    UPDATE "Product" SET cost = v_new_avg_cost WHERE id = v_prod_id AND "tenantId" = p_tenant_id;

    -- Insert Entry Item
    INSERT INTO "ProductStockEntryItem" (
      "tenantId", "productStockEntryId", "productId", "quantity", "unitCost", "subtotal"
    ) VALUES (
      p_tenant_id, v_entry_id, v_prod_id, v_qty, v_unit_cost, v_subtotal
    );

    -- Record Movement
    INSERT INTO "ProductInventoryMovement" (
      "tenantId", "productId", "type", "quantity", "reason", "reference", "createdAt"
    ) VALUES (
      p_tenant_id, v_prod_id, 'ENTRADA', v_qty, 'Compra de ' || p_supplier_name, v_entry_id, NOW()
    );

    -- Update Product Inventory Balance
    IF EXISTS (SELECT 1 FROM "ProductInventory" WHERE "productId" = v_prod_id AND "tenantId" = p_tenant_id) THEN
      UPDATE "ProductInventory" SET quantity = quantity + v_qty, "updatedAt" = NOW()
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
