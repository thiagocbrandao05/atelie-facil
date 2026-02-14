-- ============================================================================
-- PARTE 1: EXECUTE ESTE BLOCO SOZINHO PRIMEIRO (ADICIONAR ENUMS)
-- PostgreSQL exige que novos valores de ENUM sejam "comitados" antes de serem usados.
-- Se rodar tudo junto, dará erro 55P04.
-- ============================================================================

ALTER TYPE "PlanType" ADD VALUE IF NOT EXISTS 'free_creative';
ALTER TYPE "PlanType" ADD VALUE IF NOT EXISTS 'free_reseller';
ALTER TYPE "PlanType" ADD VALUE IF NOT EXISTS 'paid_creative';
ALTER TYPE "PlanType" ADD VALUE IF NOT EXISTS 'paid_reseller';
ALTER TYPE "PlanType" ADD VALUE IF NOT EXISTS 'premium_creative';
ALTER TYPE "PlanType" ADD VALUE IF NOT EXISTS 'premium_reseller';

-- PARE AQUI E EXECUTE O BLOCO ACIMA NO SQL EDITOR.
-- APÓS O SUCESSO, APAGUE O TEXTO ACIMA E COLE A PARTE 2 ABAIXO.

-- ============================================================================
-- PARTE 2: EXECUTE O RESTANTE DO SCRIPT ABAIXO
-- ============================================================================

-- 2. ADICIONA PERFIL AO TENANT
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TenantProfile') THEN
        CREATE TYPE "TenantProfile" AS ENUM ('CREATIVE', 'RESELLER', 'HYBRID');
    END IF;
END $$;

ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "profile" "TenantProfile" DEFAULT 'CREATIVE';

-- 3. TABELA DE ESTOQUE DE PRODUTO PRONTO
CREATE TABLE IF NOT EXISTS "ProductInventory" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "tenantId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "minQuantity" DOUBLE PRECISION DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProductInventory_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ProductInventory_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProductInventory_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "ProductInventory_productId_key" ON "ProductInventory"("productId");

-- 4. MOVIMENTAÇÃO DE ESTOQUE DE PRODUTO PRONTO
CREATE TABLE IF NOT EXISTS "ProductInventoryMovement" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "tenantId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "type" TEXT NOT NULL, -- 'ENTRADA' | 'SAIDA' | 'AJUSTE'
    "quantity" DOUBLE PRECISION NOT NULL,
    "reason" TEXT NOT NULL,
    "reference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,
    CONSTRAINT "ProductInventoryMovement_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ProductInventoryMovement_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProductInventoryMovement_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- 5. TABELA DE PERMISSÕES DINÂMICAS (MÓDULOS)
CREATE TABLE IF NOT EXISTS "Feature" (
    "id" TEXT NOT NULL, -- ex: 'FINANCIAL', 'AI_REPORTS', 'WHATSAPP_AUTO'
    "name" TEXT NOT NULL,
    "description" TEXT,
    CONSTRAINT "Feature_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "PlanFeature" (
    "plan" "PlanType" NOT NULL,
    "featureId" TEXT NOT NULL,
    CONSTRAINT "PlanFeature_pkey" PRIMARY KEY ("plan", "featureId"),
    CONSTRAINT "PlanFeature_featureId_fkey" FOREIGN KEY ("featureId") REFERENCES "Feature"("id") ON DELETE CASCADE
);

-- Popula features base
INSERT INTO "Feature" (id, name, description) VALUES
('FINANCIAL', 'Gestão Financeira', 'Acesso a entradas, saídas e fluxo de caixa'),
('AI_INSIGHTS', 'Inteligência Artificial', 'Previsões sazonais e sugestões da IA'),
('WHATSAPP_AUTO', 'WhatsApp Automático', 'Envio automático via API oficial'),
('REPORTS_ADVANCED', 'Relatórios Avançados', 'PDFs e dashboards detalhados'),
('INVENTORY_FINISHED', 'Estoque de Produto Pronto', 'Controle de produtos acabados para pronta-entrega')
ON CONFLICT (id) DO NOTHING;

-- Mapeia features para os planos pagos e premium
-- (Planos Free não tem features extras na tabela, são limitados pelo código e RLS se necessário)
INSERT INTO "PlanFeature" ("plan", "featureId") 
SELECT p.val::"PlanType", f.id FROM 
(VALUES ('paid_creative'), ('paid_reseller'), ('premium_creative'), ('premium_reseller')) AS p(val),
(VALUES ('FINANCIAL'), ('REPORTS_ADVANCED'), ('INVENTORY_FINISHED')) AS f(id)
ON CONFLICT DO NOTHING;

INSERT INTO "PlanFeature" ("plan", "featureId")
SELECT p.val::"PlanType", f.id FROM
(VALUES ('premium_creative'), ('premium_reseller')) AS p(val),
(VALUES ('AI_INSIGHTS'), ('WHATSAPP_AUTO')) AS f(id)
ON CONFLICT DO NOTHING;

-- Habilita RLS
ALTER TABLE "ProductInventory" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ProductInventoryMovement" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Feature" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PlanFeature" ENABLE ROW LEVEL SECURITY;

-- Políticas de Isolação
CREATE POLICY "Tenant isolation for ProductInventory" ON "ProductInventory" USING ("tenantId" = get_current_tenant_id());
CREATE POLICY "Tenant isolation for ProductInventoryMovement" ON "ProductInventoryMovement" USING ("tenantId" = get_current_tenant_id());
CREATE POLICY "Public read for Feature" ON "Feature" FOR SELECT USING (true);
CREATE POLICY "Public read for PlanFeature" ON "PlanFeature" FOR SELECT USING (true);
