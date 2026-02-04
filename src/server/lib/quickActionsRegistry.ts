export interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: string;
  href: string;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'indigo' | 'red' | 'yellow' | 'pink' | 'gray' | 'cyan';
  isDefault: boolean;
  isEnabled: boolean;
  order: number;
}

export const DEFAULT_QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'start-pos',
    title: 'Start POS',
    description: 'Process transactions',
    icon: 'CreditCard',
    href: '/orders',
    color: 'blue',
    isDefault: true,
    isEnabled: true,
    order: 1
  },
  {
    id: 'upload-menu',
    title: 'Upload Menu',
    description: 'Add new items',
    icon: 'Upload',
    href: '/menu-upload',
    color: 'green',
    isDefault: true,
    isEnabled: true,
    order: 2
  },
  {
    id: 'analytics',
    title: 'Analytics & Dashboard',
    description: 'Business insights & reports',
    icon: 'BarChart3',
    href: '/analytics',
    color: 'purple',
    isDefault: true,
    isEnabled: true,
    order: 3
  },
  {
    id: 'table-management',
    title: 'Table Management',
    description: 'Manage tables & reservations',
    icon: 'MapPin',
    href: '/table-management',
    color: 'orange',
    isDefault: true,
    isEnabled: true,
    order: 4
  },
  {
    id: 'ingredient-tool',
    title: 'AI Ingredient Generator',
    description: 'Generate ingredients for dishes',
    icon: 'ChefHat',
    href: '/ingredient-tool',
    color: 'indigo',
    isDefault: true,
    isEnabled: true,
    order: 5
  }
];

export const AVAILABLE_QUICK_ACTIONS: QuickAction[] = [
  ...DEFAULT_QUICK_ACTIONS,
  {
    id: 'inventory',
    title: 'Inventory Management',
    description: 'Track stock levels',
    icon: 'Package',
    href: '/inventory',
    color: 'yellow',
    isDefault: false,
    isEnabled: false,
    order: 6
  },
  {
    id: 'customers',
    title: 'Customer Management',
    description: 'Manage customer data',
    icon: 'Users',
    href: '/customers',
    color: 'pink',
    isDefault: false,
    isEnabled: false,
    order: 7
  },
  {
    id: 'reports',
    title: 'Reports',
    description: 'Generate business reports',
    icon: 'FileText',
    href: '/reports',
    color: 'red',
    isDefault: false,
    isEnabled: false,
    order: 8
  },
  {
    id: 'settings',
    title: 'Settings',
    description: 'Configure system settings',
    icon: 'Settings',
    href: '/settings',
    color: 'gray',
    isDefault: false,
    isEnabled: false,
    order: 9
  },
  {
    id: 'barcode-scanner',
    title: 'Barcode Scanner',
    description: 'Scan products quickly',
    icon: 'Scan',
    href: '/barcode-scanner',
    color: 'cyan',
    isDefault: false,
    isEnabled: false,
    order: 10
  }
];

// Local storage key for user's custom quick actions
const QUICK_ACTIONS_STORAGE_KEY = 'ioms-quick-actions';

export function getUserQuickActions(): QuickAction[] {
  if (typeof window === 'undefined') {
    return DEFAULT_QUICK_ACTIONS.filter(action => action.isEnabled);
  }

  try {
    const stored = localStorage.getItem(QUICK_ACTIONS_STORAGE_KEY);
    if (stored) {
      const userActions = JSON.parse(stored);
      return userActions.filter((action: QuickAction) => action.isEnabled);
    }
  } catch (error) {
    console.error('Error loading quick actions:', error);
  }

  return DEFAULT_QUICK_ACTIONS.filter(action => action.isEnabled);
}

export function saveUserQuickActions(actions: QuickAction[]): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(QUICK_ACTIONS_STORAGE_KEY, JSON.stringify(actions));
  } catch (error) {
    console.error('Error saving quick actions:', error);
  }
}

export function addQuickAction(action: Omit<QuickAction, 'id' | 'isDefault' | 'order'>): void {
  const currentActions = getUserQuickActions();
  const newAction: QuickAction = {
    ...action,
    id: `custom-${Date.now()}`,
    isDefault: false,
    order: currentActions.length + 1
  };

  const updatedActions = [...currentActions, newAction];
  saveUserQuickActions(updatedActions);
}

export function removeQuickAction(actionId: string): void {
  const currentActions = getUserQuickActions();
  const updatedActions = currentActions.filter(action => action.id !== actionId);
  saveUserQuickActions(updatedActions);
}

export function updateQuickActionOrder(actionId: string, newOrder: number): void {
  const currentActions = getUserQuickActions();
  const updatedActions = currentActions.map(action => 
    action.id === actionId ? { ...action, order: newOrder } : action
  );
  saveUserQuickActions(updatedActions);
}

export function toggleQuickAction(actionId: string): void {
  const currentActions = getUserQuickActions();
  const updatedActions = currentActions.map(action => 
    action.id === actionId ? { ...action, isEnabled: !action.isEnabled } : action
  );
  saveUserQuickActions(updatedActions);
}

export function getAvailableActionsForAdding(): QuickAction[] {
  const currentActions = getUserQuickActions();
  const currentIds = currentActions.map(action => action.id);
  
  return AVAILABLE_QUICK_ACTIONS.filter(action => 
    !currentIds.includes(action.id) && !action.isEnabled
  );
} 