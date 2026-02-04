// Government data types
export interface GovWasteEvent {
  id: string;
  businessId?: string;
  businessName?: string;
  wasteType: 'food' | 'packaging' | 'organic' | 'recyclable' | 'hazardous';
  amount: number;
  unit?: 'kg' | 'liters' | 'pieces';
  location: {
    plz: string;
    address: string;
    coordinates: [number, number];
  };
  timestamp: string;
  status?: 'compliant' | 'warning' | 'violation' | 'critical';
  inspectorId?: string;
  complianceScore?: number;
  disposalMethod?: string;
  cost?: number;
  environmentalImpact?: {
    co2Footprint: number;
    landfillDiversion: number;
  };
  complianceStatus?: 'compliant' | 'non-compliant' | 'pending';
  metadata?: {
    notes?: string;
    loggedBy?: string;
    quickLog?: boolean;
    [key: string]: any;
  };
  sdgImpact?: {
    sdg12_3: number; // Food waste reduction impact
    sdg11: number;   // Sustainable cities impact
    sdg13: number;   // Climate action impact
  };
}

// Government KPI data
export interface GovKPIData {
  totalWasteReduction: {
    value: number;
    unit: string;
    change: number;
    trend: 'up' | 'down' | 'stable';
  };
  complianceRate: {
    value: number;
    change: number;
    trend: 'up' | 'down' | 'stable';
  };
  activeInspections: {
    value: number;
    pending: number;
    completed: number;
  };
  sdgProgress: {
    sdg12_3: number; // Food waste reduction %
    sdg11: number;   // Sustainable cities %
    sdg13: number;   // Climate action %
  };
  regionalMetrics: Array<{
    region: string;
    wasteReduction: number;
    complianceRate: number;
    businessCount: number;
  }>;
}

// Waste analytics types
export interface WasteAnalytics {
  dailyTrends: Array<{
    date: string;
    totalWaste: number;
    co2Impact: number;
    costImpact: number;
    logCount: number;
  }>;
  wasteByCategory: Array<{
    category: string;
    amount: number;
    percentage: number;
    color: string;
  }>;
  locationAnalysis: Array<{
    location: string;
    amount: number;
    percentage: number;
  }>;
  complianceMetrics: {
    overallScore: number;
    criticalViolations: number;
    improvementAreas: string[];
  };
  costAnalysis: {
    totalWasteCost: number;
    avgCostPerKg: number;
    monthlySavingsPotential: number;
    roi: number;
  };
  environmentalImpact: {
    co2Impact: number;
    waterWaste: number;
    treeEquivalency: number;
    sustainabilityScore: number;
  };
}

// Predictive analytics types
export interface PredictiveInsights {
  wasteForecast: Array<{
    date: string;
    predicted: number;
    confidence: number;
    actual?: number;
  }>;
  seasonalPatterns: Array<{
    period: string;
    wasteLevel: number;
    confidence: number;
  }>;
  anomalies: Array<{
    date: string;
    severity: 'high' | 'medium' | 'low';
    description: string;
    recommendation: string;
  }>;
  optimizationOpportunities: Array<{
    category: string;
    potential: number;
    priority: 'high' | 'medium' | 'low';
    recommendation: string;
  }>;
  riskAssessment: {
    complianceRisk: number;
    costRisk: number;
    environmentalRisk: number;
  };
}

// Dashboard KPIs
export interface DashboardKPIs {
  totalWasteGenerated: number;
  wasteReductionPercentage: number;
  costSavings: number;
  complianceScore: number;
  environmentalScore: number;
  today: {
    totalWaste: number;
    totalEvents: number;
    complianceScore: number;
    co2Impact: number;
  };
  thisWeek: {
    totalWaste: number;
    totalEvents: number;
    avgDailyWaste: number;
    trendDirection: 'up' | 'down' | 'stable';
  };
}

// Government dashboard state
export interface GovDashboardState {
  kpiData: GovKPIData | null;
  wasteEvents: GovWasteEvent[];
  activeAlerts: any[];
  pendingInspections: any[];
  selectedRegion: string | null;
  dateRange: {
    from: string;
    to: string;
  };
  loading: {
    kpis: boolean;
    events: boolean;
    alerts: boolean;
    inspections: boolean;
  };
}

// Report configuration
export interface GovReportConfig {
  reportType: 'compliance' | 'waste-reduction' | 'sdg-progress';
  dateRange: {
    from: string;
    to: string;
  };
  filters: Record<string, any>;
  format: 'pdf' | 'excel' | 'csv';
  includeCharts: boolean;
  includeRawData: boolean;
}
