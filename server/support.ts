import { getDb, saveDb } from './database';

export interface SupportTicket {
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
}

export interface KnowledgeBaseArticle {
  id: string;
  category: string;
  title: string;
  content: string;
  role: 'platformAdmin' | 'shopOwner' | 'customer';
}

/**
 * Get all support tickets
 */
export async function getAllTickets(shopId?: string): Promise<SupportTicket[]> {
  const db = await getDb();
  const tickets = db.supportTickets || [];
  if (shopId) {
    return tickets.filter(t => t.shopId === shopId);
  }
  return tickets;
}

/**
 * Create a new support ticket
 */
export async function createTicket(ticketData: Omit<SupportTicket, 'id' | 'status' | 'messages' | 'createdAt'>): Promise<SupportTicket> {
  const db = await getDb();
  const newTicket: SupportTicket = {
    ...ticketData,
    id: `ticket_${Date.now()}`,
    status: 'Abierto',
    messages: [
      {
        sender: 'customer',
        text: ticketData.description,
        time: new Date().toISOString()
      }
    ],
    createdAt: new Date().toISOString()
  };

  db.supportTickets = db.supportTickets || [];
  db.supportTickets.unshift(newTicket);
  await saveDb();
  return newTicket;
}

/**
 * Send a message within a support ticket
 */
export async function addTicketMessage(ticketId: string, sender: 'customer' | 'admin', text: string): Promise<SupportTicket> {
  const db = await getDb();
  db.supportTickets = db.supportTickets || [];
  
  const ticket = db.supportTickets.find(t => t.id === ticketId);
  if (!ticket) {
    throw new Error('Ticket no encontrado');
  }

  ticket.messages.push({
    sender,
    text,
    time: new Date().toISOString()
  });

  if (sender === 'admin') {
    ticket.status = 'En Progreso';
  }

  await saveDb();
  return ticket;
}

/**
 * Update ticket status
 */
export async function updateTicketStatus(ticketId: string, status: SupportTicket['status']): Promise<SupportTicket> {
  const db = await getDb();
  db.supportTickets = db.supportTickets || [];
  
  const ticket = db.supportTickets.find(t => t.id === ticketId);
  if (!ticket) {
    throw new Error('Ticket no encontrado');
  }

  ticket.status = status;
  await saveDb();
  return ticket;
}

/**
 * Pre-defined Enterprise SaaS Knowledge Base Articles (Preguntas Frecuentes - FAQ)
 */
export const knowledgeBase: KnowledgeBaseArticle[] = [
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
