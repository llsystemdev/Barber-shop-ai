
import React from 'react';
import { BarberShop, User } from '../types';
import { ChatIcon, MirrorIcon, CalendarIcon, BookingsIcon, ShopIcon, BillingIcon, DashboardIcon, LogoutIcon, BriefcaseIcon } from '../assets/icons';

type ActiveView = 'chat' | 'mirror' | 'booking' | 'bookingsList' | 'shopProfile' | 'billing' | 'admin' | 'platformAdmin';

interface SidebarProps {
  currentUser?: User | null;
  currentShop?: BarberShop;
  shops?: BarberShop[];
  onSelectShop?: (shop: BarberShop) => void;
  onResetChat: () => void;
  activeView: ActiveView;
  onNavigate: (view: ActiveView) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onLogout: () => void;
  onGoHome: () => void;
  onRegister?: () => void;
}

const NavItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ icon, label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all duration-200 ${
      isActive
        ? 'bg-red-700 text-white shadow-lg scale-[1.02]'
        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
    }`}
  >
    <span className={`${isActive ? 'text-white' : 'text-slate-400'}`}>{icon}</span>
    <span className="font-bold">{label}</span>
  </button>
);

const Sidebar: React.FC<SidebarProps> = ({
  currentUser,
  currentShop,
  shops,
  onSelectShop,
  onResetChat,
  activeView,
  onNavigate,
  isOpen,
  setIsOpen,
  onLogout,
  onGoHome,
  onRegister,
}) => {
  const isPlatformAdmin = currentUser?.role === 'platformAdmin';
  const isGuest = currentUser?.isGuest === true;

  const shopOwnerNav = [
    { view: 'admin', label: 'Dashboard Barbería', icon: <DashboardIcon className="w-6 h-6" /> },
    { view: 'chat', label: 'Chat de Estilismo', icon: <ChatIcon className="w-6 h-6" /> },
    { view: 'mirror', label: 'Espejo Virtual', icon: <MirrorIcon className="w-6 h-6" /> },
    { view: 'booking', label: 'Reservar Cita', icon: <CalendarIcon className="w-6 h-6" /> },
    { view: 'bookingsList', label: 'Mis Reservas', icon: <BookingsIcon className="w-6 h-6" /> },
    { view: 'shopProfile', label: 'Perfil de la Barbería', icon: <ShopIcon className="w-6 h-6" /> },
    { view: 'billing', label: 'Facturación y Plan', icon: <BillingIcon className="w-6 h-6" /> },
  ] as const;

  const guestNav = [
    { view: 'mirror', label: 'Espejo Virtual', icon: <MirrorIcon className="w-6 h-6" /> },
    { view: 'chat', label: 'Chat de Estilismo', icon: <ChatIcon className="w-6 h-6" /> },
  ] as const;

  const platformAdminNav = [
    { view: 'platformAdmin', label: 'Dashboard Plataforma', icon: <BriefcaseIcon className="w-6 h-6" /> },
  ] as const;

  const navItems = isGuest
    ? guestNav
    : isPlatformAdmin 
      ? [
          ...platformAdminNav,
          ...shopOwnerNav
        ]
      : shopOwnerNav;

  return (
    <aside
      className={`
        w-80 bg-slate-950 text-white flex flex-col h-full p-4 flex-shrink-0
        fixed top-0 left-0 z-40
        lg:relative lg:translate-x-0
        transition-transform duration-300 ease-in-out border-r border-slate-800
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}
    >
      <div className="flex justify-between items-center mb-8 px-2">
        <button onClick={onGoHome} className="flex items-center space-x-2.5 group focus:outline-none focus:ring-2 focus:ring-red-500 rounded-xl px-1 py-0.5 transition-all">
          <div className="w-9 h-9 rounded-xl overflow-hidden bg-slate-900 flex items-center justify-center shadow-md shadow-slate-950/50 group-hover:scale-105 transition-transform duration-200 border border-slate-800">
            <img 
              src="https://firebasestorage.googleapis.com/v0/b/barber-sho-ai.firebasestorage.app/o/admin-things%2Flogo%20barber-shop-ai.png?alt=media&token=c4c811d7-16ac-471b-b23d-c2936f2fba85" 
              alt="Logo" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <span className="text-xl font-black tracking-widest text-white uppercase transition-colors duration-200">
            BARBER<span className="text-red-500 italic font-extrabold group-hover:text-white transition-colors duration-200">AI</span>
          </span>
        </button>
        <button 
            onClick={() => setIsOpen(false)} 
            className="p-1 rounded-full text-slate-400 hover:bg-slate-800 lg:hidden"
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
        </button>
      </div>

      {isPlatformAdmin && (
        <div className="mb-4 p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1.5 mx-1">
          <label className="block text-[8px] font-black uppercase text-red-500 tracking-widest">
            💈 Barbería Seleccionada:
          </label>
          <select
            value={currentShop?.id}
            onChange={(e) => {
              const selectedShop = (shops || []).find(s => s.id === e.target.value);
              if (selectedShop) {
                onSelectShop?.(selectedShop);
              }
            }}
            className="w-full bg-slate-950 text-white font-bold text-[11px] rounded-lg p-2 outline-none border border-slate-850 focus:border-red-600 transition-colors cursor-pointer"
          >
            {(shops || []).map(s => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <nav className="flex-1 flex flex-col space-y-1">
        {navItems.map(item => (
            <NavItem
                key={item.view}
                icon={item.icon}
                label={item.label}
                isActive={activeView === item.view}
                onClick={() => onNavigate(item.view)}
            />
        ))}
      </nav>

      <div className="mt-auto pt-4 border-t border-slate-800 space-y-4">
        {!isPlatformAdmin && currentShop && (
             <button
              onClick={onResetChat}
              className="w-full flex items-center justify-center space-x-2 p-3 rounded-lg text-slate-200 hover:bg-slate-800 font-bold transition-colors border border-transparent hover:border-slate-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              <span>Nuevo Chat</span>
            </button>
        )}
        
        {currentUser && (
          isGuest ? (
            <button
              onClick={onRegister}
              className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-black py-3.5 px-4 rounded-xl shadow-lg shadow-red-600/25 transition-all text-xs uppercase tracking-wider active:scale-95"
            >
              <span>Crear Cuenta Gratis</span>
            </button>
          ) : (
            <button
              onClick={onLogout}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left text-slate-400 hover:bg-red-950 hover:text-red-400 font-bold transition-all"
            >
              <LogoutIcon className="w-6 h-6" />
              <span>Cerrar Sesión</span>
            </button>
          )
        )}
        
        <footer className="pt-4 text-center text-[10px] text-slate-500 uppercase tracking-widest font-medium">
          <p>{currentShop?.name || 'Barber Shop AI'}</p>
          <p className="mt-1 opacity-50">SISTEMA DE GESTIÓN INTELIGENTE</p>
        </footer>
      </div>
    </aside>
  );
};

export default Sidebar;
