# Plano de implantação — Notificações automáticas de WhatsApp

## 1) Análise da lógica atual

### 1.1 Onde está o botão “notificar”

- O botão “Notificar” é renderizado em `src/components/whatsapp-button.tsx`, que monta a mensagem localmente no client e abre o WhatsApp Web com `https://wa.me/...`.
- Esse componente é usado na listagem de pedidos em `src/app/dashboard/pedidos/page.tsx`, junto aos botões de atualização de status.

### 1.2 Como a mensagem é montada hoje

- A montagem usa templates configuráveis (quando disponíveis) e faz substituição de placeholders como `{cliente}`, `{link}`, `{pedido}`.
- Para `QUOTATION`, injeta o link do PDF do orçamento (`/pedidos/{id}/pdf`) e garante que o link esteja na mensagem.
- Para `READY`, usa `msgReady` e também garante o link.
- Para outros status, cai em um texto padrão com link.

### 1.3 Onde ficam os templates configuráveis

- Os templates são campos na tabela `Settings` (`msgQuotation`, `msgApproved`, `msgReady`, `msgFinished`).
- Eles são editados em `src/components/settings-form.tsx` e persistidos via `src/features/settings/actions.ts`.

### 1.4 Geração e link do PDF do orçamento

- O PDF é uma página pública em `src/app/(public)/pedidos/[id]/pdf/page.tsx`.
- O link usado hoje é `${baseUrl}/pedidos/${orderId}/pdf`.

### 1.5 Onde o status é atualizado

- A atualização de status ocorre via `updateOrderStatus` em `src/features/orders/actions.ts`, acionada por `StatusUpdateButton` e pelo Kanban (`src/components/orders/kanban-board.tsx`).

## 2) Proposta de modelagem da tabela de logs (Supabase)

Nova tabela: **`WhatsAppNotificationLog`**.

Campos sugeridos:

- `id` (uuid/text PK)
- `tenantId` (workspace/tenant)
- `orderId` (uuid/text, FK para `Order`)
- `customerPhone` (text)
- `statusFrom` (text)
- `statusTo` (text)
- `messageType` (text) → exemplo: `QUOTATION_CREATED`, `STATUS_UPDATED`
- `templateKey` (text) → exemplo: `msgQuotation`, `msgReady`
- `messageBody` (text)
- `payload` (jsonb) → variáveis usadas para montar a mensagem
- `attempts` (int, default 0)
- `lastAttemptAt` (timestamp, nullable)
- `status` (text) → `PENDING | SENT | FAILED | GAVE_UP`
- `errorMessage` (text, nullable)
- `providerMessageId` (text, nullable)
- `createdAt` / `updatedAt` (timestamp)

RLS:

- Política padrão de isolamento por `tenantId` (mesmo padrão das demais tabelas).

Índices:

- `tenantId`, `orderId`, `status`, `createdAt` (índices para consulta do job de retry).

## 3) Integração do envio automático por mudança de status

### 3.1 Gatilhos de envio

- **Sempre que o status mudar**, disparar envio automático.
- Mapeamento de templates:
  - `QUOTATION` → `msgQuotation`
  - `PENDING` → `msgApproved`
  - `READY` → `msgReady`
  - `DELIVERED` → `msgFinished`
  - Demais status → mensagem padrão fallback

### 3.2 Montagem da mensagem

- Usar templates do `Settings` com placeholders:
  - `{cliente}` → nome do cliente
  - `{valor}` → total do pedido
  - `{itens}` → resumo dos itens
  - `{pedido}` → identificador curto do pedido
  - `{link}` → link do PDF
- Se não houver template, usar texto padrão semelhante ao atual.

### 3.3 Encaixe no código

- **Remover** o uso do `WhatsAppButton` em `src/app/dashboard/pedidos/page.tsx`.
- **Adicionar** o disparo automático em `updateOrderStatus` (server action), após a atualização do status.
- **Adicionar** envio no `createOrder` quando o pedido já nasce com status `QUOTATION`.

## 4) Envio do link do PDF para orçamento

- Evento considerado como “orçamento criado”:
  - Quando o status é `QUOTATION` (no create ou mudança de status).
- Fonte do link:
  - `/${baseUrl}/pedidos/${orderId}/pdf` (página pública do orçamento).
- Regra:
  - A mensagem de orçamento sempre deve **incluir** o link ao final, mesmo se o template não tiver `{link}`.

## 5) Retry + backoff

- Estratégia de tentativas:
  - `attempts = 0` → envio imediato
  - `attempts = 1` → esperar 1 minuto
  - `attempts = 2` → esperar 5 minutos
  - `attempts = 3` → esperar 15 minutos
  - `attempts = 4` → esperar 60 minutos
  - `attempts >= 5` → `GAVE_UP`

- Implementar um **job server-side** (server action) que:
  - Busca logs `PENDING` ou `FAILED` com `attempts < MAX_ATTEMPTS`.
  - Checa se já passou o tempo de backoff (baseado em `lastAttemptAt`).
  - Tenta reenvio e atualiza status/erro.

## 6) Estratégia de rollout

- **Feature flag** opcional via env: `WHATSAPP_AUTOMATION_ENABLED=true`.
- Se desativada, não dispara envio automático (mas mantém o log).
- Fallback: desligar a flag e manter execução manual (sem botão no UI).

## 7) Lista de arquivos a criar/alterar

**Criar**

- `docs/whatsapp-automatic-notifications.md` (este plano)
- `src/lib/whatsapp-cloud.ts` (cliente Cloud API)
- `src/features/whatsapp/actions.ts` (envio e retry)
- `supabase/migrations/20260206000003_whatsapp_notification_logs.sql`

**Alterar**

- `src/features/orders/actions.ts` (disparo automático no create/update)
- `src/app/dashboard/pedidos/page.tsx` (remover botão)
- `src/components/whatsapp-button.tsx` (remover ou descontinuar)
- `src/lib/supabase/types.ts` (se necessário para tipagem)

## 8) Migrações do Supabase

1. Criar tabela `WhatsAppNotificationLog` com índices e RLS.
2. Opcional: criar enum de status (`PENDING | SENT | FAILED | GAVE_UP`) se padrão exigir.

## 9) Variáveis de ambiente necessárias

- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_ACCESS_TOKEN`
- `WHATSAPP_API_VERSION`
- `WHATSAPP_BASE_URL`
- `WHATSAPP_AUTOMATION_ENABLED`
- `NEXT_PUBLIC_APP_URL` (ou equivalente para compor o link público do PDF)

## 10) Como testar ponta-a-ponta

1. Criar pedido como orçamento (`QUOTATION`) → mensagem enviada com link do PDF.
2. Aprovar orçamento (`PENDING`) → mensagem enviada usando template de aprovado.
3. Mudar status para `READY` → mensagem enviada usando template de pronto.
4. Entregar (`DELIVERED`) → mensagem enviada usando template de agradecimento.
5. Simular falha (token inválido) → log com `FAILED`, depois reprocessar com job de retry e ver backoff.
