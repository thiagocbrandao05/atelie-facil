-- Restore and fix missing analytics RPCs
-- Fixes get_top_products to include productId

CREATE OR REPLACE FUNCTION get_top_products(
  p_tenant_id TEXT,
  p_limit INTEGER DEFAULT 5
)
RETURNS TABLE (
  "productId" TEXT,
  "productName" TEXT,
  "totalQuantity" BIGINT
) AS $$
BEGIN
  IF p_tenant_id != get_current_tenant_id() THEN
     RAISE EXCEPTION 'Unauthorized tenant access';
  END IF;

  RETURN QUERY
  SELECT 
    p."id" as "productId",
    p."name" as "productName",
    SUM(oi."quantity")::BIGINT as "totalQuantity"
  FROM "OrderItem" oi
  JOIN "Order" o ON oi."orderId" = o."id"
  JOIN "Product" p ON oi."productId" = p."id"
  WHERE 
    o."tenantId" = p_tenant_id
    AND o."status" NOT IN ('CANCELLED', 'CANCELED')
  GROUP BY p."id", p."name"
  ORDER BY "totalQuantity" DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
