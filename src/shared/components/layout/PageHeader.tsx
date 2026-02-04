"use client";

import React from 'react';
import { cn } from '@/server/lib/utils';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Bell, Search, Settings, HelpCircle, ChevronRight } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: Array<{
    label: string;
    href?: string;
  }>;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({ 
  title, 
  subtitle, 
  breadcrumbs, 
  actions, 
  className 
}: PageHeaderProps) {
  return (
    <div className={cn(
      "bg-white/80 backdrop-blur-xl border-b border-slate-200/80 shadow-sm",
      "sticky top-0 z-30 mb-6",
      className
    )}>
      <div className="px-6 py-4">
        {/* Simple Breadcrumbs */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <div className="flex items-center space-x-2 mb-3 text-sm">
            {breadcrumbs.map((crumb, index) => (
              <React.Fragment key={index}>
                <span className={cn(
                  index === breadcrumbs.length - 1 
                    ? "text-slate-800 font-medium" 
                    : "text-slate-600 hover:text-slate-800 cursor-pointer"
                )}>
                  {crumb.label}
                </span>
                {index < breadcrumbs.length - 1 && (
                  <ChevronRight className="w-3 h-3 text-slate-400" />
                )}
              </React.Fragment>
            ))}
          </div>
        )}

        {/* Header Content */}
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
              {title}
            </h1>
            {subtitle && (
              <p className="text-slate-600 mt-1 text-sm font-medium">
                {subtitle}
              </p>
            )}
          </div>

          {/* Quick Actions */}
          <div className="flex items-center space-x-3">
            {/* Search */}
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg"
            >
              <Search className="w-4 h-4" />
            </Button>

            {/* Notifications */}
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg relative"
            >
              <Bell className="w-4 h-4" />
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 w-4 h-4 p-0 text-xs"
              >
                3
              </Badge>
            </Button>

            {/* Help */}
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg"
            >
              <HelpCircle className="w-4 h-4" />
            </Button>

            {/* Settings */}
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg"
            >
              <Settings className="w-4 h-4" />
            </Button>

            {/* Custom Actions */}
            {actions}
          </div>
        </div>
      </div>
    </div>
  );
}
