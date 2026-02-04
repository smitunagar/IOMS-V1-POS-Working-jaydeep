import { MensaSite, MonthlyMetric, CampusClusterSite, MenuTrend, VarianceAlert, KitchenDish, KitchenWasteLog, StaffTask, RefillItem } from './types';

export const MOCK_SITES: MensaSite[] = [
  { id: '1', name: 'Mensa Uni-Mitte', subsidyPerMeal: 2.85, foodWastePerGuest: 110, cogsPercent: 29.5, laborCostPercent: 32, dgeCompliant: true, dailyMeals: 2400, totalRevenue: 12500, laborHours: 180, customerSatisfaction: 3.8, regionalSourcingPercent: 65 },
  { id: '2', name: 'Mensa Nord', subsidyPerMeal: 2.10, foodWastePerGuest: 45, cogsPercent: 28.0, laborCostPercent: 29, dgeCompliant: true, dailyMeals: 1800, totalRevenue: 9800, laborHours: 110, customerSatisfaction: 4.6, regionalSourcingPercent: 82 },
  { id: '3', name: 'Cafeteria Arts', subsidyPerMeal: 3.65, foodWastePerGuest: 180, cogsPercent: 35.0, laborCostPercent: 42, dgeCompliant: false, dailyMeals: 450, totalRevenue: 3100, laborHours: 60, customerSatisfaction: 2.4, regionalSourcingPercent: 30 },
  { id: '4', name: 'Bistro Tech Park', subsidyPerMeal: 2.45, foodWastePerGuest: 85, cogsPercent: 30.5, laborCostPercent: 28, dgeCompliant: true, dailyMeals: 3100, totalRevenue: 18000, laborHours: 200, customerSatisfaction: 4.1, regionalSourcingPercent: 55 },
  { id: '5', name: 'Mensa Süd-Campus', subsidyPerMeal: 2.95, foodWastePerGuest: 130, cogsPercent: 31.0, laborCostPercent: 34, dgeCompliant: true, dailyMeals: 1200, totalRevenue: 6500, laborHours: 110, customerSatisfaction: 3.5, regionalSourcingPercent: 60 },
  { id: '6', name: 'Klinikum Mensa', subsidyPerMeal: 1.95, foodWastePerGuest: 60, cogsPercent: 27.5, laborCostPercent: 26, dgeCompliant: true, dailyMeals: 4500, totalRevenue: 28000, laborHours: 320, customerSatisfaction: 4.2, regionalSourcingPercent: 75 },
  { id: '7', name: 'Café Library', subsidyPerMeal: 4.10, foodWastePerGuest: 210, cogsPercent: 22.0, laborCostPercent: 55, dgeCompliant: false, dailyMeals: 300, totalRevenue: 1800, laborHours: 45, customerSatisfaction: 2.8, regionalSourcingPercent: 20 },
  { id: '8', name: 'Sports Center Grill', subsidyPerMeal: 2.30, foodWastePerGuest: 95, cogsPercent: 33.0, laborCostPercent: 30, dgeCompliant: true, dailyMeals: 900, totalRevenue: 5400, laborHours: 70, customerSatisfaction: 4.5, regionalSourcingPercent: 45 },
  { id: '9', name: 'Executive Lounge', subsidyPerMeal: 1.50, foodWastePerGuest: 300, cogsPercent: 40.0, laborCostPercent: 25, dgeCompliant: false, dailyMeals: 150, totalRevenue: 3000, laborHours: 20, customerSatisfaction: 4.8, regionalSourcingPercent: 90 },
  { id: '10', name: 'Bio-Mensa Green', subsidyPerMeal: 3.20, foodWastePerGuest: 40, cogsPercent: 38.0, laborCostPercent: 36, dgeCompliant: true, dailyMeals: 800, totalRevenue: 5600, laborHours: 90, customerSatisfaction: 4.7, regionalSourcingPercent: 95 },
];

export const SUBSIDY_TREND: MonthlyMetric[] = [
  { month: 'Jan', actualSubsidy: 2.35, targetLower: 2.00, targetUpper: 3.00 },
  { month: 'Feb', actualSubsidy: 2.40, targetLower: 2.00, targetUpper: 3.00 },
  { month: 'Mar', actualSubsidy: 2.45, targetLower: 2.00, targetUpper: 3.00 },
  { month: 'Apr', actualSubsidy: 2.55, targetLower: 2.00, targetUpper: 3.00 },
  { month: 'May', actualSubsidy: 2.80, targetLower: 2.00, targetUpper: 3.00 },
  { month: 'Jun', actualSubsidy: 3.10, targetLower: 2.00, targetUpper: 3.00 }, // Spike
  { month: 'Jul', actualSubsidy: 2.95, targetLower: 2.00, targetUpper: 3.00 },
  { month: 'Aug', actualSubsidy: 2.20, targetLower: 2.00, targetUpper: 3.00 }, // Summer break low
  { month: 'Sep', actualSubsidy: 2.50, targetLower: 2.00, targetUpper: 3.00 },
  { month: 'Oct', actualSubsidy: 2.65, targetLower: 2.00, targetUpper: 3.00 },
  { month: 'Nov', actualSubsidy: 2.75, targetLower: 2.00, targetUpper: 3.00 },
  { month: 'Dec', actualSubsidy: 2.85, targetLower: 2.00, targetUpper: 3.00 },
];

// -- Mock Data for Campus Head --
export const MOCK_CAMPUS_CLUSTER: CampusClusterSite[] = [
  { 
    id: 'c1', 
    name: 'Mensa Reutlingen', 
    mealsSold: 2450, 
    revenue: 12800, 
    laborCostPercent: 34.2, 
    foodCostPercent: 29.5, 
    wastePercent: 4.5, 
    forecastAccuracy: 95, 
    phdPercent: 65, 
    staffVariance: 12,
    coordinates: { top: 65, left: 80 }, 
    status: 'warning'
  },
  { 
    id: 'c2', 
    name: 'Mensa Tübingen Morgenstelle', 
    mealsSold: 1820, 
    revenue: 9400, 
    laborCostPercent: 28.1, 
    foodCostPercent: 27.0, 
    wastePercent: 2.1, 
    forecastAccuracy: 92, 
    phdPercent: 45, 
    staffVariance: -2,
    coordinates: { top: 30, left: 20 }, 
    status: 'optimal'
  },
  { 
    id: 'c3', 
    name: 'Mensa Tübingen Tal', 
    mealsSold: 1210, 
    revenue: 6100, 
    laborCostPercent: 41.5, 
    foodCostPercent: 36.5, 
    wastePercent: 8.2, 
    forecastAccuracy: 76, 
    phdPercent: 85, 
    staffVariance: 8,
    coordinates: { top: 50, left: 25 }, 
    status: 'critical'
  },
];

export const MENU_TRENDS: MenuTrend[] = [
  { week: 'W44', meat: 55, vegetarian: 30, vegan: 15 },
  { week: 'W45', meat: 52, vegetarian: 32, vegan: 16 },
  { week: 'W46', meat: 48, vegetarian: 35, vegan: 17 },
  { week: 'W47', meat: 42, vegetarian: 38, vegan: 20 },
];

export const VARIANCE_ALERTS: VarianceAlert[] = [
  { id: 'a1', siteName: 'Mensa Uni-Mitte', type: 'FOOD', message: "4 weeks of Overproduction on 'Schnitzel'", recommendation: "Reduce Prep Par Level by 15%", severity: 'MEDIUM' },
  { id: 'a2', siteName: 'Cafeteria Arts', type: 'LABOR', message: "Labor cost +20% vs Plan", recommendation: "Check Shift Schedule / Cut 4h next week", severity: 'HIGH' },
];

// -- Mock Data for Head Chef --
export const MOCK_KITCHEN_MENU: KitchenDish[] = [
  { id: 'k1', name: 'Schwäbische Linsen mit Spätzle & Saiten', category: 'MAIN', plannedQty: 850, preparedQty: 600, soldQty: 580, batchSize: 50, velocity: 8.5 }, // High velocity
  { id: 'k2', name: 'Maultaschen in der Brühe', category: 'MAIN', plannedQty: 400, preparedQty: 380, soldQty: 290, batchSize: 30, velocity: 4.0 }, 
  { id: 'k3', name: 'Veganer Falafel-Teller', category: 'VEG', plannedQty: 300, preparedQty: 250, soldQty: 180, batchSize: 20, velocity: 3.2 }, 
  { id: 'k4', name: 'Alaska Seelachsfilet gebacken', category: 'MAIN', plannedQty: 350, preparedQty: 300, soldQty: 270, batchSize: 25, velocity: 5.5 }, 
  { id: 'k5', name: 'Tagessuppe: Kartoffelcreme', category: 'SOUPS', plannedQty: 200, preparedQty: 180, soldQty: 120, batchSize: 20, velocity: 2.0 }, 
  { id: 'k6', name: 'Pommes Frites / Spätzle', category: 'SIDES', plannedQty: 1200, preparedQty: 900, soldQty: 800, batchSize: 100, velocity: 12.0 }, 
];

export const MOCK_WASTE_LOG: KitchenWasteLog = {
  currentKg: 8.5,
  limitKg: 25.0,
  entries: [
    { time: '11:30', reason: 'Dropped Pan', amount: '2.5kg' },
    { time: '12:15', reason: 'Quality Fail (Burnt)', amount: '1.2kg' },
  ]
};

// -- Mock Data for Line Staff --
export const MOCK_STAFF_TASKS: StaffTask[] = [
  { id: 't1', title: 'Check Temp (Salad Bar)', time: 'Due in 5m', type: 'HACCP', completed: false, urgent: true },
  { id: 't2', title: 'Refill Napkin Dispensers', time: 'Due in 15m', type: 'REFILL', completed: false },
  { id: 't3', title: 'Wipe Counter 3', time: 'Due in 20m', type: 'CLEANING', completed: false },
  { id: 't4', title: 'Check Temp (Soup Station)', time: 'Completed', type: 'HACCP', completed: true },
];

export const REFILL_ITEMS: RefillItem[] = [
  { id: 'r1', name: 'Cutlery', category: 'SUPPLY' },
  { id: 'r2', name: 'Trays', category: 'SUPPLY' },
  { id: 'r3', name: 'Napkins', category: 'SUPPLY' },
  { id: 'r4', name: 'Salad Mix', category: 'FOOD' },
  { id: 'r5', name: 'Dressing', category: 'FOOD' },
  { id: 'r6', name: 'Bread Rolls', category: 'FOOD' },
];