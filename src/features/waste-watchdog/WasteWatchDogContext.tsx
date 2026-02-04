'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface WasteWatchDogContextType {
  isActive: boolean;
  toggleWasteWatchDog: () => void;
  toggleActive: () => void;
  setWasteWatchDogActive: (active: boolean) => void;
}

const WasteWatchDogContext = createContext<WasteWatchDogContextType | undefined>(undefined);

export function WasteWatchDogProvider({ children }: { children: React.ReactNode }) {
  const [isActive, setIsActive] = useState(false);

  // Load state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem('wastewatchdog-active');
    if (savedState) {
      setIsActive(JSON.parse(savedState));
    }
  }, []);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('wastewatchdog-active', JSON.stringify(isActive));
  }, [isActive]);

  const toggleWasteWatchDog = () => {
    setIsActive(!isActive);
  };

  const setWasteWatchDogActive = (active: boolean) => {
    setIsActive(active);
  };

  const value: WasteWatchDogContextType = {
    isActive,
    toggleWasteWatchDog,
    toggleActive: toggleWasteWatchDog,
    setWasteWatchDogActive,
  };

  return (
    <WasteWatchDogContext.Provider value={value}>
      {children}
    </WasteWatchDogContext.Provider>
  );
}

export function useWasteWatchDog() {
  const context = useContext(WasteWatchDogContext);
  if (context === undefined) {
    throw new Error('useWasteWatchDog must be used within a WasteWatchDogProvider');
  }
  return context;
}

