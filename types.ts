
export type Sender = 'user' | 'ai' | 'model';

export interface Message {
  id: string;
  sender?: Sender;
  role?: 'user' | 'model';
  text?: string;
  parts?: Array<{ text: string }>;
  timestamp?: Date;
  suggestedStyles?: string[]; // For AI to suggest styles that can be visualized
}

export interface Service {
  name: string;
  price: string;
}

export interface Barber {
  name: string;
  specialty: string;
  imageUrl: string;
}

export interface Invoice {
    id: string;
    date: string;
    amount: string;
    status: 'Pagado' | 'Pendiente';
}

export interface PaymentMethod {
    type: 'Visa' | 'Mastercard' | 'Amex';
    last4: string;
    expiry: string;
}

export interface BarberShop {
  id: string;
  ownerId?: string; // Link to Mock User ID
  name: string;
  aiName: string; // e.g., "Leo, tu estilista AI"
  welcomeMessage: string;
  aiPersona: string; // Detailed persona description for the system prompt
  description: string;
  address: string;
  phone: string;
  hours: { [key: string]: string };
  gallery: string[];
  services: Service[];
  barbers: Barber[];
  plan: 'FREE' | 'LAUNCH_PRO';
  billingHistory: Invoice[];
  paymentMethod: PaymentMethod;
}

export interface Booking {
    id: string;
    shopName: string;
    service: string;
    date: string;
    time: string;
    userId: string;
    createdAt?: string;
}

// User role simulation
export interface User {
  id: string;
  name: string;
  role: 'platformAdmin' | 'shopOwner' | 'customer';
  avatarUrl: string;
  shopId?: string; // Only for shopOwner
  isGuest?: boolean; // Added for guest mode
  email?: string;
}


// Admin Dashboard Types (per-shop)
export interface AdminStats {
  totalAnalyses: number;
  totalBookings: number;
  mostPopularService: string;
  monthlyRevenue: number;
}

export interface DailyActivity {
  day: string;
  Analyses: number;
  Bookings: number;
}

export interface ServiceDistribution {
  name: string;
  count: number;
}

export interface RecentActivity {
  id: string;
  type: 'analysis' | 'booking';
  description: string;
  time: string;
  icon: 'sparkles' | 'calendar';
}

export interface AdminDashboardData {
  stats: AdminStats;
  dailyActivity: DailyActivity[];
  serviceDistribution: ServiceDistribution[];
  recentActivity: RecentActivity[];
}

// Platform Admin Dashboard Types (platform-wide)
export interface PlatformStats {
  monthlyRecurringRevenue: number;
  totalShops: number;
  totalPlatformAnalyses: number;
  totalPlatformBookings: number;
}

export interface PlanDistribution {
  name: 'FREE' | 'LAUNCH_PRO';
  count: number;
  color: string;
}

export interface PlatformDashboardData {
  stats: PlatformStats;
  planDistribution: PlanDistribution[];
  recentlyJoined: BarberShop[];
}

// End of Active Types

export interface UserConsent {
  id: string;
  userId: string;
  email: string;
  consentType: 'AI_FACIAL_ANALYSIS' | 'PHOTO_STORAGE' | 'MARKETING_AGREEMENT' | 'COOKIE_POLICY';
  accepted: boolean;
  timestamp: string;
  documentVersion: string;
  ip: string;
}

export interface SupportTicket {
  id: string;
  shopId?: string;
  customerName: string;
  email: string;
  category: string;
  priority: 'Baja' | 'Media' | 'Alta' | 'Crítica';
  subject: string;
  description: string;
  status: 'Abierto' | 'En Progreso' | 'Resuelto' | 'Cerrado';
  messages: Array<{ sender: 'customer' | 'admin'; text: string; time: string }>;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  time: string;
  level: 'success' | 'info' | 'warn' | 'critical';
  code: string;
  message: string;
  ip: string;
  user?: string;
  details?: any;
}

export interface SecurityAnomaly {
  code: string;
  message: string;
  severity: 'high' | 'medium';
}

export interface BlogComment {
  id: string;
  author: string;
  text: string;
  date: string;
  approved: boolean;
}

export interface BlogPost {
  id: string;
  shopId: string;
  title: string;
  slug: string;
  metaTitle: string;
  metaDescription: string;
  featuredImage: string;
  gallery?: string[];
  content: string;
  categories: string[];
  tags: string[];
  authorName: string;
  createdAt: string;
  readTime: string;
  tableOfContents?: Array<{ id: string; text: string; level: number }>;
  comments?: BlogComment[];
  relatedPostIds?: string[];
  isPublished: boolean;
}

// Subscription & Freemium System Types
export type SubscriptionPlanId = 'FREE' | 'LAUNCH_PRO';

export type SubscriptionStatus = 'Active' | 'Pending' | 'Cancelled' | 'Expired' | 'Past Due' | 'Refunded';

export type PaymentProviderType = 'paypal' | 'stripe' | 'mercado_pago' | 'mock';

export interface PlanLimits {
  monthlyAiAnalyses: number; // e.g. 10 for Free, -1 for unlimited
  monthlyMirrorGenerations: number; // e.g. 5 for Free, -1 for unlimited
  monthlyColorChanges: number; // e.g. 3 for Free, -1 for unlimited
  hdExport: boolean; // false for Free, true for Pro
  watermark: boolean; // true for Free, false for Pro
  priorityProcessing: boolean; // false for Free, true for Pro
  directSocialSharing: boolean; // false for Free, true for Pro
  unlimitedStyles: boolean; // false for Free, true for Pro
  earlyAccess: boolean; // false for Free, true for Pro
}

export interface SubscriptionPlan {
  id: SubscriptionPlanId;
  name: string;
  badge: string;
  priceUsd: number; // e.g. 0.00 for FREE, 1.00 for LAUNCH_PRO (configurable)
  interval: 'monthly' | 'yearly';
  isPromo: boolean;
  promoText?: string;
  description: string;
  features: string[];
  limits: PlanLimits;
}

export interface UserSubscription {
  userId: string;
  planId: SubscriptionPlanId;
  status: SubscriptionStatus;
  provider: PaymentProviderType;
  paypalSubscriptionId?: string;
  paypalOrderId?: string;
  stripeSubscriptionId?: string;
  startDate: string;
  endDate?: string;
  nextBillingDate?: string;
  canceledAt?: string;
  updatedAt: string;
}

export interface UserUsage {
  userId: string;
  monthKey: string; // e.g. "2026-07"
  aiAnalysesCount: number;
  mirrorGenerationsCount: number;
  colorChangesCount: number;
  lastUpdated: string;
}

export interface PaymentRecord {
  id: string;
  userId: string;
  userEmail?: string;
  planId: SubscriptionPlanId;
  amountUsd: number;
  currency: string;
  status: SubscriptionStatus;
  provider: PaymentProviderType;
  transactionId: string;
  invoiceRef: string;
  createdAt: string;
  renewalDate?: string;
}

export interface SystemPricingConfig {
  launchProPriceUsd: number;
  isPromoActive: boolean;
  promoNotice: string;
  freeLimits: PlanLimits;
  updatedAt: string;
}




