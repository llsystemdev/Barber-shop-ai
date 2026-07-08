/**
 * Payments Providers Factory
 * 
 * Provides centralized provider selection and instantiation.
 * Enables decoupling the billing logic from Stripe-specific implementations.
 */

import { StripeProvider } from '../interfaces';
import { StripeService } from '../services';

export class PaymentProviderFactory {
  private static instance: StripeProvider;

  /**
   * Resolves the configured Payment & Subscription Provider.
   * Can be easily extended to support other gateways (PayPal, Adyen) by switching bindings.
   */
  public static getProvider(): StripeProvider {
    if (!this.instance) {
      // Statically inject the Stripe service implementation
      this.instance = new StripeService();
    }
    return this.instance;
  }
}
