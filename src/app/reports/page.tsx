"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  FileText,
  TrendingUp,
  Calendar,
  Download
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import AppLayout from "@/components/AppLayout";

export default function ReportsPage() {
  return (
    <AppLayout
      currentPage="reports"
      pageTitle="Relatórios"
      pageSubtitle="Visualize e analise seus dados"
    >
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Relatórios</h1>
              <p className="text-gray-600">Acompanhe o desempenho e gere relatórios detalhados</p>
            </div>
            <Button className="flex items-center space-x-2">
              <Download className="w-4 h-4" />
              <span>Exportar</span>
            </Button>
          </div>
        </div>

        {/* Content Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Relatório de Horas</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Em breve</div>
              <p className="text-xs text-muted-foreground">
                Relatório detalhado das horas trabalhadas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Relatório de Projetos</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Em breve</div>
              <p className="text-xs text-muted-foreground">
                Análise de desempenho por projeto
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Relatório de Performance</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Em breve</div>
              <p className="text-xs text-muted-foreground">
                Métricas de produtividade e eficiência
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Placeholder Content */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Área de Relatórios</CardTitle>
              <CardDescription>
                Esta página será desenvolvida para exibir relatórios detalhados e análises de dados.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Conteúdo em desenvolvimento</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}