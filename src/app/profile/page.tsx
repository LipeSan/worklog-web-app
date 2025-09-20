"use client";

import React, { useState, useEffect } from "react";
import { 
  Save, 
  Edit, 
  Mail,
  DollarSign,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import PhoneInput from "@/components/ui/phone-input";
import AppLayout from "@/components/AppLayout";
import { toast } from "sonner";

// Interface para os dados do usuário
interface UserData {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  rate: number;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  
  // Estados para os dados do usuário
  const [userData, setUserData] = useState<UserData | null>(null);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    rate: 25.00
  });

  // Função para buscar dados do usuário
  const fetchUserData = async () => {
    try {
      setIsLoading(true);
      setError("");

      const response = await fetch('/api/user/profile', {
        method: 'GET',
        credentials: 'include', // Para incluir cookies
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao carregar dados do usuário');
      }

      setUserData(data.user);
      setFormData({
        full_name: data.user.full_name,
        email: data.user.email,
        phone: data.user.phone,
        rate: data.user.rate
      });

    } catch (error) {
      console.error('Erro ao buscar dados do usuário:', error);
      setError(error instanceof Error ? error.message : 'Erro inesperado');
    } finally {
      setIsLoading(false);
    }
  };

  // Função para salvar dados do usuário
  const saveUserData = async () => {
    try {
      setIsSaving(true);

      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          full_name: formData.full_name,
          phone: formData.phone,
          rate: formData.rate.toString()
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao salvar dados');
      }

      // Atualizar dados locais
      setUserData(data.user);
      setFormData({
        full_name: data.user.full_name,
        email: data.user.email,
        phone: data.user.phone,
        rate: data.user.rate
      });

      setIsEditing(false);
      toast.success('Dados atualizados com sucesso!');

    } catch (error) {
      console.error('Erro ao salvar dados do usuário:', error);
      toast.error(error instanceof Error ? error.message : 'Erro inesperado ao salvar');
    } finally {
      setIsSaving(false);
    }
  };

  // Função para lidar com o clique do botão
  const handleButtonClick = () => {
    if (isEditing) {
      saveUserData();
    } else {
      setIsEditing(true);
    }
  };

  // Carregar dados do usuário na inicialização
  useEffect(() => {
    fetchUserData();
  }, []);

  // Se estiver carregando, mostrar loading
  if (isLoading) {
    return (
      <AppLayout 
        currentPage="profile"
        pageTitle="Meus Dados"
        pageSubtitle="Gerencie suas informações pessoais"
      >
        <div className="max-w-4xl mx-auto flex items-center justify-center min-h-[400px]">
          <div className="flex items-center space-x-2">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
            <span className="text-gray-600">Carregando dados do perfil...</span>
          </div>
        </div>
      </AppLayout>
    );
  }

  // Se houver erro, mostrar mensagem de erro
  if (error) {
    return (
      <AppLayout 
        currentPage="profile"
        pageTitle="Meus Dados"
        pageSubtitle="Gerencie suas informações pessoais"
      >
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <p className="font-medium">Erro ao carregar dados do perfil</p>
            <p className="text-sm mt-1">{error}</p>
            <Button 
              onClick={fetchUserData}
              variant="outline"
              className="mt-3"
            >
              Tentar novamente
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout 
      currentPage="profile"
      pageTitle="Meus Dados"
      pageSubtitle="Gerencie suas informações pessoais"
    >
      <div className="max-w-4xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Meu Perfil</h1>
              <p className="text-gray-600">Gerencie suas informações pessoais e profissionais</p>
            </div>
            <Button 
              onClick={handleButtonClick}
              variant={isEditing ? "default" : "outline"}
              className="flex items-center space-x-2"
              disabled={isSaving}
            >
              {isEditing ? (
                <>
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>{isSaving ? 'Salvando...' : 'Salvar'}</span>
                </>
              ) : (
                <>
                  <Edit className="w-4 h-4" />
                  <span>Editar</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle>Informações Pessoais</CardTitle>
            <CardDescription>
              Suas informações básicas de perfil
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome Completo
                </label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                  disabled={!isEditing}
                  className={`w-full px-3 py-2 border rounded-md ${
                    isEditing 
                      ? "border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" 
                      : "border-gray-200 bg-gray-50"
                  }`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    disabled={!isEditing}
                    className={`flex-1 px-3 py-2 border rounded-md ${
                      isEditing 
                        ? "border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" 
                        : "border-gray-200 bg-gray-50"
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Telefone
                </label>
                <PhoneInput
                  value={formData.phone}
                  onChange={(value) => setFormData(prev => ({ ...prev, phone: value }))}
                  disabled={!isEditing}
                  placeholder="Digite seu telefone"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Valor por Hora (AUD)
                </label>
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-4 h-4 text-gray-400" />
                  <input
                    type="number"
                    value={formData.rate}
                    onChange={(e) => setFormData(prev => ({ ...prev, rate: parseFloat(e.target.value) || 0 }))}
                    disabled={!isEditing}
                    min="0"
                    step="0.01"
                    className={`flex-1 px-3 py-2 border rounded-md ${
                      isEditing 
                        ? "border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" 
                        : "border-gray-200 bg-gray-50"
                    }`}
                  />
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Seu valor por hora de trabalho em dólares australianos
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}