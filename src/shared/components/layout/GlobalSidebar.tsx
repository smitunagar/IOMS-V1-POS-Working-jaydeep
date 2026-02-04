"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/server/lib/utils';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/components/ui/tooltip';
import { 
  ChevronDown, 
  ChevronRight, 
  Menu, 
  X,
  Sparkles,
  LogOut,
  Building2,
  UtensilsCrossed,
  ChevronLeft
} from 'lucide-react';
import { sidebarConfig, SidebarState, defaultSidebarState, SidebarItem } from '@/config/sidebarConfig';

interface GlobalSidebarProps {
  className?: string;
}

export function GlobalSidebar({ className }: GlobalSidebarProps) {
  const pathname = usePathname();
  const [sidebarState, setSidebarState] = useState<SidebarState>(defaultSidebarState);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Load sidebar state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('ioms-sidebar-state');
    if (savedState) {
      setSidebarState(JSON.parse(savedState));
    }
  }, []);

  // Save sidebar state to localStorage and trigger layout update
  useEffect(() => {
    localStorage.setItem('ioms-sidebar-state', JSON.stringify(sidebarState));
    
    // Trigger a custom event to notify other components
    window.dispatchEvent(new CustomEvent('sidebar-state-changed', { 
      detail: sidebarState 
    }));
    
    // Force layout recalculation
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 50);
  }, [sidebarState]);

  const toggleCollapsed = () => {
    setSidebarState(prev => ({ ...prev, isCollapsed: !prev.isCollapsed }));
  };

  const toggleModule = (moduleId: string) => {
    setSidebarState(prev => ({
      ...prev,
      expandedModules: prev.expandedModules.includes(moduleId)
        ? prev.expandedModules.filter(id => id !== moduleId)
        : [...prev.expandedModules, moduleId]
    }));
  };

  const isItemActive = (item: SidebarItem): boolean => {
    if (item.route) {
      return pathname === item.route || pathname.startsWith(item.route + '/');
    }
    return false;
  };

  const hasActiveChild = (items: SidebarItem[]): boolean => {
    return items.some(item => isItemActive(item) || (item.children && hasActiveChild(item.children)));
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-slate-900">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900 backdrop-blur-sm">
        {!sidebarState.isCollapsed && (
          <Link href="/" className="flex items-center space-x-3 cursor-pointer hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-md">
              <UtensilsCrossed className="w-6 h-6 text-white" />
            </div>
            <span className="font-black text-xl text-white">IOMS</span>
          </Link>
        )}
        {sidebarState.isCollapsed && (
          <Link href="/" className="cursor-pointer hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-md">
              <UtensilsCrossed className="w-6 h-6 text-white" />
            </div>
          </Link>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleCollapsed}
          className="hidden lg:flex hover:bg-slate-800 text-white hover:text-white rounded-lg"
        >
          {sidebarState.isCollapsed ? <ChevronRight className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsMobileOpen(false)}
          className="lg:hidden hover:bg-slate-800 text-white hover:text-white rounded-lg"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-3">
        {sidebarConfig.map((module) => {
          const isExpanded = sidebarState.expandedModules.includes(module.id);
          const moduleHasActive = hasActiveChild(module.items);
          const isCollapsible = module.isCollapsible !== false;

          return (
            <div key={module.id} className="space-y-2">
              {/* Module Header - only show for collapsible modules */}
              {!sidebarState.isCollapsed && isCollapsible && (
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-between text-sm font-bold rounded-lg px-3 py-2.5 transition-all duration-200",
                    moduleHasActive 
                      ? "text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 border border-purple-500/50" 
                      : "text-white hover:text-white hover:bg-slate-800"
                  )}
                  onClick={() => toggleModule(module.id)}
                >
                  <span className="uppercase tracking-wide text-xs font-bold">{module.title}</span>
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 transition-transform duration-200" />
                  ) : (
                    <ChevronRight className="w-4 h-4 transition-transform duration-200" />
                  )}
                </Button>
              )}

              {/* Module Items */}
              {(isExpanded || sidebarState.isCollapsed || !isCollapsible) && (
                <div className="space-y-1 ml-2">
                  {module.items.map((item) => {
                    const isActive = isItemActive(item);
                    
                    if (sidebarState.isCollapsed) {
                      return (
                        <TooltipProvider key={item.id}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Link href={item.route || '#'}>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className={cn(
                                    "w-full justify-center relative p-3 rounded-xl transition-all duration-200 group",
                                    isActive 
                                      ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30" 
                                      : "text-white hover:text-white hover:bg-slate-800 hover:shadow-md"
                                  )}
                                >
                                  <item.icon className={cn(
                                    "w-5 h-5 transition-transform duration-200",
                                    !isActive && "group-hover:scale-110"
                                  )} />
                                  {item.badge && (
                                    <Badge 
                                      variant="destructive" 
                                      className="absolute -top-1 -right-1 w-5 h-5 p-0 text-xs shadow-sm"
                                    >
                                      {item.badge}
                                    </Badge>
                                  )}
                                  {item.isNew && (
                                    <Sparkles className="absolute -top-1 -right-1 w-3 h-3 text-amber-500" />
                                  )}
                                </Button>
                              </Link>
                            </TooltipTrigger>
            <TooltipContent side="right" className="bg-slate-800 text-white border-slate-700">
              <p className="font-medium">{item.title}</p>
            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      );
                    }

                    return (
                      <Link key={item.id} href={item.route || '#'}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={cn(
                            "w-full justify-start space-x-3 text-sm font-semibold rounded-lg px-3 py-2.5 transition-all duration-200 group",
                            isActive 
                              ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30" 
                              : "text-white hover:text-white hover:bg-slate-800 hover:shadow-md"
                          )}
                        >
                          <item.icon className={cn(
                            "w-4 h-4 transition-transform duration-200",
                            !isActive && "group-hover:scale-110"
                          )} />
                          <span className="flex-1 text-left font-semibold">{item.title}</span>
                          <div className="flex items-center space-x-1">
                            {item.badge && (
                              <Badge 
                                variant={isActive ? "secondary" : "destructive"}
                                className="text-xs shadow-sm"
                              >
                                {item.badge}
                              </Badge>
                            )}
                            {item.isNew && (
                              <Sparkles className="w-4 h-4 text-amber-500" />
                            )}
                          </div>
                        </Button>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer with User Profile */}
      <div className="p-4 border-t border-slate-800 bg-slate-900 backdrop-blur-sm">
        {!sidebarState.isCollapsed ? (
          <div className="flex items-center justify-between space-x-3">
            {/* Compact User Profile */}
            <div className="flex items-center space-x-2 flex-1 min-w-0">
              <div className="w-7 h-7 bg-gradient-to-br from-slate-700 to-slate-900 text-white rounded-lg flex items-center justify-center text-xs font-bold shadow-sm">
                A
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-white truncate">Admin User</p>
                <p className="text-xs text-slate-400 truncate">admin@ioms.com</p>
              </div>
            </div>
            
            {/* Logout Button */}
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:text-white hover:bg-slate-800 rounded-lg px-2 py-1.5 transition-all duration-200"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-center p-3 rounded-xl transition-all duration-200 hover:bg-slate-800 hover:shadow-md"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-slate-700 to-slate-900 text-white rounded-lg flex items-center justify-center text-xs font-bold shadow-md">
                    A
                  </div>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" className="bg-slate-900 text-white border-slate-700">
                <p className="font-medium">Admin User</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Toggle */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsMobileOpen(true)}
        className="fixed top-4 left-4 z-50 lg:hidden bg-white shadow-lg hover:shadow-xl border border-slate-200 rounded-lg"
      >
        <Menu className="w-5 h-5" />
      </Button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed left-0 top-0 z-50 h-screen transition-all duration-300 ease-in-out",
        "bg-slate-900 backdrop-blur-xl border-r border-slate-800 shadow-xl shadow-black/20",
        sidebarState.isCollapsed ? "w-20" : "w-80",
        isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        className
      )}>
        <SidebarContent />
      </aside>
    </>
  );
}
