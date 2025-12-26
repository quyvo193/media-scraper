import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '@/lib/api';

interface AuthState {
  isAuthenticated: boolean;
  username: string | null;
  password: string | null;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    username: null,
    password: null,
    isLoading: true, // Start with loading state
  });

  // Load auth state from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('auth');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setAuthState({
          isAuthenticated: true,
          username: parsed.username,
          password: parsed.password,
          isLoading: false,
        });
        // Set credentials in API client
        api.setCredentials(parsed.username, parsed.password);
      } catch (error) {
        console.error('Failed to parse stored auth:', error);
        localStorage.removeItem('auth');
        setAuthState({
          isAuthenticated: false,
          username: null,
          password: null,
          isLoading: false,
        });
      }
    } else {
      // No stored auth, set loading to false
      setAuthState({
        isAuthenticated: false,
        username: null,
        password: null,
        isLoading: false,
      });
    }
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      // Login via dedicated auth endpoint
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';

      const response = await fetch(`${apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Credentials are valid
        const authData = { username, password };
        localStorage.setItem('auth', JSON.stringify(authData));
        setAuthState({
          isAuthenticated: true,
          username,
          password,
          isLoading: false,
        });
        // Set credentials in API client
        api.setCredentials(username, password);
        return true;
      } else {
        console.error('Login failed:', data.error || 'Unknown error');
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('auth');
    setAuthState({
      isAuthenticated: false,
      username: null,
      password: null,
      isLoading: false,
    });
    // Clear credentials from API client
    api.clearCredentials();
  };

  return (
    <AuthContext.Provider value={{ ...authState, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

