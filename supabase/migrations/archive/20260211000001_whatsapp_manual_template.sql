-- Add template field for manual WhatsApp notifications
-- This template is used for the "Notify via WhatsApp" button available in Start and Pro plans

ALTER TABLE "Settings"
ADD COLUMN IF NOT EXISTS "whatsappNotifyTemplate" TEXT DEFAULT 'Olá {cliente}, seu pedido #{numero} está {status}!';

COMMENT ON COLUMN "Settings"."whatsappNotifyTemplate" IS 
'Template de mensagem para notificações manuais via botão WhatsApp. 
Variáveis disponíveis: {cliente}, {numero}, {status}, {valor}. 
Usado em planos Start e Pro que não têm acesso à API automática.';

-- Index for faster queries
CREATE INDEX IF NOT EXISTS "idx_settings_whatsapp_template" 
ON "Settings"("tenantId") 
WHERE "whatsappNotifyTemplate" IS NOT NULL;
