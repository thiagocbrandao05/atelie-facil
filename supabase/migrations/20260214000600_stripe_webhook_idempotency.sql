-- Stripe webhook idempotency tracking
CREATE TABLE IF NOT EXISTS "StripeWebhookEvent" (
    "eventId" TEXT PRIMARY KEY,
    "eventType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PROCESSING',
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "StripeWebhookEvent_status_idx"
    ON "StripeWebhookEvent" ("status");

ALTER TABLE "StripeWebhookEvent" ENABLE ROW LEVEL SECURITY;
