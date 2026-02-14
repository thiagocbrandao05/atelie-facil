-- Migration to add advanced pricing columns to Settings table
ALTER TABLE "Settings" ADD COLUMN IF NOT EXISTS "taxRate" DECIMAL(65,30) DEFAULT 0;
ALTER TABLE "Settings" ADD COLUMN IF NOT EXISTS "cardFeeRate" DECIMAL(65,30) DEFAULT 0;
ALTER TABLE "Settings" ADD COLUMN IF NOT EXISTS "targetMonthlyProfit" DECIMAL(65,30) DEFAULT 0;
ALTER TABLE "Settings" ADD COLUMN IF NOT EXISTS "psychologicalPricingPattern" TEXT DEFAULT '90';
