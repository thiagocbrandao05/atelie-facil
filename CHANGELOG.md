# Changelog

## 2026-02-15

### Added

- Fluxo E2E estabilizado com setup de ambiente de teste (`TEST_USER_EMAIL`, `TEST_USER_PASSWORD`, `TEST_WORKSPACE_SLUG`).
- Bypass controlado de rate limit para execucao E2E via `E2E_DISABLE_RATE_LIMIT=true`.
- Changelog inicial do projeto.

### Changed

- Remocao do modulo financeiro legado e consolidacao no modulo financeiro atual.
- Grande limpeza de codigo morto, arquivos obsoletos e scripts nao utilizados.
- Migracao do importador para CSV-only, removendo dependencia `xlsx` vulneravel.
- Atualizacao de dependencias com migracao para `zod@4`.
- Remocao do tooling `@lhci/cli` para eliminar vulnerabilidades de dev-dependencies.
- Atualizacao de `jsdom` e `@types/node` para versoes major mais recentes compativeis.
- Correcoes em runtime Next 16 (`params` assincrono e uso indevido de cache com fonte dinamica).
- Ajustes de docs para o nome/fluxo atual do Atelis.

### Fixed

- Revalidacao de notificacoes com rota baseada em `workspaceSlug`.
- Erros de autenticacao/instabilidade em testes E2E por fixture e limitacao de login.
- Compatibilidade de testes E2E com seletores e estrutura atual de telas de pedidos/configuracoes.

### Security

- `npm audit` zerado para dependencias de runtime.
- Remocao de componentes/dependencias com superficie de risco sem uso.
