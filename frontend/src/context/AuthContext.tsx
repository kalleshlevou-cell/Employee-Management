import React, { createContext, useState, useEffect, useContext } from 'react';
import { api } from '../services/api';

export interface User {
  _id: string;
  employeeId: string;
  name: string;
  email: string;
  role: 'Super Admin' | 'HR Manager' | 'Employee';
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  fetchProfile: () => Promise<void>;
  hasRole: (allowedRoles: ('Super Admin' | 'HR Manager' | 'Employee')[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch logged in user profile
  const fetchProfile = async () => {
    const token = localStorage.getItem('ems_token');
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const data = await api.get('/auth/me');
      setUser(data);
    } catch (err) {
      console.warn('Session restoration failed:', err);
      logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const data = await api.post('/auth/login', { email, password });
      localStorage.setItem('ems_token', data.token);
      setUser({
        _id: data._id,
        employeeId: data.employeeId,
        name: data.name,
        email: data.email,
        role: data.role,
      });
    } catch (err) {
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('ems_token');
    setUser(null);
  };

  const hasRole = (allowedRoles: ('Super Admin' | 'HR Manager' | 'Employee')[]) => {
    if (!user) return false;
    return allowedRoles.includes(user.role);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, fetchProfile, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
