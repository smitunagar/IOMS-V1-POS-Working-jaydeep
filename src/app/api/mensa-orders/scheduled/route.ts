import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database/lib/connection';

// GET /api/mensa-orders/scheduled - Get all scheduled orders
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status') || 'all';
    const searchQuery = searchParams.get('search') || '';

    // Build the query
    let queryText = `
      SELECT 
        id,
        order_id,
        student_id,
        student_email,
        student_name,
        items,
        total_amount,
        scheduled_date,
        scheduled_time,
        pickup_location,
        status,
        payment_method,
        transaction_id,
        source,
        created_at,
        updated_at
      FROM scheduled_orders
      WHERE 1=1
    `;

    const queryParams: any[] = [];
    let paramIndex = 1;

    // Apply status filter
    if (statusFilter !== 'all') {
      queryText += ` AND status = $${paramIndex}`;
      queryParams.push(statusFilter);
      paramIndex++;
    }

    // Apply search filter
    if (searchQuery) {
      queryText += ` AND (
        order_id ILIKE $${paramIndex} OR
        student_email ILIKE $${paramIndex} OR
        pickup_location ILIKE $${paramIndex} OR
        items::text ILIKE $${paramIndex}
      )`;
      queryParams.push(`%${searchQuery}%`);
      paramIndex++;
    }

    // Order by scheduled date (most recent first)
    queryText += ` ORDER BY scheduled_date DESC, scheduled_time DESC`;

    const result = await query(queryText, queryParams);

    // Transform the data to match the frontend interface
    const orders = result.rows.map((row) => {
      // Extract item names from JSONB array
      const itemsArray = Array.isArray(row.items) ? row.items : [];
      const itemsCount = itemsArray.length;
      // Extract name from each item - check multiple possible property names
      const itemNames = itemsArray.map((item: any) => {
        // Try different possible property names for the item name
        return item.name || item.item_name || item.itemName || item.title || item.product_name || 'Unknown Item';
      }).join(', ');

      // Format date
      const scheduledDate = row.scheduled_date 
        ? new Date(row.scheduled_date).toISOString().split('T')[0]
        : '';

      // Format time
      const scheduledTime = row.scheduled_time || '';

      // Format total amount with German number format (comma instead of period)
      const totalAmount = row.total_amount 
        ? `€${parseFloat(row.total_amount).toFixed(2).replace('.', ',')}`
        : '€0,00';

      return {
        id: row.id.toString(),
        orderNumber: row.order_id,
        institution: row.pickup_location || 'N/A',
        date: scheduledDate,
        time: scheduledTime,
        status: row.status || 'scheduled',
        items: itemsCount,
        itemNames: itemNames,
        total: totalAmount,
        studentEmail: row.student_email,
        studentId: row.student_id,
        paymentMethod: row.payment_method,
        transactionId: row.transaction_id,
        source: row.source,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    });

    return NextResponse.json({
      success: true,
      data: orders,
      count: orders.length,
    });

  } catch (error: any) {
    console.error('Error fetching scheduled orders:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch scheduled orders',
        message: error.message 
      },
      { status: 500 }
    );
  }
}

