import { UserConsent } from '../../server/compliance';
import { SupportTicket } from '../../server/support';

export interface AuditLog {
  id: string;
  time: string;
  level: 'success' | 'info' | 'warn' | 'critical';
  code: string;
  message: string;
  ip: string;
  user?: string;
  details?: any;
}

export interface SecurityAnomaly {
  code: string;
  message: string;
  severity: 'high' | 'medium';
}

/**
 * Enterprise Service for Security, Auditing, Support, and Legal Compliance.
 * Feeds directly from Express backend endpoints.
 */
export const enterpriseService = {
  // --- SECURITY & AUDIT LOGS ---
  async fetchAuditLogs(): Promise<AuditLog[]> {
    try {
      const response = await fetch('/api/security/audit-logs');
      if (!response.ok) throw new Error('Error al obtener registros de auditoría');
      return await response.json();
    } catch (error) {
      console.error(error);
      return [];
    }
  },

  async fetchSecurityAnomalies(): Promise<SecurityAnomaly[]> {
    try {
      const response = await fetch('/api/security/anomalies');
      if (!response.ok) throw new Error('Error al detectar anomalías');
      return await response.json();
    } catch (error) {
      console.error(error);
      return [];
    }
  },

  async clearAuditLogs(): Promise<boolean> {
    try {
      const response = await fetch('/api/security/logs/clear', { method: 'POST' });
      return response.ok;
    } catch (error) {
      console.error(error);
      return false;
    }
  },

  // --- SUPPORT CENTRE ---
  async fetchTickets(shopId?: string): Promise<SupportTicket[]> {
    try {
      const url = shopId ? `/api/support/tickets?shopId=${shopId}` : '/api/support/tickets';
      const response = await fetch(url);
      if (!response.ok) throw new Error('Error al cargar tickets de soporte');
      return await response.json();
    } catch (error) {
      console.error(error);
      return [];
    }
  },

  async createSupportTicket(ticket: Omit<SupportTicket, 'id' | 'status' | 'messages' | 'createdAt'>): Promise<SupportTicket | null> {
    try {
      const response = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ticket)
      });
      if (!response.ok) throw new Error('Error al crear ticket');
      return await response.json();
    } catch (error) {
      console.error(error);
      return null;
    }
  },

  async sendTicketMessage(ticketId: string, sender: 'customer' | 'admin', text: string): Promise<SupportTicket | null> {
    try {
      const response = await fetch(`/api/support/tickets/${ticketId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sender, text })
      });
      if (!response.ok) throw new Error('Error al enviar mensaje');
      return await response.json();
    } catch (error) {
      console.error(error);
      return null;
    }
  },

  async updateTicketStatus(ticketId: string, status: SupportTicket['status']): Promise<SupportTicket | null> {
    try {
      const response = await fetch(`/api/support/tickets/${ticketId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (!response.ok) throw new Error('Error al actualizar estado');
      return await response.json();
    } catch (error) {
      console.error(error);
      return null;
    }
  },

  async fetchKB(): Promise<any[]> {
    try {
      const response = await fetch('/api/support/kb');
      return await response.json();
    } catch (error) {
      console.error(error);
      return [];
    }
  },

  // --- COMPLIANCE & GDPR ---
  async recordUserConsent(consent: Omit<UserConsent, 'id' | 'timestamp' | 'documentVersion' | 'ip'>): Promise<boolean> {
    try {
      const response = await fetch('/api/compliance/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(consent)
      });
      return response.ok;
    } catch (error) {
      console.error(error);
      return false;
    }
  },

  async fetchUserConsents(email: string): Promise<UserConsent[]> {
    try {
      const response = await fetch(`/api/compliance/consent/${encodeURIComponent(email)}`);
      return await response.json();
    } catch (error) {
      console.error(error);
      return [];
    }
  },

  async exportGDPRData(email: string): Promise<any | null> {
    try {
      const response = await fetch('/api/compliance/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      if (!response.ok) throw new Error('Error al exportar datos de usuario');
      return await response.json();
    } catch (error) {
      console.error(error);
      return null;
    }
  },

  async deleteGDPRAccount(email: string): Promise<boolean> {
    try {
      const response = await fetch('/api/compliance/forget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      return response.ok;
    } catch (error) {
      console.error(error);
      return false;
    }
  }
};
