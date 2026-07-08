/**
 * Models Helpers and Mapping Entry Point
 */

import { IUser, ITenant } from '../types';

export class UserModel {
  public static isAdmin(user: IUser): boolean {
    return user.role === 'admin';
  }

  public static isTenantOwner(user: IUser, tenant: ITenant): boolean {
    return user.role === 'tenant_admin' && user.tenant_id === tenant.id;
  }

  public static getFirstName(user: IUser): string {
    return user.full_name.split(' ')[0] || '';
  }
}
