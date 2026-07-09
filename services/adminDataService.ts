
import { BarberShop, Booking, AdminDashboardData, RecentActivity, PlatformDashboardData, PlanDistribution } from '../types';

const MOCK_SERVICES_WITH_PRICES: { [key: string]: number } = {
  "Corte de Pelo": 40,
  "Afeitado Clásico": 35,
  "Arreglo de Barba": 25,
  "Corte y Barba": 60,
  'Corte Clásico (Pompadour, Side-Part)': 45,
  'Afeitado a Navaja Tradicional': 40,
  'Arreglo de Barba Premium': 30,
  'El Paquete Dapper (Corte y Afeitado)': 80,
  'Skin Fade / Taper Fade': 40,
  'Corte Texturizado / Crop Top': 45,
  'Diseño de Cabello (Hair Tattoo)': 25,
  'Corte a Tijera y Navaja': 50,
  'Afeitado Ritual con Toalla Caliente': 55,
  'Arreglo de Bigote y Barba': 35,
  'Tratamiento Capilar Fortificante': 40,
};

const PLAN_PRICES = {
  'Freemium': 0,
  'Básico': 1.99,
  'Profesional': 9.99,
};

// Pseudo-random number generator function based on a seed string
// This ensures charts look consistent for the same shop every time you visit
const seededRandom = (seedStr: string) => {
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    const char = seedStr.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  const x = Math.sin(hash) * 10000;
  return x - Math.floor(x);
};

export const getAdminDashboardData = (shop: BarberShop, bookings: Booking[]): AdminDashboardData => {
  const shopBookings = bookings.filter(b => b.shopName === shop.name || b.shopId === shop.id);

  const totalBookings = shopBookings.length;
  // Real count of analyses can be derived from the actual usage, or estimated based on real bookings
  const totalAnalyses = totalBookings > 0 ? totalBookings * 2 : 0; 

  const serviceCounts: { [key: string]: number } = {};
  let monthlyRevenue = 0;
  
  shopBookings.forEach(b => {
    serviceCounts[b.service] = (serviceCounts[b.service] || 0) + 1;
    // Try to find the price from shop services, or fallback to standard service price
    const foundService = shop.services.find(s => s.name === b.service);
    const priceVal = foundService ? (parseInt(foundService.price.replace(/[^0-9]/g, '')) || 30) : (MOCK_SERVICES_WITH_PRICES[b.service] || 30);
    monthlyRevenue += priceVal;
  });
  
  const mostPopularService = Object.keys(serviceCounts).length > 0 
    ? Object.keys(serviceCounts).reduce((a, b) => serviceCounts[a] > serviceCounts[b] ? a : b)
    : 'Ninguno';

  // Daily Activity for the last 7 days (only real values)
  const dailyActivity = Array.from({ length: 7 }).map((_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    const day = date.toLocaleDateString('es-ES', { weekday: 'short' });
    const dateStr = date.toISOString().split('T')[0];
    
    const bookingsToday = shopBookings.filter(b => b.date === dateStr).length;
    const analyses = bookingsToday * 2;
    
    return { day, Analyses: analyses, Bookings: bookingsToday };
  });

  // Service Distribution
  const serviceDistribution = Object.entries(serviceCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a,b) => b.count - a.count);

  // Recent Activity construction (only real bookings)
  const recentActivity: RecentActivity[] = shopBookings.slice(-8).reverse().map(b => ({
    id: `b-${b.id}`,
    type: 'booking',
    description: `Reserva para ${b.service} - ${b.customerName || 'Cliente'}`,
    time: `${new Date(b.date).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })} a las ${b.time}`,
    icon: 'calendar',
  }));

  return {
    stats: {
      totalAnalyses,
      totalBookings,
      mostPopularService,
      monthlyRevenue,
    },
    dailyActivity,
    serviceDistribution,
    recentActivity,
  };
};


export const getPlatformDashboardData = (shops: BarberShop[], bookings: Booking[]): PlatformDashboardData => {
  const totalShops = shops.length;
  const totalPlatformBookings = bookings.length;
  const totalPlatformAnalyses = totalPlatformBookings * 2;

  let monthlyRecurringRevenue = 0;
  const planCounts = { 'Freemium': 0, 'Básico': 0, 'Profesional': 0 };
  
  shops.forEach(shop => {
      monthlyRecurringRevenue += PLAN_PRICES[shop.plan];
      planCounts[shop.plan]++;
  });

  const planDistribution: PlanDistribution[] = [
    { name: 'Freemium', count: planCounts['Freemium'], color: '#9ca3af' }, // gray-400
    { name: 'Básico', count: planCounts['Básico'], color: '#f59e0b' }, // amber-500
    { name: 'Profesional', count: planCounts['Profesional'], color: '#ef4444' }, // red-500
  ];
  
  const recentlyJoined = shops.slice(-3).reverse();
  
  return {
    stats: {
      monthlyRecurringRevenue,
      totalShops,
      totalPlatformAnalyses,
      totalPlatformBookings,
    },
    planDistribution,
    recentlyJoined,
  };
};