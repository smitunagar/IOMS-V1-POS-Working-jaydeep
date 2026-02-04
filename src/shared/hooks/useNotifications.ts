'use client';

import { useState, useEffect, useCallback } from 'react';

export interface Notification {
  id: string;
  type: 'slow-moving' | 'waste-alert' | 'stock-warning' | 'upsell' | 'excess-items';
  title: string;
  message: string;
  priority: 'high' | 'medium' | 'low';
  timestamp: Date;
  dismissed?: boolean;
  actionRequired?: boolean;
  actionLabel?: string;
  onAction?: () => void;
}

interface UseNotificationsReturn {
  notifications: Notification[];
  activeNotifications: Notification[];
  highPriorityCount: number;
  dismissNotification: (id: string) => void;
  dismissAll: () => void;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  markAsRead: (id: string) => void;
  clearAll: () => void;
}

// Mock data generator removed - notifications are now dynamic

export function useNotifications(initialNotifications?: Notification[]): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>(
    initialNotifications || []
  );

  const activeNotifications = notifications.filter(n => !n.dismissed);
  const highPriorityCount = activeNotifications.filter(n => n.priority === 'high').length;

  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, dismissed: true } : n)
    );
  }, []);

  const dismissAll = useCallback(() => {
    setNotifications(prev => 
      prev.map(n => ({ ...n, dismissed: true }))
    );
  }, []);

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `${notification.type}-${Date.now()}`,
      timestamp: new Date(),
    };
    
    setNotifications(prev => [newNotification, ...prev]);
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, dismissed: true } : n)
    );
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // Real-time updates would come from WebSocket or polling in a real app
  // For now, notifications are only added manually or through the test button

  return {
    notifications,
    activeNotifications,
    highPriorityCount,
    dismissNotification,
    dismissAll,
    addNotification,
    markAsRead,
    clearAll,
  };
}
