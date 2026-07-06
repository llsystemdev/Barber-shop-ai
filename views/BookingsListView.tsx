import React, { useState } from 'react';
import { Booking } from '../types';
import { CalendarIcon } from '../assets/icons';

type ActiveView = 'chat' | 'mirror' | 'booking' | 'bookingsList' | 'shopProfile';

interface BookingsListViewProps {
  bookings: Booking[];
  onNavigate: (view: ActiveView) => void;
}

const BookingsListView: React.FC<BookingsListViewProps> = ({ bookings, onNavigate }) => {
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('upcoming');
  const [activeBookings, setActiveBookings] = useState<Booking[]>(bookings);
  const [cancelingId, setCancelingId] = useState<string | null>(null);

  // Sync state initially or on bookings prop update
  React.useEffect(() => {
    setActiveBookings(bookings);
  }, [bookings]);

  const handleCancelBooking = (id: string) => {
    // Elegant offline cancel feedback
    setActiveBookings(prev => prev.filter(b => b.id !== id));
    setCancelingId(null);
  };

  const formatDateLabel = (dateString: string) => {
    const parts = dateString.split('-');
    if (parts.length === 3) {
      // Month labels
      const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
      const monthIdx = parseInt(parts[1], 10) - 1;
      return {
        day: parts[2],
        month: months[monthIdx] || 'Mes',
        year: parts[0]
      };
    }
    return { day: '00', month: 'Mes', year: '0000' };
  };

  const formatFullDate = (dateString: string) => {
    try {
      return new Date(dateString + 'T00:00:00').toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (e) {
      return dateString;
    }
  };

  // Determine if booking is upcoming
  const isUpcoming = (dateString: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const bookingDate = new Date(dateString + 'T00:00:00');
    return bookingDate >= today;
  };

  const filteredBookings = activeBookings.filter(b => {
    if (filter === 'upcoming') return isUpcoming(b.date);
    if (filter === 'past') return !isUpcoming(b.date);
    return true;
  });

  return (
    <div className="w-full h-full flex flex-col p-6 bg-slate-50 overflow-y-auto">
      <div className="w-full max-w-4xl mx-auto space-y-8">
        
        {/* Header con Sincronización */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-3xl font-black text-slate-950 uppercase tracking-tight">Mis Reservas</h2>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[9px] mt-1">
              📅 Listado de citas agendadas • Sincronización offline garantizada
            </p>
          </div>
          <button
            onClick={() => onNavigate('booking')}
            className="bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-widest px-5 py-3 rounded-2xl shadow-lg shadow-red-600/20 transition-all"
          >
            + Nueva Cita Premium
          </button>
        </header>

        {/* Filtros Premium */}
        {activeBookings.length > 0 && (
          <div className="flex border-b border-slate-200/80 space-x-1">
            {[
              { id: 'upcoming', label: 'Próximas Citas' },
              { id: 'past', label: 'Historial / Pasados' },
              { id: 'all', label: 'Ver Todas' }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id as any)}
                className={`px-4 py-2.5 border-b-2 font-black text-[10px] uppercase tracking-widest transition-all ${filter === f.id ? 'border-red-600 text-red-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}

        {/* CONTENIDO PRINCIPAL */}
        {filteredBookings.length === 0 ? (
          /* Empty state elegant */
          <div className="text-center bg-white p-12 rounded-3xl border border-slate-100 shadow-sm space-y-6">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto text-red-600 border border-red-100">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">No tienes citas en esta pestaña</h3>
              <p className="text-xs text-slate-400 font-medium max-w-sm mx-auto leading-relaxed">
                {filter === 'upcoming' 
                  ? 'No hay turnos pendientes para tus próximos días. ¿Preparado para renovar tu apariencia hoy?' 
                  : 'No registras visitas anteriores en tu historial local.'}
              </p>
            </div>
            <button 
              onClick={() => onNavigate('booking')}
              className="bg-slate-950 hover:bg-slate-900 text-white font-black py-3.5 px-8 rounded-2xl text-xs uppercase tracking-widest transition-all"
            >
              Agendar Cita Ahora
            </button>
          </div>
        ) : (
          /* Bookings Card List */
          <div className="space-y-4">
            {filteredBookings.map((booking) => {
              const dateObj = formatDateLabel(booking.date);
              const isUpcomingBooking = isUpcoming(booking.date);

              return (
                <div 
                  key={booking.id} 
                  className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden"
                >
                  {/* Status indicator tag */}
                  <div className="absolute top-0 right-0 p-2 text-[7px] font-black uppercase tracking-widest rounded-bl-xl bg-slate-100">
                    {isUpcomingBooking ? (
                      <span className="text-emerald-600">● Confirmada</span>
                    ) : (
                      <span className="text-slate-400">● Finalizada</span>
                    )}
                  </div>

                  <div className="flex items-center space-x-5 w-full md:w-auto">
                    {/* Visual Date Badge (Ticket feel) */}
                    <div className="flex-shrink-0 w-16 h-18 bg-slate-950 text-white rounded-2xl flex flex-col items-center justify-center border border-slate-800 text-center shadow-lg">
                      <span className="text-[9px] font-black uppercase tracking-widest text-red-500">{dateObj.month}</span>
                      <span className="text-2xl font-black leading-none">{dateObj.day}</span>
                      <span className="text-[8px] text-slate-400 font-semibold mt-0.5">{dateObj.year}</span>
                    </div>

                    {/* Booking Details */}
                    <div>
                      <h4 className="text-lg font-black text-slate-950 uppercase tracking-tight leading-none mb-1">
                        {booking.service}
                      </h4>
                      <p className="text-xs text-slate-400 font-semibold">
                        Salón: <span className="text-slate-900 font-bold">{booking.shopName}</span>
                      </p>
                      
                      {/* Barber attribution displayed if exists */}
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1.5 flex items-center">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-600 mr-1.5"></span>
                        Estilista: <span className="text-red-600 font-black ml-1">{(booking as any).barberName || "Carlos Mendoza (Asignado)"}</span>
                      </p>
                    </div>
                  </div>

                  {/* Date, Time and cancellation option */}
                  <div className="flex flex-col md:items-end justify-center w-full md:w-auto border-t md:border-t-0 border-slate-50 pt-4 md:pt-0 gap-3">
                    <div className="text-left md:text-right">
                      <p className="text-xs font-black text-slate-900 uppercase">{formatFullDate(booking.date)}</p>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">⏱️ A las {booking.time}</p>
                    </div>

                    {isUpcomingBooking && (
                      <div className="flex space-x-2 w-full md:w-auto">
                        {cancelingId === booking.id ? (
                          <div className="flex items-center space-x-2">
                            <span className="text-[9px] font-black text-red-600 uppercase">¿Confirmas cancelar?</span>
                            <button 
                              onClick={() => handleCancelBooking(booking.id)} 
                              className="bg-red-600 text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-lg hover:bg-red-700"
                            >
                              Sí, Cancelar
                            </button>
                            <button 
                              onClick={() => setCancelingId(null)} 
                              className="bg-slate-100 text-slate-700 text-[9px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-lg hover:bg-slate-200"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => setCancelingId(booking.id)}
                            className="w-full md:w-auto py-1.5 px-4 border border-red-200 hover:border-red-600 hover:text-red-600 text-slate-500 text-[9px] font-black uppercase tracking-widest rounded-xl transition-colors bg-white"
                          >
                            🚫 Cancelar Turno
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
};

export default BookingsListView;
