# WhatsApp Automatic Notifications

Documento atualizado para refletir o estado atual do Atelis.

## Fluxo atual

- O envio e o controle de limite estao em `src/features/whatsapp/actions.ts` e `src/features/whatsapp/limits.ts`.
- O disparo acontece no fluxo de pedidos, sem botao legado dedicado de notificacao.
- As regras por plano usam `src/features/subscription/utils.ts`.

## Pontos de integracao

- Pedidos: `src/app/[workspaceSlug]/app/pedidos/page.tsx`
- Acoes de pedidos: `src/features/orders/actions.ts`
- Configuracoes de mensagem: `src/components/settings-form.tsx`

## Requisitos de ambiente

- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_ACCESS_TOKEN`
- `WHATSAPP_API_VERSION`
- `WHATSAPP_BASE_URL`
- `NEXT_PUBLIC_APP_URL`

## Testes recomendados

1. Criar pedido e validar tentativa de envio.
2. Alterar status e validar mensagem correspondente.
3. Simular falha de credencial e validar tratamento de erro.
4. Validar bloqueio por limite de plano.

## Nota de limpeza

- Referencias antigas a `src/components/whatsapp-button.tsx` foram removidas deste documento.
- Caminhos antigos como `src/app/dashboard/pedidos/page.tsx` nao representam a estrutura atual.
