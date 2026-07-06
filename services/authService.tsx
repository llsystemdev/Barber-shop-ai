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

export const loginWithGoogle = async (): Promise<{ data: any; error: any }> => {
  return new Promise(async (resolve) => {
    try {
      const role = localStorage.getItem('userRole') || 'shopOwner';
      const redirectUri = `${window.location.origin}/api/auth/google/callback`;
      
      const response = await fetch(`/api/auth/google/url?redirect_uri=${encodeURIComponent(redirectUri)}&role=${role}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        resolve({ data: null, error: new Error(errorData.error || 'Error al obtener la URL de Google') });
        return;
      }
      const { url } = await response.json();

      const authWindow = window.open(
        url,
        'google_oauth_popup',
        'width=500,height=600'
      );

      if (!authWindow) {
        resolve({ data: null, error: new Error('El navegador bloqueó la ventana emergente de Google. Por favor, actívala para iniciar sesión.') });
        return;
      }

      // Handler for message events
      const handleMessage = (event: MessageEvent) => {
        const origin = event.origin;
        if (!origin.endsWith('.run.app') && !origin.includes('localhost')) {
          return;
        }

        if (event.data?.type === 'GOOGLE_AUTH_SUCCESS') {
          const user = event.data.user;
          localStorage.setItem('userRole', user.role);
          setActiveUser(user);
          window.removeEventListener('message', handleMessage);
          resolve({ data: { user }, error: null });
        }
      };

      window.addEventListener('message', handleMessage);

      // Simple interval to detect when user closes popup without logging in
      const checkClosed = setInterval(() => {
        if (authWindow.closed) {
          clearInterval(checkClosed);
          window.removeEventListener('message', handleMessage);
          // Wait briefly in case message event has already been queued or processed
          setTimeout(() => {
            const current = getActiveUser();
            if (current) {
              resolve({ data: { user: current }, error: null });
            } else {
              resolve({ data: null, error: new Error('La autenticación con Google fue cancelada.') });
            }
          }, 500);
        }
      }, 1000);

    } catch (err: any) {
      resolve({ data: null, error: err });
    }
  });
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
