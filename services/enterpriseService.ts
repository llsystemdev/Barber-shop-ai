import { db, auth } from '../firebase/client';
import { 
  collection, 
  getDocs, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc 
} from 'firebase/firestore';
import { UserConsent, SupportTicket, AuditLog, SecurityAnomaly } from '../types';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Enterprise Service for Security, Auditing, Support, and Legal Compliance.
 * Interacts directly with Cloud Firestore for 100% Firebase reliability.
 */
export const enterpriseService = {
  // --- SECURITY & AUDIT LOGS ---
  async fetchAuditLogs(): Promise<AuditLog[]> {
    try {
      const querySnapshot = await getDocs(collection(db, 'securityLogs'));
      const logs: AuditLog[] = [];
      querySnapshot.forEach((docSnap) => {
        logs.push({ id: docSnap.id, ...docSnap.data() } as AuditLog);
      });
      return logs.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'securityLogs');
      return [];
    }
  },

  async fetchSecurityAnomalies(): Promise<SecurityAnomaly[]> {
    try {
      const logs = await this.fetchAuditLogs();
      const anomalies: SecurityAnomaly[] = [];
      const loginFailuresByIP: Record<string, number> = {};
      const recentTime = Date.now() - 10 * 60 * 1000; // 10 minutes ago

      for (const log of logs) {
        const logTime = new Date(log.time).getTime();
        if (logTime < recentTime) continue;

        if (log.code === 'AUTH_FAILURE') {
          loginFailuresByIP[log.ip || 'unknown'] = (loginFailuresByIP[log.ip || 'unknown'] || 0) + 1;
        }
      }

      for (const [ip, count] of Object.entries(loginFailuresByIP)) {
        if (count >= 5) {
          anomalies.push({
            code: 'BRUTE_FORCE_SUSPECT',
            message: `Múltiples intentos de login fallidos (${count}) desde IP: ${ip}`,
            severity: 'high'
          });
        } else if (count >= 3) {
          anomalies.push({
            code: 'SUSPICIOUS_ACTIVITY',
            message: `Intento de acceso repetido (${count}) desde IP: ${ip}`,
            severity: 'medium'
          });
        }
      }

      return anomalies;
    } catch (error) {
      console.error('[EnterpriseService] fetchSecurityAnomalies failed:', error);
      return [];
    }
  },

  async clearAuditLogs(): Promise<boolean> {
    try {
      const querySnapshot = await getDocs(collection(db, 'securityLogs'));
      const deletePromises = querySnapshot.docs.map(docSnap => deleteDoc(doc(db, 'securityLogs', docSnap.id)));
      await Promise.all(deletePromises);
      return true;
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'securityLogs');
      return false;
    }
  },

  // --- SUPPORT CENTRE ---
  async fetchTickets(shopId?: string): Promise<SupportTicket[]> {
    try {
      const querySnapshot = await getDocs(collection(db, 'supportTickets'));
      const tickets: SupportTicket[] = [];
      querySnapshot.forEach((docSnap) => {
        tickets.push({ id: docSnap.id, ...docSnap.data() } as any);
      });
      const sorted = tickets.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      if (shopId) {
        return sorted.filter(t => t.shopId === shopId);
      }
      return sorted;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'supportTickets');
      return [];
    }
  },

  async createSupportTicket(ticket: Omit<SupportTicket, 'id' | 'status' | 'messages' | 'createdAt'>): Promise<SupportTicket | null> {
    const ticketId = `ticket_${Date.now()}`;
    try {
      const newTicket: SupportTicket = {
        ...ticket,
        id: ticketId,
        status: 'Abierto',
        messages: [
          {
            sender: 'customer',
            text: ticket.description,
            time: new Date().toISOString()
          }
        ],
        createdAt: new Date().toISOString()
      };
      await setDoc(doc(db, 'supportTickets', ticketId), newTicket);
      return newTicket;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `supportTickets/${ticketId}`);
      return null;
    }
  },

  async sendTicketMessage(ticketId: string, sender: 'customer' | 'admin', text: string): Promise<SupportTicket | null> {
    try {
      const ticketDocRef = doc(db, 'supportTickets', ticketId);
      const ticketSnap = await getDoc(ticketDocRef);
      if (!ticketSnap.exists()) throw new Error('Ticket no encontrado');
      
      const ticketData = ticketSnap.data() as any;
      const updatedMessages = [
        ...(ticketData.messages || []),
        { sender, text, time: new Date().toISOString() }
      ];
      
      const updates: any = { messages: updatedMessages };
      if (sender === 'admin') {
        updates.status = 'En Progreso';
      }
      
      await updateDoc(ticketDocRef, updates);
      return { ...ticketData, ...updates } as any;
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `supportTickets/${ticketId}`);
      return null;
    }
  },

  async updateTicketStatus(ticketId: string, status: SupportTicket['status']): Promise<SupportTicket | null> {
    try {
      const ticketDocRef = doc(db, 'supportTickets', ticketId);
      await updateDoc(ticketDocRef, { status });
      const ticketSnap = await getDoc(ticketDocRef);
      return { id: ticketId, ...ticketSnap.data() } as any;
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `supportTickets/${ticketId}`);
      return null;
    }
  },

  async fetchKB(): Promise<any[]> {
    return [
      {
        id: 'kb_1',
        category: 'Suscripción',
        title: '¿Cómo funciona la facturación del Plan Profesional?',
        content: 'El Plan Profesional se factura mensualmente a través de Stripe de manera automática. Incluye análisis de visagismo ilimitados de IA, integraciones con agendas externas y soporte prioritario de nuestro equipo técnico.',
        role: 'shopOwner'
      },
      {
        id: 'kb_2',
        category: 'IA de Estilo',
        title: '¿Qué precisión tiene el análisis de Visagismo facial?',
        content: 'Nuestro modelo Gemini 3.5 analiza proporciones de frente, mandíbula y perfil usando visagismo anatómico para determinar si tu tipo de rostro es Ovalado, Cuadrado, Redondo o Diamante. Recomienda los 4 cortes con mayor coherencia visual.',
        role: 'customer'
      },
      {
        id: 'kb_3',
        category: 'Seguridad',
        title: '¿Cómo protegemos las fotos subidas por los usuarios?',
        content: 'Las fotos se procesan exclusivamente en memoria durante el análisis de IA y no se almacenan permanentemente a menos que des consentimiento explícito en el Guardado de Estilos. Cumplimos estrictamente con GDPR.',
        role: 'customer'
      },
      {
        id: 'kb_4',
        category: 'Integración',
        title: '¿Cómo configuro la IA para que coincida con mi marca de barbería?',
        content: 'Desde el panel de configuración de tu Barbería, puedes definir el Nombre del Asistente AI y su personalidad. Esto influirá en el tono de voz de chat que perciben tus clientes.',
        role: 'shopOwner'
      }
    ];
  },

  // --- COMPLIANCE & GDPR ---
  async recordUserConsent(consent: Omit<UserConsent, 'id' | 'timestamp' | 'documentVersion' | 'ip'>): Promise<boolean> {
    const consentId = `consent_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    try {
      const newConsent = {
        ...consent,
        id: consentId,
        timestamp: new Date().toISOString(),
        documentVersion: 'v1.2',
        ip: 'client-ip'
      };
      await setDoc(doc(db, 'userConsents', consentId), newConsent);
      return true;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `userConsents/${consentId}`);
      return false;
    }
  },

  async fetchUserConsents(email: string): Promise<UserConsent[]> {
    try {
      const querySnapshot = await getDocs(collection(db, 'userConsents'));
      const consents: UserConsent[] = [];
      querySnapshot.forEach(docSnap => {
        const data = docSnap.data();
        if (data.email?.toLowerCase() === email.toLowerCase()) {
          consents.push({ id: docSnap.id, ...data } as any);
        }
      });
      return consents;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'userConsents');
      return [];
    }
  },

  async exportGDPRData(email: string): Promise<any | null> {
    try {
      const lowerEmail = email.toLowerCase();
      
      const usersSnap = await getDocs(collection(db, 'users'));
      let user: any = null;
      usersSnap.forEach(docSnap => {
        const data = docSnap.data();
        if (data.email?.toLowerCase() === lowerEmail) {
          user = { id: docSnap.id, ...data };
        }
      });

      if (!user) {
        throw new Error('Usuario no encontrado');
      }

      const bookingsSnap = await getDocs(collection(db, 'bookings'));
      const bookings: any[] = [];
      bookingsSnap.forEach(docSnap => {
        const data = docSnap.data();
        if (data.userId === user.id) {
          bookings.push({ id: docSnap.id, ...data });
        }
      });

      const tickets = await this.fetchTickets();
      const userTickets = tickets.filter(t => t.email.toLowerCase() === lowerEmail);
      const consents = await this.fetchUserConsents(email);

      return {
        metadata: {
          exportedAt: new Date().toISOString(),
          platform: 'Barber Shop AI',
          purpose: 'GDPR Right to Data Portability Article 20'
        },
        userProfile: user,
        bookings,
        supportTickets: userTickets,
        consents
      };
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'multiple_gdpr_collections');
      return null;
    }
  },

  async deleteGDPRAccount(email: string): Promise<boolean> {
    try {
      const lowerEmail = email.toLowerCase();
      
      const usersSnap = await getDocs(collection(db, 'users'));
      let userDocId: string | null = null;
      let userId: string | null = null;
      usersSnap.forEach(docSnap => {
        const data = docSnap.data();
        if (data.email?.toLowerCase() === lowerEmail) {
          userDocId = docSnap.id;
          userId = data.id || docSnap.id;
        }
      });

      if (!userDocId) {
        throw new Error('Usuario no encontrado');
      }

      // Erase bookings
      const bookingsSnap = await getDocs(collection(db, 'bookings'));
      const deleteBookingPromises: Promise<any>[] = [];
      bookingsSnap.forEach(docSnap => {
        const data = docSnap.data();
        if (data.userId === userId) {
          deleteBookingPromises.push(deleteDoc(doc(db, 'bookings', docSnap.id)));
        }
      });
      await Promise.all(deleteBookingPromises);

      // Erase tickets
      const ticketsSnap = await getDocs(collection(db, 'supportTickets'));
      const deleteTicketPromises: Promise<any>[] = [];
      ticketsSnap.forEach(docSnap => {
        const data = docSnap.data();
        if (data.email?.toLowerCase() === lowerEmail) {
          deleteTicketPromises.push(deleteDoc(doc(db, 'supportTickets', docSnap.id)));
        }
      });
      await Promise.all(deleteTicketPromises);

      // Erase consents
      const consentsSnap = await getDocs(collection(db, 'userConsents'));
      const deleteConsentPromises: Promise<any>[] = [];
      consentsSnap.forEach(docSnap => {
        const data = docSnap.data();
        if (data.email?.toLowerCase() === lowerEmail) {
          deleteConsentPromises.push(deleteDoc(doc(db, 'userConsents', docSnap.id)));
        }
      });
      await Promise.all(deleteConsentPromises);

      // Erase user profile
      await deleteDoc(doc(db, 'users', userDocId!));
      return true;
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'multiple_gdpr_collections');
      return false;
    }
  }
};
