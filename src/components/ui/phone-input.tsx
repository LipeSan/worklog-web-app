"use client";

import React, { useState, useEffect, forwardRef } from "react";
import { Phone } from "lucide-react";
import { Input } from "./input";
import { cn } from "@/lib/utils";
import { formatAustralianPhoneDisplay, parseDisplayPhone, normalizeAustralianPhone, parsePhoneComponents } from "@/lib/phone-utils";

interface PhoneInputProps {
  value?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  error?: boolean;
  errorMessage?: string;
  id?: string;
  required?: boolean;
}

const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(({
  value = "",
  onChange,
  onBlur,
  disabled = false,
  placeholder = "Digite seu telefone",
  className = "",
  error = false,
  errorMessage,
  id,
  required = false,
}, ref) => {
  const [phoneNumber, setPhoneNumber] = useState("");

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newPhoneNumber = e.target.value;
    
    // Aplicar formatação específica para números australianos
    newPhoneNumber = formatAustralianPhoneDisplay(newPhoneNumber);
    
    setPhoneNumber(newPhoneNumber);
    
    // Chamar onChange com o valor normalizado
    if (onChange) {
      const fullPhoneNumber = parseDisplayPhone(newPhoneNumber);
      onChange(fullPhoneNumber);
    }
  };

  React.useEffect(() => {
    if (value && value !== phoneNumber) {
      // Extrair número do valor inicial
      const parsed = parsePhoneComponents(value);
      setPhoneNumber(parsed.phoneNumber);
    }
  }, [value, phoneNumber]);

  return (
    <div className="space-y-2">
      <div className={cn(
        "flex items-center space-x-2",
        className
      )}>
        <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        
        {/* DDI fixo da Austrália */}
        <div className="flex items-center justify-center w-[80px] h-10 px-3 py-2 text-sm bg-muted border border-input rounded-md">
          🇦🇺 +61
        </div>

        {/* Campo de número de telefone */}
        <Input
          ref={ref}
          id={id}
          type="tel"
          value={phoneNumber}
          onChange={handlePhoneNumberChange}
          onBlur={onBlur}
          disabled={disabled}
          placeholder={placeholder}
          required={required}
          className={cn(
            "flex-1",
            error && "border-red-500 focus:border-red-500 focus:ring-red-500"
          )}
        />
      </div>
      
      {/* Mensagem de erro */}
      {error && errorMessage && (
        <p className="text-sm text-red-600">
          {errorMessage}
        </p>
      )}
    </div>
  );
});

PhoneInput.displayName = "PhoneInput";

export default PhoneInput;