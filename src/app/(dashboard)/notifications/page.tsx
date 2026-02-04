'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { useToast } from '@/shared/hooks/use-toast';
import { 
  Bell,
  Package,
  ShoppingCart,
  Calendar,
  Clock,
  Trash2,
  RefreshCw,
  CheckCircle
} from 'lucide-react';

interface Notification {
  id: string;
  type: 'low-stock' | 'order' | 'reservation' | 'system';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  priority: 'low' | 'medium' | 'high';
  relatedData?: any;
}

export default function NotificationsPage() {
  const { currentUser } = useAuth();
  const { toast } = useToast();

  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Load notifications and check inventory
  useEffect(() => {
    loadNotifications();
    checkInventoryLevels();
  }, [currentUser]);

  const loadNotifications = () => {
    try {
      const userId = currentUser?.id || 'default_user';
      const notificationsKey = `notifications_${userId}`;
      const stored = localStorage.getItem(notificationsKey);
      
      if (stored) {
        setNotifications(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const saveNotifications = (notifs: Notification[]) => {
    try {
      const userId = currentUser?.id || 'default_user';
      const notificationsKey = `notifications_${userId}`;
      localStorage.setItem(notificationsKey, JSON.stringify(notifs));
      setNotifications(notifs);
      
      // Trigger a custom event to update sidebar badge immediately
      window.dispatchEvent(new Event('storage'));
    } catch (error) {
      console.error('Error saving notifications:', error);
    }
  };

  const checkInventoryLevels = () => {
    try {
      const userId = currentUser?.id || 'default_user';
      const inventoryKey = `inventory_${userId}`;
      const storedInventory = localStorage.getItem(inventoryKey);
      
      if (!storedInventory) return;
      
      const inventory = JSON.parse(storedInventory);
      const lowStockItems = inventory.filter((item: any) => {
        const threshold = item.lowStockThreshold || 5;
        return item.quantity <= threshold;
      });

      // Create notifications for low stock items
      const existingNotifs = notifications;
      const newNotifications: Notification[] = [];

      lowStockItems.forEach((item: any) => {
        // Check if notification already exists for this item
        const exists = existingNotifs.some(n => 
          n.type === 'low-stock' && 
          n.relatedData?.itemId === item.id &&
          !n.read
        );

        if (!exists) {
          newNotifications.push({
            id: `low-stock-${item.id}-${Date.now()}`,
            type: 'low-stock',
            title: 'Low Stock Alert',
            message: `${item.name} is running low. Current stock: ${item.quantity} ${item.unit}`,
            timestamp: new Date().toISOString(),
            read: false,
            priority: item.quantity === 0 ? 'high' : 'medium',
            relatedData: {
              itemId: item.id,
              itemName: item.name,
              currentStock: item.quantity,
              unit: item.unit,
              threshold: item.lowStockThreshold || 5
            }
          });
        }
      });

      if (newNotifications.length > 0) {
        const updated = [...newNotifications, ...existingNotifs];
        saveNotifications(updated);
      }
    } catch (error) {
      console.error('Error checking inventory levels:', error);
    }
  };

  const markAsRead = (id: string) => {
    const updated = notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    );
    saveNotifications(updated);
  };

  const markAllAsRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    saveNotifications(updated);
    toast({
      title: 'Success',
      description: 'All notifications marked as read',
    });
  };

  const deleteNotification = (id: string) => {
    const updated = notifications.filter(n => n.id !== id);
    saveNotifications(updated);
    toast({
      title: 'Success',
      description: 'Notification deleted',
    });
  };

  const clearAll = () => {
    if (confirm('Are you sure you want to clear all notifications?')) {
      saveNotifications([]);
      toast({
        title: 'Success',
        description: 'All notifications cleared',
      });
    }
  };

  const refresh = () => {
    checkInventoryLevels();
    toast({
      title: 'Refreshed',
      description: 'Notifications updated',
    });
  };

  // Show all notifications (both read and unread)
  const unreadCount = notifications.filter(n => !n.read).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'low-stock':
        return Package;
      case 'order':
        return ShoppingCart;
      case 'reservation':
        return Calendar;
      case 'system':
        return Bell;
      default:
        return Bell;
    }
  };

  const getNotificationColor = (priority: string, read: boolean) => {
    if (read) return 'bg-gray-50 border-gray-200';
    
    switch (priority) {
      case 'high':
        return 'bg-red-50 border-red-200';
      case 'medium':
        return 'bg-yellow-50 border-yellow-200';
      case 'low':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gray-100 rounded-xl">
              <Bell className="h-8 w-8 text-gray-700" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
              <p className="text-gray-600">{unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={refresh} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            {unreadCount > 0 && (
              <Button onClick={markAllAsRead} variant="outline" size="sm">
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark All Read
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <Card className="shadow-sm rounded-xl overflow-hidden">
        <CardHeader className="bg-white border-b border-gray-200">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-lg">
                <Bell className="h-4 w-4 text-gray-700" />
              </div>
              <span className="text-base font-bold text-gray-900">All Notifications</span>
            </div>
            {notifications.length > 0 && (
              <Button 
                onClick={clearAll} 
                variant="outline" 
                size="sm" 
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear All
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {notifications.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="h-16 w-16 text-green-400 mx-auto mb-4" />
              <p className="text-gray-900 font-semibold mb-2">All caught up!</p>
              <p className="text-sm text-gray-500">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {notifications.map((notification) => {
                const Icon = getNotificationIcon(notification.type);
                const colorClass = getNotificationColor(notification.priority, notification.read);
                
                return (
                  <div
                    key={notification.id}
                    className={`p-4 transition-colors border-l-4 ${
                      notification.read 
                        ? 'bg-gray-50 border-l-gray-300 opacity-60' 
                        : 'bg-white hover:bg-gray-50 border-l-red-500'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${
                        notification.read ? 'bg-gray-200' : 'bg-red-100'
                      }`}>
                        <Icon className={`h-5 w-5 ${
                          notification.read ? 'text-gray-500' : 'text-red-600'
                        }`} />
                      </div>

                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className={`font-semibold text-sm ${
                                notification.read ? 'text-gray-600' : 'text-gray-900'
                              }`}>
                                {notification.title}
                              </h3>
                              {!notification.read && (
                                <span className="px-2 py-0.5 bg-red-600 text-white text-xs rounded-full font-medium">
                                  New
                                </span>
                              )}
                              {notification.read && (
                                <span className="px-2 py-0.5 bg-gray-300 text-gray-600 text-xs rounded-full font-medium">
                                  Read
                                </span>
                              )}
                            </div>
                            <p className={`text-sm ${
                              notification.read ? 'text-gray-500' : 'text-gray-600'
                            }`}>
                              {notification.message}
                            </p>
                          </div>
                        </div>

                        {/* Show related data for low stock */}
                        {notification.type === 'low-stock' && notification.relatedData && (
                          <div className="mt-2 flex items-center gap-4 text-xs text-gray-600">
                            <span>
                              Stock: <span className={`font-semibold ${
                                notification.read ? 'text-gray-600' : 'text-red-600'
                              }`}>{notification.relatedData.currentStock} {notification.relatedData.unit}</span>
                            </span>
                            <span>
                              Threshold: <span className="font-semibold text-gray-900">{notification.relatedData.threshold} {notification.relatedData.unit}</span>
                            </span>
                          </div>
                        )}

                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Clock className="h-3 w-3" />
                            {new Date(notification.timestamp).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>

                          {!notification.read && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="text-xs font-medium text-blue-600 hover:text-blue-700"
                            >
                              Mark as Read
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

