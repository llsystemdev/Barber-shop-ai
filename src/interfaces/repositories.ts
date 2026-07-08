/**
 * Repository Layer Interfaces - Clean Architecture Blueprint
 * 
 * Standardizes CRUD and customized data query pathways across database engines.
 */

export interface IBaseRepository<T> {
  findById(id: string): Promise<T | null>;
  findAll(filters?: Record<string, any>): Promise<T[]>;
  create(item: Partial<T>): Promise<T>;
  update(id: string, item: Partial<T>): Promise<T>;
  delete(id: string): Promise<boolean>;
}

export interface ITenantRepository extends IBaseRepository<any> {
  findBySubdomain(subdomain: string): Promise<any | null>;
  updatePlan(id: string, plan: 'freemium' | 'pro' | 'enterprise'): Promise<any>;
}

export interface IUserRepository extends IBaseRepository<any> {
  findByEmail(email: string): Promise<any | null>;
  getUsersByTenant(tenantId: string, role?: string): Promise<any[]>;
}

export interface IAppointmentRepository extends IBaseRepository<any> {
  getAppointmentsByDateRange(tenantId: string, start: string, end: string): Promise<any[]>;
  getCustomerAppointments(customerId: string): Promise<any[]>;
  updateStatus(appointmentId: string, status: string): Promise<any>;
}

export interface IInventoryRepository extends IBaseRepository<any> {
  getStockLevel(branchId: string, productId: string): Promise<number>;
  adjustStockLevel(branchId: string, product_id: string, delta: number): Promise<any>;
  getLowStock(branchId: string): Promise<any[]>;
}

export interface IServiceRepository extends IBaseRepository<any> {
  getServicesByCategory(tenantId: string, categoryId: string): Promise<any[]>;
  getServicesByTenant(tenantId: string): Promise<any[]>;
}
