# Como criar usuario de teste

## Pre-requisitos

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## Passo a passo (sem script)

1. Abra o Supabase Dashboard.
2. Va em `Authentication > Users`.
3. Crie o usuario:

- Email: `test@atelis.local`
- Senha: `TestPassword123!`

4. Copie o `id` do usuario criado.
5. Em `Table Editor`, crie um tenant e o vinculo do usuario com esse tenant nas tabelas do projeto.

## Variaveis para E2E

No `.env.local`, defina:

```env
TEST_USER_EMAIL=test@atelis.local
TEST_USER_PASSWORD=TestPassword123!
TEST_WORKSPACE_SLUG=atelis
```

## Validar

- Acesse `http://localhost:3000/login`
- Faca login com o usuario de teste
- Rode `npm run test:e2e`
