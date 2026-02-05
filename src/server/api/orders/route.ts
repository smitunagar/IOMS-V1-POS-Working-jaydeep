import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database/lib/connection';

// Get orders from localStorage (real orders from POS)
function getOrdersFromStorage(userId: string = 'default_user'): any[] {
  try {
    // This will be handled by the client-side, server returns empty array
    // The actual data will come from the client's localStorage
    return [];
  } catch (error) {
    console.error('Error reading orders from localStorage:', error);
    return [];
  }
}

// Helper function to find inventory item by name (case-insensitive)
function findInventoryItemByName(inventory: any[], searchName: string): any | null {
  return inventory.find(item => 
    item.name.toLowerCase() === searchName.toLowerCase() ||
    item.name.toLowerCase().includes(searchName.toLowerCase()) ||
    searchName.toLowerCase().includes(item.name.toLowerCase())
  ) || null;
}

// Helper function to convert units
function convertUnits(fromAmount: number, fromUnit: string, toUnit: string): number {
  // Normalize units
  const normalizedFromUnit = fromUnit.toLowerCase().trim();
  const normalizedToUnit = toUnit.toLowerCase().trim();

  // If units are the same, no conversion needed
  if (normalizedFromUnit === normalizedToUnit) {
    return fromAmount;
  }

  // Common unit conversions
  const conversions: Record<string, Record<string, number>> = {
    'g': { 'kg': 0.001, 'oz': 0.035274, 'lb': 0.00220462 },
    'kg': { 'g': 1000, 'oz': 35.274, 'lb': 2.20462 },
    'ml': { 'l': 0.001, 'oz': 0.033814, 'cup': 0.00422675 },
    'l': { 'ml': 1000, 'oz': 33.814, 'cup': 4.22675 },
    'oz': { 'g': 28.3495, 'kg': 0.0283495, 'ml': 29.5735, 'l': 0.0295735, 'cup': 0.125 },
    'cup': { 'ml': 236.588, 'l': 0.236588, 'oz': 8 },
    'pcs': { 'piece': 1, 'unit': 1 },
    'piece': { 'pcs': 1, 'unit': 1 },
    'unit': { 'pcs': 1, 'piece': 1 }
  };

  if (conversions[normalizedFromUnit] && conversions[normalizedFromUnit][normalizedToUnit]) {
    return fromAmount * conversions[normalizedFromUnit][normalizedToUnit];
  }

  // If no conversion found, assume 1:1 ratio
  console.warn(`No unit conversion found from ${fromUnit} to ${toUnit}, using 1:1 ratio`);
  return fromAmount;
}

// Helper type guard for IngredientQuantity
function isIngredientQuantity(obj: any): obj is { inventoryItemName: string; quantityPerDish: number; unit: string } {
  return (
    obj && typeof obj === 'object' &&
    typeof obj.inventoryItemName === 'string' &&
    typeof obj.quantityPerDish === 'number' &&
    typeof obj.unit === 'string'
  );
}

/**
 * Update inventory based on order items using the server-side inventory API
 */
function parsePrice(value: any): number {
  if (typeof value === 'number') return value;
  if (typeof value !== 'string') return 0;
  const cleaned = value.replace(/[^\d.,]/g, '').replace(',', '.');
  const parsed = parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    let queryText = `
      SELECT
        id,
        user_id,
        status,
        order_type,
        customer_info,
        subtotal,
        tax_amount,
        total_amount,
        tip_amount,
        amount_paid,
        payment_mode,
        source,
        channel,
        currency,
        table_id,
        cancellation_reason,
        created_at,
        updated_at
      FROM orders
    `;

    const params: any[] = [];
    if (userId) {
      queryText += ` WHERE user_id = $1`;
      params.push(userId);
    }

    queryText += ` ORDER BY created_at DESC`;

    const ordersResult = await query(queryText, params);
    const ordersRows = ordersResult.rows || [];

    const orderIds = ordersRows.map((row: any) => row.id);
    let itemsByOrder: Record<string, any[]> = {};

    if (orderIds.length > 0) {
      const itemsResult = await query(
        `SELECT
          id,
          order_id,
          menu_item_id,
          name,
          quantity,
          unit_price,
          total_price,
          notes,
          selected_size,
          add_ons
        FROM order_items
        WHERE order_id = ANY($1::text[])
        ORDER BY created_at ASC`,
        [orderIds]
      );

      itemsByOrder = itemsResult.rows.reduce((acc: Record<string, any[]>, item: any) => {
        if (!acc[item.order_id]) acc[item.order_id] = [];
        acc[item.order_id].push(item);
        return acc;
      }, {});
    }

    const orders = ordersRows.map((row: any) => {
      const customerInfo = row.customer_info || {};
      const splitMeta = customerInfo.splitMeta || {};
      const items = (itemsByOrder[row.id] || []).map((item: any) => ({
        id: item.id,
        name: item.name,
        quantity: Number(item.quantity) || 0,
        unitPrice: Number(item.unit_price) || 0,
        totalPrice: Number(item.total_price) || 0,
        notes: item.notes || undefined,
        addOns: item.add_ons || [],
        selectedSize: item.selected_size || undefined
      }));

      return {
        id: row.id,
        tableId: row.table_id || undefined,
        customerName: customerInfo.name || undefined,
        customerPhone: customerInfo.phone || undefined,
        items,
        totalAmount: row.total_amount !== null ? Number(row.total_amount) : 0,
        status: row.status,
        orderType: row.order_type,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        paymentMode: row.payment_mode || undefined,
        tipAmount: row.tip_amount !== null ? Number(row.tip_amount) : undefined,
        discountPercentage: customerInfo.discountPercentage || undefined,
        address: customerInfo.address || undefined,
        isSplitBill: splitMeta.isSplitBill || false,
        parentOrderId: splitMeta.parentOrderId || undefined,
        splitNumber: splitMeta.splitNumber || undefined,
        totalSplits: splitMeta.totalSplits || undefined,
        payerName: splitMeta.payerName || undefined,
        splitInto: splitMeta.splitInto || undefined,
        customerInfo
      };
    });

    return NextResponse.json({ orders });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const order = await request.json();
    const userId = order.userId || 'default_user';
    const orderId = order.id || `order_${Date.now()}`;
    const createdAt = order.createdAt ? new Date(order.createdAt) : new Date();

    const totalAmount = parsePrice(order.totalAmount);
    const subtotal = order.subtotal ? parsePrice(order.subtotal) : totalAmount;
    const taxAmount = order.taxAmount ? parsePrice(order.taxAmount) : null;

    const customerInfo = order.customerInfo ? { ...order.customerInfo } : null;
    if (customerInfo && (order.isSplitBill || order.parentOrderId || order.splitNumber || order.totalSplits || order.payerName || order.splitInto)) {
      customerInfo.splitMeta = {
        isSplitBill: order.isSplitBill || false,
        parentOrderId: order.parentOrderId || undefined,
        splitNumber: order.splitNumber || undefined,
        totalSplits: order.totalSplits || undefined,
        payerName: order.payerName || undefined,
        splitInto: order.splitInto || undefined
      };
    }

    await query(
      `INSERT INTO orders (
        id,
        user_id,
        status,
        order_type,
        customer_info,
        subtotal,
        tax_amount,
        total_amount,
        tip_amount,
        amount_paid,
        payment_mode,
        source,
        channel,
        currency,
        table_id,
        created_at,
        updated_at
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17
      ) ON CONFLICT (id) DO NOTHING`,
      [
        orderId,
        userId,
        order.status || 'Order Received',
        order.orderType || 'dine-in',
        customerInfo,
        subtotal,
        taxAmount,
        totalAmount,
        order.tipAmount ?? null,
        order.amountPaid ?? null,
        order.paymentMode || null,
        order.source || null,
        order.channel || null,
        order.currency || null,
        order.tableId || null,
        createdAt,
        new Date()
      ]
    );

    if (Array.isArray(order.items)) {
      for (const item of order.items) {
        const unitPrice = parsePrice(item.unitPrice ?? item.price);
        const quantity = Number(item.quantity) || 0;
        const totalPrice = Number(item.totalPrice) || unitPrice * quantity;

        await query(
          `INSERT INTO order_items (
            order_id,
            menu_item_id,
            name,
            quantity,
            unit_price,
            total_price,
            notes,
            selected_size,
            add_ons
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
          [
            orderId,
            item.menuItemId || item.id || null,
            item.name,
            quantity,
            unitPrice,
            totalPrice,
            item.notes || null,
            item.selectedSize || null,
            item.addOns || []
          ]
        );
      }
    }

    await query(
      `INSERT INTO order_status_history (
        order_id,
        status,
        changed_by,
        reason
      ) VALUES ($1,$2,$3,$4)`,
      [orderId, order.status || 'Order Received', userId, null]
    );

    return NextResponse.json({ order: { id: orderId } }, { status: 201 });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { id, orderId, status, paymentMode, tipAmount, amountPaid, userId, cancellationReason, customerInfo } = await request.json();
    const targetId = id || orderId;

    if (!targetId) {
      return NextResponse.json({ error: 'Order id is required' }, { status: 400 });
    }

    await query(
      `UPDATE orders
       SET status = COALESCE($1, status),
           payment_mode = COALESCE($2, payment_mode),
           tip_amount = COALESCE($3, tip_amount),
           amount_paid = COALESCE($4, amount_paid),
           cancellation_reason = COALESCE($5, cancellation_reason),
           customer_info = COALESCE($6, customer_info),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $7`,
      [status || null, paymentMode || null, tipAmount ?? null, amountPaid ?? null, cancellationReason || null, customerInfo || null, targetId]
    );

    if (status) {
      await query(
        `INSERT INTO order_status_history (
          order_id,
          status,
          changed_by,
          reason
        ) VALUES ($1,$2,$3,$4)`,
        [targetId, status, userId || null, cancellationReason || null]
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Order updated successfully',
      order: { id: targetId, status, paymentMode, tipAmount, amountPaid }
    });
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}