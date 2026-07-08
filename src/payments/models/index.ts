/**
 * Payments Core Models and Types
 * 
 * Defines standard entities and schemas for financial and subscription tracking.
 */

export interface StripeCustomer {
  id: string;
  tenant_id: string;
  email: string;
  name?: string;
  stripe_customer_id: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface StripeSubscription {
  id: string;
  tenant_id: string;
  stripe_subscription_id: string;
  stripe_customer_id: string;
  plan_id: string;
  status: 'active' | 'trialing' | 'past_due' | 'unpaid' | 'canceled' | 'incomplete';
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface StripeInvoice {
  id: string;
  tenant_id: string;
  stripe_invoice_id: string;
  stripe_customer_id: string;
  stripe_subscription_id?: string;
  amount_due: number;
  amount_paid: number;
  currency: string;
  status: 'draft' | 'open' | 'paid' | 'uncollectible' | 'void';
  hosted_invoice_url?: string;
  invoice_pdf?: string;
  created_at: string;
}

export interface StripePlan {
  id: string;
  name: string;
  stripe_price_id: string;
  stripe_product_id: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  features: string[];
  limits: {
    guest_simulations: number;
    mirror_ai: boolean;
    history: boolean;
    favorites: boolean;
    hd_download: boolean;
    calendar: boolean;
    customers: boolean;
    inventory: boolean;
    analytics: boolean;
    reports: boolean;
    premium_styles: boolean;
    video_generation: boolean;
    api_access: boolean;
    future_features: boolean;
  };
  active: boolean;
}
