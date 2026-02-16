-- Financial module base tables (aligned with current schema conventions)
-- Notes:
-- - Tenant PK is "Tenant"."id" (TEXT), not tenants(id)
-- - Keep snake_case for financial tables because app code already uses it
-- - Statements are idempotent to support safe re-run after partial failures

-- 1) Enums
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transaction_type') THEN
    CREATE TYPE transaction_type AS ENUM ('IN', 'OUT');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transaction_status') THEN
    CREATE TYPE transaction_status AS ENUM ('paid', 'pending', 'cancelled');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_method') THEN
    CREATE TYPE payment_method AS ENUM ('pix', 'credit', 'debit', 'cash', 'transfer', 'boleto', 'other');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'recurrence_frequency') THEN
    CREATE TYPE recurrence_frequency AS ENUM ('daily', 'weekly', 'monthly', 'yearly');
  END IF;
END
$$;

-- 2) Categories
CREATE TABLE IF NOT EXISTS transaction_categories (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id TEXT NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type transaction_type NOT NULL,
  icon TEXT,
  color TEXT,
  is_system_default BOOLEAN DEFAULT false,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3) Recurrence templates
CREATE TABLE IF NOT EXISTS financial_recurrence_templates (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id TEXT NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  type transaction_type NOT NULL,
  category_id TEXT REFERENCES transaction_categories(id) ON DELETE SET NULL,
  frequency recurrence_frequency NOT NULL,
  interval INTEGER DEFAULT 1,
  next_due_date DATE NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4) Transactions
CREATE TABLE IF NOT EXISTS financial_transactions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id TEXT NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  type transaction_type NOT NULL,
  category_id TEXT REFERENCES transaction_categories(id) ON DELETE SET NULL,
  payment_method payment_method DEFAULT 'other',
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  status transaction_status DEFAULT 'paid',
  is_recurring BOOLEAN DEFAULT false,
  recurrence_id TEXT REFERENCES financial_recurrence_templates(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  attachment_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5) Preferences
CREATE TABLE IF NOT EXISTS financial_preferences (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id TEXT NOT NULL UNIQUE REFERENCES "Tenant"(id) ON DELETE CASCADE,
  monthly_revenue_goal NUMERIC(12,2),
  min_daily_balance NUMERIC(12,2),
  alert_email BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6) Indexes
CREATE INDEX IF NOT EXISTS idx_transactions_tenant_date ON financial_transactions(tenant_id, date);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON financial_transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_categories_tenant ON transaction_categories(tenant_id);

-- 7) RLS
ALTER TABLE transaction_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_recurrence_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_preferences ENABLE ROW LEVEL SECURITY;

-- Categories policies
DROP POLICY IF EXISTS "Users can view their own categories" ON transaction_categories;
CREATE POLICY "Users can view their own categories" ON transaction_categories
  FOR SELECT USING (tenant_id = get_current_tenant_id());

DROP POLICY IF EXISTS "Users can insert their own categories" ON transaction_categories;
CREATE POLICY "Users can insert their own categories" ON transaction_categories
  FOR INSERT WITH CHECK (tenant_id = get_current_tenant_id());

DROP POLICY IF EXISTS "Users can update their own categories" ON transaction_categories;
CREATE POLICY "Users can update their own categories" ON transaction_categories
  FOR UPDATE USING (tenant_id = get_current_tenant_id());

DROP POLICY IF EXISTS "Users can delete their own categories" ON transaction_categories;
CREATE POLICY "Users can delete their own categories" ON transaction_categories
  FOR DELETE USING (tenant_id = get_current_tenant_id());

-- Transactions policies
DROP POLICY IF EXISTS "Users can view their own transactions" ON financial_transactions;
CREATE POLICY "Users can view their own transactions" ON financial_transactions
  FOR SELECT USING (tenant_id = get_current_tenant_id());

DROP POLICY IF EXISTS "Users can insert their own transactions" ON financial_transactions;
CREATE POLICY "Users can insert their own transactions" ON financial_transactions
  FOR INSERT WITH CHECK (tenant_id = get_current_tenant_id());

DROP POLICY IF EXISTS "Users can update their own transactions" ON financial_transactions;
CREATE POLICY "Users can update their own transactions" ON financial_transactions
  FOR UPDATE USING (tenant_id = get_current_tenant_id());

DROP POLICY IF EXISTS "Users can delete their own transactions" ON financial_transactions;
CREATE POLICY "Users can delete their own transactions" ON financial_transactions
  FOR DELETE USING (tenant_id = get_current_tenant_id());

-- Recurrence policies
DROP POLICY IF EXISTS "Users can view their own recurrence templates" ON financial_recurrence_templates;
CREATE POLICY "Users can view their own recurrence templates" ON financial_recurrence_templates
  FOR SELECT USING (tenant_id = get_current_tenant_id());

DROP POLICY IF EXISTS "Users can insert their own recurrence templates" ON financial_recurrence_templates;
CREATE POLICY "Users can insert their own recurrence templates" ON financial_recurrence_templates
  FOR INSERT WITH CHECK (tenant_id = get_current_tenant_id());

DROP POLICY IF EXISTS "Users can update their own recurrence templates" ON financial_recurrence_templates;
CREATE POLICY "Users can update their own recurrence templates" ON financial_recurrence_templates
  FOR UPDATE USING (tenant_id = get_current_tenant_id());

DROP POLICY IF EXISTS "Users can delete their own recurrence templates" ON financial_recurrence_templates;
CREATE POLICY "Users can delete their own recurrence templates" ON financial_recurrence_templates
  FOR DELETE USING (tenant_id = get_current_tenant_id());

-- Preferences policies
DROP POLICY IF EXISTS "Users can view their own preferences" ON financial_preferences;
CREATE POLICY "Users can view their own preferences" ON financial_preferences
  FOR SELECT USING (tenant_id = get_current_tenant_id());

DROP POLICY IF EXISTS "Users can insert their own preferences" ON financial_preferences;
CREATE POLICY "Users can insert their own preferences" ON financial_preferences
  FOR INSERT WITH CHECK (tenant_id = get_current_tenant_id());

DROP POLICY IF EXISTS "Users can update their own preferences" ON financial_preferences;
CREATE POLICY "Users can update their own preferences" ON financial_preferences
  FOR UPDATE USING (tenant_id = get_current_tenant_id());

-- 8) Seed helper for new tenants
CREATE OR REPLACE FUNCTION seed_financial_categories()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO transaction_categories (tenant_id, name, type, icon, color, is_system_default)
  VALUES
    (NEW.id, 'Venda de produto', 'IN', 'shopping-bag', 'green-500', true),
    (NEW.id, 'Servico prestado', 'IN', 'scissors', 'blue-500', true),
    (NEW.id, 'Materia-prima', 'OUT', 'package', 'orange-500', true),
    (NEW.id, 'Embalagem', 'OUT', 'gift', 'purple-500', true),
    (NEW.id, 'Marketing', 'OUT', 'megaphone', 'pink-500', true),
    (NEW.id, 'Ferramentas/Software', 'OUT', 'monitor', 'gray-500', true),
    (NEW.id, 'Impostos', 'OUT', 'file-text', 'red-500', true),
    (NEW.id, 'Pro-labore', 'OUT', 'user', 'yellow-500', true);

  INSERT INTO financial_preferences (tenant_id) VALUES (NEW.id)
  ON CONFLICT (tenant_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger creation is intentionally not forced here to avoid touching existing tenant triggers.
