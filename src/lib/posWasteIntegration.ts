// Client-side proxy for POS waste integration service
// This file provides client-side access to POS waste integration functionality
// by calling the server-side API endpoints

export interface WasteData {
  id: string;
  itemName: string;
  quantity: number;
  unit: string;
  wasteType: 'food' | 'packaging' | 'other';
  reason: string;
  timestamp: string;
  cost: number;
  category: string;
}

export interface WasteAnalysis {
  totalWaste: number;
  recentOrders?: Array<unknown>;
  inventoryStatus?: {
    lowStock?: Array<unknown>;
  };
  wasteByCategory: Array<{
    category: string;
    amount: number;
    percentage: number;
    cost: number;
  }>;
  wasteByType: Array<{
    type: string;
    amount: number;
    percentage: number;
    cost: number;
  }>;
  trends: Array<{
    date: string;
    totalWaste: number;
    cost: number;
  }>;
  recommendations: Array<{
    item: string;
    suggestion: string;
    potentialSavings: number;
  }>;
}

class POSWasteIntegrationService {
  async recordWaste(wasteData: Omit<WasteData, 'id' | 'timestamp'>): Promise<WasteData | null> {
    try {
    recentOrders?: Array<Record<string, unknown>>;
    inventoryStatus?: {
      lowStock?: Array<Record<string, unknown>>;
    };
      const response = await fetch('/api/waste/record', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(wasteData),
      });
      if (!response.ok) {
        throw new Error('Failed to record waste');
      }
      const data = await response.json();
      return data.waste;
    } catch (error) {
      console.error('Error recording waste:', error);
      return null;
    }
  }

  async getWasteData(startDate?: string, endDate?: string): Promise<WasteData[]> {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const response = await fetch(`/api/waste/data?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch waste data');
      }
      const data = await response.json();
      return data.wasteData || [];
    } catch (error) {
      console.error('Error fetching waste data:', error);
      return [];
    }
  }

  async getWasteAnalysis(period: 'day' | 'week' | 'month' | 'year' = 'week'): Promise<WasteAnalysis | null> {
    try {
      const response = await fetch(`/api/waste/analysis?period=${period}`);
      if (!response.ok) {
        throw new Error('Failed to fetch waste analysis');
      }
      const data = await response.json();
      return data.analysis;
    } catch (error) {
      console.error('Error fetching waste analysis:', error);
      return null;
    }
  }

  async syncWithInventory(): Promise<boolean> {
    try {
      const response = await fetch('/api/waste/sync-inventory', {
        method: 'POST',
      });
      return response.ok;
    } catch (error) {
      console.error('Error syncing with inventory:', error);
      return false;
    }
  }

  async getWasteReductionRecommendations(): Promise<Array<{
    item: string;
    currentWaste: number;
    recommendation: string;
    potentialSavings: number;
    implementation: string;
  }>> {
    try {
      const response = await fetch('/api/waste/recommendations');
      if (!response.ok) {
        throw new Error('Failed to fetch waste reduction recommendations');
      }
      const data = await response.json();
      return data.recommendations || [];
    } catch (error) {
      console.error('Error fetching waste reduction recommendations:', error);
      return [];
    }
  }

  async updateWasteData(id: string, updates: Partial<WasteData>): Promise<WasteData | null> {
    try {
      const response = await fetch('/api/waste/update', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, ...updates }),
      });
      if (!response.ok) {
        throw new Error('Failed to update waste data');
      }
      const data = await response.json();
      return data.waste;
    } catch (error) {
      console.error('Error updating waste data:', error);
      return null;
    }
  }

  async deleteWasteData(id: string): Promise<boolean> {
    try {
      const response = await fetch('/api/waste/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      });
      return response.ok;
    } catch (error) {
      console.error('Error deleting waste data:', error);
      return false;
    }
  }
}

// Export the service instance
export default new POSWasteIntegrationService();











