# Como criar usuário de teste

## Pré-requisitos

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## Passo a passo (sem script)

1. Abra o Supabase Dashboard.
2. Vá em `Authentication > Users`.
3. Crie o usuário:

- Email: `test@ateliefacil.com.br`
- Senha: `TestPassword123!`

4. Copie o `id` do usuário criado.
5. Em `Table Editor`, crie um tenant e o vínculo do usuário com esse tenant nas tabelas do projeto.

## Variáveis para E2E

No `.env.local`, defina:

```env
TEST_USER_EMAIL=test@ateliefacil.com.br
TEST_USER_PASSWORD=TestPassword123!
TEST_WORKSPACE_SLUG=atelis
```

## Validar

- Acesse `http://localhost:3000/login`
- Faça login com o usuário de teste
- Rode `npm run test:e2e`
