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
    dbInstance = JSON.parse(data);
    return dbInstance!;
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

    dbInstance = {
      users: initialUsers,
      shops: mockBarbershops,
      bookings: mockBookings
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
