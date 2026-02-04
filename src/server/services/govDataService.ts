import {
  GovWasteEvent,
  GovKPIData,
  GovReportConfig,
  WasteAnalytics,
  PredictiveInsights,
  DashboardKPIs
} from '@/types/gov';

class GovDataService {
  private baseUrl = '/api/gov';

  /**
   * Fetch Government KPI Data
   */
  async getKPIData(): Promise<GovKPIData> {
    try {
      // Mock data implementation with realistic government scenarios
      const mockKPIData: GovKPIData = {
        totalWasteReduction: {
          value: 2847.5,
          unit: 'tons',
          change: 12.3,
          trend: 'up'
        },
        complianceRate: {
          value: 87.3,
          change: 4.2,
          trend: 'up'
        },
        activeInspections: {
          value: 156,
          pending: 23,
          completed: 133
        },
        sdgProgress: {
          sdg12_3: 67.8, // Food waste reduction %
          sdg11: 72.4,   // Sustainable cities %
          sdg13: 69.1    // Climate action %
        },
        regionalMetrics: [
          { region: 'Munich Center', wasteReduction: 23.4, complianceRate: 91.2, businessCount: 342 },
          { region: 'Munich North', wasteReduction: 18.7, complianceRate: 85.6, businessCount: 287 },
          { region: 'Munich South', wasteReduction: 21.3, complianceRate: 88.9, businessCount: 419 },
          { region: 'Munich East', wasteReduction: 19.8, complianceRate: 86.4, businessCount: 298 },
          { region: 'Munich West', wasteReduction: 22.1, complianceRate: 89.7, businessCount: 376 }
        ]
      };

      return mockKPIData;
    } catch (error) {
      console.error('Failed to fetch government KPI data:', error);
      throw new Error('Unable to load government KPI data');
    }
  }

  /**
   * Fetch waste analytics
   */
  async getWasteAnalytics(dateRange: { from: string; to: string }): Promise<WasteAnalytics> {
    try {
      const mockAnalytics: WasteAnalytics = {
        dailyTrends: this.generateDailyTrends(dateRange),
        wasteByCategory: [
          { category: 'Food Waste', amount: 2340.5, percentage: 67.2, color: '#22c55e' },
          { category: 'Packaging', amount: 789.3, percentage: 22.6, color: '#3b82f6' },
          { category: 'Organic', amount: 234.7, percentage: 6.7, color: '#f59e0b' },
          { category: 'Other', amount: 123.1, percentage: 3.5, color: '#64748b' }
        ],
        locationAnalysis: [
          { location: 'Restaurants', amount: 1890.2, percentage: 54.2 },
          { location: 'Hotels', amount: 987.4, percentage: 28.3 },
          { location: 'Cafés', amount: 456.8, percentage: 13.1 },
          { location: 'Catering', amount: 153.2, percentage: 4.4 }
        ],
        complianceMetrics: {
          overallScore: 87.3,
          criticalViolations: 12,
          improvementAreas: ['Food storage', 'Waste separation', 'Documentation']
        },
        costAnalysis: {
          totalWasteCost: 45678.90,
          avgCostPerKg: 3.45,
          monthlySavingsPotential: 8945.67,
          roi: 234.5
        },
        environmentalImpact: {
          co2Impact: 1234.5,
          waterWaste: 5678.9,
          treeEquivalency: 45.7,
          sustainabilityScore: 78.9
        }
      };
      return mockAnalytics;
    } catch (error) {
      console.error('Failed to fetch waste analytics:', error);
      throw new Error('Unable to load waste analytics');
    }
  }

  /**
   * Fetch predictive insights
   */
  async getPredictiveInsights(): Promise<PredictiveInsights> {
    try {
      const mockInsights: PredictiveInsights = {
        wasteForecast: this.generateWasteForecast(),
        seasonalPatterns: [
          { period: 'Winter', wasteLevel: 23.4, confidence: 87.2 },
          { period: 'Spring', wasteLevel: 28.7, confidence: 91.5 },
          { period: 'Summer', wasteLevel: 34.2, confidence: 89.3 },
          { period: 'Fall', wasteLevel: 26.8, confidence: 92.1 }
        ],
        anomalies: [
          {
            date: '2024-01-15',
            severity: 'high',
            description: 'Unusual spike in food waste',
            recommendation: 'Investigate kitchen processes'
          },
          {
            date: '2024-01-12',
            severity: 'medium',
            description: 'Lower than expected packaging waste',
            recommendation: 'Review supplier changes'
          }
        ],
        optimizationOpportunities: [
          {
            category: 'Food preparation',
            potential: 23.4,
            priority: 'high',
            recommendation: 'Implement portion control measures'
          },
          {
            category: 'Storage management',
            potential: 18.7,
            priority: 'medium',
            recommendation: 'Improve FIFO practices'
          }
        ],
        riskAssessment: {
          complianceRisk: 23.4,
          costRisk: 45.7,
          environmentalRisk: 31.2
        }
      };
      return mockInsights;
    } catch (error) {
      console.error('Failed to fetch predictive insights:', error);
      throw new Error('Unable to load predictive insights');
    }
  }

  /**
   * Get Dashboard KPIs
   */
  async getDashboardKPIs(): Promise<DashboardKPIs> {
    try {
      const mockKPIs: DashboardKPIs = {
        totalWasteGenerated: 312.8,
        wasteReductionPercentage: 18.3,
        costSavings: 2847.50,
        complianceScore: 87.3,
        environmentalScore: 82.6,
        today: {
          totalWaste: 45.7,
          totalEvents: 12,
          complianceScore: 87.3,
          co2Impact: 23.4
        },
        thisWeek: {
          totalWaste: 312.8,
          totalEvents: 78,
          avgDailyWaste: 44.7,
          trendDirection: "down" as const
        }
      };
      return mockKPIs;
    } catch (error) {
      console.error('Failed to fetch dashboard KPIs:', error);
      throw new Error('Unable to load dashboard KPIs');
    }
  }

  /**
   * Export report functionality
   */
  async exportReport(config: GovReportConfig): Promise<{ downloadUrl: string; filename: string }> {
    try {
      // Mock export functionality
      const filename = `gov-report-${config.reportType}-${new Date().toISOString().split('T')[0]}.${config.format}`;
      const downloadUrl = `/downloads/${filename}`;

      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 1500));

      return { downloadUrl, filename };
    } catch (error) {
      console.error('Failed to export report:', error);
      throw new Error('Unable to export report');
    }
  }

  /**
   * Generate daily trends data
   */
  private generateDailyTrends(dateRange: { from: string; to: string }) {
    const days = [];
    const start = new Date(dateRange.from);
    const end = new Date(dateRange.to);
    
    while (start <= end) {
      days.push({
        date: start.toISOString().split('T')[0],
        totalWaste: Math.random() * 50 + 20,
        co2Impact: Math.random() * 25 + 10,
        costImpact: Math.random() * 200 + 100,
        logCount: Math.floor(Math.random() * 15 + 5)
      });
      start.setDate(start.getDate() + 1);
    }
    
    return days;
  }

  /**
   * Generate waste forecast data
   */
  private generateWasteForecast() {
    const forecast = [];
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      forecast.push({
        date: date.toISOString().split('T')[0],
        predicted: Math.random() * 40 + 25,
        confidence: Math.random() * 30 + 70,
        actual: i < 7 ? Math.random() * 35 + 20 : undefined
      });
    }
    return forecast;
  }

  /**
   * Get recent activities
   */
  async getRecentActivities(limit: number = 10): Promise<GovWasteEvent[]> {
    try {
      // Mock recent activities
      const activities: GovWasteEvent[] = [];
      
      for (let i = 0; i < limit; i++) {
        const activity: GovWasteEvent = {
          id: `activity-${i + 1}`,
          businessName: `Restaurant ${i + 1}`,
          wasteType: ['food', 'packaging', 'organic'][Math.floor(Math.random() * 3)] as any,
          amount: Math.random() * 50 + 10,
          location: {
            plz: '80331',
            address: `Marienplatz ${i + 1}, Munich`,
            coordinates: [11.5755, 48.1374] as [number, number]
          },
          timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
          status: ['compliant', 'warning', 'violation'][Math.floor(Math.random() * 3)] as any,
          complianceScore: Math.random() * 30 + 70
        };
        activities.push(activity);
      }
      
      return activities;
    } catch (error) {
      console.error('Failed to fetch recent activities:', error);
      throw new Error('Unable to load recent activities');
    }
  }

  /**
   * Log waste event
   */
  async logWasteEvent(event: Omit<GovWasteEvent, 'id' | 'timestamp'>): Promise<GovWasteEvent> {
    try {
      const newEvent: GovWasteEvent = {
        ...event,
        id: `event-${Date.now()}`,
        timestamp: new Date().toISOString()
      };
      
      return newEvent;
    } catch (error) {
      console.error('Failed to log waste event:', error);
      throw new Error('Unable to log waste event');
    }
  }
}

export const govDataService = new GovDataService();
