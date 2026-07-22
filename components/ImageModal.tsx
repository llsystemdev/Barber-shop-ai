
import React, { useEffect, useState } from 'react';

interface ImageModalProps {
  imageUrl: string;
  caption: string;
  onClose: () => void;
}

const ImageModal: React.FC<ImageModalProps> = ({ imageUrl, caption, onClose }) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const handleDownload = () => {
    if (!imageUrl) return;
    const link = document.createElement('a');
    link.href = imageUrl;
    const cleanCaption = (caption || 'corte-barber-ai').toLowerCase().replace(/[^a-z0-9]/g, '-');
    link.download = `${cleanCaption}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center z-[100] p-4 sm:p-6 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="image-modal-caption"
    >
      <div 
        className="bg-white rounded-3xl shadow-2xl overflow-hidden max-w-2xl w-full max-h-[92vh] flex flex-col relative animate-zoom-in border border-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div>
            <span className="text-[9px] font-black uppercase tracking-widest text-red-500 block">Vista Previa de Estilo</span>
            <h3 id="image-modal-caption" className="text-sm font-black uppercase tracking-tight text-white">{caption || 'Corte Seleccionado'}</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 hover:text-white hover:bg-red-600 transition-colors flex items-center justify-center font-bold text-sm"
            aria-label="Cerrar vista de imagen"
          >
            ✕
          </button>
        </div>

        {/* Image Container */}
        <div className="relative flex-1 bg-slate-950 flex items-center justify-center overflow-hidden p-2 min-h-[300px] max-h-[60vh]">
          <img
            src={imageUrl}
            alt={caption}
            className="object-contain max-h-[58vh] w-auto h-auto rounded-xl shadow-lg"
          />
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 bg-white border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            onClick={handleCopyLink}
            className="w-full sm:w-auto px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl font-black text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
          >
            <span>📋</span> {copied ? '¡Enlace Copiado!' : 'Copiar Enlace'}
          </button>

          <button
            onClick={handleDownload}
            className="w-full sm:flex-1 py-3.5 px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 transform active:scale-95"
            id="download-image-modal-btn"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>Descargar Imagen</span>
          </button>
        </div>
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
          animation: zoom-in 0.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default ImageModal;
