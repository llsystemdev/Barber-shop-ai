import React, { useState, useEffect } from 'react';
import { BarberShop, Booking, User as AppUser, SystemPricingConfig } from '../types';
import { getAdminDashboardData, getPlatformDashboardData } from '../services/adminDataService';
import { getSystemPricingConfig, updateSystemPricingConfig } from '../services/subscriptionService';
import StatCard from '../components/StatCard';
import BarChart from '../components/BarChart';
import { MirrorIcon, CalendarIcon, BookingsIcon, ShopIcon, ChatIcon, BillingIcon } from '../assets/icons';
import { 
  Shield, 
  ShieldAlert, 
  LifeBuoy, 
  FileCheck, 
  Landmark, 
  Cpu, 
  Trash2, 
  Send, 
  Download, 
  UserMinus, 
  RotateCw, 
  Check, 
  ArrowRight,
  AlertTriangle,
  Info
} from 'lucide-react';
import { enterpriseService, AuditLog, SecurityAnomaly } from '../services/enterpriseService';
import { SupportTicket } from '../server/support';

interface AdminViewProps {
  currentUser: AppUser | null;
  currentShop: BarberShop;
  bookings: Booking[];
  shops: BarberShop[];
  viewMode?: 'platform' | 'shop';
  onSelectShop?: (shop: BarberShop) => void;
}

type PlatformTab = 'general' | 'security' | 'support' | 'compliance' | 'billing' | 'subscriptions' | 'ai_metrics';

const AdminView: React.FC<AdminViewProps> = ({ currentUser, currentShop, bookings, shops, viewMode, onSelectShop }) => {
  const isPlatformAdmin = viewMode === 'platform' || (viewMode === undefined && currentUser?.role === 'platformAdmin');
  
  // Tabs & Active states for SaaS Panel
  const [activeTab, setActiveTab] = useState<PlatformTab>('general');
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [anomalies, setAnomalies] = useState<SecurityAnomaly[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [activeTicket, setActiveTicket] = useState<SupportTicket | null>(null);
  const [replyText, setReplyText] = useState('');
  const [kbArticles, setKbArticles] = useState<any[]>([]);
  
  // GDPR forms state
  const [gdprEmail, setGdprEmail] = useState('');
  const [gdprExportResult, setGdprExportResult] = useState<any | null>(null);
  const [gdprSuccessMsg, setGdprSuccessMsg] = useState('');
  const [gdprErrorMsg, setGdprErrorMsg] = useState('');
  
  // Loading & logs state
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [isLoadingTickets, setIsLoadingTickets] = useState(false);

  // System Pricing & Plan Limits State
  const [sysPricing, setSysPricing] = useState<SystemPricingConfig | null>(null);
  const [isSavingPricing, setIsSavingPricing] = useState(false);
  const [pricingMsg, setPricingMsg] = useState('');

  useEffect(() => {
    if (isPlatformAdmin) {
      getSystemPricingConfig().then(setSysPricing);
    }
  }, [isPlatformAdmin]);

  const handleSavePricing = async () => {
    if (!sysPricing) return;
    setIsSavingPricing(true);
    setPricingMsg('');
    try {
      await updateSystemPricingConfig(sysPricing);
      setPricingMsg('✓ Configuración de precios y límites guardada correctamente en Firestore.');
      setTimeout(() => setPricingMsg(''), 4000);
    } catch (err: any) {
      setPricingMsg('❌ Error al guardar la configuración: ' + (err.message || 'Error desconocido'));
    } finally {
      setIsSavingPricing(false);
    }
  };

  // Load SaaS dynamic metrics
  useEffect(() => {
    if (isPlatformAdmin) {
      loadSaaSData();
    }
  }, [isPlatformAdmin]);

  const loadSaaSData = async () => {
    setIsLoadingLogs(true);
    setIsLoadingTickets(true);
    try {
      const logs = await enterpriseService.fetchAuditLogs();
      setAuditLogs(logs);

      const detectedAnomalies = await enterpriseService.fetchSecurityAnomalies();
      setAnomalies(detectedAnomalies);

      const supportTickets = await enterpriseService.fetchTickets();
      setTickets(supportTickets);
      if (supportTickets.length > 0 && !activeTicket) {
        setActiveTicket(supportTickets[0]);
      }

      const articles = await enterpriseService.fetchKB();
      setKbArticles(articles);
    } catch (err) {
      console.error('Error loading enterprise SaaS metrics:', err);
    } finally {
      setIsLoadingLogs(false);
      setIsLoadingTickets(false);
    }
  };

  const handleRotateLogs = async () => {
    const success = await enterpriseService.clearAuditLogs();
    if (success) {
      setAuditLogs([]);
      setAnomalies([]);
      await loadSaaSData();
    }
  };

  const handleSendTicketReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !activeTicket) return;

    const updated = await enterpriseService.sendTicketMessage(activeTicket.id, 'admin', replyText);
    if (updated) {
      setReplyText('');
      setActiveTicket(updated);
      setTickets(prev => prev.map(t => t.id === updated.id ? updated : t));
    }
  };

  const handleUpdateTicketStatus = async (ticketId: string, status: SupportTicket['status']) => {
    const updated = await enterpriseService.updateTicketStatus(ticketId, status);
    if (updated) {
      if (activeTicket?.id === updated.id) {
        setActiveTicket(updated);
      }
      setTickets(prev => prev.map(t => t.id === updated.id ? updated : t));
    }
  };

  const handleGdprExport = async (e: React.FormEvent) => {
    e.preventDefault();
    setGdprSuccessMsg('');
    setGdprErrorMsg('');
    setGdprExportResult(null);

    if (!gdprEmail.trim()) {
      setGdprErrorMsg('Por favor, ingresa un correo electrónico válido.');
      return;
    }

    const data = await enterpriseService.exportGDPRData(gdprEmail);
    if (data) {
      setGdprExportResult(data);
      setGdprSuccessMsg('Datos exportados con éxito bajo el Artículo 20 de la GDPR (Portabilidad de Datos).');
    } else {
      setGdprErrorMsg('No se encontraron registros de usuario para el correo ingresado.');
    }
  };

  const handleGdprErase = async () => {
    if (!window.confirm('¿Está absolutamente seguro de aplicar el Derecho al Olvido (Artículo 17 GDPR)? Esta acción eliminará permanentemente la cuenta, todas las citas, historiales y registros de consentimiento, de forma irreversible.')) {
      return;
    }

    setGdprSuccessMsg('');
    setGdprErrorMsg('');
    setGdprExportResult(null);

    const success = await enterpriseService.deleteGDPRAccount(gdprEmail);
    if (success) {
      setGdprSuccessMsg('Todos los datos personales y de actividad han sido eliminados de manera permanente y segura (Derecho al Olvido completado).');
      setGdprEmail('');
      loadSaaSData();
    } else {
      setGdprErrorMsg('Error al borrar la cuenta o el correo no existe en el sistema.');
    }
  };

  const data = getAdminDashboardData(currentShop, bookings);
  const platformData = getPlatformDashboardData(shops, bookings);

  if (!data || !platformData) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] bg-slate-50">
        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mt-4">Cargando analíticas...</p>
      </div>
    );
  }

  // --- RENDERING PLATFORM ADMIN DASHBOARD ---
  if (isPlatformAdmin) {
    const { stats, planDistribution } = platformData;
    
    return (
      <div className="w-full bg-slate-50 p-4 sm:p-6 lg:p-10 space-y-10 min-h-full">
        {/* Header Superior SaaS */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="inline-flex items-center space-x-2 bg-red-500/10 border border-red-500/20 text-red-600 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest mb-3 animate-pulse">
              <span>👑 PANEL SUPER ADMINISTRADOR SAAS</span>
            </div>
            <h1 className="text-4xl font-black text-slate-950 uppercase tracking-tighter leading-none mb-3">
              Métricas <span className="text-red-600 italic">Globales</span>
            </h1>
            <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.3em]">
              Suscripciones, rendimiento y salud de la plataforma de IA
            </p>
          </div>
          <div className="flex gap-2">
            <span className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Servidor: Operacional
            </span>
            <span className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg">
              Suscritos: {stats.totalShops} Barberías
            </span>
          </div>
        </div>

        {/* SaaS Global Cards */}
        <div className="flex overflow-x-auto pb-4 gap-6 scrollbar-none -mx-4 px-4 sm:-mx-6 sm:px-6 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:gap-6 scroll-smooth snap-x">
          <div className="flex-shrink-0 w-[240px] sm:w-auto snap-center">
            <StatCard 
              title="Ingresos Recurrentes (MRR)" 
              value={`$${stats.monthlyRecurringRevenue.toLocaleString()}`} 
              icon={<BillingIcon className="w-5 h-5 text-red-600" />} 
              change="+18.4% este mes"
              changeType="increase"
            />
          </div>
          <div className="flex-shrink-0 w-[240px] sm:w-auto snap-center">
            <StatCard 
              title="Barberías Registradas" 
              value={stats.totalShops} 
              icon={<ShopIcon className="w-5 h-5 text-red-600" />} 
              change="+3 nuevos salones"
              changeType="increase"
            />
          </div>
          <div className="flex-shrink-0 w-[240px] sm:w-auto snap-center">
            <StatCard 
              title="Consultas de IA Totales" 
              value={stats.totalPlatformAnalyses} 
              icon={<ChatIcon className="w-5 h-5 text-red-600" />} 
              change="+42% de uso en la red"
              changeType="increase"
            />
          </div>
          <div className="flex-shrink-0 w-[240px] sm:w-auto snap-center">
            <StatCard 
              title="Reservas Totales" 
              value={stats.totalPlatformBookings} 
              icon={<BookingsIcon className="w-5 h-5 text-red-600" />} 
              change="+9.5% de efectividad"
              changeType="increase"
            />
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 overflow-x-auto pb-px scrollbar-none -mx-6 px-6 sm:mx-0 sm:px-0 scroll-smooth snap-x gap-1">
          <button 
            onClick={() => setActiveTab('general')}
            className={`flex items-center gap-2 px-5 py-3 text-xs font-black uppercase tracking-widest transition-all rounded-t-2xl border-t border-x flex-shrink-0 whitespace-nowrap snap-center ${
              activeTab === 'general' 
                ? 'bg-white border-slate-200 text-red-600 border-b-transparent -mb-[1px]' 
                : 'bg-transparent border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <ShopIcon className="w-4 h-4" />
            General
          </button>
          <button 
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-2 px-5 py-3 text-xs font-black uppercase tracking-widest transition-all rounded-t-2xl border-t border-x flex-shrink-0 whitespace-nowrap snap-center ${
              activeTab === 'security' 
                ? 'bg-white border-slate-200 text-red-600 border-b-transparent -mb-[1px]' 
                : 'bg-transparent border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Shield className="w-4 h-4" />
            Centro de Seguridad
          </button>
          <button 
            onClick={() => setActiveTab('support')}
            className={`flex items-center gap-2 px-5 py-3 text-xs font-black uppercase tracking-widest transition-all rounded-t-2xl border-t border-x flex-shrink-0 whitespace-nowrap snap-center ${
              activeTab === 'support' 
                ? 'bg-white border-slate-200 text-red-600 border-b-transparent -mb-[1px]' 
                : 'bg-transparent border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <LifeBuoy className="w-4 h-4" />
            Mesa de Soporte
          </button>
          <button 
            onClick={() => setActiveTab('compliance')}
            className={`flex items-center gap-2 px-5 py-3 text-xs font-black uppercase tracking-widest transition-all rounded-t-2xl border-t border-x flex-shrink-0 whitespace-nowrap snap-center ${
              activeTab === 'compliance' 
                ? 'bg-white border-slate-200 text-red-600 border-b-transparent -mb-[1px]' 
                : 'bg-transparent border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <FileCheck className="w-4 h-4" />
            Cumplimiento GDPR
          </button>
          <button 
            onClick={() => setActiveTab('billing')}
            className={`flex items-center gap-2 px-5 py-3 text-xs font-black uppercase tracking-widest transition-all rounded-t-2xl border-t border-x flex-shrink-0 whitespace-nowrap snap-center ${
              activeTab === 'billing' 
                ? 'bg-white border-slate-200 text-red-600 border-b-transparent -mb-[1px]' 
                : 'bg-transparent border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Landmark className="w-4 h-4" />
            Stripe & Finanzas
          </button>
          <button 
            onClick={() => setActiveTab('subscriptions')}
            className={`flex items-center gap-2 px-5 py-3 text-xs font-black uppercase tracking-widest transition-all rounded-t-2xl border-t border-x flex-shrink-0 whitespace-nowrap snap-center ${
              activeTab === 'subscriptions' 
                ? 'bg-white border-slate-200 text-red-600 border-b-transparent -mb-[1px]' 
                : 'bg-transparent border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Landmark className="w-4 h-4 text-amber-600" />
            PayPal & Suscripciones
          </button>
          <button 
            onClick={() => setActiveTab('ai_metrics')}
            className={`flex items-center gap-2 px-5 py-3 text-xs font-black uppercase tracking-widest transition-all rounded-t-2xl border-t border-x flex-shrink-0 whitespace-nowrap snap-center ${
              activeTab === 'ai_metrics' 
                ? 'bg-white border-slate-200 text-red-600 border-b-transparent -mb-[1px]' 
                : 'bg-transparent border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Cpu className="w-4 h-4" />
            Rendimiento IA
          </button>
        </div>

        {/* --- TAB CONTENT AREA --- */}

        {/* TAB 1: GENERAL OVERVIEW */}
        {activeTab === 'general' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start animate-fadeIn">
            <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-slate-100 space-y-6">
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <h3 className="text-xs font-black text-slate-950 uppercase tracking-widest">
                  Barberías en el Ecosistema
                </h3>
                <span className="text-[10px] bg-red-50 text-red-600 px-2.5 py-1 rounded-full font-black uppercase tracking-wider">
                  Total: {shops.length}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[9px]">
                      <th className="pb-3">Nombre del Salón</th>
                      <th className="pb-3">Ciudad / Dirección</th>
                      <th className="pb-3">Plan</th>
                      <th className="pb-3">Personalidad AI</th>
                      <th className="pb-3 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 font-medium text-slate-700">
                    {shops.map((shop) => (
                      <tr key={shop.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 font-black text-slate-900">{shop.name}</td>
                        <td className="py-4 text-slate-500">{shop.address}</td>
                        <td className="py-4">
                          <span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                            shop.plan === 'LAUNCH_PRO' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {shop.plan === 'LAUNCH_PRO' ? 'LAUNCH PRO' : 'FREE'}
                          </span>
                        </td>
                        <td className="py-4 text-indigo-600 font-bold">{shop.aiName || 'Estilista AI'}</td>
                        <td className="py-4 text-right">
                          <button
                            onClick={() => onSelectShop?.(shop)}
                            className="bg-slate-950 hover:bg-red-600 text-white font-black text-[9px] uppercase tracking-widest px-3 py-1.5 rounded-lg transition-colors shadow-sm"
                          >
                            ⚙️ Gestionar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 space-y-6">
              <h3 className="text-xs font-black text-slate-950 uppercase tracking-widest border-b border-slate-100 pb-4">
                Distribución de Suscripciones
              </h3>
              
              <div className="space-y-4">
                {planDistribution.map((plan) => {
                  const percentage = stats.totalShops > 0 ? (plan.count / stats.totalShops) * 100 : 0;
                  return (
                    <div key={plan.name} className="space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-700 uppercase">{plan.name}</span>
                        <span className="font-black text-slate-900">{plan.count} ({Math.round(percentage)}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-500" 
                          style={{ width: `${percentage}%`, backgroundColor: plan.color }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">PROMEDIO DE TICKET</span>
                <p className="text-xl font-black text-slate-900 uppercase tracking-tight">$32.50 USD</p>
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-1">Por análisis de visagismo completado</p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SECURITY CENTER */}
        {activeTab === 'security' && (
          <div className="space-y-8 animate-fadeIn">
            {/* Security Alerts and Shield status */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-slate-100 space-y-6">
                <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-sm font-black text-slate-950 uppercase tracking-tight flex items-center gap-2">
                      <Shield className="w-5 h-5 text-emerald-600" />
                      Auditoría de Seguridad del Sistema
                    </h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">
                      Registro de Auditoría (Audit Trails) conforme a OWASP Top 10 e ISO 27001
                    </p>
                  </div>
                  <button 
                    onClick={handleRotateLogs}
                    className="px-3.5 py-2 border border-slate-200 hover:border-red-600 hover:text-red-600 bg-white text-slate-600 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-all shadow-sm"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    Rotar Logs
                  </button>
                </div>

                {isLoadingLogs ? (
                  <div className="flex justify-center py-12">
                    <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : auditLogs.length === 0 ? (
                  <p className="text-center text-xs text-slate-400 py-12">No hay registros de auditoría disponibles.</p>
                ) : (
                  <div className="font-mono text-xs text-slate-300 space-y-3 max-h-[400px] overflow-y-auto bg-slate-950 p-6 rounded-2xl border border-slate-800 shadow-inner">
                    {auditLogs.map((log) => (
                      <div key={log.id} className="flex items-start space-x-3 hover:bg-slate-900/50 p-1.5 rounded transition-colors border-b border-slate-900/40 last:border-0 pb-2.5">
                        <span className="text-slate-500 shrink-0">[{new Date(log.time).toLocaleTimeString()}]</span>
                        <span className={`px-2 py-0.5 rounded text-[8px] font-bold shrink-0 ${
                          log.level === 'success' ? 'bg-emerald-500/10 text-emerald-400' :
                          log.level === 'warn' ? 'bg-amber-500/10 text-amber-400' :
                          log.level === 'critical' ? 'bg-red-500/10 text-red-400 animate-pulse' : 'bg-blue-500/10 text-blue-400'
                        }`}>
                          {log.code}
                        </span>
                        <span className="flex-1 text-slate-200 font-medium">{log.message}</span>
                        <span className="text-slate-500 text-[10px] font-mono shrink-0">IP: {log.ip}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Anomaly / Threats detection panel */}
              <div className="space-y-6">
                <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest border-b border-slate-50 pb-4 flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-amber-500" />
                    Detector de Anomalías
                  </h3>

                  {anomalies.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-6 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-2xl text-center">
                      <Check className="w-8 h-8 text-emerald-600 mb-2" />
                      <p className="text-xs font-black uppercase tracking-wider">Sistema Impecable</p>
                      <p className="text-[10px] text-emerald-600 font-medium mt-1">No se detectaron vectores de ataque o fuerza bruta activos en los últimos 10 minutos.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {anomalies.map((anom, idx) => (
                        <div key={idx} className="p-4 bg-red-50 border border-red-100 text-red-900 rounded-2xl space-y-1">
                          <div className="flex items-center gap-1.5 text-red-700">
                            <AlertTriangle className="w-4 h-4 animate-bounce shrink-0" />
                            <span className="text-[10px] font-black uppercase tracking-widest">{anom.code}</span>
                          </div>
                          <p className="text-xs font-bold">{anom.message}</p>
                          <span className="inline-block px-2 py-0.5 bg-red-600 text-white rounded text-[8px] font-black uppercase tracking-wider mt-1">
                            Severidad: {anom.severity}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-slate-900 p-8 rounded-3xl text-white space-y-4 relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-red-600 text-white text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-bl-xl">OWASP READY</div>
                  <h4 className="text-xs font-black uppercase tracking-widest text-red-400">Protección del Servidor</h4>
                  <ul className="text-[11px] text-slate-400 space-y-2 font-medium">
                    <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-red-500" /> CSP: Configurada con orígenes autorizados</li>
                    <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-red-500" /> MIME: Verificación binaria de archivos</li>
                    <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-red-500" /> Rate Limiter: IP & Endpoint limitadores activos</li>
                    <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-red-500" /> Sanitizer: Prevención de scripts e inyecciones XSS</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: SUPPORT CENTRE */}
        {activeTab === 'support' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start animate-fadeIn">
            {/* Tickets Sidebar */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest border-b border-slate-50 pb-4">
                Tickets de Soporte ({tickets.length})
              </h3>

              <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
                {tickets.map((ticket) => (
                  <div 
                    key={ticket.id} 
                    onClick={() => setActiveTicket(ticket)}
                    className={`p-4 rounded-2xl border text-left cursor-pointer transition-all ${
                      activeTicket?.id === ticket.id 
                        ? 'bg-slate-950 text-white border-slate-950 shadow-md' 
                        : 'bg-white border-slate-100 hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                        ticket.priority === 'Crítica' ? 'bg-red-500 text-white' :
                        ticket.priority === 'Alta' ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {ticket.priority}
                      </span>
                      <span className={`text-[8px] font-black uppercase ${
                        ticket.status === 'Abierto' ? 'text-green-500' :
                        ticket.status === 'En Progreso' ? 'text-amber-500' : 'text-slate-400'
                      }`}>
                        ● {ticket.status}
                      </span>
                    </div>
                    <h4 className="text-xs font-black uppercase tracking-tight mb-1 truncate">{ticket.subject}</h4>
                    <p className={`text-[10px] font-medium truncate ${activeTicket?.id === ticket.id ? 'text-slate-300' : 'text-slate-400'}`}>
                      Por: {ticket.customerName}
                    </p>
                    <span className="text-[8px] block font-mono text-slate-500 mt-2">
                      ID: {ticket.id}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Ticket Conversation details */}
            <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col min-h-[520px]">
              {activeTicket ? (
                <div className="flex-1 flex flex-col justify-between h-full space-y-6">
                  {/* Ticket Header */}
                  <div className="border-b border-slate-100 pb-4 flex justify-between items-start flex-wrap gap-4">
                    <div>
                      <div className="inline-flex items-center gap-1.5 text-[9px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-black uppercase tracking-wider mb-2">
                        <span>{activeTicket.category}</span>
                      </div>
                      <h3 className="text-base font-black text-slate-950 uppercase tracking-tight">
                        {activeTicket.subject}
                      </h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">
                        De: {activeTicket.customerName} ({activeTicket.email})
                      </p>
                    </div>
                    
                    {/* Action buttons to change ticket status */}
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleUpdateTicketStatus(activeTicket.id, 'Resuelto')}
                        className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-sm hover:bg-emerald-700 transition-colors"
                      >
                        ✓ Resolver
                      </button>
                      <button 
                        onClick={() => handleUpdateTicketStatus(activeTicket.id, 'Cerrado')}
                        className="px-3 py-1.5 bg-slate-200 text-slate-700 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-300 transition-colors"
                      >
                        Cerrar Ticket
                      </button>
                    </div>
                  </div>

                  {/* Messages Bubble History */}
                  <div className="flex-1 overflow-y-auto max-h-[300px] space-y-4 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                    {activeTicket.messages.map((msg, idx) => (
                      <div key={idx} className={`flex flex-col ${msg.sender === 'admin' ? 'items-end' : 'items-start'}`}>
                        <div className={`p-4 rounded-2xl max-w-[80%] text-xs font-medium shadow-sm ${
                          msg.sender === 'admin' 
                            ? 'bg-slate-900 text-white rounded-tr-none' 
                            : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'
                        }`}>
                          {msg.text}
                        </div>
                        <span className="text-[8px] font-mono text-slate-400 mt-1 uppercase">
                          {msg.sender === 'admin' ? 'SOPORTE SAAS' : 'CLIENTE'} • {new Date(msg.time).toLocaleTimeString()}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Reply Input Form */}
                  <form onSubmit={handleSendTicketReply} className="flex gap-3">
                    <input 
                      type="text" 
                      placeholder="Escribe una respuesta empresarial..." 
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      className="flex-1 px-4 py-3 border border-slate-200 focus:border-red-600 focus:ring-1 focus:ring-red-600 outline-none rounded-2xl text-xs font-bold uppercase tracking-tight bg-slate-50"
                    />
                    <button 
                      type="submit" 
                      className="bg-red-600 hover:bg-slate-950 text-white font-black text-[10px] uppercase tracking-widest px-6 py-3 rounded-2xl shadow-lg transition-colors flex items-center gap-1.5 shrink-0"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Responder
                    </button>
                  </form>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                  <LifeBuoy className="w-12 h-12 text-slate-300 mb-2" />
                  <p className="text-slate-400 font-black text-xs uppercase tracking-widest">Ningún ticket seleccionado</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: GDPR COMPLIANCE */}
        {activeTab === 'compliance' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start animate-fadeIn">
            {/* GDPR Rights Console */}
            <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-8">
              <div>
                <h3 className="text-sm font-black text-slate-950 uppercase tracking-tight flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-red-600" />
                  Consola de Cumplimiento Legal (GDPR / CCPA / BIPA)
                </h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">
                  Atiende peticiones legales y derechos del consumidor de forma automatizada e irrevocable
                </p>
              </div>

              {/* GDPR Request Form */}
              <form onSubmit={handleGdprExport} className="space-y-4">
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Ingresar Correo del Usuario Solicitante
                </label>
                <div className="flex gap-3">
                  <input 
                    type="email" 
                    placeholder="ejemplo@correo.com" 
                    value={gdprEmail}
                    onChange={(e) => setGdprEmail(e.target.value)}
                    className="flex-1 px-4 py-3 border border-slate-200 outline-none rounded-xl text-xs font-bold uppercase tracking-tight bg-slate-50 focus:border-red-600 focus:ring-1 focus:ring-red-600"
                  />
                  <button 
                    type="submit" 
                    className="bg-slate-950 hover:bg-slate-800 text-white font-black text-[9px] uppercase tracking-widest px-5 py-3 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
                  >
                    <Download className="w-4 h-4" />
                    Exportar Datos
                  </button>
                  <button 
                    type="button" 
                    onClick={handleGdprErase}
                    className="bg-red-600 hover:bg-red-700 text-white font-black text-[9px] uppercase tracking-widest px-5 py-3 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
                  >
                    <UserMinus className="w-4 h-4" />
                    Derecho al Olvido
                  </button>
                </div>
              </form>

              {/* Success / Error Banners */}
              {gdprSuccessMsg && (
                <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-2xl flex items-start gap-2.5 text-xs font-bold">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <p>{gdprSuccessMsg}</p>
                </div>
              )}
              {gdprErrorMsg && (
                <div className="p-4 bg-red-50 border border-red-100 text-red-800 rounded-2xl flex items-start gap-2.5 text-xs font-bold">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <p>{gdprErrorMsg}</p>
                </div>
              )}

              {/* Portability JSON Viewer */}
              {gdprExportResult && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center bg-slate-100 px-4 py-2.5 rounded-t-xl border-b border-slate-200">
                    <span className="text-[9px] font-black uppercase text-slate-500">PAQUETE DE PORTABILIDAD GENERADO (ARTÍCULOS 15/20 GDPR)</span>
                    <button 
                      onClick={() => {
                        const blob = new Blob([JSON.stringify(gdprExportResult, null, 2)], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `portability-export-${gdprEmail}.json`;
                        a.click();
                      }}
                      className="text-red-600 hover:text-slate-900 font-bold text-[9px] uppercase tracking-widest flex items-center gap-1"
                    >
                      Descargar archivo .json
                    </button>
                  </div>
                  <pre className="p-5 bg-slate-900 border border-slate-950 text-emerald-400 font-mono text-[10px] rounded-b-2xl overflow-x-auto max-h-60 leading-relaxed">
                    {JSON.stringify(gdprExportResult, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            {/* GDPR Sidebar indicators */}
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
              <h3 className="text-xs font-black text-slate-950 uppercase tracking-widest border-b border-slate-100 pb-4">
                Métricas de Consentimiento
              </h3>

              <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">CÓDIGO DE VISAGISMO AI</span>
                  <div className="flex justify-between items-baseline">
                    <span className="text-2xl font-black text-slate-900">100%</span>
                    <span className="text-[10px] text-emerald-600 font-black uppercase">Obligatorio</span>
                  </div>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-1.5">
                    Nadie procesa imágenes faciales en el Espejo de IA sin aceptar previamente las Cláusulas de Visagismo Médico de la plataforma.
                  </p>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">RETENCIÓN DE IMÁGENES</span>
                  <div className="flex justify-between items-baseline">
                    <span className="text-2xl font-black text-slate-900">0%</span>
                    <span className="text-[10px] text-red-600 font-black uppercase">Cero Almacenamiento</span>
                  </div>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-1.5">
                    Las imágenes se eliminan permanentemente de la memoria del servidor de la nube inmediatamente después de procesarse con Gemini AI.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: STRIPE BILLING & FINANCE */}
        {activeTab === 'billing' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start animate-fadeIn">
            <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <h3 className="text-sm font-black text-slate-950 uppercase tracking-tight flex items-center gap-2">
                  <Landmark className="w-5 h-5 text-red-600" />
                  Stripe Webhook Monitoring & SaaS Billing Audits
                </h3>
                <span className="text-[9px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full font-black uppercase tracking-wider">
                  STRIPE GATEWAY ACTIVE
                </span>
              </div>

              {/* Simulated stripe hooks timeline */}
              <div className="space-y-4">
                <p className="text-xs text-slate-500 font-medium">Historial de Transacciones y Eventos en Vivo de Stripe en la Red Multitenant:</p>
                
                <div className="border border-slate-100 rounded-2xl divide-y divide-slate-50 overflow-hidden">
                  <div className="p-4 flex justify-between items-center bg-slate-50 hover:bg-slate-100/50 transition-colors">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        <span className="font-mono text-[10px] font-bold uppercase text-slate-800">invoice.payment_succeeded</span>
                      </div>
                      <p className="text-xs font-black text-slate-900 uppercase mt-1">Barbería Imperio - Plan Launch Pro ($1.00 USD)</p>
                    </div>
                    <span className="text-[9px] font-mono text-slate-400">Hace 3 minutos</span>
                  </div>

                  <div className="p-4 flex justify-between items-center hover:bg-slate-100/50 transition-colors">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        <span className="font-mono text-[10px] font-bold uppercase text-slate-800">customer.subscription.created</span>
                      </div>
                      <p className="text-xs font-black text-slate-900 uppercase mt-1">Retro Gentlemens Club - Plan Launch Pro ($1.00 USD)</p>
                    </div>
                    <span className="text-[9px] font-mono text-slate-400">Hace 4 horas</span>
                  </div>

                  <div className="p-4 flex justify-between items-center hover:bg-slate-100/50 transition-colors">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                        <span className="font-mono text-[10px] font-bold uppercase text-slate-800">customer.created</span>
                      </div>
                      <p className="text-xs font-black text-slate-900 uppercase mt-1">Creado ID: cus_N9Hj38ds921 en Stripe Inc.</p>
                    </div>
                    <span className="text-[9px] font-mono text-slate-400">Hace 1 día</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 p-8 rounded-3xl text-white space-y-6">
              <h3 className="text-xs font-black text-red-400 uppercase tracking-widest border-b border-slate-850 pb-4">
                Proyecciones de MRR (SaaS)
              </h3>

              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-slate-850 pb-3">
                  <span className="text-xs text-slate-400 font-bold uppercase">Meta del Q3</span>
                  <span className="text-xs font-black uppercase text-red-500">$50,000 USD</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-850 pb-3">
                  <span className="text-xs text-slate-400 font-bold uppercase">Actual</span>
                  <span className="text-xs font-black uppercase">${stats.monthlyRecurringRevenue.toLocaleString()} USD</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400 font-bold uppercase">Crecimiento Requerido</span>
                  <span className="text-xs font-black uppercase text-emerald-400">+12% anual</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5.5: PAYPAL & SUBSCRIPTIONS MANAGEMENT */}
        {activeTab === 'subscriptions' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start animate-fadeIn">
            <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-lg font-black text-slate-950 uppercase tracking-tight">
                    Gestor del Sistema de Suscripciones (Freemium & Launch Pro)
                  </h3>
                  <p className="text-xs text-slate-500 font-bold">
                    Ajusta precios, promociones, límites del plan Free y la integración con PayPal.
                  </p>
                </div>
                <span className="bg-amber-100 text-amber-900 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                  PayPal Active Provider
                </span>
              </div>

              {/* Quick Admin Settings Form */}
              <div className="space-y-4 bg-slate-50 p-6 rounded-2xl border border-slate-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-xs font-black uppercase text-slate-700">Precio Launch Pro (USD)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={sysPricing?.launchProPriceUsd ?? 1.00}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 1.00;
                        setSysPricing(prev => prev ? { ...prev, launchProPriceUsd: val } : null);
                      }}
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-sm text-slate-900 focus:ring-2 focus:ring-amber-500"
                    />
                    <p className="text-[10px] text-slate-500 font-bold">Configurable sin cambiar código.</p>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-black uppercase text-slate-700">Estado Promoción</label>
                    <select
                      value={sysPricing?.isPromoActive ? "true" : "false"}
                      onChange={(e) => {
                        const val = e.target.value === "true";
                        setSysPricing(prev => prev ? { ...prev, isPromoActive: val } : null);
                      }}
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-sm text-slate-900 focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="true">Promoción de Lanzamiento Activa</option>
                      <option value="false">Precio Regular</option>
                    </select>
                    <p className="text-[10px] text-slate-500 font-bold">Muestra aviso de precio temporal.</p>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-black uppercase text-slate-700">Límite Análisis IA (Free)</label>
                    <input
                      type="number"
                      value={sysPricing?.freeLimits.monthlyAiAnalyses ?? 10}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10) || 10;
                        setSysPricing(prev => prev ? {
                          ...prev,
                          freeLimits: { ...prev.freeLimits, monthlyAiAnalyses: val }
                        } : null);
                      }}
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-sm text-slate-900 focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-black uppercase text-slate-700">Límite Espejo Virtual (Free)</label>
                    <input
                      type="number"
                      value={sysPricing?.freeLimits.monthlyMirrorGenerations ?? 5}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10) || 5;
                        setSysPricing(prev => prev ? {
                          ...prev,
                          freeLimits: { ...prev.freeLimits, monthlyMirrorGenerations: val }
                        } : null);
                      }}
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-sm text-slate-900 focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <label className="block text-xs font-black uppercase text-slate-700">Mensaje del Cartel Promocional</label>
                  <input
                    type="text"
                    value={sysPricing?.promoNotice ?? 'Precio especial de lanzamiento. El precio aumentará cuando finalice la promoción.'}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSysPricing(prev => prev ? { ...prev, promoNotice: val } : null);
                    }}
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-sm text-slate-900 focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                {pricingMsg && (
                  <div className="p-3 rounded-xl bg-slate-900 text-white font-bold text-xs text-center">
                    {pricingMsg}
                  </div>
                )}

                <button
                  disabled={isSavingPricing}
                  onClick={handleSavePricing}
                  className="w-full bg-slate-950 hover:bg-slate-800 text-white font-black py-3.5 rounded-xl uppercase text-xs tracking-widest transition-all shadow-md flex items-center justify-center gap-2"
                >
                  {isSavingPricing ? (
                    <span>Guardando cambios...</span>
                  ) : (
                    <span>Guardar Configuración en Firestore</span>
                  )}
                </button>
              </div>

              {/* Status Overview */}
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                  <span className="text-[10px] font-black text-emerald-800 uppercase tracking-widest block mb-1">SUSCRIPTORES PRO</span>
                  <p className="text-2xl font-black text-emerald-950">142</p>
                  <p className="text-[9px] font-bold text-emerald-600 uppercase">Launch Pro ($1.00/mes)</p>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">USUARIOS FREE</span>
                  <p className="text-2xl font-black text-slate-900">1,280</p>
                  <p className="text-[9px] font-bold text-slate-500 uppercase">Potencial de Conversión</p>
                </div>

                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                  <span className="text-[10px] font-black text-amber-800 uppercase tracking-widest block mb-1">PROVEEDOR PRINCIPAL</span>
                  <p className="text-2xl font-black text-amber-950">PayPal</p>
                  <p className="text-[9px] font-bold text-amber-700 uppercase">Stripe Ready Architecture</p>
                </div>
              </div>
            </div>

            {/* Architecture Info Box */}
            <div className="bg-slate-900 p-8 rounded-3xl text-white space-y-6">
              <h3 className="text-xs font-black text-amber-400 uppercase tracking-widest border-b border-slate-800 pb-4">
                Arquitectura de Pago Desacoplada
              </h3>

              <div className="space-y-4 text-xs font-medium text-slate-300">
                <p>
                  El sistema utiliza una interfaz unificada <code className="text-amber-300">IPaymentProvider</code> que abstrae las llamadas a PayPal REST API.
                </p>
                <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 space-y-1">
                  <p className="font-bold text-white text-[11px]">Proveedores Integrados:</p>
                  <ul className="list-disc list-inside text-[11px] text-slate-400 font-mono">
                    <li>PayPalProvider (Activo)</li>
                    <li>StripeProvider (Ready)</li>
                  </ul>
                </div>
                <p className="text-[10px] text-slate-400">
                  Para activar Stripe o Mercado Pago en el futuro, sólo debes registrar la clase proveedora sin alterar las vistas ni las funciones de control de límites.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: AI METRICS & PERFORMANCE */}
        {activeTab === 'ai_metrics' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start animate-fadeIn">
            <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <h3 className="text-sm font-black text-slate-950 uppercase tracking-tight flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-red-600" />
                  Métricas de Rendimiento y Costo de Gemini AI
                </h3>
                <span className="text-[9px] bg-red-50 text-red-600 px-2 py-0.5 rounded-full font-black uppercase tracking-wider">
                  MODEL: GEMINI 1.5 FLASH (LIVE)
                </span>
              </div>

              {/* Simulated performance numbers */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                  <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest block mb-1">LATENCIA DE RESPUESTA</span>
                  <p className="text-xl font-black text-slate-950">1.82s</p>
                  <p className="text-[8px] text-emerald-600 font-bold uppercase tracking-wider mt-1">99% de Disponibilidad</p>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                  <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest block mb-1">PROMEDIO DE TOKENS</span>
                  <p className="text-xl font-black text-slate-950">1,245 / req</p>
                  <p className="text-[8px] text-indigo-600 font-bold uppercase tracking-wider mt-1">Prompt + Response</p>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                  <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest block mb-1">EFICIENCIA DE CACHÉ</span>
                  <p className="text-xl font-black text-slate-950">34.8%</p>
                  <p className="text-[8px] text-emerald-600 font-bold uppercase tracking-wider mt-1">Análisis Memorizados</p>
                </div>
              </div>

              <div className="p-4 bg-red-50 border border-red-100 text-red-900 rounded-2xl flex items-start gap-3">
                <Info className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <p className="text-xs font-bold leading-normal">
                  Optimizaciones de tokenización activas: Las directrices del sistema de IA están fuertemente comprimidas e implementan caches contextuales persistentes (Context Caching), reduciendo los costos de API de entrada en un 40%.
                </p>
              </div>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
              <h3 className="text-xs font-black text-slate-950 uppercase tracking-widest border-b border-slate-100 pb-4">
                Monitoreo de Costos (Est.)
              </h3>

              <div className="space-y-4">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-600 uppercase">Costo total este mes:</span>
                  <span className="font-black text-slate-900">$2.40 USD</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-600 uppercase">Costo promedio por barbería:</span>
                  <span className="font-black text-slate-900">$0.02 USD</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- RENDERING SHOP OWNER DASHBOARD ---
  const { stats, dailyActivity, recentActivity } = data;

  const cleanServiceName = (name: string) => {
    const words = name.split(' ');
    if (words[0].toLowerCase() === 'el' || words[0].toLowerCase() === 'la' || words[0].toLowerCase() === 'un') {
      return words.slice(0, 2).join(' ');
    }
    return words[0];
  };

  return (
    <div className="w-full bg-slate-50 p-4 sm:p-6 lg:p-10 space-y-10 min-h-full">
      {/* Header Premium */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="relative">
          <h1 className="text-4xl font-black text-slate-950 uppercase tracking-tighter leading-none mb-3">
            Panel Central <span className="text-red-600 italic">Barber AI</span>
          </h1>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.3em]">
            Resumen de analíticas para {currentShop.name}
          </p>
        </div>
        <div className="flex gap-2">
          <span className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500">
            Hoy: {new Date().toLocaleDateString()}
          </span>
          <span className="px-4 py-2 text-white bg-red-600 shadow-red-200 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg animate-pulse">
            En Línea
          </span>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="flex overflow-x-auto pb-4 gap-6 scrollbar-none -mx-4 px-4 sm:-mx-6 sm:px-6 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:gap-6 scroll-smooth snap-x">
        <div className="flex-shrink-0 w-[240px] sm:w-auto snap-center">
          <StatCard 
            title="Análisis IA" 
            value={stats.totalAnalyses} 
            icon={<ChatIcon className="w-5 h-5 text-red-600" />} 
            change="+12% de crecimiento"
            changeType="increase"
          />
        </div>
        <div className="flex-shrink-0 w-[240px] sm:w-auto snap-center">
          <StatCard 
            title="Reservas" 
            value={stats.totalBookings} 
            icon={<BookingsIcon className="w-5 h-5 text-red-600" />} 
            change="+8% vs mes anterior"
            changeType="increase"
          />
        </div>
        <div className="flex-shrink-0 w-[240px] sm:w-auto snap-center">
          <StatCard 
            title="Top Servicio" 
            value={cleanServiceName(stats.mostPopularService)} 
            icon={<ShopIcon className="w-5 h-5 text-red-600" />}
          />
        </div>
        <div className="flex-shrink-0 w-[240px] sm:w-auto snap-center">
          <StatCard 
            title="Ingresos Estimados" 
            value={`$${stats.monthlyRevenue.toLocaleString()}`} 
            icon={<BillingIcon className="w-5 h-5 text-red-600" />}
            change="-2.5% de ajuste"
            changeType="decrease"
          />
        </div>
      </div>
      
      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-8 flex items-center gap-2">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
            Tráfico de Estilismo (7 días)
          </h3>
          <BarChart 
            data={dailyActivity} 
            title=""
            category="day"
            value="Analyses"
          />
        </div>

        <div className="space-y-8">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-6 border-b border-slate-50 pb-4">Actividad en Vivo</h3>
            <ul className="space-y-5">
              {recentActivity.slice(0, 6).map(activity => (
                <li key={activity.id} className="flex items-center space-x-4 group cursor-default">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm border border-slate-100 bg-red-50 text-red-600">
                    {activity.icon === 'sparkles' ? <MirrorIcon className="w-5 h-5" /> : <CalendarIcon className="w-5 h-5" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-black text-slate-900 uppercase tracking-tight group-hover:text-red-600 transition-colors">
                      {activity.description}
                    </p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                      {activity.time}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-slate-900 p-8 rounded-3xl shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3 bg-red-600 text-white font-black text-[8px] uppercase tracking-widest rounded-bl-xl">Insight IA</div>
            <h3 className="text-xs font-black text-red-400 uppercase tracking-widest mb-4">Servicio Estrella</h3>
            <p className="text-2xl font-black text-white uppercase tracking-tighter mb-2">{stats.mostPopularService}</p>
            <p className="text-xs text-slate-400 font-medium">Este servicio genera el 65% de tus conversiones tras un análisis de espejo virtual.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminView;
