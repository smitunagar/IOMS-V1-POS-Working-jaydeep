"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  UtensilsCrossed,
  LogOut, 
  Loader2,
  BarChart3,
  User,
  Settings,
  LayoutDashboard,
  Package,
  Wrench,
  CalendarDays,
  ShoppingCart,
  ChefHat,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/server/lib/utils";
import { useAuth } from "@/features/auth/AuthContext";
import React from "react";

export function AppLayout({
  children,
  pageTitle,
}: {
  children: React.ReactNode;
  pageTitle?: string;
}) {
  const pathname = usePathname();
  const { currentUser, isLoading, logout } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!isLoading && !currentUser) {
      router.push('/login');
    }
  }, [currentUser, isLoading, router]);

  if (isLoading || !currentUser) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-xl">Loading application...</p>
      </div>
    );
  }

  // Check if we're in mensa-ioms section
  const isMensaIOMS = pathname?.startsWith('/mensa-ioms');

  // Menu items configuration
  const allMenuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', route: '/dashboard' },
    { icon: User, label: 'Reception', route: '/receptionist' },
    { icon: CalendarDays, label: 'Bookings', route: '/reservations' },
    { icon: ShoppingCart, label: 'Orders', route: isMensaIOMS ? '/mensa-ioms/orders' : '/orders' },
    { icon: Package, label: 'Inventory', route: '/inventory-hub' },
    { icon: BarChart3, label: 'WasteWatchDog', route: '/apps-waste-watchdog' },
    { icon: Wrench, label: 'Setup', route: '/setup' },
    { icon: Settings, label: 'Settings', route: '/settings' },
  ];

  // Menu items specific to mensa-ioms
  const mensaMenuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', route: '/mensa-ioms/dashboard' },
    { icon: ShoppingCart, label: 'Orders', route: '/mensa-ioms/orders' },
    { icon: ShieldCheck, label: 'HACCP', route: '/mensa-ioms/haccp' },
    { icon: Settings, label: 'Settings', route: '/mensa-ioms/settings' },
  ];

  // Use mensa menu items for mensa-ioms, otherwise use all menu items
  const menuItems = isMensaIOMS ? mensaMenuItems : allMenuItems;

  const isActive = (route: string) => {
    if (route === '#') return false;
    if (route === '/dashboard') return pathname === '/dashboard';
    if (route === '/mensa-ioms/dashboard') return pathname === '/mensa-ioms/dashboard' || pathname === '/mensa-ioms';
    if (route === '/receptionist') return pathname === '/receptionist';
    if (route === '/reservations') return pathname === '/reservations' || pathname === '/table-management' || pathname === '/reservation-history' || pathname === '/reservation-analytics';
    if (route === '/orders' || route === '/mensa-ioms/orders') {
      // Check mensa orders first
      if (pathname === '/mensa-ioms/orders') {
        return route === '/mensa-ioms/orders';
      }
      // Check regular orders
      if (pathname === '/orders' || pathname === '/order-history' || pathname === '/order-analytics') {
        return route === '/orders';
      }
      return false;
    }
    if (route === '/inventory-hub') return pathname === '/inventory-hub' || pathname === '/inventory' || pathname === '/serving-availability' || pathname === '/inventory-analytics' || pathname === '/barcode-scanner';
    if (route === '/apps-waste-watchdog') return pathname === '/apps-waste-watchdog';
    if (route === '/mensa-ioms/haccp') return pathname === '/mensa-ioms/haccp' || pathname?.startsWith('/mensa-ioms/haccp/');
    if (route === '/mensa-ioms/menu-management') return pathname === '/mensa-ioms/menu-management' || pathname?.startsWith('/mensa-ioms/menu-management/');
    if (route === '/mensa-ioms/settings') return pathname === '/mensa-ioms/settings' || pathname?.startsWith('/mensa-ioms/settings/');
    if (route === '/setup') return pathname === '/setup' || pathname === '/inventory-management' || pathname === '/menu-upload' || pathname === '/menu-edit' || pathname === '/inventory-update' || pathname === '/dining-area-setup';
    if (route === '/settings') return pathname === '/settings' || pathname === '/user-management';
    return false;
  };

  // Get user initials
  const getUserInitials = () => {
    if (currentUser?.email) {
      const parts = currentUser.email.split('@')[0].split('.');
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return currentUser.email.charAt(0).toUpperCase() + (currentUser.email.charAt(1) || '').toUpperCase();
    }
    return 'MA';
  };

  return (
    <div className="flex h-screen bg-[#F5F5F7] font-sans text-wm-blue">
      {/* Sidebar - Deep Blue Gradient Rail */}
      <aside className="w-28 bg-gradient-to-b from-[#1B1F3B] via-[#242A4A] to-[#1B1F3B] flex flex-col fixed h-full z-30 shadow-2xl items-center py-6 border-r border-white/5">
        {/* IOMS Logo Icon - Brand Colors */}
        <Link href="/" className="flex flex-col items-center gap-2 mb-6 group cursor-pointer">
          <div className="w-12 h-12 flex items-center justify-center bg-wm-teal rounded-2xl shadow-lg border border-white/10 group-hover:bg-[#238b7e] transition-all duration-300">
            <UtensilsCrossed className="w-6 h-6 text-white" strokeWidth={2.5} />
          </div>
          {/* IOMS Text Brand */}
          <span className="text-white font-headline font-black text-sm tracking-widest opacity-80 group-hover:opacity-100 transition-opacity">IOMS</span>
        </Link>

        {/* Navigation Items */}
        <nav className="flex-1 w-full px-4 space-y-3 overflow-y-auto sidebar-scroll flex flex-col items-center">
          {menuItems.map((item) => {
            const active = isActive(item.route);
            return (
              <Link
                key={item.label}
                href={item.route}
                className={cn(
                  "w-full flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl transition-all duration-300 group relative",
                  active
                    ? 'bg-white/10 text-white shadow-lg backdrop-blur-sm border border-white/10'
                    : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                )}
              >
                <item.icon
                  size={22}
                  strokeWidth={active ? 2.5 : 2}
                  className={cn("mb-0.5 transition-transform group-hover:scale-110 duration-300", active ? 'text-wm-teal' : '')}
                />
                <span className={cn(
                  "text-[9px] font-black tracking-wide text-center leading-tight transition-opacity duration-300",
                  active ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'
                )}>
                  {item.label}
                </span>

                {active && (
                  <span className="absolute -left-4 top-1/2 -translate-y-1/2 w-1 h-8 bg-wm-teal rounded-r-full shadow-[0_0_10px_rgba(42,157,143,0.5)]"></span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Profile */}
        <div className="mt-auto pt-6 flex flex-col items-center gap-4 w-full border-t border-white/5">
          <div className="relative cursor-pointer group">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-wm-teal to-emerald-400 flex items-center justify-center text-white font-bold text-xs shadow-lg border-2 border-white/10 group-hover:border-white/50 transition-colors">
              {getUserInitials()}
            </div>
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-[#2E355B]"></div>
          </div>
          <button
            onClick={logout}
            className="text-gray-500 hover:text-wm-red hover:bg-red-500/10 p-2 rounded-xl transition-all duration-300"
            title="Logout"
          >
            <LogOut size={20} />
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-28 overflow-y-auto">
        {children}
      </main>
    </div>
  );
} 