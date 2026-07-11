
export type Sender = 'user' | 'ai';

export interface Message {
  id: string;
  sender: Sender;
  text?: string;
  suggestedStyles?: string[]; // For AI to suggest styles that can be visualized
}

export interface Service {
  name: string;
  price: string;
}

export interface Barber {
  name: string;
  specialty: string;
  imageUrl: string;
}

export interface Invoice {
    id: string;
    date: string;
    amount: string;
    status: 'Pagado' | 'Pendiente';
}

export interface PaymentMethod {
    type: 'Visa' | 'Mastercard' | 'Amex';
    last4: string;
    expiry: string;
}

export interface BarberShop {
  id: string;
  ownerId?: string; // Link to Mock User ID
  name: string;
  aiName: string; // e.g., "Leo, tu estilista AI"
  welcomeMessage: string;
  aiPersona: string; // Detailed persona description for the system prompt
  description: string;
  address: string;
  phone: string;
  hours: { [key: string]: string };
  gallery: string[];
  services: Service[];
  barbers: Barber[];
  plan: 'Freemium' | 'Básico' | 'Profesional';
  billingHistory: Invoice[];
  paymentMethod: PaymentMethod;
}

export interface Booking {
    id: string;
    shopName: string;
    service: string;
    date: string;
    time: string;
    userId: string;
    createdAt?: string;
}

// User role simulation
export interface User {
  id: string;
  name: string;
  role: 'platformAdmin' | 'shopOwner' | 'customer';
  avatarUrl: string;
  shopId?: string; // Only for shopOwner
  isGuest?: boolean; // Added for guest mode
}


// Admin Dashboard Types (per-shop)
export interface AdminStats {
  totalAnalyses: number;
  totalBookings: number;
  mostPopularService: string;
  monthlyRevenue: number;
}

export interface DailyActivity {
  day: string;
  Analyses: number;
  Bookings: number;
}

export interface ServiceDistribution {
  name: string;
  count: number;
}

export interface RecentActivity {
  id: string;
  type: 'analysis' | 'booking';
  description: string;
  time: string;
  icon: 'sparkles' | 'calendar';
}

export interface AdminDashboardData {
  stats: AdminStats;
  dailyActivity: DailyActivity[];
  serviceDistribution: ServiceDistribution[];
  recentActivity: RecentActivity[];
}

// Platform Admin Dashboard Types (platform-wide)
export interface PlatformStats {
  monthlyRecurringRevenue: number;
  totalShops: number;
  totalPlatformAnalyses: number;
  totalPlatformBookings: number;
}

export interface PlanDistribution {
  name: 'Freemium' | 'Básico' | 'Profesional';
  count: number;
  color: string;
}

export interface PlatformDashboardData {
  stats: PlatformStats;
  planDistribution: PlanDistribution[];
  recentlyJoined: BarberShop[];
}

// End of Active Types

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


