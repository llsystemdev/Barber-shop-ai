/**
 * System Domain Constants
 * 
 * Central registry of roles, statuses, feature flags, subscription plans, and constraints.
 */

export const SYSTEM_ROLES = {
  ADMIN: 'admin',
  TENANT_ADMIN: 'tenant_admin',
  BARBER: 'barber',
  RECEPTIONIST: 'receptionist',
  CUSTOMER: 'customer',
} as const;

export const APPOINTMENT_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

/**
 * Enterprise Multi-Tenant Tiers (Plans)
 * 
 * Statically declared. Currently all set with active=true and price=0 for testing and preparation.
 */
export const BILLING_PLANS = {
  FREE: {
    id: 'plan_free',
    name: 'FREE',
    price: 0,
    active: true,
    stripePriceId: 'price_mock_free',
  },
  STARTER: {
    id: 'plan_starter',
    name: 'STARTER',
    price: 0,
    active: true,
    stripePriceId: 'price_mock_starter',
  },
  PRO: {
    id: 'plan_pro',
    name: 'PRO',
    price: 0,
    active: true,
    stripePriceId: 'price_mock_pro',
  },
  ENTERPRISE: {
    id: 'plan_enterprise',
    name: 'ENTERPRISE',
    price: 0,
    active: true,
    stripePriceId: 'price_mock_enterprise',
  }
} as const;

/**
 * Feature Flags and Permission System
 * 
 * Granular toggles to govern tenant capabilities according to subscription tiers.
 */
export const FEATURE_FLAGS = {
  GUEST_SIMULATIONS: 'guest_simulations',
  MIRROR_AI: 'mirror_ai',
  HISTORY: 'history',
  FAVORITES: 'favorites',
  HD_DOWNLOAD: 'hd_download',
  CALENDAR: 'calendar',
  CUSTOMERS: 'customers',
  INVENTORY: 'inventory',
  ANALYTICS: 'analytics',
  REPORTS: 'reports',
  PREMIUM_STYLES: 'premium_styles',
  VIDEO_GENERATION: 'video_generation',
  API_ACCESS: 'api_access',
  FUTURE_FEATURES: 'future_features',
} as const;

/**
 * Global Constants
 */
export const MAX_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024; // 5MB limit
export const MAX_GUEST_FREE_SIMULATIONS = 3; // Free guest simulations limit
