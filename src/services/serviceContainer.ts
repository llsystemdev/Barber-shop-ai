/**
 * Dependency Injection Service Container - Clean Architecture
 * 
 * Central registry to bind and resolve business services.
 * Allows transparent swapping of mock state services and Supabase services.
 */

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

import {
  SupabaseAuthService,
  SupabaseGuestService,
  SupabaseAIService,
  SupabaseMirrorService,
  SupabaseHairStyleService,
  SupabaseAppointmentService,
  SupabaseBarberService,
  SupabaseCustomerService,
  SupabaseNotificationService,
  SupabaseStorageService,
  SupabaseAnalyticsService,
  SupabaseReviewService,
  SupabaseInventoryService,
  SupabaseDashboardService,
  SupabaseSubscriptionService,
  SupabaseBillingService,
  SupabasePaymentService,
  SupabasePlanService,
  SupabaseHistoryService,
  SupabaseFavoritesService,
  SupabaseGalleryService
} from './supabaseServices';

export class ServiceContainer {
  private static instance: ServiceContainer;
  private services: Map<string, any> = new Map();

  private constructor() {
    this.registerDefaultServices();
  }

  public static getInstance(): ServiceContainer {
    if (!ServiceContainer.instance) {
      ServiceContainer.instance = new ServiceContainer();
    }
    return ServiceContainer.instance;
  }

  /**
   * Bind services to their interfaces.
   * Toggle bindings here to switch between mock services and live Supabase connections.
   */
  private registerDefaultServices(): void {
    this.register<IAuthService>('IAuthService', new SupabaseAuthService());
    this.register<IGuestService>('IGuestService', new SupabaseGuestService());
    this.register<IAIService>('IAIService', new SupabaseAIService());
    this.register<IMirrorService>('IMirrorService', new SupabaseMirrorService());
    this.register<IHairStyleService>('IHairStyleService', new SupabaseHairStyleService());
    this.register<IAppointmentService>('IAppointmentService', new SupabaseAppointmentService());
    this.register<IBarberService>('IBarberService', new SupabaseBarberService());
    this.register<ICustomerService>('ICustomerService', new SupabaseCustomerService());
    this.register<INotificationService>('INotificationService', new SupabaseNotificationService());
    this.register<IStorageService>('IStorageService', new SupabaseStorageService());
    this.register<IAnalyticsService>('IAnalyticsService', new SupabaseAnalyticsService());
    this.register<IReviewService>('IReviewService', new SupabaseReviewService());
    this.register<IInventoryService>('IInventoryService', new SupabaseInventoryService());
    this.register<IDashboardService>('IDashboardService', new SupabaseDashboardService());
    this.register<ISubscriptionService>('ISubscriptionService', new SupabaseSubscriptionService());
    this.register<IBillingService>('IBillingService', new SupabaseBillingService());
    this.register<IPaymentService>('IPaymentService', new SupabasePaymentService());
    this.register<IPlanService>('IPlanService', new SupabasePlanService());
    this.register<IHistoryService>('IHistoryService', new SupabaseHistoryService());
    this.register<IFavoritesService>('IFavoritesService', new SupabaseFavoritesService());
    this.register<IGalleryService>('IGalleryService', new SupabaseGalleryService());
  }

  public register<T>(key: string, service: T): void {
    this.services.set(key, service);
  }

  public resolve<T>(key: string): T {
    const service = this.services.get(key);
    if (!service) {
      throw new Error(`Service not registered for key: ${key}`);
    }
    return service as T;
  }
}

// Global exported accessor for clean imports
export const container = ServiceContainer.getInstance();
