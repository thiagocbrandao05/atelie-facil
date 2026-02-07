-- Create CustomerMeasurements table for artisanal management
CREATE TABLE IF NOT EXISTS "CustomerMeasurements" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "tenantId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "name" TEXT NOT NULL, -- e.g., "Manequim", "Busto", "Cintura"
    "value" TEXT NOT NULL, -- The measurement value
    "unit" TEXT,         -- e.g., "cm", "in"
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomerMeasurements_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "CustomerMeasurements_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CustomerMeasurements_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS "CustomerMeasurements_customerId_idx" ON "CustomerMeasurements"("customerId");
CREATE INDEX IF NOT EXISTS "CustomerMeasurements_tenantId_idx" ON "CustomerMeasurements"("tenantId");

-- Enable RLS
ALTER TABLE "CustomerMeasurements" ENABLE ROW LEVEL SECURITY;

-- Tenant isolation policy
CREATE POLICY "Tenant isolation for CustomerMeasurements" ON "CustomerMeasurements"
  USING ("tenantId" = get_current_tenant_id())
  WITH CHECK ("tenantId" = get_current_tenant_id());
