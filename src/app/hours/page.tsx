"use client";

import React, { useState, useEffect } from "react";
import {
  Plus,
  Calendar,
  Timer,
  PlayCircle,
  PauseCircle,
  Clock,
  Edit,
  Trash2,
  Search,
  Filter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import AppLayout from "@/components/AppLayout";
import AddHoursModal from "@/components/AddHoursModal";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface HoursData {
  date: string;
  project: string;
  startTime: string;
  endTime: string;
  hours: number;
  description?: string;
}

interface HourEntry extends HoursData {
  id: number;
  rate: string;
  total: string;
}

interface HoursResponse {
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

export default function HoursPage() {
  const { isAuthenticated } = useAuth();
  const [hours, setHours] = useState<HourEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({ totalHours: 0, totalAmount: 0 });
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<HourEntry | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<HourEntry | null>(null);

  // Função para obter token
  const getToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  };

  // Buscar horas do usuário
  const fetchHours = async () => {
    const token = getToken();
    if (!token || !isAuthenticated) return;

    try {
      setLoading(true);
      const response = await fetch('/api/hours', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data: HoursResponse = await response.json();
        setHours(data.hours);
        setSummary(data.summary);
      } else {
        toast.error('Erro ao carregar horas');
      }
    } catch (error) {
      console.error('Erro ao buscar horas:', error);
      toast.error('Erro ao carregar horas');
    } finally {
      setLoading(false);
    }
  };

  // Adicionar nova entrada de horas
  const handleAddHours = async (data: HoursData) => {
    const token = getToken();
    if (!token) return;

    try {
      const response = await fetch('/api/hours', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        toast.success('Horas adicionadas com sucesso!');
        setIsModalOpen(false);
        fetchHours(); // Recarregar lista
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao adicionar horas');
      }
    } catch (error) {
      console.error('Erro ao adicionar horas:', error);
      toast.error('Erro ao adicionar horas');
    }
  };

  // Editar entrada de horas
  const handleEditHours = async (data: HoursData) => {
    const token = getToken();
    if (!token || !editingEntry) return;

    try {
      const response = await fetch(`/api/hours/${editingEntry.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        toast.success('Horas atualizadas com sucesso!');
        setIsModalOpen(false);
        setEditingEntry(null);
        fetchHours(); // Recarregar lista
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao atualizar horas');
      }
    } catch (error) {
      console.error('Erro ao atualizar horas:', error);
      toast.error('Erro ao atualizar horas');
    }
  };

  // Excluir entrada de horas
  const handleDeleteClick = (entry: HourEntry) => {
    setEntryToDelete(entry);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!entryToDelete) return;
    
    const token = getToken();
    if (!token) return;

    try {
      const response = await fetch(`/api/hours/${entryToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        toast.success('Registro excluído com sucesso!');
        setShowDeleteConfirm(false);
        setEntryToDelete(null);
        setIsModalOpen(false);
        setEditingEntry(null);
        fetchHours(); // Recarregar lista
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao excluir registro');
      }
    } catch (error) {
      console.error('Erro ao excluir registro:', error);
      toast.error('Erro ao excluir registro');
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
    setEntryToDelete(null);
  };

  // Filtrar horas por termo de busca
  const filteredHours = hours.filter(hour =>
    hour.project.toLowerCase().includes(searchTerm.toLowerCase()) ||
    hour.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    fetchHours();
  }, [isAuthenticated]);

  return (
    <AppLayout 
      currentPage="hours"
      pageTitle="Horas"
      pageSubtitle="Gerencie e acompanhe suas horas trabalhadas"
    >
      {/* Header com botão de adicionar */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Horas</h1>
          <p className="text-gray-600">Gerencie e acompanhe suas horas trabalhadas</p>
        </div>
        <Button 
          className="bg-blue-600 hover:bg-blue-700"
          onClick={() => {
            setEditingEntry(null);
            setIsModalOpen(true);
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Horas
        </Button>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Horas</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalHours.toFixed(1)}h</div>
            <p className="text-xs text-muted-foreground">
              Todas as horas registradas
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <Timer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {summary.totalAmount.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Valor total das horas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Barra de busca */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Buscar por projeto ou descrição..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Lista de horas */}
      <Card>
        <CardHeader>
          <CardTitle>Registros de Horas</CardTitle>
          <CardDescription>
            {filteredHours.length} registro(s) encontrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-500">Carregando...</p>
            </div>
          ) : filteredHours.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum registro encontrado</p>
              <p className="text-sm">
                {searchTerm ? 'Tente ajustar sua busca' : 'Adicione suas primeiras horas para começar'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredHours.map((hour) => (
                <div
                  key={hour.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">{hour.project}</Badge>
                        <span className="text-sm text-gray-500">
                          {new Date(hour.date).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-sm">
                        <div>
                          <span className="font-medium">Início:</span> {hour.startTime}
                        </div>
                        <div>
                          <span className="font-medium">Fim:</span> {hour.endTime}
                        </div>
                        <div>
                          <span className="font-medium">Horas:</span> {hour.hours}h
                        </div>
                        <div>
                          <span className="font-medium">Total:</span> R$ {hour.total}
                        </div>
                      </div>
                      {hour.description && (
                        <p className="text-sm text-gray-600 mt-2">{hour.description}</p>
                      )}
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingEntry(hour);
                          setIsModalOpen(true);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteClick(hour)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de adicionar/editar horas */}
      <AddHoursModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingEntry(null);
        }}
        onSubmit={editingEntry ? handleEditHours : handleAddHours}
        onDelete={(id: number) => {
          const entry = hours.find(h => h.id === id);
          if (entry) handleDeleteClick(entry);
        }}
        editingEntry={editingEntry}
      />

      {/* Modal de confirmação de exclusão */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir este registro de horas?
              {entryToDelete && (
                <div className="mt-2 p-3 bg-gray-50 rounded-md">
                  <p><strong>Projeto:</strong> {entryToDelete.project}</p>
                  <p><strong>Data:</strong> {new Date(entryToDelete.date).toLocaleDateString('pt-BR')}</p>
                  <p><strong>Horas:</strong> {entryToDelete.hours}h</p>
                  {entryToDelete.description && (
                    <p><strong>Descrição:</strong> {entryToDelete.description}</p>
                  )}
                </div>
              )}
              <p className="mt-2 text-sm text-red-600">
                Esta ação não pode ser desfeita.
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleDeleteCancel}>
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}