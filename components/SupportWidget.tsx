import React, { useState, useEffect } from 'react';
import { HelpCircle, X, Send, CheckCircle, Ticket, List, BookOpen, AlertCircle } from 'lucide-react';
import { enterpriseService } from '../services/enterpriseService';
import { SupportTicket } from '../server/support';

export const SupportWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'faq' | 'new_ticket' | 'my_tickets'>('faq');
  
  // New ticket state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState('Otros');
  const [priority, setPriority] = useState<'Baja' | 'Media' | 'Alta' | 'Crítica'>('Media');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // My tickets state
  const [searchEmail, setSearchEmail] = useState('');
  const [myTickets, setMyTickets] = useState<SupportTicket[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [chatMessage, setChatMessage] = useState('');

  // FAQ state
  const [faqs, setFaqs] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      loadFAQs();
    }
  }, [isOpen]);

  const loadFAQs = async () => {
    const data = await enterpriseService.fetchKB();
    setFaqs(data);
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !subject || !description) return;

    setIsSubmitting(true);
    const created = await enterpriseService.createSupportTicket({
      customerName: name,
      email,
      category,
      priority,
      subject,
      description
    });
    setIsSubmitting(false);

    if (created) {
      setSubmitSuccess(true);
      setName('');
      setSubject('');
      setDescription('');
      setTimeout(() => setSubmitSuccess(false), 5000);
    }
  };

  const handleSearchTickets = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchEmail.trim()) return;

    setIsSearching(true);
    const all = await enterpriseService.fetchTickets();
    // Filter by customer email
    const filtered = all.filter(t => t.email.toLowerCase() === searchEmail.trim().toLowerCase());
    setMyTickets(filtered);
    setIsSearching(false);
  };

  const handleSendCustomerMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim() || !selectedTicket) return;

    const updated = await enterpriseService.sendTicketMessage(selectedTicket.id, 'customer', chatMessage);
    if (updated) {
      setChatMessage('');
      setSelectedTicket(updated);
      setMyTickets(prev => prev.map(t => t.id === updated.id ? updated : t));
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-red-600 hover:bg-slate-950 text-white rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 transform hover:scale-105 hover:rotate-6 border border-red-500/20"
        id="btn-support-floating"
      >
        {isOpen ? <X className="w-6 h-6" /> : <HelpCircle className="w-6 h-6" />}
      </button>

      {/* Support Box */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-[380px] h-[520px] bg-white rounded-3xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden animate-fadeIn">
          {/* Box Header */}
          <div className="p-6 bg-slate-950 text-white flex justify-between items-center">
            <div>
              <span className="text-[8px] font-black uppercase text-red-500 tracking-widest block mb-0.5">CENTRO DE AYUDA</span>
              <h3 className="text-sm font-black uppercase tracking-tight">Soporte Barber AI</h3>
            </div>
            <span className="px-2.5 py-1 bg-red-500/10 border border-red-500/20 text-red-500 text-[8px] font-black uppercase tracking-widest rounded-full">
              SaaS Online
            </span>
          </div>

          {/* Sub-Tabs Selector */}
          <div className="grid grid-cols-3 border-b border-slate-100 text-[9px] font-black uppercase tracking-wider text-center bg-slate-50/50">
            <button
              onClick={() => { setActiveSubTab('faq'); setSelectedTicket(null); }}
              className={`py-3 flex items-center justify-center gap-1.5 transition-colors ${
                activeSubTab === 'faq' ? 'text-red-600 border-b-2 border-red-600 bg-white' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              FAQs
            </button>
            <button
              onClick={() => { setActiveSubTab('new_ticket'); setSelectedTicket(null); }}
              className={`py-3 flex items-center justify-center gap-1.5 transition-colors ${
                activeSubTab === 'new_ticket' ? 'text-red-600 border-b-2 border-red-600 bg-white' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Ticket className="w-3.5 h-3.5" />
              Nuevo Ticket
            </button>
            <button
              onClick={() => { setActiveSubTab('my_tickets'); setSelectedTicket(null); }}
              className={`py-3 flex items-center justify-center gap-1.5 transition-colors ${
                activeSubTab === 'my_tickets' ? 'text-red-600 border-b-2 border-red-600 bg-white' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              Mis Tickets
            </button>
          </div>

          {/* Sub-Tabs Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            
            {/* 1. FAQs SUB-TAB */}
            {activeSubTab === 'faq' && (
              <div className="space-y-4">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Preguntas Frecuentes</p>
                <div className="space-y-3">
                  {faqs.map((faq) => (
                    <div key={faq.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100/80 space-y-1">
                      <h4 className="text-xs font-black text-slate-900 uppercase tracking-tight">{faq.title}</h4>
                      <p className="text-[11px] text-slate-500 font-medium leading-normal">{faq.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 2. NEW TICKET SUB-TAB */}
            {activeSubTab === 'new_ticket' && (
              <div className="space-y-4">
                {submitSuccess ? (
                  <div className="h-full flex flex-col items-center justify-center text-center py-12 space-y-3">
                    <CheckCircle className="w-12 h-12 text-emerald-500 animate-bounce" />
                    <p className="text-xs font-black uppercase text-slate-900 tracking-wider">¡Ticket Creado!</p>
                    <p className="text-[11px] text-slate-500 font-medium">Hemos registrado tu caso. Nuestro equipo lo auditará y responderá a la brevedad.</p>
                  </div>
                ) : (
                  <form onSubmit={handleCreateTicket} className="space-y-3.5">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Abre un Caso de Soporte Técnico</p>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[8px] font-black uppercase tracking-wider text-slate-400">Nombre</label>
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold uppercase bg-slate-50"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8px] font-black uppercase tracking-wider text-slate-400">Email</label>
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold bg-slate-50"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[8px] font-black uppercase tracking-wider text-slate-400">Categoría</label>
                        <select
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold uppercase bg-slate-50"
                        >
                          <option value="Facturación">Facturación</option>
                          <option value="Visagismo AI">Visagismo AI</option>
                          <option value="Agendas">Agendas</option>
                          <option value="Otros">Otros</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8px] font-black uppercase tracking-wider text-slate-400">Prioridad</label>
                        <select
                          value={priority}
                          onChange={(e) => setPriority(e.target.value as any)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold uppercase bg-slate-50"
                        >
                          <option value="Baja">Baja</option>
                          <option value="Media">Media</option>
                          <option value="Alta">Alta</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[8px] font-black uppercase tracking-wider text-slate-400">Asunto</label>
                      <input
                        type="text"
                        required
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold uppercase bg-slate-50"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[8px] font-black uppercase tracking-wider text-slate-400">Descripción detallada</label>
                      <textarea
                        required
                        rows={3}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold bg-slate-50 resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3 bg-red-600 hover:bg-slate-950 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all shadow-lg"
                    >
                      {isSubmitting ? 'Enviando Caso...' : 'Enviar Ticket'}
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* 3. MY TICKETS SUB-TAB */}
            {activeSubTab === 'my_tickets' && (
              <div className="space-y-4 h-full flex flex-col">
                {!selectedTicket ? (
                  <div className="space-y-4">
                    <form onSubmit={handleSearchTickets} className="space-y-2">
                      <label className="text-[8px] font-black uppercase tracking-wider text-slate-400">Buscar por Email del Solicitante</label>
                      <div className="flex gap-2">
                        <input
                          type="email"
                          required
                          placeholder="ejemplo@correo.com"
                          value={searchEmail}
                          onChange={(e) => setSearchEmail(e.target.value)}
                          className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold bg-slate-50"
                        />
                        <button
                          type="submit"
                          className="bg-slate-950 hover:bg-red-600 text-white text-[9px] font-black uppercase tracking-widest px-4 rounded-xl transition-colors"
                        >
                          Buscar
                        </button>
                      </div>
                    </form>

                    {isSearching ? (
                      <div className="flex justify-center py-10">
                        <div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    ) : myTickets.length === 0 ? (
                      <div className="text-center py-12 space-y-1">
                        <AlertCircle className="w-8 h-8 text-slate-300 mx-auto" />
                        <p className="text-[10px] text-slate-400 font-bold uppercase">No se encontraron tickets</p>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {myTickets.map((ticket) => (
                          <div
                            key={ticket.id}
                            onClick={() => setSelectedTicket(ticket)}
                            className="p-3.5 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-100 cursor-pointer text-left transition-all"
                          >
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-[8px] font-black uppercase tracking-wider text-slate-400">
                                {ticket.category}
                              </span>
                              <span className={`text-[8px] font-black uppercase ${
                                ticket.status === 'Abierto' ? 'text-green-600' :
                                ticket.status === 'En Progreso' ? 'text-amber-500' : 'text-slate-400'
                              }`}>
                                {ticket.status}
                              </span>
                            </div>
                            <h4 className="text-xs font-black uppercase tracking-tight text-slate-900">{ticket.subject}</h4>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  /* Conversation Chat inside Widget */
                  <div className="flex flex-col justify-between h-[360px]">
                    <div className="border-b border-slate-100 pb-2 mb-2 flex justify-between items-center">
                      <button
                        onClick={() => setSelectedTicket(null)}
                        className="text-[9px] font-black text-red-600 uppercase tracking-widest hover:text-slate-900"
                      >
                        ← Volver a la Lista
                      </button>
                      <span className="text-[8px] font-mono text-slate-400">TICKET: {selectedTicket.id}</span>
                    </div>

                    {/* Chat Bubble history */}
                    <div className="flex-1 overflow-y-auto space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100 max-h-[250px]">
                      {selectedTicket.messages.map((msg, idx) => (
                        <div key={idx} className={`flex flex-col ${msg.sender === 'customer' ? 'items-end' : 'items-start'}`}>
                          <div className={`p-3 rounded-xl max-w-[85%] text-[11px] font-medium leading-normal shadow-sm ${
                            msg.sender === 'customer'
                              ? 'bg-red-600 text-white rounded-tr-none'
                              : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'
                          }`}>
                            {msg.text}
                          </div>
                          <span className="text-[7px] font-mono text-slate-400 mt-1 uppercase">
                            {msg.sender === 'customer' ? 'TÚ' : 'SOPORTE'} • {new Date(msg.time).toLocaleTimeString()}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Chat response */}
                    <form onSubmit={handleSendCustomerMessage} className="flex gap-2 mt-2">
                      <input
                        type="text"
                        placeholder="Escribe un mensaje..."
                        value={chatMessage}
                        onChange={(e) => setChatMessage(e.target.value)}
                        className="flex-1 px-3 py-2 border border-slate-200 outline-none rounded-xl text-xs font-bold bg-slate-50 focus:border-red-600 focus:ring-1 focus:ring-red-600"
                      />
                      <button
                        type="submit"
                        className="bg-slate-950 hover:bg-red-600 text-white p-2.5 rounded-xl transition-colors shrink-0"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </form>
                  </div>
                )}

              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
};
