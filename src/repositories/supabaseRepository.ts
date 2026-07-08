/**
 * Supabase Repositories Implementation Blueprint
 * 
 * Provides production-ready queries calling Supabase client endpoints.
 */

import { supabase } from '../../supabase/client';
import { 
  ITenantRepository, 
  IUserRepository, 
  IAppointmentRepository, 
  IInventoryRepository, 
  IServiceRepository 
} from '../interfaces/repositories';

export class SupabaseTenantRepository implements ITenantRepository {
  async findById(id: string): Promise<any | null> {
    const { data, error } = await supabase.from('tenants').select('*').eq('id', id).single();
    if (error) return null;
    return data;
  }

  async findBySubdomain(subdomain: string): Promise<any | null> {
    const { data, error } = await supabase.from('tenants').select('*').eq('subdomain', subdomain).maybeSingle();
    if (error) return null;
    return data;
  }

  async findAll(filters?: Record<string, any>): Promise<any[]> {
    let query = supabase.from('tenants').select('*');
    if (filters) {
      Object.entries(filters).forEach(([key, val]) => {
        query = query.eq(key, val);
      });
    }
    const { data, error } = await query.execute();
    return data || [];
  }

  async create(item: any): Promise<any> {
    const { data, error } = await supabase.from('tenants').insert(item).single();
    if (error) throw new Error(error.message);
    return data;
  }

  async update(id: string, item: any): Promise<any> {
    const { data, error } = await supabase.from('tenants').update(item).eq('id', id).single();
    if (error) throw new Error(error.message);
    return data;
  }

  async delete(id: string): Promise<boolean> {
    const { error } = await supabase.from('tenants').delete().eq('id', id).execute();
    return !error;
  }

  async updatePlan(id: string, plan: 'freemium' | 'pro' | 'enterprise'): Promise<any> {
    const { data, error } = await supabase.from('tenants').update({ plan_type: plan }).eq('id', id).single();
    if (error) throw new Error(error.message);
    return data;
  }
}

export class SupabaseUserRepository implements IUserRepository {
  async findById(id: string): Promise<any | null> {
    const { data, error } = await supabase.from('users').select('*').eq('id', id).single();
    if (error) return null;
    return data;
  }

  async findByEmail(email: string): Promise<any | null> {
    const { data, error } = await supabase.from('users').select('*').eq('email', email).maybeSingle();
    if (error) return null;
    return data;
  }

  async findAll(filters?: Record<string, any>): Promise<any[]> {
    let query = supabase.from('users').select('*');
    if (filters) {
      Object.entries(filters).forEach(([key, val]) => {
        query = query.eq(key, val);
      });
    }
    const { data, error } = await query.execute();
    return data || [];
  }

  async create(item: any): Promise<any> {
    const { data, error } = await supabase.from('users').insert(item).single();
    if (error) throw new Error(error.message);
    return data;
  }

  async update(id: string, item: any): Promise<any> {
    const { data, error } = await supabase.from('users').update(item).eq('id', id).single();
    if (error) throw new Error(error.message);
    return data;
  }

  async delete(id: string): Promise<boolean> {
    const { error } = await supabase.from('users').delete().eq('id', id).execute();
    return !error;
  }

  async getUsersByTenant(tenantId: string, role?: string): Promise<any[]> {
    let query = supabase.from('users').select('*').eq('tenant_id', tenantId);
    if (role) {
      query = query.eq('role', role);
    }
    const { data, error } = await query.execute();
    return data || [];
  }
}

export class SupabaseAppointmentRepository implements IAppointmentRepository {
  async findById(id: string): Promise<any | null> {
    const { data, error } = await supabase.from('appointments').select('*').eq('id', id).single();
    if (error) return null;
    return data;
  }

  async findAll(filters?: Record<string, any>): Promise<any[]> {
    let query = supabase.from('appointments').select('*');
    if (filters) {
      Object.entries(filters).forEach(([key, val]) => {
        query = query.eq(key, val);
      });
    }
    const { data, error } = await query.execute();
    return data || [];
  }

  async create(item: any): Promise<any> {
    const { data, error } = await supabase.from('appointments').insert(item).single();
    if (error) throw new Error(error.message);
    return data;
  }

  async update(id: string, item: any): Promise<any> {
    const { data, error } = await supabase.from('appointments').update(item).eq('id', id).single();
    if (error) throw new Error(error.message);
    return data;
  }

  async delete(id: string): Promise<boolean> {
    const { error } = await supabase.from('appointments').delete().eq('id', id).execute();
    return !error;
  }

  async getAppointmentsByDateRange(tenantId: string, start: string, end: string): Promise<any[]> {
    const { data, error } = await supabase.from('appointments')
      .select('*')
      .eq('tenant_id', tenantId)
      .gt('appointment_time', start)
      .lt('appointment_time', end)
      .execute();
    return data || [];
  }

  async getCustomerAppointments(customerId: string): Promise<any[]> {
    const { data, error } = await supabase.from('appointments').select('*').eq('customer_id', customerId).execute();
    return data || [];
  }

  async updateStatus(appointmentId: string, status: string): Promise<any> {
    const { data, error } = await supabase.from('appointments').update({ status }).eq('id', appointmentId).single();
    if (error) throw new Error(error.message);
    return data;
  }
}
