
import React, { useState, useEffect, useRef } from 'react';
import { Message, BarberShop, Booking, User as AppUser } from './types';
import { 
    getShopForUser, 
    subscribeToBookings, 
    createDefaultShopForUser,
    uploadBase64Image,
    updateShop,
    getAllShops,
    uploadShopImage
} from './services/barberShopService';
import { onAuthStateChanged, logoutUser as localLogout, loginWithGoogle } from './services/authService';
import { auth } from './firebase/client';

import Sidebar from './components/Sidebar';
import MainHeader from './components/MainHeader';
import ChatView from './views/ChatView';
import BookingView from './views/BookingView';
import BookingsListView from './views/BookingsListView';
import ShopProfileView from './views/ShopProfileView';
import BillingView from './views/BillingView';
import AdminView from './views/AdminView';
import HomeView from './views/HomeView';
import LoginView from './views/LoginView';
import MirrorView from './views/MirrorView';
import { getStyleRecommendations, generateStyledImage } from './services/geminiService';
import { compressImage } from './services/imageCompression';
import ImageModal from './components/ImageModal';
import GuestLimitModal from './components/GuestLimitModal';
import { SupportWidget } from './components/SupportWidget';
import { GDPRBanner } from './components/GDPRBanner';

type ActiveView = 'chat' | 'mirror' | 'booking' | 'bookingsList' | 'shopProfile' | 'billing' | 'admin' | 'platformAdmin';
type Screen = 'home' | 'login' | 'app';
type MirrorState = 'initial' | 'processing' | 'results';

const defaultDemoShop: BarberShop = {
  id: 'default_shop',
  name: 'Barbería AI Demo',
  aiName: 'Asistente AI',
  welcomeMessage: '¡Hola! Bienvenido. Soy tu Asistente AI de Estilismo. ¿Qué estilo te gustaría ver hoy?',
  aiPersona: 'Profesional, amable y experto en visagismo de cabello.',
  description: 'Barbería de demostración potenciada con Inteligencia Artificial.',
  address: 'Calle del Estilo 123, Ciudad',
  phone: '555-0199',
  hours: { 'Lunes-Viernes': '09:00 - 18:00' },
  gallery: [
    'https://images.pexels.com/photos/3998429/pexels-photo-3998429.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    'https://images.pexels.com/photos/2061821/pexels-photo-2061821.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'
  ],
  services: [{ name: 'Corte de Cabello Premium', price: '$25' }],
  barbers: [{ name: 'Estilista Pro', specialty: 'General', imageUrl: '' }],
  plan: 'Básico',
  billingHistory: [],
  paymentMethod: { type: 'Visa', last4: '4242', expiry: '12/28' }
};

const App: React.FC = () => {
  const [screen, setScreen] = useState<Screen>('home');
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [guestSimulationsCount, setGuestSimulationsCount] = useState<number>(() => {
    const saved = localStorage.getItem('guest_simulations_count');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [showGuestLimitModal, setShowGuestLimitModal] = useState<boolean>(false);
  const [shops, setShops] = useState<BarberShop[]>([]); 
  const [activeShopId, setActiveShopId] = useState<string | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [activeView, setActiveView] = useState<ActiveView>('admin');
  const [isInitializing, setIsInitializing] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  
  // Mirror State
  const [mirrorState, setMirrorState] = useState<MirrorState>('initial');
  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [sideImage, setSideImage] = useState<string | null>(null);
  const [suggestedStyles, setSuggestedStyles] = useState<string[]>([]);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [generatedImages, setGeneratedImages] = useState<(string | null)[]>(new Array(12).fill(null));
  const [isGeneratingImages, setIsGeneratingImages] = useState<boolean[]>(new Array(12).fill(false));
  const [activeAngle, setActiveAngle] = useState<'front' | 'side' | 'threeQuarter'>('front');
  const [activeColor, setActiveColor] = useState<string | undefined>(undefined);
  const [activeHighlights, setActiveHighlights] = useState<string | undefined>(undefined);
  const [activeLighting, setActiveLighting] = useState<string>('Natural');
  
  const [selectedImageForModal, setSelectedImageForModal] = useState<{url: string, caption: string} | null>(null);
  const [isSavingResults, setIsSavingResults] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const unsubscribeBookingsRef = useRef<(() => void) | null>(null);

  const handleStartGuestMode = () => {
    const guestUser: AppUser = {
      id: 'guest_user',
      name: 'Invitado',
      role: 'customer',
      avatarUrl: '',
      isGuest: true,
      shopId: shops[0]?.id || 'default_shop'
    };
    setCurrentUser(guestUser);
    setActiveView('mirror');
    setScreen('app');
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(async (user) => {
        if (user) {
            handleUserSession(user);
        } else {
            setCurrentUser(null);
            setScreen('home');
            setIsInitializing(false);
        }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchShopsOnMount = async () => {
      try {
        const list = await getAllShops();
        setShops(list);
      } catch (e) {
        console.error("Error loading shops on mount:", e);
      }
    };
    fetchShopsOnMount();
  }, []);

  useEffect(() => {
    const handleStripeCallback = async () => {
      const params = new URLSearchParams(window.location.search);
      const stripeStatus = params.get('stripe_status');
      const plan = params.get('plan');
      const urlShopId = params.get('shopId');

      if (stripeStatus === 'success' && plan && urlShopId) {
        console.log(`[Stripe Callback] Plan: ${plan}, shopId: ${urlShopId}`);
        try {
          const { error } = await updateShop(urlShopId, { plan: plan as any });
          if (error) throw error;

          setShops(prev => prev.map(s => s.id === urlShopId ? { ...s, plan: plan as any } : s));
          
          alert(`🎉 ¡Suscripción activada con éxito! Tu barbería ahora cuenta con los beneficios del Plan ${plan}.`);
          
          window.history.replaceState({}, document.title, window.location.pathname);
          setActiveView('billing');
        } catch (e: any) {
          console.error('[Stripe Callback Error]', e);
          alert('Error al sincronizar tu suscripción: ' + e.message);
        }
      } else if (stripeStatus === 'cancel') {
        alert('❌ El proceso de suscripción con Stripe fue cancelado.');
        window.history.replaceState({}, document.title, window.location.pathname);
        setActiveView('billing');
      }
    };

    if (screen === 'app' && shops.length > 0) {
      handleStripeCallback();
    }
  }, [screen, shops.length]);

  const handleUserSession = async (user: any) => {
    console.log("Iniciando handleUserSession para:", user.id);
    try {
        const firebaseUser = auth.currentUser;
        if (firebaseUser) {
            const isGoogle = firebaseUser.providerData.some(p => p.providerId === 'google.com');
            if (!firebaseUser.emailVerified && !isGoogle) {
                console.warn("[SECURITY] Unverified user tried to access dashboard!");
                await localLogout();
                setScreen('login');
                return;
            }
        }

        console.log("Intentando obtener barbería del usuario...");
        let shop = await getShopForUser(user.id);
        console.log("Barbería obtenida:", shop);
        
        // Si el usuario no tiene una barbería aún (nuevo registro), creamos una por defecto
        if (!shop && user.role === 'shopOwner') {
            console.log("Creando barbería por defecto para shopOwner...");
            const userName = user.name;
            const res = await createDefaultShopForUser(user.id, userName);
            shop = res.data;
            console.log("Barbería por defecto creada:", shop);
        }

        const mappedUser: AppUser = {
            id: user.id,
            name: user.name || 'Usuario',
            role: user.role || 'customer',
            avatarUrl: user.avatarUrl || '',
            shopId: shop?.id
        };

        if (mappedUser.role === 'platformAdmin') {
            const allShops = await getAllShops();
            setShops(allShops);
            if (allShops.length > 0) {
                setActiveShopId(allShops[0].id);
            }
            setActiveView('platformAdmin');
        } else {
            if (shop) {
                setShops([shop]);
                setActiveShopId(shop.id);
            }
            setActiveView('admin');
        }
        setCurrentUser(mappedUser);
        setScreen('app');
        console.log("Sesión de usuario manejada con éxito.");
    } catch (e) {
        console.error("Error detallado al manejar la sesión de usuario:", e);
    } finally {
        setIsInitializing(false);
    }
  };

  useEffect(() => {
    const shopId = shops[0]?.id;
    if (currentUser && shopId && screen === 'app') {
      if (unsubscribeBookingsRef.current) unsubscribeBookingsRef.current();
      const unsubscribe = subscribeToBookings(shopId, (updatedBookings) => setBookings(updatedBookings));
      unsubscribeBookingsRef.current = unsubscribe;
    }
    return () => { if (unsubscribeBookingsRef.current) unsubscribeBookingsRef.current(); };
  }, [currentUser?.id, shops[0]?.id, screen]);

  const [isAiLoading, setIsAiLoading] = useState(false);

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = {
        id: Date.now().toString(),
        role: 'user',
        parts: [{ text }],
        timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setIsAiLoading(true);

    try {
        const history = messages.map(m => ({
            role: m.role,
            parts: m.parts
        }));

        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: text,
                history: history,
                shop: currentShop
            })
        });

        const data = await response.json();
        
        const aiMsg: Message = {
            id: (Date.now() + 1).toString(),
            role: 'model',
            parts: [{ text: data.text || 'Lo siento, hubo un error.' }],
            timestamp: new Date()
        };

        setMessages(prev => [...prev, aiMsg]);
    } catch (e) {
        console.warn("Using smart offline mock assistant fallback:", e);
        
        const normalizedMsg = text.toLowerCase();
        let fallbackText = `¡Excelente pregunta! Como estilista master de ${currentShop.name}, te recomiendo siempre cuidar la hidratación de tu cabello. Si quieres que analice tus facciones detalladamente para recomendarte el mejor estilo, ve a 'Espejo Virtual' y sube tus fotos de frente y perfil. O si prefieres reservar, ve a 'Agendar Cita'. ¿Hay algo específico sobre estilismo en lo que te gustaría que te asesore?`;
        
        if (normalizedMsg.includes("hola") || normalizedMsg.includes("buenos dias") || normalizedMsg.includes("buenas tardes")) {
            fallbackText = `¡Hola! Bienvenido/a a ${currentShop.name}. Soy ${currentShop.aiName || "tu Asistente AI"}, tu estilista de inteligencia artificial personal. ¿Listo para encontrar tu próximo gran look hoy? Podemos analizar tu rostro en el 'Espejo Virtual' o agendar una cita directa.`;
        } else if (normalizedMsg.includes("precio") || normalizedMsg.includes("costo") || normalizedMsg.includes("servicio") || normalizedMsg.includes("cuanto cuesta")) {
            fallbackText = `En ${currentShop.name} ofrecemos servicios premium a precios justos:\n\n` + 
                currentShop.services.map(s => `- **${s.name}**: ${s.price}`).join("\n") + 
                `\n\nPuedes consultar todos los detalles en la pestaña 'Perfil de la Barbería' en el menú lateral.`;
        } else if (normalizedMsg.includes("cortar") || normalizedMsg.includes("corte") || normalizedMsg.includes("estilo") || normalizedMsg.includes("peinado") || normalizedMsg.includes("look")) {
            fallbackText = `Para recomendarte el estilo perfecto, diseñamos el 'Espejo Virtual'. Sube una foto de frente y otra de perfil, y haré un análisis de visagismo completo recomendando 4 cortes ideales. ¡Pruébalo en la sección 'Espejo Virtual'!`;
        } else if (normalizedMsg.includes("cita") || normalizedMsg.includes("reservar") || normalizedMsg.includes("turno") || normalizedMsg.includes("agendar")) {
            fallbackText = `¡Excelente elección! Puedes reservar un turno al instante. Ve a la sección **'Agendar Cita'** de la barra lateral, elige tu servicio, fecha, hora disponible y tu barbero preferido. ¡Es rápido, cómodo y automático!`;
        }

        const mockAiMsg: Message = {
            id: (Date.now() + 1).toString(),
            role: 'model',
            parts: [{ text: fallbackText }],
            timestamp: new Date()
        };
        setMessages(prev => [...prev, mockAiMsg]);
    } finally {
        setIsAiLoading(false);
    }
  };

  const currentShop = (activeShopId && shops.find(s => s.id === activeShopId)) || shops[0] || defaultDemoShop;

  const handlePhotosReady = async (front: File, side: File) => {
      if (currentUser?.isGuest) {
          if (guestSimulationsCount >= 3) {
              setShowGuestLimitModal(true);
              return;
          }
      }
      setMirrorState('processing');
      setAnalysisError(null);
      try {
          console.log('[Visagismo AI] Comprimiendo y redimensionando fotos del cliente para optimizar rendimiento...');
          const compressedFront = await compressImage(front, 800, 800, 0.8);
          const compressedSide = await compressImage(side, 800, 800, 0.8);

          // Convert files to base64 payloads to offer a 100% reliable direct transmission bypass to the server
          const fileToBase64Payload = async (file: File): Promise<{ data: string, mimeType: string }> => {
              const base64WithHeader = await new Promise<string>((resolve, reject) => {
                  const reader = new FileReader();
                  reader.readAsDataURL(file);
                  reader.onload = () => resolve(reader.result as string);
                  reader.onerror = error => reject(error);
              });
              const match = base64WithHeader.match(/^data:([^;]+);base64,(.+)$/);
              if (match) {
                  return { mimeType: match[1], data: match[2] };
              }
              return { mimeType: file.type || 'image/jpeg', data: base64WithHeader };
          };

          const frontBase64 = await fileToBase64Payload(compressedFront);
          const sideBase64 = await fileToBase64Payload(compressedSide);

          console.log('[Visagismo AI] Subiendo foto de frente a Firebase Storage...');
          const frontUrl = await uploadShopImage(compressedFront, currentShop.id, 'galery');
          console.log('[Visagismo AI] Subiendo foto de perfil a Firebase Storage...');
          const sideUrl = await uploadShopImage(compressedSide, currentShop.id, 'galery');
          
          setFrontImage(frontUrl);
          setSideImage(sideUrl);

          console.log('[Visagismo AI] Enviando fotos a Gemini para análisis morfológico de visagismo...');
          const analysis = await getStyleRecommendations(
              frontUrl,
              sideUrl,
              currentShop,
              currentUser?.id,
              frontBase64,
              sideBase64
          );

          setSuggestedStyles(analysis.styles);
          setAnalysisResult(analysis.finalRecommendation);
          setMirrorState('results');

          if (currentUser?.isGuest) {
              const nextCount = guestSimulationsCount + 1;
              setGuestSimulationsCount(nextCount);
              localStorage.setItem('guest_simulations_count', nextCount.toString());
              if (nextCount >= 3) {
                  setTimeout(() => {
                      setShowGuestLimitModal(true);
                  }, 1500);
              }
          }

          for (let i = 0; i < analysis.styles.length; i++) {
              triggerImageGeneration(i, analysis.styles[i], 'Frente', 'Natural', frontUrl);
              await new Promise(r => setTimeout(r, 600)); 
          }
          
      } catch (e) {
          console.error('[Visagismo Error]', e);
          setMirrorState('initial');
          setAnalysisError("No fue posible completar el análisis. Inténtalo nuevamente.");
      }
  };

  const triggerImageGeneration = async (index: number, style: string, angle: string, lighting: string, imageOverride?: string, color?: string, highlights?: string) => {
    setIsGeneratingImages(prev => {
        const next = [...prev];
        next[index] = true;
        return next;
    });

    try {
        const targetImage = imageOverride || (angle === 'Perfil' ? sideImage : frontImage);
        if (!targetImage) return;

        const masterReference = generatedImages[index % 4] || undefined;

        const result = await generateStyledImage(targetImage, 'image/jpeg', style, angle, lighting, color, highlights, masterReference);
        
        setGeneratedImages(prev => {
            const next = [...prev];
            next[index] = result;
            return next;
        });
    } catch (e) {
        console.error("Error en la generación de imagen (slot " + index + "):", e);
    } finally {
        setIsGeneratingImages(prev => {
            const next = [...prev];
            next[index] = false;
            return next;
        });
    }
  };

  const handleColorChange = (newColor: string) => {
      const colorToSet = activeColor === newColor ? undefined : newColor;
      setActiveColor(colorToSet);
      regenerateVisibleBatch(colorToSet, activeHighlights);
  };

  const handleHighlightsChange = (newHighlights: string) => {
      const highlightsToSet = activeHighlights === newHighlights ? undefined : newHighlights;
      setActiveHighlights(highlightsToSet);
      regenerateVisibleBatch(activeColor, highlightsToSet);
  };

  const regenerateVisibleBatch = (color?: string, highlights?: string) => {
      const startIndex = activeAngle === 'front' ? 0 : activeAngle === 'side' ? 4 : 8;
      const angleLabel = activeAngle === 'front' ? 'Frente' : activeAngle === 'side' ? 'Perfil' : 'Tres Cuartos';
      
      suggestedStyles.forEach((style, i) => {
          triggerImageGeneration(startIndex + i, style, angleLabel, activeLighting, undefined, color, highlights);
      });
  };

  const handleSaveResults = async () => {
      if (isSavingResults) return;
      const validImages = generatedImages.filter(img => img !== null) as string[];
      if (validImages.length === 0) {
          alert("Aún no se han generado imágenes para guardar.");
          return;
      }

      setIsSavingResults(true);
      try {
          const uploadedUrls: string[] = [];
          for (const base64 of validImages) {
              const url = await uploadBase64Image(base64, currentShop.id, 'galery');
              uploadedUrls.push(url);
          }

          const updatedGallery = [...currentShop.gallery, ...uploadedUrls];
          const { error } = await updateShop(currentShop.id, { gallery: updatedGallery });
          if (error) throw error;

          const updatedShop = { ...currentShop, gallery: updatedGallery };
          setShops([updatedShop]);
          alert("¡Imágenes guardadas correctamente en la galería de tu barbería!");
      } catch (e: any) {
          console.error(e);
          alert("Error al guardar en la base de datos: " + e.message);
      } finally {
          setIsSavingResults(false);
      }
  };

  const handleUpdatePlan = async (newPlan: any) => {
    try {
      const { error } = await updateShop(currentShop.id, { plan: newPlan });
      if (error) throw error;
      setShops(prevShops => prevShops.map(s => s.id === currentShop.id ? { ...s, plan: newPlan } : s));
    } catch (err: any) {
      alert("Error al actualizar el plan: " + err.message);
    }
  };

  const handleUpdatePaymentMethod = async (newMethod: any) => {
    try {
      const { error } = await updateShop(currentShop.id, { paymentMethod: newMethod });
      if (error) throw error;
      setShops(prevShops => prevShops.map(s => s.id === currentShop.id ? { ...s, paymentMethod: newMethod } : s));
    } catch (err: any) {
      alert("Error al actualizar el método de pago: " + err.message);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
  };

  if (isInitializing) {
    return (
        <div className="h-screen flex flex-col items-center justify-center bg-slate-950 text-white p-6">
            <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-xl font-black mb-2 uppercase tracking-tighter text-white">Barber<span className="text-red-600"> AI</span></p>
            <p className="text-slate-400 animate-pulse text-center font-bold uppercase text-[10px] tracking-widest">Sincronizando sesión...</p>
        </div>
    );
  }

  if (screen === 'home') return <HomeView onShowLogin={() => setScreen('login')} onGoHome={() => setScreen('home')} onStartGuestMode={handleStartGuestMode} />;
  if (screen === 'login') return <LoginView onLogin={() => {}} onGoHome={() => setScreen('home')} />;

  if (screen === 'app' && shops.length === 0 && !currentUser?.isGuest && currentUser?.role !== 'platformAdmin') {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-950 text-white p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center font-black text-white text-2xl shadow-lg mb-6">
          B
        </div>
        <h2 className="text-2xl font-black uppercase tracking-tight mb-2">No hay Barberías Registradas</h2>
        <p className="text-slate-400 text-sm max-w-md mb-8">
          Actualmente no hay salones de barbería configurados en el sistema de producción. Registra una cuenta como dueño de barbería para habilitar tu propio salón central potenciado con IA.
        </p>
        <button
          onClick={async () => { await localLogout(); setScreen('home'); }}
          className="px-6 py-3 bg-red-600 hover:bg-red-700 font-bold uppercase text-xs tracking-widest rounded-xl transition-all shadow-lg"
        >
          Volver al Inicio
        </button>
      </div>
    );
  }

  return (
    <div className="relative flex h-screen bg-slate-50 overflow-hidden">
      {isSavingResults && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex flex-col items-center justify-center">
              <div className="bg-white p-10 rounded-3xl shadow-2xl flex flex-col items-center">
                  <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-6"></div>
                  <h3 className="text-xl font-black uppercase tracking-tight">Sincronizando Galería</h3>
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-2">Guardando resultados en la nube</p>
              </div>
          </div>
      )}

      <Sidebar 
        currentUser={currentUser}
        currentShop={currentShop}
        shops={shops}
        onSelectShop={(shop) => {
            setActiveShopId(shop.id);
            setActiveView('admin');
        }}
        onResetChat={() => setMessages([])}
        activeView={activeView as any}
        onNavigate={(v) => setActiveView(v as any)}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        onLogout={async () => { await localLogout(); setScreen('home'); }}
        onGoHome={() => { setCurrentUser(null); setScreen('home'); }}
        onRegister={() => { setCurrentUser(null); setScreen('login'); }}
      />
      <div className="flex-1 flex flex-col">
        <MainHeader title={activeView} onMenuClick={() => setIsSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto">
            {(activeView === 'admin' || activeView === 'platformAdmin') && (
                <AdminView 
                    currentUser={currentUser}
                    currentShop={currentShop} 
                    bookings={bookings} 
                    shops={shops} 
                    viewMode={activeView === 'platformAdmin' ? 'platform' : 'shop'}
                    onSelectShop={(shop) => {
                        setActiveShopId(shop.id);
                        setActiveView('admin');
                    }}
                />
            )}
            {activeView === 'chat' && <ChatView messages={messages} isAiLoading={isAiLoading} onSendMessage={handleSendMessage} appState="initial" />}
            {activeView === 'mirror' && (
                <MirrorView 
                    appState={mirrorState}
                    isAiLoading={mirrorState === 'processing'}
                    onPhotosReady={handlePhotosReady}
                    currentShopName={currentShop.name}
                    aiName={currentShop.aiName}
                    frontUserImageUrl={frontImage}
                    sideUserImageUrl={sideImage}
                    generatedImages={generatedImages}
                    suggestedStyles={suggestedStyles}
                    analysisResult={analysisResult}
                    isGeneratingImages={isGeneratingImages}
                    activeAngle={activeAngle}
                    plan={currentShop.plan}
                    onAngleChange={(a) => {
                        setActiveAngle(a);
                        const angleLabel = a === 'front' ? 'Frente' : a === 'side' ? 'Perfil' : 'Tres Cuartos';
                        const startIndex = a === 'front' ? 0 : a === 'side' ? 4 : 8;
                        suggestedStyles.forEach((s, i) => triggerImageGeneration(startIndex + i, s, angleLabel, activeLighting, undefined, activeColor, activeHighlights));
                    }}
                    onLightingChange={(l) => {
                        setActiveLighting(l);
                        const startIndex = activeAngle === 'front' ? 0 : activeAngle === 'side' ? 4 : 8;
                        const angleLabel = activeAngle === 'front' ? 'Frente' : activeAngle === 'side' ? 'Perfil' : 'Tres Cuartos';
                        suggestedStyles.forEach((s, i) => triggerImageGeneration(startIndex + i, s, angleLabel, l, undefined, activeColor, activeHighlights));
                    }}
                    onColorChange={handleColorChange}
                    onHighlightsChange={handleHighlightsChange}
                    onRegenerateImage={(i) => {
                        const angleLabel = activeAngle === 'front' ? 'Frente' : activeAngle === 'side' ? 'Perfil' : 'Tres Cuartos';
                        triggerImageGeneration(i, suggestedStyles[i % 4], angleLabel, activeLighting, undefined, activeColor, activeHighlights);
                    }}
                    onShare={handleSaveResults}
                    onUploadNew={() => { setMirrorState('initial'); setFrontImage(null); setSideImage(null); }}
                    onImageClick={(url, caption) => setSelectedImageForModal({url, caption})}
                    isGuest={currentUser?.isGuest}
                    simulationsCount={guestSimulationsCount}
                    error={analysisError}
                />
            )}
            {activeView === 'booking' && (
                <BookingView 
                    shop={currentShop} 
                    userId={currentUser?.id || ''} 
                    userEmail={currentUser?.name || ''} 
                    onBookingConfirmed={() => setActiveView('bookingsList')} 
                />
            )}
            {activeView === 'bookingsList' && <BookingsListView bookings={bookings} onNavigate={(v) => setActiveView(v as any)} />}
            {activeView === 'shopProfile' && <ShopProfileView shop={currentShop} onUpdateProfile={(s) => setShops([s])} />}
            {activeView === 'billing' && <BillingView shop={currentShop} onUpdatePlan={handleUpdatePlan} onUpdatePaymentMethod={handleUpdatePaymentMethod} />}
        </main>
      </div>
      {selectedImageForModal && (
          <ImageModal 
            imageUrl={selectedImageForModal.url} 
            caption={selectedImageForModal.caption} 
            onClose={() => setSelectedImageForModal(null)} 
          />
      )}
      <GuestLimitModal 
        isOpen={showGuestLimitModal}
        onClose={() => {
          setShowGuestLimitModal(false);
          setCurrentUser(null);
          setScreen('home');
        }}
        onContinueGoogle={async () => {
          setShowGuestLimitModal(false);
          localStorage.setItem('userRole', 'shopOwner');
          try {
            const { error } = await loginWithGoogle();
            if (error) throw error;
          } catch (e: any) {
            alert("Error al ingresar con Google: " + e.message);
          }
        }}
        onContinueEmail={() => {
          setShowGuestLimitModal(false);
          setCurrentUser(null);
          setScreen('login');
        }}
      />
      <SupportWidget />
      <GDPRBanner />
    </div>
  );
};

export default App;
