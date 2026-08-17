import React, { createContext, useContext, useState, useEffect } from 'react';

export type UserRole = 'admin' | 'citizen' | 'supervisor' | 'worker';

export type User = { 
  id?: string;
  name: string; 
  role: UserRole;
  email?: string;
  profileImage?: string;
  department?: string;
  permissions?: string[];
} | null;

interface AuthContextType {
  user: User;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(() => {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('token');
  });

  useEffect(() => {
    // Sync state if localStorage changes in other tabs
    const handleStorageChange = () => {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      setToken(storedToken);
      setUser(storedUser ? JSON.parse(storedUser) : null);
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
