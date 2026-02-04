// Client-side proxy for cross-module integration service
// This file provides client-side access to cross-module functionality
// by calling the server-side API endpoints

export interface SmartProcurementRecommendation {
  id: string;
  itemName: string;
  currentStock: number;
  recommendedQuantity: number;
  reason: string;
  priority: 'high' | 'medium' | 'low';
  estimatedCost: number;
  supplier?: string;
  category: string;
}

export class CrossModuleIntegration {
  static async getSmartProcurementRecommendations(): Promise<SmartProcurementRecommendation[]> {
    try {
      const response = await fetch('/api/integration/procurement-recommendations');
      if (!response.ok) {
        throw new Error('Failed to fetch smart procurement recommendations');
      }
      const data = await response.json();
      return data.recommendations || [];
    } catch (error) {
      console.error('Error fetching smart procurement recommendations:', error);
      return [];
    }
  }

  static async getInventoryWasteAnalysis(): Promise<{
    totalWaste: number;
    wasteByCategory: Array<{
      category: string;
      amount: number;
      percentage: number;
    }>;
    recommendations: Array<{
      item: string;
      suggestion: string;
      potentialSavings: number;
    }>;
  } | null> {
    try {
      const response = await fetch('/api/integration/waste-analysis');
      if (!response.ok) {
        throw new Error('Failed to fetch inventory waste analysis');
      }
      const data = await response.json();
      return data.analysis;
    } catch (error) {
      console.error('Error fetching inventory waste analysis:', error);
      return null;
    }
  }

  static async getSupplyChainOptimization(): Promise<{
    optimizedOrders: Array<{
      supplier: string;
      items: Array<{
        name: string;
        quantity: number;
        unitPrice: number;
        totalPrice: number;
      }>;
      totalAmount: number;
      deliveryTime: number;
      reliability: number;
    }>;
    potentialSavings: number;
    recommendations: string[];
  } | null> {
    try {
      const response = await fetch('/api/integration/supply-chain-optimization');
      if (!response.ok) {
        throw new Error('Failed to fetch supply chain optimization');
      }
      const data = await response.json();
      return data.optimization;
    } catch (error) {
      console.error('Error fetching supply chain optimization:', error);
      return null;
    }
  }

  static async syncInventoryWithPOS(): Promise<boolean> {
    try {
      const response = await fetch('/api/integration/sync-inventory', {
        method: 'POST',
      });
      return response.ok;
    } catch (error) {
      console.error('Error syncing inventory with POS:', error);
      return false;
    }
  }

  static async syncWasteDataWithInventory(): Promise<boolean> {
    try {
      const response = await fetch('/api/integration/sync-waste', {
        method: 'POST',
      });
      return response.ok;
    } catch (error) {
      console.error('Error syncing waste data with inventory:', error);
      return false;
    }
  }
}

// Export the service instance for backward compatibility
export const crossModuleIntegration = CrossModuleIntegration;











