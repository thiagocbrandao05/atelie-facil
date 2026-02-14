-- Add colors column to Material table
ALTER TABLE "Material" ADD COLUMN IF NOT EXISTS "colors" TEXT;
