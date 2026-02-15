# Cron Setup (Atelis)

## Objetivo

Configurar os jobs internos para:

1. envio de notificacoes WhatsApp pendentes;
2. geracao diaria de recorrencias financeiras.

## Rotas internas

- `POST /api/internal/cron/whatsapp-notifications`
- `POST /api/internal/cron/financial-recurrence`

As duas rotas exigem:

- header `Authorization: Bearer <CRON_SECRET>`

## Variaveis de ambiente

Configure no ambiente de deploy:

```env
CRON_SECRET=um_segredo_forte
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key
```

## Agendamento (Vercel)

O arquivo `vercel.json` ja define:

- WhatsApp: `*/10 * * * *`
- Recorrencia financeira: `5 3 * * *` (03:05 UTC, diariamente)

## Teste manual dos jobs

```bash
curl -X POST \
  -H "Authorization: Bearer $CRON_SECRET" \
  https://SEU_DOMINIO/api/internal/cron/financial-recurrence
```

```bash
curl -X POST \
  -H "Authorization: Bearer $CRON_SECRET" \
  https://SEU_DOMINIO/api/internal/cron/whatsapp-notifications
```

## Aplicacao da migration SQL

A migration desta entrega:

- `supabase/migrations/20260215000100_order_cancellation_and_sequence_hardening.sql`

Fluxo recomendado:

1. rodar local:

```bash
supabase db reset
```

2. em ambiente remoto (projeto linkado):

```bash
supabase db push
```

## Validacao apos deploy

1. Cancelar um pedido e confirmar que vira `CANCELLED` (sem delete fisico).
2. Criar/usar template de recorrencia com `next_due_date` <= hoje e rodar cron; validar geracao em `financial_transactions`.
3. Confirmar que links publicos de orcamento continuam usando numero amigavel.
