import React, { useRef, useEffect } from 'react';
import { Message } from '../types';
import ChatMessage from '../components/ChatMessage';
import ChatInput from '../components/ChatInput';

interface ChatViewProps {
  messages: Message[];
  isAiLoading: boolean;
  onSendMessage: (message: string) => void;
  appState: 'initial' | 'processing' | 'results';
}

const ChatView: React.FC<ChatViewProps> = ({ messages, isAiLoading, onSendMessage, appState }) => {
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const quickPrompts = [
    {
      title: "Análisis de Visagismo",
      desc: "¿Qué tipo de corte me favorece según mis facciones?",
      prompt: "¿Qué corte de cabello me favorece y qué es el Visagismo?",
      icon: "🎓"
    },
    {
      title: "Servicios y Precios",
      desc: "Ver la carta completa de tratamientos y tarifas.",
      prompt: "Muéstrame los servicios y precios disponibles",
      icon: "💰"
    },
    {
      title: "Agendar una Cita",
      desc: "Saber cómo reservar un turno de forma rápida.",
      prompt: "¿Cómo puedo agendar una cita o reservar un turno?",
      icon: "📅"
    },
    {
      title: "Estilos de Tendencia",
      desc: "Preguntar por cortes modernos como Fade o Buzz Cut.",
      prompt: "Recomiéndame estilos de tendencia para caballero",
      icon: "💈"
    }
  ];

  const conversationChips = [
    "¿Qué cortes recomiendan?",
    "¿Cuánto vale el corte clásico?",
    "¿Cómo funciona el Espejo Virtual?",
    "Consejo de cuidado de barba"
  ];

  return (
    <div className="flex flex-col bg-slate-50 h-full overflow-hidden">
      
      {/* Bot Chat Header */}
      <div className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center border-2 border-slate-100 shadow-sm text-xl animate-bounce duration-1000">
              💈
            </div>
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></span>
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Estilista AI de Turno</h3>
            <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider flex items-center">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block mr-1"></span>
              Disponible Offline (Local LLM)
            </span>
          </div>
        </div>
        <div className="text-right hidden sm:block">
          <span className="text-[9px] bg-red-50 text-red-600 px-2.5 py-1 rounded-full font-black uppercase tracking-wider">
            Soporte Inteligente
          </span>
        </div>
      </div>

      {/* Main Messages Panel */}
      <div 
        ref={chatContainerRef} 
        className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 scroll-smooth"
      >
        {messages.length === 0 ? (
          /* Empty Chat Welcome Hero State */
          <div className="max-w-2xl mx-auto py-8 space-y-8 animate-fade-in">
            <div className="text-center space-y-3">
              <div className="inline-block p-4 bg-white border border-slate-100 rounded-3xl shadow-xl shadow-slate-100/30 mb-2">
                <span className="text-4xl">🤖</span>
              </div>
              <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight">¡Hola! ¿En qué puedo asesorarte hoy?</h4>
              <p className="text-xs text-slate-400 font-medium max-w-md mx-auto leading-relaxed">
                Soy tu asesor estilista de Inteligencia Artificial. Puedo guiarte en cortes perfectos, visagismo, tarifas, o ayudarte a agendar una cita.
              </p>
            </div>

            {/* Bento Grid Sugerencias */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {quickPrompts.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => onSendMessage(item.prompt)}
                  className="w-full text-left p-5 bg-white border border-slate-100 hover:border-red-600 hover:shadow-lg rounded-2xl transition-all duration-300 flex space-x-4 items-start group"
                >
                  <div className="text-2xl p-2 bg-slate-50 rounded-xl group-hover:bg-red-50 transition-colors">
                    {item.icon}
                  </div>
                  <div>
                    <h5 className="text-xs font-black text-slate-900 uppercase tracking-tight group-hover:text-red-600 transition-colors">{item.title}</h5>
                    <p className="text-[11px] text-slate-400 font-medium mt-1 leading-relaxed">{item.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Messages List */
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
          </div>
        )}

        {isAiLoading && appState !== 'processing' && (
          <div className="max-w-3xl mx-auto flex justify-start">
            <div className="flex items-center space-x-2 bg-white border border-slate-100 shadow text-slate-800 px-5 py-3.5 rounded-2xl rounded-bl-none">
              <div className="w-1.5 h-1.5 bg-red-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-1.5 h-1.5 bg-red-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-1.5 h-1.5 bg-red-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider ml-2">Pensando...</span>
            </div>
          </div>
        )}
      </div>

      {/* Quick contextual chips at bottom */}
      {messages.length > 0 && (
        <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 overflow-x-auto">
          <div className="max-w-3xl mx-auto flex space-x-2 whitespace-nowrap py-1">
            {conversationChips.map((chip, idx) => (
              <button
                key={idx}
                disabled={isAiLoading || appState === 'processing'}
                onClick={() => onSendMessage(chip)}
                className="bg-white hover:bg-red-50 hover:text-red-600 border border-slate-200 hover:border-red-600 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider text-slate-500 transition-all duration-300"
              >
                💬 {chip}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <footer className="p-4 border-t border-slate-100 bg-white">
        <div className="max-w-3xl mx-auto">
          <ChatInput
            onSendMessage={onSendMessage}
            disabled={isAiLoading || appState === 'processing'}
          />
          <p className="text-[8px] text-center text-slate-400 font-bold uppercase tracking-widest mt-2">
            El asistente AI nunca sustituye el criterio final de tu estilista físico en el salón.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default ChatView;
