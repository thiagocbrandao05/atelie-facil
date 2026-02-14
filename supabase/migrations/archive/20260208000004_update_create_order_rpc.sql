-- Migration: 20260208000004_update_create_order_rpc.sql

CREATE OR REPLACE FUNCTION create_order(
    p_tenant_id UUID,
    p_customer_id UUID,
    p_status TEXT,
    p_due_date TIMESTAMP WITH TIME ZONE,
    p_total_value DOUBLE PRECISION,
    p_items JSONB,
    p_discount DOUBLE PRECISION
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_order_id UUID;
    v_item JSONB;
    v_public_id TEXT;
BEGIN
    -- Generates publicId automatically via default value
    INSERT INTO "Order" (
        "tenantId",
        "customerId",
        "status",
        "dueDate",
        "totalValue",
        "discount"
    ) VALUES (
        p_tenant_id,
        p_customer_id,
        p_status,
        p_due_date,
        p_total_value,
        p_discount
    )
    RETURNING "id", "publicId" INTO v_order_id, v_public_id;

    -- Insert Items
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        INSERT INTO "OrderItem" (
            "orderId",
            "productId",
            "quantity",
            "price",
            "discount"
        ) VALUES (
            v_order_id,
            (v_item->>'productId')::UUID,
            (v_item->>'quantity')::INTEGER,
            (v_item->>'price')::DOUBLE PRECISION,
            COALESCE((v_item->>'discount')::DOUBLE PRECISION, 0)
        );
        
        -- Deduct stock logic (handled in app or triggers, but usually separate action for robust inventory)
        -- Keeping simple insertion here as per original RPC design
    END LOOP;

    RETURN jsonb_build_object('id', v_order_id, 'publicId', v_public_id);
END;
$$;
