export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      Tenant: {
        Row: {
          id: string
          name: string
          slug: string
          plan: string
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          plan?: string
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          plan?: string
          createdAt?: string
          updatedAt?: string
        }
      }
      User: {
        Row: {
          id: string
          tenantId: string
          name: string | null
          email: string | null
          emailVerified: string | null
          image: string | null
          passwordHash: string | null
          role: string
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id: string
          tenantId: string
          name?: string | null
          email?: string | null
          emailVerified?: string | null
          image?: string | null
          passwordHash?: string | null
          role?: string
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          id?: string
          tenantId?: string
          name?: string | null
          email?: string | null
          emailVerified?: string | null
          image?: string | null
          passwordHash?: string | null
          role?: string
          createdAt?: string
          updatedAt?: string
        }
      }
      Customer: {
        Row: {
          id: string
          tenantId: string
          name: string
          phone: string | null
          email: string | null
          address: string | null
          notes: string | null
          birthday: string | null
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id?: string
          tenantId: string
          name: string
          phone?: string | null
          email?: string | null
          address?: string | null
          notes?: string | null
          birthday?: string | null
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          id?: string
          tenantId?: string
          name?: string
          phone?: string | null
          email?: string | null
          address?: string | null
          notes?: string | null
          birthday?: string | null
          createdAt?: string
          updatedAt?: string
        }
      }
      Material: {
        Row: {
          id: string
          tenantId: string
          name: string
          unit: string
          quantity: number
          minQuantity: number | null
          supplierId: string | null
          colors: string[] | null
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id?: string
          tenantId: string
          name: string
          unit: string
          quantity?: number
          minQuantity?: number | null
          supplierId?: string | null
          colors?: string[] | null
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          id?: string
          tenantId?: string
          name?: string
          unit?: string
          quantity?: number
          minQuantity?: number | null
          supplierId?: string | null
          colors?: string[] | null
          createdAt?: string
          updatedAt?: string
        }
      }
      stock_entries: {
        Row: {
          id: string
          tenant_id: string
          supplier_name: string
          freight_cost: number
          total_cost: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          supplier_name: string
          freight_cost?: number
          total_cost?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          supplier_name?: string
          freight_cost?: number
          total_cost?: number
          created_at?: string
          updated_at?: string
        }
      }
      stock_entry_items: {
        Row: {
          id: string
          tenant_id: string
          stock_entry_id: string
          material_id: string
          color: string | null
          quantity: number
          unit_cost: number
          subtotal: number
        }
        Insert: {
          id?: string
          tenant_id: string
          stock_entry_id: string
          material_id: string
          color?: string | null
          quantity: number
          unit_cost?: number
          subtotal?: number
        }
        Update: {
          id?: string
          tenant_id?: string
          stock_entry_id?: string
          material_id?: string
          color?: string | null
          quantity?: number
          unit_cost?: number
          subtotal?: number
        }
      }
      stock_movements: {
        Row: {
          id: string
          tenant_id: string
          material_id: string
          color: string | null
          type: string
          quantity: number
          note: string | null
          source: string
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          material_id: string
          color?: string | null
          type: string
          quantity: number
          note?: string | null
          source: string
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          material_id?: string
          color?: string | null
          type?: string
          quantity?: number
          note?: string | null
          source?: string
          created_at?: string
        }
      }

      Product: {
        Row: {
          id: string
          tenantId: string
          name: string
          imageUrl: string | null
          laborTime: number
          profitMargin: number
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id?: string
          tenantId: string
          name: string
          imageUrl?: string | null
          laborTime: number
          profitMargin: number
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          id?: string
          tenantId?: string
          name?: string
          imageUrl?: string | null
          laborTime?: number
          profitMargin?: number
          createdAt?: string
          updatedAt?: string
        }
      }
      ProductMaterial: {
        Row: {
          id: string
          productId: string
          materialId: string
          quantity: number
          unit: string
        }
        Insert: {
          id?: string
          productId: string
          materialId: string
          quantity: number
          unit: string
        }
        Update: {
          id?: string
          productId?: string
          materialId?: string
          quantity?: number
          unit?: string
        }
      }
      Order: {
        Row: {
          id: string
          tenantId: string
          customerId: string
          totalValue: number
          status: string
          dueDate: string
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id?: string
          tenantId: string
          customerId: string
          totalValue: number
          status?: string
          dueDate: string
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          id?: string
          tenantId?: string
          customerId?: string
          totalValue?: number
          status?: string
          dueDate?: string
          createdAt?: string
          updatedAt?: string
        }
      }
      OrderItem: {
        Row: {
          id: string
          orderId: string
          productId: string
          quantity: number
          price: number
        }
        Insert: {
          id?: string
          orderId: string
          productId: string
          quantity: number
          price: number
        }
        Update: {
          id?: string
          orderId?: string
          productId?: string
          quantity?: number
          price?: number
        }
      }
      Supplier: {
        Row: {
          id: string
          tenantId: string
          name: string
          contact: string | null
          phone: string | null
          email: string | null
          address: string | null
          notes: string | null
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id?: string
          tenantId: string
          name: string
          contact?: string | null
          phone?: string | null
          email?: string | null
          address?: string | null
          notes?: string | null
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          id?: string
          tenantId?: string
          name?: string
          contact?: string | null
          phone?: string | null
          email?: string | null
          address?: string | null
          notes?: string | null
          createdAt?: string
          updatedAt?: string
        }
      }
      InventoryMovement: {
        Row: {
          id: string
          tenantId: string
          materialId: string
          type: string
          quantity: number
          reason: string
          reference: string | null
          createdAt: string
        }
        Insert: {
          id?: string
          tenantId: string
          materialId: string
          type: string
          quantity: number
          reason: string
          reference?: string | null
          createdAt?: string
        }
        Update: {
          id?: string
          tenantId?: string
          materialId?: string
          type?: string
          quantity?: number
          reason?: string
          reference?: string | null
          createdAt?: string
        }
      }
      StockAlert: {
        Row: {
          id: string
          tenantId: string
          materialId: string
          threshold: number
          enabled: boolean
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id?: string
          tenantId: string
          materialId: string
          threshold: number
          enabled?: boolean
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          id?: string
          tenantId?: string
          materialId?: string
          threshold?: number
          enabled?: boolean
          createdAt?: string
          updatedAt?: string
        }
      }
      AuditLog: {
        Row: {
          id: string
          tenantId: string
          userId: string
          action: string
          entity: string
          entityId: string
          details: Json
          createdAt: string
        }
        Insert: {
          id?: string
          tenantId: string
          userId: string
          action: string
          entity: string
          entityId: string
          details: Json
          createdAt?: string
        }
        Update: {
          id?: string
          tenantId?: string
          userId?: string
          action?: string
          entity?: string
          entityId?: string
          details?: Json
          createdAt?: string
        }
      }
      Notification: {
        Row: {
          id: string
          tenantId: string
          userId: string
          title: string
          message: string
          type: string
          read: boolean
          readAt: string | null
          createdAt: string
        }
        Insert: {
          id?: string
          tenantId: string
          userId: string
          title: string
          message: string
          type: string
          read?: boolean
          readAt?: string | null
          createdAt?: string
        }
        Update: {
          id?: string
          tenantId?: string
          userId?: string
          title?: string
          message?: string
          type?: string
          read?: boolean
          readAt?: string | null
          createdAt?: string
        }
      }
      Settings: {
        Row: {
          id: string
          tenantId: string
          storeName: string
          hourlyRate: number
          primaryColor: string
          phone: string | null
          msgQuotation: string | null
          msgReady: string | null
          updatedAt: string
        }
        Insert: {
          id?: string
          tenantId: string
          storeName?: string
          hourlyRate?: number
          primaryColor?: string
          phone?: string | null
          msgQuotation?: string | null
          msgReady?: string | null
          updatedAt?: string
        }
        Update: {
          id?: string
          tenantId?: string
          storeName?: string
          hourlyRate?: number
          primaryColor?: string
          phone?: string | null
          msgQuotation?: string | null
          msgReady?: string | null
          updatedAt?: string
        }
      }
    }
    Views: {
      [_: string]: {
        Row: {
          [key: string]: Json
        }
      }
    }
    Functions: {
      create_order: {
        Args: {
          p_tenant_id: string
          p_customer_id: string
          p_total_value: number
          p_status: string
          p_due_date: string
          p_items: Json
        }
        Returns: Json
      }
      create_product_with_materials: {
        Args: {
          p_tenant_id: string
          p_name: string
          p_image_url: string
          p_labor_time: number
          p_profit_margin: number
          p_materials: Json
        }
        Returns: Json
      }
      update_product_with_materials: {
        Args: {
          p_product_id: string
          p_tenant_id: string
          p_name: string
          p_image_url: string
          p_labor_time: number
          p_profit_margin: number
          p_materials: Json
        }
        Returns: Json
      }
      delete_product: {
        Args: {
          p_product_id: string
          p_tenant_id: string
        }
        Returns: Json
      }
      deduct_stock_for_order: {
        Args: {
          p_order_id: string
          p_tenant_id: string
        }
        Returns: Json
      }
      delete_order: {
        Args: {
          p_order_id: string
          p_tenant_id: string
        }
        Returns: Json
      }
      record_inventory_movement: {
        Args: {
          p_tenant_id: string
          p_material_id: string
          p_type: string
          p_quantity: number
          p_reason: string
          p_reference: string | null
        }
        Returns: Json
      }
      get_top_products: {
        Args: {
          p_tenant_id: string
          p_limit?: number
        }
        Returns: {
          productName: string
          totalQuantity: number
        }[]
      }
      get_audit_stats: {
        Args: {
          p_tenant_id: string
        }
        Returns: Json
      }
      get_current_tenant_id: {
        Args: Record<string, never>
        Returns: string
      }
      get_material_balance: {
        Args: {
          p_tenant_id: string
          p_material_id: string
        }
        Returns: number
      }
      create_stock_entry_transaction: {
        Args: {
          p_tenant_id: string
          p_supplier_name: string
          p_freight_cost: number
          p_total_cost: number
          p_items: Json
          p_note?: string
        }
        Returns: void
      }
    }
    Enums: {
      [_: string]: never
    }
  }
}
