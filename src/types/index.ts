/**
 * Unified Domain Models & TypeScript Types
 * 
 * Defines strictly typed structures mapping PostgreSQL schema entities, including
 * mandatory multi-tenant audit headers.
 */

export interface IBaseEntity {
  id: string; // UUID
  created_at: string; // ISO Timestamp
  updated_at: string; // ISO Timestamp
  deleted_at?: string | null; // Soft delete field
  created_by?: string | null; // Creator user UUID
  updated_by?: string | null; // Updator user UUID
  tenant_id?: string | null; // Multi-tenant isolation ID
  metadata?: Record<string, any> | null; // Dynamic extra payload field
}

export interface ITenant extends IBaseEntity {
  name: string;
  logo_url?: string | null;
  subdomain?: string | null;
  plan_type: 'freemium' | 'pro' | 'enterprise';
  settings?: Record<string, any> | null;
}

export interface IUser extends IBaseEntity {
  email: string;
  full_name: string;
  role: 'admin' | 'tenant_admin' | 'barber' | 'receptionist' | 'customer';
  avatar_url?: string | null;
}

export interface IBranch extends IBaseEntity {
  tenant_id: string;
  name: string;
  address: string;
  phone?: string | null;
  hours?: Record<string, any> | null;
}

export interface IBarber extends IBaseEntity {
  user_id: string;
  branch_id?: string | null;
  specialty?: string | null;
  commission_percentage: number;
  is_active: boolean;
}

export interface ISchedule {
  id: string; // UUID
  barber_id: string;
  day_of_week: number; // 0-6
  start_time: string; // HH:MM
  end_time: string; // HH:MM
  is_working_day: boolean;
  created_at: string;
  updated_at: string;
}

export interface IServiceCategory extends IBaseEntity {
  name: string;
}

export interface IService extends IBaseEntity {
  category_id?: string | null;
  name: string;
  description?: string | null;
  price: number;
  duration_minutes: number;
}

export interface IAppointment extends IBaseEntity {
  branch_id: string;
  customer_id: string;
  barber_id: string;
  service_id: string;
  appointment_time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string | null;
  total_price: number;
}

export interface IPayment extends IBaseEntity {
  appointment_id?: string | null;
  amount: number;
  payment_method: 'card' | 'cash' | 'transfer' | 'stripe';
  status: 'pending' | 'completed' | 'refunded' | 'failed';
  stripe_charge_id?: string | null;
}

export interface IInvoice extends IBaseEntity {
  payment_id: string;
  invoice_number: string;
  pdf_url?: string | null;
  issued_at: string;
}

export interface IProduct extends IBaseEntity {
  provider_id?: string | null;
  name: string;
  description?: string | null;
  price: number;
  cost: number;
  sku?: string | null;
}

export interface IInventory extends IBaseEntity {
  branch_id: string;
  product_id: string;
  quantity: number;
  min_stock_alert: number;
}

export interface IAIChat extends IBaseEntity {
  user_id?: string | null;
  session_id: string;
  messages: any[];
  analysis_data?: Record<string, any> | null;
}

export interface INotification {
  id: string;
  tenant_id: string;
  user_id: string;
  title: string;
  body: string;
  is_read: boolean;
  type: 'appointment' | 'system' | 'marketing' | 'inventory';
  created_at: string;
}

export interface IAuditLog {
  id: string;
  tenant_id?: string | null;
  user_id?: string | null;
  action: string;
  entity_name: string;
  entity_id?: string | null;
  old_data?: Record<string, any> | null;
  new_data?: Record<string, any> | null;
  ip_address?: string | null;
  created_at: string;
}
