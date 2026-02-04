'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
import { 
  X,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Package,
  Cloud,
  ChefHat,
  Leaf,
  CheckCircle,
  Clock,
  Info
} from 'lucide-react';
import { cn } from '@/shared/utils/cn';

export interface SmartChefNotification {
  id: string;
  type: 'forecast' | 'demand' | 'variance' | 'stock' | 'weather' | 'waste' | 'efficiency' | 'surplus' | 'dish-flag' | 'co2';
  title: string;
  message: string;
  timestamp: Date;
  priority: 'high' | 'medium' | 'low';
  actionRequired?: boolean;
}

interface SmartChefNotificationsProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: SmartChefNotification[];
}

const getNotificationIcon = (type: SmartChefNotification['type']) => {
  switch (type) {
    case 'forecast':
      return <Clock className="w-5 h-5 text-blue-600" />;
    case 'demand':
      return <TrendingDown className="w-5 h-5 text-orange-600" />;
    case 'variance':
      return <AlertTriangle className="w-5 h-5 text-red-600" />;
    case 'stock':
      return <Package className="w-5 h-5 text-yellow-600" />;
    case 'weather':
      return <Cloud className="w-5 h-5 text-gray-600" />;
    case 'waste':
      return <ChefHat className="w-5 h-5 text-purple-600" />;
    case 'efficiency':
      return <CheckCircle className="w-5 h-5 text-green-600" />;
    case 'surplus':
      return <TrendingUp className="w-5 h-5 text-indigo-600" />;
    case 'dish-flag':
      return <AlertTriangle className="w-5 h-5 text-red-600" />;
    case 'co2':
      return <Leaf className="w-5 h-5 text-emerald-600" />;
    default:
      return <Info className="w-5 h-5 text-gray-600" />;
  }
};

const getNotificationStyles = (type: SmartChefNotification['type'], priority: SmartChefNotification['priority']) => {
  // No special styles, just clean layout
  return "";
};

const formatTimeAgo = (date: Date) => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return date.toLocaleDateString();
};

export function SmartChefNotifications({ isOpen, onClose, notifications }: SmartChefNotificationsProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div className={cn(
        "fixed top-0 right-0 h-full w-[420px] bg-white shadow-2xl z-50 transition-transform duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-gray-200 bg-white">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                <ChefHat className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-gray-900">SmartChefBot</h2>
                <p className="text-xs text-gray-500 mt-0.5">Forecast & Waste Alerts</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0 hover:bg-gray-100"
              >
                <X className="w-4 h-4 text-gray-500" />
              </Button>
            </div>
          </div>

          {/* Notifications List */}
          <ScrollArea className="flex-1">
            <div className="p-5 space-y-3">
              {notifications.length === 0 ? (
                <div className="text-center py-20">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ChefHat className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-900 text-sm font-medium">No notifications</p>
                  <p className="text-gray-500 text-xs mt-1">All clear! No alerts at the moment.</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div 
                    key={notification.id}
                    className="border-b border-gray-200 pb-4 last:border-b-0 last:pb-0 transition-colors hover:bg-gray-50 -mx-5 px-5 py-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 mb-1.5">
                          <h4 className="font-semibold text-sm text-gray-900 leading-tight">
                            {notification.title}
                          </h4>
                          {notification.priority === 'high' && (
                            <Badge variant="destructive" className="text-xs font-semibold shrink-0">Urgent</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed mb-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-gray-500 font-medium">
                            {formatTimeAgo(notification.timestamp)}
                          </span>
                          {notification.actionRequired && (
                            <Badge variant="outline" className="text-xs font-medium border-orange-500 text-orange-700">
                              Action Needed
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </>
  );
}

