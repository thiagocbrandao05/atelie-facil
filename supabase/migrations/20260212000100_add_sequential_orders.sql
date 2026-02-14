-- Incremental Migration: Sequential Order Numbers & RPC Restore

-- 1. Add orderNumber column
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "orderNumber" INTEGER;

-- 2. Function to generate sequential number per tenant
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

-- 3. Trigger for automatic number generation
DROP TRIGGER IF EXISTS trg_set_order_number ON "Order";
CREATE TRIGGER trg_set_order_number
BEFORE INSERT ON "Order"
FOR EACH ROW
EXECUTE FUNCTION set_order_sequential_number();

-- 4. Restore create_order RPC
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

-- 5. Restore delete_order RPC
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

-- 6. Backfill existing orders (if any)
DO $$
DECLARE
    r RECORD;
    v_counter INTEGER;
BEGIN
    FOR r IN SELECT DISTINCT "tenantId" FROM "Order" LOOP
        v_counter := 1;
        FOR r IN (SELECT id FROM "Order" WHERE "tenantId" = r."tenantId" ORDER BY "createdAt" ASC) LOOP
            UPDATE "Order" SET "orderNumber" = v_counter WHERE id = r.id;
            v_counter := v_counter + 1;
        END LOOP;
    END LOOP;
END $$;
