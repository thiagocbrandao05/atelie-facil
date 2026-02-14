# Como Criar Usuário de Teste

## 📋 Pré-requisitos

Você precisa da **Service Role Key** do Supabase.

### Como Pegar a Service Role Key:

1. Abra o **Supabase Dashboard**: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **Settings** → **API**
4. Na seção **Project API keys**, copie a **service_role** key (não é a anon key!)
5. ⚠️ **IMPORTANTE:** Essa chave é sensível, nunca comite no git!

---

## 🔧 Configuração

Adicione ao `.env.local`:

```env
# Chaves que você já tem
NEXT_PUBLIC_SUPABASE_URL=https://gucxrjywcvmkxppzghtc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...

# **ADICIONE ESTAS NOVAS LINHAS:**

# Service Role Key (pegue no Dashboard → Settings → API)
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...SEU_SERVICE_ROLE_KEY_AQUI...

# Encryption Key (já gerada anteriormente)
DATA_ENCRYPTION_KEY=8442276b47a6ee070f3ad9e36d9ebb464c2c23d74a6833acee7f934ba69b563f

# Test User (serão criadas pelo script)
TEST_USER_EMAIL=test@ateliefacil.com.br
TEST_USER_PASSWORD=TestPassword123!
```

---

## ▶️ Executar Script

Depois de adicionar as chaves ao `.env.local`:

```bash
# Criar usuário de teste
npx tsx scripts/create-test-user.ts
```

**Output esperado:**
```
🔧 Creating test user...

1️⃣ Creating auth user...
   ✅ User created: abc-123-def

2️⃣ Creating tenant...
   ✅ Tenant created: tenant-456

3️⃣ Creating user-tenant relationship...
   ✅ User-tenant relationship created

🎉 Test user created successfully!

📧 Credentials:
   Email: test@ateliefacil.com.br
   Password: TestPassword123!

🏢 Tenant:
   Name: Ateliê Teste
   Slug: atelie-teste

🌐 Access: http://localhost:3000/atelie-teste/app/dashboard
```

---

## ✅ Testar Login

1. Acesse: http://localhost:3000/login
2. Use as credenciais:
   - Email: `test@ateliefacil.com.br`
   - Password: `TestPassword123!`
3. Deve redirecionar para: `http://localhost:3000/atelie-teste/app/dashboard`

---

## 🧪 Usar nos Testes E2E

O script já adiciona as variáveis `TEST_USER_EMAIL` e `TEST_USER_PASSWORD` que são usadas em `tests/helpers/playwright.ts`.

Para rodar os testes E2E:

```bash
npm run test:e2e
```

---

## 🔄 Se o Script Falhar

**Erro: "User already exists"**
- ✅ Normal! O script vai detectar e usar o usuário existente

**Erro: "Missing SUPABASE_SERVICE_ROLE_KEY"**
- ❌ Você esqueceu de adicionar a chave ao `.env.local`
- Volte para o passo de configuração acima

**Erro: "Tenant already exists"**
- ✅ O script vai mostrar as credenciais do tenant existente

---

## 🗑️ Remover Usuário de Teste

Se precisar remover o usuário:

1. Vá no **Supabase Dashboard**
2. **Authentication** → **Users**
3. Encontre `test@ateliefacil.com.br`
4. Click em **...** → **Delete User**

Ou via SQL:

```sql
-- Delete user (cascade deletes tenant and relationships)
DELETE FROM auth.users WHERE email = 'test@ateliefacil.com.br';
```
