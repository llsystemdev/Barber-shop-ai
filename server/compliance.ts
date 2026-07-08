import { getDb, saveDb } from './database';

export interface UserConsent {
  id: string;
  userId: string;
  email: string;
  consentType: 'AI_FACIAL_ANALYSIS' | 'PHOTO_STORAGE' | 'MARKETING_AGREEMENT' | 'COOKIE_POLICY';
  accepted: boolean;
  timestamp: string;
  documentVersion: string;
  ip: string;
}

/**
 * Save user consent (GDPR Compliant)
 */
export async function saveUserConsent(
  userId: string,
  email: string,
  consentType: UserConsent['consentType'],
  accepted: boolean,
  ip: string = 'unknown'
): Promise<UserConsent> {
  const db = await getDb();
  
  const newConsent: UserConsent = {
    id: `consent_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    userId,
    email,
    consentType,
    accepted,
    timestamp: new Date().toISOString(),
    documentVersion: 'v1.2',
    ip
  };

  db.userConsents = db.userConsents || [];
  db.userConsents.push(newConsent);
  await saveDb();
  return newConsent;
}

/**
 * Get all consent history for a user
 */
export async function getUserConsents(email: string): Promise<UserConsent[]> {
  const db = await getDb();
  const consents = db.userConsents || [];
  return consents.filter(c => c.email.toLowerCase() === email.toLowerCase()) as UserConsent[];
}

/**
 * GDPR Data Portability: Export entire user footprint
 */
export async function exportUserData(email: string): Promise<any> {
  const db = await getDb();
  const lowerEmail = email.toLowerCase();

  const user = db.users.find(u => u.email?.toLowerCase() === lowerEmail);
  if (!user) {
    throw new Error('Usuario no encontrado');
  }

  const userBookings = db.bookings.filter(b => b.userId === user.id);
  const userTickets = (db.supportTickets || []).filter(t => t.email.toLowerCase() === lowerEmail);
  const userConsents = (db.userConsents || []).filter(c => c.email.toLowerCase() === lowerEmail);

  // Return a safe and complete compliance object
  return {
    metadata: {
      exportedAt: new Date().toISOString(),
      platform: 'Barber Shop AI',
      purpose: 'GDPR Right to Data Portability Article 20'
    },
    userProfile: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl,
      shopId: user.shopId
    },
    bookings: userBookings,
    supportTickets: userTickets,
    consents: userConsents
  };
}

/**
 * GDPR Right to Erasure (Right to be Forgotten): Erase user from system permanently
 */
export async function eraseUserData(email: string): Promise<{ success: boolean; erasedRecordsCount: number }> {
  const db = await getDb();
  const lowerEmail = email.toLowerCase();

  const userIndex = db.users.findIndex(u => u.email?.toLowerCase() === lowerEmail);
  if (userIndex === -1) {
    throw new Error('Usuario no encontrado');
  }

  const userId = db.users[userIndex].id;
  let erasedCount = 0;

  // Erase bookings
  const initialBookingsCount = db.bookings.length;
  db.bookings = db.bookings.filter(b => b.userId !== userId);
  erasedCount += (initialBookingsCount - db.bookings.length);

  // Erase support tickets
  if (db.supportTickets) {
    const initialTicketsCount = db.supportTickets.length;
    db.supportTickets = db.supportTickets.filter(t => t.email.toLowerCase() !== lowerEmail);
    erasedCount += (initialTicketsCount - db.supportTickets.length);
  }

  // Erase consents
  if (db.userConsents) {
    const initialConsentsCount = db.userConsents.length;
    db.userConsents = db.userConsents.filter(c => c.email.toLowerCase() !== lowerEmail);
    erasedCount += (initialConsentsCount - db.userConsents.length);
  }

  // Erase user profile
  db.users.splice(userIndex, 1);
  erasedCount += 1;

  await saveDb();
  return {
    success: true,
    erasedRecordsCount: erasedCount
  };
}
