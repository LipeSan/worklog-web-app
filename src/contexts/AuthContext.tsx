'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (token: string, userData: User) => void;
  logout: () => Promise<void>;
  checkAuth: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const isAuthenticated = !!user;

  // Função para verificar se o usuário está autenticado
  const checkAuth = async (): Promise<boolean> => {
    try {
      // Verificar via cookie (que é automaticamente enviado)
      const response = await fetch('/api/auth/me', {
        credentials: 'include', // Incluir cookies na requisição
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData.user);
        setIsLoading(false);
        return true;
      } else {
        // Token inválido ou não existe
        setUser(null);
        setIsLoading(false);
        return false;
      }
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error);
      setUser(null);
      setIsLoading(false);
      return false;
    }
  };

  // Função para fazer login
  const login = (token: string, userData: User) => {
    // O token já está sendo definido como cookie pela API
    // Apenas definir o usuário no estado
    setUser(userData);
  };

  // Função para fazer logout
  const logout = async () => {
    try {
      // Fazer requisição para limpar o cookie no servidor
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    } finally {
      setUser(null);
      router.push('/login');
    }
  };

  // Verificar autenticação ao carregar o componente
  useEffect(() => {
    const initAuth = async () => {
      await checkAuth();
    };
    initAuth();
  }, []);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
    checkAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook personalizado para usar o contexto de autenticação
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}