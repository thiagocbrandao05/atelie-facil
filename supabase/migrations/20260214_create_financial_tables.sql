-- Create ENUMs
CREATE TYPE transaction_type AS ENUM ('IN', 'OUT');
CREATE TYPE transaction_status AS ENUM ('paid', 'pending', 'cancelled');
CREATE TYPE payment_method AS ENUM ('pix', 'credit', 'debit', 'cash', 'transfer', 'boleto', 'other');
CREATE TYPE recurrence_frequency AS ENUM ('daily', 'weekly', 'monthly', 'yearly');

-- 1. Transaction Categories
CREATE TABLE transaction_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type transaction_type NOT NULL,
    icon TEXT,
    color TEXT,
    is_system_default BOOLEAN DEFAULT false,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Financial Recurrence Templates (Pro/Premium)
CREATE TABLE financial_recurrence_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    type transaction_type NOT NULL,
    category_id UUID REFERENCES transaction_categories(id) ON DELETE SET NULL,
    frequency recurrence_frequency NOT NULL,
    interval INTEGER DEFAULT 1,
    next_due_date DATE NOT NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Financial Transactions
CREATE TABLE financial_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    amount DECIMAL(12,2) NOT NULL, -- Always positive
    type transaction_type NOT NULL,
    category_id UUID REFERENCES transaction_categories(id) ON DELETE SET NULL,
    payment_method payment_method DEFAULT 'other',
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    status transaction_status DEFAULT 'paid',
    is_recurring BOOLEAN DEFAULT false,
    recurrence_id UUID REFERENCES financial_recurrence_templates(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}',
    attachment_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Financial Preferences
CREATE TABLE financial_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE UNIQUE,
    monthly_revenue_goal DECIMAL(12,2),
    min_daily_balance DECIMAL(12,2),
    alert_email BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_transactions_tenant_date ON financial_transactions(tenant_id, date);
CREATE INDEX idx_transactions_category ON financial_transactions(category_id);
CREATE INDEX idx_categories_tenant ON transaction_categories(tenant_id);

-- RLS Policies
ALTER TABLE transaction_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_recurrence_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_preferences ENABLE ROW LEVEL SECURITY;

-- Policies for Categories
CREATE POLICY "Users can view their own categories" ON transaction_categories
    FOR SELECT USING (auth.uid() = tenant_id);
CREATE POLICY "Users can insert their own categories" ON transaction_categories
    FOR INSERT WITH CHECK (auth.uid() = tenant_id);
CREATE POLICY "Users can update their own categories" ON transaction_categories
    FOR UPDATE USING (auth.uid() = tenant_id);
CREATE POLICY "Users can delete their own categories" ON transaction_categories
    FOR DELETE USING (auth.uid() = tenant_id);

-- Policies for Transactions
CREATE POLICY "Users can view their own transactions" ON financial_transactions
    FOR SELECT USING (auth.uid() = tenant_id);
CREATE POLICY "Users can insert their own transactions" ON financial_transactions
    FOR INSERT WITH CHECK (auth.uid() = tenant_id);
CREATE POLICY "Users can update their own transactions" ON financial_transactions
    FOR UPDATE USING (auth.uid() = tenant_id);
CREATE POLICY "Users can delete their own transactions" ON financial_transactions
    FOR DELETE USING (auth.uid() = tenant_id);

-- Policies for Preferences
CREATE POLICY "Users can view their own preferences" ON financial_preferences
    FOR SELECT USING (auth.uid() = tenant_id);
CREATE POLICY "Users can insert their own preferences" ON financial_preferences
    FOR INSERT WITH CHECK (auth.uid() = tenant_id);
CREATE POLICY "Users can update their own preferences" ON financial_preferences
    FOR UPDATE USING (auth.uid() = tenant_id);

-- Seed Function for New Tenants (Trigger)
CREATE OR REPLACE FUNCTION seed_financial_categories()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO transaction_categories (tenant_id, name, type, icon, color, is_system_default)
    VALUES
    (NEW.id, 'Venda de Produto', 'IN', 'shopping-bag', 'green-500', true),
    (NEW.id, 'Serviço Prestado', 'IN', 'scissors', 'blue-500', true),
    (NEW.id, 'Matéria Prima', 'OUT', 'package', 'orange-500', true),
    (NEW.id, 'Embalagem', 'OUT', 'gift', 'purple-500', true),
    (NEW.id, 'Marketing', 'OUT', 'megaphone', 'pink-500', true),
    (NEW.id, 'Ferramentas/Software', 'OUT', 'monitor', 'gray-500', true),
    (NEW.id, 'Impostos', 'OUT', 'file-text', 'red-500', true),
    (NEW.id, 'Pró-Labore', 'OUT', 'user', 'yellow-500', true);
    
    INSERT INTO financial_preferences (tenant_id) VALUES (NEW.id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to seed categories on tenant creation
-- Assumes 'tenants' table exists and triggers are allowed
-- Note: You might need to attach this trigger to your existing 'tenants' table manually or via migration if it's not handled by Supabase auth hook.
