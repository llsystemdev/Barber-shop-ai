import React, { useState } from 'react';
import { PaymentMethod } from '../types';

type PlanName = 'Freemium' | 'Básico' | 'Profesional';
type ModalContext = { type: 'changePlan' | 'updatePayment', plan?: PlanName } | null;

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  context: ModalContext;
  currentPlan: PlanName;
  onSuccess: (newPlan?: PlanName, newPaymentMethod?: PaymentMethod) => void;
}

const plansInfo = {
  'Freemium': { price: '$0', priceNum: 0 },
  'Básico': { price: '$1.99', priceNum: 1.99 },
  'Profesional': { price: '$9.99', priceNum: 9.99 },
};

const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, context, currentPlan, onSuccess }) => {
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { type, plan: newPlan } = context || {};
  const isChangingPlan = type === 'changePlan' && newPlan && newPlan !== currentPlan;

  if (!isOpen || !context) return null;

  const handleConfirm = () => {
    setIsLoading(true);
    // Simulate a brief processing time
    setTimeout(() => {
      setIsLoading(false);
      setIsSuccess(true);
      setTimeout(() => {
        onSuccess(newPlan, { type: 'Visa', last4: '4242', expiry: '12/26' });
      }, 2000);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[60] p-4 animate-fade-in" onClick={onClose}>
        <div className="bg-white rounded-2xl shadow-[0_35px_60px_-15px_rgba(0,0,0,0.5)] p-8 w-full max-w-md relative animate-zoom-in border-4 border-slate-100" onClick={(e) => e.stopPropagation()}>
            <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-950 text-3xl transition-colors">&times;</button>
            
            <h3 className="text-2xl font-black mb-1 uppercase tracking-tighter text-slate-950">
                {isChangingPlan ? `Plan ${newPlan}` : 'Confirmar Datos'}
            </h3>
            <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mb-8">
                {isChangingPlan ? `Monto a facturar: ${plansInfo[newPlan!].price}` : 'Actualiza tus credenciales'}
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
                    <div className="bg-slate-50 p-6 rounded-2xl border-2 border-slate-100">
                        <p className="text-slate-600 font-bold text-sm leading-relaxed">
                            {isChangingPlan 
                                ? `Estás a punto de cambiar al plan ${newPlan}. Se aplicarán los beneficios correspondientes de forma inmediata.`
                                : 'Confirma la actualización de tus datos de facturación para mantener tu cuenta activa.'}
                        </p>
                    </div>

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
                                <span>Procesando...</span>
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
                Sistema de Facturación Interno • L&L Dev System
            </p>
        </div>
    </div>
  );
};

export default PaymentModal;
