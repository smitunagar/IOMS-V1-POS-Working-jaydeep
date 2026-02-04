"use client";

import React, { useState, useEffect } from 'react';
import { GlobalSidebar } from './GlobalSidebar';
import { cn } from '@/server/lib/utils';

interface MainLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function MainLayout({ children, className }: MainLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Listen to sidebar state changes
  useEffect(() => {
    const checkSidebarState = () => {
      const savedState = localStorage.getItem('ioms-sidebar-state');
      if (savedState) {
        try {
          const state = JSON.parse(savedState);
          setSidebarCollapsed(state.isCollapsed || false);
        } catch (error) {
          setSidebarCollapsed(false);
        }
      } else {
        setSidebarCollapsed(false);
      }
      setIsLoaded(true);
    };

    const handleSidebarChange = (event: CustomEvent) => {
      setSidebarCollapsed(event.detail.isCollapsed || false);
    };

    checkSidebarState();
    
    // Listen for custom sidebar events
    window.addEventListener('sidebar-state-changed', handleSidebarChange as EventListener);
    
    // Listen for storage changes
    window.addEventListener('storage', checkSidebarState);
    
    // Check periodically for state changes (fallback)
    const interval = setInterval(checkSidebarState, 500);

    return () => {
      window.removeEventListener('sidebar-state-changed', handleSidebarChange as EventListener);
      window.removeEventListener('storage', checkSidebarState);
      clearInterval(interval);
    };
  }, []);

  // Don't render with margins until we know the sidebar state
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
        <GlobalSidebar />
        <main className="p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      <GlobalSidebar />
      <main 
        className={cn(
          "transition-all duration-300 ease-in-out min-h-screen",
          "p-4 md:p-6 lg:p-8",
          // Use CSS classes for better responsive behavior
          sidebarCollapsed 
            ? "lg:ml-20" // 80px margin for collapsed sidebar
            : "lg:ml-80", // 320px margin for expanded sidebar  
          className
        )}
      >
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
