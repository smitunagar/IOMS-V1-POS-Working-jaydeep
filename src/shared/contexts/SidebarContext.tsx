"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface SidebarState {
  [key: string]: boolean; // Module name -> expanded state
}

interface ModuleVisibility {
  [key: string]: boolean; // Module name -> visibility state
}

interface SidebarContextType {
  expandedModules: SidebarState;
  toggleModule: (moduleName: string) => void;
  setModuleExpanded: (moduleName: string, expanded: boolean) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  moduleVisibility: ModuleVisibility;
  toggleModuleVisibility: (moduleName: string) => void;
  setModuleVisible: (moduleName: string, visible: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

const SIDEBAR_STORAGE_KEY = 'ioms-sidebar-state';
const SIDEBAR_COLLAPSED_KEY = 'ioms-sidebar-collapsed';
const MODULE_VISIBILITY_KEY = 'ioms-module-visibility';

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [expandedModules, setExpandedModules] = useState<SidebarState>({});
  const [moduleVisibility, setModuleVisibilityState] = useState<ModuleVisibility>({
    // Default visible modules
    'WasteWatchDog': true,
    'POS System': true,
    'SmartInventory': false,
    'SmartChef': false,
    'Marketplace': true
  });
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load persisted state on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedState = localStorage.getItem(SIDEBAR_STORAGE_KEY);
        const savedCollapsed = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
        const savedVisibility = localStorage.getItem(MODULE_VISIBILITY_KEY);
        
        if (savedState) {
          setExpandedModules(JSON.parse(savedState));
        }
        
        if (savedCollapsed) {
          setIsCollapsed(JSON.parse(savedCollapsed));
        }

        if (savedVisibility) {
          setModuleVisibilityState(JSON.parse(savedVisibility));
        }
      } catch (error) {
        console.warn('Failed to load sidebar state from localStorage:', error);
      }
      
      setIsInitialized(true);
    }
  }, []);

  // Persist state changes
  useEffect(() => {
    if (isInitialized && typeof window !== 'undefined') {
      try {
        localStorage.setItem(SIDEBAR_STORAGE_KEY, JSON.stringify(expandedModules));
      } catch (error) {
        console.warn('Failed to save sidebar state to localStorage:', error);
      }
    }
  }, [expandedModules, isInitialized]);

  useEffect(() => {
    if (isInitialized && typeof window !== 'undefined') {
      try {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, JSON.stringify(isCollapsed));
      } catch (error) {
        console.warn('Failed to save sidebar collapsed state to localStorage:', error);
      }
    }
  }, [isCollapsed, isInitialized]);

  useEffect(() => {
    if (isInitialized && typeof window !== 'undefined') {
      try {
        localStorage.setItem(MODULE_VISIBILITY_KEY, JSON.stringify(moduleVisibility));
      } catch (error) {
        console.warn('Failed to save module visibility to localStorage:', error);
      }
    }
  }, [moduleVisibility, isInitialized]);

  const toggleModule = useCallback((moduleName: string) => {
    setExpandedModules(prev => ({
      ...prev,
      [moduleName]: !prev[moduleName]
    }));
  }, []);

  const setModuleExpanded = useCallback((moduleName: string, expanded: boolean) => {
    setExpandedModules(prev => ({
      ...prev,
      [moduleName]: expanded
    }));
  }, []);

  const toggleModuleVisibility = useCallback((moduleName: string) => {
    setModuleVisibilityState(prev => ({
      ...prev,
      [moduleName]: !prev[moduleName]
    }));
  }, []);

  const setModuleVisible = useCallback((moduleName: string, visible: boolean) => {
    setModuleVisibilityState(prev => ({
      ...prev,
      [moduleName]: visible
    }));
  }, []);

  const value: SidebarContextType = {
    expandedModules,
    toggleModule,
    setModuleExpanded,
    isCollapsed,
    setIsCollapsed,
    moduleVisibility,
    toggleModuleVisibility,
    setModuleVisible
  };

  return (
    <SidebarContext.Provider value={value}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
}
