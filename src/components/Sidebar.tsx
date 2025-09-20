"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  Clock,
  Home,
  Loader2,
  LogOut,
  Settings,
  User,
  X,
  type LucideIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

export interface MenuItem {
  icon: LucideIcon;
  label: string;
  active: boolean;
  href: string;
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentPage: string;
}

export default function Sidebar({ isOpen, onClose, currentPage }: SidebarProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isLargeScreen, setIsLargeScreen] = useState(false);
  const { logout } = useAuth();

  // Detectar se é tela grande
  React.useEffect(() => {
    const checkScreenSize = () => {
      setIsLargeScreen(window.innerWidth >= 1024);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        // Usar o logout do contexto
        logout();
      } else {
        console.error('Erro no logout');
        setIsLoggingOut(false);
      }
    } catch (error) {
      console.error('Erro no logout:', error);
      setIsLoggingOut(false);
    }
  };

  const menuItems: MenuItem[] = [
    { icon: Home, label: "Dashboard", active: currentPage === "dashboard", href: "/dashboard" },
    { icon: BarChart3, label: "Relatórios", active: currentPage === "reports", href: "/reports" },
    { icon: Settings, label: "Configurações", active: currentPage === "settings", href: "/settings" },
    { icon: Clock, label: "Horas", active: currentPage === "hours", href: "/hours" },
    { icon: User, label: "Meus Dados", active: currentPage === "profile", href: "/profile" }
  ];

  return (
    <>
      {/* Sidebar */}
      <motion.div
        initial={false}
        animate={{ 
          x: isLargeScreen ? 0 : (isOpen ? 0 : -280),
        }}
        className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg lg:relative"
      >
        <div className="flex items-center justify-between h-16 px-6 border-b">
          <h1 className="text-xl font-bold text-gray-900">WorkLog</h1>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="lg:hidden"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        <nav className="mt-6 px-3">
          {menuItems.map((item, index) => (
            <motion.a
              key={item.label}
              href={item.href}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`w-full flex items-center px-3 py-2 mt-2 text-sm font-medium rounded-lg transition-colors ${
                item.active
                  ? "bg-indigo-50 text-indigo-700 border-r-2 border-indigo-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <item.icon className="w-5 h-5 mr-3" />
              {item.label}
            </motion.a>
          ))}
        </nav>

        <div className="absolute bottom-0 w-full p-4 border-t">
          <Button
            variant="ghost"
            className="w-full justify-start text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleLogout}
            disabled={isLoggingOut}
          >
            {isLoggingOut ? (
              <Loader2 className="w-4 h-4 mr-3 animate-spin" />
            ) : (
              <LogOut className="w-4 h-4 mr-3" />
            )}
            {isLoggingOut ? 'Saindo...' : 'Sair'}
          </Button>
        </div>
      </motion.div>

      {/* Overlay para mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={onClose}
        />
      )}
    </>
  );
}