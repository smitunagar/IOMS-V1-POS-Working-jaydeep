import React, { useCallback, useEffect, useState } from 'react';
import { DashboardHeader } from './components/DashboardHeader';
import { DemandForecast } from './components/DemandForecast';
import { WasteSnapshotSmall } from './components/WasteSnapshotSmall';
import { ProductionTable } from './components/ProductionTable';
import { WasteDetail } from './components/WasteDetail';
import { EfficiencyGauge } from './components/EfficiencyGauge';
import { TrendingUp, CalendarClock, BarChart3, PackageSearch, AlertTriangle } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, BarChart, Bar, Cell, LabelList } from 'recharts';

type FoodType = 'all' | 'vegan' | 'vegetarian' | 'non-vegetarian';
type PreorderSite = 'wilhelm' | 'morgen' | 'prinz';
type PreorderWindow = '15m' | '60m' | 'today';
type PreorderRow = { label: string; value: number; trend: string; site: PreorderSite };

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'demand' | 'waste' | 'inventory' | 'output'>('demand');
  const [posRange, setPosRange] = useState<'7d' | '30d' | '90d'>('7d');
  const [demandFoodType, setDemandFoodType] = useState<FoodType>('all');
  const [wasteCaptureFoodType, setWasteCaptureFoodType] = useState<FoodType>('all');
  const [wasteFeedbackFoodType, setWasteFeedbackFoodType] = useState<FoodType>('all');
  const [wasteDetailFoodType, setWasteDetailFoodType] = useState<FoodType>('all');
  const [stockFoodType, setStockFoodType] = useState<FoodType>('all');
  const [coverageFoodType, setCoverageFoodType] = useState<FoodType>('all');
  const [inventoryKpisFoodType, setInventoryKpisFoodType] = useState<FoodType>('all');
  const [lowInventoryFoodType, setLowInventoryFoodType] = useState<FoodType>('all');
  const [expiryFoodType, setExpiryFoodType] = useState<FoodType>('all');
  const [demandAnchorFoodType, setDemandAnchorFoodType] = useState<FoodType>('all');
  const [wasteTrendFoodType, setWasteTrendFoodType] = useState<FoodType>('all');
  const [recommendedPrepFoodType, setRecommendedPrepFoodType] = useState<FoodType>('all');
  const [prepGuidanceFoodType, setPrepGuidanceFoodType] = useState<FoodType>('all');
  const [preorderWindow, setPreorderWindow] = useState<PreorderWindow>('15m');
  const [preorderSite, setPreorderSite] = useState<'all' | PreorderSite>('all');
  const [preorderError, setPreorderError] = useState<string | null>(null);
  const [wasteCaptureRange, setWasteCaptureRange] = useState<'yesterday' | '7d' | '30d'>('yesterday');
  const [wasteDetailRange, setWasteDetailRange] = useState<'today' | '7d' | '30d'>('7d');
  const [inventoryExpiryRange, setInventoryExpiryRange] = useState<'7d' | '14d' | '30d'>('7d');
  const [prepRange, setPrepRange] = useState<'tomorrow' | '3d' | '7d'>('tomorrow');
  const [wasteDashboardRange, setWasteDashboardRange] = useState<'today' | '7d' | '30d'>('today');

  const formatEuro = (value: number | string) => `€${Number(value).toLocaleString('de-DE')}`;

  const posSalesHistoryData: Record<'7d' | '30d' | '90d', { label: string; value: number }[]> = {
    '7d': [
      { label: 'Mon', value: 1200 },
      { label: 'Tue', value: 1320 },
      { label: 'Wed', value: 980 },
      { label: 'Thu', value: 1400 },
      { label: 'Fri', value: 1510 },
      { label: 'Sat', value: 1275 },
      { label: 'Sun', value: 1580 },
    ],
    '30d': [
      { label: 'Week 1', value: 8600 },
      { label: 'Week 2', value: 9100 },
      { label: 'Week 3', value: 8450 },
      { label: 'Week 4', value: 9780 },
    ],
    '90d': [
      { label: 'Aug', value: 34200 },
      { label: 'Sep', value: 36550 },
      { label: 'Oct', value: 38980 },
    ],
  };

  const dayOfWeekData: { label: string; value: number; color: string }[] = [
    { label: 'Mon', value: 78, color: '#4da167' },
    { label: 'Tue', value: 88, color: '#2d5a3f' },
    { label: 'Wed', value: 70, color: '#a4c99a' },
    { label: 'Thu', value: 82, color: '#4da167' },
    { label: 'Fri', value: 60, color: '#f9d75c' },
  ];

  const preorderData: Record<PreorderWindow, PreorderRow[]> = {
    '15m': [
      { label: 'Mensa Wilhelmstraße', value: 46, trend: '+6%', site: 'wilhelm' },
      { label: 'Mensa Morgenstelle', value: 28, trend: '+3%', site: 'morgen' },
      { label: 'Mensa Prinz Karl', value: 19, trend: '+2%', site: 'prinz' },
    ],
    '60m': [
      { label: 'Mensa Wilhelmstraße', value: 128, trend: '+9%', site: 'wilhelm' },
      { label: 'Mensa Morgenstelle', value: 74, trend: '+5%', site: 'morgen' },
      { label: 'Mensa Prinz Karl', value: 52, trend: '+4%', site: 'prinz' },
    ],
    today: [
      { label: 'Mensa Wilhelmstraße', value: 640, trend: '+12%', site: 'wilhelm' },
      { label: 'Mensa Morgenstelle', value: 410, trend: '+8%', site: 'morgen' },
      { label: 'Mensa Prinz Karl', value: 280, trend: '+6%', site: 'prinz' },
    ],
  };

  const [livePreorderData, setLivePreorderData] = useState<Record<PreorderWindow, PreorderRow[]>>(preorderData);

  const resolvePreorderSite = (institution?: string | null): PreorderSite | null => {
    if (!institution) return null;
    const normalized = institution.toLowerCase();
    if (normalized.includes('wilhelm')) return 'wilhelm';
    if (normalized.includes('morgen')) return 'morgen';
    if (normalized.includes('prinz') || normalized.includes('karl')) return 'prinz';
    return null;
  };

  const resolveOrderTimestamp = (order: { createdAt?: string; date?: string; time?: string }) => {
    if (order.createdAt) {
      const parsed = new Date(order.createdAt);
      if (!Number.isNaN(parsed.getTime())) return parsed;
    }
    if (order.date) {
      const time = order.time && order.time.length > 0 ? order.time : '00:00:00';
      const parsed = new Date(`${order.date}T${time}`);
      if (!Number.isNaN(parsed.getTime())) return parsed;
    }
    return null;
  };

  const formatTrend = (current: number, previous: number) => {
    if (previous === 0) {
      return current === 0 ? '0%' : '+100%';
    }
    const change = Math.round(((current - previous) / previous) * 100);
    return `${change >= 0 ? '+' : ''}${change}%`;
  };

  const buildPreorderSummary = (orders: Array<{
    institution?: string;
    createdAt?: string;
    date?: string;
    time?: string;
    source?: string;
  }>) => {
    const now = new Date();
    const windows: Record<Exclude<PreorderWindow, 'today'>, number> = {
      '15m': 15,
      '60m': 60,
    };

    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(todayStart.getDate() - 1);

    const relevantOrders = orders
      .map((order) => {
        const timestamp = resolveOrderTimestamp(order);
        if (!timestamp) return null;
        const site = resolvePreorderSite(order.institution);
        if (!site) return null;
        const source = order.source?.toLowerCase();
        if (source && !/student|app|pre-?order/.test(source)) return null;
        return { timestamp, site };
      })
      .filter(Boolean) as Array<{ timestamp: Date; site: PreorderSite }>;

    const countsForWindow = (start: Date, end: Date, site: PreorderSite) =>
      relevantOrders.filter((order) => order.site === site && order.timestamp >= start && order.timestamp <= end).length;

    const buildRows = (window: PreorderWindow): PreorderRow[] => {
      return (['wilhelm', 'morgen', 'prinz'] as PreorderSite[]).map((site) => {
        let current = 0;
        let previous = 0;
        if (window === 'today') {
          current = countsForWindow(todayStart, now, site);
          previous = countsForWindow(yesterdayStart, todayStart, site);
        } else {
          const minutes = windows[window];
          const windowStart = new Date(now.getTime() - minutes * 60 * 1000);
          const previousStart = new Date(now.getTime() - minutes * 2 * 60 * 1000);
          current = countsForWindow(windowStart, now, site);
          previous = countsForWindow(previousStart, windowStart, site);
        }

        const label = site === 'wilhelm'
          ? 'Mensa Wilhelmstraße'
          : site === 'morgen'
          ? 'Mensa Morgenstelle'
          : 'Mensa Prinz Karl';

        return {
          label,
          value: current,
          trend: formatTrend(current, previous),
          site,
        };
      });
    };

    return {
      '15m': buildRows('15m'),
      '60m': buildRows('60m'),
      today: buildRows('today'),
    } as Record<PreorderWindow, PreorderRow[]>;
  };

  const fetchLivePreorders = useCallback(async () => {
    try {
      const response = await fetch('/api/mensa-orders/scheduled');
      const payload = await response.json();
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message || 'Failed to fetch live preorders');
      }

      const summary = buildPreorderSummary(payload.data || []);
      setLivePreorderData(summary);
      setPreorderError(null);
    } catch (error: any) {
      setPreorderError(error.message || 'Failed to fetch live preorders');
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const fetchWithGuard = async () => {
      if (!isMounted) return;
      await fetchLivePreorders();
    };

    fetchWithGuard();
    const interval = setInterval(fetchWithGuard, 15000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [fetchLivePreorders]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('EventSource' in window)) return;

    const source = new EventSource('/api/mensa-orders/stream');
    source.addEventListener('scheduled-order', () => {
      fetchLivePreorders();
    });
    source.addEventListener('error', () => {
      source.close();
    });

    return () => {
      source.close();
    };
  }, [fetchLivePreorders]);

  const wasteCaptureData: Record<'yesterday' | '7d' | '30d', {
    label: string;
    valueKg: number;
    deltaPct: number;
    bgColor: string;
    deltaColor: string;
  }[]> = {
    yesterday: [
      { label: 'Plate Waste', valueKg: 32, deltaPct: 8, bgColor: '#133E28', deltaColor: '#4da167' },
      { label: 'Prep Waste', valueKg: 18, deltaPct: 4, bgColor: '#7fb58c', deltaColor: '#ffffff' },
      { label: 'Unsold Food', valueKg: 25, deltaPct: 23, bgColor: '#c53030', deltaColor: '#fee2e2' },
    ],
    '7d': [
      { label: 'Plate Waste', valueKg: 210, deltaPct: -5, bgColor: '#133E28', deltaColor: '#bbf7d0' },
      { label: 'Prep Waste', valueKg: 145, deltaPct: 2, bgColor: '#7fb58c', deltaColor: '#ffffff' },
      { label: 'Unsold Food', valueKg: 190, deltaPct: 8, bgColor: '#c53030', deltaColor: '#fee2e2' },
    ],
    '30d': [
      { label: 'Plate Waste', valueKg: 860, deltaPct: -3, bgColor: '#133E28', deltaColor: '#bbf7d0' },
      { label: 'Prep Waste', valueKg: 620, deltaPct: -6, bgColor: '#7fb58c', deltaColor: '#ffffff' },
      { label: 'Unsold Food', valueKg: 540, deltaPct: 4, bgColor: '#c53030', deltaColor: '#fee2e2' },
    ],
  };

  const wasteDetailData: Record<'today' | '7d' | '30d', {
    rows: {
      label: string;
      valueKg: number;
      deltaPct: number;
      accentColor: string;
      panelColor: string;
      textColor: string;
      dotColor: string;
    }[];
    weeklyTrend: { day: string; value: number; color: string }[];
  }> = {
    today: {
      rows: [
        { label: 'Plate Waste', valueKg: 32, deltaPct: 8, accentColor: '#4da167', panelColor: '#2d5a3f', textColor: '#ffffff', dotColor: '#2d5a3f' },
        { label: 'Prep Waste', valueKg: 18, deltaPct: 4, accentColor: '#133E28', panelColor: '#fcd34d', textColor: '#133E28', dotColor: '#4da167' },
        { label: 'Unsold Food', valueKg: 25, deltaPct: 12, accentColor: '#fee2e2', panelColor: '#ef4444', textColor: '#ffffff', dotColor: '#ef4444' },
      ],
      weeklyTrend: [
        { day: 'M', value: 28, color: '#a7d6a9' },
        { day: 'T', value: 34, color: '#a7d6a9' },
        { day: 'W', value: 22, color: '#fcd34d' },
        { day: 'T', value: 40, color: '#a7d6a9' },
        { day: 'F', value: 30, color: '#a7d6a9' },
        { day: 'S', value: 26, color: '#a7d6a9' },
        { day: 'S', value: 44, color: '#2d6a4f' },
      ],
    },
    '7d': {
      rows: [
        { label: 'Plate Waste', valueKg: 210, deltaPct: -5, accentColor: '#4da167', panelColor: '#2d5a3f', textColor: '#ffffff', dotColor: '#2d5a3f' },
        { label: 'Prep Waste', valueKg: 145, deltaPct: 2, accentColor: '#133E28', panelColor: '#fcd34d', textColor: '#133E28', dotColor: '#4da167' },
        { label: 'Unsold Food', valueKg: 190, deltaPct: 8, accentColor: '#fee2e2', panelColor: '#ef4444', textColor: '#ffffff', dotColor: '#ef4444' },
      ],
      weeklyTrend: [
        { day: 'M', value: 60, color: '#a7d6a9' },
        { day: 'T', value: 80, color: '#a7d6a9' },
        { day: 'W', value: 40, color: '#fcd34d' },
        { day: 'T', value: 90, color: '#a7d6a9' },
        { day: 'F', value: 50, color: '#a7d6a9' },
        { day: 'S', value: 70, color: '#a7d6a9' },
        { day: 'S', value: 85, color: '#2d6a4f' },
      ],
    },
    '30d': {
      rows: [
        { label: 'Plate Waste', valueKg: 860, deltaPct: -3, accentColor: '#4da167', panelColor: '#2d5a3f', textColor: '#ffffff', dotColor: '#2d5a3f' },
        { label: 'Prep Waste', valueKg: 620, deltaPct: -6, accentColor: '#133E28', panelColor: '#fcd34d', textColor: '#133E28', dotColor: '#4da167' },
        { label: 'Unsold Food', valueKg: 540, deltaPct: 4, accentColor: '#fee2e2', panelColor: '#ef4444', textColor: '#ffffff', dotColor: '#ef4444' },
      ],
      weeklyTrend: [
        { day: 'W1', value: 220, color: '#a7d6a9' },
        { day: 'W2', value: 260, color: '#a7d6a9' },
        { day: 'W3', value: 180, color: '#fcd34d' },
        { day: 'W4', value: 310, color: '#2d6a4f' },
      ],
    },
  };

  const inventoryExpiryData: Record<'7d' | '14d' | '30d', { label: string; days: number; level: 'Critical' | 'High' | 'Medium'; type: 'vegan' | 'vegetarian' | 'non-vegetarian' }[]> = {
    '7d': [
      { label: 'Fresh greens', days: 1, level: 'Critical', type: 'vegan' },
      { label: 'Chicken stock', days: 2, level: 'High', type: 'non-vegetarian' },
      { label: 'Pasta sheets', days: 4, level: 'Medium', type: 'vegetarian' },
    ],
    '14d': [
      { label: 'Fresh greens', days: 2, level: 'High', type: 'vegan' },
      { label: 'Chicken stock', days: 5, level: 'Medium', type: 'non-vegetarian' },
      { label: 'Pasta sheets', days: 9, level: 'Medium', type: 'vegetarian' },
    ],
    '30d': [
      { label: 'Frozen veg', days: 12, level: 'Medium', type: 'vegan' },
      { label: 'Chicken stock', days: 10, level: 'Medium', type: 'non-vegetarian' },
      { label: 'Pasta sheets', days: 18, level: 'Medium', type: 'vegetarian' },
    ],
  };

  const productionData: Record<'tomorrow' | '3d' | '7d', {
    id: string;
    dish: string;
    planned: number;
    recommendedMin: number;
    recommendedMax: number;
    confidence: number;
    reason: string;
    details: string;
    type: 'vegan' | 'vegetarian' | 'non-vegetarian';
  }[]> = {
    tomorrow: [
      {
        id: '1',
        dish: 'Pasta Veg',
        planned: 200,
        recommendedMin: 180,
        recommendedMax: 210,
        confidence: 4.5,
        reason: 'High repeat demand at midday',
        details: 'Stable sell-through last 5 services.',
        type: 'vegetarian',
      },
      {
        id: '2',
        dish: 'Chicken Bowl',
        planned: 250,
        recommendedMin: 230,
        recommendedMax: 260,
        confidence: 4.5,
        reason: 'Top seller last week',
        details: 'Strong preorder conversion at 12:00–13:00.',
        type: 'non-vegetarian',
      },
      {
        id: '3',
        dish: 'Soup',
        planned: 120,
        recommendedMin: 90,
        recommendedMax: 110,
        confidence: 3,
        reason: 'Repeated unsold surplus last 3 days',
        details: 'Reduce batch size to align with demand.',
        type: 'vegan',
      },
    ],
    '3d': [
      {
        id: '1',
        dish: 'Pasta Veg',
        planned: 620,
        recommendedMin: 560,
        recommendedMax: 640,
        confidence: 4.5,
        reason: 'Consistent midday demand',
        details: 'Peak load centered around 12:30.',
        type: 'vegetarian',
      },
      {
        id: '2',
        dish: 'Chicken Bowl',
        planned: 710,
        recommendedMin: 680,
        recommendedMax: 740,
        confidence: 4.0,
        reason: 'Strong POS velocity',
        details: 'Maintain allocation for early service windows.',
        type: 'non-vegetarian',
      },
      {
        id: '3',
        dish: 'Soup',
        planned: 310,
        recommendedMin: 280,
        recommendedMax: 320,
        confidence: 3.5,
        reason: 'Slowdown after 13:00',
        details: 'Shift some volume to salad bowls.',
        type: 'vegan',
      },
    ],
    '7d': [
      {
        id: '1',
        dish: 'Pasta Veg',
        planned: 1400,
        recommendedMin: 1320,
        recommendedMax: 1450,
        confidence: 4.0,
        reason: 'High weekly volume',
        details: 'Keep batch size steady for peak windows.',
        type: 'vegetarian',
      },
      {
        id: '2',
        dish: 'Chicken Bowl',
        planned: 1600,
        recommendedMin: 1500,
        recommendedMax: 1680,
        confidence: 4.0,
        reason: 'Consistent sell-through',
        details: 'No stockouts observed this week.',
        type: 'non-vegetarian',
      },
      {
        id: '3',
        dish: 'Soup',
        planned: 720,
        recommendedMin: 650,
        recommendedMax: 760,
        confidence: 3.5,
        reason: 'Overproduction risk persists',
        details: 'Consider smaller batches after 12:45.',
        type: 'vegan',
      },
    ],
  };

  const wasteDashboardData: Record<'today' | '7d' | '30d', {
    percent: number;
    surplusLabel: string;
    riskTitle: string;
    riskAction: string;
    stats: { label: string; value: string }[];
  }> = {
    today: {
      percent: 62,
      surplusLabel: '+5% surplus',
      riskTitle: 'Risk of overproduction in Pasta Veg',
      riskAction: 'Reduce next batch by ~15 portions',
      stats: [
        { label: 'Total waste', value: '75 kg' },
        { label: 'Cost impact', value: formatEuro(1240) },
        { label: 'CO₂e', value: '0.42 t' },
      ],
    },
    '7d': {
      percent: 58,
      surplusLabel: '+3% surplus',
      riskTitle: 'High prep waste in Salad Bowl',
      riskAction: 'Reduce prep by ~10% next service',
      stats: [
        { label: 'Total waste', value: '545 kg' },
        { label: 'Cost impact', value: formatEuro(8920) },
        { label: 'CO₂e', value: '3.10 t' },
      ],
    },
    '30d': {
      percent: 65,
      surplusLabel: '+6% surplus',
      riskTitle: 'Unsold food trending high',
      riskAction: 'Shift production mix toward fast movers',
      stats: [
        { label: 'Total waste', value: '2.02 t' },
        { label: 'Cost impact', value: formatEuro(34250) },
        { label: 'CO₂e', value: '12.8 t' },
      ],
    },
  };

  const currentStockItems: {
    name: string;
    quantity: number;
    unit: string;
    status: 'safe' | 'soon' | 'today';
    type: 'vegan' | 'vegetarian' | 'non-vegetarian';
  }[] = [
    { name: 'Potatoes', quantity: 18, unit: 'kg', status: 'today', type: 'vegan' },
    { name: 'Fresh greens', quantity: 6, unit: 'kg', status: 'today', type: 'vegan' },
    { name: 'Chicken stock', quantity: 12, unit: 'kg', status: 'soon', type: 'non-vegetarian' },
    { name: 'Pasta sheets', quantity: 40, unit: 'portions', status: 'soon', type: 'vegetarian' },
  ];

  const inventoryBySection: { title: string; status: string; items: string[] }[] = [
    {
      title: 'Cold storage',
      status: 'Balanced',
      items: ['Milk', 'Yogurt', 'Cheddar', 'Chicken breast', 'Salmon fillet', 'Butter'],
    },
    {
      title: 'Dry storage',
      status: 'Well stocked',
      items: ['Pasta sheets', 'Rice', 'Lentils', 'Tomato cans', 'Olive oil', 'Spices'],
    },
    {
      title: 'Produce prep',
      status: 'Needs rotation',
      items: ['Potatoes', 'Fresh greens', 'Onions', 'Carrots', 'Bell peppers', 'Mushrooms'],
    },
    {
      title: 'Frozen',
      status: 'Stable',
      items: ['Frozen veg mix', 'Berry blend', 'Frozen fries', 'Ice cream base'],
    },
  ];

  const inventoryByCategory: { title: string; count: string; items: string[] }[] = [
    {
      title: 'Produce',
      count: '18 items',
      items: ['Potatoes', 'Greens', 'Tomatoes', 'Onions', 'Carrots', 'Herbs'],
    },
    {
      title: 'Proteins',
      count: '12 items',
      items: ['Chicken breast', 'Salmon', 'Tofu', 'Eggs', 'Beans', 'Lentils'],
    },
    {
      title: 'Dairy',
      count: '9 items',
      items: ['Milk', 'Yogurt', 'Cheddar', 'Butter', 'Cream'],
    },
    {
      title: 'Staples',
      count: '22 items',
      items: ['Rice', 'Pasta sheets', 'Flour', 'Oil', 'Spices', 'Broth'],
    },
  ];

  const expiryWasteAlerts: { label: string; level: 'soon' | 'today' }[] = [
    { label: 'Potatoes expiring in 1 day', level: 'today' },
    { label: 'Fresh greens expiring in 1 day', level: 'today' },
    { label: 'Chicken stock expiring in 2 days', level: 'soon' },
  ];

  const lowInventoryDishes: {
    dish: string;
    status: 'low' | 'out';
    missing: string[];
    alternatives: string[];
    type: 'vegan' | 'vegetarian' | 'non-vegetarian';
  }[] = [
    {
      dish: 'Chicken Bowl',
      status: 'low',
      missing: ['Chicken stock', 'Herb mix'],
      alternatives: ['Vegetable stock', 'Tofu strips', 'Seasoned chickpeas'],
      type: 'non-vegetarian',
    },
    {
      dish: 'Potato Salad',
      status: 'out',
      missing: ['Fresh greens', 'Dill'],
      alternatives: ['Cabbage slaw base', 'Parsley'],
      type: 'vegan',
    },
    {
      dish: 'Mushroom Risotto',
      status: 'low',
      missing: ['Mushrooms', 'Parmesan'],
      alternatives: ['Zucchini', 'Aged gouda'],
      type: 'vegetarian',
    },
  ];

  const ingredientCoverage = [
    { dish: 'Pasta Veg', coverage: 100, type: 'vegetarian' },
    { dish: 'Chicken Bowl', coverage: 82, type: 'non-vegetarian' },
    { dish: 'Soup', coverage: 74, type: 'vegan' },
    { dish: 'Salad Bowl', coverage: 65, type: 'vegan' },
    { dish: 'Curry Bowl', coverage: 92, type: 'vegetarian' },
  ];

  const stockItemsForKpi = inventoryKpisFoodType === 'all'
    ? currentStockItems
    : currentStockItems.filter((item) => item.type === inventoryKpisFoodType);
  const expiringItemsForKpi = inventoryExpiryData['7d'].filter((item) =>
    inventoryKpisFoodType === 'all' ? true : item.type === inventoryKpisFoodType
  );
  const coverageForKpi = ingredientCoverage.filter((item) =>
    inventoryKpisFoodType === 'all' ? true : item.type === inventoryKpisFoodType
  );
  const coverageAvg = coverageForKpi.length
    ? Math.round(coverageForKpi.reduce((sum, item) => sum + item.coverage, 0) / coverageForKpi.length)
    : 0;
  const inventoryKpis: { label: string; value: string; detail: string; tone: 'safe' | 'watch' | 'risk' }[] = [
    { label: 'Items tracked', value: `${stockItemsForKpi.length}`, detail: 'Filtered by type', tone: 'safe' },
    { label: 'Low stock', value: `${stockItemsForKpi.filter((item) => item.status !== 'safe').length}`, detail: 'Needs action', tone: 'watch' },
    { label: 'Expiring soon', value: `${expiringItemsForKpi.length}`, detail: 'Within 7 days', tone: 'risk' },
    { label: 'Coverage', value: `${coverageAvg}%`, detail: 'Avg. top-5 coverage', tone: 'safe' },
  ];

  const scheduledOrdersByType = {
    all: 640,
    vegan: 180,
    vegetarian: 220,
    'non-vegetarian': 240,
  };
  const historicalBaselineByType = {
    all: 1000,
    vegan: 300,
    vegetarian: 340,
    'non-vegetarian': 360,
  };
  const walkInBufferByType = {
    all: '10–20%',
    vegan: '8–15%',
    vegetarian: '10–18%',
    'non-vegetarian': '12–20%',
  };
  const weekdayTrendByType = {
    all: { direction: 'up', value: 8, label: 'vs last 3 Mondays' },
    vegan: { direction: 'stable', value: 0, label: 'vs last 3 Mondays' },
    vegetarian: { direction: 'up', value: 6, label: 'vs last 3 Mondays' },
    'non-vegetarian': { direction: 'down', value: 5, label: 'vs last 3 Mondays' },
  } as const;
  const wasteTrendByType = {
    all: { direction: 'down', label: 'Improving', detail: 'Waste slowly decreasing → consistent' },
    vegan: { direction: 'stable', label: 'Stable', detail: 'Waste predictable → consistent' },
    vegetarian: { direction: 'down', label: 'Improving', detail: 'Waste stabilizing → consistent' },
    'non-vegetarian': { direction: 'up', label: 'Worsening', detail: 'Waste volatile → unreliable' },
  } as const;
  const recommendedRangeByType = {
    all: '180–210 portions',
    vegan: '60–75 portions',
    vegetarian: '70–85 portions',
    'non-vegetarian': '80–95 portions',
  };
  const netAdjustmentByType = {
    all: { direction: 'down', value: 12 },
    vegan: { direction: 'up', value: 6 },
    vegetarian: { direction: 'down', value: 8 },
    'non-vegetarian': { direction: 'down', value: 10 },
  } as const;

  const scheduledOrders = scheduledOrdersByType[demandAnchorFoodType];
  const historicalBaseline = historicalBaselineByType[demandAnchorFoodType];
  const scheduledOrderRatio = scheduledOrders / historicalBaseline;
  const scheduledOrderRatioPct = Math.round(scheduledOrderRatio * 100);
  const anchorType = scheduledOrderRatio >= 0.6 ? 'Scheduled Orders' : 'Historical Pattern';
  const walkInBufferRange = walkInBufferByType[demandAnchorFoodType];
  const weekdayTrend = weekdayTrendByType[demandAnchorFoodType];
  const wasteTrendConsistency = wasteTrendByType[wasteTrendFoodType];
  const recommendedPrepRange = recommendedRangeByType[recommendedPrepFoodType];
  const netAdjustmentVsPlan = netAdjustmentByType[recommendedPrepFoodType];
  const wasteThresholdKg = 10;
  const wasteFeedbackDishes: {
    dish: string;
    wasteKg: number;
    stockout: boolean;
    adjustmentPct: number;
    type: 'vegan' | 'vegetarian' | 'non-vegetarian';
  }[] = [
    { dish: 'Soup', wasteKg: 12, stockout: false, adjustmentPct: -12, type: 'vegan' },
    { dish: 'Chicken Bowl', wasteKg: 6, stockout: true, adjustmentPct: 8, type: 'non-vegetarian' },
    { dish: 'Pasta Veg', wasteKg: 9, stockout: false, adjustmentPct: -5, type: 'vegetarian' },
  ];

  const posSalesHistory = posSalesHistoryData[posRange];
  const dayOfWeekPatterns = dayOfWeekData;
  const livePreorders = livePreorderData[preorderWindow].filter((row) =>
    preorderSite === 'all' ? true : row.site === preorderSite
  );
  const foodTypeFactorMap = {
    all: 1,
    vegan: 0.35,
    vegetarian: 0.4,
    'non-vegetarian': 0.45,
  };
  const wasteCaptureFactor = foodTypeFactorMap[wasteCaptureFoodType];
  const wasteDetailFactor = foodTypeFactorMap[wasteDetailFoodType];
  const filteredWasteCaptureItems = wasteCaptureData[wasteCaptureRange].map((item) => ({
    ...item,
    valueKg: Math.max(1, Math.round(item.valueKg * wasteCaptureFactor)),
  }));
  const filteredWasteDetailRows = wasteDetailData[wasteDetailRange].rows.map((row) => ({
    ...row,
    valueKg: Math.max(1, Math.round(row.valueKg * wasteDetailFactor)),
  }));
  const filteredWasteDetailTrend = wasteDetailData[wasteDetailRange].weeklyTrend.map((point) => ({
    ...point,
    value: Math.max(1, Math.round(point.value * wasteDetailFactor)),
  }));
  const wasteReflectionValue = Math.max(1, Math.round(32 * wasteCaptureFactor));
  const filteredStockItems = stockFoodType === 'all'
    ? currentStockItems
    : currentStockItems.filter((item) => item.type === stockFoodType);
  const filteredExpiryItems = inventoryExpiryData[inventoryExpiryRange].filter((item) =>
    expiryFoodType === 'all' ? true : item.type === expiryFoodType
  );
  const filteredLowInventoryDishes = lowInventoryFoodType === 'all'
    ? lowInventoryDishes
    : lowInventoryDishes.filter((item) => item.type === lowInventoryFoodType);
  const filteredIngredientCoverage = coverageFoodType === 'all'
    ? ingredientCoverage
    : ingredientCoverage.filter((item) => item.type === coverageFoodType);
  const filteredWasteFeedbackDishes = wasteFeedbackFoodType === 'all'
    ? wasteFeedbackDishes
    : wasteFeedbackDishes.filter((item) => item.type === wasteFeedbackFoodType);
  const lowInventoryKpis: { label: string; value: string; detail: string; tone: 'risk' | 'watch' }[] = [
    {
      label: 'Dishes at risk',
      value: `${filteredLowInventoryDishes.length}`,
      detail: 'Low or out of stock',
      tone: 'risk',
    },
    {
      label: 'Substitutions ready',
      value: `${filteredLowInventoryDishes.reduce((sum, item) => sum + item.alternatives.length, 0)}`,
      detail: 'Approved alternatives',
      tone: 'watch',
    },
  ];
  const topSellerItems = productionData[prepRange]
    .filter((item) => (prepGuidanceFoodType === 'all' ? true : item.type === prepGuidanceFoodType))
    .slice()
    .sort((a, b) => b.planned - a.planned)
    .slice(0, 5);

  const foodTypeOptions: { value: FoodType; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'vegan', label: 'Vegan' },
    { value: 'vegetarian', label: 'Vegetarian' },
    { value: 'non-vegetarian', label: 'Non-Veg' },
  ];

  const renderFoodTypeButtons = (value: FoodType, onChange: (next: FoodType) => void) => (
    <div className="inline-flex items-center gap-1 rounded-full bg-gray-50 border border-gray-200 p-1">
      {foodTypeOptions.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={`text-[10px] font-semibold px-2 py-1 rounded-full transition-colors ${
            value === option.value
              ? 'bg-[#133E28] text-white shadow-sm'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
          aria-pressed={value === option.value}
          type="button"
        >
          {option.label}
        </button>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f1f3f2] pb-10 managr-dashboard">
      <DashboardHeader />

      <main className="w-full px-6">
        <div className="flex flex-wrap items-center justify-center gap-2 mt-6 mb-6">
          {[
            { id: 'demand', label: 'Demand Signals' },
            { id: 'waste', label: 'Waste Capture' },
            { id: 'inventory', label: 'Inventory Awareness' },
            { id: 'output', label: 'Output & Guidance' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'demand' | 'waste' | 'inventory' | 'output')}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                activeTab === tab.id
                  ? 'bg-[#133E28] text-white shadow-sm'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'demand' && (
          <div className="flex flex-col gap-6">
            <div className="min-h-[320px]">
              <DemandForecast foodType={demandFoodType} onFoodTypeChange={setDemandFoodType} />
            </div>

            <div className="bg-[#eef2ff] border border-[#c7d2fe] rounded-xl px-5 py-3 text-sm text-[#1e3a8a] inline-flex items-center gap-2">
              <span aria-hidden className="text-[#4338ca]">💡</span>
              Smart Chef Agent suggests: Rain expected today — lower cold salad demand, higher hot dish preference.
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp size={18} className="text-[#2d5a3f]" />
                    <h3 className="text-sm font-semibold text-gray-800">POS Sales History</h3>
                  </div>
                  <select
                    value={posRange}
                    onChange={(event) => setPosRange(event.target.value as '7d' | '30d' | '90d')}
                    className="text-xs font-semibold text-gray-600 bg-transparent border border-gray-200 rounded-full px-2 py-1"
                  >
                    <option value="7d">Last 7 days</option>
                    <option value="30d">Last 30 days</option>
                    <option value="90d">Last 90 days</option>
                  </select>
                </div>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={posSalesHistory} margin={{ top: 10, right: 12, left: -12, bottom: 0 }}>
                      <XAxis
                        dataKey="label"
                        axisLine={false}
                        tickLine={false}
                        interval={0}
                        tick={{ fontSize: 10, fill: '#9CA3AF' }}
                      />
                      <YAxis hide domain={['dataMin - 200', 'dataMax + 200']} />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#133E28"
                        strokeWidth={2}
                        dot={{ r: 3, fill: '#133E28' }}
                        activeDot={{ r: 4 }}
                      >
                        <LabelList
                          dataKey="value"
                          position="top"
                          offset={6}
                          fontSize={10}
                          fill="#6B7280"
                          formatter={(value: number | string) => formatEuro(value)}
                        />
                      </Line>
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <BarChart3 size={18} className="text-[#2d5a3f]" />
                    <h3 className="text-sm font-semibold text-gray-800">Day-of-Week Patterns</h3>
                  </div>
                </div>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dayOfWeekPatterns} margin={{ top: 10, right: 12, left: -12, bottom: 0 }}>
                      <XAxis
                        dataKey="label"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: '#9CA3AF' }}
                      />
                      <YAxis hide domain={[0, 100]} />
                      <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                        {dayOfWeekPatterns.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                        <LabelList dataKey="value" position="top" fontSize={10} fill="#6B7280" />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <CalendarClock size={18} className="text-[#2d5a3f]" />
                  <h3 className="text-sm font-semibold text-gray-800">Live pre-orders (Student app)</h3>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={preorderWindow}
                    onChange={(event) => setPreorderWindow(event.target.value as '15m' | '60m' | 'today')}
                    className="text-xs font-semibold text-gray-600 bg-transparent border border-gray-200 rounded-full px-2 py-1"
                  >
                    <option value="15m">Last 15 min</option>
                    <option value="60m">Last 60 min</option>
                    <option value="today">Today</option>
                  </select>
                  <select
                    value={preorderSite}
                    onChange={(event) => setPreorderSite(event.target.value as 'all' | 'wilhelm' | 'morgen' | 'prinz')}
                    className="text-xs font-semibold text-gray-600 bg-transparent border border-gray-200 rounded-full px-2 py-1"
                  >
                    <option value="all">All sites</option>
                    <option value="wilhelm">Wilhelmstraße</option>
                    <option value="morgen">Morgenstelle</option>
                    <option value="prinz">Prinz Karl</option>
                  </select>
                </div>
              </div>
              {preorderError && (
                <p className="text-xs text-red-600 mb-3">{preorderError}</p>
              )}
              <div className="space-y-3">
                {livePreorders.map((row) => (
                  <div key={row.label} className="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{row.label}</p>
                      <p className="text-xs text-gray-500">
                        {preorderWindow === '15m' ? 'Last 15 minutes' : preorderWindow === '60m' ? 'Last 60 minutes' : 'Today'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">{row.value}</p>
                      <p className="text-xs text-[#2d5a3f] font-semibold">{row.trend}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'waste' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="flex flex-col gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-gray-800">Waste capture</h3>
                  <div className="flex items-center gap-2">
                    {renderFoodTypeButtons(wasteCaptureFoodType, setWasteCaptureFoodType)}
                    <select
                      value={wasteCaptureRange}
                      onChange={(event) => setWasteCaptureRange(event.target.value as 'yesterday' | '7d' | '30d')}
                      className="text-xs font-semibold text-gray-600 bg-transparent border border-gray-200 rounded-full px-2 py-1"
                    >
                      <option value="yesterday">Yesterday</option>
                      <option value="7d">Last 7 days</option>
                      <option value="30d">Last 30 days</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2 mb-4">
                  <p className="text-xs italic text-[#1e3a8a] bg-[#eef2ff] border border-[#c7d2fe] rounded-lg px-3 py-2 inline-flex items-center gap-2">
                    <span aria-hidden className="text-[#4338ca]">💡</span>
                    Smart Chef Agent suggests: Donation opportunity reduces likely waste.
                  </p>
                  <p className="text-xs text-[#1e3a8a] bg-[#eef2ff] border border-[#c7d2fe] rounded-lg px-3 py-2 inline-flex items-center gap-2">
                    <span aria-hidden className="text-[#4338ca]">💡</span>
                    Smart Chef Agent suggests: Rain forecasted — lower uptake of potato salad.
                  </p>
                </div>
                <WasteSnapshotSmall
                  items={filteredWasteCaptureItems}
                  reflection={{ label: 'Plate waste', valueKg: wasteReflectionValue, deltaPct: -8 }}
                />
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-semibold text-gray-800">Unsold Waste per Dish (Yesterday)</div>
                  <div className="flex items-center gap-2">
                    {renderFoodTypeButtons(wasteFeedbackFoodType, setWasteFeedbackFoodType)}
                    <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-[#eef2ff] text-[#1e3a8a]">
                      Yesterday
                    </span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mb-4">Micro bars show waste vs threshold. Badges reflect triggers and adjustments.</p>
                <div className="space-y-3">
                  {filteredWasteFeedbackDishes.length === 0 ? (
                    <p className="text-xs text-gray-500">No waste signals for the selected food type.</p>
                  ) : (
                    filteredWasteFeedbackDishes.map((item) => {
                    const barWidth = Math.min(100, Math.round((item.wasteKg / wasteThresholdKg) * 100));
                    const aboveThreshold = item.wasteKg > wasteThresholdKg;
                    return (
                      <div key={item.dish} className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-gray-800">{item.dish}</p>
                          <div className="flex items-center gap-2">
                            {item.stockout && (
                              <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-[#fee2e2] text-[#7f1d1d]">
                                ⚠️ Stockout yesterday
                              </span>
                            )}
                            <span
                              className={`text-[10px] font-semibold px-2 py-1 rounded-full ${
                                aboveThreshold
                                  ? 'bg-[#fee2e2] text-[#7f1d1d]'
                                  : 'bg-[#e5f5ec] text-[#1f4f35]'
                              }`}
                            >
                              {aboveThreshold ? 'Above threshold' : 'Within range'}
                            </span>
                            <span
                              className={`text-[10px] font-semibold px-2 py-1 rounded-full ${
                                item.adjustmentPct < 0
                                  ? 'bg-[#fffbeb] text-[#92400e]'
                                  : 'bg-[#e5f5ec] text-[#1f4f35]'
                              }`}
                            >
                              {item.adjustmentPct < 0 ? `↓ ${Math.abs(item.adjustmentPct)}%` : `↑ ${item.adjustmentPct}%`}
                            </span>
                          </div>
                        </div>
                        <div className="mt-3 h-2 rounded-full bg-gray-200 overflow-hidden">
                          <div className="h-2 rounded-full bg-[#2d5a3f]" style={{ width: `${barWidth}%` }} />
                        </div>
                      </div>
                    );
                  })
                  )}
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 flex flex-col gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-gray-800">Waste detail</h3>
                  <div className="flex items-center gap-2">
                    {renderFoodTypeButtons(wasteDetailFoodType, setWasteDetailFoodType)}
                    <select
                      value={wasteDetailRange}
                      onChange={(event) => setWasteDetailRange(event.target.value as 'today' | '7d' | '30d')}
                      className="text-xs font-semibold text-gray-600 bg-transparent border border-gray-200 rounded-full px-2 py-1"
                    >
                      <option value="today">Today</option>
                      <option value="7d">Last 7 days</option>
                      <option value="30d">Last 30 days</option>
                    </select>
                  </div>
                </div>
                <p className="text-xs italic text-[#1e3a8a] bg-[#eef2ff] border border-[#c7d2fe] rounded-lg px-3 py-2 inline-flex items-center gap-2 mb-3">
                  <span aria-hidden className="text-[#4338ca]">💡</span>
                  Smart Chef Agent suggests: Donation opportunity reduces likely waste.
                </p>
                <WasteDetail
                  rows={filteredWasteDetailRows}
                  weeklyTrend={filteredWasteDetailTrend}
                />
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <h3 className="text-sm font-semibold text-gray-800 mb-2">Expiry-based Waste Alert</h3>
                <div className="space-y-2">
                  {expiryWasteAlerts.map((alert) => (
                    <div key={alert.label} className="flex items-center gap-2 text-sm text-gray-700">
                      <span
                        className={`inline-block w-2.5 h-2.5 rounded-full ${
                          alert.level === 'today' ? 'bg-[#ef4444]' : 'bg-[#facc15]'
                        }`}
                      />
                      {alert.label}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-[#1e3a8a] bg-[#eef2ff] border border-[#c7d2fe] rounded-lg px-3 py-2 inline-flex items-center gap-2 mt-4">
                  <span aria-hidden className="text-[#4338ca]">💡</span>
                  Smart Chef Agent suggests: Potatoes are expiring — consider donation today.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'inventory' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 h-full">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <PackageSearch size={18} className="text-[#2d5a3f]" />
                  <h3 className="text-sm font-semibold text-gray-800">Current Stock Levels</h3>
                </div>
                {renderFoodTypeButtons(stockFoodType, setStockFoodType)}
              </div>
              <p className="text-xs italic text-[#1e3a8a] bg-[#eef2ff] border border-[#c7d2fe] rounded-lg px-3 py-2 inline-flex items-center gap-2 mb-4">
                <span aria-hidden className="text-[#4338ca]">💡</span>
                Smart Chef Agent suggests: Two ingredients approaching expiry today.
              </p>
              <div className="space-y-3">
                {filteredStockItems.length === 0 ? (
                  <p className="text-xs text-gray-500">No stock items for the selected food type.</p>
                ) : (
                  filteredStockItems.map((item) => (
                  <div key={item.name} className="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{item.name}</p>
                      <p className="text-xs text-gray-500">
                        {item.quantity} {item.unit} left
                      </p>
                    </div>
                    <span
                      className={`text-[10px] font-semibold px-2 py-1 rounded-full ${
                        item.status === 'today'
                          ? 'bg-[#fee2e2] text-[#7f1d1d]'
                          : item.status === 'soon'
                          ? 'bg-[#fef3c7] text-[#92400e]'
                          : 'bg-[#e5f5ec] text-[#1f4f35]'
                      }`}
                    >
                      {item.status === 'today' ? 'Must act today' : item.status === 'soon' ? 'Expiring soon' : 'Safe'}
                    </span>
                  </div>
                ))
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 h-full">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <PackageSearch size={18} className="text-[#2d5a3f]" />
                  <h3 className="text-sm font-semibold text-gray-800">Ingredient Coverage Ratio (Top 5)</h3>
                </div>
                <div className="flex items-center gap-2">
                  {renderFoodTypeButtons(coverageFoodType, setCoverageFoodType)}
                  <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-[#eef2ff] text-[#1e3a8a]">
                    Feasibility check
                  </span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mb-4">Coverage shows how far we can scale each best-seller based on stock.</p>
              <div className="space-y-3">
                {filteredIngredientCoverage.length === 0 ? (
                  <p className="text-xs text-gray-500">No coverage data for the selected food type.</p>
                ) : (
                  filteredIngredientCoverage.map((item) => (
                  <div key={item.dish} className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-semibold text-gray-800">{item.dish}</p>
                      <span
                        className={`text-[10px] font-semibold px-2 py-1 rounded-full ${
                          item.coverage >= 100
                            ? 'bg-[#e5f5ec] text-[#1f4f35]'
                            : item.coverage >= 80
                            ? 'bg-[#fffbeb] text-[#92400e]'
                            : 'bg-[#fee2e2] text-[#7f1d1d]'
                        }`}
                      >
                        {item.coverage}%
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
                      <div
                        className={`h-2 rounded-full ${
                          item.coverage >= 100
                            ? 'bg-[#22c55e]'
                            : item.coverage >= 80
                            ? 'bg-[#facc15]'
                            : 'bg-[#ef4444]'
                        }`}
                        style={{ width: `${Math.min(item.coverage, 100)}%` }}
                      />
                    </div>
                  </div>
                ))
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 h-full">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <PackageSearch size={18} className="text-[#2d5a3f]" />
                  <h3 className="text-sm font-semibold text-gray-800">Inventory KPIs</h3>
                </div>
                {renderFoodTypeButtons(inventoryKpisFoodType, setInventoryKpisFoodType)}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {inventoryKpis.map((kpi) => (
                  <div
                    key={kpi.label}
                    className={`rounded-xl border px-4 py-3 bg-white ${
                      kpi.tone === 'risk'
                        ? 'border-[#fecaca] bg-[#fff1f2]'
                        : kpi.tone === 'watch'
                        ? 'border-[#fde68a] bg-[#fffbeb]'
                        : 'border-gray-100 bg-[#f8faf9]'
                    }`}
                  >
                    <p className="text-[10px] uppercase tracking-wide text-gray-400">{kpi.label}</p>
                    <p className="text-2xl font-semibold text-gray-800 mt-2">{kpi.value}</p>
                    <p className="text-[10px] text-gray-500 mt-1">{kpi.detail}</p>
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-xl border border-gray-100 bg-[#f8faf9] p-4">
                <div className="text-xs font-semibold text-gray-700 mb-3">By category</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {inventoryByCategory.map((category) => (
                    <div key={category.title} className="rounded-lg border border-gray-100 bg-white px-3 py-2">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-gray-800">{category.title}</p>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                          {category.count}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {category.items.map((item) => (
                          <span
                            key={`${category.title}-${item}`}
                            className="text-[10px] font-semibold px-2 py-1 rounded-full bg-[#e5f5ec] text-[#1f4f35]"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 h-full">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={18} className="text-[#d97706]" />
                  <h3 className="text-sm font-semibold text-gray-800">Low inventory dishes & alternatives</h3>
                </div>
                {renderFoodTypeButtons(lowInventoryFoodType, setLowInventoryFoodType)}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                {lowInventoryKpis.map((kpi) => (
                  <div
                    key={kpi.label}
                    className={`rounded-xl border px-4 py-3 ${
                      kpi.tone === 'risk'
                        ? 'border-[#fecaca] bg-[#fff1f2]'
                        : 'border-[#fde68a] bg-[#fffbeb]'
                    }`}
                  >
                    <p className="text-[10px] uppercase tracking-wide text-gray-400">{kpi.label}</p>
                    <p className="text-2xl font-semibold text-gray-800 mt-2">{kpi.value}</p>
                    <p className="text-[10px] text-gray-500 mt-1">{kpi.detail}</p>
                  </div>
                ))}
              </div>
              <div className="space-y-3">
                {filteredLowInventoryDishes.length === 0 ? (
                  <p className="text-xs text-gray-500">No low-inventory dishes for the selected food type.</p>
                ) : (
                  filteredLowInventoryDishes.map((item) => (
                  <div key={item.dish} className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{item.dish}</p>
                        <p className="text-xs text-gray-500">Missing: {item.missing.join(', ')}</p>
                      </div>
                      <span
                        className={`text-[10px] font-semibold px-2 py-1 rounded-full ${
                          item.status === 'out'
                            ? 'bg-[#fee2e2] text-[#7f1d1d]'
                            : 'bg-[#fef3c7] text-[#92400e]'
                        }`}
                      >
                        {item.status === 'out' ? 'Out of stock' : 'Low stock'}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {item.alternatives.map((alt) => (
                        <span
                          key={`${item.dish}-${alt}`}
                          className="text-[10px] font-semibold px-2 py-1 rounded-full bg-[#eef2ff] text-[#1e3a8a]"
                        >
                          {alt}
                        </span>
                      ))}
                    </div>
                  </div>
                ))
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 h-full lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={18} className="text-[#d97706]" />
                  <h3 className="text-sm font-semibold text-gray-800">What expires</h3>
                </div>
                <div className="flex items-center gap-2">
                  {renderFoodTypeButtons(expiryFoodType, setExpiryFoodType)}
                  <select
                    value={inventoryExpiryRange}
                    onChange={(event) => setInventoryExpiryRange(event.target.value as '7d' | '14d' | '30d')}
                    className="text-xs font-semibold text-gray-600 bg-transparent border border-gray-200 rounded-full px-2 py-1"
                  >
                    <option value="7d">Next 7 days</option>
                    <option value="14d">Next 14 days</option>
                    <option value="30d">Next 30 days</option>
                  </select>
                </div>
              </div>
              <p className="text-xs italic text-[#1e3a8a] bg-[#eef2ff] border border-[#c7d2fe] rounded-lg px-3 py-2 inline-flex items-center gap-2 mb-3">
                <span aria-hidden className="text-[#4338ca]">💡</span>
                Smart Chef Agent suggests: Two ingredients approaching expiry today.
              </p>
              <div className="space-y-3">
                {filteredExpiryItems.length === 0 ? (
                  <p className="text-xs text-gray-500">No expiring items for the selected food type.</p>
                ) : (
                  filteredExpiryItems.map((item) => (
                  <div key={item.label} className="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{item.label}</p>
                      <p className="text-xs text-gray-500">Expires in {item.days} day{item.days > 1 ? 's' : ''}</p>
                    </div>
                    <span
                      className={`text-[10px] font-semibold px-2 py-1 rounded-full ${
                        item.level === 'Critical'
                          ? 'bg-[#fee2e2] text-[#7f1d1d]'
                          : item.level === 'High'
                          ? 'bg-[#fef3c7] text-[#92400e]'
                          : 'bg-[#e0f2fe] text-[#075985]'
                      }`}
                    >
                      {item.level}
                    </span>
                  </div>
                ))
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'output' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            <div className="flex flex-col gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm font-semibold text-gray-800">Demand Anchor KPIs</div>
                  <div className="flex items-center gap-2">
                    {renderFoodTypeButtons(demandAnchorFoodType, setDemandAnchorFoodType)}
                    <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-[#eef2ff] text-[#1e3a8a]">
                      Logic inputs
                    </span>
                  </div>
                </div>

                <div className="mb-4">
                  <span className="inline-flex items-center gap-2 rounded-full bg-[#eef2ff] border border-[#c7d2fe] px-3 py-1 text-xs font-semibold text-[#1e3a8a]">
                    🌧 Rain → hot dishes ↑
                  </span>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                      <span>Scheduled Orders</span>
                      <span>Historical Baseline</span>
                    </div>
                    <div className="relative h-3 rounded-full bg-gray-100">
                      <div
                        className="absolute left-0 top-0 h-3 rounded-full bg-[#2d5a3f]"
                        style={{ width: `${scheduledOrderRatioPct}%` }}
                      />
                      <div
                        className="absolute top-[-6px] h-5 w-0.5 bg-[#facc15]"
                        style={{ left: '60%' }}
                        aria-hidden
                      />
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[10px] text-gray-500">
                      <span>{scheduledOrders} orders ({scheduledOrderRatioPct}%)</span>
                      <span>60% threshold</span>
                      <span>{historicalBaseline} baseline</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="rounded-xl border border-gray-100 bg-[#f8faf9] px-4 py-3">
                      <p className="text-[10px] uppercase tracking-wide text-gray-400">Demand anchor type</p>
                      <span className="inline-flex items-center mt-2 text-xs font-semibold px-3 py-1 rounded-full bg-[#e5f5ec] text-[#1f4f35]">
                        Anchor: {anchorType}
                      </span>
                    </div>
                    <div className="rounded-xl border border-gray-100 bg-[#f8faf9] px-4 py-3">
                      <p className="text-[10px] uppercase tracking-wide text-gray-400">Walk-in buffer</p>
                      <p className="text-sm font-semibold text-gray-800 mt-2">Walk-in buffer: +{walkInBufferRange}</p>
                      <p className="text-[10px] text-gray-500 mt-1">Conservative uplift applied</p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-gray-100 bg-[#f8faf9] px-4 py-3">
                    <p className="text-[10px] uppercase tracking-wide text-gray-400">Weekday demand trend adjustment</p>
                    <div className="mt-2 flex items-center gap-2 text-sm font-semibold">
                      <span
                        className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${
                          weekdayTrend.direction === 'up'
                            ? 'bg-[#e5f5ec] text-[#1f4f35]'
                            : weekdayTrend.direction === 'down'
                            ? 'bg-[#fee2e2] text-[#7f1d1d]'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {weekdayTrend.direction === 'up' ? '↑' : weekdayTrend.direction === 'down' ? '↓' : '→'}
                      </span>
                      <span className="text-gray-800">
                        {weekdayTrend.direction === 'up'
                          ? `+${weekdayTrend.value}%`
                          : weekdayTrend.direction === 'down'
                          ? `−${weekdayTrend.value}%`
                          : '0%'} {weekdayTrend.label}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm font-semibold text-gray-800">Waste Trend Consistency</div>
                  <div className="flex items-center gap-2">
                    {renderFoodTypeButtons(wasteTrendFoodType, setWasteTrendFoodType)}
                    <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-[#eef2ff] text-[#1e3a8a]">
                      Learning stability
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3 mb-3">
                  <span
                    className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold ${
                      wasteTrendConsistency.direction === 'down'
                        ? 'bg-[#e5f5ec] text-[#1f4f35]'
                        : wasteTrendConsistency.direction === 'up'
                        ? 'bg-[#fee2e2] text-[#7f1d1d]'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {wasteTrendConsistency.direction === 'down'
                      ? '↓'
                      : wasteTrendConsistency.direction === 'up'
                      ? '↑'
                      : '→'}
                  </span>
                  <div>
                    <p
                      className={`text-sm font-semibold ${
                        wasteTrendConsistency.direction === 'down'
                          ? 'text-[#1f4f35]'
                          : wasteTrendConsistency.direction === 'up'
                          ? 'text-[#7f1d1d]'
                          : 'text-gray-900'
                      }`}
                    >
                      {wasteTrendConsistency.label}
                    </p>
                    <p className="text-xs text-gray-500">
                      Indicates whether recent waste is predictable enough to trust as a learning signal.
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[10px] font-semibold">
                  <div className="rounded-full bg-[#e5f5ec] text-[#1f4f35] px-3 py-1 flex items-center justify-center gap-1">
                    <span>↓</span>
                    Improving – more stable
                  </div>
                  <div className="rounded-full bg-gray-100 text-gray-600 px-3 py-1 flex items-center justify-center gap-1">
                    <span>→</span>
                    Stable – predictable
                  </div>
                  <div className="rounded-full bg-[#fee2e2] text-[#7f1d1d] px-3 py-1 flex items-center justify-center gap-1">
                    <span>↑</span>
                    Worsening – volatile
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm font-semibold text-gray-800">Recommended Prep Range</div>
                  <div className="flex items-center gap-2">
                    {renderFoodTypeButtons(recommendedPrepFoodType, setRecommendedPrepFoodType)}
                    <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-[#eef2ff] text-[#1e3a8a]">
                      Primary output
                    </span>
                  </div>
                </div>
                <div className="rounded-xl border border-gray-100 bg-[#f8faf9] px-4 py-3">
                  <div className="flex items-center justify-between">
                    <p className="text-2xl font-semibold text-gray-800">{recommendedPrepRange}</p>
                    <span
                      className={`text-xs font-semibold px-2 py-1 rounded-full ${
                        netAdjustmentVsPlan.direction === 'down'
                          ? 'bg-[#fffbeb] text-[#92400e]'
                          : 'bg-[#e5f5ec] text-[#1f4f35]'
                      }`}
                    >
                      {netAdjustmentVsPlan.direction === 'down' ? '↓' : '↑'} {netAdjustmentVsPlan.value}% vs plan
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Shows the safe lower and upper bound for how much to prepare based on demand, waste history, and inventory constraints.
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Gives managers flexibility to decide, instead of enforcing a single number.
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-gray-800">Prep guidance</h3>
                  <div className="flex items-center gap-2">
                    {renderFoodTypeButtons(prepGuidanceFoodType, setPrepGuidanceFoodType)}
                    <select
                      value={prepRange}
                      onChange={(event) => setPrepRange(event.target.value as 'tomorrow' | '3d' | '7d')}
                      className="text-xs font-semibold text-gray-600 bg-transparent border border-gray-200 rounded-full px-2 py-1"
                    >
                      <option value="tomorrow">Tomorrow</option>
                      <option value="3d">Next 3 days</option>
                      <option value="7d">Next 7 days</option>
                    </select>
                  </div>
                </div>
                <div className="mb-4">
                  <h4 className="text-base font-semibold text-gray-800">Top-Seller Focus</h4>
                  <p className="text-xs text-gray-500">Key dishes only, sorted by impact</p>
                </div>
                <ProductionTable items={topSellerItems} embedded />
              </div>
            </div>

            <div className="flex flex-col gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <div className="text-sm font-semibold text-gray-800 mb-4">Exception alerts</div>
                <div className="space-y-3">
                  {[
                    { label: 'Overproduction risk: Pasta Veg', detail: 'Reduce next batch by ~15 portions' },
                    { label: 'Demand spike: Salad Bowl', detail: 'Increase prep by 10% for peak window' },
                    { label: 'Low stock: Soup Base', detail: 'Replenish before 15:00' },
                  ].map((alert) => (
                    <div key={alert.label} className="border border-gray-100 rounded-lg px-3 py-2 bg-gray-50">
                      <p className="text-sm font-semibold text-gray-800">{alert.label}</p>
                      <p className="text-xs text-gray-600">{alert.detail}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <div className="text-sm font-semibold text-gray-800 mb-4">Action plan</div>
                <ul className="space-y-3 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#2d5a3f] mt-1.5" />
                    Shift 20 portions from Pasta Veg to Salad Bowl.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#2d5a3f] mt-1.5" />
                    Hold soup batch #3 until 12:30 confirmation.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#2d5a3f] mt-1.5" />
                    Reduce dessert prep by 10% due to lower forecast.
                  </li>
                </ul>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm font-semibold text-gray-800">Waste dashboard</div>
                  <select
                    value={wasteDashboardRange}
                    onChange={(event) => setWasteDashboardRange(event.target.value as 'today' | '7d' | '30d')}
                    className="text-xs font-semibold text-gray-600 bg-transparent border border-gray-200 rounded-full px-2 py-1"
                  >
                    <option value="today">Today</option>
                    <option value="7d">Last 7 days</option>
                    <option value="30d">Last 30 days</option>
                  </select>
                </div>
                <EfficiencyGauge
                  percent={wasteDashboardData[wasteDashboardRange].percent}
                  surplusLabel={wasteDashboardData[wasteDashboardRange].surplusLabel}
                  riskTitle={wasteDashboardData[wasteDashboardRange].riskTitle}
                  riskAction={wasteDashboardData[wasteDashboardRange].riskAction}
                  stats={wasteDashboardData[wasteDashboardRange].stats}
                  paceStatus={wasteDashboardRange === 'today' ? 'watch' : 'good'}
                  topOverproduced="Soup"
                />
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <div className="text-sm font-semibold text-gray-800 mb-4">Service readiness</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { label: 'Staff ready', value: '92%', tone: 'safe' },
                    { label: 'Stations open', value: '8/9', tone: 'safe' },
                    { label: 'Batch windows', value: '3 active', tone: 'watch' },
                    { label: 'Swaps queued', value: '5 items', tone: 'watch' },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className={`rounded-xl border px-4 py-3 ${
                        item.tone === 'watch'
                          ? 'border-[#fde68a] bg-[#fffbeb]'
                          : 'border-[#e5f5ec] bg-[#f8faf9]'
                      }`}
                    >
                      <p className="text-[10px] uppercase tracking-wide text-gray-400">{item.label}</p>
                      <p className="text-lg font-semibold text-gray-800 mt-2">{item.value}</p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-4">
                  Next checkpoint at 12:15 — confirm hot line staffing and finalize dessert batch.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;