
import React, { useState, useMemo } from 'react';

type Angle = 'front' | 'side' | 'threeQuarter';

interface AnalysisData {
  hasBeard?: boolean;
  beardAnalysis?: string;
  recommendedBeards?: string[];
  faceShape?: string;
  hairType?: string;
  products?: string[];
}

interface VirtualMirrorProps {
  frontImage: string | null;
  sideImage: string | null;
  generatedImages: (string | null)[];
  styleNames: string[];
  analysisResult: string | null;
  analysisData?: AnalysisData | null;
  isLoading: boolean[];
  activeAngle: Angle;
  plan: 'Freemium' | 'Básico' | 'Profesional';
  shopName: string;
  activeColor: string | undefined;
  activeHighlights: string | undefined;
  activeLighting: string;
  onAngleChange: (angle: Angle) => void;
  onLightingChange: (lighting: string) => void;
  onColorChange: (color: string) => void;
  onHighlightsChange: (color: string) => void;
  onRegenerateImage: (index: number) => void;
  onShare: () => void;
  onUploadNew: () => void;
  onImageClick: (url: string, caption: string) => void;
  onReloadAll: () => void; // Added global reload prop
  isOffline?: boolean;
}

const Loader: React.FC<{text?: string}> = ({text = "Generando..."}) => (
  <div className="absolute inset-0 bg-slate-950/70 flex flex-col items-center justify-center z-20 rounded-2xl backdrop-blur-sm animate-pulse">
    <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-4"></div>
    <p className="text-[10px] font-black uppercase tracking-widest text-white">{text}</p>
  </div>
);

const ImageCell: React.FC<{
  image: string | null, 
  styleName: string, 
  isLoading: boolean, 
  isFreemium: boolean,
  isFavorite: boolean,
  watermarkText: string,
  onClick: () => void,
  onRegenerate: (e: React.MouseEvent) => void,
  onToggleFavorite: (e: React.MouseEvent) => void,
  onShareImage: (e: React.MouseEvent) => void,
  lighting: string,
  hairColor: string | undefined,
  highlights: string | undefined
}> = ({ image, styleName, isLoading, isFreemium, isFavorite, watermarkText, onClick, onRegenerate, onToggleFavorite, onShareImage, lighting, hairColor, highlights }) => {
  console.log('[AUDIT LOG 4 - COMPONENT INPUT]', { styleName, hasImage: !!image, imagePreview: image ? image.substring(0, 100) + '...' : 'null', isLoading });
  return (
    <div className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden shadow-xl group bg-slate-100 border-2 border-transparent hover:border-red-600 hover:shadow-red-500/10 transition-all duration-300">
      <button 
        onClick={onClick}
        disabled={!image || isLoading}
        className="absolute inset-0 w-full h-full p-0 border-0 focus:outline-none z-0"
      >
        {isLoading && <Loader text="Analizando..." />}
        {image ? (
          <div className="relative w-full h-full">
            {(() => {
              console.log('[AUDIT LOG 5 - IMG TAG RENDER]', { styleName, src: image ? image.substring(0, 100) + '...' : 'null' });
              return (
                <img 
                  src={image} 
                  alt={styleName} 
                  className="w-full h-full object-cover transition-all duration-700 group-hover:scale-105" 
                />
              );
            })()}
          </div>
        ) : !isLoading && (
          <div className="w-full h-full flex flex-col items-center justify-center p-4">
            <div className="w-8 h-8 text-slate-400 animate-spin border-2 border-slate-300 border-t-red-600 rounded-full mb-2"></div>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Esperando datos</span>
          </div>
        )}
      </button>
      
      {image && !isLoading && isFreemium && (
        <div className="absolute top-3 left-3 pointer-events-none">
          <p className="text-[8px] text-white/90 font-black uppercase tracking-widest bg-slate-900/60 px-1.5 py-0.5 rounded backdrop-blur-sm">
            {watermarkText}
          </p>
        </div>
      )}

      {/* Overlay con Título */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent p-4 text-center pointer-events-none z-10">
        <p className="text-white text-[10px] font-black uppercase tracking-widest truncate">{styleName}</p>
      </div>
       
      {image && !isLoading && (
        <div className="absolute top-3 right-3 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
          {/* Botón Favorito */}
          <button
            onClick={onToggleFavorite}
            className={`p-2 rounded-full shadow-lg hover:scale-110 transition-transform ${isFavorite ? 'bg-red-600 text-white' : 'bg-white text-slate-900 hover:text-red-600'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill={isFavorite ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>

          {/* Botón Regenerar */}
          <button
            onClick={onRegenerate}
            className="bg-white text-slate-950 p-2 rounded-full shadow-lg hover:scale-110 transition-transform hover:text-red-600"
            title="Regenerar estilo"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>

          {/* Botón Compartir Redes */}
          <button
            onClick={onShareImage}
            className="bg-white text-slate-950 p-2 rounded-full shadow-lg hover:scale-110 transition-transform hover:text-red-600"
            title="Compartir en Redes Sociales"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 100-5.368 3 3 0 000 5.368zm0 9.5a3 3 0 100-5.368 3 3 0 000 5.368z" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

const ControlPanel: React.FC<{title: string, children: React.ReactNode}> = ({ title, children }) => (
  <div className="w-full bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-between">
    <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">{title}</h4>
    <div className="flex flex-wrap justify-center gap-2">
      {children}
    </div>
  </div>
);

const VirtualMirror: React.FC<VirtualMirrorProps> = (props) => {
  const startIndex = props.activeAngle === 'front' ? 0 : props.activeAngle === 'side' ? 4 : 8;
  const isFreemium = props.plan === 'Freemium';
  const watermarkText = props.shopName.toUpperCase();

  // Estados de Comparación Deslizable
  const [activeComparisonStyleIdx, setActiveComparisonStyleIdx] = useState<number | null>(null);
  const [sliderPosition, setSliderPosition] = useState(50);
  
  // Estados de Compartir en Redes Sociales
  const [showFreemiumLockModal, setShowFreemiumLockModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareTargetImage, setShareTargetImage] = useState<string | null>(null);
  const [shareTargetStyle, setShareTargetStyle] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  const handleTriggerShare = (imageUrl: string | null, styleName: string) => {
    if (isFreemium) {
      setShowFreemiumLockModal(true);
    } else {
      setShareTargetImage(imageUrl);
      setShareTargetStyle(styleName);
      setShowShareModal(true);
    }
  };

  // Catálogo de Favoritos Local
  const [favorites, setFavorites] = useState<Array<{ styleName: string, image: string }>>([]);

  const toggleFavorite = (styleName: string, image: string) => {
    setFavorites(prev => {
      const exists = prev.some(f => f.styleName === styleName);
      if (exists) {
        return prev.filter(f => f.styleName !== styleName);
      } else {
        return [...prev, { styleName, image }];
      }
    });
  };

  const activeSliderImage = activeComparisonStyleIdx !== null 
    ? props.generatedImages[startIndex + activeComparisonStyleIdx] 
    : null;

  const activeOriginalImage = props.activeAngle === 'side' ? props.sideImage : props.frontImage;

  return (
    <div className="w-full h-full flex flex-col items-center justify-start p-4 sm:p-6 lg:p-10 relative overflow-y-auto bg-slate-50">
      <div className="w-full max-w-6xl mx-auto space-y-8">
        
        {/* Header Premium */}
        <header className="text-center space-y-3">
          <h2 className="text-3xl font-black text-slate-950 uppercase tracking-tighter mb-1">Espejo Virtual <span className="text-red-600 italic">Barber AI</span></h2>
          
          {props.isOffline ? (
            <div className="bg-slate-900 text-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 px-4 py-2.5 rounded-2xl border border-slate-800 text-xs shadow-md max-w-2xl mx-auto">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-ping"></span>
                <span className="font-black tracking-wider uppercase text-[9px] text-amber-400">Soporte Inteligente Offline (Local)</span>
              </div>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Simulación local activa por límite de conexión o API</span>
            </div>
          ) : (
            <div className="bg-red-50 text-red-700 inline-block px-4 py-1.5 rounded-full border border-red-100">
              <p className="font-black uppercase text-[9px] tracking-[0.2em]">Instrucciones: Prueba tonos, ángulos o activa la Comparativa de Deslizamiento</p>
            </div>
          )}
        </header>

        {/* Sección de Comparación Split-Slider Activo */}
        {activeComparisonStyleIdx !== null && activeSliderImage && activeOriginalImage && (
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4 animate-fade-in">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <span className="text-[9px] font-black text-red-600 uppercase tracking-widest block">HERRAMIENTA PREMIUM</span>
                <h4 className="text-sm font-black text-slate-900 uppercase">Comparativa de Deslizamiento (Wipe Slider)</h4>
              </div>
              <button 
                onClick={() => setActiveComparisonStyleIdx(null)}
                className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-xl font-black uppercase tracking-widest transition-colors"
              >
                Cerrar Comparador
              </button>
            </div>

            <div className="flex flex-col md:flex-row gap-6 items-center">
              {/* Slider Widget */}
              <div className="relative w-full max-w-sm aspect-[3/4] rounded-2xl overflow-hidden border border-slate-200 shadow-2xl mx-auto">
                {/* Después (Estilizado) */}
                <div className="absolute inset-0 w-full h-full">
                  <img 
                    src={activeSliderImage} 
                    alt="Estilizado" 
                    className="w-full h-full object-cover pointer-events-none" 
                  />
                </div>
                
                {/* Antes (Original) - clipped beautifully on any screen size */}
                <img 
                  src={activeOriginalImage} 
                  alt="Original" 
                  className="absolute inset-0 w-full h-full object-cover pointer-events-none z-10"
                  style={{ clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)` }}
                />

                {/* Range Input invisible overlay but fully draggable */}
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={sliderPosition} 
                  onChange={(e) => setSliderPosition(Number(e.target.value))} 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-30" 
                />

                {/* Línea Divisoria de Deslizamiento */}
                <div 
                  className="absolute inset-y-0 bg-white w-0.5 shadow-2xl pointer-events-none z-20" 
                  style={{ left: `${sliderPosition}%` }}
                >
                  <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 bg-red-600 border-2 border-white rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-red-600/35">
                    ↔️
                  </div>
                </div>

                {/* Etiquetas flotantes */}
                <span className="absolute bottom-3 left-3 bg-slate-900/60 backdrop-blur-sm text-white font-black text-[8px] uppercase tracking-widest px-2 py-0.5 rounded pointer-events-none z-10">Antes</span>
                <span className="absolute bottom-3 right-3 bg-red-600/80 backdrop-blur-sm text-white font-black text-[8px] uppercase tracking-widest px-2 py-0.5 rounded pointer-events-none z-10">Después</span>
              </div>

              <div className="flex-1 space-y-3 text-center md:text-left">
                <span className="text-[9px] bg-red-50 text-red-600 px-2 py-1 rounded font-black uppercase tracking-wider">Estilo Seleccionado</span>
                <h4 className="text-2xl font-black text-slate-950 uppercase tracking-tight">{props.styleNames[activeComparisonStyleIdx]}</h4>
                <p className="text-slate-500 text-xs font-medium leading-relaxed max-w-md">
                  Arrastra el cursor de lado a lado directamente sobre la imagen para revelar la transformación exacta de visagismo sugerida por la inteligencia artificial.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Layout Principal de Resultados */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Panel Lateral: Foto Original */}
          <div className="w-full lg:w-48 flex lg:flex-col gap-4">
            <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm w-full space-y-3">
              <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-center border-b border-slate-50 pb-2">Tu Foto de Origen</h4>
              <div className="relative w-full aspect-[3/4] bg-slate-100 rounded-2xl overflow-hidden shadow-md">
                <img src={props.frontImage!} className="w-full h-full object-cover" alt="Tu Rostro" />
                <div className="absolute bottom-2 left-2 bg-slate-950/75 backdrop-blur-sm text-white text-[8px] px-1.5 py-0.5 rounded font-black uppercase tracking-widest">Frente</div>
              </div>
              <p className="text-[10px] text-slate-400 font-bold text-center uppercase tracking-wider">Análisis Activo</p>
            </div>
          </div>

          {/* Panel de Modelos y Grid */}
          <div className="flex-1 space-y-6">
            {props.analysisResult && (
              <div className="p-6 bg-white border border-slate-200 text-slate-950 rounded-3xl shadow-sm border-l-8 border-red-600">
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-red-600 block mb-1">Diagnóstico de Estilo IA</span>
                <p className="text-xs font-black text-slate-900 uppercase tracking-tight mb-2">Visagismo y Morfología Facial Detectada</p>
                <p className="text-xs text-slate-600 font-medium leading-relaxed italic">"{props.analysisResult}"</p>
              </div>
            )}

            {/* Detección y Recomendación de Barba */}
            {props.analysisData && (props.analysisData.hasBeard || (props.analysisData.recommendedBeards && props.analysisData.recommendedBeards.length > 0)) && (
              <div className="p-6 bg-slate-950 text-white rounded-3xl shadow-xl border border-slate-800 space-y-4 animate-fade-in">
                <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
                  <div className="w-10 h-10 rounded-2xl bg-red-600/20 text-red-500 border border-red-500/30 flex items-center justify-center text-xl font-black">
                    🧔
                  </div>
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-red-500 block">Análisis Facial Específico</span>
                    <h4 className="text-sm font-black uppercase tracking-tight text-white">Detección de Barba & Diseños Sugeridos</h4>
                  </div>
                </div>

                {props.analysisData.beardAnalysis && (
                  <p className="text-xs text-slate-300 font-medium leading-relaxed italic bg-slate-900/90 p-3.5 rounded-2xl border border-slate-800/80">
                    "{props.analysisData.beardAnalysis}"
                  </p>
                )}

                {props.analysisData.recommendedBeards && props.analysisData.recommendedBeards.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Estilos y Diseños de Barba Sugeridos para tu Rostro:</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {props.analysisData.recommendedBeards.map((beardStyle: string, bIdx: number) => (
                        <div key={bIdx} className="flex items-center gap-3 p-3 bg-slate-900/90 rounded-2xl border border-slate-800 hover:border-red-600/50 transition-colors">
                          <span className="w-2.5 h-2.5 rounded-full bg-red-600 flex-shrink-0 shadow-sm shadow-red-500"></span>
                          <span className="text-xs font-black text-slate-100 uppercase tracking-wide">{beardStyle}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Grid de Peinados */}
            <div className="flex overflow-x-auto pb-4 gap-4 scrollbar-none -mx-4 px-4 sm:-mx-6 sm:px-6 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-4 sm:gap-4 scroll-smooth snap-x">
              {props.styleNames.map((style, i) => {
                const imgUrl = props.generatedImages[startIndex + i];
                const isFav = favorites.some(f => f.styleName === style);
                return (
                  <div key={i} className="flex flex-col space-y-2 flex-shrink-0 w-[240px] sm:w-auto snap-center">
                    <ImageCell 
                      image={imgUrl} 
                      styleName={style} 
                      isLoading={props.isLoading[startIndex + i]} 
                      isFreemium={isFreemium}
                      isFavorite={isFav}
                      watermarkText={watermarkText}
                      onClick={() => props.onImageClick(imgUrl!, style)}
                      onRegenerate={(e) => props.onRegenerateImage(startIndex + i)}
                      onToggleFavorite={(e) => {
                        e.stopPropagation();
                        if (imgUrl) toggleFavorite(style, imgUrl);
                      }}
                      onShareImage={(e) => {
                        e.stopPropagation();
                        handleTriggerShare(imgUrl, style);
                      }}
                      lighting={props.activeLighting}
                      hairColor={props.activeColor}
                      highlights={props.activeHighlights}
                    />
                    
                    <div className="flex gap-1.5">
                      {imgUrl && (
                        <button 
                          onClick={() => setActiveComparisonStyleIdx(i)}
                          className={`flex-1 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider border transition-colors ${activeComparisonStyleIdx === i ? 'bg-red-600 text-white border-red-600' : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'}`}
                        >
                          {activeComparisonStyleIdx === i ? 'Comparando...' : '🔍 Comparar'}
                        </button>
                      )}
                      {imgUrl && (
                        <button 
                          onClick={() => handleTriggerShare(imgUrl, style)}
                          className="px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider bg-slate-900 text-white hover:bg-red-600 transition-colors flex items-center gap-1 shadow-sm"
                          title="Compartir en Redes Sociales"
                        >
                          <span>📲</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Estilos Guardados / Favoritos Tray */}
        {favorites.length > 0 && (
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4 animate-fade-in">
            <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest border-b border-slate-50 pb-3">⭐ Mis Estilos Favoritos ({favorites.length})</h4>
            <div className="flex gap-4 overflow-x-auto pb-2 pr-2">
              {favorites.map((fav, index) => (
                <div key={index} className="relative w-24 flex-shrink-0 group rounded-xl overflow-hidden shadow border border-slate-100">
                  <img src={fav.image} alt={fav.styleName} className="w-full h-32 object-cover" />
                  <div className="absolute bottom-0 left-0 right-0 bg-slate-950/80 p-1 text-center">
                    <p className="text-[8px] font-black text-white uppercase truncate tracking-wide">{fav.styleName}</p>
                  </div>
                  <button 
                    onClick={() => toggleFavorite(fav.styleName, fav.image)}
                    className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 shadow hover:scale-110 transition-transform"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Controles de Personalización */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <ControlPanel title="Ángulo de Vista">
            {['front', 'side', 'threeQuarter'].map(a => (
              <button 
                key={a} 
                onClick={() => props.onAngleChange(a as any)} 
                className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${props.activeAngle === a ? 'bg-red-600 text-white shadow-xl scale-105' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
              >
                {a === 'front' ? 'Frente' : a === 'side' ? 'Perfil' : '3/4'}
              </button>
            ))}
          </ControlPanel>
          
          <ControlPanel title="Filtro de Luz">
            {['Natural', 'Estudio', 'Neón'].map(l => (
              <button 
                key={l} 
                onClick={() => props.onLightingChange(l)} 
                className="px-3 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-700 transition-all"
              >
                {l}
              </button>
            ))}
          </ControlPanel>

          <ControlPanel title="Tono de Base">
            <div className="flex gap-2">
              <button onClick={() => props.onColorChange('natural')} className="w-8 h-8 rounded-full border-2 border-slate-300 bg-white flex items-center justify-center text-[8px] font-black hover:scale-110 transition-transform">N</button>
              {['#c9a15b', '#1a1a1a', '#4a3728', '#8b0000', '#000033', '#ffffff'].map(c => (
                <button 
                  key={c} 
                  onClick={() => props.onColorChange(c)} 
                  className="w-8 h-8 rounded-full border-2 border-white shadow hover:scale-125 transition-transform" 
                  style={{ backgroundColor: c }}
                ></button>
              ))}
            </div>
          </ControlPanel>

          <ControlPanel title="Tono de Mechas">
            <div className="flex gap-2">
              <button onClick={() => props.onHighlightsChange('none')} className="w-8 h-8 rounded-full border-2 border-slate-300 bg-white flex items-center justify-center text-[8px] font-black hover:scale-110 transition-transform">X</button>
              {['#fef08a', '#fb923c', '#ef4444', '#3b82f6'].map(c => (
                <button 
                  key={c} 
                  onClick={() => props.onHighlightsChange(c)} 
                  className="w-8 h-8 rounded-full border-2 border-white shadow hover:scale-125 transition-transform" 
                  style={{ backgroundColor: c }}
                ></button>
              ))}
            </div>
          </ControlPanel>
        </div>

        {/* Acciones del Espejo */}
        <div className="flex flex-col md:flex-row gap-4 justify-center max-w-2xl mx-auto pt-4">
          <button 
            onClick={props.onUploadNew} 
            className="flex-1 py-4 bg-white border-2 border-slate-200 text-slate-900 font-black uppercase text-[10px] tracking-widest rounded-2xl hover:bg-slate-50 transition-all shadow-sm"
          >
            Cambiar Fotos
          </button>
          <button 
            onClick={props.onReloadAll}
            className="flex-1 py-4 bg-slate-900 hover:bg-slate-800 text-white font-black uppercase text-[10px] tracking-widest rounded-2xl transition-all shadow-md flex items-center justify-center gap-1.5"
          >
            <span>🔄</span> Regenerar Todo
          </button>
          <button 
            onClick={() => handleTriggerShare(activeSliderImage || props.generatedImages[startIndex] || props.generatedImages.find(img => img !== null) || null, 'Mi Cambio de Look')}
            className="flex-1 py-4 bg-red-600 hover:bg-red-700 text-white font-black uppercase text-[10px] tracking-widest rounded-2xl transition-all shadow-lg shadow-red-600/25 flex items-center justify-center gap-1.5"
          >
            <span>📲</span> Compartir Redes
          </button>
          <button 
            onClick={props.onShare} 
            className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 text-white font-black uppercase text-[10px] tracking-widest rounded-2xl transition-all shadow-md"
          >
            Sincronizar Galería
          </button>
        </div>

      </div>

      {/* Modal de Bloqueo de Redes Sociales para Plan Freemium */}
      {showFreemiumLockModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 text-center space-y-4 shadow-2xl border border-slate-100">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-3xl mx-auto shadow-inner">
              🔒
            </div>
            <div>
              <span className="text-[9px] font-black text-red-600 uppercase tracking-widest block mb-1">Función Exclusiva para Plan de Pago</span>
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Compartir en Redes Sociales No Disponible</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              El intercambio directo de simulaciones en <strong>WhatsApp, Facebook, Twitter e Instagram</strong> está restringido en el plan gratuito.
            </p>
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tu Plan Actual:</span>
              <span className="px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full text-[9px] font-black uppercase tracking-widest">Plan Freemium</span>
            </div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              Actualiza a un Plan Básico o Profesional para permitir que tus clientes viralicen sus cortes de cabello en redes sociales.
            </p>
            <div className="pt-2">
              <button 
                onClick={() => setShowFreemiumLockModal(false)}
                className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-black uppercase text-[10px] tracking-widest rounded-2xl transition-colors shadow-md"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Compartir en Redes Sociales para Planes de Pago */}
      {showShareModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-slate-100 relative">
            <button 
              onClick={() => setShowShareModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 bg-slate-100 p-2 rounded-full font-bold text-xs"
            >
              ✕
            </button>

            <div>
              <span className="text-[9px] font-black text-red-600 uppercase tracking-widest block mb-1">📲 Difusión Viral en Redes</span>
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Compartir Cambio de Look</h3>
              <p className="text-xs text-slate-500 font-medium">Difunde el resultado en tus perfiles sociales o envíalo directamente por mensaje.</p>
            </div>

            {shareTargetImage && (
              <div className="relative w-full aspect-[3/4] max-h-56 bg-slate-100 rounded-2xl overflow-hidden shadow border border-slate-200 mx-auto">
                <img src={shareTargetImage} alt={shareTargetStyle || 'Estilo'} className="w-full h-full object-cover" />
                <div className="absolute bottom-2 left-2 bg-slate-950/80 backdrop-blur-sm text-white text-[9px] px-2 py-1 rounded-lg font-black uppercase tracking-widest">
                  {shareTargetStyle || 'Estilo Seleccionado'}
                </div>
              </div>
            )}

            {/* Grid de Opciones Sociales */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button 
                onClick={() => {
                  const shareText = `¡Mira mi nuevo corte "${shareTargetStyle || 'Estilo'}" en ${props.shopName}! 💈✨ Probado con Barber AI.`;
                  window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`, '_blank');
                }}
                className="flex items-center gap-3 p-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-2xl border border-emerald-200 transition-all font-bold text-xs text-left"
              >
                <span className="text-xl">💬</span>
                <div>
                  <p className="font-black text-[11px] uppercase tracking-wide">WhatsApp</p>
                  <p className="text-[9px] text-emerald-600 font-medium">Enviar chat directo</p>
                </div>
              </button>

              <button 
                onClick={() => {
                  const url = window.location.href;
                  window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
                }}
                className="flex items-center gap-3 p-3 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-2xl border border-blue-200 transition-all font-bold text-xs text-left"
              >
                <span className="text-xl">📘</span>
                <div>
                  <p className="font-black text-[11px] uppercase tracking-wide">Facebook</p>
                  <p className="text-[9px] text-blue-600 font-medium">Publicar en muro</p>
                </div>
              </button>

              <button 
                onClick={() => {
                  const shareText = `¡Probando mi cambio de look en ${props.shopName} con Barber AI! 💈✨`;
                  window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(window.location.href)}`, '_blank');
                }}
                className="flex items-center gap-3 p-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl transition-all font-bold text-xs text-left"
              >
                <span className="text-xl">🐦</span>
                <div>
                  <p className="font-black text-[11px] uppercase tracking-wide">X / Twitter</p>
                  <p className="text-[9px] text-slate-300 font-medium">Publicar tweet</p>
                </div>
              </button>

              {typeof navigator !== 'undefined' && 'share' in navigator ? (
                <button 
                  onClick={() => {
                    navigator.share({
                      title: `Nuevo Look en ${props.shopName}`,
                      text: `¡Mira mi cambio de look en ${props.shopName}!`,
                      url: window.location.href
                    }).catch(() => {});
                  }}
                  className="flex items-center gap-3 p-3 bg-red-50 hover:bg-red-100 text-red-800 rounded-2xl border border-red-200 transition-all font-bold text-xs text-left"
                >
                  <span className="text-xl">📲</span>
                  <div>
                    <p className="font-black text-[11px] uppercase tracking-wide">Compartir Nativo</p>
                    <p className="text-[9px] text-red-600 font-medium">Menu del dispositivo</p>
                  </div>
                </button>
              ) : (
                <button 
                  onClick={() => {
                    if (shareTargetImage) {
                      const link = document.createElement('a');
                      link.href = shareTargetImage;
                      link.download = `corte-${shareTargetStyle || 'estilo'}.jpg`;
                      link.click();
                    }
                  }}
                  className="flex items-center gap-3 p-3 bg-purple-50 hover:bg-purple-100 text-purple-800 rounded-2xl border border-purple-200 transition-all font-bold text-xs text-left"
                >
                  <span className="text-xl">⬇️</span>
                  <div>
                    <p className="font-black text-[11px] uppercase tracking-wide">Descargar Foto</p>
                    <p className="text-[9px] text-purple-600 font-medium">Guardar en dispositivo</p>
                  </div>
                </button>
              )}
            </div>

            <div className="pt-2 flex gap-2">
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  setCopySuccess(true);
                  setTimeout(() => setCopySuccess(false), 2500);
                }}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-black uppercase text-[10px] tracking-widest rounded-2xl transition-colors flex items-center justify-center gap-1.5"
              >
                <span>📋</span> {copySuccess ? '¡Enlace Copiado!' : 'Copiar Enlace'}
              </button>
              <button 
                onClick={() => {
                  if (shareTargetImage) {
                    const link = document.createElement('a');
                    link.href = shareTargetImage;
                    link.download = `corte-${shareTargetStyle || 'estilo'}.jpg`;
                    link.click();
                  }
                }}
                className="py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-black uppercase text-[10px] tracking-widest rounded-2xl transition-colors"
                title="Descargar Foto"
              >
                ⬇️
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default VirtualMirror;
