"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  tenantId?: string | null;
  signupDate?: string;
  restaurantName?: string; // Keep for backward compatibility
}

interface AuthContextType {
  currentUser: User | null;
  isLoading: boolean;
  isInitialized: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (email: string, password: string, restaurantName?: string, phone?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_USER_KEY = 'ioms_current_user';
const LOCAL_STORAGE_SESSION_TOKEN_KEY = 'ioms_session_token';
const isLocalAuthMode = process.env.NEXT_PUBLIC_AUTH_MODE === 'local';

const createLocalSessionToken = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `LOCAL_${crypto.randomUUID()}`;
  }
  return `LOCAL_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const router = useRouter();

  // Function to save session token
  const saveSessionToken = (token: string | null) => {
    if (token) {
      localStorage.setItem(LOCAL_STORAGE_SESSION_TOKEN_KEY, token);
    } else {
      localStorage.removeItem(LOCAL_STORAGE_SESSION_TOKEN_KEY);
    }
  };

  // Function to get session token
  const getSessionToken = (): string | null => {
    try {
      return localStorage.getItem(LOCAL_STORAGE_SESSION_TOKEN_KEY);
    } catch (error) {
      console.error('[AuthProvider] Error getting session token:', error);
      return null;
    }
  };

  // Function to save user to localStorage
  const saveUserToStorage = (user: User | null) => {
    if (user) {
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
    }
  };

  // Function to load user from localStorage
  const loadUserFromStorage = (): User | null => {
    try {
      const storedUser = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
      
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        console.log('[AuthProvider] Loaded user from storage:', userData.email);
        return userData;
      }
      return null;
    } catch (error) {
      console.error('[AuthProvider] Error loading user from localStorage:', error);
      localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
      return null;
    }
  };

  // Function to refresh user data from API
  const refreshUser = async () => {
    if (isLocalAuthMode) {
      const storedUser = loadUserFromStorage();
      setCurrentUser(storedUser);
      return;
    }
    const sessionToken = getSessionToken();
    
    if (!sessionToken) {
      console.log('[AuthProvider] No session token, clearing user');
      setCurrentUser(null);
      saveUserToStorage(null);
      return;
    }

    try {
      const response = await fetch('/api/auth/me', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${sessionToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user) {
          console.log('[AuthProvider] User data refreshed from API');
          setCurrentUser(data.user);
          saveUserToStorage(data.user);
        } else {
          console.log('[AuthProvider] Invalid session, clearing user');
          setCurrentUser(null);
          saveUserToStorage(null);
          saveSessionToken(null);
        }
      } else {
        console.log('[AuthProvider] Session expired or invalid');
        setCurrentUser(null);
        saveUserToStorage(null);
        saveSessionToken(null);
      }
    } catch (error) {
      console.error('[AuthProvider] Error refreshing user:', error);
      // Keep local user data if API call fails
    }
  };

  // Initialize auth state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      setIsLoading(true);
      setIsInitialized(false);

      const sessionToken = getSessionToken();
      const storedUser = loadUserFromStorage();

      if (isLocalAuthMode) {
        setCurrentUser(storedUser);
      } else if (sessionToken && storedUser) {
        await refreshUser();
      } else if (storedUser) {
        saveUserToStorage(null);
        setCurrentUser(null);
      } else {
        setCurrentUser(null);
      }

      setIsInitialized(true);
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);

    if (isLocalAuthMode) {
      const localUser: User = {
        id: `local-${email.toLowerCase()}`,
        name: email.split('@')[0] || 'Local User',
        email: email.toLowerCase(),
        tenantId: null,
      };

      const token = createLocalSessionToken();
      saveSessionToken(token);
      setCurrentUser(localUser);
      saveUserToStorage(localUser);
      setIsLoading(false);
      return true;
    }
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.success && data.sessionToken) {
        // Save session token and user data
        saveSessionToken(data.sessionToken);
        setCurrentUser(data.user);
        saveUserToStorage(data.user);
        
        setIsLoading(false);
        return true;
      } else {
        setIsLoading(false);
        return false;
      }
    } catch (error) {
      console.error('[AuthProvider] Login error:', error);
      setIsLoading(false);
      return false;
    }
  };

  const signup = async (email: string, password: string, restaurantName?: string, phone?: string): Promise<boolean> => {
    console.log('[AuthProvider] Signup attempt for:', email);
    setIsLoading(true);

    if (isLocalAuthMode) {
      setIsLoading(false);
      return true;
    }
    
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          name: restaurantName || email.split('@')[0], // Use restaurant name or email prefix as name
          email, 
          password,
          phone 
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        console.log('[AuthProvider] Signup successful:', email);
        setIsLoading(false);
        return true;
      } else {
        console.log('[AuthProvider] Signup failed:', data.error || 'Unknown error');
        setIsLoading(false);
        return false;
      }
    } catch (error) {
      console.error('[AuthProvider] Signup error:', error);
      setIsLoading(false);
      return false;
    }
  };

  const logout = async () => {
    console.log('[AuthProvider] Logout called');
    
    const sessionToken = getSessionToken();

    if (isLocalAuthMode) {
      setCurrentUser(null);
      saveUserToStorage(null);
      saveSessionToken(null);
      router.push('/login');
      return;
    }
    
    if (sessionToken) {
      try {
        // Call logout API
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${sessionToken}`,
            'Content-Type': 'application/json',
          },
        });
      } catch (error) {
        console.error('[AuthProvider] Logout API error:', error);
        // Continue with local logout even if API fails
      }
    }
    
    // Clear local state
    setCurrentUser(null);
    saveUserToStorage(null);
    saveSessionToken(null);
    router.push('/login');
  };

  // Only show loading state if we haven't initialized yet
  const shouldShowLoading = isLoading && !isInitialized;

  return (
    <AuthContext.Provider value={{ 
      currentUser, 
      isLoading: shouldShowLoading, 
      isInitialized, 
      login, 
      signup, 
      logout,
      refreshUser 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 