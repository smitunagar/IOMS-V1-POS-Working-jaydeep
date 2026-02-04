"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import {
  ShoppingCart,
  Table,
  CreditCard,
  Sparkles,
  Boxes,
  UtensilsCrossed,
  History,
  Barcode,
  LogOut,
  Loader2,
  MessageSquareQuote,
  BarChart3,
  Calendar,
  User,
  Settings,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  Play,
  ToggleLeft,
  ToggleRight,
  Building2,
} from "lucide-react";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarInset,
  useSidebar,
} from "@/shared/components/ui/sidebar";
import { Button } from "@/shared/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/shared/components/ui/sheet";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription
} from '@/shared/components/ui/dialog';
import { Switch } from '@/shared/components/ui/switch';
import { cn } from "@/server/lib/utils";
import { useAuth } from "@/features/auth/AuthContext";
import { useWasteWatchDog } from "@/features/waste-watchdog/WasteWatchDogContext";
import { NotificationBell } from "./NotificationBell";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<any>;
}

const navItems: NavItem[] = [
  { href: "/menu-upload", label: "Menu Upload", icon: Boxes },
  { href: "/receptionist", label: "Receptionist", icon: User },
];

function SiteHeader({ pageTitle }: { pageTitle?: string }) {
  const { isMobile } = useSidebar();
  const { logout, currentUser } = useAuth();

  if (isMobile) {
    return (
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-4 border-b bg-white px-4 shadow-sm">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent className="w-64 p-0">
            <div className="flex h-full flex-col bg-gradient-to-b from-slate-50 to-slate-100">
              {/* Mobile sidebar content would go here */}
            </div>
          </SheetContent>
        </Sheet>
        <div className="flex items-center space-x-4">
          <h1 className="text-lg font-semibold text-gray-900">{pageTitle || "IOMS"}</h1>
        </div>
        <div className="flex items-center space-x-2">
          <NotificationBell />
          <Button variant="ghost" size="sm" onClick={logout}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>
    );
  }

  return (
    <header className="flex h-16 items-center justify-between border-b bg-white px-6 shadow-sm">
      <div className="flex items-center space-x-4">
        <SidebarTrigger className="text-gray-600 hover:text-gray-900" />
        <h1 className="text-xl font-semibold text-gray-900">{pageTitle || "IOMS Dashboard"}</h1>
      </div>
      <div className="flex items-center space-x-4">
        <NotificationBell />
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <User className="h-4 w-4" />
          <span>{currentUser?.email || 'User'}</span>
        </div>
        <Button variant="ghost" size="sm" onClick={logout} className="text-gray-600 hover:text-gray-900">
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline ml-2">Logout</span>
        </Button>
      </div>
    </header>
  );
}

export function EnterpriseLayout({
  children,
  pageTitle,
}: {
  children: React.ReactNode;
  pageTitle?: string;
}) {
  const pathname = usePathname();
  const { currentUser, isLoading, logout } = useAuth();
  const { isActive: isWasteWatchDogActive, toggleActive } = useWasteWatchDog();
  const router = useRouter();

  // Sidebar sections state
  const [sectionsOpen, setSectionsOpen] = useState({
    setup: false,
    orders: false,
    reservations: false,
    aiTool: false,
    inventory: false,
    wasteWatchDog: false,
  });

  // Module visibility state
  const [moduleVisibility, setModuleVisibility] = useState<Record<string, boolean>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('moduleVisibility');
      return saved ? JSON.parse(saved) : {
        WasteWatchDog: true,
        SmartInventory: true,
        SmartChef: true,
        Marketplace: true
      };
    }
    return {
      WasteWatchDog: true,
      SmartInventory: true,
      SmartChef: true,
      Marketplace: true
    };
  });

  const [settingsOpen, setSettingsOpen] = useState(false);

  // Toggle function for module visibility
  const toggleModuleVisibility = (moduleName: string) => {
    setModuleVisibility(prev => {
      const newVisibility = { ...prev, [moduleName]: !prev[moduleName] };
      localStorage.setItem('moduleVisibility', JSON.stringify(newVisibility));
      return newVisibility;
    });
  };

  // Toggle section expansion
  const toggleSection = (section: keyof typeof sectionsOpen) => {
    setSectionsOpen(prev => ({ ...prev, [section]: !prev[section] }));
  };

  useEffect(() => {
    if (!isLoading && !currentUser) {
      router.push('/login');
    }
  }, [currentUser, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          <p className="mt-2 text-gray-600">Loading IOMS...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return null;
  }

  return (
    <SidebarProvider>
      <Sidebar className="border-r-0 shadow-lg">
        <SidebarHeader className="border-b bg-gradient-to-r from-blue-600 to-indigo-600 p-4">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 backdrop-blur">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">IOMS</h2>
              <p className="text-xs text-blue-100">Enterprise Management</p>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent className="bg-gradient-to-b from-slate-50 to-slate-100">
          <SidebarMenu className="p-2 space-y-1">
            
            {/* Core Navigation */}
            <div className="mb-4">
              <div className="px-3 py-2">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Core Navigation</h3>
              </div>
              
              {/* Dashboard */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === '/'}
                  className={cn(
                    "w-full justify-start transition-all duration-200 rounded-lg",
                    pathname === '/'
                      ? "bg-blue-600 text-white shadow-md"
                      : "hover:bg-white hover:shadow-sm"
                  )}
                >
                  <Link href="/" className="flex items-center space-x-3 px-3 py-2">
                    <BarChart3 className="h-5 w-5 flex-shrink-0" />
                    <span className="font-medium">Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Menu Upload */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === '/menu-upload'}
                  className={cn(
                    "w-full justify-start transition-all duration-200 rounded-lg",
                    pathname === '/menu-upload'
                      ? "bg-blue-600 text-white shadow-md"
                      : "hover:bg-white hover:shadow-sm"
                  )}
                >
                  <Link href="/menu-upload" className="flex items-center space-x-3 px-3 py-2">
                    <Boxes className="h-5 w-5 flex-shrink-0" />
                    <span className="font-medium">Menu Upload</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Receptionist */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === '/receptionist'}
                  className={cn(
                    "w-full justify-start transition-all duration-200 rounded-lg",
                    pathname === '/receptionist'
                      ? "bg-blue-600 text-white shadow-md"
                      : "hover:bg-white hover:shadow-sm"
                  )}
                >
                  <Link href="/receptionist" className="flex items-center space-x-3 px-3 py-2">
                    <User className="h-5 w-5 flex-shrink-0" />
                    <span className="font-medium">Receptionist</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </div>

            {/* Business Operations */}
            <div className="mb-4">
              <div className="px-3 py-2">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Business Operations</h3>
              </div>

              {/* Reservations Section */}
              <SidebarMenuItem>
                <button
                  className={cn(
                    "flex w-full items-center justify-between rounded-lg px-3 py-2 text-left transition-all duration-200",
                    sectionsOpen.reservations 
                      ? "bg-white shadow-sm" 
                      : "hover:bg-white hover:shadow-sm"
                  )}
                  onClick={() => toggleSection('reservations')}
                >
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-purple-600" />
                    <span className="font-medium text-gray-900">Reservations</span>
                  </div>
                  {sectionsOpen.reservations ? (
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-gray-500" />
                  )}
                </button>
                {sectionsOpen.reservations && (
                  <div className="ml-8 mt-1 space-y-1">
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === '/table-management'}
                      className={cn(
                        "w-full justify-start text-sm",
                        pathname === '/table-management'
                          ? "bg-purple-100 text-purple-700 font-medium"
                          : "text-gray-600 hover:text-purple-600 hover:bg-purple-50"
                      )}
                    >
                      <Link href="/table-management" className="flex items-center space-x-2 px-3 py-1">
                        <Table className="h-4 w-4" />
                        <span>Table Management</span>
                      </Link>
                    </SidebarMenuButton>
                    
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === '/reservation-analytics'}
                      className={cn(
                        "w-full justify-start text-sm",
                        pathname === '/reservation-analytics'
                          ? "bg-purple-100 text-purple-700 font-medium"
                          : "text-gray-600 hover:text-purple-600 hover:bg-purple-50"
                      )}
                    >
                      <Link href="/reservation-analytics" className="flex items-center space-x-2 px-3 py-1">
                        <BarChart3 className="h-4 w-4" />
                        <span>Analytics</span>
                      </Link>
                    </SidebarMenuButton>
                  </div>
                )}
              </SidebarMenuItem>

              {/* Orders Section */}
              <SidebarMenuItem>
                <button
                  className={cn(
                    "flex w-full items-center justify-between rounded-lg px-3 py-2 text-left transition-all duration-200",
                    sectionsOpen.orders 
                      ? "bg-white shadow-sm" 
                      : "hover:bg-white hover:shadow-sm"
                  )}
                  onClick={() => toggleSection('orders')}
                >
                  <div className="flex items-center space-x-3">
                    <ShoppingCart className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-gray-900">Orders</span>
                  </div>
                  {sectionsOpen.orders ? (
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-gray-500" />
                  )}
                </button>
                {sectionsOpen.orders && (
                  <div className="ml-8 mt-1 space-y-1">
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === '/order-history'}
                      className={cn(
                        "w-full justify-start text-sm",
                        pathname === '/order-history'
                          ? "bg-green-100 text-green-700 font-medium"
                          : "text-gray-600 hover:text-green-600 hover:bg-green-50"
                      )}
                    >
                      <Link href="/order-history" className="flex items-center space-x-2 px-3 py-1">
                        <History className="h-4 w-4" />
                        <span>Order History</span>
                      </Link>
                    </SidebarMenuButton>
                    
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === '/order-analytics'}
                      className={cn(
                        "w-full justify-start text-sm",
                        pathname === '/order-analytics'
                          ? "bg-green-100 text-green-700 font-medium"
                          : "text-gray-600 hover:text-green-600 hover:bg-green-50"
                      )}
                    >
                      <Link href="/order-analytics" className="flex items-center space-x-2 px-3 py-1">
                        <BarChart3 className="h-4 w-4" />
                        <span>Analytics</span>
                      </Link>
                    </SidebarMenuButton>
                  </div>
                )}
              </SidebarMenuItem>

              {/* Inventory Section */}
              <SidebarMenuItem>
                <button
                  className={cn(
                    "flex w-full items-center justify-between rounded-lg px-3 py-2 text-left transition-all duration-200",
                    sectionsOpen.inventory 
                      ? "bg-white shadow-sm" 
                      : "hover:bg-white hover:shadow-sm"
                  )}
                  onClick={() => toggleSection('inventory')}
                >
                  <div className="flex items-center space-x-3">
                    <Boxes className="h-5 w-5 text-blue-600" />
                    <span className="font-medium text-gray-900">Inventory</span>
                  </div>
                  {sectionsOpen.inventory ? (
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-gray-500" />
                  )}
                </button>
                {sectionsOpen.inventory && (
                  <div className="ml-8 mt-1 space-y-1">
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === '/inventory'}
                      className={cn(
                        "w-full justify-start text-sm",
                        pathname === '/inventory'
                          ? "bg-blue-100 text-blue-700 font-medium"
                          : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                      )}
                    >
                      <Link href="/inventory" className="flex items-center space-x-2 px-3 py-1">
                        <Boxes className="h-4 w-4" />
                        <span>Inventory Management</span>
                      </Link>
                    </SidebarMenuButton>
                    
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === '/barcode-scanner'}
                      className={cn(
                        "w-full justify-start text-sm",
                        pathname === '/barcode-scanner'
                          ? "bg-blue-100 text-blue-700 font-medium"
                          : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                      )}
                    >
                      <Link href="/barcode-scanner" className="flex items-center space-x-2 px-3 py-1">
                        <Barcode className="h-4 w-4" />
                        <span>Barcode Scanner</span>
                      </Link>
                    </SidebarMenuButton>

                    <SidebarMenuButton
                      asChild
                      isActive={pathname === '/inventory-analytics'}
                      className={cn(
                        "w-full justify-start text-sm",
                        pathname === '/inventory-analytics'
                          ? "bg-blue-100 text-blue-700 font-medium"
                          : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                      )}
                    >
                      <Link href="/inventory-analytics" className="flex items-center space-x-2 px-3 py-1">
                        <BarChart3 className="h-4 w-4" />
                        <span>Analytics</span>
                      </Link>
                    </SidebarMenuButton>
                  </div>
                )}
              </SidebarMenuItem>
            </div>

            {/* Specialized Modules */}
            {(moduleVisibility['WasteWatchDog'] || isWasteWatchDogActive) && (
              <div className="mb-4">
                <div className="px-3 py-2">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Specialized Modules</h3>
                </div>

                {/* WasteWatchDog */}
                {moduleVisibility['WasteWatchDog'] && (
                  <SidebarMenuItem>
                    <div className="space-y-2">
                      {/* WasteWatchDog Toggle */}
                      <div className="flex items-center justify-between px-3 py-2 bg-white rounded-lg shadow-sm">
                        <div className="flex items-center space-x-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-green-500 to-emerald-500">
                            <UtensilsCrossed className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <span className="font-medium text-gray-900">WasteWatchDog</span>
                            <p className="text-xs text-gray-500">AI-Powered Waste Analysis</p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={toggleActive}
                          className={cn(
                            "px-3 py-1 text-xs rounded-full transition-all duration-200",
                            isWasteWatchDogActive
                              ? "bg-green-100 text-green-700 hover:bg-green-200"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          )}
                        >
                          <Play className={cn("h-3 w-3 mr-1", isWasteWatchDogActive && "text-green-600")} />
                          {isWasteWatchDogActive ? 'Active' : 'Launch'}
                        </Button>
                      </div>

                      {/* WasteWatchDog Menu Items */}
                      {isWasteWatchDogActive && (
                        <div className="ml-11 space-y-1">
                          <SidebarMenuButton
                            asChild
                            isActive={pathname === '/apps/waste-watchdog'}
                            className={cn(
                              "w-full justify-start text-sm",
                              pathname === '/apps/waste-watchdog'
                                ? "bg-green-100 text-green-700 font-medium"
                                : "text-gray-600 hover:text-green-600 hover:bg-green-50"
                            )}
                          >
                            <Link href="/apps/waste-watchdog" className="flex items-center space-x-2 px-3 py-1">
                              <BarChart3 className="h-4 w-4" />
                              <span>Main Dashboard</span>
                            </Link>
                          </SidebarMenuButton>
                          
                          <SidebarMenuButton
                            asChild
                            isActive={pathname === '/apps/waste-watchdog/analytics'}
                            className={cn(
                              "w-full justify-start text-sm",
                              pathname === '/apps/waste-watchdog/analytics'
                                ? "bg-green-100 text-green-700 font-medium"
                                : "text-gray-600 hover:text-green-600 hover:bg-green-50"
                            )}
                          >
                            <Link href="/apps/waste-watchdog/analytics" className="flex items-center space-x-2 px-3 py-1">
                              <Sparkles className="h-4 w-4" />
                              <span>AI Analytics</span>
                            </Link>
                          </SidebarMenuButton>

                          <SidebarMenuButton
                            asChild
                            isActive={pathname === '/apps/waste-watchdog/compliance'}
                            className={cn(
                              "w-full justify-start text-sm",
                              pathname === '/apps/waste-watchdog/compliance'
                                ? "bg-green-100 text-green-700 font-medium"
                                : "text-gray-600 hover:text-green-600 hover:bg-green-50"
                            )}
                          >
                            <Link href="/apps/waste-watchdog/compliance" className="flex items-center space-x-2 px-3 py-1">
                              <User className="h-4 w-4" />
                              <span>Compliance Center</span>
                            </Link>
                          </SidebarMenuButton>

                          <SidebarMenuButton
                            asChild
                            isActive={pathname === '/apps/waste-watchdog/predictive'}
                            className={cn(
                              "w-full justify-start text-sm",
                              pathname === '/apps/waste-watchdog/predictive'
                                ? "bg-green-100 text-green-700 font-medium"
                                : "text-gray-600 hover:text-green-600 hover:bg-green-50"
                            )}
                          >
                            <Link href="/apps/waste-watchdog/predictive" className="flex items-center space-x-2 px-3 py-1">
                              <BarChart3 className="h-4 w-4" />
                              <span>Predictive Analytics</span>
                            </Link>
                          </SidebarMenuButton>
                        </div>
                      )}
                    </div>
                  </SidebarMenuItem>
                )}
              </div>
            )}

            {/* Setup Section */}
            <div className="mb-4">
              <div className="px-3 py-2">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Setup</h3>
              </div>

              {/* Dining Area Setup */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === '/dining-area-setup'}
                  className={cn(
                    "w-full justify-start transition-all duration-200 rounded-lg",
                    pathname === '/dining-area-setup'
                      ? "bg-blue-600 text-white shadow-md"
                      : "hover:bg-white hover:shadow-sm"
                  )}
                >
                  <Link href="/dining-area-setup" className="flex items-center space-x-3 px-3 py-2">
                    <Table className="h-5 w-5 flex-shrink-0" />
                    <span className="font-medium">Dining Area Setup</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* System Settings */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === '/system-settings'}
                  className={cn(
                    "w-full justify-start transition-all duration-200 rounded-lg",
                    pathname === '/system-settings'
                      ? "bg-blue-600 text-white shadow-md"
                      : "hover:bg-white hover:shadow-sm"
                  )}
                >
                  <Link href="/system-settings" className="flex items-center space-x-3 px-3 py-2">
                    <Settings className="h-5 w-5 flex-shrink-0" />
                    <span className="font-medium">System Settings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </div>

            {/* Module Settings */}
            <div className="mt-auto pt-4 border-t border-gray-200">
              <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
                <DialogTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full justify-start text-gray-600 hover:text-gray-900 hover:bg-white"
                  >
                    <Settings className="w-4 h-4 mr-3" />
                    Module Settings
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Settings className="w-5 h-5" />
                      Module Visibility Settings
                    </DialogTitle>
                    <DialogDescription>
                      Control which specialized modules appear in your sidebar. Core navigation is always visible.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-green-500 to-emerald-500">
                          <UtensilsCrossed className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <div className="font-medium">WasteWatchDog</div>
                          <div className="text-sm text-gray-500">AI waste analysis</div>
                        </div>
                      </div>
                      <Switch
                        checked={moduleVisibility['WasteWatchDog'] !== false}
                        onCheckedChange={() => toggleModuleVisibility('WasteWatchDog')}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500">
                          <Boxes className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <div className="font-medium">SmartInventory</div>
                          <div className="text-sm text-gray-500">AI optimization</div>
                        </div>
                      </div>
                      <Switch
                        checked={moduleVisibility['SmartInventory'] !== false}
                        onCheckedChange={() => toggleModuleVisibility('SmartInventory')}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-orange-500 to-red-500">
                          <UtensilsCrossed className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <div className="font-medium">SmartChef</div>
                          <div className="text-sm text-gray-500">Recipe management</div>
                        </div>
                      </div>
                      <Switch
                        checked={moduleVisibility['SmartChef'] !== false}
                        onCheckedChange={() => toggleModuleVisibility('SmartChef')}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-purple-500 to-pink-500">
                          <Building2 className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <div className="font-medium">Marketplace</div>
                          <div className="text-sm text-gray-500">Browse apps</div>
                        </div>
                      </div>
                      <Switch
                        checked={moduleVisibility['Marketplace'] !== false}
                        onCheckedChange={() => toggleModuleVisibility('Marketplace')}
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end pt-4 border-t">
                    <Button 
                      variant="outline" 
                      onClick={() => setSettingsOpen(false)}
                    >
                      Done
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>

      <SidebarInset className="flex flex-col">
        <SiteHeader pageTitle={pageTitle} />
        <main className="flex-1 overflow-auto bg-gray-50 p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
