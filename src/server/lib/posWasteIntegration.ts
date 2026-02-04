import { getCompletedOrders, getPendingOrders, Order } from './orderService';
import { getInventory, InventoryItem } from './inventoryService';
import { getDishes } from './menuService';

export interface WasteDataPoint {
  id: string;
  timestamp: string;
  type: 'food_waste' | 'packaging_waste' | 'ingredient_waste';
  itemName: string;
  quantity: number;
  unit: string;
  cost: number;
  reason: 'expired' | 'overproduction' | 'spoiled' | 'damaged' | 'customer_return';
  category: string;
  orderId?: string;
}

export interface POSWasteMetrics {
  todayWaste: number;
  costImpact: number;
  co2Impact: number;
  reductionPercentage: number;
  wasteByCategory: Record<string, number>;
  inventoryStatus: {
    lowStock: InventoryItem[];
    expiring: InventoryItem[];
    overstock: InventoryItem[];
  };
  recentOrders: Order[];
  wasteHistory: WasteDataPoint[];
}

class POSWasteIntegrationService {
  private static instance: POSWasteIntegrationService;
  
  public static getInstance(): POSWasteIntegrationService {
    if (!POSWasteIntegrationService.instance) {
      POSWasteIntegrationService.instance = new POSWasteIntegrationService();
    }
    return POSWasteIntegrationService.instance;
  }

  /**
   * Get comprehensive waste metrics from POS and inventory data
   */
  public async getWasteMetrics(userId: string): Promise<POSWasteMetrics> {
    const [orders, inventory, dishes] = await Promise.all([
      this.getOrderData(userId),
      this.getInventoryData(userId),
      this.getMenuData()
    ]);

    const wasteHistory = this.generateWasteFromOrders(orders, dishes);
    const inventoryStatus = this.analyzeInventoryStatus(inventory);
    
    // Calculate today's waste
    const today = new Date().toDateString();
    const todayWaste = wasteHistory
      .filter(w => new Date(w.timestamp).toDateString() === today)
      .reduce((sum, w) => sum + w.quantity, 0);

    // Calculate cost impact
    const costImpact = wasteHistory
      .filter(w => new Date(w.timestamp).toDateString() === today)
      .reduce((sum, w) => sum + w.cost, 0);

    // Calculate CO2 impact (estimated)
    const co2Impact = todayWaste * 2.5; // Rough estimate: 2.5kg CO2 per kg waste

    // Calculate waste by category
    const wasteByCategory = wasteHistory.reduce((acc, waste) => {
      acc[waste.category] = (acc[waste.category] || 0) + waste.quantity;
      return acc;
    }, {} as Record<string, number>);

    // Calculate reduction percentage (mock calculation)
    const yesterdayWaste = wasteHistory
      .filter(w => {
        const date = new Date(w.timestamp);
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        return date.toDateString() === yesterday.toDateString();
      })
      .reduce((sum, w) => sum + w.quantity, 0);

    const reductionPercentage = yesterdayWaste > 0 
      ? Math.max(0, ((yesterdayWaste - todayWaste) / yesterdayWaste) * 100)
      : 0;

    return {
      todayWaste,
      costImpact,
      co2Impact,
      reductionPercentage,
      wasteByCategory,
      inventoryStatus,
      recentOrders: orders.slice(0, 10),
      wasteHistory: wasteHistory.slice(0, 50)
    };
  }

  /**
   * Get order data from POS system
   */
  private async getOrderData(userId: string): Promise<Order[]> {
    const completed = getCompletedOrders(userId);
    const pending = getPendingOrders(userId);
    return [...completed, ...pending].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  /**
   * Get inventory data
   */
  private async getInventoryData(userId: string): Promise<InventoryItem[]> {
    return getInventory(userId);
  }

  /**
   * Get menu data
   */
  private async getMenuData() {
    return getDishes('default_user'); // Using default user for menu data
  }

  /**
   * Generate waste data from completed orders and inventory
   */
  private generateWasteFromOrders(orders: Order[], dishes: any[]): WasteDataPoint[] {
    const wasteData: WasteDataPoint[] = [];
    
    orders.forEach(order => {
      if (order.status === 'Completed' && order.items) {
        order.items.forEach(item => {
          const dish = dishes.find(d => d.id === item.menuItemId);
          if (dish) {
            // Simulate waste generation based on order patterns
            const wasteQuantity = this.calculateWasteFromOrder(item, dish);
            if (wasteQuantity > 0) {
              wasteData.push({
                id: `waste_${order.id}_${item.menuItemId}_${Date.now()}`,
                timestamp: order.completedAt || order.createdAt,
                type: 'food_waste',
                itemName: dish.name,
                quantity: wasteQuantity,
                unit: 'kg',
                cost: wasteQuantity * (dish.price * 0.3), // 30% of price as cost
                reason: this.determineWasteReason(),
                category: dish.category,
                orderId: order.id
              });
            }
          }
        });
      }
    });

    return wasteData;
  }

  /**
   * Calculate waste quantity from order item
   */
  private calculateWasteFromOrder(orderItem: any, dish: any): number {
    // Simulate waste based on various factors
    const baseWaste = 0.05; // 5% base waste rate
    const quantityFactor = orderItem.quantity * 0.1; // Weight per item
    const randomFactor = Math.random() * 0.02; // Random variation
    
    return Math.round((baseWaste + randomFactor) * quantityFactor * 100) / 100;
  }

  /**
   * Determine waste reason based on patterns
   */
  private determineWasteReason(): WasteDataPoint['reason'] {
    const reasons: WasteDataPoint['reason'][] = [
      'overproduction', 'expired', 'spoiled', 'damaged', 'customer_return'
    ];
    const weights = [0.4, 0.2, 0.2, 0.1, 0.1]; // Weighted probability
    
    const random = Math.random();
    let cumulative = 0;
    
    for (let i = 0; i < reasons.length; i++) {
      cumulative += weights[i];
      if (random <= cumulative) {
        return reasons[i];
      }
    }
    
    return 'overproduction';
  }

  /**
   * Analyze inventory status for waste insights
   */
  private analyzeInventoryStatus(inventory: InventoryItem[]) {
    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    
    const lowStock = inventory.filter(item => 
      item.lowStockThreshold && item.quantity <= item.lowStockThreshold
    );

    const expiring = inventory.filter(item => {
      if (!item.expiryDate) return false;
      const expiryDate = new Date(item.expiryDate);
      return expiryDate <= threeDaysFromNow && expiryDate > now;
    });

    const overstock = inventory.filter(item => 
      item.lowStockThreshold && item.quantity > (item.lowStockThreshold * 5)
    );

    return { lowStock, expiring, overstock };
  }

  /**
   * Record new waste event from POS operations
   */
  public async recordWasteEvent(userId: string, wasteData: Omit<WasteDataPoint, 'id' | 'timestamp'>): Promise<void> {
    const existingWaste = this.getStoredWasteData(userId);
    const newWaste: WasteDataPoint = {
      ...wasteData,
      id: `waste_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString()
    };
    
    existingWaste.push(newWaste);
    
    // Keep only last 100 waste records
    if (existingWaste.length > 100) {
      existingWaste.splice(0, existingWaste.length - 100);
    }
    
    this.storeWasteData(userId, existingWaste);
  }

  /**
   * Get stored waste data from localStorage
   */
  private getStoredWasteData(userId: string): WasteDataPoint[] {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(`waste_data_${userId}`);
    return data ? JSON.parse(data) : [];
  }

  /**
   * Store waste data to localStorage
   */
  private storeWasteData(userId: string, wasteData: WasteDataPoint[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(`waste_data_${userId}`, JSON.stringify(wasteData));
  }

  /**
   * Get real-time inventory alerts for waste prevention
   */
  public getInventoryAlerts(userId: string): {
    type: 'low_stock' | 'expiring' | 'overstock';
    message: string;
    items: InventoryItem[];
    priority: 'high' | 'medium' | 'low';
  }[] {
    const inventory = getInventory(userId);
    const alerts: any[] = [];
    
    // Check for expiring items
    const expiringItems = inventory.filter(item => {
      if (!item.expiryDate) return false;
      const daysUntilExpiry = Math.ceil(
        (new Date(item.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );
      return daysUntilExpiry <= 2 && daysUntilExpiry >= 0;
    });

    if (expiringItems.length > 0) {
      alerts.push({
        type: 'expiring',
        message: `${expiringItems.length} items expiring within 2 days`,
        items: expiringItems,
        priority: 'high'
      });
    }

    // Check for overstock
    const overstockItems = inventory.filter(item => 
      item.lowStockThreshold && item.quantity > (item.lowStockThreshold * 10)
    );

    if (overstockItems.length > 0) {
      alerts.push({
        type: 'overstock',
        message: `${overstockItems.length} items are overstocked`,
        items: overstockItems,
        priority: 'medium'
      });
    }

    return alerts;
  }
}

export default POSWasteIntegrationService;
