-- Add WhatsApp Cloud API credential columns to Settings table
ALTER TABLE "Settings" ADD COLUMN IF NOT EXISTS "whatsappPhoneNumberId" TEXT;
ALTER TABLE "Settings" ADD COLUMN IF NOT EXISTS "whatsappAccessToken" TEXT;
ALTER TABLE "Settings" ADD COLUMN IF NOT EXISTS "whatsappConfigVerified" BOOLEAN DEFAULT FALSE;
