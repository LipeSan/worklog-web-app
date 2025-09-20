"use client";

import React, { useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import ProtectedRoute from "./ProtectedRoute";

interface AppLayoutProps {
  children: React.ReactNode;
  currentPage: string;
  pageTitle: string;
  pageSubtitle?: string;
  headerContent?: React.ReactNode;
}

export default function AppLayout({ 
  children, 
  currentPage, 
  pageTitle, 
  pageSubtitle,
  headerContent 
}: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Sidebar 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)} 
          currentPage={currentPage}
        />

        {/* Main Content */}
        <div className="lg:pl-64">
          <Header 
            title={pageTitle}
            subtitle={pageSubtitle}
            onMenuClick={() => setSidebarOpen(true)}
          >
            {headerContent}
          </Header>

          {/* Page Content */}
          <main className="p-6">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}