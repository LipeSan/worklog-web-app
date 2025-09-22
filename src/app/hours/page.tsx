"use client";

import React, { useState, useEffect } from "react";
import {
  Plus,
  Calendar,
  Timer,
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
import { HoursData, HourEntry, ApiResponse as HoursResponse } from "@/types";

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

  // Function to get token
  const getToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth-token');
    }
    return null;
  };

  // Fetch user hours
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
        toast.error('Error loading hours');
      }
    } catch (error) {
      console.error('Error fetching hours:', error);
      toast.error('Error loading hours');
    } finally {
      setLoading(false);
    }
  };

  // Add new hours entry
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
        toast.success('Hours added successfully!');
        setIsModalOpen(false);
        fetchHours(); // Reload list
      } else {
        const error = await response.json();
        toast.error(error.error || 'Error adding hours');
      }
    } catch (error) {
      console.error('Error adding hours:', error);
      toast.error('Error adding hours');
    }
  };

  // Edit hours entry
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
        toast.success('Hours updated successfully!');
        setIsModalOpen(false);
        setEditingEntry(null);
        fetchHours(); // Reload list
      } else {
        const error = await response.json();
        toast.error(error.error || 'Error updating hours');
      }
    } catch (error) {
      console.error('Error updating hours:', error);
      toast.error('Error updating hours');
    }
  };

  // Delete hours entry
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
        toast.success('Record deleted successfully!');
        setShowDeleteConfirm(false);
        setEntryToDelete(null);
        setIsModalOpen(false);
        setEditingEntry(null);
        fetchHours(); // Reload list
      } else {
        const error = await response.json();
        toast.error(error.error || 'Error deleting record');
      }
    } catch (error) {
      console.error('Error deleting record:', error);
      toast.error('Error deleting record');
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
    setEntryToDelete(null);
  };

  // Filter hours by search term
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
      pageTitle="Hours"
      pageSubtitle="Manage and track your worked hours"
    >
      {/* Header with add button */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hours</h1>
          <p className="text-gray-600">Manage and track your worked hours</p>
        </div>
        <Button 
          className="bg-blue-600 hover:bg-blue-700"
          onClick={() => {
            setEditingEntry(null);
            setIsModalOpen(true);
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Hours
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalHours.toFixed(1)}h</div>
            <p className="text-xs text-muted-foreground">
              All registered hours
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
            <Timer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$ {summary.totalAmount.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Total value of hours
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search by project or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Hours list */}
      <Card>
        <CardHeader>
          <CardTitle>Hours Records</CardTitle>
          <CardDescription>
            {filteredHours.length} record(s) found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-500">Loading...</p>
            </div>
          ) : filteredHours.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No records found</p>
              <p className="text-sm">
                {searchTerm ? 'Try adjusting your search' : 'Add your first hours to get started'}
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
                          {new Date(hour.date).toLocaleDateString('en-AU')}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-sm">
                        <div>
                          <span className="font-medium">Start:</span> {hour.startTime}
                        </div>
                        <div>
                          <span className="font-medium">End:</span> {hour.endTime}
                        </div>
                        <div>
                          <span className="font-medium">Hours:</span> {hour.hours}h
                        </div>
                        <div>
                          <span className="font-medium">Total:</span> {hour.total}
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

      {/* Add/edit hours modal */}
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

      {/* Delete confirmation modal */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this hours record?
              {entryToDelete && (
                <div className="mt-2 p-3 bg-gray-50 rounded-md">
                  <p><strong>Project:</strong> {entryToDelete.project}</p>
                  <p><strong>Date:</strong> {new Date(entryToDelete.date).toLocaleDateString('en-AU')}</p>
                  <p><strong>Hours:</strong> {entryToDelete.hours}h</p>
                  {entryToDelete.description && (
                    <p><strong>Description:</strong> {entryToDelete.description}</p>
                  )}
                </div>
              )}
              <p className="mt-2 text-sm text-red-600">
                This action cannot be undone.
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleDeleteCancel}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}