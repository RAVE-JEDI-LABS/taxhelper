'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import { auth } from './firebase';

// Demo user for testing without Firebase
const DEMO_USER = {
  uid: 'demo-user',
  email: 'demo@gordonulencpa.com',
  displayName: 'Demo User',
} as User;

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  demoSignIn: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    // Check for demo session
    const demoSession = localStorage.getItem('demo-session');
    if (demoSession === 'true') {
      setUser(DEMO_USER);
      setIsDemo(true);
      setLoading(false);
      return;
    }

    // Only subscribe to auth changes if auth is available (client-side only)
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    if (!auth) throw new Error('Auth not available');
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUp = async (email: string, password: string) => {
    if (!auth) throw new Error('Auth not available');
    await createUserWithEmailAndPassword(auth, email, password);
  };

  const signOut = async () => {
    if (isDemo) {
      localStorage.removeItem('demo-session');
      setUser(null);
      setIsDemo(false);
    } else {
      if (!auth) throw new Error('Auth not available');
      await firebaseSignOut(auth);
    }
  };

  const demoSignIn = () => {
    localStorage.setItem('demo-session', 'true');
    setUser(DEMO_USER);
    setIsDemo(true);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, demoSignIn }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
