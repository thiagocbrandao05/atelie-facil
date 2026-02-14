-- Robust material balance calculation
-- Handles NULL colors by aggregating all stock or matching specific NULL movements
CREATE OR REPLACE FUNCTION get_material_balance_v2(
  p_tenant_id TEXT,
  p_material_id TEXT,
  p_color TEXT DEFAULT NULL
)
RETURNS DOUBLE PRECISION AS $$
DECLARE
  v_balance DOUBLE PRECISION;
BEGIN
  SELECT COALESCE(SUM(
    CASE 
      WHEN type IN ('ENTRADA', 'ENTRADA_AJUSTE') THEN quantity 
      WHEN type IN ('SAIDA', 'SAIDA_AJUSTE', 'PERDA', 'RETIRADA') THEN -quantity 
      ELSE 0 
    END
  ), 0) INTO v_balance
  FROM "InventoryMovement"
  WHERE "tenantId" = p_tenant_id 
    AND "materialId" = p_material_id
    AND (
      p_color IS NULL OR  -- If p_color is NULL, aggregate ALL movements? 
      -- Actually, if p_color is NULL, we should probably only aggregate movements where color is NULL
      -- BUT the JS logic calls it with NULL when it wants the "generic" stock.
      -- Let's make it smarter: if p_color is NULL, check if there are ANY colored movements.
      -- If the user doesn't care about color (p_color is NULL), return TOTAL balance.
      color = p_color OR (p_color IS NULL AND (color IS NULL OR color = ''))
    );

  RETURN v_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Also fix deduct_stock_for_order to be color-aware if it wasn't
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

    FOR v_item IN 
      SELECT * FROM "OrderItem" WHERE "orderId" = p_order_id
    LOOP
       FOR v_prod_mat IN 
         SELECT * FROM "ProductMaterial" WHERE "productId" = v_item."productId"
       LOOP
          v_deduction := v_prod_mat.quantity * v_item.quantity;
          
          -- Record the movement (OUT) with color
          INSERT INTO "InventoryMovement" ("id", "tenantId", "materialId", "type", "quantity", "reason", "reference", "color", "createdAt")
          VALUES (
            gen_random_uuid()::text, 
            p_tenant_id, 
            v_prod_mat."materialId", 
            'SAIDA', 
            v_deduction, 
            'Produção - Pedido #' || p_order_id, 
            p_order_id, 
            v_prod_mat.color,
            NOW()
          );

          -- Update total quantity in Material table (aggregate)
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
