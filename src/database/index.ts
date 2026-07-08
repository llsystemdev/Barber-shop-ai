/**
 * Database Entry Point
 * 
 * Provides handles for testing connectivity, linking models,
 * and initializing multi-tenant contexts.
 */

import { supabase } from '../../supabase/client';

export const checkDatabaseConnection = async (): Promise<{ ok: boolean; message: string }> => {
  try {
    // Attempt a lightweight meta query to verify access
    const { error } = await supabase.from('tenants').select('count', { count: 'exact', head: true });
    if (error) {
      return { ok: false, message: `No se pudo conectar a la base de datos: ${error.message}` };
    }
    return { ok: true, message: 'Conexión a base de datos exitosa.' };
  } catch (err: any) {
    return { ok: false, message: err.message };
  }
};
