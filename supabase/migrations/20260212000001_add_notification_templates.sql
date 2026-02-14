-- Incremental Migration: Add missing notification templates
ALTER TABLE "Settings" ADD COLUMN IF NOT EXISTS "msgApproved" TEXT;
ALTER TABLE "Settings" ADD COLUMN IF NOT EXISTS "msgFinished" TEXT;
