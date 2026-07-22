import { IPaymentProvider, CreateSubscriptionOptions, SubscriptionResult } from './PaymentProvider';
import { PaymentProviderType, SubscriptionStatus } from '../../types';

export class StripeProvider implements IPaymentProvider {
  public providerName: PaymentProviderType = 'stripe';

  public async createSubscription(options: CreateSubscriptionOptions): Promise<SubscriptionResult> {
    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: options.planId,
          priceUsd: options.priceUsd,
          userId: options.userId
        })
      });

      const data = await response.json();
      return {
        subscriptionId: data.sessionId || `STRIPE_SUB_${Date.now()}`,
        status: 'Pending',
        approvalUrl: data.url,
        provider: 'stripe',
        rawResponse: data
      };
    } catch (error: any) {
      throw new Error(`[StripeProvider] Error: ${error.message}`);
    }
  }

  public async captureSubscription(subscriptionId: string): Promise<SubscriptionResult> {
    return {
      subscriptionId,
      status: 'Active',
      provider: 'stripe'
    };
  }

  public async cancelSubscription(subscriptionId: string): Promise<boolean> {
    return true;
  }

  public async getSubscriptionStatus(subscriptionId: string): Promise<SubscriptionResult> {
    return {
      subscriptionId,
      status: 'Active',
      provider: 'stripe'
    };
  }
}
