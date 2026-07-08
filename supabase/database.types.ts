/**
 * Supabase Database TypeScript Definitions
 * 
 * Auto-generated blueprint representing the complete multi-tenant PostgreSQL schema
 * of Barber Shop AI. Compatible with Row-Level Security (RLS) constraints.
 */

export interface Database {
  public: {
    Tables: {
      tenants: {
        Row: {
          id: string;
          name: string;
          logo_url: string | null;
          subdomain: string | null;
          plan_type: 'freemium' | 'pro' | 'enterprise';
          settings: Record<string, any> | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['tenants']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
        };
        Update: Partial<Database['public']['Tables']['tenants']['Row']>;
      };
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          role: 'admin' | 'tenant_admin' | 'barber' | 'receptionist' | 'customer';
          avatar_url: string | null;
          tenant_id: string | null;
          metadata: Record<string, any> | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['users']['Row']>;
      };
      branches: {
        Row: {
          id: string;
          tenant_id: string;
          name: string;
          address: string;
          phone: string | null;
          hours: Record<string, any> | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['branches']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
        };
        Update: Partial<Database['public']['Tables']['branches']['Row']>;
      };
      services: {
        Row: {
          id: string;
          tenant_id: string;
          category_id: string | null;
          name: string;
          description: string | null;
          price: number;
          duration_minutes: number;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['services']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
        };
        Update: Partial<Database['public']['Tables']['services']['Row']>;
      };
      service_categories: {
        Row: {
          id: string;
          tenant_id: string;
          name: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['service_categories']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
        };
        Update: Partial<Database['public']['Tables']['service_categories']['Row']>;
      };
      barbers: {
        Row: {
          id: string;
          user_id: string;
          tenant_id: string;
          branch_id: string;
          specialty: string | null;
          commission_percentage: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['barbers']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
        };
        Update: Partial<Database['public']['Tables']['barbers']['Row']>;
      };
      schedules: {
        Row: {
          id: string;
          barber_id: string;
          day_of_week: number; // 0 (Domingo) a 6 (Sábado)
          start_time: string; // HH:MM
          end_time: string; // HH:MM
          is_working_day: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['schedules']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
        };
        Update: Partial<Database['public']['Tables']['schedules']['Row']>;
      };
      appointments: {
        Row: {
          id: string;
          tenant_id: string;
          branch_id: string;
          customer_id: string;
          barber_id: string;
          service_id: string;
          appointment_time: string;
          status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
          notes: string | null;
          total_price: number;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['appointments']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
        };
        Update: Partial<Database['public']['Tables']['appointments']['Row']>;
      };
      payments: {
        Row: {
          id: string;
          tenant_id: string;
          appointment_id: string | null;
          amount: number;
          payment_method: 'card' | 'cash' | 'transfer' | 'stripe';
          status: 'pending' | 'completed' | 'refunded' | 'failed';
          stripe_charge_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['payments']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
        };
        Update: Partial<Database['public']['Tables']['payments']['Row']>;
      };
      products: {
        Row: {
          id: string;
          tenant_id: string;
          name: string;
          description: string | null;
          price: number;
          cost: number;
          sku: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['products']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
        };
        Update: Partial<Database['public']['Tables']['products']['Row']>;
      };
      inventory: {
        Row: {
          id: string;
          tenant_id: string;
          branch_id: string;
          product_id: string;
          quantity: number;
          min_stock_alert: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['inventory']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
        };
        Update: Partial<Database['public']['Tables']['inventory']['Row']>;
      };
      ai_chats: {
        Row: {
          id: string;
          tenant_id: string;
          user_id: string | null;
          session_id: string;
          messages: any[]; // JSON array of chat hist
          analysis_data: Record<string, any> | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['ai_chats']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
        };
        Update: Partial<Database['public']['Tables']['ai_chats']['Row']>;
      };
      notifications: {
        Row: {
          id: string;
          tenant_id: string;
          user_id: string;
          title: string;
          body: string;
          is_read: boolean;
          type: 'appointment' | 'system' | 'marketing' | 'inventory';
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['notifications']['Row'], 'id' | 'created_at'> & {
          id?: string;
        };
        Update: Partial<Database['public']['Tables']['notifications']['Row']>;
      };
      audit_logs: {
        Row: {
          id: string;
          tenant_id: string | null;
          user_id: string | null;
          action: string;
          entity_name: string;
          entity_id: string | null;
          old_data: Record<string, any> | null;
          new_data: Record<string, any> | null;
          ip_address: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['audit_logs']['Row'], 'id' | 'created_at'> & {
          id?: string;
        };
        Update: Partial<Database['public']['Tables']['audit_logs']['Row']>;
      };
    };
    Views: {
      dashboard_statistics: {
        Row: {
          tenant_id: string;
          total_revenue: number;
          appointments_count: number;
          completed_appointments: number;
          cancelled_appointments: number;
          active_customers: number;
        };
      };
    };
    Functions: {
      get_available_slots: {
        Args: {
          p_barber_id: string;
          p_date: string;
        };
        Returns: { slot_time: string }[];
      };
    };
  };
}
