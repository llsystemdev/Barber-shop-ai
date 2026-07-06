import { User } from '../types';

export const mockUsers: User[] = [
  {
    id: "mock-user-owner",
    name: "Juan Pérez (Propietario)",
    role: "shopOwner",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Juan",
    shopId: "shop_default"
  },
  {
    id: "mock-user-admin",
    name: "Administrador del Sistema",
    role: "platformAdmin",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Admin"
  }
];

export const mockAdminUser = {
  id: "mock-user-admin",
  name: "Administrador del Sistema",
  email: "admin@virtus.com",
  role: "platformAdmin"
};

export const mockShopOwnerUser = {
  id: "mock-user-owner",
  name: "Juan Pérez",
  email: "owner@barberia.com",
  role: "shopOwner"
};
