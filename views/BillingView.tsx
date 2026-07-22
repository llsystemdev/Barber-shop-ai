import React, { useState, useEffect } from 'react';
import { BarberShop, PaymentMethod, UserSubscription, PaymentRecord, SystemPricingConfig } from '../types';
import {
  getUserSubscription,
  getUserPaymentHistory,
  getSystemPricingConfig,
  activateUserSubscription
} from '../services/subscriptionService';
import UpgradeModal from '../components/UpgradeModal';

interface BillingViewProps {
  shop: BarberShop;
  onUpdatePlan: (shopId: string, newPlan: 'Freemium' | 'Básico' | 'Profesional') => void;
  onUpdatePaymentMethod: (shopId: string, newMethod: PaymentMethod) => void;
}

const CheckIcon: React.FC<{ className?: string }> = ({ className = "h-4 w-4 text-emerald-600" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
  </svg>
);

const BillingView: React.FC<BillingViewProps> = ({ shop }) => {
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<PaymentRecord[]>([]);
  const [pricingConfig, setPricingConfig] = useState<SystemPricingConfig | null>(null);
  const [loading, setLoading] = useState(true);

  const userId = shop.ownerId || shop.id || 'current_user';

  const loadSubscriptionData = async () => {
    setLoading(true);
    try {
      const [subData, historyData, configData] = await Promise.all([
        getUserSubscription(userId),
        getUserPaymentHistory(userId),
        getSystemPricingConfig()
      ]);
      setSubscription(subData);
      setPaymentHistory(historyData);
      setPricingConfig(configData);
    } catch (err) {
      console.warn('Error loading subscription data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubscriptionData();
  }, [userId]);

  const isPro = subscription?.planId === 'LAUNCH_PRO' && subscription.status === 'Active';
  const priceFormatted = `$${(pricingConfig?.launchProPriceUsd || 1.00).toFixed(2)} USD`;

  return (
    <>
      <UpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        userId={userId}
        onSuccess={() => loadSubscriptionData()}
      />

      <div className="w-full h-full bg-slate-50 overflow-y-auto p-4 sm:p-6 lg:p-10">
        <div className="max-w-6xl mx-auto space-y-10">
          
          {/* Header */}
          <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
            <div>
              <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-900 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider mb-2">
                <span>⚡ Módulo de Suscripciones</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-slate-950 uppercase tracking-tight">
                Facturación y Plan
              </h1>
              <p className="mt-1 text-sm text-slate-600 font-medium">
                Gestiona tu plan Freemium o Launch Pro y revisa tu historial de pagos en tiempo real.
              </p>
            </div>

            <button
              onClick={() => setIsUpgradeModalOpen(true)}
              className="bg-gradient-to-r from-red-600 to-amber-600 text-white font-black px-6 py-3.5 rounded-xl shadow-lg hover:brightness-110 transition-all uppercase text-xs tracking-widest flex items-center justify-center gap-2 self-start sm:self-auto"
            >
              <span>{isPro ? 'Ver Beneficios Pro' : `Actualizar a Launch Pro (${priceFormatted})`}</span>
            </button>
          </header>

          <main className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            
            {/* Left Column: Current Plan Status & Payment Provider */}
            <div className="lg:col-span-1 space-y-6">
              
              {/* Current Plan Card */}
              <div className="bg-white p-6 sm:p-8 rounded-3xl border-2 border-slate-200 shadow-sm relative overflow-hidden">
                <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                  Tu Estado Actual
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-3xl font-black text-slate-950 uppercase tracking-tight">
                      {isPro ? 'Launch Pro' : 'Plan Free'}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${isPro ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'}`}>
                      {subscription?.status || 'Active'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 font-bold">
                    {isPro ? (
                      <>Próxima renovación: <span className="text-slate-950">{subscription?.nextBillingDate ? new Date(subscription.nextBillingDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Mes siguiente'}</span></>
                    ) : (
                      'Estás disfrutando del Plan Gratuito con límites mensuales de uso.'
                    )}
                  </p>

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs space-y-1.5 font-bold text-slate-700">
                    <div className="flex justify-between">
                      <span>Análisis de IA:</span>
                      <span className="text-slate-950">{isPro ? 'Ilimitados' : '10 / mes'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Espejo Virtual:</span>
                      <span className="text-slate-950">{isPro ? 'Ilimitado' : '5 / mes'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Exportación HD:</span>
                      <span className="text-slate-950">{isPro ? 'Activado' : 'Sin HD'}</span>
                    </div>
                  </div>

                  {!isPro ? (
                    <button
                      onClick={() => setIsUpgradeModalOpen(true)}
                      className="w-full bg-slate-950 text-white font-black py-3.5 rounded-xl hover:bg-slate-800 transition-all uppercase text-xs tracking-widest shadow-md"
                    >
                      Obtener Launch Pro
                    </button>
                  ) : (
                    <div className="text-center text-[10px] font-bold text-emerald-700 bg-emerald-50 py-2 rounded-xl border border-emerald-200">
                      ✓ Tu suscripción Launch Pro está activa
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Provider Card */}
              <div className="bg-white p-6 sm:p-8 rounded-3xl border-2 border-slate-200 shadow-sm space-y-4">
                <div className="text-xs font-black text-slate-400 uppercase tracking-widest">
                  Proveedor de Pago
                </div>

                <div className="flex items-center space-x-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="w-10 h-10 bg-amber-100 text-amber-900 rounded-xl flex items-center justify-center font-black text-lg">
                    PP
                  </div>
                  <div>
                    <p className="font-black text-slate-950 text-xs uppercase tracking-tight">PayPal Checkout</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Acepta Tarjetas & Cuenta PayPal</p>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 font-medium leading-relaxed">
                  Infraestructura lista para integrar Stripe, Mercado Pago y Apple Pay sin reescribir la plataforma.
                </div>
              </div>
            </div>

            {/* Right Column: Dynamic Plans Comparison */}
            <div className="lg:col-span-2 space-y-6">
              
              <div className="bg-white p-6 sm:p-8 rounded-3xl border-2 border-slate-950 shadow-xl relative overflow-hidden space-y-6">
                
                {/* Promo Ribbon */}
                <div className="bg-gradient-to-r from-red-600 via-amber-600 to-red-700 -mx-6 -mt-6 sm:-mx-8 sm:-mt-8 p-4 text-white flex flex-col sm:flex-row items-center justify-between gap-2">
                  <span className="font-black text-xs uppercase tracking-wider flex items-center gap-2">
                    🔥 Oferta de Lanzamiento Exclusiva
                  </span>
                  <span className="text-[11px] font-bold bg-black/20 px-3 py-1 rounded-full">
                    {pricingConfig?.promoNotice || 'Precio especial de lanzamiento. El precio aumentará cuando finalice la promoción.'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  
                  {/* Plan 1: Free */}
                  <div className="p-6 rounded-2xl bg-slate-50 border-2 border-slate-200 flex flex-col justify-between space-y-6">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="text-lg font-black text-slate-950 uppercase tracking-tight">Plan FREE</h4>
                        <span className="bg-slate-200 text-slate-700 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">Gratis</span>
                      </div>
                      <p className="text-3xl font-black text-slate-950 tracking-tight mb-4">$0 <span className="text-xs text-slate-500 font-bold uppercase">/ mes</span></p>

                      <ul className="space-y-3 text-xs font-bold text-slate-700">
                        <li className="flex items-center gap-2">
                          <CheckIcon /> <span>10 análisis de IA / mes</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckIcon /> <span>5 estilos en Espejo Virtual</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckIcon /> <span>3 cambios de color al mes</span>
                        </li>
                        <li className="flex items-center gap-2 text-slate-400">
                          <span className="text-red-500">✕</span> <span>Marca de agua en imágenes</span>
                        </li>
                        <li className="flex items-center gap-2 text-slate-400">
                          <span className="text-red-500">✕</span> <span>Sin exportación HD</span>
                        </li>
                        <li className="flex items-center gap-2 text-slate-400">
                          <span className="text-red-500">✕</span> <span>Sin envío directo a redes</span>
                        </li>
                      </ul>
                    </div>

                    <button
                      disabled={!isPro}
                      className={`w-full py-3 rounded-xl font-black text-xs uppercase tracking-widest ${!isPro ? 'bg-slate-200 text-slate-500 cursor-not-allowed' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
                    >
                      {!isPro ? 'Plan Actual' : 'Cambiar a Free'}
                    </button>
                  </div>

                  {/* Plan 2: LAUNCH PRO */}
                  <div className="p-6 rounded-2xl bg-amber-50/70 border-2 border-amber-500 flex flex-col justify-between space-y-6 relative shadow-md">
                    <div className="absolute top-3 right-3 bg-red-600 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full">
                      Recomendado
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="text-lg font-black text-slate-950 uppercase tracking-tight">Launch Pro</h4>
                      </div>
                      <p className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight mb-1">
                        {priceFormatted} <span className="text-xs text-slate-500 font-bold uppercase">/ mes</span>
                      </p>
                      <p className="text-[10px] text-amber-800 font-bold uppercase tracking-wider mb-4">
                        Precio promocional de lanzamiento
                      </p>

                      <ul className="space-y-3 text-xs font-bold text-slate-800">
                        <li className="flex items-center gap-2">
                          <CheckIcon className="w-4 h-4 text-emerald-600" /> <span>Análisis de IA Ilimitados</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckIcon className="w-4 h-4 text-emerald-600" /> <span>Espejo Virtual Ilimitado</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckIcon className="w-4 h-4 text-emerald-600" /> <span>Todos los cortes, colores y texturas</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckIcon className="w-4 h-4 text-emerald-600" /> <span>Sin marcas de agua</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckIcon className="w-4 h-4 text-emerald-600" /> <span>Exportación & Descarga HD</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckIcon className="w-4 h-4 text-emerald-600" /> <span>Procesamiento Prioritario</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckIcon className="w-4 h-4 text-emerald-600" /> <span>Compartir en FB, IG, WhatsApp, X & TikTok</span>
                        </li>
                      </ul>
                    </div>

                    <button
                      onClick={() => setIsUpgradeModalOpen(true)}
                      className="w-full bg-slate-950 text-white font-black py-3.5 rounded-xl hover:bg-slate-800 transition-all uppercase text-xs tracking-widest shadow-lg"
                    >
                      {isPro ? 'Gestionar Suscripción' : `Actualizar por ${priceFormatted}`}
                    </button>
                  </div>

                </div>
              </div>

              {/* Transaction History Table */}
              <div className="bg-white p-6 sm:p-8 rounded-3xl border-2 border-slate-200 shadow-sm space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-black text-slate-950 uppercase tracking-widest">
                    Historial de Transacciones
                  </h3>
                  <span className="text-xs font-bold text-slate-400 uppercase">
                    PayPal Transactions
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b-2 border-slate-100 text-slate-400 font-black uppercase text-[10px] tracking-widest">
                        <th className="p-3">ID Transacción</th>
                        <th className="p-3">Fecha</th>
                        <th className="p-3">Monto</th>
                        <th className="p-3">Estado</th>
                        <th className="p-3">Proveedor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs font-bold">
                      {paymentHistory.length > 0 ? (
                        paymentHistory.map((tx) => (
                          <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                            <td className="p-3 font-mono text-slate-950">{tx.transactionId || tx.id}</td>
                            <td className="p-3 text-slate-700">
                              {new Date(tx.createdAt).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' })}
                            </td>
                            <td className="p-3 text-slate-950 font-black">${tx.amountUsd.toFixed(2)} USD</td>
                            <td className="p-3">
                              <span className="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-full bg-emerald-100 text-emerald-800">
                                {tx.status}
                              </span>
                            </td>
                            <td className="p-3 text-slate-500 uppercase">{tx.provider}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="p-6 text-center text-slate-400 font-medium">
                            No hay transacciones registradas aún.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

          </main>
        </div>
      </div>
    </>
  );
};

export default BillingView;
