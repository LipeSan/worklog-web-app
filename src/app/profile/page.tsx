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

// Interface for user data
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
  
  // States for user data
  const [userData, setUserData] = useState<UserData | null>(null);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    rate: 25.00
  });

  // Function to fetch user data
  const fetchUserData = async () => {
    try {
      setIsLoading(true);
      setError("");

      const response = await fetch('/api/user/profile', {
        method: 'GET',
        credentials: 'include', // To include cookies
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error loading user data');
      }

      setUserData(data.user);
      setFormData({
        full_name: data.user.full_name,
        email: data.user.email,
        phone: data.user.phone,
        rate: data.user.rate
      });

    } catch (error) {
      console.error('Error fetching user data:', error);
      setError(error instanceof Error ? error.message : 'Unexpected error');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to save user data
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
        throw new Error(data.error || 'Error saving data');
      }

      // Update local data
      setUserData(data.user);
      setFormData({
        full_name: data.user.full_name,
        email: data.user.email,
        phone: data.user.phone,
        rate: data.user.rate
      });

      setIsEditing(false);
      toast.success('Data updated successfully!');

    } catch (error) {
      console.error('Error saving user data:', error);
      toast.error(error instanceof Error ? error.message : 'Unexpected error while saving');
    } finally {
      setIsSaving(false);
    }
  };

  // Function to handle button click
  const handleButtonClick = () => {
    if (isEditing) {
      saveUserData();
    } else {
      setIsEditing(true);
    }
  };

  // Load user data on initialization
  useEffect(() => {
    fetchUserData();
  }, []);

  // If loading, show loading
  if (isLoading) {
    return (
      <AppLayout 
        currentPage="profile"
        pageTitle="My Data"
        pageSubtitle="Manage your personal information"
      >
        <div className="max-w-4xl mx-auto flex items-center justify-center min-h-[400px]">
          <div className="flex items-center space-x-2">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
            <span className="text-gray-600">Loading profile data...</span>
          </div>
        </div>
      </AppLayout>
    );
  }

  // If there's an error, show error message
  if (error) {
    return (
      <AppLayout 
        currentPage="profile"
        pageTitle="My Data"
        pageSubtitle="Manage your personal information"
      >
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <p className="font-medium">Error loading profile data</p>
            <p className="text-sm mt-1">{error}</p>
            <Button 
              onClick={fetchUserData}
              variant="outline"
              className="mt-3"
            >
              Try again
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout 
      currentPage="profile"
      pageTitle="My Data"
      pageSubtitle="Manage your personal information"
    >
      <div className="max-w-4xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">My Profile</h1>
              <p className="text-gray-600">Manage your personal and professional information</p>
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
                  <span>{isSaving ? 'Saving...' : 'Save'}</span>
                </>
              ) : (
                <>
                  <Edit className="w-4 h-4" />
                  <span>Edit</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>
              Your basic profile information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
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
                  Phone
                </label>
                <PhoneInput
                  value={formData.phone}
                  onChange={(value) => setFormData(prev => ({ ...prev, phone: value }))}
                  disabled={!isEditing}
                  placeholder="Enter your phone number"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hourly Rate ($)
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
                  Your hourly work rate
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}