import React, { useState, useRef } from 'react';

// Modal Component defined inside this file
const ImageSourceModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSelectGallery: () => void;
  onSelectCamera: () => void;
}> = ({ isOpen, onClose, onSelectGallery, onSelectCamera }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm m-4 relative animate-zoom-in"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-bold text-gray-800 mb-6 text-center">Seleccionar fuente de imagen</h3>
        <div className="flex flex-col space-y-4">
          <button
            onClick={onSelectGallery}
            className="w-full flex items-center justify-center bg-gray-100 text-gray-800 font-semibold py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Subir desde Galería
          </button>
          <button
            onClick={onSelectCamera}
            className="w-full flex items-center justify-center bg-red-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Tomar Foto con Cámara
          </button>
        </div>
        <button
          onClick={onClose}
          className="absolute top-2 right-2 p-1 text-gray-500 hover:text-gray-800 rounded-full hover:bg-gray-100"
          aria-label="Cerrar"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
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
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-zoom-in {
            animation: zoom-in 0.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
};


interface PhotoSlotProps {
  label: string;
  onFileSelect: (file: File) => void;
  icon: React.ReactElement;
  captureMode?: 'user' | 'environment';
}

const PhotoSlot: React.FC<PhotoSlotProps> = ({ label, onFileSelect, icon, captureMode = 'user' }) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
        onFileSelect(file);
      };
      reader.readAsDataURL(file);
    }
    // Reset the input value to allow selecting the same file again
    e.target.value = '';
  };

  const handleSlotClick = () => {
    setIsModalOpen(true);
  };
  
  const openFileDialog = (capture: boolean) => {
    const input = fileInputRef.current;
    if (input) {
      if (capture) {
        input.setAttribute('capture', captureMode);
      } else {
        input.removeAttribute('capture');
      }
      input.click();
    }
    setIsModalOpen(false);
  };

  const handleSelectGallery = () => {
    openFileDialog(false);
  };

  const handleSelectCamera = () => {
    openFileDialog(true);
  };


  return (
    <>
      <div 
          className="relative w-full aspect-[3/4] bg-gray-200 rounded-lg flex flex-col items-center justify-center text-center p-4 border-2 border-dashed border-gray-400 hover:border-red-500 hover:bg-gray-100 transition-all cursor-pointer"
          onClick={handleSlotClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
        {preview ? (
          <img src={preview} alt={`${label} preview`} className="absolute inset-0 w-full h-full object-cover rounded-lg" />
        ) : (
          <>
            <div className="w-12 h-12 text-gray-500 mb-2">{icon}</div>
            <p className="font-semibold text-gray-700">{label}</p>
            <p className="text-sm text-gray-500">Toca para elegir una foto</p>
          </>
        )}
      </div>
       <ImageSourceModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelectGallery={handleSelectGallery}
        onSelectCamera={handleSelectCamera}
      />
    </>
  );
};

interface PhotoUploaderProps {
  onPhotosReady: (front: File, side: File) => void;
  isProcessing: boolean;
}

export const PhotoUploader: React.FC<PhotoUploaderProps> = ({ onPhotosReady, isProcessing }) => {
  const [frontPhoto, setFrontPhoto] = useState<File | null>(null);
  const [sidePhoto, setSidePhoto] = useState<File | null>(null);

  const FrontIcon = (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-full h-full">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
  );

  const SideIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-full h-full">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.5v15a2.25 2.25 0 002.25 2.25h12a2.25 2.25 0 002.25-2.25v-15A2.25 2.25 0 0018 2.25h-1.5a2.25 2.25 0 00-2.25 2.25v.75m-6.75-.75v.75a2.25 2.25 0 01-2.25-2.25H6A2.25 2.25 0 003.75 4.5zM12 12.75a3 3 0 100-6 3 3 0 000 6z" />
    </svg>
  );

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-4">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Descubre tu Estilo Ideal</h2>
        <p className="text-gray-600 mb-6 text-center">Sube dos fotos para una recomendación de IA personalizada.</p>
        <div className="w-full max-w-md grid grid-cols-2 gap-4 mb-6">
            <PhotoSlot label="Foto de Frente" onFileSelect={setFrontPhoto} icon={FrontIcon} captureMode="user" />
            <PhotoSlot label="Foto de Perfil" onFileSelect={setSidePhoto} icon={SideIcon} captureMode="environment" />
        </div>
        <button
            onClick={() => onPhotosReady(frontPhoto!, sidePhoto!)}
            disabled={!frontPhoto || !sidePhoto || isProcessing}
            className="w-full max-w-md bg-red-600 text-white font-bold py-3 px-10 rounded-lg text-lg hover:bg-red-700 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:bg-red-300 disabled:cursor-not-allowed shadow-lg"
        >
            {isProcessing ? 'Analizando...' : 'Analizar mis fotos'}
        </button>
    </div>
  );
};

export default PhotoUploader;
