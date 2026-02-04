export interface AppMetadata {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'business' | 'productivity' | 'analytics' | 'communication' | 'finance';
  status: 'active' | 'beta' | 'coming-soon' | 'deprecated';
  version: string;
  author: string;
  features: string[];
  pricing: 'free' | 'freemium' | 'paid' | 'enterprise';
  route: string;
  requiresAuth: boolean;
  dependencies?: string[];
  permissions?: string[];
}

export const APP_REGISTRY: AppMetadata[] = [
  {
    id: 'ioms',
    name: 'IOMS',
    description: 'Integrated Operations Management System',
    icon: '🏢',
    category: 'business',
    status: 'active',
    version: '2.0.0',
    author: 'IOMS Team',
    features: ['Inventory Management', 'Menu Management', 'AI-Powered Analytics', 'Barcode Scanning'],
    pricing: 'freemium',
    route: '/orders', // Changed from /order-entry
    requiresAuth: true,
  },
  {
    id: 'ai-ingredient-generator',
    name: 'IOMS Individual',
    description: 'Personal inventory management with AI-powered recipe suggestions',
    icon: '🏠',
    category: 'productivity',
    status: 'active',
    version: '2.0.0',
    author: 'IOMS Team',
    features: ['Bill Scanning & OCR', 'Smart Inventory Management', 'AI Recipe Suggestions', 'Dietary Restrictions', 'Automatic Inventory Updates'],
    pricing: 'free',
    route: '/apps/ai-ingredient-generator',
    requiresAuth: false,
    permissions: ['ai:read', 'inventory:write']
  },
  {
    id: 'smart-chef-bot',
    name: 'SmartChefBot',
    description: 'AI-powered culinary assistant that suggests recipes, manages ingredients, and optimizes kitchen operations',
    icon: '👨‍🍳',
    category: 'productivity',
    status: 'active',
    version: '1.5.0',
    author: 'IOMS team',
    features: ['Recipe Generation', 'Ingredient Substitution', 'Nutritional Analysis', 'Meal Planning', 'Kitchen Inventory Sync', 'Dietary Preferences'],
    pricing: 'freemium',
    route: '/apps/smart-chef-bot',
    requiresAuth: true,
    permissions: ['ai:read', 'inventory:read', 'menu:write']
  },

  {
    id: 'waste-watchdog',
    name: 'WasteWatchDog',
    description: 'Enterprise waste management system with AI-powered analytics and hardware integration',
    icon: '🍃',
    category: 'analytics',
    status: 'active',
    version: '1.0.0',
    author: 'IOMS team',
    features: ['Real-time Waste Monitoring', 'AI Waste Analysis', 'Carbon Footprint Tracking', 'Compliance Management', 'Hardware Integration'],
    pricing: 'enterprise',
    route: '/apps/waste-watchdog',
    requiresAuth: true,
    permissions: ['analytics:read', 'hardware:manage', 'compliance:view']
  },
  {
    id: 'government-portal',
    name: 'Government Portal',
    description: 'Comprehensive government compliance and reporting portal for waste management regulations, SDG tracking, and regulatory adherence',
    icon: '🏛️',
    category: 'business',
    status: 'active',
    version: '1.0.0',
    author: 'IOMS team',
    features: ['Compliance Monitoring', 'SDG Progress Tracking', 'Automated Reporting', 'Regional Analytics', 'Inspection Management', 'Alert System', 'Export Capabilities', 'Multi-format Reports'],
    pricing: 'enterprise',
    route: '/apps/government-portal',
    requiresAuth: true,
    permissions: ['compliance:read', 'reports:write', 'government:access', 'analytics:read']
  },
  {
    id: 'supply-sync',
    name: 'Supply Sync',
    description: 'Smart supply chain management system for supplier relationships, order tracking, delivery management, and cost optimization',
    icon: '🚛',
    category: 'business',
    status: 'active',
    version: '1.2.0',
    author: 'IOMS team',
    features: ['Supplier Management', 'Order Tracking', 'Delivery Scheduling', 'Cost Analytics', 'Performance Metrics', 'Contact Management', 'Automated Ordering', 'Inventory Integration'],
    pricing: 'freemium',
    route: '/apps/supply-sync',
    requiresAuth: true,
    permissions: ['supply:read', 'orders:write', 'suppliers:manage', 'analytics:read']
  },
  {
    id: 'mensa-ioms',
    name: 'Mensa IOMS',
    description: 'Enterprise-grade Mensa management system with menu management, HACCP compliance, and waste tracking workflows',
    icon: '🏫',
    category: 'business',
    status: 'active',
    version: '1.0.0',
    author: 'IOMS team',
    features: ['Menu Management Workflow', 'HACCP Compliance Module', 'Waste & KrWG Tracking', 'DGE Nutrition Compliance', 'Allergen Management', 'Manager Override Controls'],
    pricing: 'enterprise',
    route: '/mensa-ioms/dashboard',
    requiresAuth: true,
    permissions: ['menu:write', 'compliance:read', 'waste:write', 'haccp:manage']
  }
];

export function getAppById(id: string): AppMetadata | undefined {
  return APP_REGISTRY.find(app => app.id === id);
}

export function getAppsByCategory(category: string): AppMetadata[] {
  return APP_REGISTRY.filter(app => app.category === category);
}

export function getActiveApps(): AppMetadata[] {
  return APP_REGISTRY.filter(app => app.status === 'active' || app.status === 'beta');
}

export function getAppsByPricing(pricing: string): AppMetadata[] {
  return APP_REGISTRY.filter(app => app.pricing === pricing);
} 