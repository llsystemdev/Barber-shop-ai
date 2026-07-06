import React, { createContext, useContext, useState, useEffect } from 'react';
import { User as AppUser } from '../types';
import { mockShopOwnerUser, mockAdminUser } from '../mock/users';

// Type definitions for our Auth Context
export interface AuthContextType {
  currentUser: AppUser | null;
  loading: boolean;
  loginWithEmail: (email: string, password: string) => Promise<{ data: any; error: any }>;
  loginWithGoogle: () => Promise<{ data: any; error: any }>;
  registerWithEmail: (email: string, password: string, name: string) => Promise<{ data: any; error: any }>;
  logoutUser: () => Promise<{ error: any }>;
  resetPassword: (email: string) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Local listeners array to replicate onAuthStateChanged
const authListeners: Array<(user: AppUser | null) => void> = [];

// Helper to get active user from localStorage
export const getActiveUser = (): AppUser | null => {
  const saved = localStorage.getItem('mock_user_session');
  return saved ? JSON.parse(saved) : null;
};

// Helper to set active user in localStorage and notify listeners
export const setActiveUser = (user: AppUser | null) => {
  if (user) {
    localStorage.setItem('mock_user_session', JSON.stringify(user));
  } else {
    localStorage.removeItem('mock_user_session');
    localStorage.removeItem('userRole');
  }
  authListeners.forEach(listener => listener(user));
};

// --- AUTHENTICATION METHODS (REPLACING FIREBASE AUTH WITH REAL BACKEND) ---

export const loginWithEmail = async (email: string, password: string) => {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    if (!response.ok) {
      return { data: null, error: new Error(data.error || 'Error al iniciar sesión') };
    }
    
    localStorage.setItem('userRole', data.user.role);
    setActiveUser(data.user);
    return { data: { user: data.user }, error: null };
  } catch (err: any) {
    return { data: null, error: err };
  }
};

export const loginWithGoogle = async () => {
  try {
    const role = localStorage.getItem('userRole') || 'shopOwner';
    const response = await fetch('/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role })
    });
    
    const data = await response.json();
    if (!response.ok) {
      return { data: null, error: new Error(data.error || 'Error al conectar con Google') };
    }
    
    setActiveUser(data.user);
    return { data: { user: data.user }, error: null };
  } catch (err: any) {
    return { data: null, error: err };
  }
};

export const registerWithEmail = async (email: string, password: string, name: string) => {
  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name, role: 'shopOwner' })
    });
    
    const data = await response.json();
    if (!response.ok) {
      return { data: null, error: new Error(data.error || 'Error en el registro') };
    }
    
    localStorage.setItem('userRole', data.user.role);
    setActiveUser(data.user);
    return { data: { user: data.user }, error: null };
  } catch (err: any) {
    return { data: null, error: err };
  }
};

export const logoutUser = async () => {
  setActiveUser(null);
  return { error: null };
};

export const resetPassword = async (email: string) => {
  // Simple simulation since we don't send emails actually
  return new Promise<{ error: any }>((resolve) => {
    setTimeout(() => {
      resolve({ error: null });
    }, 500);
  });
};

// Replaces Firebase onAuthStateChanged and supports both signatures
export const onAuthStateChanged = (arg1: any, arg2?: any) => {
  const callback = typeof arg1 === 'function' ? arg1 : arg2;
  if (!callback) return () => {};
  
  authListeners.push(callback);
  
  // Call immediately with existing session
  const current = getActiveUser();
  setTimeout(() => {
    callback(current);
  }, 50);

  // Return unsubscribe function
  return () => {
    const idx = authListeners.indexOf(callback);
    if (idx > -1) {
      authListeners.splice(idx, 1);
    }
  };
};

// --- AUTH PROVIDER COMPONENT ---

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged((user) => {
      setCurrentUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const value = {
    currentUser,
    loading,
    loginWithEmail,
    loginWithGoogle,
    registerWithEmail,
    logoutUser,
    resetPassword
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// --- USEAUTH HOOK ---

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
