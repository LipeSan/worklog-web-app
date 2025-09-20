"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  CalendarDays,
  Clock,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Plus,
  Loader2,
  AlertCircle,
  Edit,
  Trash2,
  type LucideIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import AddHoursModal from "@/components/AddHoursModal";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";

interface StatCard {
  title: string;
  value: string;
  change: string;
  trend: "up" | "down";
  icon: LucideIcon;
  color: string;
  bgColor: string;
}

interface Activity {
  id: number;
  user: string;
  action: string;
  time: string;
  avatar: string;
}

interface Project {
  id: number;
  name: string;
  progress: number;
  status: "active" | "completed" | "pending";
  team: number;
}

interface PayrollPeriod {
  id: string;
  label: string;
  startDate: Date;
  endDate: Date;
}

interface HourEntry {
  id: number;
  date: string;
  project: string;
  startTime: string;
  endTime: string;
  hours: number;
  rate: string;
  total: string;
  description?: string;
}

interface ApiResponse {
  hours: HourEntry[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  summary: {
    totalHours: number;
    totalAmount: number;
  };
}

export default function DashboardPage() {
  const { isAuthenticated } = useAuth();
  const [selectedPayrollPeriod, setSelectedPayrollPeriod] = useState<string>("");
  const [isAddHoursModalOpen, setIsAddHoursModalOpen] = useState(false);
  const [hoursData, setHoursData] = useState<HourEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState({ totalHours: 0, totalAmount: 0 });
  const [previousSummary, setPreviousSummary] = useState({ totalHours: 0, totalAmount: 0 });
  const [editingEntry, setEditingEntry] = useState<HourEntry | null>(null);

  // Função para gerar períodos de payroll quinzenais (a cada duas semanas)
  const generatePayrollPeriods = (): PayrollPeriod[] => {
    const periods: PayrollPeriod[] = [];
    const today = new Date();
    
    // Encontrar uma data de referência (primeira segunda-feira de janeiro do ano atual)
    const currentYear = today.getFullYear();
    const referenceDate = new Date(currentYear, 0, 1); // 1º de janeiro
    
    // Ajustar para começar numa segunda-feira
    const dayOfWeek = referenceDate.getDay();
    const daysToMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
    referenceDate.setDate(referenceDate.getDate() + daysToMonday);
    
    // Calcular quantos períodos atrás da data de referência precisamos para cobrir o ano todo
    const startPeriod = -10; // 10 períodos antes
    const endPeriod = 36; // 36 períodos depois (cobrindo mais de um ano)
    
    for (let periodNumber = startPeriod; periodNumber <= endPeriod; periodNumber++) {
      const startDate = new Date(referenceDate);
      startDate.setDate(referenceDate.getDate() + (periodNumber * 14));
      
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 13); // 14 dias (2 semanas)
      
      const formatDate = (date: Date) => {
        return date.toLocaleDateString('pt-BR', { 
          day: '2-digit', 
          month: '2-digit',
          year: '2-digit'
        });
      };
      
      const absolutePeriodNumber = periodNumber + 11; // Ajustar para números positivos
      
      periods.push({
        id: `period-${absolutePeriodNumber}`,
        label: `Período ${absolutePeriodNumber} (${formatDate(startDate)} - ${formatDate(endDate)})`,
        startDate: new Date(startDate),
        endDate: new Date(endDate)
      });
    }
    
    // Filtrar apenas períodos relevantes (últimos 6 meses e próximos 6 meses)
    const sixMonthsAgo = new Date(today);
    sixMonthsAgo.setMonth(today.getMonth() - 6);
    
    const sixMonthsAhead = new Date(today);
    sixMonthsAhead.setMonth(today.getMonth() + 6);
    
    const relevantPeriods = periods.filter(period => {
      return period.endDate >= sixMonthsAgo && period.startDate <= sixMonthsAhead;
    });
    
    // Retornar os períodos em ordem reversa (mais recente primeiro)
    return relevantPeriods.reverse();
  };

  const payrollPeriods = generatePayrollPeriods();

  // Função para encontrar o período atual
  const findCurrentPeriod = (periods: PayrollPeriod[]): string => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Zerar horas para comparação precisa
    
    for (const period of periods) {
      const startDate = new Date(period.startDate);
      const endDate = new Date(period.endDate);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      
      if (today >= startDate && today <= endDate) {
        return period.id;
      }
    }
    
    // Se não encontrar o período atual, retorna o mais recente
    return periods[0]?.id || '';
  };

  // Definir período atual como padrão
  useEffect(() => {
    if (payrollPeriods.length > 0 && !selectedPayrollPeriod) {
      const currentPeriodId = findCurrentPeriod(payrollPeriods);
      setSelectedPayrollPeriod(currentPeriodId);
    }
  }, [payrollPeriods, selectedPayrollPeriod]);

  // Função para buscar dados da API
  const fetchHoursData = async (payrollPeriod: string) => {
    try {
      setLoading(true);
      setError(null);

      const selectedPeriod = payrollPeriods.find(p => p.id === payrollPeriod);
      if (!selectedPeriod) return;

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token de autenticação não encontrado');
      }

      const params = new URLSearchParams({
        startDate: selectedPeriod.startDate.toISOString().split('T')[0],
        endDate: selectedPeriod.endDate.toISOString().split('T')[0],
        limit: '100'
      });

      const response = await fetch(`/api/hours?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Erro ao buscar dados: ${response.status}`);
      }

      const data: ApiResponse = await response.json();
      setHoursData(data.hours);
      setSummary(data.summary);

      // Buscar dados do período anterior para comparação
      await fetchPreviousPeriodData(payrollPeriod);
    } catch (err) {
      console.error('Erro ao buscar dados:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  // Função para buscar dados do período anterior
  const fetchPreviousPeriodData = async (currentPeriodId: string) => {
    try {
      const currentIndex = payrollPeriods.findIndex(p => p.id === currentPeriodId);
      const previousPeriod = payrollPeriods[currentIndex + 1]; // Próximo na lista (anterior no tempo)
      
      if (!previousPeriod) {
        setPreviousSummary({ totalHours: 0, totalAmount: 0 });
        return;
      }

      const token = localStorage.getItem('token');
      if (!token) return;

      const params = new URLSearchParams({
        startDate: previousPeriod.startDate.toISOString().split('T')[0],
        endDate: previousPeriod.endDate.toISOString().split('T')[0],
        limit: '1' // Só precisamos do summary
      });

      const response = await fetch(`/api/hours?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data: ApiResponse = await response.json();
        setPreviousSummary(data.summary);
      } else {
        setPreviousSummary({ totalHours: 0, totalAmount: 0 });
      }
    } catch (err) {
      console.error('Erro ao buscar dados do período anterior:', err);
      setPreviousSummary({ totalHours: 0, totalAmount: 0 });
    }
  };

  // Função para calcular porcentagem de mudança
  const calculatePercentageChange = (current: number, previous: number): { percentage: number; trend: "up" | "down" } => {
    if (previous === 0) {
      return { percentage: current > 0 ? 100 : 0, trend: current > 0 ? "up" : "down" };
    }
    
    const change = ((current - previous) / previous) * 100;
    return {
      percentage: Math.round(change), // Mantém o valor real (positivo ou negativo)
      trend: change >= 0 ? "up" : "down"
    };
  };

  // Função para formatar texto de mudança
  const formatChangeText = (percentage: number, trend: "up" | "down", hasPreviousData: boolean = true): string => {
    if (!hasPreviousData) {
      return "Sem dados do período anterior";
    }
    // Se a porcentagem já é negativa, não adiciona sinal extra
    // Se é positiva, adiciona o sinal +
    const sign = percentage >= 0 ? "+" : "";
    return `${sign}${percentage}% vs período anterior`;
  };

  // Buscar dados quando o período de payroll mudar
  useEffect(() => {
    if (selectedPayrollPeriod) {
      fetchHoursData(selectedPayrollPeriod);
    }
  }, [selectedPayrollPeriod]);

  // Handler para adicionar/editar horas
  const handleAddHours = async (hoursData: { date: string; project: string; startTime: string; endTime: string; hours: number; description?: string }) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token de autenticação não encontrado');
      }

      const isEditing = editingEntry !== null;
      const url = isEditing ? `/api/hours/${editingEntry!.id}` : '/api/hours';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(hoursData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Erro ao ${isEditing ? 'editar' : 'adicionar'} horas`);
      }

      // Sucesso - mostrar toast
      console.log(`Horas ${isEditing ? 'editadas' : 'adicionadas'} com sucesso!`);

      // Recarregar dados após adicionar/editar
      if (selectedPayrollPeriod) {
        await fetchHoursData(selectedPayrollPeriod);
      }
      
      setIsAddHoursModalOpen(false);
      setEditingEntry(null);
    } catch (error) {
      console.error(`Erro ao ${editingEntry ? 'editar' : 'adicionar'} horas:`, error);
      throw error; // Re-throw para que o modal possa lidar com o erro
    }
  };

  // Handler para editar entrada
  const handleEditEntry = (entry: HourEntry) => {
    setEditingEntry(entry);
    setIsAddHoursModalOpen(true);
  };

  // Handler para deletar entrada
  const handleDeleteEntry = async (id: number) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token de autenticação não encontrado');
      }

      const response = await fetch(`/api/hours/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao deletar registro');
      }

      console.log('Registro deletado com sucesso!');

      // Recarregar dados após deletar
      if (selectedPayrollPeriod) {
        await fetchHoursData(selectedPayrollPeriod);
      }
    } catch (error) {
      console.error('Erro ao deletar registro:', error);
      throw error;
    }
  };

  // Calcular estatísticas baseadas nos dados reais
  const hasPreviousData = previousSummary.totalHours > 0 || previousSummary.totalAmount > 0;
  const hoursChange = calculatePercentageChange(summary.totalHours, previousSummary.totalHours);
  const amountChange = calculatePercentageChange(summary.totalAmount, previousSummary.totalAmount);

  const stats: StatCard[] = [
    {
      title: "Total de Horas",
      value: `${summary.totalHours}h`,
      change: formatChangeText(hoursChange.percentage, hoursChange.trend, hasPreviousData),
      trend: hoursChange.trend,
      icon: Clock,
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      title: "Valor Total",
      value: `$ ${summary.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      change: formatChangeText(amountChange.percentage, amountChange.trend, hasPreviousData),
      trend: amountChange.trend,
      icon: DollarSign,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50"
    }
  ];

  const recentActivities = [
    {
      id: 1,
      type: "task_completed",
      title: "Tarefa 'Implementar autenticação' concluída",
      time: "2 horas atrás",
      project: "App Mobile",
      status: "completed"
    },
    {
      id: 2,
      type: "project_created",
      title: "Novo projeto 'Website E-commerce' criado",
      time: "4 horas atrás",
      project: "Website E-commerce",
      status: "new"
    },
    {
      id: 3,
      type: "deadline_approaching",
      title: "Prazo do projeto se aproximando",
      time: "6 horas atrás",
      project: "Dashboard Analytics",
      status: "warning"
    },
    {
      id: 4,
      type: "team_update",
      title: "3 novos membros adicionados à equipe",
      time: "1 dia atrás",
      project: "Geral",
      status: "info"
    }
  ];

  // Componente do seletor de período de payroll
  const PayrollSelector = () => (
    <div className="bg-white rounded-lg border shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-900">Período de Payroll</h3>
        <CalendarDays className="w-4 h-4 text-gray-500" />
      </div>
      <Select
        value={selectedPayrollPeriod}
        onValueChange={setSelectedPayrollPeriod}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Selecione o período de payroll" />
        </SelectTrigger>
        <SelectContent>
          {payrollPeriods.map((period) => (
            <SelectItem key={period.id} value={period.id}>
              {period.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <AppLayout
      currentPage="dashboard"
      pageTitle="Dashboard"
      pageSubtitle="Bem-vindo de volta!"
    >
      {/* Seletor de Período de Payroll */}
      <div className="mb-6">
        <PayrollSelector />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    <div className="flex items-center mt-1">
                      {stat.trend === 'down' ? (
                        <TrendingDown className="w-3 h-3 mr-1 text-red-500" />
                      ) : (
                        <TrendingUp className="w-3 h-3 mr-1 text-green-500" />
                      )}
                      <span className={`text-xs ${stat.trend === 'down' ? 'text-red-600' : 'text-green-600'}`}>{stat.change}</span>
                    </div>
                  </div>
                  <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Lista de Horas */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                Registro de Horas
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsAddHoursModalOpen(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Horas
              </Button>
            </CardTitle>
            <CardDescription>
              Histórico das suas horas trabalhadas no período selecionado
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                <span className="text-gray-600">Carregando dados...</span>
              </div>
            ) : hoursData.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Nenhum registro de horas encontrado para este período.</p>
                <p className="text-sm mt-2">Clique em &quot;Adicionar Horas&quot; para começar.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Data</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Cliente</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-600">Horas</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-600">Taxa</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-600">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hoursData.map((entry, index) => (
                      <motion.tr
                        key={entry.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 + index * 0.1 }}
                        className="border-b hover:bg-blue-50 transition-colors cursor-pointer"
                        onClick={() => handleEditEntry(entry)}
                      >
                        <td className="py-3 px-4 text-sm text-gray-900">
                          {new Date(entry.date).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="secondary" className="text-xs">
                            {entry.project}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-center text-sm font-medium">
                          {entry.hours}h
                        </td>
                        <td className="py-3 px-4 text-center text-sm text-gray-600">
                          {entry.rate}
                        </td>
                        <td className="py-3 px-4 text-right text-sm font-medium text-green-600">
                          {entry.total}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Modal para adicionar horas */}
      <AddHoursModal
        isOpen={isAddHoursModalOpen}
        onClose={() => {
          setIsAddHoursModalOpen(false);
          setEditingEntry(null);
        }}
        onSubmit={handleAddHours}
        onDelete={(id) => {
          handleDeleteEntry(id);
          setIsAddHoursModalOpen(false);
          setEditingEntry(null);
        }}
        editingEntry={editingEntry}
      />


    </AppLayout>
  );
}