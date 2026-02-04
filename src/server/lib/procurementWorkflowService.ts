import { z } from 'zod';

// Type definitions
export interface QuotationRequest {
  id: string;
  itemId: string;
  itemName: string;
  quantity: number;
  unit: string;
  requiredDeliveryDate: string;
  specifications: string;
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
  budgetLimit?: number;
  preferredVendors: string[];
  requestedBy: string;
  createdAt: string;
  status: 'draft' | 'sent' | 'responses_received' | 'vendor_selected' | 'expired';
  responses: QuotationResponse[];
}

export interface QuotationResponse {
  id: string;
  quotationRequestId: string;
  vendorId: string;
  vendorName: string;
  unitPrice: number;
  totalPrice: number;
  currency: string;
  deliveryTime: string;
  paymentTerms: string;
  validUntil: string;
  notes?: string;
  attachments?: string[];
  receivedAt: string;
  qualityScore: number;
  reliabilityScore: number;
}

export interface OwnerApproval {
  id: string;
  quotationRequestId: string;
  selectedQuotationId: string;
  totalAmount: number;
  justification: string;
  requestedBy: string;
  requestedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface PurchaseOrder {
  id: string;
  orderNumber: string;
  quotationRequestId: string;
  vendorId: string;
  vendorName: string;
  items: PurchaseOrderItem[];
  subtotal: number;
  tax: number;
  totalAmount: number;
  paymentTerms: string;
  deliveryAddress: string;
  expectedDeliveryDate: string;
  specialInstructions?: string;
  status: 'draft' | 'sent' | 'acknowledged' | 'in_progress' | 'delivered' | 'cancelled';
  createdBy: string;
  createdAt: string;
  approvedBy?: string;
  sentAt?: string;
  trackingInfo?: TrackingInfo;
}

export interface PurchaseOrderItem {
  id: string;
  itemName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  specifications?: string;
}

export interface TrackingInfo {
  trackingNumber?: string;
  carrier?: string;
  estimatedDeliveryDate?: string;
  currentStatus: string;
  lastUpdated: string;
  deliveryNotes?: string;
}

interface WorkflowSettings {
  baseThresholdDays: number;
  autoQuotationThreshold: number;
  ownerApprovalThreshold: number;
  autoApprovalLimit: number;
  quotationValidityDays: number;
  emailSettings: {
    ownerEmail: string;
    procurementEmail: string;
    enabled: boolean;
    emailTemplates: {
      quotationRequest: string;
      ownerApprovalRequest: string;
      purchaseOrderConfirmation: string;
      deliveryReminder: string;
    };
  };
}

// Main service class
export class ProcurementWorkflowService {
  private static instance: ProcurementWorkflowService;
  private quotationRequests: Map<string, QuotationRequest> = new Map();
  private ownerApprovals: Map<string, OwnerApproval> = new Map();
  private purchaseOrders: Map<string, PurchaseOrder> = new Map();
  private workflowSettings!: WorkflowSettings;

  public static getInstance(): ProcurementWorkflowService {
    if (!ProcurementWorkflowService.instance) {
      ProcurementWorkflowService.instance = new ProcurementWorkflowService();
    }
    return ProcurementWorkflowService.instance;
  }

  constructor() {
    this.initializeWorkflowSettings();
    this.setupAutoMonitoring();
  }

  private initializeWorkflowSettings() {
    this.workflowSettings = {
      baseThresholdDays: 15,
      autoQuotationThreshold: 7,
      ownerApprovalThreshold: 500,
      autoApprovalLimit: 200,
      quotationValidityDays: 30,
      emailSettings: {
        ownerEmail: 'owner@restaurant.com',
        procurementEmail: 'procurement@restaurant.com',
        enabled: true,
        emailTemplates: {
          quotationRequest: 'Quotation request template',
          ownerApprovalRequest: 'Owner approval template',
          purchaseOrderConfirmation: 'Purchase order confirmation template',
          deliveryReminder: 'Delivery reminder template'
        }
      }
    };
  }

  private setupAutoMonitoring() {
    // Monitor inventory levels every hour
    setInterval(() => {
      this.checkInventoryThresholds().catch(error => {
        console.error('[Procurement] Error in auto inventory check:', error);
      });
    }, 3600000); // 1 hour

    // Check for overdue approvals every 30 minutes
    setInterval(() => {
      this.checkOverdueApprovals().catch(error => {
        console.error('[Procurement] Error in auto approval check:', error);
      });
    }, 1800000); // 30 minutes
  }

  // AUTOMATIC QUOTATION REQUEST SYSTEM
  public async checkInventoryThresholds() {
    console.log('[Procurement Workflow] Checking inventory thresholds...');
    
    try {
      // Get current inventory levels
      const response = await fetch('/api/inventory/low-stock');
      const result = await response.json();
      
      // Check if the response is successful and has data
      if (!result.success || !result.data || !Array.isArray(result.data.items)) {
        console.warn('[Procurement] Invalid response from low-stock API:', result);
        return;
      }
      
      const lowStockItems = result.data.items;
      
      for (const item of lowStockItems) {
        // Calculate days until stockout (simplified calculation)
        const daysUntilStockout = Math.ceil(item.quantity / 1); // Assuming 1 unit per day usage
        
        if (daysUntilStockout <= this.workflowSettings.autoQuotationThreshold) {
          await this.autoGenerateQuotationRequest({
            ...item,
            daysUntilStockout
          });
        }
      }
    } catch (error) {
      console.error('[Procurement] Error checking inventory thresholds:', error);
    }
  }

  private async autoGenerateQuotationRequest(alert: any) {
    const existingRequest = Array.from(this.quotationRequests.values())
      .find(req => req.itemId === alert.itemId && req.status !== 'expired');

    if (existingRequest) {
      console.log(`[Procurement] Quotation request already exists for ${alert.itemName}`);
      return;
    }

    const quotationRequest: QuotationRequest = {
      id: `qr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      itemId: alert.itemId,
      itemName: alert.itemName,
      quantity: alert.suggestedQuantity || alert.reorderPoint * 2,
      unit: alert.unit,
      requiredDeliveryDate: this.calculateRequiredDeliveryDate(alert.daysUntilStockout),
      specifications: this.generateSpecifications(alert.itemName),
      urgencyLevel: this.determineUrgencyLevel(alert.daysUntilStockout),
      preferredVendors: this.selectVendorsForQuotation(alert.category),
      requestedBy: 'SupplySync Bot',
      createdAt: new Date().toISOString(),
      status: 'draft',
      responses: []
    };

    this.quotationRequests.set(quotationRequest.id, quotationRequest);
    
    // Send quotation requests to vendors
    await this.sendQuotationToVendors(quotationRequest);

    console.log(`[Procurement] Auto-generated quotation request for ${alert.itemName} (${quotationRequest.id})`);
    return quotationRequest;
  }

  // VENDOR QUOTATION MANAGEMENT
  private async sendQuotationToVendors(quotationRequest: QuotationRequest): Promise<boolean> {
    try {
      for (const vendorId of quotationRequest.preferredVendors) {
        await this.sendVendorQuotationEmail(quotationRequest, vendorId);
      }
      
      quotationRequest.status = 'sent';
      this.quotationRequests.set(quotationRequest.id, quotationRequest);
      
      return true;
    } catch (error) {
      console.error('[Procurement] Failed to send quotation requests:', error);
      return false;
    }
  }

  public async addQuotationResponse(response: Omit<QuotationResponse, 'id' | 'receivedAt'>): Promise<QuotationResponse> {
    const quotationResponse: QuotationResponse = {
      ...response,
      id: `qr_response_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      receivedAt: new Date().toISOString()
    };

    const quotationRequest = this.quotationRequests.get(response.quotationRequestId);
    if (quotationRequest) {
      quotationRequest.responses.push(quotationResponse);
      quotationRequest.status = 'responses_received';
      this.quotationRequests.set(quotationRequest.id, quotationRequest);
    }

    return quotationResponse;
  }

  // OWNER APPROVAL WORKFLOW
  public async requestOwnerApproval(quotationRequestId: string, selectedQuotationId: string): Promise<OwnerApproval | null> {
    const quotationRequest = this.quotationRequests.get(quotationRequestId);
    const selectedQuotation = quotationRequest?.responses.find(r => r.id === selectedQuotationId);

    if (!quotationRequest || !selectedQuotation) {
      console.error('[Procurement] Invalid quotation request or response ID');
      return null;
    }

    // Auto-approve if under threshold
    if (selectedQuotation.totalPrice <= this.workflowSettings.autoApprovalLimit) {
      const autoApproval: OwnerApproval = {
        id: `approval_auto_${Date.now()}`,
        quotationRequestId,
        selectedQuotationId,
        totalAmount: selectedQuotation.totalPrice,
        justification: 'Auto-approved under threshold limit',
        requestedBy: 'SupplySync Bot',
        requestedAt: new Date().toISOString(),
        status: 'approved',
        approvedBy: 'System Auto-Approval',
        approvedAt: new Date().toISOString(),
        urgencyLevel: quotationRequest.urgencyLevel
      };

      this.ownerApprovals.set(autoApproval.id, autoApproval);
      
      // Generate purchase order immediately
      await this.generatePurchaseOrder(autoApproval);
      
      return autoApproval;
    }

    // Request manual approval
    const ownerApproval: OwnerApproval = {
      id: `approval_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      quotationRequestId,
      selectedQuotationId,
      totalAmount: selectedQuotation.totalPrice,
      justification: `Best quote from ${selectedQuotation.vendorName} for ${quotationRequest.itemName}`,
      requestedBy: 'SupplySync Bot',
      requestedAt: new Date().toISOString(),
      status: 'pending',
      urgencyLevel: quotationRequest.urgencyLevel
    };

    this.ownerApprovals.set(ownerApproval.id, ownerApproval);
    
    // Send approval request email
    await this.sendOwnerApprovalEmail(ownerApproval);

    return ownerApproval;
  }

  public async approveOwnerApproval(approvalId: string, approvedBy: string): Promise<boolean> {
    const approval = this.ownerApprovals.get(approvalId);
    if (!approval) return false;

    approval.status = 'approved';
    approval.approvedBy = approvedBy;
    approval.approvedAt = new Date().toISOString();
    
    this.ownerApprovals.set(approvalId, approval);
    
    // Generate purchase order
    await this.generatePurchaseOrder(approval);
    
    return true;
  }

  // PURCHASE ORDER GENERATION
  private async generatePurchaseOrder(approval: OwnerApproval): Promise<PurchaseOrder | null> {
    try {
      const quotationRequest = this.quotationRequests.get(approval.quotationRequestId);
      const selectedQuotation = quotationRequest?.responses.find(r => r.id === approval.selectedQuotationId);

      if (!quotationRequest || !selectedQuotation) {
        console.error('[Procurement] Cannot find quotation data for purchase order');
        return null;
      }

      const orderNumber = `PO-${new Date().getFullYear()}-${String(this.purchaseOrders.size + 1).padStart(4, '0')}`;

      const purchaseOrder: PurchaseOrder = {
        id: `po_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        orderNumber,
        quotationRequestId: quotationRequest.id,
        vendorId: selectedQuotation.vendorId,
        vendorName: selectedQuotation.vendorName,
        items: [{
          id: `poi_${Date.now()}`,
          itemName: quotationRequest.itemName,
          quantity: quotationRequest.quantity,
          unit: quotationRequest.unit,
          unitPrice: selectedQuotation.unitPrice,
          totalPrice: selectedQuotation.totalPrice,
          specifications: quotationRequest.specifications
        }],
        subtotal: selectedQuotation.totalPrice,
        tax: selectedQuotation.totalPrice * 0.19,
        totalAmount: selectedQuotation.totalPrice * 1.19,
        paymentTerms: selectedQuotation.paymentTerms,
        deliveryAddress: 'Restaurant Address, City, Country',
        expectedDeliveryDate: this.calculateExpectedDeliveryDate(selectedQuotation.deliveryTime),
        specialInstructions: this.generateDeliveryInstructions(quotationRequest.urgencyLevel),
        status: 'draft',
        createdBy: 'SupplySync Bot',
        createdAt: new Date().toISOString(),
        approvedBy: approval.approvedBy || 'System'
      };

      this.purchaseOrders.set(purchaseOrder.id, purchaseOrder);
      
      // Send PO to vendor
      await this.sendPurchaseOrderToVendor(purchaseOrder);

      console.log(`[Procurement] Purchase Order ${orderNumber} generated for ${quotationRequest.itemName}`);
      return purchaseOrder;
    } catch (error) {
      console.error('[Procurement] Failed to generate purchase order:', error);
      return null;
    }
  }

  // EMAIL NOTIFICATION SYSTEM
  private async sendVendorQuotationEmail(quotationRequest: QuotationRequest, vendorId: string): Promise<boolean> {
    console.log(`[Email] Quotation request sent to vendor ${vendorId} for ${quotationRequest.itemName}`);
    return true;
  }

  private async sendOwnerApprovalEmail(approval: OwnerApproval): Promise<boolean> {
    console.log(`[Email] Owner approval request sent for ${approval.totalAmount} EUR`);
    return true;
  }

  private async sendPurchaseOrderToVendor(purchaseOrder: PurchaseOrder): Promise<boolean> {
    console.log(`[Email] Purchase order ${purchaseOrder.orderNumber} sent to ${purchaseOrder.vendorName}`);
    purchaseOrder.status = 'sent';
    purchaseOrder.sentAt = new Date().toISOString();
    this.purchaseOrders.set(purchaseOrder.id, purchaseOrder);
    return true;
  }

  // UTILITY METHODS
  private determineUrgencyLevel(daysUntilStockout: number): 'low' | 'medium' | 'high' | 'critical' {
    if (daysUntilStockout <= 1) return 'critical';
    if (daysUntilStockout <= 3) return 'high';
    if (daysUntilStockout <= 7) return 'medium';
    return 'low';
  }

  private selectVendorsForQuotation(category: string): string[] {
    const vendorCategories: { [key: string]: string[] } = {
      'meat': ['vendor_002', 'vendor_001'],
      'vegetables': ['vendor_001', 'vendor_002'],
      'spices': ['vendor_004', 'vendor_003'],
      'dairy': ['vendor_001', 'vendor_003']
    };
    return vendorCategories[category?.toLowerCase()] || ['vendor_001', 'vendor_002'];
  }

  private calculateRequiredDeliveryDate(daysUntilStockout: number): string {
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + Math.max(1, Math.floor(daysUntilStockout * 0.8)));
    return deliveryDate.toISOString();
  }

  private calculateExpectedDeliveryDate(deliveryTime: string): string {
    const days = deliveryTime.includes('same day') ? 0 :
                deliveryTime.includes('1-2 days') ? 2 :
                deliveryTime.includes('2-3 days') ? 3 : 5;
    
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + days);
    return deliveryDate.toISOString();
  }

  private generateSpecifications(itemName: string): string {
    const specifications: { [key: string]: string } = {
      'Chicken Breast': 'Fresh, Grade A, hormone-free, vacuum packed',
      'Fresh Tomatoes': 'Vine-ripened, Grade 1, medium size',
      'Olive Oil': 'Extra virgin, first cold press, 1L bottles',
    };
    return specifications[itemName] || 'Standard quality, fresh delivery required';
  }

  private generateDeliveryInstructions(urgencyLevel: string): string {
    const instructions = {
      'critical': 'URGENT DELIVERY REQUIRED - Contact immediately upon arrival',
      'high': 'High priority delivery - Morning delivery preferred',
      'medium': 'Standard delivery during business hours',
      'low': 'Flexible delivery time'
    };
    return instructions[urgencyLevel as keyof typeof instructions] || instructions.medium;
  }

  private async checkOverdueApprovals() {
    const overdueThreshold = 24 * 60 * 60 * 1000; // 24 hours
    const now = new Date().getTime();

    for (const approval of this.ownerApprovals.values()) {
      if (approval.status === 'pending') {
        const requestTime = new Date(approval.requestedAt).getTime();
        if (now - requestTime > overdueThreshold) {
          console.log(`[Procurement] Overdue approval reminder for ${approval.id}`);
          // Send reminder email
        }
      }
    }
  }

  // PUBLIC GETTER METHODS
  public getAllQuotationRequests(): QuotationRequest[] {
    return Array.from(this.quotationRequests.values());
  }

  public getQuotationRequest(id: string): QuotationRequest | undefined {
    return this.quotationRequests.get(id);
  }

  public getAllOwnerApprovals(): OwnerApproval[] {
    return Array.from(this.ownerApprovals.values());
  }

  public getAllPurchaseOrders(): PurchaseOrder[] {
    return Array.from(this.purchaseOrders.values());
  }

  public getPendingApprovals(): OwnerApproval[] {
    return Array.from(this.ownerApprovals.values()).filter(a => a.status === 'pending');
  }

  public getWorkflowSettings(): WorkflowSettings {
    return { ...this.workflowSettings };
  }

  public updateWorkflowSettings(newSettings: Partial<WorkflowSettings>): void {
    this.workflowSettings = { ...this.workflowSettings, ...newSettings };
  }
}

// Export the singleton instance
export const procurementWorkflowService = ProcurementWorkflowService.getInstance();
