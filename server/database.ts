import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { User, BarberShop, Booking } from '../types';

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

// Initial Mock Data Fallbacks
import { mockBarbershops } from '../mock/barbershops';
import { mockBookings } from '../mock/bookings';

// Native Password Securing Helper
export function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
}

export function generateSalt(): string {
  return crypto.randomBytes(16).toString('hex');
}

let dbInstance: DatabaseSchema | null = null;
let writePromise: Promise<void> = Promise.resolve();

// Read and initialize database safely
export async function getDb(): Promise<DatabaseSchema> {
  if (dbInstance) {
    return dbInstance;
  }

  try {
    const dir = path.dirname(DB_FILE);
    await fs.mkdir(dir, { recursive: true });

    const data = await fs.readFile(DB_FILE, 'utf-8');
    const parsed = JSON.parse(data) as DatabaseSchema;
    parsed.securityLogs = parsed.securityLogs || [];
    parsed.supportTickets = parsed.supportTickets || [];
    parsed.userConsents = parsed.userConsents || [];
    dbInstance = parsed;
    return dbInstance;
  } catch (error) {
    // If database file does not exist, initialize with mock data
    console.log('Database file not found or corrupted. Initializing with default mock data...');
    
    // Seed initial users
    const defaultSalt = generateSalt();
    const defaultPasswordHash = hashPassword('password123', defaultSalt);

    const initialUsers = [
      {
        id: 'mock-user-owner',
        name: 'Juan Pérez',
        email: 'owner@virtus.com',
        role: 'shopOwner' as const,
        avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Juan',
        shopId: '1',
        passwordHash: defaultPasswordHash,
        salt: defaultSalt
      },
      {
        id: 'mock-user-admin',
        name: 'Administrador del Sistema',
        email: 'admin@virtus.com',
        role: 'platformAdmin' as const,
        avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin',
        passwordHash: defaultPasswordHash,
        salt: defaultSalt
      }
    ];

    const initialSecurityLogs = [
      {
        id: 'sec_log_1',
        time: '2026-07-08T08:12:00Z',
        level: 'success' as const,
        code: 'AUTH_SUCCESS',
        message: 'Inicio de sesión exitoso para admin@virtus.com',
        ip: '192.168.1.50',
        user: 'admin@virtus.com'
      },
      {
        id: 'sec_log_2',
        time: '2026-07-08T08:15:22Z',
        level: 'warn' as const,
        code: 'BRUTE_FORCE_PREVENTION',
        message: 'Límite de intentos fallidos alcanzado para IP 185.220.101.5',
        ip: '185.220.101.5'
      }
    ];

    const initialSupportTickets = [
      {
        id: 'ticket_1',
        shopId: '1',
        customerName: 'Carlos Gómez',
        email: 'carlos@example.com',
        category: 'Facturación',
        priority: 'Alta' as const,
        subject: 'Doble cargo en suscripción',
        description: 'Se me ha cobrado dos veces el plan Profesional de este mes.',
        status: 'Abierto' as const,
        messages: [
          { sender: 'customer' as const, text: 'Hola, veo dos cobros de Stripe en mi banco.', time: '2026-07-08T09:00:00Z' }
        ],
        createdAt: '2026-07-08T09:00:00Z'
      }
    ];

    const initialUserConsents = [
      {
        id: 'consent_1',
        userId: 'mock-user-owner',
        email: 'owner@virtus.com',
        consentType: 'AI_FACIAL_ANALYSIS',
        accepted: true,
        timestamp: '2026-07-08T08:00:00Z',
        documentVersion: 'v1.2',
        ip: '192.168.1.50'
      }
    ];

    dbInstance = {
      users: initialUsers,
      shops: mockBarbershops,
      bookings: mockBookings,
      securityLogs: initialSecurityLogs,
      supportTickets: initialSupportTickets,
      userConsents: initialUserConsents
    };

    await saveDb();
    return dbInstance;
  }
}

// Write to database atomically to prevent file corruption
export async function saveDb(): Promise<void> {
  if (!dbInstance) return;

  // Use a sequential promise chain for writes to handle concurrent calls perfectly
  writePromise = writePromise.then(async () => {
    const tempFile = `${DB_FILE}.tmp`;
    try {
      const dir = path.dirname(DB_FILE);
      await fs.mkdir(dir, { recursive: true });

      const dataString = JSON.stringify(dbInstance, null, 2);
      await fs.writeFile(tempFile, dataString, 'utf-8');
      await fs.rename(tempFile, DB_FILE);
    } catch (err) {
      console.error('Error writing database to disk:', err);
    }
  });

  return writePromise;
}
