-- Migration: 20260214000000_add_product_description_price.sql

-- 1. Add columns to Product table
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "description" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "price" DOUBLE PRECISION;

-- 2. Update create_product_with_materials RPC
CREATE OR REPLACE FUNCTION create_product_with_materials(
  p_tenant_id TEXT,
  p_name TEXT,
  p_image_url TEXT,
  p_labor_time INTEGER,
  p_profit_margin FLOAT,
  p_materials JSONB, -- Array of { id, quantity, unit, color }
  p_description TEXT DEFAULT NULL,
  p_price FLOAT DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
  v_product_id TEXT;
  v_mat JSONB;
BEGIN
  IF p_tenant_id != get_current_tenant_id() THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  INSERT INTO "Product" ("tenantId", "name", "imageUrl", "laborTime", "profitMargin", "description", "price")
  VALUES (p_tenant_id, p_name, p_image_url, p_labor_time, p_profit_margin, p_description, p_price)
  RETURNING "id" INTO v_product_id;
  FOR v_mat IN SELECT * FROM jsonb_array_elements(p_materials) LOOP
    INSERT INTO "ProductMaterial" ("productId", "materialId", "quantity", "unit", "color")
    VALUES (v_product_id, v_mat->>'id', (v_mat->>'quantity')::FLOAT, v_mat->>'unit', v_mat->>'color');
  END LOOP;
  RETURN json_build_object('success', true, 'id', v_product_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Update update_product_with_materials RPC
CREATE OR REPLACE FUNCTION update_product_with_materials(
  p_product_id TEXT,
  p_tenant_id TEXT,
  p_name TEXT,
  p_image_url TEXT,
  p_labor_time INTEGER,
  p_profit_margin FLOAT,
  p_materials JSONB, -- Array of { id, quantity, unit, color }
  p_description TEXT DEFAULT NULL,
  p_price FLOAT DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
  v_mat JSONB;
BEGIN
  IF p_tenant_id != get_current_tenant_id() THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  UPDATE "Product" SET 
    "name" = p_name, 
    "imageUrl" = p_image_url, 
    "laborTime" = p_labor_time, 
    "profitMargin" = p_profit_margin,
    "description" = p_description,
    "price" = p_price
  WHERE "id" = p_product_id AND "tenantId" = p_tenant_id;
  DELETE FROM "ProductMaterial" WHERE "productId" = p_product_id;
  FOR v_mat IN SELECT * FROM jsonb_array_elements(p_materials) LOOP
    INSERT INTO "ProductMaterial" ("productId", "materialId", "quantity", "unit", "color")
    VALUES (p_product_id, v_mat->>'id', (v_mat->>'quantity')::FLOAT, v_mat->>'unit', v_mat->>'color');
  END LOOP;
  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
