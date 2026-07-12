
import React, { useState, useMemo } from 'react';

type Angle = 'front' | 'side' | 'threeQuarter';

interface VirtualMirrorProps {
  frontImage: string | null;
  sideImage: string | null;
  generatedImages: (string | null)[];
  styleNames: string[];
  analysisResult: string | null;
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
  lighting: string,
  hairColor: string | undefined,
  highlights: string | undefined
}> = ({ image, styleName, isLoading, isFreemium, isFavorite, watermarkText, onClick, onRegenerate, onToggleFavorite, lighting, hairColor, highlights }) => {
  // Define CSS filters based on lighting and colors
  let filterClass = "";
  if (lighting === 'Estudio') {
    filterClass += " brightness-105 contrast-110 saturate-105";
  } else if (lighting === 'Neón') {
    filterClass += " saturate-125 contrast-105 brightness-95";
  }

  // Platinum/Black color specific image filters
  if (hairColor === '#ffffff') {
    filterClass += " saturate-[0.6] brightness-[1.15] contrast-[1.1]";
  } else if (hairColor === '#1a1a1a') {
    filterClass += " brightness-[0.85] contrast-[1.15]";
  }

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
            <img 
              src={image} 
              alt={styleName} 
              className={`w-full h-full object-cover transition-all duration-700 group-hover:scale-105 ${filterClass}`} 
            />
            {/* Base Hair Color Overlay */}
            {hairColor && hairColor !== 'natural' && hairColor !== '#ffffff' && hairColor !== '#1a1a1a' && (
              <div 
                className="absolute inset-0 mix-blend-color opacity-30 pointer-events-none z-10 rounded-2xl"
                style={{ backgroundColor: hairColor }}
              />
            )}

            {/* Highlights Overlay */}
            {highlights && highlights !== 'none' && (
              <div 
                className="absolute inset-0 mix-blend-overlay opacity-35 pointer-events-none z-10 rounded-2xl"
                style={{ 
                  background: `radial-gradient(circle at 50% 35%, ${highlights} 0%, transparent 65%)` 
                }}
              />
            )}

            {/* Neon Light Filter Overlay */}
            {lighting === 'Neón' && (
              <div 
                className="absolute inset-0 bg-gradient-to-tr from-indigo-500/15 via-transparent to-rose-500/20 mix-blend-color-dodge pointer-events-none z-10 rounded-2xl"
              />
            )}

            {/* Studio Light Filter Overlay */}
            {lighting === 'Estudio' && (
              <div 
                className="absolute inset-0 bg-gradient-to-b from-amber-500/5 to-transparent mix-blend-soft-light pointer-events-none z-10 rounded-2xl"
              />
            )}
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
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
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
    <div className="w-full h-full flex flex-col items-center justify-start p-6 lg:p-10 relative overflow-y-auto bg-slate-50">
      <div className="w-full max-w-6xl mx-auto space-y-8">
        
        {/* Header Premium */}
        <header className="text-center">
          <h2 className="text-3xl font-black text-slate-950 uppercase tracking-tighter mb-2">Espejo Virtual <span className="text-red-600 italic">Barber AI</span></h2>
          <div className="bg-red-50 text-red-700 inline-block px-4 py-1.5 rounded-full border border-red-100">
            <p className="font-black uppercase text-[9px] tracking-[0.2em]">Instrucciones: Prueba tonos, ángulos o activa la Comparativa de Deslizamiento</p>
          </div>
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
                {/* Después (Estilizado con filtros de tiempo real) */}
                <div className="absolute inset-0 w-full h-full">
                  <img 
                    src={activeSliderImage} 
                    alt="Estilizado" 
                    className={`w-full h-full object-cover pointer-events-none ${
                      props.activeLighting === 'Estudio' ? 'brightness-105 contrast-110 saturate-105' : 
                      props.activeLighting === 'Neón' ? 'saturate-125 contrast-105 brightness-95' : ''
                    } ${
                      props.activeColor === '#ffffff' ? 'saturate-[0.6] brightness-[1.15] contrast-[1.1]' :
                      props.activeColor === '#1a1a1a' ? 'brightness-[0.85] contrast-[1.15]' : ''
                    }`} 
                  />
                  {props.activeColor && props.activeColor !== 'natural' && props.activeColor !== '#ffffff' && props.activeColor !== '#1a1a1a' && (
                    <div 
                      className="absolute inset-0 mix-blend-color opacity-30 pointer-events-none z-10"
                      style={{ backgroundColor: props.activeColor }}
                    />
                  )}
                  {props.activeHighlights && props.activeHighlights !== 'none' && (
                    <div 
                      className="absolute inset-0 mix-blend-overlay opacity-35 pointer-events-none z-10"
                      style={{ 
                        background: `radial-gradient(circle at 50% 35%, ${props.activeHighlights} 0%, transparent 65%)` 
                      }}
                    />
                  )}
                  {props.activeLighting === 'Neón' && (
                    <div 
                      className="absolute inset-0 bg-gradient-to-tr from-indigo-500/15 via-transparent to-rose-500/20 mix-blend-color-dodge pointer-events-none z-10"
                    />
                  )}
                  {props.activeLighting === 'Estudio' && (
                    <div 
                      className="absolute inset-0 bg-gradient-to-b from-amber-500/5 to-transparent mix-blend-soft-light pointer-events-none z-10"
                    />
                  )}
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
            
            {/* Grid de Peinados */}
            <div className="flex overflow-x-auto pb-4 gap-4 scrollbar-none -mx-6 px-6 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-4 sm:gap-4 scroll-smooth snap-x">
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
                      lighting={props.activeLighting}
                      hairColor={props.activeColor}
                      highlights={props.activeHighlights}
                    />
                    
                    {imgUrl && (
                      <button 
                        onClick={() => setActiveComparisonStyleIdx(i)}
                        className={`w-full py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider border transition-colors ${activeComparisonStyleIdx === i ? 'bg-red-600 text-white border-red-600' : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'}`}
                      >
                        {activeComparisonStyleIdx === i ? 'Comparando...' : '🔍 Comparar Deslizable'}
                      </button>
                    )}
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
        <div className="flex flex-col md:flex-row gap-4 justify-center max-w-xl mx-auto pt-4">
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
            onClick={props.onShare} 
            className="flex-1 py-4 bg-red-600 hover:bg-red-700 text-white font-black uppercase text-[10px] tracking-widest rounded-2xl transition-all shadow-lg shadow-red-600/25"
          >
            Sincronizar Galería
          </button>
        </div>

      </div>
    </div>
  );
};

export default VirtualMirror;
