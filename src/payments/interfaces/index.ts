/**
 * Payments Core Provider Interfaces
 * 
 * Provides decoupled clean architecture contracts for financial operations and Stripe integrations.
 */

export interface CustomerProvider {
  createCustomer(email: string, name: string, metadata?: Record<string, any>): Promise<any>;
  getCustomer(id: string): Promise<any>;
  updateCustomer(id: string, updateData: any): Promise<any>;
  deleteCustomer(id: string): Promise<void>;
}

export interface PaymentProvider {
  createPaymentIntent(amount: number, currency: string, customerId?: string, metadata?: Record<string, any>): Promise<any>;
  retrievePaymentIntent(id: string): Promise<any>;
  refundPayment(paymentIntentId: string, amount?: number): Promise<any>;
}

export interface SubscriptionProvider {
  createSubscription(customerId: string, priceId: string, metadata?: Record<string, any>): Promise<any>;
  cancelSubscription(id: string, atPeriodEnd?: boolean): Promise<any>;
  retrieveSubscription(id: string): Promise<any>;
  updateSubscription(id: string, priceId: string): Promise<any>;
}

export interface InvoiceProvider {
  retrieveInvoice(id: string): Promise<any>;
  getInvoicesForCustomer(customerId: string): Promise<any[]>;
  payInvoice(id: string): Promise<any>;
}

export interface CheckoutProvider {
  createCheckoutSession(customerId: string, successUrl: string, cancelUrl: string, lineItems: any[]): Promise<any>;
  retrieveCheckoutSession(id: string): Promise<any>;
}

export interface BillingProvider {
  createPortalSession(customerId: string, returnUrl: string): Promise<any>;
}

export interface WebhookProvider {
  constructEvent(payload: string | Buffer, headerSignature: string, secret: string): Promise<any>;
}

export interface UsageProvider {
  reportUsage(subscriptionItemId: string, quantity: number, timestamp?: number): Promise<any>;
}

export interface StripeProvider extends 
  CustomerProvider, 
  PaymentProvider, 
  SubscriptionProvider, 
  InvoiceProvider, 
  CheckoutProvider, 
  BillingProvider, 
  WebhookProvider, 
  UsageProvider 
{}
