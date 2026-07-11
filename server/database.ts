import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import crypto from 'crypto';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { User, BarberShop, Booking } from '../types';

// Load Firebase configuration
export let firebaseConfig: any = {};
try {
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (fsSync.existsSync(configPath)) {
    firebaseConfig = JSON.parse(fsSync.readFileSync(configPath, 'utf-8'));
  }
} catch (err) {
  console.warn('[server/database] Failed to read firebase-applet-config.json:', err);
}

// Initialize firebase client app on server
let app: any = null;
try {
  if (firebaseConfig.projectId) {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    console.log('[Firebase Client] Initialized successfully on backend');
  }
} catch (error) {
  console.error('[Firebase Client Error] Failed to initialize:', error);
}

// Get Firestore reference
export const firestore = app
  ? (firebaseConfig.firestoreDatabaseId 
      ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
      : getFirestore(app))
  : null;

// Stub for storageBucket
export const storageBucket: any = null;

const DB_FILE = path.join(process.cwd(), 'server', 'db.json');

// Interface representing the database schema
export interface DatabaseSchema {
  users: Array<User & { passwordHash?: string; salt?: string; email?: string }>;
  shops: BarberShop[];
  bookings: Booking[];
  securityLogs: Array<{
    id: string;
    time: string;
    level: 'success' | 'info' | 'warn' | 'critical';
    code: string;
    message: string;
    ip: string;
    user?: string;
    details?: any;
  }>;
  supportTickets: Array<{
    id: string;
    shopId?: string;
    customerName: string;
    email: string;
    category: string;
    priority: 'Baja' | 'Media' | 'Alta' | 'Crítica';
    subject: string;
    description: string;
    status: 'Abierto' | 'En Progreso' | 'Resuelto' | 'Cerrado';
    messages: Array<{ sender: 'customer' | 'admin'; text: string; time: string }>;
    createdAt: string;
  }>;
  userConsents: Array<{
    id: string;
    userId: string;
    email: string;
    consentType: string;
    accepted: boolean;
    timestamp: string;
    documentVersion: string;
    ip: string;
  }>;
}

// Native Password Securing Helper
export function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
}

export function generateSalt(): string {
  return crypto.randomBytes(16).toString('hex');
}

let dbInstance: DatabaseSchema | null = null;
let writePromise: Promise<void> = Promise.resolve();
export let isFirestoreDisabled = false;

export function disableFirestore() {
  isFirestoreDisabled = true;
}

export function isFirestoreReady(): boolean {
  return !!firestore && !isFirestoreDisabled;
}

// Synchronize all database collections from Firestore
async function syncFromFirestore(dbSchema: DatabaseSchema) {
  if (!firestore || isFirestoreDisabled) return;
  try {
    console.log('[Firestore Sync] Sincronizando datos desde la base de datos de Firebase...');
    
    // 1. Users
    try {
      const usersSnap = await getDocs(collection(firestore, 'users'));
      if (!usersSnap.empty) {
        dbSchema.users = usersSnap.docs.map(doc => doc.data() as any);
        console.log(`[Firestore Sync] Cargados ${dbSchema.users.length} usuarios`);
      } else if (dbSchema.users.length > 0) {
        console.log('[Firestore Sync] Sembrando usuarios locales en la nube...');
        for (const u of dbSchema.users) {
          await setDoc(doc(firestore, 'users', u.id), u);
        }
      }
    } catch (err: any) {
      console.warn('[Firestore Sync] No se pudo sincronizar colección "users":', err.message || err);
    }

    // 2. Shops
    try {
      const shopsSnap = await getDocs(collection(firestore, 'shops'));
      if (!shopsSnap.empty) {
        dbSchema.shops = shopsSnap.docs.map(doc => doc.data() as any);
        console.log(`[Firestore Sync] Cargadas ${dbSchema.shops.length} barberías`);
      } else if (dbSchema.shops.length > 0) {
        console.log('[Firestore Sync] Sembrando barberías locales en la nube...');
        for (const s of dbSchema.shops) {
          await setDoc(doc(firestore, 'shops', s.id), s);
        }
      }
    } catch (err: any) {
      console.warn('[Firestore Sync] No se pudo sincronizar colección "shops":', err.message || err);
    }

    // 3. Bookings
    try {
      const bookingsSnap = await getDocs(collection(firestore, 'bookings'));
      if (!bookingsSnap.empty) {
        dbSchema.bookings = bookingsSnap.docs.map(doc => doc.data() as any);
        console.log(`[Firestore Sync] Cargadas ${dbSchema.bookings.length} reservas`);
      } else if (dbSchema.bookings.length > 0) {
        console.log('[Firestore Sync] Sembrando reservas locales en la nube...');
        for (const b of dbSchema.bookings) {
          await setDoc(doc(firestore, 'bookings', b.id), b);
        }
      }
    } catch (err: any) {
      console.warn('[Firestore Sync] No se pudo sincronizar colección "bookings":', err.message || err);
    }

    // 4. Security Logs
    try {
      const secLogsSnap = await getDocs(collection(firestore, 'securityLogs'));
      if (!secLogsSnap.empty) {
        dbSchema.securityLogs = secLogsSnap.docs.map(doc => doc.data() as any);
      } else if (dbSchema.securityLogs.length > 0) {
        for (const log of dbSchema.securityLogs) {
          await setDoc(doc(firestore, 'securityLogs', log.id), log);
        }
      }
    } catch (err) {
      // Ignorar fallos de logs secundarios
    }

    // 5. Support Tickets
    try {
      const ticketsSnap = await getDocs(collection(firestore, 'supportTickets'));
      if (!ticketsSnap.empty) {
        dbSchema.supportTickets = ticketsSnap.docs.map(doc => doc.data() as any);
      } else if (dbSchema.supportTickets.length > 0) {
        for (const ticket of dbSchema.supportTickets) {
          await setDoc(doc(firestore, 'supportTickets', ticket.id), ticket);
        }
      }
    } catch (err) {
      // Ignorar fallos de tickets secundarios
    }

    // 6. User Consents
    try {
      const consentsSnap = await getDocs(collection(firestore, 'userConsents'));
      if (!consentsSnap.empty) {
        dbSchema.userConsents = consentsSnap.docs.map(doc => doc.data() as any);
      } else if (dbSchema.userConsents.length > 0) {
        for (const consent of dbSchema.userConsents) {
          await setDoc(doc(firestore, 'userConsents', consent.id), consent);
        }
      }
    } catch (err) {
      // Ignorar fallos de consentimientos secundarios
    }
  } catch (error: any) {
    console.error('[Firestore Sync Error] Error general de sincronización:', error.message || error);
  }
}

// Write updates to Firestore
async function syncToFirestore(dbSchema: DatabaseSchema) {
  if (!firestore || isFirestoreDisabled) return;
  try {
    console.log('[Firestore Sync] Guardando actualizaciones en la nube...');
    
    // Write users
    for (const u of dbSchema.users) {
      await setDoc(doc(firestore, 'users', u.id), u);
    }

    // Write shops
    for (const s of dbSchema.shops) {
      await setDoc(doc(firestore, 'shops', s.id), s);
    }

    // Write bookings
    for (const b of dbSchema.bookings) {
      await setDoc(doc(firestore, 'bookings', b.id), b);
    }

    // Write security logs
    for (const log of dbSchema.securityLogs) {
      await setDoc(doc(firestore, 'securityLogs', log.id), log);
    }

    // Write support tickets
    for (const ticket of dbSchema.supportTickets) {
      await setDoc(doc(firestore, 'supportTickets', ticket.id), ticket);
    }

    // Write consents
    for (const consent of dbSchema.userConsents) {
      await setDoc(doc(firestore, 'userConsents', consent.id), consent);
    }
    
    console.log('[Firestore Sync] Sincronización exitosa.');
  } catch (error: any) {
    console.warn('[Firestore Sync Error] Error al guardar cambios en la nube:', error.message || error);
  }
}

// Read and initialize database safely
export async function getDb(): Promise<DatabaseSchema> {
  if (dbInstance) {
    return dbInstance;
  }

  try {
    const dir = path.dirname(DB_FILE);
    await fs.mkdir(dir, { recursive: true });

    let parsed: DatabaseSchema;
    try {
      const data = await fs.readFile(DB_FILE, 'utf-8');
      parsed = JSON.parse(data) as DatabaseSchema;
    } catch {
      parsed = {
        users: [],
        shops: [],
        bookings: [],
        securityLogs: [],
        supportTickets: [],
        userConsents: []
      };
    }

    parsed.securityLogs = parsed.securityLogs || [];
    parsed.supportTickets = parsed.supportTickets || [];
    parsed.userConsents = parsed.userConsents || [];
    
    dbInstance = parsed;

    // Sync with Firestore
    await syncFromFirestore(dbInstance);

    // Save locally
    await saveDbFile();

    return dbInstance;
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

// Save locally (helper)
async function saveDbFile(): Promise<void> {
  if (!dbInstance) return;
  const tempFile = `${DB_FILE}.tmp`;
  try {
    const dir = path.dirname(DB_FILE);
    await fs.mkdir(dir, { recursive: true });
    const dataString = JSON.stringify(dbInstance, null, 2);
    await fs.writeFile(tempFile, dataString, 'utf-8');
    await fs.rename(tempFile, DB_FILE);
  } catch (err) {
    console.error('Error writing database file locally:', err);
  }
}

// Write to database atomically and sync with Firestore
export async function saveDb(): Promise<void> {
  if (!dbInstance) return;

  writePromise = writePromise.then(async () => {
    try {
      // 1. Save locally
      await saveDbFile();
      // 2. Sync to Firestore in background
      await syncToFirestore(dbInstance!);
    } catch (err) {
      console.error('[saveDb Queue Error] Failed to write or sync db updates:', err);
    }
  });

  return writePromise;
}
