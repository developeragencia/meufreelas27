import { createContext, useContext, useState, type ReactNode } from 'react';

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

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string, type: Exclude<UserType, 'admin' | null>) => Promise<boolean>;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
  switchAccountType: () => Promise<boolean>;
  createSecondaryAccount: (type: 'freelancer' | 'client') => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('meufreelas_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const users = JSON.parse(localStorage.getItem('meufreelas_users') || '[]');
      const foundUser = users.find((u: any) => u.email === email && u.password === password);
      
      if (foundUser) {
        const { password, ...userWithoutPassword } = foundUser;
        setUser(userWithoutPassword);
        localStorage.setItem('meufreelas_user', JSON.stringify(userWithoutPassword));
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const register = async (
    name: string, 
    email: string, 
    password: string, 
    type: Exclude<UserType, 'admin' | null>
  ): Promise<boolean> => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const users = JSON.parse(localStorage.getItem('meufreelas_users') || '[]');
      
      // Check if email exists with same type
      const existingUser = users.find((u: any) => u.email === email);
      if (existingUser) {
        // If user exists with different type, allow creating secondary account
        if (existingUser.type !== type) {
          // Update existing user to have both account types
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
          return true;
        }
        return false;
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
      
      const userWithPassword = { ...newUser, password };
      users.push(userWithPassword);
      localStorage.setItem('meufreelas_users', JSON.stringify(users));
      
      setUser(newUser);
      localStorage.setItem('meufreelas_user', JSON.stringify(newUser));
      
      return true;
    } catch (error) {
      console.error('Register error:', error);
      return false;
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
