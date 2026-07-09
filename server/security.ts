import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

// In-Memory storage for simple, robust rate limiting (SaaS Ready)
interface RateLimitRecord {
  count: number;
  resetTime: number;
}
const rateLimitStore = new Map<string, RateLimitRecord>();

/**
 * Enterprise Rate Limiter Middleware
 * Protects specific routes from DOS and Brute-force attacks.
 */
export function rateLimiter(options: { windowMs: number; max: number; message: string }) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Standard reverse-proxy IP resolving
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';
    const key = `${req.path}:${ip}`;
    const now = Date.now();

    let record = rateLimitStore.get(key);

    if (!record || now > record.resetTime) {
      record = {
        count: 1,
        resetTime: now + options.windowMs,
      };
      rateLimitStore.set(key, record);
      return next();
    }

    record.count++;
    if (record.count > options.max) {
      return res.status(429).json({
        error: options.message,
        retryAfterMs: record.resetTime - now,
      });
    }

    next();
  };
}

/**
 * Enterprise Security Headers (SaaS & Multi-Tenant Complaint)
 * Protects against clickjacking, XSS, MIME sniffing, and enforces HTTPS.
 */
export function securityHeaders(req: Request, res: Response, next: NextFunction) {
  // Prevent Clickjacking (using SAMEORIGIN to allow preview within the platform, while CSP frame-ancestors provides robust protection)
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  
  // Prevent MIME Type Sniffing
  res.setHeader('X-Content-Type-Type', 'nosniff');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Basic XSS Protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Enforce HSTS (Strict-Transport-Security) for production
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  }

  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // CSP (Content Security Policy) - custom configured for AI Studio environment
  // Allows connections to Google APIs and loaded external images
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self' https://*.googleapis.com https://*.google.com; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.google.com; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "font-src 'self' https://fonts.gstatic.com; " +
    "img-src 'self' data: blob: https://*.dicebear.com https://api.dicebear.com https://images.pexels.com https://*.run.app https://*.googleapis.com; " +
    "connect-src 'self' https://*.googleapis.com https://*.google.com https://*.run.app; " +
    "frame-ancestors 'self' https://ai.studio https://*.google.com; " +
    "media-src 'self';"
  );

  next();
}

/**
 * Basic Input Sanitizer Helper
 * Prevents XSS attacks by sanitizing string values in req.body.
 */
export function sanitizeInput(req: Request, res: Response, next: NextFunction) {
  const sanitizeString = (str: string): string => {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  };

  const traverseAndSanitize = (obj: any, keyName?: string): any => {
    if (typeof obj === 'string') {
      // Skip keys associated with binary/image data or URLs
      const skipKeys = [
        'frontImageUrl', 'sideImageUrl', 'image', 'frontImage', 'sideImage',
        'data', 'avatarUrl', 'gallery', 'url', 'base64', 'photoUrl', 'bannerUrl',
        'mimeType', 'mimetype'
      ];
      if (keyName && skipKeys.includes(keyName)) {
        return obj;
      }
      // Also skip if it is a Data URI
      if (obj.startsWith('data:image/')) {
        return obj;
      }
      return sanitizeString(obj);
    } else if (Array.isArray(obj)) {
      return obj.map(item => traverseAndSanitize(item, keyName));
    } else if (obj !== null && typeof obj === 'object') {
      const sanitizedObj: any = {};
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          sanitizedObj[key] = traverseAndSanitize(obj[key], key);
        }
      }
      return sanitizedObj;
    }
    return obj;
  };

  if (req.body) {
    req.body = traverseAndSanitize(req.body);
  }
  next();
}

/**
 * Image/File Security Validation
 * Guards against malicious file uploads and MIME spoofing.
 */
export function validateImageUpload(base64Image: string): { valid: boolean; error?: string } {
  if (!base64Image) {
    return { valid: false, error: 'Imagen vacía o ausente.' };
  }

  // Check size limit (e.g., 10MB)
  const buffer = Buffer.from(base64Image.replace(/^data:image\/\w+;base64,/, ''), 'base64');
  const sizeInMB = buffer.length / (1024 * 1024);
  if (sizeInMB > 10) {
    return { valid: false, error: `La imagen excede el límite de 10MB (Tamaño actual: ${sizeInMB.toFixed(2)}MB).` };
  }

  // Basic signature/magic bytes check for PNG, JPG, WEBP, GIF
  const header = buffer.toString('hex', 0, 4).toUpperCase();
  const isJPG = header.startsWith('FFD8FF');
  const isPNG = header.startsWith('89504E47');
  const isGIF = header.startsWith('47494638'); // GIF87a or GIF89a
  const isWEBP = header.startsWith('52494646') && buffer.toString('hex', 8, 12).toUpperCase() === '57454250'; // RIFF....WEBP

  if (!isJPG && !isPNG && !isGIF && !isWEBP) {
    return { valid: false, error: 'Tipo de archivo no permitido. Solo se aceptan imágenes (JPEG, PNG, WEBP, GIF).' };
  }

  return { valid: true };
}
