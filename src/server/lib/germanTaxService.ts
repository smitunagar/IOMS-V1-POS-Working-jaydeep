/**
 * German Tax Service for IOMS POS System
 * Implements standard 19% VAT calculation for Food & Beverage industry
 */

export interface TaxableItem {
  id: string;
  name: string;
  price: number;
  category: 'food' | 'beverage';
  isAlcoholic?: boolean;
  isTakeaway?: boolean;
}

export interface TaxCalculation {
  netAmount: number;
  vatAmount: number;
  grossAmount: number;
  vatRate: number;
  vatBreakdown: {
    rate7: {
      net: number;
      vat: number;
    };
    rate19: {
      net: number;
      vat: number;
    };
  };
  totalVat: number;
}

export interface BusinessInfo {
  name: string;
  address: string;
  phone: string;
  email: string;
  vatId: string;
}

export class GermanTaxService {
  // VAT rates for Food & Beverage industry in Germany
  private static readonly STANDARD_VAT_RATE = 19;  // For alcoholic beverages, dine-in meals
  private static readonly REDUCED_VAT_RATE = 7;    // For basic food items, takeaway
  
  // Business information for receipts
  private static readonly BUSINESS_INFO: BusinessInfo = {
    name: "IOMS Restaurant",
    address: "123 Restaurant Street, Berlin, Germany",
    phone: "+49 30 123 456 789",
    email: "info@ioms-restaurant.de",
    vatId: "DE123456789"
  };

  /**
   * Determine the correct VAT rate for an item based on German tax law
   */
  static getVATRate(item: TaxableItem): number {
    // 7% reduced rate applies to:
    // - Basic food items (non-alcoholic)
    // - Takeaway orders
    // - Non-alcoholic beverages
    
    // 19% standard rate applies to:
    // - Alcoholic beverages
    // - Dine-in meals (unless basic food)
    // - Premium food items
    
    if (item.isAlcoholic) {
      return this.STANDARD_VAT_RATE; // 19% for alcoholic beverages
    }
    
    if (item.isTakeaway) {
      return this.REDUCED_VAT_RATE; // 7% for takeaway
    }
    
    if (item.category === 'beverage') {
      return this.REDUCED_VAT_RATE; // 7% for non-alcoholic beverages
    }
    
    // For food items, use 7% as default (basic food items)
    // This can be extended later for premium food classification
    return this.REDUCED_VAT_RATE; // 7% for basic food items
  }

  /**
   * Calculate German VAT for a single item
   */
  static calculateItemVAT(item: TaxableItem): TaxCalculation {
    const netAmount = item.price;
    const vatRate = this.getVATRate(item);
    const vatAmount = (netAmount * vatRate) / 100;
    const grossAmount = netAmount + vatAmount;

    // Initialize breakdown with zeros
    const breakdown = {
      rate7: { net: 0, vat: 0 },
      rate19: { net: 0, vat: 0 }
    };

    // Set the appropriate rate
    if (vatRate === this.REDUCED_VAT_RATE) {
      breakdown.rate7 = { net: netAmount, vat: vatAmount };
    } else {
      breakdown.rate19 = { net: netAmount, vat: vatAmount };
    }

    return {
      netAmount,
      vatAmount,
      grossAmount,
      vatRate,
      vatBreakdown: breakdown,
      totalVat: vatAmount
    };
  }

  /**
   * Calculate German VAT for multiple items (order)
   */
  static calculateOrderVAT(items: TaxableItem[]): TaxCalculation {
    let totalNetAmount = 0;
    let totalVatAmount = 0;
    let rate7Net = 0;
    let rate7Vat = 0;
    let rate19Net = 0;
    let rate19Vat = 0;

    // Calculate VAT for each item
    items.forEach(item => {
      const itemTax = this.calculateItemVAT(item);
      totalNetAmount += itemTax.netAmount;
      totalVatAmount += itemTax.vatAmount;
      
      // Accumulate by rate
      if (itemTax.vatRate === this.REDUCED_VAT_RATE) {
        rate7Net += itemTax.vatBreakdown.rate7.net;
        rate7Vat += itemTax.vatBreakdown.rate7.vat;
      } else {
        rate19Net += itemTax.vatBreakdown.rate19.net;
        rate19Vat += itemTax.vatBreakdown.rate19.vat;
      }
    });

    const totalGrossAmount = totalNetAmount + totalVatAmount;

    return {
      netAmount: totalNetAmount,
      vatAmount: totalVatAmount,
      grossAmount: totalGrossAmount,
      vatRate: totalVatAmount > 0 ? (totalVatAmount / totalNetAmount) * 100 : 0, // Average rate
      vatBreakdown: {
        rate7: {
          net: rate7Net,
          vat: rate7Vat
        },
        rate19: {
          net: rate19Net,
          vat: rate19Vat
        }
      },
      totalVat: totalVatAmount
    };
  }

  /**
   * Calculate VAT for order items with quantities (excluding tips)
   */
  static calculateOrderVATWithQuantities(orderItems: Array<{
    item: TaxableItem;
    quantity: number;
  }>): TaxCalculation {
    let totalNetAmount = 0;
    let totalVatAmount = 0;
    let rate7Net = 0;
    let rate7Vat = 0;
    let rate19Net = 0;
    let rate19Vat = 0;

    orderItems.forEach(({ item, quantity }) => {
      const itemTax = this.calculateItemVAT(item);
      const itemTotalNet = itemTax.netAmount * quantity;
      const itemTotalVat = itemTax.vatAmount * quantity;
      
      totalNetAmount += itemTotalNet;
      totalVatAmount += itemTotalVat;
      
      // Accumulate by rate
      if (itemTax.vatRate === this.REDUCED_VAT_RATE) {
        rate7Net += itemTotalNet;
        rate7Vat += itemTotalVat;
      } else {
        rate19Net += itemTotalNet;
        rate19Vat += itemTotalVat;
      }
    });

    // Note: Tips are NOT included in VAT calculation
    // They are added separately to the final total
    const totalGrossAmount = totalNetAmount + totalVatAmount;

    return {
      netAmount: totalNetAmount,
      vatAmount: totalVatAmount,
      grossAmount: totalGrossAmount,
      vatRate: totalVatAmount > 0 ? (totalVatAmount / totalNetAmount) * 100 : 0, // Average rate
      vatBreakdown: {
        rate7: {
          net: rate7Net,
          vat: rate7Vat
        },
        rate19: {
          net: rate19Net,
          vat: rate19Vat
        }
      },
      totalVat: totalVatAmount
    };
  }

  /**
   * Calculate final order total including tips (tips are tax-exempt)
   * 
   * German Tax Law: Tips (Trinkgeld) are not subject to VAT
   * - VAT is calculated only on food and beverage items
   * - Tips are added to the VAT-inclusive total as a separate line item
   * - This ensures compliance with German tax regulations
   */
  static calculateFinalOrderTotal(taxCalculation: TaxCalculation, tipAmount: number = 0, discountAmount: number = 0): number {
    // VAT is calculated on items only (excluding tips)
    // Tips are added to the VAT-inclusive total
    const vatInclusiveTotal = taxCalculation.grossAmount;
    const finalTotal = vatInclusiveTotal + tipAmount - discountAmount;
    
    return finalTotal;
  }

  /**
   * Get business information for receipts
   */
  static getBusinessInfo(): BusinessInfo {
    return { ...this.BUSINESS_INFO };
  }

  /**
   * Format VAT rate for display
   */
  static formatVATRate(): string {
    return `${this.STANDARD_VAT_RATE}%`;
  }

  /**
   * Format currency for German locale
   */
  static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  }

  /**
   * Format date for German locale
   */
  static formatDate(date: Date): string {
    return new Intl.DateTimeFormat('de-DE').format(date);
  }

  /**
   * Format time for German locale
   */
  static formatTime(date: Date): string {
    return new Intl.DateTimeFormat('de-DE', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date);
  }

  /**
   * Generate KassenSichV compliant receipt ID
   */
  static generateReceiptId(orderId: string): string {
    const timestamp = Date.now();
    return `BILL-${orderId}-${timestamp}`;
  }

  /**
   * Validate if item requires VAT
   */
  static isVATApplicable(item: TaxableItem): boolean {
    // All food and beverage items in Germany require VAT
    return true;
  }

  /**
   * Get VAT rate for specific item type
   */
  static getVATRateForItem(item: TaxableItem): number {
    return this.getVATRate(item);
  }
}
