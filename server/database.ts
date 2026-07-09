import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import crypto from 'crypto';
import { getApps, initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { User, BarberShop, Booking } from '../types';

// Load Firebase configuration
let firebaseConfig: any = {};
try {
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (fsSync.existsSync(configPath)) {
    firebaseConfig = JSON.parse(fsSync.readFileSync(configPath, 'utf-8'));
  }
} catch (err) {
  console.warn('[server/database] Failed to read firebase-applet-config.json:', err);
}

// Initialize firebase-admin
let appAdmin: any = null;
try {
  if (getApps().length === 0 && firebaseConfig.projectId) {
    appAdmin = initializeApp({
       projectId: firebaseConfig.projectId,
       credential: applicationDefault()
     });
    console.log('[Firebase Admin] Initialized successfully with Application Default Credentials');
  } else if (getApps().length > 0) {
    appAdmin = getApps()[0];
  }
} catch (error) {
  console.warn('[Firebase Admin Warning] Could not initialize with Application Default Credentials, trying config fallback:', error);
  try {
    if (getApps().length === 0 && firebaseConfig.projectId) {
      appAdmin = initializeApp({
        projectId: firebaseConfig.projectId
      });
      console.log('[Firebase Admin] Initialized with explicit projectId');
    }
  } catch (err) {
    console.error('[Firebase Admin Error] Failed to initialize:', err);
  }
}

// Get Firestore reference
export const firestore = getApps().length > 0
  ? (firebaseConfig.firestoreDatabaseId
      ? getFirestore(getApps()[0], firebaseConfig.firestoreDatabaseId)
      : getFirestore(getApps()[0]))
  : null;

// Get Storage reference
export const storageBucket = getApps().length > 0 && firebaseConfig.storageBucket
  ? getStorage(getApps()[0]).bucket(firebaseConfig.storageBucket)
  : null;

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
let isFirestoreDisabled = false;

// Synchronize all database collections from Firestore
async function syncFromFirestore(dbSchema: DatabaseSchema) {
  if (!firestore || isFirestoreDisabled) return;
  try {
    console.log('[Firestore] Syncing data from cloud database...');
    
    // 1. Users
    const usersSnap = await firestore.collection('users').get();
    if (!usersSnap.empty) {
      dbSchema.users = usersSnap.docs.map((doc: any) => doc.data() as any);
      console.log(`[Firestore] Loaded ${dbSchema.users.length} users`);
    } else if (dbSchema.users.length > 0) {
      console.log('[Firestore] Users collection empty, seeding...');
      for (const u of dbSchema.users) {
        await firestore.collection('users').doc(u.id).set(u);
      }
    }

    // 2. Shops
    const shopsSnap = await firestore.collection('shops').get();
    if (!shopsSnap.empty) {
      dbSchema.shops = shopsSnap.docs.map((doc: any) => doc.data() as any);
      console.log(`[Firestore] Loaded ${dbSchema.shops.length} shops`);
    } else if (dbSchema.shops.length > 0) {
      console.log('[Firestore] Shops collection empty, seeding...');
      for (const s of dbSchema.shops) {
        await firestore.collection('shops').doc(s.id).set(s);
      }
    }

    // 3. Bookings
    const bookingsSnap = await firestore.collection('bookings').get();
    if (!bookingsSnap.empty) {
      dbSchema.bookings = bookingsSnap.docs.map((doc: any) => doc.data() as any);
      console.log(`[Firestore] Loaded ${dbSchema.bookings.length} bookings`);
    } else if (dbSchema.bookings.length > 0) {
      console.log('[Firestore] Bookings collection empty, seeding...');
      for (const b of dbSchema.bookings) {
        await firestore.collection('bookings').doc(b.id).set(b);
      }
    }

    // 4. Security Logs
    const secLogsSnap = await firestore.collection('securityLogs').get();
    if (!secLogsSnap.empty) {
      dbSchema.securityLogs = secLogsSnap.docs.map((doc: any) => doc.data() as any);
    } else if (dbSchema.securityLogs.length > 0) {
      for (const log of dbSchema.securityLogs) {
        await firestore.collection('securityLogs').doc(log.id).set(log);
      }
    }

    // 5. Support Tickets
    const ticketsSnap = await firestore.collection('supportTickets').get();
    if (!ticketsSnap.empty) {
      dbSchema.supportTickets = ticketsSnap.docs.map((doc: any) => doc.data() as any);
    } else if (dbSchema.supportTickets.length > 0) {
      for (const ticket of dbSchema.supportTickets) {
        await firestore.collection('supportTickets').doc(ticket.id).set(ticket);
      }
    }

    // 6. User Consents
    const consentsSnap = await firestore.collection('userConsents').get();
    if (!consentsSnap.empty) {
      dbSchema.userConsents = consentsSnap.docs.map((doc: any) => doc.data() as any);
    } else if (dbSchema.userConsents.length > 0) {
      for (const consent of dbSchema.userConsents) {
        await firestore.collection('userConsents').doc(consent.id).set(consent);
      }
    }
  } catch (error: any) {
    const errMsg = error?.message || String(error);
    if (errMsg.includes('PERMISSION_DENIED') || errMsg.includes('insufficient permissions') || errMsg.includes('7')) {
      isFirestoreDisabled = true;
      console.warn('[Firestore Sync Status] Cloud sync database permission pending or denied. Running securely in persistent Local Mode.');
    } else {
      console.warn('[Firestore Sync Error] Failed to sync from cloud database, using Local Mode:', errMsg);
    }
  }
}

// Write updates to Firestore
async function syncToFirestore(dbSchema: DatabaseSchema) {
  if (!firestore || isFirestoreDisabled) return;
  try {
    console.log('[Firestore] Saving all updates to cloud database...');
    
    // Write users
    for (const u of dbSchema.users) {
      await firestore.collection('users').doc(u.id).set(u, { merge: true });
    }

    // Write shops
    for (const s of dbSchema.shops) {
      await firestore.collection('shops').doc(s.id).set(s, { merge: true });
    }

    // Write bookings
    for (const b of dbSchema.bookings) {
      await firestore.collection('bookings').doc(b.id).set(b, { merge: true });
    }

    // Write security logs
    for (const log of dbSchema.securityLogs) {
      await firestore.collection('securityLogs').doc(log.id).set(log, { merge: true });
    }

    // Write support tickets
    for (const ticket of dbSchema.supportTickets) {
      await firestore.collection('supportTickets').doc(ticket.id).set(ticket, { merge: true });
    }

    // Write consents
    for (const consent of dbSchema.userConsents) {
      await firestore.collection('userConsents').doc(consent.id).set(consent, { merge: true });
    }
    
    console.log('[Firestore] Cloud database update succeeded');
  } catch (error: any) {
    const errMsg = error?.message || String(error);
    if (errMsg.includes('PERMISSION_DENIED') || errMsg.includes('insufficient permissions') || errMsg.includes('7')) {
      isFirestoreDisabled = true;
      console.warn('[Firestore Sync Status] Cloud sync database save skipped due to pending/denied permissions. Preserving updates in secure local storage.');
    } else {
      console.warn('[Firestore Sync Error] Failed to write updates to cloud database, changes saved locally:', errMsg);
    }
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
    
    // No mock seeding in production mode.
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
    // 1. Save locally
    await saveDbFile();
    // 2. Sync to Firestore in background
    await syncToFirestore(dbInstance!);
  });

  return writePromise;
}
