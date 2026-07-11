import React, { createContext, useContext, useState, useEffect } from 'react';
import { User as AppUser } from '../types';
import { 
  auth, 
  googleProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail 
} from '../firebase/client';
import { onAuthStateChanged as firebaseOnAuthStateChanged, sendEmailVerification } from 'firebase/auth';

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

// Helper to get active user from localStorage
export const getActiveUser = (): AppUser | null => {
  const saved = localStorage.getItem('mock_user_session');
  return saved ? JSON.parse(saved) : null;
};

// Helper to set active user in localStorage
export const setActiveUser = (user: AppUser | null) => {
  if (user) {
    localStorage.setItem('mock_user_session', JSON.stringify(user));
    localStorage.setItem('userRole', user.role);
  } else {
    localStorage.removeItem('mock_user_session');
    localStorage.removeItem('userRole');
  }
};

// --- AUTHENTICATION METHODS WITH REAL FIREBASE AUTH ---

export const loginWithEmail = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;
    
    if (!firebaseUser.emailVerified) {
      await signOut(auth);
      setActiveUser(null);
      return { data: null, error: new Error("Debes verificar tu correo electrónico antes de acceder a la plataforma.") };
    }
    
    // Check if there is an explicit role selected in UI or fallback to typical roles
    const role = localStorage.getItem('userRole') || (email.toLowerCase().includes('admin') ? 'platformAdmin' : 'shopOwner');
    
    const appUser: AppUser = {
      id: firebaseUser.uid,
      name: firebaseUser.displayName || email.split('@')[0],
      email: firebaseUser.email || email,
      role: role as any,
      avatarUrl: firebaseUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${firebaseUser.uid}`
    };

    // Synchronize the authenticated user profile with Firestore and local backend DB
    await fetch('/api/auth/sync-firebase-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user: appUser })
    });

    setActiveUser(appUser);
    return { data: { user: appUser }, error: null };
  } catch (err: any) {
    console.error('[loginWithEmail Error]', err);
    return { data: null, error: err };
  }
};

export const loginWithGoogle = async (): Promise<{ data: any; error: any }> => {
  const role = localStorage.getItem('userRole') || 'shopOwner';
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

  if (isLocalhost) {
    try {
      const userCredential = await signInWithPopup(auth, googleProvider);
      const firebaseUser = userCredential.user;
      
      const appUser: AppUser = {
        id: firebaseUser.uid,
        name: firebaseUser.displayName || 'Usuario Google',
        email: firebaseUser.email || '',
        role: role as any,
        avatarUrl: firebaseUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${firebaseUser.uid}`
      };

      // Synchronize the authenticated user profile with Firestore and local backend DB
      await fetch('/api/auth/sync-firebase-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: appUser })
      });

      setActiveUser(appUser);
      return { data: { user: appUser }, error: null };
    } catch (err: any) {
      console.warn('[loginWithGoogle] Standard Firebase popup failed on localhost, trying server-side Google OAuth fallback:', err);
    }
  }

  // Fallback / Production Google OAuth flow:
  // 1. Open a blank popup synchronously to guarantee it is NOT blocked by browser pop-up blockers!
  const width = 500;
  const height = 650;
  const left = window.screenX + (window.outerWidth - width) / 2;
  const top = window.screenY + (window.outerHeight - height) / 2;
  
  const popup = window.open('about:blank', 'GoogleAuth', `width=${width},height=${height},left=${left},top=${top}`);
  if (!popup) {
    return { data: null, error: new Error('El bloqueador de ventanas emergentes impidió abrir el inicio de sesión con Google. Por favor, permítelo en tu navegador y vuelve a intentarlo.') };
  }

  try {
    const redirectUri = `${window.location.origin}/api/auth/google/callback`;
    const response = await fetch(`/api/auth/google/url?redirect_uri=${encodeURIComponent(redirectUri)}&role=${encodeURIComponent(role)}`);
    if (!response.ok) {
      popup.close();
      throw new Error('No se pudo obtener la URL de inicio de sesión de Google desde el servidor.');
    }
    const { url } = await response.json();
    
    // 2. Set the pre-opened popup location to the Google OAuth authorization URL
    popup.location.href = url;

    return new Promise((resolve) => {
      const handler = async (event: MessageEvent) => {
        // Validate origin is from the same site
        if (event.origin !== window.location.origin) return;

        if (event.data && event.data.type === 'GOOGLE_AUTH_SUCCESS') {
          window.removeEventListener('message', handler);
          clearInterval(checkClosed);
          const appUser = event.data.user;
          setActiveUser(appUser);
          resolve({ data: { user: appUser }, error: null });
        }
      };
      
      window.addEventListener('message', handler);
      
      const checkClosed = setInterval(() => {
        // Check if localStorage was already updated (double-safety fallback if postMessage was blocked)
        const saved = localStorage.getItem('mock_user_session');
        if (saved) {
          try {
            const appUser = JSON.parse(saved);
            clearInterval(checkClosed);
            window.removeEventListener('message', handler);
            resolve({ data: { user: appUser }, error: null });
            return;
          } catch (e) {}
        }

        if (!popup || popup.closed) {
          clearInterval(checkClosed);
          window.removeEventListener('message', handler);
          resolve({ data: null, error: new Error('La ventana de inicio de sesión fue cerrada') });
        }
      }, 1000);
    });
  } catch (fallbackErr: any) {
    if (popup) popup.close();
    console.error('[loginWithGoogle Fallback Error]', fallbackErr);
    return { data: null, error: fallbackErr };
  }
};

export const registerWithEmail = async (email: string, password: string, name: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;
    
    // Immediately send email verification
    await sendEmailVerification(firebaseUser);
    
    const role = 'shopOwner'; // Default newly registered users as shopOwner SaaS tenant
    
    const appUser: AppUser = {
      id: firebaseUser.uid,
      name: name,
      email: firebaseUser.email || email,
      role: role as any,
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${firebaseUser.uid}`
    };

    // Synchronize the authenticated user profile with Firestore and local backend DB
    await fetch('/api/auth/sync-firebase-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user: appUser })
    });

    // Note: We do NOT call setActiveUser(appUser) here so they aren't logged in automatically
    return { data: { user: appUser, firebaseUser }, error: null };
  } catch (err: any) {
    console.error('[registerWithEmail Error]', err);
    return { data: null, error: err };
  }
};

export const logoutUser = async () => {
  try {
    await signOut(auth);
    setActiveUser(null);
    return { error: null };
  } catch (err: any) {
    console.error('[logoutUser Error]', err);
    return { error: err };
  }
};

export const resetPassword = async (email: string) => {
  try {
    await sendPasswordResetEmail(auth, email);
    return { error: null };
  } catch (err: any) {
    console.error('[resetPassword Error]', err);
    return { error: err };
  }
};

// Replaces Firebase onAuthStateChanged and integrates directly with React callbacks
export const onAuthStateChanged = (arg1: any, arg2?: any) => {
  const callback = typeof arg1 === 'function' ? arg1 : arg2;
  if (!callback) return () => {};
  
  // Deliver the existing local session immediately if it exists
  const saved = localStorage.getItem('mock_user_session');
  if (saved) {
    try {
      const appUser = JSON.parse(saved);
      callback(appUser);
    } catch (e) {
      console.error('Error parsing mock_user_session:', e);
    }
  } else {
    callback(null);
  }
  
  return firebaseOnAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      const isGoogle = firebaseUser.providerData.some(p => p.providerId === 'google.com');
      
      if (!firebaseUser.emailVerified && !isGoogle) {
        localStorage.removeItem('mock_user_session');
        callback(null);
        return;
      }

      const savedSession = localStorage.getItem('mock_user_session');
      let appUser = savedSession ? JSON.parse(savedSession) : null;
      
      if (!appUser || appUser.id !== firebaseUser.uid) {
        const role = localStorage.getItem('userRole') || (firebaseUser.email?.toLowerCase().includes('admin') ? 'platformAdmin' : 'shopOwner');
        appUser = {
          id: firebaseUser.uid,
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Usuario',
          email: firebaseUser.email || '',
          role: role as any,
          avatarUrl: firebaseUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${firebaseUser.uid}`
        };
        setActiveUser(appUser);
      }
      callback(appUser);
    } else {
      // Only clear the session if the current saved user is NOT a backend Google-authenticated user (whose ID starts with 'google-')
      const currentSaved = localStorage.getItem('mock_user_session');
      if (currentSaved) {
        try {
          const parsed = JSON.parse(currentSaved);
          if (parsed && parsed.id && !parsed.id.startsWith('google-')) {
            setActiveUser(null);
            callback(null);
          } else if (parsed) {
            // Keep the google- session active!
            callback(parsed);
          }
        } catch (e) {
          setActiveUser(null);
          callback(null);
        }
      } else {
        callback(null);
      }
    }
  });
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
