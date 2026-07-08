/**
 * Global Architecture Configurations
 */

export const CONFIG = {
  APP_ENV: process.env.NODE_ENV || 'development',
  APP_PORT: 3000,
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  
  SUPABASE: {
    URL: process.env.SUPABASE_URL || '',
    ANON_KEY: process.env.SUPABASE_ANON_KEY || '',
  },

  STRIPE: {
    SECRET_KEY: process.env.STRIPE_SECRET_KEY || '',
    PUBLISHABLE_KEY: process.env.VITE_STRIPE_PUBLISHABLE_KEY || '',
  },

  GEMINI: {
    API_KEY: process.env.GEMINI_API_KEY || '',
  },
};
