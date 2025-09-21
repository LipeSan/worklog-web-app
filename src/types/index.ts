// Tipos compartilhados da aplicação
import { type LucideIcon } from "lucide-react";

export interface HoursData {
  date: string;
  project: string;
  startTime: string;
  endTime: string;
  hours: number;
  description?: string;
}

export interface HourEntry {
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

export interface PayrollPeriod {
  id: string;
  label: string;
  startDate: Date;
  endDate: Date;
}

export interface ApiResponse {
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

export interface StatCard {
  title: string;
  value: string;
  change: string;
  trend: "up" | "down";
  icon: LucideIcon;
  color: string;
  bgColor: string;
}

export interface Activity {
  id: number;
  user: string;
  action: string;
  time: string;
  avatar: string;
}

export interface Project {
  id: number;
  name: string;
  progress: number;
  status: "active" | "completed" | "pending";
  team: number;
}