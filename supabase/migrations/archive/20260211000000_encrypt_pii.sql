-- Migration: Add encrypted columns for PII data (LGPD Compliance)
-- Date: 2026-02-11
-- Purpose: Encrypt phone and email fields for Customer and Supplier tables

-- =====================================================
-- CUSTOMER TABLE
-- =====================================================

-- Add encrypted columns (keeping originals temporarily for safe migration)
ALTER TABLE "Customer" 
ADD COLUMN IF NOT EXISTS phone_encrypted TEXT,
ADD COLUMN IF NOT EXISTS email_encrypted TEXT;

-- Create indices for encrypted columns (even though encrypted, for existence checks)
CREATE INDEX IF NOT EXISTS "Customer_phone_encrypted_idx" 
ON "Customer"(phone_encrypted) 
WHERE phone_encrypted IS NOT NULL;

CREATE INDEX IF NOT EXISTS "Customer_email_encrypted_idx" 
ON "Customer"(email_encrypted) 
WHERE email_encrypted IS NOT NULL;

-- Add comment explaining the encryption
COMMENT ON COLUMN "Customer".phone_encrypted IS 'AES-256-GCM encrypted phone number (LGPD compliance)';
COMMENT ON COLUMN "Customer".email_encrypted IS 'AES-256-GCM encrypted email (LGPD compliance)';

-- =====================================================
-- SUPPLIER TABLE
-- =====================================================

-- Add encrypted columns
ALTER TABLE "Supplier" 
ADD COLUMN IF NOT EXISTS phone_encrypted TEXT,
ADD COLUMN IF NOT EXISTS email_encrypted TEXT;

-- Create indices
CREATE INDEX IF NOT EXISTS "Supplier_phone_encrypted_idx" 
ON "Supplier"(phone_encrypted) 
WHERE phone_encrypted IS NOT NULL;

CREATE INDEX IF NOT EXISTS "Supplier_email_encrypted_idx" 
ON "Supplier"(email_encrypted) 
WHERE email_encrypted IS NOT NULL;

-- Add comments
COMMENT ON COLUMN "Supplier".phone_encrypted IS 'AES-256-GCM encrypted phone number (LGPD compliance)';
COMMENT ON COLUMN "Supplier".email_encrypted IS 'AES-256-GCM encrypted email (LGPD compliance)';

-- =====================================================
-- NOTES FOR DEPLOYMENT
-- =====================================================

-- 1. Run this migration in staging first
-- 2. Run the approved data backfill process for encrypted fields
-- 3. Verify encrypted data works correctly (1 week testing)
-- 4. Deploy to production
-- 5. After 2 weeks of validation, drop original columns:
--    ALTER TABLE "Customer" DROP COLUMN phone, DROP COLUMN email;
--    ALTER TABLE "Supplier" DROP COLUMN phone, DROP COLUMN email;

-- =====================================================
-- ROLLBACK (if needed)
-- =====================================================

-- To rollback this migration:
-- ALTER TABLE "Customer" DROP COLUMN phone_encrypted, DROP COLUMN email_encrypted;
-- ALTER TABLE "Supplier" DROP COLUMN phone_encrypted, DROP COLUMN email_encrypted;
