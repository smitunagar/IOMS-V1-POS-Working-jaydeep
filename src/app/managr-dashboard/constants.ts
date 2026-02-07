import { ForecastData, ProductionItem, TrendData } from './types';

export const DEMAND_FORECAST_DATA: ForecastData[] = [
  { time: '11:30', value: 50, color: '#C8E6C9' },
  { time: '12:00', value: 60, color: '#A5D6A7' },
  { time: '12:30', value: 90, color: '#66BB6A' },
  { time: '13:00', value: 160, color: '#81C784' }, // Adjusted label to match flow usually, though image says 12:00 again, likely typo in image, I'll use 13:00 for logic
  { time: '13:30', value: 200, color: '#4CAF50' },
  { time: '14:00', value: 280, color: '#FDD835' },
  { time: '14:30', value: 180, color: '#FDD835' },
  { time: '15:00', value: 140, color: '#E53935' },
];

// Simplified for the visual bar chart in the image which has about 7-8 bars
export const CHART_DATA = [
  { name: '11:30', uv: 40, fill: '#d1e7dd' },
  { name: '12:00', uv: 50, fill: '#b3dcb5' },
  { name: '12:30', uv: 80, fill: '#6cbfa3' },
  { name: '12:45', uv: 120, fill: '#4da167' },
  { name: '13:00', uv: 180, fill: '#2d6a4f' }, // Peak dark green
  { name: '13:15', uv: 220, fill: '#9ec698' },
  { name: '13:30', uv: 300, fill: '#fcd34d' }, // Yellow
  { name: '13:45', uv: 180, fill: '#eab308' }, // Darker Yellow
  { name: '14:00', uv: 150, fill: '#dc2626' }, // Red
];


export const PRODUCTION_DATA: ProductionItem[] = [
  { id: '1', dish: 'Pasta Veg', planned: 200, recommendedMin: 180, recommendedMax: 210, confidence: 4.5 },
  { id: '2', dish: 'Chicken Bowl', planned: 250, recommendedMin: 230, recommendedMax: 260, confidence: 4.5 },
  { id: '3', dish: 'Soup', planned: 120, recommendedMin: 90, recommendedMax: 110, confidence: 3 },
];

export const WEEKLY_TREND_DATA: TrendData[] = [
  { day: 'M', value: 60, color: '#a7d6a9' },
  { day: 'T', value: 80, color: '#a7d6a9' },
  { day: 'W', value: 40, color: '#fcd34d' },
  { day: 'T', value: 90, color: '#a7d6a9' },
  { day: 'F', value: 50, color: '#a7d6a9' },
  { day: 'S', value: 70, color: '#a7d6a9' },
  { day: 'S', value: 85, color: '#2d6a4f' },
];
