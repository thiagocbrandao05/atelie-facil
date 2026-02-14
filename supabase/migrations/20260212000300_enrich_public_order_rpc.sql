-- Fix get_public_order RPC to use LEFT JOINs and include missing fields
DROP FUNCTION IF EXISTS get_public_order(TEXT);
CREATE OR REPLACE FUNCTION get_public_order(p_public_id TEXT)
RETURNS TABLE (
    "id" TEXT,
    "publicId" TEXT,
    "orderNumber" INTEGER,
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
    "storePhone" TEXT,
    "storeEmail" TEXT,
    "instagram" TEXT,
    "facebook" TEXT,
    "logoUrl" TEXT,
    "primaryColor" TEXT,
    "addressStreet" TEXT,
    "addressNumber" TEXT,
    "addressComplement" TEXT,
    "addressNeighborhood" TEXT,
    "addressCity" TEXT,
    "addressState" TEXT,
    "addressZip" TEXT,
    "items" JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        o."id",
        o."publicId",
        o."orderNumber",
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
        s."phone" as "storePhone",
        s."email" as "storeEmail",
        s."instagram" as "instagram",
        s."facebook" as "facebook",
        s."logoUrl" as "logoUrl",
        s."primaryColor" as "primaryColor",
        s."addressStreet" as "addressStreet",
        s."addressNumber" as "addressNumber",
        s."addressComplement" as "addressComplement",
        s."addressNeighborhood" as "addressNeighborhood",
        s."addressCity" as "addressCity",
        s."addressState" as "addressState",
        s."addressZip" as "addressZip",
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
    LEFT JOIN "Settings" s ON o."tenantId" = s."tenantId"
    LEFT JOIN "OrderItem" oi ON o.id = oi."orderId"
    LEFT JOIN "Product" p ON oi."productId" = p.id
    WHERE o."publicId" = p_public_id
    GROUP BY o.id, c.id, t.id, s.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
