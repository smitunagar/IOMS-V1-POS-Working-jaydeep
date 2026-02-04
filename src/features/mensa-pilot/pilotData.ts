export interface PilotIngredient {
  name: string;
  quantity: string;
  unit: string;
}

export interface PilotMenuItem {
  id: string;
  name: string;
  category: string;
  price: string;
  ingredients: PilotIngredient[];
  description?: string;
}

export interface PilotOrderItem {
  name: string;
  quantity: number;
}

export interface PilotOrder {
  id: string;
  orderNumber: string;
  institution: string;
  date: string;
  time: string;
  status: string;
  items: number;
  itemNames: string;
  total: string;
  source: string;
  itemsList: PilotOrderItem[];
}

export const PILOT_MENU_ITEMS: PilotMenuItem[] = [
  {
    id: 'stw-mensa-001',
    name: 'Käsespätzle mit Röstzwiebeln',
    category: 'Main Course',
    price: '3.90',
    description: 'Swabian cheese noodles with crispy onions',
    ingredients: [
      { name: 'Spätzle', quantity: '250', unit: 'g' },
      { name: 'Emmental cheese', quantity: '80', unit: 'g' },
      { name: 'Onions', quantity: '40', unit: 'g' },
      { name: 'Butter', quantity: '15', unit: 'g' },
      { name: 'Chives', quantity: '5', unit: 'g' },
    ],
  },
  {
    id: 'stw-mensa-002',
    name: 'Vegetarische Linsenbolognese',
    category: 'Main Course',
    price: '4.20',
    description: 'Red lentil bolognese with wholegrain pasta',
    ingredients: [
      { name: 'Wholegrain pasta', quantity: '220', unit: 'g' },
      { name: 'Red lentils', quantity: '90', unit: 'g' },
      { name: 'Tomato passata', quantity: '120', unit: 'ml' },
      { name: 'Carrots', quantity: '40', unit: 'g' },
      { name: 'Celery', quantity: '30', unit: 'g' },
    ],
  },
  {
    id: 'stw-mensa-003',
    name: 'Hähnchenbrust mit Kräuterreis',
    category: 'Main Course',
    price: '5.10',
    description: 'Herb rice with grilled chicken breast',
    ingredients: [
      { name: 'Chicken breast', quantity: '160', unit: 'g' },
      { name: 'Basmati rice', quantity: '200', unit: 'g' },
      { name: 'Herb mix', quantity: '6', unit: 'g' },
      { name: 'Olive oil', quantity: '10', unit: 'ml' },
    ],
  },
  {
    id: 'stw-mensa-004',
    name: 'Seelachsfilet mit Kartoffelpüree',
    category: 'Main Course',
    price: '5.60',
    description: 'Pollock fillet with mashed potatoes',
    ingredients: [
      { name: 'Pollock fillet', quantity: '170', unit: 'g' },
      { name: 'Potatoes', quantity: '220', unit: 'g' },
      { name: 'Milk', quantity: '80', unit: 'ml' },
      { name: 'Butter', quantity: '12', unit: 'g' },
    ],
  },
  {
    id: 'stw-mensa-005',
    name: 'Gemüsecurry mit Jasminreis',
    category: 'Main Course',
    price: '4.50',
    description: 'Vegetable curry with jasmine rice',
    ingredients: [
      { name: 'Mixed vegetables', quantity: '180', unit: 'g' },
      { name: 'Coconut milk', quantity: '120', unit: 'ml' },
      { name: 'Curry paste', quantity: '18', unit: 'g' },
      { name: 'Jasmine rice', quantity: '200', unit: 'g' },
    ],
  },
  {
    id: 'stw-mensa-006',
    name: 'Gemischter Salat mit Kräuterdressing',
    category: 'Salads',
    price: '2.40',
    description: 'Fresh mixed salad with herb dressing',
    ingredients: [
      { name: 'Salad mix', quantity: '120', unit: 'g' },
      { name: 'Tomatoes', quantity: '40', unit: 'g' },
      { name: 'Cucumber', quantity: '40', unit: 'g' },
      { name: 'Herb dressing', quantity: '30', unit: 'ml' },
    ],
  },
];

export const PILOT_ORDERS: PilotOrder[] = [
  {
    id: 'stw-order-1001',
    orderNumber: 'SW-1001',
    institution: 'Studentenwerk Tübingen Mensa',
    date: '2026-02-02',
    time: '12:05',
    status: 'scheduled',
    items: 3,
    itemNames: 'Käsespätzle mit Röstzwiebeln, Gemüsecurry mit Jasminreis, Gemischter Salat mit Kräuterdressing',
    total: '10.80',
    source: 'pilot-pos',
    itemsList: [
      { name: 'Käsespätzle mit Röstzwiebeln', quantity: 1 },
      { name: 'Gemüsecurry mit Jasminreis', quantity: 1 },
      { name: 'Gemischter Salat mit Kräuterdressing', quantity: 1 },
    ],
  },
  {
    id: 'stw-order-1002',
    orderNumber: 'SW-1002',
    institution: 'Studentenwerk Tübingen Mensa',
    date: '2026-02-02',
    time: '12:20',
    status: 'processing',
    items: 2,
    itemNames: 'Hähnchenbrust mit Kräuterreis, Gemischter Salat mit Kräuterdressing',
    total: '7.50',
    source: 'pilot-pos',
    itemsList: [
      { name: 'Hähnchenbrust mit Kräuterreis', quantity: 1 },
      { name: 'Gemischter Salat mit Kräuterdressing', quantity: 1 },
    ],
  },
  {
    id: 'stw-order-1003',
    orderNumber: 'SW-1003',
    institution: 'Studentenwerk Tübingen Mensa',
    date: '2026-02-02',
    time: '12:35',
    status: 'confirmed',
    items: 2,
    itemNames: 'Vegetarische Linsenbolognese, Seelachsfilet mit Kartoffelpüree',
    total: '9.80',
    source: 'pilot-pos',
    itemsList: [
      { name: 'Vegetarische Linsenbolognese', quantity: 1 },
      { name: 'Seelachsfilet mit Kartoffelpüree', quantity: 1 },
    ],
  },
];

export const getPilotCategories = () => [
  ...new Set(PILOT_MENU_ITEMS.map(item => item.category)),
];

export const seedMensaPilotData = (userId: string) => {
  if (typeof window === 'undefined') return;
  const menuDataKey = `menu_data_${userId}`;
  const legacyMenuKey = `menu_${userId}`;
  const ordersKey = `orders_${userId}`;
  const pilotOrdersKey = `mensa_pilot_orders_${userId}`;

  const menuPayload = {
    menuItems: PILOT_MENU_ITEMS,
    categories: getPilotCategories(),
    lastUpdated: new Date().toISOString(),
  };

  localStorage.setItem(menuDataKey, JSON.stringify(menuPayload));
  localStorage.setItem(legacyMenuKey, JSON.stringify(PILOT_MENU_ITEMS));
  localStorage.setItem(ordersKey, JSON.stringify(PILOT_ORDERS));
  localStorage.setItem(pilotOrdersKey, JSON.stringify(PILOT_ORDERS));
};

export const getPilotOrders = (userId: string): PilotOrder[] => {
  if (typeof window === 'undefined') return [];
  const pilotOrdersKey = `mensa_pilot_orders_${userId}`;
  const stored = localStorage.getItem(pilotOrdersKey);
  return stored ? JSON.parse(stored) : PILOT_ORDERS;
};

export const getPilotOrderedItemNames = (userId: string): string[] => {
  const orders = getPilotOrders(userId);
  const names = orders.flatMap(order => order.itemsList.map(item => item.name));
  return Array.from(new Set(names));
};
