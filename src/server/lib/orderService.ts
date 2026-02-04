import { getDishes } from './menuService';
import { getInventory, updateInventoryItem } from './inventoryService';

export interface OccupiedTableInfo {
  orderId: string;
  // Add other relevant fields if needed
}

export function getOccupiedTables(userId: string): Record<string, OccupiedTableInfo> {
  if (typeof window === 'undefined') return {};
  const orders = JSON.parse(localStorage.getItem(`orders_${userId}`) || '[]');
  const occupied: Record<string, OccupiedTableInfo> = {};
  orders.forEach((order: any) => {
    if (order.tableId && order.status !== 'Completed') {
      occupied[order.tableId] = { orderId: order.id };
    }
  });
  return occupied;
}

export interface Order {
  id: string;
  status: string;
  items: any[];
  totalAmount: number;
  createdAt: string;
  completedAt?: string;
  paymentMode?: string;
  tipAmount?: number;
  amountPaid?: number;
  [key: string]: any;
}

export function getCompletedOrders(userId: string): Order[] {
  if (typeof window === 'undefined') return [];
  const orders = JSON.parse(localStorage.getItem(`orders_${userId}`) || '[]');
  return orders.filter((order: any) => order.status === 'Completed');
}

export function getPendingOrders(userId: string): Order[] {
  if (typeof window === 'undefined') return [];
  const orders = JSON.parse(localStorage.getItem(`orders_${userId}`) || '[]');
  return orders.filter((order: any) => order.status === 'Pending');
}

export function updateOrderStatus(userId: string, orderId: string, status: string): void {
  if (typeof window === 'undefined') return;
  const orders = JSON.parse(localStorage.getItem(`orders_${userId}`) || '[]');
  const idx = orders.findIndex((order: any) => order.id === orderId);
  if (idx !== -1) {
    orders[idx].status = status;
    if (status === 'Completed') {
      orders[idx].completedAt = new Date().toISOString();
      // Inventory deduction logic
      const order = orders[idx];
      console.log('[Inventory Deduction] Completing order:', order);
      const dishes = getDishes(userId);
      const inventory = getInventory(userId);
      let lowStockAlerts: string[] = [];
      for (const item of order.items || []) {
        console.log('[Inventory Deduction] Processing order item:', item);
        // Find dish in menu
        const dish = dishes.find((d: any) => d.name === item.name);
        console.log('[Inventory Deduction] Matched dish:', dish);
        if (dish && Array.isArray(dish.ingredients)) {
          for (const ing of dish.ingredients) {
            console.log('[Inventory Deduction] Processing ingredient:', ing);
            let ingName = typeof ing === 'string' ? ing : ing.inventoryItemName;
            let qtyPerDish = typeof ing === 'string' ? 1 : ing.quantityPerDish;
            let unit = typeof ing === 'string' ? '' : ing.unit;
            // Find inventory item
            const invIdx = inventory.findIndex(i => i.name.toLowerCase() === ingName.toLowerCase());
            console.log('[Inventory Deduction] Inventory index:', invIdx, 'for', ingName);
            if (invIdx !== -1) {
              const invItem = inventory[invIdx];
              console.log('[Inventory Deduction] Matched inventory item before deduction:', invItem);
              // Deduct quantity
              invItem.quantity = Math.max(0, (invItem.quantity || 0) - (qtyPerDish * (item.quantity || 1)));
              invItem.quantityUsed = (invItem.quantityUsed || 0) + (qtyPerDish * (item.quantity || 1));
              invItem.totalUsed = (invItem.totalUsed || 0) + (qtyPerDish * (item.quantity || 1));
              console.log('[Inventory Deduction] Deducted', qtyPerDish * (item.quantity || 1), 'from', ingName, 'New stock:', invItem.quantity, 'Stock used:', invItem.quantityUsed, 'Total used:', invItem.totalUsed);
              // Low stock alert
              if (invItem.lowStockThreshold && invItem.quantity <= invItem.lowStockThreshold) {
                lowStockAlerts.push(`Low stock: ${invItem.name} (${invItem.quantity} ${invItem.unit})`);
              }
              // Always use the correct id for update
              updateInventoryItem(userId, { ...invItem, id: inventory[invIdx].id });
              console.log('[Inventory Deduction] Inventory item after update:', getInventory(userId)[invIdx]);
            }
          }
        }
      }
      if (lowStockAlerts.length > 0) {
        alert(lowStockAlerts.join('\n'));
      }
    }
    localStorage.setItem(`orders_${userId}`, JSON.stringify(orders));
  }
}

export function clearOccupiedTable(userId: string, tableId: string): void {
  if (typeof window === 'undefined') return;
  const orders = JSON.parse(localStorage.getItem(`orders_${userId}`) || '[]');
  for (const order of orders) {
    if (order.tableId === tableId && order.status !== 'Completed') {
      order.tableId = undefined;
    }
  }
  localStorage.setItem(`orders_${userId}`, JSON.stringify(orders));
} 