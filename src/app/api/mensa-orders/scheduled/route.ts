import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database/lib/connection';
import { publishScheduledOrder } from '@/server/lib/mensaOrdersStream';

type ScheduledOrderPayload = {
  orderId: string;
  studentId?: string;
  studentEmail?: string;
  studentName?: string;
  items: Array<Record<string, any>>;
  totalAmount: number | string;
  scheduledDate: string;
  scheduledTime: string;
  pickupLocation: string;
  status?: string;
  paymentMethod?: string;
  transactionId?: string;
  source?: string;
};

type RateLimitEntry = { count: number; resetAt: number };
const rateLimitStore = new Map<string, RateLimitEntry>();

const ALLOWED_ORIGINS = (process.env.MENSA_ORDERS_ALLOWED_ORIGINS || '').split(',').map((value) => value.trim()).filter(Boolean);
const ALLOWED_IPS = (process.env.MENSA_ORDERS_ALLOWED_IPS || '').split(',').map((value) => value.trim()).filter(Boolean);
const RATE_LIMIT_PER_MIN = Number(process.env.MENSA_ORDERS_RATE_LIMIT_PER_MIN || 120);
const API_KEY_HEADER = (process.env.MENSA_ORDERS_API_KEY_HEADER || 'x-api-key').toLowerCase();
const API_KEY = process.env.MENSA_ORDERS_API_KEY || '';

const parseMoney = (value: any) => {
  if (typeof value === 'number') return value;
  if (typeof value !== 'string') return 0;
    const cleaned = value.replace(/[^-\u007F]/g, '').replace(/[^\d.,-]/g, '').replace(',', '.');
  const parsed = parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
};

const getClientIp = (request: NextRequest) => {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]?.trim() || 'unknown';
  const realIp = request.headers.get('x-real-ip');
  return realIp || 'unknown';
};

const getCorsHeaders = (origin: string | null): Record<string, string> | null => {
  if (!origin) {
    return {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': `${API_KEY_HEADER}, Content-Type`,
    };
  }

  if (ALLOWED_ORIGINS.length === 0 || ALLOWED_ORIGINS.includes('*') || ALLOWED_ORIGINS.includes(origin)) {
    return {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': `${API_KEY_HEADER}, Content-Type`,
      'Access-Control-Allow-Credentials': 'true',
    };
  }

  return null;
};

const enforceRateLimit = (key: string) => {
  const now = Date.now();
  const entry = rateLimitStore.get(key);
  if (!entry || entry.resetAt <= now) {
    rateLimitStore.set(key, { count: 1, resetAt: now + 60_000 });
    return { allowed: true, remaining: RATE_LIMIT_PER_MIN - 1, resetAt: now + 60_000 };
  }

  if (entry.count >= RATE_LIMIT_PER_MIN) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count += 1;
  rateLimitStore.set(key, entry);
  return { allowed: true, remaining: RATE_LIMIT_PER_MIN - entry.count, resetAt: entry.resetAt };
};

const validatePayload = (payload: any): payload is ScheduledOrderPayload => {
  if (!payload || typeof payload !== 'object') return false;
  if (!payload.orderId || typeof payload.orderId !== 'string') return false;
  if (!payload.pickupLocation || typeof payload.pickupLocation !== 'string') return false;
  if (!payload.scheduledDate || typeof payload.scheduledDate !== 'string') return false;
  if (!payload.scheduledTime || typeof payload.scheduledTime !== 'string') return false;
  if (!Array.isArray(payload.items)) return false;
  if (payload.totalAmount === undefined || payload.totalAmount === null) return false;
  return true;
};

export async function OPTIONS(request: NextRequest) {
  const corsHeaders = getCorsHeaders(request.headers.get('origin'));
  if (!corsHeaders) {
    return new NextResponse('Origin not allowed', { status: 403 });
  }
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

// GET /api/mensa-orders/scheduled - Get all scheduled orders
export async function GET(request: NextRequest) {
  try {
    const corsHeaders = getCorsHeaders(request.headers.get('origin')) || {};
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
    const orders = result.rows.map((row: any) => {
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

    return NextResponse.json(
      {
        success: true,
        data: orders,
        count: orders.length,
      },
      { headers: corsHeaders }
    );

  } catch (error: any) {
    const corsHeaders = getCorsHeaders(request.headers.get('origin')) || {};
    console.error('Error fetching scheduled orders:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch scheduled orders',
        message: error.message 
      },
      { status: 500, headers: corsHeaders }
    );
  }
}

// POST /api/mensa-orders/scheduled - Create a scheduled order (student app ingest)
export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);
  if (!corsHeaders) {
    return NextResponse.json({ success: false, error: 'Origin not allowed' }, { status: 403 });
  }

  if (!API_KEY) {
    return NextResponse.json({ success: false, error: 'Server API key not configured' }, { status: 500, headers: corsHeaders });
  }

  const providedKey = request.headers.get(API_KEY_HEADER);
  if (!providedKey || providedKey !== API_KEY) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
  }

  const clientIp = getClientIp(request);
  if (ALLOWED_IPS.length > 0 && !ALLOWED_IPS.includes(clientIp)) {
    return NextResponse.json({ success: false, error: 'IP not allowed' }, { status: 403, headers: corsHeaders });
  }

  const rateLimit = enforceRateLimit(clientIp);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { success: false, error: 'Rate limit exceeded', resetAt: rateLimit.resetAt },
      { status: 429, headers: { ...corsHeaders, 'Retry-After': Math.ceil((rateLimit.resetAt - Date.now()) / 1000).toString() } }
    );
  }

  try {
    const payload = await request.json();
    if (!validatePayload(payload)) {
      return NextResponse.json({ success: false, error: 'Invalid payload' }, { status: 400, headers: corsHeaders });
    }

    const normalizedItems = Array.isArray(payload.items) ? payload.items : [];
    const normalizedTotal = parseMoney(payload.totalAmount);
    const createdAt = new Date();

    const insertQuery = `
      INSERT INTO scheduled_orders (
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
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15
      )
      RETURNING id
    `;

    const result = await query(insertQuery, [
      payload.orderId,
      payload.studentId || null,
      payload.studentEmail || null,
      payload.studentName || null,
      JSON.stringify(normalizedItems),
      normalizedTotal,
      payload.scheduledDate,
      payload.scheduledTime,
      payload.pickupLocation,
      payload.status || 'scheduled',
      payload.paymentMethod || null,
      payload.transactionId || null,
      payload.source || 'student-app',
      createdAt,
      createdAt
    ]);

    const insertedId = result.rows?.[0]?.id?.toString() || null;

    publishScheduledOrder({
      id: insertedId,
      orderId: payload.orderId,
      pickupLocation: payload.pickupLocation,
      scheduledDate: payload.scheduledDate,
      scheduledTime: payload.scheduledTime,
      totalAmount: normalizedTotal,
      items: normalizedItems,
      source: payload.source || 'student-app',
      createdAt: createdAt.toISOString(),
    });

    return NextResponse.json(
      { success: true, id: insertedId, orderId: payload.orderId },
      { status: 201, headers: corsHeaders }
    );
  } catch (error: any) {
    console.error('Error creating scheduled order:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create scheduled order', message: error.message },
      { status: 500, headers: corsHeaders }
    );
  }
}

