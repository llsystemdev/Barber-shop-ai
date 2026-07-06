
import React, { useState } from 'react';
import { BarberShop, PaymentMethod } from '../types';
import PaymentModal from '../components/PaymentModal';

type PlanName = 'Freemium' | 'Básico' | 'Profesional';

interface BillingViewProps {
  shop: BarberShop;
  onUpdatePlan: (shopId: string, newPlan: PlanName) => void;
  onUpdatePaymentMethod: (shopId: string, newMethod: PaymentMethod) => void;
}

const plans: { [key in PlanName]: { price: string; features: string[]; color: string; button: string; border: string; }} = {
  'Freemium': {
    price: '$0',
    features: ['10 Análisis de IA / mes', 'Espejo Virtual Básico', '1 Barbero', 'Soporte por email'],
    color: 'bg-white',
    border: 'border-slate-200',
    button: 'bg-slate-500'
  },
  'Básico': {
    price: '$19/mes',
    features: ['50 Análisis de IA / mes', 'Espejo Virtual avanzado (colores)', 'Hasta 3 Barberos', 'Soporte prioritario'],
    color: 'bg-amber-50',
    border: 'border-amber-200',
    button: 'bg-amber-600'
  },
  'Profesional': {
    price: '$49/mes',
    features: ['Análisis de IA ilimitados', 'Todas las funciones del Espejo Virtual', 'Barberos ilimitados', 'Soporte 24/7'],
    color: 'bg-red-50',
    border: 'border-red-200',
    button: 'bg-red-700'
  }
};

const CheckIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${className}`} viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
);

const BillingView: React.FC<BillingViewProps> = ({ shop, onUpdatePlan, onUpdatePaymentMethod }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContext, setModalContext] = useState<{ type: 'changePlan' | 'updatePayment', plan?: PlanName } | null>(null);

  const handleOpenPlanModal = (plan: PlanName) => {
    setModalContext({ type: 'changePlan', plan });
    setIsModalOpen(true);
  };

  const handleOpenPaymentModal = () => {
    setModalContext({ type: 'updatePayment' });
    setIsModalOpen(true);
  };
  
  const handlePaymentSuccess = (newPlan?: PlanName, newPaymentMethod?: PaymentMethod) => {
    if (newPlan) {
      onUpdatePlan(shop.id, newPlan);
    }
    if (newPaymentMethod) {
      onUpdatePaymentMethod(shop.id, newPaymentMethod);
    }
    setIsModalOpen(false);
  }

  const getCardLogo = (type: string) => {
      const logos: { [key: string]: string } = {
          Visa: "https://upload.wikimedia.org/wikipedia/commons/a/a4/Visa_Inc._logo.svg",
          Mastercard: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/800px-Mastercard-logo.svg.png",
          Amex: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/American_Express_logo_%282018%29.svg/1200px-American_Express_logo_%282018%29.svg.png"
      }
      return logos[type] || logos.Visa;
  }

  return (
    <>
      <PaymentModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        context={modalContext}
        onSuccess={handlePaymentSuccess}
        currentPlan={shop.plan}
        shopId={shop.id}
      />
      <div className="w-full h-full bg-slate-50 overflow-y-auto p-6 lg:p-10">
        <div className="max-w-6xl mx-auto">
          <header className="mb-12">
            <h1 className="text-4xl font-black text-slate-950 uppercase tracking-tight">Facturación y Plan</h1>
            <p className="mt-2 text-lg text-slate-600 font-medium">Gestiona tu suscripción y revisa tu historial de pagos con transparencia.</p>
          </header>

          <main className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
              <div className="lg:col-span-1 space-y-8">
                  <div className="bg-white p-8 rounded-2xl border-2 border-slate-200 shadow-sm">
                      <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-4">Tu Plan Actual</h3>
                      <div className="space-y-4">
                          <p className="text-4xl font-black text-red-700 uppercase tracking-tighter">{shop.plan}</p>
                          <p className="text-slate-700 font-bold text-sm">Próxima renovación: <span className="text-slate-950">1 de Agosto, 2024</span></p>
                          <button 
                            onClick={() => handleOpenPlanModal(shop.plan)}
                            className="w-full bg-slate-950 text-white font-black py-4 rounded-xl hover:bg-slate-800 transition-all uppercase text-xs tracking-widest shadow-lg"
                           >
                              Gestionar Plan
                          </button>
                      </div>
                  </div>
                  <div className="bg-white p-8 rounded-2xl border-2 border-slate-200 shadow-sm">
                      <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-4">Método de Pago</h3>
                      <div className="flex items-center space-x-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
                          <img src={getCardLogo(shop.paymentMethod.type)} alt={shop.paymentMethod.type} className="h-6"/>
                          <div>
                              <p className="font-black text-slate-950 uppercase text-xs tracking-tight">{shop.paymentMethod.type} •••• {shop.paymentMethod.last4}</p>
                              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Expira {shop.paymentMethod.expiry}</p>
                          </div>
                      </div>
                      <button 
                        onClick={handleOpenPaymentModal}
                        className="mt-4 w-full bg-slate-200 text-slate-900 font-black py-3 rounded-xl hover:bg-slate-300 transition-all uppercase text-xs tracking-widest"
                      >
                          Actualizar Datos
                      </button>
                  </div>
              </div>

              <div className="lg:col-span-2 bg-white p-8 rounded-2xl border-2 border-slate-950 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 bg-red-700 text-white font-black text-[10px] uppercase tracking-widest rounded-bl-xl shadow-lg">Oferta de Lanzamiento</div>
                  <h3 className="text-2xl font-black text-slate-950 mb-4 uppercase tracking-widest">Planes de Crecimiento</h3>
                  <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest mb-8">Todos los planes son gratuitos por tiempo limitado para nuestros primeros usuarios.</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {(Object.keys(plans) as PlanName[]).map((name) => {
                        const plan = plans[name];
                        const isCurrentPlan = shop.plan === name;
                        return (
                          <div key={name} className={`p-6 rounded-2xl flex flex-col relative transition-all ${plan.color} border-2 ${isCurrentPlan ? 'border-red-600 ring-4 ring-red-100' : 'border-slate-200'}`}>
                              <h4 className="text-lg font-black mb-1 uppercase tracking-tight text-slate-900">{name}</h4>
                              <p className="text-3xl font-black mb-6 text-slate-950 tracking-tighter">{plan.price}<span className="text-xs font-bold text-slate-500 ml-1">/mes</span></p>
                              <ul className="space-y-4 mb-8 flex-grow">
                                  {plan.features.map(feature => (
                                      <li key={feature} className="flex items-start text-xs font-bold text-slate-700 leading-tight">
                                          <CheckIcon className="w-4 h-4 text-emerald-600 mr-2 mt-0.5 flex-shrink-0" />
                                          <span>{feature}</span>
                                      </li>
                                  ))}
                              </ul>
                              <button 
                                  className={`w-full font-black py-3 rounded-xl transition-all uppercase text-[10px] tracking-widest shadow-md ${isCurrentPlan ? 'bg-slate-200 text-slate-500 cursor-not-allowed' : `${plan.button} text-white hover:scale-105`}`}
                                  disabled={isCurrentPlan}
                                  onClick={() => handleOpenPlanModal(name)}
                              >
                                  {isCurrentPlan ? 'Plan Actual' : 'Seleccionar'}
                              </button>
                          </div>
                        )
                      })}
                  </div>
              </div>
              
              <div className="lg:col-span-3 bg-white p-8 rounded-2xl border-2 border-slate-200 shadow-sm mt-0 lg:-mt-0">
                  <h3 className="text-xl font-black text-slate-950 mb-6 uppercase tracking-widest">Historial de Transacciones</h3>
                  <div className="overflow-x-auto">
                      <table className="w-full text-left">
                          <thead>
                              <tr className="border-b-2 border-slate-100">
                                  <th className="p-4 font-black text-slate-500 uppercase text-[10px] tracking-widest">Fecha</th>
                                  <th className="p-4 font-black text-slate-500 uppercase text-[10px] tracking-widest">Monto</th>
                                  <th className="p-4 font-black text-slate-500 uppercase text-[10px] tracking-widest">Estado</th>
                                  <th className="p-4"></th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                              {shop.billingHistory.map(invoice => (
                                  <tr key={invoice.id} className="hover:bg-slate-50 transition-colors">
                                      <td className="p-4 text-slate-900 font-bold">{new Date(invoice.date + 'T00:00:00').toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</td>
                                      <td className="p-4 text-slate-950 font-black">{invoice.amount}</td>
                                      <td className="p-4">
                                          <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full shadow-sm ${invoice.status === 'Pagado' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                                              {invoice.status}
                                          </span>
                                      </td>
                                      <td className="p-4 text-right">
                                          <button className="font-black text-red-700 hover:text-red-900 text-xs uppercase tracking-tighter">Descargar PDF</button>
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              </div>
          </main>
        </div>
      </div>
    </>
  );
};

export default BillingView;
