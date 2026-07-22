import { SubscriptionPlanId, SubscriptionStatus, PaymentProviderType } from '../../types';

export interface CreateSubscriptionOptions {
  planId: SubscriptionPlanId;
  priceUsd: number;
  userId: string;
  userEmail?: string;
  returnUrl?: string;
  cancelUrl?: string;
}

export interface SubscriptionResult {
  subscriptionId: string;
  status: SubscriptionStatus;
  approvalUrl?: string;
  provider: PaymentProviderType;
  rawResponse?: any;
}

export interface IPaymentProvider {
  providerName: PaymentProviderType;
  createSubscription(options: CreateSubscriptionOptions): Promise<SubscriptionResult>;
  captureSubscription(subscriptionId: string, orderId?: string): Promise<SubscriptionResult>;
  cancelSubscription(subscriptionId: string, reason?: string): Promise<boolean>;
  getSubscriptionStatus(subscriptionId: string): Promise<SubscriptionResult>;
}

export class PaymentProviderRegistry {
  private static providers: Map<PaymentProviderType, IPaymentProvider> = new Map();

  public static registerProvider(provider: IPaymentProvider): void {
    this.providers.set(provider.providerName, provider);
  }

  public static getProvider(type: PaymentProviderType): IPaymentProvider {
    const provider = this.providers.get(type);
    if (!provider) {
      throw new Error(`Payment provider '${type}' is not registered.`);
    }
    return provider;
  }
}
