import React, { useState, useEffect } from 'react';
import { ShieldCheck, X, FileText, Check } from 'lucide-react';
import { enterpriseService } from '../services/enterpriseService';

export const GDPRBanner: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  
  // Consent options
  const [aiAnalysis, setAiAnalysis] = useState(true);
  const [cookies, setCookies] = useState(true);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    const hasConsented = localStorage.getItem('gdpr_consent_given');
    if (!hasConsented) {
      // Delay presentation slightly for maximum elegance
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptAll = async () => {
    localStorage.setItem('gdpr_consent_given', 'all');
    localStorage.setItem('consent_ai_facial', 'true');
    localStorage.setItem('consent_cookies', 'true');
    localStorage.setItem('consent_marketing', 'true');

    // Persist logs in system database
    await enterpriseService.recordUserConsent({
      userId: 'guest_user',
      email: 'anon@virtus.com',
      consentType: 'AI_FACIAL_ANALYSIS',
      accepted: true
    });
    await enterpriseService.recordUserConsent({
      userId: 'guest_user',
      email: 'anon@virtus.com',
      consentType: 'COOKIE_POLICY',
      accepted: true
    });

    setIsVisible(false);
  };

  const handleSavePreferences = async () => {
    localStorage.setItem('gdpr_consent_given', 'custom');
    localStorage.setItem('consent_ai_facial', aiAnalysis ? 'true' : 'false');
    localStorage.setItem('consent_cookies', cookies ? 'true' : 'false');
    localStorage.setItem('consent_marketing', marketing ? 'true' : 'false');

    await enterpriseService.recordUserConsent({
      userId: 'guest_user',
      email: 'anon@virtus.com',
      consentType: 'AI_FACIAL_ANALYSIS',
      accepted: aiAnalysis
    });
    await enterpriseService.recordUserConsent({
      userId: 'guest_user',
      email: 'anon@virtus.com',
      consentType: 'COOKIE_POLICY',
      accepted: cookies
    });

    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem('gdpr_consent_given', 'declined');
    localStorage.setItem('consent_ai_facial', 'false');
    localStorage.setItem('consent_cookies', 'false');
    localStorage.setItem('consent_marketing', 'false');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 left-6 max-w-[420px] bg-slate-950 text-white rounded-3xl p-6 shadow-2xl border border-slate-800 z-50 animate-fadeIn space-y-4">
      {/* Header banner */}
      <div className="flex justify-between items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-red-600/15 text-red-500 border border-red-500/10 flex items-center justify-center shrink-0">
          <ShieldCheck className="w-5 h-5 animate-pulse" />
        </div>
        <div className="flex-1">
          <span className="text-[8px] font-black uppercase text-red-500 tracking-widest block mb-0.5">SEGURIDAD Y PRIVACIDAD</span>
          <h4 className="text-xs font-black uppercase tracking-tight">Consentimiento de Datos (GDPR / CCPA)</h4>
        </div>
        <button 
          onClick={handleDecline}
          className="p-1 rounded-full text-slate-500 hover:text-white hover:bg-slate-900 transition-all"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {!showPreferences ? (
        <>
          <p className="text-[11px] text-slate-300 font-medium leading-relaxed">
            Utilizamos Inteligencia Artificial avanzada (Gemini API) para procesar proporciones anatómicas faciales en tiempo real. Al aceptar, consientes el escaneo de visagismo y nuestra política de cookies esenciales. No guardamos tus imágenes sin tu permiso explícito.
          </p>
          <div className="flex gap-2 text-[9px] font-black uppercase tracking-widest pt-2">
            <button
              onClick={handleAcceptAll}
              className="flex-1 bg-red-600 hover:bg-white hover:text-slate-950 text-white py-2.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-1"
            >
              <Check className="w-3.5 h-3.5" />
              Aceptar Todo
            </button>
            <button
              onClick={() => setShowPreferences(true)}
              className="flex-1 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 py-2.5 rounded-xl transition-all"
            >
              Configurar
            </button>
            <button
              onClick={handleDecline}
              className="text-slate-500 hover:text-white px-2 py-2.5 transition-all"
            >
              Rechazar
            </button>
          </div>
        </>
      ) : (
        <div className="space-y-4 pt-2 animate-fadeIn">
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Preferencias de Privacidad</p>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-slate-900 rounded-xl border border-slate-850">
              <div>
                <span className="text-[10px] font-black uppercase text-white block">Escaneo Visajismo AI</span>
                <span className="text-[8px] text-slate-400 font-medium">Gemini AI mapeo de proporciones faciales</span>
              </div>
              <input 
                type="checkbox" 
                checked={aiAnalysis} 
                onChange={(e) => setAiAnalysis(e.target.checked)}
                className="w-4 h-4 text-red-600 accent-red-600 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-900 rounded-xl border border-slate-850">
              <div>
                <span className="text-[10px] font-black uppercase text-white block">Cookies de Sesión</span>
                <span className="text-[8px] text-slate-400 font-medium">Guardar sesión de barbería localmente</span>
              </div>
              <input 
                type="checkbox" 
                checked={cookies} 
                onChange={(e) => setCookies(e.target.checked)}
                className="w-4 h-4 text-red-600 accent-red-600 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-900 rounded-xl border border-slate-850">
              <div>
                <span className="text-[10px] font-black uppercase text-white block">Boletín e Insights</span>
                <span className="text-[8px] text-slate-400 font-medium">Recomendaciones de estilo personalizadas</span>
              </div>
              <input 
                type="checkbox" 
                checked={marketing} 
                onChange={(e) => setMarketing(e.target.checked)}
                className="w-4 h-4 text-red-600 accent-red-600 cursor-pointer"
              />
            </div>
          </div>

          <div className="flex gap-2 text-[9px] font-black uppercase tracking-widest pt-2">
            <button
              onClick={handleSavePreferences}
              className="flex-1 bg-red-600 hover:bg-white hover:text-slate-950 text-white py-2.5 rounded-xl transition-all shadow-md"
            >
              Guardar Preferencias
            </button>
            <button
              onClick={() => setShowPreferences(false)}
              className="bg-transparent text-slate-400 hover:text-white px-3 py-2.5 transition-all"
            >
              Atrás
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
