import { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  ChefHat,
  Trash2,
  BarChart3,
  Camera,
  Building2,
  Users,
  FileText,
  Settings,
  Bell,
  UserCheck,
  Calendar,
  ClipboardList,
  Wrench,
  BarChart4,
  LogOut,
  Layers,
  Truck,
  RefreshCw,
  Activity
} from 'lucide-react';

export interface SidebarItem {
  id: string;
  title: string;
  icon: LucideIcon;
  route?: string;
  children?: SidebarItem[];
  badge?: string;
  isNew?: boolean;
}

export interface SidebarModule {
  id: string;
  title: string;
  items: SidebarItem[];
  isCollapsible?: boolean;
}

export const sidebarConfig: SidebarModule[] = [
  {
    id: 'main',
    title: 'Main',
    isCollapsible: false,
    items: [
      {
        id: 'dashboard',
        title: 'Dashboard',
        icon: LayoutDashboard,
        route: '/dashboard'
      }
    ]
  },
  {
    id: 'user',
    title: 'User',
    isCollapsible: false,
    items: [
      {
        id: 'receptionist',
        title: 'Receptionist',
        icon: UserCheck,
        route: '/receptionist'
      }
    ]
  },
  {
    id: 'reservations',
    title: 'Reservations',
    isCollapsible: true,
    items: [
      {
        id: 'reservations-overview',
        title: 'Reservations Overview',
        icon: Calendar,
        route: '/reservations'
      },
      {
        id: 'reservation-history',
        title: 'Reservation History',
        icon: ClipboardList,
        route: '/reservation-history'
      }
    ]
  },
  {
    id: 'orders',
    title: 'Orders',
    isCollapsible: true,
    items: [
      {
        id: 'pos-orders',
        title: 'POS & Orders',
        icon: ShoppingCart,
        route: '/orders'
      },
      {
        id: 'combo-manager',
        title: 'Combo Manager',
        icon: Layers,
        route: '/combo-manager'
      },
      {
        id: 'order-history',
        title: 'Order History',
        icon: ClipboardList,
        route: '/order-history'
      }
    ]
  },
  {
    id: 'inventory',
    title: 'Inventory',
    isCollapsible: true,
    items: [
      {
        id: 'inventory-overview',
        title: 'Inventory Overview',
        icon: Package,
        route: '/inventory'
      },
      {
        id: 'smart-inventory',
        title: 'Smart Inventory',
        icon: BarChart3,
        route: '/apps/smart-inventory'
      },
      {
        id: 'inventory-analytics',
        title: 'Inventory Analytics',
        icon: BarChart4,
        route: '/inventory-analytics'
      }
    ]
  },
  {
    id: 'supplysync',
    title: 'SupplySync Agent',
    isCollapsible: true,
    items: [
      {
        id: 'supplysync-dashboard',
        title: 'SupplySync Dashboard',
        icon: Activity,
        route: '/supplysync'
      },
      {
        id: 'supplysync-orders',
        title: 'Supply Orders',
        icon: Truck,
        route: '/supplysync/orders'
      },
      {
        id: 'supplysync-sync',
        title: 'Sync Management',
        icon: RefreshCw,
        route: '/supplysync/sync'
      }
    ]
  },
  {
    id: 'setup',
    title: 'Setup',
    isCollapsible: true,
    items: [
      {
        id: 'dining-area-setup',
        title: 'Dining Area Setup',
        icon: Building2,
        route: '/dining-area-setup'
      },
      {
        id: 'table-management',
        title: 'Table Management',
        icon: Users,
        route: '/table-management'
      },
      {
        id: 'system-settings',
        title: 'System Settings',
        icon: Settings,
        route: '/settings'
      }
    ]
  },
  {
    id: 'wastewatchdog',
    title: 'WasteWatchDog',
    isCollapsible: true,
    items: [
      {
        id: 'wastewatchdog-dashboard',
        title: 'WasteWatch Dashboard',
        icon: BarChart3,
        route: '/waste-watchdog'
      },
      {
        id: 'wastewatchdog-csrd',
        title: 'CSRD Reporting',
        icon: FileText,
        route: '/apps-waste-watchdog/csrd-reporting',
        badge: 'NEW',
        isNew: true
      },
      {
        id: 'wastewatchdog-analytics',
        title: 'Analytics & Compliance',
        icon: BarChart4,
        route: '/apps/waste-watchdog/analytics'
      },
      {
        id: 'wastewatchdog-hardware',
        title: 'Hardware Capture',
        icon: Camera,
        route: '/apps/waste-watchdog/hardware'
      }
    ]
  },
  {
    id: 'settings',
    title: 'Settings',
    isCollapsible: false,
    items: [
      {
        id: 'system-settings',
        title: 'Settings',
        icon: Settings,
        route: '/settings'
      }
    ]
  },
  {
    id: 'system-bottom',
    title: 'System',
    isCollapsible: false,
    items: [
      {
        id: 'module-settings',
        title: 'Module Settings',
        icon: Settings,
        route: '/apps/settings'
      }
    ]
  }
];

export type SidebarState = {
  isCollapsed: boolean;
  expandedModules: string[];
};

export const defaultSidebarState: SidebarState = {
  isCollapsed: false,
  expandedModules: [] // No auto-expanded sections - user controls manually
};
