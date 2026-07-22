import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../firebase/client';
import {
  SubscriptionPlan,
  SubscriptionPlanId,
  UserSubscription,
  UserUsage,
  PaymentRecord,
  SystemPricingConfig,
  PlanLimits
} from '../types';
import { PaymentProviderRegistry } from './payment/PaymentProvider';
import { PayPalProvider } from './payment/PayPalProvider';
import { StripeProvider } from './payment/StripeProvider';

// Register available payment providers
PaymentProviderRegistry.registerProvider(new PayPalProvider());
PaymentProviderRegistry.registerProvider(new StripeProvider());

export const DEFAULT_FREE_LIMITS: PlanLimits = {
  monthlyAiAnalyses: 10,
  monthlyMirrorGenerations: 5,
  monthlyColorChanges: 3,
  hdExport: false,
  watermark: true,
  priorityProcessing: false,
  directSocialSharing: false,
  unlimitedStyles: false,
  earlyAccess: false
};

export const DEFAULT_PRO_LIMITS: PlanLimits = {
  monthlyAiAnalyses: -1, // Unlimited
  monthlyMirrorGenerations: -1, // Unlimited
  monthlyColorChanges: -1, // Unlimited
  hdExport: true,
  watermark: false,
  priorityProcessing: true,
  directSocialSharing: true,
  unlimitedStyles: true,
  earlyAccess: true
};

export const DEFAULT_SYSTEM_CONFIG: SystemPricingConfig = {
  launchProPriceUsd: 1.00,
  isPromoActive: true,
  promoNotice: 'Precio especial de lanzamiento. El precio aumentará cuando finalice la promoción.',
  freeLimits: DEFAULT_FREE_LIMITS,
  updatedAt: new Date().toISOString()
};

/**
 * Get current system pricing configuration from Firestore or defaults
 */
export async function getSystemPricingConfig(): Promise<SystemPricingConfig> {
  try {
    const configDoc = await getDoc(doc(db, 'systemConfig', 'pricing'));
    if (configDoc.exists()) {
      return configDoc.data() as SystemPricingConfig;
    }
  } catch (err) {
    console.warn('[subscriptionService] Firestore read systemConfig error, using defaults:', err);
  }
  return DEFAULT_SYSTEM_CONFIG;
}

/**
 * Get available plans with dynamic price and limits
 */
export async function getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  const config = await getSystemPricingConfig();

  const freePlan: SubscriptionPlan = {
    id: 'FREE',
    name: 'Plan Gratuito',
    badge: 'Standard',
    priceUsd: 0.00,
    interval: 'monthly',
    isPromo: false,
    description: 'Acceso básico a la tecnología de Barber Shop AI con límites mensuales.',
    features: [
      `Hasta ${config.freeLimits.monthlyAiAnalyses} análisis de IA al mes`,
      `Hasta ${config.freeLimits.monthlyMirrorGenerations} estilos virtuales al mes`,
      `Hasta ${config.freeLimits.monthlyColorChanges} cambios de color al mes`,
      'Galería básica de estilos',
      'Marca de agua en imágenes procesadas',
      'Velocidad de procesamiento estándar'
    ],
    limits: config.freeLimits
  };

  const launchProPlan: SubscriptionPlan = {
    id: 'LAUNCH_PRO',
    name: 'Plan Launch Pro',
    badge: 'Lanzamiento Especial',
    priceUsd: config.launchProPriceUsd,
    interval: 'monthly',
    isPromo: config.isPromoActive,
    promoText: config.promoNotice,
    description: 'Acceso ilimitado y profesional a todas las funciones avanzadas de Barber Shop AI.',
    features: [
      'Análisis de IA ilimitados',
      'Espejo Virtual ilimitado',
      'Todos los cortes, colores y texturas',
      'Sin marcas de agua en tus imágenes',
      'Exportación y descarga en Alta Definición (HD)',
      'Procesamiento ultra rápido y prioritario',
      'Compartir directamente en redes (FB, IG, TikTok, WhatsApp, X)',
      'Historial completo y favoritos guardados',
      'Acceso anticipado a todas las futuras funciones Premium'
    ],
    limits: DEFAULT_PRO_LIMITS
  };

  return [freePlan, launchProPlan];
}

/**
 * Get active user subscription from Firestore or default to FREE
 */
export async function getUserSubscription(userId: string): Promise<UserSubscription> {
  if (!userId) {
    return {
      userId: 'guest',
      planId: 'FREE',
      status: 'Active',
      provider: 'mock',
      startDate: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  try {
    const subDoc = await getDoc(doc(db, 'subscriptions', userId));
    if (subDoc.exists()) {
      const data = subDoc.data() as UserSubscription;
      // Check if expired
      if (data.endDate && new Date(data.endDate) < new Date() && data.status === 'Active') {
        const expiredSub: UserSubscription = {
          ...data,
          planId: 'FREE',
          status: 'Expired',
          updatedAt: new Date().toISOString()
        };
        await setDoc(doc(db, 'subscriptions', userId), expiredSub, { merge: true });
        return expiredSub;
      }
      return data;
    }
  } catch (err) {
    console.warn('[subscriptionService] Firestore read subscription error:', err);
  }

  return {
    userId,
    planId: 'FREE',
    status: 'Active',
    provider: 'paypal',
    startDate: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

/**
 * Check current month usage for a user
 */
export async function getUserUsage(userId: string): Promise<UserUsage> {
  const currentMonthKey = new Date().toISOString().substring(0, 7); // "YYYY-MM"
  const docId = `${userId}_${currentMonthKey}`;

  try {
    const usageDoc = await getDoc(doc(db, 'usage', docId));
    if (usageDoc.exists()) {
      return usageDoc.data() as UserUsage;
    }
  } catch (err) {
    console.warn('[subscriptionService] Firestore read usage error:', err);
  }

  return {
    userId,
    monthKey: currentMonthKey,
    aiAnalysesCount: 0,
    mirrorGenerationsCount: 0,
    colorChangesCount: 0,
    lastUpdated: new Date().toISOString()
  };
}

/**
 * Increment user usage for a specific feature
 */
export async function incrementUsage(
  userId: string,
  type: 'aiAnalysis' | 'mirrorGeneration' | 'colorChange'
): Promise<UserUsage> {
  const currentMonthKey = new Date().toISOString().substring(0, 7);
  const docId = `${userId}_${currentMonthKey}`;

  const currentUsage = await getUserUsage(userId);
  const updatedUsage: UserUsage = {
    ...currentUsage,
    aiAnalysesCount: type === 'aiAnalysis' ? currentUsage.aiAnalysesCount + 1 : currentUsage.aiAnalysesCount,
    mirrorGenerationsCount: type === 'mirrorGeneration' ? currentUsage.mirrorGenerationsCount + 1 : currentUsage.mirrorGenerationsCount,
    colorChangesCount: type === 'colorChange' ? currentUsage.colorChangesCount + 1 : currentUsage.colorChangesCount,
    lastUpdated: new Date().toISOString()
  };

  try {
    await setDoc(doc(db, 'usage', docId), updatedUsage, { merge: true });
  } catch (err) {
    console.warn('[subscriptionService] Firestore write usage error:', err);
  }

  return updatedUsage;
}

/**
 * Verify if user can access a feature or perform an action
 */
export async function checkFeatureAccess(
  userId: string,
  feature: 'aiAnalysis' | 'mirrorGeneration' | 'colorChange' | 'hdExport' | 'socialSharing'
): Promise<{ allowed: boolean; reason?: string; remaining?: number }> {
  const subscription = await getUserSubscription(userId);

  // LAUNCH_PRO users have unlimited access
  if (subscription.planId === 'LAUNCH_PRO' && subscription.status === 'Active') {
    return { allowed: true, remaining: 9999 };
  }

  // Check FREE limits
  const config = await getSystemPricingConfig();
  const usage = await getUserUsage(userId);

  if (feature === 'aiAnalysis') {
    const max = config.freeLimits.monthlyAiAnalyses;
    const remaining = Math.max(0, max - usage.aiAnalysesCount);
    if (usage.aiAnalysesCount >= max) {
      return {
        allowed: false,
        reason: `Has alcanzado el límite mensual de ${max} análisis de IA del Plan Gratuito.`,
        remaining: 0
      };
    }
    return { allowed: true, remaining };
  }

  if (feature === 'mirrorGeneration') {
    const max = config.freeLimits.monthlyMirrorGenerations;
    const remaining = Math.max(0, max - usage.mirrorGenerationsCount);
    if (usage.mirrorGenerationsCount >= max) {
      return {
        allowed: false,
        reason: `Has alcanzado el límite mensual de ${max} estilos en el Espejo Virtual del Plan Gratuito.`,
        remaining: 0
      };
    }
    return { allowed: true, remaining };
  }

  if (feature === 'colorChange') {
    const max = config.freeLimits.monthlyColorChanges;
    const remaining = Math.max(0, max - usage.colorChangesCount);
    if (usage.colorChangesCount >= max) {
      return {
        allowed: false,
        reason: `Has alcanzado el límite mensual de ${max} cambios de color del Plan Gratuito.`,
        remaining: 0
      };
    }
    return { allowed: true, remaining };
  }

  if (feature === 'hdExport') {
    return {
      allowed: false,
      reason: 'La descarga en Alta Definición (HD) sin marcas de agua forma parte del Plan Launch Pro.'
    };
  }

  if (feature === 'socialSharing') {
    return {
      allowed: false,
      reason: 'El envío directo a redes sociales (FB, Instagram, TikTok, WhatsApp, X) forma parte del Plan Launch Pro.'
    };
  }

  return { allowed: true };
}

/**
 * Save payment transaction record
 */
export async function recordPayment(record: Omit<PaymentRecord, 'id' | 'createdAt'>): Promise<PaymentRecord> {
  const newRecord: PaymentRecord = {
    ...record,
    id: `PAY_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    createdAt: new Date().toISOString()
  };

  try {
    await setDoc(doc(db, 'payments', newRecord.id), newRecord);
  } catch (err) {
    console.warn('[subscriptionService] Firestore write payment error:', err);
  }

  return newRecord;
}

/**
 * Update user subscription after successful payment
 */
export async function activateUserSubscription(
  userId: string,
  userEmail: string,
  provider: 'paypal' | 'stripe',
  subscriptionId: string,
  amountUsd: number,
  orderId?: string
): Promise<UserSubscription> {
  const startDate = new Date();
  const nextBillingDate = new Date();
  nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);

  const subData: UserSubscription = {
    userId,
    planId: 'LAUNCH_PRO',
    status: 'Active',
    provider,
    paypalSubscriptionId: provider === 'paypal' ? subscriptionId : undefined,
    paypalOrderId: orderId,
    stripeSubscriptionId: provider === 'stripe' ? subscriptionId : undefined,
    startDate: startDate.toISOString(),
    nextBillingDate: nextBillingDate.toISOString(),
    updatedAt: new Date().toISOString()
  };

  try {
    // Save to subscriptions collection
    await setDoc(doc(db, 'subscriptions', userId), subData, { merge: true });

    // Update user document role or plan field if exists
    await setDoc(doc(db, 'users', userId), { plan: 'LAUNCH_PRO', planUpdatedAt: new Date().toISOString() }, { merge: true });

    // Record transaction
    await recordPayment({
      userId,
      userEmail,
      planId: 'LAUNCH_PRO',
      amountUsd,
      currency: 'USD',
      status: 'Active',
      provider,
      transactionId: subscriptionId || orderId || `TX_${Date.now()}`,
      invoiceRef: `INV-${Date.now().toString().slice(-6)}`,
      renewalDate: nextBillingDate.toISOString()
    });
  } catch (err) {
    console.warn('[subscriptionService] Firestore write activation error:', err);
  }

  return subData;
}

/**
 * Get user payment transaction history
 */
export async function getUserPaymentHistory(userId: string): Promise<PaymentRecord[]> {
  if (!userId) return [];
  try {
    const q = query(
      collection(db, 'payments'),
      where('userId', '==', userId)
    );
    const snap = await getDocs(q);
    const results: PaymentRecord[] = [];
    snap.forEach((docSnap) => {
      results.push(docSnap.data() as PaymentRecord);
    });
    return results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (err) {
    console.warn('[subscriptionService] Firestore read payment history error:', err);
    return [];
  }
}

/**
 * Save system pricing configuration (Admin feature)
 */
export async function updateSystemPricingConfig(newConfig: Partial<SystemPricingConfig>): Promise<SystemPricingConfig> {
  const current = await getSystemPricingConfig();
  const updated: SystemPricingConfig = {
    ...current,
    ...newConfig,
    updatedAt: new Date().toISOString()
  };

  try {
    await setDoc(doc(db, 'systemConfig', 'pricing'), updated, { merge: true });
  } catch (err) {
    console.warn('[subscriptionService] Firestore write systemConfig error:', err);
  }

  return updated;
}
