/**
 * Zod Schema Validators - Domain Boundary Guards
 * 
 * Safe schema definitions validating all structural elements of the multi-tenant SaaS.
 * Includes complete Zod schemas for all requested enterprise domain models.
 */

import { z } from 'zod';

// Reusable parts
export const metadataSchema = z.record(z.any()).nullable().optional();
export const uuidSchema = z.string().uuid();

export const baseEntityFields = {
  id: uuidSchema.optional(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
  deleted_at: z.string().datetime().nullable().optional(),
  created_by: uuidSchema.nullable().optional(),
  updated_by: uuidSchema.nullable().optional(),
  tenant_id: uuidSchema.nullable().optional(),
  metadata: metadataSchema,
};

// Tenant Validator
export const tenantSchema = z.object({
  ...baseEntityFields,
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  logo_url: z.string().url().nullable().optional(),
  subdomain: z.string().min(3, 'El subdominio debe tener al menos 3 caracteres').toLowerCase().optional(),
  plan_type: z.enum(['free', 'starter', 'pro', 'enterprise']).default('free'),
  settings: z.record(z.any()).nullable().optional(),
});

// User Validator
export const userSchema = z.object({
  ...baseEntityFields,
  email: z.string().email('Correo electrónico no válido'),
  full_name: z.string().min(2, 'El nombre completo debe tener al menos 2 caracteres'),
  role: z.enum(['admin', 'tenant_admin', 'barber', 'receptionist', 'customer']).default('customer'),
  avatar_url: z.string().url().nullable().optional(),
});

// Profile Validator
export const profileSchema = z.object({
  ...baseEntityFields,
  user_id: uuidSchema,
  phone: z.string().optional().nullable(),
  bio: z.string().optional().nullable(),
  birthdate: z.string().optional().nullable(),
  gender: z.string().optional().nullable(),
});

// Role Validator
export const roleSchema = z.object({
  ...baseEntityFields,
  name: z.string().min(2),
  description: z.string().optional().nullable(),
});

// Permission Validator
export const permissionSchema = z.object({
  ...baseEntityFields,
  role_id: uuidSchema,
  feature_flag: z.string(),
  is_enabled: z.boolean().default(true),
});

// Guest User Validator
export const guestUserSchema = z.object({
  id: z.string(),
  first_seen_at: z.string().datetime(),
  ip_address: z.string().optional().nullable(),
  user_agent: z.string().optional().nullable(),
  metadata: metadataSchema,
});

// Guest Session Validator
export const guestSessionSchema = z.object({
  id: z.string(),
  guest_id: z.string(),
  created_at: z.string().datetime(),
  expires_at: z.string().datetime(),
});

// Guest Simulation Validator
export const guestSimulationSchema = z.object({
  id: uuidSchema.optional(),
  guest_id: z.string(),
  photo_url: z.string().url(),
  style_id: z.string(),
  result_url: z.string().url(),
  created_at: z.string().datetime().optional(),
});

// Branch Validator
export const branchSchema = z.object({
  ...baseEntityFields,
  name: z.string().min(2, 'El nombre de la sucursal es obligatorio'),
  address: z.string().min(5, 'La dirección debe ser detallada'),
  phone: z.string().optional().nullable(),
  hours: z.record(z.any()).nullable().optional(),
});

// Barber Validator
export const barberSchema = z.object({
  ...baseEntityFields,
  user_id: uuidSchema,
  branch_id: uuidSchema.nullable().optional(),
  specialty: z.string().min(2, 'Especialidad obligatoria').optional(),
  commission_percentage: z.number().min(0).max(100).default(0),
  is_active: z.boolean().default(true),
});

// Schedule Validator
export const scheduleSchema = z.object({
  id: uuidSchema.optional(),
  barber_id: uuidSchema,
  day_of_week: z.number().int().min(0).max(6),
  start_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Formato de hora HH:MM obligatorio'),
  end_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Formato de hora HH:MM obligatorio'),
  is_working_day: z.boolean().default(true),
});

// Service Category Validator
export const serviceCategorySchema = z.object({
  ...baseEntityFields,
  name: z.string().min(2, 'El nombre de la categoría es obligatorio'),
});

// Service Validator
export const serviceSchema = z.object({
  ...baseEntityFields,
  category_id: uuidSchema.nullable().optional(),
  name: z.string().min(2, 'El nombre del servicio es obligatorio'),
  description: z.string().optional().nullable(),
  price: z.number().positive('El precio debe ser un número positivo'),
  duration_minutes: z.number().int().positive('La duración debe ser positiva'),
});

// Appointment Validator
export const appointmentSchema = z.object({
  ...baseEntityFields,
  branch_id: uuidSchema,
  customer_id: uuidSchema,
  barber_id: uuidSchema,
  service_id: uuidSchema,
  appointment_time: z.string().datetime('La fecha de la cita debe estar en formato ISO UTC'),
  status: z.enum(['pending', 'confirmed', 'completed', 'cancelled']).default('pending'),
  notes: z.string().optional().nullable(),
  total_price: z.number().nonnegative(),
});

// Product Validator
export const productSchema = z.object({
  ...baseEntityFields,
  provider_id: uuidSchema.nullable().optional(),
  name: z.string().min(2, 'El nombre del producto es obligatorio'),
  description: z.string().optional().nullable(),
  price: z.number().nonnegative(),
  cost: z.number().nonnegative(),
  sku: z.string().optional().nullable(),
});

// Inventory Validator
export const inventorySchema = z.object({
  ...baseEntityFields,
  branch_id: uuidSchema,
  product_id: uuidSchema,
  quantity: z.number().int().nonnegative(),
  min_stock_alert: z.number().int().nonnegative().default(5),
});

// Payment Validator
export const paymentSchema = z.object({
  ...baseEntityFields,
  appointment_id: uuidSchema.nullable().optional(),
  amount: z.number().positive('El monto debe ser positivo'),
  payment_method: z.enum(['card', 'cash', 'transfer', 'stripe']),
  status: z.enum(['pending', 'completed', 'refunded', 'failed']).default('pending'),
  stripe_charge_id: z.string().optional().nullable(),
});

// Subscription Validator
export const subscriptionSchema = z.object({
  ...baseEntityFields,
  stripe_subscription_id: z.string(),
  stripe_customer_id: z.string(),
  plan_id: z.string(),
  status: z.string(),
  current_period_start: z.string().datetime(),
  current_period_end: z.string().datetime(),
  cancel_at_period_end: z.boolean().default(false),
});

// Plan Validator
export const planSchema = z.object({
  id: z.string(),
  name: z.string(),
  stripe_price_id: z.string(),
  stripe_product_id: z.string(),
  price: z.number().nonnegative(),
  currency: z.string().default('MXN'),
  interval: z.enum(['month', 'year']).default('month'),
  features: z.array(z.string()),
  limits: z.record(z.any()),
  active: z.boolean().default(true),
});

// Credit Validator
export const creditSchema = z.object({
  ...baseEntityFields,
  user_id: uuidSchema,
  balance: z.number().int().nonnegative().default(0),
});

// Usage Validator
export const usageSchema = z.object({
  ...baseEntityFields,
  feature_name: z.string(),
  quantity_used: z.number().int().positive(),
  reset_at: z.string().datetime(),
});

// Review Validator
export const reviewSchema = z.object({
  ...baseEntityFields,
  barber_id: uuidSchema.nullable().optional(),
  customer_id: uuidSchema,
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional().nullable(),
});

// Notification Validator
export const notificationSchema = z.object({
  ...baseEntityFields,
  user_id: uuidSchema,
  title: z.string().min(2),
  body: z.string(),
  is_read: z.boolean().default(false),
});

// Message Validator
export const messageSchema = z.object({
  ...baseEntityFields,
  chat_id: uuidSchema,
  sender_id: uuidSchema,
  content: z.string(),
});

// Gallery Validator
export const gallerySchema = z.object({
  ...baseEntityFields,
  photo_url: z.string().url(),
  caption: z.string().optional().nullable(),
});

// Style Validator
export const styleSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string(),
  photo_url: z.string().url(),
  description: z.string().optional().nullable(),
});

// Haircut Validator
export const haircutSchema = z.object({
  ...baseEntityFields,
  name: z.string(),
  photo_url: z.string().url(),
  style_id: z.string().optional().nullable(),
});

// AI Generation Validator
export const aiGenerationSchema = z.object({
  ...baseEntityFields,
  user_id: uuidSchema.nullable().optional(),
  style_id: z.string(),
  original_photo_url: z.string().url(),
  result_url: z.string().url(),
  status: z.enum(['pending', 'completed', 'failed']).default('pending'),
});

// Favorite Validator
export const favoriteSchema = z.object({
  ...baseEntityFields,
  user_id: uuidSchema,
  style_id: z.string(),
});

// History Validator
export const historySchema = z.object({
  ...baseEntityFields,
  user_id: uuidSchema,
  action: z.string(),
  details: z.record(z.any()).nullable().optional(),
});

// Audit Log Validator
export const auditLogSchema = z.object({
  id: uuidSchema.optional(),
  tenant_id: uuidSchema.nullable().optional(),
  user_id: uuidSchema.nullable().optional(),
  action: z.string(),
  details: z.record(z.any()).nullable().optional(),
  created_at: z.string().datetime().optional(),
});

// Settings Validator
export const settingsSchema = z.object({
  ...baseEntityFields,
  key: z.string(),
  value: z.record(z.any()),
});

// Analytics Validator
export const analyticsSchema = z.object({
  ...baseEntityFields,
  metric_name: z.string(),
  metric_value: z.number(),
  recorded_at: z.string().datetime(),
});

// Report Validator
export const reportSchema = z.object({
  ...baseEntityFields,
  name: z.string(),
  url: z.string().url(),
  format: z.string(),
  start_date: z.string().datetime(),
  end_date: z.string().datetime(),
});

// AI Chat Session Validator
export const aiChatSchema = z.object({
  ...baseEntityFields,
  user_id: uuidSchema.nullable().optional(),
  session_id: z.string(),
  messages: z.array(z.any()),
  analysis_data: z.record(z.any()).nullable().optional(),
});
