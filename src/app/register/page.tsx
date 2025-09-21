"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff, Mail, Lock, User, Phone, UserPlus, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import PhoneInput from "@/components/ui/phone-input";

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    password: ""
  });

  // State for validations
  const [fieldErrors, setFieldErrors] = useState({
    fullName: "",
    phone: "",
    email: "",
    password: ""
  });

  const [fieldTouched, setFieldTouched] = useState({
    fullName: false,
    phone: false,
    email: false,
    password: false
  });

  // Validation functions
  const validateFullName = (name: string): string => {
    if (!name.trim()) return "Full name is required";
    if (name.trim().length < 2) return "Name must be at least 2 characters";
    if (!/^[a-zA-ZÀ-ÿ\s]+$/.test(name)) return "Name must contain only letters and spaces";
    return "";
  };

  const validateEmail = (email: string): string => {
    if (!email.trim()) return "Email is required";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return "Invalid email";
    return "";
  };

  const validatePhone = (phone: string): string => {
    if (!phone.trim()) return "Phone number is required";
    
    // If phone is already normalised (+61XXXXXXXXX), extract only the 9 local digits
    if (phone.startsWith('+61')) {
      const localNumbers = phone.substring(3);
      if (localNumbers.length !== 9 || !/^[0-9]+$/.test(localNumbers)) {
        return "Phone must have 9 digits (Australian format)";
      }
      return "";
    }
    
    // If not normalised, check if it has 9 digits
    const numbersOnly = phone.replace(/\D/g, "");
    if (numbersOnly.length !== 9) return "Phone must have 9 digits (Australian format)";
    return "";
  };

  const validatePassword = (password: string): string => {
    if (!password) return "Password is required";
    if (password.length < 8) return "Password must be at least 8 characters";
    if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(password)) return "Password must contain at least one letter and one number";
    return "";
  };

  const validateField = (field: string, value: string): string => {
    switch (field) {
      case "fullName": return validateFullName(value);
      case "email": return validateEmail(value);
      case "phone": return validatePhone(value);
      case "password": return validatePassword(value);
      default: return "";
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Validate field if already touched
    if (fieldTouched[field as keyof typeof fieldTouched]) {
      const error = validateField(field, value);
      setFieldErrors(prev => ({
        ...prev,
        [field]: error
      }));
    }
  };

  const handleFieldBlur = (field: string) => {
    setFieldTouched(prev => ({
      ...prev,
      [field]: true
    }));

    const error = validateField(field, formData[field as keyof typeof formData]);
    setFieldErrors(prev => ({
      ...prev,
      [field]: error
    }));
  };



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validate all fields
    const errors = {
      fullName: validateFullName(formData.fullName),
      email: validateEmail(formData.email),
      phone: validatePhone(formData.phone),
      password: validatePassword(formData.password)
    };

    // Mark all fields as touched
    setFieldTouched({
      fullName: true,
      email: true,
      phone: true,
      password: true
    });

    // Update errors
    setFieldErrors(errors);

    // Check if there are errors
    const hasErrors = Object.values(errors).some(error => error !== "");
    if (hasErrors) {
      setError("Please correct the errors before continuing");
      return;
    }

    setIsLoading(true);

    try {
      // Prepare data for submission
      const registrationData = {
        fullName: formData.fullName.trim(),
        phone: formData.phone.startsWith("+61") ? formData.phone : `+61${formData.phone}`,
        email: formData.email.trim(),
        password: formData.password
      };

      // Call registration API
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registrationData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error creating account');
      }

      // Success
      setSuccess('Account created successfully! Redirecting...');
      
      // Clear form
      setFormData({
        fullName: "",
        phone: "",
        email: "",
        password: ""
      });

      // Redirect to login after 2 seconds
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);

    } catch (error) {
      console.error('Registration error:', error);
      setError(error instanceof Error ? error.message : 'Unexpected error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-xl border-0">
          <CardHeader className="space-y-1 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="mx-auto w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center mb-4"
            >
              <UserPlus className="w-6 h-6 text-white" />
            </motion.div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Create account
            </CardTitle>
            <CardDescription className="text-gray-600">
              Fill in the details to create your account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Mensagens de feedback */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm"
              >
                {error}
              </motion.div>
            )}
            
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm"
              >
                {success}
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="space-y-2"
              >
                <Label htmlFor="fullName" className="text-sm font-medium text-gray-700">
                  Full Name
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Your full name"
                    value={formData.fullName}
                    onChange={(e) => handleInputChange("fullName", e.target.value)}
                    onBlur={() => handleFieldBlur("fullName")}
                    className={`pl-10 h-12 focus:ring-indigo-500 ${
                      fieldErrors.fullName && fieldTouched.fullName
                        ? "border-red-500 focus:border-red-500"
                        : "border-gray-200 focus:border-indigo-500"
                    }`}
                  />
                </div>
                {fieldErrors.fullName && fieldTouched.fullName && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-red-600"
                  >
                    {fieldErrors.fullName}
                  </motion.p>
                )}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="space-y-2"
              >
                <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                  Phone (Australia)
                </Label>
                <PhoneInput
                  id="phone"
                  value={formData.phone}
                  onChange={(value) => setFormData(prev => ({ ...prev, phone: value }))}
                  onBlur={() => handleFieldBlur("phone")}
                  placeholder="XXX XXX XXX"
                  error={!!(fieldErrors.phone && fieldTouched.phone)}
                  errorMessage={fieldErrors.phone}
                  required
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="space-y-2"
              >
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    onBlur={() => handleFieldBlur("email")}
                    className={`pl-10 h-12 focus:ring-indigo-500 ${
                      fieldErrors.email && fieldTouched.email
                        ? "border-red-500 focus:border-red-500"
                        : "border-gray-200 focus:border-indigo-500"
                    }`}
                  />
                </div>
                {fieldErrors.email && fieldTouched.email && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-red-600"
                  >
                    {fieldErrors.email}
                  </motion.p>
                )}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
                className="space-y-2"
              >
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    onBlur={() => handleFieldBlur("password")}
                    className={`pl-10 pr-10 h-12 focus:ring-indigo-500 ${
                      fieldErrors.password && fieldTouched.password
                        ? "border-red-500 focus:border-red-500"
                        : "border-gray-200 focus:border-indigo-500"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {fieldErrors.password && fieldTouched.password && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-red-600"
                  >
                    {fieldErrors.password}
                  </motion.p>
                )}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:transform-none"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Creating account...
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Create Account
                    </>
                  )}
                </Button>
              </motion.div>
            </form>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="text-center text-sm text-gray-600"
            >
              Already have an account?{" "}
              <a
                href="/login"
                className="text-indigo-600 hover:text-indigo-500 font-medium transition-colors inline-flex items-center"
              >
                <ArrowLeft className="w-3 h-3 mr-1" />
                Back to login
              </a>
            </motion.div>


          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}