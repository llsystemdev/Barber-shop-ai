
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
  const shopBookings = bookings.filter(b => b.shopName === shop.name);

  // Stats - Deterministic based on shop ID length and name
  const baseRandom = seededRandom(shop.id + shop.name);
  
  const totalBookings = shopBookings.length > 0 ? shopBookings.length : Math.floor(baseRandom * 50) + 10;
  // Simulate analyses based on bookings
  const totalAnalyses = Math.floor(totalBookings * (1.5 + baseRandom)); 

  const serviceCounts: { [key: string]: number } = {};
  let monthlyRevenue = 0;
  
  // If no real bookings, generate mock service distribution
  if (shopBookings.length === 0) {
      shop.services.forEach((s, idx) => {
          const count = Math.floor(seededRandom(shop.id + s.name) * 20);
          serviceCounts[s.name] = count;
          const price = parseInt(s.price.replace('$','')) || 30;
          monthlyRevenue += count * price;
      });
  } else {
      shopBookings.forEach(b => {
        serviceCounts[b.service] = (serviceCounts[b.service] || 0) + 1;
        monthlyRevenue += MOCK_SERVICES_WITH_PRICES[b.service] || 30; 
      });
  }
  
  const mostPopularService = Object.keys(serviceCounts).length > 0 
    ? Object.keys(serviceCounts).reduce((a, b) => serviceCounts[a] > serviceCounts[b] ? a : b)
    : 'Corte Clásico';

  // Daily Activity for the last 7 days
  const dailyActivity = Array.from({ length: 7 }).map((_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    const day = date.toLocaleDateString('es-ES', { weekday: 'short' });
    const dateStr = date.toISOString().split('T')[0];
    
    // Consistent seed for this specific day and shop
    const dailySeed = shop.id + dateStr;
    const rng = seededRandom(dailySeed);
    
    const analyses = Math.floor(rng * 15) + 2;
    const bookingsToday = shopBookings.filter(b => b.date === dateStr).length + Math.floor(rng * 5);
    
    return { day, Analyses: analyses, Bookings: bookingsToday };
  });

  // Service Distribution
  const serviceDistribution = Object.entries(serviceCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a,b) => b.count - a.count);

  // Recent Activity construction
  const recentBookings: RecentActivity[] = shopBookings.slice(-5).map(b => ({
    id: `b-${b.id}`,
    type: 'booking',
    description: `Nueva reserva para ${b.service} a las ${b.time}`,
    time: new Date(b.date).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }),
    icon: 'calendar',
  }));
  
  // Simulate recent analyses based on consistent data
  const recentAnalyses: RecentActivity[] = Array.from({length: 5}).map((_, i) => {
      const time = new Date();
      time.setHours(time.getHours() - i * 2);
      // Use shop.id to keep IDs consistent across renders
      return {
        id: `a-${i}-${shop.id}`,
        type: 'analysis',
        description: `Análisis de estilo de IA completado`,
        time: `${time.getHours()}:${String(time.getMinutes()).padStart(2, '0')}`,
        icon: 'sparkles',
      }
  });

  // Merge and sort slightly deterministically
  let recentActivity = [...recentBookings, ...recentAnalyses];
  // Simple deterministic sort based on ID char codes to keep order static on refresh
  recentActivity.sort((a, b) => b.id.charCodeAt(0) - a.id.charCodeAt(0)); 
  recentActivity = recentActivity.slice(0, 8);


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
  // Platform-wide stats
  const totalShops = shops.length;
  const totalPlatformBookings = bookings.length > 0 ? bookings.length : 142; // Mock base
  const totalPlatformAnalyses = Math.floor(totalPlatformBookings * 2.5);

  let monthlyRecurringRevenue = 0;
  const planCounts = { 'Freemium': 0, 'Básico': 0, 'Profesional': 0 };
  
  shops.forEach(shop => {
      monthlyRecurringRevenue += PLAN_PRICES[shop.plan];
      planCounts[shop.plan]++;
  });
  
  // Add some mock revenue if shop list is small for demo purposes
  if (monthlyRecurringRevenue < 50) monthlyRecurringRevenue += 1250;

  const planDistribution: PlanDistribution[] = [
    { name: 'Freemium', count: planCounts['Freemium'], color: '#9ca3af' }, // gray-400
    { name: 'Básico', count: planCounts['Básico'], color: '#f59e0b' }, // amber-500
    { name: 'Profesional', count: planCounts['Profesional'], color: '#ef4444' }, // red-500
  ];
  
  // Get last 3 shops as "recently joined"
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