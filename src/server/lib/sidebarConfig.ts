import { 
  Users, 
  Calendar,
  ShoppingCart,
  Package,
  Settings,
  BarChart3,
  Camera,
  Leaf,
  Shield,
  FileText,
  ChefHat,
  Brain,
  Store,
  CreditCard,
  TrendingUp,
  LucideIcon
} from 'lucide-react';

export interface SidebarSubItem {
  title: string;
  icon: LucideIcon;
  href: string;
  description: string;
}

export interface SidebarItem {
  title: string;
  icon: LucideIcon;
  href?: string;
  subItems?: SidebarSubItem[];
  isExpandable?: boolean;
  section?: 'main' | 'modules';
}

export interface SidebarConfig {
  mainNavigation: SidebarItem[];
  modules: SidebarItem[];
}

export const sidebarConfig: SidebarConfig = {
  // Core IOMS Navigation
  mainNavigation: [
    {
      title: "Receptionist",
      icon: Users,
      href: "/receptionist",
      isExpandable: true,
      subItems: [
        {
          title: "Customer Management",
          icon: Users,
          href: "/receptionist/customers",
          description: "Manage customer profiles"
        },
        {
          title: "Check-in/Check-out",
          icon: Calendar,
          href: "/receptionist/checkin",
          description: "Guest check-in process"
        }
      ]
    },
    {
      title: "Reservations", 
      icon: Calendar,
      href: "/reservation-history",
      isExpandable: true,
      subItems: [
        {
          title: "View Reservations",
          icon: Calendar,
          href: "/reservation-history",
          description: "All reservations"
        },
        {
          title: "Analytics",
          icon: BarChart3,
          href: "/reservation-analytics",
          description: "Booking insights"
        }
      ]
    },
    {
      title: "Orders",
      icon: ShoppingCart, 
      href: "/orders",
      isExpandable: true,
      subItems: [
        {
          title: "POS & Orders",
          icon: ShoppingCart,
          href: "/orders",
          description: "Create and manage orders"
        },
        {
          title: "Order History",
          icon: FileText,
          href: "/order-history",
          description: "Past orders"
        },
        {
          title: "Analytics",
          icon: BarChart3,
          href: "/order-analytics",
          description: "Order insights"
        }
      ]
    },
    {
      title: "Inventory",
      icon: Package,
      href: "/inventory",
      isExpandable: true,
      subItems: [
        {
          title: "Stock Management",
          icon: Package,
          href: "/inventory",
          description: "Manage inventory"
        },
        {
          title: "Analytics", 
          icon: BarChart3,
          href: "/inventory-analytics",
          description: "Inventory insights"
        },
        {
          title: "Import Data",
          icon: FileText,
          href: "/inventory-import",
          description: "Bulk import"
        }
      ]
    },
    {
      title: "Setup",
      icon: Settings,
      href: "/dining-area-setup",
      isExpandable: true,
      subItems: [
        {
          title: "Dining Area",
          icon: Settings,
          href: "/dining-area-setup",
          description: "Table configuration"
        },
        {
          title: "Table Management",
          icon: Settings,
          href: "/table-management",
          description: "Table assignments"
        }
      ]
    }
  ],

  // Specialized Modules
  modules: [
    {
      title: "WasteWatchDog",
      icon: Leaf,
      isExpandable: true,
      section: 'modules',
      subItems: [
        {
          title: "Main Dashboard",
          icon: BarChart3,
          href: "/apps/waste-watchdog",
          description: "WasteWatchDog Overview & Controls"
        },
        {
          title: "Analytics",
          icon: TrendingUp,
          href: "/apps/waste-watchdog/analytics",
          description: "Detailed Analytics & Reports"
        },
        {
          title: "Hardware",
          icon: Camera,
          href: "/apps/waste-watchdog/hardware",
          description: "Device Management & AI Analysis"
        },
        {
          title: "Compliance",
          icon: Shield,
          href: "/apps/waste-watchdog/analytics?view=compliance",
          description: "SDG, KRWG, GDPR"
        },
        {
          title: "Reports",
          icon: FileText,
          href: "/apps/waste-watchdog/analytics?view=reports",
          description: "Generate Reports"
        }
      ]
    },
    {
      title: "SmartInventory",
      icon: Package,
      isExpandable: true,
      section: 'modules',
      subItems: [
        {
          title: "AI Optimization",
          icon: Brain,
          href: "/apps/smartinventory/optimization",
          description: "AI-powered stock optimization"
        },
        {
          title: "Predictive Analytics",
          icon: BarChart3,
          href: "/apps/smartinventory/analytics",
          description: "Demand forecasting"
        }
      ]
    },
    {
      title: "SmartChef",
      icon: ChefHat,
      isExpandable: true,
      section: 'modules',
      subItems: [
        {
          title: "Recipe Management",
          icon: FileText,
          href: "/apps/smartchef/recipes",
          description: "AI recipe suggestions"
        },
        {
          title: "Nutrition Analysis",
          icon: BarChart3,
          href: "/apps/smartchef/nutrition",
          description: "Nutritional insights"
        }
      ]
    },
    {
      title: "Marketplace",
      icon: Store,
      isExpandable: true,
      section: 'modules',
      subItems: [
        {
          title: "Browse Apps",
          icon: Store,
          href: "/ioms-marketplace",
          description: "Discover new modules"
        }
      ]
    },
    {
      title: "POS System",
      icon: CreditCard,
      isExpandable: true,
      section: 'modules',
      subItems: [
        {
          title: "Point of Sale",
          icon: CreditCard,
          href: "/apps/pos/orders",
          description: "Order processing"
        },
        {
          title: "Payment",
          icon: CreditCard,
          href: "/payment",
          description: "Payment processing"
        }
      ]
    }
  ]
};

// Helper function to get active route info
export function getActiveRouteInfo(pathname: string) {
  const allItems = [...sidebarConfig.mainNavigation, ...sidebarConfig.modules];
  
  for (const item of allItems) {
    if (item.href && pathname === item.href) {
      return { item, subItem: null };
    }
    
    if (item.subItems) {
      for (const subItem of item.subItems) {
        if (pathname === subItem.href || pathname.startsWith(subItem.href)) {
          return { item, subItem };
        }
      }
    }
  }
  
  return { item: null, subItem: null };
}

// Helper function to check if a module should be expanded
export function shouldExpandModule(pathname: string, item: SidebarItem): boolean {
  if (item.href && pathname.startsWith(item.href)) return true;
  
  if (item.subItems) {
    return item.subItems.some(subItem => 
      pathname === subItem.href || pathname.startsWith(subItem.href)
    );
  }
  
  return false;
}
