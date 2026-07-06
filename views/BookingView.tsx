
import React, { useState } from 'react';
import { BarberShop, Booking } from '../types';
import { getAvailableSlots, sendBookingConfirmationEmail } from '../services/geminiService';
import { saveBooking } from '../services/barberShopService';

interface BookingViewProps {
  shop: BarberShop;
  userId: string;
  userEmail: string;
  onBookingConfirmed: (bookingDetails: Omit<Booking, 'id'>) => void;
}

const teamMembers = [
  { id: '1', name: 'Carlos Mendoza', role: 'Master Barber', rating: '4.9', avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150', specialty: 'Fade y Estilado de Barba' },
  { id: '2', name: 'Mateo Rossi', role: 'Senior Stylist', rating: '4.8', avatar: 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=150', specialty: 'Corte Clásico y Tijera' },
  { id: '3', name: 'Javier Sanabria', role: 'Barber & Colorist', rating: '5.0', avatar: 'https://images.pexels.com/photos/1212979/pexels-photo-1212979.jpeg?auto=compress&cs=tinysrgb&w=150', specialty: 'Coloración y Diseños IA' },
];

const BookingView: React.FC<BookingViewProps> = ({ shop, userId, userEmail, onBookingConfirmed }) => {
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState(shop.services[0]?.name || "Corte Clásico");
  const [selectedBarber, setSelectedBarber] = useState(teamMembers[0]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFindSlots = async () => {
    setIsLoading(true);
    setError(null);
    setAvailableSlots([]);

    const today = new Date();
    today.setHours(0,0,0,0);
    const selected = new Date(selectedDate + 'T00:00:00');

    if (selected < today) {
      setError("Por favor, selecciona una fecha a partir de hoy.");
      setIsLoading(false);
      return;
    }

    try {
      const slots = await getAvailableSlots(selectedDate, selectedService, shop);
      if (slots.length === 0) {
        setError(`Lo sentimos, no hay turnos disponibles para el ${selected.toLocaleDateString('es-ES')}. Intenta con otra fecha.`);
      } else {
        setAvailableSlots(slots);
        setStep(3); // Go to Date/Time Selection after choosing Barber
      }
    } catch (e) {
      setError('Error al consultar horarios disponibles. Inténtalo de nuevo más tarde.');
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectSlot = (slot: string) => {
    setSelectedSlot(slot);
    setStep(4); // Resumen
  };
  
  const handleConfirmBooking = async () => {
    if (selectedSlot) {
      setIsLoading(true);
      try {
        const bookingData: Omit<Booking, 'id'> = {
          shopName: shop.name,
          service: selectedService,
          date: selectedDate,
          time: selectedSlot,
          userId: userId,
          barberName: selectedBarber.name // Optional parameter added elegantly
        };
        
        const { error: dbError } = await saveBooking(bookingData);
        if (dbError) throw dbError;
        
        if (userEmail) {
          sendBookingConfirmationEmail(userEmail, bookingData).catch(e => console.error("Error sending email:", e));
        }

        onBookingConfirmed(bookingData);
        setStep(5); // Success Screen
      } catch (e: any) {
        console.error(e);
        setError("Error al procesar la reserva: " + e.message);
      } finally {
        setIsLoading(false);
      }
    }
  };
  
  const handleReset = () => {
    setStep(1);
    setSelectedSlot(null);
    setAvailableSlots([]);
    setError(null);
  };

  const currentServiceDetails = shop.services.find(s => s.name === selectedService) || shop.services[0];

  return (
    <div className="w-full bg-slate-50 p-6 lg:p-10 min-h-full flex items-center justify-center">
      <div className="w-full max-w-3xl bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
        
        {/* Header con Progreso */}
        <div className="bg-slate-950 p-8 text-white relative">
          <div className="absolute top-0 right-0 p-3 bg-red-600 text-white font-black text-[8px] uppercase tracking-widest rounded-bl-xl">
            Sincronizado Offline
          </div>
          <h2 className="text-2xl font-black uppercase tracking-tight">Reservar Cita</h2>
          <p className="text-slate-400 text-xs font-semibold mt-1">
            Agendamiento inteligente en <span className="text-red-500 font-extrabold">{shop.name}</span>
          </p>

          {/* Línea de Progreso */}
          {step <= 4 && (
            <div className="mt-8 flex items-center justify-between">
              {[1, 2, 3, 4].map((num, i) => {
                const labels = ["Servicio", "Estilista", "Horario", "Confirmar"];
                const isActive = step >= num;
                return (
                  <div key={num} className="flex-1 flex items-center relative">
                    <div className="flex flex-col items-center z-10">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all duration-300 ${isActive ? 'bg-red-600 text-white shadow-lg shadow-red-600/30' : 'bg-slate-800 text-slate-500'}`}>
                        {num}
                      </div>
                      <span className={`text-[9px] font-black uppercase tracking-wider mt-2 ${isActive ? 'text-white' : 'text-slate-500'}`}>
                        {labels[i]}
                      </span>
                    </div>
                    {num < 4 && (
                      <div className="flex-1 h-0.5 bg-slate-800 absolute left-4 right-[-1rem] top-4 z-0">
                        <div className={`h-full bg-red-600 transition-all duration-300`} style={{ width: step > num ? '100%' : '0%' }}></div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="p-8">
          {/* STEP 1: Selección de Servicio */}
          {step === 1 && (
            <div className="space-y-6 animate-fade-in">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-3 mb-4">
                Paso 1: Elige un Servicio Premium
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {shop.services.map((s) => (
                  <button
                    key={s.name}
                    onClick={() => {
                      setSelectedService(s.name);
                      setStep(2);
                    }}
                    className={`w-full text-left p-5 border-2 rounded-2xl transition-all duration-300 hover:border-red-600 flex justify-between items-center ${selectedService === s.name ? 'border-red-600 bg-red-50/20' : 'border-slate-100 bg-white hover:bg-slate-50/50'}`}
                  >
                    <div>
                      <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{s.name}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">⏳ 30-45 MINUTOS</p>
                    </div>
                    <span className="text-lg font-black text-slate-900 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
                      {s.price}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2: Selección de Barbero */}
          {step === 2 && (
            <div className="space-y-6 animate-fade-in">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-3 mb-4">
                Paso 2: Selecciona tu Estilista Favorito
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {teamMembers.map((member) => (
                  <button
                    key={member.id}
                    onClick={() => setSelectedBarber(member)}
                    className={`w-full p-6 border-2 rounded-3xl transition-all duration-300 text-center flex flex-col items-center justify-between ${selectedBarber.id === member.id ? 'border-red-600 bg-red-50/20' : 'border-slate-100 bg-white hover:border-slate-300 hover:bg-slate-50'}`}
                  >
                    <img src={member.avatar} alt={member.name} className="w-16 h-16 rounded-2xl object-cover border border-slate-100 mb-4" />
                    <div>
                      <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{member.name}</p>
                      <p className="text-[10px] text-red-600 font-black uppercase tracking-widest mt-1">{member.role}</p>
                      <p className="text-[10px] text-slate-400 font-semibold mt-2">{member.specialty}</p>
                    </div>
                    <div className="mt-4 flex items-center justify-center space-x-1 text-xs font-black text-amber-500">
                      <span>⭐</span> <span>{member.rating}</span>
                    </div>
                  </button>
                ))}
              </div>
              
              <div className="pt-6 border-t border-slate-100 flex gap-4">
                <button onClick={() => setStep(1)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black py-4 rounded-2xl text-xs uppercase tracking-widest transition-all">
                  Atrás
                </button>
                <button onClick={handleFindSlots} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-black py-4 rounded-2xl text-xs uppercase tracking-widest transition-all shadow-lg shadow-red-600/20">
                  Continuar
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Selección de Fecha y Hora */}
          {step === 3 && (
            <div className="space-y-6 animate-fade-in">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-3 mb-4">
                Paso 3: Selecciona Fecha y Hora
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="date" className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Fecha de la Cita</label>
                  <input 
                    type="date" 
                    id="date" 
                    value={selectedDate} 
                    onChange={e => setSelectedDate(e.target.value)} 
                    className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-slate-900 font-bold focus:border-red-600 outline-none transition-all" 
                  />
                  <button 
                    onClick={handleFindSlots} 
                    disabled={isLoading} 
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-4 rounded-2xl text-xs uppercase tracking-widest transition-all mt-4 disabled:bg-slate-300"
                  >
                    {isLoading ? 'Consultando agenda...' : 'Consultar Disponibilidad'}
                  </button>
                </div>

                <div>
                  <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Horarios Disponibles</label>
                  {availableSlots.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3 max-h-48 overflow-y-auto pr-1">
                      {availableSlots.map(slot => (
                        <button 
                          key={slot} 
                          onClick={() => handleSelectSlot(slot)} 
                          className="py-3 px-2 border-2 border-slate-100 hover:border-red-600 hover:text-red-600 text-slate-700 font-black text-xs uppercase tracking-widest bg-white rounded-xl transition-all"
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="h-44 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl p-4 text-center">
                      <span className="text-2xl mb-2">📅</span>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Haz clic en consultar para cargar horarios</p>
                    </div>
                  )}
                </div>
              </div>

              {error && <p className="text-xs text-red-700 bg-red-50 p-4 rounded-2xl font-black uppercase tracking-tight">{error}</p>}
              
              <div className="pt-6 border-t border-slate-100 flex gap-4">
                <button onClick={() => setStep(2)} className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-black py-4 rounded-2xl text-xs uppercase tracking-widest transition-all">
                  Atrás
                </button>
              </div>
            </div>
          )}
          
          {/* STEP 4: Resumen y Confirmación */}
          {step === 4 && selectedSlot && (
            <div className="text-center space-y-6 animate-fade-in">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-3 mb-4">
                Paso 4: Confirma los Detalles
              </h3>
              
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 text-left space-y-4 max-w-md mx-auto">
                <div className="flex justify-between pb-3 border-b border-slate-200/60 text-xs">
                  <span className="text-slate-400 font-bold uppercase tracking-widest">Servicio</span>
                  <span className="font-black text-slate-900 uppercase tracking-tight">{selectedService}</span>
                </div>
                <div className="flex justify-between pb-3 border-b border-slate-200/60 text-xs">
                  <span className="text-slate-400 font-bold uppercase tracking-widest">Estilista</span>
                  <span className="font-black text-slate-900 uppercase tracking-tight">{selectedBarber.name}</span>
                </div>
                <div className="flex justify-between pb-3 border-b border-slate-200/60 text-xs">
                  <span className="text-slate-400 font-bold uppercase tracking-widest">Fecha</span>
                  <span className="font-black text-slate-900">{selectedDate}</span>
                </div>
                <div className="flex justify-between pb-3 border-b border-slate-200/60 text-xs">
                  <span className="text-slate-400 font-bold uppercase tracking-widest">Valor Estimado</span>
                  <span className="font-black text-red-600">{currentServiceDetails?.price || "$30"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-bold uppercase tracking-widest text-xs">Horario Reservado</span>
                  <span className="font-black text-xl text-slate-950 bg-white border border-slate-200 px-4 py-2 rounded-2xl">
                    {selectedSlot}
                  </span>
                </div>
              </div>

              {error && <p className="text-xs text-red-700 bg-red-50 p-4 rounded-2xl font-black uppercase tracking-tight">{error}</p>}

              <div className="flex gap-4 max-w-md mx-auto pt-4">
                <button onClick={() => setStep(3)} disabled={isLoading} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black py-4 rounded-2xl text-xs uppercase tracking-widest transition-all">
                  Atrás
                </button>
                <button onClick={handleConfirmBooking} disabled={isLoading} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-black py-4 rounded-2xl text-xs uppercase tracking-widest transition-all shadow-lg shadow-red-600/20">
                  {isLoading ? 'Agendando...' : 'Confirmar Reserva'}
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: Éxito */}
          {step === 5 && (
            <div className="text-center animate-fade-in py-8 space-y-6">
              <div className="w-20 h-20 bg-emerald-50 rounded-full mx-auto flex items-center justify-center mb-4 border border-emerald-100">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-3xl font-black uppercase tracking-tight text-slate-950">¡Cita Confirmada!</h3>
              <p className="text-slate-500 text-sm max-w-md mx-auto font-medium">
                Tu reserva con <span className="font-black text-slate-900">{selectedBarber.name}</span> para <span className="font-black text-slate-900 uppercase tracking-tight">{selectedService}</span> ha sido guardada en la agenda del salón.
              </p>
              <div className="pt-4 max-w-sm mx-auto">
                <button onClick={handleReset} className="w-full bg-slate-950 hover:bg-slate-900 text-white font-black py-4 rounded-2xl text-xs uppercase tracking-widest transition-all">
                  Agendar otra Cita
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingView;
