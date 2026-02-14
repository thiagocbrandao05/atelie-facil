-- WhatsApp notification logs table for automatic messaging
CREATE TABLE IF NOT EXISTS "WhatsAppNotificationLog" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "tenantId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "customerPhone" TEXT,
    "statusFrom" TEXT,
    "statusTo" TEXT NOT NULL,
    "messageType" TEXT NOT NULL,
    "templateKey" TEXT,
    "messageBody" TEXT,
    "payload" JSONB,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastAttemptAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "errorMessage" TEXT,
    "providerMessageId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WhatsAppNotificationLog_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "WhatsAppNotificationLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WhatsAppNotificationLog_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "WhatsAppNotificationLog_tenantId_idx" ON "WhatsAppNotificationLog"("tenantId");
CREATE INDEX IF NOT EXISTS "WhatsAppNotificationLog_orderId_idx" ON "WhatsAppNotificationLog"("orderId");
CREATE INDEX IF NOT EXISTS "WhatsAppNotificationLog_status_idx" ON "WhatsAppNotificationLog"("status");
CREATE INDEX IF NOT EXISTS "WhatsAppNotificationLog_createdAt_idx" ON "WhatsAppNotificationLog"("createdAt");
CREATE INDEX IF NOT EXISTS "WhatsAppNotificationLog_tenantId_status_idx" ON "WhatsAppNotificationLog"("tenantId", "status");

ALTER TABLE "WhatsAppNotificationLog" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation for WhatsAppNotificationLog" ON "WhatsAppNotificationLog"
  USING ("tenantId" = get_current_tenant_id())
  WITH CHECK ("tenantId" = get_current_tenant_id());
