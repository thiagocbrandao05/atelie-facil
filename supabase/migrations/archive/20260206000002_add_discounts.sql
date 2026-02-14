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
