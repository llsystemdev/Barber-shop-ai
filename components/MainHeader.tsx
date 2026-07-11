
import React from 'react';

interface MainHeaderProps {
  title: string;
  onMenuClick: () => void;
}

const MainHeader: React.FC<MainHeaderProps> = ({ title, onMenuClick }) => {
  return (
    <header className="flex-shrink-0 bg-white shadow-sm z-20 flex items-center justify-between p-5 border-b border-slate-200">
      <div className="flex items-center">
        <button 
          onClick={onMenuClick} 
          className="p-2 mr-4 rounded-lg text-slate-900 bg-slate-100 hover:bg-slate-200 lg:hidden transition-colors"
          aria-label="Open menu"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <h2 className="text-xl font-black text-slate-950 uppercase tracking-widest">{title}</h2>
      </div>
      <div>
        <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-900 border-2 border-red-600 flex items-center justify-center shadow-md">
          <img 
            src="https://firebasestorage.googleapis.com/v0/b/barber-sho-ai.firebasestorage.app/o/admin-things%2Flogo%20barber-shop-ai.png?alt=media&token=c4c811d7-16ac-471b-b23d-c2936f2fba85" 
            alt="Logo" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
      </div>
    </header>
  );
};

export default MainHeader;
