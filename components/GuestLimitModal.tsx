import React from 'react';

interface GuestLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinueGoogle: () => void;
  onContinueEmail: () => void;
}

const GoogleIcon = () => (
  <svg className="w-5 h-5 mr-3" viewBox="0 0 48 48">
    <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"></path>
    <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z"></path>
    <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.222 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"></path>
    <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C39.986 36.657 44 30.836 44 24c0-1.341-.138-2.65-.389-3.917z"></path>
  </svg>
);

const GuestLimitModal: React.FC<GuestLimitModalProps> = ({
  isOpen,
  onClose,
  onContinueGoogle,
  onContinueEmail,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-[200] flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-[32px] p-8 md:p-10 w-full max-w-lg shadow-2xl relative border border-slate-100 flex flex-col items-center text-center animate-zoom-in">
        {/* Decorative elements */}
        <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center text-red-600 mb-6 shadow-inner">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>

        <h3 className="text-2xl md:text-3xl font-black text-slate-900 leading-tight uppercase tracking-tight mb-3">
          ¿Te gustó el resultado?
        </h3>
        <p className="text-slate-500 font-extrabold text-xs uppercase tracking-widest mb-6">
          Crea una cuenta gratuita para seguir utilizando Barber Shop AI.
        </p>
        
        <p className="text-slate-500 text-sm leading-relaxed mb-8 font-medium">
          Has alcanzado el límite de 3 simulaciones en el modo invitado. Registra tu cuenta en segundos para disfrutar de simulaciones ilimitadas, guardar tus estilos favoritos y agendar citas en tu barbería.
        </p>

        <div className="w-full flex flex-col space-y-3.5 mb-6">
          <button
            onClick={onContinueGoogle}
            className="w-full flex items-center justify-center py-4 px-5 border-2 border-slate-100 rounded-2xl shadow-sm bg-white text-[11px] font-black text-slate-950 uppercase tracking-[0.15em] hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-[0.98]"
          >
            <GoogleIcon />
            Continuar con Google
          </button>
          
          <button
            onClick={onContinueEmail}
            className="w-full flex items-center justify-center py-4 px-5 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-2xl text-[11px] uppercase tracking-[0.15em] transition-all shadow-lg active:scale-[0.98]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Continuar con Email
          </button>
        </div>

        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 font-black text-[10px] uppercase tracking-widest focus:outline-none transition-colors"
        >
          Volver al Inicio
        </button>
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out forwards;
        }
        @keyframes zoom-in {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-zoom-in {
          animation: zoom-in 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
      `}</style>
    </div>
  );
};

export default GuestLimitModal;
