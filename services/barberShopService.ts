import { Booking, BarberShop } from "../types";
import { db, storage } from '../firebase/client';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { 
  collection, 
  getDocs, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  onSnapshot 
} from 'firebase/firestore';

// Helper function to convert base64 data URIs to Blobs for Firebase Storage uploads
function base64ToBlob(base64: string): Blob {
  const parts = base64.split(';base64,');
  const contentType = parts[0].split(':')[1];
  const raw = window.atob(parts[1]);
  const rawLength = raw.length;
  const uInt8Array = new Uint8Array(rawLength);
  for (let i = 0; i < rawLength; ++i) {
    uInt8Array[i] = raw.charCodeAt(i);
  }
  return new Blob([uInt8Array], { type: contentType });
}

const getRandomId = () => Math.random().toString(36).substring(2, 15);

// --- REAL BACKEND OPERATIONS FOR BARBER SHOPS & BOOKINGS ---

export const getAllShops = async (): Promise<BarberShop[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, 'shops'));
    let shops: BarberShop[] = [];
    querySnapshot.forEach((doc) => {
      shops.push(doc.data() as BarberShop);
    });

    if (shops.length === 0) {
      console.log('[Client DB] No shops found in Firestore. Seeding default demo shop...');
      const defaultShop: BarberShop = {
        id: 'default_shop',
        name: 'Barbería AI Demo',
        aiName: 'Asistente AI',
        welcomeMessage: '¡Hola! Bienvenido. Soy tu Asistente AI de Estilismo. ¿Qué estilo te gustaría ver hoy?',
        aiPersona: 'Profesional, amable y experto en visagismo de cabello.',
        description: 'Barbería de de demostración potenciada con Inteligencia Artificial.',
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
      
      try {
        await setDoc(doc(db, 'shops', 'default_shop'), defaultShop);
        shops = [defaultShop];
      } catch (seedErr) {
        console.warn('[Client DB] Failed to seed default shop to Firestore:', seedErr);
        shops = [defaultShop];
      }
    }
    return shops;
  } catch (error) {
    console.error('getAllShops failed:', error);
    return [];
  }
};

export const getShopForUser = async (userId: string): Promise<BarberShop | null> => {
  try {
    const q = query(collection(db, 'shops'), where('ownerId', '==', userId));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      return querySnapshot.docs[0].data() as BarberShop;
    }
    return null;
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

    await setDoc(doc(db, 'shops', defaultShop.id), defaultShop);
    return { data: defaultShop, error: null };
  } catch (error: any) {
    console.error('createDefaultShopForUser failed:', error);
    return { data: null as any, error };
  }
};

export const updateShop = async (shopId: string, updates: Partial<BarberShop>): Promise<{ error: any }> => {
  try {
    await updateDoc(doc(db, 'shops', shopId), updates);
    return { error: null };
  } catch (error: any) {
    console.error('updateShop failed:', error);
    return { error };
  }
};

export const saveBooking = async (booking: Omit<Booking, 'id'>): Promise<{ data: Booking; error: any }> => {
  try {
    const bookingId = `booking_${Date.now()}`;
    const newBooking: Booking = {
      ...booking,
      id: bookingId
    } as Booking;
    await setDoc(doc(db, 'bookings', bookingId), newBooking);
    return { data: newBooking, error: null };
  } catch (error: any) {
    console.error('saveBooking failed:', error);
    return { data: null as any, error };
  }
};

// Real-time listener using Firebase Firestore's onSnapshot
export const subscribeToBookings = (shopName: string, callback: (bookings: Booking[]) => void) => {
  const q = query(collection(db, 'bookings'));
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const bookings = snapshot.docs
      .map(doc => doc.data() as Booking)
      .filter(b => b.shopName === shopName || b.shopId === shopName);
    callback(bookings);
  }, (error) => {
    console.error('Failed to subscribe to bookings:', error);
  });
  return unsubscribe;
};

// --- IMAGE UPLOAD SERVICE ---

export const uploadBase64Image = async (base64: string, shopId: string, bucket: 'galery'): Promise<string> => {
  try {
    if (!base64.startsWith('data:')) {
      return base64;
    }

    const targetFolder = bucket === 'galery' ? 'haircuts' : 'avatars';
    const match = base64.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) return base64;
    
    const mimeType = match[1];
    const fileExtension = mimeType.split('/')[1] || 'jpg';
    const randomId = getRandomId();
    const filePath = `${targetFolder}/${shopId}/${Date.now()}-${randomId}.${fileExtension}`;
    
    const blob = base64ToBlob(base64);
    const storageRef = ref(storage, filePath);
    console.log(`[Client Storage] Uploading base64 blob to path: ${filePath}`);
    const snapshot = await uploadBytes(storageRef, blob, { contentType: mimeType });
    const downloadUrl = await getDownloadURL(snapshot.ref);
    console.log(`[Client Storage] Successfully uploaded base64. URL: ${downloadUrl}`);
    return downloadUrl;
  } catch (error: any) {
    console.error('[Client Storage Error] Client direct base64 upload failed:', error);
    return base64;
  }
};

export const uploadShopImage = async (file: File, shopId: string, bucket: 'galery' | 'barbers'): Promise<string> => {
  try {
    const targetFolder = bucket === 'galery' ? 'haircuts' : 'avatars';
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const randomId = getRandomId();
    const filePath = `${targetFolder}/${shopId}/${Date.now()}-${randomId}.${fileExtension}`;
    
    const storageRef = ref(storage, filePath);
    console.log(`[Client Storage] Uploading file to path: ${filePath}`);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadUrl = await getDownloadURL(snapshot.ref);
    console.log(`[Client Storage] Successfully uploaded. URL: ${downloadUrl}`);
    return downloadUrl;
  } catch (error: any) {
    console.error('[Client Storage Error] Client direct upload failed. Using local preview data URI:', error);
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
    });
  }
};
