-- Fix get_public_order RPC to use LEFT JOINs and include missing fields
CREATE OR REPLACE FUNCTION get_public_order(p_public_id TEXT)
RETURNS TABLE (
    "id" TEXT,
    "publicId" TEXT,
    "status" TEXT,
    "totalValue" DOUBLE PRECISION,
    "discount" DOUBLE PRECISION,
    "dueDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3),
    "customerName" TEXT,
    "customerPhone" TEXT,
    "customerAddress" TEXT,
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
        o."discount",
        o."dueDate",
        o."createdAt",
        c."name" as "customerName",
        c."phone" as "customerPhone",
        c."address" as "customerAddress",
        t."name" as "tenantName",
        t."slug" as "tenantSlug",
        COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'quantity', oi.quantity,
                    'productName', p.name,
                    'price', oi.price,
                    'discount', oi.discount
                )
            ) FILTER (WHERE oi.id IS NOT NULL),
            '[]'::jsonb
        ) as "items"
    FROM "Order" o
    JOIN "Customer" c ON o."customerId" = c.id
    JOIN "Tenant" t ON o."tenantId" = t.id
    LEFT JOIN "OrderItem" oi ON o.id = oi."orderId"
    LEFT JOIN "Product" p ON oi."productId" = p.id
    WHERE o."publicId" = p_public_id
    GROUP BY o.id, c.id, t.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
