import React, { useState } from 'react';
import { PaymentMethod } from '../types';

type PlanName = 'FREE' | 'LAUNCH_PRO';
type ModalContext = { type: 'changePlan' | 'updatePayment', plan?: PlanName } | null;

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  context: ModalContext;
  currentPlan: PlanName;
  onSuccess: (newPlan?: PlanName, newPaymentMethod?: PaymentMethod) => void;
  shopId?: string;
}

const plansInfo = {
  'FREE': { price: '$0', priceNum: 0 },
  'LAUNCH_PRO': { price: '$1', priceNum: 1 },
};

const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, context, currentPlan, onSuccess, shopId }) => {
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isYearly, setIsYearly] = useState(false);

  const { type, plan: newPlan } = context || {};
  const isChangingPlan = type === 'changePlan' && newPlan && newPlan !== currentPlan;

  if (!isOpen || !context) return null;

  const displayPrice = isChangingPlan 
    ? (isYearly ? `$1 USD / mes (facturado anualmente)` : plansInfo[newPlan!].price + ' USD / mes') 
    : '';

  const handleConfirm = async () => {
    if (isChangingPlan) {
      setIsLoading(true);
      try {
        const response = await fetch('/api/stripe/create-checkout-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            plan: newPlan,
            isYearly,
            shopId: shopId || '1'
          })
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || 'Error al iniciar Stripe Checkout');
        }

        const data = await response.json();
        if (data.url) {
          // Redirigir la ventana más externa para evitar bloqueos por iframe
          if (window.top) {
            window.top.location.href = data.url;
          } else {
            window.location.href = data.url;
          }
        } else {
          throw new Error('No se recibió la URL de redirección');
        }
      } catch (err: any) {
        console.error('Stripe redirect failed:', err);
        alert('Ocurrió un error al contactar a la pasarela de Stripe: ' + err.message);
        setIsLoading(false);
      }
    } else {
      setIsLoading(true);
      // Simular procesamiento para actualización básica de tarjeta
      setTimeout(() => {
        setIsLoading(false);
        setIsSuccess(true);
        setTimeout(() => {
          onSuccess(newPlan, { type: 'Visa', last4: '4242', expiry: '12/26' });
        }, 2000);
      }, 1500);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[60] p-4 animate-fade-in" onClick={onClose}>
        <div className="bg-white rounded-2xl shadow-[0_35px_60px_-15px_rgba(0,0,0,0.5)] p-8 w-full max-w-md relative animate-zoom-in border-4 border-slate-100" onClick={(e) => e.stopPropagation()}>
            <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-950 text-3xl transition-colors">&times;</button>
            
            <h3 className="text-2xl font-black mb-1 uppercase tracking-tighter text-slate-950">
                {isChangingPlan ? `Plan ${newPlan}` : 'Confirmar Datos'}
            </h3>
            <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mb-8">
                {isChangingPlan ? `Monto a facturar: ${displayPrice}` : 'Actualiza tus credenciales'}
            </p>

            {isSuccess ? (
                <div className="text-center py-10 animate-bounce">
                    <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-emerald-200">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <h3 className="text-2xl font-black text-slate-950 uppercase tracking-tight">¡Procesado con éxito!</h3>
                    <p className="text-slate-600 font-bold mt-2">Actualizando tu suscripción...</p>
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="bg-slate-50 p-6 rounded-2xl border-2 border-slate-100 mb-4">
                        <p className="text-slate-600 font-bold text-sm leading-relaxed">
                            {isChangingPlan 
                                ? `Estás a punto de suscribirte al plan ${newPlan === 'LAUNCH_PRO' ? 'LAUNCH PRO ($1.00 USD/mes)' : newPlan}. Te redirigiremos de forma segura a la pasarela de pago para completar tu suscripción.`
                                : 'Confirma la actualización de tus datos de facturación para mantener tu cuenta activa.'}
                        </p>
                    </div>

                    {isChangingPlan && (
                        <div className="flex items-center justify-between p-4 bg-slate-50 border-2 border-slate-100 rounded-xl mb-4">
                            <span className="text-xs font-black uppercase tracking-widest text-slate-700">Facturación Anual</span>
                            <button
                                onClick={() => setIsYearly(!isYearly)}
                                className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-300 ${isYearly ? 'bg-red-600' : 'bg-slate-300'}`}
                            >
                                <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${isYearly ? 'translate-x-6' : ''}`}></div>
                            </button>
                        </div>
                    )}

                    <button 
                        onClick={handleConfirm}
                        disabled={isLoading}
                        className={`w-full py-4 rounded-xl font-black uppercase tracking-widest text-xs transition-all shadow-lg flex items-center justify-center space-x-2 ${
                            isLoading 
                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                            : 'bg-red-700 text-white hover:bg-red-800 active:scale-95'
                        }`}
                    >
                        {isLoading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                                <span>Procesando pago seguro...</span>
                            </>
                        ) : (
                            <span>Confirmar {isChangingPlan ? 'Suscripción' : 'Actualización'}</span>
                        )}
                    </button>

                    <button 
                        onClick={onClose}
                        className="w-full py-3 text-slate-400 font-bold uppercase text-[10px] tracking-widest hover:text-slate-600 transition-colors"
                    >
                        Cancelar
                    </button>
                </div>
            )}
            
            <p className="mt-8 text-center text-slate-400 text-[9px] font-bold uppercase tracking-widest">
                Pasarela Segura Cifrada SSL de 256-bit
            </p>
        </div>
    </div>
  );
};

export default PaymentModal;
