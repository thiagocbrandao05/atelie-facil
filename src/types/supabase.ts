export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            financial_transactions: {
                Row: {
                    id: string
                    tenant_id: string
                    description: string
                    amount: number
                    type: 'IN' | 'OUT'
                    category_id: string | null
                    payment_method: 'pix' | 'credit' | 'debit' | 'cash' | 'transfer' | 'boleto' | 'other'
                    date: string
                    status: 'paid' | 'pending' | 'cancelled'
                    is_recurring: boolean
                    recurrence_id: string | null
                    metadata: Json
                    attachment_url: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    tenant_id: string
                    description: string
                    amount: number
                    type: 'IN' | 'OUT'
                    category_id?: string | null
                    payment_method?: 'pix' | 'credit' | 'debit' | 'cash' | 'transfer' | 'boleto' | 'other'
                    date?: string
                    status?: 'paid' | 'pending' | 'cancelled'
                    is_recurring?: boolean
                    recurrence_id?: string | null
                    metadata?: Json
                    attachment_url?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    tenant_id?: string
                    description?: string
                    amount?: number
                    type?: 'IN' | 'OUT'
                    category_id?: string | null
                    payment_method?: 'pix' | 'credit' | 'debit' | 'cash' | 'transfer' | 'boleto' | 'other'
                    date?: string
                    status?: 'paid' | 'pending' | 'cancelled'
                    is_recurring?: boolean
                    recurrence_id?: string | null
                    metadata?: Json
                    attachment_url?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            transaction_categories: {
                Row: {
                    id: string
                    tenant_id: string
                    name: string
                    type: 'IN' | 'OUT'
                    icon: string | null
                    color: string | null
                    is_system_default: boolean
                    active: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    tenant_id: string
                    name: string
                    type: 'IN' | 'OUT'
                    icon?: string | null
                    color?: string | null
                    is_system_default?: boolean
                    active?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    tenant_id?: string
                    name?: string
                    type?: 'IN' | 'OUT'
                    icon?: string | null
                    color?: string | null
                    is_system_default?: boolean
                    active?: boolean
                    created_at?: string
                    updated_at?: string
                }
            }
            financial_preferences: {
                Row: {
                    id: string
                    tenant_id: string
                    monthly_revenue_goal: number | null
                    min_daily_balance: number | null
                    alert_email: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    tenant_id: string
                    monthly_revenue_goal?: number | null
                    min_daily_balance?: number | null
                    alert_email?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    tenant_id?: string
                    monthly_revenue_goal?: number | null
                    min_daily_balance?: number | null
                    alert_email?: boolean
                    created_at?: string
                    updated_at?: string
                }
            }
            financial_recurrence_templates: {
                Row: {
                    id: string
                    tenant_id: string
                    description: string
                    amount: number
                    type: 'IN' | 'OUT'
                    category_id: string | null
                    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly'
                    interval: number
                    next_due_date: string
                    active: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    tenant_id: string
                    description: string
                    amount: number
                    type: 'IN' | 'OUT'
                    category_id?: string | null
                    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly'
                    interval?: number
                    next_due_date: string
                    active?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    tenant_id?: string
                    description?: string
                    amount?: number
                    type?: 'IN' | 'OUT'
                    category_id?: string | null
                    frequency?: 'daily' | 'weekly' | 'monthly' | 'yearly'
                    interval?: number
                    next_due_date?: string
                    active?: boolean
                    created_at?: string
                    updated_at?: string
                }
            }
            materials: {
                Row: {
                    id: string
                    tenant_id: string
                    name: string
                    unit: string
                    cost_per_unit: number
                    stock_quantity: number
                    min_stock_quantity: number
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    tenant_id: string
                    name: string
                    unit: string
                    cost_per_unit: number
                    stock_quantity?: number
                    min_stock_quantity?: number
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    tenant_id?: string
                    name?: string
                    unit?: string
                    cost_per_unit?: number
                    stock_quantity?: number
                    min_stock_quantity?: number
                    created_at?: string
                    updated_at?: string
                }
            }
            products: {
                Row: {
                    id: string
                    tenant_id: string
                    name: string
                    description: string | null
                    price: number | null
                    profit_margin: number
                    labor_time: number
                    image_url: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    tenant_id: string
                    name: string
                    description?: string | null
                    price?: number | null
                    profit_margin?: number
                    labor_time?: number
                    image_url?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    tenant_id?: string
                    name?: string
                    description?: string | null
                    price?: number | null
                    profit_margin?: number
                    labor_time?: number
                    image_url?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            product_materials: {
                Row: {
                    product_id: string
                    material_id: string
                    quantity: number
                }
                Insert: {
                    product_id: string
                    material_id: string
                    quantity: number
                }
                Update: {
                    product_id?: string
                    material_id?: string
                    quantity?: number
                }
            }
            tenants: {
                Row: {
                    id: string
                    name: string | null
                    slug: string | null
                    owner_id: string
                    plan: 'free_creative' | 'free_reseller' | 'pro' | 'premium'
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    name?: string | null
                    slug?: string | null
                    owner_id: string
                    plan?: 'free_creative' | 'free_reseller' | 'pro' | 'premium'
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    name?: string | null
                    slug?: string | null
                    owner_id?: string
                    plan?: 'free_creative' | 'free_reseller' | 'pro' | 'premium'
                    created_at?: string
                    updated_at?: string
                }
            }
            profiles: {
                Row: {
                    id: string
                    full_name: string | null
                    avatar_url: string | null
                    updated_at: string | null
                }
                Insert: {
                    id: string
                    full_name?: string | null
                    avatar_url?: string | null
                    updated_at?: string | null
                }
                Update: {
                    id?: string
                    full_name?: string | null
                    avatar_url?: string | null
                    updated_at?: string | null
                }
            }
            site_settings: {
                Row: {
                    id: string
                    tenant_id: string
                    hourly_rate: number
                    monthly_fixed_costs: Json
                    working_hours_per_month: number
                    tax_rate: number
                    card_fee_rate: number
                    margin_threshold_optimal: number
                    margin_threshold_warning: number
                    target_monthly_profit: number
                    financial_display_mode: 'simple' | 'advanced'
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    tenant_id: string
                    hourly_rate?: number
                    monthly_fixed_costs?: Json
                    working_hours_per_month?: number
                    tax_rate?: number
                    card_fee_rate?: number
                    margin_threshold_optimal?: number
                    margin_threshold_warning?: number
                    target_monthly_profit?: number
                    financial_display_mode?: 'simple' | 'advanced'
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    tenant_id?: string
                    hourly_rate?: number
                    monthly_fixed_costs?: Json
                    working_hours_per_month?: number
                    tax_rate?: number
                    card_fee_rate?: number
                    margin_threshold_optimal?: number
                    margin_threshold_warning?: number
                    target_monthly_profit?: number
                    financial_display_mode?: 'simple' | 'advanced'
                    created_at?: string
                    updated_at?: string
                }
            }
            supplier_contacts: {
                Row: {
                    id: string
                    supplier_id: string
                    type: 'phone' | 'email' | 'website' | 'instagram' | 'whatsapp' | 'other'
                    value: string
                    label: string | null
                    is_primary: boolean
                    created_at: string
                }
                Insert: {
                    id?: string
                    supplier_id: string
                    type: 'phone' | 'email' | 'website' | 'instagram' | 'whatsapp' | 'other'
                    value: string
                    label?: string | null
                    is_primary?: boolean
                    created_at?: string
                }
                Update: {
                    id?: string
                    supplier_id?: string
                    type?: 'phone' | 'email' | 'website' | 'instagram' | 'whatsapp' | 'other'
                    value?: string
                    label?: string | null
                    is_primary?: boolean
                    created_at?: string
                }
            }
            suppliers: {
                Row: {
                    id: string
                    tenant_id: string
                    name: string
                    category: string | null
                    notes: string | null
                    rating: number | null
                    active: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    tenant_id: string
                    name: string
                    category?: string | null
                    notes?: string | null
                    rating?: number | null
                    active?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    tenant_id?: string
                    name?: string
                    category?: string | null
                    notes?: string | null
                    rating?: number | null
                    active?: boolean
                    created_at?: string
                    updated_at?: string
                }
            }
            stock_entries: {
                Row: {
                    id: string
                    tenant_id: string
                    material_id: string
                    quantity: number
                    cost_per_unit: number
                    supplier_id: string | null
                    date: string
                    notes: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    tenant_id: string
                    material_id: string
                    quantity: number
                    cost_per_unit: number
                    supplier_id?: string | null
                    date?: string
                    notes?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    tenant_id?: string
                    material_id?: string
                    quantity?: number
                    cost_per_unit?: number
                    supplier_id?: string | null
                    date?: string
                    notes?: string | null
                    created_at?: string
                }
            }
        }
        Views: {
            [_: string]: {
                Row: {
                    [key: string]: Json | undefined
                }
            }
        }
        Functions: {
            [_: string]: {
                Args: {
                    [key: string]: Json | undefined
                }
                Returns: Json
            }
        }
        Enums: {
            transaction_type: 'IN' | 'OUT'
            transaction_status: 'paid' | 'pending' | 'cancelled'
            payment_method: 'pix' | 'credit' | 'debit' | 'cash' | 'transfer' | 'boleto' | 'other'
            recurrence_frequency: 'daily' | 'weekly' | 'monthly' | 'yearly'
        }
    }
}
