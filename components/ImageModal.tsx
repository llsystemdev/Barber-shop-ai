
import React, { useEffect } from 'react';

interface ImageModalProps {
  imageUrl: string;
  caption: string;
  onClose: () => void;
}

const ImageModal: React.FC<ImageModalProps> = ({ imageUrl, caption, onClose }) => {
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

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="image-modal-caption"
    >
      <div 
        className="bg-white rounded-lg shadow-2xl p-4 max-w-4xl max-h-[90vh] w-auto h-auto flex flex-col relative animate-zoom-in"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking on the image/modal content
      >
        <img
          src={imageUrl}
          alt={caption}
          className="object-contain w-full h-full"
        />
        <p id="image-modal-caption" className="text-center mt-3 text-lg font-semibold text-gray-800">{caption}</p>
        <button
          onClick={onClose}
          className="absolute top-2 right-2 bg-white rounded-full p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500"
          aria-label="Cerrar vista de imagen"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
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

export default ImageModal;
