export interface ForecastData {
  time: string;
  value: number;
  color: string;
}

export interface ProductionItem {
  id: string;
  dish: string;
  planned: number;
  recommendedMin: number;
  recommendedMax: number;
  confidence: number; // 0-5 scale
}

export interface WasteData {
  category: string;
  amount: number; // in kg
  change: number; // percentage
  trend: 'up' | 'down';
  color: string;
}

export interface TrendData {
  day: string;
  value: number;
  color: string;
}
