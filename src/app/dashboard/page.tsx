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
import { StatCard, Activity, Project, PayrollPeriod, HourEntry, ApiResponse } from "@/types";

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

  // Function to generate fortnightly payroll periods (every two weeks)
  const generatePayrollPeriods = (): PayrollPeriod[] => {
    const periods: PayrollPeriod[] = [];
    const today = new Date();
    
    // Find a reference date (first Monday of January of the current year)
    const currentYear = today.getFullYear();
    const referenceDate = new Date(currentYear, 0, 1); // January 1st
    
    // Adjust to start on a Monday
    const dayOfWeek = referenceDate.getDay();
    const daysToMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
    referenceDate.setDate(referenceDate.getDate() + daysToMonday);
    
    // Calculate how many periods before the reference date we need to cover the whole year
    const startPeriod = -10; // 10 periods before
    const endPeriod = 36; // 36 periods after (covering more than a year)
    
    for (let periodNumber = startPeriod; periodNumber <= endPeriod; periodNumber++) {
      const startDate = new Date(referenceDate);
      startDate.setDate(referenceDate.getDate() + (periodNumber * 14));
      
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 13); // 14 days (2 weeks)
      
      const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-AU', { 
          day: '2-digit', 
          month: '2-digit',
          year: '2-digit'
        });
      };
      
      const absolutePeriodNumber = periodNumber + 11; // Adjust to positive numbers
      
      periods.push({
        id: `period-${absolutePeriodNumber}`,
        label: `Period ${absolutePeriodNumber} (${formatDate(startDate)} - ${formatDate(endDate)})`,
        startDate: new Date(startDate),
        endDate: new Date(endDate)
      });
    }
    
    // Filter only relevant periods (last 6 months and next 6 months)
    const sixMonthsAgo = new Date(today);
    sixMonthsAgo.setMonth(today.getMonth() - 6);
    
    const sixMonthsAhead = new Date(today);
    sixMonthsAhead.setMonth(today.getMonth() + 6);
    
    const relevantPeriods = periods.filter(period => {
      return period.endDate >= sixMonthsAgo && period.startDate <= sixMonthsAhead;
    });
    
    // Return periods in reverse order (most recent first)
    return relevantPeriods.reverse();
  };

  const payrollPeriods = generatePayrollPeriods();

  // Function to find the current period
  const findCurrentPeriod = (periods: PayrollPeriod[]): string => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset hours for precise comparison
    
    for (const period of periods) {
      const startDate = new Date(period.startDate);
      const endDate = new Date(period.endDate);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      
      if (today >= startDate && today <= endDate) {
        return period.id;
      }
    }
    
    // If current period not found, return the most recent one
    return periods[0]?.id || '';
  };

  // Set current period as default
  useEffect(() => {
    if (payrollPeriods.length > 0 && !selectedPayrollPeriod) {
      const currentPeriodId = findCurrentPeriod(payrollPeriods);
      setSelectedPayrollPeriod(currentPeriodId);
    }
  }, [payrollPeriods, selectedPayrollPeriod]);

  // Function to fetch data from API
  const fetchHoursData = async (payrollPeriod: string) => {
    try {
      setLoading(true);
      setError(null);

      const selectedPeriod = payrollPeriods.find(p => p.id === payrollPeriod);
      if (!selectedPeriod) return;

      const token = localStorage.getItem('auth-token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const startDate = new Date(selectedPeriod.startDate);
      startDate.setDate(startDate.getDate() + 1);
      const endDate = new Date(selectedPeriod.endDate);
      endDate.setDate(endDate.getDate() + 1);

      const params = new URLSearchParams({
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
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
        throw new Error(`Error fetching data: ${response.status}`);
      }

      const data: ApiResponse = await response.json();
      setHoursData(data.hours);
      setSummary(data.summary);

      // Fetch previous period data for comparison
      await fetchPreviousPeriodData(payrollPeriod);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch previous period data
  const fetchPreviousPeriodData = async (currentPeriodId: string) => {
    try {
      const currentIndex = payrollPeriods.findIndex(p => p.id === currentPeriodId);
      const previousPeriod = payrollPeriods[currentIndex + 1]; // Next in list (previous in time)
      
      if (!previousPeriod) {
        setPreviousSummary({ totalHours: 0, totalAmount: 0 });
        return;
      }

      const token = localStorage.getItem('auth-token');
      if (!token) return;

      const params = new URLSearchParams({
        startDate: previousPeriod.startDate.toISOString().split('T')[0],
        endDate: previousPeriod.endDate.toISOString().split('T')[0],
        limit: '1' // We only need the summary
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
      console.error('Error fetching previous period data:', err);
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
      return "No previous period data";
    }
    // Se a porcentagem já é negativa, não adiciona sinal extra
    // Se é positiva, adiciona o sinal +
    const sign = percentage >= 0 ? "+" : "";
    return `${sign}${percentage}% vs previous period`;
  };

  // Fetch data when payroll period changes
  useEffect(() => {
    if (selectedPayrollPeriod) {
      fetchHoursData(selectedPayrollPeriod);
    }
  }, [selectedPayrollPeriod]);

  // Handler para adicionar/editar horas
  const handleAddHours = async (hoursData: { date: string; project: string; startTime: string; endTime: string; hours: number; description?: string }) => {
    try {
      const token = localStorage.getItem('auth-token');
      if (!token) {
        throw new Error('Authentication token not found');
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
        throw new Error(errorData.error || `Error ${isEditing ? 'editing' : 'adding'} hours`);
      }

      // Success - show toast
      console.log(`Hours ${isEditing ? 'updated' : 'added'} successfully!`);

      // Reload data after adding/editing
      if (selectedPayrollPeriod) {
        await fetchHoursData(selectedPayrollPeriod);
      }
      
      setIsAddHoursModalOpen(false);
      setEditingEntry(null);
    } catch (error) {
      console.error(`Error ${editingEntry ? 'editing' : 'adding'} hours:`, error);
      throw error; // Re-throw so the modal can handle the error
    }
  };

  // Handler to edit entry
  const handleEditEntry = (entry: HourEntry) => {
    setEditingEntry(entry);
    setIsAddHoursModalOpen(true);
  };

  // Handler to delete entry
  const handleDeleteEntry = async (id: number) => {
    try {
      const token = localStorage.getItem('auth-token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await fetch(`/api/hours/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error deleting record');
      }

      console.log('Record deleted successfully!');

      // Reload data after deleting
      if (selectedPayrollPeriod) {
        await fetchHoursData(selectedPayrollPeriod);
      }
    } catch (error) {
      console.error('Error deleting record:', error);
      throw error;
    }
  };

  // Calculate statistics based on real data
  const hasPreviousData = previousSummary.totalHours > 0 || previousSummary.totalAmount > 0;
  const hoursChange = calculatePercentageChange(summary.totalHours, previousSummary.totalHours);
  const amountChange = calculatePercentageChange(summary.totalAmount, previousSummary.totalAmount);

  const stats: StatCard[] = [
    {
      title: "Total Hours",
      value: `${summary.totalHours}h`,
      change: formatChangeText(hoursChange.percentage, hoursChange.trend, hasPreviousData),
      trend: hoursChange.trend,
      icon: Clock,
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      title: "Total Amount",
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
      title: "Task 'Implement authentication' completed",
      time: "2 hours ago",
      project: "Mobile App",
      status: "completed"
    },
    {
      id: 2,
      type: "project_created",
      title: "New project 'E-commerce Website' created",
      time: "4 hours ago",
      project: "E-commerce Website",
      status: "new"
    },
    {
      id: 3,
      type: "deadline_approaching",
      title: "Project deadline approaching",
      time: "6 hours ago",
      project: "Dashboard Analytics",
      status: "warning"
    },
    {
      id: 4,
      type: "team_update",
      title: "3 new members added to team",
      time: "1 day ago",
      project: "General",
      status: "info"
    }
  ];

  // Payroll period selector component
  const PayrollSelector = () => (
    <div className="bg-white rounded-lg border shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-900">Payroll Period</h3>
        <CalendarDays className="w-4 h-4 text-gray-500" />
      </div>
      <Select
        value={selectedPayrollPeriod}
        onValueChange={setSelectedPayrollPeriod}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select payroll period" />
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
      pageSubtitle="Welcome back!"
    >
      {/* Payroll Period Selector */}
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

      {/* Hours List */}
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
                Hours Log
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsAddHoursModalOpen(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Hours
              </Button>
            </CardTitle>
            <CardDescription>
              History of your worked hours in the selected period
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
                <span className="text-gray-600">Loading data...</span>
              </div>
            ) : hoursData.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No hours records found for this period.</p>
                <p className="text-sm mt-2">Click &quot;Add Hours&quot; to get started.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Date</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Client</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-600">Hours</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-600">Rate</th>
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
                          {new Date(entry.date).toLocaleDateString('en-AU')}
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

      {/* Modal to add hours */}
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