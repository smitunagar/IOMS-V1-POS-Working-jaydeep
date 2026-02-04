import React from 'react';

export type Role = 'DIRECTOR' | 'CAMPUS_HEAD' | 'CHEF' | 'STAFF';

export type DashboardView = 'OVERVIEW' | 'FINANCIALS' | 'SUSTAINABILITY' | 'SETTINGS';

export type Theme = 'light' | 'dark';

export interface MensaSite {
  id: string;
  name: string;
  subsidyPerMeal: number; // €
  foodWastePerGuest: number; // grams
  cogsPercent: number; // Cost of Goods Sold %
  laborCostPercent: number; // Labor Cost %
  dgeCompliant: boolean; // Deutsche Gesellschaft für Ernährung standards
  dailyMeals: number;
  totalRevenue: number;
  laborHours: number;
  customerSatisfaction: number; // 1.0 to 5.0 (CSI/NPS Proxy)
  regionalSourcingPercent: number; // % of ingredients from within 100km
}

export interface MonthlyMetric {
  month: string;
  actualSubsidy: number;
  targetLower: number;
  targetUpper: number;
}

export interface DashboardState {
  sites: MensaSite[];
  subsidyTrend: MonthlyMetric[];
  lastUpdated: string;
}

export interface KpiCardProps {
  title: string;
  value: string;
  subValue?: string;
  trend?: 'up' | 'down' | 'neutral';
  status?: 'success' | 'warning' | 'danger' | 'neutral';
  icon: React.ReactNode;
  onClick?: () => void;
  theme?: Theme;
}

export interface KpiDetail {
  id: string;
  title: string;
  explanation: string;
  formula: string;
  benchmark: string;
  impact: string;
}

// -- Head of Campus Dashboard --

export interface CampusClusterSite {
  id: string;
  name: string;
  mealsSold: number;
  revenue: number;
  laborCostPercent: number; // Labor Cost %
  foodCostPercent: number; // Added for Financial View
  wastePercent: number; // Waste as % of production volume
  forecastAccuracy: number; // % (0-100)
  phdPercent: number; // Planetary Health Diet compliance %
  staffVariance: number; // Variance in hours vs plan
  coordinates: { top: number; left: number }; // Map positioning %
  status: 'optimal' | 'warning' | 'critical';
}

export interface MenuTrend {
  week: string;
  meat: number; // %
  vegetarian: number; // %
  vegan: number; // %
}

export interface VarianceAlert {
  id: string;
  siteName: string;
  type: 'FOOD' | 'LABOR';
  message: string;
  recommendation: string;
  severity: 'HIGH' | 'MEDIUM';
}

// -- Head Chef / Kitchen Dashboard --

export type DishStatus = 'OK' | 'LOW' | 'CRITICAL' | 'SOLD_OUT';

export interface KitchenDish {
  id: string;
  name: string;
  category: 'MAIN' | 'VEG' | 'SOUPS' | 'SIDES';
  plannedQty: number;
  preparedQty: number; // Physically cooked
  soldQty: number; // Processed at register
  batchSize: number; // How many made in one "Cook" click
  velocity: number; // Portions sold per minute (for TTL calc)
}

export interface KitchenWasteLog {
  currentKg: number;
  limitKg: number;
  entries: { time: string; reason: string; amount: string }[];
}

// -- Line Staff Dashboard --

export interface StaffTask {
  id: string;
  title: string;
  time: string;
  type: 'HACCP' | 'REFILL' | 'CLEANING';
  completed: boolean;
  urgent?: boolean;
}

export interface RefillItem {
  id: string;
  name: string;
  category: 'FOOD' | 'SUPPLY';
}