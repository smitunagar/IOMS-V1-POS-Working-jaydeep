'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface SupplySyncContextType {
  isActive: boolean;
  toggleSupplySync: () => void;
  toggleActive: () => void;
  setSupplySyncActive: (active: boolean) => void;
  // Cross-module integration states
  inventoryAlerts: InventoryAlert[];
  wasteWatchDogIntegration: boolean;
  addInventoryAlert: (alert: InventoryAlert) => void;
  removeInventoryAlert: (alertId: string) => void;
  triggerProcurementWorkflow: (items: string[]) => void;
}

interface InventoryAlert {
  id: string;
  itemName: string;
  currentStock: number;
  reorderPoint: number;
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
  preferredVendor: string;
  estimatedCost: number;
  createdAt: string;
}

const SupplySyncContext = createContext<SupplySyncContextType | undefined>(undefined);

export function SupplySyncProvider({ children }: { children: React.ReactNode }) {
  const [isActive, setIsActive] = useState(false);
  const [inventoryAlerts, setInventoryAlerts] = useState<InventoryAlert[]>([]);
  const [wasteWatchDogIntegration, setWasteWatchDogIntegration] = useState(false);

  // Load state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem('supplysync-active');
    if (savedState) {
      setIsActive(JSON.parse(savedState));
    }

    const savedAlerts = localStorage.getItem('supplysync-inventory-alerts');
    if (savedAlerts) {
      setInventoryAlerts(JSON.parse(savedAlerts));
    }

    const wasteWatchDogState = localStorage.getItem('wastewatchdog-active');
    if (wasteWatchDogState) {
      setWasteWatchDogIntegration(JSON.parse(wasteWatchDogState));
    }
  }, []);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('supplysync-active', JSON.stringify(isActive));
  }, [isActive]);

  useEffect(() => {
    localStorage.setItem('supplysync-inventory-alerts', JSON.stringify(inventoryAlerts));
  }, [inventoryAlerts]);

  const toggleSupplySync = () => {
    setIsActive(!isActive);
  };

  const setSupplySyncActive = (active: boolean) => {
    setIsActive(active);
  };

  const addInventoryAlert = (alert: InventoryAlert) => {
    setInventoryAlerts(prev => [...prev, alert]);
  };

  const removeInventoryAlert = (alertId: string) => {
    setInventoryAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  const triggerProcurementWorkflow = (items: string[]) => {
    // Integrate with procurement workflow service
    console.log('Triggering procurement workflow for items:', items);
    
    // This could trigger automatic quotation requests
    // based on inventory alerts and waste data from WasteWatchDog
    if (wasteWatchDogIntegration) {
      console.log('Cross-module integration: WasteWatchDog data included in procurement decision');
    }
  };

  const value: SupplySyncContextType = {
    isActive,
    toggleSupplySync,
    toggleActive: toggleSupplySync,
    setSupplySyncActive,
    inventoryAlerts,
    wasteWatchDogIntegration,
    addInventoryAlert,
    removeInventoryAlert,
    triggerProcurementWorkflow,
  };

  return (
    <SupplySyncContext.Provider value={value}>
      {children}
    </SupplySyncContext.Provider>
  );
}

export function useSupplySync() {
  const context = useContext(SupplySyncContext);
  if (context === undefined) {
    throw new Error('useSupplySync must be used within a SupplySyncProvider');
  }
  return context;
}
