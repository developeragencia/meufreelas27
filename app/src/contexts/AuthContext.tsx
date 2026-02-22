import { createContext, useContext, useState, type ReactNode } from 'react';
import { apiAuth, hasApi } from '../lib/api';

export type UserType = 'freelancer' | 'client' | 'admin' | null;

export interface User {
  id: string;
  email: string;
  name: string;
  type: UserType;
  avatar?: string;
  phone?: string;
  location?: string;
  bio?: string;
  skills?: string[];
  hourlyRate?: string;
  rating?: number;
  completedProjects?: number;
  hasFreelancerAccount?: boolean;
  hasClientAccount?: boolean;
  isVerified?: boolean;
  isPremium?: boolean;
}

export type LoginResult = { success: boolean; error?: string; code?: string };
export type RegisterResult = { success: boolean; requiresActivation?: boolean; message?: string };

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<LoginResult>;
  register: (name: string, email: string, password: string, type: Exclude<UserType, 'admin' | null>) => Promise<RegisterResult>;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
  switchAccountType: () => Promise<boolean>;
  createSecondaryAccount: (type: 'freelancer' | 'client') => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function isUserType(value: unknown): value is Exclude<UserType, null> {
  if (typeof value !== 'string') return false;
  const t = value.toLowerCase();
  return t === 'freelancer' || t === 'client' || t === 'admin';
}

function normalizeUser(raw: Record<string, unknown>): User | null {
  const id = raw.id;
  const email = raw.email;
  const name = raw.name;
  let type = raw.type;
  if (typeof type === 'string') type = type.toLowerCase() as UserType;

  if (typeof id !== 'string' || typeof email !== 'string' || typeof name !== 'string' || !isUserType(type)) {
    return null;
  }

  return {
    id,
    email,
    name,
    type: type as Exclude<UserType, null>,
    avatar: typeof raw.avatar === 'string' ? raw.avatar : undefined,
    phone: typeof raw.phone === 'string' ? raw.phone : undefined,
    location: typeof raw.location === 'string' ? raw.location : undefined,
    bio: typeof raw.bio === 'string' ? raw.bio : undefined,
    skills: Array.isArray(raw.skills) && raw.skills.every((skill) => typeof skill === 'string') ? raw.skills : undefined,
    hourlyRate: typeof raw.hourlyRate === 'string' ? raw.hourlyRate : undefined,
    rating: typeof raw.rating === 'number' ? raw.rating : undefined,
    completedProjects: typeof raw.completedProjects === 'number' ? raw.completedProjects : undefined,
    hasFreelancerAccount: typeof raw.hasFreelancerAccount === 'boolean' ? raw.hasFreelancerAccount : undefined,
    hasClientAccount: typeof raw.hasClientAccount === 'boolean' ? raw.hasClientAccount : undefined,
    isVerified: typeof raw.isVerified === 'boolean' ? raw.isVerified : undefined,
    isPremium: typeof raw.isPremium === 'boolean' ? raw.isPremium : undefined,
  };
}

function upsertStoredUser(user: User): void {
  try {
    const users = JSON.parse(localStorage.getItem('meufreelas_users') || '[]');
    const safeUsers = Array.isArray(users) ? users : [];
    const idx = safeUsers.findIndex((u: any) => u?.id === user.id);
    if (idx >= 0) {
      safeUsers[idx] = { ...safeUsers[idx], ...user };
    } else {
      safeUsers.push(user);
    }
    localStorage.setItem('meufreelas_users', JSON.stringify(safeUsers));
  } catch {
    localStorage.setItem('meufreelas_users', JSON.stringify([user]));
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('meufreelas_user');
    if (!savedUser) return null;
    try {
      const parsed = JSON.parse(savedUser) as Record<string, unknown>;
      return normalizeUser(parsed);
    } catch {
      localStorage.removeItem('meufreelas_user');
      return null;
    }
  });

  const login = async (email: string, password: string): Promise<LoginResult> => {
    try {
      if (hasApi()) {
        const res = await apiAuth('login', { email, password });
        if (res.ok && res.user) {
          const normalizedUser = normalizeUser(res.user);
          if (!normalizedUser) return { success: false, error: 'Resposta inválida' };
          setUser(normalizedUser);
          upsertStoredUser(normalizedUser);
          localStorage.setItem('meufreelas_user', JSON.stringify(normalizedUser));
          return { success: true };
        }
        return { success: false, error: res.error || 'E-mail ou senha incorretos.', code: res.code };
      }
      const users = JSON.parse(localStorage.getItem('meufreelas_users') || '[]');
      const foundUser = users.find((u: any) => u.email === email && u.password === password);
      if (foundUser) {
        const { password: _, ...userWithoutPassword } = foundUser;
        setUser(userWithoutPassword);
        localStorage.setItem('meufreelas_user', JSON.stringify(userWithoutPassword));
        return { success: true };
      }
      return { success: false, error: 'E-mail ou senha incorretos.' };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Erro ao fazer login.' };
    }
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    type: Exclude<UserType, 'admin' | null>
  ): Promise<RegisterResult> => {
    try {
      if (hasApi()) {
        const res = await apiAuth('register', { name, email, password, type });
        if (res.ok && res.requiresActivation) {
          return { success: true, requiresActivation: true, message: res.message };
        }
        if (res.ok && res.user) {
          const normalizedUser = normalizeUser(res.user);
          if (!normalizedUser) return { success: false };
          setUser(normalizedUser);
          upsertStoredUser(normalizedUser);
          localStorage.setItem('meufreelas_user', JSON.stringify(normalizedUser));
          return { success: true };
        }
        return { success: false, message: res.error };
      }
      const users = JSON.parse(localStorage.getItem('meufreelas_users') || '[]');
      const existingUser = users.find((u: any) => u.email === email);
      if (existingUser) {
        if (existingUser.type !== type) {
          const updatedUser = {
            ...existingUser,
            hasFreelancerAccount: existingUser.type === 'freelancer' || type === 'freelancer',
            hasClientAccount: existingUser.type === 'client' || type === 'client',
          };
          const userIndex = users.findIndex((u: any) => u.id === existingUser.id);
          users[userIndex] = updatedUser;
          localStorage.setItem('meufreelas_users', JSON.stringify(users));
          const { password: _, ...userWithoutPassword } = updatedUser;
          setUser(userWithoutPassword);
          localStorage.setItem('meufreelas_user', JSON.stringify(userWithoutPassword));
          return { success: true };
        }
        return { success: false };
      }
      const newUser: User = {
        id: Date.now().toString(),
        name,
        email,
        type,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=003366&color=fff`,
        rating: 0,
        completedProjects: 0,
        hasFreelancerAccount: type === 'freelancer',
        hasClientAccount: type === 'client',
      };
      users.push({ ...newUser, password });
      localStorage.setItem('meufreelas_users', JSON.stringify(users));
      setUser(newUser);
      localStorage.setItem('meufreelas_user', JSON.stringify(newUser));
      return { success: true };
    } catch (error) {
      console.error('Register error:', error);
      return { success: false };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('meufreelas_user');
  };

  const updateUser = (data: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...data };
      setUser(updatedUser);
      localStorage.setItem('meufreelas_user', JSON.stringify(updatedUser));
      
      // Update in users list
      const users = JSON.parse(localStorage.getItem('meufreelas_users') || '[]');
      const userIndex = users.findIndex((u: any) => u.id === user.id);
      if (userIndex !== -1) {
        users[userIndex] = { ...users[userIndex], ...data };
        localStorage.setItem('meufreelas_users', JSON.stringify(users));
      }
    }
  };

  const switchAccountType = async (): Promise<boolean> => {
    if (!user) return false;
    
    const newType: UserType = user.type === 'freelancer' ? 'client' : 'freelancer';
    
    // Check if user has the other account type
    if (newType === 'freelancer' && !user.hasFreelancerAccount) return false;
    if (newType === 'client' && !user.hasClientAccount) return false;
    
    const updatedUser = { ...user, type: newType };
    setUser(updatedUser);
    localStorage.setItem('meufreelas_user', JSON.stringify(updatedUser));
    
    // Update in users list
    const users = JSON.parse(localStorage.getItem('meufreelas_users') || '[]');
    const userIndex = users.findIndex((u: any) => u.id === user.id);
    if (userIndex !== -1) {
      users[userIndex] = { ...users[userIndex], type: newType };
      localStorage.setItem('meufreelas_users', JSON.stringify(users));
    }
    
    return true;
  };

  const createSecondaryAccount = async (type: 'freelancer' | 'client'): Promise<boolean> => {
    if (!user) return false;
    
    // Check if already has this account type
    if (type === 'freelancer' && user.hasFreelancerAccount) return false;
    if (type === 'client' && user.hasClientAccount) return false;
    
    const updatedUser = {
      ...user,
      hasFreelancerAccount: type === 'freelancer' || user.hasFreelancerAccount,
      hasClientAccount: type === 'client' || user.hasClientAccount,
    };
    
    setUser(updatedUser);
    localStorage.setItem('meufreelas_user', JSON.stringify(updatedUser));
    
    // Update in users list
    const users = JSON.parse(localStorage.getItem('meufreelas_users') || '[]');
    const userIndex = users.findIndex((u: any) => u.id === user.id);
    if (userIndex !== -1) {
      users[userIndex] = { 
        ...users[userIndex], 
        hasFreelancerAccount: updatedUser.hasFreelancerAccount,
        hasClientAccount: updatedUser.hasClientAccount,
      };
      localStorage.setItem('meufreelas_users', JSON.stringify(users));
    }
    
    return true;
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      login,
      register,
      logout,
      updateUser,
      switchAccountType,
      createSecondaryAccount
    }}>
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
