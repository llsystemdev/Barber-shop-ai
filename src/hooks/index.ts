/**
 * Global Custom Hooks
 * 
 * Exposes reusable hooks wrapped around the Clean Architecture service layer.
 */

import { useState, useEffect } from 'react';
import { useServices } from '../providers';
import { IAuthService, IAppointmentService } from '../interfaces/services';

export const useAuthService = (): IAuthService => {
  const services = useServices();
  return services.resolve<IAuthService>('IAuthService');
};

export const useAppointmentService = (): IAppointmentService => {
  const services = useServices();
  return services.resolve<IAppointmentService>('IAppointmentService');
};

export const useTenantInfo = (tenantId: string) => {
  const [tenant, setTenant] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const services = useServices();

  useEffect(() => {
    let active = true;
    const loadTenant = async () => {
      try {
        const db = services.resolve<any>('IAuthService'); // placeholder resolved service
        // Mock query logic
        if (active) {
          setTenant({ id: tenantId, name: 'Barber Shop AI Tenant' });
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (active) setLoading(false);
      }
    };
    loadTenant();
    return () => { active = false; };
  }, [tenantId, services]);

  return { tenant, loading };
};
