-- Harden order numbering and preserve numbering/history by cancelling instead of deleting.

-- 1) Per-tenant order sequence state (concurrency-safe).
CREATE TABLE IF NOT EXISTS "OrderNumberSequence" (
  "tenantId" TEXT PRIMARY KEY REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "lastNumber" INTEGER NOT NULL DEFAULT 0,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "OrderNumberSequence_updatedAt_idx" ON "OrderNumberSequence"("updatedAt");
ALTER TABLE "OrderNumberSequence" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant isolation for OrderNumberSequence" ON "OrderNumberSequence";
CREATE POLICY "Tenant isolation for OrderNumberSequence" ON "OrderNumberSequence"
  USING ("tenantId" = get_current_tenant_id())
  WITH CHECK ("tenantId" = get_current_tenant_id());

-- Seed/update sequence with current max numbers.
INSERT INTO "OrderNumberSequence" ("tenantId", "lastNumber")
SELECT "tenantId", COALESCE(MAX("orderNumber"), 0)
FROM "Order"
GROUP BY "tenantId"
ON CONFLICT ("tenantId")
DO UPDATE SET
  "lastNumber" = GREATEST("OrderNumberSequence"."lastNumber", EXCLUDED."lastNumber"),
  "updatedAt" = CURRENT_TIMESTAMP;

-- 2) Generate next number with row-level locking semantics via UPDATE ... RETURNING loop.
CREATE OR REPLACE FUNCTION next_order_number(p_tenant_id TEXT)
RETURNS INTEGER AS $$
DECLARE
  v_next INTEGER;
BEGIN
  LOOP
    UPDATE "OrderNumberSequence"
       SET "lastNumber" = "lastNumber" + 1,
           "updatedAt" = CURRENT_TIMESTAMP
     WHERE "tenantId" = p_tenant_id
    RETURNING "lastNumber" INTO v_next;

    IF FOUND THEN
      RETURN v_next;
    END IF;

    BEGIN
      INSERT INTO "OrderNumberSequence" ("tenantId", "lastNumber")
      VALUES (p_tenant_id, 0);
    EXCEPTION
      WHEN unique_violation THEN
        -- another transaction created it first; retry loop
        NULL;
    END;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 3) Replace trigger logic that used MAX+1.
CREATE OR REPLACE FUNCTION set_order_sequential_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW."orderNumber" IS NULL THEN
    NEW."orderNumber" := next_order_number(NEW."tenantId");
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_order_number ON "Order";
CREATE TRIGGER trg_set_order_number
BEFORE INSERT ON "Order"
FOR EACH ROW
EXECUTE FUNCTION set_order_sequential_number();

-- Enforce uniqueness per tenant for friendly public numbering.
CREATE UNIQUE INDEX IF NOT EXISTS "Order_tenantId_orderNumber_key"
  ON "Order"("tenantId", "orderNumber")
  WHERE "orderNumber" IS NOT NULL;

-- 4) Preserve history and numbering: delete RPC now cancels.
CREATE OR REPLACE FUNCTION delete_order(
  p_order_id TEXT,
  p_tenant_id TEXT
)
RETURNS JSON AS $$
DECLARE
  v_current_status TEXT;
BEGIN
  IF p_tenant_id != get_current_tenant_id() THEN
    RAISE EXCEPTION 'Unauthorized tenant access';
  END IF;

  SELECT "status"
    INTO v_current_status
    FROM "Order"
   WHERE "id" = p_order_id
     AND "tenantId" = p_tenant_id;

  IF v_current_status IS NULL THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  IF v_current_status = 'DELIVERED' THEN
    RAISE EXCEPTION 'Delivered orders cannot be cancelled';
  END IF;

  UPDATE "Order"
     SET "status" = 'CANCELLED',
         "updatedAt" = CURRENT_TIMESTAMP
   WHERE "id" = p_order_id
     AND "tenantId" = p_tenant_id;

  RETURN json_build_object('success', true, 'status', 'CANCELLED');
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'message', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
