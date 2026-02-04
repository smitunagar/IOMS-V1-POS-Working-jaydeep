// WasteWatchDog Types
export interface WasteData {
  totalWaste: number;
  reduction: number;
  savings: number;
  carbonFootprint: number;
  todaysWaste: number;
  weeklyTrend: number[];
  wasteCategories: {
    food: number;
    packaging: number;
    other: number;
  };
  recentScans: Array<{
    id: string;
    item: string;
    weight: number;
    category: string;
    timestamp: string;
    status: 'valid' | 'expired' | 'warning';
  }>;
  hardwareStatus: {
    scanner: 'online' | 'offline' | 'maintenance';
    scale: 'online' | 'offline' | 'maintenance';
    camera: 'online' | 'offline' | 'maintenance';
    lastSync: string;
  };
}

export interface WasteEvent {
  id: string;
  businessId: string;
  item: string;
  category: 'food' | 'packaging' | 'other';
  weight: number;
  timestamp: string;
  status: 'valid' | 'expired' | 'warning';
  scanMethod: 'qr' | 'camera' | 'manual';
  location?: string;
  cost?: number;
  carbonImpact?: number;
}

export interface HardwareStatus {
  scanner: 'online' | 'offline' | 'maintenance';
  scale: 'online' | 'offline' | 'maintenance';
  camera: 'online' | 'offline' | 'maintenance';
  lastSync: string;
  errors?: string[];
}

export interface WasteAnalytics {
  dailyWaste: number;
  weeklyWaste: number;
  monthlyWaste: number;
  wasteReduction: number;
  costSavings: number;
  carbonReduction: number;
  trends: {
    daily: number[];
    weekly: number[];
    monthly: number[];
  };
  categories: {
    food: number;
    packaging: number;
    other: number;
  };
  predictions: {
    nextWeek: number;
    nextMonth: number;
    confidence: number;
  };
}

export interface ScanRequest {
  method: 'qr' | 'camera' | 'manual';
  data: {
    qrCode?: string;
    imageBase64?: string;
    manualEntry?: {
      item: string;
      weight: number;
      category: string;
    };
  };
}

export interface ScanResult {
  success: boolean;
  item?: {
    name: string;
    category: string;
    weight: number;
    expirationDate?: string;
    status: 'valid' | 'expired' | 'warning';
  };
  confidence?: number;
  message: string;
}

export interface WasteReport {
  id: string;
  type: 'daily' | 'weekly' | 'monthly';
  dateRange: {
    from: string;
    to: string;
  };
  summary: {
    totalWaste: number;
    reduction: number;
    savings: number;
    carbonImpact: number;
  };
  breakdown: {
    byCategory: Record<string, number>;
    byDay: Array<{ date: string; amount: number }>;
    byLocation?: Record<string, number>;
  };
  insights: string[];
  recommendations: string[];
  generatedAt: string;
}

export interface ComplianceMetric {
  metric: string;
  score: number;
  status: 'compliant' | 'warning' | 'violation';
  details: string;
  recommendations?: string[];
}

export interface WasteTarget {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  status: 'on-track' | 'at-risk' | 'behind';
  progress: number;
}

export interface WastePrediction {
  date: string;
  predicted: number;
  confidence: number;
  factors: string[];
}

export interface WasteInsight {
  type: 'trend' | 'anomaly' | 'opportunity' | 'recommendation';
  severity: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  actionItems?: string[];
  impact?: {
    cost?: number;
    waste?: number;
    carbon?: number;
  };
}
