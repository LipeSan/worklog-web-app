'use client'

import { useState, useEffect } from 'react'
import { Clock, Calendar, Briefcase, Loader2, Trash2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'

interface AddHoursModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: HoursData) => void
  onDelete?: (id: number) => void
  editingEntry?: HourEntry | null
}

interface HoursData {
  date: string
  project: string
  startTime: string
  endTime: string
  hours: number
}

interface HourEntry {
  id: number
  date: string
  project: string
  startTime: string
  endTime: string
  hours: number
  rate: string
  total: string
  description?: string
}

export default function AddHoursModal({ isOpen, onClose, onSubmit, onDelete, editingEntry }: AddHoursModalProps) {
  const { isAuthenticated } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  
  // Função para calcular horas trabalhadas
  const calculateHours = (startTime: string, endTime: string): number => {
    
    if (!startTime || !endTime) return 0
    
    const start = new Date(`2000-01-01T${startTime}:00`)
    const end = new Date(`2000-01-01T${endTime}:00`)
    
    if (end <= start) return 0
    
    const diffMs = end.getTime() - start.getTime()
    const diffHours = diffMs / (1000 * 60 * 60)

    return Math.round(diffHours * 100) / 100 // Arredonda para 2 casas decimais
  }

  const [formData, setFormData] = useState<HoursData>(() => {
    const defaultStartTime = '18:00'
    const defaultEndTime = '22:00'
    return {
      date: new Date().toISOString().split('T')[0],
      project: 'Bahbq',
      startTime: defaultStartTime,
      endTime: defaultEndTime,
      hours: calculateHours(defaultStartTime, defaultEndTime)
    }
  })

  // Função para converter data sem problemas de fuso horário
  const formatDateForInput = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Função para normalizar formato de horas (remover segundos se existirem)
  const normalizeTimeFormat = (timeString: string): string => {
    if (!timeString) return '';
    // Se o formato for HH:MM:SS, converter para HH:MM
    if (timeString.includes(':') && timeString.split(':').length === 3) {
      const [hours, minutes] = timeString.split(':');
      return `${hours}:${minutes}`;
    }
    return timeString;
  };

  // Atualizar formulário quando editingEntry mudar
  useEffect(() => {
    if (editingEntry) {
      // Converter a data para o formato YYYY-MM-DD sem problemas de fuso horário
      const formattedDate = formatDateForInput(editingEntry.date);
      
      // Normalizar formato das horas (remover segundos se existirem)
      const normalizedStartTime = normalizeTimeFormat(editingEntry.startTime);
      const normalizedEndTime = normalizeTimeFormat(editingEntry.endTime);
      
      const calculatedHours = calculateHours(normalizedStartTime, normalizedEndTime);
      
      setFormData({
        date: formattedDate,
        project: editingEntry.project,
        startTime: normalizedStartTime,
        endTime: normalizedEndTime,
        hours: calculatedHours
      });
    } else {
      // Resetar para valores padrão quando não estiver editando
      const today = new Date();
      const todayFormatted = formatDateForInput(today.toISOString());
      const defaultStartTime = '18:00';
      const defaultEndTime = '22:00';
      const calculatedHours = calculateHours(defaultStartTime, defaultEndTime);
      
      setFormData({
        date: todayFormatted,
        project: 'Bahbq',
        startTime: defaultStartTime,
        endTime: defaultEndTime,
        hours: calculatedHours
      })
    }
  }, [editingEntry])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isAuthenticated) {
      toast.error('Você precisa estar logado para adicionar horas')
      return
    }

    if (!formData.project || !formData.startTime || !formData.endTime || formData.hours <= 0) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }

    setIsLoading(true)

    try {
      // Chamar callback do componente pai (que fará a requisição)
      await onSubmit(formData)
      
      // Sucesso - mensagem diferente para edição e criação
      const isEditing = editingEntry !== null;
      toast.success(isEditing ? 'Horas editadas com sucesso!' : 'Horas adicionadas com sucesso!')
      
      // Resetar formulário apenas se não estiver editando
      if (!isEditing) {
        const today = new Date();
        const todayFormatted = formatDateForInput(today.toISOString());
        
        setFormData({
          date: todayFormatted,
          project: 'Bahbq',
          startTime: '18:00',
          endTime: '22:00',
          hours: 4
        })
      }
      
      onClose()

    } catch (error) {
      console.error('Erro ao adicionar horas:', error)
      toast.error(error instanceof Error ? error.message : 'Erro inesperado ao adicionar horas')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    
    setFormData(prev => {
      const newData = {
        ...prev,
        [name]: name === 'hours' ? parseFloat(value) || 0 : value
      }
      
      // Calcula automaticamente as horas quando startTime ou endTime mudam
      if (name === 'startTime' || name === 'endTime') {
        const startTime = name === 'startTime' ? value : prev.startTime
        const endTime = name === 'endTime' ? value : prev.endTime
        newData.hours = calculateHours(startTime, endTime)
      }
      
      return newData
    })
  }

  const handleSelectChange = (value: string) => {
    setFormData(prev => ({ ...prev, project: value }))
  }



  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-600" />
            {editingEntry ? 'Editar Horas' : 'Adicionar Horas'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
          {/* Data */}
          <div className="space-y-2">
            <Label htmlFor="date" className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Data
            </Label>
            <Input
              type="date"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleInputChange}
              disabled={isLoading}
              required
            />
          </div>

          {/* Cliente */}
          <div className="space-y-2 col-span-2">
            <Label className="flex items-center gap-1">
              <Briefcase className="h-4 w-4" />
              Cliente
            </Label>
            <Select 
              value={formData.project} 
              onValueChange={handleSelectChange} 
              disabled={isLoading}
              required
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione um cliente" />
              </SelectTrigger>
              <SelectContent className="w-full">
                <SelectItem value="Bahbq">Bahbq</SelectItem>
                <SelectItem value="Projeto A">Projeto A</SelectItem>
                <SelectItem value="Projeto B">Projeto B</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Horário de Início */}
          <div className="space-y-2">
            <Label htmlFor="startTime" className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              Horário de Início
            </Label>
            <Input
              id="startTime"
              name="startTime"
              type="time"
              value={formData.startTime}
              onChange={handleInputChange}
              disabled={isLoading}
              required
            />
          </div>

          {/* Horário de Fim */}
          <div className="space-y-2">
            <Label htmlFor="endTime" className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              Horário de Fim
            </Label>
            <Input
              type="time"
              id="endTime"
              name="endTime"
              value={formData.endTime}
              onChange={handleInputChange}
              disabled={isLoading}
              required
            />
          </div>

          {/* Horas */}
          <div className="space-y-2 col-span-2">
            <Label htmlFor="hours" className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              Horas Trabalhadas
              <span className="text-xs text-muted-foreground ml-1">(calculado automaticamente)</span>
            </Label>
            <Input
              type="number"
              id="hours"
              name="hours"
              value={formData.hours || ''}
              onChange={handleInputChange}
              min="0.5"
              max="24"
              step="0.5"
              placeholder="Ex: 8.5"
              disabled
              readOnly
              className="bg-muted text-muted-foreground cursor-not-allowed"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4 col-span-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1"
            >
              Cancelar
            </Button>
            {editingEntry && onDelete && (
              <Button
                type="button"
                variant="destructive"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isLoading}
                className="flex-1"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Deletar
              </Button>
            )}
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {editingEntry ? 'Salvando...' : 'Adicionando...'}
                </>
              ) : (
                editingEntry ? 'Salvar' : 'Adicionar'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>

      {/* Modal de confirmação de exclusão */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-600">
              Tem certeza que deseja excluir este registro de horas? Esta ação não pode ser desfeita.
            </p>
            {editingEntry && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm">
                  <strong>Data:</strong> {new Date(editingEntry.date).toLocaleDateString('pt-BR')}
                </p>
                <p className="text-sm">
                  <strong>Cliente:</strong> {editingEntry.project}
                </p>
                <p className="text-sm">
                  <strong>Horas:</strong> {editingEntry.hours}h
                </p>
              </div>
            )}
          </div>
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                if (editingEntry && onDelete) {
                  onDelete(editingEntry.id);
                  setShowDeleteConfirm(false);
                }
              }}
              className="flex-1"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Confirmar Exclusão
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  )
}