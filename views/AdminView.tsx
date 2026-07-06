
import React, { useState, useEffect } from 'react';
import { BarberShop, Booking, AdminDashboardData, User as AppUser, PlatformDashboardData } from '../types';
import { getAdminDashboardData, getPlatformDashboardData } from '../services/adminDataService';
import StatCard from '../components/StatCard';
import BarChart from '../components/BarChart';
import { MirrorIcon, CalendarIcon, BookingsIcon, ShopIcon, ChatIcon, BillingIcon } from '../assets/icons';

interface AdminViewProps {
  currentUser: AppUser | null;
  currentShop: BarberShop;
  bookings: Booking[];
  shops: BarberShop[];
  viewMode?: 'platform' | 'shop';
  onSelectShop?: (shop: BarberShop) => void;
}

const AdminView: React.FC<AdminViewProps> = ({ currentUser, currentShop, bookings, shops, viewMode, onSelectShop }) => {
  const [logs, setLogs] = useState<Array<{ time: string, level: 'success' | 'info' | 'warn', code: string, message: string }>>([]);

  const isPlatformAdmin = viewMode === 'platform' || (viewMode === undefined && currentUser?.role === 'platformAdmin');
  const hasRealData = bookings.length > 0;

  // Simulate platform logs on initialization
  useEffect(() => {
    const baseLogs = [
      { time: '10:42:15', level: 'success', code: 'API_VISAGISMO_OK', message: 'Servidor offline procesó face_scan_39.jpg exitosamente.' },
      { time: '10:45:30', level: 'info', code: 'NOTIFICATION_SENT', message: 'Recordatorio enviado a Carlos M. vía WhatsApp.' },
      { time: '10:50:02', level: 'success', code: 'NEW_REGISTRATION', message: "Barbería 'Imperio Barber' se registró en Plan Profesional." },
      { time: '10:54:12', level: 'warn', code: 'LIMIT_CHECK', message: 'La barbería "The Vintage Club" alcanzó el 85% de límite de análisis mensual.' },
      { time: '10:58:45', level: 'info', code: 'CACHE_SYNC', message: 'Sincronización periódica de caché local offline completada.' }
    ] as const;
    setLogs(Array.from(baseLogs));
  }, []);

  const data = getAdminDashboardData(currentShop, bookings);
  const platformData = getPlatformDashboardData(shops, bookings);

  const ActivityIcon: React.FC<{ icon: 'sparkles' | 'calendar' }> = ({ icon }) => {
    const baseClasses = "w-10 h-10 rounded-xl flex items-center justify-center shadow-sm border border-slate-100";
    if (icon === 'sparkles') {
      return (
        <div className={`${baseClasses} bg-red-50 text-red-600`}>
          <MirrorIcon className="w-5 h-5" />
        </div>
      );
    }
    return (
      <div className={`${baseClasses} bg-blue-50 text-blue-600`}>
        <CalendarIcon className="w-5 h-5" />
      </div>
    );
  };

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
    const { stats, planDistribution, recentlyJoined } = platformData;
    
    return (
      <div className="w-full bg-slate-50 p-6 lg:p-10 space-y-10 min-h-full">
        {/* Header Superior SaaS */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="inline-flex items-center space-x-2 bg-red-500/10 border border-red-500/20 text-red-600 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest mb-3">
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
            <span className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500">
              Servidor: Operacional
            </span>
            <span className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg">
              Suscritos: {stats.totalShops} Barberías
            </span>
          </div>
        </div>

        {/* SaaS Global Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            title="Ingresos Recurrentes (MRR)" 
            value={`$${stats.monthlyRecurringRevenue.toLocaleString()}`} 
            icon={<BillingIcon className="w-5 h-5 text-red-600" />} 
            change="+18.4% este mes"
            changeType="increase"
          />
          <StatCard 
            title="Barberías Registradas" 
            value={stats.totalShops} 
            icon={<ShopIcon className="w-5 h-5 text-red-600" />} 
            change="+3 nuevos salones"
            changeType="increase"
          />
          <StatCard 
            title="Consultas de IA Totales" 
            value={stats.totalPlatformAnalyses} 
            icon={<ChatIcon className="w-5 h-5 text-red-600" />} 
            change="+42% de uso en la red"
            changeType="increase"
          />
          <StatCard 
            title="Reservas Totales" 
            value={stats.totalPlatformBookings} 
            icon={<BookingsIcon className="w-5 h-5 text-red-600" />} 
            change="+9.5% de efectividad"
            changeType="increase"
          />
        </div>

        {/* Layout de Contenido */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Barberías Registradas Recientemente */}
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
                          shop.plan === 'Profesional' ? 'bg-red-50 text-red-600' :
                          shop.plan === 'Básico' ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {shop.plan}
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

          {/* Distribución de Planes */}
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

        {/* Logs del Sistema en Vivo */}
        <div className="bg-slate-900 p-8 rounded-3xl shadow-2xl space-y-6">
          <div className="flex justify-between items-center border-b border-slate-800 pb-4">
            <h3 className="text-xs font-black text-red-500 uppercase tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 bg-red-600 rounded-full animate-ping"></span>
              Consola de Registro de la Plataforma (Live Logs)
            </h3>
            <span className="text-[9px] font-mono text-slate-500">ESTADO: LISTO</span>
          </div>
          
          <div className="font-mono text-xs text-slate-300 space-y-3 max-h-60 overflow-y-auto bg-slate-950 p-6 rounded-2xl border border-slate-850">
            {logs.map((log, index) => (
              <div key={index} className="flex items-start space-x-3 hover:bg-slate-900/50 p-1 rounded transition-colors">
                <span className="text-slate-600">[{log.time}]</span>
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                  log.level === 'success' ? 'bg-emerald-500/10 text-emerald-400' :
                  log.level === 'warn' ? 'bg-amber-500/10 text-amber-400' : 'bg-blue-500/10 text-blue-400'
                }`}>
                  {log.code}
                </span>
                <span className="flex-1 text-slate-300">{log.message}</span>
              </div>
            ))}
          </div>
        </div>
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
    <div className="w-full bg-slate-50 p-6 lg:p-10 space-y-10 min-h-full">
      {/* Header Premium */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="relative">
          {!hasRealData && (
            <div className="absolute -top-6 left-0 bg-amber-100 text-amber-700 px-3 py-0.5 rounded-full border border-amber-200 text-[8px] font-black uppercase tracking-widest animate-pulse">
              ⚠️ Modo Simulación (Sin datos reales)
            </div>
          )}
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
          <span className={`px-4 py-2 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg ${hasRealData ? 'bg-red-600 shadow-red-200' : 'bg-slate-400 shadow-slate-200'}`}>
            {hasRealData ? 'En Línea' : 'Demo'}
          </span>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Análisis IA" 
          value={stats.totalAnalyses} 
          icon={<ChatIcon className="w-5 h-5 text-red-600" />} 
          change="+12% de crecimiento"
          changeType="increase"
        />
        <StatCard 
          title="Reservas" 
          value={stats.totalBookings} 
          icon={<BookingsIcon className="w-5 h-5 text-red-600" />} 
          change="+8% vs mes anterior"
          changeType="increase"
        />
        <StatCard 
          title="Top Servicio" 
          value={cleanServiceName(stats.mostPopularService)} 
          icon={<ShopIcon className="w-5 h-5 text-red-600" />}
        />
        <StatCard 
          title="Ingresos Estimados" 
          value={`$${stats.monthlyRevenue.toLocaleString()}`} 
          icon={<BillingIcon className="w-5 h-5 text-red-600" />}
          change="-2.5% de ajuste"
          changeType="decrease"
        />
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
                  <ActivityIcon icon={activity.icon} />
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
