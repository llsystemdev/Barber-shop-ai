
import React from 'react';
import VirtualMirror from '../components/VirtualMirror';
import PhotoUploader from '../components/PhotoUploader';

interface MirrorViewProps {
    appState: 'initial' | 'processing' | 'results';
    isAiLoading: boolean;
    onPhotosReady: (front: File, side: File) => void;
    currentShopName: string;
    aiName: string;
    frontUserImageUrl: string | null;
    sideUserImageUrl: string | null;
    generatedImages: (string | null)[];
    suggestedStyles: string[];
    analysisResult: string | null;
    isGeneratingImages: boolean[];
    activeAngle: 'front' | 'side' | 'threeQuarter';
    plan: 'Freemium' | 'Básico' | 'Profesional'; // Added plan prop
    onAngleChange: (angle: 'front' | 'side' | 'threeQuarter') => void;
    onLightingChange: (lighting: string) => void;
    onColorChange: (color: string) => void;
    onHighlightsChange: (color: string) => void;
    onRegenerateImage: (index: number) => void;
    onShare: () => void;
    onUploadNew: () => void;
    onImageClick: (url: string, caption: string) => void;
}

const MirrorView: React.FC<MirrorViewProps> = (props) => {
  return (
    <div className="w-full h-full flex flex-col bg-white overflow-hidden">
        <div className="flex-1 overflow-y-auto">
        {props.appState === 'initial' && <PhotoUploader onPhotosReady={props.onPhotosReady} isProcessing={props.isAiLoading} />}
        {props.appState === 'processing' && (
            <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center">
                <div className="w-24 h-24 mb-6 text-red-500 animate-spin">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                </div>
                <h3 className="text-xl font-bold text-gray-800">Analizando tus fotos...</h3>
                <p className="text-gray-500">{props.aiName} está buscando los mejores estilos para ti.</p>
            </div>
        )}
        {props.appState === 'results' && (
            <VirtualMirror 
                frontImage={props.frontUserImageUrl}
                sideImage={props.sideUserImageUrl}
                generatedImages={props.generatedImages} 
                styleNames={props.suggestedStyles} 
                analysisResult={props.analysisResult}
                isLoading={props.isGeneratingImages}
                activeAngle={props.activeAngle}
                plan={props.plan} // Pass plan
                shopName={props.currentShopName} // Pass shop name for watermark
                onAngleChange={props.onAngleChange}
                onLightingChange={props.onLightingChange}
                onColorChange={props.onColorChange}
                onHighlightsChange={props.onHighlightsChange}
                onRegenerateImage={props.onRegenerateImage}
                onShare={props.onShare} 
                onUploadNew={props.onUploadNew} 
                onImageClick={props.onImageClick} 
            />
        )}
        </div>
    </div>
  );
};

export default MirrorView;
