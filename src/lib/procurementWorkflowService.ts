// Client-side proxy for procurement workflow service
// This file provides client-side access to procurement functionality
// by calling the server-side API endpoints

export interface QuotationRequest {
  id: string;
  supplierId: string;
  items: Array<{
    name: string;
    quantity: number;
    unit: string;
    specifications?: string;
  }>;
  requestedDate: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface OwnerApproval {
  id: string;
  quotationId: string;
  approved: boolean;
  comments?: string;
  approvedBy: string;
  approvedAt: string;
}

export interface PurchaseOrder {
  id: string;
  quotationId: string;
  supplierId: string;
  items: Array<{
    name: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    totalPrice: number;
  }>;
  totalAmount: number;
  status: 'draft' | 'sent' | 'confirmed' | 'delivered';
  createdAt: string;
  expectedDelivery?: string;
}

export class ProcurementWorkflowService {
  static async createQuotationRequest(request: Omit<QuotationRequest, 'id' | 'status'>): Promise<QuotationRequest | null> {
    try {
      const response = await fetch('/api/procurement/quotation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });
      if (!response.ok) {
        throw new Error('Failed to create quotation request');
      }
      const data = await response.json();
      return data.quotation;
    } catch (error) {
      console.error('Error creating quotation request:', error);
      return null;
    }
  }

  static async getQuotationRequests(): Promise<QuotationRequest[]> {
    try {
      const response = await fetch('/api/procurement/quotation');
      if (!response.ok) {
        throw new Error('Failed to fetch quotation requests');
      }
      const data = await response.json();
      return data.quotations || [];
    } catch (error) {
      console.error('Error fetching quotation requests:', error);
      return [];
    }
  }

  static async approveQuotation(quotationId: string, approval: Omit<OwnerApproval, 'id' | 'quotationId' | 'approvedAt'>): Promise<OwnerApproval | null> {
    try {
      const response = await fetch('/api/procurement/approval', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ quotationId, ...approval }),
      });
      if (!response.ok) {
        throw new Error('Failed to approve quotation');
      }
      const data = await response.json();
      return data.approval;
    } catch (error) {
      console.error('Error approving quotation:', error);
      return null;
    }
  }

  static async createPurchaseOrder(order: Omit<PurchaseOrder, 'id' | 'status' | 'createdAt'>): Promise<PurchaseOrder | null> {
    try {
      const response = await fetch('/api/procurement/purchase-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(order),
      });
      if (!response.ok) {
        throw new Error('Failed to create purchase order');
      }
      const data = await response.json();
      return data.order;
    } catch (error) {
      console.error('Error creating purchase order:', error);
      return null;
    }
  }

  static async getPurchaseOrders(): Promise<PurchaseOrder[]> {
    try {
      const response = await fetch('/api/procurement/purchase-order');
      if (!response.ok) {
        throw new Error('Failed to fetch purchase orders');
      }
      const data = await response.json();
      return data.orders || [];
    } catch (error) {
      console.error('Error fetching purchase orders:', error);
      return [];
    }
  }
}

// Export the service instance for backward compatibility
export const procurementWorkflowService = ProcurementWorkflowService;











