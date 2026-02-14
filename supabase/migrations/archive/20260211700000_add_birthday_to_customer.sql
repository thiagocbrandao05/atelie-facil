-- Add birthday column to Customer table
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "birthday" DATE;
