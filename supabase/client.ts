/**
 * Supabase Client Instantiation Placeholder
 * 
 * To activate, simply uncomment the real implementation imports and comment out the mockup placeholder.
 * Do NOT install `@supabase/supabase-js` until you are ready to migrate.
 */

import { getSupabaseConfig } from './config';
import { Database } from './database.types';

// ==========================================
// MOCK CLIENT FOR DEVELOPMENT & COMPILATION
// ==========================================
export class MockSupabaseClient {
  private config = getSupabaseConfig();

  auth = {
    signUp: async (credentials: any) => ({ data: { user: null, session: null }, error: null }),
    signInWithPassword: async (credentials: any) => ({ data: { user: null, session: null }, error: null }),
    signInWithOtp: async (credentials: any) => ({ data: { user: null, session: null }, error: null }),
    signInWithOAuth: async (credentials: any) => ({ data: { url: 'https://placeholder-oauth-url.com' }, error: null }),
    signOut: async () => ({ error: null }),
    getSession: async () => ({ data: { session: null }, error: null }),
    getUser: async () => ({ data: { user: null }, error: null }),
    onAuthStateChange: (callback: any) => ({ data: { subscription: { unsubscribe: () => {} } }, error: null }),
  };

  from(table: keyof Database['public']['Tables'] | string) {
    return {
      select: (columns = '*') => this,
      insert: (values: any) => this,
      update: (values: any) => this,
      delete: () => this,
      eq: (column: string, value: any) => this,
      neq: (column: string, value: any) => this,
      gt: (column: string, value: any) => this,
      lt: (column: string, value: any) => this,
      single: async () => ({ data: null, error: null }),
      maybeSingle: async () => ({ data: null, error: null }),
      order: (column: string, options?: any) => this,
      limit: (count: number) => this,
      execute: async () => ({ data: [], error: null }),
    };
  }

  storage = {
    from: (bucket: string) => ({
      upload: async (path: string, file: any, options?: any) => ({ data: { path }, error: null }),
      download: async (path: string) => ({ data: new Blob(), error: null }),
      remove: async (paths: string[]) => ({ data: null, error: null }),
      getPublicUrl: (path: string) => ({ data: { publicUrl: `https://placeholder-storage.supabase.co/${bucket}/${path}` } }),
    }),
  };

  functions = {
    invoke: async (functionName: string, options?: any) => ({ data: null, error: null }),
  };

  channel = (name: string) => ({
    on: (type: string, filter: any, callback: any) => this,
    subscribe: () => ({ unsubscribe: () => {} }),
  });
}

/**
 * Real client activation code (uncomment when `@supabase/supabase-js` is installed)
 * 
 * import { createClient } from '@supabase/supabase-js';
 * 
 * const config = getSupabaseConfig();
 * export const supabase = createClient<Database>(config.supabaseUrl, config.supabaseAnonKey, {
 *   auth: config.options.auth,
 *   db: { schema: config.options.db.schema }
 * });
 */

// Statically instantiated mock client to prevent application breakage
export const supabase = new MockSupabaseClient() as any;
