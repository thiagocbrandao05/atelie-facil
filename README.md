# Atelis

SaaS para pequenos empreendedores criativos com foco em clareza de operacao, precificacao e saude financeira.

## Stack

- Next.js 16 + React 19 + TypeScript
- Supabase (Auth, Postgres, RLS)
- Tailwind CSS 4 + componentes internos
- Vitest (unit) e Playwright (e2e)

## Rodando localmente

### 1) Instalar dependencias

```bash
npm install
```

### 2) Configurar ambiente

Copie `.env.example` para `.env.local` e preencha as chaves obrigatorias.

```bash
cp .env.example .env.local
```

### 3) Subir app

```bash
npm run dev
```

Acesse `http://localhost:3000`.

## Scripts principais

- `npm run dev`: desenvolvimento
- `npm run build`: build de producao
- `npm run start`: servidor de producao
- `npm run lint`: lint
- `npx tsc --noEmit`: typecheck
- `npm run test:unit`: testes unitarios
- `npm run test:e2e`: testes e2e

## Qualidade e seguranca

Checklist rapido antes de merge:

1. `npm run lint`
2. `npx tsc --noEmit`
3. `npm run test:unit`
4. `npm audit`

## Documentacao util

- `docs/CREATE_TEST_USER.md`
- `docs/whatsapp-automatic-notifications.md`
- `docs/PWA_ICONS_SETUP.md`
