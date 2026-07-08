/**
 * Supabase Services Implementations
 * 
 * Provides decoupled, framework-ready business logic modules calling Supabase client and endpoints.
 * This class structure represents the clean architecture service implementations.
 */

import { supabase } from '../../supabase/client';
import { 
  IAuthService, 
  IGuestService,
  IAIService,
  IMirrorService,
  IHairStyleService,
  IAppointmentService, 
  IBarberService, 
  ICustomerService, 
  INotificationService,
  IStorageService, 
  IAnalyticsService, 
  IReviewService, 
  IInventoryService, 
  IDashboardService, 
  ISubscriptionService,
  IBillingService,
  IPaymentService,
  IPlanService,
  IHistoryService,
  IFavoritesService,
  IGalleryService
} from '../interfaces/services';
import { APPOINTMENT_STATUS } from '../constants';

export class SupabaseAuthService implements IAuthService {
  async loginWithGoogle(role = 'customer'): Promise<{ user: any; error: any }> {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { role }
      }
    });
    return { user: data, error };
  }

  async registerWithEmail(email: string, pass: string, name: string): Promise<any> {
    const { data, error } = await supabase.auth.signUp({
      email,
      password: pass,
      options: { data: { full_name: name } }
    });
    if (error) throw new Error(error.message);
    return data;
  }

  async loginWithEmail(email: string, pass: string): Promise<any> {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (error) throw new Error(error.message);
    return data;
  }

  async loginWithMagicLink(email: string): Promise<any> {
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` }
    });
    if (error) throw new Error(error.message);
    return data;
  }

  async loginWithApple(): Promise<any> {
    const { data, error } = await supabase.auth.signInWithOAuth({ provider: 'apple' });
    if (error) throw new Error(error.message);
    return data;
  }

  async loginWithFacebook(): Promise<any> {
    const { data, error } = await supabase.auth.signInWithOAuth({ provider: 'facebook' });
    if (error) throw new Error(error.message);
    return data;
  }

  async loginWithGithub(): Promise<any> {
    const { data, error } = await supabase.auth.signInWithOAuth({ provider: 'github' });
    if (error) throw new Error(error.message);
    return data;
  }

  async loginWithMicrosoft(): Promise<any> {
    const { data, error } = await supabase.auth.signInWithOAuth({ provider: 'azure' });
    if (error) throw new Error(error.message);
    return data;
  }

  async logout(): Promise<void> {
    await supabase.auth.signOut();
  }

  async getCurrentUser(): Promise<any> {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  }

  async getSession(): Promise<any> {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  }
}

export class SupabaseGuestService implements IGuestService {
  async createGuestSession(): Promise<{ guestId: string; sessionId: string }> {
    const guestId = `guest_${crypto.randomUUID()}`;
    const sessionId = `gsess_${crypto.randomUUID()}`;
    // Insert into mock/actual guest_sessions
    await supabase.from('guest_sessions').insert({
      id: sessionId,
      guest_id: guestId,
      created_at: new Date().toISOString()
    }).execute();
    return { guestId, sessionId };
  }

  async getGuestSimulationsCount(guestId: string): Promise<number> {
    const { data, error } = await supabase
      .from('guest_simulations')
      .select('id', { count: 'exact' })
      .eq('guest_id', guestId)
      .execute();
    if (error) return 0;
    return data?.length || 0;
  }

  async incrementGuestSimulationCount(guestId: string): Promise<number> {
    const count = await this.getGuestSimulationsCount(guestId);
    return count + 1;
  }

  async saveGuestSimulation(guestId: string, photoUrl: string, styleId: string, resultUrl: string): Promise<any> {
    const { data, error } = await supabase.from('guest_simulations').insert({
      guest_id: guestId,
      photo_url: photoUrl,
      style_id: styleId,
      result_url: resultUrl,
      created_at: new Date().toISOString()
    }).single();
    if (error) throw new Error(error.message);
    return data;
  }

  async migrateGuestDataToUser(guestId: string, userId: string): Promise<void> {
    // Migration routine from guest_simulations to user history/gallery
    const { data: simulations } = await supabase
      .from('guest_simulations')
      .select('*')
      .eq('guest_id', guestId)
      .execute();

    if (simulations && simulations.length > 0) {
      const historyEntries = simulations.map(sim => ({
        user_id: userId,
        photo_url: sim.photo_url,
        style_id: sim.style_id,
        result_url: sim.result_url,
        created_at: sim.created_at,
        metadata: { migrated_from_guest: guestId }
      }));
      await supabase.from('history').insert(historyEntries).execute();
    }
  }
}

export class SupabaseAIService implements IAIService {
  async analyzeHairStyle(imageFile: File | string): Promise<any> {
    const { data, error } = await supabase.functions.invoke('ai', {
      body: { action: 'analyze_face', image: imageFile }
    });
    if (error) throw new Error(error.message);
    return data;
  }

  async generateAiResponse(prompt: string, history: any[]): Promise<string> {
    const { data, error } = await supabase.functions.invoke('ai', {
      body: { action: 'chat_assistant', customPrompt: prompt, conversationHistory: history }
    });
    return data?.reply || 'Lo siento, no pude procesar la consulta de Inteligencia Artificial.';
  }

  async generateVisualSimulation(imageFile: File | string, hairstyleStyleId: string): Promise<any> {
    const { data, error } = await supabase.functions.invoke('ai', {
      body: { action: 'generate_simulation', image: imageFile, styleId: hairstyleStyleId }
    });
    if (error) throw new Error(error.message);
    return data;
  }
}

export class SupabaseMirrorService implements IMirrorService {
  async loadVirtualMirror(tenantId: string): Promise<any> {
    const { data, error } = await supabase.from('settings').select('*').eq('tenant_id', tenantId).eq('key', 'virtual_mirror_config').maybeSingle();
    return data?.value || { active: true, disclaimer: 'Default Virtual Mirror Preview' };
  }

  async applyVirtualStyle(photoUrl: string, styleId: string): Promise<any> {
    // Submits request to AI simulation endpoint
    const { data, error } = await supabase.functions.invoke('ai', {
      body: { action: 'apply_style', photoUrl, styleId }
    });
    if (error) throw new Error(error.message);
    return data;
  }

  async downloadPreview(simulationId: string): Promise<string> {
    const { data, error } = await supabase.from('ai_generations').select('result_url').eq('id', simulationId).single();
    if (error) throw new Error(error.message);
    return data?.result_url || '';
  }
}

export class SupabaseHairStyleService implements IHairStyleService {
  async getStyles(category?: string): Promise<any[]> {
    let query = supabase.from('styles').select('*');
    if (category) {
      query = query.eq('category', category);
    }
    const { data } = await query.execute();
    return data || [];
  }

  async getStyleById(id: string): Promise<any> {
    const { data } = await supabase.from('styles').select('*').eq('id', id).single();
    return data;
  }

  async createStyle(styleData: any): Promise<any> {
    const { data, error } = await supabase.from('styles').insert(styleData).single();
    if (error) throw new Error(error.message);
    return data;
  }
}

export class SupabaseAppointmentService implements IAppointmentService {
  async createAppointment(appointmentData: any): Promise<any> {
    const { data, error } = await supabase.from('appointments').insert(appointmentData).single();
    if (error) throw new Error(error.message);
    return data;
  }

  async getAppointmentById(id: string): Promise<any> {
    const { data, error } = await supabase.from('appointments').select('*, barber:barbers(*), customer:users(*)').eq('id', id).single();
    if (error) return null;
    return data;
  }

  async getAppointmentsByTenant(tenantId: string): Promise<any[]> {
    const { data, error } = await supabase.from('appointments').select('*').eq('tenant_id', tenantId).execute();
    return data || [];
  }

  async getAvailableSlots(barberId: string, date: string): Promise<string[]> {
    const { data, error } = await supabase.functions.invoke('appointments', {
      body: { action: 'get_slots', barberId, date }
    });
    if (error) return [];
    return data?.slots || [];
  }

  async cancelAppointment(id: string, reason: string, userId: string): Promise<any> {
    const { data, error } = await supabase.functions.invoke('appointments', {
      body: { action: 'cancel', appointmentId: id, reason, userId }
    });
    if (error) throw new Error(error.message);
    return data;
  }

  async updateAppointmentStatus(id: string, status: keyof typeof APPOINTMENT_STATUS): Promise<any> {
    const { data, error } = await supabase.from('appointments').update({ status }).eq('id', id).single();
    if (error) throw new Error(error.message);
    return data;
  }
}

export class SupabaseBarberService implements IBarberService {
  async createBarber(barberData: any): Promise<any> {
    const { data, error } = await supabase.from('barbers').insert(barberData).single();
    if (error) throw new Error(error.message);
    return data;
  }

  async getBarbersByTenant(tenantId: string): Promise<any[]> {
    const { data, error } = await supabase.from('barbers').select('*, user:users(*)').eq('tenant_id', tenantId).execute();
    return data || [];
  }

  async updateSchedule(barberId: string, schedules: any[]): Promise<any> {
    const { data, error } = await supabase.from('schedules').insert(schedules).execute();
    if (error) throw new Error(error.message);
    return data;
  }

  async getBarberPerformance(barberId: string): Promise<any> {
    const { data } = await supabase.functions.invoke('analytics', {
      body: { action: 'barber_performance', barberId }
    });
    return data || { rating: 5.0, appointments_completed: 0 };
  }
}

export class SupabaseCustomerService implements ICustomerService {
  async createCustomerProfile(userData: any): Promise<any> {
    const { data, error } = await supabase.from('users').insert({ ...userData, role: 'customer' }).single();
    if (error) throw new Error(error.message);
    return data;
  }

  async getCustomerHistory(customerId: string): Promise<any[]> {
    const { data, error } = await supabase.from('appointments').select('*, service:services(*)').eq('customer_id', customerId).execute();
    return data || [];
  }

  async updateCustomerProfile(customerId: string, profileData: any): Promise<any> {
    const { data, error } = await supabase.from('profiles').update(profileData).eq('user_id', customerId).single();
    if (error) throw new Error(error.message);
    return data;
  }
}

export class SupabaseNotificationService implements INotificationService {
  async sendPushNotification(userId: string, title: string, body: string): Promise<void> {
    await supabase.functions.invoke('notifications', {
      body: { userId, title, body }
    });
  }

  async registerDeviceToken(userId: string, token: string): Promise<void> {
    await supabase.from('users').update({ metadata: { deviceToken: token } }).eq('id', userId).execute();
  }

  async sendEmail(to: string, subject: string, template: string, context: any): Promise<void> {
    await supabase.functions.invoke('emails', {
      body: { to, subject, template, context }
    });
  }
}

export class SupabaseStorageService implements IStorageService {
  async uploadFile(bucket: string, path: string, file: File | Blob): Promise<string> {
    const { data, error } = await supabase.storage.from(bucket).upload(path, file);
    if (error) throw new Error(error.message);
    return this.getPublicUrl(bucket, path);
  }

  getPublicUrl(bucket: string, path: string): string {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  }

  async deleteFile(bucket: string, path: string): Promise<void> {
    const { error } = await supabase.storage.from(bucket).remove([path]);
    if (error) throw new Error(error.message);
  }
}

export class SupabaseAnalyticsService implements IAnalyticsService {
  async getRevenueMetrics(tenantId: string, start: string, end: string): Promise<any> {
    const { data, error } = await supabase.functions.invoke('analytics', {
      body: { tenantId, startDate: start, endDate: end, metricType: 'revenue' }
    });
    return data;
  }

  async getOccupancyRates(tenantId: string): Promise<any> {
    const { data, error } = await supabase.functions.invoke('analytics', {
      body: { tenantId, metricType: 'occupancy' }
    });
    return data;
  }

  async getGuestSimulationMetrics(): Promise<any> {
    const { data } = await supabase.functions.invoke('analytics', {
      body: { metricType: 'guest_simulations' }
    });
    return data || { total_guest_simulations: 0 };
  }

  async logEvent(tenantId: string | null, userId: string | null, eventName: string, eventData: any): Promise<void> {
    await supabase.from('audit_logs').insert({
      tenant_id: tenantId,
      user_id: userId,
      action: eventName,
      details: eventData,
      created_at: new Date().toISOString()
    }).execute();
  }
}

export class SupabaseReviewService implements IReviewService {
  async submitReview(reviewData: any): Promise<any> {
    const { data, error } = await supabase.from('reviews').insert(reviewData).single();
    if (error) throw new Error(error.message);
    return data;
  }

  async getBarberReviews(barberId: string): Promise<any[]> {
    const { data, error } = await supabase.from('reviews').select('*, customer:users(*)').eq('barber_id', barberId).execute();
    return data || [];
  }

  async getTenantReviews(tenantId: string): Promise<any[]> {
    const { data, error } = await supabase.from('reviews').select('*, customer:users(*)').eq('tenant_id', tenantId).execute();
    return data || [];
  }
}

export class SupabaseInventoryService implements IInventoryService {
  async adjustStock(branchId: string, productId: string, delta: number): Promise<any> {
    const { data, error } = await supabase.from('inventory')
      .update({ quantity: delta }) // simplified for enterprise contract representation
      .eq('branch_id', branchId)
      .eq('product_id', productId);
    return data;
  }

  async getLowStockAlerts(branchId: string): Promise<any[]> {
    const { data, error } = await supabase.from('inventory').select('*, product:products(*)').eq('branch_id', branchId).lt('quantity', 5).execute();
    return data || [];
  }

  async registerPurchase(purchaseData: any): Promise<any> {
    const { data, error } = await supabase.from('purchases').insert(purchaseData).single();
    if (error) throw new Error(error.message);
    return data;
  }

  async getInventoryValue(branchId: string): Promise<number> {
    const { data } = await supabase.from('inventory').select('quantity, price').eq('branch_id', branchId).execute();
    return (data || []).reduce((acc: number, item: any) => acc + (item.quantity * item.price), 0);
  }
}

export class SupabaseDashboardService implements IDashboardService {
  async getTenantStats(tenantId: string): Promise<any> {
    const { data, error } = await supabase.from('dashboard_statistics').select('*').eq('tenant_id', tenantId).maybeSingle();
    return data;
  }

  async getReceptionistDashboard(branchId: string): Promise<any> {
    const { data } = await supabase.functions.invoke('reports', {
      body: { action: 'receptionist_dashboard', branchId }
    });
    return data || { active_appointments_today: [] };
  }
}

export class SupabaseSubscriptionService implements ISubscriptionService {
  async upgradePlan(tenantId: string, plan: 'free' | 'starter' | 'pro' | 'enterprise'): Promise<any> {
    const { data, error } = await supabase.from('tenants').update({ plan_type: plan }).eq('id', tenantId).single();
    return data;
  }

  async getBillingHistory(tenantId: string): Promise<any[]> {
    const { data, error } = await supabase.from('payments').select('*').eq('tenant_id', tenantId).execute();
    return data || [];
  }

  async getTenantSubscription(tenantId: string): Promise<any> {
    const { data } = await supabase.from('subscriptions').select('*').eq('tenant_id', tenantId).single();
    return data || { plan_type: 'free', active: true };
  }
}

export class SupabaseBillingService implements IBillingService {
  async generateInvoice(tenantId: string, amount: number, details: any): Promise<any> {
    const { data } = await supabase.functions.invoke('billing', {
      body: { action: 'generate_invoice', tenantId, amount, details }
    });
    return data;
  }

  async getInvoices(tenantId: string): Promise<any[]> {
    const { data } = await supabase.from('invoices').select('*').eq('tenant_id', tenantId).execute();
    return data || [];
  }

  async getUsageMetrics(tenantId: string): Promise<any> {
    const { data } = await supabase.from('usage').select('*').eq('tenant_id', tenantId).execute();
    return data || [];
  }
}

export class SupabasePaymentService implements IPaymentService {
  async createPaymentIntent(amount: number, currency: string, appointmentId?: string): Promise<any> {
    const { data, error } = await supabase.functions.invoke('payments', {
      body: { action: 'create_intent', amount, currency, appointmentId }
    });
    if (error) throw new Error(error.message);
    return data;
  }

  async processPayment(paymentId: string, status: string): Promise<any> {
    const { data, error } = await supabase.from('payments').update({ status }).eq('id', paymentId).single();
    if (error) throw new Error(error.message);
    return data;
  }

  async getPaymentHistory(tenantId: string): Promise<any[]> {
    const { data } = await supabase.from('payments').select('*').eq('tenant_id', tenantId).execute();
    return data || [];
  }
}

export class SupabasePlanService implements IPlanService {
  async getAvailablePlans(): Promise<any[]> {
    const { data } = await supabase.from('plans').select('*').execute();
    return data || [];
  }

  async getPlanLimits(planId: string): Promise<any> {
    const { data } = await supabase.from('plans').select('limits').eq('id', planId).single();
    return data?.limits || { guest_simulations: 3, storage_gb: 1 };
  }
}

export class SupabaseHistoryService implements IHistoryService {
  async getUserHistory(userId: string): Promise<any[]> {
    const { data } = await supabase.from('history').select('*').eq('user_id', userId).execute();
    return data || [];
  }

  async addHistoryEntry(userId: string, entryData: any): Promise<any> {
    const { data, error } = await supabase.from('history').insert({ user_id: userId, ...entryData }).single();
    if (error) throw new Error(error.message);
    return data;
  }
}

export class SupabaseFavoritesService implements IFavoritesService {
  async getUserFavorites(userId: string): Promise<any[]> {
    const { data } = await supabase.from('favorites').select('*, style:styles(*)').eq('user_id', userId).execute();
    return data || [];
  }

  async toggleFavorite(userId: string, styleId: string): Promise<boolean> {
    const { data: existing } = await supabase.from('favorites').select('id').eq('user_id', userId).eq('style_id', styleId).maybeSingle();
    if (existing) {
      await supabase.from('favorites').delete().eq('id', existing.id).execute();
      return false;
    } else {
      await supabase.from('favorites').insert({ user_id: userId, style_id: styleId }).execute();
      return true;
    }
  }
}

export class SupabaseGalleryService implements IGalleryService {
  async getTenantGallery(tenantId: string): Promise<any[]> {
    const { data } = await supabase.from('gallery').select('*').eq('tenant_id', tenantId).execute();
    return data || [];
  }

  async addGalleryPhoto(tenantId: string, photoData: any): Promise<any> {
    const { data, error } = await supabase.from('gallery').insert({ tenant_id: tenantId, ...photoData }).single();
    if (error) throw new Error(error.message);
    return data;
  }

  async deleteGalleryPhoto(photoId: string): Promise<void> {
    const { error } = await supabase.from('gallery').delete().eq('id', photoId).execute();
    if (error) throw new Error(error.message);
  }
}
