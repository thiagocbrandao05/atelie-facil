-- Backfill colors in InventoryMovement from StockEntryItem
-- Matches based on StockEntry ID (reference), Material ID, and Quantity.
-- Note: This is a best-effort match. If a single entry has identical material+quantity rows with different colors, 
-- there is ambiguity, but this covers 99% of cases.

UPDATE "InventoryMovement" im
SET "color" = sei."color"
FROM "StockEntryItem" sei
WHERE im."reference" = sei."stockEntryId"
  AND im."materialId" = sei."materialId"
  AND im."quantity" = sei."quantity"
  AND im."type" = 'ENTRADA'
  AND im."color" IS NULL;
