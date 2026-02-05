// Client-side proxy for order service
// This file provides client-side access to order functionality
// by calling the server-side API endpoints

export interface Order {
  id: string;
  tableId?: string;
  customerName?: string;
  customerPhone?: string;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    unitPrice: string | number;
    totalPrice: string | number;
    notes?: string;
    addOns?: Array<{
      id: string;
      name: string;
      price: number;
      type: 'extra' | 'remove' | 'custom';
    }>;
  }>;
  totalAmount: number;
  status: string;
  orderType: string;
  createdAt: string;
  updatedAt: string;
  paymentMode?: string;
  tipAmount?: number;
  discountPercentage?: number;
  address?: {
    street: string;
    city: string;
    pinCode: string;
  };
}

export async function getPendingOrders(userId: string): Promise<Order[]> {
  try {
    const response = await fetch(`/api/orders?userId=${encodeURIComponent(userId)}`);
    if (!response.ok) {
      throw new Error('Failed to fetch pending orders');
    }
    const data = await response.json();
    return data.orders || [];
  } catch (error) {
    console.error('Error fetching pending orders:', error);
    return [];
  }
}

export async function getCompletedOrders(userId: string): Promise<Order[]> {
  try {
    const response = await fetch(`/api/orders?userId=${encodeURIComponent(userId)}`);
    if (!response.ok) {
      throw new Error('Failed to fetch completed orders');
    }
    const data = await response.json();
    return data.orders || [];
  } catch (error) {
    console.error('Error fetching completed orders:', error);
    return [];
  }
}

export async function updateOrderStatus(orderId: string, status: string, reason?: string): Promise<boolean> {
  try {
    const response = await fetch('/api/orders', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id: orderId, status, cancellationReason: reason }),
    });
    return response.ok;
  } catch (error) {
    console.error('Error updating order status:', error);
    return false;
  }
}

export async function clearOccupiedTable(tableId: string): Promise<boolean> {
  try {
    const response = await fetch('/api/tables', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ tableId, status: 'Available' }),
    });
    return response.ok;
  } catch (error) {
    console.error('Error clearing occupied table:', error);
    return false;
  }
}











