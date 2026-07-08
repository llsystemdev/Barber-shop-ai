/**
 * Supabase Client Configuration Blueprint
 * 
 * This file prepares the configuration parameters for the Supabase client.
 * Once ready to connect, install `@supabase/supabase-js` and import this file.
 */

export interface SupabaseConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseServiceRoleKey?: string;
  options: {
    auth: {
      autoRefreshToken: boolean;
      persistSession: boolean;
      detectSessionInUrl: boolean;
    };
    db: {
      schema: string;
    };
    global: {
      headers: Record<string, string>;
    };
  };
}

export const getSupabaseConfig = (): SupabaseConfig => {
  const url = process.env.SUPABASE_URL || 'https://placeholder-project.supabase.co';
  const anonKey = process.env.SUPABASE_ANON_KEY || 'placeholder-anon-key';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  return {
    supabaseUrl: url,
    supabaseAnonKey: anonKey,
    supabaseServiceRoleKey: serviceRoleKey,
    options: {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
      db: {
        schema: 'public',
      },
      global: {
        headers: {
          'x-application-name': 'barber-shop-ai',
        },
      },
    },
  };
};

export const SUPABASE_BUCKETS = {
  AVATARS: 'avatars',
  HAIRCUTS: 'haircuts',
  VIDEOS: 'videos',
  LOGOS: 'logos',
  DOCUMENTS: 'documents',
  AI_IMAGES: 'ai_images',
} as const;

export const SUPABASE_CHANNELS = {
  APPOINTMENTS: 'realtime:appointments',
  CHAT: 'realtime:chat',
  NOTIFICATIONS: 'realtime:notifications',
} as const;
