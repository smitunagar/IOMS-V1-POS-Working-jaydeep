'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { 
  AlertTriangle, 
  TrendingDown, 
  AlertCircle, 
  Package, 
  TrendingUp, 
  Menu,
  X,
  ChevronDown,
  ChevronUp,
  ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNotifications, Notification } from '@/shared/hooks/useNotifications';

interface NotificationPanelProps {
  className?: string;
  maxVisible?: number;
}

const getNotificationIcon = (type: Notification['type']) => {
  switch (type) {
    case 'slow-moving':
      return <TrendingDown className="w-4 h-4" />;
    case 'waste-alert':
      return <AlertTriangle className="w-4 h-4" />;
    case 'stock-warning':
      return <Package className="w-4 h-4" />;
    case 'upsell':
      return <TrendingUp className="w-4 h-4" />;
    case 'excess-items':
      return <Menu className="w-4 h-4" />;
    default:
      return <AlertCircle className="w-4 h-4" />;
  }
};

const getNotificationStyles = (type: Notification['type'], priority: Notification['priority']) => {
  const baseStyles = "border-l-4";
  
  switch (type) {
    case 'slow-moving':
      return `${baseStyles} border-l-orange-500 bg-orange-50/50`;
    case 'waste-alert':
      return `${baseStyles} border-l-red-500 bg-red-50/50`;
    case 'stock-warning':
      return `${baseStyles} border-l-yellow-500 bg-yellow-50/50`;
    case 'upsell':
      return `${baseStyles} border-l-green-500 bg-green-50/50`;
    case 'excess-items':
      return `${baseStyles} border-l-blue-500 bg-blue-50/50`;
    default:
      return `${baseStyles} border-l-gray-500 bg-gray-50/50`;
  }
};

const getPriorityBadge = (priority: Notification['priority']) => {
  switch (priority) {
    case 'high':
      return <Badge variant="destructive" className="text-xs">High</Badge>;
    case 'medium':
      return <Badge variant="secondary" className="text-xs">Medium</Badge>;
    case 'low':
      return <Badge variant="outline" className="text-xs">Low</Badge>;
    default:
      return null;
  }
};

export function NotificationPanel({ className, maxVisible = 3 }: NotificationPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const {
    activeNotifications,
    highPriorityCount,
    dismissNotification,
    dismissAll,
  } = useNotifications();

  if (activeNotifications.length === 0) {
    return null;
  }

  return (
    <Card className={cn("w-full shadow-sm border-0 bg-gradient-to-r from-slate-50 to-gray-50", className)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <AlertCircle className="w-4 h-4 text-slate-600" />
              <span className="font-semibold text-slate-800 text-sm">
                Smart Alerts
              </span>
            </div>
            {highPriorityCount > 0 && (
              <Badge variant="destructive" className="text-xs animate-pulse">
                {highPriorityCount} urgent
              </Badge>
            )}
            <Badge variant="outline" className="text-xs">
              {activeNotifications.length} total
            </Badge>
          </div>
          
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-6 w-6 p-0 hover:bg-slate-200"
            >
              {isExpanded ? (
                <ChevronUp className="w-3 h-3" />
              ) : (
                <ChevronDown className="w-3 h-3" />
              )}
            </Button>
            {activeNotifications.length > 1 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={dismissAll}
                className="h-6 px-2 text-xs text-slate-500 hover:text-slate-700"
              >
                Dismiss All
              </Button>
            )}
          </div>
        </div>

        {isExpanded && (
          <div className="space-y-2">
            {activeNotifications.slice(0, maxVisible).map((notification) => (
              <div
                key={notification.id}
                className={cn(
                  "p-3 rounded-lg transition-all duration-200 hover:shadow-sm",
                  getNotificationStyles(notification.type, notification.priority)
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 flex-1">
                    <div className="text-slate-600 mt-0.5">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-slate-800 text-sm">
                          {notification.title}
                        </span>
                        {getPriorityBadge(notification.priority)}
                        {notification.actionRequired && (
                          <Badge variant="outline" className="text-xs border-orange-300 text-orange-700">
                            Action Required
                          </Badge>
                        )}
                      </div>
                      <p className="text-slate-600 text-xs leading-relaxed mb-2">
                        {notification.message}
                      </p>
                      {notification.actionRequired && notification.actionLabel && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={notification.onAction}
                          className="h-6 px-2 text-xs border-orange-300 text-orange-700 hover:bg-orange-50"
                        >
                          <ExternalLink className="w-3 h-3 mr-1" />
                          {notification.actionLabel}
                        </Button>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => dismissNotification(notification.id)}
                    className="h-6 w-6 p-0 text-slate-400 hover:text-slate-600 flex-shrink-0"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
            
            {activeNotifications.length > maxVisible && (
              <div className="text-center pt-2">
                <span className="text-xs text-slate-500">
                  +{activeNotifications.length - maxVisible} more notifications
                </span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
