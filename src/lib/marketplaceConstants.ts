import { 
  BrainCircuit, 
  ChefHat, 
  Leaf, 
  Scale, 
  Users, 
  Receipt, 
  CalendarClock, 
  ShieldCheck,
  Building2,
  LucideIcon
} from 'lucide-react';

export enum AppCategory {
  CORE_OS = 'Core OS',
  CULINARY_AI = 'Culinary AI',
  SUSTAINABILITY = 'Sustainability',
  OPERATIONS = 'Operations',
  COMPLIANCE = 'Compliance',
  FRONT_OF_HOUSE = 'Front of House'
}

export interface MarketApp {
  id: string;
  name: string;
  description: string;
  category: AppCategory;
  icon: LucideIcon;
  rating: number;
  activeInstallations: string;
  status: 'Active' | 'Install' | 'Update';
  isNew?: boolean;
  isCore?: boolean;
  color: string;
  imageUrl: string;
  route?: string;
}

export const APPS_DATA: MarketApp[] = [
  {
    id: 'ioms-cockpit',
    name: 'IOMS Cockpit',
    description: 'The central brain. Unifies hardware signals and software streams into one operational dashboard.',
    category: AppCategory.CORE_OS,
    icon: BrainCircuit,
    rating: 5.0,
    activeInstallations: 'System Core',
    status: 'Active',
    isCore: true,
    color: 'slate',
    imageUrl: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=800&auto=format&fit=crop',
    route: '/orders'
  },
  {
    id: 'smart-chef-agent',
    name: 'SmartChef Agent',
    description: 'AI culinary assistant predicting ingredients, prep loads, and menu optimization in real-time.',
    category: AppCategory.CULINARY_AI,
    icon: ChefHat,
    rating: 4.9,
    activeInstallations: '1.2k Kitchens',
    status: 'Install',
    isNew: true,
    color: 'orange',
    imageUrl: 'https://images.unsplash.com/photo-1590779033100-9f60a05a013d?q=80&w=800&auto=format&fit=crop',
    route: '/smart-chef-pod'
  },
  {
    id: 'waste-watchdog',
    name: 'WasteWatchDog',
    description: 'Automated waste tracking for SDG 12.3 goals. Turns organic loss into actionable saving metrics.',
    category: AppCategory.SUSTAINABILITY,
    icon: Leaf,
    rating: 4.9,
    activeInstallations: '850 Units',
    status: 'Install',
    isNew: true,
    color: 'emerald',
    imageUrl: 'https://images.unsplash.com/photo-1536147116438-62679a5e01f2?q=80&w=800&auto=format&fit=crop',
    route: '/apps-waste-watchdog'
  },
  {
    id: 'smart-inventory-agent',
    name: 'SmartInventory Agent',
    description: 'Predictive supply sync that prevents blind spots. Auto-orders based on consumption trends.',
    category: AppCategory.OPERATIONS,
    icon: Scale, 
    rating: 4.7,
    activeInstallations: '2.1k Units',
    status: 'Update',
    color: 'blue',
    imageUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=800&auto=format&fit=crop',
    route: '/apps/supply-sync'
  },
  {
    id: 'eu-compliance-portal',
    name: 'EU Compliance Portal',
    description: 'Automated reporting for German & EU future waste regulations and ESG standards.',
    category: AppCategory.COMPLIANCE,
    icon: ShieldCheck,
    rating: 4.8,
    activeInstallations: 'Mandatory',
    status: 'Active',
    color: 'indigo',
    imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=800&auto=format&fit=crop',
    route: '/government-portal'
  },
  {
    id: 'staffflow-assistant',
    name: 'StaffFlow Assistant',
    description: 'Monitors staff load and labor stress to optimize shifts and prevent burnout.',
    category: AppCategory.OPERATIONS,
    icon: Users,
    rating: 4.6,
    activeInstallations: '500 Teams',
    status: 'Install',
    color: 'violet',
    imageUrl: 'https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=800&auto=format&fit=crop',
    route: '/receptionist'
  },
  {
    id: 'poslogic-pal',
    name: 'POSLogic Pal',
    description: 'Eliminates POS chaos by syncing orders directly to the kitchen production line.',
    category: AppCategory.OPERATIONS,
    icon: Receipt,
    rating: 4.8,
    activeInstallations: '3.5k Connected',
    status: 'Active',
    color: 'rose',
    imageUrl: 'https://images.unsplash.com/photo-1556742031-c6961e8560b0?q=80&w=800&auto=format&fit=crop',
    route: '/orders'
  },
  {
    id: 'smart-reception',
    name: 'Smart Reception',
    description: 'Front-of-house agent aligning reservations with kitchen capacity to manage throughput.',
    category: AppCategory.FRONT_OF_HOUSE,
    icon: CalendarClock,
    rating: 4.5,
    activeInstallations: '900 Venues',
    status: 'Install',
    color: 'sky',
    imageUrl: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?q=80&w=800&auto=format&fit=crop',
    route: '/reservations'
  },
  {
    id: 'mensa-ioms',
    name: 'Mensa IOMS',
    description: 'Enterprise-grade Mensa management system with menu management, HACCP compliance, and waste tracking workflows.',
    category: AppCategory.OPERATIONS,
    icon: Building2,
    rating: 4.8,
    activeInstallations: '250 Mensas',
    status: 'Active',
    color: 'indigo',
    imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=800&auto=format&fit=crop',
    route: '/mensa-ioms/dashboard'
  }
];

