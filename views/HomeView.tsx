
import React, { useState, useEffect } from 'react';
import { MirrorIcon, ChatIcon, CalendarIcon, DashboardIcon } from '../assets/icons';

interface HomeViewProps {
  onShowLogin: () => void;
  onGoHome: () => void;
}

const HomeView: React.FC<HomeViewProps> = ({ onShowLogin, onGoHome }) => {
  const [itemIndex, setItemIndex] = useState(0);
  const [isYearly, setIsYearly] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);

  const featuredItems = [
    {
      name: "Maestros del Estilo",
      image: "https://images.pexels.com/photos/3764119/pexels-photo-3764119.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
    },
    {
      name: "Precisión y Arte",
      image: "https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
    },
    {
      name: "Tradición y Pasión",
      image: "https://images.pexels.com/photos/1813947/pexels-photo-1813947.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
    },
  ];

  const benefits = [
    {
      emoji: "🚀",
      title: "Incremento del 35% en Reservas",
      desc: "Los clientes que visualizan previamente su estilo tienen una probabilidad significativamente mayor de reservar turnos recurrentes."
    },
    {
      emoji: "🎨",
      title: "Personalización Absoluta",
      desc: "Define el tono, personalidad, logo y servicios de tu asistente de inteligencia artificial para que hable exactamente como tu marca."
    },
    {
      emoji: "📉",
      title: "Cero Ausentismo",
      desc: "Nuestros recordatorios y confirmaciones automáticas reducen las citas perdidas y optimizan la agenda de todo tu equipo."
    },
    {
      emoji: "⚡",
      title: "Visualización en Segundos",
      desc: "Tecnología de visagismo avanzada para procesar facciones faciales y simular cortes de pelo modernos, barbas y tinturas."
    }
  ];

  const FAQs = [
    {
      question: "¿Cómo funciona el Espejo Virtual IA?",
      answer: "El cliente sube una foto de frente y otra de perfil. Nuestro sistema analiza las facciones utilizando un modelo de visagismo entrenado y genera 4 propuestas de estilos personalizados que pueden previsualizar en su propio rostro de forma hiperrealista."
    },
    {
      question: "¿Puedo personalizar los servicios y barberos?",
      answer: "¡Totalmente! Desde el panel de administración puedes agregar o editar servicios, establecer precios, configurar horarios de trabajo para cada barbero de tu equipo y subir fotos para la galería."
    },
    {
      question: "¿Qué es la 'Personalidad de IA' de la barbería?",
      answer: "Es la identidad con la que el Asistente AI interactuará con tus clientes en el chat. Puedes decidir si el asistente debe sonar formal, moderno, de estilo urbano o clásico, dándole un toque único a la atención al cliente de tu negocio."
    },
    {
      question: "¿Los clientes necesitan descargar una aplicación?",
      answer: "No, la aplicación es 100% web y responsiva. Funciona perfectamente en cualquier smartphone, tablet o computadora, permitiéndoles reservar y usar el Espejo Virtual directamente desde su navegador preferido."
    },
    {
      question: "¿Ofrecen soporte técnico?",
      answer: "Sí, todos nuestros planes incluyen soporte. El plan Básico cuenta con soporte prioritario vía email, y el plan Profesional incluye asistencia dedicada vía chat y teléfono 24/7."
    }
  ];

  const testimonials = [
    {
      name: "Carlos Mendoza",
      role: "Dueño de 'The Vintage Club'",
      image: "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150",
      quote: "Barber Shop AI ha cambiado la forma de interactuar con mis clientes. El espejo virtual es un imán de ventas, la gente ama ver cómo le quedará el fade antes de que toque su cabello."
    },
    {
      name: "Javier Sanabria",
      role: "Socio Fundador de 'Gents & Co'",
      image: "https://images.pexels.com/photos/1212979/pexels-photo-1212979.jpeg?auto=compress&cs=tinysrgb&w=150",
      quote: "El asistente conversacional responde las dudas de los clientes y los guía automáticamente a agendar. Es como tener una recepcionista inteligente trabajando gratis las 24 horas del día."
    },
    {
      name: "Mateo Rossi",
      role: "Estilista Principal de 'Imperio Barber'",
      image: "https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=150",
      quote: "El panel de administración es intuitivo. Puedo ver el rendimiento financiero diario, los servicios más populares y la agenda completa de mi equipo en una sola pantalla. ¡10 de 10!"
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setItemIndex(prevIndex => (prevIndex + 1) % featuredItems.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [featuredItems.length]);

  return (
    <div className="bg-slate-950 text-white font-sans overflow-x-hidden selection:bg-red-600 selection:text-white">
      <style>{`
        @keyframes scan {
          0% { transform: translateY(-10%); opacity: 0.8; }
          100% { transform: translateY(110%); opacity: 0; }
        }
        .scan-line {
          animation: scan 3s cubic-bezier(0.7, 0, 0.3, 1) infinite;
          animation-delay: 0.5s;
        }
        
        @keyframes cycle-styles {
          0%, 95%, 100% { opacity: 0; transform: scale(1.08) rotate(1deg); filter: blur(6px); }
          5% { opacity: 1; transform: scale(1) rotate(0); filter: blur(0); }
          30% { opacity: 1; transform: scale(1) rotate(0); filter: blur(0); }
          33.3% { opacity: 0; transform: scale(1.03) rotate(-1deg); filter: blur(6px); }
        }

        .animated-style-image {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
          opacity: 0;
          animation: cycle-styles 12s ease-in-out infinite;
        }
        
        @keyframes text-fade {
            0%, 100% { opacity: 0; transform: translateY(8px); }
            10%, 90% { opacity: 1; transform: translateY(0); }
        }
        .text-fade-in-out {
            animation: text-fade 4s ease-in-out infinite;
        }
      `}</style>
      
      {/* Navbar Superior */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-900 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <button onClick={onGoHome} className="flex items-center space-x-2.5 group focus:outline-none focus:ring-2 focus:ring-red-500 rounded-xl px-1 py-0.5 transition-all">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center font-black text-white tracking-tighter text-base shadow-md shadow-red-600/30 group-hover:scale-105 transition-transform duration-200">
              B
            </div>
            <span className="text-xl md:text-2xl font-black tracking-widest text-white uppercase transition-colors duration-200">
              BARBER<span className="text-red-500 italic font-extrabold group-hover:text-white transition-colors duration-200">AI</span>
            </span>
          </button>
          
          <nav className="hidden md:flex items-center space-x-8 text-sm font-semibold text-slate-300">
            <a href="#beneficios" className="hover:text-red-500 transition-colors">Beneficios</a>
            <a href="#caracteristicas" className="hover:text-red-500 transition-colors">Características</a>
            <a href="#testimonios" className="hover:text-red-500 transition-colors">Testimonios</a>
            <a href="#planes" className="hover:text-red-500 transition-colors">Planes</a>
            <a href="#faq" className="hover:text-red-500 transition-colors">Preguntas Frecuentes</a>
          </nav>

          <button 
            id="btn_enter_app_nav"
            onClick={onShowLogin} 
            className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs md:text-sm px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-red-600/20 hover:scale-[1.02]"
          >
            Ingresar al App
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-24 pb-16 overflow-hidden">
        {/* Glow de fondo */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-red-600/10 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-10 left-10 w-[300px] h-[300px] bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-6 w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          <div className="lg:col-span-7 text-center lg:text-left space-y-6">
            <div className="inline-flex items-center space-x-2 bg-red-500/10 border border-red-500/20 text-red-500 px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-widest animate-pulse">
              <span>⚡ TECNOLOGÍA DE VISAGISMO IA</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black tracking-tight leading-none text-white uppercase">
              El Futuro de la <span className="bg-gradient-to-r from-red-500 via-orange-500 to-red-600 text-transparent bg-clip-text">Barbería</span> está Aquí
            </h1>
            
            <p className="text-slate-400 text-base sm:text-lg md:text-xl max-w-2xl mx-auto lg:mx-0 font-medium leading-relaxed">
              Atrae más clientes, automatiza la gestión de tu agenda y ofrece previsualizaciones hiperrealistas de estilos con inteligencia artificial. Todo completamente offline para una velocidad de respuesta inigualable.
            </p>
            
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <button 
                id="btn_free_trial"
                onClick={onShowLogin} 
                className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-8 rounded-2xl text-base transition-all transform hover:scale-[1.02] shadow-xl shadow-red-600/25 active:scale-[0.98]"
              >
                Comienza tu Prueba Gratis
              </button>
              <a 
                href="#beneficios" 
                className="w-full sm:w-auto text-center border-2 border-slate-800 hover:border-slate-700 text-slate-300 font-bold py-4 px-8 rounded-2xl text-base transition-all hover:bg-slate-900"
              >
                Saber Más
              </a>
            </div>

            {/* Micro métricas */}
            <div className="pt-8 grid grid-cols-3 gap-4 border-t border-slate-900 max-w-md mx-auto lg:mx-0">
              <div>
                <p className="text-2xl md:text-3xl font-black text-white">99.8%</p>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Fidelidad de IA</p>
              </div>
              <div>
                <p className="text-2xl md:text-3xl font-black text-white">+15k</p>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Simulaciones</p>
              </div>
              <div>
                <p className="text-2xl md:text-3xl font-black text-white">100%</p>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Modo Offline</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 flex justify-center relative">
            <div className="relative w-full max-w-sm h-[450px]">
              {/* Sombras y glow del dispositivo simulado */}
              <div className="absolute inset-0 bg-red-600/10 rounded-[32px] blur-xl transform translate-y-4"></div>
              
              <div className="absolute inset-0 bg-slate-900 border border-slate-800 rounded-[32px] overflow-hidden shadow-2xl p-3">
                <div className="relative w-full h-full rounded-[24px] overflow-hidden bg-slate-950">
                  {/* Base Image (Before) */}
                  <img 
                    src="https://images.pexels.com/photos/1516680/pexels-photo-1516680.jpeg?auto=compress&cs=tinysrgb&w=800" 
                    alt="Antes" 
                    className="w-full h-full object-cover object-top brightness-75" 
                  />
                  
                  {/* Animated Styles (After) */}
                  {featuredItems.map((item, index) => (
                    <img 
                      key={item.name}
                      src={item.image} 
                      alt={item.name} 
                      className="animated-style-image"
                      style={{ animationDelay: `${index * 4}s` }}
                    />
                  ))}

                  {/* Escáner Visual */}
                  <div className="scan-line absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-500 via-orange-500 to-red-500 shadow-[0_0_20px_6px_rgba(239,68,68,0.8)] z-10"></div>
                  
                  {/* Título Estilo */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/80 to-transparent p-6 text-center backdrop-blur-[2px]">
                    <span className="text-[10px] font-black tracking-[0.3em] text-red-500 uppercase block mb-1">RECOMENDACIÓN DE VISAGISMO IA</span>
                    <p className="text-white text-xl font-black tracking-wide text-fade-in-out" style={{ animationDelay: `${(itemIndex * 4)}s`}}>
                      {featuredItems[itemIndex].name}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="beneficios" className="py-24 bg-slate-950 border-t border-slate-900 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <span className="text-xs font-black tracking-[0.25em] text-red-500 uppercase">BENEFICIOS EXCLUSIVOS</span>
            <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight">El Impulso que tu Barbería necesita</h2>
            <p className="text-slate-400 text-base md:text-lg">
              Integra tecnología de vanguardia para diferenciarte de la competencia, optimizar tus turnos y multiplicar el ticket promedio de compra.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((b, idx) => (
              <div 
                key={idx} 
                className="bg-slate-900/40 border border-slate-900 p-8 rounded-3xl hover:border-red-600/50 hover:bg-slate-900/60 transition-all duration-300 group hover:-translate-y-1"
              >
                <div className="text-4xl mb-4 bg-slate-900 w-14 h-14 rounded-2xl flex items-center justify-center border border-slate-800 group-hover:border-red-600/30 transition-colors">
                  {b.emoji}
                </div>
                <h3 className="text-lg font-black uppercase tracking-tight text-white mb-2">{b.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="caracteristicas" className="py-24 bg-slate-900/30 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <span className="text-xs font-black tracking-[0.25em] text-red-500 uppercase">SISTEMA INTEGRADO</span>
            <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight">Todo en una sola plataforma SaaS</h2>
            <p className="text-slate-400 text-base md:text-lg">
              Ofrece una experiencia sin fricciones tanto para tus estilistas en su flujo de trabajo como para los clientes en su celular.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard 
              icon={<MirrorIcon className="w-8 h-8"/>} 
              title="Espejo Virtual IA" 
              description="Análisis de visagismo digital. Los clientes prueban cortes de pelo, barbas y variaciones cromáticas al instante de forma interactiva."
            />
            <FeatureCard 
              icon={<ChatIcon className="w-8 h-8"/>} 
              title="Asistente de Estilismo" 
              description="Consejero experto offline disponible 24/7. Responde dudas de cuidado personal, sugiere looks y estimula reservas automáticas."
            />
            <FeatureCard 
              icon={<CalendarIcon className="w-8 h-8"/>} 
              title="Reservas al Instante" 
              description="Calendario inteligente de agendamiento. Los clientes eligen servicio, barbero y fecha disponible en segundos sin demoras."
            />
            <FeatureCard 
              icon={<DashboardIcon className="w-8 h-8"/>} 
              title="Panel de Control SaaS" 
              description="Visualiza tus ingresos, popularidad de servicios, actividad de simulaciones y estadísticas de tu barbería en tiempo real."
            />
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonios" className="py-24 bg-slate-950 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <span className="text-xs font-black tracking-[0.25em] text-red-500 uppercase">TESTIMONIOS REALES</span>
            <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight">Aprobado por los Profesionales</h2>
            <p className="text-slate-400 text-base md:text-lg">
              Descubre cómo estilistas y dueños de salones han transformado su negocio y optimizado sus ingresos usando nuestra tecnología.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((t, idx) => (
              <div key={idx} className="bg-slate-900 border border-slate-900 rounded-3xl p-8 flex flex-col justify-between shadow-xl relative hover:border-slate-800 transition-all">
                <span className="text-6xl text-slate-800 absolute top-4 right-6 font-serif pointer-events-none">“</span>
                <p className="text-slate-300 text-sm leading-relaxed italic relative z-10 mb-8">
                  {t.quote}
                </p>
                <div className="flex items-center space-x-4">
                  <img src={t.image} alt={t.name} className="w-12 h-12 rounded-2xl object-cover border border-slate-800" />
                  <div>
                    <h4 className="text-sm font-black text-white uppercase tracking-tight">{t.name}</h4>
                    <p className="text-xs text-slate-500 font-medium">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing/CTA Section */}
      <section id="planes" className="py-24 bg-slate-900/20 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <span className="text-xs font-black tracking-[0.25em] text-red-500 uppercase">PLANES Y PRECIOS</span>
          <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight mt-2">Tarifas Simples para Crecer</h2>
          <p className="text-slate-400 mt-4 max-w-2xl mx-auto text-base">
            Comienza gratis hoy mismo. Actualiza tu suscripción cuando lo necesites para desbloquear más simulaciones de visagismo y análisis ilimitados.
          </p>

          {/* Toggle de facturación */}
          <div className="flex items-center justify-center space-x-4 mt-8 mb-16">
            <span className={`text-xs font-black uppercase tracking-widest ${!isYearly ? 'text-white' : 'text-slate-500'}`}>Mensual</span>
            <button 
              id="btn_pricing_toggle"
              onClick={() => setIsYearly(!isYearly)} 
              className="w-12 h-6 bg-slate-800 rounded-full p-1 transition-all relative flex items-center"
            >
              <div className={`w-4 h-4 bg-red-600 rounded-full transition-transform transform ${isYearly ? 'translate-x-6' : 'translate-x-0'}`}></div>
            </button>
            <span className={`text-xs font-black uppercase tracking-widest flex items-center ${isYearly ? 'text-white' : 'text-slate-500'}`}>
              Anual <span className="ml-2 bg-green-500/10 border border-green-500/20 text-green-500 text-[9px] px-2 py-0.5 rounded-full font-black">AHORRA 20%</span>
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <PricingCard 
              plan="Freemium"
              price="0"
              features={[
                "10 Análisis de IA / mes",
                "Espejo Virtual Básico (Frente)",
                "1 Estilista registrado",
                "Gestión de agenda básica",
                "Soporte comunitario vía email"
              ]}
              onCtaClick={onShowLogin}
              isFeatured={false}
            />
            <PricingCard 
              plan="Básico"
              price={isYearly ? "15" : "19"}
              isYearlyLabel={isYearly}
              features={[
                "100 Análisis de IA / mes",
                "Espejo Virtual avanzado (Frente + Perfil)",
                "Hasta 3 Estilistas en equipo",
                "Confirmaciones por WhatsApp",
                "Soporte técnico por correo"
              ]}
              onCtaClick={onShowLogin}
              isFeatured={true}
            />
            <PricingCard 
              plan="Profesional"
              price={isYearly ? "39" : "49"}
              isYearlyLabel={isYearly}
              features={[
                "Análisis de IA ilimitados",
                "Propuestas en todos los ángulos",
                "Estilistas ilimitados",
                "SaaS Whitelabel (Marca Propia)",
                "Soporte multicanal 24/7"
              ]}
              onCtaClick={onShowLogin}
              isFeatured={false}
            />
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-24 bg-slate-950 border-t border-slate-900 relative">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center space-y-4 mb-16">
            <span className="text-xs font-black tracking-[0.25em] text-red-500 uppercase">RESOLVEMOS TUS DUDAS</span>
            <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight">Preguntas Frecuentes</h2>
            <p className="text-slate-400 text-sm md:text-base">
              ¿Tienes preguntas sobre el funcionamiento del software? Aquí tienes las respuestas a las consultas más comunes de nuestros usuarios.
            </p>
          </div>

          <div className="space-y-4">
            {FAQs.map((faq, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <div key={idx} className="bg-slate-900/50 border border-slate-900 rounded-2xl overflow-hidden transition-all">
                  <button 
                    onClick={() => setActiveFaq(isOpen ? null : idx)}
                    className="w-full text-left px-6 py-5 flex justify-between items-center focus:outline-none"
                  >
                    <span className="text-sm md:text-base font-black uppercase tracking-tight text-white">{faq.question}</span>
                    <span className={`text-xl font-bold transition-transform ${isOpen ? 'rotate-45 text-red-500' : 'text-slate-400'}`}>+</span>
                  </button>
                  <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? 'max-h-60 border-t border-slate-900/80' : 'max-h-0'}`}>
                    <p className="p-6 text-sm text-slate-400 leading-relaxed bg-slate-950/20">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-900 py-16">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <div className="space-y-4">
            <h3 className="text-xl font-extrabold tracking-tight">BARBER<span className="bg-gradient-to-r from-red-500 to-red-600 text-transparent bg-clip-text font-black italic">AI</span></h3>
            <p className="text-slate-500 text-xs font-medium leading-relaxed">
              El primer software offline de estilismo con inteligencia artificial integrada. Modernizando barberías tradicionales desde 2026.
            </p>
          </div>
          <div>
            <h4 className="text-xs font-black text-white uppercase tracking-widest mb-4">Producto</h4>
            <ul className="space-y-2 text-xs text-slate-400 font-semibold">
              <li><a href="#beneficios" className="hover:text-red-500 transition-colors">Beneficios</a></li>
              <li><a href="#caracteristicas" className="hover:text-red-500 transition-colors">Características</a></li>
              <li><a href="#planes" className="hover:text-red-500 transition-colors">Planes y Precios</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-black text-white uppercase tracking-widest mb-4">Legal</h4>
            <ul className="space-y-2 text-xs text-slate-400 font-semibold">
              <li><button onClick={() => setIsTermsOpen(true)} className="hover:text-red-500 transition-colors text-left focus:outline-none">Términos de Servicio</button></li>
              <li><button onClick={() => setIsPrivacyOpen(true)} className="hover:text-red-500 transition-colors text-left focus:outline-none">Política de Privacidad</button></li>
              <li><span className="opacity-50">SLA de Servicio IA</span></li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-black text-white uppercase tracking-widest mb-4">Desarrollador</h4>
            <ul className="space-y-2 text-xs text-slate-400 font-semibold">
              <li><span className="text-slate-300">L&L Dev System</span></li>
              <li><span className="text-slate-500">Ing. Luis A. Mañon Z.</span></li>
              <li className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">PLATAFORMA INTEGRADA DE IA ACTIVA</li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 pt-8 border-t border-slate-900 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-slate-500 font-medium">
            &copy; {new Date().getFullYear()} Barber Shop AI. Todos los derechos reservados.
          </p>
          <div className="flex space-x-6 text-xs text-slate-500 font-semibold">
            <span className="hover:text-white transition-colors cursor-pointer">Soporte</span>
            <span className="hover:text-white transition-colors cursor-pointer">Contacto</span>
            <span className="hover:text-white transition-colors cursor-pointer">Estatus</span>
          </div>
        </div>
      </footer>

      {/* Términos de Servicio Modal */}
      {isTermsOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[150] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full max-h-[80vh] flex flex-col shadow-2xl">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <h3 className="text-lg font-black uppercase tracking-tight text-white">Términos de Servicio</h3>
              <button 
                onClick={() => setIsTermsOpen(false)}
                className="text-slate-400 hover:text-white font-bold text-lg"
              >
                ✕
              </button>
            </div>
            <div className="p-6 overflow-y-auto text-xs text-slate-300 space-y-4 leading-relaxed font-medium">
              <p className="font-bold text-white text-sm">Última actualización: Julio 2026</p>
              <p>Bienvenido a Barber Shop AI. Al acceder o utilizar nuestra plataforma, usted acepta estar sujeto a estos Términos de Servicio.</p>
              
              <h4 className="text-white font-black uppercase tracking-wider text-xs">1. Descripción del Servicio</h4>
              <p>Barber Shop AI proporciona una plataforma SaaS que utiliza modelos de inteligencia artificial para realizar análisis de visagismo facial y previsualizaciones estéticas virtuales para barberías y salones de belleza, además de gestionar reservas y comunicaciones con clientes.</p>
              
              <h4 className="text-white font-black uppercase tracking-wider text-xs">2. Cuentas y Registro</h4>
              <p>Para utilizar ciertas funciones, debe registrar una cuenta proporcionando datos verídicos y mantener la seguridad de sus credenciales. Usted es responsable de todas las actividades realizadas en su cuenta.</p>
              
              <h4 className="text-white font-black uppercase tracking-wider text-xs">3. Propiedad Intelectual y Contenido</h4>
              <p>Las imágenes procesadas y análisis generados a través de nuestro "Espejo Virtual" se rigen bajo los derechos de uso del cliente. Barber Shop AI no reclama propiedad sobre las fotos cargadas por los usuarios, las cuales se procesan con el único fin de proveer las simulaciones de corte de cabello.</p>
              
              <h4 className="text-white font-black uppercase tracking-wider text-xs">4. Suscripciones y Pagos</h4>
              <p>Los servicios premium están sujetos a planes de pago mensuales o anuales descritos en nuestra plataforma. Las cancelaciones se pueden realizar en cualquier momento desde el panel de facturación y surtirán efecto al finalizar el ciclo de facturación actual.</p>
              
              <h4 className="text-white font-black uppercase tracking-wider text-xs">5. Limitación de Responsabilidad</h4>
              <p>Las previsualizaciones generadas por la IA son meramente ilustrativas y experimentales. El resultado final del corte o estilo de cabello real depende exclusivamente de la ejecución técnica del barbero o estilista profesional.</p>
            </div>
            <div className="p-6 border-t border-slate-800 flex justify-end">
              <button 
                onClick={() => setIsTermsOpen(false)}
                className="bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-widest px-6 py-3 rounded-xl transition-all"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Política de Privacidad Modal */}
      {isPrivacyOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[150] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full max-h-[80vh] flex flex-col shadow-2xl">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <h3 className="text-lg font-black uppercase tracking-tight text-white">Política de Privacidad</h3>
              <button 
                onClick={() => setIsPrivacyOpen(false)}
                className="text-slate-400 hover:text-white font-bold text-lg"
              >
                ✕
              </button>
            </div>
            <div className="p-6 overflow-y-auto text-xs text-slate-300 space-y-4 leading-relaxed font-medium">
              <p className="font-bold text-white text-sm">Última actualización: Julio 2026</p>
              <p>En Barber Shop AI, nos tomamos muy en serio la privacidad de sus datos. Esta Política describe cómo recopilamos, usamos y protegemos su información.</p>
              
              <h4 className="text-white font-black uppercase tracking-wider text-xs">1. Datos que Recopilamos</h4>
              <p>Recopilamos datos de registro (nombre, correo electrónico), información de facturación procesada de forma segura por pasarelas externas, y las fotos del rostro cargadas temporalmente para ejecutar el análisis de visagismo en el Espejo Virtual.</p>
              
              <h4 className="text-white font-black uppercase tracking-wider text-xs">2. Procesamiento de Fotos Faciales</h4>
              <p>Las fotografías cargadas para el análisis de estilo e inteligencia artificial se procesan de forma transitoria para generar las recomendaciones y visualizaciones de peinado. No vendemos, transferimos ni compartimos sus fotos con terceros no autorizados.</p>
              
              <h4 className="text-white font-black uppercase tracking-wider text-xs">3. Seguridad de la Información</h4>
              <p>Implementamos medidas de encriptación SSL y almacenamiento seguro para evitar cualquier acceso no autorizado o alteración de sus datos de usuario y registros de citas.</p>
              
              <h4 className="text-white font-black uppercase tracking-wider text-xs">4. Sus Derechos</h4>
              <p>Usted puede solicitar la eliminación de su cuenta, fotos cargadas o historial de reservas enviando una solicitud a nuestro equipo de soporte técnico en cualquier momento.</p>
            </div>
            <div className="p-6 border-t border-slate-800 flex justify-end">
              <button 
                onClick={() => setIsPrivacyOpen(false)}
                className="bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-widest px-6 py-3 rounded-xl transition-all"
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const FeatureCard: React.FC<{icon: React.ReactNode, title: string, description: string}> = ({icon, title, description}) => (
  <div className="bg-slate-900/50 p-8 rounded-3xl border border-slate-900/80 hover:border-red-600/30 hover:bg-slate-900 transition-all duration-300 hover:-translate-y-1 group">
    <div className="text-red-500 mb-4 bg-slate-950 w-12 h-12 rounded-xl flex items-center justify-center border border-slate-800 group-hover:border-red-600/40 transition-colors">
      {icon}
    </div>
    <h3 className="text-base font-black uppercase tracking-tight text-white mb-2">{title}</h3>
    <p className="text-xs text-slate-400 leading-relaxed">{description}</p>
  </div>
);

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-emerald-500 mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
  </svg>
);

interface PricingCardProps {
  plan: string;
  price: string;
  isYearlyLabel?: boolean;
  features: string[];
  onCtaClick: () => void;
  isFeatured?: boolean;
}

const PricingCard: React.FC<PricingCardProps> = ({ plan, price, isYearlyLabel, features, onCtaClick, isFeatured }) => (
  <div className={`flex flex-col relative bg-slate-900 border rounded-3xl p-8 transition-all hover:-translate-y-1 ${isFeatured ? 'border-red-600 shadow-2xl shadow-red-600/10' : 'border-slate-900'}`}>
    {isFeatured && (
      <span className="bg-red-600 text-white text-[9px] font-black tracking-widest px-3.5 py-1.5 rounded-full absolute -top-4 left-1/2 -translate-x-1/2 uppercase shadow-md shadow-red-600/30">
        MÁS POPULAR
      </span>
    )}
    <h3 className="text-xl font-black uppercase tracking-tight text-white mb-2">{plan}</h3>
    <div className="my-6">
      <span className="text-4xl md:text-5xl font-black text-white">${price}</span>
      <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">/{isYearlyLabel ? 'mes' : 'mes'}</span>
      {isYearlyLabel && price !== "0" && <p className="text-[9px] text-emerald-500 font-bold uppercase tracking-wider mt-1">Facturado anualmente</p>}
    </div>
    
    <ul className="text-left space-y-3 text-slate-300 flex-grow mb-8 text-xs font-medium">
      {features.map((feature, i) => (
        <li key={i} className="flex items-start"><CheckIcon /> {feature}</li>
      ))}
    </ul>
    
    <button 
      onClick={onCtaClick} 
      className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${isFeatured ? 'bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-600/20' : 'bg-slate-800 text-slate-300 hover:bg-slate-750'}`}
    >
      Comenzar Ahora
    </button>
  </div>
);

export default HomeView;
