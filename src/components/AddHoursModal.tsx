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
import { HoursData, HourEntry } from '@/types'

interface AddHoursModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: HoursData) => void
  onDelete?: (id: number) => void
  editingEntry?: HourEntry | null
}

export default function AddHoursModal({ isOpen, onClose, onSubmit, onDelete, editingEntry }: AddHoursModalProps) {
  const { isAuthenticated } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  
  // Function to calculate worked hours
  const calculateHours = (startTime: string, endTime: string): number => {
    
    if (!startTime || !endTime) return 0
    
    const start = new Date(`2000-01-01T${startTime}:00`)
    const end = new Date(`2000-01-01T${endTime}:00`)
    
    if (end <= start) return 0
    
    const diffMs = end.getTime() - start.getTime()
    const diffHours = diffMs / (1000 * 60 * 60)

    return Math.round(diffHours * 100) / 100 // Round to 2 decimal places
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

  // Function to convert date without timezone issues
  const formatDateForInput = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Function to normalize time format (remove seconds if they exist)
  const normalizeTimeFormat = (timeString: string): string => {
    if (!timeString) return '';
    // If format is HH:MM:SS, convert to HH:MM
    if (timeString.includes(':') && timeString.split(':').length === 3) {
      const [hours, minutes] = timeString.split(':');
      return `${hours}:${minutes}`;
    }
    return timeString;
  };

  // Update form when editingEntry changes
  useEffect(() => {
    if (editingEntry) {
      // Convert date to YYYY-MM-DD format without timezone issues
      const formattedDate = formatDateForInput(editingEntry.date);
      
      // Normalize time format (remove seconds if they exist)
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
      // Reset to default values when not editing
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
      toast.error('You need to be logged in to add hours')
      return
    }

    if (!formData.project || !formData.startTime || !formData.endTime || formData.hours <= 0) {
      toast.error('Please fill in all required fields')
      return
    }

    setIsLoading(true)

    try {
      // Call parent component callback (which will make the request)
      await onSubmit(formData)
      
      // Success - different message for editing and creating
      const isEditing = editingEntry !== null;
      toast.success(isEditing ? 'Hours updated successfully!' : 'Hours added successfully!')
      
      // Reset form only if not editing
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
      console.error('Error adding hours:', error)
      toast.error(error instanceof Error ? error.message : 'Unexpected error adding hours')
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
      
      // Automatically calculate hours when startTime or endTime changes
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
            {editingEntry ? 'Edit Hours' : 'Add Hours'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="date" className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Date
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

          {/* Client */}
          <div className="space-y-2 col-span-2">
            <Label className="flex items-center gap-1">
              <Briefcase className="h-4 w-4" />
              Client
            </Label>
            <Select 
              value={formData.project} 
              onValueChange={handleSelectChange} 
              disabled={isLoading}
              required
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a client" />
              </SelectTrigger>
              <SelectContent className="w-full">
                <SelectItem value="Bahbq">Bahbq</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Start Time */}
          <div className="space-y-2">
            <Label htmlFor="startTime" className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              Start Time
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

          {/* End Time */}
          <div className="space-y-2">
            <Label htmlFor="endTime" className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              End Time
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

          {/* Hours */}
          <div className="space-y-2 col-span-2">
            <Label htmlFor="hours" className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              Hours Worked
              <span className="text-xs text-muted-foreground ml-1">(calculated automatically)</span>
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
              Cancel
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
                Delete
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
                  {editingEntry ? 'Saving...' : 'Adding...'}
                </>
              ) : (
                editingEntry ? 'Save' : 'Add'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>

      {/* Delete confirmation modal */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-600">
              Are you sure you want to delete this hours record? This action cannot be undone.
            </p>
            {editingEntry && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm">
                  <strong>Date:</strong> {new Date(editingEntry.date).toLocaleDateString('en-AU')}
                </p>
                <p className="text-sm">
                  <strong>Client:</strong> {editingEntry.project}
                </p>
                <p className="text-sm">
                  <strong>Hours:</strong> {editingEntry.hours}h
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
              Cancel
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
              Confirm Deletion
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  )
}