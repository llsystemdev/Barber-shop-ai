/**
 * Service Layer Interfaces - Clean Architecture Blueprint
 * 
 * Defines strictly typed, decoupled contracts for every business vertical.
 * This file is compliant with Enterprise SaaS Multi-Tenant architecture and SOLID principles.
 */

import { APPOINTMENT_STATUS } from '../constants';

export interface IAuthService {
  loginWithGoogle(role?: string): Promise<{ user: any; error: any }>;
  registerWithEmail(email: string, pass: string, name: string): Promise<any>;
  loginWithEmail(email: string, pass: string): Promise<any>;
  loginWithMagicLink(email: string): Promise<any>;
  loginWithApple(): Promise<any>;
  loginWithFacebook(): Promise<any>;
  loginWithGithub(): Promise<any>;
  loginWithMicrosoft(): Promise<any>;
  logout(): Promise<void>;
  getCurrentUser(): Promise<any>;
  getSession(): Promise<any>;
}

export interface IGuestService {
  createGuestSession(): Promise<{ guestId: string; sessionId: string }>;
  getGuestSimulationsCount(guestId: string): Promise<number>;
  incrementGuestSimulationCount(guestId: string): Promise<number>;
  saveGuestSimulation(guestId: string, photoUrl: string, styleId: string, resultUrl: string): Promise<any>;
  migrateGuestDataToUser(guestId: string, userId: string): Promise<void>;
}

export interface IAIService {
  analyzeHairStyle(imageFile: File | string): Promise<any>;
  generateAiResponse(prompt: string, history: any[]): Promise<string>;
  generateVisualSimulation(imageFile: File | string, hairstyleStyleId: string): Promise<any>;
}

export interface IMirrorService {
  loadVirtualMirror(tenantId: string): Promise<any>;
  applyVirtualStyle(photoUrl: string, styleId: string): Promise<any>;
  downloadPreview(simulationId: string): Promise<string>;
}

export interface IHairStyleService {
  getStyles(category?: string): Promise<any[]>;
  getStyleById(id: string): Promise<any>;
  createStyle(styleData: any): Promise<any>;
}

export interface IAppointmentService {
  createAppointment(appointmentData: any): Promise<any>;
  getAppointmentById(id: string): Promise<any>;
  getAppointmentsByTenant(tenantId: string): Promise<any[]>;
  getAvailableSlots(barberId: string, date: string): Promise<string[]>;
  cancelAppointment(id: string, reason: string, userId: string): Promise<any>;
  updateAppointmentStatus(id: string, status: keyof typeof APPOINTMENT_STATUS): Promise<any>;
}

export interface IBarberService {
  createBarber(barberData: any): Promise<any>;
  getBarbersByTenant(tenantId: string): Promise<any[]>;
  updateSchedule(barberId: string, schedules: any[]): Promise<any>;
  getBarberPerformance(barberId: string): Promise<any>;
}

export interface ICustomerService {
  createCustomerProfile(userData: any): Promise<any>;
  getCustomerHistory(customerId: string): Promise<any[]>;
  updateCustomerProfile(customerId: string, profileData: any): Promise<any>;
}

export interface INotificationService {
  sendPushNotification(userId: string, title: string, body: string): Promise<void>;
  registerDeviceToken(userId: string, token: string): Promise<void>;
  sendEmail(to: string, subject: string, template: string, context: any): Promise<void>;
}

export interface IStorageService {
  uploadFile(bucket: string, path: string, file: File | Blob): Promise<string>;
  getPublicUrl(bucket: string, path: string): string;
  deleteFile(bucket: string, path: string): Promise<void>;
}

export interface IAnalyticsService {
  getRevenueMetrics(tenantId: string, start: string, end: string): Promise<any>;
  getOccupancyRates(tenantId: string): Promise<any>;
  getGuestSimulationMetrics(): Promise<any>;
  logEvent(tenantId: string | null, userId: string | null, eventName: string, eventData: any): Promise<void>;
}

export interface IReviewService {
  submitReview(reviewData: any): Promise<any>;
  getBarberReviews(barberId: string): Promise<any[]>;
  getTenantReviews(tenantId: string): Promise<any[]>;
}

export interface IInventoryService {
  adjustStock(branchId: string, productId: string, delta: number): Promise<any>;
  getLowStockAlerts(branchId: string): Promise<any[]>;
  registerPurchase(purchaseData: any): Promise<any>;
  getInventoryValue(branchId: string): Promise<number>;
}

export interface IDashboardService {
  getTenantStats(tenantId: string): Promise<any>;
  getReceptionistDashboard(branchId: string): Promise<any>;
}

export interface ISubscriptionService {
  upgradePlan(tenantId: string, plan: 'free' | 'starter' | 'pro' | 'enterprise'): Promise<any>;
  getBillingHistory(tenantId: string): Promise<any[]>;
  getTenantSubscription(tenantId: string): Promise<any>;
}

export interface IBillingService {
  generateInvoice(tenantId: string, amount: number, details: any): Promise<any>;
  getInvoices(tenantId: string): Promise<any[]>;
  getUsageMetrics(tenantId: string): Promise<any>;
}

export interface IPaymentService {
  createPaymentIntent(amount: number, currency: string, appointmentId?: string): Promise<any>;
  processPayment(paymentId: string, status: string): Promise<any>;
  getPaymentHistory(tenantId: string): Promise<any[]>;
}

export interface IPlanService {
  getAvailablePlans(): Promise<any[]>;
  getPlanLimits(planId: string): Promise<any>;
}

export interface IHistoryService {
  getUserHistory(userId: string): Promise<any[]>;
  addHistoryEntry(userId: string, entryData: any): Promise<any>;
}

export interface IFavoritesService {
  getUserFavorites(userId: string): Promise<any[]>;
  toggleFavorite(userId: string, styleId: string): Promise<boolean>;
}

export interface IGalleryService {
  getTenantGallery(tenantId: string): Promise<any[]>;
  addGalleryPhoto(tenantId: string, photoData: any): Promise<any>;
  deleteGalleryPhoto(photoId: string): Promise<void>;
}
