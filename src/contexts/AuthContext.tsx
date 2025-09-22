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
      // Primeiro, tentar via cookie (que é automaticamente enviado)
      let response = await fetch('/api/auth/me', {
        credentials: 'include', // Incluir cookies na requisição
      });

      // Se falhar com cookie, tentar com localStorage (fallback para Safari)
      if (!response.ok) {
        console.error('Cookie auth failed with status:', response.status);
        const errorText = await response.text();
        console.error('Cookie auth error:', errorText);
        
        const token = localStorage.getItem('auth-token');
        if (token) {
          console.log('Trying localStorage fallback with token:', token.substring(0, 20) + '...');
          response = await fetch('/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
            credentials: 'include',
          });
          
          if (!response.ok) {
            const fallbackError = await response.text();
            console.error('localStorage fallback also failed:', fallbackError);
          } else {
            console.log('localStorage fallback successful');
          }
        } else {
          console.error('No token found in localStorage');
        }
      } else {
        console.log('Cookie auth successful');
      }

      if (response.ok) {
        const userData = await response.json();
        setUser(userData.user);
        setIsLoading(false);
        return true;
      } else {
        // Token inválido ou não existe
        setUser(null);
        setIsLoading(false);
        // Limpar localStorage se o token for inválido
        localStorage.removeItem('auth-token');
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
    // Também salvar no localStorage como fallback para Safari
    localStorage.setItem('auth-token', token);
    // Definir o usuário no estado
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
      // Limpar localStorage também
      localStorage.removeItem('auth-token');
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