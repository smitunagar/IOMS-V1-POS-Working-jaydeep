import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database/lib/connection';

// PUT /api/mensa-orders/update-status - Update order status
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderNumber, status } = body;

    // Validate input
    if (!orderNumber) {
      return NextResponse.json(
        { success: false, error: 'Order number is required' },
        { status: 400 }
      );
    }

    if (!status) {
      return NextResponse.json(
        { success: false, error: 'Status is required' },
        { status: 400 }
      );
    }

    // Validate status value
    const validStatuses = ['scheduled', 'pending', 'processing', 'completed', 'confirmed', 'ready', 'cancelled'];
    if (!validStatuses.includes(status.toLowerCase())) {
      return NextResponse.json(
        { success: false, error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    // Check if order exists
    const checkQuery = 'SELECT id, order_id, status FROM scheduled_orders WHERE order_id = $1';
    const checkResult = await query(checkQuery, [orderNumber]);

    if (checkResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: `Order with number ${orderNumber} not found` },
        { status: 404 }
      );
    }

    const currentOrder = checkResult.rows[0];
    const oldStatus = currentOrder.status;

    // Update order status
    const updateQuery = `
      UPDATE scheduled_orders 
      SET status = $1, updated_at = CURRENT_TIMESTAMP 
      WHERE order_id = $2 
      RETURNING id, order_id, status, updated_at
    `;
    
    const updateResult = await query(updateQuery, [status.toLowerCase(), orderNumber]);

    if (updateResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Failed to update order status' },
        { status: 500 }
      );
    }

    const updatedOrder = updateResult.rows[0];

    return NextResponse.json({
      success: true,
      message: `Order status updated from "${oldStatus}" to "${updatedOrder.status}"`,
      data: {
        id: updatedOrder.id,
        orderNumber: updatedOrder.order_id,
        oldStatus: oldStatus,
        newStatus: updatedOrder.status,
        updatedAt: updatedOrder.updated_at,
      },
    });

  } catch (error: any) {
    console.error('Error updating order status:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update order status',
        message: error.message,
      },
      { status: 500 }
    );
  }
}




