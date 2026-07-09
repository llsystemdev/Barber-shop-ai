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
import { onAuthStateChanged as firebaseOnAuthStateChanged } from 'firebase/auth';

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
  try {
    const userCredential = await signInWithPopup(auth, googleProvider);
    const firebaseUser = userCredential.user;
    
    const role = localStorage.getItem('userRole') || 'shopOwner';
    
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
    console.error('[loginWithGoogle Error]', err);
    return { data: null, error: err };
  }
};

export const registerWithEmail = async (email: string, password: string, name: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;
    
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

    setActiveUser(appUser);
    return { data: { user: appUser }, error: null };
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
  
  return firebaseOnAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      const saved = localStorage.getItem('mock_user_session');
      let appUser = saved ? JSON.parse(saved) : null;
      
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
      setActiveUser(null);
      callback(null);
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
