-- Migration: Invisible Finance Preferences
-- Add support for Simple/Advanced financial display modes and configurable margin thresholds

ALTER TABLE "Settings" 
ADD COLUMN IF NOT EXISTS "financialDisplayMode" TEXT DEFAULT 'simple',
ADD COLUMN IF NOT EXISTS "marginThresholdWarning" NUMERIC DEFAULT 20,
ADD COLUMN IF NOT EXISTS "marginThresholdOptimal" NUMERIC DEFAULT 40;

-- Comment on columns for clarity
COMMENT ON COLUMN "Settings"."financialDisplayMode" IS 'Modo de exibição financeiro: simple (humano) ou advanced (técnico)';
COMMENT ON COLUMN "Settings"."marginThresholdWarning" IS 'Limite de margem de contribuição para alerta de atenção (%)';
COMMENT ON COLUMN "Settings"."marginThresholdOptimal" IS 'Limite de margem de contribuição para status saudável (%)';
