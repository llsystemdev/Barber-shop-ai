/**
 * Express Middleware Blueprints
 * 
 * Essential handlers for JWT auth verification, multi-tenant headers extraction,
 * and automatic audit trail injection.
 */

// Placeholder signature for Node Express Request/Response/Next
export type ExpressMiddleware = (req: any, res: any, next: () => void) => void;

/**
 * Ensures the request specifies a valid X-Tenant-ID header.
 * Automatically injects it into the routing context.
 */
export const multiTenantMiddleware: ExpressMiddleware = (req, res, next) => {
  const tenantId = req.headers['x-tenant-id'] || req.query.tenantId;
  
  if (!tenantId) {
    return res.status(400).json({ error: 'Falta la cabecera obligatoria de multi-inquilino: X-Tenant-ID' });
  }

  req.tenantId = tenantId;
  next();
};

/**
 * Validates request authentication bearer tokens.
 */
export const requireAuthMiddleware: ExpressMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Falta el token de autorización o es inválido' });
  }

  const token = authHeader.split(' ')[1];
  // TODO: Verify JWT token with Supabase Auth or local parser
  req.user = { id: 'usr_placeholder', role: 'customer' };
  next();
};

/**
 * Validates role-based access control (RBAC).
 */
export const requireRoles = (allowedRoles: string[]): ExpressMiddleware => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Acceso denegado: permisos insuficientes' });
    }
    next();
  };
};
