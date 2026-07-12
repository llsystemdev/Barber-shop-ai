import React, { useState, useEffect, useRef } from 'react';
import { BarberShop, Service, Barber } from '../types';
import { EditIcon } from '../assets/icons';
import { uploadShopImage, updateShop } from '../services/barberShopService';

const DAYS_OF_WEEK = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

interface ShopProfileViewProps {
  shop: BarberShop;
  onUpdateProfile: (updatedShop: BarberShop) => void;
  onDeleteShop?: (shopId: string) => void;
}

const ShopProfileView: React.FC<ShopProfileViewProps> = ({ shop, onUpdateProfile, onDeleteShop }) => {
  const [activeTab, setActiveTab] = useState<'info' | 'services' | 'team_hours' | 'policies'>('info');
  const [isEditing, setIsEditing] = useState(false);
  const [editableShop, setEditableShop] = useState<BarberShop>(shop);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // Social media handles simulation (saved in shop metadata or locally fallback)
  const [instagram, setInstagram] = useState('@barberia_ai_pro');
  const [tiktok, setTiktok] = useState('@barberia_ai_tiktok');

  // Custom visual policy
  const [customPolicy, setCustomPolicy] = useState('Cancelación gratuita hasta 12 horas antes del turno. Tolerancia máxima de retraso: 10 minutos. No se requiere seña previa para planes Premium.');

  const galleryInputRef = useRef<HTMLInputElement>(null);
  const barberInputRef = useRef<HTMLInputElement>(null);
  const [uploadTargetBarberIdx, setUploadTargetBarberIdx] = useState<number | null>(null);

  const inputClasses = "w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 text-xs font-bold focus:border-red-600 focus:bg-white focus:ring-0 transition-all outline-none";
  const labelClasses = "block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5";
  const removeButtonClasses = "absolute top-2 right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-black shadow-lg hover:bg-red-700 z-10 transition-transform hover:scale-110";

  useEffect(() => {
    setEditableShop(shop);
    setIsEditing(false);
  }, [shop]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditableShop(prev => ({ ...prev, [name]: value }));
  };

  // Safe nested hours edit
  const handleHoursChange = (day: string, val: string) => {
    setEditableShop(prev => ({
      ...prev,
      hours: {
        ...prev.hours,
        [day]: val
      }
    }));
  };

  const getDayHours = (day: string) => {
    if (editableShop.hours && editableShop.hours[day]) {
      return editableShop.hours[day];
    }
    // Fallback if the database has 'Lunes-Viernes' instead of individual days
    if (editableShop.hours && editableShop.hours['Lunes-Viernes']) {
      if (day !== 'Sábado' && day !== 'Domingo') {
        return editableShop.hours['Lunes-Viernes'];
      }
    }
    return 'Cerrado';
  };

  const setDayHours = (day: string, value: string) => {
    setEditableShop(prev => {
      const newHours = { ...prev.hours };
      // Delete the old legacy key so it gets migrated cleanly
      if ('Lunes-Viernes' in newHours) {
        const legacyVal = newHours['Lunes-Viernes'];
        ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'].forEach(d => {
          if (!newHours[d]) {
            newHours[d] = legacyVal;
          }
        });
        delete newHours['Lunes-Viernes'];
      }
      newHours[day] = value;
      return {
        ...prev,
        hours: newHours
      };
    });
  };

  // Services actions
  const handleServiceChange = (index: number, field: keyof Service, value: string) => {
    const newServices = [...editableShop.services];
    newServices[index] = { ...newServices[index], [field]: value };
    setEditableShop(prev => ({ ...prev, services: newServices }));
  };

  const handleAddService = () => {
    setEditableShop(prev => ({
      ...prev,
      services: [...prev.services, { name: 'Nuevo Corte Estilo', price: '$20' }]
    }));
  };

  const handleRemoveService = (index: number) => {
    setEditableShop(prev => ({
      ...prev,
      services: prev.services.filter((_, i) => i !== index)
    }));
  };

  // Barbers actions
  const handleBarberChange = (index: number, field: keyof Barber, value: string) => {
    const newBarbers = [...editableShop.barbers];
    newBarbers[index] = { ...newBarbers[index], [field]: value };
    setEditableShop(prev => ({ ...prev, barbers: newBarbers }));
  };

  const handleAddBarber = () => {
    setEditableShop(prev => ({
      ...prev,
      barbers: [
        ...prev.barbers,
        {
          name: 'Nuevo Estilista',
          specialty: 'Cortes Clásicos & Fade',
          imageUrl: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150'
        }
      ]
    }));
  };

  const handleRemoveBarber = (index: number) => {
    setEditableShop(prev => ({
      ...prev,
      barbers: prev.barbers.filter((_, i) => i !== index)
    }));
  };

  const handleRemoveItem = (section: keyof BarberShop, index: number) => {
    const newSection = (editableShop[section] as any[]).filter((_, i) => i !== index);
    setEditableShop(prev => ({ ...prev, [section]: newSection }));
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    setUploadProgress(20);
    
    try {
      const timer = setInterval(() => {
        setUploadProgress(prev => (prev < 90 ? prev + 10 : prev));
      }, 200);

      const url = await uploadShopImage(file, shop.id, 'galery');
      clearInterval(timer);
      setUploadProgress(100);
      
      setEditableShop(prev => ({ ...prev, gallery: [...prev.gallery, url] }));
      setStatusMsg("¡Imagen cargada en la galería!");
      setTimeout(() => {
        setStatusMsg(null);
        setIsUploading(false);
        setUploadProgress(0);
      }, 1500);
    } catch (error: any) {
      alert("Error de subida: " + error.message);
      setIsUploading(false);
    } finally {
      if (galleryInputRef.current) galleryInputRef.current.value = "";
    }
  };

  const handleBarberImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || uploadTargetBarberIdx === null) return;

    setIsUploading(true);
    setUploadProgress(40);

    try {
      const url = await uploadShopImage(file, shop.id, 'barbers');
      const newBarbers = [...editableShop.barbers];
      newBarbers[uploadTargetBarberIdx].imageUrl = url;
      
      setEditableShop(prev => ({ ...prev, barbers: newBarbers }));
      setStatusMsg("Avatar del estilista actualizado");
      setUploadProgress(100);
      setTimeout(() => {
        setStatusMsg(null);
        setIsUploading(false);
        setUploadProgress(0);
      }, 1500);
    } catch (error: any) {
      alert("Error de subida: " + error.message);
      setIsUploading(false);
    } finally {
      setUploadTargetBarberIdx(null);
      if (barberInputRef.current) barberInputRef.current.value = "";
    }
  };

  const handleSave = async () => {
    setIsUploading(true);
    try {
      const { error } = await updateShop(shop.id, editableShop);
      if (error) throw error;
      onUpdateProfile(editableShop);
      setIsEditing(false);
      setStatusMsg("Perfil del salón guardado exitosamente.");
      setTimeout(() => setStatusMsg(null), 3000);
    } catch (err: any) {
      alert("Error al guardar: " + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="w-full h-full bg-slate-50 overflow-y-auto p-6 lg:p-10 relative">
      {isUploading && (
        <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm z-[100] flex items-center justify-center p-6 animate-fade-in">
          <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-xs w-full text-center border border-slate-100">
            <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-2">Guardando...</h3>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-4">
              <div className="bg-red-600 h-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
            </div>
            <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest">Sincronizando Base de Datos</p>
          </div>
        </div>
      )}

      {statusMsg && (
        <div className="fixed top-24 right-8 z-50 bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center border-l-4 border-emerald-500 font-bold animate-bounce text-xs">
          <span className="mr-2">🎉</span> {statusMsg}
        </div>
      )}

      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header Premium de Barbería */}
        <header className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="text-[10px] bg-red-600 text-white px-3 py-1 rounded-full font-black uppercase tracking-widest">
                PLAN {editableShop.plan}
              </span>
              <span className="text-xs text-emerald-600 font-black uppercase tracking-wider flex items-center">
                <span className="w-2 h-2 bg-emerald-500 rounded-full inline-block mr-1 animate-pulse"></span>
                Salón Activo
              </span>
            </div>
            {isEditing ? (
              <input 
                type="text" 
                name="name" 
                value={editableShop.name} 
                onChange={handleInputChange} 
                className="text-3xl font-black uppercase tracking-tight w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 outline-none focus:border-red-600" 
              />
            ) : (
              <h1 className="text-3xl md:text-4xl font-black text-slate-950 uppercase tracking-tight">{shop.name}</h1>
            )}
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">
              📍 {editableShop.address} • 📞 {editableShop.phone}
            </p>
          </div>
          
          <div className="flex gap-3">
            {isEditing ? (
              <>
                <button 
                  onClick={handleSave} 
                  className="bg-red-600 hover:bg-red-700 text-white font-black px-6 py-3.5 rounded-2xl shadow-lg shadow-red-600/20 transition-all uppercase text-xs tracking-widest"
                >
                  Guardar Perfil
                </button>
                <button 
                  onClick={() => { setEditableShop(shop); setIsEditing(false); }} 
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-black px-6 py-3.5 rounded-2xl transition-all uppercase text-xs tracking-widest"
                >
                  Cancelar
                </button>
              </>
            ) : (
              <button 
                onClick={() => setIsEditing(true)} 
                className="bg-slate-950 hover:bg-slate-900 text-white font-black px-6 py-4 rounded-2xl flex items-center space-x-2 shadow-xl transition-all uppercase text-xs tracking-widest"
              >
                <EditIcon className="w-4 h-4" />
                <span>Editar Salón</span>
              </button>
            )}
          </div>
        </header>

        {/* Tabs de Navegación de Perfil */}
        <div className="flex border-b border-slate-200/80 overflow-x-auto pb-px scrollbar-none -mx-6 px-6 md:mx-0 md:px-0 scroll-smooth snap-x">
          {[
            { id: 'info', label: 'Información & IA', icon: '💈' },
            { id: 'services', label: 'Carta de Servicios', icon: '💰' },
            { id: 'team_hours', label: 'Horarios & Equipo', icon: '📅' },
            { id: 'policies', label: 'Políticas del Salón', icon: '📜' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-5 py-3 border-b-2 font-black text-xs uppercase tracking-widest transition-all flex-shrink-0 whitespace-nowrap snap-center ${activeTab === tab.id ? 'border-red-600 text-red-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Input oculto para subir avatares de barberos */}
        <input 
          type="file" 
          accept="image/*" 
          className="hidden" 
          ref={barberInputRef} 
          onChange={handleBarberImageUpload} 
        />

        {/* TAB CONTENTS */}
        <div className="animate-fade-in">
          
          {/* TAB 1: Información & IA */}
          {activeTab === 'info' && (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Historia & Datos Generales */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest border-b border-slate-50 pb-3">Sobre Nosotros</h3>
                  <div className="space-y-4">
                    <div>
                      <label className={labelClasses}>Nuestra Misión y Reseña</label>
                      {isEditing ? (
                        <textarea 
                          name="description" 
                          value={editableShop.description} 
                          onChange={handleInputChange} 
                          rows={4} 
                          className={inputClasses} 
                        />
                      ) : (
                        <p className="text-slate-600 text-xs font-medium leading-relaxed">{editableShop.description}</p>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className={labelClasses}>Dirección Física</label>
                        {isEditing ? (
                          <input type="text" name="address" value={editableShop.address} onChange={handleInputChange} className={inputClasses} />
                        ) : (
                          <p className="text-slate-900 text-xs font-bold">📍 {editableShop.address}</p>
                        )}
                      </div>
                      <div>
                        <label className={labelClasses}>Teléfono de Contacto</label>
                        {isEditing ? (
                          <input type="text" name="phone" value={editableShop.phone} onChange={handleInputChange} className={inputClasses} />
                        ) : (
                          <p className="text-slate-900 text-xs font-bold">📞 {editableShop.phone}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className={labelClasses}>Instagram</label>
                        {isEditing ? (
                          <input type="text" value={instagram} onChange={(e) => setInstagram(e.target.value)} className={inputClasses} />
                        ) : (
                          <p className="text-slate-900 text-xs font-bold text-red-600 hover:underline cursor-pointer">📸 {instagram}</p>
                        )}
                      </div>
                      <div>
                        <label className={labelClasses}>TikTok</label>
                        {isEditing ? (
                          <input type="text" value={tiktok} onChange={(e) => setTiktok(e.target.value)} className={inputClasses} />
                        ) : (
                          <p className="text-slate-900 text-xs font-bold text-slate-800 hover:underline cursor-pointer">🎵 {tiktok}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Galería de Fotos */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Galería de Cortes Realizados ({editableShop.gallery.length})</h3>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {editableShop.gallery.map((url, idx) => (
                      <div key={idx} className="relative aspect-[3/4] bg-slate-100 rounded-2xl overflow-hidden shadow-sm group border hover:border-red-600 transition-colors">
                        <img src={url} alt="Galería Trabajo" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                        {isEditing && (
                          <button onClick={() => handleRemoveItem('gallery', idx)} className={removeButtonClasses}>&times;</button>
                        )}
                      </div>
                    ))}
                    {isEditing && (
                      <button 
                        onClick={() => galleryInputRef.current?.click()}
                        className="aspect-[3/4] bg-white border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center hover:border-red-600 hover:bg-red-50/20 transition-all text-center p-4"
                      >
                        <input type="file" accept="image/*" className="hidden" ref={galleryInputRef} onChange={handleGalleryUpload} />
                        <span className="text-2xl mb-2">📸</span>
                        <span className="text-[9px] font-black uppercase text-slate-500 tracking-wider">Añadir Foto</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Configuración AI Stylist */}
              <div className="lg:col-span-1">
                <div className="bg-slate-950 text-white p-6 rounded-3xl border border-slate-800 shadow-xl space-y-6">
                  <div className="flex items-center space-x-3 border-b border-slate-800 pb-4">
                    <span className="text-3xl animate-pulse">🤖</span>
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-widest text-red-500">Módulo Asistente AI</h4>
                      <p className="text-[10px] font-semibold text-slate-400 uppercase">Personalidad del Consultor</p>
                    </div>
                  </div>

                  <div className="space-y-4 text-xs">
                    <div>
                      <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Nombre de la Inteligencia Artificial</label>
                      {isEditing ? (
                        <input 
                          type="text" 
                          name="aiName" 
                          value={editableShop.aiName} 
                          onChange={handleInputChange} 
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white font-bold text-xs focus:border-red-600 outline-none" 
                        />
                      ) : (
                        <p className="font-black text-sm uppercase text-slate-200">{editableShop.aiName}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Mensaje de Bienvenida Automático</label>
                      {isEditing ? (
                        <textarea 
                          name="welcomeMessage" 
                          value={editableShop.welcomeMessage} 
                          onChange={handleInputChange} 
                          rows={3} 
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white font-bold text-xs focus:border-red-600 outline-none" 
                        />
                      ) : (
                        <p className="text-slate-400 font-medium leading-relaxed italic">"{editableShop.welcomeMessage}"</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Instrucciones del Sistema (System Persona)</label>
                      {isEditing ? (
                        <textarea 
                          name="aiPersona" 
                          value={editableShop.aiPersona} 
                          onChange={handleInputChange} 
                          rows={4} 
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white font-bold text-xs focus:border-red-600 outline-none" 
                        />
                      ) : (
                        <p className="text-slate-400 font-semibold leading-relaxed font-mono text-[10px] bg-slate-900 p-3 rounded-xl border border-slate-800/80">{editableShop.aiPersona}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Zona de Peligro para eliminación */}
            {onDeleteShop && (
              <div className="bg-rose-50/50 border border-rose-100 rounded-3xl p-6 mt-8 space-y-4">
                <div className="flex items-center space-x-3 text-rose-800">
                  <span className="text-2xl">⚠️</span>
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-widest text-rose-700">Zona de Peligro</h4>
                    <p className="text-[10px] font-semibold uppercase text-rose-500">Acciones destructivas e irreversibles</p>
                  </div>
                </div>
                
                <p className="text-xs text-rose-700 leading-relaxed font-medium">
                  Al eliminar tu barbería se borrarán permanentemente toda la configuración de IA, galería de fotos, carta de servicios y reservas asociadas. Esta acción no se puede deshacer.
                </p>

                {showConfirmDelete ? (
                  <div className="space-y-3 p-4 bg-white border border-rose-200 rounded-2xl animate-fade-in">
                    <p className="text-xs font-black text-slate-800 uppercase tracking-tight">
                      Para confirmar la eliminación, escribe <span className="text-rose-600 font-mono select-all">ELIMINAR</span> a continuación:
                    </p>
                    <input 
                      type="text" 
                      value={deleteConfirmText} 
                      onChange={(e) => setDeleteConfirmText(e.target.value)} 
                      placeholder="Escribe ELIMINAR para proceder"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 text-xs font-bold focus:border-rose-600 focus:bg-white focus:ring-0 transition-all outline-none"
                    />
                    <div className="flex space-x-3">
                      <button 
                        onClick={() => {
                          if (deleteConfirmText === 'ELIMINAR' && onDeleteShop) {
                            onDeleteShop(shop.id);
                          }
                        }}
                        disabled={deleteConfirmText !== 'ELIMINAR'}
                        className={`flex-1 font-black py-3 rounded-xl transition-all uppercase text-xs tracking-widest text-center ${deleteConfirmText === 'ELIMINAR' ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-600/20 cursor-pointer' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
                      >
                        Sí, eliminar permanentemente
                      </button>
                      <button 
                        onClick={() => { setShowConfirmDelete(false); setDeleteConfirmText(''); }} 
                        className="px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black rounded-xl transition-all uppercase text-xs tracking-widest"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <button 
                    onClick={() => setShowConfirmDelete(true)}
                    className="bg-rose-50 hover:bg-rose-100 text-rose-700 font-black px-6 py-3 rounded-xl transition-all uppercase text-xs tracking-widest border border-rose-200"
                  >
                    Eliminar Barbería
                  </button>
                )}
              </div>
            )}

            </>
          )}

          {/* TAB 2: Carta de Servicios */}
          {activeTab === 'services' && (
            <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Servicios Premium</h3>
                  <p className="text-slate-400 text-[10px] font-semibold uppercase mt-1">Configura la carta completa y precios estimativos en base a tu moneda</p>
                </div>
                {isEditing && (
                  <button 
                    onClick={handleAddService}
                    className="bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-widest px-4 py-2.5 rounded-xl transition-all shadow-md shadow-red-600/15"
                  >
                    + Agregar Servicio
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {editableShop.services.map((svc, index) => (
                  <div 
                    key={index}
                    className="p-4 bg-slate-50 border border-slate-200/60 rounded-2xl flex items-center justify-between space-x-4 relative"
                  >
                    <div className="flex-1 grid grid-cols-3 gap-3">
                      <div className="col-span-2">
                        <label className={labelClasses}>Nombre del Servicio</label>
                        {isEditing ? (
                          <input 
                            type="text" 
                            value={svc.name} 
                            onChange={(e) => handleServiceChange(index, 'name', e.target.value)} 
                            className={inputClasses} 
                          />
                        ) : (
                          <p className="font-black text-slate-900 uppercase text-xs tracking-tight">{svc.name}</p>
                        )}
                      </div>
                      <div className="col-span-1">
                        <label className={labelClasses}>Precio</label>
                        {isEditing ? (
                          <input 
                            type="text" 
                            value={svc.price} 
                            onChange={(e) => handleServiceChange(index, 'price', e.target.value)} 
                            className={inputClasses} 
                          />
                        ) : (
                          <p className="font-black text-red-600 text-xs bg-red-50 border border-red-100/50 px-2 py-1.5 rounded-lg text-center">{svc.price}</p>
                        )}
                      </div>
                    </div>
                    
                    {isEditing && (
                      <button 
                        onClick={() => handleRemoveService(index)}
                        className="bg-red-100 hover:bg-red-200 text-red-700 p-2.5 rounded-xl transition-colors"
                        title="Eliminar Servicio"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: Horarios & Equipo */}
          {activeTab === 'team_hours' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              
              {/* Equipo de Expertos */}
              <div className="md:col-span-2 bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
                <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Nuestro Staff Técnico</h3>
                    <p className="text-slate-400 text-[10px] font-semibold uppercase mt-1">Administra los barberos que realizarán los agendamientos</p>
                  </div>
                  {isEditing && (
                    <button 
                      onClick={handleAddBarber}
                      className="bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-widest px-4 py-2.5 rounded-xl transition-all shadow-md"
                    >
                      + Registrar Estilista
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {editableShop.barbers.map((barber, index) => (
                    <div 
                      key={index}
                      className="p-5 bg-slate-50 border border-slate-200/60 rounded-2xl flex items-center space-x-4 relative"
                    >
                      <button
                        type="button"
                        disabled={!isEditing}
                        onClick={() => {
                          setUploadTargetBarberIdx(index);
                          barberInputRef.current?.click();
                        }}
                        className={`relative w-14 h-14 rounded-full overflow-hidden border-2 flex-shrink-0 ${isEditing ? 'border-red-600 cursor-pointer hover:opacity-80' : 'border-slate-200'}`}
                        title={isEditing ? "Cambiar foto de perfil" : ""}
                      >
                        <img src={barber.imageUrl || 'https://via.placeholder.com/150'} alt={barber.name} className="w-full h-full object-cover" />
                        {isEditing && (
                          <span className="absolute inset-0 bg-black/40 flex items-center justify-center text-[8px] text-white font-bold uppercase">Subir</span>
                        )}
                      </button>

                      <div className="flex-1 space-y-1">
                        {isEditing ? (
                          <div className="space-y-1">
                            <input 
                              type="text" 
                              value={barber.name} 
                              onChange={(e) => handleBarberChange(index, 'name', e.target.value)} 
                              className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                              placeholder="Nombre Estilista"
                            />
                            <input 
                              type="text" 
                              value={barber.specialty} 
                              onChange={(e) => handleBarberChange(index, 'specialty', e.target.value)} 
                              className="w-full p-2 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-500"
                              placeholder="Especialidad (e.g. Navaja Clásica)"
                            />
                          </div>
                        ) : (
                          <>
                            <h5 className="font-black text-slate-900 uppercase text-xs">{barber.name}</h5>
                            <p className="text-[10px] text-red-600 font-black uppercase tracking-wider">{barber.specialty}</p>
                          </>
                        )}
                      </div>

                      {isEditing && (
                        <button 
                          onClick={() => handleRemoveBarber(index)}
                          className="bg-red-50 hover:bg-red-100 text-red-600 p-2 rounded-lg transition-colors absolute top-2 right-2"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Horarios de Apertura */}
              <div className="md:col-span-1 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest border-b border-slate-50 pb-3">Horario Semanal</h3>
                <div className="space-y-4">
                  {DAYS_OF_WEEK.map((day) => {
                    const currentVal = getDayHours(day);
                    const isOpen = currentVal !== 'Cerrado';
                    let opening = '09:00';
                    let closing = '18:00';
                    if (isOpen && currentVal.includes('-')) {
                      const parts = currentVal.split('-');
                      opening = parts[0].trim();
                      closing = parts[1].trim();
                    }
                    return (
                      <div key={day} className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 last:border-0 last:pb-0 gap-2">
                        <div className="flex items-center space-x-3">
                          <span className="text-xs font-black text-slate-700 uppercase tracking-wider min-w-[70px]">{day}</span>
                          {isEditing && (
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input 
                                type="checkbox" 
                                checked={isOpen}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setDayHours(day, '09:00 - 18:00');
                                  } else {
                                    setDayHours(day, 'Cerrado');
                                  }
                                }}
                                className="sr-only peer"
                              />
                              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                              <span className="ml-2 text-[10px] font-black uppercase text-slate-400 peer-checked:text-emerald-600">
                                {isOpen ? 'Abierto' : 'Cerrado'}
                              </span>
                            </label>
                          )}
                        </div>

                        <div className="flex items-center space-x-2">
                          {isEditing ? (
                            isOpen ? (
                              <div className="flex items-center space-x-1.5">
                                <input 
                                  type="time" 
                                  value={opening} 
                                  onChange={(e) => setDayHours(day, `${e.target.value} - ${closing}`)} 
                                  className="p-1 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-black text-slate-800 outline-none focus:border-red-600 focus:bg-white w-18"
                                />
                                <span className="text-[10px] font-bold text-slate-400">a</span>
                                <input 
                                  type="time" 
                                  value={closing} 
                                  onChange={(e) => setDayHours(day, `${opening} - ${e.target.value}`)} 
                                  className="p-1 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-black text-slate-800 outline-none focus:border-red-600 focus:bg-white w-18"
                                />
                              </div>
                            ) : (
                              <span className="text-[10px] font-black uppercase text-slate-300 tracking-wider">No laborable</span>
                            )
                          ) : (
                            isOpen ? (
                              <span className="font-black text-slate-900 text-xs tracking-tight bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200/50">{currentVal}</span>
                            ) : (
                              <span className="text-[10px] font-black uppercase text-red-600 bg-red-50 border border-red-100/50 px-2 py-1 rounded-md">Cerrado</span>
                            )
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Políticas de Reserva */}
          {activeTab === 'policies' && (
            <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6 max-w-3xl">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest border-b border-slate-50 pb-3">Políticas de Atención al Cliente</h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-red-50/40 border border-red-100 rounded-2xl">
                    <span className="text-xl">⏱️</span>
                    <h5 className="font-black text-slate-900 text-[10px] uppercase tracking-wider mt-2">Margen de Tolerancia</h5>
                    <p className="text-[11px] text-slate-500 font-medium mt-1">Brindamos un máximo de 10 minutos de espera antes de cancelar la cita para no demorar al siguiente turno.</p>
                  </div>
                  <div className="p-4 bg-red-50/40 border border-red-100 rounded-2xl">
                    <span className="text-xl">📅</span>
                    <h5 className="font-black text-slate-900 text-[10px] uppercase tracking-wider mt-2">Cancelación de Citas</h5>
                    <p className="text-[11px] text-slate-500 font-medium mt-1">Puedes cancelar o reprogramar tu cita sin penalización hasta con 12 horas de antelación desde tu panel.</p>
                  </div>
                  <div className="p-4 bg-red-50/40 border border-red-100 rounded-2xl">
                    <span className="text-xl">💳</span>
                    <h5 className="font-black text-slate-900 text-[10px] uppercase tracking-wider mt-2">Garantía Premium</h5>
                    <p className="text-[11px] text-slate-500 font-medium mt-1">La reserva offline no requiere ingresos de datos de tarjeta bancaria, fomentando la total agilidad.</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className={labelClasses}>Detalle de Términos (Editable)</label>
                  {isEditing ? (
                    <textarea 
                      value={customPolicy} 
                      onChange={(e) => setCustomPolicy(e.target.value)} 
                      rows={4} 
                      className={inputClasses} 
                    />
                  ) : (
                    <div className="p-5 bg-slate-50 border border-slate-100 rounded-2xl">
                      <p className="text-xs text-slate-600 font-semibold leading-relaxed leading-relaxed font-mono">
                        "{customPolicy}"
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};

export default ShopProfileView;
