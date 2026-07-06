import { Booking, BarberShop } from "../types";

// --- REAL BACKEND OPERATIONS FOR BARBER SHOPS & BOOKINGS ---

export const getAllShops = async (): Promise<BarberShop[]> => {
  try {
    const response = await fetch('/api/shops');
    if (!response.ok) throw new Error('Error al obtener barberías');
    return await response.json();
  } catch (error) {
    console.error('getAllShops failed:', error);
    return [];
  }
};

export const getShopForUser = async (userId: string): Promise<BarberShop | null> => {
  try {
    const response = await fetch(`/api/shops/user/${encodeURIComponent(userId)}`);
    if (!response.ok) throw new Error('Error al obtener barbería del usuario');
    return await response.json();
  } catch (error) {
    console.error('getShopForUser failed:', error);
    return null;
  }
};

export const createDefaultShopForUser = async (userId: string, userName: string): Promise<{ data: BarberShop; error: any }> => {
  try {
    const defaultShop: BarberShop = {
      id: `shop_${Date.now()}`,
      ownerId: userId,
      name: `${userName || 'Mi'} Barbería AI`,
      aiName: 'Asistente AI',
      welcomeMessage: '¡Hola! Bienvenido. Soy tu Asistente AI de Estilismo. ¿Qué estilo te gustaría ver hoy?',
      aiPersona: 'Profesional, amable y experto en visagismo de cabello.',
      description: 'Nueva barbería registrada y potenciada con Inteligencia Artificial.',
      address: 'Calle del Estilo 123, Ciudad',
      phone: '555-0199',
      hours: { 'Lunes-Viernes': '09:00 - 18:00' },
      gallery: [
        'https://images.pexels.com/photos/3998429/pexels-photo-3998429.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
        'https://images.pexels.com/photos/2061821/pexels-photo-2061821.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'
      ],
      services: [{ name: 'Corte de Cabello Premium', price: '$25' }],
      barbers: [{ name: userName || 'Dueño', specialty: 'General', imageUrl: '' }],
      plan: 'Freemium',
      billingHistory: [],
      paymentMethod: { type: 'Visa', last4: '0000', expiry: '00/00' }
    };

    const response = await fetch('/api/shops', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(defaultShop)
    });
    
    if (!response.ok) throw new Error('Error al registrar barbería');
    const result = await response.json();
    return { data: result.data, error: null };
  } catch (error: any) {
    console.error('createDefaultShopForUser failed:', error);
    return { data: null as any, error };
  }
};

export const updateShop = async (shopId: string, updates: Partial<BarberShop>): Promise<{ error: any }> => {
  try {
    const response = await fetch(`/api/shops/${encodeURIComponent(shopId)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (!response.ok) throw new Error('Error al actualizar barbería');
    return { error: null };
  } catch (error: any) {
    console.error('updateShop failed:', error);
    return { error };
  }
};

export const saveBooking = async (booking: Omit<Booking, 'id'>): Promise<{ data: Booking; error: any }> => {
  try {
    const response = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(booking)
    });
    if (!response.ok) throw new Error('Error al guardar reserva');
    const result = await response.json();
    return { data: result.data, error: null };
  } catch (error: any) {
    console.error('saveBooking failed:', error);
    return { data: null as any, error };
  }
};

// Polling interval-based real-time listener for bookings
export const subscribeToBookings = (shopName: string, callback: (bookings: Booking[]) => void) => {
  const fetchBookings = async () => {
    try {
      const response = await fetch(`/api/bookings/shop/${encodeURIComponent(shopName)}`);
      if (response.ok) {
        const bookings = await response.json();
        callback(bookings);
      }
    } catch (error) {
      console.error('Failed to fetch bookings for subscriber:', error);
    }
  };

  // Initial fetch
  fetchBookings();

  // Poll every 3 seconds for new/updated bookings
  const intervalId = setInterval(fetchBookings, 3000);

  // Return unsubscribe handle
  return () => {
    clearInterval(intervalId);
  };
};

// --- IMAGE UPLOAD SERVICE ---

export const uploadBase64Image = async (base64: string, shopId: string, bucket: 'galery'): Promise<string> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(base64); // Return base64 direct data URI so it loads instantly
    }, 200);
  });
};

export const uploadShopImage = async (file: File, shopId: string, bucket: 'galery' | 'barbers'): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};
